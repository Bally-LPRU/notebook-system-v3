# ปัญหา Schema Mismatch ระหว่างฟอร์มและ Firebase

## ปัญหาที่พบ

ฟอร์มแก้ไขอุปกรณ์มีช่องกรอกข้อมูลที่ไม่ตรงกับข้อมูลจริงใน Firebase

## การตรวจสอบ

### 1. ตรวจสอบ Schema ใน Firebase

รันสคริปต์เพื่อดูโครงสร้างข้อมูลจริง:

```bash
node scripts/check-equipment-schema.js
```

สคริปต์นี้จะแสดง:
- ฟิลด์ทั้งหมดที่มีในข้อมูล
- ตัวอย่างค่าของแต่ละฟิลด์
- ประเภทข้อมูล (type)
- การวิเคราะห์ความแตกต่าง

### 2. ฟิลด์ที่อาจแตกต่างกัน

#### A. หมายเลขอุปกรณ์

**ฟอร์มใช้:**
```javascript
equipmentNumber: ''  // ใหม่
```

**Firebase อาจใช้:**
```javascript
serialNumber: ''     // เก่า
```

**วิธีแก้:**
- ถ้า Firebase ใช้ `serialNumber` → แมปให้ตรงกับ `equipmentNumber` ในฟอร์ม
- หรือเพิ่ม migration script เพื่อเปลี่ยน field name

#### B. รูปภาพ

**ฟอร์มใช้:**
```javascript
images: []  // Array of images
```

**Firebase อาจใช้:**
```javascript
imageURL: ''  // Single image URL
```

**วิธีแก้:**
- แปลง `imageURL` เป็น `images` array
- หรือรองรับทั้งสองแบบ

#### C. Category

**ฟอร์มใช้:**
```javascript
category: {
  id: 'laptop',
  name: 'โน็คบุค',
  icon: 'default'
}
```

**Firebase อาจใช้:**
```javascript
category: 'laptop'  // String only
```

**วิธีแก้:**
- แปลง string เป็น object ในฟอร์ม
- หรือบันทึกเป็น object ใน Firebase

#### D. Location

**ฟอร์มใช้:**
```javascript
location: {
  building: '',
  floor: '',
  room: '',
  description: ''
}
```

**Firebase อาจใช้:**
```javascript
location: 'อาคาร 1 ชั้น 2 ห้อง 201'  // String only
```

**วิธีแก้:**
- แปลง string เป็น object
- หรือรองรับทั้งสองแบบ

## การแก้ไข

### Option 1: แก้ไขฟอร์มให้รองรับข้อมูลเก่า

```javascript
// ใน EquipmentForm.js
useEffect(() => {
  if (isEdit && equipment) {
    setFormData({
      // รองรับทั้ง equipmentNumber และ serialNumber
      equipmentNumber: equipment.equipmentNumber || equipment.serialNumber || '',
      
      // รองรับทั้ง images array และ imageURL string
      // (จัดการใน image preview)
      
      // แปลง category string เป็น object
      category: typeof equipment.category === 'string' 
        ? { id: equipment.category, name: getCategoryLabel(equipment.category) }
        : equipment.category,
      
      // แปลง location string เป็น object
      location: typeof equipment.location === 'string'
        ? { building: equipment.location, floor: '', room: '', description: '' }
        : equipment.location,
      
      // ... other fields
    });
  }
}, [isEdit, equipment]);
```

### Option 2: Migration Script

สร้างสคริปต์เพื่ออัปเดตข้อมูลเก่าให้ตรงกับ schema ใหม่:

```javascript
// scripts/migrate-equipment-schema.js
async function migrateEquipmentSchema() {
  const snapshot = await db.collection('equipment').get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    
    // Migrate serialNumber to equipmentNumber
    if (data.serialNumber && !data.equipmentNumber) {
      updates.equipmentNumber = data.serialNumber;
    }
    
    // Migrate imageURL to images array
    if (data.imageURL && !data.images) {
      updates.images = [{
        id: 'image-1',
        url: data.imageURL,
        isPrimary: true
      }];
    }
    
    // Migrate category string to object
    if (typeof data.category === 'string') {
      updates.category = {
        id: data.category,
        name: getCategoryLabel(data.category),
        icon: 'default'
      };
    }
    
    // Migrate location string to object
    if (typeof data.location === 'string') {
      updates.location = {
        building: data.location,
        floor: '',
        room: '',
        description: ''
      };
    }
    
    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`✅ Migrated ${doc.id}`);
    }
  }
}
```

### Option 3: ลดฟิลด์ในฟอร์มให้ตรงกับข้อมูลเดิม

ถ้าข้อมูลเดิมมีฟิลด์น้อยกว่า ให้ลดฟิลด์ในฟอร์มให้เหลือเฉพาะที่จำเป็น:

**ฟิลด์หลักที่ควรมี:**
- ชื่ออุปกรณ์ (name) ✅
- หมายเลข (equipmentNumber/serialNumber) ✅
- ประเภท (category) ✅
- ยี่ห้อ (brand) ✅
- รุ่น (model) ✅
- สถานะ (status) ✅
- สถานที่ (location) ✅
- รูปภาพ (imageURL/images) ✅

**ฟิลด์เสริมที่อาจไม่จำเป็น:**
- specifications (ถ้าไม่ได้ใช้)
- purchaseDate (ถ้าไม่ได้ใช้)
- purchasePrice (ถ้าไม่ได้ใช้)
- vendor (ถ้าไม่ได้ใช้)
- warrantyExpiry (ถ้าไม่ได้ใช้)
- responsiblePerson (ถ้าไม่ได้ใช้)
- tags (ถ้าไม่ได้ใช้)
- notes (ถ้าไม่ได้ใช้)

## คำแนะนำ

1. **รันสคริปต์ตรวจสอบก่อน:**
   ```bash
   node scripts/check-equipment-schema.js
   ```

2. **เลือกวิธีแก้ไขที่เหมาะสม:**
   - ถ้าข้อมูลเก่ามีน้อย → ใช้ Option 1 (แก้ไขฟอร์ม)
   - ถ้าข้อมูลเก่ามีเยอะ → ใช้ Option 2 (Migration)
   - ถ้าต้องการความเรียบง่าย → ใช้ Option 3 (ลดฟิลด์)

3. **ทดสอบหลังแก้ไข:**
   - แก้ไขอุปกรณ์เก่า
   - เพิ่มอุปกรณ์ใหม่
   - ตรวจสอบข้อมูลใน Firebase

## สรุป

ปัญหานี้เกิดจากการที่ฟอร์มถูกออกแบบให้รองรับฟีเจอร์มากกว่าข้อมูลเดิม ควรเลือกวิธีแก้ไขที่เหมาะสมกับสถานการณ์:

- **แก้ไขฟอร์ม** = รวดเร็ว แต่ต้องจัดการ backward compatibility
- **Migration** = ถาวร แต่ต้องระวังข้อมูลเสียหาย
- **ลดฟิลด์** = เรียบง่าย แต่เสียฟีเจอร์

แนะนำให้ใช้ **Option 1** (แก้ไขฟอร์ม) เพราะปลอดภัยที่สุดและรองรับทั้งข้อมูลเก่าและใหม่
