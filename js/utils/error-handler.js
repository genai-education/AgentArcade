/**
 * Error Handler Utility
 * Centralized error handling and user feedback
 */

class ErrorHandler {
  constructor() {
    this.errorContainer = null;
    this.errorQueue = [];
    this.maxErrors = 5;
    this.errorTimeout = 5000; // 5 seconds
    this.isInitialized = false;
  }

  initialize() {
    this.errorContainer = document.getElementById('error-container');
    
    // Global error handlers
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    
    this.isInitialized = true;
    console.log('🛡️ Error Handler initialized');
  }

  handleError(error, context = 'Unknown', userMessage = null) {
    console.error(`[${context}]`, error);
    
    // Log error details
    this.logError(error, context);
    
    // Show user-friendly message
    const message = userMessage || this.getUserFriendlyMessage(error, context);
    this.showError(message, 'error');
    
    // Report error if analytics enabled
    this.reportError(error, context);
  }

  handleWarning(message, context = 'Warning') {
    console.warn(`[${context}]`, message);
    this.showError(message, 'warning');
  }

  handleInfo(message, context = 'Info') {
    console.info(`[${context}]`, message);
    this.showError(message, 'info');
  }

  handleSuccess(message, context = 'Success') {
    console.log(`[${context}]`, message);
    this.showError(message, 'success');
  }

  handleGlobalError(event) {
    this.handleError(
      event.error || new Error(event.message),
      'Global Error',
      'An unexpected error occurred. Please refresh the page if problems persist.'
    );
  }

  handleUnhandledRejection(event) {
    this.handleError(
      event.reason,
      'Unhandled Promise Rejection',
      'A background operation failed. The application should continue to work normally.'
    );
    
    // Prevent the default browser behavior
    event.preventDefault();
  }

  showError(message, type = 'error', duration = null) {
    if (!this.isInitialized || !this.errorContainer) {
      console.warn('Error handler not initialized, falling back to console');
      console.log(`[${type.toUpperCase()}]`, message);
      return;
    }

    // Create error element
    const errorElement = this.createErrorElement(message, type);
    
    // Add to container
    this.errorContainer.appendChild(errorElement);
    this.errorContainer.classList.remove('hidden');
    
    // Add to queue
    this.errorQueue.push(errorElement);
    
    // Remove oldest errors if queue is full
    while (this.errorQueue.length > this.maxErrors) {
      const oldError = this.errorQueue.shift();
      if (oldError.parentNode) {
        oldError.parentNode.removeChild(oldError);
      }
    }
    
    // Auto-remove after timeout
    const timeout = duration || this.getTimeoutForType(type);
    setTimeout(() => {
      this.removeError(errorElement);
    }, timeout);
    
    // Animate in
    requestAnimationFrame(() => {
      errorElement.classList.add('show');
    });
  }

  createErrorElement(message, type) {
    const errorElement = document.createElement('div');
    errorElement.className = `error-message ${type}`;
    
    const icon = this.getIconForType(type);
    const title = this.getTitleForType(type);
    
    errorElement.innerHTML = `
      <div class="error-header">
        <span class="error-icon">${icon}</span>
        <h3 class="error-title">${title}</h3>
        <button class="error-close" aria-label="Close">×</button>
      </div>
      <p class="error-text">${this.escapeHtml(message)}</p>
    `;
    
    // Add close button functionality
    const closeButton = errorElement.querySelector('.error-close');
    closeButton.addEventListener('click', () => {
      this.removeError(errorElement);
    });
    
    return errorElement;
  }

  removeError(errorElement) {
    if (!errorElement || !errorElement.parentNode) return;
    
    errorElement.classList.add('removing');
    
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
      }
      
      // Remove from queue
      const index = this.errorQueue.indexOf(errorElement);
      if (index > -1) {
        this.errorQueue.splice(index, 1);
      }
      
      // Hide container if no errors
      if (this.errorQueue.length === 0 && this.errorContainer) {
        this.errorContainer.classList.add('hidden');
      }
    }, 300); // Match CSS transition duration
  }

  getIconForType(type) {
    const icons = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅'
    };
    return icons[type] || icons.error;
  }

  getTitleForType(type) {
    const titles = {
      error: 'Error',
      warning: 'Warning',
      info: 'Information',
      success: 'Success'
    };
    return titles[type] || titles.error;
  }

  getTimeoutForType(type) {
    const timeouts = {
      error: 8000,
      warning: 6000,
      info: 4000,
      success: 3000
    };
    return timeouts[type] || this.errorTimeout;
  }

  getUserFriendlyMessage(error, context) {
    // Map technical errors to user-friendly messages
    const errorMappings = {
      'NetworkError': 'Network connection failed. Please check your internet connection.',
      'QuotaExceededError': 'Storage quota exceeded. Please free up some space.',
      'NotAllowedError': 'Permission denied. Please check your browser settings.',
      'AbortError': 'Operation was cancelled.',
      'TimeoutError': 'Operation timed out. Please try again.',
      'SecurityError': 'Security error occurred. Please check your browser settings.',
      'SyntaxError': 'Data format error. Please try again or contact support.',
      'TypeError': 'Unexpected data type. Please refresh the page.',
      'ReferenceError': 'Missing component. Please refresh the page.',
      'RangeError': 'Value out of range. Please check your input.'
    };
    
    // Check for specific error types
    if (error.name && errorMappings[error.name]) {
      return errorMappings[error.name];
    }
    
    // Check for specific error messages
    const message = error.message || error.toString();
    
    if (message.includes('fetch')) {
      return 'Failed to load data. Please check your internet connection.';
    }
    
    if (message.includes('WebGPU')) {
      return 'WebGPU is not supported or available. Please use a compatible browser.';
    }
    
    if (message.includes('IndexedDB')) {
      return 'Database error occurred. Please try refreshing the page.';
    }
    
    if (message.includes('Web-LLM')) {
      return 'AI model error. Please try refreshing the page or use a different model.';
    }
    
    // Context-specific messages
    const contextMappings = {
      'Web-LLM Integration': 'AI model failed to load. Please refresh the page.',
      'Node Editor': 'Visual editor error. Please try refreshing the page.',
      'Agent Engine': 'Simulation error occurred. Please try again.',
      'Storage': 'Data storage error. Please check available storage space.',
      'Tournament': 'Tournament system error. Please try again later.',
      'Skill Chips': 'Skill chip system error. Please try again.'
    };
    
    if (contextMappings[context]) {
      return contextMappings[context];
    }
    
    // Generic fallback
    return 'An unexpected error occurred. Please try again or refresh the page.';
  }

  logError(error, context) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context: context,
      message: error.message || error.toString(),
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId()
    };
    
    // Store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('agentArcades_errorLogs') || '[]');
      logs.push(errorLog);
      
      // Keep only last 50 errors
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('agentArcades_errorLogs', JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed to store error log:', e);
    }
  }

  reportError(error, context) {
    // Only report if user has opted in to analytics
    const analyticsEnabled = localStorage.getItem('agentArcades_analytics') === 'true';
    if (!analyticsEnabled) return;
    
    // Report to analytics service (if implemented)
    try {
      // This would integrate with your analytics service
      console.log('Error reported:', { error, context });
    } catch (e) {
      console.warn('Failed to report error:', e);
    }
  }

  getCurrentUserId() {
    try {
      const userProfile = JSON.parse(localStorage.getItem('agentArcades_userProfile') || '{}');
      return userProfile.id || 'anonymous';
    } catch (e) {
      return 'anonymous';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility methods for common error scenarios
  handleWebGPUError(error) {
    this.handleError(
      error,
      'WebGPU',
      'WebGPU is not supported in your browser. Please use Chrome 113+ or Edge 113+ for the best experience.'
    );
  }

  handleModelLoadError(error) {
    this.handleError(
      error,
      'Model Loading',
      'Failed to load AI model. Please check your internet connection and try again.'
    );
  }

  handleStorageError(error) {
    this.handleError(
      error,
      'Storage',
      'Failed to save data. Please check if you have enough storage space available.'
    );
  }

  handleNetworkError(error) {
    this.handleError(
      error,
      'Network',
      'Network error occurred. Please check your internet connection and try again.'
    );
  }

  handleValidationError(error, field = null) {
    const message = field 
      ? `Invalid ${field}. Please check your input and try again.`
      : 'Invalid input. Please check your data and try again.';
    
    this.handleError(error, 'Validation', message);
  }

  // Debug methods
  getErrorLogs() {
    try {
      return JSON.parse(localStorage.getItem('agentArcades_errorLogs') || '[]');
    } catch (e) {
      return [];
    }
  }

  clearErrorLogs() {
    try {
      localStorage.removeItem('agentArcades_errorLogs');
      this.handleSuccess('Error logs cleared successfully');
    } catch (e) {
      this.handleError(e, 'Clear Logs', 'Failed to clear error logs');
    }
  }

  exportErrorLogs() {
    try {
      const logs = this.getErrorLogs();
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-arcades-error-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.handleSuccess('Error logs exported successfully');
    } catch (e) {
      this.handleError(e, 'Export Logs', 'Failed to export error logs');
    }
  }

  // Cleanup
  destroy() {
    // Remove global error handlers
    window.removeEventListener('error', this.handleGlobalError.bind(this));
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    
    // Clear error queue
    this.errorQueue.forEach(errorElement => {
      if (errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
      }
    });
    this.errorQueue = [];
    
    // Hide error container
    if (this.errorContainer) {
      this.errorContainer.classList.add('hidden');
    }
    
    this.isInitialized = false;
  }
}

export { ErrorHandler };
