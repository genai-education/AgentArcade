/**
 * Storage Manager
 * Handles IndexedDB, localStorage, and data persistence
 */

class StorageManager {
  constructor() {
    this.db = null;
    this.dbName = 'AgentArcadesDB';
    this.dbVersion = 1;
    this.isInitialized = false;
    
    // Store names
    this.stores = {
      users: 'users',
      agents: 'agents',
      tournaments: 'tournaments',
      skillChips: 'skillChips',
      scenarios: 'scenarios',
      matches: 'matches',
      achievements: 'achievements'
    };
  }

  async initialize() {
    try {
      await this.initializeIndexedDB();
      this.isInitialized = true;
      console.log('💾 Storage Manager initialized');
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  async initializeIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        this.createObjectStores(db);
      };
    });
  }

  createObjectStores(db) {
    // Users store
    if (!db.objectStoreNames.contains(this.stores.users)) {
      const userStore = db.createObjectStore(this.stores.users, { keyPath: 'id' });
      userStore.createIndex('created', 'created', { unique: false });
    }
    
    // Agents store
    if (!db.objectStoreNames.contains(this.stores.agents)) {
      const agentStore = db.createObjectStore(this.stores.agents, { keyPath: 'id' });
      agentStore.createIndex('userId', 'userId', { unique: false });
      agentStore.createIndex('created', 'created', { unique: false });
      agentStore.createIndex('name', 'name', { unique: false });
    }
    
    // Tournaments store
    if (!db.objectStoreNames.contains(this.stores.tournaments)) {
      const tournamentStore = db.createObjectStore(this.stores.tournaments, { keyPath: 'id' });
      tournamentStore.createIndex('status', 'status', { unique: false });
      tournamentStore.createIndex('created', 'created', { unique: false });
    }
    
    // Skill Chips store
    if (!db.objectStoreNames.contains(this.stores.skillChips)) {
      const chipStore = db.createObjectStore(this.stores.skillChips, { keyPath: 'id' });
      chipStore.createIndex('userId', 'userId', { unique: false });
      chipStore.createIndex('rarity', 'rarity', { unique: false });
      chipStore.createIndex('category', 'category', { unique: false });
    }
    
    // Scenarios store
    if (!db.objectStoreNames.contains(this.stores.scenarios)) {
      const scenarioStore = db.createObjectStore(this.stores.scenarios, { keyPath: 'id' });
      scenarioStore.createIndex('category', 'category', { unique: false });
      scenarioStore.createIndex('difficulty', 'difficulty', { unique: false });
    }
    
    // Matches store
    if (!db.objectStoreNames.contains(this.stores.matches)) {
      const matchStore = db.createObjectStore(this.stores.matches, { keyPath: 'id' });
      matchStore.createIndex('userId', 'userId', { unique: false });
      matchStore.createIndex('tournamentId', 'tournamentId', { unique: false });
      matchStore.createIndex('completed', 'completed', { unique: false });
    }
    
    // Achievements store
    if (!db.objectStoreNames.contains(this.stores.achievements)) {
      const achievementStore = db.createObjectStore(this.stores.achievements, { keyPath: 'id' });
      achievementStore.createIndex('userId', 'userId', { unique: false });
      achievementStore.createIndex('unlocked', 'unlocked', { unique: false });
    }
  }

  // Generic database operations
  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName, indexName = null, query = null) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let source = store;
      if (indexName) {
        source = store.index(indexName);
      }
      
      const request = query ? source.getAll(query) : source.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async count(storeName, indexName = null, query = null) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let source = store;
      if (indexName) {
        source = store.index(indexName);
      }
      
      const request = query ? source.count(query) : source.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // User profile operations
  async getUserProfile() {
    const users = await this.getAll(this.stores.users);
    return users.length > 0 ? users[0] : null;
  }

  async saveUserProfile(profile) {
    profile.updated = new Date().toISOString();
    return await this.put(this.stores.users, profile);
  }

  // Agent operations
  async getUserAgents(userId = null) {
    if (userId) {
      return await this.getAll(this.stores.agents, 'userId', userId);
    }
    return await this.getAll(this.stores.agents);
  }

  async getAgent(agentId) {
    return await this.get(this.stores.agents, agentId);
  }

  async saveAgent(agentData) {
    agentData.id = agentData.id || this.generateId();
    agentData.created = agentData.created || new Date().toISOString();
    agentData.updated = new Date().toISOString();
    
    await this.put(this.stores.agents, agentData);
    return agentData.id;
  }

  async deleteAgent(agentId) {
    return await this.delete(this.stores.agents, agentId);
  }

  // Tournament operations
  async getTournaments(status = null) {
    if (status) {
      return await this.getAll(this.stores.tournaments, 'status', status);
    }
    return await this.getAll(this.stores.tournaments);
  }

  async getTournament(tournamentId) {
    return await this.get(this.stores.tournaments, tournamentId);
  }

  async saveTournament(tournamentData) {
    tournamentData.id = tournamentData.id || this.generateId();
    tournamentData.created = tournamentData.created || new Date().toISOString();
    tournamentData.updated = new Date().toISOString();
    
    await this.put(this.stores.tournaments, tournamentData);
    return tournamentData.id;
  }

  // Skill chip operations
  async getUserSkillChips(userId) {
    return await this.getAll(this.stores.skillChips, 'userId', userId);
  }

  async getSkillChip(chipId) {
    return await this.get(this.stores.skillChips, chipId);
  }

  async saveSkillChip(chipData) {
    chipData.id = chipData.id || this.generateId();
    chipData.acquired = chipData.acquired || new Date().toISOString();
    
    await this.put(this.stores.skillChips, chipData);
    return chipData.id;
  }

  async deleteSkillChip(chipId) {
    return await this.delete(this.stores.skillChips, chipId);
  }

  // Scenario operations
  async getScenarios(category = null) {
    if (category) {
      return await this.getAll(this.stores.scenarios, 'category', category);
    }
    return await this.getAll(this.stores.scenarios);
  }

  async getScenario(scenarioId) {
    return await this.get(this.stores.scenarios, scenarioId);
  }

  async saveScenario(scenarioData) {
    scenarioData.id = scenarioData.id || this.generateId();
    scenarioData.created = scenarioData.created || new Date().toISOString();
    
    await this.put(this.stores.scenarios, scenarioData);
    return scenarioData.id;
  }

  // Match operations
  async getUserMatches(userId) {
    return await this.getAll(this.stores.matches, 'userId', userId);
  }

  async getTournamentMatches(tournamentId) {
    return await this.getAll(this.stores.matches, 'tournamentId', tournamentId);
  }

  async saveMatch(matchData) {
    matchData.id = matchData.id || this.generateId();
    matchData.created = matchData.created || new Date().toISOString();
    
    await this.put(this.stores.matches, matchData);
    return matchData.id;
  }

  // Achievement operations
  async getUserAchievements(userId) {
    return await this.getAll(this.stores.achievements, 'userId', userId);
  }

  async saveAchievement(achievementData) {
    achievementData.id = achievementData.id || this.generateId();
    achievementData.unlocked = achievementData.unlocked || new Date().toISOString();
    
    await this.put(this.stores.achievements, achievementData);
    return achievementData.id;
  }

  // Import/Export operations
  async exportData(dataTypes = null) {
    const exportData = {
      version: this.dbVersion,
      timestamp: new Date().toISOString(),
      data: {}
    };
    
    const storesToExport = dataTypes || Object.values(this.stores);
    
    for (const storeName of storesToExport) {
      try {
        exportData.data[storeName] = await this.getAll(storeName);
      } catch (error) {
        console.warn(`Failed to export ${storeName}:`, error);
        exportData.data[storeName] = [];
      }
    }
    
    return exportData;
  }

  async importData(importData) {
    if (!importData.data) {
      throw new Error('Invalid import data format');
    }
    
    const results = {
      success: [],
      errors: []
    };
    
    for (const [storeName, items] of Object.entries(importData.data)) {
      try {
        if (!this.stores[storeName]) {
          results.errors.push(`Unknown store: ${storeName}`);
          continue;
        }
        
        for (const item of items) {
          await this.put(storeName, item);
        }
        
        results.success.push(`Imported ${items.length} items to ${storeName}`);
        
      } catch (error) {
        results.errors.push(`Failed to import ${storeName}: ${error.message}`);
      }
    }
    
    return results;
  }

  // File operations
  async exportToFile(filename = null, dataTypes = null) {
    const data = await this.exportData(dataTypes);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `agent-arcades-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const results = await this.importData(data);
          resolve(results);
        } catch (error) {
          reject(new Error(`Failed to parse import file: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read import file'));
      };
      
      reader.readAsText(file);
    });
  }

  // LocalStorage operations (for preferences and temporary data)
  setPreference(key, value) {
    try {
      localStorage.setItem(`agentArcades_${key}`, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save preference:', error);
    }
  }

  getPreference(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(`agentArcades_${key}`);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.warn('Failed to load preference:', error);
      return defaultValue;
    }
  }

  removePreference(key) {
    try {
      localStorage.removeItem(`agentArcades_${key}`);
    } catch (error) {
      console.warn('Failed to remove preference:', error);
    }
  }

  // Cache operations (for temporary data)
  async cacheData(key, data, ttl = 3600000) { // 1 hour default TTL
    const cacheItem = {
      data: data,
      timestamp: Date.now(),
      ttl: ttl
    };
    
    try {
      localStorage.setItem(`agentArcades_cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  async getCachedData(key) {
    try {
      const cached = localStorage.getItem(`agentArcades_cache_${key}`);
      if (!cached) return null;
      
      const cacheItem = JSON.parse(cached);
      const now = Date.now();
      
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        localStorage.removeItem(`agentArcades_cache_${key}`);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  }

  // Utility methods
  generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  async clearAllData() {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      return false;
    }
    
    try {
      // Clear IndexedDB
      for (const storeName of Object.values(this.stores)) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      // Clear localStorage
      const keys = Object.keys(localStorage).filter(key => key.startsWith('agentArcades_'));
      keys.forEach(key => localStorage.removeItem(key));
      
      console.log('All data cleared successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }

  async getStorageUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage,
          available: estimate.quota,
          percentage: (estimate.usage / estimate.quota) * 100
        };
      } catch (error) {
        console.warn('Failed to get storage estimate:', error);
      }
    }
    
    return {
      used: 0,
      available: 0,
      percentage: 0
    };
  }
}

export { StorageManager };
