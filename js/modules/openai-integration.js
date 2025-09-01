/**
// NOTE: This module requires that CSP allow https://api.openai.com under connect-src.

 * OpenAI API Integration Module
 * Provides cloud-based AI capabilities as an alternative to local Web-LLM models
 */

export class OpenAIIntegration {
  constructor() {
    this.apiKey = null;
    this.baseURL = 'https://api.openai.com/v1';
    this.currentModel = 'gpt-5';
    this.isInitialized = false;
    this.rateLimitInfo = {
      requestsRemaining: null,
      tokensRemaining: null,
      resetTime: null
    };

    // Available models with their capabilities
    this.availableModels = {
      'gpt-5': {
        name: 'GPT-5',
        description: 'Latest generation model with advanced reasoning and longer context',
        contextWindow: 200000,
        maxTokens: 4096,
        costPer1kTokens: { input: 0.01, output: 0.03 }
      },
      'gpt-5-turbo': {
        name: 'GPT-5 Turbo',
        description: 'High‑throughput GPT‑5 variant optimized for speed and cost',
        contextWindow: 200000,
        maxTokens: 4096,
        costPer1kTokens: { input: 0.006, output: 0.018 }
      },
      'gpt-4': {
        name: 'GPT-4',
        description: 'Most capable model, best for complex reasoning',
        maxTokens: 8192,
        costPer1kTokens: { input: 0.03, output: 0.06 }
      },
      'gpt-4-turbo': {
        name: 'GPT-4 Turbo',
        description: 'Faster and more cost-effective than GPT-4',
        maxTokens: 128000,
        costPer1kTokens: { input: 0.01, output: 0.03 }
      },
      'gpt-4o': {
        name: 'GPT-4o',
        description: 'Optimized for speed and efficiency',
        maxTokens: 128000,
        costPer1kTokens: { input: 0.005, output: 0.015 }
      },
      'gpt-3.5-turbo': {
        name: 'GPT-3.5 Turbo',
        description: 'Fast and cost-effective for simpler tasks',
        maxTokens: 16384,
        costPer1kTokens: { input: 0.001, output: 0.002 }
      }
    };
  }

  async initialize(options = {}) {
    console.log('🔗 Initializing OpenAI API integration...');

    try {
      // Load stored API key and settings
      await this.loadSettings();

      if (!this.apiKey) {
        console.warn('⚠️ No OpenAI API key configured');
        return false;
      }

      // Test API connection
      const isValid = await this.testConnection();
      if (!isValid) {
        console.error('❌ OpenAI API key validation failed');
        return false;
      }

      // Validate selected model availability and gracefully fall back if needed
      try {
        await this.validateSelectedModelAvailability();
      } catch (_) {}

      this.isInitialized = true;
      console.log(`✅ OpenAI API initialized with model: ${this.currentModel}`);

      if (options.progressCallback) {
        options.progressCallback({
          progress: 100,
          text: `OpenAI API ready (${this.availableModels[this.currentModel].name})`
        });
      }

      return true;

    } catch (error) {
      console.error('❌ OpenAI API initialization failed:', error);
      throw new Error(`OpenAI API initialization failed: ${error.message}`);
    }
  }

  async loadSettings() {
    try {
      const settings = localStorage.getItem('agentArcades_openai_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.apiKey = parsed.apiKey;
        this.currentModel = parsed.model || 'gpt-5';
      }
    } catch (error) {
      console.warn('Failed to load OpenAI settings:', error);
    }
  }

  async saveSettings() {
    try {
      const settings = {
        apiKey: this.apiKey,
        model: this.currentModel,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('agentArcades_openai_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save OpenAI settings:', error);
    }
  }

  setApiKey(apiKey) {
    if (!apiKey || !apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format');
    }
    this.apiKey = apiKey;
    this.saveSettings();
  }

  setModel(modelId) {
    if (!this.availableModels[modelId]) {
      console.warn(`Unsupported model requested: ${modelId}. Falling back to GPT-5 then GPT-4.`);
      this.currentModel = this.availableModels['gpt-5'] ? 'gpt-5' : 'gpt-4';
  async validateSelectedModelAvailability() {
    // Try to verify the current model exists; if not, pick the first available of our known list
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      if (!response.ok) return; // silent skip
      const data = await response.json();
      const ids = new Set((data.data || []).map(m => m.id));
      if (!ids.has(this.currentModel)) {
        // Prefer GPT‑5, then GPT‑5 Turbo, then GPT‑4 Turbo, then GPT‑4, else fallback to first
        const preference = ['gpt-5', 'gpt-5-turbo', 'gpt-4-turbo', 'gpt-4'];
        const fallback = preference.find(id => ids.has(id) && this.availableModels[id]) ||
                         Object.keys(this.availableModels).find(id => ids.has(id)) ||
                         this.currentModel;
        if (fallback !== this.currentModel) {
          console.warn(`Model ${this.currentModel} not available; using ${fallback}`);
          this.currentModel = fallback;
          await this.saveSettings();
        }
      }
    } catch (_) {
      // If listing fails, keep currentModel as is
    }
  }

    } else {
      this.currentModel = modelId;
    }
    this.saveSettings();
  }

  getCurrentModelName() {
    return this.availableModels[this.currentModel]?.name || this.currentModel;
  }

  getAvailableModels() {
    return this.availableModels;
  }

  async testConnection() {
    if (!this.apiKey) return false;
    return this.testConnectionWithKey(this.apiKey);
  }

  async testConnectionWithKey(tempKey) {
    if (!tempKey) return false;
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tempKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ OpenAI API connection successful. Available models: ${data.data?.length ?? 'unknown'}`);
        return true;

      } else {
        // Try to read error JSON safely
        let errorMsg = `${response.status} ${response.statusText}`;
        try {
          const err = await response.json();
          errorMsg = err.error?.message || errorMsg;
        } catch {}
        console.warn('❌ OpenAI API test failed:', errorMsg);
        return false;
      }
    } catch (error) {
      console.warn('❌ OpenAI API connection test failed:', error?.message || String(error));
      return false;
    }
  }

  async generateResponse(prompt, options = {}) {
    if (!this.isInitialized || !this.apiKey) {
      throw new Error('OpenAI API not initialized or no API key configured');
    }

    const requestOptions = {
      model: this.currentModel,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.min(options.maxTokens || 1000, this.availableModels[this.currentModel]?.maxTokens || 1000),
      temperature: options.temperature || 0.7,
      top_p: options.topP || 1,
      frequency_penalty: options.frequencyPenalty || 0,
      presence_penalty: options.presencePenalty || 0,
      ...options.additionalParams
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestOptions)
      });

      // Update rate limit info from headers
      this.updateRateLimitInfo(response.headers);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      return {
        response: data.choices[0]?.message?.content || '',
        model: data.model,
        usage: data.usage,
        confidence: this.calculateConfidence(data),
        rateLimitInfo: this.rateLimitInfo
      };

    } catch (error) {
      console.error('❌ OpenAI API request failed:', error);
      throw error;
    }
  }

  updateRateLimitInfo(headers) {
    this.rateLimitInfo = {
      requestsRemaining: headers.get('x-ratelimit-remaining-requests'),
      tokensRemaining: headers.get('x-ratelimit-remaining-tokens'),
      resetTime: headers.get('x-ratelimit-reset-requests')
    };
  }

  calculateConfidence(data) {
    // Simple confidence calculation based on response characteristics
    const choice = data.choices[0];
    if (!choice) return 0.5;

    // Higher confidence for longer, more detailed responses
    const responseLength = choice.message?.content?.length || 0;
    const lengthScore = Math.min(responseLength / 500, 1);

    // Consider finish reason
    const finishReasonScore = choice.finish_reason === 'stop' ? 1 : 0.7;

    return (lengthScore * 0.3 + finishReasonScore * 0.7);
  }

  async generateMultipleResponses(prompt, count = 3, options = {}) {
    const responses = [];

    for (let i = 0; i < count; i++) {
      try {
        const response = await this.generateResponse(prompt, {
          ...options,
          temperature: (options.temperature || 0.7) + (i * 0.1) // Vary temperature for diversity
        });
        responses.push(response);
      } catch (error) {
        console.warn(`Failed to generate response ${i + 1}:`, error);
      }
    }

    return responses;
  }

  async streamResponse(prompt, options = {}, onChunk = null) {
    if (!this.isInitialized || !this.apiKey) {
      throw new Error('OpenAI API not initialized or no API key configured');
    }

    const requestOptions = {
      model: this.currentModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: Math.min(options.maxTokens || 1000, this.availableModels[this.currentModel]?.maxTokens || 1000),
      temperature: options.temperature || 0.7,
      stream: true,
      ...options.additionalParams
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestOptions)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {


            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                if (onChunk) onChunk(content, fullResponse);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

      return {
        response: fullResponse,
        model: this.currentModel,
        confidence: 0.8 // Default confidence for streaming
      };

    } catch (error) {
      console.error('❌ OpenAI streaming request failed:', error);
      throw error;
    }
  }

  // Compatible API with WebLLMIntegration for agent decisions
  async processAgentDecision(context, agentConfig) {
    const systemPrompt = this.getAgentSystemPrompt(agentConfig);
    const prompt = this.buildAgentPrompt(context, agentConfig);
    const maxAllowed = this.availableModels[this.currentModel]?.maxTokens || 1024;
    const result = await this.generateResponse(`${systemPrompt}\n\n${prompt}`, {
      temperature: agentConfig?.temperature || 0.1,
      maxTokens: Math.min(agentConfig?.maxTokens || 1024, maxAllowed),
      additionalParams: { response_format: { type: 'json_object' } }
    });

    try {
      const parsed = JSON.parse(result.response);
      return {
        reasoning: parsed.reasoning || 'N/A',
        action: parsed.action || 'respond',
        parameters: parsed.parameters || {},
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
        nextSteps: parsed.nextSteps || [],
        rawResponse: result.response
      };
    } catch (e) {
      return {
        reasoning: result.response.slice(0, 200),
        action: 'respond',
        parameters: { text: result.response },
        confidence: 0.5,
        nextSteps: [],
        rawResponse: result.response
      };
    }
  }

  getAgentSystemPrompt(agentConfig) {
    return 'You are an AI agent operating within Agent Arcades. Return a JSON object with fields: reasoning, action, parameters, confidence, nextSteps.';
  }

  buildAgentPrompt(context, agentConfig) {
    return `Context: ${JSON.stringify(context)}\nAgent config: ${JSON.stringify(agentConfig)}\nDecide next action.`;
  }


  getRateLimitInfo() {
    return this.rateLimitInfo;
  }

  getUsageEstimate(prompt, maxTokens = 1000) {
    const model = this.availableModels[this.currentModel];
    if (!model) return null;

    // Rough token estimation (1 token ≈ 4 characters)
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = maxTokens;

    const inputCost = (inputTokens / 1000) * model.costPer1kTokens.input;
    const outputCost = (outputTokens / 1000) * model.costPer1kTokens.output;

    return {
      inputTokens,
      outputTokens: maxTokens,
      estimatedCost: inputCost + outputCost,
      model: model.name
    };
  }

  clearApiKey() {
    this.apiKey = null;
    this.isInitialized = false;
    localStorage.removeItem('agentArcades_openai_settings');
  }
}
