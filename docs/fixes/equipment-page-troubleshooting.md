# การแก้ไขปัญหาหน้า Equipment

## วันที่: พฤศจิกายน 2567

## สถานะ: แก้ไขเรียบร้อยแล้ว ✅

## ปัญหาที่พบ
1. ไฟล์ .env.local มี demo configuration ที่ไม่ถูกต้อง
2. Browser/Service Worker cache เก็บ config เก่าไว้
3. ไม่มีข้อมูลอุปกรณ์เพียงพอสำหรับทดสอบ

## การแก้ไขที่ทำแล้ว
1. อัปเดต .env.local ให้ใช้ production config
2. แก้ไข scripts ให้ใช้ config ที่ถูกต้อง
3. ล้าง cache (node_modules/.cache, build)
4. เพิ่มข้อมูลอุปกรณ์ทดสอบ 6 รายการ

## ข้อมูลปัจจุบัน
- Collection: `equipmentManagement`
- จำนวนอุปกรณ์: 6 รายการ (ทั้งหมดมี isActive: true)

## ขั้นตอนการทดสอบ

### 1. ล้าง Browser Cache และ Service Worker
- เปิด Chrome DevTools (F12)
- ไปที่ Application tab
- คลิก "Clear storage" ทางซ้าย
- เลือก "Unregister service workers"
- คลิก "Clear site data"

### 2. รัน Development Server ใหม่
```bash
npm start
```

### 3. เปิดหน้าเว็บในโหมด Incognito (แนะนำ)
- กด Ctrl+Shift+N (Chrome)
- ไปที่ http://localhost:3000
- Login ด้วย admin account
- ไปที่หน้า Equipment

## Debug Checklist

### Firebase Config
- `src/config/firebase.js` ใช้ hardcoded production config
- `.env.local` ใช้ production config

### Firestore Data
- `equipmentManagement` collection มี 6 รายการ
- Firestore Rules อนุญาตให้อ่านได้

### Cache
- ล้าง `node_modules/.cache` แล้ว
- ล้าง `build` folder แล้ว
- ต้องล้าง browser cache ด้วย

## Scripts ที่มีประโยชน์

```bash
# ตรวจสอบข้อมูลอุปกรณ์
node scripts/check-equipment-collections.js

# ทดสอบ Firebase config
node scripts/check-firebase-config.js
```

## ผลลัพธ์ที่คาดหวัง
- รายการอุปกรณ์ 6 รายการ
- ช่องค้นหาและกรองทำงานได้
- แสดงสถานะอุปกรณ์ (available, borrowed, etc.)
- ไม่มี error ใน console
