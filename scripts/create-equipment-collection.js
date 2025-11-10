/**
 * สร้าง Collection equipmentManagement และเพิ่มข้อมูลตัวอย่าง
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase config - ใส่ค่าจาก .env
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
const auth = getAuth(app);

async function createEquipmentCollection() {
  try {
    console.log('🔧 กำลังสร้าง collection equipmentManagement...\n');

    // ต้อง login ก่อน
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('❌ กรุณา login ก่อน');
      console.log('เปิดแอพและ login ด้วย admin account แล้วรัน script นี้อีกครั้ง');
      return;
    }

    console.log('✅ Login แล้วด้วย:', currentUser.email);
    console.log('');

    // สร้างข้อมูลอุปกรณ์ตัวอย่าง
    const sampleEquipment = {
      equipmentNumber: 'EQ-001',
      name: 'โน้ตบุ๊ค Dell Latitude 5420',
      category: {
        id: 'computers',
        name: 'คอมพิวเตอร์',
        icon: '💻'
      },
      brand: 'Dell',
      model: 'Latitude 5420',
      description: 'โน้ตบุ๊คสำหรับงานทั่วไป',
      specifications: {
        processor: 'Intel Core i5-1135G7',
        ram: '8GB DDR4',
        storage: '256GB SSD',
        display: '14" FHD'
      },
      status: 'available',
      location: {
        building: 'อาคาร 1',
        floor: '2',
        room: '201'
      },
      purchaseDate: new Date('2024-01-15'),
      purchasePrice: 25000,
      vendor: 'Dell Thailand',
      warrantyExpiry: new Date('2027-01-15'),
      responsiblePerson: {
        uid: currentUser.uid,
        name: currentUser.displayName || 'Admin',
        email: currentUser.email
      },
      images: [],
      qrCode: null,
      tags: ['โน้ตบุ๊ค', 'Dell', 'ทำงาน'],
      notes: 'อุปกรณ์ตัวอย่างสำหรับทดสอบระบบ',
      createdAt: serverTimestamp(),
      createdBy: currentUser.uid,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid,
      version: 1,
      searchKeywords: ['eq-001', 'โน้ตบุ๊ค', 'dell', 'latitude', '5420', 'คอมพิวเตอร์'],
      isActive: true,
      viewCount: 0,
      lastViewed: null
    };

    // เพิ่มข้อมูลลง Firestore
    console.log('📝 กำลังเพิ่มข้อมูลอุปกรณ์ตัวอย่าง...');
    const docRef = await addDoc(collection(db, 'equipmentManagement'), sampleEquipment);
    
    console.log('✅ สร้าง collection และเพิ่มข้อมูลสำเร็จ!');
    console.log('Document ID:', docRef.id);
    console.log('');
    console.log('📋 ข้อมูลที่เพิ่ม:');
    console.log('- หมายเลขอุปกรณ์:', sampleEquipment.equipmentNumber);
    console.log('- ชื่อ:', sampleEquipment.name);
    console.log('- หมวดหมู่:', sampleEquipment.category.name);
    console.log('- สถานะ:', sampleEquipment.status);
    console.log('');
    console.log('🎉 ตอนนี้สามารถเข้าหน้าจัดการอุปกรณ์ได้แล้ว!');
    console.log('ไปที่: /admin/equipment');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('');
      console.log('💡 แนะนำ:');
      console.log('1. ตรวจสอบว่า login ด้วย admin account');
      console.log('2. ตรวจสอบ Firestore Rules ว่าอนุญาตให้ admin สร้างข้อมูลได้');
      console.log('3. ลอง refresh auth token ก่อน');
    }
  }
}

// Run the script
createEquipmentCollection().catch(console.error);
