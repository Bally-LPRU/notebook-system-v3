# การแก้ไขปัญหา Firestore Index

## วันที่: 8 ธันวาคม 2567

## ปัญหาที่พบ

เมื่อเข้าหน้า admin พบ error:
```
FirebaseError: The query requires an index. You can create it here:
https://console.firebase.google.com/...
```

## สาเหตุ

Firestore ต้องการ composite index เมื่อใช้:
1. `where()` หลาย conditions พร้อมกัน
2. `where()` ร่วมกับ `orderBy()` บน field ที่ต่างกัน
3. `where('field', 'in', [...])` ร่วมกับ `orderBy()`
4. `and()` operator กับหลาย conditions

## วิธีแก้ไข

### แนวทาง: Simple Query + In-Memory Filtering

แทนที่จะสร้าง composite index จำนวนมาก ใช้วิธี:
1. Query ด้วย condition เดียว (ที่มี selectivity สูงสุด)
2. Filter ข้อมูลที่เหลือใน memory
3. Sort ใน memory

### ข้อดี
- ไม่ต้องรอ index build (อาจใช้เวลาหลายนาที)
- ลดจำนวน indexes ที่ต้องดูแล
- ยืดหยุ่นกว่าในการเปลี่ยน query

### ข้อเสีย
- ใช้ bandwidth มากขึ้น (ดึงข้อมูลมากกว่าที่ต้องการ)
- ใช้ memory ฝั่ง client มากขึ้น
- เหมาะกับ dataset ขนาดเล็ก-กลาง

---

## ไฟล์ที่แก้ไข

### 1. `src/services/reservationService.js`

#### getEquipmentReservations()

**ก่อน:**
```javascript
const q = query(
  reservationsRef,
  and(
    where('equipmentId', '==', equipmentId),
    where('reservationDate', '>=', startOfDay),
    where('reservationDate', '<=', endOfDay),
    where('status', 'in', [PENDING, APPROVED, READY])
  ),
  orderBy('startTime', 'asc')
);
```

**หลัง:**
```javascript
const q = query(
  reservationsRef,
  where('equipmentId', '==', equipmentId)
);

// Filter ใน memory
querySnapshot.forEach((docSnap) => {
  const data = docSnap.data();
  const reservationDate = data.reservationDate?.toDate();
  
  if (reservationDate >= startOfDay && 
      reservationDate <= endOfDay && 
      activeStatuses.includes(data.status)) {
    reservations.push({ id: docSnap.id, ...data });
  }
});

// Sort ใน memory
reservations.sort((a, b) => {
  const aTime = a.startTime?.toDate();
  const bTime = b.startTime?.toDate();
  return aTime - bTime;
});
```

#### updateExpiredReservations()

**ก่อน:**
```javascript
const q = query(
  reservationsRef,
  where('status', 'in', [APPROVED, READY]),
  where('endTime', '<', now),
  orderBy('endTime', 'asc')
);
```

**หลัง:**
```javascript
// Query แยกตาม status
for (const status of [APPROVED, READY]) {
  const q = query(
    reservationsRef,
    where('status', '==', status),
    orderBy('endTime', 'asc')
  );
  
  // Filter expired ใน memory
  querySnapshot.forEach((docSnap) => {
    const endTime = docSnap.data().endTime?.toDate();
    if (endTime < now) {
      expiredDocs.push(docSnap.ref);
    }
  });
}
```

### 2. `src/hooks/useUnifiedNotifications.js`

#### Users Query

**ก่อน:**
```javascript
const usersQuery = query(
  collection(db, 'users'),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc'),
  limit(50)
);
```

**หลัง:**
```javascript
const usersQuery = query(
  collection(db, 'users'),
  where('status', '==', 'pending')
);

// Sort และ limit ใน memory
const users = snapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .sort((a, b) => {
    const dateA = a.createdAt?.toDate() || new Date(0);
    const dateB = b.createdAt?.toDate() || new Date(0);
    return dateB - dateA;
  })
  .slice(0, 50);
```

#### Loans Query

**ก่อน:**
```javascript
const loansQuery = query(
  collection(db, 'loanRequests'),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc'),
  limit(50)
);
```

**หลัง:**
```javascript
const loansQuery = query(
  collection(db, 'loanRequests'),
  where('status', '==', 'pending')
);
// Sort และ limit ใน memory
```

#### Overdue Loans Query

**ก่อน:**
```javascript
const overdueQuery = query(
  collection(db, 'loanRequests'),
  where('status', '==', 'approved'),
  where('expectedReturnDate', '<', now),
  orderBy('expectedReturnDate', 'asc'),
  limit(50)
);
```

**หลัง:**
```javascript
const approvedLoansQuery = query(
  collection(db, 'loanRequests'),
  where('status', '==', 'approved')
);

// Filter overdue ใน memory
const overdue = snapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(loan => {
    const returnDate = loan.expectedReturnDate?.toDate();
    return returnDate < now;
  })
  .sort((a, b) => {
    const dateA = a.expectedReturnDate?.toDate();
    const dateB = b.expectedReturnDate?.toDate();
    return dateA - dateB;
  })
  .slice(0, 50);
```

---

## Indexes ที่ Deploy แล้ว

```bash
npx firebase deploy --only firestore:indexes
```

ดู indexes ทั้งหมดใน `firestore.indexes.json`

---

## Best Practices

1. **เลือก field ที่มี selectivity สูง** - field ที่กรองข้อมูลได้มากที่สุด
2. **ใช้ single-field index** - Firestore สร้างให้อัตโนมัติ
3. **Error handling** - return empty array แทน throw error
4. **Limit data** - ใช้ `.slice()` ใน memory เพื่อจำกัดจำนวน
5. **Cache results** - ถ้า query บ่อย ควร cache ผลลัพธ์
