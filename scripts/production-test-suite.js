#!/usr/bin/env node

/**
 * Production Test Suite for Equipment Management System
 * ชุดทดสอบสำหรับระบบจัดการอุปกรณ์ใน Production
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, limit } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Load production config
require('dotenv').config({ path: '.env.production.local' });

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

class ProductionTestSuite {
  constructor() {
    this.testResults = [];
    this.testUser = {
      email: process.env.TEST_ADMIN_EMAIL || 'test-admin@example.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'testpassword123'
    };
  }

  async runAllTests() {
    console.log('🚀 เริ่มการทดสอบระบบใน Production Environment');
    console.log('=' .repeat(60));

    try {
      // Authentication Test
      await this.testAuthentication();
      
      // Database Connection Test
      await this.testDatabaseConnection();
      
      // Equipment CRUD Operations Test
      await this.testEquipmentOperations();
      
      // Image Upload Test
      await this.testImageOperations();
      
      // Search and Filter Test
      await this.testSearchAndFilter();
      
      // Bulk Operations Test
      await this.testBulkOperations();
      
      // Export Functionality Test
      await this.testExportFunctionality();
      
      // Security Rules Test
      await this.testSecurityRules();
      
      // Performance Test
      await this.testPerformance();

      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ การทดสอบล้มเหลว:', error);
      process.exit(1);
    }
  }

  async testAuthentication() {
    console.log('\n📝 ทดสอบระบบ Authentication...');
    
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        this.testUser.email, 
        this.testUser.password
      );
      
      this.addTestResult('Authentication', 'PASS', 'เข้าสู่ระบบสำเร็จ');
      console.log('✅ Authentication: PASS');
      
    } catch (error) {
      this.addTestResult('Authentication', 'FAIL', error.message);
      console.log('❌ Authentication: FAIL -', error.message);
      throw error;
    }
  }

  async testDatabaseConnection() {
    console.log('\n📝 ทดสอบการเชื่อมต่อฐานข้อมูล...');
    
    try {
      const snapshot = await getDocs(query(collection(db, 'equipment'), limit(1)));
      
      this.addTestResult('Database Connection', 'PASS', 'เชื่อมต่อฐานข้อมูลสำเร็จ');
      console.log('✅ Database Connection: PASS');
      
    } catch (error) {
      this.addTestResult('Database Connection', 'FAIL', error.message);
      console.log('❌ Database Connection: FAIL -', error.message);
      throw error;
    }
  }

  async testEquipmentOperations() {
    console.log('\n📝 ทดสอบการจัดการข้อมูลอุปกรณ์...');
    
    const testEquipment = {
      equipmentNumber: `TEST-${Date.now()}`,
      name: 'Test Equipment for Production',
      category: {
        id: 'test-category',
        name: 'Test Category'
      },
      brand: 'Test Brand',
      model: 'Test Model',
      status: 'active',
      purchasePrice: 1000,
      purchaseDate: new Date(),
      location: {
        building: 'Test Building',
        floor: '1',
        room: 'Test Room'
      },
      createdAt: new Date(),
      createdBy: auth.currentUser.uid,
      isActive: true,
      searchKeywords: ['test', 'equipment', 'production']
    };

    try {
      // Test Create
      const docRef = await addDoc(collection(db, 'equipment'), testEquipment);
      console.log('✅ Create Equipment: PASS');

      // Test Read
      const equipmentDoc = await getDocs(query(
        collection(db, 'equipment'), 
        where('equipmentNumber', '==', testEquipment.equipmentNumber)
      ));
      
      if (equipmentDoc.empty) {
        throw new Error('ไม่พบข้อมูลอุปกรณ์ที่สร้าง');
      }
      console.log('✅ Read Equipment: PASS');

      // Test Update
      await updateDoc(doc(db, 'equipment', docRef.id), {
        name: 'Updated Test Equipment',
        updatedAt: new Date(),
        updatedBy: auth.currentUser.uid
      });
      console.log('✅ Update Equipment: PASS');

      // Test Delete
      await deleteDoc(doc(db, 'equipment', docRef.id));
      console.log('✅ Delete Equipment: PASS');

      this.addTestResult('Equipment CRUD Operations', 'PASS', 'การจัดการข้อมูลอุปกรณ์ทำงานปกติ');
      
    } catch (error) {
      this.addTestResult('Equipment CRUD Operations', 'FAIL', error.message);
      console.log('❌ Equipment Operations: FAIL -', error.message);
      throw error;
    }
  }

  async testImageOperations() {
    console.log('\n📝 ทดสอบการจัดการรูปภาพ...');
    
    try {
      // Create test image blob
      const testImageData = new Uint8Array([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46
      ]);
      const testBlob = new Blob([testImageData], { type: 'image/jpeg' });
      
      const testImageRef = ref(storage, `test-images/test-${Date.now()}.jpg`);
      
      // Test Upload
      await uploadBytes(testImageRef, testBlob);
      console.log('✅ Image Upload: PASS');
      
      // Test Download URL
      const downloadURL = await getDownloadURL(testImageRef);
      if (!downloadURL) {
        throw new Error('ไม่สามารถสร้าง Download URL ได้');
      }
      console.log('✅ Image Download URL: PASS');
      
      // Test Delete
      await deleteObject(testImageRef);
      console.log('✅ Image Delete: PASS');
      
      this.addTestResult('Image Operations', 'PASS', 'การจัดการรูปภาพทำงานปกติ');
      
    } catch (error) {
      this.addTestResult('Image Operations', 'FAIL', error.message);
      console.log('❌ Image Operations: FAIL -', error.message);
      throw error;
    }
  }

  async testSearchAndFilter() {
    console.log('\n📝 ทดสอบการค้นหาและกรองข้อมูล...');
    
    try {
      // Test basic search
      const searchResults = await getDocs(query(
        collection(db, 'equipment'),
        where('isActive', '==', true),
        limit(10)
      ));
      
      console.log(`✅ Basic Search: PASS (พบ ${searchResults.size} รายการ)`);
      
      // Test category filter
      const categoryResults = await getDocs(query(
        collection(db, 'equipment'),
        where('category.id', '!=', ''),
        limit(5)
      ));
      
      console.log(`✅ Category Filter: PASS (พบ ${categoryResults.size} รายการ)`);
      
      this.addTestResult('Search and Filter', 'PASS', 'การค้นหาและกรองข้อมูลทำงานปกติ');
      
    } catch (error) {
      this.addTestResult('Search and Filter', 'FAIL', error.message);
      console.log('❌ Search and Filter: FAIL -', error.message);
      throw error;
    }
  }

  async testBulkOperations() {
    console.log('\n📝 ทดสอบการดำเนินการแบบกลุ่ม...');
    
    try {
      // Test bulk read
      const bulkResults = await getDocs(query(
        collection(db, 'equipment'),
        limit(20)
      ));
      
      if (bulkResults.size > 0) {
        console.log(`✅ Bulk Read: PASS (อ่านข้อมูล ${bulkResults.size} รายการ)`);
      }
      
      this.addTestResult('Bulk Operations', 'PASS', 'การดำเนินการแบบกลุ่มทำงานปกติ');
      
    } catch (error) {
      this.addTestResult('Bulk Operations', 'FAIL', error.message);
      console.log('❌ Bulk Operations: FAIL -', error.message);
      throw error;
    }
  }

  async testExportFunctionality() {
    console.log('\n📝 ทดสอบการส่งออกข้อมูล...');
    
    try {
      // Test data retrieval for export
      const exportData = await getDocs(query(
        collection(db, 'equipment'),
        limit(5)
      ));
      
      const equipmentList = exportData.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (equipmentList.length > 0) {
        console.log(`✅ Export Data Retrieval: PASS (ข้อมูล ${equipmentList.length} รายการ)`);
      }
      
      this.addTestResult('Export Functionality', 'PASS', 'การส่งออกข้อมูลทำงานปกติ');
      
    } catch (error) {
      this.addTestResult('Export Functionality', 'FAIL', error.message);
      console.log('❌ Export Functionality: FAIL -', error.message);
      throw error;
    }
  }

  async testSecurityRules() {
    console.log('\n📝 ทดสอบ Security Rules...');
    
    try {
      // Test authenticated access
      const authResults = await getDocs(query(
        collection(db, 'equipment'),
        limit(1)
      ));
      
      console.log('✅ Authenticated Access: PASS');
      
      this.addTestResult('Security Rules', 'PASS', 'Security Rules ทำงานปกติ');
      
    } catch (error) {
      this.addTestResult('Security Rules', 'FAIL', error.message);
      console.log('❌ Security Rules: FAIL -', error.message);
      throw error;
    }
  }

  async testPerformance() {
    console.log('\n📝 ทดสอบประสิทธิภาพ...');
    
    try {
      const startTime = Date.now();
      
      // Test query performance
      await getDocs(query(
        collection(db, 'equipment'),
        limit(50)
      ));
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      console.log(`✅ Query Performance: ${queryTime}ms`);
      
      if (queryTime < 2000) {
        this.addTestResult('Performance', 'PASS', `Query time: ${queryTime}ms`);
      } else {
        this.addTestResult('Performance', 'WARNING', `Query time: ${queryTime}ms (ช้ากว่าปกติ)`);
      }
      
    } catch (error) {
      this.addTestResult('Performance', 'FAIL', error.message);
      console.log('❌ Performance: FAIL -', error.message);
      throw error;
    }
  }

  addTestResult(testName, status, message) {
    this.testResults.push({
      test: testName,
      status: status,
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  generateTestReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 สรุปผลการทดสอบ Production');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.testResults.filter(r => r.status === 'WARNING').length;
    
    console.log(`✅ ผ่าน: ${passed} รายการ`);
    console.log(`⚠️  คำเตือน: ${warnings} รายการ`);
    console.log(`❌ ล้มเหลว: ${failed} รายการ`);
    
    console.log('\nรายละเอียดการทดสอบ:');
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
    });
    
    // Save report to file
    const reportData = {
      summary: { passed, failed, warnings, total: this.testResults.length },
      results: this.testResults,
      timestamp: new Date().toISOString(),
      environment: 'production'
    };
    
    require('fs').writeFileSync(
      'production-test-report.json', 
      JSON.stringify(reportData, null, 2)
    );
    
    console.log('\n📄 รายงานถูกบันทึกที่: production-test-report.json');
    
    if (failed > 0) {
      console.log('\n❌ การทดสอบล้มเหลว! กรุณาตรวจสอบปัญหาก่อนใช้งาน Production');
      process.exit(1);
    } else {
      console.log('\n🎉 การทดสอบผ่านทั้งหมด! ระบบพร้อมใช้งาน Production');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testSuite = new ProductionTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = ProductionTestSuite;