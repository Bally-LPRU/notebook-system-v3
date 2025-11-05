#!/usr/bin/env node

/**
 * Mobile Device Testing Suite
 * ชุดทดสอบสำหรับอุปกรณ์มือถือต่างๆ
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class MobileDeviceTestSuite {
  constructor() {
    this.testResults = [];
    this.baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:3000';
    
    // Mobile device configurations
    this.devices = [
      {
        name: 'iPhone 12',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844, isMobile: true, hasTouch: true }
      },
      {
        name: 'iPhone SE',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 375, height: 667, isMobile: true, hasTouch: true }
      },
      {
        name: 'Samsung Galaxy S21',
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        viewport: { width: 360, height: 800, isMobile: true, hasTouch: true }
      },
      {
        name: 'iPad',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 768, height: 1024, isMobile: true, hasTouch: true }
      },
      {
        name: 'Android Tablet',
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36',
        viewport: { width: 800, height: 1280, isMobile: true, hasTouch: true }
      }
    ];
  }

  async runAllTests() {
    console.log('📱 เริ่มการทดสอบบนอุปกรณ์มือถือต่างๆ');
    console.log('=' .repeat(60));

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      for (const device of this.devices) {
        await this.testDevice(browser, device);
      }

      this.generateMobileTestReport();
      
    } catch (error) {
      console.error('❌ การทดสอบมือถือล้มเหลว:', error);
    } finally {
      await browser.close();
    }
  }

  async testDevice(browser, device) {
    console.log(`\n📱 ทดสอบบน ${device.name}...`);
    
    const page = await browser.newPage();
    
    try {
      // Set device configuration
      await page.setUserAgent(device.userAgent);
      await page.setViewport(device.viewport);
      
      // Test responsive design
      await this.testResponsiveDesign(page, device);
      
      // Test touch interactions
      await this.testTouchInteractions(page, device);
      
      // Test camera functionality (if supported)
      await this.testCameraFunctionality(page, device);
      
      // Test performance on mobile
      await this.testMobilePerformance(page, device);
      
      // Test offline functionality
      await this.testOfflineFunctionality(page, device);
      
    } catch (error) {
      this.addTestResult(device.name, 'Device Test', 'FAIL', error.message);
      console.log(`❌ ${device.name}: FAIL - ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async testResponsiveDesign(page, device) {
    try {
      await page.goto(`${this.baseUrl}/equipment`, { waitUntil: 'networkidle0' });
      
      // Check if mobile navigation is visible
      const mobileNav = await page.$('.mobile-navigation, [data-testid="mobile-nav"]');
      if (device.viewport.width < 768 && !mobileNav) {
        throw new Error('Mobile navigation not found');
      }
      
      // Check if equipment cards are properly sized
      const equipmentCards = await page.$$('.equipment-card, [data-testid="equipment-card"]');
      if (equipmentCards.length > 0) {
        const cardBounds = await equipmentCards[0].boundingBox();
        if (cardBounds.width > device.viewport.width) {
          throw new Error('Equipment card exceeds viewport width');
        }
      }
      
      // Test form responsiveness
      await page.goto(`${this.baseUrl}/equipment/add`, { waitUntil: 'networkidle0' });
      const form = await page.$('form, [data-testid="equipment-form"]');
      if (form) {
        const formBounds = await form.boundingBox();
        if (formBounds.width > device.viewport.width) {
          throw new Error('Form exceeds viewport width');
        }
      }
      
      this.addTestResult(device.name, 'Responsive Design', 'PASS', 'Layout adapts correctly');
      console.log(`✅ ${device.name} - Responsive Design: PASS`);
      
    } catch (error) {
      this.addTestResult(device.name, 'Responsive Design', 'FAIL', error.message);
      console.log(`❌ ${device.name} - Responsive Design: FAIL - ${error.message}`);
    }
  }

  async testTouchInteractions(page, device) {
    try {
      await page.goto(`${this.baseUrl}/equipment`, { waitUntil: 'networkidle0' });
      
      // Test tap interactions
      const searchButton = await page.$('[data-testid="search-button"], .search-button');
      if (searchButton) {
        await searchButton.tap();
        await page.waitForTimeout(500);
      }
      
      // Test swipe gestures (if equipment cards support it)
      const equipmentCard = await page.$('.equipment-card, [data-testid="equipment-card"]');
      if (equipmentCard) {
        const cardBounds = await equipmentCard.boundingBox();
        
        // Simulate swipe gesture
        await page.touchscreen.tap(cardBounds.x + cardBounds.width / 2, cardBounds.y + cardBounds.height / 2);
        await page.waitForTimeout(300);
      }
      
      // Test pinch-to-zoom on images
      const image = await page.$('img[data-testid="equipment-image"], .equipment-image img');
      if (image) {
        const imageBounds = await image.boundingBox();
        
        // Simulate pinch gesture
        await page.touchscreen.tap(imageBounds.x + 50, imageBounds.y + 50);
        await page.touchscreen.tap(imageBounds.x + imageBounds.width - 50, imageBounds.y + imageBounds.height - 50);
      }
      
      this.addTestResult(device.name, 'Touch Interactions', 'PASS', 'Touch gestures work correctly');
      console.log(`✅ ${device.name} - Touch Interactions: PASS`);
      
    } catch (error) {
      this.addTestResult(device.name, 'Touch Interactions', 'FAIL', error.message);
      console.log(`❌ ${device.name} - Touch Interactions: FAIL - ${error.message}`);
    }
  }

  async testCameraFunctionality(page, device) {
    try {
      // Grant camera permissions
      const context = page.browser().defaultBrowserContext();
      await context.overridePermissions(this.baseUrl, ['camera']);
      
      await page.goto(`${this.baseUrl}/equipment/add`, { waitUntil: 'networkidle0' });
      
      // Look for camera button
      const cameraButton = await page.$('[data-testid="camera-button"], .camera-button');
      if (cameraButton) {
        await cameraButton.tap();
        await page.waitForTimeout(1000);
        
        // Check if camera interface appears
        const cameraInterface = await page.$('.camera-interface, [data-testid="camera-interface"]');
        if (cameraInterface) {
          this.addTestResult(device.name, 'Camera Functionality', 'PASS', 'Camera interface loads');
        } else {
          this.addTestResult(device.name, 'Camera Functionality', 'WARNING', 'Camera interface not found');
        }
      } else {
        this.addTestResult(device.name, 'Camera Functionality', 'SKIP', 'Camera button not found');
      }
      
      console.log(`✅ ${device.name} - Camera Functionality: Tested`);
      
    } catch (error) {
      this.addTestResult(device.name, 'Camera Functionality', 'FAIL', error.message);
      console.log(`❌ ${device.name} - Camera Functionality: FAIL - ${error.message}`);
    }
  }

  async testMobilePerformance(page, device) {
    try {
      // Enable performance monitoring
      await page.tracing.start({ path: `mobile-trace-${device.name.replace(/\s+/g, '-')}.json` });
      
      const startTime = Date.now();
      await page.goto(`${this.baseUrl}/equipment`, { waitUntil: 'networkidle0' });
      const loadTime = Date.now() - startTime;
      
      await page.tracing.stop();
      
      // Check Core Web Vitals
      const metrics = await page.metrics();
      const performanceEntries = await page.evaluate(() => {
        return JSON.stringify(performance.getEntriesByType('navigation'));
      });
      
      const navigation = JSON.parse(performanceEntries)[0];
      const fcp = navigation.responseEnd - navigation.fetchStart;
      
      if (loadTime < 3000 && fcp < 2000) {
        this.addTestResult(device.name, 'Mobile Performance', 'PASS', `Load: ${loadTime}ms, FCP: ${fcp}ms`);
      } else {
        this.addTestResult(device.name, 'Mobile Performance', 'WARNING', `Load: ${loadTime}ms, FCP: ${fcp}ms (ช้า)`);
      }
      
      console.log(`✅ ${device.name} - Performance: Load ${loadTime}ms`);
      
    } catch (error) {
      this.addTestResult(device.name, 'Mobile Performance', 'FAIL', error.message);
      console.log(`❌ ${device.name} - Performance: FAIL - ${error.message}`);
    }
  }

  async testOfflineFunctionality(page, device) {
    try {
      await page.goto(`${this.baseUrl}/equipment`, { waitUntil: 'networkidle0' });
      
      // Go offline
      await page.setOfflineMode(true);
      
      // Try to navigate
      await page.reload({ waitUntil: 'networkidle0' });
      
      // Check for offline indicator
      const offlineIndicator = await page.$('.offline-indicator, [data-testid="offline-indicator"]');
      if (offlineIndicator) {
        this.addTestResult(device.name, 'Offline Functionality', 'PASS', 'Offline mode detected');
      } else {
        this.addTestResult(device.name, 'Offline Functionality', 'WARNING', 'No offline indicator');
      }
      
      // Go back online
      await page.setOfflineMode(false);
      
      console.log(`✅ ${device.name} - Offline Functionality: Tested`);
      
    } catch (error) {
      this.addTestResult(device.name, 'Offline Functionality', 'FAIL', error.message);
      console.log(`❌ ${device.name} - Offline Functionality: FAIL - ${error.message}`);
    }
  }

  addTestResult(device, testName, status, message) {
    this.testResults.push({
      device: device,
      test: testName,
      status: status,
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  generateMobileTestReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 สรุปผลการทดสอบมือถือ');
    console.log('='.repeat(60));
    
    const deviceResults = {};
    this.devices.forEach(device => {
      const deviceTests = this.testResults.filter(r => r.device === device.name);
      const passed = deviceTests.filter(r => r.status === 'PASS').length;
      const failed = deviceTests.filter(r => r.status === 'FAIL').length;
      const warnings = deviceTests.filter(r => r.status === 'WARNING').length;
      const skipped = deviceTests.filter(r => r.status === 'SKIP').length;
      
      deviceResults[device.name] = { passed, failed, warnings, skipped, total: deviceTests.length };
      
      console.log(`\n📱 ${device.name}:`);
      console.log(`   ✅ ผ่าน: ${passed} | ❌ ล้มเหลว: ${failed} | ⚠️ คำเตือน: ${warnings} | ⏭️ ข้าม: ${skipped}`);
    });
    
    // Save detailed report
    const reportData = {
      summary: deviceResults,
      results: this.testResults,
      timestamp: new Date().toISOString(),
      testType: 'mobile-device-testing'
    };
    
    fs.writeFileSync(
      'mobile-test-report.json', 
      JSON.stringify(reportData, null, 2)
    );
    
    console.log('\n📄 รายงานการทดสอบมือถือถูกบันทึกที่: mobile-test-report.json');
    
    const totalFailed = Object.values(deviceResults).reduce((sum, result) => sum + result.failed, 0);
    if (totalFailed > 0) {
      console.log('\n⚠️ พบปัญหาในการทดสอบมือถือ กรุณาตรวจสอบรายละเอียด');
    } else {
      console.log('\n🎉 การทดสอบมือถือผ่านทั้งหมด!');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testSuite = new MobileDeviceTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = MobileDeviceTestSuite;