/**
 * Retry Handler Utility
 * Provides retry mechanisms with exponential backoff for transient errors
 */

import { ErrorClassifier, ERROR_SEVERITY } from './errorClassification';
import { logError } from './errorLogger';

/**
 * Retry Handler Class
 * Handles automatic retries with exponential backoff and circuit breaker pattern
 */
export class RetryHandler {
  constructor(options = {}) {
    this.defaultOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      ...options
    };
    
    // Circuit breaker state
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: null,
      state: 'closed' // closed, open, half-open
    };
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry(operation, context = {}, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    const operationContext = {
      operation: context.operation || 'unknown',
      component: context.component || 'unknown',
      ...context
    };

    // Check circuit breaker
    if (this._isCircuitBreakerOpen()) {
      const error = new Error('Circuit breaker is open - too many recent failures');
      const classification = ErrorClassifier.classify(error, operationContext);
      throw this._createRetryError(classification, 0, config.maxRetries);
    }

    let lastError = null;
    let attempt = 0;

    while (attempt < config.maxRetries) {
      attempt++;
      
      try {
        // Log retry attempt
        if (attempt > 1) {
          logError({
            type: 'retry_attempt',
            context: {
              ...operationContext,
              attempt,
              maxRetries: config.maxRetries
            },
            severity: 'info'
          });
        }

        const result = await operation();
        
        // Reset circuit breaker on success
        this._resetCircuitBreaker();
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Classify the error
        const classification = ErrorClassifier.classify(error, operationContext);
        
        // Log the error
        logError({
          type: 'operation_error',
          error: classification.originalError,
          context: {
            ...operationContext,
            attempt,
            maxRetries: config.maxRetries,
            classification
          },
          severity: classification.severity
        });

        // Check if we should retry
        if (!this._shouldRetry(classification, attempt, config.maxRetries)) {
          this._updateCircuitBreaker(classification);
          throw this._createRetryError(classification, attempt, config.maxRetries);
        }

        // Calculate delay for next attempt
        const delay = this._calculateDelay(
          classification.retryDelay || config.baseDelay,
          attempt,
          config.maxDelay,
          config.backoffMultiplier,
          config.jitter
        );

        // Wait before next attempt
        await this._sleep(delay);
      }
    }

    // All retries exhausted
    if (lastError) {
      const classification = ErrorClassifier.classify(lastError, operationContext);
      this._updateCircuitBreaker(classification);
      throw this._createRetryError(classification, attempt, config.maxRetries);
    }
  }

  /**
   * Execute operation with manual retry capability
   */
  async executeWithManualRetry(operation, context = {}, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    const operationContext = {
      operation: context.operation || 'unknown',
      component: context.component || 'unknown',
      ...context
    };

    try {
      return await operation();
    } catch (error) {
      const classification = ErrorClassifier.classify(error, operationContext);
      
      // Log the error
      logError({
        type: 'operation_error_manual_retry',
        error: classification.originalError,
        context: {
          ...operationContext,
          classification,
          manualRetryAvailable: classification.retryable
        },
        severity: classification.severity
      });

      // Create enhanced error with retry information
      const retryError = this._createRetryError(classification, 1, 1);
      retryError.manualRetryAvailable = classification.retryable;
      retryError.retryHandler = this;
      retryError.retryOperation = operation;
      retryError.retryContext = operationContext;
      retryError.retryOptions = config;

      throw retryError;
    }
  }

  /**
   * Manual retry method for UI components
   */
  async retry(retryError) {
    if (!retryError.retryOperation) {
      throw new Error('No retry operation available');
    }

    return this.executeWithRetry(
      retryError.retryOperation,
      retryError.retryContext,
      retryError.retryOptions
    );
  }

  /**
   * Check if operation should be retried
   */
  _shouldRetry(classification, currentAttempt, maxRetries) {
    // Don't retry if not retryable
    if (!classification.retryable) {
      return false;
    }

    // Don't retry if max attempts reached
    if (currentAttempt >= maxRetries) {
      return false;
    }

    // Don't retry critical errors
    if (classification.severity === ERROR_SEVERITY.CRITICAL) {
      return false;
    }

    // Don't retry validation errors
    if (classification.category === 'validation') {
      return false;
    }

    return true;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  _calculateDelay(baseDelay, attempt, maxDelay, multiplier, useJitter) {
    let delay = baseDelay * Math.pow(multiplier, attempt - 1);
    
    if (useJitter) {
      // Add random jitter (±25% of delay)
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }
    
    return Math.min(Math.max(delay, 0), maxDelay);
  }

  /**
   * Sleep utility
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create enhanced retry error
   */
  _createRetryError(classification, attempts, maxRetries) {
    const errorMessage = ErrorClassifier.getErrorMessage(classification);
    
    const retryError = new Error(errorMessage.message);
    retryError.name = 'RetryError';
    retryError.classification = classification;
    retryError.errorMessage = errorMessage;
    retryError.attempts = attempts;
    retryError.maxRetries = maxRetries;
    retryError.exhausted = attempts >= maxRetries;
    retryError.originalError = classification.originalError;
    
    return retryError;
  }

  /**
   * Circuit breaker methods
   */
  _isCircuitBreakerOpen() {
    if (this.circuitBreaker.state === 'closed') {
      return false;
    }
    
    if (this.circuitBreaker.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime;
      if (timeSinceLastFailure > this.defaultOptions.circuitBreakerTimeout) {
        this.circuitBreaker.state = 'half-open';
        return false;
      }
      return true;
    }
    
    // half-open state
    return false;
  }

  _updateCircuitBreaker(classification) {
    if (classification.severity === ERROR_SEVERITY.HIGH || 
        classification.severity === ERROR_SEVERITY.CRITICAL) {
      this.circuitBreaker.failures++;
      this.circuitBreaker.lastFailureTime = Date.now();
      
      if (this.circuitBreaker.failures >= this.defaultOptions.circuitBreakerThreshold) {
        this.circuitBreaker.state = 'open';
        
        logError({
          type: 'circuit_breaker_opened',
          context: {
            failures: this.circuitBreaker.failures,
            threshold: this.defaultOptions.circuitBreakerThreshold
          },
          severity: 'high'
        });
      }
    }
  }

  _resetCircuitBreaker() {
    if (this.circuitBreaker.failures > 0) {
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.lastFailureTime = null;
      this.circuitBreaker.state = 'closed';
      
      logError({
        type: 'circuit_breaker_reset',
        context: {
          message: 'Circuit breaker reset after successful operation'
        },
        severity: 'info'
      });
    }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return {
      state: this.circuitBreaker.state,
      failures: this.circuitBreaker.failures,
      threshold: this.defaultOptions.circuitBreakerThreshold,
      lastFailureTime: this.circuitBreaker.lastFailureTime,
      isOpen: this._isCircuitBreakerOpen()
    };
  }
}

/**
 * Utility functions for common retry patterns
 */

// Create default retry handler instance
const defaultRetryHandler = new RetryHandler();

/**
 * Simple retry function with default configuration
 */
export const withRetry = async (operation, context = {}, options = {}) => {
  return defaultRetryHandler.executeWithRetry(operation, context, options);
};

/**
 * Retry function with manual retry capability
 */
export const withManualRetry = async (operation, context = {}, options = {}) => {
  return defaultRetryHandler.executeWithManualRetry(operation, context, options);
};

/**
 * Profile-specific retry wrapper
 */
export const withProfileRetry = async (operation, context = {}) => {
  const profileContext = {
    operation: 'profile_operation',
    component: 'ProfileManager',
    ...context
  };
  
  const profileOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  };
  
  return defaultRetryHandler.executeWithRetry(operation, profileContext, profileOptions);
};

/**
 * Network-specific retry wrapper
 */
export const withNetworkRetry = async (operation, context = {}) => {
  const networkContext = {
    operation: 'network_operation',
    component: 'NetworkManager',
    ...context
  };
  
  const networkOptions = {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 2
  };
  
  return defaultRetryHandler.executeWithRetry(operation, networkContext, networkOptions);
};

/**
 * Firestore-specific retry wrapper
 */
export const withFirestoreRetry = async (operation, context = {}) => {
  const firestoreContext = {
    operation: 'firestore_operation',
    component: 'FirestoreManager',
    ...context
  };
  
  const firestoreOptions = {
    maxRetries: 4,
    baseDelay: 1500,
    maxDelay: 20000,
    backoffMultiplier: 2.5
  };
  
  return defaultRetryHandler.executeWithRetry(operation, firestoreContext, firestoreOptions);
};

export default RetryHandler;