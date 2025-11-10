/**
 * Simple Equipment Data Seeding Script
 * สคริปต์แบบง่ายสำหรับนำเข้าข้อมูลอุปกรณ์ (ไม่ต้องใช้ Firebase Admin SDK)
 * 
 * วิธีใช้:
 * 1. เปิดเว็บแอปพลิเคชันในเบราว์เซอร์
 * 2. เปิด Console (F12)
 * 3. คัดลอกโค้ดด้านล่างทั้งหมดแล้ววางใน Console
 * 4. กด Enter เพื่อรันสคริปต์
 */

// ข้อมูลอุปกรณ์ตัวอย่าง
const sampleEquipmentData = [
  {
    equipmentNumber: 'EQ-2024-001',
    name: 'MacBook Pro 14-inch M3',
    category: { id: 'laptop', name: 'โน็คบุค', icon: 'laptop' },
    brand: 'Apple',
    model: 'M3 Pro 2024',
    description: 'MacBook Pro 14 นิ้ว ชิป M3 Pro, RAM 18GB, SSD 512GB',
    specifications: {
      processor: 'Apple M3 Pro',
      memory: '18GB Unified Memory',
      storage: '512GB SSD'
    },
    status: 'active',
    location: { building: 'อาคาร A', floor: '3', room: '301', description: 'ห้องคอมพิวเตอร์' },
    purchaseDate: new Date('2024-01-15'),
    purchasePrice: 89900,
    vendor: 'Apple Store Thailand',
    warrantyExpiry: new Date('2027-01-15'),
    tags: ['laptop', 'macbook', 'development'],
    notes: 'ใช้สำหรับงานพัฒนาซอฟต์แวร์'
  },
  {
    equipmentNumber: 'EQ-2024-002',
    name: 'Dell XPS 15',
    category: { id: 'laptop', name: 'โน็คบุค', icon: 'laptop' },
    brand: 'Dell',
    model: 'XPS 15 9530',
    description: 'Dell XPS 15 Intel Core i7-13700H, RAM 16GB, SSD 512GB',
    specifications: {
      processor: 'Intel Core i7-13700H',
      memory: '16GB DDR5',
      storage: '512GB NVMe SSD'
    },
    status: 'active',
    location: { building: 'อาคาร A', floor: '3', room: '302', description: 'ห้องออกแบบกราฟิก' },
    purchaseDate: new Date('2024-02-01'),
    purchasePrice: 65900,
    vendor: 'Dell Thailand',
    warrantyExpiry: new Date('2027-02-01'),
    tags: ['laptop', 'dell', 'design'],
    notes: 'ใช้สำหรับงานออกแบบกราฟิก'
  },
  {
    equipmentNumber: 'EQ-2024-003',
    name: 'iPad Pro 12.9-inch',
    category: { id: 'tablet', name: 'แท็บเล็ต', icon: 'tablet' },
    brand: 'Apple',
    model: 'iPad Pro M2 2023',
    description: 'iPad Pro 12.9 นิ้ว ชิป M2, WiFi + Cellular 256GB',
    specifications: {
      processor: 'Apple M2',
      storage: '256GB'
    },
    status: 'active',
    location: { building: 'อาคาร B', floor: '2', room: '201', description: 'ห้องประชุม' },
    purchaseDate: new Date('2024-01-20'),
    purchasePrice: 52900,
    vendor: 'Apple Store Thailand',
    warrantyExpiry: new Date('2025-01-20'),
    tags: ['tablet', 'ipad', 'presentation'],
    notes: 'ใช้สำหรับการนำเสนอและประชุม'
  },
  {
    equipmentNumber: 'EQ-2024-004',
    name: 'LG UltraWide Monitor 34"',
    category: { id: 'monitor', name: 'จอมอนิเตอร์', icon: 'monitor' },
    brand: 'LG',
    model: '34WK95U-W',
    description: 'จอมอนิเตอร์ LG UltraWide 34 นิ้ว 5K2K IPS',
    specifications: {
      size: '34 inches',
      resolution: '5120 x 2160'
    },
    status: 'active',
    location: { building: 'อาคาร A', floor: '3', room: '301', description: 'โต๊ะทำงาน 1' },
    purchaseDate: new Date('2024-01-10'),
    purchasePrice: 35900,
    vendor: 'LG Thailand',
    warrantyExpiry: new Date('2027-01-10'),
    tags: ['monitor', 'ultrawide', 'display'],
    notes: 'จอมอนิเตอร์สำหรับงานมัลติทาสก์'
  },
  {
    equipmentNumber: 'EQ-2024-005',
    name: 'Sony Alpha A7 IV',
    category: { id: 'camera', name: 'กล้อง', icon: 'camera' },
    brand: 'Sony',
    model: 'Alpha A7 IV',
    description: 'กล้อง Mirrorless Full-Frame 33MP',
    specifications: {
      sensor: '33MP Full-Frame',
      video: '4K 60fps'
    },
    status: 'active',
    location: { building: 'อาคาร B', floor: '1', room: 'ห้องสตูดิโอ', description: 'ตู้เก็บอุปกรณ์' },
    purchaseDate: new Date('2024-02-10'),
    purchasePrice: 89900,
    vendor: 'Sony Thailand',
    warrantyExpiry: new Date('2025-02-10'),
    tags: ['camera', 'photography', 'video'],
    notes: 'กล้องสำหรับงานถ่ายภาพและวิดีโอ'
  }
];

console.log('🌱 เริ่มนำเข้าข้อมูลอุปกรณ์...\n');

// ฟังก์ชันสำหรับนำเข้าข้อมูล
async function importEquipmentData() {
  // ต้องมี EquipmentManagementService และ user ที่ล็อกอินอยู่
  if (typeof EquipmentManagementService === 'undefined') {
    console.error('❌ ไม่พบ EquipmentManagementService - กรุณาเปิดหน้าเว็บแอปพลิเคชันก่อน');
    return;
  }

  // ตรวจสอบว่ามี user ล็อกอินอยู่หรือไม่
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    console.error('❌ กรุณาล็อกอินก่อนนำเข้าข้อมูล');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const equipment of sampleEquipmentData) {
    try {
      await EquipmentManagementService.createEquipment(
        equipment,
        [], // ไม่มีรูปภาพ
        currentUser.uid,
        { role: 'admin' }
      );
      console.log(`✅ เพิ่มสำเร็จ: ${equipment.equipmentNumber} - ${equipment.name}`);
      successCount++;
    } catch (error) {
      console.error(`❌ เกิดข้อผิดพลาด ${equipment.equipmentNumber}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 สรุปผลการนำเข้า:');
  console.log(`   ✅ สำเร็จ: ${successCount}`);
  console.log(`   ❌ ล้มเหลว: ${errorCount}`);
  console.log(`   📦 ทั้งหมด: ${sampleEquipmentData.length}`);
  console.log('\n✨ เสร็จสิ้นการนำเข้าข้อมูล!');
}

// รันฟังก์ชัน
importEquipmentData();
