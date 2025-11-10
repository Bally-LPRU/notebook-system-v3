/**
 * สร้าง Collection equipmentCategories และเพิ่มหมวดหมู่เริ่มต้น
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
const auth = getAuth(app);

// หมวดหมู่เริ่มต้น
const defaultCategories = [
  {
    id: 'computers',
    name: 'คอมพิวเตอร์',
    icon: '💻',
    description: 'คอมพิวเตอร์ โน้ตบุ๊ค และอุปกรณ์ที่เกี่ยวข้อง',
    order: 1
  },
  {
    id: 'projectors',
    name: 'โปรเจคเตอร์',
    icon: '📽️',
    description: 'โปรเจคเตอร์และจอฉาย',
    order: 2
  },
  {
    id: 'cameras',
    name: 'กล้อง',
    icon: '📷',
    description: 'กล้องถ่ายรูป กล้องวิดีโอ และอุปกรณ์ถ่ายภาพ',
    order: 3
  },
  {
    id: 'audio',
    name: 'อุปกรณ์เสียง',
    icon: '🎤',
    description: 'ไมโครโฟน ลำโพง และอุปกรณ์เสียง',
    order: 4
  },
  {
    id: 'networking',
    name: 'อุปกรณ์เครือข่าย',
    icon: '🌐',
    description: 'Router, Switch, Access Point',
    order: 5
  },
  {
    id: 'tools',
    name: 'เครื่องมือ',
    icon: '🔧',
    description: 'เครื่องมือช่างและอุปกรณ์ซ่อมบำรุง',
    order: 6
  },
  {
    id: 'furniture',
    name: 'เฟอร์นิเจอร์',
    icon: '🪑',
    description: 'โต๊ะ เก้าอี้ และเฟอร์นิเจอร์',
    order: 7
  },
  {
    id: 'sports',
    name: 'อุปกรณ์กีฬา',
    icon: '⚽',
    description: 'อุปกรณ์กีฬาและออกกำลังกาย',
    order: 8
  },
  {
    id: 'laboratory',
    name: 'อุปกรณ์ห้องปฏิบัติการ',
    icon: '🔬',
    description: 'อุปกรณ์วิทยาศาสตร์และห้องแล็บ',
    order: 9
  },
  {
    id: 'others',
    name: 'อื่นๆ',
    icon: '📦',
    description: 'อุปกรณ์อื่นๆ ที่ไม่อยู่ในหมวดหมู่ข้างต้น',
    order: 10
  }
];

async function createCategoriesCollection() {
  try {
    console.log('🏷️  กำลังสร้าง collection equipmentCategories...\n');

    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('❌ กรุณา login ก่อน');
      return;
    }

    console.log('✅ Login แล้วด้วย:', currentUser.email);
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    for (const category of defaultCategories) {
      try {
        const categoryData = {
          ...category,
          equipmentCount: 0,
          isActive: true,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid
        };

        const docRef = await addDoc(collection(db, 'equipmentCategories'), categoryData);
        console.log(`✅ สร้างหมวดหมู่: ${category.name} (${docRef.id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ ไม่สามารถสร้างหมวดหมู่ ${category.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('');
    console.log('📊 สรุปผลการสร้างหมวดหมู่:');
    console.log(`✅ สำเร็จ: ${successCount} หมวดหมู่`);
    console.log(`❌ ล้มเหลว: ${errorCount} หมวดหมู่`);
    console.log('');
    console.log('🎉 เสร็จสิ้น! ตอนนี้สามารถเลือกหมวดหมู่เมื่อเพิ่มอุปกรณ์ได้แล้ว');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

createCategoriesCollection().catch(console.error);
