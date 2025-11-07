/**
 * Debug Login Button Issues
 * สคริปต์ตรวจสอบและแก้ไขปัญหาปุ่มเข้าสู่ระบบ
 */

console.log('🔍 ตรวจสอบปัญหาปุ่มเข้าสู่ระบบ');
console.log('================================');

console.log('\n📋 ปัญหาที่พบจาก Console:');
console.log('1. Service Worker errors');
console.log('2. Chrome extension conflicts');
console.log('3. Cache/IndexedDB errors');
console.log('4. ปุ่มเข้าสู่ระบบไม่ตอบสนอง');

console.log('\n🔧 วิธีแก้ไขด่วน:');

console.log('\n1️⃣ ล้าง Cache และ Storage:');
console.log('- กด F12 เปิด Developer Tools');
console.log('- ไปที่ Application tab');
console.log('- ทางซ้าย เลือก Storage');
console.log('- คลิก "Clear site data"');
console.log('- รีเฟรชหน้าเว็บ');

console.log('\n2️⃣ ปิด Chrome Extensions:');
console.log('- ไปที่ chrome://extensions/');
console.log('- ปิด extensions ทั้งหมดชั่วคราว');
console.log('- รีเฟรชหน้าเว็บและลองใหม่');

console.log('\n3️⃣ ใช้ Incognito Mode:');
console.log('- กด Ctrl+Shift+N เปิด Incognito');
console.log('- ไปที่เว็บไซต์และลองเข้าสู่ระบบ');

console.log('\n4️⃣ ตรวจสอบ JavaScript Errors:');
console.log('- เปิด Console tab ใน Developer Tools');
console.log('- ดู error messages สีแดง');
console.log('- คลิกปุ่มเข้าสู่ระบบและดู errors ใหม่');

console.log('\n5️⃣ ทดสอบ Authentication Function:');
console.log('- เปิด Console tab');
console.log('- พิมพ์: window.authFixer.runAllFixes()');
console.log('- ดูผลลัพธ์และทำตามคำแนะนำ');

console.log('\n🎯 ขั้นตอนทดสอบ:');
console.log('1. ล้าง cache ตามขั้นตอนที่ 1');
console.log('2. รีเฟรชหน้าเว็บ');
console.log('3. คลิกปุ่ม "เข้าสู่ระบบ"');
console.log('4. ดู Console หา error messages ใหม่');
console.log('5. หากยังไม่ได้ ลอง Incognito mode');

console.log('\n📞 หากยังไม่ได้ผล:');
console.log('- ลองใช้เบราว์เซอร์อื่น (Firefox, Edge)');
console.log('- ตรวจสอบ Network tab ว่ามี requests ไปหา Firebase หรือไม่');
console.log('- ลองเข้าผ่าน localhost แทน vercel.app');