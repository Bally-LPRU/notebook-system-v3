# แก้ไขปัญหาการเชื่อมต่อประเภทอุปกรณ์

## ปัญหาที่พบ
ข้อมูลประเภทอุปกรณ์ที่แสดงในหน้าเว็บไม่ตรงกับข้อมูลที่เพิ่มไว้ใน Firebase เนื่องจาก:

1. **EquipmentForm.js** ใช้ `EQUIPMENT_CATEGORY_LABELS` ที่ hardcode ไว้ใน `types/equipment.js`
2. **EquipmentManagementContainer.js** ใช้ hardcoded categories ใน dropdown filter
3. **EquipmentDetailView.js**, **EquipmentListView.js**, **MobileEquipmentCard.js** ใช้ `EQUIPMENT_CATEGORY_LABELS` แทนที่จะแสดงชื่อจาก object

## การแก้ไข

### 1. EquipmentForm.js
- เพิ่ม import `EquipmentCategoryService`
- เพิ่ม state `categories` และ `loadingCategories`
- เพิ่ม useEffect เพื่อโหลดประเภทอุปกรณ์จาก Firebase
- แก้ไข dropdown ให้ใช้ข้อมูลจาก `categories` state
- ลบการใช้ `EQUIPMENT_CATEGORY_LABELS`

```javascript
// โหลดประเภทจาก Firebase
useEffect(() => {
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const categoriesData = await EquipmentCategoryService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      setErrors(prev => ({
        ...prev,
        categories: 'ไม่สามารถโหลดประเภทอุปกรณ์ได้'
      }));
    } finally {
      setLoadingCategories(false);
    }
  };

  loadCategories();
}, []);
```

### 2. EquipmentManagementContainer.js
- เพิ่ม import `EquipmentCategoryService`
- เพิ่ม state `categories`
- เพิ่ม useEffect เพื่อโหลดประเภทอุปกรณ์จาก Firebase
- แก้ไข dropdown filter ให้ใช้ข้อมูลจาก `categories` state

```javascript
// โหลดประเภทจาก Firebase
useEffect(() => {
  const loadCategories = async () => {
    try {
      const categoriesData = await EquipmentCategoryService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  loadCategories();
}, []);
```

### 3. EquipmentDetailView.js, EquipmentListView.js, MobileEquipmentCard.js
- ลบ import `EQUIPMENT_CATEGORY_LABELS`
- แก้ไขการแสดงผลให้ตรวจสอบว่า category เป็น object หรือ string

```javascript
// แทนที่
{EQUIPMENT_CATEGORY_LABELS[equipment.category] || equipment.category}

// ด้วย
{typeof equipment.category === 'object' ? equipment.category?.name : equipment.category}
```

## ผลลัพธ์
- ✅ ประเภทอุปกรณ์ที่แสดงในฟอร์มจะดึงจาก Firebase collection `equipmentCategories`
- ✅ ตัวกรองประเภทอุปกรณ์จะแสดงข้อมูลจาก Firebase
- ✅ การแสดงผลประเภทอุปกรณ์ในรายการและรายละเอียดจะใช้ชื่อจาก object
- ✅ ข้อมูลจะสอดคล้องกันทั้งระบบ

## การทดสอบ
1. เปิดหน้าเพิ่มอุปกรณ์ใหม่ - ตรวจสอบว่า dropdown ประเภทแสดงข้อมูลจาก Firebase
2. เปิดหน้าจัดการอุปกรณ์ - ตรวจสอบว่าตัวกรองประเภทแสดงข้อมูลจาก Firebase
3. ดูรายละเอียดอุปกรณ์ - ตรวจสอบว่าแสดงชื่อประเภทถูกต้อง
4. ดูรายการอุปกรณ์ - ตรวจสอบว่าคอลัมน์ประเภทแสดงชื่อถูกต้อง

## ไฟล์ที่แก้ไข
- ✅ src/components/equipment/EquipmentForm.js
- ✅ src/components/equipment/EquipmentManagementContainer.js
- ✅ src/components/equipment/EquipmentDetailView.js
- ✅ src/components/equipment/EquipmentListView.js
- ✅ src/components/equipment/MobileEquipmentCard.js
- ✅ src/components/equipment/EquipmentCard.js
- ✅ src/components/equipment/EnhancedEquipmentCard.js
- ✅ src/components/search/AdvancedSearchModal.js

## ไฟล์ที่ตรวจสอบแล้วและใช้งานถูกต้อง
- ✅ src/components/equipment/EquipmentFilters.js - ใช้ `useEquipmentCategories` hook
- ✅ src/components/equipment/AdvancedSearchModal.js - ใช้ `useEquipmentCategories` hook
- ✅ src/components/equipment/EquipmentSearch.js - ใช้ service ที่ดึงจาก Firebase
- ✅ src/hooks/useEquipmentCategories.js - ดึงข้อมูลจาก Firebase collection `equipmentCategories`
- ✅ src/services/equipmentFilterService.js - ใช้ `category.id` และ `category.name` จาก object
- ✅ src/services/equipmentSearchService.js - ดึงประเภทจาก Firebase และสร้าง suggestions
- ✅ src/components/equipment/SearchSuggestions.js - รองรับการแสดง category จาก object

## สรุปการเชื่อมต่อข้อมูล

### 1. การโหลดประเภทอุปกรณ์
ทุก component ที่ต้องการแสดงรายการประเภทอุปกรณ์จะใช้หนึ่งในวิธีต่อไปนี้:
- **useEquipmentCategories hook** - สำหรับ React components
- **EquipmentCategoryService** - สำหรับการเรียกใช้โดยตรง
- **equipmentSearchService** - สำหรับการค้นหาและ suggestions

### 2. โครงสร้างข้อมูล Category
```javascript
{
  id: "category-id",
  name: "ชื่อประเภท",
  nameEn: "Category Name",
  icon: "icon-name",
  color: "#color",
  parentId: null,
  level: 0,
  path: "path/to/category",
  isActive: true,
  equipmentCount: 0,
  sortOrder: 0
}
```

### 3. การจัดเก็บ Category ในอุปกรณ์
เมื่อบันทึกอุปกรณ์ category จะถูกเก็บเป็น object:
```javascript
{
  category: {
    id: "category-id",
    name: "ชื่อประเภท",
    icon: "icon-name"
  }
}
```

### 4. การแสดงผล Category
ทุก component จะตรวจสอบว่า category เป็น object หรือ string:
```javascript
{typeof equipment.category === 'object' ? equipment.category?.name : equipment.category}
```

## หมายเหตุ
- ไฟล์ `src/types/equipment.js` ยังคงมี `EQUIPMENT_CATEGORY_LABELS` ไว้เพื่อ backward compatibility แต่ไม่ควรใช้ในโค้ดใหม่
- ระบบจะดึงข้อมูลประเภทจาก Firebase collection `equipmentCategories` เท่านั้น
- การค้นหาและกรองจะใช้ `category.id` สำหรับ query และ `category.name` สำหรับแสดงผล
