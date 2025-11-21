# Firebase Setup Documentation

เอกสารเกี่ยวกับการตั้งค่า Firebase

## 📁 เอกสารในโฟลเดอร์นี้

### การตั้งค่าเริ่มต้น
- `FIREBASE_SETUP_STEPS.md` - ขั้นตอนการตั้งค่า Firebase
- `วิธีสร้าง-Collections.md` - วิธีสร้าง Collections (ภาษาไทย)
- `สรุป-ข้อมูล-Firebase.md` - สรุปข้อมูล Firebase (ภาษาไทย)

### Collections
- `FIREBASE_COLLECTIONS_SETUP.md` - การตั้งค่า Collections
- `FIREBASE_COLLECTIONS_CREATED.md` - รายการ Collections ที่สร้างแล้ว
- `FIREBASE_DATA_CHECKLIST.md` - Checklist ข้อมูล Firebase

### Indexes
- `INDEXES_DEPLOYMENT_COMPLETE.md` - การ Deploy Indexes เสร็จสมบูรณ์
- `INDEXES_UPDATE_SUMMARY.md` - สรุปการอัปเดต Indexes

## 📋 Collections หลัก

1. **users** - ข้อมูลผู้ใช้
2. **equipment** - ข้อมูลอุปกรณ์
3. **categories** - หมวดหมู่อุปกรณ์
4. **loanRequests** - คำขอยืม
5. **reservations** - การจอง
6. **settings** - การตั้งค่าระบบ
7. **notifications** - การแจ้งเตือน

## 🔧 Scripts ที่เกี่ยวข้อง

### การสร้าง Collections
- `scripts/initialize-core-collections.js` - สร้าง Collections หลัก
- `scripts/check-all-collections.js` - ตรวจสอบ Collections
- `scripts/create-categories-collection.js` - สร้าง Categories
- `scripts/create-equipment-collection.js` - สร้าง Equipment

### การตั้งค่า Settings
- `scripts/initialize-settings.js` - ตั้งค่าเริ่มต้น
- `scripts/initialize-settings-client.js` - ตั้งค่าฝั่ง Client

### การ Deploy
- `scripts/deploy-settings-indexes.js` - Deploy Indexes
- `scripts/deploy-settings-security-rules.js` - Deploy Security Rules
- `scripts/test-settings-indexes.js` - ทดสอบ Indexes
- `scripts/test-settings-security-rules.js` - ทดสอบ Security Rules

## 📄 ไฟล์ Config

- `firestore.rules` - Security Rules
- `firestore.indexes.json` - Firestore Indexes
- `storage.rules` - Storage Rules
- `firebase.json` - Firebase Configuration

## 🔗 เอกสารที่เกี่ยวข้อง

- [Users Collection Schema](../users-collection-schema.md)
- [Deployment Guide](../deployment/)
