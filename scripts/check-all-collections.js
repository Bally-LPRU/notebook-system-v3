/**
 * Check All Collections Status
 * 
 * สคริปต์นี้จะตรวจสอบว่า collections ทั้งหมดถูกสร้างแล้วหรือไม่
 * และแสดงจำนวน documents ในแต่ละ collection
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ตรวจสอบว่ามี service account key หรือไม่
const serviceAccountPath = path.join(__dirname, '../config/serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.log('📝 Please create config/serviceAccountKey.json with your Firebase Admin SDK credentials');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

/**
 * ตรวจสอบ collection และนับจำนวน documents
 */
async function checkCollection(collectionName, description) {
  try {
    const snapshot = await db.collection(collectionName).get();
    const count = snapshot.size;
    
    if (count > 0) {
      console.log(`✅ ${collectionName.padEnd(25)} | ${count.toString().padStart(3)} documents | ${description}`);
      return { name: collectionName, exists: true, count, description };
    } else {
      console.log(`⚠️  ${collectionName.padEnd(25)} | ${count.toString().padStart(3)} documents | ${description} (EMPTY)`);
      return { name: collectionName, exists: false, count, description };
    }
  } catch (error) {
    console.log(`❌ ${collectionName.padEnd(25)} | ERROR: ${error.message}`);
    return { name: collectionName, exists: false, count: 0, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 CHECKING ALL COLLECTIONS STATUS');
  console.log('='.repeat(80) + '\n');
  
  const collections = [
    { name: 'loanRequests', description: 'คำขอยืมอุปกรณ์' },
    { name: 'reservations', description: 'การจองอุปกรณ์ล่วงหน้า' },
    { name: 'notifications', description: 'การแจ้งเตือนส่วนตัว' },
    { name: 'notificationSettings', description: 'ตั้งค่าการแจ้งเตือน' },
    { name: 'activityLogs', description: 'บันทึกกิจกรรม' },
    { name: 'scheduledNotifications', description: 'การแจ้งเตือนที่กำหนดเวลา' },
    { name: 'publicStats', description: 'สถิติสาธารณะ' },
    { name: 'closedDates', description: 'วันที่ปิดให้บริการ' },
    { name: 'categoryLimits', description: 'จำกัดการยืมตามหมวดหมู่' },
    { name: 'settingsAuditLog', description: 'บันทึกการเปลี่ยนแปลงการตั้งค่า' }
  ];
  
  const results = [];
  
  console.log('Collection Name           | Count | Description');
  console.log('-'.repeat(80));
  
  for (const collection of collections) {
    const result = await checkCollection(collection.name, collection.description);
    results.push(result);
  }
  
  console.log('-'.repeat(80));
  
  // สรุปผล
  const existingCollections = results.filter(r => r.exists);
  const missingCollections = results.filter(r => !r.exists);
  const totalDocuments = results.reduce((sum, r) => sum + r.count, 0);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`\n✅ Existing Collections: ${existingCollections.length}/${collections.length}`);
  console.log(`❌ Missing Collections:  ${missingCollections.length}/${collections.length}`);
  console.log(`📄 Total Documents:      ${totalDocuments}`);
  
  if (missingCollections.length > 0) {
    console.log('\n⚠️  Missing or Empty Collections:');
    missingCollections.forEach(c => {
      console.log(`   - ${c.name} (${c.description})`);
    });
    
    console.log('\n💡 To create missing collections, run:');
    console.log('   node scripts/initialize-core-collections.js');
  } else {
    console.log('\n🎉 All collections are created successfully!');
  }
  
  // ตรวจสอบ collections เพิ่มเติมที่มีอยู่แล้ว
  console.log('\n' + '='.repeat(80));
  console.log('📋 CHECKING EXISTING COLLECTIONS');
  console.log('='.repeat(80) + '\n');
  
  const existingCollectionsToCheck = [
    { name: 'users', description: 'ข้อมูลผู้ใช้' },
    { name: 'equipmentManagement', description: 'จัดการอุปกรณ์' },
    { name: 'equipmentCategories', description: 'หมวดหมู่อุปกรณ์' },
    { name: 'settings', description: 'ตั้งค่าระบบทั่วไป' },
    { name: 'systemSettings', description: 'ตั้งค่าระบบหลัก' }
  ];
  
  console.log('Collection Name           | Count | Description');
  console.log('-'.repeat(80));
  
  for (const collection of existingCollectionsToCheck) {
    await checkCollection(collection.name, collection.description);
  }
  
  console.log('-'.repeat(80));
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ CHECK COMPLETED');
  console.log('='.repeat(80) + '\n');
  
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
