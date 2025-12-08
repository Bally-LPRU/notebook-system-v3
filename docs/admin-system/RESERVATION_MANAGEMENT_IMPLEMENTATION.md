# การพัฒนาระบบจัดการการจอง (Admin Reservation Management)

## วันที่: 8 ธันวาคม 2567

## สรุปการพัฒนา

### 1. สร้าง AdminReservationManagement Component

**ไฟล์:** `src/components/admin/AdminReservationManagement.js`

**ฟีเจอร์หลัก:**
- CRUD การจองอุปกรณ์เต็มรูปแบบ
- Stats Cards แสดงสถิติการจอง (ทั้งหมด, รอการอนุมัติ, อนุมัติแล้ว, พร้อมรับ, เสร็จสิ้น, ยกเลิก/หมดอายุ)
- Filter ตามสถานะและช่วงวันที่
- ค้นหาด้วยรหัสการจอง, อุปกรณ์, หรือวัตถุประสงค์
- ตรวจจับการจองที่เกินเวลารับ (isOverdueForPickup)
- ปุ่ม "ไม่มารับ" สำหรับ mark no-show
- Responsive design (Mobile dropdown, Desktop tabs)

**สถานะการจอง:**
- `pending` - รอการอนุมัติ
- `approved` - อนุมัติแล้ว
- `ready` - พร้อมรับอุปกรณ์
- `completed` - เสร็จสิ้น
- `cancelled` - ยกเลิก
- `expired` - หมดอายุ
- `no_show` - ไม่มารับอุปกรณ์

### 2. ปรับปรุง ReservationService

**ไฟล์:** `src/services/reservationService.js`

**Methods ที่เพิ่ม/แก้ไข:**
- `hasLoanConflict()` - ตรวจสอบ conflict กับการยืมในวันเดียวกัน
- `validateReservationWithSettings()` - ตรวจสอบการจองตามกฎทั้งหมด
- `updateExpiredReservations()` - อัปเดตการจองที่หมดอายุอัตโนมัติ

### 3. เพิ่ม NO_SHOW Status

**ไฟล์:** `src/types/reservation.js`

```javascript
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  NO_SHOW: 'no_show'  // เพิ่มใหม่
};
```

### 4. อัปเดต App.js

เปลี่ยนจาก `ReservationManagement` เป็น `AdminReservationManagement`:

```javascript
const LazyReservationManagement = lazy(() => import('./components/admin/AdminReservationManagement'));
```

---

## การแก้ไข Firestore Index Issues

### ปัญหาที่พบ
Firestore queries ที่ใช้ `orderBy` ร่วมกับ `where` หลาย conditions ต้องการ composite indexes

### วิธีแก้ไข
เปลี่ยนจาก complex queries เป็น simple queries แล้วทำ filtering/sorting ใน memory

### ไฟล์ที่แก้ไข

#### 1. `src/services/reservationService.js`

**ก่อนแก้ไข:**
```javascript
const q = query(
  reservationsRef,
  and(
    where('equipmentId', '==', equipmentId),
    where('reservationDate', '>=', startOfDay),
    where('reservationDate', '<=', endOfDay),
    where('status', 'in', [...])
  ),
  orderBy('startTime', 'asc')
);
```

**หลังแก้ไข:**
```javascript
const q = query(
  reservationsRef,
  where('equipmentId', '==', equipmentId)
);
// Filter และ sort ใน memory
```

#### 2. `src/hooks/useUnifiedNotifications.js`

**ก่อนแก้ไข:**
```javascript
const usersQuery = query(
  collection(db, 'users'),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc'),
  limit(50)
);
```

**หลังแก้ไข:**
```javascript
const usersQuery = query(
  collection(db, 'users'),
  where('status', '==', 'pending')
);
// Sort และ limit ใน memory
```

---

## Firestore Indexes ที่ Deploy

**ไฟล์:** `firestore.indexes.json`

Indexes สำหรับ reservations collection:
```json
{
  "collectionGroup": "reservations",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "reservations",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "endTime", "order": "ASCENDING" }
  ]
}
```

---

## การทำงานร่วมกับระบบอื่น

### 1. ระบบตั้งค่า (admin/settings)
- ตรวจสอบ `maxAdvanceBookingDays` - จำนวนวันที่จองล่วงหน้าได้
- ตรวจสอบ `closedDates` - วันปิดทำการ

### 2. ระบบยืม-คืน
- ตรวจสอบ conflict กับการยืมในวันเดียวกัน
- ไม่สามารถจองอุปกรณ์ที่กำลังยืมอยู่

### 3. ศูนย์การแจ้งเตือน
- ส่ง notification เมื่อสถานะเปลี่ยน
- แจ้งเตือน admin เมื่อมีการจองใหม่
- แจ้งเตือนผู้ใช้เมื่อการจองถูกอนุมัติ/ปฏิเสธ

---

## Best Practices สำหรับ Firestore Queries

1. **หลีกเลี่ยง composite queries ที่ซับซ้อน** - ใช้ simple query แล้ว filter ใน memory
2. **ไม่ใช้ `and()` operator** - แยก query หรือ filter ใน memory
3. **ระวัง `where('field', 'in', [...])` ร่วมกับ `orderBy`** - ต้องการ composite index
4. **Error handling ที่ดี** - return empty array แทน throw error เพื่อไม่ block UI
