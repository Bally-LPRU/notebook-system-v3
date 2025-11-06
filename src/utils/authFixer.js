// Auth Fixer Utility
// Provides fixes for common authentication issues

export class AuthFixer {
  static async fixPopupBlocker() {
    try {
      // Test if popups are blocked
      const testPopup = window.open('', '_blank', 'width=1,height=1');
      
      if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
        return {
          blocked: true,
          message: 'Popup blocked by browser',
          instructions: [
            'คลิกที่ไอคอนป๊อปอัพที่ถูกบล็อกในแถบที่อยู่ของเบราว์เซอร์',
            'เลือก "อนุญาตป๊อปอัพสำหรับไซต์นี้"',
            'รีเฟรชหน้าเว็บและลองใหม่'
          ]
        };
      }
      
      testPopup.close();
      return {
        blocked: false,
        message: 'Popups are allowed'
      };
    } catch (error) {
      return {
        blocked: true,
        message: 'Error testing popup: ' + error.message,
        instructions: [
          'ตรวจสอบการตั้งค่าเบราว์เซอร์',
          'อนุญาตป๊อปอัพสำหรับไซต์นี้',
          'ลองใช้เบราว์เซอร์อื่น'
        ]
      };
    }
  }

  static async fixThirdPartyCookies() {
    try {
      // Test if third-party cookies are enabled
      const testFrame = document.createElement('iframe');
      testFrame.style.display = 'none';
      testFrame.src = 'https://accounts.google.com/gsi/iframe';
      
      document.body.appendChild(testFrame);
      
      return new Promise((resolve) => {
        testFrame.onload = () => {
          document.body.removeChild(testFrame);
          resolve({
            enabled: true,
            message: 'Third-party cookies are enabled'
          });
        };
        
        testFrame.onerror = () => {
          document.body.removeChild(testFrame);
          resolve({
            enabled: false,
            message: 'Third-party cookies are blocked',
            instructions: [
              'เปิดการตั้งค่าเบราว์เซอร์',
              'ไปที่ Privacy & Security > Cookies',
              'อนุญาต third-party cookies หรือเพิ่ม google.com เป็น exception',
              'รีเฟรชหน้าเว็บและลองใหม่'
            ]
          });
        };
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (document.body.contains(testFrame)) {
            document.body.removeChild(testFrame);
          }
          resolve({
            enabled: false,
            message: 'Third-party cookies test timeout',
            instructions: [
              'ตรวจสอบการตั้งค่า cookies ในเบราว์เซอร์',
              'อนุญาต cookies สำหรับ google.com',
              'ลองใช้เบราว์เซอร์อื่น'
            ]
          });
        }, 5000);
      });
    } catch (error) {
      return {
        enabled: false,
        message: 'Error testing third-party cookies: ' + error.message,
        instructions: [
          'ตรวจสอบการตั้งค่าเบราว์เซอร์',
          'อนุญาต cookies สำหรับ google.com',
          'ลองใช้เบราว์เซอร์อื่น'
        ]
      };
    }
  }

  static async fixLocalStorage() {
    try {
      // Test localStorage
      const testKey = 'auth_test_' + Date.now();
      localStorage.setItem(testKey, 'test');
      const testValue = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (testValue === 'test') {
        return {
          available: true,
          message: 'LocalStorage is working'
        };
      } else {
        throw new Error('LocalStorage test failed');
      }
    } catch (error) {
      return {
        available: false,
        message: 'LocalStorage is not available: ' + error.message,
        instructions: [
          'ตรวจสอบว่าเบราว์เซอร์ไม่ได้อยู่ในโหมด Private/Incognito',
          'ล้างข้อมูลเบราว์เซอร์และลองใหม่',
          'ตรวจสอบการตั้งค่า Storage ในเบราว์เซอร์',
          'ลองใช้เบราว์เซอร์อื่น'
        ]
      };
    }
  }

  static async fixServiceWorker() {
    try {
      if (!('serviceWorker' in navigator)) {
        return {
          supported: false,
          message: 'Service Worker not supported',
          instructions: [
            'ใช้เบราว์เซอร์ที่รองรับ Service Worker',
            'อัปเดตเบราว์เซอร์เป็นเวอร์ชันล่าสุด'
          ]
        };
      }

      // Check if SW is registered
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        // Check if SW is active
        if (registration.active) {
          return {
            supported: true,
            active: true,
            message: 'Service Worker is active'
          };
        } else {
          return {
            supported: true,
            active: false,
            message: 'Service Worker is registered but not active',
            instructions: [
              'รีเฟรชหน้าเว็บ',
              'รอสักครู่แล้วลองใหม่'
            ]
          };
        }
      } else {
        return {
          supported: true,
          active: false,
          message: 'Service Worker is not registered',
          instructions: [
            'รีเฟรชหน้าเว็บ',
            'ตรวจสอบ Console สำหรับ error messages'
          ]
        };
      }
    } catch (error) {
      return {
        supported: false,
        message: 'Service Worker error: ' + error.message,
        instructions: [
          'รีเฟรชหน้าเว็บ',
          'ล้าง cache ของเบราว์เซอร์',
          'ลองใช้เบราว์เซอร์อื่น'
        ]
      };
    }
  }

  static async fixNetworkConnectivity() {
    try {
      // Test basic connectivity
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });

      return {
        connected: true,
        message: 'Network connectivity is working'
      };
    } catch (error) {
      return {
        connected: false,
        message: 'Network connectivity issue: ' + error.message,
        instructions: [
          'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
          'ลองเชื่อมต่อ WiFi หรือ Mobile Data อื่น',
          'ตรวจสอบ Firewall หรือ Proxy settings',
          'ลองใหม่ในอีกสักครู่'
        ]
      };
    }
  }

  static async runAllFixes() {
    console.log('🔧 Running all auth fixes...');
    
    const results = {
      timestamp: new Date().toISOString(),
      fixes: {}
    };

    // Run all fixes in parallel
    const [
      popupResult,
      cookiesResult,
      localStorageResult,
      serviceWorkerResult,
      networkResult
    ] = await Promise.all([
      this.fixPopupBlocker(),
      this.fixThirdPartyCookies(),
      this.fixLocalStorage(),
      this.fixServiceWorker(),
      this.fixNetworkConnectivity()
    ]);

    results.fixes = {
      popup: popupResult,
      cookies: cookiesResult,
      localStorage: localStorageResult,
      serviceWorker: serviceWorkerResult,
      network: networkResult
    };

    // Generate overall status
    const criticalIssues = [];
    const warnings = [];

    if (popupResult.blocked) criticalIssues.push('Popup blocked');
    if (!cookiesResult.enabled) criticalIssues.push('Third-party cookies blocked');
    if (!localStorageResult.available) criticalIssues.push('LocalStorage not available');
    if (!networkResult.connected) criticalIssues.push('Network connectivity issue');
    if (!serviceWorkerResult.supported) warnings.push('Service Worker not supported');

    results.summary = {
      criticalIssues,
      warnings,
      canAuthenticate: criticalIssues.length === 0,
      recommendations: this.generateRecommendations(results.fixes)
    };

    console.log('🔧 Auth fixes results:', results);
    return results;
  }

  static generateRecommendations(fixes) {
    const recommendations = [];

    if (fixes.popup.blocked) {
      recommendations.push({
        priority: 'high',
        issue: 'Popup Blocked',
        solution: 'Allow popups for this site',
        steps: fixes.popup.instructions
      });
    }

    if (!fixes.cookies.enabled) {
      recommendations.push({
        priority: 'high',
        issue: 'Third-party Cookies Blocked',
        solution: 'Enable third-party cookies or add exception for google.com',
        steps: fixes.cookies.instructions
      });
    }

    if (!fixes.localStorage.available) {
      recommendations.push({
        priority: 'high',
        issue: 'LocalStorage Not Available',
        solution: 'Enable localStorage in browser settings',
        steps: fixes.localStorage.instructions
      });
    }

    if (!fixes.network.connected) {
      recommendations.push({
        priority: 'critical',
        issue: 'Network Connectivity Issue',
        solution: 'Fix internet connection',
        steps: fixes.network.instructions
      });
    }

    if (!fixes.serviceWorker.supported || !fixes.serviceWorker.active) {
      recommendations.push({
        priority: 'low',
        issue: 'Service Worker Issue',
        solution: 'Service Worker helps with offline functionality but is not required for authentication',
        steps: fixes.serviceWorker.instructions || ['No action required for authentication']
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'success',
        issue: 'No Issues Found',
        solution: 'All systems appear to be working correctly',
        steps: ['Try signing in again']
      });
    }

    return recommendations;
  }

  static async quickFix() {
    console.log('⚡ Running quick auth fix...');
    
    // Quick fixes that can be done immediately
    const fixes = [];

    // Clear any stale auth state
    try {
      localStorage.removeItem('firebase:authUser:' + process.env.REACT_APP_FIREBASE_API_KEY + ':[DEFAULT]');
      sessionStorage.clear();
      fixes.push('Cleared stale auth state');
    } catch (error) {
      console.warn('Could not clear auth state:', error);
    }

    // Test popup immediately
    const popupTest = await this.fixPopupBlocker();
    if (popupTest.blocked) {
      fixes.push('Popup blocked - user needs to allow popups');
    } else {
      fixes.push('Popup test passed');
    }

    console.log('⚡ Quick fixes applied:', fixes);
    return fixes;
  }
}

// Auto-run quick fix in development
if (process.env.NODE_ENV === 'development') {
  window.authFixer = AuthFixer;
  console.log('🔧 Auth Fixer available as window.authFixer');
  console.log('Run window.authFixer.runAllFixes() to diagnose all auth issues');
  console.log('Run window.authFixer.quickFix() for immediate fixes');
}

export default AuthFixer;