/**
 * Fix Profile Setup and Set First Admin Script
 * สคริปต์แก้ปัญหาการตั้งค่าโปรไฟล์และตั้งค่า admin คนแรก
 */

console.log('🔧 แก้ปัญหาการตั้งค่าโปรไฟล์และ Admin');
console.log('=====================================');

console.log('\n📋 ปัญหาที่พบ:');
console.log('1. ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้');
console.log('2. ต้องการตั้งค่า user คนแรกให้เป็น admin');

console.log('\n🔧 การแก้ไข:');
console.log('1. ✅ แก้ไข Firestore Rules แล้ว (ทำให้ validation ยืดหยุ่นขึ้น)');
console.log('2. 🔄 ต้องตั้งค่า admin ผ่าน Firebase Console');

console.log('\n📋 ขั้นตอนที่ 1: Deploy Firestore Rules ใหม่');
console.log('1. เปิด Terminal');
console.log('2. รันคำสั่ง: firebase deploy --only firestore:rules');
console.log('3. รอจนกว่าจะ deploy เสร็จ');

console.log('\n📋 ขั้นตอนที่ 2: ตั้งค่า Admin ผ่าน Firebase Console');
console.log('1. ไปที่ https://console.firebase.google.com');
console.log('2. เลือกโปรเจค Equipment Lending System');
console.log('3. ไปที่ Firestore Database');
console.log('4. เข้าไปใน Collection "users"');
console.log('5. คลิกที่ Document: GXaNYt9mKkOCbS3Mm1auxbr3mBJ3');
console.log('6. แก้ไขฟิลด์:');
console.log('   - role: เปลี่ยนจาก "user" เป็น "admin"');
console.log('   - status: เปลี่ยนจาก "incomplete" เป็น "approved"');
console.log('7. คลิก "Update"');

console.log('\n📋 ขั้นตอนที่ 3: ทดสอบระบบ');
console.log('1. รีเฟรชหน้าเว็บ');
console.log('2. ลองเข้าสู่ระบบใหม่');
console.log('3. ควรจะเข้าสู่หน้า Admin Dashboard');

console.log('\n📋 ขั้นตอนที่ 4: ทดสอบการตั้งค่าโปรไฟล์ (สำหรับ user ใหม่)');
console.log('1. ลองสร้าง user ใหม่');
console.log('2. ทดสอบการกรอกข้อมูลโปรไฟล์');
console.log('3. ตรวจสอบว่าสามารถบันทึกได้');

console.log('\n🎯 ผลลัพธ์ที่คาดหวัง:');
console.log('✅ User คนแรกกลายเป็น Admin');
console.log('✅ สามารถเข้าหน้า Admin Dashboard ได้');
console.log('✅ User ใหม่สามารถตั้งค่าโปรไฟล์ได้');
console.log('✅ ระบบทำงานปกติ');

console.log('\n⚠️ หมายเหตุ:');
console.log('- หาก deploy rules ไม่ได้ ให้ตรวจสอบ Firebase CLI');
console.log('- หาก popup ยังมีปัญหา ให้ใช้ redirect authentication');
console.log('- Admin สามารถอนุมัติ user คนอื่นได้ผ่านหน้า Admin Dashboard');

console.log('\n🆘 หากยังมีปัญหา:');
console.log('1. ตรวจสอบ Console ใน Browser (F12)');
console.log('2. ดู error messages ใน Network tab');
console.log('3. ตรวจสอบ Firebase Authentication settings');
console.log('4. ลองใช้ Incognito mode');