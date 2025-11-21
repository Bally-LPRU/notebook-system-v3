# การปรับปรุงระบบจัดการคำขอที่หมดอายุ

**วันที่:** ${new Date().toLocaleDateString('th-TH')}

## สรุปการปรับปรุง

ระบบจัดการคำขอที่หมดอายุได้รับการพัฒนาเพื่อแก้ไขปัญหาที่ระบุใน LOAN_SYSTEM_AUDIT_REPORT.md หัวข้อ "การจัดการคำขอที่หมดอายุ"

---

## 🎯 วัตถุประสงค์

1. ตรวจสอบและอัปเดตสถานะคำขอยืมที่เกินกำหนดคืนอัตโนมัติ
2. ส่งการแจ้งเตือนไปยังผู้ยืมและผู้ดูแลระบบ
3. แสดงสถิติและรายการคำขอที่เกินกำหนด
4. ส่งการแจ้งเตือนล่วงหน้าก่อนครบกำหนดคืน
5. จัดการการจองที่หมดอายุอัตโนมัติ

---

## 📦 ไฟล์ที่สร้างใหม่

### 1. Cloud Functions

#### `functions/checkOverdueLoans.js`
Cloud Functions สำหรับตรวจสอบและจัดการคำขอที่หมดอายุ

**ฟังก์ชันหลัก:**

##### 1.1 `checkOverdueLoans`
- **Schedule:** ทุก 1 ชั่วโมง
- **หน้าที่:**
  - ตรวจสอบคำขอยืมที่เกินกำหนดคืน (status = 'borrowed' และ expectedReturnDate < now)
  - อัปเดตสถานะเป็น 'overdue'
  - สร้างการแจ้งเตือนไปยังผู้ยืม (priority: high)
  - สร้างการแจ้งเตือนไปยัง admin ทุกคน (priority: medium)
  - บันทึก activity log
- **ผลลัพธ์:**
  ```javascript
  {
    success: true,
    overdueCount: 5,
    notificationsSent: 15,
    timestamp: "2024-01-15T10:00:00.000Z"
  }
  ```

##### 1.2 `sendLoanReminders`
- **Schedule:** ทุกวันเวลา 09:00 น. (เวลาไทย)
- **หน้าที่:**
  - ตรวจสอบคำขอยืมที่ครบกำหนดคืนภายใน 1 วัน
  - ส่งการแจ้งเตือนล่วงหน้า (priority: high)
  - ตรวจสอบว่าส่งการแจ้งเตือนไปแล้วหรือยัง (ไม่ส่งซ้ำในวันเดียวกัน)
- **ผลลัพธ์:**
  ```javascript
  {
    success: true,
    remindersSent: 8,
    timestamp: "2024-01-15T09:00:00.000Z"
  }
  ```

##### 1.3 `cancelExpiredReservations`
- **Schedule:** ทุก 2 ชั่วโมง
- **หน้าที่:**
  - ตรวจสอบการจองที่ผ่านเวลานัดหมายมากกว่า 2 ชั่วโมง (status = 'ready')
  - อัปเดตสถานะการจองเป็น 'expired'
  - เปลี่ยนสถานะอุปกรณ์กลับเป็น 'available'
  - ส่งการแจ้งเตือนไปยังผู้จอง
  - บันทึก activity log
- **ผลลัพธ์:**
  ```javascript
  {
    success: true,
    cancelledCount: 3,
    timestamp: "2024-01-15T10:00:00.000Z"
  }
  ```

**การติดตั้ง:**
```bash
# ติดตั้ง dependencies
cd functions
npm install firebase-functions firebase-admin

# Deploy functions
firebase deploy --only functions:checkOverdueLoans
firebase deploy --only functions:sendLoanReminders
firebase deploy --only functions:cancelExpiredReservations
```

---

### 2. Services

#### `src/services/overdueManagementService.js`
Service สำหรับจัดการคำขอที่หมดอายุฝั่ง client

**ฟังก์ชันหลัก:**

##### 2.1 การตรวจสอบสถานะ
```javascript
// ตรวจสอบว่าคำขอเกินกำหนดหรือไม่
OverdueManagementService.isOverdue(loanRequest)
// Returns: boolean

// คำนวณจำนวนวันที่เกินกำหนด
OverdueManagementService.calculateDaysOverdue(expectedReturnDate)
// Returns: number (0 if not overdue)

// คำนวณจำนวนวันที่เหลือจนครบกำหนด
OverdueManagementService.calculateDaysUntilDue(expectedReturnDate)
// Returns: number (negative if overdue)
```

##### 2.2 การดึงข้อมูล
```javascript
// ดึงรายการคำขอที่เกินกำหนดทั้งหมด
await OverdueManagementService.getOverdueLoanRequests(userId)
// Returns: Array<LoanRequest>

// ดึงรายการคำขอที่ใกล้ครบกำหนด (default: 3 วัน)
await OverdueManagementService.getLoanRequestsDueSoon(daysAhead, userId)
// Returns: Array<LoanRequest>

// ดึงสถิติคำขอที่เกินกำหนด
await OverdueManagementService.getOverdueStatistics(userId)
// Returns: {
//   totalOverdue: number,
//   totalDueSoon: number,
//   averageDaysOverdue: number,
//   maxDaysOverdue: number,
//   overdueLoanRequests: Array<LoanRequest>,
//   dueSoonLoanRequests: Array<LoanRequest>
// }
```

##### 2.3 การแสดงผล
```javascript
// ดึง label สำหรับแสดงสถานะ
OverdueManagementService.getOverdueStatusLabel(loanRequest)
// Returns: "เกินกำหนด 5 วัน"

OverdueManagementService.getDueSoonLabel(loanRequest)
// Returns: "ครบกำหนดพรุ่งนี้" | "เหลืออีก 2 วัน"

// ดึง CSS class สำหรับสี
OverdueManagementService.getOverdueColorClass(daysOverdue)
// Returns: "text-red-600" | "text-orange-600" | etc.

OverdueManagementService.getOverdueBadgeClass(daysOverdue)
// Returns: "bg-red-100 text-red-800" | etc.

// ฟอร์แมตวันที่
OverdueManagementService.formatOverdueDate(expectedReturnDate)
// Returns: "15 มกราคม 2567"
```

##### 2.4 การจัดการ (Fallback)
```javascript
// อัปเดตสถานะเป็น overdue (client-side fallback)
await OverdueManagementService.markAsOverdue(loanRequestId)
// Returns: boolean

// ตรวจสอบว่าการจองหมดอายุหรือไม่
OverdueManagementService.isReservationExpired(reservation)
// Returns: boolean
```

---

### 3. Components

#### `src/components/loan/OverdueIndicator.js`
Component สำหรับแสดงสถานะเกินกำหนด

**Props:**
```typescript
{
  loanRequest: Object,        // ข้อมูลคำขอยืม (required)
  showIcon: boolean,          // แสดงไอคอนหรือไม่ (default: true)
  showDueSoon: boolean,       // แสดง "ใกล้ครบกำหนด" หรือไม่ (default: true)
  variant: 'badge'|'text'|'full'  // รูปแบบการแสดงผล (default: 'badge')
}
```

**Variants:**

##### 3.1 Badge (default)
```jsx
<OverdueIndicator loanRequest={loan} variant="badge" />
```
แสดงเป็น badge สีแดง/ส้ม/เหลือง พร้อมไอคอน

##### 3.2 Text
```jsx
<OverdueIndicator loanRequest={loan} variant="text" />
```
แสดงเป็นข้อความธรรมดา พร้อมสี

##### 3.3 Full
```jsx
<OverdueIndicator loanRequest={loan} variant="full" />
```
แสดงเป็น card พร้อมรายละเอียดเต็ม

**ตัวอย่างการใช้งาน:**
```jsx
// ใน LoanRequestCard
<div className="flex items-center space-x-2">
  <LoanStatusBadge status={request.status} />
  <OverdueIndicator 
    loanRequest={request} 
    variant="badge"
    showIcon={true}
    showDueSoon={true}
  />
</div>

// ใน LoanRequestDetail
<OverdueIndicator 
  loanRequest={request} 
  variant="full"
/>
```

---

#### `src/components/admin/OverdueDashboard.js`
Dashboard สำหรับ admin ติดตามคำขอที่เกินกำหนด

**Features:**
1. **Statistics Cards**
   - เกินกำหนดทั้งหมด (Total Overdue)
   - ใกล้ครบกำหนด (Due Soon)
   - เฉลี่ยเกินกำหนด (Average Days Overdue)
   - เกินกำหนดสูงสุด (Max Days Overdue)

2. **Overdue Loans List**
   - แสดง 5 รายการแรกที่เกินกำหนดมากที่สุด
   - แสดงชื่อผู้ยืม, อุปกรณ์, วันที่กำหนดคืน
   - แสดง badge จำนวนวันที่เกิน
   - ลิงก์ไปยังรายละเอียด

3. **Due Soon List**
   - แสดง 5 รายการแรกที่ใกล้ครบกำหนด
   - แสดงข้อมูลเช่นเดียวกับ Overdue List

4. **Auto Refresh**
   - ปุ่ม Refresh สำหรับโหลดข้อมูลใหม่
   - Loading state และ Error handling

**การใช้งาน:**
```jsx
// ใน AdminDashboard
import OverdueDashboard from './OverdueDashboard';

<OverdueDashboard />
```

---

## 🔄 การอัปเดตไฟล์เดิม

### `src/services/loanRequestService.js`

**เพิ่ม imports:**
```javascript
import { Timestamp } from 'firebase/firestore';
import OverdueManagementService from './overdueManagementService';
```

**เพิ่มฟังก์ชันใหม่:**

#### 1. `checkAndUpdateOverdueLoans()`
Client-side fallback สำหรับตรวจสอบและอัปเดตคำขอที่เกินกำหนด
```javascript
static async checkAndUpdateOverdueLoans() {
  // Query borrowed loans past expected return date
  // Update status to 'overdue'
  // Returns: number of loans marked as overdue
}
```

#### 2. `getOverdueLoanRequests(userId)`
Wrapper สำหรับ OverdueManagementService
```javascript
static async getOverdueLoanRequests(userId = null) {
  return await OverdueManagementService.getOverdueLoanRequests(userId);
}
```

#### 3. `getLoanRequestsDueSoon(daysAhead, userId)`
Wrapper สำหรับ OverdueManagementService
```javascript
static async getLoanRequestsDueSoon(daysAhead = 3, userId = null) {
  return await OverdueManagementService.getLoanRequestsDueSoon(daysAhead, userId);
}
```

#### 4. `getOverdueStatistics(userId)`
Wrapper สำหรับ OverdueManagementService
```javascript
static async getOverdueStatistics(userId = null) {
  return await OverdueManagementService.getOverdueStatistics(userId);
}
```

#### 5. `isOverdue(loanRequest)`
Wrapper สำหรับ OverdueManagementService
```javascript
static isOverdue(loanRequest) {
  return OverdueManagementService.isOverdue(loanRequest);
}
```

#### 6. `calculateDaysOverdue(expectedReturnDate)`
Wrapper สำหรับ OverdueManagementService
```javascript
static calculateDaysOverdue(expectedReturnDate) {
  return OverdueManagementService.calculateDaysOverdue(expectedReturnDate);
}
```

---

## 📊 Data Flow

### 1. Overdue Detection Flow
```
Cloud Function (hourly)
  ↓
Query borrowed loans (expectedReturnDate < now)
  ↓
Update status to 'overdue'
  ↓
Create notifications (user + admins)
  ↓
Log activity
```

### 2. Reminder Flow
```
Cloud Function (daily 9 AM)
  ↓
Query borrowed loans (due within 1 day)
  ↓
Check if reminder already sent today
  ↓
Create reminder notification
```

### 3. Client-side Display Flow
```
Component loads
  ↓
Call OverdueManagementService.getOverdueStatistics()
  ↓
Query Firestore for overdue/due soon loans
  ↓
Calculate statistics
  ↓
Display in UI
```

---

## 🎨 UI/UX Improvements

### Color Coding
- **0 วัน (ปกติ):** Gray
- **1-3 วัน (เริ่มเกิน):** Orange
- **4-7 วัน (เกินมาก):** Red
- **8+ วัน (เกินมากมาก):** Dark Red + Bold

### Badge Styles
```jsx
// Not overdue
<span className="bg-gray-100 text-gray-800">...</span>

// 1-3 days overdue
<span className="bg-orange-100 text-orange-800">...</span>

// 4-7 days overdue
<span className="bg-red-100 text-red-800">...</span>

// 8+ days overdue
<span className="bg-red-200 text-red-900 font-bold">...</span>
```

### Icons
- **Overdue:** `ExclamationTriangleIcon` (warning)
- **Due Soon:** `ClockIcon` (time)
- **Statistics:** `ChartBarIcon`
- **User:** `UserIcon`

---

## 🔔 Notification Types

### 1. Loan Overdue (ผู้ยืม)
```javascript
{
  type: 'loan_overdue',
  title: 'การยืมอุปกรณ์เกินกำหนด',
  message: 'คุณยืมอุปกรณ์เกินกำหนดคืนแล้ว กรุณาคืนอุปกรณ์โดยเร็วที่สุด',
  priority: 'high',
  actionUrl: '/my-loans/{loanId}',
  actionText: 'ดูรายละเอียด'
}
```

### 2. Loan Overdue Admin (ผู้ดูแลระบบ)
```javascript
{
  type: 'loan_overdue_admin',
  title: 'มีการยืมอุปกรณ์เกินกำหนด',
  message: 'มีผู้ใช้ยืมอุปกรณ์เกินกำหนดคืน',
  priority: 'medium',
  actionUrl: '/admin/loan-requests/{loanId}',
  actionText: 'ดูรายละเอียด'
}
```

### 3. Loan Reminder (ผู้ยืม)
```javascript
{
  type: 'loan_reminder',
  title: 'แจ้งเตือนคืนอุปกรณ์',
  message: 'กรุณาคืนอุปกรณ์ภายในวันพรุ่งนี้',
  priority: 'high',
  actionUrl: '/my-loans/{loanId}',
  actionText: 'ดูรายละเอียด'
}
```

### 4. Reservation Expired (ผู้จอง)
```javascript
{
  type: 'reservation_expired',
  title: 'การจองหมดอายุ',
  message: 'การจองอุปกรณ์ของคุณหมดอายุแล้ว เนื่องจากไม่มารับภายในเวลาที่กำหนด',
  priority: 'medium'
}
```

---

## 🧪 Testing

### Manual Testing Checklist

#### Cloud Functions
- [ ] Deploy functions สำเร็จ
- [ ] `checkOverdueLoans` ทำงานทุก 1 ชั่วโมง
- [ ] `sendLoanReminders` ทำงานทุกวันเวลา 9 โมงเช้า
- [ ] `cancelExpiredReservations` ทำงานทุก 2 ชั่วโมง
- [ ] Notifications ถูกสร้างถูกต้อง
- [ ] Activity logs ถูกบันทึก

#### Services
- [ ] `OverdueManagementService.isOverdue()` คืนค่าถูกต้อง
- [ ] `calculateDaysOverdue()` คำนวณถูกต้อง
- [ ] `getOverdueLoanRequests()` ดึงข้อมูลถูกต้อง
- [ ] `getOverdueStatistics()` คำนวณสถิติถูกต้อง

#### Components
- [ ] `OverdueIndicator` แสดงผลถูกต้องทุก variant
- [ ] Color coding ถูกต้องตามจำนวนวัน
- [ ] `OverdueDashboard` แสดงสถิติถูกต้อง
- [ ] Refresh button ทำงาน
- [ ] Loading และ Error states แสดงถูกต้อง

### Test Scenarios

#### Scenario 1: Loan becomes overdue
1. สร้างคำขอยืมที่ expectedReturnDate เป็นเมื่อวาน
2. รอ Cloud Function ทำงาน (หรือเรียก manually)
3. ตรวจสอบว่าสถานะเปลี่ยนเป็น 'overdue'
4. ตรวจสอบว่ามี notification ถูกสร้าง
5. ตรวจสอบว่า OverdueIndicator แสดงผลถูกต้อง

#### Scenario 2: Loan due soon
1. สร้างคำขอยืมที่ expectedReturnDate เป็นพรุ่งนี้
2. รอ Cloud Function ทำงาน (9 AM)
3. ตรวจสอบว่ามี reminder notification
4. ตรวจสอบว่า OverdueIndicator แสดง "ครบกำหนดพรุ่งนี้"

#### Scenario 3: Reservation expires
1. สร้างการจองที่ startTime เป็น 3 ชั่วโมงที่แล้ว
2. รอ Cloud Function ทำงาน
3. ตรวจสอบว่าสถานะเปลี่ยนเป็น 'expired'
4. ตรวจสอบว่าอุปกรณ์กลับเป็น 'available'
5. ตรวจสอบว่ามี notification

---

## 📈 Performance Considerations

### Query Optimization
- ใช้ composite indexes สำหรับ query ที่ซับซ้อน
- Limit จำนวนผลลัพธ์ (top 5 ใน dashboard)
- Cache statistics ใน client

### Firestore Indexes Required
```json
{
  "indexes": [
    {
      "collectionGroup": "loanRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "expectedReturnDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "reservations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### Batch Operations
- Cloud Functions ใช้ batch writes สำหรับ atomic updates
- อัปเดตหลายรายการพร้อมกัน
- ลด API calls

---

## 🚀 Deployment

### 1. Deploy Cloud Functions
```bash
# ติดตั้ง dependencies
cd functions
npm install

# Deploy ทั้งหมด
firebase deploy --only functions

# หรือ deploy ทีละฟังก์ชัน
firebase deploy --only functions:checkOverdueLoans
firebase deploy --only functions:sendLoanReminders
firebase deploy --only functions:cancelExpiredReservations
```

### 2. Update Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

### 3. Deploy Frontend
```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting
```

---

## 📝 Configuration

### Environment Variables
ไม่ต้องการ environment variables เพิ่มเติม (ใช้ Firebase config ที่มีอยู่)

### Firebase Console Settings
1. เปิดใช้งาน Cloud Scheduler
2. ตั้งค่า timezone เป็น 'Asia/Bangkok'
3. ตรวจสอบ billing account (Cloud Functions ต้องการ Blaze plan)

---

## 🔍 Monitoring

### Cloud Functions Logs
```bash
# ดู logs ของ checkOverdueLoans
firebase functions:log --only checkOverdueLoans

# ดู logs ของ sendLoanReminders
firebase functions:log --only sendLoanReminders

# ดู logs ทั้งหมด
firebase functions:log
```

### Metrics to Monitor
- จำนวนคำขอที่เกินกำหนดต่อวัน
- จำนวน notifications ที่ส่งต่อวัน
- เวลาเฉลี่ยที่เกินกำหนด
- จำนวนการจองที่หมดอายุ

---

## 🐛 Troubleshooting

### Cloud Function ไม่ทำงาน
1. ตรวจสอบ logs: `firebase functions:log`
2. ตรวจสอบ Cloud Scheduler ใน Firebase Console
3. ตรวจสอบ billing account
4. ตรวจสอบ timezone settings

### Notifications ไม่ถูกส่ง
1. ตรวจสอบว่า Cloud Function ทำงานสำเร็จ
2. ตรวจสอบ Firestore rules สำหรับ notifications collection
3. ตรวจสอบ NotificationService

### OverdueIndicator ไม่แสดงผล
1. ตรวจสอบว่า loanRequest มี expectedReturnDate
2. ตรวจสอบว่า status เป็น 'borrowed' หรือ 'overdue'
3. ตรวจสอบ console สำหรับ errors

---

## ✅ สรุป

### สิ่งที่ได้รับการปรับปรุง
1. ✅ ระบบตรวจสอบคำขอที่เกินกำหนดอัตโนมัติ (Cloud Function)
2. ✅ ระบบส่งการแจ้งเตือนล่วงหน้า (Cloud Function)
3. ✅ ระบบจัดการการจองที่หมดอายุ (Cloud Function)
4. ✅ Service สำหรับจัดการ overdue ฝั่ง client
5. ✅ Component แสดงสถานะ overdue
6. ✅ Dashboard สำหรับ admin ติดตาม overdue
7. ✅ Integration กับ loanRequestService

### ประโยชน์ที่ได้รับ
- ✅ ลดภาระงานของ admin ในการตรวจสอบคำขอที่เกินกำหนด
- ✅ ผู้ใช้ได้รับการแจ้งเตือนอัตโนมัติ
- ✅ สถิติและรายงานที่ชัดเจน
- ✅ ป้องกันการจองที่ไม่มารับ
- ✅ ปรับปรุง UX ด้วย visual indicators

### Next Steps
1. ทดสอบ Cloud Functions ใน production
2. ติดตาม metrics และปรับปรุง
3. เพิ่ม email notifications (optional)
4. เพิ่ม SMS notifications (optional)
5. สร้าง admin report สำหรับ overdue trends

---

**หมายเหตุ:** ระบบนี้ต้องการ Firebase Blaze plan เพื่อใช้งาน Cloud Functions และ Cloud Scheduler
