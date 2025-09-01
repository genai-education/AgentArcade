/**
 * Fallback Modules
 * Provides stub implementations when main modules fail to load
 */

// Fallback WebLLM Integration
export class FallbackWebLLMIntegration {
  constructor() {
    this.isInitialized = false;
    this.modelName = 'Fallback Mode';
  }

  async initialize(options = {}) {
    console.warn('⚠️ Using fallback WebLLM integration');
    if (options.progressCallback) {
      options.progressCallback({ progress: 100, text: 'Fallback mode active' });
    }
    this.isInitialized = true;
  }

  getCurrentModelName() {
    return this.modelName;
  }

  async generateResponse(prompt) {
    return {
      response: 'Fallback response: AI model not available',
      confidence: 0.1
    };
  }
}

// Fallback Node Editor
export class FallbackNodeEditor {
  constructor() {
    this.isInitialized = false;
  }

  async initialize(canvas) {
    console.warn('⚠️ Using fallback node editor');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Node Editor not available', canvas.width / 2, canvas.height / 2);
    }
    this.isInitialized = true;
  }

  exportAgent() {
    return {
      id: 'fallback-agent',
      name: 'Fallback Agent',
      nodes: [],
      connections: []
    };
  }

  async importAgent(agent) {
    console.warn('⚠️ Cannot import agent in fallback mode');
  }
}

// Fallback Agent Engine
export class FallbackAgentEngine {
  constructor() {
    this.isInitialized = false;
  }

  async initialize(webLLM) {
    console.warn('⚠️ Using fallback agent engine');
    this.isInitialized = true;
  }

  async initializeArena(canvas) {
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0f0f1e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff88';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Arena not available', canvas.width / 2, canvas.height / 2);
    }
  }

  async startSimulation(agents, scenario) {
    console.warn('⚠️ Cannot start simulation in fallback mode');
    return { success: false, message: 'Simulation not available' };
  }
}

// Fallback Tournament Manager
export class FallbackTournamentManager {
  constructor() {
    this.isInitialized = false;
  }

  async initialize(storage) {
    console.warn('⚠️ Using fallback tournament manager');
    this.isInitialized = true;
  }

  createTournament(config) {
    console.warn('⚠️ Cannot create tournament in fallback mode');
    return null;
  }

  async joinTournament(tournamentId, agentId) {
    throw new Error('Tournament system not available');
  }
}

// Fallback Skill Chip System
export class FallbackSkillChipSystem {
  constructor() {
    this.isInitialized = false;
  }

  async initialize(storage) {
    console.warn('⚠️ Using fallback skill chip system');
    this.isInitialized = true;
  }

  generateRandomChip() {
    return {
      id: 'fallback-chip',
      name: 'Fallback Chip',
      rarity: 'common',
      category: 'processing'
    };
  }

  getCollection() {
    return [];
  }
}

// Fallback Scenario Manager
export class FallbackScenarioManager {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    console.warn('⚠️ Using fallback scenario manager');
    this.isInitialized = true;
  }

  async load(scenarioId) {
    return {
      id: scenarioId,
      name: 'Fallback Scenario',
      description: 'Scenario system not available'
    };
  }

  getAllScenarios() {
    return [];
  }
}

// Fallback Storage Manager
export class FallbackStorageManager {
  constructor() {
    this.isInitialized = false;
    this.data = new Map();
  }

  async initialize() {
    console.warn('⚠️ Using fallback storage manager (memory only)');
    this.isInitialized = true;
  }

  async getUserProfile() {
    return this.data.get('userProfile') || {
      id: 'fallback-user',
      name: 'Fallback User',
      stats: {
        agentsCreated: 0,
        tournamentsWon: 0,
        skillChipsCollected: 0
      }
    };
  }

  async saveUserProfile(profile) {
    this.data.set('userProfile', profile);
  }

  async getUserAgents() {
    return this.data.get('agents') || [];
  }

  async saveAgent(agent) {
    const agents = await this.getUserAgents();
    agents.push(agent);
    this.data.set('agents', agents);
  }
}

// Fallback Performance Monitor
export class FallbackPerformanceMonitor {
  constructor() {
    this.isInitialized = false;
  }

  initialize() {
    console.warn('⚠️ Using fallback performance monitor');
    this.isInitialized = true;
  }

  startMonitoring() {
    // No-op
  }

  stopMonitoring() {
    // No-op
  }

  getPerformanceReport() {
    return {
      message: 'Performance monitoring not available'
    };
  }
}

// Fallback Error Handler
export class FallbackErrorHandler {
  constructor() {
    this.isInitialized = false;
  }

  initialize() {
    console.warn('⚠️ Using fallback error handler');
    this.isInitialized = true;
  }

  handleError(error, context) {
    console.error(`[${context}]`, error);
    
    // Show basic error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b35;
      color: white;
      padding: 1rem;
      border-radius: 8px;
      z-index: 10001;
      max-width: 300px;
    `;
    errorDiv.textContent = `Error: ${error.message || 'Unknown error'}`;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }
}

// Export all fallback modules
export const FallbackModules = {
  WebLLMIntegration: FallbackWebLLMIntegration,
  NodeEditor: FallbackNodeEditor,
  AgentEngine: FallbackAgentEngine,
  TournamentManager: FallbackTournamentManager,
  SkillChipSystem: FallbackSkillChipSystem,
  ScenarioManager: FallbackScenarioManager,
  StorageManager: FallbackStorageManager,
  PerformanceMonitor: FallbackPerformanceMonitor,
  ErrorHandler: FallbackErrorHandler
};
