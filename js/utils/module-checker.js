/**
 * Module Checker Utility
 * Validates that all required modules can be loaded
 */

export class ModuleChecker {
  constructor() {
    this.modules = [
      { name: 'WebLLMIntegration', path: './modules/web-llm-integration.js' },
      { name: 'NodeEditor', path: './modules/node-editor.js' },
      { name: 'AgentEngine', path: './modules/agent-engine.js' },
      { name: 'TournamentManager', path: './modules/tournament.js' },
      { name: 'SkillChipSystem', path: './modules/skill-chips.js' },
      { name: 'ScenarioManager', path: './modules/scenarios.js' },
      { name: 'StorageManager', path: './utils/storage.js' },
      { name: 'PerformanceMonitor', path: './utils/performance.js' },
      { name: 'ErrorHandler', path: './utils/error-handler.js' }
    ];
    
    this.results = new Map();
  }

  async checkAllModules() {
    console.log('🔍 Checking module availability...');
    
    for (const module of this.modules) {
      try {
        console.log(`📦 Checking ${module.name}...`);
        const moduleExport = await import(module.path);
        
        if (moduleExport[module.name]) {
          this.results.set(module.name, { 
            status: 'success', 
            module: moduleExport[module.name] 
          });
          console.log(`✅ ${module.name} loaded successfully`);
        } else {
          this.results.set(module.name, { 
            status: 'error', 
            error: `Export ${module.name} not found in module` 
          });
          console.error(`❌ ${module.name} export not found`);
        }
        
      } catch (error) {
        this.results.set(module.name, { 
          status: 'error', 
          error: error.message 
        });
        console.error(`❌ Failed to load ${module.name}:`, error.message);
      }
    }
    
    return this.getResults();
  }

  getResults() {
    const results = {
      total: this.modules.length,
      successful: 0,
      failed: 0,
      modules: {}
    };
    
    for (const [name, result] of this.results) {
      results.modules[name] = result;
      if (result.status === 'success') {
        results.successful++;
      } else {
        results.failed++;
      }
    }
    
    return results;
  }

  async checkBrowserCapabilities() {
    console.log('🌐 Checking browser capabilities...');
    
    const capabilities = {
      webgl: false,
      webgpu: false,
      indexeddb: false,
      serviceworker: false,
      modules: false,
      webassembly: false
    };
    
    // Check WebGL
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      capabilities.webgl = !!gl;
    } catch (e) {
      capabilities.webgl = false;
    }
    
    // Check WebGPU
    capabilities.webgpu = 'gpu' in navigator;
    
    // Check IndexedDB
    capabilities.indexeddb = 'indexedDB' in window;
    
    // Check Service Worker
    capabilities.serviceworker = 'serviceWorker' in navigator;
    
    // Check ES6 Modules
    capabilities.modules = 'noModule' in HTMLScriptElement.prototype;
    
    // Check WebAssembly
    capabilities.webassembly = 'WebAssembly' in window;
    
    console.log('🔧 Browser capabilities:', capabilities);
    return capabilities;
  }

  generateReport() {
    const results = this.getResults();
    
    console.group('📊 Module Check Report');
    console.log(`Total modules: ${results.total}`);
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);
    
    if (results.failed > 0) {
      console.group('❌ Failed modules:');
      for (const [name, result] of Object.entries(results.modules)) {
        if (result.status === 'error') {
          console.error(`${name}: ${result.error}`);
        }
      }
      console.groupEnd();
    }
    
    console.groupEnd();
    
    return results;
  }
}

// Export for standalone usage
export default ModuleChecker;
