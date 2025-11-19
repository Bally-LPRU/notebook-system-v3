# การแก้ไขปัญหาสถานะอุปกรณ์

## ปัญหาที่พบ

เมื่อแก้ไขอุปกรณ์ในหน้า `/admin/equipment` และกดปุ่ม "อัปเดต" พบข้อความแจ้งเตือนสีแดงที่ช่อง "สถานะ" ว่า:
```
สถานะอุปกรณ์ไม่ถูกต้อง
```

## สาเหตุของปัญหา

### 1. ค่า Status ที่ถูกต้อง

ใน `src/types/equipment.js` กำหนดค่า status ที่ถูกต้องคือ:
```javascript
export const EQUIPMENT_STATUS = {
  AVAILABLE: 'available',
  BORROWED: 'borrowed',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired'
};
```

### 2. การ Validation

ใน `src/utils/equipmentValidation.js` มีการตรวจสอบว่า:
```javascript
if (!Object.values(EQUIPMENT_STATUS).includes(formData.status)) {
  errors.status = 'สถานะอุปกรณ์ไม่ถูกต้อง';
}
```

### 3. ปัญหาที่เป็นไปได้

1. **ข้อมูลเก่าใน Firestore** - อาจมีค่า status ที่ไม่ตรงกับ constants ใหม่
2. **Form initialization** - เมื่อโหลดข้อมูลเก่ามาแก้ไข อาจได้ค่า status ที่ไม่ถูกต้อง
3. **Type mismatch** - ค่าที่ส่งมาอาจเป็น object แทนที่จะเป็น string

## การแก้ไข

### 1. เพิ่ม Debug Logging

แก้ไข `equipmentValidation.js` เพื่อแสดงข้อมูล debug:

```javascript
// Validate status
if (!formData.status) {
  errors.status = 'กรุณาเลือกสถานะอุปกรณ์';
} else {
  const validStatuses = Object.values(EQUIPMENT_STATUS);
  if (!validStatuses.includes(formData.status)) {
    console.error('Invalid status:', formData.status, 'Valid statuses:', validStatuses);
    errors.status = `สถานะอุปกรณ์ไม่ถูกต้อง (ได้รับ: ${formData.status})`;
  }
}
```

### 2. แก้ไข EquipmentForm.js

ตรวจสอบว่า status ถูก initialize ถูกต้อง:

```javascript
useEffect(() => {
  if (isEdit && equipment) {
    // Ensure status is a valid string
    let status = equipment.status || EQUIPMENT_STATUS.AVAILABLE;
    
    // If status is an object, extract the value
    if (typeof status === 'object' && status.value) {
      status = status.value;
    }
    
    // Validate status
    if (!Object.values(EQUIPMENT_STATUS).includes(status)) {
      console.warn('Invalid status from equipment:', status, 'Using default');
      status = EQUIPMENT_STATUS.AVAILABLE;
    }
    
    setFormData({
      ...formData,
      status: status,
      // ... other fields
    });
  }
}, [isEdit, equipment]);
```

### 3. แก้ไข sanitizeEquipmentForm

เพิ่มการตรวจสอบและแปลงค่า status:

```javascript
export const sanitizeEquipmentForm = (formData) => {
  // Sanitize status
  let status = formData.status || EQUIPMENT_STATUS.AVAILABLE;
  
  // If status is an object, extract the value
  if (typeof status === 'object' && status.value) {
    status = status.value;
  }
  
  // Ensure status is valid
  if (!Object.values(EQUIPMENT_STATUS).includes(status)) {
    console.warn('Invalid status:', status, 'Using default');
    status = EQUIPMENT_STATUS.AVAILABLE;
  }
  
  return {
    equipmentNumber: formData.equipmentNumber?.trim().toUpperCase() || '',
    name: formData.name?.trim() || '',
    category: formData.category || null,
    brand: formData.brand?.trim() || '',
    model: formData.model?.trim() || '',
    description: formData.description?.trim() || '',
    specifications: formData.specifications || {},
    status: status, // Use sanitized status
    location: formData.location || { building: '', floor: '', room: '', description: '' },
    purchaseDate: formData.purchaseDate || '',
    purchasePrice: formData.purchasePrice || 0,
    vendor: formData.vendor?.trim() || '',
    warrantyExpiry: formData.warrantyExpiry || '',
    responsiblePerson: formData.responsiblePerson || null,
    tags: formData.tags || [],
    notes: formData.notes?.trim() || ''
  };
};
```

## การทดสอบ

1. เปิด Console (F12) ใน browser
2. ไปที่หน้า `/admin/equipment`
3. คลิกแก้ไขอุปกรณ์
4. ดูค่า status ที่แสดงใน console
5. ลองเปลี่ยนสถานะและกดอัปเดต
6. ตรวจสอบว่ามี error หรือไม่

## วิธีแก้ไขข้อมูลเก่าใน Firestore

ถ้าพบว่าข้อมูลเก่าใน Firestore มีค่า status ที่ไม่ถูกต้อง ให้รันสคริปต์นี้:

```javascript
// scripts/fix-equipment-status.js
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const VALID_STATUSES = ['available', 'borrowed', 'maintenance', 'retired'];

async function fixEquipmentStatus() {
  const equipmentRef = db.collection('equipment');
  const snapshot = await equipmentRef.get();
  
  let fixed = 0;
  let errors = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    let needsUpdate = false;
    let newStatus = data.status;
    
    // Check if status is invalid
    if (!VALID_STATUSES.includes(data.status)) {
      console.log(`Invalid status for ${doc.id}:`, data.status);
      
      // Try to map old status to new status
      if (data.status === 'active' || data.status === 'ready') {
        newStatus = 'available';
        needsUpdate = true;
      } else if (data.status === 'in-use' || data.status === 'loaned') {
        newStatus = 'borrowed';
        needsUpdate = true;
      } else if (data.status === 'repair' || data.status === 'broken') {
        newStatus = 'maintenance';
        needsUpdate = true;
      } else if (data.status === 'disposed' || data.status === 'inactive') {
        newStatus = 'retired';
        needsUpdate = true;
      } else {
        // Default to available
        newStatus = 'available';
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      try {
        await equipmentRef.doc(doc.id).update({
          status: newStatus,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Fixed ${doc.id}: ${data.status} → ${newStatus}`);
        fixed++;
      } catch (error) {
        console.error(`❌ Error fixing ${doc.id}:`, error);
        errors++;
      }
    }
  }
  
  console.log(`\n✅ Fixed: ${fixed}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Total: ${snapshot.size}`);
}

fixEquipmentStatus()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
```

รันด้วย:
```bash
node scripts/fix-equipment-status.js
```

## สรุป

ปัญหาน่าจะเกิดจาก:
1. ข้อมูลเก่าใน Firestore มีค่า status ที่ไม่ตรงกับ constants ใหม่
2. การ initialize form data ไม่ได้ validate status

การแก้ไข:
1. เพิ่ม debug logging เพื่อดูค่า status ที่ได้รับ
2. เพิ่มการ sanitize และ validate status ใน form
3. รันสคริปต์แก้ไขข้อมูลเก่าใน Firestore (ถ้าจำเป็น)
