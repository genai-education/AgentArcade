/**
 * Scenario Management Module
 * Handles built-in scenarios, custom scenario creation, and execution
 */

class ScenarioManager {
  constructor() {
    this.scenarios = new Map();
    this.categories = new Map();
    this.difficulties = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    this.isInitialized = false;
  }

  async initialize() {
    this.loadBuiltInScenarios();
    this.initializeCategories();
    this.isInitialized = true;
    console.log('🎯 Scenario Manager initialized');
  }

  initializeCategories() {
    this.categories.set('debug', {
      name: 'Debug Challenges',
      description: 'Find and fix errors in code and systems',
      icon: '🐛',
      color: '#ff6b35'
    });

    this.categories.set('planning', {
      name: 'Planning Gauntlets',
      description: 'Create comprehensive plans and strategies',
      icon: '📋',
      color: '#9c27b0'
    });

    this.categories.set('analysis', {
      name: 'Analysis Competitions',
      description: 'Analyze data and extract insights',
      icon: '📊',
      color: '#2196f3'
    });

    this.categories.set('creative', {
      name: 'Creative Challenges',
      description: 'Open-ended problem solving and innovation',
      icon: '🎨',
      color: '#4caf50'
    });

    this.categories.set('coordination', {
      name: 'Team Coordination',
      description: 'Multi-agent collaboration challenges',
      icon: '🤝',
      color: '#ff9800'
    });
  }

  loadBuiltInScenarios() {
    // Debug Challenges
    this.register('debug_basic', {
      id: 'debug_basic',
      name: 'Debug Master Challenge',
      category: 'debug',
      difficulty: 'bronze',
      description: 'Find and fix 3 logical errors in the event planning system',
      objectives: [
        'Identify syntax errors in the code',
        'Fix logical inconsistencies in the planning algorithm',
        'Validate output correctness and completeness'
      ],
      timeLimit: 300, // 5 minutes
      environment: {
        type: 'code_debugging',
        codeBase: this.getEventPlanningCode(),
        expectedFixes: 3,
        testCases: this.getDebugTestCases()
      },
      scoring: {
        accuracy: 0.4,
        speed: 0.3,
        efficiency: 0.3
      },
      rewards: {
        completion: { type: 'chip', rarity: 'rare', category: 'logic' },
        perfect: { type: 'chip', rarity: 'epic', category: 'logic' }
      }
    });

    this.register('debug_advanced', {
      id: 'debug_advanced',
      name: 'Advanced Debug Challenge',
      category: 'debug',
      difficulty: 'gold',
      description: 'Debug a complex multi-threaded system with race conditions',
      objectives: [
        'Identify race conditions in concurrent code',
        'Fix memory leaks and resource management issues',
        'Optimize performance bottlenecks',
        'Ensure thread safety'
      ],
      timeLimit: 600, // 10 minutes
      environment: {
        type: 'advanced_debugging',
        codeBase: this.getAdvancedDebuggingCode(),
        expectedFixes: 5,
        testCases: this.getAdvancedTestCases()
      },
      scoring: {
        accuracy: 0.5,
        speed: 0.2,
        efficiency: 0.3
      }
    });

    // Planning Gauntlets
    this.register('planning_multi_step', {
      id: 'planning_multi_step',
      name: 'Multi-Step Planning Gauntlet',
      category: 'planning',
      difficulty: 'silver',
      description: 'Create a comprehensive plan for organizing a tech conference',
      objectives: [
        'Break down complex task into manageable subtasks',
        'Identify dependencies and critical path',
        'Allocate resources efficiently',
        'Create realistic timeline with milestones',
        'Plan for contingencies and risk mitigation'
      ],
      timeLimit: 600, // 10 minutes
      environment: {
        type: 'planning_simulation',
        context: this.getTechConferenceContext(),
        constraints: this.getConferenceConstraints(),
        resources: this.getAvailableResources()
      },
      scoring: {
        completeness: 0.3,
        feasibility: 0.3,
        optimization: 0.2,
        creativity: 0.2
      }
    });

    this.register('planning_complex', {
      id: 'planning_complex',
      name: 'Complex Strategic Planning',
      category: 'planning',
      difficulty: 'platinum',
      description: 'Develop a multi-year business strategy with market analysis',
      objectives: [
        'Analyze market trends and competitive landscape',
        'Develop strategic objectives and key results',
        'Create implementation roadmap',
        'Plan resource allocation and budget',
        'Design success metrics and KPIs'
      ],
      timeLimit: 900, // 15 minutes
      environment: {
        type: 'strategic_planning',
        context: this.getBusinessContext(),
        marketData: this.getMarketData(),
        constraints: this.getBusinessConstraints()
      },
      scoring: {
        strategic_thinking: 0.4,
        feasibility: 0.3,
        innovation: 0.2,
        execution_plan: 0.1
      }
    });

    // Analysis Competitions
    this.register('analysis_competition', {
      id: 'analysis_competition',
      name: 'Data Analysis Race',
      category: 'analysis',
      difficulty: 'silver',
      description: 'Analyze customer data to identify trends and insights',
      objectives: [
        'Clean and preprocess raw data',
        'Identify key patterns and trends',
        'Generate actionable insights',
        'Create data visualizations',
        'Present findings clearly'
      ],
      timeLimit: 450, // 7.5 minutes
      environment: {
        type: 'data_analysis',
        dataset: this.getCustomerDataset(),
        tools: ['statistical_analysis', 'visualization', 'machine_learning'],
        questions: this.getAnalysisQuestions()
      },
      scoring: {
        accuracy: 0.4,
        insight_quality: 0.3,
        presentation: 0.2,
        efficiency: 0.1
      }
    });

    // Creative Challenges
    this.register('creative_innovation', {
      id: 'creative_innovation',
      name: 'Innovation Challenge',
      category: 'creative',
      difficulty: 'gold',
      description: 'Design an innovative solution to urban transportation',
      objectives: [
        'Identify key transportation challenges',
        'Brainstorm creative solutions',
        'Evaluate feasibility and impact',
        'Design implementation strategy',
        'Consider sustainability and scalability'
      ],
      timeLimit: 720, // 12 minutes
      environment: {
        type: 'creative_design',
        context: this.getUrbanTransportContext(),
        constraints: this.getTransportConstraints(),
        evaluation_criteria: this.getInnovationCriteria()
      },
      scoring: {
        creativity: 0.4,
        feasibility: 0.3,
        impact: 0.2,
        sustainability: 0.1
      }
    });

    // Team Coordination
    this.register('coordination_complex', {
      id: 'coordination_complex',
      name: 'Multi-Agent Coordination Challenge',
      category: 'coordination',
      difficulty: 'platinum',
      description: 'Coordinate multiple agents to solve a complex logistics problem',
      objectives: [
        'Establish communication protocols',
        'Divide tasks efficiently among agents',
        'Coordinate timing and dependencies',
        'Handle conflicts and resource contention',
        'Optimize overall system performance'
      ],
      timeLimit: 600, // 10 minutes
      environment: {
        type: 'multi_agent_coordination',
        agents: 4,
        tasks: this.getLogisticsTasks(),
        resources: this.getSharedResources(),
        constraints: this.getCoordinationConstraints()
      },
      scoring: {
        coordination: 0.4,
        efficiency: 0.3,
        communication: 0.2,
        conflict_resolution: 0.1
      }
    });
  }

  register(id, scenarioConfig) {
    this.scenarios.set(id, new Scenario(scenarioConfig));
  }

  async load(scenarioId) {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }
    return scenario;
  }

  getScenariosByCategory(category) {
    return Array.from(this.scenarios.values())
      .filter(scenario => scenario.category === category);
  }

  getScenariosByDifficulty(difficulty) {
    return Array.from(this.scenarios.values())
      .filter(scenario => scenario.difficulty === difficulty);
  }

  getAllScenarios() {
    return Array.from(this.scenarios.values());
  }

  createCustomScenario(config) {
    const scenario = new Scenario({
      id: this.generateId(),
      name: config.name,
      category: config.category,
      difficulty: config.difficulty,
      description: config.description,
      objectives: config.objectives,
      timeLimit: config.timeLimit,
      environment: config.environment,
      scoring: config.scoring,
      custom: true,
      creator: config.creator,
      created: new Date().toISOString()
    });

    this.scenarios.set(scenario.id, scenario);
    return scenario;
  }

  // Context and data generators
  getEventPlanningCode() {
    return `
function planEvent(eventDetails) {
  // Bug 1: Missing null check
  const attendees = eventDetails.attendees;
  
  // Bug 2: Wrong comparison operator
  if (attendees = 0) {
    return "No attendees";
  }
  
  const venue = selectVenue(attendees);
  const catering = planCatering(attendees);
  
  // Bug 3: Missing return statement
  const schedule = createSchedule(eventDetails.duration);
}

function selectVenue(attendees) {
  if (attendees < 50) return "Small Room";
  if (attendees < 200) return "Conference Hall";
  return "Auditorium";
}
    `.trim();
  }

  getDebugTestCases() {
    return [
      {
        input: { attendees: 25, duration: 4 },
        expected: { venue: "Small Room", catering: "Light refreshments" }
      },
      {
        input: { attendees: 0, duration: 2 },
        expected: "No attendees"
      },
      {
        input: { attendees: 150, duration: 8 },
        expected: { venue: "Conference Hall", catering: "Full meal service" }
      }
    ];
  }

  getAdvancedDebuggingCode() {
    return `
class ThreadSafeCounter {
  constructor() {
    this.count = 0;
    // Missing: this.lock = new Mutex();
  }
  
  increment() {
    // Race condition: not thread-safe
    const temp = this.count;
    setTimeout(() => {
      this.count = temp + 1;
    }, 0);
  }
  
  // Memory leak: event listeners not cleaned up
  startMonitoring() {
    setInterval(() => {
      console.log(this.count);
    }, 1000);
  }
}
    `.trim();
  }

  getAdvancedTestCases() {
    return [
      {
        description: "Concurrent increment operations should be atomic",
        test: "concurrency_test"
      },
      {
        description: "Memory usage should remain stable",
        test: "memory_leak_test"
      }
    ];
  }

  getTechConferenceContext() {
    return {
      event: "Tech Innovation Summit 2024",
      expectedAttendees: 500,
      duration: "3 days",
      budget: 150000,
      location: "San Francisco",
      themes: ["AI", "Blockchain", "Sustainability", "Future of Work"]
    };
  }

  getConferenceConstraints() {
    return {
      venue_capacity: { min: 400, max: 600 },
      budget_limit: 150000,
      timeline: "6 months preparation",
      speaker_budget: 50000,
      catering_budget: 30000,
      marketing_budget: 20000
    };
  }

  getAvailableResources() {
    return {
      team_members: 8,
      vendors: ["catering", "av_equipment", "marketing", "security"],
      venues: ["Convention Center", "Hotel Ballroom", "University Campus"],
      sponsors: ["TechCorp", "InnovateLabs", "FutureVentures"]
    };
  }

  getBusinessContext() {
    return {
      company: "TechStartup Inc.",
      industry: "SaaS",
      current_revenue: 5000000,
      employees: 50,
      market_position: "emerging player",
      competitors: ["BigTech Corp", "EstablishedSaaS", "NewEntrant"]
    };
  }

  getMarketData() {
    return {
      market_size: 50000000000,
      growth_rate: 0.15,
      trends: ["AI integration", "Remote work tools", "Security focus"],
      customer_segments: ["SMB", "Enterprise", "Government"]
    };
  }

  getBusinessConstraints() {
    return {
      funding: 10000000,
      timeline: "3 years",
      regulatory: ["GDPR", "SOC2", "HIPAA"],
      technical_debt: "moderate"
    };
  }

  getCustomerDataset() {
    return {
      records: 10000,
      fields: ["age", "location", "purchase_history", "engagement", "satisfaction"],
      format: "CSV",
      quality_issues: ["missing_values", "duplicates", "outliers"]
    };
  }

  getAnalysisQuestions() {
    return [
      "What are the key customer segments?",
      "Which factors drive customer satisfaction?",
      "What are the seasonal trends in purchases?",
      "How can we improve customer retention?"
    ];
  }

  getUrbanTransportContext() {
    return {
      city: "Metropolitan Area",
      population: 2000000,
      current_issues: ["traffic congestion", "air pollution", "limited parking", "public transport gaps"],
      budget: 500000000,
      timeline: "10 years"
    };
  }

  getTransportConstraints() {
    return {
      environmental_impact: "must reduce by 40%",
      accessibility: "full ADA compliance",
      cost_per_mile: "under $2",
      implementation_time: "phased over 10 years"
    };
  }

  getInnovationCriteria() {
    return {
      novelty: "unique approach or technology",
      impact: "significant improvement over status quo",
      feasibility: "technically and economically viable",
      scalability: "can be replicated in other cities"
    };
  }

  getLogisticsTasks() {
    return [
      { id: "pickup_A", location: [10, 20], priority: "high", duration: 30 },
      { id: "delivery_B", location: [50, 60], priority: "medium", duration: 20 },
      { id: "pickup_C", location: [30, 40], priority: "low", duration: 25 },
      { id: "delivery_D", location: [70, 80], priority: "high", duration: 35 }
    ];
  }

  getSharedResources() {
    return {
      vehicles: 2,
      drivers: 2,
      fuel_budget: 500,
      time_limit: 480 // 8 hours
    };
  }

  getCoordinationConstraints() {
    return {
      max_distance_per_vehicle: 200,
      max_tasks_per_agent: 3,
      communication_delay: 5, // seconds
      coordination_overhead: 0.1 // 10% time penalty for coordination
    };
  }

  generateId() {
    return 'scenario_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// Scenario class
class Scenario {
  constructor(config) {
    Object.assign(this, config);
    this.executions = [];
  }

  async execute(agent, context = {}) {
    const execution = new ScenarioExecution(this, agent, context);
    this.executions.push(execution);
    return await execution.run();
  }

  getAverageScore() {
    if (this.executions.length === 0) return 0;
    const totalScore = this.executions.reduce((sum, exec) => sum + (exec.score || 0), 0);
    return totalScore / this.executions.length;
  }

  getBestScore() {
    if (this.executions.length === 0) return 0;
    return Math.max(...this.executions.map(exec => exec.score || 0));
  }

  getCompletionRate() {
    if (this.executions.length === 0) return 0;
    const completed = this.executions.filter(exec => exec.completed).length;
    return completed / this.executions.length;
  }
}

// Scenario Execution class
class ScenarioExecution {
  constructor(scenario, agent, context = {}) {
    this.scenario = scenario;
    this.agent = agent;
    this.context = context;
    this.startTime = null;
    this.endTime = null;
    this.steps = [];
    this.score = 0;
    this.completed = false;
    this.metrics = new ExecutionMetrics();
  }

  async run() {
    this.startTime = Date.now();
    
    try {
      // Initialize scenario context
      const scenarioContext = this.buildScenarioContext();
      
      // Execute scenario-specific logic
      switch (this.scenario.environment.type) {
        case 'code_debugging':
          return await this.runDebuggingScenario(scenarioContext);
        case 'planning_simulation':
          return await this.runPlanningScenario(scenarioContext);
        case 'data_analysis':
          return await this.runAnalysisScenario(scenarioContext);
        case 'creative_design':
          return await this.runCreativeScenario(scenarioContext);
        case 'multi_agent_coordination':
          return await this.runCoordinationScenario(scenarioContext);
        default:
          return await this.runGenericScenario(scenarioContext);
      }
      
    } catch (error) {
      this.endTime = Date.now();
      return this.generateErrorResults(error);
    }
  }

  buildScenarioContext() {
    return {
      scenario: this.scenario,
      objectives: this.scenario.objectives,
      timeLimit: this.scenario.timeLimit,
      environment: this.scenario.environment,
      constraints: this.scenario.environment.constraints || {},
      resources: this.scenario.environment.resources || {},
      startTime: this.startTime
    };
  }

  async runGenericScenario(context) {
    // Generic scenario execution
    let step = 0;
    const maxSteps = 10;
    
    while (step < maxSteps && !this.isComplete() && !this.isTimedOut()) {
      const decision = await this.agent.makeDecision(context);
      const result = this.applyDecision(decision, context);
      
      this.steps.push({
        step: step + 1,
        decision,
        result,
        timestamp: Date.now() - this.startTime
      });
      
      this.updateContext(context, result);
      this.metrics.recordStep(decision, result);
      
      step++;
    }
    
    this.endTime = Date.now();
    return this.generateResults();
  }

  async runDebuggingScenario(context) {
    // Debugging-specific execution logic
    const codeBase = context.environment.codeBase;
    const expectedFixes = context.environment.expectedFixes;
    
    let fixesFound = 0;
    let step = 0;
    
    while (step < 5 && fixesFound < expectedFixes && !this.isTimedOut()) {
      const debugContext = {
        ...context,
        codeBase: codeBase,
        fixesFound: fixesFound,
        remainingFixes: expectedFixes - fixesFound
      };
      
      const decision = await this.agent.makeDecision(debugContext);
      const result = this.evaluateDebugDecision(decision, context.environment.testCases);
      
      if (result.fixFound) {
        fixesFound++;
      }
      
      this.steps.push({
        step: step + 1,
        decision,
        result,
        fixesFound,
        timestamp: Date.now() - this.startTime
      });
      
      step++;
    }
    
    this.completed = fixesFound >= expectedFixes;
    this.endTime = Date.now();
    return this.generateResults();
  }

  evaluateDebugDecision(decision, testCases) {
    // Evaluate if the debugging decision is correct
    // This would involve running test cases and checking fixes
    return {
      fixFound: Math.random() < 0.7, // 70% chance of finding a fix
      testsPassed: Math.floor(Math.random() * testCases.length),
      feedback: "Fix attempt evaluated"
    };
  }

  applyDecision(decision, context) {
    // Apply agent decision to scenario state
    return {
      success: true,
      feedback: "Decision applied successfully",
      impact: Math.random() * 10
    };
  }

  updateContext(context, result) {
    // Update scenario context based on result
    context.lastResult = result;
    context.stepCount = this.steps.length;
  }

  isComplete() {
    // Check if scenario objectives are met
    return this.steps.length >= 5; // Simple completion check
  }

  isTimedOut() {
    if (!this.scenario.timeLimit) return false;
    const elapsed = Date.now() - this.startTime;
    return elapsed > (this.scenario.timeLimit * 1000);
  }

  generateResults() {
    const duration = this.endTime - this.startTime;
    this.score = this.calculateScore();
    
    return {
      scenarioId: this.scenario.id,
      agentId: this.agent.id,
      success: this.completed,
      score: this.score,
      duration: duration,
      steps: this.steps.length,
      objectives: this.evaluateObjectives(),
      metrics: this.metrics.getResults(),
      replay: this.generateReplay()
    };
  }

  calculateScore() {
    const scoring = this.scenario.scoring;
    let totalScore = 0;
    
    // Calculate score based on scenario-specific criteria
    Object.entries(scoring).forEach(([criterion, weight]) => {
      const criterionScore = this.calculateCriterionScore(criterion);
      totalScore += criterionScore * weight;
    });
    
    return Math.round(totalScore * 100); // Score out of 100
  }

  calculateCriterionScore(criterion) {
    switch (criterion) {
      case 'accuracy':
        return this.completed ? 1.0 : 0.5;
      case 'speed':
        const timeRatio = (Date.now() - this.startTime) / (this.scenario.timeLimit * 1000);
        return Math.max(0, 1 - timeRatio);
      case 'efficiency':
        return Math.max(0, 1 - (this.steps.length / 10));
      default:
        return Math.random(); // Random score for unknown criteria
    }
  }

  evaluateObjectives() {
    return this.scenario.objectives.map(objective => ({
      objective,
      completed: Math.random() < 0.8, // 80% chance of completion
      score: Math.random()
    }));
  }

  generateReplay() {
    return {
      steps: this.steps,
      timeline: this.steps.map(step => ({
        time: step.timestamp,
        action: step.decision.action,
        result: step.result.feedback
      }))
    };
  }

  generateErrorResults(error) {
    return {
      scenarioId: this.scenario.id,
      agentId: this.agent.id,
      success: false,
      error: error.message,
      score: 0,
      duration: Date.now() - this.startTime,
      steps: this.steps.length
    };
  }

  // Placeholder methods for specific scenario types
  async runPlanningScenario(context) { return this.runGenericScenario(context); }
  async runAnalysisScenario(context) { return this.runGenericScenario(context); }
  async runCreativeScenario(context) { return this.runGenericScenario(context); }
  async runCoordinationScenario(context) { return this.runGenericScenario(context); }
}

// Execution Metrics class
class ExecutionMetrics {
  constructor() {
    this.steps = 0;
    this.decisions = [];
    this.results = [];
    this.startTime = Date.now();
  }

  recordStep(decision, result) {
    this.steps++;
    this.decisions.push(decision);
    this.results.push(result);
  }

  getResults() {
    return {
      totalSteps: this.steps,
      averageStepTime: this.getAverageStepTime(),
      successRate: this.getSuccessRate(),
      decisionTypes: this.getDecisionTypes()
    };
  }

  getAverageStepTime() {
    if (this.steps === 0) return 0;
    const totalTime = Date.now() - this.startTime;
    return totalTime / this.steps;
  }

  getSuccessRate() {
    if (this.results.length === 0) return 0;
    const successful = this.results.filter(r => r.success).length;
    return successful / this.results.length;
  }

  getDecisionTypes() {
    const types = {};
    this.decisions.forEach(decision => {
      const type = decision.action || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });
    return types;
  }
}

export { ScenarioManager, Scenario, ScenarioExecution, ExecutionMetrics };
