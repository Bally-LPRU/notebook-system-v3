# Quick Start: ระบบจัดการคำขอที่หมดอายุ

## 🚀 การติดตั้งอย่างรวดเร็ว

### 1. ติดตั้ง Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

### 2. Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

### 3. ตรวจสอบการทำงาน
```bash
firebase functions:log --follow
```

## 📁 ไฟล์ที่สร้างใหม่

### Cloud Functions
- `functions/checkOverdueLoans.js` - Cloud Functions ทั้ง 3 ฟังก์ชัน
- `functions/index.js` - Entry point
- `functions/package.json` - Dependencies
- `functions/README.md` - เอกสารโดยละเอียด

### Services
- `src/services/overdueManagementService.js` - Service สำหรับจัดการ overdue

### Components
- `src/components/loan/OverdueIndicator.js` - แสดงสถานะ overdue
- `src/components/admin/OverdueDashboard.js` - Dashboard สำหรับ admin

### Documentation
- `OVERDUE_MANAGEMENT_IMPLEMENTATION.md` - เอกสารครบถ้วน
- `OVERDUE_MANAGEMENT_QUICK_START.md` - คู่มือเริ่มต้นอย่างรวดเร็ว

## 🔧 การใช้งาน

### ใน Component
```jsx
import OverdueIndicator from '../loan/OverdueIndicator';
import OverdueManagementService from '../../services/overdueManagementService';

// แสดง badge
<OverdueIndicator loanRequest={loan} variant="badge" />

// ตรวจสอบสถานะ
const isOverdue = OverdueManagementService.isOverdue(loan);
const daysOverdue = OverdueManagementService.calculateDaysOverdue(loan.expectedReturnDate);
```

### ใน Admin Dashboard
```jsx
import OverdueDashboard from '../admin/OverdueDashboard';

<OverdueDashboard />
```

### ใน Service
```javascript
import LoanRequestService from '../services/loanRequestService';

// ดึงรายการ overdue
const overdueLoans = await LoanRequestService.getOverdueLoanRequests();

// ดึงสถิติ
const stats = await LoanRequestService.getOverdueStatistics();
```

## 📊 Cloud Functions Schedule

| Function | Schedule | Description |
|----------|----------|-------------|
| checkOverdueLoans | ทุก 1 ชั่วโมง | ตรวจสอบและอัปเดตคำขอที่เกินกำหนด |
| sendLoanReminders | ทุกวัน 09:00 | ส่งการแจ้งเตือนล่วงหน้า |
| cancelExpiredReservations | ทุก 2 ชั่วโมง | ยกเลิกการจองที่หมดอายุ |

## 🔔 Notification Types

| Type | Priority | Recipient | Description |
|------|----------|-----------|-------------|
| loan_overdue | high | ผู้ยืม | แจ้งเตือนเกินกำหนด |
| loan_overdue_admin | medium | Admin | แจ้งเตือน admin มีคนเกินกำหนด |
| loan_reminder | high | ผู้ยืม | แจ้งเตือนล่วงหน้า |
| reservation_expired | medium | ผู้จอง | แจ้งเตือนการจองหมดอายุ |

## 🎨 Color Coding

| Days Overdue | Color | Badge Class |
|--------------|-------|-------------|
| 0 (ปกติ) | Gray | `bg-gray-100 text-gray-800` |
| 1-3 วัน | Orange | `bg-orange-100 text-orange-800` |
| 4-7 วัน | Red | `bg-red-100 text-red-800` |
| 8+ วัน | Dark Red | `bg-red-200 text-red-900 font-bold` |

## ✅ Checklist การติดตั้ง

- [ ] ติดตั้ง dependencies ใน functions/
- [ ] Deploy Cloud Functions
- [ ] Deploy Firestore indexes
- [ ] ตรวจสอบ Cloud Scheduler ใน Firebase Console
- [ ] ตรวจสอบ timezone = 'Asia/Bangkok'
- [ ] ตรวจสอบ Blaze plan เปิดใช้งาน
- [ ] ทดสอบ functions ด้วย logs
- [ ] เพิ่ม OverdueIndicator ใน LoanRequestCard
- [ ] เพิ่ม OverdueDashboard ใน AdminDashboard
- [ ] ทดสอบการแสดงผลใน UI

## 🐛 Troubleshooting

### Function ไม่ทำงาน
```bash
# ดู logs
firebase functions:log --only checkOverdueLoans

# ตรวจสอบ Cloud Scheduler
# ไปที่ Firebase Console > Functions
```

### Notifications ไม่ถูกส่ง
```bash
# ตรวจสอบ Firestore rules
# ตรวจสอบว่ามี admin users
```

### Index Errors
```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# รอ indexes build เสร็จ (2-5 นาที)
```

## 📚 เอกสารเพิ่มเติม

- **เอกสารครบถ้วน:** `OVERDUE_MANAGEMENT_IMPLEMENTATION.md`
- **Functions README:** `functions/README.md`
- **Audit Report:** `LOAN_SYSTEM_AUDIT_REPORT.md`

## 🆘 ต้องการความช่วยเหลือ?

1. อ่าน `OVERDUE_MANAGEMENT_IMPLEMENTATION.md`
2. ตรวจสอบ logs: `firebase functions:log`
3. ดู Firebase Console
4. ติดต่อทีมพัฒนา

---

**สำคัญ:** ต้องการ Firebase Blaze plan เพื่อใช้งาน Cloud Functions
