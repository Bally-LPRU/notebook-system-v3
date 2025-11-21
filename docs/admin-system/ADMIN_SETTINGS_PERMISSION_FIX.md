# แก้ไขปัญหา "Missing or insufficient permissions" ในหน้า Admin Settings

## 🔍 สาเหตุของปัญหา

ข้อความ "Missing or insufficient permissions" เกิดจากการที่:
1. User profile ของคุณยังไม่ได้ตั้งค่าเป็น `role: 'admin'` ใน Firestore
2. Firestore Security Rules ตรวจสอบว่า user ต้องมี `role == 'admin'` ถึงจะเข้าถึง `settings` collection ได้

## ✅ วิธีแก้ไข (เลือกวิธีใดวิธีหนึ่ง)

### วิธีที่ 1: ใช้ Script อัตโนมัติ (แนะนำ)

1. **ตรวจสอบสถานะ user ปัจจุบัน:**
```bash
node scripts/check-admin-status.js
```

2. **ตั้งค่า user เป็น admin:**
```bash
node scripts/check-admin-status.js --set-admin <USER_ID>
```

ตัวอย่าง:
```bash
node scripts/check-admin-status.js --set-admin GXaNYt9mKkOCbS3Mm1auxbr3mBJ3
```

3. **รีเฟรชหน้าเว็บและลองเข้าสู่ระบบใหม่**

---

### วิธีที่ 2: แก้ไขผ่าน Firebase Console (ถ้า script ไม่ทำงาน)

1. **เข้า Firebase Console:**
   - ไปที่ https://console.firebase.google.com
   - เลือกโปรเจค Equipment Lending System
   - ไปที่ Firestore Database

2. **แก้ไข User Document:**
   - เข้าไปใน Collection `users`
   - คลิกที่ Document ของ user ที่ต้องการตั้งเป็น admin
   - แก้ไขฟิลด์:
     - `role`: เปลี่ยนจาก `"user"` เป็น `"admin"`
     - `status`: เปลี่ยนเป็น `"approved"` (ถ้ายังไม่ใช่)
   - คลิก "Update" เพื่อบันทึก

3. **สร้าง Settings Document (ถ้ายังไม่มี):**
   - เข้าไปใน Collection `settings`
   - ถ้ายังไม่มี collection ให้สร้างใหม่
   - สร้าง Document ชื่อ `systemSettings` พร้อมฟิลด์:
     ```json
     {
       "maxLoanDuration": 7,
       "maxAdvanceBookingDays": 30,
       "defaultCategoryLimit": 3,
       "discordEnabled": false,
       "discordWebhookUrl": "",
       "lastUpdated": <timestamp>,
       "lastUpdatedBy": "system"
     }
     ```

4. **รีเฟรชหน้าเว็บและลองเข้าสู่ระบบใหม่**

---

### วิธีที่ 3: ใช้ Firebase CLI (สำหรับ Advanced Users)

```bash
# เข้าสู่ Firebase Console
firebase firestore:update users/<USER_ID> '{"role":"admin","status":"approved"}'
```

---

## 🔐 Firestore Security Rules ที่เกี่ยวข้อง

```javascript
// Settings collection - admin write, authenticated read
match /settings/{document} {
  allow read: if isAuthenticated();
  allow write: if isAdmin();
}

// Helper function
function isAdmin() {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

Rules เหล่านี้ตรวจสอบว่า:
1. User ต้อง login (authenticated)
2. User document ต้องมีอยู่ใน Firestore
3. User document ต้องมี `role == 'admin'`

---

## 🧪 วิธีทดสอบว่าแก้ไขสำเร็จ

1. **ตรวจสอบใน Console:**
```bash
node scripts/check-admin-status.js
```

ควรเห็น:
```
✅ พบ admin ในระบบแล้ว:
   - your-email@example.com (Your Name)
```

2. **ทดสอบบนเว็บไซต์:**
   - ออกจากระบบ (Sign Out)
   - เข้าสู่ระบบใหม่
   - ไปที่หน้า Admin Settings (`/admin/settings`)
   - ควรเห็นหน้าการตั้งค่าแทนข้อความ error

---

## 🐛 ถ้ายังมีปัญหา

### ปัญหา: Script ไม่ทำงาน

**สาเหตุ:** ไม่มีไฟล์ `serviceAccountKey.json`

**วิธีแก้:**
1. ไปที่ Firebase Console > Project Settings > Service Accounts
2. คลิก "Generate new private key"
3. บันทึกไฟล์เป็น `serviceAccountKey.json`
4. วางไฟล์ใน folder `equipment-lending-system/`
5. ลองรัน script อีกครั้ง

### ปัญหา: แก้แล้วแต่ยังเห็น error

**วิธีแก้:**
1. ล้าง cache ของ browser (Ctrl+Shift+Delete)
2. ออกจากระบบ (Sign Out)
3. ปิดและเปิด browser ใหม่
4. เข้าสู่ระบบอีกครั้ง

### ปัญหา: มี admin แล้วแต่ยังเข้าไม่ได้

**ตรวจสอบ:**
1. ดูใน Console ของ browser (F12) มี error อะไรหรือไม่
2. ตรวจสอบว่า AuthContext โหลด userProfile ถูกต้องหรือไม่:
```javascript
// ใน Console ของ browser
console.log('User Profile:', window.localStorage.getItem('userProfile'));
```

---

## 📝 หมายเหตุ

- ทำการตั้งค่า admin **เพียงครั้งเดียว** สำหรับ admin คนแรก
- Admin คนต่อไปสามารถตั้งค่าผ่านหน้า Admin Dashboard ได้
- การเปลี่ยนแปลง role จะมีผลทันทีหลังจาก login ใหม่
- ระบบจะบันทึกการเปลี่ยนแปลงทั้งหมดใน audit log

---

## 🔗 เอกสารที่เกี่ยวข้อง

- [Admin Settings Guide](docs/admin-settings-guide.md)
- [Admin Settings Infrastructure](docs/admin-settings-infrastructure.md)
- [Firestore Security Rules](firestore.rules)
