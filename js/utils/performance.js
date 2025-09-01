/**
 * Performance Monitor Utility
 * Tracks application performance and provides optimization insights
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isMonitoring = false;
    this.startTime = null;
    this.memoryBaseline = null;
    
    // Performance thresholds
    this.thresholds = {
      frameTime: 16.67, // 60fps = 16.67ms per frame
      memoryGrowth: 50 * 1024 * 1024, // 50MB
      loadTime: 3000, // 3 seconds
      renderTime: 100, // 100ms
      interactionTime: 100 // 100ms
    };
    
    // Metrics collection
    this.frameMetrics = [];
    this.memoryMetrics = [];
    this.loadMetrics = new Map();
    this.interactionMetrics = [];
    
    // Performance warnings
    this.warnings = [];
    this.maxWarnings = 10;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startTime = performance.now();
    
    // Initialize baseline metrics
    this.initializeBaseline();
    
    // Setup performance observers
    this.setupPerformanceObservers();
    
    // Start frame monitoring
    this.startFrameMonitoring();
    
    // Start memory monitoring
    this.startMemoryMonitoring();
    
    console.log('📊 Performance monitoring started');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    
    // Stop observers
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (e) {
        console.warn('Failed to disconnect observer:', e);
      }
    });
    this.observers.clear();
    
    // Stop frame monitoring
    if (this.frameMonitorId) {
      cancelAnimationFrame(this.frameMonitorId);
      this.frameMonitorId = null;
    }
    
    // Stop memory monitoring
    if (this.memoryMonitorId) {
      clearInterval(this.memoryMonitorId);
      this.memoryMonitorId = null;
    }
    
    console.log('📊 Performance monitoring stopped');
  }

  initializeBaseline() {
    // Memory baseline
    if (performance.memory) {
      this.memoryBaseline = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    
    // Navigation timing baseline
    if (performance.navigation) {
      this.loadMetrics.set('navigationType', performance.navigation.type);
      this.loadMetrics.set('redirectCount', performance.navigation.redirectCount);
    }
  }

  setupPerformanceObservers() {
    // Performance Observer for various entry types
    if ('PerformanceObserver' in window) {
      try {
        // Navigation timing
        const navObserver = new PerformanceObserver((list) => {
          this.handleNavigationEntries(list.getEntries());
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);
        
        // Resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          this.handleResourceEntries(list.getEntries());
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
        
        // Measure timing
        const measureObserver = new PerformanceObserver((list) => {
          this.handleMeasureEntries(list.getEntries());
        });
        measureObserver.observe({ entryTypes: ['measure'] });
        this.observers.set('measure', measureObserver);
        
        // Paint timing
        const paintObserver = new PerformanceObserver((list) => {
          this.handlePaintEntries(list.getEntries());
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);
        
      } catch (error) {
        console.warn('Failed to setup performance observers:', error);
      }
    }
  }

  startFrameMonitoring() {
    let lastFrameTime = performance.now();
    let frameCount = 0;
    
    const monitorFrame = (currentTime) => {
      if (!this.isMonitoring) return;
      
      const frameTime = currentTime - lastFrameTime;
      lastFrameTime = currentTime;
      frameCount++;
      
      // Record frame metrics
      this.frameMetrics.push({
        time: currentTime,
        frameTime: frameTime,
        fps: 1000 / frameTime
      });
      
      // Keep only recent frames (last 60 frames)
      if (this.frameMetrics.length > 60) {
        this.frameMetrics.shift();
      }
      
      // Check for performance issues
      if (frameTime > this.thresholds.frameTime * 2) {
        this.recordWarning('frame', `Slow frame detected: ${frameTime.toFixed(2)}ms`);
      }
      
      this.frameMonitorId = requestAnimationFrame(monitorFrame);
    };
    
    this.frameMonitorId = requestAnimationFrame(monitorFrame);
  }

  startMemoryMonitoring() {
    if (!performance.memory) return;
    
    this.memoryMonitorId = setInterval(() => {
      if (!this.isMonitoring) return;
      
      const memory = {
        time: performance.now(),
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
      
      this.memoryMetrics.push(memory);
      
      // Keep only recent memory samples (last 60 samples)
      if (this.memoryMetrics.length > 60) {
        this.memoryMetrics.shift();
      }
      
      // Check for memory growth
      if (this.memoryBaseline) {
        const growth = memory.used - this.memoryBaseline.used;
        if (growth > this.thresholds.memoryGrowth) {
          this.recordWarning('memory', `High memory usage: ${(growth / 1024 / 1024).toFixed(2)}MB growth`);
        }
      }
      
      // Check for memory pressure
      const usagePercent = (memory.used / memory.limit) * 100;
      if (usagePercent > 80) {
        this.recordWarning('memory', `High memory pressure: ${usagePercent.toFixed(1)}%`);
      }
      
    }, 1000); // Check every second
  }

  // Performance entry handlers
  handleNavigationEntries(entries) {
    entries.forEach(entry => {
      this.loadMetrics.set('domContentLoaded', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart);
      this.loadMetrics.set('loadComplete', entry.loadEventEnd - entry.loadEventStart);
      this.loadMetrics.set('totalLoadTime', entry.loadEventEnd - entry.fetchStart);
      
      // Check load performance
      const totalTime = entry.loadEventEnd - entry.fetchStart;
      if (totalTime > this.thresholds.loadTime) {
        this.recordWarning('load', `Slow page load: ${totalTime.toFixed(2)}ms`);
      }
    });
  }

  handleResourceEntries(entries) {
    entries.forEach(entry => {
      const resourceTime = entry.responseEnd - entry.startTime;
      
      // Track slow resources
      if (resourceTime > 1000) { // 1 second
        this.recordWarning('resource', `Slow resource load: ${entry.name} (${resourceTime.toFixed(2)}ms)`);
      }
    });
  }

  handleMeasureEntries(entries) {
    entries.forEach(entry => {
      this.metrics.set(entry.name, {
        duration: entry.duration,
        startTime: entry.startTime,
        timestamp: performance.now()
      });
      
      // Check for slow operations
      if (entry.duration > this.thresholds.renderTime) {
        this.recordWarning('measure', `Slow operation: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
      }
    });
  }

  handlePaintEntries(entries) {
    entries.forEach(entry => {
      this.loadMetrics.set(entry.name, entry.startTime);
    });
  }

  // Custom measurement methods
  measureOperation(name, operation) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-duration`;
    
    performance.mark(startMark);
    
    let result;
    try {
      result = operation();
    } catch (error) {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      throw error;
    }
    
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    return result;
  }

  async measureAsyncOperation(name, operation) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-duration`;
    
    performance.mark(startMark);
    
    try {
      const result = await operation();
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      return result;
    } catch (error) {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      throw error;
    }
  }

  recordInteraction(type, duration, target = null) {
    this.interactionMetrics.push({
      type: type,
      duration: duration,
      target: target,
      timestamp: performance.now()
    });
    
    // Keep only recent interactions
    if (this.interactionMetrics.length > 100) {
      this.interactionMetrics.shift();
    }
    
    // Check for slow interactions
    if (duration > this.thresholds.interactionTime) {
      this.recordWarning('interaction', `Slow ${type} interaction: ${duration.toFixed(2)}ms`);
    }
  }

  recordWarning(category, message) {
    const warning = {
      category: category,
      message: message,
      timestamp: performance.now(),
      time: new Date().toISOString()
    };
    
    this.warnings.push(warning);
    
    // Keep only recent warnings
    if (this.warnings.length > this.maxWarnings) {
      this.warnings.shift();
    }
    
    console.warn(`[Performance Warning - ${category}]`, message);
  }

  // Reporting methods
  getPerformanceReport() {
    const currentTime = performance.now();
    const uptime = currentTime - (this.startTime || currentTime);
    
    return {
      uptime: uptime,
      timestamp: new Date().toISOString(),
      
      // Frame performance
      frames: this.getFrameStats(),
      
      // Memory usage
      memory: this.getMemoryStats(),
      
      // Load performance
      loading: Object.fromEntries(this.loadMetrics),
      
      // Custom metrics
      operations: this.getOperationStats(),
      
      // Interactions
      interactions: this.getInteractionStats(),
      
      // Warnings
      warnings: this.warnings.slice(),
      
      // Browser info
      browser: this.getBrowserInfo()
    };
  }

  getFrameStats() {
    if (this.frameMetrics.length === 0) return null;
    
    const frameTimes = this.frameMetrics.map(f => f.frameTime);
    const fps = this.frameMetrics.map(f => f.fps);
    
    return {
      averageFrameTime: this.average(frameTimes),
      maxFrameTime: Math.max(...frameTimes),
      minFrameTime: Math.min(...frameTimes),
      averageFPS: this.average(fps),
      minFPS: Math.min(...fps),
      frameCount: this.frameMetrics.length
    };
  }

  getMemoryStats() {
    if (!performance.memory || this.memoryMetrics.length === 0) return null;
    
    const current = performance.memory;
    const latest = this.memoryMetrics[this.memoryMetrics.length - 1];
    
    return {
      current: {
        used: current.usedJSHeapSize,
        total: current.totalJSHeapSize,
        limit: current.jsHeapSizeLimit,
        usagePercent: (current.usedJSHeapSize / current.jsHeapSizeLimit) * 100
      },
      baseline: this.memoryBaseline,
      growth: this.memoryBaseline ? current.usedJSHeapSize - this.memoryBaseline.used : 0,
      peak: Math.max(...this.memoryMetrics.map(m => m.used))
    };
  }

  getOperationStats() {
    const operations = {};
    
    this.metrics.forEach((metric, name) => {
      operations[name] = {
        duration: metric.duration,
        lastRun: metric.timestamp
      };
    });
    
    return operations;
  }

  getInteractionStats() {
    if (this.interactionMetrics.length === 0) return null;
    
    const byType = {};
    this.interactionMetrics.forEach(interaction => {
      if (!byType[interaction.type]) {
        byType[interaction.type] = [];
      }
      byType[interaction.type].push(interaction.duration);
    });
    
    const stats = {};
    Object.entries(byType).forEach(([type, durations]) => {
      stats[type] = {
        count: durations.length,
        average: this.average(durations),
        max: Math.max(...durations),
        min: Math.min(...durations)
      };
    });
    
    return stats;
  }

  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };
  }

  // Utility methods
  average(numbers) {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  // Export methods
  exportReport() {
    const report = this.getPerformanceReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-arcades-performance-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Debug methods
  logCurrentStats() {
    console.group('📊 Performance Stats');
    console.log('Frame Stats:', this.getFrameStats());
    console.log('Memory Stats:', this.getMemoryStats());
    console.log('Operation Stats:', this.getOperationStats());
    console.log('Warnings:', this.warnings);
    console.groupEnd();
  }

  clearMetrics() {
    this.metrics.clear();
    this.frameMetrics = [];
    this.memoryMetrics = [];
    this.interactionMetrics = [];
    this.warnings = [];
    this.loadMetrics.clear();
    
    console.log('📊 Performance metrics cleared');
  }
}

export { PerformanceMonitor };
