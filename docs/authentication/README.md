# Authentication Documentation

เอกสารเกี่ยวกับระบบ Authentication

## 📁 เอกสารในโฟลเดอร์นี้

### Authentication Flow
- `auth-flow-logic.md` - Logic การ Authentication
- `fix-approved-status-redirect.md` - แก้ไขปัญหา Redirect

## 🔐 Authentication Flow

### 1. การลงทะเบียน (Registration)
```
User → Register Form → Firebase Auth → Create User Doc → Pending Status
```

**ขั้นตอน:**
1. ผู้ใช้กรอกข้อมูลในฟอร์มลงทะเบียน
2. ระบบสร้าง Firebase Auth account
3. สร้าง document ใน users collection
4. ตั้งสถานะเป็น "pending"
5. รอการอนุมัติจากผู้ดูแล

### 2. การอนุมัติ (Approval)
```
Admin → Review User → Approve/Reject → Update Status → Notify User
```

**ขั้นตอน:**
1. ผู้ดูแลตรวจสอบข้อมูลผู้ใช้
2. อนุมัติหรือปฏิเสธ
3. อัปเดตสถานะใน database
4. ส่งการแจ้งเตือนให้ผู้ใช้

### 3. การเข้าสู่ระบบ (Login)
```
User → Login Form → Firebase Auth → Check Status → Redirect
```

**ขั้นตอน:**
1. ผู้ใช้กรอก email/password
2. Firebase Auth ตรวจสอบ credentials
3. ตรวจสอบสถานะผู้ใช้
4. Redirect ตามสถานะ:
   - **pending** → Waiting page
   - **approved** → Dashboard
   - **rejected** → Rejected page
   - **suspended** → Suspended page

## 🎭 User Roles

### Admin
- จัดการผู้ใช้
- จัดการอุปกรณ์
- อนุมัติคำขอยืม
- ดูรายงาน
- ตั้งค่าระบบ

### User
- ค้นหาอุปกรณ์
- ขอยืมอุปกรณ์
- จองอุปกรณ์
- ดูประวัติ
- แก้ไขโปรไฟล์

## 📊 User Status

### pending
- ผู้ใช้ลงทะเบียนแล้ว
- รอการอนุมัติ
- ไม่สามารถใช้งานระบบได้

### approved
- ได้รับการอนุมัติแล้ว
- สามารถใช้งานระบบได้เต็มรูปแบบ

### rejected
- ถูกปฏิเสธ
- ไม่สามารถใช้งานระบบได้
- สามารถลงทะเบียนใหม่ได้

### suspended
- ถูกระงับการใช้งาน
- ไม่สามารถใช้งานระบบได้ชั่วคราว
- รอการพิจารณาจากผู้ดูแล

## 🔧 Implementation

### AuthContext
```javascript
// src/contexts/AuthContext.js
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication logic
  // ...

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Protected Routes
```javascript
// ตรวจสอบ authentication
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;

  return children;
};

// ตรวจสอบ role
const AdminRoute = ({ children }) => {
  const { userProfile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (userProfile?.role !== 'admin') {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

// ตรวจสอบ status
const ApprovedRoute = ({ children }) => {
  const { userProfile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (userProfile?.status !== 'approved') {
    return <Navigate to="/waiting-approval" />;
  }

  return children;
};
```

## 🔒 Security

### Firebase Auth
- Email/Password authentication
- Email verification (optional)
- Password reset
- Session management

### Security Rules
```javascript
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isApproved() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'approved';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && 
                     (request.auth.uid == userId || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
                       (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }
  }
}
```

## 🐛 Common Issues

### 1. Redirect Loop
**สาเหตุ:** Status check ไม่ถูกต้อง  
**แก้ไข:** ตรวจสอบ logic ใน `auth-flow-logic.md`

### 2. Permission Denied
**สาเหตุ:** Security rules เข้มงวดเกินไป  
**แก้ไข:** ตรวจสอบ Firestore rules

### 3. User Not Found
**สาเหตุ:** User document ไม่ถูกสร้าง  
**แก้ไข:** ตรวจสอบ registration flow

## 🔗 เอกสารที่เกี่ยวข้อง

- [Admin System](../admin-system/)
- [User Guides](../user-guides/)
- [Database](../database/)

## 📝 Best Practices

### 1. Always Check Status
ตรวจสอบสถานะผู้ใช้ก่อนอนุญาตให้เข้าถึงทรัพยากร

### 2. Use Protected Routes
ใช้ Protected Routes สำหรับหน้าที่ต้อง authentication

### 3. Handle Errors Gracefully
แสดง error messages ที่เป็นมิตรกับผู้ใช้

### 4. Implement Logging
บันทึก authentication events สำหรับ audit

### 5. Regular Security Audits
ตรวจสอบ security rules เป็นประจำ
