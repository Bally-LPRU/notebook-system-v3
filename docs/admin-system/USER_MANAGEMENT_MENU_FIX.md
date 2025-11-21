# การแก้ไขปัญหา Menu Bar ในหน้าจัดการผู้ใช้งาน

## ปัญหาที่พบ

เมื่อคลิกที่เมนูต่างๆ ในหน้าจัดการผู้ใช้งาน พบข้อผิดพลาด:

```
Error: Minified React error #31
object with keys {dean-office}
```

## สาเหตุของปัญหา

**React Error #31** หมายถึง "Objects are not valid as a React child"

ปัญหาเกิดจากการพยายาม render `department` object โดยตรงใน JSX:

```javascript
// ❌ ผิด - พยายาม render object
{user.department}  // เมื่อ department = {value: 'dean-office', label: 'สำนักงานคณบดี'}
```

ใน Firestore ข้อมูล `department` ถูกเก็บเป็น object ที่มี structure:
```javascript
{
  value: 'dean-office',
  label: 'สำนักงานคณบดี'
}
```

เมื่อพยายาม render object นี้โดยตรง React จะเกิด error

## ไฟล์ที่แก้ไข

### 1. UserManagementTable.js

**ปัญหา:** แสดง department โดยตรงในตาราง

**แก้ไข:**
```javascript
// เปลี่ยนจาก
<div className="text-sm text-gray-900">
  {user.department?.label || user.department || '-'}
</div>

// เป็น
<div className="text-sm text-gray-900">
  {typeof user.department === 'object' && user.department !== null
    ? user.department.label || user.department.value || '-'
    : user.department || '-'}
</div>
```

### 2. UserApprovalCard.js

**ปัญหา:** แสดง department ในการ์ดอนุมัติผู้ใช้

**แก้ไข:**
```javascript
// เปลี่ยนจาก
<span>🏢 {user.department || 'ไม่ระบุ'}</span>

// เป็น
<span>🏢 {typeof user.department === 'object' && user.department !== null
  ? user.department.label || user.department.value || 'ไม่ระบุ'
  : user.department || 'ไม่ระบุ'}</span>
```

### 3. UserEditModal.js

**ปัญหา:** โหลด department object เข้า form input

**แก้ไข:**
```javascript
useEffect(() => {
  if (user) {
    // Handle department - extract label if it's an object
    let departmentValue = '';
    if (typeof user.department === 'object' && user.department !== null) {
      departmentValue = user.department.label || user.department.value || '';
    } else {
      departmentValue = user.department || '';
    }

    setFormData({
      displayName: user.displayName || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      department: departmentValue,  // ใช้ string แทน object
      role: user.role || 'user',
      status: user.status || 'pending'
    });
  }
}, [user]);
```

## วิธีการแก้ไข

การแก้ไขใช้หลักการ:

1. **ตรวจสอบ type ของ department** ก่อนแสดงผล
2. **Extract label หรือ value** ถ้าเป็น object
3. **Fallback เป็น string** ถ้าไม่ใช่ object

```javascript
// Pattern ที่ใช้
typeof user.department === 'object' && user.department !== null
  ? user.department.label || user.department.value || '-'
  : user.department || '-'
```

## ผลลัพธ์

✅ แก้ไข React Error #31
✅ แสดง department ได้ถูกต้องทั้งแบบ object และ string
✅ รองรับทั้งข้อมูลเก่า (string) และข้อมูลใหม่ (object)
✅ ไม่มี TypeScript/ESLint errors

## การทดสอบ

1. เข้าหน้าจัดการผู้ใช้งาน
2. คลิกที่แท็บต่างๆ:
   - รอการอนุมัติ
   - ทั้งหมด
   - อนุมัติแล้ว
   - ปฏิเสธ
   - ระงับ
3. ตรวจสอบว่าแสดงข้อมูล department ได้ถูกต้อง
4. ทดสอบแก้ไขข้อมูลผู้ใช้
5. ตรวจสอบ console ว่าไม่มี error

## หมายเหตุ

- การแก้ไขนี้รองรับทั้งข้อมูลเก่าที่เป็น string และข้อมูลใหม่ที่เป็น object
- ถ้าต้องการให้ทุกที่ใช้ department แบบเดียวกัน ควรสร้าง utility function:

```javascript
// utils/departmentHelper.js
export const getDepartmentLabel = (department) => {
  if (typeof department === 'object' && department !== null) {
    return department.label || department.value || '-';
  }
  return department || '-';
};

// ใช้งาน
import { getDepartmentLabel } from '../../utils/departmentHelper';
<span>{getDepartmentLabel(user.department)}</span>
```
