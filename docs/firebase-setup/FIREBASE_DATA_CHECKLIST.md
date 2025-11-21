# Firebase Data Collections Checklist

## ✅ Collections ที่มีอยู่แล้ว
- [x] `settings` - ตั้งค่าระบบทั่วไป
- [x] `systemSettings` - ตั้งค่าระบบหลัก
- [x] `equipmentCategories` - หมวดหมู่อุปกรณ์
- [x] `equipmentManagement` - จัดการอุปกรณ์
- [x] `users` - ข้อมูลผู้ใช้

## ❌ Collections ที่ยังขาดและต้องเพิ่ม

### 1. **loanRequests** (สำคัญมาก!)
**วัตถุประสงค์**: บันทึกคำขอยืมอุปกรณ์
```javascript
{
  id: string,
  equipmentId: string,
  userId: string,
  requestDate: timestamp,
  borrowDate: timestamp,
  expectedReturnDate: timestamp,
  actualReturnDate: timestamp,
  purpose: string,
  notes: string,
  status: string, // pending, approved, rejected, borrowed, returned, overdue
  approvedBy: string,
  approvedAt: timestamp,
  rejectionReason: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. **reservations** (สำคัญมาก!)
**วัตถุประสงค์**: บันทึกการจองอุปกรณ์ล่วงหน้า
```javascript
{
  id: string,
  equipmentId: string,
  userId: string,
  reservationDate: timestamp,
  startTime: timestamp,
  endTime: timestamp,
  purpose: string,
  notes: string,
  status: string, // pending, approved, ready, completed, cancelled, expired
  approvedBy: string,
  approvedAt: timestamp,
  notificationSent: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. **notifications** (สำคัญ!)
**วัตถุประสงค์**: การแจ้งเตือนส่วนตัวของผู้ใช้
```javascript
{
  id: string,
  userId: string,
  type: string, // loan_request, loan_approved, loan_rejected, loan_reminder, etc.
  title: string,
  message: string,
  data: object,
  isRead: boolean,
  priority: string, // low, medium, high, urgent
  actionUrl: string,
  actionText: string,
  expiresAt: timestamp,
  createdAt: timestamp,
  readAt: timestamp
}
```

### 4. **notificationSettings**
**วัตถุประสงค์**: ตั้งค่าการแจ้งเตือนของผู้ใช้แต่ละคน
```javascript
{
  userId: string, // document ID
  emailNotifications: {
    loanApproval: boolean,
    loanReminder: boolean,
    reservationReminder: boolean,
    systemUpdates: boolean
  },
  inAppNotifications: {
    loanApproval: boolean,
    loanReminder: boolean,
    reservationReminder: boolean,
    systemUpdates: boolean
  },
  reminderTiming: {
    loanReminder: number,
    reservationReminder: number
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 5. **activityLogs** (สำหรับ Audit Trail)
**วัตถุประสงค์**: บันทึกกิจกรรมทั้งหมดในระบบ
```javascript
{
  id: string,
  userId: string,
  action: string, // login, request_loan, approve_loan, etc.
  targetType: string, // equipment, user, loan_request, etc.
  targetId: string,
  details: object,
  timestamp: timestamp,
  ipAddress: string
}
```

### 6. **scheduledNotifications**
**วัตถุประสงค์**: การแจ้งเตือนที่ต้องส่งในอนาคต
```javascript
{
  id: string,
  userId: string,
  type: string,
  scheduledTime: timestamp,
  data: object,
  status: string, // scheduled, sent, failed
  createdAt: timestamp,
  sentAt: timestamp
}
```

### 7. **publicStats**
**วัตถุประสงค์**: สถิติสาธารณะสำหรับหน้าแรก
```javascript
{
  id: string, // เช่น "current"
  totalEquipment: number,
  availableEquipment: number,
  borrowedEquipment: number,
  totalUsers: number,
  totalLoans: number,
  lastUpdated: timestamp
}
```

### 8. **closedDates** (มีอยู่แล้วใน rules)
**วัตถุประสงค์**: วันที่ปิดให้บริการ
```javascript
{
  id: string,
  date: timestamp,
  reason: string,
  type: string, // holiday, maintenance, etc.
  createdBy: string,
  createdAt: timestamp
}
```

### 9. **categoryLimits** (มีอยู่แล้วใน rules)
**วัตถุประสงค์**: จำกัดจำนวนการยืมตามหมวดหมู่
```javascript
{
  categoryId: string, // document ID
  maxBorrowPerUser: number,
  maxBorrowDuration: number,
  requiresApproval: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 10. **settingsAuditLog** (มีอยู่แล้วใน rules)
**วัตถุประสงค์**: บันทึกการเปลี่ยนแปลงการตั้งค่า
```javascript
{
  id: string,
  settingKey: string,
  oldValue: any,
  newValue: any,
  changedBy: string,
  timestamp: timestamp,
  reason: string
}
```

## 📋 สรุปสิ่งที่ต้องทำ

### ลำดับความสำคัญสูง (ต้องมีก่อนใช้งานจริง):
1. ✅ `equipment` หรือ `equipmentManagement` - มีแล้ว
2. ❌ **`loanRequests`** - ยังไม่มี (สำคัญมาก!)
3. ❌ **`reservations`** - ยังไม่มี (สำคัญมาก!)
4. ❌ **`notifications`** - ยังไม่มี (สำคัญ!)

### ลำดับความสำคัญปานกลาง:
5. ❌ `notificationSettings` - ควรมี
6. ❌ `activityLogs` - ควรมี
7. ❌ `publicStats` - ควรมี

### ลำดับความสำคัญต่ำ (สามารถเพิ่มทีหลังได้):
8. ❌ `scheduledNotifications` - เพิ่มทีหลัง
9. ❌ `closedDates` - เพิ่มทีหลัง
10. ❌ `categoryLimits` - เพิ่มทีหลัง
11. ❌ `settingsAuditLog` - เพิ่มทีหลัง

## 🔧 วิธีการสร้าง Collections

### ตัวเลือก 1: สร้างผ่าน Firebase Console (แนะนำ)
1. เข้า Firebase Console > Firestore Database
2. คลิก "Start collection"
3. ใส่ชื่อ collection และสร้าง document แรก

### ตัวเลือก 2: สร้างผ่าน Script
สร้างไฟล์ `scripts/initialize-core-collections.js` เพื่อสร้าง collections พื้นฐาน

### ตัวเลือก 3: สร้างอัตโนมัติเมื่อมีการใช้งาน
Collections จะถูกสร้างอัตโนมัติเมื่อมีการเพิ่มข้อมูลครั้งแรก

## 📝 หมายเหตุ
- Firestore จะสร้าง collection อัตโนมัติเมื่อมีการเพิ่ม document แรก
- ไม่จำเป็นต้องสร้าง collection ล่วงหน้า แต่ควรมี Security Rules พร้อม
- ตรวจสอบ `firestore.rules` ว่ามี rules สำหรับทุก collection แล้ว
