# 🔥 Firebase Collections Setup Guide

## 📋 Overview

ระบบยืม-คืนอุปกรณ์ต้องการ **10 Collections** หลักใน Firestore Database:

| # | Collection Name | Description | Priority |
|---|----------------|-------------|----------|
| 1 | `loanRequests` | คำขอยืมอุปกรณ์ | 🔴 สูงสุด |
| 2 | `reservations` | การจองอุปกรณ์ล่วงหน้า | 🔴 สูงสุด |
| 3 | `notifications` | การแจ้งเตือนส่วนตัว | 🔴 สูงสุด |
| 4 | `notificationSettings` | ตั้งค่าการแจ้งเตือน | 🟡 ปานกลาง |
| 5 | `activityLogs` | บันทึกกิจกรรม | 🟡 ปานกลาง |
| 6 | `scheduledNotifications` | การแจ้งเตือนที่กำหนดเวลา | 🟢 ต่ำ |
| 7 | `publicStats` | สถิติสาธารณะ | 🟡 ปานกลาง |
| 8 | `closedDates` | วันที่ปิดให้บริการ | 🟢 ต่ำ |
| 9 | `categoryLimits` | จำกัดการยืมตามหมวดหมู่ | 🟢 ต่ำ |
| 10 | `settingsAuditLog` | บันทึกการเปลี่ยนแปลงการตั้งค่า | 🟢 ต่ำ |

---

## 🚀 Quick Start (แนะนำ)

### ขั้นตอนที่ 1: เตรียม Service Account Key

```bash
# 1. ไปที่ Firebase Console
# 2. Project Settings → Service Accounts
# 3. Generate new private key
# 4. บันทึกเป็น config/serviceAccountKey.json

mkdir -p config
# วางไฟล์ serviceAccountKey.json ที่ดาวน์โหลดมาในโฟลเดอร์ config
```

### ขั้นตอนที่ 2: สร้าง Collections ทั้งหมด

```bash
# สร้าง collections ทั้งหมด 10 collections พร้อมข้อมูลตัวอย่าง
node scripts/initialize-core-collections.js
```

### ขั้นตอนที่ 3: ตรวจสอบผลลัพธ์

```bash
# ตรวจสอบว่า collections ถูกสร้างแล้ว
node scripts/check-all-collections.js
```

### ขั้นตอนที่ 4: Deploy Security Rules และ Indexes

```bash
# Deploy Security Rules
firebase deploy --only firestore:rules

# Deploy Indexes
firebase deploy --only firestore:indexes
```

---

## 📊 ผลลัพธ์ที่คาดหวัง

หลังจากรัน `initialize-core-collections.js` คุณจะเห็น:

```
============================================================
🚀 INITIALIZING ALL 10 CORE COLLECTIONS
============================================================

📊 Initializing publicStats collection...
✅ publicStats initialized

📅 Initializing closedDates collection...
✅ closedDates initialized with sample data

🏷️ Initializing categoryLimits collection...
✅ categoryLimits initialized for 5 categories

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

## 🔍 ตรวจสอบ Collections

### วิธีที่ 1: ใช้ Script

```bash
node scripts/check-all-collections.js
```

ผลลัพธ์:
```
================================================================================
🔍 CHECKING ALL COLLECTIONS STATUS
================================================================================

Collection Name           | Count | Description
--------------------------------------------------------------------------------
✅ loanRequests            |   1 documents | คำขอยืมอุปกรณ์
✅ reservations            |   1 documents | การจองอุปกรณ์ล่วงหน้า
✅ notifications           |   1 documents | การแจ้งเตือนส่วนตัว
✅ notificationSettings    |   1 documents | ตั้งค่าการแจ้งเตือน
✅ activityLogs            |   1 documents | บันทึกกิจกรรม
✅ scheduledNotifications  |   1 documents | การแจ้งเตือนที่กำหนดเวลา
✅ publicStats             |   1 documents | สถิติสาธารณะ
✅ closedDates             |   1 documents | วันที่ปิดให้บริการ
✅ categoryLimits          |   5 documents | จำกัดการยืมตามหมวดหมู่
✅ settingsAuditLog        |   1 documents | บันทึกการเปลี่ยนแปลงการตั้งค่า
--------------------------------------------------------------------------------

================================================================================
📊 SUMMARY
================================================================================

✅ Existing Collections: 10/10
❌ Missing Collections:  0/10
📄 Total Documents:      14

🎉 All collections are created successfully!
```

### วิธีที่ 2: ผ่าน Firebase Console

1. เข้า https://console.firebase.google.com
2. เลือก Project ของคุณ
3. ไปที่ **Firestore Database**
4. ตรวจสอบว่ามี collections ทั้ง 10 อัน

---

## 📝 โครงสร้างข้อมูลแต่ละ Collection

### 1. loanRequests (คำขอยืม)

```javascript
{
  equipmentId: "eq123",
  equipmentName: "MacBook Pro",
  userId: "user123",
  userName: "สมชาย ใจดี",
  userEmail: "somchai@g.lpru.ac.th",
  borrowDate: Timestamp,
  expectedReturnDate: Timestamp,
  actualReturnDate: Timestamp | null,
  purpose: "ใช้ทำโปรเจค",
  notes: "ต้องการใช้ 1 สัปดาห์",
  status: "pending", // pending, approved, rejected, borrowed, returned, overdue
  approvedBy: string | null,
  approvedAt: Timestamp | null,
  rejectionReason: string | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. reservations (การจอง)

```javascript
{
  equipmentId: "eq123",
  equipmentName: "MacBook Pro",
  userId: "user123",
  userName: "สมชาย ใจดี",
  userEmail: "somchai@g.lpru.ac.th",
  reservationDate: Timestamp,
  startTime: Timestamp,
  endTime: Timestamp,
  purpose: "ใช้สอน",
  notes: "ต้องการใช้ห้องประชุม",
  status: "pending", // pending, approved, ready, completed, cancelled, expired
  approvedBy: string | null,
  approvedAt: Timestamp | null,
  notificationSent: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 3. notifications (การแจ้งเตือน)

```javascript
{
  userId: "user123",
  type: "loan_approved", // loan_request, loan_approved, loan_rejected, loan_reminder, etc.
  title: "คำขอยืมได้รับการอนุมัติ",
  message: "คำขอยืม MacBook Pro ของคุณได้รับการอนุมัติแล้ว",
  data: {
    loanId: "loan123",
    equipmentId: "eq123"
  },
  isRead: false,
  priority: "high", // low, medium, high, urgent
  actionUrl: "/my-loans/loan123",
  actionText: "ดูรายละเอียด",
  expiresAt: Timestamp | null,
  createdAt: Timestamp,
  readAt: Timestamp | null
}
```

### 4. notificationSettings (ตั้งค่าการแจ้งเตือน)

```javascript
{
  // Document ID = userId
  emailNotifications: {
    loanApproval: true,
    loanReminder: true,
    reservationReminder: true,
    systemUpdates: true
  },
  inAppNotifications: {
    loanApproval: true,
    loanReminder: true,
    reservationReminder: true,
    systemUpdates: true
  },
  reminderTiming: {
    loanReminder: 1, // วัน
    reservationReminder: 24 // ชั่วโมง
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 5. activityLogs (บันทึกกิจกรรม)

```javascript
{
  userId: "user123",
  action: "request_loan", // login, request_loan, approve_loan, etc.
  targetType: "equipment", // equipment, user, loan_request, etc.
  targetId: "eq123",
  details: {
    equipmentName: "MacBook Pro",
    borrowDate: "2025-11-20"
  },
  timestamp: Timestamp,
  ipAddress: "192.168.1.1"
}
```

### 6. scheduledNotifications (การแจ้งเตือนที่กำหนดเวลา)

```javascript
{
  userId: "user123",
  type: "loan_reminder",
  scheduledTime: Timestamp,
  data: {
    title: "แจ้งเตือนคืนอุปกรณ์",
    message: "กรุณาคืน MacBook Pro ภายในวันพรุ่งนี้",
    priority: "high"
  },
  status: "scheduled", // scheduled, sent, failed
  createdAt: Timestamp,
  sentAt: Timestamp | null
}
```

### 7. publicStats (สถิติสาธารณะ)

```javascript
{
  // Document ID = "current"
  totalEquipment: 50,
  availableEquipment: 35,
  borrowedEquipment: 15,
  totalUsers: 100,
  totalLoans: 250,
  totalReservations: 80,
  lastUpdated: Timestamp
}
```

### 8. closedDates (วันที่ปิดให้บริการ)

```javascript
{
  date: Timestamp,
  reason: "วันขึ้นปีใหม่",
  type: "holiday", // holiday, maintenance, etc.
  createdBy: "admin123",
  createdAt: Timestamp
}
```

### 9. categoryLimits (จำกัดการยืมตามหมวดหมู่)

```javascript
{
  // Document ID = categoryId
  maxBorrowPerUser: 3,
  maxBorrowDuration: 7, // วัน
  requiresApproval: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 10. settingsAuditLog (บันทึกการเปลี่ยนแปลงการตั้งค่า)

```javascript
{
  settingKey: "maxLoanDuration",
  oldValue: 7,
  newValue: 14,
  changedBy: "admin123",
  changedByName: "Admin User",
  timestamp: Timestamp,
  reason: "เพิ่มระยะเวลายืมสูงสุดตามนโยบายใหม่"
}
```

---

## 🔐 Security Rules

ตรวจสอบว่าไฟล์ `firestore.rules` มี rules สำหรับทุก collection:

```bash
# ตรวจสอบ rules
cat firestore.rules | grep "match /"

# Deploy rules
firebase deploy --only firestore:rules
```

---

## 📊 Indexes

ตรวจสอบว่าไฟล์ `firestore.indexes.json` มี indexes ที่จำเป็น:

```bash
# ตรวจสอบ indexes
cat firestore.indexes.json

# Deploy indexes
firebase deploy --only firestore:indexes
```

---

## ⚠️ หมายเหตุสำคัญ

### 1. Service Account Key Security

```bash
# เพิ่มใน .gitignore
echo "config/serviceAccountKey.json" >> .gitignore

# ตรวจสอบว่าไม่ถูก commit
git status
```

### 2. ข้อมูลตัวอย่าง

ข้อมูลตัวอย่างที่สร้างโดย script สามารถลบได้หลังจากทดสอบเสร็จ:

```javascript
// ลบข้อมูลตัวอย่างผ่าน Firebase Console
// หรือสร้าง script เพื่อลบ
```

### 3. Production Environment

สำหรับ Production:
- ✅ Deploy Security Rules
- ✅ Deploy Indexes
- ✅ ตั้งค่า Backup
- ✅ ตั้งค่า Monitoring
- ✅ ทดสอบ Performance

---

## 🆘 Troubleshooting

### ปัญหา: "serviceAccountKey.json not found"

```bash
# ดาวน์โหลดจาก Firebase Console
# Project Settings → Service Accounts → Generate new private key
mkdir -p config
# วางไฟล์ใน config/serviceAccountKey.json
```

### ปัญหา: "Permission denied"

```bash
# ตรวจสอบว่า Service Account มีสิทธิ์
# Firebase Console → IAM & Admin → Service Accounts
# ต้องมี role: "Firebase Admin SDK Administrator Service Agent"
```

### ปัญหา: "No admin user found"

```bash
# สร้าง admin user ก่อน
node scripts/setup-first-admin.js
```

### ปัญหา: Collections ถูกสร้างแต่ไม่มีข้อมูล

```bash
# ตรวจสอบ logs
node scripts/initialize-core-collections.js 2>&1 | tee setup.log

# ตรวจสอบ Firebase Console
# Firestore Database → ดูแต่ละ collection
```

---

## 📚 เอกสารเพิ่มเติม

- [FIREBASE_DATA_CHECKLIST.md](./FIREBASE_DATA_CHECKLIST.md) - รายละเอียดครบถ้วน
- [สรุป-ข้อมูล-Firebase.md](./สรุป-ข้อมูล-Firebase.md) - สรุปภาษาไทย
- [วิธีสร้าง-Collections.md](./วิธีสร้าง-Collections.md) - คู่มือทีละขั้นตอน

---

## ✅ Checklist

- [ ] ดาวน์โหลด Service Account Key
- [ ] วางไฟล์ใน `config/serviceAccountKey.json`
- [ ] รัน `node scripts/initialize-core-collections.js`
- [ ] รัน `node scripts/check-all-collections.js`
- [ ] ตรวจสอบ Firebase Console
- [ ] Deploy Security Rules
- [ ] Deploy Indexes
- [ ] ทดสอบระบบ
- [ ] ลบข้อมูลตัวอย่าง (ถ้าต้องการ)

---

**Created:** November 20, 2025  
**Last Updated:** November 20, 2025  
**Version:** 1.0.0
