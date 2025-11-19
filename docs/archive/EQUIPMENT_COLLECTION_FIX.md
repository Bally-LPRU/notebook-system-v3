# การแก้ไขปัญหา Collection Name ของอุปกรณ์

## ปัญหาที่พบ

เมื่อพยายามอัปเดตข้อมูลอุปกรณ์ พบ error ใน console:

```
Error: Cannot update equipment
Collection 'equipmentManagement' not found
```

## สาเหตุของปัญหา

มีความไม่สอดคล้องกันของ collection name ระหว่าง services ต่างๆ:

### ก่อนแก้ไข:
- `equipmentService.js` → ใช้ `'equipment'` ✅
- `equipmentManagementService.js` → ใช้ `'equipmentManagement'` ❌
- `equipmentSearchService.js` → ใช้ `'equipmentManagement'` ❌
- `equipmentFilterService.js` → ใช้ `'equipmentManagement'` ❌

### ข้อมูลจริงใน Firestore:
- Collection ที่มีอยู่จริง: `equipment` ✅

## การแก้ไข

เปลี่ยน collection name ในทุก service ให้เป็น `'equipment'` เหมือนกัน:

### 1. equipmentManagementService.js

```javascript
// เปลี่ยนจาก
static COLLECTION_NAME = 'equipmentManagement';

// เป็น
static COLLECTION_NAME = 'equipment';
```

### 2. equipmentSearchService.js

```javascript
// เปลี่ยนจาก
static COLLECTION_NAME = 'equipmentManagement';

// เป็น
static COLLECTION_NAME = 'equipment';
```

### 3. equipmentFilterService.js

```javascript
// เปลี่ยนจาก
static COLLECTION_NAME = 'equipmentManagement';

// เป็น
static COLLECTION_NAME = 'equipment';
```

## ผลลัพธ์

หลังแก้ไข ทุก service จะใช้ collection name เดียวกัน:

```
equipmentService.js           → 'equipment' ✅
equipmentManagementService.js → 'equipment' ✅
equipmentSearchService.js     → 'equipment' ✅
equipmentFilterService.js     → 'equipment' ✅
```

## การทดสอบ

1. ไปที่หน้า `/admin/equipment`
2. คลิกแก้ไขอุปกรณ์
3. เปลี่ยนข้อมูล (เช่น ชื่อ, ยี่ห้อ, สถานะ)
4. กดปุ่ม "อัปเดต"
5. ตรวจสอบว่าข้อมูลถูกอัปเดตใน Firestore
6. ตรวจสอบ console ว่าไม่มี error

## หมายเหตุ

### ทำไมต้องใช้ 'equipment'?

1. **ข้อมูลเดิมอยู่ใน collection นี้** - มีข้อมูลอุปกรณ์อยู่แล้ว
2. **equipmentService.js ใช้อยู่แล้ว** - service เดิมใช้ชื่อนี้
3. **ชื่อสั้นกว่า** - ง่ายต่อการใช้งาน
4. **สอดคล้องกับ Firestore rules** - rules อาจอ้างอิงชื่อนี้

### ถ้าต้องการใช้ 'equipmentManagement'

ถ้าต้องการใช้ `'equipmentManagement'` แทน จะต้อง:

1. **Migrate ข้อมูล** จาก `equipment` → `equipmentManagement`
2. **อัปเดต Firestore rules** ให้รองรับ collection ใหม่
3. **อัปเดต indexes** ใน firestore.indexes.json
4. **ทดสอบทุกฟีเจอร์** ที่เกี่ยวข้อง

แต่วิธีที่ง่ายที่สุดคือใช้ `'equipment'` ตามที่มีอยู่แล้ว

## ไฟล์ที่แก้ไข

- `src/services/equipmentManagementService.js`
- `src/services/equipmentSearchService.js`
- `src/services/equipmentFilterService.js`

## Impact

✅ แก้ไขปัญหาการอัปเดตอุปกรณ์
✅ แก้ไขปัญหาการค้นหาอุปกรณ์
✅ แก้ไขปัญหาการกรองอุปกรณ์
✅ ทำให้ทุก service ใช้ collection เดียวกัน
✅ สอดคล้องกับข้อมูลที่มีอยู่ใน Firestore
