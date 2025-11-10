/**
 * Seed Equipment Data Script
 * สคริปต์สำหรับนำเข้าข้อมูลอุปกรณ์ตัวอย่างเข้า Firebase
 * 
 * วิธีใช้:
 * node scripts/seed-equipment-data.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} = require('firebase/firestore');

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

// Sample equipment data
const sampleEquipment = [
  {
    equipmentNumber: 'EQ-2024-001',
    name: 'MacBook Pro 14-inch M3',
    category: {
      id: 'laptop',
      name: 'โน็คบุค',
      icon: 'laptop'
    },
    brand: 'Apple',
    model: 'M3 Pro 2024',
    description: 'MacBook Pro 14 นิ้ว ชิป M3 Pro, RAM 18GB, SSD 512GB',
    specifications: {
      processor: 'Apple M3 Pro',
      memory: '18GB Unified Memory',
      storage: '512GB SSD',
      display: '14.2-inch Liquid Retina XDR',
      graphics: 'Apple M3 Pro GPU'
    },
    status: 'active',
    location: {
      building: 'อาคาร A',
      floor: '3',
      room: '301',
      description: 'ห้องคอมพิวเตอร์'
    },
    purchaseDate: new Date('2024-01-15'),
    purchasePrice: 89900,
    vendor: 'Apple Store Thailand',
    warrantyExpiry: new Date('2027-01-15'),
    responsiblePerson: null,
    images: [],
    qrCode: null,
    tags: ['laptop', 'macbook', 'development'],
    notes: 'ใช้สำหรับงานพัฒนาซอฟต์แวร์',
    searchKeywords: ['macbook', 'pro', 'm3', 'apple', 'laptop', 'eq-2024-001'],
    isActive: true,
    viewCount: 0,
    lastViewed: null,
    version: 1
  },
  {
    equipmentNumber: 'EQ-2024-002',
    name: 'Dell XPS 15',
    category: {
      id: 'laptop',
      name: 'โน็คบุค',
      icon: 'laptop'
    },
    brand: 'Dell',
    model: 'XPS 15 9530',
    description: 'Dell XPS 15 Intel Core i7-13700H, RAM 16GB, SSD 512GB',
    specifications: {
      processor: 'Intel Core i7-13700H',
      memory: '16GB DDR5',
      storage: '512GB NVMe SSD',
      display: '15.6-inch FHD+',
      graphics: 'NVIDIA GeForce RTX 4050'
    },
    status: 'active',
    location: {
      building: 'อาคาร A',
      floor: '3',
      room: '302',
      description: 'ห้องออกแบบกราฟิก'
    },
    purchaseDate: new Date('2024-02-01'),
    purchasePrice: 65900,
    vendor: 'Dell Thailand',
    warrantyExpiry: new Date('2027-02-01'),
    responsiblePerson: null,
    images: [],
    qrCode: null,
    tags: ['laptop', 'dell', 'design'],
    notes: 'ใช้สำหรับงานออกแบบกราฟิก',
    searchKeywords: ['dell', 'xps', 'laptop', 'eq-2024-002'],
    isActive: true,
    viewCount: 0,
    lastViewed: null,
    version: 1
  },
  {
    equipmentNumber: 'EQ-2024-003',
    name: 'iPad Pro 12.9-inch',
    category: {
      id: 'tablet',
      name: 'แท็บเล็ต',
      icon: 'tablet'
    },
    brand: 'Apple',
    model: 'iPad Pro M2 2023',
    description: 'iPad Pro 12.9 นิ้ว ชิป M2, WiFi + Cellular 256GB',
    specifications: {
      processor: 'Apple M2',
      memory: '8GB',
      storage: '256GB',
      display: '12.9-inch Liquid Retina XDR',
      connectivity: 'WiFi 6E + 5G'
    },
    status: 'active',
    location: {
      building: 'อาคาร B',
      floor: '2',
      room: '201',
      description: 'ห้องประชุม'
    },
    purchaseDate: new Date('2024-01-20'),
    purchasePrice: 52900,
    vendor: 'Apple Store Thailand',
    warrantyExpiry: new Date('2025-01-20'),
    responsiblePerson: null,
    images: [],
    qrCode: null,
    tags: ['tablet', 'ipad', 'presentation'],
    notes: 'ใช้สำหรับการนำเสนอและประชุม',
    searchKeywords: ['ipad', 'pro', 'apple', 'tablet', 'eq-2024-003'],
    isActive: true,
    viewCount: 0,
    lastViewed: null,
    version: 1
  },
  {
    equipmentNumber: 'EQ-2024-004',
    name: 'LG UltraWide Monitor 34"',
    category: {
      id: 'monitor',
      name: 'จอมอนิเตอร์',
      icon: 'monitor'
    },
    brand: 'LG',
    model: '34WK95U-W',
    description: 'จอมอนิเตอร์ LG UltraWide 34 นิ้ว 5K2K IPS',
    specifications: {
      size: '34 inches',
      resolution: '5120 x 2160 (5K2K)',
      panelType: 'IPS',
      refreshRate: '60Hz',
      connectivity: 'Thunderbolt 3, HDMI, DisplayPort'
    },
    status: 'active',
    location: {
      building: 'อาคาร A',
      floor: '3',
      room: '301',
      description: 'โต๊ะทำงาน 1'
    },
    purchaseDate: new Date('2024-01-10'),
    purchasePrice: 35900,
    vendor: 'LG Thailand',
    warrantyExpiry: new Date('2027-01-10'),
    responsiblePerson: null,
    images: [],
    qrCode: null,
    tags: ['monitor', 'ultrawide', 'display'],
    notes: 'จอมอนิเตอร์สำหรับงานมัลติทาสก์',
    searchKeywords: ['lg', 'ultrawide', 'monitor', 'eq-2024-004'],
    isActive: true,
    viewCount: 0,
    lastViewed: null,
    version: 1
  },
  {
    equipmentNumber: 'EQ-2024-005',
    name: 'Epson EcoTank L3250',
    category: {
      id: 'accessories',
      name: 'อุปกรณ์เสริม',
      icon: 'printer'
    },
    brand: 'Epson',
    model: 'EcoTank L3250',
    description: 'เครื่องพิมพ์อิงค์เจ็ท All-in-One พร้อมถังหมึก',
    specifications: {
      type: 'Inkjet All-in-One',
      printSpeed: '33 ppm (Black), 15 ppm (Color)',
      connectivity: 'WiFi, USB',
      functions: 'Print, Scan, Copy'
    },
    status: 'active',
    location: {
      building: 'อาคาร A',
      floor: '2',
      room: 'ห้องเอกสาร',
      description: 'มุมเครื่องพิมพ์'
    },
    purchaseDate: new Date('2023-12-15'),
    purchasePrice: 6990,
    vendor: 'Epson Thailand',
    warrantyExpiry: new Date('2024-12-15'),
    responsiblePerson: null,
    images: [],
    qrCode: null,
    tags: ['printer', 'scanner', 'office'],
    notes: 'เครื่องพิมพ์สำหรับงานทั่วไป',
    searchKeywords: ['epson', 'printer', 'ecotank', 'eq-2024-005'],
    isActive: true,
    viewCount: 0,
    lastViewed: null,
    version: 1
  },
  {
    equipmentNumber: 'EQ-2024-006',
    name: 'Sony Alpha A7 IV',
    category: {
      id: 'camera',
      name: 'กล้อง',
      icon: 'camera'
    },
    brand: 'Sony',
    model: 'Alpha A7 IV',
    description: 'กล้อง Mirrorless Full-Frame 33MP พร้อมเลนส์ 28-70mm',
    specifications: {
      sensor: '33MP Full-Frame CMOS',
      video: '4K 60fps',
      autofocus: '759-point AF',
      stabilization: '5-axis IBIS',
      lens: 'FE 28-70mm f/3.5-5.6 OSS'
    },
    status: 'active',
    location: {
      building: 'อาคาร B',
      floor: '1',
      room: 'ห้องสตูดิโอ',
      description: 'ตู้เก็บอุปกรณ์ถ่ายภาพ'
    },
    purchaseDate: new Date('2024-02-10'),
    purchasePrice: 89900,
    vendor: 'Sony Thailand',
    warrantyExpiry: new Date('2025-02-10'),
    responsiblePerson: null,
    images: [],
    qrCode: null,
    tags: ['camera', 'photography', 'video'],
    notes: 'กล้องสำหรับงานถ่ายภาพและวิดีโอ',
    searchKeywords: ['sony', 'alpha', 'camera', 'a7iv', 'eq-2024-006'],
    isActive: true,
    viewCount: 0,
    lastViewed: null,
    version: 1
  },
  {
    equipmentNumber: 'EQ-2024-007',
    name: 'Logitech MX Master 3S',
    category: {
      id: 'accessories',
      name: 'อุปกรณ์เสริม',
      icon: 'mouse'
    },
    brand: 'Logitech',
    model: 'MX Master 3S',
    description: 'เมาส์ไร้สาย Ergonomic สำหรับมืออาชีพ',
    specifications: {
      type: 'Wireless Mouse',
      sensor: '8000 DPI',
      connectivity: 'Bluetooth, USB Receiver',
      battery: 'Rechargeable (70 days)',
      buttons: '7 programmable buttons'
    },
    status: 'active',
    location: {
      building: 'อาคาร A',
      floor: '3',
      room: '301',
      description: 'โต๊ะทำงาน 2'
    },
    purchaseDate: new Date('2024-01-25'),
    purchasePrice: 3990,
    vendor: 'Logitech Thailand',
    warrantyExpiry: new Date('2025-01-25'),
    responsiblePerson: null,
    images: [],
    qrCode: null,
    tags: ['mouse', 'wireless', 'accessories'],
    notes: 'เมาส์สำหรับงานออกแบบและเขียนโปรแกรม',
    searchKeywords: ['logitech', 'mouse', 'mx', 'master', 'eq-2024-007'],
    isActive: true,
    viewCount: 0,
    lastViewed: null,
    version: 1
  },
  {
    equipmentNumber: 'EQ-2024-008',
    name: 'BenQ PD2725U Designer Monitor',
    category: {
      id: 'monitor',
      name: 'จอมอนิเตอร์',
      icon: 'monitor'
    },
    brand: 'BenQ',
    model: 'PD2725U',
    description: 'จอมอนิเตอร์ 27 นิ้ว 4K IPS สำหรับงานออกแบบ',
    specifications: {
      size: '27 inches',
      resolution: '3840 x 2160 (4K UHD)',
      panelType: 'IPS',
      colorGamut: '99% sRGB, 95% P3',
      connectivity: 'USB-C, HDMI, DisplayPort'
    },
    status: 'maintenance',
    location: {
      building: 'อาคาร A',
      floor: '3',
      room: '302',
      description: 'โต๊ะออกแบบ'
    },
    purchaseDate: new Date('2023-11-20'),
    purchasePrice: 28900,
    vendor: 'BenQ Thailand',
    warrantyExpiry: new Date('2026-11-20'),
    responsiblePerson: null,
    images: [],
    qrCode: null,
    tags: ['monitor', 'design', '4k'],
    notes: 'อยู่ระหว่างซ่อมแซม - ปัญหาจอกะพริบ',
    searchKeywords: ['benq', 'monitor', 'designer', 'eq-2024-008'],
    isActive: true,
    viewCount: 0,
    lastViewed: null,
    version: 1
  },
  {
    equipmentNumber: 'EQ-2024-009',
    name: 'Synology DS923+ NAS',
    category: {
      id: 'network',
      name: 'อุปกรณ์เครือข่าย',
      icon: 'server'
    },
    brand: 'Synology',
    model: 'DiskStation DS923+',
    description: 'NAS 4-Bay พร้อม HDD 4TB x 4 (16TB Total)',
    specifications: {
      bays: '4-Bay',
      processor: 'AMD Ryzen R1600',
      memory: '4GB DDR4 ECC (expandable to 32GB)',
      storage: '16TB (4 x 4TB WD Red Plus)',
      connectivity: '2 x 1GbE, 2 x 10GbE'
    },
    status: 'active',
    location: {
      building: 'อาคาร A',
      floor: '4',
      room: 'ห้องเซิร์ฟเวอร์',
      description: 'ตู้แร็ค A1'
    },
    purchaseDate: new Date('2024-01-05'),
    purchasePrice: 45900,
    vendor: 'Synology Thailand',
    warrantyExpiry: new Date('2027-01-05'),
    responsiblePerson: null,
    images: [],
    qrCode: null,
    tags: ['nas', 'storage', 'network', 'backup'],
    notes: 'ใช้สำหรับเก็บข้อมูลและสำรองข้อมูล',
    searchKeywords: ['synology', 'nas', 'storage', 'eq-2024-009'],
    isActive: true,
    viewCount: 0,
    lastViewed: null,
    version: 1
  },
  {
    equipmentNumber: 'EQ-2024-010',
    name: 'Herman Miller Aeron Chair',
    category: {
      id: 'other',
      name: 'อื่นๆ',
      icon: 'chair'
    },
    brand: 'Herman Miller',
    model: 'Aeron Remastered Size B',
    description: 'เก้าอี้สำนักงานเพื่อสุขภาพ ปรับระดับได้',
    specifications: {
      size: 'Size B (Medium)',
      material: 'Pellicle Mesh',
      adjustments: 'Height, Tilt, Lumbar, Arms',
      weightCapacity: '159 kg',
      warranty: '12 years'
    },
    status: 'active',
    location: {
      building: 'อาคาร A',
      floor: '3',
      room: '301',
      description: 'โต๊ะทำงาน 1'
    },
    purchaseDate: new Date('2024-01-08'),
    purchasePrice: 42900,
    vendor: 'Herman Miller Thailand',
    warrantyExpiry: new Date('2036-01-08'),
    responsiblePerson: null,
    images: [],
    qrCode: null,
    tags: ['furniture', 'chair', 'ergonomic'],
    notes: 'เก้าอี้เพื่อสุขภาพสำหรับการทำงานระยะยาว',
    searchKeywords: ['herman', 'miller', 'aeron', 'chair', 'eq-2024-010'],
    isActive: true,
    viewCount: 0,
    lastViewed: null,
    version: 1
  }
];

// Function to seed equipment data
async function seedEquipmentData() {
  console.log('🌱 Starting equipment data seeding...\n');
  
  try {
    const equipmentCollection = collection(db, 'equipmentManagement');
    let successCount = 0;
    let errorCount = 0;

    for (const equipment of sampleEquipment) {
      try {
        // Add timestamps
        const equipmentWithTimestamps = {
          ...equipment,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: 'system',
          updatedBy: 'system'
        };

        const docRef = await addDoc(equipmentCollection, equipmentWithTimestamps);
        console.log(`✅ Added: ${equipment.equipmentNumber} - ${equipment.name} (ID: ${docRef.id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error adding ${equipment.equipmentNumber}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${sampleEquipment.length}`);
    console.log('\n✨ Equipment data seeding completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding
seedEquipmentData();
