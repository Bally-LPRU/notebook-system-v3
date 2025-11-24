#!/usr/bin/env node

/**
 * Check Equipment Fields
 * ตรวจสอบ fields ของอุปกรณ์แต่ละรายการ
 */

const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'equipment-lending-system-41b49'
});

const db = admin.firestore();

async function checkEquipmentFields() {
  console.log('🔍 กำลังตรวจสอบ fields ของอุปกรณ์...\n');

  try {
    const snapshot = await db.collection('equipmentManagement').get();

    console.log(`📦 พบอุปกรณ์ทั้งหมด: ${snapshot.size} รายการ\n`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📄 ${doc.id}:`);
      console.log(`   ชื่อ: ${data.name}`);
      console.log(`   Serial: ${data.serialNumber}`);
      console.log(`   isActive: ${data.isActive !== undefined ? data.isActive : 'ไม่มี field นี้'}`);
      console.log(`   status: ${data.status}`);
      console.log(`   createdBy: ${data.createdBy}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    process.exit(0);
  }
}

checkEquipmentFields();
