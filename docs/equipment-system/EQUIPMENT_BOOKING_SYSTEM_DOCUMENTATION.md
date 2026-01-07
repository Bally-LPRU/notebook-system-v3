# เอกสารระบบการจองอุปกรณ์ (Equipment Booking System)

## 📋 ภาพรวมระบบ

ระบบการจองอุปกรณ์เป็นส่วนหนึ่งของระบบยืม-คืนโน็คบุคและอุปกรณ์คอมพิวเตอร์ ออกแบบมาเพื่อจัดการการยืม การจองล่วงหน้า และการคืนอุปกรณ์อย่างมีประสิทธิภาพ โดยใช้ Firebase Firestore เป็นฐานข้อมูลหลัก

---

## 🏗️ สถาปัตยกรรมระบบ

### โครงสร้างไฟล์หลัก

```
src/
├── services/
│   ├── equipmentBookingService.js    # Service หลักสำหรับการจอง
│   ├── reservationService.js         # Service จัดการการจองล่วงหน้า
│   ├── loanRequestService.js         # Service จัดการคำขอยืม
│   └── equipmentService.js           # Service จัดการข้อมูลอุปกรณ์
├── components/
│   ├── reservations/
│   │   ├── ReservationForm.js        # ฟอร์มจองอุปกรณ์
│   │   ├── ReservationCalendar.js    # ปฏิทินแสดงการจอง
│   │   └── ReservationPage.js        # หน้าจัดการการจอง
│   └── loan/
│       ├── EnhancedLoanRequestForm.js # ฟอร์มขอยืมอุปกรณ์
│       └── LoanHistoryPage.js        # ประวัติการยืม
├── hooks/
│   ├── useLoanRequests.js            # Hook สำหรับคำขอยืม
│   └── useLoanHistory.js             # Hook สำหรับประวัติการยืม
└── types/
    └── reservation.js                # Type definitions สำหรับการจอง
```

---

## 📊 โมเดลข้อมูล (Data Models)

### 1. Equipment Collection (`equipmentManagement`)

```javascript
{
  id: string,                    // รหัสอุปกรณ์
  name: string,                  // ชื่ออุปกรณ์
  brand: string,                 // ยี่ห้อ
  model: string,                 // รุ่น
  serialNumber: string,          // หมายเลขซีเรียล
  status: string,                // สถานะ: available, borrowed, maintenance, retired
  category: string,              // หมวดหมู่
  imageUrl: string,              // URL รูปภาพ
  currentLoan: {                 // ข้อมูลการยืมปัจจุบัน (ถ้ามี)
    loanId: string,
    userId: string,
    userName: string,
    borrowedAt: timestamp,
    expectedReturnDate: timestamp
  },
  reservations: [{               // รายการจองล่วงหน้า
    id: string,
    userId: string,
    userName: string,
    startDate: timestamp,
    endDate: timestamp,
    status: string
  }],
  version: number,               // สำหรับ Optimistic Locking
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. Loan Requests Collection (`loanRequests`)

```javascript
{
  id: string,                    // รหัสคำขอยืม
  equipmentId: string,           // รหัสอุปกรณ์
  equipmentName: string,         // ชื่ออุปกรณ์ (denormalized)
  equipmentCategory: string,     // หมวดหมู่ (denormalized)
  userId: string,                // รหัสผู้ยืม
  userName: string,              // ชื่อผู้ยืม (denormalized)
  userEmail: string,             // อีเมลผู้ยืม
  borrowDate: timestamp,         // วันที่ยืม
  expectedReturnDate: timestamp, // วันที่คาดว่าจะคืน
  actualReturnDate: timestamp,   // วันที่คืนจริง
  purpose: string,               // วัตถุประสงค์
  notes: string,                 // หมายเหตุ
  status: string,                // สถานะ: pending, approved, rejected, borrowed, returned, overdue
  approvedBy: string,            // ผู้อนุมัติ
  approvedAt: timestamp,         // วันที่อนุมัติ
  rejectionReason: string,       // เหตุผลปฏิเสธ
  searchKeywords: [string],      // คำค้นหา
  equipmentSnapshot: object,     // ข้อมูลอุปกรณ์ ณ เวลาที่ยืม
  userSnapshot: object,          // ข้อมูลผู้ใช้ ณ เวลาที่ยืม
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. Reservations Collection (`reservations`)

```javascript
{
  id: string,                    // รหัสการจอง
  equipmentId: string,           // รหัสอุปกรณ์
  equipmentName: string,         // ชื่ออุปกรณ์
  userId: string,                // รหัสผู้จอง
  userName: string,              // ชื่อผู้จอง
  reservationDate: timestamp,    // วันที่จอง
  startTime: timestamp,          // เวลาเริ่มต้น
  endTime: timestamp,            // เวลาสิ้นสุด
  expectedReturnDate: timestamp, // วันที่คาดว่าจะคืน
  purpose: string,               // วัตถุประสงค์
  notes: string,                 // หมายเหตุ
  status: string,                // สถานะ: pending, approved, ready, completed, cancelled, expired
  approvedBy: string,            // ผู้อนุมัติ
  approvedAt: timestamp,         // วันที่อนุมัติ
  notificationSent: boolean,     // ส่งการแจ้งเตือนแล้วหรือไม่
  convertedToLoanId: string,     // รหัสคำขอยืมที่แปลงมา
  convertedAt: timestamp,        // วันที่แปลงเป็นคำขอยืม
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 🔄 สถานะและ Flow การทำงาน

### สถานะอุปกรณ์ (Equipment Status)

| สถานะ | คำอธิบาย | สามารถยืมได้ | สามารถจองได้ |
|-------|----------|-------------|-------------|
| `available` | ว่าง พร้อมใช้งาน | ✅ | ✅ |
| `borrowed` | ถูกยืมอยู่ | ❌ | ✅ (จองล่วงหน้า) |
| `maintenance` | ซ่อมบำรุง | ❌ | ❌ |
| `retired` | ปลดระวาง | ❌ | ❌ |

### สถานะคำขอยืม (Loan Request Status)

```
pending → approved → borrowed → returned
    ↓         ↓          ↓
rejected   cancelled   overdue → returned
```

| สถานะ | คำอธิบาย |
|-------|----------|
| `pending` | รอการอนุมัติ |
| `approved` | อนุมัติแล้ว รอรับอุปกรณ์ |
| `rejected` | ถูกปฏิเสธ |
| `borrowed` | กำลังยืมอยู่ |
| `returned` | คืนแล้ว |
| `overdue` | เกินกำหนดคืน |

### สถานะการจอง (Reservation Status)

```
pending → approved → ready → completed
    ↓         ↓        ↓
rejected  cancelled  expired
```

| สถานะ | คำอธิบาย |
|-------|----------|
| `pending` | รอการอนุมัติ |
| `approved` | อนุมัติแล้ว |
| `ready` | พร้อมรับอุปกรณ์ |
| `completed` | เสร็จสิ้น |
| `cancelled` | ยกเลิก |
| `expired` | หมดอายุ |

---

## 🛡️ การป้องกัน Race Condition

### ปัญหาที่อาจเกิดขึ้น

เมื่อมีผู้ใช้หลายคนพยายามยืม/จองอุปกรณ์ชิ้นเดียวกันพร้อมกัน อาจเกิดปัญหา:

```
เวลา    User A                  User B
10:00   คลิก "ยืม"             
10:00   ตรวจสอบว่าง ✅          คลิก "ยืม"
10:01   กำลังบันทึก...          ตรวจสอบว่าง ✅ (ยังไม่เห็นของ A)
10:02   บันทึกสำเร็จ           กำลังบันทึก...
10:03                          บันทึกสำเร็จ (ทับของ A!)
```

### วิธีแก้ไข: Firestore Transactions

```javascript
// EquipmentBookingService.borrowEquipment()
static async borrowEquipment(equipmentId, userId, borrowData) {
  const equipmentRef = doc(db, 'equipmentManagement', equipmentId);
  
  const result = await runTransaction(db, async (transaction) => {
    // 1. อ่านข้อมูลปัจจุบัน
    const equipmentDoc = await transaction.get(equipmentRef);
    const equipment = equipmentDoc.data();
    
    // 2. ตรวจสอบสถานะ
    if (equipment.status !== 'available') {
      throw new Error('อุปกรณ์ไม่ว่าง');
    }
    
    // 3. สร้าง loan request
    const loanRef = doc(collection(db, 'loanRequests'));
    transaction.set(loanRef, { ... });
    
    // 4. อัพเดทสถานะอุปกรณ์
    transaction.update(equipmentRef, {
      status: 'borrowed',
      version: (equipment.version || 0) + 1
    });
    
    return { loanId: loanRef.id };
  });
  
  return result;
}
```

### Optimistic Locking

ใช้ `version` field เพื่อตรวจสอบว่าข้อมูลถูกแก้ไขระหว่างทางหรือไม่:

```javascript
transaction.update(equipmentRef, {
  status: 'borrowed',
  version: (equipment.version || 0) + 1,  // เพิ่ม version ทุกครั้งที่อัพเดท
  updatedAt: serverTimestamp()
});
```

---

## 📝 API Reference

### EquipmentBookingService

#### `borrowEquipment(equipmentId, userId, borrowData)`
ยืมอุปกรณ์ทันที (ใช้ Transaction)

```javascript
const result = await EquipmentBookingService.borrowEquipment(
  'eq001',
  'user123',
  {
    userName: 'สมชาย ใจดี',
    userEmail: 'somchai@example.com',
    startDate: new Date(),
    endDate: new Date('2025-01-30'),
    purpose: 'ใช้งานโปรเจค'
  }
);
// Returns: { success: true, loanId: 'loan123' }
```

#### `reserveEquipment(equipmentId, userId, reservationData)`
จองอุปกรณ์ล่วงหน้า

```javascript
const result = await EquipmentBookingService.reserveEquipment(
  'eq001',
  'user123',
  {
    userName: 'สมชาย ใจดี',
    userEmail: 'somchai@example.com',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-02-05'),
    purpose: 'ใช้งานสัมมนา'
  }
);
// Returns: { success: true, reservationId: 'res123' }
```

#### `checkDateConflict(equipmentId, startDate, endDate, excludeId)`
ตรวจสอบว่ามีการจองที่ทับซ้อนหรือไม่

```javascript
const hasConflict = await EquipmentBookingService.checkDateConflict(
  'eq001',
  new Date('2025-02-01'),
  new Date('2025-02-05')
);
// Returns: true/false
```

#### `getEquipmentStatus(equipmentId)`
ดึงสถานะอุปกรณ์พร้อมรายละเอียด

```javascript
const status = await EquipmentBookingService.getEquipmentStatus('eq001');
// Returns: {
//   status: 'available',
//   message: 'ว่าง - พร้อมใช้งาน',
//   canBorrow: true,
//   canReserve: true
// }
```

#### `getUnavailableDates(equipmentId, startDate, endDate)`
ดึงช่วงวันที่ไม่ว่างของอุปกรณ์

```javascript
const unavailable = await EquipmentBookingService.getUnavailableDates(
  'eq001',
  new Date('2025-01-01'),
  new Date('2025-12-31')
);
// Returns: [{ type: 'loan', startDate, endDate, userName }, ...]
```

### ReservationService

#### `createReservation(reservationData, userId)`
สร้างการจองใหม่

#### `updateReservationStatus(reservationId, newStatus, updatedBy)`
อัพเดทสถานะการจอง

#### `cancelReservation(reservationId, userId)`
ยกเลิกการจอง

#### `getAvailableTimeSlots(equipmentId, date)`
ดึงช่วงเวลาที่ว่างสำหรับวันที่กำหนด

#### `convertToLoan(reservationId, convertedBy)`
แปลงการจองเป็นคำขอยืม

### LoanRequestService

#### `createLoanRequest(loanRequestData, userId)`
สร้างคำขอยืมใหม่

#### `approveLoanRequest(loanRequestId, approvedBy)`
อนุมัติคำขอยืม

#### `rejectLoanRequest(loanRequestId, rejectionReason, rejectedBy)`
ปฏิเสธคำขอยืม

#### `markAsPickedUp(loanRequestId, pickedUpBy)`
บันทึกการรับอุปกรณ์

#### `markAsReturned(loanRequestId, returnedBy, returnData)`
บันทึกการคืนอุปกรณ์

---

## 🎨 UI/UX Guidelines

### การป้องกัน Double-Click

```javascript
const [isProcessing, setIsProcessing] = useState(false);

const handleBorrow = async () => {
  setIsProcessing(true);
  try {
    await borrowEquipment(equipmentId, userId, borrowData);
    // Success
  } catch (error) {
    // Show error
  } finally {
    setIsProcessing(false);
  }
};

return (
  <button 
    onClick={handleBorrow}
    disabled={isProcessing}
    className={isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
  >
    {isProcessing ? 'กำลังดำเนินการ...' : 'ยืม'}
  </button>
);
```

### Real-time Status Update

```javascript
useEffect(() => {
  const unsubscribe = onSnapshot(
    doc(db, 'equipmentManagement', equipmentId),
    (doc) => {
      const data = doc.data();
      setEquipmentStatus(data.status);
      
      if (data.status !== 'available') {
        setCanBorrow(false);
      }
    }
  );
  
  return () => unsubscribe();
}, [equipmentId]);
```

### Error Messages

| Error | Message |
|-------|---------|
| อุปกรณ์ไม่ว่าง | "อุปกรณ์ไม่ว่าง - มีผู้อื่นยืมไปแล้ว กรุณาเลือกอุปกรณ์อื่นหรือจองล่วงหน้า" |
| มีการจองทับซ้อน | "มีการจองในช่วงเวลานี้แล้ว กรุณาเลือกวันอื่น" |
| ไม่พบอุปกรณ์ | "ไม่พบอุปกรณ์ที่ต้องการ" |
| ไม่มีสิทธิ์ | "คุณไม่มีสิทธิ์ดำเนินการนี้" |

---

## 🔒 Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Equipment - อ่านได้ทุกคน, เขียนได้เฉพาะ admin
    match /equipmentManagement/{equipmentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Loan Requests - อ่าน/เขียนได้เฉพาะเจ้าของหรือ admin
    match /loanRequests/{requestId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Reservations - อ่าน/เขียนได้เฉพาะเจ้าของหรือ admin
    match /reservations/{reservationId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

---

## 📈 Performance Optimization

### Denormalization

เก็บข้อมูลที่ใช้บ่อยไว้ใน document เดียวกันเพื่อลด reads:

```javascript
// แทนที่จะ query equipment ทุกครั้ง
const loanRequest = {
  equipmentId: 'eq001',
  // Denormalized fields
  equipmentName: equipment.name,
  equipmentCategory: equipment.category,
  equipmentSnapshot: {
    name: equipment.name,
    brand: equipment.brand,
    model: equipment.model,
    imageUrl: equipment.imageUrl
  }
};
```

### Pagination

```javascript
const result = await LoanRequestService.getLoanRequests({
  status: 'pending',
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
```

### Indexes

สร้าง composite indexes สำหรับ queries ที่ใช้บ่อย:

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "loanRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reservations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "equipmentId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 🧪 Testing

### Unit Tests

```javascript
// src/services/__tests__/equipmentBookingService.test.js
describe('EquipmentBookingService', () => {
  test('should prevent double booking', async () => {
    // Mock Firestore transaction
    const result = await EquipmentBookingService.borrowEquipment(
      'eq001', 'user1', borrowData
    );
    
    // Second attempt should fail
    await expect(
      EquipmentBookingService.borrowEquipment('eq001', 'user2', borrowData)
    ).rejects.toThrow('อุปกรณ์ไม่ว่าง');
  });
  
  test('should detect date conflicts', async () => {
    const hasConflict = await EquipmentBookingService.checkDateConflict(
      'eq001',
      new Date('2025-01-15'),
      new Date('2025-01-20')
    );
    
    expect(hasConflict).toBe(true);
  });
});
```

---

## 📚 Related Documentation

- [Concurrent Booking Prevention](./concurrent-booking-prevention.md)
- [Loan System Documentation](../loan-system/README.md)
- [Notification System](../notification-system/UNIFIED_ADMIN_NOTIFICATION_SYSTEM.md)
- [Admin Settings System](../admin-system/RESERVATION_MANAGEMENT_IMPLEMENTATION.md)

---

## 🔄 Changelog

| วันที่ | เวอร์ชัน | การเปลี่ยนแปลง |
|--------|---------|---------------|
| 2025-12-25 | 1.0.0 | สร้างเอกสารเริ่มต้น |

---

## 👥 Contributors

- ทีมพัฒนาระบบยืม-คืนอุปกรณ์

---

*เอกสารนี้จัดทำขึ้นเพื่อใช้เป็นแนวทางในการพัฒนาและบำรุงรักษาระบบการจองอุปกรณ์*
