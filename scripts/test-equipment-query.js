#!/usr/bin/env node

/**
 * Test Equipment Query
 * ทดสอบ query อุปกรณ์เหมือนกับที่ EquipmentService ใช้
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, limit } = require('firebase/firestore');

// Production Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA9D6ReIlhiaaJ1g1Obd-dcjp2R0LO_eyo",
  authDomain: "equipment-lending-system-41b49.firebaseapp.com",
  projectId: "equipment-lending-system-41b49",
  storageBucket: "equipment-lending-system-41b49.firebasestorage.app",
  messagingSenderId: "47770598089",
  appId: "1:47770598089:web:9d898f247f742fe1686b18"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testQuery() {
  console.log('🔍 ทดสอบ query อุปกรณ์...\n');

  try {
    const equipmentRef = collection(db, 'equipmentManagement');
    
    // Test 1: Query without filter
    console.log('📊 Test 1: Query ทั้งหมด (ไม่มี filter)');
    const q1 = query(equipmentRef, limit(51));
    const snapshot1 = await getDocs(q1);
    console.log(`   ผลลัพธ์: ${snapshot1.size} รายการ`);
    snapshot1.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.data().name}`);
    });

    // Test 2: Query with isActive filter
    console.log('\n📊 Test 2: Query ที่มี isActive filter');
    const q2 = query(equipmentRef, where('isActive', '==', true), limit(51));
    const snapshot2 = await getDocs(q2);
    console.log(`   ผลลัพธ์: ${snapshot2.size} รายการ`);
    snapshot2.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.data().name}`);
    });

    console.log('\n✅ เสร็จสิ้น');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    process.exit(0);
  }
}

testQuery();
