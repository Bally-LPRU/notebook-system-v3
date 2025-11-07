/**
 * Debug Authentication Issues Script
 * สคริปต์ตรวจสอบและแก้ไขปัญหา Authentication
 */

console.log('🔍 ตรวจสอบปัญหา Authentication');
console.log('================================');

console.log('\n📋 ปัญหาที่อาจพบ:');
console.log('1. Popup ถูกบล็อก');
console.log('2. Third-party cookies ถูกบล็อก');
console.log('3. Firebase configuration ผิด');
console.log('4. Firestore rules เข้มงวดเกินไป');

console.log('\n🔧 วิธีตรวจสอบปัญหา:');

console.log('\n1️⃣ ตรวจสอบ Popup Blocker:');
console.log('- เปิด Developer Console (F12)');
console.log('- พิมพ์: window.open("https://google.com", "_blank")');
console.log('- หากไม่มีหน้าต่างเปิด = popup ถูกบล็อก');
console.log('- แก้ไข: อนุญาต popup สำหรับเว็บไซต์นี้');

console.log('\n2️⃣ ตรวจสอบ Third-party Cookies:');
console.log('- ไปที่ Browser Settings > Privacy & Security');
console.log('- ตรวจสอบว่า Third-party cookies เปิดอยู่');
console.log('- หรือเพิ่ม google.com เป็น exception');

console.log('\n3️⃣ ตรวจสอบ Firebase Config:');
console.log('- เปิด Developer Console');
console.log('- ไปที่ Network tab');
console.log('- ลองเข้าสู่ระบบ');
console.log('- ดู error messages ที่เกิดขึ้น');

console.log('\n4️⃣ ตรวจสอบ Firestore Rules:');
console.log('- ไปที่ Firebase Console > Firestore > Rules');
console.log('- ตรวจสอบว่า rules อนุญาตให้ user เขียนข้อมูลได้');

console.log('\n🛠️ วิธีแก้ไขด่วน:');

console.log('\n🔧 แก้ปัญหา Popup (Chrome):');
console.log('1. คลิกที่ไอคอน 🚫 ในแถบที่อยู่');
console.log('2. เลือก "อนุญาตป๊อปอัพและการเปลี่ยนเส้นทาง"');
console.log('3. รีเฟรชหน้าเว็บ');

console.log('\n🔧 แก้ปัญหา Popup (Firefox):');
console.log('1. คลิกที่ไอคอนโล่ในแถบที่อยู่');
console.log('2. คลิก "ปิดการป้องกันสำหรับหน้านี้"');
console.log('3. รีเฟรชหน้าเว็บ');

console.log('\n🔧 แก้ปัญหา Third-party Cookies:');
console.log('Chrome:');
console.log('1. Settings > Privacy and security > Cookies');
console.log('2. เลือก "Allow all cookies"');
console.log('3. หรือเพิ่ม [*.]google.com ใน "Sites that can always use cookies"');

console.log('\nFirefox:');
console.log('1. Settings > Privacy & Security');
console.log('2. เลือก "Standard" protection');
console.log('3. หรือเพิ่ม google.com ใน exceptions');

console.log('\n🔧 วิธีทดสอบ Authentication:');
console.log('1. เปิด Developer Console (F12)');
console.log('2. ไปที่ Console tab');
console.log('3. พิมพ์: window.authFixer.runAllFixes()');
console.log('4. ดูผลลัพธ์และทำตามคำแนะนำ');

console.log('\n🎯 เป้าหมาย:');
console.log('✅ สามารถเข้าสู่ระบบได้');
console.log('✅ สามารถบันทึกข้อมูลโปรไฟล์ได้');
console.log('✅ Admin สามารถเข้าหน้า Admin Dashboard ได้');

console.log('\n📞 หากยังแก้ไม่ได้:');
console.log('1. ลองใช้เบราว์เซอร์อื่น');
console.log('2. ลองใช้ Incognito/Private mode');
console.log('3. ล้าง cache และ cookies');
console.log('4. ตรวจสอบ browser extensions ที่อาจบล็อก');