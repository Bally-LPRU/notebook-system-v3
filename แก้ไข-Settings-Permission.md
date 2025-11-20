# แก้ไขปัญหา "Missing or insufficient permissions" ในหน้า Admin Settings

## สาเหตุของปัญหา
ระบบไม่สามารถแสดงข้อมูลการตั้งค่าได้เพราะ:
1. ยังไม่มี `settings` document ใน Firestore
2. ยังไม่มี `systemNotifications` collection
3. ยังไม่มี `savedSearches` collection

## วิธีแก้ไข (ทำผ่าน Firebase Console)

### ขั้นตอนที่ 1: เข้า Firebase Console
1. ไปที่ https://console.firebase.google.com/
2. เลือกโปรเจค `equipment-lending-system-41b49`
3. คลิกที่ **Firestore Database** ในเมนูด้านซ้าย

### ขั้นตอนที่ 2: ตรวจสอบ settings collection
1. ดูว่ามี collection ชื่อ `settings` หรือไม่
2. ถ้ามี ให้ตรวจสอบว่ามี document ชื่อ `systemSettings` หรือไม่
3. ถ้าไม่มี ให้ทำตามขั้นตอนด้านล่าง

### ขั้นตอนที่ 3: สร้าง settings document
1. คลิก **Start collection** (ถ้ายังไม่มี collection) หรือคลิกที่ collection `settings`
2. Collection ID: `settings`
3. คลิก **Next**
4. Document ID: `systemSettings` (พิมพ์เอง ไม่ใช่ auto-generate)
5. เพิ่ม fields ดังนี้:

| Field Name | Type | Value |
|------------|------|-------|
| maxLoanDuration | number | 14 |
| maxAdvanceBookingDays | number | 30 |
| defaultCategoryLimit | number | 3 |
| discordWebhookUrl | string | (ปล่อยว่าง) |
| discordEnabled | boolean | false |
| lastUpdated | timestamp | (คลิก "Use current time") |
| lastUpdatedBy | string | system |
| version | number | 1 |

6. คลิก **Save**

### ขั้นตอนที่ 4: สร้าง systemNotifications collection
1. คลิก **Start collection**
2. Collection ID: `systemNotifications`
3. คลิก **Next**
4. Document ID: (ใช้ Auto-ID)
5. เพิ่ม fields ดังนี้:

| Field Name | Type | Value |
|------------|------|-------|
| type | string | info |
| title | string | ระบบพร้อมใช้งาน |
| message | string | ระบบการตั้งค่าพร้อมใช้งานแล้ว |
| priority | string | normal |
| createdAt | timestamp | (คลิก "Use current time") |
| createdBy | string | system |
| sentTo | array | (เพิ่ม string: "all") |
| readBy | array | (ปล่อยว่าง) |
| responses | array | (ปล่อยว่าง) |

6. คลิก **Save**

### ขั้นตอนที่ 5: สร้าง savedSearches collection
1. คลิก **Start collection**
2. Collection ID: `savedSearches`
3. คลิก **Next**
4. Document ID: (ใช้ Auto-ID)
5. เพิ่ม field ตัวอย่าง:

| Field Name | Type | Value |
|------------|------|-------|
| userId | string | system |
| name | string | ตัวอย่าง |
| type | string | equipment |
| isPublic | boolean | false |
| createdAt | timestamp | (คลิก "Use current time") |

6. คลิก **Save**
7. **ลบ document นี้ทิ้ง** (เพราะเราแค่ต้องการสร้าง collection เท่านั้น)

### ขั้นตอนที่ 6: ตรวจสอบ Firestore Rules
Firestore rules ได้ถูก deploy แล้ว แต่ถ้าต้องการตรวจสอบ:

```bash
firebase deploy --only firestore:rules
```

### ขั้นตอนที่ 7: ทดสอบระบบ
1. รีเฟรชหน้าเว็บ
2. Login ด้วย admin account
3. ไปที่หน้า **Admin Settings**
4. ตรวจสอบว่าสามารถดูและแก้ไขการตั้งค่าได้

## ตรวจสอบว่าเป็น Admin หรือไม่

### วิธีที่ 1: ตรวจสอบผ่าน Firebase Console
1. ไปที่ Firestore Database
2. เปิด collection `users`
3. หา document ของคุณ (ใช้ email หรือ UID)
4. ตรวจสอบว่า:
   - `role` = `"admin"`
   - `status` = `"approved"`

### วิธีที่ 2: แก้ไขให้เป็น Admin
ถ้ายังไม่เป็น admin:
1. เปิด document ของคุณใน `users` collection
2. แก้ไข field `role` เป็น `"admin"`
3. แก้ไข field `status` เป็น `"approved"`
4. คลิก **Update**
5. Logout และ Login ใหม่

## สรุป Collections ที่ต้องมี

✅ Collections ที่มีอยู่แล้ว:
- users
- equipment
- equipmentManagement
- equipmentCategories
- loanRequests
- reservations
- notifications
- notificationSettings
- activityLogs
- scheduledNotifications
- publicStats
- closedDates
- categoryLimits
- settingsAuditLog

✅ Collections ที่ต้องสร้างเพิ่ม:
- settings (กับ document `systemSettings`)
- systemNotifications
- savedSearches

## หมายเหตุ
- หลังจากสร้าง collections เสร็จแล้ว ระบบจะสามารถทำงานได้ปกติ
- ไม่ต้องกังวลถ้า collections บางตัวว่างเปล่า (เช่น savedSearches)
- ระบบจะสร้างข้อมูลเพิ่มเติมเองเมื่อมีการใช้งาน


---

## การแก้ไขเพิ่มเติม: Audit Log Permission Error (20 พ.ย. 2025)

### ปัญหาที่พบ
เมื่อทดสอบเปลี่ยนค่า "จำกัดการยืมตามประเภท" แล้วกดบันทึก เกิด error:
```
settingsService.js:634 Error logging setting change: FirebaseError: Missing or insufficient permissions.
settingsService.js:1088 Error logging setting change: FirebaseError: Missing or insufficient permissions.
```

### สาเหตุ
Firestore Security Rules สำหรับ `settingsAuditLog` ตั้งค่าเป็น:
```javascript
match /settingsAuditLog/{logId} {
  allow read: if isAdmin();
  allow write: if false; // ❌ ไม่อนุญาตให้เขียนเลย
}
```

กฎนี้ไม่อนุญาตให้ client-side เขียนข้อมูลเข้า audit log ได้เลย แม้จะเป็น admin ก็ตาม

### วิธีแก้ไข

#### 1. แก้ไข firestore.rules
เปลี่ยนจาก:
```javascript
match /settingsAuditLog/{logId} {
  allow read: if isAdmin();
  allow write: if false;
}
```

เป็น:
```javascript
match /settingsAuditLog/{logId} {
  allow read: if isAdmin();
  allow create: if isAdmin(); // ✅ อนุญาตให้ admin สร้าง audit logs
  allow update, delete: if false; // ✅ ป้องกันการแก้ไข/ลบ audit logs
}
```

#### 2. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

ผลลัพธ์:
```
✓ firestore: released rules firestore.rules to cloud.firestore
✓ Deploy complete!
```

### การตรวจสอบส่วนอื่น

ตรวจสอบทุก collection ที่ settingsService.js ใช้งาน:

| Collection | Write Permission | สถานะ |
|-----------|------------------|-------|
| `settings` | `allow write: if isAdmin();` | ✅ ถูกต้อง |
| `closedDates` | `allow write: if isAdmin();` | ✅ ถูกต้อง |
| `categoryLimits` | `allow write: if isAdmin();` | ✅ ถูกต้อง |
| `settingsAuditLog` | `allow create: if isAdmin();` | ✅ แก้ไขแล้ว |
| `systemNotifications` | `allow write: if isAdmin();` | ✅ ถูกต้อง |
| `settingsBackups` | `allow read, write: if isAdmin();` | ✅ ถูกต้อง |

### ผลลัพธ์
- ✅ สามารถบันทึกการตั้งค่าได้แล้ว
- ✅ ระบบ audit log ทำงานได้ปกติ
- ✅ ยังคงรักษาความปลอดภัยโดยป้องกันการแก้ไข/ลบ audit logs
- ✅ ตรวจสอบ collections อื่นๆ แล้วไม่พบปัญหา

### วิธีทดสอบ
1. รีเฟรชหน้าเว็บ (Ctrl+F5)
2. ไปที่หน้า Admin Settings
3. เปลี่ยนค่า "จำกัดการยืมตามประเภท"
4. กดบันทึก
5. ตรวจสอบว่าไม่มี error และข้อมูลถูกบันทึกสำเร็จ

### หมายเหตุสำคัญ
การใช้ `allow create` แทน `allow write` ช่วยให้:
- Admin สามารถสร้าง audit log entries ใหม่ได้
- ป้องกันการแก้ไขหรือลบ audit logs ที่มีอยู่แล้ว
- รักษาความสมบูรณ์ของข้อมูล audit trail
