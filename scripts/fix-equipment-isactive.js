#!/usr/bin/env node

/**
 * Fix Equipment isActive Field
 * เพิ่ม field isActive ให้กับอุปกรณ์ที่ไม่มี field นี้
 */

const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'equipment-lending-system-41b49'
});

const db = admin.firestore();

async function fixIsActiveField() {
  console.log('🔧 กำลังแก้ไข field isActive...\n');

  try {
    const snapshot = await db.collection('equipmentManagement').get();

    console.log(`📦 พบอุปกรณ์ทั้งหมด: ${snapshot.size} รายการ\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    const batch = db.batch();

    snapshot.forEach((doc) => {
      const data = doc.data();
      
      if (data.isActive === undefined) {
        console.log(`✏️  อัปเดต: ${doc.id} - ${data.name}`);
        batch.update(doc.ref, { 
          isActive: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updatedCount++;
      } else {
        console.log(`⏭️  ข้าม: ${doc.id} - ${data.name} (มี isActive แล้ว: ${data.isActive})`);
        skippedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`\n✅ อัปเดตสำเร็จ ${updatedCount} รายการ`);
    } else {
      console.log('\nℹ️  ไม่มีรายการที่ต้องอัปเดต');
    }

    console.log(`📊 สรุป:`);
    console.log(`   อัปเดต: ${updatedCount}`);
    console.log(`   ข้าม: ${skippedCount}`);
    console.log(`   ทั้งหมด: ${snapshot.size}`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    process.exit(0);
  }
}

fixIsActiveField();
