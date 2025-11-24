#!/usr/bin/env node

/**
 * Check Specific Equipment Details
 * ตรวจสอบรายละเอียดของอุปกรณ์เฉพาะ
 */

const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'equipment-lending-system-41b49'
});

const db = admin.firestore();

async function checkEquipment() {
  console.log('🔍 กำลังตรวจสอบรายละเอียดอุปกรณ์...\n');

  try {
    const snapshot = await db.collection('equipmentManagement').get();

    console.log(`📦 พบอุปกรณ์ทั้งหมด: ${snapshot.size} รายการ\n`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\n📄 ${doc.id}:`);
      console.log(`   ชื่อ: ${data.name}`);
      console.log(`   equipmentNumber: ${data.equipmentNumber || 'ไม่มี'}`);
      console.log(`   serialNumber: ${data.serialNumber || 'ไม่มี'}`);
      console.log(`   category: ${JSON.stringify(data.category)}`);
      console.log(`   location: ${JSON.stringify(data.location)}`);
      console.log(`   isActive: ${data.isActive}`);
      console.log(`   status: ${data.status}`);
      console.log(`   createdBy: ${data.createdBy}`);
    });

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    process.exit(0);
  }
}

checkEquipment();
