/**
 * Fix Equipment Data - Ensure all array fields are arrays
 * This script fixes equipment documents that have null or undefined array fields
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixEquipmentArrays() {
  try {
    console.log('🔍 กำลังตรวจสอบข้อมูลอุปกรณ์...\n');

    const equipmentRef = collection(db, 'equipmentManagement');
    const snapshot = await getDocs(equipmentRef);

    if (snapshot.empty) {
      console.log('❌ ไม่พบข้อมูลอุปกรณ์ในระบบ');
      return;
    }

    console.log(`✅ พบอุปกรณ์ทั้งหมด ${snapshot.size} รายการ\n`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const equipmentId = docSnapshot.id;
      const updates = {};
      let needsUpdate = false;

      // Check and fix images field
      if (!Array.isArray(data.images)) {
        updates.images = [];
        needsUpdate = true;
        console.log(`⚠️  ${data.equipmentNumber || equipmentId}: images ไม่ใช่ array (${typeof data.images})`);
      }

      // Check and fix tags field
      if (!Array.isArray(data.tags)) {
        updates.tags = [];
        needsUpdate = true;
        console.log(`⚠️  ${data.equipmentNumber || equipmentId}: tags ไม่ใช่ array (${typeof data.tags})`);
      }

      // Check and fix searchKeywords field
      if (!Array.isArray(data.searchKeywords)) {
        updates.searchKeywords = [];
        needsUpdate = true;
        console.log(`⚠️  ${data.equipmentNumber || equipmentId}: searchKeywords ไม่ใช่ array (${typeof data.searchKeywords})`);
      }

      // Check and fix specifications field
      if (typeof data.specifications !== 'object' || data.specifications === null || Array.isArray(data.specifications)) {
        updates.specifications = {};
        needsUpdate = true;
        console.log(`⚠️  ${data.equipmentNumber || equipmentId}: specifications ไม่ใช่ object`);
      }

      // Check and fix location field
      if (typeof data.location !== 'object' || data.location === null || Array.isArray(data.location)) {
        updates.location = {};
        needsUpdate = true;
        console.log(`⚠️  ${data.equipmentNumber || equipmentId}: location ไม่ใช่ object`);
      }

      // Update if needed
      if (needsUpdate) {
        try {
          const docRef = doc(db, 'equipmentManagement', equipmentId);
          await updateDoc(docRef, updates);
          fixedCount++;
          console.log(`✅ แก้ไข ${data.equipmentNumber || equipmentId} สำเร็จ\n`);
        } catch (error) {
          errorCount++;
          console.error(`❌ ไม่สามารถแก้ไข ${data.equipmentNumber || equipmentId}:`, error.message, '\n');
        }
      } else {
        console.log(`✓  ${data.equipmentNumber || equipmentId}: ข้อมูลถูกต้องแล้ว`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 สรุปผลการแก้ไข:');
    console.log(`   - ตรวจสอบทั้งหมด: ${snapshot.size} รายการ`);
    console.log(`   - แก้ไขสำเร็จ: ${fixedCount} รายการ`);
    console.log(`   - ข้อมูลถูกต้องแล้ว: ${snapshot.size - fixedCount - errorCount} รายการ`);
    if (errorCount > 0) {
      console.log(`   - เกิดข้อผิดพลาด: ${errorCount} รายการ`);
    }
    console.log('='.repeat(50));

    if (fixedCount > 0) {
      console.log('\n✅ แก้ไขข้อมูลเสร็จสิ้น! ตอนนี้สามารถ deploy ได้แล้ว');
    } else {
      console.log('\n✅ ข้อมูลทั้งหมดถูกต้องแล้ว ไม่ต้องแก้ไข');
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    process.exit(1);
  }
}

// Run the fix
fixEquipmentArrays()
  .then(() => {
    console.log('\n✅ สคริปต์ทำงานเสร็จสิ้น');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ สคริปต์ล้มเหลว:', error);
    process.exit(1);
  });
