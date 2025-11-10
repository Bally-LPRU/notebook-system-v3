# วิธีสร้าง Collection equipmentManagement ใน Firebase Console

## 🎯 ปัญหา

ไม่สามารถเข้าหน้าจัดการอุปกรณ์ได้เพราะยังไม่มี collection `equipmentManagement` ใน Firestore

## ✅ วิธีแก้ไข (เลือกวิธีใดวิธีหนึ่ง)

### วิธีที่ 1: สร้างผ่าน Firebase Console (แนะนำ - ง่ายที่สุด)

1. **เปิด Firebase Console**
   - ไปที่ https://console.firebase.google.com
   - เลือกโปรเจค `equipment-lending-system`

2. **ไปที่ Firestore Database**
   - คลิกที่ "Firestore Database" ในเมนูด้านซ้าย
   - คลิกแท็บ "Data"

3. **สร้าง Collection ใหม่**
   - คลิกปุ่ม "+ Start collection"
   - ใส่ชื่อ collection: `equipmentManagement`
   - คลิก "Next"

4. **เพิ่ม Document แรก**
   - Document ID: ใส่ `sample-equipment-001` หรือคลิก "Auto-ID"
   - เพิ่ม Fields ดังนี้:

   ```
   Field name          | Type      | Value
   -------------------|-----------|----------------------------------
   equipmentNumber    | string    | EQ-001
   name               | string    | โน้ตบุ๊ค Dell Latitude 5420
   brand              | string    | Dell
   model              | string    | Latitude 5420
   description        | string    | โน้ตบุ๊คสำหรับงานทั่วไป
   status             | string    | available
   isActive           | boolean   | true
   createdAt          | timestamp | (คลิก "Use server timestamp")
   updatedAt          | timestamp | (คลิก "Use server timestamp")
   createdBy          | string    | GXaNYt9mkKoCbS3Mm1auxbr3mBJ3
   updatedBy          | string    | GXaNYt9mkKoCbS3Mm1auxbr3mBJ3
   version            | number    | 1
   viewCount          | number    | 0
   ```

5. **เพิ่ม Nested Object สำหรับ category**
   - คลิก "+ Add field"
   - Field name: `category`
   - Type: เลือก "map"
   - เพิ่ม fields ภายใน:
     - `id` (string): `computers`
     - `name` (string): `คอมพิวเตอร์`
     - `icon` (string): `💻`

6. **เพิ่ม Nested Object สำหรับ location**
   - คลิก "+ Add field"
   - Field name: `location`
   - Type: เลือก "map"
   - เพิ่ม fields ภายใน:
     - `building` (string): `อาคาร 1`
     - `floor` (string): `2`
     - `room` (string): `201`

7. **เพิ่ม Array สำหรับ searchKeywords**
   - คลิก "+ Add field"
   - Field name: `searchKeywords`
   - Type: เลือก "array"
   - เพิ่มค่า:
     - `eq-001`
     - `โน้ตบุ๊ค`
     - `dell`
     - `คอมพิวเตอร์`

8. **เพิ่ม Array สำหรับ images**
   - คลิก "+ Add field"
   - Field name: `images`
   - Type: เลือก "array"
   - ปล่อยว่างไว้ (empty array)

9. **เพิ่ม Array สำหรับ tags**
   - คลิก "+ Add field"
   - Field name: `tags`
   - Type: เลือก "array"
   - เพิ่มค่า:
     - `โน้ตบุ๊ค`
     - `Dell`

10. **บันทึก**
    - คลิกปุ่ม "Save"
    - รอสักครู่จนกว่าจะบันทึกเสร็จ

11. **ตรวจสอบ**
    - ควรเห็น collection `equipmentManagement` ปรากฏในรายการ
    - มี document 1 รายการ

12. **ทดสอบ**
    - รีเฟรชหน้าเว็บแอพ (F5)
    - ไปที่ `/admin/equipment`
    - ควรเห็นอุปกรณ์ตัวอย่างที่สร้างไว้

---

### วิธีที่ 2: ใช้ Script (สำหรับคนที่ชอบ Code)

1. **เปิดแอพและ Login**
   - เปิดแอพในเบราว์เซอร์
   - Login ด้วย admin account

2. **เปิด Browser Console**
   - กด F12
   - ไปที่แท็บ "Console"

3. **รัน Code นี้**

```javascript
// Import Firestore functions
const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
const { db } = await import('./src/config/firebase.js');
const { auth } = await import('./src/config/firebase.js');

// สร้างข้อมูลตัวอย่าง
const sampleEquipment = {
  equipmentNumber: 'EQ-001',
  name: 'โน้ตบุ๊ค Dell Latitude 5420',
  category: {
    id: 'computers',
    name: 'คอมพิวเตอร์',
    icon: '💻'
  },
  brand: 'Dell',
  model: 'Latitude 5420',
  description: 'โน้ตบุ๊คสำหรับงานทั่วไป',
  status: 'available',
  location: {
    building: 'อาคาร 1',
    floor: '2',
    room: '201'
  },
  images: [],
  tags: ['โน้ตบุ๊ค', 'Dell'],
  searchKeywords: ['eq-001', 'โน้ตบุ๊ค', 'dell', 'คอมพิวเตอร์'],
  isActive: true,
  viewCount: 0,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: auth.currentUser.uid,
  updatedBy: auth.currentUser.uid,
  version: 1
};

// เพิ่มลง Firestore
const docRef = await addDoc(collection(db, 'equipmentManagement'), sampleEquipment);
console.log('✅ สร้างสำเร็จ! Document ID:', docRef.id);
```

4. **รีเฟรชหน้าเว็บ**
   - กด F5
   - ไปที่ `/admin/equipment`

---

### วิธีที่ 3: ใช้ Seed Script (สำหรับสร้างข้อมูลจำนวนมาก)

มี script สำเร็จรูปอยู่แล้วในโปรเจค:

```bash
# ดู script ที่มี
ls scripts/seed-equipment-data*.js

# รัน script
node scripts/seed-equipment-data-simple.js
```

---

## 🔍 ตรวจสอบว่าสร้างสำเร็จ

1. **ใน Firebase Console:**
   - ไปที่ Firestore Database > Data
   - ควรเห็น collection `equipmentManagement`
   - มี document อย่างน้อย 1 รายการ

2. **ในแอพ:**
   - ไปที่ `/admin/equipment`
   - ควรเห็นรายการอุปกรณ์
   - ไม่มี error "Missing or insufficient permissions"

---

## 📝 หมายเหตุ

### Collections ที่ควรมีในระบบ:

1. ✅ `users` - มีอยู่แล้ว
2. ❌ `equipmentManagement` - **ต้องสร้าง**
3. ❌ `equipmentCategories` - ควรสร้าง (สำหรับหมวดหมู่อุปกรณ์)
4. ❌ `loanRequests` - จะสร้างอัตโนมัติเมื่อมีการยืมอุปกรณ์
5. ❌ `reservations` - จะสร้างอัตโนมัติเมื่อมีการจองอุปกรณ์
6. ❌ `notifications` - จะสร้างอัตโนมัติเมื่อมีการแจ้งเตือน
7. ❌ `activityLogs` - จะสร้างอัตโนมัติเมื่อมีการบันทึก log

### ลำดับความสำคัญ:

1. **สร้าง `equipmentManagement` ก่อน** - เพื่อให้เข้าหน้าจัดการอุปกรณ์ได้
2. สร้าง `equipmentCategories` - เพื่อให้เลือกหมวดหมู่ได้
3. Collections อื่นๆ จะถูกสร้างอัตโนมัติเมื่อใช้งาน

---

## 🚨 ถ้ายังเข้าไม่ได้หลังจากสร้าง Collection

1. **Refresh Auth Token:**
   - คลิกปุ่ม "🔄 Refresh Token" ในหน้า error
   - หรือ Sign Out และ Sign In ใหม่

2. **ตรวจสอบ Firestore Rules:**
   - ไปที่ Firebase Console > Firestore Database > Rules
   - ตรวจสอบว่ามี rules สำหรับ `equipmentManagement`:
   ```javascript
   match /equipmentManagement/{equipmentId} {
     allow read: if isApprovedUser();
     allow create: if isAdmin();
     allow update: if isAdmin();
     allow delete: if isAdmin();
   }
   ```

3. **ตรวจสอบ User Status:**
   - ไปที่ Firestore > users > [your-user-id]
   - ตรวจสอบว่า:
     - `role: "admin"`
     - `status: "approved"`

4. **Clear Browser Cache:**
   - กด Ctrl+Shift+Delete
   - เลือก "Cached images and files"
   - คลิก "Clear data"
   - รีเฟรชหน้าเว็บ
