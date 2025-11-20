# วิธีสร้าง Collections ทั้งหมด 10 Collections

## 📋 รายการ Collections ที่จะสร้าง

1. **loanRequests** - คำขอยืมอุปกรณ์
2. **reservations** - การจองอุปกรณ์ล่วงหน้า
3. **notifications** - การแจ้งเตือนส่วนตัว
4. **notificationSettings** - ตั้งค่าการแจ้งเตือน
5. **activityLogs** - บันทึกกิจกรรม
6. **scheduledNotifications** - การแจ้งเตือนที่กำหนดเวลา
7. **publicStats** - สถิติสาธารณะ
8. **closedDates** - วันที่ปิดให้บริการ
9. **categoryLimits** - จำกัดการยืมตามหมวดหมู่
10. **settingsAuditLog** - บันทึกการเปลี่ยนแปลงการตั้งค่า

---

## 🚀 วิธีที่ 1: ใช้ Script (แนะนำ - รวดเร็วที่สุด)

### ขั้นตอนที่ 1: เตรียม Service Account Key

1. เข้า Firebase Console: https://console.firebase.google.com
2. เลือก Project ของคุณ
3. ไปที่ **Project Settings** (ไอคอนเฟือง) → **Service Accounts**
4. คลิก **Generate new private key**
5. บันทึกไฟล์ที่ดาวน์โหลดมาเป็น `config/serviceAccountKey.json`

```bash
# สร้างโฟลเดอร์ config ถ้ายังไม่มี
mkdir config

# วางไฟล์ serviceAccountKey.json ลงในโฟลเดอร์ config
```

### ขั้นตอนที่ 2: รัน Script

```bash
# รัน script เพื่อสร้าง collections ทั้งหมด
node scripts/initialize-core-collections.js
```

### ผลลัพธ์ที่คาดหวัง:

```
============================================================
🚀 INITIALIZING ALL 10 CORE COLLECTIONS
============================================================

📊 Initializing publicStats collection...
✅ publicStats initialized

📅 Initializing closedDates collection...
✅ closedDates initialized with sample data

🏷️ Initializing categoryLimits collection...
✅ categoryLimits initialized for X categories

📝 Creating sample loan request...
✅ Sample loan request created

📅 Creating sample reservation...
✅ Sample reservation created

🔔 Creating sample notification...
✅ Sample notification created

⚙️ Creating default notification settings...
✅ Default notification settings created

📝 Creating sample activity log...
✅ Sample activity log created

⏰ Creating sample scheduled notification...
✅ Sample scheduled notification created

📋 Creating sample settings audit log...
✅ Sample settings audit log created

============================================================
✅ ALL COLLECTIONS INITIALIZATION COMPLETED!
============================================================

📊 Collections Created (10 total):
  1. ✅ publicStats
  2. ✅ closedDates
  3. ✅ categoryLimits
  4. ✅ loanRequests
  5. ✅ reservations
  6. ✅ notifications
  7. ✅ notificationSettings
  8. ✅ activityLogs
  9. ✅ scheduledNotifications
  10. ✅ settingsAuditLog
```

---

## 🖱️ วิธีที่ 2: สร้างผ่าน Firebase Console (ทำเอง)

### ขั้นตอน:

1. เข้า Firebase Console: https://console.firebase.google.com
2. เลือก Project ของคุณ
3. ไปที่ **Firestore Database**
4. คลิก **Start collection**
5. ทำตามขั้นตอนด้านล่างสำหรับแต่ละ collection

---

### 1. loanRequests

**Collection ID:** `loanRequests`

**Document ID:** (Auto-ID)

**Fields:**
```
equipmentId: string = "sample_equipment_id"
equipmentName: string = "MacBook Pro"
userId: string = "sample_user_id"
userName: string = "ผู้ใช้ตัวอย่าง"
userEmail: string = "user@example.com"
borrowDate: timestamp = (วันนี้)
expectedReturnDate: timestamp = (7 วันจากนี้)
purpose: string = "ทดสอบระบบ"
notes: string = "คำขอยืมตัวอย่าง"
status: string = "pending"
createdAt: timestamp = (ตอนนี้)
updatedAt: timestamp = (ตอนนี้)
```

---

### 2. reservations

**Collection ID:** `reservations`

**Document ID:** (Auto-ID)

**Fields:**
```
equipmentId: string = "sample_equipment_id"
equipmentName: string = "MacBook Pro"
userId: string = "sample_user_id"
userName: string = "ผู้ใช้ตัวอย่าง"
userEmail: string = "user@example.com"
startTime: timestamp = (พรุ่งนี้ 09:00)
endTime: timestamp = (พรุ่งนี้ 17:00)
purpose: string = "ทดสอบระบบ"
notes: string = "การจองตัวอย่าง"
status: string = "pending"
notificationSent: boolean = false
createdAt: timestamp = (ตอนนี้)
updatedAt: timestamp = (ตอนนี้)
```

---

### 3. notifications

**Collection ID:** `notifications`

**Document ID:** (Auto-ID)

**Fields:**
```
userId: string = "sample_user_id"
type: string = "system_update"
title: string = "ยินดีต้อนรับ"
message: string = "ระบบพร้อมใช้งานแล้ว"
data: map = {}
isRead: boolean = false
priority: string = "medium"
createdAt: timestamp = (ตอนนี้)
```

---

### 4. notificationSettings

**Collection ID:** `notificationSettings`

**Document ID:** (ใช้ userId ของคุณ)

**Fields:**
```
emailNotifications: map
  ├─ loanApproval: boolean = true
  ├─ loanReminder: boolean = true
  ├─ reservationReminder: boolean = true
  └─ systemUpdates: boolean = true

inAppNotifications: map
  ├─ loanApproval: boolean = true
  ├─ loanReminder: boolean = true
  ├─ reservationReminder: boolean = true
  └─ systemUpdates: boolean = true

reminderTiming: map
  ├─ loanReminder: number = 1
  └─ reservationReminder: number = 24

createdAt: timestamp = (ตอนนี้)
updatedAt: timestamp = (ตอนนี้)
```

---

### 5. activityLogs

**Collection ID:** `activityLogs`

**Document ID:** (Auto-ID)

**Fields:**
```
userId: string = "sample_user_id"
action: string = "system_initialization"
targetType: string = "system"
targetId: string = "core_collections"
details: map
  └─ description: string = "สร้าง collections พื้นฐาน"
timestamp: timestamp = (ตอนนี้)
ipAddress: string = "127.0.0.1"
```

---

### 6. scheduledNotifications

**Collection ID:** `scheduledNotifications`

**Document ID:** (Auto-ID)

**Fields:**
```
userId: string = "sample_user_id"
type: string = "system_reminder"
scheduledTime: timestamp = (1 ชั่วโมงจากนี้)
data: map
  ├─ title: string = "ตรวจสอบระบบ"
  ├─ message: string = "อย่าลืมตรวจสอบคำขอยืม"
  └─ priority: string = "medium"
status: string = "scheduled"
createdAt: timestamp = (ตอนนี้)
```

---

### 7. publicStats

**Collection ID:** `publicStats`

**Document ID:** `current`

**Fields:**
```
totalEquipment: number = 0
availableEquipment: number = 0
borrowedEquipment: number = 0
totalUsers: number = 0
totalLoans: number = 0
totalReservations: number = 0
lastUpdated: timestamp = (ตอนนี้)
```

---

### 8. closedDates

**Collection ID:** `closedDates`

**Document ID:** (Auto-ID)

**Fields:**
```
date: timestamp = 2025-01-01
reason: string = "วันขึ้นปีใหม่"
type: string = "holiday"
createdBy: string = "system"
createdAt: timestamp = (ตอนนี้)
```

---

### 9. categoryLimits

**Collection ID:** `categoryLimits`

**Document ID:** (ใช้ categoryId)

**Fields:**
```
maxBorrowPerUser: number = 3
maxBorrowDuration: number = 7
requiresApproval: boolean = true
createdAt: timestamp = (ตอนนี้)
updatedAt: timestamp = (ตอนนี้)
```

---

### 10. settingsAuditLog

**Collection ID:** `settingsAuditLog`

**Document ID:** (Auto-ID)

**Fields:**
```
settingKey: string = "maxLoanDuration"
oldValue: number = 7
newValue: number = 14
changedBy: string = "sample_user_id"
changedByName: string = "Admin User"
timestamp: timestamp = (ตอนนี้)
reason: string = "เพิ่มระยะเวลายืมสูงสุด"
```

---

## ✅ ตรวจสอบว่าสร้างสำเร็จ

### วิธีที่ 1: ผ่าน Firebase Console

1. เข้า Firebase Console → Firestore Database
2. ดูว่ามี collections ทั้ง 10 อันหรือไม่:
   - ✅ loanRequests
   - ✅ reservations
   - ✅ notifications
   - ✅ notificationSettings
   - ✅ activityLogs
   - ✅ scheduledNotifications
   - ✅ publicStats
   - ✅ closedDates
   - ✅ categoryLimits
   - ✅ settingsAuditLog

### วิธีที่ 2: ผ่าน Script

สร้างไฟล์ `scripts/check-collections.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkCollections() {
  const requiredCollections = [
    'loanRequests',
    'reservations',
    'notifications',
    'notificationSettings',
    'activityLogs',
    'scheduledNotifications',
    'publicStats',
    'closedDates',
    'categoryLimits',
    'settingsAuditLog'
  ];
  
  console.log('🔍 Checking collections...\n');
  
  for (const collectionName of requiredCollections) {
    try {
      const snapshot = await db.collection(collectionName).limit(1).get();
      const exists = !snapshot.empty;
      const count = snapshot.size;
      
      if (exists) {
        console.log(`✅ ${collectionName} - EXISTS (${count} document${count > 1 ? 's' : ''})`);
      } else {
        console.log(`❌ ${collectionName} - EMPTY or NOT FOUND`);
      }
    } catch (error) {
      console.log(`❌ ${collectionName} - ERROR: ${error.message}`);
    }
  }
  
  process.exit(0);
}

checkCollections();
```

รัน:
```bash
node scripts/check-collections.js
```

---

## 🔐 ขั้นตอนต่อไป

### 1. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

### 2. Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

### 3. ทดสอบระบบ

- ทดสอบการยืมอุปกรณ์
- ทดสอบการจองอุปกรณ์
- ทดสอบระบบการแจ้งเตือน
- ตรวจสอบ Activity Logs

---

## ⚠️ หมายเหตุสำคัญ

1. **Service Account Key**: อย่าเผยแพร่ไฟล์นี้ใน Git! เพิ่ม `config/serviceAccountKey.json` ใน `.gitignore`

2. **ข้อมูลตัวอย่าง**: ข้อมูลตัวอย่างที่สร้างสามารถลบได้หลังจากทดสอบเสร็จ

3. **Security Rules**: ตรวจสอบให้แน่ใจว่า `firestore.rules` มี rules สำหรับทุก collection

4. **Indexes**: บาง query อาจต้องการ composite indexes เพิ่มเติม

---

## 🆘 แก้ปัญหา

### ปัญหา: "serviceAccountKey.json not found"
**วิธีแก้**: ดาวน์โหลด Service Account Key จาก Firebase Console และวางใน `config/serviceAccountKey.json`

### ปัญหา: "Permission denied"
**วิธีแก้**: ตรวจสอบว่า Service Account มีสิทธิ์ "Firebase Admin SDK Administrator Service Agent"

### ปัญหา: "No admin user found"
**วิธีแก้**: สร้าง admin user ก่อนด้วย script `scripts/setup-first-admin.js`

### ปัญหา: Collections ถูกสร้างแต่ไม่มีข้อมูล
**วิธีแก้**: ตรวจสอบ console logs ว่ามี error อะไรหรือไม่

---

## 📞 ต้องการความช่วยเหลือ?

- ตรวจสอบ Firebase Console Logs
- ดู Error messages ใน Terminal
- ตรวจสอบ Security Rules
- ตรวจสอบ Network connectivity

---

**สร้างเมื่อ:** 20 พฤศจิกายน 2025  
**อัปเดตล่าสุด:** 20 พฤศจิกายน 2025
