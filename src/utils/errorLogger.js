/**
 * Error Logging and Monitoring Utility
 * Provides comprehensive error logging for production debugging and Firebase service failure tracking
 */

// Removed import to prevent circular dependency
// import { safelyUseAnalytics } from '../config/firebase';

class ErrorLogger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.sessionId = this.generateSessionId();
    this.errorQueue = [];
    this.maxQueueSize = 100;
    this.flushInterval = 30000; // 30 seconds
    
    // Initialize error tracking
    this.initializeErrorTracking();
    
    // Start periodic flush in production
    if (this.isProduction) {
      this.startPeriodicFlush();
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  initializeErrorTracking() {
    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled_promise_rejection',
        error: event.reason,
        context: 'window_unhandled_rejection',
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    });

    // Track global JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript_error',
        error: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        },
        context: 'window_error',
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Log Firebase service errors with specific categorization
   */
  logFirebaseError(error, service, operation, context = {}) {
    const firebaseError = {
      type: 'firebase_error',
      service,
      operation,
      error: this.sanitizeError(error),
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId
      },
      severity: this.categorizeFirebaseErrorSeverity(error, service),
      category: this.categorizeFirebaseError(error, service)
    };

    this.logError(firebaseError);
    
    // Send to Firebase Analytics if available
    this.trackFirebaseErrorInAnalytics(firebaseError);
    
    return firebaseError;
  }

  /**
   * Log general application errors
   */
  logError(errorData) {
    const enrichedError = {
      ...errorData,
      sessionId: this.sessionId,
      timestamp: errorData.timestamp || new Date().toISOString(),
      environment: this.isProduction ? 'production' : 'development',
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Add to error queue
    this.addToQueue(enrichedError);

    // Console logging based on environment
    if (this.isDevelopment) {
      this.logToConsole(enrichedError);
    } else {
      // In production, only log critical errors to console
      if (enrichedError.severity === 'critical' || enrichedError.severity === 'high') {
        console.error('🚨 Critical Error:', {
          type: enrichedError.type,
          message: enrichedError.error?.message || 'Unknown error',
          timestamp: enrichedError.timestamp,
          sessionId: enrichedError.sessionId
        });
      }
    }

    // Send to external logging service in production
    if (this.isProduction) {
      this.sendToExternalService(enrichedError);
    }

    return enrichedError;
  }

  /**
   * Log Firebase service initialization status
   */
  logFirebaseServiceStatus(serviceStatus) {
    const statusLog = {
      type: 'firebase_service_status',
      services: serviceStatus,
      context: {
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        environment: this.isProduction ? 'production' : 'development'
      },
      severity: 'info'
    };

    this.logError(statusLog);

    // Track service availability in analytics (disabled to prevent circular dependency)
    if (window.gtag) {
      window.gtag('event', 'firebase_service_status', {
        auth_available: serviceStatus.auth,
        firestore_available: serviceStatus.firestore,
        storage_available: serviceStatus.storage,
        analytics_available: serviceStatus.analytics,
        performance_available: serviceStatus.performance,
        session_id: this.sessionId
      });
    }
  }

  /**
   * Log authentication errors with user context
   */
  logAuthError(error, operation, userContext = {}) {
    const authError = {
      type: 'authentication_error',
      operation,
      error: this.sanitizeError(error),
      userContext: {
        ...userContext,
        // Remove sensitive information
        uid: userContext.uid ? 'present' : 'absent',
        email: userContext.email ? 'present' : 'absent'
      },
      context: {
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        url: window.location.href
      },
      severity: this.categorizeAuthErrorSeverity(error),
      category: 'authentication'
    };

    this.logError(authError);
    
    // Track auth errors in analytics (disabled to prevent circular dependency)
    if (window.gtag) {
      window.gtag('event', 'auth_error', {
        error_code: error.code || 'unknown',
        operation: operation,
        session_id: this.sessionId
      });
    }

    return authError;
  }

  /**
   * Categorize Firebase errors by service and type
   */
  categorizeFirebaseError(error, service) {
    const errorCode = error?.code || '';
    const errorMessage = error?.message?.toLowerCase() || '';

    if (service === 'auth') {
      if (errorCode.startsWith('auth/')) {
        return 'firebase_auth';
      }
    }

    if (service === 'firestore') {
      if (errorCode.includes('firestore') || errorMessage.includes('firestore')) {
        return 'firebase_firestore';
      }
    }

    if (service === 'storage') {
      if (errorCode.includes('storage') || errorMessage.includes('storage')) {
        return 'firebase_storage';
      }
    }

    if (service === 'analytics' || service === 'performance') {
      return 'firebase_optional';
    }

    if (errorMessage.includes('configuration') || errorMessage.includes('environment')) {
      return 'firebase_config';
    }

    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return 'firebase_network';
    }

    return 'firebase_general';
  }

  /**
   * Determine error severity for Firebase errors
   */
  categorizeFirebaseErrorSeverity(error, service) {
    const errorCode = error?.code || '';
    const errorMessage = error?.message?.toLowerCase() || '';

    // Critical errors that break core functionality
    if (errorMessage.includes('configuration') || 
        errorMessage.includes('missing required environment') ||
        (service === 'auth' && errorCode === 'auth/invalid-api-key')) {
      return 'critical';
    }

    // High severity for core service failures
    if ((service === 'auth' || service === 'firestore' || service === 'storage') &&
        (errorMessage.includes('initialization') || errorCode.includes('unavailable'))) {
      return 'high';
    }

    // Medium severity for recoverable errors
    if (errorCode.includes('permission-denied') || 
        errorCode.includes('not-found') ||
        errorMessage.includes('network')) {
      return 'medium';
    }

    // Low severity for optional services
    if (service === 'analytics' || service === 'performance') {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Determine error severity for authentication errors
   */
  categorizeAuthErrorSeverity(error) {
    const errorCode = error?.code || '';

    // Critical auth errors
    if (errorCode === 'auth/invalid-api-key' || 
        errorCode === 'auth/app-deleted') {
      return 'critical';
    }

    // High severity auth errors
    if (errorCode === 'auth/network-request-failed' ||
        errorCode === 'auth/internal-error') {
      return 'high';
    }

    // Medium severity for user errors
    if (errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/wrong-password' ||
        errorCode === 'auth/popup-closed-by-user') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Sanitize error objects to remove sensitive information
   */
  sanitizeError(error) {
    if (!error) return null;

    const sanitized = {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: this.isProduction ? undefined : error.stack // Only include stack in development
    };

    // Remove sensitive information from error messages
    if (sanitized.message) {
      sanitized.message = sanitized.message
        .replace(/apiKey=[\w-]+/g, 'apiKey=***')
        .replace(/token=[\w-]+/g, 'token=***')
        .replace(/key=[\w-]+/g, 'key=***');
    }

    return sanitized;
  }

  /**
   * Add error to queue for batch processing
   */
  addToQueue(errorData) {
    this.errorQueue.push(errorData);

    // Prevent queue from growing too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest error
    }

    // Immediate flush for critical errors
    if (errorData.severity === 'critical') {
      this.flushQueue();
    }
  }

  /**
   * Log to console with appropriate formatting
   */
  logToConsole(errorData) {
    const logMethod = this.getConsoleMethod(errorData.severity);
    const prefix = this.getLogPrefix(errorData.type);

    logMethod(`${prefix} ${errorData.type}:`, {
      error: errorData.error,
      context: errorData.context,
      severity: errorData.severity,
      timestamp: errorData.timestamp
    });
  }

  getConsoleMethod(severity) {
    switch (severity) {
      case 'critical':
      case 'high':
        return console.error;
      case 'medium':
        return console.warn;
      case 'low':
      case 'info':
        return console.info;
      default:
        return console.log;
    }
  }

  getLogPrefix(type) {
    const prefixes = {
      firebase_error: '🔥',
      authentication_error: '🔐',
      firebase_service_status: '📊',
      javascript_error: '⚠️',
      unhandled_promise_rejection: '🚨',
      network_error: '🌐',
      component_error: '⚛️'
    };

    return prefixes[type] || '📝';
  }

  /**
   * Track Firebase errors in Analytics
   */
  trackFirebaseErrorInAnalytics(errorData) {
    // Analytics disabled to prevent circular dependency
    if (window.gtag) {
      window.gtag('event', 'firebase_error', {
        service: errorData.service,
        operation: errorData.operation,
        error_code: errorData.error?.code || 'unknown',
        error_category: errorData.category,
        severity: errorData.severity,
        session_id: this.sessionId
      });
    }
  }

  /**
   * Send error data to external logging service
   */
  sendToExternalService(errorData) {
    // This would integrate with services like Sentry, LogRocket, etc.
    // For now, we'll store in localStorage as a fallback
    try {
      const existingLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      existingLogs.push(errorData);
      
      // Keep only last 50 errors in localStorage
      const recentLogs = existingLogs.slice(-50);
      localStorage.setItem('error_logs', JSON.stringify(recentLogs));
    } catch (storageError) {
      console.warn('Failed to store error log:', storageError);
    }
  }

  /**
   * Start periodic queue flushing
   */
  startPeriodicFlush() {
    setInterval(() => {
      this.flushQueue();
    }, this.flushInterval);
  }

  /**
   * Flush error queue
   */
  flushQueue() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    // In production, send batch to external service
    if (this.isProduction) {
      this.sendBatchToExternalService(errors);
    }
  }

  /**
   * Send batch of errors to external service
   */
  sendBatchToExternalService(errors) {
    // This would send to external logging service
    // For now, we'll just log the batch size
    console.info(`📊 Flushed ${errors.length} errors to logging service`);
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    try {
      const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      const stats = {
        total: logs.length,
        byType: {},
        bySeverity: {},
        byCategory: {},
        recent: logs.slice(-10)
      };

      logs.forEach(log => {
        // Count by type
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
        
        // Count by severity
        stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
        
        // Count by category
        if (log.category) {
          stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.warn('Failed to get error stats:', error);
      return null;
    }
  }

  /**
   * Clear error logs
   */
  clearLogs() {
    try {
      localStorage.removeItem('error_logs');
      this.errorQueue = [];
      console.info('📊 Error logs cleared');
    } catch (error) {
      console.warn('Failed to clear error logs:', error);
    }
  }

  /**
   * Export error logs for debugging
   */
  exportLogs() {
    try {
      const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      const exportData = {
        sessionId: this.sessionId,
        exportTime: new Date().toISOString(),
        environment: this.isProduction ? 'production' : 'development',
        logs: logs,
        stats: this.getErrorStats()
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.warn('Failed to export error logs:', error);
      return null;
    }
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

// Export convenience methods
export const logFirebaseError = (error, service, operation, context) => 
  errorLogger.logFirebaseError(error, service, operation, context);

export const logAuthError = (error, operation, userContext) => 
  errorLogger.logAuthError(error, operation, userContext);

export const logError = (errorData) => 
  errorLogger.logError(errorData);

export const logFirebaseServiceStatus = (serviceStatus) => 
  errorLogger.logFirebaseServiceStatus(serviceStatus);

export const getErrorStats = () => 
  errorLogger.getErrorStats();

export const clearErrorLogs = () => 
  errorLogger.clearLogs();

export const exportErrorLogs = () => 
  errorLogger.exportLogs();

export default errorLogger;