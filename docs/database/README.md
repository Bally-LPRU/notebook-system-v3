# Database Documentation

เอกสารเกี่ยวกับโครงสร้างฐานข้อมูล

## 📁 เอกสารในโฟลเดอร์นี้

### Schema Documentation
- `users-collection-schema.md` - Schema ของ Users Collection

## 🗄️ Collections

### 1. users
เก็บข้อมูลผู้ใช้ทั้งหมด

**Fields:**
```javascript
{
  uid: string,              // Firebase Auth UID
  email: string,            // อีเมล
  displayName: string,      // ชื่อแสดง
  firstName: string,        // ชื่อจริง
  lastName: string,         // นามสกุล
  department: object,       // แผนก
  role: string,             // บทบาท (user/admin)
  status: string,           // สถานะ (pending/approved/rejected/suspended)
  photoURL: string,         // รูปโปรไฟล์
  createdAt: timestamp,     // วันที่สร้าง
  updatedAt: timestamp,     // วันที่อัปเดต
  approvedBy: string,       // UID ผู้อนุมัติ
  approvedAt: timestamp     // วันที่อนุมัติ
}
```

### 2. equipment
เก็บข้อมูลอุปกรณ์

**Fields:**
```javascript
{
  id: string,               // ID อุปกรณ์
  name: string,             // ชื่ออุปกรณ์
  description: string,      // รายละเอียด
  category: string,         // หมวดหมู่
  status: string,           // สถานะ (available/borrowed/maintenance)
  quantity: number,         // จำนวน
  images: array,            // รูปภาพ
  specifications: object,   // ข้อมูลจำเพาะ
  createdAt: timestamp,     // วันที่สร้าง
  updatedAt: timestamp,     // วันที่อัปเดต
  createdBy: string         // UID ผู้สร้าง
}
```

### 3. categories
เก็บหมวดหมู่อุปกรณ์

**Fields:**
```javascript
{
  id: string,               // ID หมวดหมู่
  name: string,             // ชื่อหมวดหมู่
  description: string,      // รายละเอียด
  icon: string,             // ไอคอน
  color: string,            // สี
  order: number,            // ลำดับการแสดง
  active: boolean,          // เปิดใช้งาน
  createdAt: timestamp      // วันที่สร้าง
}
```

### 4. loanRequests
เก็บคำขอยืมอุปกรณ์

**Fields:**
```javascript
{
  id: string,               // ID คำขอ
  userId: string,           // UID ผู้ยืม
  userName: string,         // ชื่อผู้ยืม (denormalized)
  equipmentId: string,      // ID อุปกรณ์
  equipmentName: string,    // ชื่ออุปกรณ์ (denormalized)
  quantity: number,         // จำนวนที่ยืม
  borrowDate: timestamp,    // วันที่ยืม
  returnDate: timestamp,    // วันที่คืน
  expectedReturnDate: timestamp, // วันที่ควรคืน
  status: string,           // สถานะ (pending/approved/rejected/returned)
  purpose: string,          // วัตถุประสงค์
  notes: string,            // หมายเหตุ
  createdAt: timestamp,     // วันที่สร้าง
  updatedAt: timestamp,     // วันที่อัปเดต
  approvedBy: string,       // UID ผู้อนุมัติ
  approvedAt: timestamp     // วันที่อนุมัติ
}
```

### 5. reservations
เก็บการจองอุปกรณ์

**Fields:**
```javascript
{
  id: string,               // ID การจอง
  userId: string,           // UID ผู้จอง
  userName: string,         // ชื่อผู้จอง (denormalized)
  equipmentId: string,      // ID อุปกรณ์
  equipmentName: string,    // ชื่ออุปกรณ์ (denormalized)
  startTime: timestamp,     // เวลาเริ่มต้น
  endTime: timestamp,       // เวลาสิ้นสุด
  status: string,           // สถานะ (pending/approved/rejected/cancelled)
  purpose: string,          // วัตถุประสงค์
  createdAt: timestamp,     // วันที่สร้าง
  updatedAt: timestamp      // วันที่อัปเดต
}
```

### 6. settings
เก็บการตั้งค่าระบบ

**Fields:**
```javascript
{
  id: string,               // ID การตั้งค่า
  key: string,              // Key
  value: any,               // ค่า
  type: string,             // ประเภท
  description: string,      // คำอธิบาย
  updatedAt: timestamp,     // วันที่อัปเดต
  updatedBy: string         // UID ผู้อัปเดต
}
```

### 7. notifications
เก็บการแจ้งเตือน

**Fields:**
```javascript
{
  id: string,               // ID การแจ้งเตือน
  userId: string,           // UID ผู้รับ
  type: string,             // ประเภท
  title: string,            // หัวข้อ
  message: string,          // ข้อความ
  read: boolean,            // อ่านแล้ว
  data: object,             // ข้อมูลเพิ่มเติม
  createdAt: timestamp      // วันที่สร้าง
}
```

## 🔍 Indexes

### Composite Indexes
```javascript
// loanRequests
- status + createdAt (DESC)
- userId + status + createdAt (DESC)
- equipmentId + status + borrowDate (DESC)
- status + expectedReturnDate (ASC)

// equipment
- category + status + createdAt (DESC)
- status + name (ASC)

// users
- status + createdAt (DESC)
- role + status + createdAt (DESC)
```

## 🔒 Security Rules

### ตัวอย่าง Rules
```javascript
// users collection
match /users/{userId} {
  // อ่านได้เฉพาะตัวเองหรือ admin
  allow read: if request.auth.uid == userId || isAdmin();
  
  // เขียนได้เฉพาะตัวเอง
  allow write: if request.auth.uid == userId;
}

// equipment collection
match /equipment/{equipmentId} {
  // อ่านได้ทุกคน (authenticated)
  allow read: if request.auth != null;
  
  // เขียนได้เฉพาะ admin
  allow write: if isAdmin();
}
```

## 📊 Data Migration

### Scripts
- `scripts/migrate-loan-denormalized-fields.js` - Migrate loan fields
- `scripts/migrate-loan-request-denormalization.js` - Migrate loan requests
- `scripts/migrate-loan-request-search-keywords.js` - Migrate search keywords

## 🔗 เอกสารที่เกี่ยวข้อง

- [Firebase Setup](../firebase-setup/)
- [Admin System](../admin-system/)
- [Equipment System](../equipment-system/)
- [Loan System](../loan-system/)

## 💡 Best Practices

### 1. Denormalization
เก็บข้อมูลที่ใช้บ่อยซ้ำเพื่อลด reads
- userName ใน loanRequests
- equipmentName ใน loanRequests

### 2. Indexing
สร้าง indexes สำหรับ queries ที่ใช้บ่อย

### 3. Security
ตั้งค่า security rules ให้เข้มงวด

### 4. Validation
Validate ข้อมูลก่อนเขียนลง database

### 5. Backup
สำรองข้อมูลเป็นประจำ
