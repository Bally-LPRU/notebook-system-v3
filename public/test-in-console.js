/**
 * Test Equipment Data in Console
 * 
 * วิธีใช้:
 * 1. Login เข้าระบบก่อน
 * 2. เปิด Console (F12)
 * 3. Copy code ด้านล่างทั้งหมด
 * 4. Paste ใน Console
 * 5. กด Enter
 */

(async function testEquipmentData() {
  console.log('🧪 Testing Equipment Data\n');
  console.log('================================\n');

  try {
    // Test 1: Check Firebase
    console.log('📋 Test 1: Checking Firebase...');
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase not loaded');
      return;
    }
    console.log('✅ Firebase loaded\n');

    // Test 2: Check Auth
    console.log('📋 Test 2: Checking Auth...');
    const auth = firebase.auth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error('❌ User not logged in');
      console.log('💡 Please login first\n');
      return;
    }
    
    console.log(`✅ User logged in: ${user.email}\n`);

    // Test 3: Check Firestore
    console.log('📋 Test 3: Checking Firestore...');
    const db = firebase.firestore();
    const equipmentRef = db.collection('equipmentManagement');
    const snapshot = await equipmentRef.limit(10).get();
    
    if (snapshot.empty) {
      console.warn('⚠️ No equipment found');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} equipment(s)\n`);

    // Test 4: Display equipment data
    console.log('📋 Test 4: Equipment Data:\n');
    const equipment = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      equipment.push({
        id: doc.id,
        name: data.name,
        equipmentNumber: data.equipmentNumber,
        status: data.status,
        category: data.category,
        isActive: data.isActive,
        images: data.images,
        tags: data.tags,
        searchKeywords: data.searchKeywords
      });
      
      console.log(`${equipment.length}. ${data.name || 'Unnamed'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Number: ${data.equipmentNumber || 'N/A'}`);
      console.log(`   Status: ${data.status || 'N/A'}`);
      console.log(`   Category: ${data.category?.name || 'N/A'}`);
      console.log(`   Active: ${data.isActive !== false ? 'Yes' : 'No'}`);
      console.log(`   Images: ${Array.isArray(data.images) ? `Array(${data.images.length})` : typeof data.images}`);
      console.log(`   Tags: ${Array.isArray(data.tags) ? `Array(${data.tags.length})` : typeof data.tags}`);
      console.log(`   Keywords: ${Array.isArray(data.searchKeywords) ? `Array(${data.searchKeywords.length})` : typeof data.searchKeywords}`);
      console.log('');
    });

    // Test 5: Check for issues
    console.log('📋 Test 5: Checking for issues...\n');
    let issues = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!Array.isArray(data.images)) {
        issues.push(`${doc.id}: images is ${typeof data.images} (should be Array)`);
      }
      if (!Array.isArray(data.tags)) {
        issues.push(`${doc.id}: tags is ${typeof data.tags} (should be Array)`);
      }
      if (!Array.isArray(data.searchKeywords)) {
        issues.push(`${doc.id}: searchKeywords is ${typeof data.searchKeywords} (should be Array)`);
      }
    });
    
    if (issues.length > 0) {
      console.warn('⚠️ Found issues:');
      issues.forEach(issue => console.warn(`   - ${issue}`));
      console.log('');
      console.log('💡 Fix these issues in Firebase Console:');
      console.log('   1. Go to Firebase Console');
      console.log('   2. Firestore Database > Data');
      console.log('   3. Open equipmentManagement collection');
      console.log('   4. Edit each document');
      console.log('   5. Change null values to [] (empty array)');
      console.log('');
    } else {
      console.log('✅ No issues found!\n');
    }

    // Test 6: Test EquipmentManagementService
    console.log('📋 Test 6: Testing EquipmentManagementService...\n');
    
    if (typeof EquipmentManagementService === 'undefined') {
      console.error('❌ EquipmentManagementService not loaded');
      console.log('💡 This is normal in test page');
      console.log('💡 Try in main app instead\n');
      return;
    }
    
    console.log('✅ EquipmentManagementService loaded');
    console.log('   Methods:', Object.getOwnPropertyNames(EquipmentManagementService));
    console.log('');
    
    try {
      const result = await EquipmentManagementService.getEquipmentList({});
      console.log('✅ getEquipmentList() works!');
      console.log(`   Equipment count: ${result.equipment.length}`);
      console.log(`   Has next page: ${result.pagination.hasNextPage}`);
      console.log('');
      
      // Display first equipment
      if (result.equipment.length > 0) {
        console.log('   First equipment:');
        console.log(result.equipment[0]);
      }
    } catch (error) {
      console.error('❌ getEquipmentList() failed:', error.message);
      console.error('   Stack:', error.stack);
    }

    // Summary
    console.log('================================');
    console.log('📊 Summary:\n');
    console.log(`   Total Equipment: ${snapshot.size}`);
    console.log(`   Issues Found: ${issues.length}`);
    console.log(`   User: ${user.email}`);
    console.log('');
    
    if (issues.length === 0) {
      console.log('✅ All tests passed!');
      console.log('💡 Equipment data is ready to use\n');
    } else {
      console.log('⚠️ Some issues found');
      console.log('💡 Fix them in Firebase Console\n');
    }

    // Return data for further inspection
    return {
      equipment,
      issues,
      user: {
        email: user.email,
        uid: user.uid
      }
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied. Possible reasons:');
      console.log('   1. User not logged in');
      console.log('   2. User not approved');
      console.log('   3. Firestore rules blocking access');
    }
  }
})();
