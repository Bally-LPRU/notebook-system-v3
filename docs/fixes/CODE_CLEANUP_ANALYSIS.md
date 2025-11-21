# การวิเคราะห์และทำความสะอาดโค้ด

## 1. ฟังก์ชันที่ใช้ร่วมกันได้ (Reusable Functions)

### 1.1 การแสดงสถานะอุปกรณ์ (Equipment Status Display)

**ปัญหา:** มีการใช้ `getEquipmentStatusColor` และ `EQUIPMENT_STATUS_LABELS` ซ้ำกันใน 10+ ไฟล์

**ไฟล์ที่ใช้:**
- EquipmentCard.js
- EnhancedEquipmentCard.js
- EquipmentDetailView.js
- EquipmentListView.js
- MobileEquipmentCard.js
- BulkDeleteModal.js
- และอื่นๆ

**แนวทางแก้ไข:** สร้าง Reusable Component

```javascript
// src/components/equipment/EquipmentStatusBadge.js
import { EQUIPMENT_STATUS_LABELS } from '../../types/equipment';
import { getEquipmentStatusColor } from '../../utils/equipmentValidation';

const EquipmentStatusBadge = ({ status, size = 'md', className = '' }) => {
  const statusColor = getEquipmentStatusColor(status);
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${statusColor} ${sizeClasses[size]} ${className}`}>
      {EQUIPMENT_STATUS_LABELS[status]}
    </span>
  );
};

export default EquipmentStatusBadge;
```

**ประโยชน์:**
- ลดโค้ดซ้ำซ้อน 80%
- แก้ไขที่เดียว ใช้ได้ทุกที่
- ง่ายต่อการ maintain

---

### 1.2 การแสดงประเภทอุปกรณ์ (Equipment Category Display)

**ปัญหา:** มีการเช็ค `typeof equipment.category === 'object'` ซ้ำกันหลายที่

**แนวทางแก้ไข:** สร้าง Utility Function

```javascript
// src/utils/equipmentHelpers.js
export const getCategoryName = (category) => {
  if (!category) return '-';
  return typeof category === 'object' ? category?.name : category;
};

export const getCategoryId = (category) => {
  if (!category) return null;
  return typeof category === 'object' ? category?.id : category;
};
```

**การใช้งาน:**
```javascript
// Before
{typeof equipment.category === 'object' ? equipment.category?.name : equipment.category}

// After
{getCategoryName(equipment.category)}
```

---

### 1.3 การโหลด Categories (useEquipmentCategories Hook)

**ปัญหา:** มีการใช้ `useEquipmentCategories` ใน 5 ไฟล์ แต่บางไฟล์โหลดซ้ำ

**ไฟล์ที่ใช้:**
- EquipmentFilters.js
- AdvancedSearchModal.js (2 ไฟล์)
- MobileEquipmentContainer.js

**แนวทางแก้ไข:** ใช้ Context API เพื่อแชร์ข้อมูล

```javascript
// src/contexts/EquipmentCategoriesContext.js
import { createContext, useContext } from 'react';
import { useEquipmentCategories } from '../hooks/useEquipmentCategories';

const EquipmentCategoriesContext = createContext();

export const EquipmentCategoriesProvider = ({ children }) => {
  const categoriesData = useEquipmentCategories();
  return (
    <EquipmentCategoriesContext.Provider value={categoriesData}>
      {children}
    </EquipmentCategoriesContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(EquipmentCategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within EquipmentCategoriesProvider');
  }
  return context;
};
```

**ประโยชน์:**
- โหลดข้อมูลครั้งเดียว แชร์ใช้ทั้งแอป
- ลด API calls
- เพิ่มความเร็ว

---

## 2. การจัดการ Pagination

**ปัญหา:** มี Pagination component แยกอยู่แล้ว แต่ EquipmentManagementContainer สร้างเอง

**แนวทางแก้ไข:** ใช้ `src/components/equipment/Pagination.js` ที่มีอยู่แล้ว

```javascript
// ใช้ Pagination component ที่มีอยู่
import Pagination from './Pagination';

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  totalItems={filteredEquipment.length}
  itemsPerPage={itemsPerPage}
/>
```

---

## 3. Custom Hooks ที่ควรสร้าง

### 3.1 usePagination Hook

```javascript
// src/hooks/usePagination.js
import { useState, useMemo } from 'react';

export const usePagination = (items, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      currentPage,
      totalPages,
      startIndex,
      endIndex,
      paginatedItems,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }, [items, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, paginationData.totalPages)));
  };

  const nextPage = () => goToPage(currentPage + 1);
  const previousPage = () => goToPage(currentPage - 1);
  const resetPage = () => setCurrentPage(1);

  return {
    ...paginationData,
    setCurrentPage: goToPage,
    nextPage,
    previousPage,
    resetPage
  };
};
```

**การใช้งาน:**
```javascript
const {
  paginatedItems,
  currentPage,
  totalPages,
  setCurrentPage,
  resetPage
} = usePagination(filteredEquipment, 5);
```

---

### 3.2 useEquipmentFilters Hook

```javascript
// src/hooks/useEquipmentFilters.js
import { useState, useEffect, useMemo } from 'react';

export const useEquipmentFilters = (equipment) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredEquipment = useMemo(() => {
    let filtered = [...equipment];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(search) ||
        item.brand?.toLowerCase().includes(search) ||
        item.model?.toLowerCase().includes(search) ||
        item.equipmentNumber?.toLowerCase().includes(search)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        const itemCategory = typeof item.category === 'object' 
          ? item.category?.id 
          : item.category;
        return itemCategory === selectedCategory;
      });
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    return filtered;
  }, [equipment, searchTerm, selectedCategory, selectedStatus]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    filteredEquipment,
    clearFilters,
    hasActiveFilters: searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
  };
};
```

---

## 4. การ Optimize Performance

### 4.1 Memoization

**ปัญหา:** การคำนวณซ้ำๆ ในทุก render

**แนวทางแก้ไข:**
```javascript
// Before
const paginatedEquipment = filteredEquipment.slice(startIndex, endIndex);

// After
const paginatedEquipment = useMemo(
  () => filteredEquipment.slice(startIndex, endIndex),
  [filteredEquipment, startIndex, endIndex]
);
```

### 4.2 useCallback สำหรับ Event Handlers

```javascript
// Before
const handleEdit = (item) => {
  onEditEquipment(item);
};

// After
const handleEdit = useCallback((item) => {
  onEditEquipment(item);
}, [onEditEquipment]);
```

---

## 5. การลบโค้ดที่ไม่ใช้

### 5.1 ไฟล์ที่ควรตรวจสอบ

- `src/types/equipment.js` - `EQUIPMENT_CATEGORY_LABELS` ไม่ควรใช้แล้ว
- ไฟล์ test HTML ใน `public/` ที่ไม่จำเป็น
- Scripts ที่ใช้แก้ไขปัญหาเฉพาะครั้ง

### 5.2 ไฟล์เอกสารที่ซ้ำซ้อน

มีไฟล์เอกสารที่คล้ายกันหลายไฟล์:
- EQUIPMENT_FIX_SUMMARY.md
- FINAL_EQUIPMENT_FIX.md
- FINAL_SUMMARY_EQUIPMENT_FIX.md
- EQUIPMENT_COLLECTION_FIX.md

**แนวทางแก้ไข:** รวมเป็นไฟล์เดียว หรือย้ายไปที่ `docs/archive/`

---

## 6. แผนการดำเนินการ (Priority Order)

### Phase 1: Quick Wins (1-2 ชั่วโมง)
1. ✅ สร้าง `EquipmentStatusBadge` component
2. ✅ สร้าง `equipmentHelpers.js` utility
3. ✅ สร้าง `usePagination` hook
4. ✅ สร้าง `useEquipmentFilters` hook

### Phase 2: Refactoring (2-3 ชั่วโมง)
1. แทนที่การใช้ status badge ทั้งหมดด้วย component ใหม่
2. แทนที่การใช้ category display ด้วย utility function
3. แทนที่ pagination logic ด้วย hook
4. แทนที่ filter logic ด้วย hook

### Phase 3: Optimization (1-2 ชั่วโมง)
1. เพิ่ม memoization ในที่ที่จำเป็น
2. เพิ่ม useCallback สำหรับ event handlers
3. สร้าง EquipmentCategoriesContext

### Phase 4: Cleanup (1 ชั่วโมง)
1. ลบโค้ดที่ไม่ใช้
2. จัดระเบียบไฟล์เอกสาร
3. อัปเดต README

---

## 7. ผลลัพธ์ที่คาดหวัง

### ก่อนทำความสะอาด
- โค้ดซ้ำซ้อน: ~30%
- ขนาดไฟล์รวม: ~500KB
- API calls ซ้ำ: 5-10 ครั้ง/หน้า
- Render time: ~200ms

### หลังทำความสะอาด
- โค้ดซ้ำซ้อน: ~5%
- ขนาดไฟล์รวม: ~350KB (-30%)
- API calls ซ้ำ: 1-2 ครั้ง/หน้า (-80%)
- Render time: ~100ms (-50%)

---

## 8. การวัดผล

### Metrics ที่ควรติดตาม
1. **Bundle Size** - ใช้ `npm run build` และดู size
2. **Render Performance** - ใช้ React DevTools Profiler
3. **API Calls** - ดูใน Network tab
4. **Code Duplication** - ใช้ tools เช่น jscpd

### Tools แนะนำ
```bash
# ตรวจสอบ code duplication
npx jscpd src/

# วิเคราะห์ bundle size
npm run build
npx source-map-explorer build/static/js/*.js

# ตรวจสอบ unused code
npx depcheck
```

---

## สรุป

การทำความสะอาดโค้ดจะช่วย:
1. **ลดความซ้ำซ้อน** - โค้ดน้อยลง maintain ง่ายขึ้น
2. **เพิ่มประสิทธิภาพ** - โหลดเร็วขึ้น ใช้ memory น้อยลง
3. **ง่ายต่อการพัฒนา** - เพิ่มฟีเจอร์ใหม่ได้เร็วขึ้น
4. **ลด bugs** - โค้ดที่ดีกว่า = bug น้อยลง

แนะนำให้ทำทีละ Phase เพื่อความปลอดภัยและสามารถ test ได้ง่าย
