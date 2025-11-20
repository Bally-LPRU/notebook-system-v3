/**
 * Check Admin Status Script
 * ตรวจสอบสถานะ admin ของ user และแก้ไขปัญหา permission
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../equipment-lending-system/serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.log('\n📝 คำแนะนำ:');
  console.log('1. ตรวจสอบว่าไฟล์ serviceAccountKey.json อยู่ใน folder equipment-lending-system/');
  console.log('2. ถ้ายังไม่มี ให้ดาวน์โหลดจาก Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const db = admin.firestore();

/**
 * ตรวจสอบและแสดงข้อมูล user ทั้งหมด
 */
async function checkAllUsers() {
  try {
    console.log('\n🔍 กำลังตรวจสอบ users ทั้งหมด...\n');
    
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ ไม่พบ user ในระบบ');
      return [];
    }
    
    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        ...userData
      });
      
      console.log('👤 User:', {
        uid: doc.id,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        status: userData.status
      });
    });
    
    return users;
  } catch (error) {
    console.error('❌ Error checking users:', error);
    throw error;
  }
}

/**
 * ตั้งค่า user เป็น admin
 */
async function setUserAsAdmin(userId) {
  try {
    console.log(`\n🔧 กำลังตั้งค่า user ${userId} เป็น admin...`);
    
    await db.collection('users').doc(userId).update({
      role: 'admin',
      status: 'approved',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ ตั้งค่า admin สำเร็จ!');
    
    // ตรวจสอบอีกครั้ง
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    console.log('\n✅ ข้อมูล user หลังอัพเดท:');
    console.log({
      uid: userDoc.id,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      status: userData.status
    });
    
    return userData;
  } catch (error) {
    console.error('❌ Error setting admin:', error);
    throw error;
  }
}

/**
 * ตรวจสอบ settings collection
 */
async function checkSettingsCollection() {
  try {
    console.log('\n🔍 กำลังตรวจสอบ settings collection...\n');
    
    const settingsDoc = await db.collection('settings').doc('systemSettings').get();
    
    if (!settingsDoc.exists) {
      console.log('⚠️ ไม่พบ settings document');
      console.log('💡 กำลังสร้าง settings document...');
      
      await db.collection('settings').doc('systemSettings').set({
        maxLoanDuration: 7,
        maxAdvanceBookingDays: 30,
        defaultCategoryLimit: 3,
        discordEnabled: false,
        discordWebhookUrl: '',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: 'system'
      });
      
      console.log('✅ สร้าง settings document สำเร็จ');
    } else {
      console.log('✅ พบ settings document:');
      console.log(settingsDoc.data());
    }
  } catch (error) {
    console.error('❌ Error checking settings:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 เริ่มตรวจสอบสถานะ admin...\n');
    console.log('='.repeat(50));
    
    // 1. ตรวจสอบ users ทั้งหมด
    const users = await checkAllUsers();
    
    if (users.length === 0) {
      console.log('\n⚠️ ไม่พบ user ในระบบ');
      console.log('💡 กรุณาเข้าสู่ระบบผ่านเว็บไซต์ก่อน');
      process.exit(0);
    }
    
    // 2. หา admin
    const admins = users.filter(u => u.role === 'admin');
    
    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 สรุป: พบ ${users.length} users, ${admins.length} admins\n`);
    
    if (admins.length === 0) {
      console.log('⚠️ ไม่พบ admin ในระบบ');
      console.log('\n💡 ต้องการตั้งค่า user คนแรกเป็น admin หรือไม่?');
      console.log('   ให้รัน: node scripts/check-admin-status.js --set-admin <USER_ID>');
      console.log(`\n   ตัวอย่าง: node scripts/check-admin-status.js --set-admin ${users[0].id}`);
    } else {
      console.log('✅ พบ admin ในระบบแล้ว:');
      admins.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.displayName})`);
      });
    }
    
    // 3. ตรวจสอบ settings collection
    await checkSettingsCollection();
    
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ การตรวจสอบเสร็จสิ้น\n');
    
  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    await admin.app().delete();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args[0] === '--set-admin' && args[1]) {
  const userId = args[1];
  
  (async () => {
    try {
      await setUserAsAdmin(userId);
      await checkSettingsCollection();
      console.log('\n✅ เสร็จสิ้น! กรุณารีเฟรชหน้าเว็บและลองเข้าสู่ระบบใหม่');
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      await admin.app().delete();
    }
  })();
} else {
  main();
}
