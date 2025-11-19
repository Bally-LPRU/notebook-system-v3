# 📚 คู่มือตั้งค่าระบบจัดการอุปกรณ์

## ✅ สถานะปัจจุบัน

จากการตรวจสอบ Firebase Console:
- ✅ Collection `equipmentManagement` มีอยู่แล้ว
- ✅ มีข้อมูลอุปกรณ์อย่างน้อย 1 รายการ (โน้ตบุ๊ค Acer)
- ✅ Firestore Rules ถูกต้อง
- ✅ **แก้ไขแล้ว**: เพิ่ม defensive programming ใน service layer (2025-11-17)

## 🔍 สาเหตุของปัญหา

### Error: "y is not a function"

นี่เป็น error จาก **minified/uglified code** ใน production build:
- ตัวแปรและฟังก์ชันถูกย่อเป็นตัวอักษรเดียว (a, b, c, x, y, z)
- Error ที่แท้จริงอาจเป็น: `Array.map is not a function` หรือ `forEach is not a function`
- เกิดจากข้อมูลที่ return มาไม่ใช่ Array

## 🔧 วิธีแก้ไข

### 1. ตรวจสอบข้อมูลใน Firestore

**ข้อมูลที่ถูกต้อง:**
```javascript
{
  name: "โน้ตบุ๊ค Acer",
  equipmentNumber: "EQ-001",
  status: "available",
  category: {
    id: "computers",
    name: "คอมพิวเตอร์"
  },
  isActive: true,
  searchKeywords: ["eq-001", "เอเซอร์"],
  images: [],  // ต้องเป็น Array
  tags: [],    // ต้องเป็น Array
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "user_id",
  updatedBy: "user_id",
  version: 1,
  viewCount: 0
}
```

**ตรวจสอบ fields ที่ต้องเป็น Array:**
- ✅ `images` - ต้องเป็น Array (ไม่ใช่ null หรือ undefined)
- ✅ `tags` - ต้องเป็น Array
- ✅ `searchKeywords` - ต้องเป็น Array

### 2. แก้ไขข้อมูลที่มีปัญหา

**Option A: ผ่าน Firebase Console**
```
1. ไปที่ Firebase Console
2. เลือก Firestore Database
3. เปิด collection equipmentManagement
4. คลิกที่ document ที่มีปัญหา
5. ตรวจสอบ fields:
   - images: ถ้าเป็น null ให้เปลี่ยนเป็น []
   - tags: ถ้าเป็น null ให้เปลี่ยนเป็น []
   - searchKeywords: ถ้าเป็น null ให้เปลี่ยนเป็น []
```

**Option B: ผ่าน Script**
```bash
node scripts/fix-equipment-data.js
```

### 3. แก้ไขโค้ด Frontend

เพิ่ม defensive programming ใน `EquipmentManagementService.js`:

```javascript
static async getEquipmentList(filters = {}) {
  try {
    // ... existing code ...
    
    const equipment = [];
    querySnapshot.forEach((doc, index) => {
      if (index < limit) {
        const data = doc.data();
        
        // ✅ Ensure arrays are always arrays
        equipment.push({
          id: doc.id,
          ...data,
          images: Array.isArray(data.images) ? data.images : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          searchKeywords: Array.isArray(data.searchKeywords) ? data.searchKeywords : []
        });
      }
    });
    
    return {
      equipment,
      pagination: { /* ... */ }
    };
  } catch (error) {
    console.error('Error getting equipment list:', error);
    throw error;
  }
}
```

## 📋 Checklist การตั้งค่า

### Firebase Setup

- [x] **Firestore Database สร้างแล้ว**
- [x] **Collection `equipmentManagement` มีอยู่แล้ว**
- [x] **Collection `equipmentCategories` ควรมี**
- [x] **Firestore Rules ตั้งค่าแล้ว**
- [ ] **Storage Rules ตั้งค่าแล้ว** (สำหรับรูปภาพ)

### Data Setup

- [x] **มีข้อมูลอุปกรณ์อย่างน้อย 1 รายการ**
- [ ] **ข้อมูลทุก field เป็น type ที่ถูกต้อง**
- [ ] **Arrays ไม่เป็น null**
- [ ] **มี categories ครบถ้วน**

### Code Setup

- [x] **แก้ไข defensive programming** ✅ เสร็จแล้ว (2025-11-17)
- [ ] **ทดสอบ local ก่อน deploy**
- [ ] **Clear cache หลัง deploy**

## 🚀 ขั้นตอนการแก้ไข

### Step 1: ตรวจสอบข้อมูล

```bash
# ตรวจสอบข้อมูลใน Firestore
node scripts/test-equipment-data.js
```

**Expected Output:**
```
✅ Found 1 equipment(s)
✅ All equipment have required fields
✅ Found X category(ies)
✅ All tests passed!
```

### Step 2: แก้ไขข้อมูลที่มีปัญหา

```bash
# แก้ไขข้อมูลอัตโนมัติ
node scripts/fix-equipment-data.js
```

### Step 3: แก้ไขโค้ด

```bash
# แก้ไข src/services/equipmentManagementService.js
# เพิ่ม defensive programming
```

### Step 4: Deploy

```bash
git add -A
git commit -m "fix: เพิ่ม defensive programming สำหรับ equipment data"
git push origin main
```

### Step 5: ทดสอบ

```
1. รอ Vercel deploy (2-5 นาที)
2. Clear browser cache
3. Clear Service Worker
4. ทดสอบใน Incognito Mode
```

## 🔍 การ Debug

### ดู Error ที่แท้จริง

```javascript
// เพิ่มใน Console
try {
  const result = await EquipmentManagementService.getEquipmentList({});
  console.log('Equipment data:', result);
} catch (error) {
  console.error('Full error:', error);
  console.error('Error stack:', error.stack);
}
```

### ตรวจสอบ Network Response

```
1. เปิด DevTools (F12)
2. ไปที่ Network tab
3. Filter: firestore
4. คลิก request ที่ล้มเหลว
5. ดู Response data
```

### ตรวจสอบ Firestore Rules

```bash
# Test rules locally
firebase emulators:start --only firestore

# Deploy rules
firebase deploy --only firestore:rules
```

## 📊 ข้อมูลที่ต้องมีใน Firestore

### Collection: equipmentManagement

**Required Fields:**
- `name` (string) - ชื่ออุปกรณ์
- `equipmentNumber` (string) - หมายเลขครุภัณฑ์
- `status` (string) - สถานะ (available, borrowed, maintenance, retired)
- `category` (map) - หมวดหมู่
  - `id` (string)
  - `name` (string)
- `isActive` (boolean) - เปิดใช้งาน
- `searchKeywords` (array) - คำค้นหา
- `images` (array) - รูปภาพ
- `tags` (array) - แท็ก
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `createdBy` (string)
- `updatedBy` (string)
- `version` (number)

**Optional Fields:**
- `brand` (string) - ยี่ห้อ
- `model` (string) - รุ่น
- `description` (string) - รายละเอียด
- `specifications` (map) - ข้อมูลจำเพาะ
- `location` (map) - สถานที่
- `purchaseDate` (timestamp) - วันที่ซื้อ
- `purchasePrice` (number) - ราคา
- `vendor` (string) - ผู้จำหน่าย
- `warrantyExpiry` (timestamp) - วันหมดประกัน
- `responsiblePerson` (map) - ผู้รับผิดชอบ
- `qrCode` (string) - QR Code
- `notes` (string) - หมายเหตุ
- `viewCount` (number) - จำนวนครั้งที่ดู
- `lastViewed` (timestamp) - ดูล่าสุด

### Collection: equipmentCategories

**Required Fields:**
- `id` (string) - รหัสหมวดหมู่
- `name` (string) - ชื่อหมวดหมู่
- `icon` (string) - ไอคอน
- `description` (string) - รายละเอียด
- `isActive` (boolean) - เปิดใช้งาน
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `createdBy` (string)
- `updatedBy` (string)

**Optional Fields:**
- `equipmentCount` (number) - จำนวนอุปกรณ์
- `parentId` (string) - หมวดหมู่แม่
- `order` (number) - ลำดับการแสดง

## 🛠️ Scripts ที่มีให้ใช้

### 1. ทดสอบข้อมูล
```bash
node scripts/test-equipment-data.js
```

### 2. แก้ไขข้อมูล
```bash
node scripts/fix-equipment-data.js
```

### 3. เพิ่มข้อมูลตัวอย่าง
```bash
node scripts/seed-equipment-data-simple.js
```

### 4. สร้าง Categories
```bash
node scripts/create-categories-collection.js
```

### 5. ตรวจสอบ Firestore Rules
```bash
firebase firestore:rules:get
```

## ❓ FAQ

### Q: ทำไมแสดง "y is not a function"?
**A:** เพราะข้อมูลที่ return มาไม่ใช่ Array แต่เป็น null หรือ undefined

### Q: ต้องมีข้อมูลอย่างน้อยกี่รายการ?
**A:** อย่างน้อย 1 รายการ แต่แนะนำ 3-5 รายการเพื่อทดสอบ

### Q: ต้องสร้าง Categories ก่อนหรือไม่?
**A:** ไม่จำเป็น แต่แนะนำให้สร้างเพื่อให้ระบบทำงานได้สมบูรณ์

### Q: ถ้าข้อมูลมีปัญหาต้องทำอย่างไร?
**A:** ใช้ script `fix-equipment-data.js` หรือแก้ไขผ่าน Firebase Console

### Q: ต้อง deploy ใหม่หรือไม่?
**A:** ถ้าแก้ไขเฉพาะข้อมูลใน Firestore ไม่ต้อง deploy ใหม่

## 📞 ติดต่อ Support

หากยังมีปัญหา:
1. ตรวจสอบ Console logs
2. ตรวจสอบ Network tab
3. ตรวจสอบ Firestore data
4. ใช้ scripts ที่มีให้
5. ดูเอกสารเพิ่มเติมใน `docs/`

---

**Last Updated:** 2025-11-11  
**Version:** 1.0.0  
**Status:** ✅ Ready for Production
