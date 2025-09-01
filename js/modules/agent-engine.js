/**
 * Agent Engine Module
 * Handles multi-agent simulation and arena visualization
 */

class AgentEngine {
  constructor() {
    this.webLLM = null;
    this.activeSimulation = null;
    this.agents = new Map();
    this.arenaCanvas = null;
    this.arenaCtx = null;
    this.scenarios = null;
    this.metrics = new PerformanceMetrics();
    
    // Simulation state
    this.isRunning = false;
    this.isPaused = false;
    this.simulationSpeed = 1.0;
    this.currentStep = 0;
    this.maxSteps = 1000;
    
    // Arena visualization
    this.viewport = {
      x: 0,
      y: 0,
      zoom: 1,
      width: 800,
      height: 600
    };
    
    // Animation
    this.animationFrame = null;
    this.lastUpdate = 0;
    
    // Event callbacks
    this.onSimulationUpdate = null;
    this.onSimulationComplete = null;
  }

  async initialize(webLLMIntegration) {
    this.webLLM = webLLMIntegration;
    console.log('🤖 Agent Engine initialized');
  }

  async initializeArena(canvasElement) {
    this.arenaCanvas = canvasElement;
    this.arenaCtx = canvasElement.getContext('2d');
    
    // Set canvas size
    this.resizeArena();
    
    // Setup event listeners
    this.setupArenaEventListeners();
    
    // Start render loop
    this.startArenaRenderLoop();
    
    console.log('🏟️ Arena initialized');
  }

  setupArenaEventListeners() {
    if (!this.arenaCanvas) return;
    
    // Mouse events for arena interaction
    this.arenaCanvas.addEventListener('mousedown', this.handleArenaMouseDown.bind(this));
    this.arenaCanvas.addEventListener('mousemove', this.handleArenaMouseMove.bind(this));
    this.arenaCanvas.addEventListener('mouseup', this.handleArenaMouseUp.bind(this));
    this.arenaCanvas.addEventListener('wheel', this.handleArenaWheel.bind(this));
    
    // Touch events
    this.arenaCanvas.addEventListener('touchstart', this.handleArenaTouchStart.bind(this));
    this.arenaCanvas.addEventListener('touchmove', this.handleArenaTouchMove.bind(this));
    this.arenaCanvas.addEventListener('touchend', this.handleArenaTouchEnd.bind(this));
  }

  async startSimulation(agentConfigs, scenarioId) {
    if (this.isRunning) {
      throw new Error('Simulation already running');
    }
    
    try {
      // Load scenario
      const scenario = await this.loadScenario(scenarioId);
      
      // Create simulation
      const simulation = new Simulation(scenario);
      
      // Initialize agents
      for (const config of agentConfigs) {
        const agent = new Agent(config, this.webLLM);
        await agent.initialize();
        simulation.addAgent(agent);
        this.agents.set(agent.id, agent);
      }
      
      this.activeSimulation = simulation;
      this.isRunning = true;
      this.isPaused = false;
      this.currentStep = 0;
      
      // Start simulation loop
      this.runSimulationLoop();
      
      return simulation;
      
    } catch (error) {
      console.error('Failed to start simulation:', error);
      throw error;
    }
  }

  async runSimulationLoop() {
    while (this.isRunning && this.currentStep < this.maxSteps) {
      if (this.isPaused) {
        await this.sleep(100);
        continue;
      }
      
      try {
        // Process simulation step
        await this.processSimulationStep();
        
        // Update metrics
        this.metrics.recordStep(this.activeSimulation);
        
        // Check completion conditions
        if (this.activeSimulation.isComplete()) {
          await this.completeSimulation();
          break;
        }
        
        // Control simulation speed
        const stepDelay = Math.max(50, 1000 / this.simulationSpeed);
        await this.sleep(stepDelay);
        
        this.currentStep++;
        
      } catch (error) {
        console.error('Simulation step failed:', error);
        this.handleSimulationError(error);
        break;
      }
    }
    
    if (this.currentStep >= this.maxSteps) {
      await this.completeSimulation('timeout');
    }
  }

  async processSimulationStep() {
    const simulation = this.activeSimulation;
    
    // Process each agent's turn
    for (const agent of simulation.agents) {
      if (!agent.isActive()) continue;
      
      try {
        // Get current context for agent
        const context = simulation.getContextForAgent(agent);
        
        // Agent makes decision
        const decision = await agent.makeDecision(context);
        
        // Apply decision to simulation
        const result = simulation.applyDecision(agent, decision);
        
        // Update agent state
        agent.updateState(result);
        
      } catch (error) {
        console.error(`Agent ${agent.id} decision failed:`, error);
        agent.setState('error', error.message);
      }
    }
    
    // Update simulation state
    simulation.step();
    
    // Broadcast update
    if (this.onSimulationUpdate) {
      this.onSimulationUpdate(simulation.getState());
    }
  }

  async completeSimulation(reason = 'completed') {
    this.isRunning = false;
    
    if (this.activeSimulation) {
      const results = this.activeSimulation.getResults();
      results.reason = reason;
      results.totalSteps = this.currentStep;
      results.metrics = this.metrics.getResults();
      
      // Broadcast completion
      if (this.onSimulationComplete) {
        this.onSimulationComplete(results);
      }
      
      console.log('🏁 Simulation completed:', results);
      return results;
    }
  }

  pauseSimulation() {
    this.isPaused = true;
  }

  resumeSimulation() {
    this.isPaused = false;
  }

  stopSimulation() {
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.activeSimulation) {
      this.completeSimulation('stopped');
    }
  }

  setSimulationSpeed(speed) {
    this.simulationSpeed = Math.max(0.1, Math.min(5.0, speed));
  }

  startArenaRenderLoop() {
    const render = (timestamp) => {
      const deltaTime = timestamp - this.lastUpdate;
      this.lastUpdate = timestamp;
      
      this.updateArena(deltaTime);
      this.renderArena();
      
      this.animationFrame = requestAnimationFrame(render);
    };
    
    this.animationFrame = requestAnimationFrame(render);
  }

  updateArena(deltaTime) {
    // Update agent positions and states
    for (const agent of this.agents.values()) {
      agent.update(deltaTime);
    }
    
    // Update simulation visualization
    if (this.activeSimulation) {
      this.activeSimulation.updateVisualization(deltaTime);
    }
  }

  renderArena() {
    if (!this.arenaCtx) return;
    
    // Clear canvas
    this.arenaCtx.clearRect(0, 0, this.viewport.width, this.viewport.height);
    
    // Apply viewport transformation
    this.arenaCtx.save();
    this.arenaCtx.translate(this.viewport.x, this.viewport.y);
    this.arenaCtx.scale(this.viewport.zoom, this.viewport.zoom);
    
    // Render background grid
    this.renderArenaGrid();
    
    // Render scenario environment
    if (this.activeSimulation) {
      this.renderScenarioEnvironment(this.activeSimulation.scenario);
    }
    
    // Render agents
    this.renderAgents();
    
    // Render data flow
    this.renderDataFlow();
    
    this.arenaCtx.restore();
    
    // Render UI overlay
    this.renderArenaUI();
  }

  renderArenaGrid() {
    const gridSize = 40;
    const startX = Math.floor(-this.viewport.x / this.viewport.zoom / gridSize) * gridSize;
    const startY = Math.floor(-this.viewport.y / this.viewport.zoom / gridSize) * gridSize;
    const endX = startX + (this.viewport.width / this.viewport.zoom) + gridSize;
    const endY = startY + (this.viewport.height / this.viewport.zoom) + gridSize;
    
    this.arenaCtx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
    this.arenaCtx.lineWidth = 1;
    
    this.arenaCtx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      this.arenaCtx.moveTo(x, startY);
      this.arenaCtx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      this.arenaCtx.moveTo(startX, y);
      this.arenaCtx.lineTo(endX, y);
    }
    this.arenaCtx.stroke();
  }

  renderAgents() {
    for (const agent of this.agents.values()) {
      this.renderAgent(agent);
    }
  }

  renderAgent(agent) {
    const pos = agent.getPosition();
    const state = agent.getState();
    
    // Agent body
    this.arenaCtx.fillStyle = this.getAgentColor(agent);
    this.arenaCtx.strokeStyle = this.getAgentBorderColor(agent, state);
    this.arenaCtx.lineWidth = 2;
    
    this.arenaCtx.beginPath();
    this.arenaCtx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
    this.arenaCtx.fill();
    this.arenaCtx.stroke();
    
    // Agent label
    this.arenaCtx.fillStyle = '#ffffff';
    this.arenaCtx.font = 'bold 12px Arial';
    this.arenaCtx.textAlign = 'center';
    this.arenaCtx.fillText(agent.name.charAt(0).toUpperCase(), pos.x, pos.y + 4);
    
    // Status indicator
    this.renderAgentStatusIndicator(agent, pos);
    
    // Progress bar
    this.renderAgentProgressBar(agent, pos);
    
    // Thought bubble (if active)
    if (state === 'thinking' || state === 'acting') {
      this.renderAgentThoughtBubble(agent, pos);
    }
  }

  renderAgentStatusIndicator(agent, pos) {
    const state = agent.getState();
    const colors = {
      thinking: '#FFD700',
      acting: '#00FF00',
      waiting: '#808080',
      error: '#FF0000',
      idle: '#CCCCCC'
    };
    
    this.arenaCtx.fillStyle = colors[state] || colors.idle;
    this.arenaCtx.beginPath();
    this.arenaCtx.arc(pos.x + 15, pos.y - 15, 5, 0, Math.PI * 2);
    this.arenaCtx.fill();
  }

  renderAgentProgressBar(agent, pos) {
    const progress = agent.getProgress();
    if (progress <= 0) return;
    
    const barWidth = 40;
    const barHeight = 4;
    const barX = pos.x - barWidth / 2;
    const barY = pos.y + 30;
    
    // Background
    this.arenaCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.arenaCtx.fillRect(barX, barY, barWidth, barHeight);
    
    // Progress
    this.arenaCtx.fillStyle = '#00ff88';
    this.arenaCtx.fillRect(barX, barY, barWidth * progress, barHeight);
  }

  renderAgentThoughtBubble(agent, pos) {
    const currentAction = agent.getCurrentAction();
    if (!currentAction) return;
    
    const bubbleX = pos.x;
    const bubbleY = pos.y - 40;
    const bubbleWidth = 100;
    const bubbleHeight = 20;
    
    // Bubble background
    this.arenaCtx.fillStyle = 'rgba(26, 26, 46, 0.9)';
    this.arenaCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.arenaCtx.lineWidth = 1;
    
    this.arenaCtx.fillRect(bubbleX - bubbleWidth/2, bubbleY - bubbleHeight/2, bubbleWidth, bubbleHeight);
    this.arenaCtx.strokeRect(bubbleX - bubbleWidth/2, bubbleY - bubbleHeight/2, bubbleWidth, bubbleHeight);
    
    // Bubble text
    this.arenaCtx.fillStyle = '#ffffff';
    this.arenaCtx.font = '10px Arial';
    this.arenaCtx.textAlign = 'center';
    this.arenaCtx.fillText(currentAction.substring(0, 15) + '...', bubbleX, bubbleY + 3);
  }

  getAgentColor(agent) {
    // Generate consistent color based on agent ID
    const hash = this.hashString(agent.id);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }

  getAgentBorderColor(agent, state) {
    switch (state) {
      case 'thinking': return '#FFD700';
      case 'acting': return '#00FF00';
      case 'error': return '#FF0000';
      default: return '#ffffff';
    }
  }

  renderScenarioEnvironment(scenario) {
    if (!scenario || !scenario.environment) return;
    
    // Render scenario-specific environment elements
    scenario.environment.objects?.forEach(obj => {
      this.renderEnvironmentObject(obj);
    });
  }

  renderEnvironmentObject(obj) {
    this.arenaCtx.fillStyle = obj.color || '#666666';
    this.arenaCtx.strokeStyle = obj.interactive ? '#00ff88' : '#333333';
    this.arenaCtx.lineWidth = 1;
    
    switch (obj.type) {
      case 'rectangle':
        this.arenaCtx.fillRect(obj.x, obj.y, obj.width, obj.height);
        this.arenaCtx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        break;
      case 'circle':
        this.arenaCtx.beginPath();
        this.arenaCtx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
        this.arenaCtx.fill();
        this.arenaCtx.stroke();
        break;
    }
    
    // Object label
    if (obj.label) {
      this.arenaCtx.fillStyle = '#ffffff';
      this.arenaCtx.font = '10px Arial';
      this.arenaCtx.textAlign = 'center';
      this.arenaCtx.fillText(obj.label, obj.x, obj.y - 10);
    }
  }

  renderDataFlow() {
    // Render data flow between agents
    if (!this.activeSimulation) return;
    
    const dataFlows = this.activeSimulation.getDataFlows();
    dataFlows.forEach(flow => {
      this.renderDataFlowLine(flow);
    });
  }

  renderDataFlowLine(flow) {
    const fromAgent = this.agents.get(flow.from);
    const toAgent = this.agents.get(flow.to);
    
    if (!fromAgent || !toAgent) return;
    
    const fromPos = fromAgent.getPosition();
    const toPos = toAgent.getPosition();
    
    this.arenaCtx.strokeStyle = '#0066ff';
    this.arenaCtx.lineWidth = 2;
    this.arenaCtx.setLineDash([5, 5]);
    
    this.arenaCtx.beginPath();
    this.arenaCtx.moveTo(fromPos.x, fromPos.y);
    this.arenaCtx.lineTo(toPos.x, toPos.y);
    this.arenaCtx.stroke();
    
    this.arenaCtx.setLineDash([]);
    
    // Animate data packet
    const progress = (Date.now() % 2000) / 2000;
    const packetX = fromPos.x + (toPos.x - fromPos.x) * progress;
    const packetY = fromPos.y + (toPos.y - fromPos.y) * progress;
    
    this.arenaCtx.fillStyle = '#0066ff';
    this.arenaCtx.beginPath();
    this.arenaCtx.arc(packetX, packetY, 3, 0, Math.PI * 2);
    this.arenaCtx.fill();
  }

  renderArenaUI() {
    // Render any UI overlays on the arena
  }

  async loadScenario(scenarioId) {
    // Load scenario from scenarios module
    if (this.scenarios) {
      return await this.scenarios.load(scenarioId);
    }
    
    // Fallback basic scenario
    return {
      id: scenarioId,
      name: 'Basic Scenario',
      description: 'A simple test scenario',
      environment: {
        objects: []
      },
      objectives: ['Complete the task'],
      constraints: [],
      timeLimit: 300
    };
  }

  // Event handlers
  handleArenaMouseDown(e) {
    // Handle arena mouse interactions
  }

  handleArenaMouseMove(e) {
    // Handle arena mouse movement
  }

  handleArenaMouseUp(e) {
    // Handle arena mouse release
  }

  handleArenaWheel(e) {
    // Handle arena zoom
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.viewport.zoom = Math.max(0.1, Math.min(3.0, this.viewport.zoom * zoomFactor));
  }

  // Touch event handlers
  handleArenaTouchStart(e) { /* TODO */ }
  handleArenaTouchMove(e) { /* TODO */ }
  handleArenaTouchEnd(e) { /* TODO */ }

  // Utility methods
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  resizeArena() {
    if (!this.arenaCanvas) return;
    
    const rect = this.arenaCanvas.parentElement.getBoundingClientRect();
    this.arenaCanvas.width = rect.width;
    this.arenaCanvas.height = rect.height;
    this.viewport.width = rect.width;
    this.viewport.height = rect.height;
  }

  handleResize() {
    this.resizeArena();
  }

  refreshArena() {
    // Refresh arena display
    this.resizeArena();
  }

  handleSimulationError(error) {
    console.error('Simulation error:', error);
    this.stopSimulation();
  }
}

// Supporting classes
class Simulation {
  constructor(scenario) {
    this.scenario = scenario;
    this.agents = [];
    this.state = 'initializing';
    this.startTime = null;
    this.endTime = null;
    this.currentStep = 0;
    this.dataFlows = [];
  }

  addAgent(agent) {
    this.agents.push(agent);
  }

  getContextForAgent(agent) {
    return {
      scenario: this.scenario,
      currentStep: this.currentStep,
      otherAgents: this.agents.filter(a => a.id !== agent.id),
      environment: this.scenario.environment,
      timeRemaining: this.getTimeRemaining()
    };
  }

  applyDecision(agent, decision) {
    // Apply agent decision to simulation state
    return {
      success: true,
      result: decision.action,
      feedback: 'Action completed successfully'
    };
  }

  step() {
    this.currentStep++;
  }

  isComplete() {
    // Check if simulation should end
    return this.agents.every(agent => agent.isComplete()) || 
           this.currentStep >= 1000;
  }

  getResults() {
    return {
      scenario: this.scenario.id,
      agents: this.agents.map(a => a.getResults()),
      totalSteps: this.currentStep,
      duration: this.endTime - this.startTime,
      success: this.agents.some(a => a.isSuccessful())
    };
  }

  getState() {
    return {
      step: this.currentStep,
      agents: this.agents.map(a => a.getState()),
      dataFlows: this.dataFlows
    };
  }

  getDataFlows() {
    return this.dataFlows;
  }

  getTimeRemaining() {
    return Math.max(0, this.scenario.timeLimit - this.currentStep);
  }

  updateVisualization(deltaTime) {
    // Update visualization elements
  }
}

class Agent {
  constructor(config, webLLM) {
    this.id = config.id || this.generateId();
    this.name = config.name || 'Agent';
    this.config = config;
    this.webLLM = webLLM;
    this.state = 'idle';
    this.position = { x: Math.random() * 400 + 200, y: Math.random() * 300 + 150 };
    this.progress = 0;
    this.currentAction = null;
    this.results = [];
  }

  async initialize() {
    this.state = 'ready';
  }

  async makeDecision(context) {
    this.state = 'thinking';
    this.currentAction = 'Analyzing situation...';
    
    try {
      const decision = await this.webLLM.processAgentDecision(context, this.config);
      this.state = 'acting';
      this.currentAction = decision.action;
      return decision;
    } catch (error) {
      this.state = 'error';
      this.currentAction = 'Error occurred';
      throw error;
    }
  }

  updateState(result) {
    this.results.push(result);
    this.progress = Math.min(1, this.results.length / 10);
    this.state = 'waiting';
    this.currentAction = null;
  }

  update(deltaTime) {
    // Update agent animation, position, etc.
  }

  getPosition() {
    return this.position;
  }

  getState() {
    return this.state;
  }

  setState(state, message) {
    this.state = state;
    if (message) {
      this.currentAction = message;
    }
  }

  getProgress() {
    return this.progress;
  }

  getCurrentAction() {
    return this.currentAction;
  }

  isActive() {
    return ['ready', 'thinking', 'acting', 'waiting'].includes(this.state);
  }

  isComplete() {
    return this.state === 'complete' || this.results.length >= 10;
  }

  isSuccessful() {
    return this.results.some(r => r.success);
  }

  getResults() {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      progress: this.progress,
      results: this.results
    };
  }

  generateId() {
    return 'agent_' + Math.random().toString(36).substr(2, 9);
  }
}

class PerformanceMetrics {
  constructor() {
    this.metrics = {
      totalSteps: 0,
      averageStepTime: 0,
      agentPerformance: new Map(),
      errors: []
    };
  }

  recordStep(simulation) {
    this.metrics.totalSteps++;
    // Record step metrics
  }

  getResults() {
    return this.metrics;
  }
}

export { AgentEngine, Simulation, Agent, PerformanceMetrics };
