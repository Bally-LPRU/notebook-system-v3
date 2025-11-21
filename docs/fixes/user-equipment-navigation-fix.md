# การแก้ไขปัญหาการนำทางและการแสดงอุปกรณ์สำหรับผู้ใช้

## ปัญหาที่พบ

ผู้ใช้ทั่วไป (non-admin) ไม่สามารถเข้าถึงหน้าอุปกรณ์ได้ แม้ว่า Dashboard จะแสดงจำนวนอุปกรณ์ได้ เนื่องจาก:

1. **Navbar ไม่มีเมนูสำหรับผู้ใช้ทั่วไป**: เมนูนำทางถูกซ่อนไว้และแสดงเฉพาะใน mobile menu
2. **Dashboard route ไม่ถูกต้อง**: ใช้ `/` แทน `/dashboard` ทำให้การนำทางไม่สอดคล้องกัน
3. **ไม่มีลิงก์ชัดเจนไปหน้าอุปกรณ์**: ผู้ใช้ต้องพึ่งพา QuickActions เท่านั้น

## การแก้ไข

### 1. เพิ่มเมนูนำทางสำหรับผู้ใช้ทั่วไปใน Navbar (Desktop)

**ไฟล์**: `src/components/layout/Navbar.js`

เพิ่มเมนูนำทางแบบ desktop สำหรับผู้ใช้ทั่วไป:

```javascript
{/* Desktop Navigation - Show for non-admin users */}
{!isAdmin && (
  <div className="hidden md:flex items-center space-x-1">
    {navigationItems.map((item) => (
      <Link
        key={item.name}
        to={item.href}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
          isActivePath(item.href)
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        {getIcon(item.icon)}
        <span className="ml-2">{item.name}</span>
      </Link>
    ))}
  </div>
)}
```

### 2. ปรับปรุงรายการเมนู

ลบเมนู "การจองของฉัน" ที่ซ้ำซ้อนและปรับชื่อให้ชัดเจน:

```javascript
const navigationItems = [
  { name: 'แดชบอร์ด', href: '/dashboard', icon: 'dashboard' },
  { name: 'รายการอุปกรณ์', href: '/equipment', icon: 'equipment' },
  { name: 'จองอุปกรณ์', href: '/reservations', icon: 'reservations' },
  { name: 'คำขอของฉัน', href: '/my-requests', icon: 'requests' },
];
```

### 3. แก้ไข Dashboard Route

**ไฟล์**: `src/App.js`

เพิ่ม route `/dashboard` และ redirect จาก `/` ไปยัง `/dashboard`:

```javascript
<Route path="/" element={
  <ProtectedRoute>
    {userProfile?.role === 'admin' ? (
      <Navigate to="/admin" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    )}
  </ProtectedRoute>
} />

<Route path="/dashboard" element={
  <ProtectedRoute>
    <LazyDashboard />
  </ProtectedRoute>
} />
```

## โครงสร้างการนำทางที่ได้

### สำหรับผู้ใช้ทั่วไป (User)

**Desktop Navigation (Navbar)**:
- แดชบอร์ด (`/dashboard`)
- รายการอุปกรณ์ (`/equipment`)
- จองอุปกรณ์ (`/reservations`)
- คำขอของฉัน (`/my-requests`)

**Mobile Navigation (Hamburger Menu)**:
- เมนูเดียวกับ Desktop

**Quick Actions (Dashboard)**:
- ยืมอุปกรณ์ → `/equipment`
- จองอุปกรณ์ → `/reservations`
- คำขอของฉัน → `/my-requests`
- การแจ้งเตือน → `/notifications`

### สำหรับผู้ดูแลระบบ (Admin)

**Sidebar Navigation**:
- แดชบอร์ดผู้ดูแล (`/admin`)
- จัดการผู้ใช้ (`/admin/users`)
- จัดการอุปกรณ์ (`/admin/equipment`)
- จัดการหมวดหมู่ (`/admin/categories`)
- คำขอยืม (`/admin/loan-requests`)
- การจอง (`/admin/reservations`)
- รายงาน (`/admin/reports`)
- การแจ้งเตือน (`/admin/notifications`)
- ตั้งค่าระบบ (`/admin/settings`)

## การทดสอบ

### ทดสอบการนำทาง

1. **ผู้ใช้ทั่วไป**:
   - ✅ เข้าสู่ระบบและถูก redirect ไปยัง `/dashboard`
   - ✅ เห็นเมนูนำทางใน Navbar (Desktop)
   - ✅ คลิก "รายการอุปกรณ์" ไปยัง `/equipment` ได้
   - ✅ คลิก "จองอุปกรณ์" ไปยัง `/reservations` ได้
   - ✅ คลิก "คำขอของฉัน" ไปยัง `/my-requests` ได้

2. **ผู้ดูแลระบบ**:
   - ✅ เข้าสู่ระบบและถูก redirect ไปยัง `/admin`
   - ✅ ใช้ Sidebar สำหรับการนำทาง
   - ✅ ไม่เห็นเมนูนำทางใน Navbar (ใช้ Sidebar แทน)

### ทดสอบการแสดงข้อมูล

1. **หน้า Dashboard** (`/dashboard`):
   - ✅ แสดงจำนวนอุปกรณ์ทั้งหมด
   - ✅ แสดงจำนวนอุปกรณ์ว่าง
   - ✅ แสดง Quick Actions

2. **หน้ารายการอุปกรณ์** (`/equipment`):
   - ✅ แสดงรายการอุปกรณ์ทั้งหมด
   - ✅ สามารถค้นหาและกรองได้
   - ✅ สามารถคลิกยืมอุปกรณ์ได้

3. **หน้าจองอุปกรณ์** (`/reservations`):
   - ✅ แสดงรายการอุปกรณ์ที่สามารถจองได้
   - ✅ แสดงปฏิทินการจอง
   - ✅ สามารถส่งคำขอจองได้

4. **หน้าคำขอของฉัน** (`/my-requests`):
   - ✅ แสดงคำขอยืมทั้งหมด
   - ✅ แสดงการจองทั้งหมด
   - ✅ แสดงสถานะของแต่ละคำขอ

## Firestore Rules

ตรวจสอบว่า Firestore rules อนุญาตให้ผู้ใช้ทั่วไปอ่านข้อมูลอุปกรณ์ได้:

```javascript
// Equipment Management collection rules
match /equipmentManagement/{equipmentId} {
  // Allow public read for statistics (but not sensitive data)
  allow read: if true;
  
  allow create: if isAdmin() && 
                   request.resource.data.createdBy == request.auth.uid &&
                   request.resource.data.createdAt == request.time;
  
  allow update: if isAdmin();
  
  allow delete: if isAdmin();
}
```

## ปัญหาที่อาจพบและวิธีแก้ไข

### 1. ไม่พบข้อมูลอุปกรณ์

**สาเหตุ**: Collection name ไม่ตรงกัน

**วิธีแก้**:
- ตรวจสอบว่าใช้ collection `equipmentManagement` (ไม่ใช่ `equipment`)
- ตรวจสอบว่ามีข้อมูลใน collection

### 2. Permission Denied

**สาเหตุ**: Firestore rules ไม่อนุญาต

**วิธีแก้**:
- ตรวจสอบ Firestore rules
- ตรวจสอบว่าผู้ใช้ login แล้ว
- ตรวจสอบว่าผู้ใช้มีสถานะ `approved`

### 3. เมนูไม่แสดง

**สาเหตุ**: CSS หรือ responsive design

**วิธีแก้**:
- ตรวจสอบ breakpoint ของ Tailwind CSS
- ตรวจสอบว่า `isAdmin` ทำงานถูกต้อง

## สรุป

การแก้ไขนี้ทำให้:
1. ผู้ใช้ทั่วไปสามารถเข้าถึงหน้าอุปกรณ์ได้ง่ายขึ้น
2. การนำทางมีความสอดคล้องและชัดเจน
3. UX ดีขึ้นสำหรับผู้ใช้ทั่วไป
4. แยกการนำทางระหว่างผู้ใช้ทั่วไปและผู้ดูแลระบบอย่างชัดเจน

## ไฟล์ที่แก้ไข

1. `src/components/layout/Navbar.js` - เพิ่มเมนูนำทาง desktop
2. `src/App.js` - แก้ไข dashboard route
3. `docs/fixes/user-equipment-navigation-fix.md` - เอกสารนี้
