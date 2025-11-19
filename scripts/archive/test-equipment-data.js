#!/usr/bin/env node

/**
 * Test Equipment Data Script
 * ทดสอบการเข้าถึงข้อมูลอุปกรณ์ใน Firestore
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testEquipmentData() {
  console.log('🧪 Testing Equipment Data Access\n');
  console.log('================================\n');

  try {
    // Test 1: Check if equipmentManagement collection exists
    console.log('📋 Test 1: Checking equipmentManagement collection...');
    const equipmentRef = db.collection('equipmentManagement');
    const snapshot = await equipmentRef.limit(10).get();
    
    console.log(`  ✅ Found ${snapshot.size} equipment(s)`);
    
    if (snapshot.empty) {
      console.log('  ⚠️ No equipment found in database');
      console.log('  💡 Run: node scripts/seed-equipment-data-simple.js\n');
      return;
    }

    // Test 2: Display equipment data
    console.log('\n📋 Test 2: Equipment Data:\n');
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  ${index + 1}. ${data.name || 'Unnamed'}`);
      console.log(`     ID: ${doc.id}`);
      console.log(`     Number: ${data.equipmentNumber || 'N/A'}`);
      console.log(`     Status: ${data.status || 'N/A'}`);
      console.log(`     Category: ${data.category?.name || 'N/A'}`);
      console.log(`     Active: ${data.isActive !== false ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Test 3: Check required fields
    console.log('📋 Test 3: Checking required fields...\n');
    let hasIssues = false;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const issues = [];
      
      if (!data.name) issues.push('Missing name');
      if (!data.equipmentNumber) issues.push('Missing equipmentNumber');
      if (!data.status) issues.push('Missing status');
      if (!data.category) issues.push('Missing category');
      if (data.isActive === undefined) issues.push('Missing isActive');
      if (!data.searchKeywords || !Array.isArray(data.searchKeywords)) {
        issues.push('Missing or invalid searchKeywords');
      }
      
      if (issues.length > 0) {
        hasIssues = true;
        console.log(`  ⚠️ ${doc.id}:`);
        issues.forEach(issue => console.log(`     - ${issue}`));
        console.log('');
      }
    });
    
    if (!hasIssues) {
      console.log('  ✅ All equipment have required fields\n');
    }

    // Test 4: Check equipmentCategories collection
    console.log('📋 Test 4: Checking equipmentCategories collection...');
    const categoriesRef = db.collection('equipmentCategories');
    const categoriesSnapshot = await categoriesRef.get();
    
    console.log(`  ✅ Found ${categoriesSnapshot.size} category(ies)`);
    
    if (categoriesSnapshot.empty) {
      console.log('  ⚠️ No categories found');
      console.log('  💡 Run: node scripts/create-categories-collection.js\n');
    } else {
      console.log('\n  Categories:');
      categoriesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`    - ${data.name} (${doc.id})`);
      });
      console.log('');
    }

    // Test 5: Test query with filters
    console.log('📋 Test 5: Testing query with filters...');
    const activeQuery = equipmentRef.where('isActive', '==', true).limit(5);
    const activeSnapshot = await activeQuery.get();
    console.log(`  ✅ Found ${activeSnapshot.size} active equipment(s)\n`);

    // Summary
    console.log('================================');
    console.log('📊 Summary:\n');
    console.log(`  Total Equipment: ${snapshot.size}`);
    console.log(`  Active Equipment: ${activeSnapshot.size}`);
    console.log(`  Categories: ${categoriesSnapshot.size}`);
    console.log(`  Issues Found: ${hasIssues ? 'Yes' : 'No'}`);
    console.log('');
    
    if (!hasIssues && snapshot.size > 0 && categoriesSnapshot.size > 0) {
      console.log('✅ All tests passed! Equipment data is ready.\n');
    } else {
      console.log('⚠️ Some issues found. Please fix them before using the system.\n');
    }

  } catch (error) {
    console.error('❌ Error testing equipment data:', error);
    console.error('\nError details:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied. Check Firestore rules:');
      console.log('   - Allow read for authenticated users');
      console.log('   - Allow write for admin users');
    }
  }
}

// Run tests
testEquipmentData()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
