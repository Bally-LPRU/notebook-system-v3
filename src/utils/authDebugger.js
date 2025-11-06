// Auth Debugger Utility
// Helps diagnose authentication issues

export class AuthDebugger {
  static checkBrowserSupport() {
    const checks = {
      localStorage: typeof Storage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      popups: true, // Will be tested dynamically
      cookies: navigator.cookieEnabled,
      javascript: true, // Obviously true if this runs
      webgl: !!window.WebGLRenderingContext,
      webrtc: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };

    // Test popup support
    try {
      const testPopup = window.open('', '_blank', 'width=1,height=1');
      if (testPopup && !testPopup.closed) {
        testPopup.close();
        checks.popups = true;
      } else {
        checks.popups = false;
      }
    } catch (error) {
      checks.popups = false;
    }

    return checks;
  }

  static checkFirebaseConfig() {
    try {
      const config = {
        hasApiKey: !!process.env.REACT_APP_FIREBASE_API_KEY || !!window.firebaseConfig?.apiKey,
        hasAuthDomain: !!process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || !!window.firebaseConfig?.authDomain,
        hasProjectId: !!process.env.REACT_APP_FIREBASE_PROJECT_ID || !!window.firebaseConfig?.projectId,
        hasStorageBucket: !!process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || !!window.firebaseConfig?.storageBucket,
        hasMessagingSenderId: !!process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || !!window.firebaseConfig?.messagingSenderId,
        hasAppId: !!process.env.REACT_APP_FIREBASE_APP_ID || !!window.firebaseConfig?.appId
      };

      const allConfigured = Object.values(config).every(Boolean);
      
      return {
        ...config,
        allConfigured,
        environment: process.env.NODE_ENV
      };
    } catch (error) {
      return {
        error: error.message,
        allConfigured: false
      };
    }
  }

  static checkNetworkConnectivity() {
    return {
      online: navigator.onLine,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      } : null,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    };
  }

  static async testFirebaseConnection() {
    try {
      // Test Firebase Auth endpoint
      const authTest = await fetch('https://identitytoolkit.googleapis.com/v1/projects', {
        method: 'HEAD',
        mode: 'no-cors'
      });

      // Test Firestore endpoint
      const firestoreTest = await fetch('https://firestore.googleapis.com/v1/projects', {
        method: 'HEAD',
        mode: 'no-cors'
      });

      return {
        auth: true, // no-cors mode doesn't give us real status
        firestore: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        auth: false,
        firestore: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  static checkSecurityHeaders() {
    const headers = {};
    
    // Check if we can access security-related headers
    try {
      headers.contentSecurityPolicy = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || 'Not set';
      headers.xFrameOptions = 'Cannot check from client';
      headers.httpsOnly = window.location.protocol === 'https:';
      headers.secureContext = window.isSecureContext;
    } catch (error) {
      headers.error = error.message;
    }

    return headers;
  }

  static async runFullDiagnostic() {
    console.log('🔍 Running Auth Diagnostic...');
    
    const diagnostic = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      browserSupport: this.checkBrowserSupport(),
      firebaseConfig: this.checkFirebaseConfig(),
      networkConnectivity: this.checkNetworkConnectivity(),
      securityHeaders: this.checkSecurityHeaders(),
      firebaseConnection: await this.testFirebaseConnection()
    };

    console.log('📊 Auth Diagnostic Results:', diagnostic);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(diagnostic);
    console.log('💡 Recommendations:', recommendations);

    return { diagnostic, recommendations };
  }

  static generateRecommendations(diagnostic) {
    const recommendations = [];

    // Browser support issues
    if (!diagnostic.browserSupport.popups) {
      recommendations.push({
        type: 'critical',
        issue: 'Popup blocked',
        solution: 'Enable popups for this site in browser settings'
      });
    }

    if (!diagnostic.browserSupport.localStorage) {
      recommendations.push({
        type: 'critical',
        issue: 'LocalStorage not available',
        solution: 'Enable localStorage in browser settings or use a different browser'
      });
    }

    // Firebase config issues
    if (!diagnostic.firebaseConfig.allConfigured) {
      recommendations.push({
        type: 'critical',
        issue: 'Firebase configuration incomplete',
        solution: 'Check environment variables and Firebase config'
      });
    }

    // Network issues
    if (!diagnostic.networkConnectivity.online) {
      recommendations.push({
        type: 'warning',
        issue: 'No network connection',
        solution: 'Check internet connection'
      });
    }

    // Security issues
    if (!diagnostic.securityHeaders.httpsOnly) {
      recommendations.push({
        type: 'warning',
        issue: 'Not using HTTPS',
        solution: 'Use HTTPS for secure authentication'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        issue: 'No issues detected',
        solution: 'Configuration appears correct'
      });
    }

    return recommendations;
  }

  static logAuthAttempt(method, success, error = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method,
      success,
      error: error ? {
        code: error.code,
        message: error.message,
        stack: error.stack
      } : null,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log(`🔐 Auth Attempt [${method}]:`, logEntry);
    
    // Store in localStorage for debugging
    try {
      const authLogs = JSON.parse(localStorage.getItem('auth_debug_logs') || '[]');
      authLogs.push(logEntry);
      
      // Keep only last 10 entries
      if (authLogs.length > 10) {
        authLogs.splice(0, authLogs.length - 10);
      }
      
      localStorage.setItem('auth_debug_logs', JSON.stringify(authLogs));
    } catch (error) {
      console.warn('Could not store auth debug log:', error);
    }

    return logEntry;
  }

  static getAuthLogs() {
    try {
      return JSON.parse(localStorage.getItem('auth_debug_logs') || '[]');
    } catch (error) {
      console.warn('Could not retrieve auth debug logs:', error);
      return [];
    }
  }

  static clearAuthLogs() {
    try {
      localStorage.removeItem('auth_debug_logs');
      console.log('🗑️ Auth debug logs cleared');
    } catch (error) {
      console.warn('Could not clear auth debug logs:', error);
    }
  }
}

// Auto-run diagnostic in development
if (process.env.NODE_ENV === 'development') {
  window.authDebugger = AuthDebugger;
  console.log('🔧 Auth Debugger available as window.authDebugger');
  console.log('Run window.authDebugger.runFullDiagnostic() to diagnose auth issues');
}

export default AuthDebugger;