/**
 * Agent Arcades - Main Application
 * Revolutionary client-side AI agent development platform
 */

import { WebLLMIntegration } from './modules/web-llm-integration.js';
import { OpenAIIntegration } from './modules/openai-integration.js';
import { NodeEditor } from './modules/node-editor.js';
import { AgentEngine } from './modules/agent-engine.js';
import { TournamentManager } from './modules/tournament.js';
import { SkillChipSystem } from './modules/skill-chips.js';
import { ScenarioManager } from './modules/scenarios.js';
import { StorageManager } from './utils/storage.js';
import { PerformanceMonitor } from './utils/performance.js';
import { ErrorHandler } from './utils/error-handler.js';
import { ModuleChecker } from './utils/module-checker.js';

class AgentArcadesApp {
  constructor() {
    // Debug mode detection
    this.debugMode = window.location.search.includes('debug=true') || localStorage.getItem('agentArcadesDebug') === 'true';
    if (this.debugMode) {
      console.log('🐛 Debug mode enabled');
    }

    // Module checker for debugging
    this.moduleChecker = new ModuleChecker();

    // Core modules
    this.webLLM = new WebLLMIntegration();
    this.openAI = new OpenAIIntegration();
    this.nodeEditor = new NodeEditor();
    this.agentEngine = new AgentEngine();
    this.tournament = new TournamentManager();
    this.skillChips = new SkillChipSystem();
    this.scenarios = new ScenarioManager();
    this.storage = new StorageManager();
    this.performance = new PerformanceMonitor();
    this.errorHandler = new ErrorHandler();

    // Application state
    this.state = {
      currentView: 'dashboard',
      activeAgent: null,
      tournament: null,
      user: null,
      isInitialized: false,
      modelStatus: 'loading'
    };

    // UI elements
    this.elements = {};

    // Event listeners
    this.eventListeners = new Map();

    // Initialize application
    this.initialize();
  }

  async initialize() {
    // Add overall timeout to prevent infinite loading
    const initializationTimeout = setTimeout(() => {
      console.error('❌ Initialization timeout - forcing completion');
      this.handleInitializationError(new Error('Initialization timed out after 60 seconds'));
    }, 60000); // 60 second timeout

    try {
      console.log('🎮 Starting Agent Arcades initialization...');
      this.showLoadingScreen('Initializing Agent Arcades...');
      this.updateLoadingProgress(5);

      // Initialize error handling first
      console.log('📋 Initializing error handler...');
      if (this.debugMode) console.log('🐛 Debug: About to initialize error handler');
      this.errorHandler.initialize();
      if (this.debugMode) console.log('🐛 Debug: Error handler initialized');
      this.updateLoadingProgress(10);

      // Start performance monitoring
      console.log('📊 Starting performance monitoring...');
      this.performance.startMonitoring();
      this.updateLoadingProgress(15);

      // Check browser capabilities
      console.log('🌐 Checking browser capabilities...');
      this.showLoadingScreen('Checking browser compatibility...');
      const capabilities = await this.moduleChecker.checkBrowserCapabilities();
      this.validateBrowserCapabilities(capabilities);
      this.updateLoadingProgress(15);

      // Cache DOM elements
      console.log('🔍 Caching DOM elements...');
      this.showLoadingScreen('Preparing interface...');
      this.cacheElements();
      this.updateLoadingProgress(20);

      // Initialize storage first (required for user data)
      console.log('💾 Initializing storage system...');
      this.showLoadingScreen('Setting up storage...');
      await this.storage.initialize();
      this.updateLoadingProgress(25);

      // Load user data (now that storage is ready)
      console.log('👤 Loading user data...');
      this.showLoadingScreen('Loading user profile...');
      await this.loadUserData();
      this.updateLoadingProgress(30);

      // Initialize AI backend (Web-LLM preferred unless user selects OpenAI)
      console.log('🤖 Initializing AI backend...');
      this.showLoadingScreen('Loading AI backend...');
      const preferred = localStorage.getItem('agentArcades_backend') || 'local';
      if (preferred === 'openai') {
        const ok = await this.tryInitializeOpenAI();
        if (!ok) {
          await this.initializeWebLLMWithFallback();
        }
      } else {
        await this.initializeWebLLMWithFallback();
      }
      this.updateLoadingProgress(60);

      // Initialize remaining core modules
      console.log('⚙️ Setting up core modules...');
      this.showLoadingScreen('Setting up components...');
      await this.initializeRemainingModules();
      this.updateLoadingProgress(80);

      // Setup event listeners
      console.log('🔗 Setting up event listeners...');
      this.showLoadingScreen('Connecting interface...');
      this.setupEventListeners();
      this.updateLoadingProgress(90);

      // Initialize UI
      console.log('🎨 Initializing user interface...');
      this.showLoadingScreen('Preparing interface...');
      this.initializeUI();
      this.updateLoadingProgress(95);

      // Register service worker
      console.log('📱 Registering service worker...');
      this.showLoadingScreen('Enabling offline features...');
      await this.registerServiceWorker();
      this.updateLoadingProgress(100);

      // Mark as initialized
      this.state.isInitialized = true;

      // Clear the timeout since we completed successfully
      clearTimeout(initializationTimeout);

      // Hide loading screen and show app
      this.showLoadingScreen('Ready to launch!');
      setTimeout(() => {
        this.hideLoadingScreen();
        console.log('🎮 Agent Arcades initialized successfully!');
      }, 500);

    } catch (error) {
      clearTimeout(initializationTimeout);
      console.error('❌ Initialization failed:', error);
      this.handleInitializationError(error);
    }
  }

  cacheElements() {
    console.log('🔍 Caching DOM elements...');

    // Helper function to safely get elements
    const safeGetElement = (id) => {
      const element = document.getElementById(id);
      if (!element) {
        console.warn(`⚠️ Element not found: ${id}`);
      }
      return element;
    };

    const safeQuerySelector = (selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        console.warn(`⚠️ Element not found: ${selector}`);
      }
      return element;
    };

    const safeQuerySelectorAll = (selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`⚠️ No elements found: ${selector}`);
      }
      return elements;
    };

    // Loading screen elements (critical)
    this.elements.loadingScreen = safeGetElement('loading-screen');
    this.elements.loadingProgressFill = safeGetElement('loading-progress-fill');
    this.elements.loadingStatus = safeGetElement('loading-status');

    // Main app element (critical)
    this.elements.app = safeGetElement('app');

    // Navigation elements
    this.elements.navButtons = safeQuerySelectorAll('.nav-button');
    this.elements.views = safeQuerySelectorAll('.view');

    // Model status elements
    this.elements.modelIndicator = safeGetElement('model-indicator');
    this.elements.modelText = safeGetElement('model-text');

    // Dashboard elements
    this.elements.newAgentBtn = safeGetElement('new-agent-btn');
    this.elements.templatesBtn = safeGetElement('templates-btn');
    this.elements.tutorialBtn = safeGetElement('tutorial-btn');
    this.elements.agentList = safeGetElement('agent-list');
    this.elements.recentMatches = safeGetElement('recent-matches');

    // Chip count elements
    this.elements.chipCounts = {
      legendary: safeGetElement('legendary-count'),
      epic: safeGetElement('epic-count'),
      rare: safeGetElement('rare-count'),
      common: safeGetElement('common-count')
    };

    // Editor elements
    this.elements.nodeEditorCanvas = safeGetElement('node-editor-canvas');
    this.elements.agentNameInput = safeGetElement('agent-name-input');
    this.elements.saveAgentBtn = safeGetElement('save-agent-btn');
    this.elements.loadAgentBtn = safeGetElement('load-agent-btn');
    this.elements.testAgentBtn = safeGetElement('test-agent-btn');

    // Arena elements
    this.elements.arenaCanvas = safeGetElement('arena-canvas');
    this.elements.startSimulationBtn = safeGetElement('start-simulation-btn');
    this.elements.pauseSimulationBtn = safeGetElement('pause-simulation-btn');
    this.elements.stopSimulationBtn = safeGetElement('stop-simulation-btn');
    this.elements.scenarioSelect = safeGetElement('scenario-select');
    this.elements.agentSlots = safeGetElement('agent-slots');

    // Modal and error elements
    this.elements.modalOverlay = safeGetElement('modal-overlay');
    this.elements.modal = safeGetElement('modal');
    this.elements.errorContainer = safeGetElement('error-container');

    console.log('✅ DOM elements cached successfully');
  }

  async initializeWebLLMWithFallback() {
    try {
      console.log('🤖 Starting Web-LLM initialization...');
      this.updateModelStatus('loading', 'Detecting hardware...');

      // Check if WebGPU is available
      if (!navigator.gpu) {
        console.warn('⚠️ WebGPU not available, trying OpenAI API...');
        const openAIReady = await this.tryInitializeOpenAI();
        if (openAIReady) return;
        this.updateModelStatus('fallback', 'Fallback mode (WebGPU not supported)');
        return;
      }

      // Initialize Web-LLM with progress callback and timeout
      const initPromise = this.webLLM.initialize({
        progressCallback: (progress) => {
          const progressValue = 30 + (progress.progress || 0) * 0.3; // Map to 30-60% range
          this.updateLoadingProgress(progressValue);
          this.showLoadingScreen(progress.text || 'Loading AI model...');
          console.log(`🔄 Web-LLM Progress: ${progress.progress}% - ${progress.text}`);
        }
      });

      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Web-LLM initialization timeout')), 30000); // 30 second timeout
      });

      await Promise.race([initPromise, timeoutPromise]);

      const modelName = this.webLLM.getCurrentModelName();
      this.updateModelStatus('ready', modelName);
      console.log(`✅ Web-LLM initialized with model: ${modelName}`);

    } catch (error) {
      console.error('❌ Web-LLM initialization failed:', error);
      console.warn('⚠️ Trying OpenAI API fallback...');

      const openAIReady = await this.tryInitializeOpenAI();
      if (openAIReady) return;

      // As last resort, use minimal fallback mode
      this.updateModelStatus('fallback', 'Fallback mode (AI model unavailable)');

      // Log the specific error for debugging
      if (error.message?.includes('WebGPU')) {
        console.warn('WebGPU not supported. Using fallback mode.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        console.warn('Network error loading AI model. Using fallback mode.');
      } else if (error.message?.includes('memory') || error.message?.includes('quota')) {
        console.warn('Insufficient memory for AI model. Using fallback mode.');
      } else if (error.message?.includes('timeout')) {
        console.warn('AI model loading timed out. Using fallback mode.');
      }
    }
  }

  async tryInitializeOpenAI() {
    try {
      const ready = await this.openAI.initialize({
        progressCallback: (p) => {
          const progressValue = 60 + (p.progress || 0) * 0.4; // Map to 60-100%
          this.updateLoadingProgress(progressValue);
          this.showLoadingScreen(p.text || 'Connecting to OpenAI...');
        }
      });
      if (ready) {
        this.updateModelStatus('ready', this.openAI.getCurrentModelName());
        console.log(`✅ Using OpenAI API backend (${this.openAI.getCurrentModelName()})`);
        this.state.modelBackend = 'openai';
        return true;
      }
      return false;
    } catch (error) {
      console.warn('OpenAI initialization failed or not configured');
      return false;
    }
  }

  async initializeRemainingModules() {
    console.log('⚙️ Initializing remaining core modules...');

    try {
      // Initialize scenarios (needed for other modules)
      console.log('🎯 Initializing scenarios...');
      await this.scenarios.initialize();
      this.updateLoadingProgress(65);

      // Initialize skill chip system
      console.log('💎 Initializing skill chips...');
      await this.skillChips.initialize(this.storage);
      this.updateLoadingProgress(68);

      // Initialize tournament system
      console.log('🏆 Initializing tournaments...');
      await this.tournament.initialize(this.storage);
      this.updateLoadingProgress(70);

      // Initialize agent engine with Web-LLM
      console.log('🤖 Initializing agent engine...');
      await this.agentEngine.initialize(this.webLLM);
      this.updateLoadingProgress(75);

      // Initialize node editor (if canvas exists)
      if (this.elements.nodeEditorCanvas) {
        console.log('🎨 Initializing node editor...');
        await this.nodeEditor.initialize(this.elements.nodeEditorCanvas);
      } else {
        console.warn('⚠️ Node editor canvas not found, skipping node editor initialization');
      }
      this.updateLoadingProgress(78);

      // Initialize arena canvas (if exists)
      if (this.elements.arenaCanvas) {
        console.log('🏟️ Initializing arena...');
        await this.agentEngine.initializeArena(this.elements.arenaCanvas);
      } else {
        console.warn('⚠️ Arena canvas not found, skipping arena initialization');
      }

      console.log('✅ All remaining modules initialized successfully');

    } catch (error) {
      console.error('❌ Module initialization failed:', error);
      // Don't throw error, continue with partial initialization
      console.warn('⚠️ Continuing with partial module initialization');
    }
  }

  setupEventListeners() {
    // Navigation
    this.elements.navButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // Dashboard actions
    if (this.elements.newAgentBtn) {
      this.elements.newAgentBtn.addEventListener('click', () => {
        this.createNewAgent();
      });
    }

    if (this.elements.templatesBtn) {
      this.elements.templatesBtn.addEventListener('click', () => {
        this.showTemplateSelector();
      });
    }

    if (this.elements.tutorialBtn) {
      this.elements.tutorialBtn.addEventListener('click', () => {
        this.startTutorial();
      });
    }

    // Editor actions
    if (this.elements.saveAgentBtn) {
      this.elements.saveAgentBtn.addEventListener('click', () => {
        this.saveCurrentAgent();
      });
    }

    if (this.elements.loadAgentBtn) {
      this.elements.loadAgentBtn.addEventListener('click', () => {
        this.showAgentSelector();
      });
    }

    if (this.elements.testAgentBtn) {
      this.elements.testAgentBtn.addEventListener('click', () => {
        this.testCurrentAgent();
      });
    }

    // Arena actions
    if (this.elements.startSimulationBtn) {
      this.elements.startSimulationBtn.addEventListener('click', () => {
        this.startSimulation();
      });
    }

    if (this.elements.pauseSimulationBtn) {
      this.elements.pauseSimulationBtn.addEventListener('click', () => {
        this.pauseSimulation();
      });
    }

    if (this.elements.stopSimulationBtn) {
      this.elements.stopSimulationBtn.addEventListener('click', () => {
        this.stopSimulation();
      });
    }

    // Modal close
    if (this.elements.modalOverlay) {
      this.elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.elements.modalOverlay) {
          this.hideModal();
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcut(e);
    });

    // Window events

    // Settings button
    const settingsBtn = document.getElementById('settings-button');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.showSettings());
    }

    window.addEventListener('beforeunload', () => {
      this.saveApplicationState();
    });

    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  initializeUI() {
    // Update dashboard
    this.updateDashboard();

    // Initialize current view
    this.switchView(this.state.currentView);

    // Setup responsive behavior
    this.setupResponsiveBehavior();
  }

  async loadUserData() {
    try {
      this.state.user = await this.storage.getUserProfile();
      if (!this.state.user) {
        // Create new user profile
        this.state.user = {
          id: this.generateId(),
          name: 'Agent Architect',
          created: new Date().toISOString(),
          stats: {
            agentsCreated: 0,
            tournamentsWon: 0,
            skillChipsCollected: 0,
            totalPlayTime: 0
          }
        };
        await this.storage.saveUserProfile(this.state.user);
      }
    } catch (error) {
      console.warn('Failed to load user data:', error);
      // Continue with default user
      this.state.user = {
        id: 'default',
        name: 'Agent Architect',
        created: new Date().toISOString(),
        stats: {
          agentsCreated: 0,
          tournamentsWon: 0,
          skillChipsCollected: 0,
          totalPlayTime: 0
        }
      };
    }
  }

  switchView(viewName) {
    // Update navigation
    this.elements.navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update views
    this.elements.views.forEach(view => {
      view.classList.toggle('active', view.id === `${viewName}-view`);
    });

    this.state.currentView = viewName;

    // View-specific initialization
    switch (viewName) {
      case 'dashboard':
        this.updateDashboard();
        break;
      case 'editor':
        this.nodeEditor.refresh();
        break;
      case 'arena':
        this.agentEngine.refreshArena();
        break;
      case 'tournaments':
        this.tournament.refreshTournaments();
        break;
      case 'collection':
        this.skillChips.refreshCollection();
        break;
    }
  }

  updateDashboard() {
    this.updateAgentList();
    this.updateRecentMatches();
    this.updateSkillChipCounts();
    this.updateDailyChallenge();
  }

  async updateAgentList() {
    if (!this.elements.agentList) return;

    try {
      const agents = await this.storage.getUserAgents();

      if (agents.length === 0) {
        this.elements.agentList.innerHTML = `
          <div class="no-agents">
            <p>No agents created yet. Click "New Agent" to get started!</p>
          </div>
        `;
        return;
      }

      this.elements.agentList.innerHTML = agents.map(agent => `
        <div class="agent-item" data-agent-id="${agent.id}">
          <div class="agent-info">
            <div class="agent-avatar">${agent.name.charAt(0).toUpperCase()}</div>
            <div class="agent-details">
              <h4>${agent.name}</h4>
              <p>${agent.description || 'No description'}</p>
            </div>
          </div>
          <div class="agent-status">
            <span class="status-indicator ${agent.status || 'idle'}"></span>
            <span class="status-text">${this.getAgentStatusText(agent)}</span>
          </div>
        </div>
      `).join('');

      // Add click listeners
      this.elements.agentList.querySelectorAll('.agent-item').forEach(item => {
        item.addEventListener('click', () => {
          const agentId = item.dataset.agentId;
          this.loadAgent(agentId);
        });
      });

    } catch (error) {
      console.error('Failed to update agent list:', error);
      this.elements.agentList.innerHTML = '<div class="error">Failed to load agents</div>';
    }
  }

  async updateSkillChipCounts() {
    try {
      const collection = await this.skillChips.getCollection();
      const counts = this.skillChips.getCountsByRarity(collection);

      Object.entries(this.elements.chipCounts).forEach(([rarity, element]) => {
        if (element) {
          element.textContent = counts[rarity] || 0;
        }
      });

    } catch (error) {
      console.error('Failed to update skill chip counts:', error);
    }
  }

  showLoadingScreen(message) {
    console.log('📱 Loading:', message);
    const loadingScreen = document.getElementById('loading-screen');
    const loadingStatus = document.getElementById('loading-status');

    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
      loadingScreen.style.display = 'flex';
    }

    if (loadingStatus) {
      loadingStatus.textContent = message;
      loadingStatus.style.color = '#ffffff';
    }

    // Also update cached elements if available
    if (this.elements.loadingScreen) {
      this.elements.loadingScreen.classList.remove('hidden');
    }
    if (this.elements.loadingStatus) {
      this.elements.loadingStatus.textContent = message;
    }

    // Add debug info if in debug mode
    if (this.debugMode) {
      this.addDebugInfo(message);
    }
  }

  addDebugInfo(message) {
    let debugContainer = document.getElementById('debug-info');
    if (!debugContainer) {
      debugContainer = document.createElement('div');
      debugContainer.id = 'debug-info';
      debugContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: #00ff00;
        padding: 1rem;
        border-radius: 8px;
        font-family: monospace;
        font-size: 0.8rem;
        max-width: 300px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 10002;
        border: 1px solid #00ff88;
      `;
      document.body.appendChild(debugContainer);
    }

    const timestamp = new Date().toLocaleTimeString();
    const debugLine = document.createElement('div');
    debugLine.textContent = `[${timestamp}] ${message}`;
    debugContainer.appendChild(debugLine);

    // Keep only last 10 messages
    while (debugContainer.children.length > 10) {
      debugContainer.removeChild(debugContainer.firstChild);
    }

    debugContainer.scrollTop = debugContainer.scrollHeight;
  }

  hideLoadingScreen() {
    console.log('✅ Hiding loading screen');
    const loadingScreen = document.getElementById('loading-screen');
    const app = document.getElementById('app');

    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }

    if (app) {
      app.classList.remove('hidden');
      app.style.display = 'block';
    }

    // Also update cached elements if available
    if (this.elements.loadingScreen) {
      this.elements.loadingScreen.classList.add('hidden');
    }
    if (this.elements.app) {
      this.elements.app.classList.remove('hidden');
    }
  }

  updateLoadingProgress(progress) {
    console.log(`📊 Progress: ${progress}%`);
    const progressFill = document.getElementById('loading-progress-fill');
    const progressText = document.getElementById('loading-progress-text');

    const clampedProgress = Math.min(100, Math.max(0, progress));

    if (progressFill) {
      progressFill.style.width = `${clampedProgress}%`;
    }

    if (progressText) {
      progressText.textContent = `${Math.round(clampedProgress)}%`;
    }

    // Also update cached elements if available
    if (this.elements.loadingProgressFill) {
      this.elements.loadingProgressFill.style.width = `${clampedProgress}%`;
    }
  }

  validateBrowserCapabilities(capabilities) {
    const required = ['indexeddb', 'modules', 'serviceworker'];
    const recommended = ['webgpu', 'webgl', 'webassembly'];

    const missing = required.filter(cap => !capabilities[cap]);
    const missingRecommended = recommended.filter(cap => !capabilities[cap]);

    if (missing.length > 0) {
      throw new Error(`Browser missing required features: ${missing.join(', ')}. Please use a modern browser.`);
    }

    if (missingRecommended.length > 0) {
      console.warn(`⚠️ Browser missing recommended features: ${missingRecommended.join(', ')}`);
      if (!capabilities.webgpu) {
        console.warn('⚠️ WebGPU not available. AI performance may be limited.');
      }
    }

    console.log('✅ Browser capabilities validated');
  }

  handleInitializationError(error) {
    console.error('🚨 Initialization Error:', error);

    const loadingStatus = document.getElementById('loading-status');
    const loadingScreen = document.getElementById('loading-screen');

    if (loadingStatus) {
      loadingStatus.textContent = `Failed to initialize: ${error.message || 'Unknown error'}`;
      loadingStatus.style.color = '#ff6b35';
    }

    if (loadingScreen) {
      loadingScreen.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #2d1b2e 100%)';
    }

    // Show retry and fallback options
    this.showErrorOptions(error);
  }

  showErrorOptions(error) {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return;

    // Remove existing buttons
    const existingButtons = loadingScreen.querySelectorAll('.error-button');
    existingButtons.forEach(btn => btn.remove());

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      flex-wrap: wrap;
      justify-content: center;
    `;

    // Retry button
    const retryButton = document.createElement('button');
    retryButton.className = 'error-button';
    retryButton.textContent = '🔄 Retry Initialization';
    retryButton.style.cssText = `
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #00ff88 0%, #0066ff 100%);
      color: #0f0f1e;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    retryButton.addEventListener('click', () => window.location.reload());

    // Fallback mode button
    const fallbackButton = document.createElement('button');
    fallbackButton.className = 'error-button';
    fallbackButton.textContent = '⚡ Launch Minimal Mode';
    fallbackButton.style.cssText = `
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
      color: #0f0f1e;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    fallbackButton.addEventListener('click', () => this.initializeFallbackMode());

    buttonContainer.appendChild(retryButton);
    buttonContainer.appendChild(fallbackButton);
    loadingScreen.appendChild(buttonContainer);
  }

  async initializeFallbackMode() {
    console.log('🔧 Initializing fallback mode...');
    this.showLoadingScreen('Starting minimal mode...');

    try {
      // Basic initialization without complex dependencies
      this.cacheElements();
      this.updateLoadingProgress(40);

      // Attach core UI events and render initial UI even in fallback
      try {
        this.setupEventListeners();
        this.updateLoadingProgress(55);
        this.initializeUI();
        this.updateLoadingProgress(70);
      } catch (e) {
        console.warn('⚠️ Minimal UI setup encountered an issue:', e);
      }

      // Initialize basic storage
      try {
        await this.storage.initialize();
      } catch (e) {
        console.warn('Storage failed, using memory-only mode');
      }
      this.updateLoadingProgress(85);

      // Skip Web-LLM and complex modules
      this.state.isInitialized = true;
      this.updateLoadingProgress(100);

      // Show app with limited functionality
      this.showLoadingScreen('Minimal mode ready!');
      setTimeout(() => {
        this.hideLoadingScreen();
        this.showFallbackModeNotice();
        console.log('🔧 Fallback mode initialized');
      }, 500);

    } catch (error) {
      console.error('Even fallback mode failed:', error);
      this.showLoadingScreen('Unable to start application. Please refresh the page.');
    }
  }

  showFallbackModeNotice() {
    const notice = document.createElement('div');
    notice.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 193, 7, 0.9);
      color: #0f0f1e;
      padding: 1rem 2rem;
      border-radius: 8px;
      z-index: 10001;
      font-weight: 600;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    notice.textContent = '⚡ Running in minimal mode - Some features may be limited';
    document.body.appendChild(notice);

    setTimeout(() => {
      if (notice.parentNode) {
        notice.style.opacity = '0';
        setTimeout(() => notice.remove(), 300);
      }
    }, 5000);
  }



  updateModelStatus(status, text) {
    this.state.modelStatus = status;

    if (this.elements.modelIndicator) {
      this.elements.modelIndicator.className = `status-indicator ${status}`;
    }

    if (this.elements.modelText) {
      this.elements.modelText.textContent = text;
    }
  }

  async createNewAgent() {
    this.switchView('editor');
    await this.nodeEditor.createNewAgent();
  }

  async saveCurrentAgent() {
    try {
      const agentData = this.nodeEditor.exportAgent();

      if (!agentData) {
        this.showError('No agent to save');
        return;
      }

      const agentId = await this.storage.saveAgent(agentData);
      this.showSuccess(`Agent "${agentData.name}" saved successfully!`);

      // Update stats
      this.state.user.stats.agentsCreated++;
      await this.storage.saveUserProfile(this.state.user);

    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to save agent');
      this.showError('Failed to save agent');
    }
  }

  generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  getAgentStatusText(agent) {
    switch (agent.status) {
      case 'active': return 'Active';
      case 'training': return 'Training';
      case 'competing': return 'In Tournament';
      default: return 'Idle';
    }
  }

  showError(message) {
    // Implementation for error display
    console.error(message);
  }

  showSuccess(message) {
    // Implementation for success display
    console.log(message);
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        // Add timeout to prevent hanging
        const registrationPromise = navigator.serviceWorker.register('/service-worker.js');
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Service Worker registration timeout')), 5000);
        });

        await Promise.race([registrationPromise, timeoutPromise]);
        console.log('✅ Service Worker registered successfully');
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error);
        // Don't throw error, continue without service worker
      }
    } else {
      console.warn('⚠️ Service Worker not supported in this browser');
    }
  }

  handleKeyboardShortcut(e) {
    // Keyboard shortcuts implementation
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'n':
          e.preventDefault();
          this.createNewAgent();
          break;
        case 's':
          e.preventDefault();
          this.saveCurrentAgent();
          break;
      }
    }
  }

  handleResize() {
    // Handle responsive behavior
    if (this.nodeEditor) {
      this.nodeEditor.handleResize();
    }
    if (this.agentEngine) {
      this.agentEngine.handleResize();
    }
  }

  saveApplicationState() {
    // Save current application state
    const state = {
      currentView: this.state.currentView,
      timestamp: Date.now()
    };
    localStorage.setItem('agentArcades_appState', JSON.stringify(state));
  }

  async updateRecentMatches() {
    if (!this.elements.recentMatches) return;

    try {
      const userProfile = await this.storage.getUserProfile();
      if (!userProfile) return;

      const matches = await this.storage.getUserMatches(userProfile.id);
      const recentMatches = matches
        .filter(match => match.status === 'completed')
        .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
        .slice(0, 5);

      if (recentMatches.length === 0) {
        this.elements.recentMatches.innerHTML = `
          <div class="no-matches">
            <p>No recent matches. Join a tournament to get started!</p>
          </div>
        `;
        return;
      }

      this.elements.recentMatches.innerHTML = recentMatches.map(match => `
        <div class="match-item">
          <span class="match-result ${match.result?.winner === userProfile.id ? 'win' : 'loss'}">
            ${match.result?.winner === userProfile.id ? '🏆' : '💔'}
          </span>
          <span class="match-details">
            vs ${match.participant1.agentId === userProfile.id ? match.participant2.agentId : match.participant1.agentId}
          </span>
        </div>
      `).join('');

    } catch (error) {
      console.error('Failed to update recent matches:', error);
      this.elements.recentMatches.innerHTML = '<div class="error">Failed to load matches</div>';
    }
  }

  updateDailyChallenge() {
    // Update daily challenge display with current challenge
    const challenges = [
      {
        name: "Event Planning Gauntlet",
        description: "Create an agent that can efficiently plan and coordinate a multi-day conference with complex scheduling constraints.",
        reward: "3 Random Skill Chips",
        progress: Math.floor(Math.random() * 100)
      },
      {
        name: "Debug Detective Challenge",
        description: "Find and fix critical bugs in a complex distributed system within the time limit.",
        reward: "Epic Logic Chip",
        progress: Math.floor(Math.random() * 100)
      },
      {
        name: "Team Coordination Master",
        description: "Design agents that can work together seamlessly to solve multi-agent coordination problems.",
        reward: "Legendary Synergy Chip",
        progress: Math.floor(Math.random() * 100)
      }
    ];

    const todayChallenge = challenges[new Date().getDate() % challenges.length];
    const challengeElement = document.getElementById('daily-challenge');

    if (challengeElement) {
      challengeElement.querySelector('h3').textContent = `"${todayChallenge.name}"`;
      challengeElement.querySelector('.challenge-description').textContent = todayChallenge.description;
      challengeElement.querySelector('.reward-text').textContent = `Reward: ${todayChallenge.reward}`;
      challengeElement.querySelector('.progress-fill').style.width = `${todayChallenge.progress}%`;
      challengeElement.querySelector('.progress-text').textContent = `${todayChallenge.progress}% Complete`;
    }
  }

  showTemplateSelector() {
    const templates = [
      {
        id: 'analyzer',
        name: 'Data Analyzer',
        description: 'Specialized in analyzing data and extracting insights',
        nodes: ['data-input', 'analyze', 'summarize', 'text-output']
      },
      {
        id: 'planner',
        name: 'Strategic Planner',
        description: 'Expert at creating detailed plans and strategies',
        nodes: ['text-input', 'plan', 'critique', 'text-output']
      },
      {
        id: 'debugger',
        name: 'Debug Master',
        description: 'Finds and fixes errors in code and systems',
        nodes: ['data-input', 'analyze', 'critique', 'action']
      }
    ];

    this.showModal('Agent Templates', `
      <div class="template-selector">
        <p>Choose a template to get started quickly:</p>
        <div class="template-grid">
          ${templates.map(template => `
            <div class="template-card" data-template-id="${template.id}">
              <h3>${template.name}</h3>
              <p>${template.description}</p>
              <div class="template-nodes">
                ${template.nodes.map(node => `<span class="node-tag">${node}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `, [
      { text: 'Cancel', action: () => this.hideModal() },
      { text: 'Use Template', action: () => this.applyTemplate(), primary: true }
    ]);
  }

  startTutorial() {
    const tutorialSteps = [
      {
        target: '.nav-button[data-view="editor"]',
        title: 'Agent Editor',
        content: 'This is where you create and design your AI agents using visual programming.'
      },
      {
        target: '.node-palette',
        title: 'Skill Nodes',
        content: 'Drag these skill nodes onto the canvas to build your agent\'s capabilities.'
      },
      {
        target: '.arena-canvas',
        title: 'Arena',
        content: 'Watch your agents compete in real-time simulations here.'
      },
      {
        target: '.chip-summary',
        title: 'Skill Chips',
        content: 'Collect skill chips to enhance your agents\' abilities.'
      }
    ];

    this.showModal('Welcome to Agent Arcades!', `
      <div class="tutorial-intro">
        <h3>🎮 Ready to build your first AI agent?</h3>
        <p>This tutorial will guide you through the basics of Agent Arcades:</p>
        <ul>
          <li>Creating agents with visual programming</li>
          <li>Running simulations in the arena</li>
          <li>Collecting and using skill chips</li>
          <li>Competing in tournaments</li>
        </ul>
        <p>The tutorial takes about 5 minutes. Ready to start?</p>
      </div>
    `, [
      { text: 'Skip Tutorial', action: () => this.hideModal() },
      { text: 'Start Tutorial', action: () => this.runTutorial(tutorialSteps), primary: true }
    ]);
  }

  async showAgentSelector() {
    try {
      const agents = await this.storage.getUserAgents();

      this.showModal('Load Agent', `
        <div class="agent-selector">
          <p>Select an agent to load:</p>
          <div class="agent-grid">
            ${agents.map(agent => `
              <div class="agent-card" data-agent-id="${agent.id}">
                <div class="agent-avatar">${agent.name.charAt(0).toUpperCase()}</div>
                <div class="agent-info">
                  <h3>${agent.name}</h3>
                  <p>${agent.description || 'No description'}</p>
                  <small>Created: ${new Date(agent.created).toLocaleDateString()}</small>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `, [
        { text: 'Cancel', action: () => this.hideModal() },
        { text: 'Load Agent', action: () => this.loadSelectedAgent(), primary: true }
      ]);

    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to load agent list');
    }
  }

  async testCurrentAgent() {
    try {
      const agentData = this.nodeEditor.exportAgent();
      if (!agentData) {
        this.showError('No agent to test');
        return;
      }

      // Switch to arena view
      this.switchView('arena');

      // Create test scenario
      const testScenario = await this.scenarios.load('debug_basic');

      // Run simulation with current agent
      await this.agentEngine.startSimulation([agentData], testScenario.id);

      this.showSuccess('Agent test started in arena!');

    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to test agent');
    }
  }

  async startSimulation() {
    try {
      const selectedAgents = this.getSelectedArenaAgents();
      const selectedScenario = this.elements.scenarioSelect?.value;

      if (selectedAgents.length === 0) {
        this.showError('Please select at least one agent');
        return;
      }

      if (!selectedScenario) {
        this.showError('Please select a scenario');
        return;
      }

      await this.agentEngine.startSimulation(selectedAgents, selectedScenario);

      // Update UI
      this.elements.startSimulationBtn.disabled = true;
      this.elements.pauseSimulationBtn.disabled = false;
      this.elements.stopSimulationBtn.disabled = false;

    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to start simulation');
    }
  }

  pauseSimulation() {
    this.agentEngine.pauseSimulation();
    this.elements.pauseSimulationBtn.textContent = 'Resume';
    this.elements.pauseSimulationBtn.onclick = () => this.resumeSimulation();
  }

  resumeSimulation() {
    this.agentEngine.resumeSimulation();
    this.elements.pauseSimulationBtn.textContent = 'Pause';
    this.elements.pauseSimulationBtn.onclick = () => this.pauseSimulation();
  }

  stopSimulation() {
    this.agentEngine.stopSimulation();

    // Reset UI
    this.elements.startSimulationBtn.disabled = false;
    this.elements.pauseSimulationBtn.disabled = true;
    this.elements.stopSimulationBtn.disabled = true;
    this.elements.pauseSimulationBtn.textContent = 'Pause';
  }

  async loadAgent(agentId) {
    try {
      const agent = await this.storage.getAgent(agentId);
      if (!agent) {
        this.showError('Agent not found');
        return;
      }

      // Switch to editor view
      this.switchView('editor');

      // Load agent into editor
      await this.nodeEditor.importAgent(agent);

      // Update agent name input
      if (this.elements.agentNameInput) {
        this.elements.agentNameInput.value = agent.name;
      }

      this.showSuccess(`Agent "${agent.name}" loaded successfully!`);

    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to load agent');
    }
  }

  hideModal() {
    if (this.elements.modalOverlay) {
      this.elements.modalOverlay.classList.add('hidden');
    }
  }

  showModal(title, content, actions = []) {
    if (!this.elements.modal || !this.elements.modalOverlay) return;

    this.elements.modal.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        <button class="modal-close" onclick="window.agentArcades.hideModal()">×</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      <div class="modal-footer">
        ${actions.map(action => `
          <button class="btn ${action.primary ? 'primary' : 'secondary'}"
                  onclick="${action.action.toString().replace('function', 'window.agentArcades.modalAction')}">
            ${action.text}
          </button>
        `).join('')}
      </div>
    `;

    this.elements.modalOverlay.classList.remove('hidden');
  }

  setupResponsiveBehavior() {
    // Handle responsive navigation
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 768) {
        // Mobile behavior
        document.body.classList.add('mobile');
        document.body.classList.remove('tablet', 'desktop');
      } else if (width < 1024) {
        // Tablet behavior
        document.body.classList.add('tablet');
        document.body.classList.remove('mobile', 'desktop');
      } else {
        // Desktop behavior
        document.body.classList.add('desktop');
        document.body.classList.remove('mobile', 'tablet');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
  }

  // Helper methods
  getSelectedArenaAgents() {
    const slots = document.querySelectorAll('.agent-slot.occupied');
    return Array.from(slots).map(slot => ({
      id: slot.dataset.agentId,
      name: slot.querySelector('.agent-slot-name').textContent
    }));
  }

  runTutorial(steps) {
    // Tutorial implementation would go here
    this.hideModal();
    this.showSuccess('Tutorial started! Follow the highlighted areas.');
  }

  // Settings panel for OpenAI integration (proper class method)
  showSettings() {
    const models = this.openAI.getAvailableModels();
    const modelOptions = Object.entries(models)
      .map(([id, m]) => `<option value="${id}">${m.name}</option>`)
      .join('');

    const content = `
      <div class="settings-panel">
        <h3>AI Backend Settings</h3>
        <div class="form-group">
          <label>Preferred Backend</label>
          <select id="backend-select">
            <option value="local">Local (Web-LLM)</option>
            <option value="openai">OpenAI API</option>
          </select>
        </div>
        <div class="form-group">
          <label>OpenAI API Key</label>
          <input id="openai-key" type="password" placeholder="sk-..." autocomplete="off" />
          <small>Your API key is stored locally and never sent anywhere except OpenAI.</small>
        </div>
        <div class="form-group">
          <label>OpenAI Model</label>
          <select id="openai-model">
            ${modelOptions}
          </select>
        </div>
        <div class="form-actions">
          <button class="btn secondary" id="test-openai">Test Connection</button>
          <button class="btn primary" id="save-settings">Save Settings</button>
        </div>
      </div>
    `;

    this.showModal('Settings', content, [
      { text: 'Close', action: () => this.hideModal() }
    ]);

    // Wire up interactions after modal renders
    setTimeout(() => {
      const keyInput = document.getElementById('openai-key');
      const modelSelect = document.getElementById('openai-model');
      const backendSelect = document.getElementById('backend-select');

      // Load existing settings
      try {
        const raw = localStorage.getItem('agentArcades_openai_settings');
        if (raw) {
          const settings = JSON.parse(raw);
          if (settings.apiKey) keyInput.value = settings.apiKey.replace(/.(?=.{4})/g, '•');
          if (settings.model && models[settings.model]) {
            modelSelect.value = settings.model;
          } else {
            // Default to GPT-5 if no previous selection or invalid
            modelSelect.value = models['gpt-5'] ? 'gpt-5' : Object.keys(models)[0];
          }
        } else {
          modelSelect.value = models['gpt-5'] ? 'gpt-5' : Object.keys(models)[0];
        }
        const preferred = localStorage.getItem('agentArcades_backend') || 'local';
        backendSelect.value = preferred;
      } catch {}

      document.getElementById('test-openai').addEventListener('click', async () => {
        try {
          const entered = prompt('Enter your OpenAI API key to test (will not be saved unless you click Save):', '');
          if (!entered) return;
          const ok = await this.openAI.testConnectionWithKey(entered);
          alert(ok ? 'OpenAI connection successful!' : 'OpenAI connection failed.');
        } catch (e) {
          alert('OpenAI test failed: ' + (e.message || e.toString()));
        }
      });

      document.getElementById('save-settings').addEventListener('click', async () => {
        try {
          const key = prompt('Re-enter your OpenAI API key to save (sk-...):', '');
          if (key) this.openAI.setApiKey(key);
          this.openAI.setModel(modelSelect.value);
          localStorage.setItem('agentArcades_backend', backendSelect.value);
          alert('Settings saved. They will be used on next initialization.');
          this.hideModal();
        } catch (e) {
          alert('Failed to save settings: ' + (e.message || e.toString()));
        }
      });
    }, 50);
  }

  applyTemplate() {
    const selectedTemplate = document.querySelector('.template-card.selected');
    if (selectedTemplate) {
      const templateId = selectedTemplate.dataset.templateId;
      this.nodeEditor.loadTemplate(templateId);
      this.hideModal();
      this.switchView('editor');
    }
  }

  loadSelectedAgent() {
    const selectedAgent = document.querySelector('.agent-card.selected');
    if (selectedAgent) {
      const agentId = selectedAgent.dataset.agentId;
      this.loadAgent(agentId);
      this.hideModal();
    }
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM loaded, initializing Agent Arcades...');

  try {
    window.agentArcades = new AgentArcadesApp();
    console.log('✅ AgentArcadesApp instance created successfully');
  } catch (error) {
    console.error('❌ Failed to create AgentArcadesApp instance:', error);

    // Show error in loading screen
    const loadingStatus = document.getElementById('loading-status');
    if (loadingStatus) {
      loadingStatus.textContent = `Failed to start application: ${error.message}`;
      loadingStatus.style.color = '#ff6b35';
    }

    // Show retry button
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      const retryButton = document.createElement('button');
      retryButton.textContent = '🔄 Reload Page';
      retryButton.style.cssText = `
        margin-top: 2rem;
        padding: 1rem 2rem;
        background: linear-gradient(135deg, #00ff88 0%, #0066ff 100%);
        color: #0f0f1e;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
      `;
      retryButton.addEventListener('click', () => window.location.reload());
      loadingScreen.appendChild(retryButton);
    }
  }
});

// Handle module loading errors
window.addEventListener('error', (event) => {
  if (event.filename && event.filename.includes('.js')) {
    console.error('❌ Module loading error:', event.error);
    const loadingStatus = document.getElementById('loading-status');
    if (loadingStatus) {
      loadingStatus.textContent = `Failed to load module: ${event.filename}`;
      loadingStatus.style.color = '#ff6b35';
    }
  }
});

// Export for module usage
export { AgentArcadesApp };
