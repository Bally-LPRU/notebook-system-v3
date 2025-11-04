/**
 * Debug utilities for error monitoring and logging
 * Provides easy access to error logs and statistics for debugging
 */

import { getErrorStats, clearErrorLogs, exportErrorLogs } from './errorLogger';

class DebugUtils {
  /**
   * Display error statistics in console
   */
  static showErrorStats() {
    const stats = getErrorStats();
    if (!stats) {
      console.log('📊 No error statistics available');
      return;
    }

    console.group('📊 Error Statistics');
    console.log(`Total errors: ${stats.total}`);
    
    if (Object.keys(stats.byType).length > 0) {
      console.group('By Type:');
      Object.entries(stats.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      console.groupEnd();
    }

    if (Object.keys(stats.bySeverity).length > 0) {
      console.group('By Severity:');
      Object.entries(stats.bySeverity).forEach(([severity, count]) => {
        console.log(`  ${severity}: ${count}`);
      });
      console.groupEnd();
    }

    if (Object.keys(stats.byCategory).length > 0) {
      console.group('By Category:');
      Object.entries(stats.byCategory).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });
      console.groupEnd();
    }

    if (stats.recent && stats.recent.length > 0) {
      console.group('Recent Errors:');
      stats.recent.forEach((error, index) => {
        console.log(`${index + 1}. [${error.severity}] ${error.type}: ${error.error?.message || 'Unknown error'}`);
      });
      console.groupEnd();
    }

    console.groupEnd();
    return stats;
  }

  /**
   * Clear all error logs
   */
  static clearLogs() {
    clearErrorLogs();
    console.log('🧹 Error logs cleared');
  }

  /**
   * Export error logs as JSON string
   */
  static exportLogs() {
    const logs = exportErrorLogs();
    if (logs) {
      console.log('📤 Error logs exported:');
      console.log(logs);
      
      // Also copy to clipboard if available
      if (navigator.clipboard) {
        navigator.clipboard.writeText(logs).then(() => {
          console.log('📋 Error logs copied to clipboard');
        }).catch(() => {
          console.log('📋 Could not copy to clipboard');
        });
      }
      
      return logs;
    } else {
      console.log('📤 No error logs to export');
      return null;
    }
  }

  /**
   * Monitor Firebase service status
   */
  static async checkFirebaseStatus() {
    try {
      const { getServiceStatus } = await import('../config/firebase');
      const status = getServiceStatus();
      
      console.group('🔥 Firebase Service Status');
      Object.entries(status).forEach(([service, available]) => {
        const icon = available ? '✅' : '❌';
        console.log(`${icon} ${service}: ${available ? 'Available' : 'Unavailable'}`);
      });
      console.groupEnd();
      
      return status;
    } catch (error) {
      console.error('Failed to check Firebase status:', error);
      return null;
    }
  }

  /**
   * Test error logging functionality
   */
  static testErrorLogging() {
    console.log('🧪 Testing error logging functionality...');
    
    try {
      const { logError } = require('./errorLogger');
      
      // Test different types of errors
      logError({
        type: 'test_error',
        error: new Error('This is a test error'),
        context: { test: true },
        severity: 'low',
        category: 'testing'
      });
      
      console.log('✅ Error logging test completed');
      
      // Show the logged error
      setTimeout(() => {
        this.showErrorStats();
      }, 100);
      
    } catch (error) {
      console.error('❌ Error logging test failed:', error);
    }
  }

  /**
   * Get Firebase configuration status (without exposing sensitive data)
   */
  static checkFirebaseConfig() {
    console.group('🔧 Firebase Configuration Status');
    
    const requiredVars = [
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_PROJECT_ID',
      'REACT_APP_FIREBASE_STORAGE_BUCKET',
      'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
      'REACT_APP_FIREBASE_APP_ID'
    ];
    
    const configStatus = {};
    requiredVars.forEach(varName => {
      const isSet = !!process.env[varName];
      const icon = isSet ? '✅' : '❌';
      console.log(`${icon} ${varName}: ${isSet ? 'Set' : 'Missing'}`);
      configStatus[varName] = isSet;
    });
    
    console.log(`Environment: ${process.env.NODE_ENV || 'unknown'}`);
    console.log(`React App Environment: ${process.env.REACT_APP_ENVIRONMENT || 'not set'}`);
    
    console.groupEnd();
    
    return configStatus;
  }

  /**
   * Show all available debug commands
   */
  static help() {
    console.group('🛠️ Debug Utils Commands');
    console.log('DebugUtils.showErrorStats() - Display error statistics');
    console.log('DebugUtils.clearLogs() - Clear all error logs');
    console.log('DebugUtils.exportLogs() - Export error logs as JSON');
    console.log('DebugUtils.checkFirebaseStatus() - Check Firebase service status');
    console.log('DebugUtils.checkFirebaseConfig() - Check Firebase configuration');
    console.log('DebugUtils.testErrorLogging() - Test error logging functionality');
    console.log('DebugUtils.help() - Show this help message');
    console.groupEnd();
  }
}

// Make DebugUtils available globally in development
if (process.env.NODE_ENV === 'development') {
  window.DebugUtils = DebugUtils;
  console.log('🛠️ DebugUtils available globally. Type DebugUtils.help() for commands.');
}

export default DebugUtils;