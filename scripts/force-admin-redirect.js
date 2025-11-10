/**
 * Force Admin Redirect Script
 * บังคับให้ redirect ไปหน้า Admin Dashboard
 * 
 * วิธีใช้:
 * 1. เปิดเว็บแอปในเบราว์เซอร์
 * 2. ล็อกอินด้วยบัญชี Admin
 * 3. เปิด Console (F12)
 * 4. คัดลอกและวางโค้ดนี้ใน Console
 * 5. กด Enter
 */

console.log('🚀 บังคับ redirect ไปหน้า Admin Dashboard...\n');

const currentUser = firebase.auth().currentUser;
if (!currentUser) {
  console.error('❌ ไม่พบผู้ใช้ที่ล็อกอินอยู่');
  console.log('💡 กรุณาล็อกอินก่อนรันสคริปต์นี้');
} else {
  console.log('✅ ผู้ใช้ปัจจุบัน:', currentUser.email);
  
  // ตรวจสอบ Profile
  firebase.firestore()
    .collection('users')
    .doc(currentUser.uid)
    .get()
    .then(doc => {
      if (!doc.exists) {
        console.error('❌ ไม่พบ User Profile');
        return;
      }

      const profile = doc.data();
      console.log('📋 Profile:');
      console.log('   - Role:', profile.role);
      console.log('   - Status:', profile.status);
      console.log('');

      if (profile.role !== 'admin') {
        console.warn('⚠️ ผู้ใช้ไม่มีสิทธิ์ Admin');
        console.log('💡 กำลังเปลี่ยนเป็น Admin...');
        
        return firebase.firestore()
          .collection('users')
          .doc(currentUser.uid)
          .update({ role: 'admin' })
          .then(() => {
            console.log('✅ เปลี่ยน Role เป็น Admin แล้ว');
            console.log('🔄 กำลัง redirect...');
            setTimeout(() => {
              window.location.href = '/admin';
            }, 1000);
          });
      }

      if (profile.status !== 'approved') {
        console.warn('⚠️ สถานะไม่ใช่ Approved');
        console.log('💡 กำลังเปลี่ยนสถานะ...');
        
        return firebase.firestore()
          .collection('users')
          .doc(currentUser.uid)
          .update({ status: 'approved' })
          .then(() => {
            console.log('✅ เปลี่ยนสถานะเป็น Approved แล้ว');
            console.log('🔄 กำลัง redirect...');
            setTimeout(() => {
              window.location.href = '/admin';
            }, 1000);
          });
      }

      // ถ้าทุกอย่างถูกต้อง ให้ redirect ทันที
      console.log('✅ ทุกอย่างถูกต้อง');
      console.log('🔄 กำลัง redirect ไปหน้า Admin Dashboard...');
      setTimeout(() => {
        window.location.href = '/admin';
      }, 500);
    })
    .catch(error => {
      console.error('❌ เกิดข้อผิดพลาด:', error);
    });
}
