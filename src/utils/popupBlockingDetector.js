/**
 * Popup Blocking Detection Utility
 * 
 * This utility provides methods to detect if popup windows are blocked
 * by the browser and handle fallback authentication methods.
 */

class PopupBlockingDetector {
  /**
   * Test if popups are blocked by the browser
   * @returns {Promise<boolean>} True if popups are blocked, false otherwise
   */
  static async isPopupBlocked() {
    return new Promise((resolve) => {
      try {
        // Try to open a small test popup
        const testPopup = window.open(
          '', 
          '_blank', 
          'width=1,height=1,left=0,top=0,scrollbars=no,resizable=no'
        );
        
        if (!testPopup) {
          // Popup was definitely blocked
          resolve(true);
          return;
        }
        
        // Check if popup was actually opened
        setTimeout(() => {
          try {
            if (testPopup.closed || typeof testPopup.closed === 'undefined') {
              // Popup was blocked or closed immediately
              resolve(true);
            } else {
              // Popup is open, close it and return false
              testPopup.close();
              resolve(false);
            }
          } catch (error) {
            // Error accessing popup properties usually means it was blocked
            resolve(true);
          }
        }, 100);
        
      } catch (error) {
        // Any error in opening popup means it's blocked
        resolve(true);
      }
    });
  }

  /**
   * Test popup blocking with a more comprehensive approach
   * @returns {Promise<{isBlocked: boolean, method: string, confidence: number}>}
   */
  static async detectPopupBlocking() {
    const results = {
      isBlocked: false,
      method: 'unknown',
      confidence: 0,
      details: {}
    };

    try {
      // Method 1: Basic popup test
      const basicTest = await this.isPopupBlocked();
      results.details.basicTest = basicTest;

      // Method 2: Check for common popup blocker indicators
      const hasPopupBlockerExtension = this.checkForPopupBlockerExtensions();
      results.details.hasExtension = hasPopupBlockerExtension;

      // Method 3: Browser-specific detection
      const browserSpecific = this.detectBrowserSpecificBlocking();
      results.details.browserSpecific = browserSpecific;

      // Calculate overall result
      let blockingScore = 0;
      
      if (basicTest) blockingScore += 3;
      if (hasPopupBlockerExtension) blockingScore += 2;
      if (browserSpecific.likely) blockingScore += 1;

      results.isBlocked = blockingScore >= 2;
      results.confidence = Math.min(blockingScore / 3, 1) * 100;
      
      if (basicTest) {
        results.method = 'popup_test';
      } else if (hasPopupBlockerExtension) {
        results.method = 'extension_detected';
      } else if (browserSpecific.likely) {
        results.method = 'browser_settings';
      } else {
        results.method = 'no_blocking';
      }

      return results;

    } catch (error) {
      console.warn('Error detecting popup blocking:', error);
      return {
        isBlocked: true, // Assume blocked on error
        method: 'error',
        confidence: 50,
        details: { error: error.message }
      };
    }
  }

  /**
   * Check for common popup blocker browser extensions
   * @returns {boolean} True if popup blocker extension is likely present
   */
  static checkForPopupBlockerExtensions() {
    try {
      // Check for common popup blocker extension indicators
      const indicators = [
        // AdBlock Plus
        () => window.adblockplus !== undefined,
        // uBlock Origin
        () => window.uBlockOrigin !== undefined,
        // AdBlock
        () => window.adblock !== undefined,
        // Popup Blocker (strict)
        () => window.popupBlocker !== undefined,
        // Check for modified window.open
        () => window.open.toString().includes('native code') === false
      ];

      return indicators.some(test => {
        try {
          return test();
        } catch (e) {
          return false;
        }
      });

    } catch (error) {
      return false;
    }
  }

  /**
   * Detect browser-specific popup blocking behavior
   * @returns {{likely: boolean, browser: string, reason: string}}
   */
  static detectBrowserSpecificBlocking() {
    const userAgent = navigator.userAgent.toLowerCase();
    const result = {
      likely: false,
      browser: 'unknown',
      reason: ''
    };

    try {
      // Chrome detection
      if (userAgent.includes('chrome') && !userAgent.includes('edge')) {
        result.browser = 'chrome';
        // Chrome blocks popups by default unless user interaction
        result.likely = !this.hasRecentUserInteraction();
        result.reason = 'Chrome blocks popups without user interaction';
      }
      // Firefox detection
      else if (userAgent.includes('firefox')) {
        result.browser = 'firefox';
        // Firefox has built-in popup blocking
        result.likely = true;
        result.reason = 'Firefox has built-in popup blocking';
      }
      // Safari detection
      else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        result.browser = 'safari';
        // Safari blocks popups by default
        result.likely = true;
        result.reason = 'Safari blocks popups by default';
      }
      // Edge detection
      else if (userAgent.includes('edge')) {
        result.browser = 'edge';
        result.likely = !this.hasRecentUserInteraction();
        result.reason = 'Edge blocks popups without user interaction';
      }

      return result;

    } catch (error) {
      return {
        likely: true,
        browser: 'unknown',
        reason: 'Error detecting browser'
      };
    }
  }

  /**
   * Check if there was recent user interaction (within last 5 seconds)
   * @returns {boolean} True if there was recent user interaction
   */
  static hasRecentUserInteraction() {
    try {
      // This is a simplified check - in a real implementation,
      // you'd track user interactions more comprehensively
      const now = Date.now();
      const lastInteraction = window.lastUserInteraction || 0;
      return (now - lastInteraction) < 5000; // 5 seconds
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user-friendly message about popup blocking
   * @param {Object} detectionResult - Result from detectPopupBlocking()
   * @returns {string} User-friendly message in Thai
   */
  static getBlockingMessage(detectionResult) {
    if (!detectionResult.isBlocked) {
      return '';
    }

    const messages = {
      popup_test: 'เบราว์เซอร์ของคุณบล็อกป๊อปอัพ กรุณาอนุญาตป๊อปอัพสำหรับเว็บไซต์นี้',
      extension_detected: 'ตรวจพบส่วนขยายบล็อกป๊อปอัพ กรุณาปิดการใช้งานชั่วคราวหรือเพิ่มเว็บไซต์นี้ในรายการยกเว้น',
      browser_settings: 'การตั้งค่าเบราว์เซอร์บล็อกป๊อปอัพ กรุณาเปิดใช้งานป๊อปอัพสำหรับเว็บไซต์นี้',
      error: 'ไม่สามารถตรวจสอบการบล็อกป๊อปอัพได้ กรุณาตรวจสอบการตั้งค่าเบราว์เซอร์',
      no_blocking: ''
    };

    return messages[detectionResult.method] || 'ตรวจพบการบล็อกป๊อปอัพ กรุณาอนุญาตป๊อปอัพและลองใหม่';
  }

  /**
   * Get instructions for enabling popups in different browsers
   * @param {string} browser - Browser name from detectBrowserSpecificBlocking
   * @returns {Array<string>} Step-by-step instructions in Thai
   */
  static getPopupEnableInstructions(browser = 'unknown') {
    const instructions = {
      chrome: [
        '1. คลิกที่ไอคอนป๊อปอัพที่ถูกบล็อกในแถบที่อยู่',
        '2. เลือก "อนุญาตป๊อปอัพและการเปลี่ยนเส้นทางจาก [เว็บไซต์นี้]"',
        '3. รีเฟรชหน้าเว็บและลองเข้าสู่ระบบใหม่'
      ],
      firefox: [
        '1. คลิกที่ไอคอนโล่ในแถบที่อยู่',
        '2. คลิก "ปิดการป้องกันสำหรับหน้านี้"',
        '3. รีเฟรชหน้าเว็บและลองเข้าสู่ระบบใหม่'
      ],
      safari: [
        '1. ไปที่ Safari > การตั้งค่า > เว็บไซต์',
        '2. เลือก "หน้าต่างป๊อปอัพ" ทางซ้าย',
        '3. เปลี่ยนการตั้งค่าสำหรับเว็บไซต์นี้เป็น "อนุญาต"'
      ],
      edge: [
        '1. คลิกที่ไอคอนป๊อปอัพที่ถูกบล็อกในแถบที่อยู่',
        '2. เลือก "อนุญาตป๊อปอัพสำหรับ [เว็บไซต์นี้] เสมอ"',
        '3. รีเฟรชหน้าเว็บและลองเข้าสู่ระบบใหม่'
      ],
      unknown: [
        '1. มองหาไอคอนป๊อปอัพที่ถูกบล็อกในแถบที่อยู่',
        '2. คลิกเพื่ออนุญาตป๊อปอัพสำหรับเว็บไซต์นี้',
        '3. รีเฟรชหน้าเว็บและลองเข้าสู่ระบบใหม่'
      ]
    };

    return instructions[browser] || instructions.unknown;
  }

  /**
   * Initialize user interaction tracking
   * Call this once when the app starts
   */
  static initializeInteractionTracking() {
    try {
      const trackInteraction = () => {
        window.lastUserInteraction = Date.now();
      };

      // Track various user interactions
      const events = ['click', 'keydown', 'touchstart', 'mousedown'];
      events.forEach(event => {
        document.addEventListener(event, trackInteraction, { passive: true });
      });

      // Initial interaction time
      window.lastUserInteraction = Date.now();

    } catch (error) {
      console.warn('Failed to initialize interaction tracking:', error);
    }
  }
}

export default PopupBlockingDetector;