/**
 * Check Categories Data Script
 * 
 * ตรวจสอบว่ามีข้อมูล categories ใน Firestore หรือไม่
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

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

async function checkCategoriesData() {
  try {
    console.log('🔍 กำลังตรวจสอบข้อมูล categories...\n');

    // Get categories collection
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);

    if (snapshot.empty) {
      console.log('❌ ไม่พบข้อมูล categories ใน Firestore');
      console.log('\n💡 แนะนำ: รันคำสั่ง npm run seed:categories เพื่อสร้างข้อมูลเริ่มต้น');
      return;
    }

    console.log(`✅ พบข้อมูล categories จำนวน ${snapshot.size} รายการ\n`);
    console.log('📋 รายการ categories:\n');

    const categories = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({
        id: doc.id,
        ...data
      });
      console.log(`  - ${data.name} (ID: ${doc.id})`);
      if (data.description) {
        console.log(`    คำอธิบาย: ${data.description}`);
      }
      if (data.parentId) {
        console.log(`    Parent ID: ${data.parentId}`);
      }
      console.log('');
    });

    // Check for root categories
    const rootCategories = categories.filter(cat => !cat.parentId);
    console.log(`\n📊 สถิติ:`);
    console.log(`  - หมวดหมู่หลัก: ${rootCategories.length} รายการ`);
    console.log(`  - หมวดหมู่ย่อย: ${categories.length - rootCategories.length} รายการ`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    console.error(error);
  }
}

// Run the check
checkCategoriesData()
  .then(() => {
    console.log('\n✅ ตรวจสอบเสร็จสิ้น');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    process.exit(1);
  });
