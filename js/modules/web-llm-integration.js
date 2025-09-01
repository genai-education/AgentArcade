/**
 * Web-LLM Integration Module
 * Handles client-side AI model loading and inference
 */

class WebLLMIntegration {
  constructor() {
    this.engine = null;
    this.currentModel = null;
    this.isInitialized = false;
    this.isProcessing = false;
    
    // Supported models with hardware requirements
    this.supportedModels = [
      {
        id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
        name: 'Llama 3.2 1B (Lightweight)',
        size: '1.1GB',
        vramRequired: 1129,
        description: 'Fast and efficient for basic tasks'
      },
      {
        id: 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
        name: 'Llama 3.2 3B (Recommended)',
        size: '2.9GB',
        vramRequired: 2952,
        description: 'Balanced performance and capability'
      },
      {
        id: 'DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC',
        name: 'DeepSeek R1 7B (Performance)',
        size: '5.1GB',
        vramRequired: 5107,
        description: 'High performance for complex reasoning'
      }
    ];
    
    this.capabilities = null;
    this.progressCallback = null;
  }

  async initialize(options = {}) {
    try {
      this.progressCallback = options.progressCallback;
      
      // Check if Web-LLM is available
      if (!this.isWebLLMAvailable()) {
        throw new Error('Web-LLM is not available. Please ensure you have a compatible browser with WebGPU support.');
      }
      
      // Assess hardware capabilities
      this.updateProgress(10, 'Assessing hardware capabilities...');
      this.capabilities = await this.assessHardwareCapabilities();
      
      // Select optimal model
      this.updateProgress(20, 'Selecting optimal AI model...');
      const optimalModel = this.selectOptimalModel(this.capabilities);
      
      // Load the model
      this.updateProgress(30, `Loading ${optimalModel.name}...`);
      await this.loadModel(optimalModel.id);
      
      this.isInitialized = true;
      this.updateProgress(100, 'AI model ready!');
      
      console.log(`🤖 Web-LLM initialized with ${optimalModel.name}`);
      
    } catch (error) {
      console.error('Failed to initialize Web-LLM:', error);
      throw error;
    }
  }

  isWebLLMAvailable() {
    // Check for WebGPU support
    if (!navigator.gpu) {
      console.warn('WebGPU not supported');
      return false;
    }
    
    // Check for required APIs
    if (!window.Worker || !window.WebAssembly) {
      console.warn('Required APIs not available');
      return false;
    }
    
    return true;
  }

  async assessHardwareCapabilities() {
    const capabilities = {
      hasWebGPU: !!navigator.gpu,
      estimatedVRAM: 0,
      deviceType: 'unknown',
      performance: 'low'
    };
    
    try {
      if (navigator.gpu) {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          // Estimate VRAM based on adapter info
          const info = await adapter.requestAdapterInfo?.() || {};
          
          // Rough VRAM estimation based on device type
          if (info.device?.includes('RTX') || info.device?.includes('GTX')) {
            capabilities.estimatedVRAM = 8000; // Assume dedicated GPU
            capabilities.deviceType = 'dedicated';
            capabilities.performance = 'high';
          } else if (info.device?.includes('Intel') || info.device?.includes('AMD')) {
            capabilities.estimatedVRAM = 4000; // Integrated graphics
            capabilities.deviceType = 'integrated';
            capabilities.performance = 'medium';
          } else {
            capabilities.estimatedVRAM = 2000; // Conservative estimate
            capabilities.deviceType = 'unknown';
            capabilities.performance = 'low';
          }
        }
      }
      
      // Additional capability detection (optional, not all browsers expose performance.memory)
      const memoryInfo = (performance && performance.memory) ? performance.memory : null;
      if (memoryInfo) {
        capabilities.totalMemory = memoryInfo.totalJSHeapSize;
        capabilities.usedMemory = memoryInfo.usedJSHeapSize;
      }
      
    } catch (error) {
      console.warn('Could not assess hardware capabilities:', error);
    }
    
    return capabilities;
  }

  selectOptimalModel(capabilities) {
    // Select model based on estimated VRAM
    if (capabilities.estimatedVRAM >= 5000) {
      return this.supportedModels[2]; // DeepSeek 7B
    } else if (capabilities.estimatedVRAM >= 3000) {
      return this.supportedModels[1]; // Llama 3B (Recommended)
    } else {
      return this.supportedModels[0]; // Llama 1B (Lightweight)
    }
  }

  async loadModel(modelId) {
    try {
      // Dynamic import of Web-LLM
      const webllm = await this.importWebLLM();
      
      // Create engine with progress callback
      this.engine = await webllm.CreateMLCEngine(modelId, {
        initProgressCallback: (progress) => {
          const percentage = 30 + (progress.progress || 0) * 0.7; // 30-100%
          this.updateProgress(percentage, progress.text || 'Loading model...');
        },
        logLevel: "INFO"
      }, {
        context_window_size: 4096,
        temperature: 0.1,
        max_tokens: 2048
      });
      
      this.currentModel = this.supportedModels.find(m => m.id === modelId);
      
    } catch (error) {
      console.error('Failed to load model:', error);
      throw new Error(`Failed to load AI model: ${error.message}`);
    }
  }

  async importWebLLM() {
    try {
      // Try to import from CDN
      const webllm = await import('https://esm.run/@mlc-ai/web-llm');
      return webllm;
    } catch (error) {
      console.error('Failed to import Web-LLM:', error);
      throw new Error('Failed to load Web-LLM library. Please check your internet connection.');
    }
  }

  async processAgentDecision(context, agentConfig) {
    if (!this.isInitialized || !this.engine) {
      throw new Error('Web-LLM not initialized');
    }
    
    if (this.isProcessing) {
      throw new Error('Another request is already being processed');
    }
    
    try {
      this.isProcessing = true;
      
      const prompt = this.buildAgentPrompt(context, agentConfig);
      const systemPrompt = this.getAgentSystemPrompt(agentConfig);
      
      const response = await this.engine.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: agentConfig.temperature || 0.1,
        max_tokens: agentConfig.maxTokens || 1024
      });
      
      return this.parseAgentResponse(response);
      
    } catch (error) {
      console.error('Failed to process agent decision:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  buildAgentPrompt(context, agentConfig) {
    const prompt = {
      scenario: context.scenario,
      objective: context.objective,
      availableActions: context.availableActions,
      currentState: context.currentState,
      constraints: context.constraints,
      agentRole: agentConfig.role || 'assistant',
      agentGoals: agentConfig.goals || []
    };
    
    return `
Context: ${JSON.stringify(prompt, null, 2)}

Please analyze the current situation and provide your decision in the following JSON format:
{
  "reasoning": "Your step-by-step reasoning process",
  "action": "The action you choose to take",
  "parameters": {},
  "confidence": 0.85,
  "nextSteps": ["anticipated next actions"]
}

Ensure your response is valid JSON and considers the agent's role and goals.
    `.trim();
  }

  getAgentSystemPrompt(agentConfig) {
    const basePrompt = `You are an AI agent in the Agent Arcades platform. Your responses must always be valid JSON objects.`;
    
    const rolePrompts = {
      analyzer: "You excel at analyzing data, identifying patterns, and providing insights.",
      planner: "You specialize in creating detailed plans, breaking down complex tasks, and organizing workflows.",
      critic: "You provide constructive criticism, identify potential issues, and suggest improvements.",
      executor: "You focus on taking action, implementing solutions, and getting things done efficiently.",
      coordinator: "You excel at managing multiple tasks, coordinating between different agents, and maintaining organization."
    };
    
    const rolePrompt = rolePrompts[agentConfig.role] || rolePrompts.analyzer;
    
    return `${basePrompt}\n\n${rolePrompt}\n\nAlways respond with valid JSON containing your reasoning, chosen action, parameters, confidence level, and anticipated next steps.`;
  }

  parseAgentResponse(response) {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from model');
      }
      
      // Try to parse JSON response
      const parsed = JSON.parse(content);
      
      // Validate required fields
      if (!parsed.reasoning || !parsed.action) {
        throw new Error('Invalid response format: missing required fields');
      }
      
      return {
        reasoning: parsed.reasoning,
        action: parsed.action,
        parameters: parsed.parameters || {},
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        nextSteps: parsed.nextSteps || [],
        rawResponse: content
      };
      
    } catch (error) {
      console.error('Failed to parse agent response:', error);
      
      // Fallback response
      return {
        reasoning: "Failed to parse model response",
        action: "error",
        parameters: { error: error.message },
        confidence: 0,
        nextSteps: [],
        rawResponse: response.choices[0]?.message?.content || ''
      };
    }
  }

  async generateText(prompt, options = {}) {
    if (!this.isInitialized || !this.engine) {
      throw new Error('Web-LLM not initialized');
    }
    
    try {
      const response = await this.engine.chat.completions.create({
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 512
      });
      
      return response.choices[0]?.message?.content || '';
      
    } catch (error) {
      console.error('Failed to generate text:', error);
      throw error;
    }
  }

  getCurrentModelName() {
    return this.currentModel?.name || 'Unknown Model';
  }

  getCurrentModelInfo() {
    return this.currentModel;
  }

  getCapabilities() {
    return this.capabilities;
  }

  isReady() {
    return this.isInitialized && this.engine !== null;
  }

  isModelProcessing() {
    return this.isProcessing;
  }

  updateProgress(percentage, text) {
    if (this.progressCallback) {
      this.progressCallback({
        progress: percentage,
        text: text
      });
    }
  }

  async cleanup() {
    try {
      if (this.engine) {
        // Cleanup engine resources if available
        if (typeof this.engine.dispose === 'function') {
          await this.engine.dispose();
        }
        this.engine = null;
      }
      
      this.isInitialized = false;
      this.currentModel = null;
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export { WebLLMIntegration };
