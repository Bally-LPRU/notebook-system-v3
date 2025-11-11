# แก้ไขปัญหา Incognito Mode และเมนูซ้ำ

## ปัญหาที่พบ

1. **Token Refresh ซ้ำๆ** - มี listener หลายตัวทำงานพร้อมกัน
2. **เมนูแสดงซ้ำ** - Layout render ซ้อนกัน
3. **หน้าจัดการอุปกรณ์ไม่แสดงผล** - Permission errors

## สาเหตุ

### 1. Token Refresh Loop
- `onIdTokenChanged` listener ทำงานบ่อยเกินไป
- การ refresh token ทำให้เกิด token change event ซ้ำๆ
- ไม่มีการ debounce หรือ throttle

### 2. เมนูซ้ำ
- Layout component อาจถูก render หลายครั้ง
- Sidebar และ Navbar อาจมีการ duplicate

### 3. Permission Errors
- Token หมดอายุก่อนที่จะ refresh ทัน
- Firestore rules ไม่อนุญาตให้เข้าถึงข้อมูล

## วิธีแก้ไข

### 1. แก้ไข Token Refresh Loop

ปรับปรุง `AuthContext.js`:
- เพิ่ม debounce สำหรับ token refresh
- จำกัดจำนวนครั้งที่ refresh
- ใช้ ref เพื่อป้องกัน multiple refresh

### 2. แก้ไขเมนูซ้ำ

ตรวจสอบ:
- `Layout.js` - ไม่ควรมี duplicate navigation
- `ResponsiveLayout.js` - ตรวจสอบ conditional rendering
- `App.js` - ตรวจสอบว่าไม่มี Layout ซ้อนกัน

### 3. แก้ไข Permission Errors

- เพิ่ม error handling ที่ดีขึ้น
- Auto-refresh token เมื่อเกิด permission error
- แสดง UI ที่ชัดเจนเมื่อเกิดปัญหา

## การทดสอบ

1. ทดสอบใน Incognito Mode
2. ตรวจสอบ Console ว่าไม่มี error ซ้ำๆ
3. ตรวจสอบเมนูไม่แสดงซ้ำ
4. ทดสอบหน้าจัดการอุปกรณ์แสดงผลถูกต้อง

## สถานะ

- [ ] แก้ไข Token Refresh Loop
- [ ] แก้ไขเมนูซ้ำ
- [ ] แก้ไข Permission Errors
- [ ] ทดสอบใน Incognito Mode
