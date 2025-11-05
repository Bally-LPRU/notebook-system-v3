/**
 * Setup script for Equipment Management System
 * This script initializes the required Firestore collections and default data
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration (use your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyA9D6ReIlhiaaJ1g1Obd-dcjp2R0LO_eyo",
  authDomain: "equipment-lending-system-41b49.firebaseapp.com",
  projectId: "equipment-lending-system-41b49",
  storageBucket: "equipment-lending-system-41b49.firebasestorage.app",
  messagingSenderId: "47770598089",
  appId: "1:47770598089:web:9d898f247f742fe1686b18"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default equipment categories
const DEFAULT_CATEGORIES = [
  {
    name: 'คอมพิวเตอร์และอุปกรณ์',
    nameEn: 'Computers & Equipment',
    description: 'อุปกรณ์คอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
    icon: 'ComputerDesktopIcon',
    color: '#3B82F6',
    parentId: null,
    level: 0,
    path: 'คอมพิวเตอร์และอุปกรณ์',
    requiredFields: ['brand', 'model', 'specifications'],
    customFields: [],
    equipmentCount: 0,
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'อุปกรณ์โสตทัศนูปกรณ์',
    nameEn: 'Audio Visual Equipment',
    description: 'อุปกรณ์เสียงและภาพ',
    icon: 'SpeakerWaveIcon',
    color: '#10B981',
    parentId: null,
    level: 0,
    path: 'อุปกรณ์โสตทัศนูปกรณ์',
    requiredFields: ['brand', 'model'],
    customFields: [],
    equipmentCount: 0,
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'เครื่องใช้สำนักงาน',
    nameEn: 'Office Equipment',
    description: 'อุปกรณ์สำนักงานทั่วไป',
    icon: 'PrinterIcon',
    color: '#F59E0B',
    parentId: null,
    level: 0,
    path: 'เครื่องใช้สำนักงาน',
    requiredFields: ['brand', 'model'],
    customFields: [],
    equipmentCount: 0,
    isActive: true,
    sortOrder: 3
  }
];

async function setupEquipmentManagement() {
  try {
    console.log('🚀 Setting up Equipment Management System...');

    // Create default categories
    console.log('📁 Creating default equipment categories...');
    const createdCategories = [];
    
    for (const categoryData of DEFAULT_CATEGORIES) {
      const category = {
        ...categoryData,
        createdAt: serverTimestamp(),
        createdBy: 'system',
        updatedAt: serverTimestamp(),
        updatedBy: 'system'
      };

      const docRef = await addDoc(collection(db, 'equipmentCategories'), category);
      createdCategories.push({ id: docRef.id, ...category });
      console.log(`✅ Created category: ${categoryData.name} (${docRef.id})`);
    }

    console.log('🎉 Equipment Management System setup completed successfully!');
    console.log(`📊 Created ${createdCategories.length} categories`);
    
    return {
      success: true,
      categories: createdCategories
    };

  } catch (error) {
    console.error('❌ Error setting up Equipment Management System:', error);
    throw error;
  }
}

// Run setup if called directly
if (require.main === module) {
  setupEquipmentManagement()
    .then(() => {
      console.log('✨ Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupEquipmentManagement };