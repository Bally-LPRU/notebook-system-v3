#!/usr/bin/env node

/**
 * Master Production Testing Script
 * สคริปต์หลักสำหรับรันการทดสอบ Production ทั้งหมด
 */

const ProductionTestSuite = require('./production-test-suite');
const MobileDeviceTestSuite = require('./mobile-device-testing');
const SecurityPerformanceAudit = require('./security-performance-audit');
const fs = require('fs');
const path = require('path');

class MasterProductionTester {
  constructor() {
    this.results = {
      productionTests: null,
      mobileTests: null,
      securityAudit: null,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        startTime: new Date(),
        endTime: null,
        duration: 0
      }
    };
  }

  async runAllTests() {
    console.log('🚀 เริ่มการทดสอบ Production ครบวงจร');
    console.log('=' .repeat(80));
    console.log(`เวลาเริ่มต้น: ${this.results.summary.startTime.toLocaleString('th-TH')}`);
    console.log('=' .repeat(80));

    try {
      // 1. Production System Tests
      console.log('\n📋 ขั้นตอนที่ 1: การทดสอบระบบ Production');
      await this.runProductionTests();

      // 2. Mobile Device Tests
      console.log('\n📱 ขั้นตอนที่ 2: การทดสอบอุปกรณ์มือถือ');
      await this.runMobileTests();

      // 3. Security & Performance Audit
      console.log('\n🔒 ขั้นตอนที่ 3: การตรวจสอบความปลอดภัยและประสิทธิภาพ');
      await this.runSecurityAudit();

      // Generate comprehensive report
      this.generateMasterReport();

    } catch (error) {
      console.error('❌ การทดสอบล้มเหลว:', error);
      this.generateErrorReport(error);
      process.exit(1);
    }
  }

  async runProductionTests() {
    try {
      const productionTester = new ProductionTestSuite();
      await productionTester.runAllTests();
      
      // Read the generated report
      if (fs.existsSync('production-test-report.json')) {
        this.results.productionTests = JSON.parse(
          fs.readFileSync('production-test-report.json', 'utf8')
        );
        
        this.results.summary.totalTests += this.results.productionTests.summary.total;
        this.results.summary.passed += this.results.productionTests.summary.passed;
        this.results.summary.failed += this.results.productionTests.summary.failed;
        this.results.summary.warnings += this.results.productionTests.summary.warnings;
      }
      
      console.log('✅ การทดสอบระบบ Production เสร็จสิ้น');
      
    } catch (error) {
      console.error('❌ การทดสอบระบบ Production ล้มเหลว:', error.message);
      this.results.productionTests = { error: error.message };
      this.results.summary.failed += 1;
    }
  }

  async runMobileTests() {
    try {
      // Check if puppeteer is available
      try {
        require('puppeteer');
      } catch (error) {
        console.log('⚠️ Puppeteer ไม่พร้อมใช้งาน - ข้ามการทดสอบมือถือ');
        this.results.mobileTests = { skipped: true, reason: 'Puppeteer not available' };
        return;
      }

      const mobileTester = new MobileDeviceTestSuite();
      await mobileTester.runAllTests();
      
      // Read the generated report
      if (fs.existsSync('mobile-test-report.json')) {
        this.results.mobileTests = JSON.parse(
          fs.readFileSync('mobile-test-report.json', 'utf8')
        );
        
        // Count mobile test results
        Object.values(this.results.mobileTests.summary).forEach(deviceResult => {
          this.results.summary.totalTests += deviceResult.total;
          this.results.summary.passed += deviceResult.passed;
          this.results.summary.failed += deviceResult.failed;
          this.results.summary.warnings += deviceResult.warnings;
        });
      }
      
      console.log('✅ การทดสอบอุปกรณ์มือถือเสร็จสิ้น');
      
    } catch (error) {
      console.error('❌ การทดสอบอุปกรณ์มือถือล้มเหลว:', error.message);
      this.results.mobileTests = { error: error.message };
      this.results.summary.failed += 1;
    }
  }

  async runSecurityAudit() {
    try {
      const securityAuditor = new SecurityPerformanceAudit();
      await securityAuditor.runFullAudit();
      
      // Read the generated report
      if (fs.existsSync('security-performance-audit.json')) {
        this.results.securityAudit = JSON.parse(
          fs.readFileSync('security-performance-audit.json', 'utf8')
        );
        
        this.results.summary.totalTests += this.results.securityAudit.summary.total;
        this.results.summary.passed += this.results.securityAudit.summary.passed;
        this.results.summary.failed += this.results.securityAudit.summary.failed;
        this.results.summary.warnings += this.results.securityAudit.summary.warnings;
      }
      
      console.log('✅ การตรวจสอบความปลอดภัยและประสิทธิภาพเสร็จสิ้น');
      
    } catch (error) {
      console.error('❌ การตรวจสอบความปลอดภัยและประสิทธิภาพล้มเหลว:', error.message);
      this.results.securityAudit = { error: error.message };
      this.results.summary.failed += 1;
    }
  }

  generateMasterReport() {
    this.results.summary.endTime = new Date();
    this.results.summary.duration = this.results.summary.endTime - this.results.summary.startTime;

    console.log('\n' + '='.repeat(80));
    console.log('📊 สรุปผลการทดสอบ Production ครบวงจร');
    console.log('='.repeat(80));
    
    console.log(`⏱️  เวลาที่ใช้: ${Math.round(this.results.summary.duration / 1000)} วินาที`);
    console.log(`📈 การทดสอบทั้งหมด: ${this.results.summary.totalTests} รายการ`);
    console.log(`✅ ผ่าน: ${this.results.summary.passed} รายการ`);
    console.log(`⚠️  คำเตือน: ${this.results.summary.warnings} รายการ`);
    console.log(`❌ ล้มเหลว: ${this.results.summary.failed} รายการ`);

    // Calculate success rate
    const successRate = this.results.summary.totalTests > 0 
      ? ((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)
      : 0;
    
    console.log(`📊 อัตราความสำเร็จ: ${successRate}%`);

    // Detailed results
    console.log('\n📋 รายละเอียดการทดสอบ:');
    
    if (this.results.productionTests) {
      if (this.results.productionTests.error) {
        console.log('❌ การทดสอบระบบ Production: ล้มเหลว');
      } else {
        console.log(`✅ การทดสอบระบบ Production: ${this.results.productionTests.summary.passed}/${this.results.productionTests.summary.total} ผ่าน`);
      }
    }

    if (this.results.mobileTests) {
      if (this.results.mobileTests.error) {
        console.log('❌ การทดสอบอุปกรณ์มือถือ: ล้มเหลว');
      } else if (this.results.mobileTests.skipped) {
        console.log('⏭️ การทดสอบอุปกรณ์มือถือ: ข้าม');
      } else {
        const mobileTotal = Object.values(this.results.mobileTests.summary).reduce((sum, device) => sum + device.total, 0);
        const mobilePassed = Object.values(this.results.mobileTests.summary).reduce((sum, device) => sum + device.passed, 0);
        console.log(`📱 การทดสอบอุปกรณ์มือถือ: ${mobilePassed}/${mobileTotal} ผ่าน`);
      }
    }

    if (this.results.securityAudit) {
      if (this.results.securityAudit.error) {
        console.log('❌ การตรวจสอบความปลอดภัย: ล้มเหลว');
      } else {
        console.log(`🔒 การตรวจสอบความปลอดภัย: ${this.results.securityAudit.summary.passed}/${this.results.securityAudit.summary.total} ผ่าน`);
      }
    }

    // Recommendations
    this.generateRecommendations();

    // Save comprehensive report
    const reportData = {
      ...this.results,
      metadata: {
        testRunner: 'Master Production Tester',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    fs.writeFileSync(
      'master-production-test-report.json',
      JSON.stringify(reportData, null, 2)
    );

    // Generate HTML report
    this.generateHTMLReport(reportData);

    console.log('\n📄 รายงานถูกบันทึกที่:');
    console.log('   - master-production-test-report.json (JSON)');
    console.log('   - master-production-test-report.html (HTML)');

    // Final verdict
    if (this.results.summary.failed === 0) {
      console.log('\n🎉 ระบบผ่านการทดสอบทั้งหมด! พร้อมใช้งาน Production');
      process.exit(0);
    } else if (this.results.summary.failed <= 2 && this.results.summary.warnings <= 5) {
      console.log('\n⚠️ ระบบมีปัญหาเล็กน้อย แนะนำให้แก้ไขก่อนใช้งาน Production');
      process.exit(1);
    } else {
      console.log('\n❌ ระบบมีปัญหาร้ายแรง! ห้ามใช้งาน Production จนกว่าจะแก้ไขปัญหา');
      process.exit(2);
    }
  }

  generateRecommendations() {
    console.log('\n💡 คำแนะนำ:');

    if (this.results.summary.failed > 0) {
      console.log('   🔧 แก้ไขปัญหาที่ล้มเหลวก่อนใช้งาน Production');
    }

    if (this.results.summary.warnings > 5) {
      console.log('   ⚠️ มีคำเตือนจำนวนมาก ควรพิจารณาแก้ไข');
    }

    if (this.results.securityAudit && this.results.securityAudit.summary.failed > 0) {
      console.log('   🔒 พบปัญหาความปลอดภัย ต้องแก้ไขทันที');
    }

    if (this.results.mobileTests && this.results.mobileTests.skipped) {
      console.log('   📱 ควรติดตั้ง Puppeteer เพื่อทดสอบมือถือ');
    }

    // Performance recommendations
    if (this.results.securityAudit && this.results.securityAudit.results) {
      const performanceIssues = this.results.securityAudit.results.filter(
        r => r.category.includes('Performance') && r.status !== 'PASS'
      );
      
      if (performanceIssues.length > 0) {
        console.log('   ⚡ พบปัญหาประสิทธิภาพ ควรปรับปรุง');
      }
    }
  }

  generateHTMLReport(reportData) {
    const html = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>รายงานการทดสอบ Production - ระบบจัดการอุปกรณ์</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card.success { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); }
        .stat-card.warning { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); }
        .stat-card.error { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 0.9em; opacity: 0.9; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .test-result { padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #3498db; }
        .test-result.pass { background: #d4edda; border-color: #28a745; }
        .test-result.fail { background: #f8d7da; border-color: #dc3545; }
        .test-result.warning { background: #fff3cd; border-color: #ffc107; }
        .timestamp { color: #666; font-size: 0.9em; }
        .recommendations { background: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3; }
        .device-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .device-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 รายงานการทดสอบ Production<br>ระบบจัดการอุปกรณ์</h1>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-number">${reportData.summary.totalTests}</div>
                <div class="stat-label">การทดสอบทั้งหมด</div>
            </div>
            <div class="stat-card success">
                <div class="stat-number">${reportData.summary.passed}</div>
                <div class="stat-label">ผ่าน</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-number">${reportData.summary.warnings}</div>
                <div class="stat-label">คำเตือน</div>
            </div>
            <div class="stat-card error">
                <div class="stat-number">${reportData.summary.failed}</div>
                <div class="stat-label">ล้มเหลว</div>
            </div>
        </div>

        <div class="section">
            <h2>📊 สรุปผลการทดสอบ</h2>
            <p><strong>เวลาเริ่มต้น:</strong> ${new Date(reportData.summary.startTime).toLocaleString('th-TH')}</p>
            <p><strong>เวลาสิ้นสุด:</strong> ${new Date(reportData.summary.endTime).toLocaleString('th-TH')}</p>
            <p><strong>ระยะเวลา:</strong> ${Math.round(reportData.summary.duration / 1000)} วินาที</p>
            <p><strong>อัตราความสำเร็จ:</strong> ${reportData.summary.totalTests > 0 ? ((reportData.summary.passed / reportData.summary.totalTests) * 100).toFixed(1) : 0}%</p>
        </div>

        ${reportData.productionTests ? `
        <div class="section">
            <h2>🖥️ การทดสอบระบบ Production</h2>
            ${reportData.productionTests.error ? 
                `<div class="test-result fail">❌ การทดสอบล้มเหลว: ${reportData.productionTests.error}</div>` :
                reportData.productionTests.results.map(result => `
                    <div class="test-result ${result.status.toLowerCase()}">
                        ${result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌'} 
                        <strong>${result.test}:</strong> ${result.message}
                    </div>
                `).join('')
            }
        </div>
        ` : ''}

        ${reportData.mobileTests && !reportData.mobileTests.skipped ? `
        <div class="section">
            <h2>📱 การทดสอบอุปกรณ์มือถือ</h2>
            <div class="device-grid">
                ${Object.entries(reportData.mobileTests.summary).map(([device, stats]) => `
                    <div class="device-card">
                        <h3>${device}</h3>
                        <p>✅ ผ่าน: ${stats.passed}</p>
                        <p>⚠️ คำเตือน: ${stats.warnings}</p>
                        <p>❌ ล้มเหลว: ${stats.failed}</p>
                        <p>⏭️ ข้าม: ${stats.skipped}</p>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${reportData.securityAudit ? `
        <div class="section">
            <h2>🔒 การตรวจสอบความปลอดภัยและประสิทธิภาพ</h2>
            ${reportData.securityAudit.error ? 
                `<div class="test-result fail">❌ การตรวจสอบล้มเหลว: ${reportData.securityAudit.error}</div>` :
                Object.entries(reportData.securityAudit.categories || {}).map(([category, results]) => `
                    <h3>${category}</h3>
                    ${results.map(result => `
                        <div class="test-result ${result.status.toLowerCase()}">
                            ${result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : result.status === 'INFO' ? 'ℹ️' : '❌'} 
                            ${result.message}
                        </div>
                    `).join('')}
                `).join('')
            }
        </div>
        ` : ''}

        <div class="recommendations">
            <h2>💡 คำแนะนำ</h2>
            <ul>
                ${reportData.summary.failed > 0 ? '<li>🔧 แก้ไขปัญหาที่ล้มเหลวก่อนใช้งาน Production</li>' : ''}
                ${reportData.summary.warnings > 5 ? '<li>⚠️ มีคำเตือนจำนวนมาก ควรพิจารณาแก้ไข</li>' : ''}
                ${reportData.securityAudit && reportData.securityAudit.summary.failed > 0 ? '<li>🔒 พบปัญหาความปลอดภัย ต้องแก้ไขทันที</li>' : ''}
                ${reportData.mobileTests && reportData.mobileTests.skipped ? '<li>📱 ควรติดตั้ง Puppeteer เพื่อทดสอบมือถือ</li>' : ''}
                ${reportData.summary.failed === 0 && reportData.summary.warnings <= 2 ? '<li>🎉 ระบบพร้อมใช้งาน Production!</li>' : ''}
            </ul>
        </div>

        <div class="timestamp">
            <p><em>รายงานสร้างเมื่อ: ${new Date().toLocaleString('th-TH')}</em></p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync('master-production-test-report.html', html);
  }

  generateErrorReport(error) {
    const errorReport = {
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      summary: this.results.summary,
      partialResults: this.results
    };

    fs.writeFileSync(
      'production-test-error-report.json',
      JSON.stringify(errorReport, null, 2)
    );

    console.log('\n📄 รายงานข้อผิดพลาดถูกบันทึกที่: production-test-error-report.json');
  }
}

// Run tests if called directly
if (require.main === module) {
  const masterTester = new MasterProductionTester();
  masterTester.runAllTests().catch(console.error);
}

module.exports = MasterProductionTester;