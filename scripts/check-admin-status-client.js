/**
 * Check Admin Status Script (Client-side)
 * ตรวจสอบสถานะ admin ของ user โดยใช้ Firebase Client SDK
 * ไม่ต้องใช้ serviceAccountKey.json
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp } = require('firebase/firestore');
const readline = require('readline');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * ตรวจสอบและแสดงข้อมูล user ทั้งหมด
 */
async function checkAllUsers() {
  try {
    console.log('\n🔍 กำลังตรวจสอบ users ทั้งหมด...\n');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('⚠️ ไม่พบ user ในระบบ');
      return [];
    }
    
    const users = [];
    usersSnapshot.forEach(docSnap => {
      const userData = docSnap.data();
      users.push({
        id: docSnap.id,
        ...userData
      });
      
      console.log('👤 User:', {
        uid: docSnap.id,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role || 'user',
        status: userData.status || 'unknown'
      });
    });
    
    return users;
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    throw error;
  }
}

/**
 * ตั้งค่า user เป็น admin
 */
async function setUserAsAdmin(userId) {
  try {
    console.log(`\n🔧 กำลังตั้งค่า user ${userId} เป็น admin...`);
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'admin',
      status: 'approved',
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ ตั้งค่า admin สำเร็จ!');
    
    // ตรวจสอบอีกครั้ง
    const userDoc = await getDoc(userRef);
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
    console.error('❌ Error setting admin:', error.message);
    throw error;
  }
}

/**
 * ตรวจสอบ settings collection
 */
async function checkSettingsCollection() {
  try {
    console.log('\n🔍 กำลังตรวจสอบ settings collection...\n');
    
    const settingsRef = doc(db, 'settings', 'systemSettings');
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      console.log('⚠️ ไม่พบ settings document');
      console.log('💡 กำลังสร้าง settings document...');
      
      await setDoc(settingsRef, {
        maxLoanDuration: 7,
        maxAdvanceBookingDays: 30,
        defaultCategoryLimit: 3,
        discordEnabled: false,
        discordWebhookUrl: '',
        lastUpdated: serverTimestamp(),
        lastUpdatedBy: 'system'
      });
      
      console.log('✅ สร้าง settings document สำเร็จ');
    } else {
      console.log('✅ พบ settings document:');
      console.log(settingsDoc.data());
    }
  } catch (error) {
    console.error('❌ Error checking settings:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n⚠️ ไม่มีสิทธิ์เข้าถึง settings collection');
      console.log('💡 นี่เป็นเรื่องปกติถ้าคุณยังไม่ได้ตั้งค่าเป็น admin');
      console.log('   หลังจากตั้งค่า admin แล้ว ให้ลองรัน script นี้อีกครั้ง');
    } else {
      throw error;
    }
  }
}

/**
 * Login as admin
 */
async function loginAsAdmin() {
  try {
    console.log('\n🔐 กรุณา login ด้วย admin account เพื่อทำการเปลี่ยนแปลง\n');
    
    const email = await prompt('Email: ');
    const password = await prompt('Password: ');
    
    console.log('\n🔄 กำลัง login...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    console.log('✅ Login สำเร็จ!');
    console.log(`👤 Logged in as: ${userCredential.user.email}`);
    
    return userCredential.user;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
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
      rl.close();
      return;
    }
    
    // 2. หา admin
    const admins = users.filter(u => u.role === 'admin');
    
    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 สรุป: พบ ${users.length} users, ${admins.length} admins\n`);
    
    if (admins.length === 0) {
      console.log('⚠️ ไม่พบ admin ในระบบ');
      console.log('\n💡 ต้องการตั้งค่า user คนแรกเป็น admin หรือไม่? (y/n)');
      
      const answer = await prompt('คำตอบ: ');
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('\n📝 เลือก user ที่ต้องการตั้งเป็น admin:');
        users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email} (${user.displayName || 'No name'})`);
        });
        
        const userIndex = await prompt('\nเลือกหมายเลข: ');
        const selectedUser = users[parseInt(userIndex) - 1];
        
        if (!selectedUser) {
          console.log('❌ เลือก user ไม่ถูกต้อง');
          rl.close();
          return;
        }
        
        console.log(`\n✅ เลือก: ${selectedUser.email}`);
        
        // ต้อง login ก่อนถึงจะแก้ไขได้
        try {
          await loginAsAdmin();
          await setUserAsAdmin(selectedUser.id);
          await checkSettingsCollection();
          
          console.log('\n✅ เสร็จสิ้น! กรุณารีเฟรชหน้าเว็บและลองเข้าสู่ระบบใหม่');
        } catch (error) {
          console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
          console.log('\n💡 ถ้าไม่สามารถใช้ script ได้ กรุณาแก้ไขผ่าน Firebase Console:');
          console.log('   1. ไปที่ https://console.firebase.google.com');
          console.log('   2. เลือกโปรเจค > Firestore Database');
          console.log(`   3. แก้ไข users/${selectedUser.id}`);
          console.log('   4. เปลี่ยน role เป็น "admin" และ status เป็น "approved"');
        }
      }
    } else {
      console.log('✅ พบ admin ในระบบแล้ว:');
      admins.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.displayName || 'No name'})`);
      });
      
      // ลอง login และตรวจสอบ settings
      console.log('\n💡 ต้องการตรวจสอบ settings collection หรือไม่? (y/n)');
      const answer = await prompt('คำตอบ: ');
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        try {
          await loginAsAdmin();
          await checkSettingsCollection();
        } catch (error) {
          console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ การตรวจสอบเสร็จสิ้น\n');
    
  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
  } finally {
    rl.close();
  }
}

// Run main function
main();
