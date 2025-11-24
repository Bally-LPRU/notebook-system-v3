# การป้องกันการยืม/จองอุปกรณ์พร้อมกัน (Concurrent Booking Prevention)

## 🎯 ปัญหา (Race Condition)

เมื่อมีผู้ใช้หลายคนพยายามยืม/จองอุปกรณ์ชิ้นเดียวกันพร้อมกัน อาจเกิดปัญหา:

```
เวลา    User A                  User B
10:00   คลิก "ยืม"             
10:00   ตรวจสอบว่าง ✅          คลิก "ยืม"
10:01   กำลังบันทึก...          ตรวจสอบว่าง ✅ (ยังไม่เห็นของ A)
10:02   บันทึกสำเร็จ           กำลังบันทึก...
10:03                          บันทึกสำเร็จ (ทับของ A!)
```

**ผลลัพธ์:** อุปกรณ์ถูกยืมโดย 2 คนพร้อมกัน! ❌

## ✅ วิธีแก้ไข: Firestore Transactions

### 1. ใช้ Firestore Transaction

Firestore Transaction รับประกันว่า:
- ✅ อ่านและเขียนเป็น atomic operation
- ✅ ถ้ามีคนแก้ไขข้อมูลระหว่างทาง transaction จะ retry อัตโนมัติ
- ✅ ถ้า retry ไม่สำเร็จจะ throw error

```javascript
import { runTransaction } from 'firebase/firestore';

async function borrowEquipment(equipmentId, userId, borrowData) {
  const equipmentRef = doc(db, 'equipmentManagement', equipmentId);
  
  try {
    await runTransaction(db, async (transaction) => {
      // 1. อ่านข้อมูลปัจจุบัน
      const equipmentDoc = await transaction.get(equipmentRef);
      
      if (!equipmentDoc.exists()) {
        throw new Error('ไม่พบอุปกรณ์');
      }
      
      const equipment = equipmentDoc.data();
      
      // 2. ตรวจสอบสถานะ
      if (equipment.status !== 'available') {
        throw new Error('อุปกรณ์ไม่ว่าง');
      }
      
      // 3. ตรวจสอบว่ามีการจองที่ทับซ้อนหรือไม่
      const hasConflict = await checkDateConflict(
        equipmentId, 
        borrowData.startDate, 
        borrowData.endDate
      );
      
      if (hasConflict) {
        throw new Error('มีการจองในช่วงเวลานี้แล้ว');
      }
      
      // 4. อัพเดทสถานะอุปกรณ์
      transaction.update(equipmentRef, {
        status: 'borrowed',
        currentBorrower: userId,
        borrowedAt: serverTimestamp(),
        expectedReturnDate: borrowData.endDate
      });
      
      // 5. สร้าง loan request
      const loanRef = doc(collection(db, 'loanRequests'));
      transaction.set(loanRef, {
        equipmentId,
        userId,
        ...borrowData,
        status: 'approved',
        createdAt: serverTimestamp()
      });
    });
    
    return { success: true };
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}
```

### 2. ใช้ Optimistic Locking

เพิ่ม version field เพื่อตรวจสอบว่าข้อมูลถูกแก้ไขหรือไม่:

```javascript
// Equipment document structure
{
  id: 'eq001',
  name: 'MacBook Pro',
  status: 'available',
  version: 5,  // เพิ่ม version field
  updatedAt: timestamp
}

// Transaction with version check
await runTransaction(db, async (transaction) => {
  const equipmentDoc = await transaction.get(equipmentRef);
  const equipment = equipmentDoc.data();
  const currentVersion = equipment.version || 0;
  
  // ตรวจสอบ version
  if (equipment.version !== expectedVersion) {
    throw new Error('ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณาลองใหม่');
  }
  
  // อัพเดทพร้อมเพิ่ม version
  transaction.update(equipmentRef, {
    status: 'borrowed',
    version: currentVersion + 1,
    updatedAt: serverTimestamp()
  });
});
```

### 3. ใช้ Firestore Security Rules

ป้องกันการเขียนทับข้อมูลด้วย rules:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Equipment rules
    match /equipmentManagement/{equipmentId} {
      // อนุญาตให้อ่านได้ทุกคน
      allow read: if request.auth != null;
      
      // อนุญาตให้เขียนได้เฉพาะเมื่อ:
      // 1. Status เป็น available
      // 2. ไม่มีการจองที่ทับซ้อน
      allow update: if request.auth != null
        && resource.data.status == 'available'
        && request.resource.data.status == 'borrowed'
        && request.resource.data.currentBorrower == request.auth.uid;
    }
    
    // Loan requests rules
    match /loanRequests/{loanId} {
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && !exists(/databases/$(database)/documents/loanRequests/$(loanId));
    }
  }
}
```

### 4. ใช้ Distributed Lock (Advanced)

สำหรับระบบที่มี traffic สูงมาก:

```javascript
// Lock service using Firestore
class DistributedLock {
  constructor(db, lockId, ttl = 30000) {
    this.db = db;
    this.lockId = lockId;
    this.ttl = ttl;
    this.lockRef = doc(db, 'locks', lockId);
  }
  
  async acquire() {
    const lockDoc = await getDoc(this.lockRef);
    const now = Date.now();
    
    // ถ้าไม่มี lock หรือ lock หมดอายุ
    if (!lockDoc.exists() || lockDoc.data().expiresAt < now) {
      try {
        await setDoc(this.lockRef, {
          ownerId: this.generateOwnerId(),
          acquiredAt: now,
          expiresAt: now + this.ttl
        });
        return true;
      } catch (error) {
        return false;
      }
    }
    
    return false;
  }
  
  async release() {
    await deleteDoc(this.lockRef);
  }
  
  generateOwnerId() {
    return `${Date.now()}-${Math.random()}`;
  }
}

// ใช้งาน
async function borrowEquipmentWithLock(equipmentId, userId, borrowData) {
  const lock = new DistributedLock(db, `equipment-${equipmentId}`);
  
  try {
    // พยายาม acquire lock
    const acquired = await lock.acquire();
    if (!acquired) {
      throw new Error('อุปกรณ์กำลังถูกดำเนินการโดยผู้อื่น กรุณารอสักครู่');
    }
    
    // ทำงานหลัก
    await borrowEquipment(equipmentId, userId, borrowData);
    
  } finally {
    // ปล่อย lock เสมอ
    await lock.release();
  }
}
```

## 🎨 UI/UX สำหรับป้องกัน Race Condition

### 1. Disable Button หลังคลิก

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
  >
    {isProcessing ? 'กำลังดำเนินการ...' : 'ยืม'}
  </button>
);
```

### 2. แสดง Loading Overlay

```javascript
{isProcessing && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      <p className="mt-4">กำลังดำเนินการ...</p>
    </div>
  </div>
)}
```

### 3. Real-time Status Update

```javascript
// ใช้ Firestore onSnapshot เพื่อ listen การเปลี่ยนแปลง
useEffect(() => {
  const unsubscribe = onSnapshot(
    doc(db, 'equipmentManagement', equipmentId),
    (doc) => {
      const data = doc.data();
      setEquipmentStatus(data.status);
      
      // ถ้าสถานะเปลี่ยนเป็นไม่ว่าง ปิดปุ่มยืม
      if (data.status !== 'available') {
        setCanBorrow(false);
      }
    }
  );
  
  return () => unsubscribe();
}, [equipmentId]);
```

### 4. แสดง Error Message ที่ชัดเจน

```javascript
try {
  await borrowEquipment(equipmentId, userId, borrowData);
} catch (error) {
  if (error.message.includes('ไม่ว่าง')) {
    showNotification({
      type: 'error',
      title: 'อุปกรณ์ไม่ว่าง',
      message: 'มีผู้อื่นยืมอุปกรณ์นี้ไปแล้ว กรุณาเลือกอุปกรณ์อื่น'
    });
  } else if (error.message.includes('ทับซ้อน')) {
    showNotification({
      type: 'error',
      title: 'มีการจองแล้ว',
      message: 'มีการจองในช่วงเวลานี้แล้ว กรุณาเลือกวันอื่น'
    });
  }
}
```

## 📊 สถานะอุปกรณ์ที่ซับซ้อน

### Equipment Status Model

```javascript
// Equipment document
{
  id: 'eq001',
  name: 'MacBook Pro',
  status: 'available', // available, borrowed, maintenance, retired
  
  // Current loan info
  currentLoan: {
    userId: 'user123',
    userName: 'สมชาย ใจดี',
    borrowedAt: timestamp,
    expectedReturnDate: timestamp
  },
  
  // Upcoming reservations
  reservations: [
    {
      id: 'res001',
      userId: 'user456',
      userName: 'สมหญิง ใจงาม',
      startDate: timestamp,
      endDate: timestamp,
      status: 'confirmed'
    }
  ],
  
  version: 10,
  updatedAt: timestamp
}
```

### Status Display Logic

```javascript
function getEquipmentDisplayStatus(equipment) {
  const now = new Date();
  
  // 1. ถูกยืมอยู่
  if (equipment.status === 'borrowed' && equipment.currentLoan) {
    const returnDate = equipment.currentLoan.expectedReturnDate.toDate();
    const hasUpcomingReservation = equipment.reservations?.some(
      r => r.status === 'confirmed' && r.startDate.toDate() > now
    );
    
    return {
      status: 'borrowed',
      message: `ถูกยืมโดย ${equipment.currentLoan.userName}`,
      returnDate: returnDate,
      canReserve: !hasUpcomingReservation,
      nextAvailable: hasUpcomingReservation 
        ? equipment.reservations[0].endDate.toDate()
        : returnDate
    };
  }
  
  // 2. ว่าง แต่มีการจอง
  if (equipment.status === 'available' && equipment.reservations?.length > 0) {
    const nextReservation = equipment.reservations
      .filter(r => r.status === 'confirmed')
      .sort((a, b) => a.startDate - b.startDate)[0];
    
    if (nextReservation) {
      const reservationStart = nextReservation.startDate.toDate();
      
      // ถ้าการจองเริ่มในอนาคต
      if (reservationStart > now) {
        return {
          status: 'available-with-reservation',
          message: 'ว่าง (มีการจองล่วงหน้า)',
          canBorrow: true,
          canReserve: true,
          nextReservation: {
            userName: nextReservation.userName,
            startDate: reservationStart,
            endDate: nextReservation.endDate.toDate()
          }
        };
      }
    }
  }
  
  // 3. ว่างเปล่า
  if (equipment.status === 'available') {
    return {
      status: 'available',
      message: 'ว่าง - พร้อมใช้งาน',
      canBorrow: true,
      canReserve: true
    };
  }
  
  // 4. ซ่อมบำรุง
  if (equipment.status === 'maintenance') {
    return {
      status: 'maintenance',
      message: 'อยู่ระหว่างซ่อมบำรุง',
      canBorrow: false,
      canReserve: false
    };
  }
  
  return {
    status: 'unknown',
    message: 'ไม่ทราบสถานะ',
    canBorrow: false,
    canReserve: false
  };
}
```

## 🔄 Flow การยืม/จองที่ปลอดภัย

### 1. User คลิก "ยืม"

```
1. Disable ปุ่ม + แสดง loading
2. เรียก API borrowEquipment()
3. API ใช้ Transaction:
   a. อ่านข้อมูลอุปกรณ์
   b. ตรวจสอบ status === 'available'
   c. ตรวจสอบไม่มีการจองที่ทับซ้อน
   d. อัพเดท status เป็น 'borrowed'
   e. สร้าง loan request
4. ถ้าสำเร็จ:
   - แสดง success message
   - Redirect ไปหน้า "คำขอของฉัน"
5. ถ้าล้มเหลว:
   - แสดง error message
   - Enable ปุ่มกลับมา
   - Refresh ข้อมูลอุปกรณ์
```

### 2. User คลิก "จอง"

```
1. เปิด modal เลือกวันที่
2. User เลือกวันที่เริ่ม-สิ้นสุด
3. ตรวจสอบว่ามีการจองที่ทับซ้อนหรือไม่
4. ถ้าไม่ทับซ้อน:
   - Disable ปุ่ม + แสดง loading
   - เรียก API createReservation()
   - API ใช้ Transaction:
     a. อ่านข้อมูลอุปกรณ์
     b. ตรวจสอบไม่มีการจองที่ทับซ้อน
     c. เพิ่ม reservation ใน array
     d. อัพเดท version
   - แสดง success message
5. ถ้าทับซ้อน:
   - แสดง error message
   - แสดงวันที่ว่าง
```

## 📝 สรุป Best Practices

### ✅ ควรทำ:

1. **ใช้ Firestore Transaction** - รับประกัน atomic operations
2. **Disable UI ระหว่างดำเนินการ** - ป้องกัน double-click
3. **แสดง Loading State** - ให้ user รู้ว่ากำลังทำงาน
4. **Real-time Updates** - ใช้ onSnapshot เพื่อ sync สถานะ
5. **Error Handling ที่ดี** - แสดง error message ที่ชัดเจน
6. **Retry Logic** - Transaction จะ retry อัตโนมัติ
7. **Version Control** - ใช้ version field เพื่อตรวจสอบ
8. **Security Rules** - ป้องกันการเขียนทับที่ไม่ถูกต้อง

### ❌ ไม่ควรทำ:

1. **อ่านแล้วเขียนแยกกัน** - จะเกิด race condition
2. **ไม่ disable UI** - user อาจคลิกซ้ำ
3. **ไม่มี error handling** - user ไม่รู้ว่าเกิดอะไรขึ้น
4. **ไม่ใช้ transaction** - ข้อมูลอาจไม่ consistent
5. **ไม่ตรวจสอบสถานะก่อนทำงาน** - อาจเขียนทับข้อมูลผิด

## 🎯 ผลลัพธ์ที่คาดหวัง

- ✅ ไม่มีการยืม/จองซ้ำซ้อน
- ✅ ข้อมูลถูกต้องและ consistent
- ✅ User experience ที่ดี
- ✅ Error handling ที่ชัดเจน
- ✅ Real-time updates
- ✅ ปลอดภัยจาก race conditions
