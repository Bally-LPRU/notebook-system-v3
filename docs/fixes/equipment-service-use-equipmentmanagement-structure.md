# EquipmentService - ใช้โครงสร้าง equipmentManagement โดยตรง

## การเปลี่ยนแปลง

เปลี่ยนจาก **normalize data structure** เป็น **ใช้โครงสร้างตาม equipmentManagement collection โดยตรง**

## ก่อนแก้ไข

### ปัญหา
1. EquipmentService พยายาม normalize ข้อมูลจาก 2 structure
2. แปลง category จาก object เป็น string
3. แปลง location จาก object เป็น string
4. สร้างความสับสนและ inconsistency

### Code เดิม
```javascript
static normalizeEquipmentData(data) {
  let categoryValue = data.category;
  if (typeof data.category === 'object') {
    categoryValue = data.category.id || data.category.name;
  }
  
  let locationValue = data.location;
  if (typeof data.location === 'object') {
    locationValue = data.location.building || ...;
  }
  
  return {
    ...data,
    serialNumber: data.serialNumber || data.equipmentNumber,
    category: categoryValue,
    location: locationValue
  };
}
```

## หลังแก้ไข

### แนวทาง
1. **ใช้ equipmentManagement collection เป็นหลัก**
2. **ไม่ normalize ข้อมูล** - ใช้ structure ตามที่เก็บใน Firestore
3. **Components รับผิดชอบการแสดงผล** - แปลง object เป็น string ตอนแสดงผล

### Code ใหม่
```javascript
// ไม่มี normalizeEquipmentData แล้ว
// ใช้ข้อมูลตามที่เก็บใน Firestore โดยตรง

static async getEquipmentList(filters = {}) {
  const equipmentRef = collection(db, 'equipmentManagement');
  const queryConstraints = [
    where('isActive', '==', true),
    firestoreLimit(limit + 1)
  ];
  
  const querySnapshot = await getDocs(query(equipmentRef, ...queryConstraints));
  
  const equipment = [];
  querySnapshot.forEach((doc) => {
    equipment.push({
      id: doc.id,
      ...doc.data() // ใช้ข้อมูลตามที่เก็บ ไม่ normalize
    });
  });
  
  return { equipment, pagination: {...} };
}
```

## โครงสร้างข้อมูล equipmentManagement

### Fields
```javascript
{
  // Identification
  equipmentNumber: "7440-001-015-64154-123",
  name: "โน้ตบุ๊ค Acer",
  
  // Category (Object)
  category: {
    id: "laptop",
    name: "คอมพิวเตอร์โน้ตบุ๊ค",
    icon: "💻"
  },
  
  // Location (Object)
  location: {
    building: "36",
    floor: "2",
    room: "บริการวิชาการ",
    description: ""
  },
  
  // Details
  brand: "Acer",
  model: "N5201",
  description: "โน้ตบุ๊คเพื่อการทำงาน",
  
  // Status
  status: "available",
  isActive: true,
  
  // Arrays
  images: [],
  tags: [],
  searchKeywords: ["7440", "001", "015", ...],
  specifications: {},
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "uid",
  updatedBy: "uid",
  version: 4
}
```

## การแสดงผลใน Components

### EquipmentPage.js
```javascript
// แสดง category
const categoryName = typeof item.category === 'object' 
  ? item.category.name 
  : item.category;

// แสดง location
const locationText = typeof item.location === 'object'
  ? `${item.location.building} ชั้น ${item.location.floor} ${item.location.room}`
  : item.location;

// แสดง equipment number
const equipmentNumber = item.equipmentNumber || item.serialNumber || '-';
```

### EquipmentCard.js
```javascript
<div className="equipment-card">
  <h3>{equipment.name}</h3>
  <p>หมวดหมู่: {equipment.category?.name || equipment.category}</p>
  <p>สถานที่: {equipment.location?.building || equipment.location}</p>
  <p>รหัส: {equipment.equipmentNumber}</p>
</div>
```

## Client-side Filtering

### Category Filter
```javascript
if (category) {
  filteredEquipment = filteredEquipment.filter(item => {
    const itemCategory = typeof item.category === 'object' 
      ? item.category.id 
      : item.category;
    return itemCategory === category;
  });
}
```

### Location Filter
```javascript
if (location) {
  filteredEquipment = filteredEquipment.filter(item => {
    const itemLocation = typeof item.location === 'object' 
      ? item.location.building 
      : item.location;
    return itemLocation === location;
  });
}
```

### Search Filter
```javascript
if (search) {
  const searchLower = search.toLowerCase();
  filteredEquipment = filteredEquipment.filter(item => 
    item.name?.toLowerCase().includes(searchLower) ||
    item.brand?.toLowerCase().includes(searchLower) ||
    item.model?.toLowerCase().includes(searchLower) ||
    item.equipmentNumber?.toLowerCase().includes(searchLower) ||
    item.description?.toLowerCase().includes(searchLower)
  );
}
```

## ข้อดี

1. **Consistency** - ใช้ structure เดียวกันทั้งระบบ
2. **Simplicity** - ไม่ต้อง normalize ข้อมูล
3. **Flexibility** - Components จัดการการแสดงผลเอง
4. **Maintainability** - แก้ไขง่าย เข้าใจง่าย
5. **Performance** - ไม่ต้องประมวลผลข้อมูลซ้ำซ้อน

## ข้อควรระวัง

1. **Components ต้องจัดการ object fields**
   - ตรวจสอบว่า category เป็น object หรือ string
   - ตรวจสอบว่า location เป็น object หรือ string

2. **Backward Compatibility**
   - ถ้ามีข้อมูลเก่าที่เป็น string ต้องจัดการได้
   - ใช้ optional chaining (`?.`) และ fallback values

3. **Search และ Filter**
   - ต้องจัดการทั้ง object และ string format
   - ใช้ conditional logic ในการ filter

## Migration Guide

### สำหรับ Components ที่ใช้ EquipmentService

1. **อัปเดตการแสดง category:**
   ```javascript
   // เดิม
   <p>{equipment.category}</p>
   
   // ใหม่
   <p>{equipment.category?.name || equipment.category}</p>
   ```

2. **อัปเดตการแสดง location:**
   ```javascript
   // เดิม
   <p>{equipment.location}</p>
   
   // ใหม่
   <p>{equipment.location?.building || equipment.location}</p>
   ```

3. **อัปเดตการแสดง equipment number:**
   ```javascript
   // เดิม
   <p>{equipment.serialNumber}</p>
   
   // ใหม่
   <p>{equipment.equipmentNumber || equipment.serialNumber}</p>
   ```

## ไฟล์ที่แก้ไข

1. `src/services/equipmentService.js`
   - ลบ `normalizeEquipmentData` method
   - ลบ `fetchFromCollections` helper
   - ใช้ `equipmentManagement` collection โดยตรง
   - อัปเดต filtering logic

## ทดสอบ

```bash
# ตรวจสอบข้อมูล
node scripts/check-specific-equipment.js

# ทดสอบ query
node scripts/test-equipment-query.js

# ตรวจสอบ fields
node scripts/check-equipment-fields.js
```

## วันที่แก้ไข
24 พฤศจิกายน 2025 (12:15 น.)
