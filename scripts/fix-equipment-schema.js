/**
 * Fix Equipment Management Schema
 * แก้ไขข้อมูล equipmentManagement ให้ตรงตาม schema ที่ถูกต้อง
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('❌ ไม่พบไฟล์ serviceAccountKey.json');
  console.log('📝 วิธีแก้ไข:');
  console.log('1. ดาวน์โหลด Service Account Key จาก Firebase Console');
  console.log('2. บันทึกเป็น serviceAccountKey.json ในโฟลเดอร์ root');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Equipment status mapping
const STATUS_MAPPING = {
  'available': 'active',
  'in_use': 'active',
  'unavailable': 'maintenance',
  'broken': 'maintenance',
  'retired': 'retired',
  'lost': 'lost'
};

async function fixEquipmentSchema() {
  console.log('🔧 เริ่มแก้ไขข้อมูล equipmentManagement...\n');

  try {
    // ดึงข้อมูลทั้งหมดจาก equipmentManagement
    const snapshot = await db.collection('equipmentManagement').get();
    
    if (snapshot.empty) {
      console.log('⚠️  ไม่พบข้อมูลใน collection equipmentManagement');
      return;
    }

    console.log(`📊 พบข้อมูล ${snapshot.size} รายการ\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        console.log(`\n🔍 กำลังแก้ไข: ${data.name || doc.id}`);

        // สร้างข้อมูลที่แก้ไขแล้ว
        const fixedData = {
          // ข้อมูลพื้นฐาน (เก็บไว้)
          equipmentNumber: data.equipmentNumber || `EQ-${Date.now()}`,
          name: data.name || 'ไม่ระบุชื่อ',
          
          // แก้ไข category structure
          category: {
            id: data.category?.id || 'computers',
            name: data.category?.name || 'คอมพิวเตอร์',
            icon: data.category?.icon || '💻'
          },

          // เพิ่มข้อมูลที่ขาด
          brand: data.brand || '',
          model: data.model || '',
          description: data.description || '',
          specifications: data.specifications || {},

          // แก้ไข status
          status: STATUS_MAPPING[data.status] || 'active',

          // เพิ่ม location (required)
          location: data.location || {
            building: '',
            floor: '',
            room: '',
            description: ''
          },

          // เพิ่มข้อมูลการซื้อ
          purchaseDate: data.purchaseDate || null,
          purchasePrice: data.purchasePrice || 0,
          vendor: data.vendor || '',
          warrantyExpiry: data.warrantyExpiry || null,

          // เพิ่ม responsiblePerson (required)
          responsiblePerson: data.responsiblePerson || {
            uid: data.createdBy || '',
            name: 'ไม่ระบุ',
            email: '',
            department: ''
          },

          // แก้ไข images structure
          images: Array.isArray(data.images) && data.images.length > 0 
            ? data.images 
            : [],

          // QR Code
          qrCode: data.qrCode || null,

          // Tags และ search
          tags: Array.isArray(data.tags) ? data.tags : [],
          searchKeywords: Array.isArray(data.searchKeywords) 
            ? data.searchKeywords 
            : [
                data.equipmentNumber?.toLowerCase() || '',
                data.name?.toLowerCase() || ''
              ].filter(Boolean),

          // Notes
          notes: data.notes || '',

          // Metadata (เก็บไว้)
          createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          createdBy: data.createdBy || '',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: data.updatedBy || data.createdBy || '',
          version: (data.version || 0) + 1,

          // Status flags
          isActive: data.isActive !== false,
          viewCount: data.viewCount || 0,
          lastViewed: data.lastViewed || null
        };

        // อัปเดตข้อมูล
        await db.collection('equipmentManagement').doc(doc.id).set(fixedData, { merge: true });
        
        console.log(`   ✅ แก้ไขสำเร็จ`);
        console.log(`   - Status: ${data.status} → ${fixedData.status}`);
        console.log(`   - Category: ${JSON.stringify(fixedData.category)}`);
        console.log(`   - Location: ${fixedData.location.building || 'ไม่ระบุ'}`);
        console.log(`   - Responsible: ${fixedData.responsiblePerson.name}`);
        
        successCount++;
      } catch (error) {
        console.error(`   ❌ เกิดข้อผิดพลาด: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 สรุปผลการแก้ไข:');
    console.log(`   ✅ สำเร็จ: ${successCount} รายการ`);
    console.log(`   ❌ ล้มเหลว: ${errorCount} รายการ`);
    console.log('='.repeat(60));

    if (successCount > 0) {
      console.log('\n✨ แก้ไขข้อมูลเสร็จสิ้น! หน้าจัดการอุปกรณ์ควรใช้งานได้แล้ว');
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    throw error;
  }
}

// เรียกใช้งาน
fixEquipmentSchema()
  .then(() => {
    console.log('\n✅ สคริปต์ทำงานเสร็จสิ้น');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ สคริปต์ล้มเหลว:', error);
    process.exit(1);
  });
