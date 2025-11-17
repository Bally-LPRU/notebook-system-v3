/**
 * Validate Equipment Management Schema
 * ตรวจสอบว่าข้อมูล equipmentManagement ถูกต้องตาม schema หรือไม่
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
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Required fields ตาม schema
const REQUIRED_FIELDS = [
  'equipmentNumber',
  'name',
  'category',
  'status',
  'location',
  'responsiblePerson',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
  'isActive'
];

// Valid status values
const VALID_STATUSES = ['active', 'maintenance', 'retired', 'lost'];

// Validation functions
function validateCategory(category) {
  if (!category || typeof category !== 'object') {
    return { valid: false, error: 'category ต้องเป็น object' };
  }
  if (!category.id || !category.name) {
    return { valid: false, error: 'category ต้องมี id และ name' };
  }
  return { valid: true };
}

function validateLocation(location) {
  if (!location || typeof location !== 'object') {
    return { valid: false, error: 'location ต้องเป็น object' };
  }
  return { valid: true };
}

function validateResponsiblePerson(person) {
  if (!person || typeof person !== 'object') {
    return { valid: false, error: 'responsiblePerson ต้องเป็น object' };
  }
  if (!person.uid || !person.name) {
    return { valid: false, error: 'responsiblePerson ต้องมี uid และ name' };
  }
  return { valid: true };
}

function validateStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
    return { 
      valid: false, 
      error: `status ต้องเป็น ${VALID_STATUSES.join(', ')} (ได้รับ: ${status})` 
    };
  }
  return { valid: true };
}

async function validateEquipmentSchema() {
  console.log('🔍 เริ่มตรวจสอบข้อมูล equipmentManagement...\n');

  try {
    const snapshot = await db.collection('equipmentManagement').get();
    
    if (snapshot.empty) {
      console.log('⚠️  ไม่พบข้อมูลใน collection equipmentManagement');
      return;
    }

    console.log(`📊 พบข้อมูล ${snapshot.size} รายการ\n`);

    let validCount = 0;
    let invalidCount = 0;
    const issues = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const docIssues = [];
      
      console.log(`\n📄 ตรวจสอบ: ${data.name || doc.id} (${doc.id})`);

      // ตรวจสอบ required fields
      for (const field of REQUIRED_FIELDS) {
        if (data[field] === undefined || data[field] === null) {
          docIssues.push(`   ❌ ขาดฟิลด์: ${field}`);
        }
      }

      // ตรวจสอบ category
      const categoryValidation = validateCategory(data.category);
      if (!categoryValidation.valid) {
        docIssues.push(`   ❌ category: ${categoryValidation.error}`);
      }

      // ตรวจสอบ status
      const statusValidation = validateStatus(data.status);
      if (!statusValidation.valid) {
        docIssues.push(`   ❌ status: ${statusValidation.error}`);
      }

      // ตรวจสอบ location
      const locationValidation = validateLocation(data.location);
      if (!locationValidation.valid) {
        docIssues.push(`   ❌ location: ${locationValidation.error}`);
      }

      // ตรวจสอบ responsiblePerson
      const personValidation = validateResponsiblePerson(data.responsiblePerson);
      if (!personValidation.valid) {
        docIssues.push(`   ❌ responsiblePerson: ${personValidation.error}`);
      }

      // ตรวจสอบ arrays
      if (!Array.isArray(data.images)) {
        docIssues.push(`   ❌ images ต้องเป็น array`);
      }
      if (!Array.isArray(data.tags)) {
        docIssues.push(`   ❌ tags ต้องเป็น array`);
      }
      if (!Array.isArray(data.searchKeywords)) {
        docIssues.push(`   ❌ searchKeywords ต้องเป็น array`);
      }

      // แสดงผล
      if (docIssues.length === 0) {
        console.log('   ✅ ข้อมูลถูกต้อง');
        validCount++;
      } else {
        console.log('   ⚠️  พบปัญหา:');
        docIssues.forEach(issue => console.log(issue));
        invalidCount++;
        issues.push({
          id: doc.id,
          name: data.name,
          issues: docIssues
        });
      }
    }

    // สรุปผล
    console.log('\n' + '='.repeat(60));
    console.log('📊 สรุปผลการตรวจสอบ:');
    console.log(`   ✅ ถูกต้อง: ${validCount} รายการ`);
    console.log(`   ⚠️  มีปัญหา: ${invalidCount} รายการ`);
    console.log('='.repeat(60));

    if (invalidCount > 0) {
      console.log('\n⚠️  รายการที่มีปัญหา:');
      issues.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.name} (${item.id})`);
        item.issues.forEach(issue => console.log(issue));
      });
      console.log('\n💡 แนะนำ: รันสคริปต์ fix-equipment-schema.js เพื่อแก้ไขปัญหา');
    } else {
      console.log('\n✨ ข้อมูลทั้งหมดถูกต้อง!');
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    throw error;
  }
}

// เรียกใช้งาน
validateEquipmentSchema()
  .then(() => {
    console.log('\n✅ การตรวจสอบเสร็จสิ้น');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ การตรวจสอบล้มเหลว:', error);
    process.exit(1);
  });
