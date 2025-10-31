# เอกสารการออกแบบระบบ - ระบบยืม-คืนโน็คบุคและอุปกรณ์คอมพิวเตอร์

## ภาพรวม

ระบบยืม-คืนโน็คบุคและอุปกรณ์คอมพิวเตอร์เป็นเว็บแอปพลิเคชันที่พัฒนาด้วย React.js และ Tailwind CSS โดยใช้ Firebase เป็นฐานข้อมูลและ Google OAuth สำหรับการยืนยันตัวตน ระบบออกแบบให้รองรับการใช้งานทั้งบนเดสก์ท็อปและมือถือ (Responsive Design)

## สถาปัตยกรรมระบบ

### Frontend Architecture
```
┌─────────────────────────────────────────┐
│              React.js App               │
├─────────────────────────────────────────┤
│  Components (Tailwind CSS Styling)     │
├─────────────────────────────────────────┤
│         State Management                │
│      (React Context/Redux)              │
├─────────────────────────────────────────┤
│        Firebase SDK                     │
├─────────────────────────────────────────┤
│    Google OAuth Authentication          │
└─────────────────────────────────────────┘
```

### Backend Architecture (Firebase)
```
┌─────────────────────────────────────────┐
│         Firebase Services              │
├─────────────────────────────────────────┤
│  • Authentication (Google OAuth)       │
│  • Firestore Database                  │
│  • Cloud Functions (Optional)          │
│  • Firebase Hosting                    │
│  • Cloud Storage (สำหรับรูปภาพ)        │
└─────────────────────────────────────────┘
```

## คอมโพเนนต์และอินเทอร์เฟซ

### 1. Authentication Components

#### LoginPage Component
- **วัตถุประสงค์**: หน้าเข้าสู่ระบบด้วย Google OAuth
- **Props**: None
- **State**: loading, error
- **Features**:
  - ปุ่ม "Sign in with Google"
  - รองรับ @gmail.com และ @g.lpru.ac.th
  - Redirect ไปหน้า Profile Setup สำหรับผู้ใช้ใหม่

#### ProfileSetupPage Component
- **วัตถุประสงค์**: หน้ากรอกข้อมูลเพิ่มเติมสำหรับผู้ใช้ใหม่
- **Props**: user (from auth context)
- **State**: formData, loading, errors
- **Fields**:
  - ชื่อ-นามสกุล (required)
  - เบอร์โทรศัพท์ (required)
  - สังกัด/แผนก (required)
  - ประเภทผู้ใช้ (dropdown: นักศึกษา, อาจารย์, เจ้าหน้าที่)

### 2. Layout Components

#### Navbar Component
- **วัตถุประสงค์**: แถบนำทางหลัก
- **Props**: user, userRole
- **Features**:
  - Logo และชื่อระบบ
  - เมนูนำทาง (Dashboard, Equipment, My Requests, Reports)
  - User profile dropdown
  - Logout button
  - Responsive hamburger menu สำหรับมือถือ

#### Sidebar Component (Admin)
- **วัตถุประสงค์**: เมนูด้านข้างสำหรับผู้ดูแลระบบ
- **Props**: activeMenu
- **Features**:
  - Dashboard
  - Equipment Management
  - User Management
  - Loan Requests
  - Reservations
  - Reports

### 3. Equipment Management Components

#### EquipmentList Component
- **วัตถุประสงค์**: แสดงรายการอุปกรณ์ทั้งหมด
- **Props**: userRole, searchFilters
- **State**: equipment, loading, filters
- **Features**:
  - Search และ Filter (ประเภท, สถานะ, ความพร้อมใช้งาน)
  - Card layout แสดงข้อมูลอุปกรณ์
  - Status badges (Available, Borrowed, Maintenance)
  - Quick action buttons (Borrow, Reserve, Edit)

#### EquipmentCard Component
- **วัตถุประสงค์**: แสดงข้อมูลอุปกรณ์แต่ละชิ้น
- **Props**: equipment, userRole, onAction
- **Features**:
  - รูปภาพอุปกรณ์
  - ชื่อ, รุ่น, หมายเลขซีเรียล
  - Status indicator
  - Action buttons ตาม role และสถานะ

#### EquipmentForm Component
- **วัตถุประสงค์**: ฟอร์มเพิ่ม/แก้ไขอุปกรณ์
- **Props**: equipment (optional), onSubmit, onCancel
- **State**: formData, imageFile, loading
- **Fields**:
  - ชื่ออุปกรณ์ (required)
  - ประเภท (dropdown)
  - รุ่น/ยี่ห้อ
  - หมายเลขซีเรียล (unique)
  - รายละเอียด
  - รูปภาพ (upload)
  - สถานะ (dropdown)

### 4. Loan Management Components

#### LoanRequestForm Component
- **วัตถุประสงค์**: ฟอร์มขอยืมอุปกรณ์
- **Props**: equipment, onSubmit
- **State**: formData, loading
- **Fields**:
  - วันที่ต้องการยืม
  - วันที่คาดว่าจะคืน
  - วัตถุประสงค์การใช้งาน
  - หมายเหตุเพิ่มเติม

#### LoanRequestList Component
- **วัตถุประสงค์**: แสดงรายการคำขอยืม
- **Props**: userRole, status
- **State**: requests, loading, filters
- **Features**:
  - Filter ตามสถานะ (Pending, Approved, Rejected, Returned)
  - Sort ตามวันที่
  - Pagination
  - Bulk actions สำหรับ admin

#### LoanRequestCard Component
- **วัตถุประสงค์**: แสดงข้อมูลคำขอยืมแต่ละรายการ
- **Props**: request, userRole, onAction
- **Features**:
  - ข้อมูลผู้ขอยืมและอุปกรณ์
  - Timeline แสดงสถานะ
  - Action buttons (Approve, Reject, Return)

### 5. Reservation Components

#### ReservationCalendar Component
- **วัตถุประสงค์**: ปฏิทินแสดงการจองอุปกรณ์
- **Props**: equipment, onDateSelect
- **State**: selectedDate, reservations, loading
- **Features**:
  - Calendar view (monthly/weekly)
  - แสดงช่วงเวลาที่ว่างและถูกจอง
  - Click เพื่อเลือกวันที่จอง
  - Color coding ตามสถานะ

#### ReservationForm Component
- **วัตถุประสงค์**: ฟอร์มจองอุปกรณ์ล่วงหน้า
- **Props**: equipment, selectedDate, onSubmit
- **State**: formData, timeSlots, loading
- **Fields**:
  - วันที่จอง
  - เวลาเริ่มต้น - สิ้นสุด
  - วัตถุประสงค์
  - หมายเหตุ

### 6. User Management Components

#### UserList Component (Admin)
- **วัตถุประสงค์**: แสดงรายการผู้ใช้ทั้งหมด
- **Props**: None
- **State**: users, loading, filters
- **Features**:
  - Search และ Filter ตามสถานะ
  - Approve/Reject pending users
  - Edit user roles
  - Suspend/Activate users

#### UserApprovalCard Component
- **วัตถุประสงค์**: แสดงข้อมูลผู้ใช้ที่รอการอนุมัติ
- **Props**: user, onApprove, onReject
- **Features**:
  - ข้อมูลผู้ใช้จาก Google profile
  - ข้อมูลเพิ่มเติมที่กรอก
  - Approve/Reject buttons

### 7. Notification Components

#### NotificationCenter Component
- **วัตถุประสงค์**: ศูนย์กลางการแจ้งเตือนของผู้ใช้
- **Props**: user
- **State**: notifications, unreadCount, loading
- **Features**:
  - แสดงรายการการแจ้งเตือนทั้งหมด
  - Mark as read/unread
  - Filter ตามประเภท (loan, reservation, approval, reminder)
  - Delete notifications
  - Real-time updates

#### NotificationBell Component
- **วัตถุประสงค์**: ไอคอนแจ้งเตือนใน Navbar
- **Props**: unreadCount, onClick
- **Features**:
  - Badge แสดงจำนวนการแจ้งเตือนที่ยังไม่อ่าน
  - Dropdown แสดงการแจ้งเตือนล่าสุด 5 รายการ
  - Animation เมื่อมีการแจ้งเตือนใหม่

#### NotificationToast Component
- **วัตถุประสงค์**: แสดงการแจ้งเตือนแบบ popup
- **Props**: notification, onClose, duration
- **Features**:
  - Auto-dismiss หลังจากเวลาที่กำหนด
  - Different styles ตามประเภท (success, warning, error, info)
  - Action buttons (ถ้ามี)

#### NotificationSettings Component
- **วัตถุประสงค์**: ตั้งค่าการแจ้งเตือนของผู้ใช้
- **Props**: user, onSave
- **State**: settings, loading
- **Features**:
  - เปิด/ปิดการแจ้งเตือนแต่ละประเภท
  - ตั้งเวลาการแจ้งเตือนล่วงหน้า
  - เลือกช่องทางการแจ้งเตือน (in-app, email)

### 8. Dashboard Components

#### DashboardStats Component
- **วัตถุประสงค์**: แสดงสถิติภาพรวม
- **Props**: userRole
- **State**: stats, loading
- **Features**:
  - จำนวนอุปกรณ์ทั้งหมด/ว่าง/ถูกยืม
  - จำนวนคำขอรอการอนุมัติ
  - การจองวันนี้
  - อุปกรณ์ที่ครบกำหนดคืน

#### RecentActivity Component
- **วัตถุประสงค์**: แสดงกิจกรรมล่าสุด
- **Props**: userRole
- **State**: activities, loading
- **Features**:
  - รายการกิจกรรมล่าสุด 10 รายการ
  - Timeline format
  - Filter ตามประเภทกิจกรรม

## โมเดลข้อมูล (Firestore Collections)

### Users Collection
```javascript
{
  uid: string,                    // Firebase Auth UID
  email: string,                  // อีเมลจาก Google
  displayName: string,            // ชื่อจาก Google
  photoURL: string,              // รูปโปรไฟล์จาก Google
  // ข้อมูลเพิ่มเติม
  firstName: string,              // ชื่อจริง
  lastName: string,               // นามสกุล
  phoneNumber: string,            // เบอร์โทรศัพท์
  department: string,             // สังกัด/แผนก
  userType: string,               // ประเภท: student, teacher, staff
  role: string,                   // บทบาท: user, admin
  status: string,                 // สถานะ: pending, approved, suspended
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Equipment Collection
```javascript
{
  id: string,                     // Auto-generated ID
  name: string,                   // ชื่ออุปกรณ์
  category: string,               // ประเภท: laptop, desktop, tablet, etc.
  brand: string,                  // ยี่ห้อ
  model: string,                  // รุ่น
  serialNumber: string,           // หมายเลขซีเรียล (unique)
  description: string,            // รายละเอียด
  imageURL: string,               // URL รูปภาพ
  status: string,                 // สถานะ: available, borrowed, maintenance, retired
  location: string,               // สถานที่เก็บ
  purchaseDate: timestamp,        // วันที่ซื้อ
  warrantyExpiry: timestamp,      // วันหมดประกัน
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string               // UID ของผู้สร้าง
}
```

### LoanRequests Collection
```javascript
{
  id: string,                     // Auto-generated ID
  equipmentId: string,            // Reference to Equipment
  userId: string,                 // Reference to User
  requestDate: timestamp,         // วันที่ขอยืม
  borrowDate: timestamp,          // วันที่ต้องการยืม
  expectedReturnDate: timestamp,  // วันที่คาดว่าจะคืน
  actualReturnDate: timestamp,    // วันที่คืนจริง (nullable)
  purpose: string,                // วัตถุประสงค์
  notes: string,                  // หมายเหตุ
  status: string,                 // สถานะ: pending, approved, rejected, borrowed, returned, overdue
  approvedBy: string,             // UID ของผู้อนุมัติ (nullable)
  approvedAt: timestamp,          // วันที่อนุมัติ (nullable)
  rejectionReason: string,        // เหตุผลปฏิเสธ (nullable)
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Reservations Collection
```javascript
{
  id: string,                     // Auto-generated ID
  equipmentId: string,            // Reference to Equipment
  userId: string,                 // Reference to User
  reservationDate: timestamp,     // วันที่จอง
  startTime: timestamp,           // เวลาเริ่มต้น
  endTime: timestamp,             // เวลาสิ้นสุด
  purpose: string,                // วัตถุประสงค์
  notes: string,                  // หมายเหตุ
  status: string,                 // สถานะ: pending, approved, ready, completed, cancelled, expired
  approvedBy: string,             // UID ของผู้อนุมัติ (nullable)
  approvedAt: timestamp,          // วันที่อนุมัติ (nullable)
  notificationSent: boolean,      // ส่งการแจ้งเตือนแล้วหรือไม่
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Notifications Collection
```javascript
{
  id: string,                     // Auto-generated ID
  userId: string,                 // ผู้รับการแจ้งเตือน
  type: string,                   // ประเภท: loan_request, loan_approved, loan_rejected, loan_reminder, reservation_reminder, user_approval, equipment_returned
  title: string,                  // หัวข้อการแจ้งเตือน
  message: string,                // ข้อความ
  data: object,                   // ข้อมูลเพิ่มเติม (equipmentId, requestId, etc.)
  isRead: boolean,                // อ่านแล้วหรือไม่
  priority: string,               // ความสำคัญ: low, medium, high, urgent
  actionUrl: string,              // URL สำหรับ action (optional)
  actionText: string,             // ข้อความปุ่ม action (optional)
  expiresAt: timestamp,           // วันหมดอายุ (optional)
  createdAt: timestamp,
  readAt: timestamp               // วันที่อ่าน (nullable)
}
```

### NotificationSettings Collection
```javascript
{
  userId: string,                 // Reference to User (document ID)
  emailNotifications: {
    loanApproval: boolean,        // การอนุมัติคำขอยืม
    loanReminder: boolean,        // การแจ้งเตือนคืนอุปกรณ์
    reservationReminder: boolean, // การแจ้งเตือนการจอง
    systemUpdates: boolean        // การอัปเดตระบบ
  },
  inAppNotifications: {
    loanApproval: boolean,
    loanReminder: boolean,
    reservationReminder: boolean,
    systemUpdates: boolean
  },
  reminderTiming: {
    loanReminder: number,         // จำนวนวันก่อนครบกำหนด (default: 1)
    reservationReminder: number   // จำนวนชั่วโมงก่อนเวลานัดหมาย (default: 24)
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### ActivityLogs Collection
```javascript
{
  id: string,                     // Auto-generated ID
  userId: string,                 // ผู้ทำกิจกรรม
  action: string,                 // ประเภทกิจกรรม: login, request_loan, approve_loan, etc.
  targetType: string,             // ประเภทเป้าหมาย: equipment, user, loan_request, etc.
  targetId: string,               // ID ของเป้าหมาย
  details: object,                // รายละเอียดเพิ่มเติม
  timestamp: timestamp,
  ipAddress: string               // IP Address (optional)
}
```

## การจัดการข้อผิดพลาด

### Error Handling Strategy

#### Frontend Error Handling
```javascript
// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to Firebase Analytics หรือ error reporting service
  }
}

// API Error Handling
const handleFirebaseError = (error) => {
  switch (error.code) {
    case 'permission-denied':
      return 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้';
    case 'not-found':
      return 'ไม่พบข้อมูลที่ต้องการ';
    case 'unavailable':
      return 'เซอร์วิสไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง';
    default:
      return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
  }
};
```

#### Validation Rules
- **Client-side validation**: ใช้ React Hook Form + Yup schema
- **Server-side validation**: Firebase Security Rules
- **Real-time validation**: สำหรับ unique fields เช่น serial number

## กลยุทธ์การทดสอบ

### Testing Strategy

#### Unit Testing
- **Framework**: Jest + React Testing Library
- **Coverage**: Components, utility functions, custom hooks
- **Focus**: User interactions, state management, error handling

#### Integration Testing
- **Firebase Emulator**: ทดสอบการเชื่อมต่อกับ Firestore
- **Authentication Flow**: ทดสอบ Google OAuth integration
- **API Integration**: ทดสอบ CRUD operations

#### E2E Testing (Optional)
- **Framework**: Cypress หรือ Playwright
- **Scenarios**: 
  - User registration และ approval flow
  - Equipment borrowing process
  - Reservation system
  - Admin management functions

#### Performance Testing
- **Lighthouse**: ทดสอบ performance, accessibility, SEO
- **Bundle Analysis**: ตรวจสอบขนาด bundle และ optimization
- **Firebase Performance Monitoring**: ติดตาม real-time performance

## ระบบการแจ้งเตือน (Notification System)

### Notification Service Architecture

#### Real-time Notifications
```javascript
// NotificationService.js
class NotificationService {
  // สร้างการแจ้งเตือนใหม่
  static async createNotification(userId, type, title, message, data = {}) {
    const notification = {
      userId,
      type,
      title,
      message,
      data,
      isRead: false,
      priority: this.getPriority(type),
      createdAt: serverTimestamp()
    };
    
    await addDoc(collection(db, 'notifications'), notification);
    
    // ส่งการแจ้งเตือนแบบ real-time
    this.sendRealTimeNotification(userId, notification);
  }
  
  // ส่งการแจ้งเตือนตามเวลาที่กำหนด
  static async scheduleNotification(userId, type, scheduledTime, data) {
    // ใช้ Firebase Cloud Functions สำหรับ scheduled notifications
    const scheduledNotification = {
      userId,
      type,
      scheduledTime,
      data,
      status: 'scheduled'
    };
    
    await addDoc(collection(db, 'scheduledNotifications'), scheduledNotification);
  }
}
```

#### Notification Types และ Templates
```javascript
const NOTIFICATION_TEMPLATES = {
  loan_request: {
    title: 'คำขอยืมอุปกรณ์ใหม่',
    message: 'มีคำขอยืม {equipmentName} จาก {userName}',
    priority: 'medium',
    actionText: 'ดูรายละเอียด',
    actionUrl: '/admin/loan-requests/{requestId}'
  },
  loan_approved: {
    title: 'คำขอยืมได้รับการอนุมัติ',
    message: 'คำขอยืม {equipmentName} ของคุณได้รับการอนุมัติแล้ว',
    priority: 'high',
    actionText: 'ดูรายละเอียด',
    actionUrl: '/my-requests/{requestId}'
  },
  loan_reminder: {
    title: 'แจ้งเตือนคืนอุปกรณ์',
    message: 'กรุณาคืน {equipmentName} ภายในวันที่ {dueDate}',
    priority: 'high',
    actionText: 'ดูรายละเอียด',
    actionUrl: '/my-loans/{loanId}'
  },
  reservation_reminder: {
    title: 'แจ้งเตือนการจอง',
    message: 'การจอง {equipmentName} ของคุณจะเริ่มในอีก {hours} ชั่วโมง',
    priority: 'medium',
    actionText: 'ดูรายละเอียด',
    actionUrl: '/my-reservations/{reservationId}'
  }
};
```

#### Cloud Functions สำหรับ Scheduled Notifications
```javascript
// functions/scheduledNotifications.js
exports.sendScheduledNotifications = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    // ตรวจสอบการแจ้งเตือนคืนอุปกรณ์
    await checkLoanReminders(now);
    
    // ตรวจสอบการแจ้งเตือนการจอง
    await checkReservationReminders(now);
    
    return null;
  });

async function checkLoanReminders(now) {
  const tomorrow = new Date(now.toDate());
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const loansQuery = query(
    collection(db, 'loanRequests'),
    where('status', '==', 'borrowed'),
    where('expectedReturnDate', '<=', admin.firestore.Timestamp.fromDate(tomorrow)),
    where('reminderSent', '==', false)
  );
  
  const loans = await getDocs(loansQuery);
  
  for (const loanDoc of loans.docs) {
    const loan = loanDoc.data();
    await NotificationService.createNotification(
      loan.userId,
      'loan_reminder',
      'แจ้งเตือนคืนอุปกรณ์',
      `กรุณาคืน ${loan.equipmentName} ภายในวันพรุ่งนี้`,
      { loanId: loanDoc.id, equipmentId: loan.equipmentId }
    );
    
    // อัปเดตสถานะว่าส่งการแจ้งเตือนแล้ว
    await updateDoc(loanDoc.ref, { reminderSent: true });
  }
}
```

## การปรับใช้และการกำหนดค่า

### Deployment Architecture

#### Development Environment
```
┌─────────────────────────────────────────┐
│         Local Development               │
├─────────────────────────────────────────┤
│  • React Dev Server (localhost:3000)   │
│  • Firebase Emulator Suite             │
│  • Hot Reload & Fast Refresh           │
└─────────────────────────────────────────┘
```

#### Production Environment
```
┌─────────────────────────────────────────┐
│         Firebase Hosting                │
├─────────────────────────────────────────┤
│  • Static Site Hosting                 │
│  • CDN Distribution                     │
│  • SSL Certificate                     │
│  • Custom Domain Support               │
└─────────────────────────────────────────┘
```

### Environment Configuration
```javascript
// config/firebase.js
const firebaseConfig = {
  development: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY_DEV,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN_DEV,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID_DEV,
    // ... other config
  },
  production: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY_PROD,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN_PROD,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID_PROD,
    // ... other config
  }
};
```

### Security Configuration

#### Firebase Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Equipment - read for all authenticated users, write for admin only
    match /equipment/{equipmentId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'approved';
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Loan Requests - users can read/write their own, admin can read/write all
    match /loanRequests/{requestId} {
      allow read, write: if request.auth != null && 
                            (resource.data.userId == request.auth.uid || 
                             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

## การปรับปรุงประสิทธิภาพ

### Performance Optimization

#### Code Splitting
```javascript
// Lazy loading components
const Dashboard = lazy(() => import('./components/Dashboard'));
const EquipmentList = lazy(() => import('./components/EquipmentList'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

// Route-based code splitting
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/equipment" element={<EquipmentList />} />
    <Route path="/admin" element={<AdminPanel />} />
  </Routes>
</Suspense>
```

#### Data Optimization
- **Pagination**: ใช้ Firestore pagination สำหรับรายการขนาดใหญ่
- **Real-time Updates**: ใช้ onSnapshot เฉพาะข้อมูลที่จำเป็น
- **Caching**: ใช้ React Query หรือ SWR สำหรับ data caching
- **Image Optimization**: ใช้ Firebase Storage + CDN สำหรับรูปภาพ

#### Bundle Optimization
- **Tree Shaking**: กำจัด unused code
- **Minification**: ย่อขนาด JavaScript และ CSS
- **Compression**: ใช้ gzip compression
- **Asset Optimization**: ปรับขนาดและรูปแบบรูปภาพ

## การติดตามและการวิเคราะห์

### Monitoring & Analytics

#### Firebase Analytics
- User engagement tracking
- Feature usage analytics
- Performance monitoring
- Crash reporting

#### Custom Metrics
- Equipment utilization rates
- User approval times
- System response times
- Error rates และ types

#### Logging Strategy
```javascript
// Custom logging service
class LoggingService {
  static logUserAction(action, details) {
    // Log to Firebase Analytics
    analytics.logEvent(action, details);
    
    // Log to Firestore for audit trail
    addDoc(collection(db, 'activityLogs'), {
      userId: auth.currentUser?.uid,
      action,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent
    });
  }
}
```

## ข้อกำหนดด้านความปลอดภัย

### Security Requirements

#### Authentication Security
- Google OAuth 2.0 integration
- JWT token validation
- Session management
- Multi-domain email support (@gmail.com, @g.lpru.ac.th)

#### Data Security
- Firestore Security Rules enforcement
- Input validation และ sanitization
- XSS protection
- CSRF protection

#### Privacy Protection
- GDPR compliance considerations
- Data retention policies
- User consent management
- Personal data encryption

## การบำรุงรักษาและการสนับสนุน

### Maintenance Strategy

#### Regular Updates
- Dependencies security updates
- Firebase SDK updates
- React และ Tailwind CSS updates
- Browser compatibility testing

#### Backup Strategy
- Firestore automatic backups
- Export/Import functionality
- Data recovery procedures
- Version control for configurations

#### Support Documentation
- User manual (Thai language)
- Admin guide
- API documentation
- Troubleshooting guide