/**
 * Check Equipment Categories Script
 * 
 * ตรวจสอบว่ามีข้อมูล equipmentCategories ใน Firestore หรือไม่
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
require('dotenv').config({ path: '.env.production.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

console.log('🔧 Firebase Project:', firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkEquipmentCategories() {
  try {
    console.log('🔍 กำลังตรวจสอบข้อมูล equipmentCategories...\n');

    // Get equipmentCategories collection
    const categoriesRef = collection(db, 'equipmentCategories');
    const snapshot = await getDocs(categoriesRef);

    if (snapshot.empty) {
      console.log('❌ ไม่พบข้อมูล equipmentCategories ใน Firestore');
      console.log('\n💡 แนะนำ: ต้องสร้าง categories ก่อนใช้งาน');
      return;
    }

    console.log(`✅ พบข้อมูล equipmentCategories จำนวน ${snapshot.size} รายการ\n`);
    console.log('📋 รายการ categories:\n');

    const categories = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({
        id: doc.id,
        ...data
      });
      console.log(`  - ${data.name || 'ไม่มีชื่อ'} (ID: ${doc.id})`);
      if (data.description) {
        console.log(`    คำอธิบาย: ${data.description}`);
      }
      if (data.equipmentCount !== undefined) {
        console.log(`    จำนวนอุปกรณ์: ${data.equipmentCount}`);
      }
      console.log('');
    });

    console.log(`\n📊 สถิติ:`);
    console.log(`  - จำนวน categories ทั้งหมด: ${categories.length} รายการ`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    console.error(error);
  }
}

// Run the check
checkEquipmentCategories()
  .then(() => {
    console.log('\n✅ ตรวจสอบเสร็จสิ้น');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    process.exit(1);
  });
