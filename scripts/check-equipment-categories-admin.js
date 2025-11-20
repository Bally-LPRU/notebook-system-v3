/**
 * Check Equipment Categories Script (Admin SDK)
 * 
 * ตรวจสอบว่ามีข้อมูล equipmentCategories ใน Firestore หรือไม่
 */

const admin = require('firebase-admin');
const serviceAccount = require('../equipment-lending-system-41b49-firebase-adminsdk-iqxqo-e0e0e0e0e0.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'equipment-lending-system-41b49'
});

const db = admin.firestore();

async function checkEquipmentCategories() {
  try {
    console.log('🔍 กำลังตรวจสอบข้อมูล equipmentCategories...\n');

    // Get equipmentCategories collection
    const snapshot = await db.collection('equipmentCategories').get();

    if (snapshot.empty) {
      console.log('❌ ไม่พบข้อมูล equipmentCategories ใน Firestore');
      console.log('\n💡 แนะนำ: ต้องสร้าง categories ก่อนใช้งาน');
      console.log('\n📝 วิธีสร้าง categories:');
      console.log('   1. เข้าไปที่ Firebase Console');
      console.log('   2. เลือก Firestore Database');
      console.log('   3. สร้าง collection ชื่อ "equipmentCategories"');
      console.log('   4. เพิ่ม document ด้วย ID ที่ต้องการ (เช่น "laptop", "projector")');
      console.log('   5. เพิ่ม fields: name, description, equipmentCount (เริ่มต้น 0)');
      return;
    }

    console.log(`✅ พบข้อมูล equipmentCategories จำนวน ${snapshot.size} รายการ\n`);
    console.log('📋 รายการ categories:\n');

    const categories = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({
        id: doc.id,
        ...data
      });
      console.log(`  📦 ${data.name || 'ไม่มีชื่อ'} (ID: ${doc.id})`);
      if (data.description) {
        console.log(`     คำอธิบาย: ${data.description}`);
      }
      if (data.equipmentCount !== undefined) {
        console.log(`     จำนวนอุปกรณ์: ${data.equipmentCount}`);
      }
      if (data.createdAt) {
        console.log(`     สร้างเมื่อ: ${data.createdAt.toDate().toLocaleString('th-TH')}`);
      }
      console.log('');
    });

    console.log(`\n📊 สถิติ:`);
    console.log(`  - จำนวน categories ทั้งหมด: ${categories.length} รายการ`);
    
    const totalEquipment = categories.reduce((sum, cat) => sum + (cat.equipmentCount || 0), 0);
    console.log(`  - จำนวนอุปกรณ์ทั้งหมด: ${totalEquipment} รายการ`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    console.error(error);
  } finally {
    // Cleanup
    await admin.app().delete();
  }
}

// Run the check
checkEquipmentCategories()
  .then(() => {
    console.log('\n✅ ตรวจสอบเสร็จสิ้น');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    process.exit(1);
  });
