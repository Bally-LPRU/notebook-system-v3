# การแก้ไขปัญหาหน้า Profile

## ปัญหาที่พบ

จากการทดสอบเข้าหน้า profile จากเมนู navbar พบข้อผิดพลาดดังนี้:

1. **MinifiedReactError #418** - ปัญหาการ render ของ React
2. **MinifiedReactError #423** - ปัญหา hydration mismatch
3. **Page did not load** - หน้าไม่สามารถโหลดได้

## สาเหตุของปัญหา

### 1. Import Layout ไม่ถูกต้อง
- ProfilePage ใช้ `import { Layout } from '../layout'` แต่ควรใช้ `import Layout from '../layout/Layout'`

### 2. Hydration Mismatch
- `useResponsive` hook ใช้ `window.innerWidth` ตั้งแต่ initial render
- ทำให้ค่าที่ render บน server ไม่ตรงกับ client
- เกิด React hydration error

### 3. Avatar Image ไม่มีการจัดการ Error
- Navbar พยายามโหลด `/default-avatar.png` ที่ไม่มีอยู่
- ไม่มี fallback เมื่อโหลดรูปไม่สำเร็จ

### 4. Form State Initialization
- ProfilePage ใช้ `userProfile` ใน useState initial value
- อาจทำให้เกิดปัญหาเมื่อ userProfile ยังไม่โหลด

## การแก้ไข

### 1. แก้ไข ProfilePage.js

```javascript
// เปลี่ยนจาก
import { Layout } from '../layout';

// เป็น
import Layout from '../layout/Layout';

// เพิ่ม useEffect เพื่ออัปเดต form data
useEffect(() => {
  if (userProfile) {
    setFormData({
      firstName: userProfile.firstName || '',
      lastName: userProfile.lastName || '',
      phoneNumber: userProfile.phoneNumber || '',
      position: userProfile.position || '',
      department: userProfile.department || ''
    });
  }
}, [userProfile]);
```

### 2. แก้ไข useResponsive.js

```javascript
// เปลี่ยน initial state เป็นค่า default ที่ไม่ขึ้นกับ window
const [screenSize, setScreenSize] = useState({
  width: 1024, // Default to desktop size
  height: 768
});

const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
const [isClient, setIsClient] = useState(false);

// เพิ่ม flag เพื่อตรวจสอบว่าอยู่ฝั่ง client แล้ว
useEffect(() => {
  setIsClient(true);
  // ... rest of the code
}, []);
```

### 3. แก้ไข ResponsiveLayout.js

```javascript
// เพิ่มการตรวจสอบ isClient ก่อน render responsive content
if (!isClient) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Render static layout first */}
    </div>
  );
}
```

### 4. แก้ไข Navbar.js

```javascript
// เปลี่ยนจาก
<img src={user?.photoURL || '/default-avatar.png'} />

// เป็น
{user?.photoURL ? (
  <img
    src={user.photoURL}
    onError={(e) => {
      e.target.style.display = 'none';
      e.target.nextSibling.style.display = 'flex';
    }}
  />
) : null}
<div 
  className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center"
  style={{ display: user?.photoURL ? 'none' : 'flex' }}
>
  {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
</div>
```

### 5. สร้าง default-avatar.svg

สร้างไฟล์ `public/default-avatar.svg` เป็น fallback avatar

## ผลลัพธ์

✅ แก้ไข hydration mismatch error
✅ แก้ไข import Layout ให้ถูกต้อง
✅ เพิ่มการจัดการ error สำหรับ avatar image
✅ แก้ไข form state initialization
✅ ไม่มี TypeScript/ESLint errors

## การทดสอบ

1. เข้าสู่ระบบ
2. คลิกที่เมนู "โปรไฟล์" ใน navbar
3. ตรวจสอบว่าหน้า profile โหลดได้ปกติ
4. ตรวจสอบ console ว่าไม่มี error
5. ทดสอบแก้ไขข้อมูล profile

## หมายเหตุ

- การแก้ไข hydration mismatch จะทำให้หน้าเว็บ render ด้วย default desktop layout ก่อน แล้วค่อย adjust เป็น responsive layout หลังจาก client-side hydration เสร็จ
- วิธีนี้จะป้องกัน React hydration error และทำให้ UX ดีขึ้น
