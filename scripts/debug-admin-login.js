/**
 * Debug Admin Login Script
 * ตรวจสอบปัญหาการล็อกอินของ Admin
 * 
 * วิธีใช้:
 * 1. เปิดเว็บแอปในเบราว์เซอร์
 * 2. ล็อกอินด้วยบัญชี Admin
 * 3. เปิด Console (F12)
 * 4. คัดลอกและวางโค้ดนี้ใน Console
 * 5. กด Enter
 */

console.log('🔍 เริ่มตรวจสอบปัญหา Admin Login...\n');

// ตรวจสอบ Firebase Auth
const currentUser = firebase.auth().currentUser;
if (!currentUser) {
  console.error('❌ ไม่พบผู้ใช้ที่ล็อกอินอยู่');
  console.log('💡 กรุณาล็อกอินก่อนรันสคริปต์นี้');
} else {
  console.log('✅ พบผู้ใช้ที่ล็อกอิน:');
  console.log('   - UID:', currentUser.uid);
  console.log('   - Email:', currentUser.email);
  console.log('   - Display Name:', currentUser.displayName);
  console.log('');

  // ตรวจสอบ User Profile
  console.log('🔍 กำลังตรวจสอบ User Profile...');
  
  firebase.firestore()
    .collection('users')
    .doc(currentUser.uid)
    .get()
    .then(doc => {
      if (doc.exists) {
        const profile = doc.data();
        console.log('✅ พบ User Profile:');
        console.log('   - Role:', profile.role);
        console.log('   - Status:', profile.status);
        console.log('   - Email:', profile.email);
        console.log('   - Full Name:', profile.fullName);
        console.log('   - Department:', profile.department);
        console.log('');
        
        // ตรวจสอบว่าเป็น Admin หรือไม่
        if (profile.role === 'admin') {
          console.log('✅ ผู้ใช้มีสิทธิ์ Admin');
          
          if (profile.status === 'approved') {
            console.log('✅ สถานะ: Approved');
            console.log('');
            console.log('📊 สรุป:');
            console.log('   ผู้ใช้ควรเข้าถึงหน้า Admin Dashboard ได้');
            console.log('   URL ที่ควรเข้าถึง: /admin');
            console.log('');
            console.log('🔧 หากยังไม่แสดงหน้า Admin Dashboard:');
            console.log('   1. ตรวจสอบ Console errors');
            console.log('   2. ลองรีเฟรชหน้า (Ctrl+R)');
            console.log('   3. ลองล็อกเอาท์แล้วล็อกอินใหม่');
            console.log('   4. ลองเข้า URL โดยตรง: /admin');
          } else {
            console.warn('⚠️ สถานะไม่ใช่ Approved:', profile.status);
            console.log('💡 ต้องเปลี่ยนสถานะเป็น "approved" ก่อน');
          }
        } else {
          console.warn('⚠️ ผู้ใช้ไม่มีสิทธิ์ Admin');
          console.log('   Role ปัจจุบัน:', profile.role);
          console.log('');
          console.log('🔧 วิธีแก้ไข:');
          console.log('   รันคำสั่งนี้เพื่อเปลี่ยนเป็น Admin:');
          console.log('');
          console.log(`   firebase.firestore().collection('users').doc('${currentUser.uid}').update({ role: 'admin' })`);
        }
      } else {
        console.error('❌ ไม่พบ User Profile ใน Firestore');
        console.log('💡 ต้องสร้าง Profile ก่อน');
      }
      
      // ตรวจสอบ Duplicate Profiles
      console.log('');
      console.log('🔍 ตรวจสอบ Duplicate Profiles...');
      return firebase.firestore()
        .collection('users')
        .where('email', '==', currentUser.email)
        .get();
    })
    .then(querySnapshot => {
      if (querySnapshot.size > 1) {
        console.warn(`⚠️ พบ Profile ซ้ำ: ${querySnapshot.size} รายการ`);
        console.log('');
        console.log('📋 รายการ Profiles:');
        querySnapshot.forEach((doc, index) => {
          const data = doc.data();
          console.log(`   ${index + 1}. ID: ${doc.id}`);
          console.log(`      - Email: ${data.email}`);
          console.log(`      - Role: ${data.role}`);
          console.log(`      - Status: ${data.status}`);
          console.log(`      - Created: ${data.createdAt?.toDate?.()}`);
        });
        console.log('');
        console.log('🔧 วิธีแก้ไข:');
        console.log('   1. เก็บ Profile ที่มี UID ตรงกับ currentUser.uid');
        console.log('   2. ลบ Profiles อื่นๆ ที่ซ้ำ');
        console.log(`   3. Profile ที่ถูกต้อง: ${currentUser.uid}`);
      } else {
        console.log('✅ ไม่พบ Profile ซ้ำ');
      }
      
      // ตรวจสอบ AuthContext state
      console.log('');
      console.log('🔍 ตรวจสอบ React Context State...');
      console.log('   (ดูใน React DevTools)');
      console.log('');
      console.log('✨ การตรวจสอบเสร็จสิ้น!');
    })
    .catch(error => {
      console.error('❌ เกิดข้อผิดพลาด:', error);
    });
}
