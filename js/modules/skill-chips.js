/**
 * Skill Chip System Module
 * Handles collectible skill chips, rarity system, and progression
 */

class SkillChipSystem {
  constructor() {
    this.storage = null;
    this.userCollection = new Map();
    this.chipDatabase = new ChipDatabase();
    this.isInitialized = false;
    
    // Rarity system
    this.rarityWeights = {
      common: 0.70,    // 70% chance
      rare: 0.25,      // 25% chance  
      epic: 0.045,     // 4.5% chance
      legendary: 0.005 // 0.5% chance
    };
    
    // Fusion rules
    this.fusionRules = new Map();
    this.initializeFusionRules();
    
    // Achievement tracking
    this.achievements = new Map();
    this.initializeAchievements();
  }

  async initialize(storageManager) {
    this.storage = storageManager;
    
    // Initialize chip database
    await this.chipDatabase.initialize();
    
    // Load user collection
    await this.loadUserCollection();
    
    // Initialize fusion rules
    this.initializeFusionRules();
    
    this.isInitialized = true;
    console.log('💎 Skill Chip System initialized');
  }

  async loadUserCollection() {
    try {
      const userProfile = await this.storage.getUserProfile();
      if (userProfile) {
        const chips = await this.storage.getUserSkillChips(userProfile.id);
        chips.forEach(chip => {
          this.userCollection.set(chip.id, chip);
        });
      }
    } catch (error) {
      console.warn('Failed to load user collection:', error);
    }
  }

  generateRandomChip(context = {}) {
    const rarity = this.rollRarity(context);
    const category = this.selectCategory(rarity, context);
    const chipType = this.selectChipType(category, rarity);
    
    const chip = this.chipDatabase.create(chipType, rarity, {
      context: context,
      timestamp: Date.now()
    });
    
    // Add context-specific bonuses
    if (context.tournament) {
      chip.addTournamentBonus(context.tournament);
    }
    
    if (context.achievement) {
      chip.addAchievementBonus(context.achievement);
    }
    
    return chip;
  }

  rollRarity(context = {}) {
    let weights = { ...this.rarityWeights };
    
    // Apply context modifiers
    if (context.tournament?.tier === 'legendary') {
      weights.legendary *= 5; // 5x chance for legendary tournaments
      weights.epic *= 2;
    } else if (context.tournament?.tier === 'epic') {
      weights.epic *= 3;
      weights.rare *= 1.5;
    }
    
    if (context.firstWin) {
      weights.rare *= 2;
      weights.epic *= 1.5;
    }
    
    if (context.perfectScore) {
      weights.legendary *= 10;
      weights.epic *= 3;
    }
    
    // Normalize weights
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(weights).forEach(key => {
      weights[key] /= totalWeight;
    });
    
    // Roll for rarity
    const roll = Math.random();
    let cumulative = 0;
    
    for (const [rarity, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (roll <= cumulative) return rarity;
    }
    
    return 'common'; // Fallback
  }

  selectCategory(rarity, context = {}) {
    const categories = ['processing', 'logic', 'memory', 'synergy', 'special'];
    
    // Context-based category selection
    if (context.scenario) {
      const scenarioCategories = {
        'debug': ['logic', 'processing'],
        'planning': ['logic', 'memory'],
        'analysis': ['processing', 'logic'],
        'creative': ['synergy', 'special']
      };
      
      const preferredCategories = scenarioCategories[context.scenario.category];
      if (preferredCategories) {
        return preferredCategories[Math.floor(Math.random() * preferredCategories.length)];
      }
    }
    
    // Rarity-based category weighting
    if (rarity === 'legendary') {
      return Math.random() < 0.5 ? 'special' : 'synergy';
    }
    
    return categories[Math.floor(Math.random() * categories.length)];
  }

  selectChipType(category, rarity) {
    const chipTypes = this.chipDatabase.getTypesByCategory(category, rarity);
    return chipTypes[Math.floor(Math.random() * chipTypes.length)];
  }

  async addChipToCollection(chip) {
    try {
      // Add to local collection
      this.userCollection.set(chip.id, chip);
      
      // Save to storage
      const userProfile = await this.storage.getUserProfile();
      if (userProfile) {
        chip.userId = userProfile.id;
        await this.storage.saveSkillChip(chip);
        
        // Update user stats
        userProfile.stats.skillChipsCollected++;
        await this.storage.saveUserProfile(userProfile);
      }
      
      // Check achievements
      this.checkAchievements();
      
      return chip;
      
    } catch (error) {
      console.error('Failed to add chip to collection:', error);
      throw error;
    }
  }

  async fuseChips(chip1Id, chip2Id) {
    const chip1 = this.userCollection.get(chip1Id);
    const chip2 = this.userCollection.get(chip2Id);
    
    if (!chip1 || !chip2) {
      throw new Error('One or both chips not found in collection');
    }
    
    if (!this.canFuse(chip1, chip2)) {
      throw new Error('These chips cannot be fused');
    }
    
    try {
      // Create fused chip
      const fusedChip = this.chipDatabase.createFusion(chip1, chip2);
      
      // Remove original chips
      this.userCollection.delete(chip1Id);
      this.userCollection.delete(chip2Id);
      await this.storage.deleteSkillChip(chip1Id);
      await this.storage.deleteSkillChip(chip2Id);
      
      // Add fused chip
      await this.addChipToCollection(fusedChip);
      
      return fusedChip;
      
    } catch (error) {
      console.error('Failed to fuse chips:', error);
      throw error;
    }
  }

  canFuse(chip1, chip2) {
    // Same rarity required
    if (chip1.rarity !== chip2.rarity) {
      return false;
    }
    
    // Check fusion rules
    const ruleKey = `${chip1.category}-${chip2.category}`;
    const reverseRuleKey = `${chip2.category}-${chip1.category}`;
    
    return this.fusionRules.has(ruleKey) || this.fusionRules.has(reverseRuleKey);
  }

  initializeFusionRules() {
    // Define which categories can be fused together
    const rules = [
      ['processing', 'logic'],
      ['processing', 'memory'],
      ['logic', 'memory'],
      ['logic', 'synergy'],
      ['memory', 'synergy'],
      ['processing', 'synergy'],
      ['synergy', 'special']
    ];
    
    rules.forEach(([cat1, cat2]) => {
      this.fusionRules.set(`${cat1}-${cat2}`, true);
      this.fusionRules.set(`${cat2}-${cat1}`, true);
    });
  }

  initializeAchievements() {
    this.achievements.set('first_chip', {
      name: 'First Collection',
      description: 'Collect your first skill chip',
      condition: (collection) => collection.size >= 1,
      reward: { type: 'chip', rarity: 'rare', category: 'special' }
    });
    
    this.achievements.set('chip_collector', {
      name: 'Chip Collector',
      description: 'Collect 50 skill chips',
      condition: (collection) => collection.size >= 50,
      reward: { type: 'chip', rarity: 'epic', category: 'synergy' }
    });
    
    this.achievements.set('legendary_master', {
      name: 'Legendary Master',
      description: 'Collect 5 legendary chips',
      condition: (collection) => this.getCountsByRarity(collection).legendary >= 5,
      reward: { type: 'chip', rarity: 'legendary', category: 'special', unique: true }
    });
    
    this.achievements.set('fusion_expert', {
      name: 'Fusion Expert',
      description: 'Successfully fuse 10 chips',
      condition: (collection) => Array.from(collection.values()).filter(c => c.fused).length >= 10,
      reward: { type: 'chip', rarity: 'epic', category: 'synergy' }
    });
  }

  async checkAchievements() {
    const userProfile = await this.storage.getUserProfile();
    if (!userProfile) return;
    
    const unlockedAchievements = await this.storage.getUserAchievements(userProfile.id);
    const unlockedIds = new Set(unlockedAchievements.map(a => a.achievementId));
    
    for (const [id, achievement] of this.achievements) {
      if (unlockedIds.has(id)) continue;
      
      if (achievement.condition(this.userCollection)) {
        // Unlock achievement
        await this.storage.saveAchievement({
          userId: userProfile.id,
          achievementId: id,
          name: achievement.name,
          description: achievement.description,
          unlocked: new Date().toISOString()
        });
        
        // Grant reward
        if (achievement.reward.type === 'chip') {
          const rewardChip = this.generateRewardChip(achievement.reward);
          await this.addChipToCollection(rewardChip);
        }
        
        console.log(`🏆 Achievement unlocked: ${achievement.name}`);
      }
    }
  }

  generateRewardChip(rewardConfig) {
    return this.chipDatabase.create(
      rewardConfig.category + '_reward',
      rewardConfig.rarity,
      {
        isReward: true,
        unique: rewardConfig.unique || false,
        timestamp: Date.now()
      }
    );
  }

  getCollection() {
    return Array.from(this.userCollection.values());
  }

  getCountsByRarity(collection = null) {
    const chips = collection ? Array.from(collection.values()) : this.getCollection();
    
    const counts = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    };
    
    chips.forEach(chip => {
      if (counts.hasOwnProperty(chip.rarity)) {
        counts[chip.rarity]++;
      }
    });
    
    return counts;
  }

  getCountsByCategory() {
    const chips = this.getCollection();
    
    const counts = {
      processing: 0,
      logic: 0,
      memory: 0,
      synergy: 0,
      special: 0
    };
    
    chips.forEach(chip => {
      if (counts.hasOwnProperty(chip.category)) {
        counts[chip.category]++;
      }
    });
    
    return counts;
  }

  getCollectionValue() {
    const chips = this.getCollection();
    const rarityValues = {
      common: 1,
      rare: 5,
      epic: 25,
      legendary: 100
    };
    
    return chips.reduce((total, chip) => {
      return total + (rarityValues[chip.rarity] || 0);
    }, 0);
  }

  filterCollection(filters = {}) {
    let chips = this.getCollection();
    
    if (filters.rarity && filters.rarity !== 'all') {
      chips = chips.filter(chip => chip.rarity === filters.rarity);
    }
    
    if (filters.category && filters.category !== 'all') {
      chips = chips.filter(chip => chip.category === filters.category);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      chips = chips.filter(chip => 
        chip.name.toLowerCase().includes(searchTerm) ||
        chip.description.toLowerCase().includes(searchTerm)
      );
    }
    
    return chips;
  }

  async refreshCollection() {
    // Refresh collection display
    const collectionGrid = document.getElementById('collection-grid');
    if (!collectionGrid) return;
    
    const chips = this.getCollection();
    
    if (chips.length === 0) {
      collectionGrid.innerHTML = `
        <div class="no-chips">
          <p>No skill chips collected yet. Win tournaments and complete challenges to earn chips!</p>
        </div>
      `;
      return;
    }
    
    collectionGrid.innerHTML = chips.map(chip => this.renderChipCard(chip)).join('');
    
    // Add event listeners
    collectionGrid.querySelectorAll('.chip-card').forEach(card => {
      card.addEventListener('click', () => {
        const chipId = card.dataset.chipId;
        this.showChipDetails(chipId);
      });
    });
  }

  renderChipCard(chip) {
    const rarityClass = chip.rarity;
    const categoryIcon = this.getCategoryIcon(chip.category);
    
    return `
      <div class="chip-card ${rarityClass}" data-chip-id="${chip.id}">
        <div class="chip-header">
          <span class="chip-category-icon">${categoryIcon}</span>
          <span class="chip-rarity">${chip.rarity}</span>
        </div>
        <div class="chip-content">
          <h3 class="chip-name">${chip.name}</h3>
          <p class="chip-description">${chip.description}</p>
          <div class="chip-stats">
            ${chip.effects.map(effect => `
              <div class="chip-effect">
                <span class="effect-name">${effect.name}</span>
                <span class="effect-value">+${effect.value}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="chip-footer">
          <span class="chip-acquired">${new Date(chip.acquired).toLocaleDateString()}</span>
          ${chip.fused ? '<span class="chip-fused">Fused</span>' : ''}
        </div>
      </div>
    `;
  }

  getCategoryIcon(category) {
    const icons = {
      processing: '⚡',
      logic: '🧠',
      memory: '💾',
      synergy: '🔗',
      special: '✨'
    };
    return icons[category] || '💎';
  }

  showChipDetails(chipId) {
    const chip = this.userCollection.get(chipId);
    if (!chip) return;
    
    // Show detailed chip information in modal
    // Implementation would show chip details, fusion options, etc.
    console.log('Showing chip details:', chip);
  }

  // Export/Import methods
  async exportCollection() {
    const collection = this.getCollection();
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      chips: collection
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-chips-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importCollection(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          if (!data.chips || !Array.isArray(data.chips)) {
            throw new Error('Invalid collection format');
          }
          
          let imported = 0;
          for (const chipData of data.chips) {
            try {
              await this.addChipToCollection(chipData);
              imported++;
            } catch (error) {
              console.warn('Failed to import chip:', chipData, error);
            }
          }
          
          resolve({ imported, total: data.chips.length });
          
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

// Chip Database class
class ChipDatabase {
  constructor() {
    this.chipTypes = new Map();
    this.fusionRecipes = new Map();
  }

  async initialize() {
    this.initializeChipTypes();
    this.initializeFusionRecipes();
  }

  initializeChipTypes() {
    // Processing chips
    this.addChipType('speed_boost', 'processing', {
      name: 'Speed Boost',
      description: 'Increases processing speed by 25%',
      effects: [{ name: 'Speed', value: 25 }]
    });
    
    this.addChipType('efficiency_core', 'processing', {
      name: 'Efficiency Core',
      description: 'Reduces resource consumption by 20%',
      effects: [{ name: 'Efficiency', value: 20 }]
    });
    
    // Logic chips
    this.addChipType('reasoning_matrix', 'logic', {
      name: 'Reasoning Matrix',
      description: 'Improves logical reasoning by 30%',
      effects: [{ name: 'Logic', value: 30 }]
    });
    
    this.addChipType('pattern_detector', 'logic', {
      name: 'Pattern Detector',
      description: 'Enhances pattern recognition by 35%',
      effects: [{ name: 'Pattern Recognition', value: 35 }]
    });
    
    // Memory chips
    this.addChipType('memory_bank', 'memory', {
      name: 'Memory Bank',
      description: 'Increases memory capacity by 50%',
      effects: [{ name: 'Memory', value: 50 }]
    });
    
    this.addChipType('recall_enhancer', 'memory', {
      name: 'Recall Enhancer',
      description: 'Improves information recall by 40%',
      effects: [{ name: 'Recall', value: 40 }]
    });
    
    // Synergy chips
    this.addChipType('team_coordinator', 'synergy', {
      name: 'Team Coordinator',
      description: 'Enhances team coordination by 45%',
      effects: [{ name: 'Coordination', value: 45 }]
    });
    
    this.addChipType('communication_hub', 'synergy', {
      name: 'Communication Hub',
      description: 'Improves inter-agent communication by 35%',
      effects: [{ name: 'Communication', value: 35 }]
    });
    
    // Special chips
    this.addChipType('quantum_processor', 'special', {
      name: 'Quantum Processor',
      description: 'Enables quantum-enhanced processing',
      effects: [
        { name: 'Speed', value: 50 },
        { name: 'Logic', value: 30 }
      ]
    });
  }

  addChipType(id, category, config) {
    this.chipTypes.set(id, {
      id,
      category,
      ...config
    });
  }

  getTypesByCategory(category, rarity = null) {
    const types = Array.from(this.chipTypes.values())
      .filter(type => type.category === category);
    
    // Filter by rarity if specified
    if (rarity) {
      // Implementation would filter by rarity availability
    }
    
    return types.map(type => type.id);
  }

  create(typeId, rarity, options = {}) {
    const chipType = this.chipTypes.get(typeId);
    if (!chipType) {
      throw new Error(`Unknown chip type: ${typeId}`);
    }
    
    return new SkillChip({
      id: this.generateId(),
      type: typeId,
      name: chipType.name,
      description: chipType.description,
      category: chipType.category,
      rarity: rarity,
      effects: chipType.effects,
      acquired: new Date().toISOString(),
      fused: options.fused || false,
      unique: options.unique || false
    });
  }

  createFusion(chip1, chip2) {
    // Create a new chip by combining two existing chips
    const fusedEffects = [...chip1.effects, ...chip2.effects];
    
    // Combine names
    const fusedName = `${chip1.name} + ${chip2.name}`;
    
    // Upgrade rarity if possible
    const rarityOrder = ['common', 'rare', 'epic', 'legendary'];
    const currentIndex = rarityOrder.indexOf(chip1.rarity);
    const newRarity = currentIndex < rarityOrder.length - 1 ? 
      rarityOrder[currentIndex + 1] : chip1.rarity;
    
    return new SkillChip({
      id: this.generateId(),
      type: 'fused',
      name: fusedName,
      description: `Fused chip combining ${chip1.name} and ${chip2.name}`,
      category: 'synergy',
      rarity: newRarity,
      effects: fusedEffects,
      acquired: new Date().toISOString(),
      fused: true,
      fusedFrom: [chip1.id, chip2.id]
    });
  }

  initializeFusionRecipes() {
    // Define specific fusion recipes for special combinations
  }

  generateId() {
    return 'chip_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// Skill Chip class
class SkillChip {
  constructor(config) {
    Object.assign(this, config);
  }

  addTournamentBonus(tournament) {
    this.tournamentBonus = {
      tournament: tournament.id,
      bonus: tournament.tier === 'legendary' ? 50 : 25
    };
  }

  addAchievementBonus(achievement) {
    this.achievementBonus = {
      achievement: achievement.id,
      bonus: 20
    };
  }

  getTotalValue() {
    let value = this.effects.reduce((sum, effect) => sum + effect.value, 0);
    
    if (this.tournamentBonus) {
      value += this.tournamentBonus.bonus;
    }
    
    if (this.achievementBonus) {
      value += this.achievementBonus.bonus;
    }
    
    return value;
  }
}

export { SkillChipSystem, ChipDatabase, SkillChip };
