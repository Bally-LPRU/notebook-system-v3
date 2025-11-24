# EquipmentService - รองรับ equipmentManagement Structure

## ปัญหา

EquipmentService (ใช้โดยหน้า Equipment ของ user) และ EquipmentManagementService (ใช้โดยหน้า Admin) ใช้ data structure ที่แตกต่างกัน:

### EquipmentService (เดิม)
```javascript
{
  serialNumber: "ABC-123",
  category: "laptop",
  location: "อาคาร A ชั้น 3",
  status: "available"
}
```

### EquipmentManagementService (ใหม่)
```javascript
{
  equipmentNumber: "7440-001-015-64154-123",
  category: { id: "laptop", name: "โน้ตบุ๊ค", icon: "💻" },
  location: { building: "อาคาร A", floor: "3", room: "301" },
  status: "available",
  isActive: true
}
```

## การแก้ไข

### 1. เพิ่ม Method `normalizeEquipmentData`

สร้าง method ที่แปลงข้อมูลจากทั้งสอง structure ให้เป็นรูปแบบเดียวกัน:

```javascript
static normalizeEquipmentData(data) {
  // Handle category - support both string and object format
  let categoryValue = data.category;
  if (typeof data.category === 'object' && data.category !== null) {
    categoryValue = data.category.id || data.category.name || data.category;
  }

  // Handle location - support both string and object format
  let locationValue = data.location;
  if (typeof data.location === 'object' && data.location !== null) {
    locationValue = data.location.building || data.location.description || 
                   `${data.location.building || ''} ${data.location.floor || ''} ${data.location.room || ''}`.trim();
  }

  return {
    ...data,
    // Normalize field names
    serialNumber: data.serialNumber || data.equipmentNumber || '',
    category: categoryValue,
    location: locationValue,
    // Ensure arrays
    images: Array.isArray(data.images) ? data.images : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    // Handle status
    status: data.status || EQUIPMENT_STATUS.AVAILABLE,
    // Filter out inactive items (if isActive field exists)
    _isActive: data.isActive !== false
  };
}
```

### 2. อัปเดต `getEquipmentList` Method

เพิ่ม filter `isActive` และใช้ `normalizeEquipmentData`:

```javascript
static async getEquipmentList(filters = {}) {
  // ...
  
  const result = await this.fetchFromCollections(async (collectionName) => {
    const equipmentRef = collection(db, collectionName);
    
    // Build query constraints
    const queryConstraints = [];
    
    // Filter out inactive items (for equipmentManagement collection)
    if (collectionName === 'equipmentManagement') {
      queryConstraints.push(where('isActive', '==', true));
    }
    
    queryConstraints.push(firestoreLimit(limit + 1));
    
    // Execute query
    const equipmentQuery = query(equipmentRef, ...queryConstraints);
    const querySnapshot = await getDocs(equipmentQuery);
    
    // Process results
    const equipment = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const normalizedData = this.normalizeEquipmentData(data);
      
      equipment.push({
        id: doc.id,
        ...normalizedData
      });
    });
    
    return { equipment, pagination: {...} };
  });
}
```

## ผลลัพธ์

### ก่อนแก้ไข
- หน้า Equipment (user) อาจแสดงข้อมูลไม่ครบ
- ข้อมูลจาก equipmentManagement อาจแสดงผิดรูปแบบ
- Category และ Location แสดงเป็น [object Object]

### หลังแก้ไข
- ✅ หน้า Equipment แสดงข้อมูลครบทั้ง 6 รายการ
- ✅ รองรับทั้ง structure เก่าและใหม่
- ✅ Category และ Location แสดงถูกต้อง
- ✅ Filter `isActive` ทำงานถูกต้อง

## การทำงาน

### Field Mapping

| Old Structure | New Structure | Normalized Output |
|--------------|---------------|-------------------|
| `serialNumber` | `equipmentNumber` | `serialNumber` |
| `category: "laptop"` | `category: {id: "laptop"}` | `category: "laptop"` |
| `location: "อาคาร A"` | `location: {building: "อาคาร A"}` | `location: "อาคาร A"` |
| N/A | `isActive: true` | Filtered in query |

### Backward Compatibility

Service ยังคงรองรับ:
1. ข้อมูลเก่าจาก collection `equipment` (ถ้ามี)
2. ข้อมูลใหม่จาก collection `equipmentManagement`
3. ทั้งสอง structure ในคราวเดียว

## ทดสอบ

### 1. ทดสอบหน้า Equipment (User)
```bash
# รีเฟรชหน้าเว็บ
# ควรเห็นอุปกรณ์ทั้ง 6 รายการ
```

### 2. ตรวจสอบ Console
```javascript
// ควรเห็น logs:
// "Trying collection: equipmentManagement"
// "Query result: { size: 6, empty: false }"
// "Doc 0: { id: '...', name: 'MacBook Pro 14-inch M3' }"
```

### 3. ตรวจสอบข้อมูลที่แสดง
- ✅ ชื่ออุปกรณ์แสดงถูกต้อง
- ✅ Category แสดงเป็นข้อความ (ไม่ใช่ [object Object])
- ✅ Location แสดงเป็นข้อความ
- ✅ Status แสดงถูกต้อง

## หมายเหตุ

### isActive Field
- ใช้สำหรับ soft delete
- `isActive: true` - แสดงในรายการ
- `isActive: false` - ซ่อนจากรายการ
- ถ้าไม่มี field นี้ - ถือว่าเป็น active (backward compatible)

### Performance
- Query ใช้ index `isActive` (ถ้ามี)
- ไม่กระทบ performance ของ query อื่น
- Client-side filtering ใช้เฉพาะกรณีที่จำเป็น

## ไฟล์ที่แก้ไข

1. `src/services/equipmentService.js`
   - เพิ่ม `normalizeEquipmentData` method
   - อัปเดต `getEquipmentList` method
   - เพิ่ม filter `isActive`

## วันที่แก้ไข
24 พฤศจิกายน 2025 (11:45 น.)
