#!/usr/bin/env node

/**
 * Fix Equipment Structure
 * แก้ไขโครงสร้างข้อมูลให้ตรงกับ equipmentManagement standard
 */

const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'equipment-lending-system-41b49'
});

const db = admin.firestore();

// Category mapping
const categoryMap = {
  'laptop': { id: 'laptop', name: 'คอมพิวเตอร์โน้ตบุ๊ค', icon: '💻' },
  'tablet': { id: 'tablet', name: 'แท็บเล็ต', icon: '📱' },
  'monitor': { id: 'monitor', name: 'จอมอนิเตอร์', icon: '🖥️' },
  'camera': { id: 'camera', name: 'กล้องถ่ายภาพ', icon: '📷' }
};

function parseLocation(locationStr) {
  // Parse location string like "อาคาร A ชั้น 3 ห้อง 301"
  const match = locationStr.match(/อาคาร\s*([^\s]+)\s*ชั้น\s*(\d+)\s*ห้อง\s*(.+)/);
  if (match) {
    return {
      building: match[1],
      floor: match[2],
      room: match[3].trim(),
      description: ''
    };
  }
  
  // Fallback
  return {
    building: locationStr,
    floor: '',
    room: '',
    description: ''
  };
}

async function fixEquipmentStructure() {
  console.log('🔧 กำลังแก้ไขโครงสร้างข้อมูล...\n');

  try {
    const snapshot = await db.collection('equipmentManagement').get();
    console.log(`📦 พบอุปกรณ์ทั้งหมด: ${snapshot.size} รายการ\n`);

    const batch = db.batch();
    let updatedCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const updates = {};
      let needsUpdate = false;

      console.log(`\n📄 ${doc.id}: ${data.name}`);

      // Fix equipmentNumber
      if (!data.equipmentNumber && data.serialNumber) {
        updates.equipmentNumber = data.serialNumber;
        needsUpdate = true;
        console.log(`   ✏️  เพิ่ม equipmentNumber: ${data.serialNumber}`);
      }

      // Fix category (convert string to object)
      if (typeof data.category === 'string') {
        const categoryObj = categoryMap[data.category] || {
          id: data.category,
          name: data.category,
          icon: '📦'
        };
        updates.category = categoryObj;
        needsUpdate = true;
        console.log(`   ✏️  แปลง category เป็น object: ${JSON.stringify(categoryObj)}`);
      }

      // Fix location (convert string to object)
      if (typeof data.location === 'string') {
        const locationObj = parseLocation(data.location);
        updates.location = locationObj;
        needsUpdate = true;
        console.log(`   ✏️  แปลง location เป็น object: ${JSON.stringify(locationObj)}`);
      }

      // Fix location if it's an array (Sony Camera case)
      if (Array.isArray(data.location) || (typeof data.location === 'object' && data.location !== null && Object.keys(data.location).some(k => !isNaN(k)))) {
        const locationObj = {
          building: 'B',
          floor: '1',
          room: 'ห้องสตูดิโอ',
          description: ''
        };
        updates.location = locationObj;
        needsUpdate = true;
        console.log(`   ✏️  แก้ไข location ที่ผิดพลาด: ${JSON.stringify(locationObj)}`);
      }

      // Add searchKeywords if missing
      if (!data.searchKeywords || data.searchKeywords.length === 0) {
        const keywords = [];
        if (data.equipmentNumber || data.serialNumber) {
          const number = data.equipmentNumber || data.serialNumber;
          keywords.push(...number.split(/[-\s]+/));
        }
        if (data.name) {
          keywords.push(...data.name.split(/\s+/));
        }
        updates.searchKeywords = keywords;
        needsUpdate = true;
        console.log(`   ✏️  เพิ่ม searchKeywords: ${keywords.length} keywords`);
      }

      if (needsUpdate) {
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        batch.update(doc.ref, updates);
        updatedCount++;
        console.log(`   ✅ จะอัปเดตรายการนี้`);
      } else {
        console.log(`   ⏭️  ไม่ต้องอัปเดต`);
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`\n✅ อัปเดตสำเร็จ ${updatedCount} รายการ`);
    } else {
      console.log('\nℹ️  ไม่มีรายการที่ต้องอัปเดต');
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    process.exit(0);
  }
}

fixEquipmentStructure();
