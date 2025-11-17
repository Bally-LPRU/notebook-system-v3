/**
 * Check Equipment Collections
 * ตรวจสอบว่ามีข้อมูลอุปกรณ์อยู่ใน collection ไหนบ้าง
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, getCountFromServer, limit, query } = require('firebase/firestore');
require('dotenv').config();

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCollections() {
  console.log('🔍 กำลังตรวจสอบ collections...\n');

  try {
    // Check equipment collection
    console.log('📦 Collection: equipment');
    const equipmentRef = collection(db, 'equipment');
    const equipmentQuery = query(equipmentRef, limit(5));
    const equipmentSnapshot = await getDocs(equipmentQuery);
    console.log(`   จำนวนเอกสาร (ตัวอย่าง): ${equipmentSnapshot.size}`);
    
    if (!equipmentSnapshot.empty) {
      console.log('   ตัวอย่างข้อมูล:');
      equipmentSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.name || data.equipmentNumber || 'ไม่มีชื่อ'}`);
      });
    } else {
      console.log('   ⚠️  ไม่มีข้อมูล');
    }

    // Get total count
    const equipmentCountSnapshot = await getCountFromServer(equipmentRef);
    console.log(`   จำนวนทั้งหมด: ${equipmentCountSnapshot.data().count}\n`);

    // Check equipmentManagement collection
    console.log('📦 Collection: equipmentManagement');
    const equipmentMgmtRef = collection(db, 'equipmentManagement');
    const equipmentMgmtQuery = query(equipmentMgmtRef, limit(5));
    const equipmentMgmtSnapshot = await getDocs(equipmentMgmtQuery);
    console.log(`   จำนวนเอกสาร (ตัวอย่าง): ${equipmentMgmtSnapshot.size}`);
    
    if (!equipmentMgmtSnapshot.empty) {
      console.log('   ตัวอย่างข้อมูล:');
      equipmentMgmtSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.name || data.equipmentNumber || 'ไม่มีชื่อ'}`);
      });
    } else {
      console.log('   ⚠️  ไม่มีข้อมูล');
    }

    // Get total count
    const equipmentMgmtCountSnapshot = await getCountFromServer(equipmentMgmtRef);
    console.log(`   จำนวนทั้งหมด: ${equipmentMgmtCountSnapshot.data().count}\n`);

    // Summary
    const equipmentCount = equipmentCountSnapshot.data().count;
    const equipmentMgmtCount = equipmentMgmtCountSnapshot.data().count;
    
    console.log('📊 สรุป:');
    console.log(`   equipment: ${equipmentCount} รายการ`);
    console.log(`   equipmentManagement: ${equipmentMgmtCount} รายการ`);
    
    if (equipmentCount > 0 && equipmentMgmtCount === 0) {
      console.log('\n⚠️  พบข้อมูลใน equipment แต่ไม่มีใน equipmentManagement');
      console.log('💡 แนะนำ: ใช้ script migrate-equipment-data.js เพื่อย้ายข้อมูล');
    } else if (equipmentCount === 0 && equipmentMgmtCount === 0) {
      console.log('\n⚠️  ไม่มีข้อมูลอุปกรณ์ในทั้งสอง collections');
      console.log('💡 แนะนำ: เพิ่มข้อมูลอุปกรณ์ผ่านหน้าจัดการอุปกรณ์');
    } else if (equipmentMgmtCount > 0) {
      console.log('\n✅ มีข้อมูลใน equipmentManagement แล้ว');
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    process.exit(0);
  }
}

checkCollections();
