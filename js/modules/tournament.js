/**
 * Tournament Management Module
 * Handles tournament creation, bracket generation, and competition management
 */

class TournamentManager {
  constructor() {
    this.storage = null;
    this.activeTournaments = new Map();
    this.brackets = new BracketGenerator();
    this.leaderboards = new LeaderboardManager();
    this.isInitialized = false;
    
    // Tournament types
    this.tournamentTypes = {
      'single-elimination': {
        name: 'Single Elimination',
        description: 'Fast knockout tournament',
        minParticipants: 4,
        maxParticipants: 64
      },
      'round-robin': {
        name: 'Round Robin',
        description: 'Everyone plays everyone',
        minParticipants: 3,
        maxParticipants: 16
      },
      'gauntlet': {
        name: 'Gauntlet Mode',
        description: 'Progressive difficulty challenges',
        minParticipants: 1,
        maxParticipants: 1
      },
      'team-battle': {
        name: 'Team Battle',
        description: 'Multi-agent team coordination',
        minParticipants: 4,
        maxParticipants: 32
      }
    };
    
    // Built-in tournaments
    this.featuredTournaments = [];
    this.initializeFeaturedTournaments();
  }

  async initialize(storageManager) {
    this.storage = storageManager;
    
    // Load active tournaments
    await this.loadActiveTournaments();
    
    // Initialize bracket generator
    this.brackets.initialize();
    
    // Initialize leaderboards
    await this.leaderboards.initialize(storageManager);
    
    // Setup featured tournaments
    await this.setupFeaturedTournaments();
    
    this.isInitialized = true;
    console.log('🏆 Tournament Manager initialized');
  }

  async loadActiveTournaments() {
    try {
      const tournaments = await this.storage.getTournaments('active');
      tournaments.forEach(tournament => {
        this.activeTournaments.set(tournament.id, new Tournament(tournament));
      });
    } catch (error) {
      console.warn('Failed to load active tournaments:', error);
    }
  }

  initializeFeaturedTournaments() {
    this.featuredTournaments = [
      {
        id: 'debug_master_challenge',
        name: 'Debug Master Challenge',
        description: 'Find and fix errors in complex systems',
        type: 'gauntlet',
        scenario: 'debug_advanced',
        tier: 'legendary',
        duration: 7 * 24 * 60 * 60 * 1000, // 7 days
        rewards: {
          winner: { type: 'chip', rarity: 'legendary', category: 'logic' },
          participant: { type: 'chip', rarity: 'rare', category: 'processing' }
        },
        requirements: {
          minLevel: 5,
          completedTournaments: 3
        }
      },
      {
        id: 'planning_championship',
        name: 'Planning Championship',
        description: 'Master the art of strategic planning',
        type: 'single-elimination',
        scenario: 'planning_complex',
        tier: 'epic',
        duration: 5 * 24 * 60 * 60 * 1000, // 5 days
        rewards: {
          winner: { type: 'chip', rarity: 'epic', category: 'logic' },
          finalist: { type: 'chip', rarity: 'rare', category: 'memory' },
          participant: { type: 'chip', rarity: 'common', category: 'processing' }
        }
      },
      {
        id: 'team_coordination_cup',
        name: 'Team Coordination Cup',
        description: 'Multi-agent teamwork challenge',
        type: 'team-battle',
        scenario: 'coordination_complex',
        tier: 'epic',
        duration: 3 * 24 * 60 * 60 * 1000, // 3 days
        rewards: {
          winner: { type: 'chip', rarity: 'epic', category: 'synergy' },
          participant: { type: 'chip', rarity: 'rare', category: 'synergy' }
        }
      }
    ];
  }

  async setupFeaturedTournaments() {
    for (const tournamentConfig of this.featuredTournaments) {
      // Check if tournament already exists
      const existing = await this.storage.getTournament(tournamentConfig.id);
      if (!existing) {
        await this.createFeaturedTournament(tournamentConfig);
      }
    }
  }

  async createFeaturedTournament(config) {
    const tournament = {
      ...config,
      status: 'registration',
      participants: [],
      bracket: null,
      matches: [],
      created: new Date().toISOString(),
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Start tomorrow
      endTime: new Date(Date.now() + config.duration).toISOString(),
      featured: true
    };
    
    await this.storage.saveTournament(tournament);
    this.activeTournaments.set(tournament.id, new Tournament(tournament));
  }

  createTournament(config) {
    const tournament = new Tournament({
      id: this.generateId(),
      name: config.name,
      description: config.description || '',
      type: config.type,
      scenario: config.scenario,
      tier: config.tier || 'common',
      maxParticipants: config.maxParticipants || 16,
      participants: [],
      bracket: null,
      matches: [],
      status: 'registration',
      created: new Date().toISOString(),
      createdBy: config.createdBy,
      rewards: config.rewards || this.getDefaultRewards(config.tier),
      requirements: config.requirements || {}
    });

    this.activeTournaments.set(tournament.id, tournament);
    return tournament;
  }

  async joinTournament(tournamentId, agentId) {
    const tournament = this.activeTournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'registration') {
      throw new Error('Tournament registration is closed');
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new Error('Tournament is full');
    }

    if (tournament.participants.some(p => p.agentId === agentId)) {
      throw new Error('Agent already registered');
    }

    // Check requirements
    if (!await this.checkTournamentRequirements(tournament, agentId)) {
      throw new Error('Agent does not meet tournament requirements');
    }

    // Add participant
    const participant = {
      agentId: agentId,
      joinedAt: new Date().toISOString(),
      status: 'registered'
    };

    tournament.participants.push(participant);
    await this.storage.saveTournament(tournament.toJSON());

    // Auto-start if minimum participants reached
    if (this.shouldAutoStart(tournament)) {
      await this.startTournament(tournamentId);
    }

    return participant;
  }

  async checkTournamentRequirements(tournament, agentId) {
    if (!tournament.requirements) return true;

    const userProfile = await this.storage.getUserProfile();
    if (!userProfile) return false;

    // Check minimum level
    if (tournament.requirements.minLevel) {
      const userLevel = this.calculateUserLevel(userProfile);
      if (userLevel < tournament.requirements.minLevel) {
        return false;
      }
    }

    // Check completed tournaments
    if (tournament.requirements.completedTournaments) {
      const userMatches = await this.storage.getUserMatches(userProfile.id);
      const completedTournaments = new Set(
        userMatches
          .filter(match => match.status === 'completed')
          .map(match => match.tournamentId)
      ).size;

      if (completedTournaments < tournament.requirements.completedTournaments) {
        return false;
      }
    }

    return true;
  }

  shouldAutoStart(tournament) {
    const tournamentType = this.tournamentTypes[tournament.type];
    return tournament.participants.length >= tournamentType.minParticipants &&
           tournament.participants.length === tournament.maxParticipants;
  }

  async startTournament(tournamentId) {
    const tournament = this.activeTournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'registration') {
      throw new Error('Tournament cannot be started');
    }

    try {
      // Generate bracket
      tournament.bracket = this.brackets.generate(tournament.participants, tournament.type);
      tournament.status = 'running';
      tournament.startTime = new Date().toISOString();

      // Save tournament state
      await this.storage.saveTournament(tournament.toJSON());

      // Start processing matches
      await this.processTournamentRounds(tournament);

      return tournament;

    } catch (error) {
      console.error('Failed to start tournament:', error);
      tournament.status = 'error';
      throw error;
    }
  }

  async processTournamentRounds(tournament) {
    for (const round of tournament.bracket.rounds) {
      await this.processRound(round, tournament);
      
      // Check if tournament is complete
      if (round.isFinal && round.isComplete()) {
        await this.completeTournament(tournament);
        break;
      }
    }
  }

  async processRound(round, tournament) {
    const matches = round.matches;
    const matchPromises = matches.map(match => 
      this.runMatch(match, tournament)
    );

    const results = await Promise.all(matchPromises);
    
    // Update bracket with results
    results.forEach((result, index) => {
      matches[index].result = result;
      matches[index].status = 'completed';
    });

    // Advance winners to next round
    this.advanceWinners(round, tournament.bracket);
  }

  async runMatch(match, tournament) {
    try {
      // Load agents
      const agent1 = await this.storage.getAgent(match.participant1.agentId);
      const agent2 = await this.storage.getAgent(match.participant2.agentId);

      if (!agent1 || !agent2) {
        throw new Error('One or both agents not found');
      }

      // Create match record
      const matchRecord = {
        id: this.generateId(),
        tournamentId: tournament.id,
        roundId: match.roundId,
        participant1: match.participant1,
        participant2: match.participant2,
        scenario: tournament.scenario,
        status: 'running',
        startTime: new Date().toISOString()
      };

      await this.storage.saveMatch(matchRecord);

      // Run simulation (this would integrate with AgentEngine)
      const simulationResult = await this.simulateMatch(agent1, agent2, tournament.scenario);

      // Determine winner
      const winner = simulationResult.winner;
      const loser = winner === agent1.id ? agent2.id : agent1.id;

      // Update match record
      matchRecord.result = {
        winner: winner,
        loser: loser,
        score: simulationResult.score,
        metrics: simulationResult.metrics
      };
      matchRecord.status = 'completed';
      matchRecord.endTime = new Date().toISOString();

      await this.storage.saveMatch(matchRecord);

      return matchRecord.result;

    } catch (error) {
      console.error('Match failed:', error);
      return {
        winner: null,
        error: error.message
      };
    }
  }

  async simulateMatch(agent1, agent2, scenarioId) {
    // This would integrate with the AgentEngine to run actual simulations
    // For now, return a mock result
    const winner = Math.random() < 0.5 ? agent1.id : agent2.id;
    
    return {
      winner: winner,
      score: {
        [agent1.id]: Math.floor(Math.random() * 100),
        [agent2.id]: Math.floor(Math.random() * 100)
      },
      metrics: {
        duration: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
        steps: Math.floor(Math.random() * 100) + 50
      }
    };
  }

  advanceWinners(round, bracket) {
    if (round.nextRound) {
      const nextRound = bracket.rounds.find(r => r.id === round.nextRound);
      if (nextRound) {
        round.matches.forEach((match, index) => {
          if (match.result && match.result.winner) {
            const nextMatchIndex = Math.floor(index / 2);
            const nextMatch = nextRound.matches[nextMatchIndex];
            
            if (index % 2 === 0) {
              nextMatch.participant1 = { agentId: match.result.winner };
            } else {
              nextMatch.participant2 = { agentId: match.result.winner };
            }
          }
        });
      }
    }
  }

  async completeTournament(tournament) {
    tournament.status = 'completed';
    tournament.endTime = new Date().toISOString();

    // Determine final rankings
    const rankings = this.calculateRankings(tournament);
    tournament.rankings = rankings;

    // Distribute rewards
    await this.distributeRewards(tournament, rankings);

    // Update leaderboards
    await this.leaderboards.updateTournamentResults(tournament);

    // Save final tournament state
    await this.storage.saveTournament(tournament.toJSON());

    console.log(`🏁 Tournament completed: ${tournament.name}`);
  }

  calculateRankings(tournament) {
    // Calculate final rankings based on tournament results
    const rankings = [];
    
    // This would analyze the bracket and match results to determine rankings
    // For now, return a simple ranking
    tournament.participants.forEach((participant, index) => {
      rankings.push({
        rank: index + 1,
        agentId: participant.agentId,
        points: Math.floor(Math.random() * 100)
      });
    });

    return rankings.sort((a, b) => b.points - a.points);
  }

  async distributeRewards(tournament, rankings) {
    if (!tournament.rewards) return;

    for (const [rank, participant] of rankings.entries()) {
      let reward = null;

      if (rank === 0 && tournament.rewards.winner) {
        reward = tournament.rewards.winner;
      } else if (rank === 1 && tournament.rewards.finalist) {
        reward = tournament.rewards.finalist;
      } else if (tournament.rewards.participant) {
        reward = tournament.rewards.participant;
      }

      if (reward && reward.type === 'chip') {
        // This would integrate with SkillChipSystem
        console.log(`Rewarding ${participant.agentId} with ${reward.rarity} ${reward.category} chip`);
      }
    }
  }

  getDefaultRewards(tier) {
    const rewards = {
      common: {
        winner: { type: 'chip', rarity: 'rare', category: 'processing' },
        participant: { type: 'chip', rarity: 'common', category: 'logic' }
      },
      rare: {
        winner: { type: 'chip', rarity: 'epic', category: 'logic' },
        finalist: { type: 'chip', rarity: 'rare', category: 'memory' },
        participant: { type: 'chip', rarity: 'common', category: 'processing' }
      },
      epic: {
        winner: { type: 'chip', rarity: 'legendary', category: 'synergy' },
        finalist: { type: 'chip', rarity: 'epic', category: 'logic' },
        participant: { type: 'chip', rarity: 'rare', category: 'processing' }
      },
      legendary: {
        winner: { type: 'chip', rarity: 'legendary', category: 'special' },
        finalist: { type: 'chip', rarity: 'legendary', category: 'synergy' },
        participant: { type: 'chip', rarity: 'epic', category: 'logic' }
      }
    };

    return rewards[tier] || rewards.common;
  }

  calculateUserLevel(userProfile) {
    // Calculate user level based on stats
    const stats = userProfile.stats;
    const baseLevel = Math.floor(stats.tournamentsWon * 2 + stats.agentsCreated * 0.5 + stats.skillChipsCollected * 0.1);
    return Math.max(1, baseLevel);
  }

  async refreshTournaments() {
    // Refresh tournament display
    const tournamentList = document.getElementById('tournament-list');
    if (!tournamentList) return;

    const tournaments = Array.from(this.activeTournaments.values());
    
    if (tournaments.length === 0) {
      tournamentList.innerHTML = `
        <div class="no-tournaments">
          <p>No active tournaments. Create one to get started!</p>
        </div>
      `;
      return;
    }

    tournamentList.innerHTML = tournaments.map(tournament => 
      this.renderTournamentCard(tournament)
    ).join('');

    // Add event listeners
    tournamentList.querySelectorAll('.tournament-card').forEach(card => {
      card.addEventListener('click', () => {
        const tournamentId = card.dataset.tournamentId;
        this.showTournamentDetails(tournamentId);
      });
    });
  }

  renderTournamentCard(tournament) {
    const statusClass = tournament.status;
    const typeInfo = this.tournamentTypes[tournament.type];
    
    return `
      <div class="tournament-card ${statusClass}" data-tournament-id="${tournament.id}">
        <div class="tournament-header">
          <h3 class="tournament-name">${tournament.name}</h3>
          <span class="tournament-tier ${tournament.tier}">${tournament.tier}</span>
        </div>
        <div class="tournament-info">
          <p class="tournament-description">${tournament.description}</p>
          <div class="tournament-details">
            <div class="detail-item">
              <span class="detail-label">Type:</span>
              <span class="detail-value">${typeInfo.name}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Participants:</span>
              <span class="detail-value">${tournament.participants.length}/${tournament.maxParticipants}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status:</span>
              <span class="detail-value status-${tournament.status}">${tournament.status}</span>
            </div>
          </div>
        </div>
        <div class="tournament-actions">
          ${this.renderTournamentActions(tournament)}
        </div>
      </div>
    `;
  }

  renderTournamentActions(tournament) {
    switch (tournament.status) {
      case 'registration':
        return `<button class="join-tournament-btn">Join Tournament</button>`;
      case 'running':
        return `<button class="view-bracket-btn">View Bracket</button>`;
      case 'completed':
        return `<button class="view-results-btn">View Results</button>`;
      default:
        return '';
    }
  }

  showTournamentDetails(tournamentId) {
    const tournament = this.activeTournaments.get(tournamentId);
    if (!tournament) return;

    // Show detailed tournament information in modal
    console.log('Showing tournament details:', tournament);
  }

  generateId() {
    return 'tournament_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// Tournament class
class Tournament {
  constructor(config) {
    Object.assign(this, config);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      scenario: this.scenario,
      tier: this.tier,
      maxParticipants: this.maxParticipants,
      participants: this.participants,
      bracket: this.bracket,
      matches: this.matches,
      status: this.status,
      created: this.created,
      startTime: this.startTime,
      endTime: this.endTime,
      createdBy: this.createdBy,
      rewards: this.rewards,
      requirements: this.requirements,
      rankings: this.rankings,
      featured: this.featured
    };
  }
}

// Bracket Generator class
class BracketGenerator {
  initialize() {
    // Initialize bracket generation algorithms
  }

  generate(participants, type) {
    switch (type) {
      case 'single-elimination':
        return this.generateSingleElimination(participants);
      case 'round-robin':
        return this.generateRoundRobin(participants);
      case 'gauntlet':
        return this.generateGauntlet(participants);
      case 'team-battle':
        return this.generateTeamBattle(participants);
      default:
        throw new Error(`Unknown tournament type: ${type}`);
    }
  }

  generateSingleElimination(participants) {
    // Generate single elimination bracket
    const rounds = [];
    let currentParticipants = [...participants];
    let roundNumber = 1;

    while (currentParticipants.length > 1) {
      const matches = [];
      const nextRoundParticipants = [];

      for (let i = 0; i < currentParticipants.length; i += 2) {
        if (i + 1 < currentParticipants.length) {
          matches.push({
            id: `match_${roundNumber}_${matches.length + 1}`,
            participant1: currentParticipants[i],
            participant2: currentParticipants[i + 1],
            status: 'pending'
          });
        } else {
          // Bye - participant advances automatically
          nextRoundParticipants.push(currentParticipants[i]);
        }
      }

      rounds.push({
        id: `round_${roundNumber}`,
        number: roundNumber,
        matches: matches,
        isFinal: currentParticipants.length <= 2
      });

      currentParticipants = nextRoundParticipants;
      roundNumber++;
    }

    return { type: 'single-elimination', rounds: rounds };
  }

  generateRoundRobin(participants) {
    // Generate round robin bracket where everyone plays everyone
    const matches = [];
    let matchId = 1;

    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          id: `match_${matchId}`,
          participant1: participants[i],
          participant2: participants[j],
          status: 'pending'
        });
        matchId++;
      }
    }

    return {
      type: 'round-robin',
      rounds: [{
        id: 'round_1',
        number: 1,
        matches: matches,
        isFinal: true
      }]
    };
  }

  generateGauntlet(participants) {
    // Generate gauntlet mode (single participant vs scenarios)
    if (participants.length !== 1) {
      throw new Error('Gauntlet mode requires exactly one participant');
    }

    const scenarios = this.getGauntletScenarios();
    const matches = scenarios.map((scenario, index) => ({
      id: `gauntlet_${index + 1}`,
      participant1: participants[0],
      scenario: scenario,
      status: 'pending'
    }));

    return {
      type: 'gauntlet',
      rounds: [{
        id: 'gauntlet_round',
        number: 1,
        matches: matches,
        isFinal: true
      }]
    };
  }

  generateTeamBattle(participants) {
    // Generate team battle bracket
    const teams = this.createTeams(participants);
    return this.generateSingleElimination(teams);
  }

  createTeams(participants) {
    const teams = [];
    for (let i = 0; i < participants.length; i += 2) {
      if (i + 1 < participants.length) {
        teams.push({
          id: `team_${teams.length + 1}`,
          members: [participants[i], participants[i + 1]]
        });
      }
    }
    return teams;
  }

  getGauntletScenarios() {
    return [
      { id: 'gauntlet_1', difficulty: 'easy' },
      { id: 'gauntlet_2', difficulty: 'medium' },
      { id: 'gauntlet_3', difficulty: 'hard' },
      { id: 'gauntlet_4', difficulty: 'expert' },
      { id: 'gauntlet_5', difficulty: 'master' }
    ];
  }
}

// Leaderboard Manager class
class LeaderboardManager {
  constructor() {
    this.storage = null;
    this.leaderboards = new Map();
  }

  async initialize(storageManager) {
    this.storage = storageManager;
    await this.loadLeaderboards();
  }

  async loadLeaderboards() {
    // Load existing leaderboard data
  }

  async updateTournamentResults(tournament) {
    // Update leaderboards with tournament results
  }
}

export { TournamentManager, Tournament, BracketGenerator, LeaderboardManager };
