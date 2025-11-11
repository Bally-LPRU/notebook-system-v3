# Users Collection Schema - โครงสร้างตาราง users

## 📋 ข้อมูลครบถ้วนสำหรับ Admin User

### Document ID
ใช้ UID จาก Firebase Authentication (เช่น `GXaNYt9mkKoCbS3Mm1auxbr3mBJ3`)

### Fields ทั้งหมด

| Field Name | Type | Required | Description | Example Value |
|------------|------|----------|-------------|---------------|
| **uid** | string | ✅ Yes | User ID จาก Firebase Auth | `GXaNYt9mkKoCbS3Mm1auxbr3mBJ3` |
| **email** | string | ✅ Yes | อีเมล | `xmasball@g.lpru.ac.th` |
| **displayName** | string | ✅ Yes | ชื่อแสดง | `พีสิฐ เพิ่มพันธ์` |
| **photoURL** | string | ❌ No | URL รูปโปรไฟล์ | `https://lh3.googleusercontent.com/...` |
| **role** | string | ✅ Yes | บทบาท | `admin` หรือ `user` |
| **status** | string | ✅ Yes | สถานะ | `approved`, `pending`, `incomplete`, `rejected` |
| **firstName** | string | ✅ Yes | ชื่อจริง | `พีสิฐ` |
| **lastName** | string | ✅ Yes | นามสกุล | `เพิ่มพันธ์` |
| **phoneNumber** | string | ✅ Yes | เบอร์โทรศัพท์ | `0812345678` |
| **department** | map | ✅ Yes | สังกัด (object) | `{ value: "it", label: "สำนักคอมพิวเตอร์" }` |
| **userType** | string | ✅ Yes | ประเภทผู้ใช้ | `staff`, `student`, `external` |
| **createdAt** | timestamp | ✅ Yes | วันที่สร้าง | Server timestamp |
| **updatedAt** | timestamp | ✅ Yes | วันที่อัปเดต | Server timestamp |

---

## 🎯 ตัวอย่างข้อมูลสำหรับ Admin User

### JSON Format (สำหรับ copy-paste)

```json
{
  "uid": "GXaNYt9mkKoCbS3Mm1auxbr3mBJ3",
  "email": "xmasball@g.lpru.ac.th",
  "displayName": "พีสิฐ เพิ่มพันธ์",
  "photoURL": "https://lh3.googleusercontent.com/a/ACg8ocKxxx",
  "role": "admin",
  "status": "approved",
  "firstName": "พีสิฐ",
  "lastName": "เพิ่มพันธ์",
  "phoneNumber": "0812345678",
  "department": {
    "value": "it",
    "label": "สำนักคอมพิวเตอร์"
  },
  "userType": "staff"
}
```

---

## 📝 วิธีเพิ่ม Fields ใน Firebase Console

### 1. เปิด Firebase Console
- ไปที่ https://console.firebase.google.com
- เลือกโปรเจค `equipment-lending-system`
- คลิก **Firestore Database** > **Data**

### 2. เลือก Document
- คลิกที่ collection `users`
- คลิกที่ document ID: `GXaNYt9mkKoCbS3Mm1auxbr3mBJ3`

### 3. เพิ่ม Fields ทีละ Field

#### Field 1: firstName
- คลิก **"+ Add field"**
- Field name: `firstName`
- Type: **string**
- Value: `พีสิฐ`

#### Field 2: lastName
- คลิก **"+ Add field"**
- Field name: `lastName`
- Type: **string**
- Value: `เพิ่มพันธ์`

#### Field 3: phoneNumber
- คลิก **"+ Add field"**
- Field name: `phoneNumber`
- Type: **string**
- Value: `0812345678`

#### Field 4: userType
- คลิก **"+ Add field"**
- Field name: `userType`
- Type: **string**
- Value: `staff`

#### Field 5: department (Map/Object)
- คลิก **"+ Add field"**
- Field name: `department`
- Type: **map**
- เพิ่ม nested fields:
  - คลิก **"+ Add field"** ภายใน department
  - Field name: `value`, Type: **string**, Value: `it`
  - คลิก **"+ Add field"** อีกครั้ง
  - Field name: `label`, Type: **string**, Value: `สำนักคอมพิวเตอร์`

### 4. บันทึก
- คลิกปุ่ม **"Save"**
- รอจนกว่าจะบันทึกเสร็จ

---

## 🔧 วิธีใช้ Browser Console (วิธีที่เร็วกว่า)

### 1. เปิด Browser Console
- กด **F12**
- ไปที่แท็บ **Console**

### 2. Copy-Paste Code นี้

```javascript
// Import Firestore functions
const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
const { db } = await import('./src/config/firebase.js');
const { auth } = await import('./src/config/firebase.js');

// อัปเดต user document
await updateDoc(doc(db, 'users', auth.currentUser.uid), {
  firstName: 'พีสิฐ',
  lastName: 'เพิ่มพันธ์',
  phoneNumber: '0812345678',
  userType: 'staff',
  department: {
    value: 'it',
    label: 'สำนักคอมพิวเตอร์'
  },
  updatedAt: serverTimestamp()
});

console.log('✅ อัปเดตสำเร็จ! กรุณารีเฟรชหน้าเว็บ (F5)');
```

### 3. กด Enter
- รอจนเห็นข้อความ "✅ อัปเดตสำเร็จ!"
- กด **F5** รีเฟรชหน้าเว็บ

---

## 📊 ตัวเลือก department ที่มี

| Value | Label |
|-------|-------|
| `it` | สำนักคอมพิวเตอร์ |
| `academic` | ฝ่ายวิชาการ |
| `student_affairs` | ฝ่ายกิจการนักศึกษา |
| `finance` | ฝ่ายการเงิน |
| `hr` | ฝ่ายบุคคล |
| `library` | ห้องสมุด |
| `other` | อื่นๆ |

## 📊 ตัวเลือก userType ที่มี

| Value | Description |
|-------|-------------|
| `staff` | บุคลากร/เจ้าหน้าที่ |
| `student` | นักศึกษา |
| `external` | บุคคลภายนอก |

## 📊 ตัวเลือก role ที่มี

| Value | Description |
|-------|-------------|
| `admin` | ผู้ดูแลระบบ (มีสิทธิ์เต็ม) |
| `user` | ผู้ใช้ทั่วไป |

## 📊 ตัวเลือก status ที่มี

| Value | Description |
|-------|-------------|
| `incomplete` | ข้อมูลไม่ครบถ้วน |
| `pending` | รอการอนุมัติ |
| `approved` | อนุมัติแล้ว |
| `rejected` | ไม่อนุมัติ |

---

## ✅ ตรวจสอบว่าข้อมูลครบหรือไม่

### ใช้ Browser Console

```javascript
// ตรวจสอบ user document
const { doc, getDoc } = await import('firebase/firestore');
const { db } = await import('./src/config/firebase.js');
const { auth } = await import('./src/config/firebase.js');

const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
const userData = userDoc.data();

console.log('User Data:', userData);

// ตรวจสอบ fields ที่จำเป็น
const requiredFields = [
  'uid', 'email', 'displayName', 'role', 'status',
  'firstName', 'lastName', 'phoneNumber', 'department', 'userType'
];

const missingFields = requiredFields.filter(field => !userData[field]);

if (missingFields.length === 0) {
  console.log('✅ ข้อมูลครบถ้วนแล้ว!');
} else {
  console.log('❌ ขาด fields:', missingFields);
}
```

---

## 🎉 หลังจากเพิ่มข้อมูลครบแล้ว

1. **รีเฟรชหน้าเว็บ (F5)**
2. **ควรเข้าหน้า Admin Dashboard ได้เลย**
3. **ไม่ติดหน้า "บัญชีได้รับการอนุมัติ" อีกต่อไป**

---

## 🔍 Troubleshooting

### ถ้ายังเข้าไม่ได้หลังจากเพิ่มข้อมูล:

1. **Clear Browser Cache:**
   - กด Ctrl+Shift+Delete
   - เลือก "Cached images and files"
   - คลิก "Clear data"

2. **Sign Out และ Sign In ใหม่:**
   - คลิกปุ่ม "ออกจากระบบ"
   - เข้าสู่ระบบใหม่

3. **ตรวจสอบ Console Logs:**
   - กด F12
   - ดู error messages
   - บอกฉันถ้ายังมีปัญหา

---

## 📚 เอกสารเพิ่มเติม

- [Firestore Rules](../firestore.rules)
- [Auth Context](../src/contexts/AuthContext.js)
- [User Service](../src/services/userService.js)
