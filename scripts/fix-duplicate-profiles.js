/**
 * Fix Duplicate Profiles Script
 * แก้ไขปัญหา Profile ซ้ำในระบบ
 * 
 * วิธีใช้:
 * 1. เปิดเว็บแอปในเบราว์เซอร์
 * 2. ล็อกอินด้วยบัญชี Admin
 * 3. เปิด Console (F12)
 * 4. คัดลอกและวางโค้ดนี้ใน Console
 * 5. กด Enter
 */

console.log('🔧 เริ่มแก้ไขปัญหา Duplicate Profiles...\n');

const currentUser = firebase.auth().currentUser;
if (!currentUser) {
  console.error('❌ ไม่พบผู้ใช้ที่ล็อกอินอยู่');
  console.log('💡 กรุณาล็อกอินก่อนรันสคริปต์นี้');
} else {
  console.log('✅ ผู้ใช้ปัจจุบัน:');
  console.log('   - UID:', currentUser.uid);
  console.log('   - Email:', currentUser.email);
  console.log('');

  // ค้นหา Profiles ทั้งหมดที่มี email เดียวกัน
  firebase.firestore()
    .collection('users')
    .where('email', '==', currentUser.email)
    .get()
    .then(async querySnapshot => {
      if (querySnapshot.size <= 1) {
        console.log('✅ ไม่พบ Profile ซ้ำ');
        return;
      }

      console.log(`⚠️ พบ Profile ซ้ำ: ${querySnapshot.size} รายการ`);
      console.log('');

      const profiles = [];
      querySnapshot.forEach(doc => {
        profiles.push({
          id: doc.id,
          data: doc.data()
        });
      });

      // แสดงรายการ Profiles
      console.log('📋 รายการ Profiles:');
      profiles.forEach((profile, index) => {
        const isCorrect = profile.id === currentUser.uid;
        console.log(`   ${index + 1}. ${isCorrect ? '✅ (ถูกต้อง)' : '❌ (ซ้ำ)'} ID: ${profile.id}`);
        console.log(`      - Email: ${profile.data.email}`);
        console.log(`      - Role: ${profile.data.role}`);
        console.log(`      - Status: ${profile.data.status}`);
        console.log(`      - Created: ${profile.data.createdAt?.toDate?.()}`);
      });
      console.log('');

      // หา Profile ที่ถูกต้อง (UID ตรงกับ currentUser)
      const correctProfile = profiles.find(p => p.id === currentUser.uid);
      const duplicateProfiles = profiles.filter(p => p.id !== currentUser.uid);

      if (!correctProfile) {
        console.error('❌ ไม่พบ Profile ที่มี UID ตรงกับผู้ใช้ปัจจุบัน');
        console.log('💡 ต้องสร้าง Profile ใหม่');
        return;
      }

      console.log(`🗑️ จะลบ Profile ซ้ำ: ${duplicateProfiles.length} รายการ`);
      console.log('');

      // ลบ Profiles ที่ซ้ำ
      const deletePromises = duplicateProfiles.map(profile => {
        console.log(`   ลบ: ${profile.id}`);
        return firebase.firestore()
          .collection('users')
          .doc(profile.id)
          .delete();
      });

      await Promise.all(deletePromises);

      console.log('');
      console.log('✅ ลบ Profile ซ้ำเรียบร้อยแล้ว!');
      console.log('');
      console.log('📊 Profile ที่เหลือ:');
      console.log('   - ID:', correctProfile.id);
      console.log('   - Email:', correctProfile.data.email);
      console.log('   - Role:', correctProfile.data.role);
      console.log('   - Status:', correctProfile.data.status);
      console.log('');
      console.log('🔄 กรุณารีเฟรชหน้าเพื่อใช้งานต่อ');
    })
    .catch(error => {
      console.error('❌ เกิดข้อผิดพลาด:', error);
    });
}
