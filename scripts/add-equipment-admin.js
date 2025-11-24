#!/usr/bin/env node

/**
 * Add Equipment using Firebase Admin SDK
 * เพิ่มข้อมูลอุปกรณ์โดยใช้ Admin SDK (bypass security rules)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'equipment-lending-system-41b49'
});

const db = admin.firestore();

// Sample equipment data
const equipmentData = [
  {
    name: 'MacBook Pro 14-inch M3',
    category: 'laptop',
    brand: 'Apple',
    model: 'M3 Pro 2024',
    serialNumber: 'MBP-2024-001',
    description: 'MacBook Pro 14 นิ้ว ชิป M3 Pro, RAM 18GB, SSD 512GB',
    status: 'available',
    location: 'อาคาร A ชั้น 3 ห้อง 301',
    purchaseDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-15')),
    warrantyExpiry: admin.firestore.Timestamp.fromDate(new Date('2027-01-15'))
  },
  {
    name: 'Dell XPS 15',
    category: 'laptop',
    brand: 'Dell',
    model: 'XPS 15 9530',
    serialNumber: 'DELL-2024-001',
    description: 'Dell XPS 15 Intel Core i7-13700H, RAM 16GB, SSD 512GB',
    status: 'available',
    location: 'อาคาร A ชั้น 3 ห้อง 302',
    purchaseDate: admin.firestore.Timestamp.fromDate(new Date('2024-02-01')),
    warrantyExpiry: admin.firestore.Timestamp.fromDate(new Date('2027-02-01'))
  },
  {
    name: 'iPad Pro 12.9-inch',
    category: 'tablet',
    brand: 'Apple',
    model: 'iPad Pro M2 2023',
    serialNumber: 'IPAD-2024-001',
    description: 'iPad Pro 12.9 นิ้ว ชิป M2, WiFi + Cellular 256GB',
    status: 'available',
    location: 'อาคาร B ชั้น 2 ห้อง 201',
    purchaseDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-20')),
    warrantyExpiry: admin.firestore.Timestamp.fromDate(new Date('2025-01-20'))
  },
  {
    name: 'LG UltraWide Monitor 34"',
    category: 'monitor',
    brand: 'LG',
    model: '34WK95U-W',
    serialNumber: 'LG-2024-001',
    description: 'จอมอนิเตอร์ LG UltraWide 34 นิ้ว 5K2K IPS',
    status: 'available',
    location: 'อาคาร A ชั้น 3 ห้อง 301',
    purchaseDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-10')),
    warrantyExpiry: admin.firestore.Timestamp.fromDate(new Date('2027-01-10'))
  },
  {
    name: 'Sony Alpha A7 IV',
    category: 'camera',
    brand: 'Sony',
    model: 'Alpha A7 IV',
    serialNumber: 'SONY-2024-001',
    description: 'กล้อง Mirrorless Full-Frame 33MP',
    status: 'available',
    location: 'อาคาร B ชั้น 1 ห้องสตูดิโอ',
    purchaseDate: admin.firestore.Timestamp.fromDate(new Date('2024-02-10')),
    warrantyExpiry: admin.firestore.Timestamp.fromDate(new Date('2025-02-10'))
  }
];

async function addEquipment() {
  console.log('🌱 เริ่มเพิ่มข้อมูลอุปกรณ์ (Admin SDK)...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const equipment of equipmentData) {
    try {
      const equipmentWithTimestamp = {
        ...equipment,
        isActive: true, // Required for EquipmentManagementService queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'admin-script'
      };

      const docRef = await db.collection('equipmentManagement').add(equipmentWithTimestamp);

      console.log(`✅ เพิ่มสำเร็จ: ${equipment.serialNumber} - ${equipment.name} (ID: ${docRef.id})`);
      successCount++;
    } catch (error) {
      console.error(`❌ เกิดข้อผิดพลาด ${equipment.serialNumber}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 สรุปผลการเพิ่มข้อมูล:');
  console.log(`   ✅ สำเร็จ: ${successCount}`);
  console.log(`   ❌ ล้มเหลว: ${errorCount}`);
  console.log(`   📦 ทั้งหมด: ${equipmentData.length}`);
  console.log('\n✨ เสร็จสิ้น!');

  process.exit(0);
}

addEquipment().catch(error => {
  console.error('❌ เกิดข้อผิดพลาด:', error);
  process.exit(1);
});
