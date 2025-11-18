/**
 * Seed Equipment Categories to Firebase
 * Run this script to populate the equipmentCategories collection
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } = require('firebase/firestore');
const { DEFAULT_EQUIPMENT_CATEGORIES, COMPUTER_SUBCATEGORIES, AV_SUBCATEGORIES } = require('../src/data/defaultEquipmentCategories');

// Firebase config
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

async function seedCategories() {
  try {
    console.log('🌱 เริ่มต้นเพิ่มประเภทอุปกรณ์...\n');

    // Check existing categories
    const categoriesRef = collection(db, 'equipmentCategories');
    const existingSnapshot = await getDocs(categoriesRef);
    
    console.log(`📊 พบประเภทอุปกรณ์ที่มีอยู่แล้ว: ${existingSnapshot.size} รายการ\n`);

    const categoryMap = new Map();
    let addedCount = 0;
    let skippedCount = 0;

    // Add main categories first
    console.log('📁 กำลังเพิ่มประเภทหลัก...');
    for (const category of DEFAULT_EQUIPMENT_CATEGORIES) {
      // Check if category already exists
      const q = query(categoriesRef, where('name', '==', category.name));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const categoryData = {
          ...category,
          equipmentCount: 0,
          isActive: true,
          createdAt: serverTimestamp(),
          createdBy: 'system',
          updatedAt: serverTimestamp(),
          updatedBy: 'system'
        };

        const docRef = await addDoc(categoriesRef, categoryData);
        categoryMap.set(category.name, docRef.id);
        console.log(`  ✅ เพิ่ม: ${category.name} (${category.nameEn})`);
        addedCount++;
      } else {
        categoryMap.set(category.name, snapshot.docs[0].id);
        console.log(`  ⏭️  มีอยู่แล้ว: ${category.name}`);
        skippedCount++;
      }
    }

    // Add computer sub-categories
    console.log('\n💻 กำลังเพิ่มประเภทย่อย - คอมพิวเตอร์...');
    const computerParentId = categoryMap.get('คอมพิวเตอร์และอุปกรณ์');
    
    if (computerParentId) {
      for (const subCat of COMPUTER_SUBCATEGORIES) {
        const q = query(categoriesRef, where('name', '==', subCat.name));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          const subCategoryData = {
            ...subCat,
            parentId: computerParentId,
            level: 1,
            path: `คอมพิวเตอร์และอุปกรณ์/${subCat.name}`,
            equipmentCount: 0,
            isActive: true,
            requiredFields: ['brand', 'model', 'specifications'],
            customFields: [],
            createdAt: serverTimestamp(),
            createdBy: 'system',
            updatedAt: serverTimestamp(),
            updatedBy: 'system'
          };

          await addDoc(categoriesRef, subCategoryData);
          console.log(`  ✅ เพิ่ม: ${subCat.name} (${subCat.nameEn})`);
          addedCount++;
        } else {
          console.log(`  ⏭️  มีอยู่แล้ว: ${subCat.name}`);
          skippedCount++;
        }
      }
    }

    // Add AV sub-categories
    console.log('\n🎬 กำลังเพิ่มประเภทย่อย - โสตทัศนูปกรณ์...');
    const avParentId = categoryMap.get('อุปกรณ์โสตทัศนูปกรณ์');
    
    if (avParentId) {
      for (const subCat of AV_SUBCATEGORIES) {
        const q = query(categoriesRef, where('name', '==', subCat.name));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          const subCategoryData = {
            ...subCat,
            parentId: avParentId,
            level: 1,
            path: `อุปกรณ์โสตทัศนูปกรณ์/${subCat.name}`,
            equipmentCount: 0,
            isActive: true,
            requiredFields: ['brand', 'model'],
            customFields: [],
            createdAt: serverTimestamp(),
            createdBy: 'system',
            updatedAt: serverTimestamp(),
            updatedBy: 'system'
          };

          await addDoc(categoriesRef, subCategoryData);
          console.log(`  ✅ เพิ่ม: ${subCat.name} (${subCat.nameEn})`);
          addedCount++;
        } else {
          console.log(`  ⏭️  มีอยู่แล้ว: ${subCat.name}`);
          skippedCount++;
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 สรุปผลการเพิ่มประเภทอุปกรณ์:');
    console.log(`  ✅ เพิ่มใหม่: ${addedCount} รายการ`);
    console.log(`  ⏭️  มีอยู่แล้ว: ${skippedCount} รายการ`);
    console.log(`  📁 รวมทั้งหมด: ${addedCount + skippedCount} รายการ`);
    console.log('='.repeat(50));
    console.log('\n✨ เสร็จสิ้น! ประเภทอุปกรณ์พร้อมใช้งานแล้ว\n');

  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error);
    console.error('   Error message:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedCategories()
  .then(() => {
    console.log('👋 ปิดการเชื่อมต่อ...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
