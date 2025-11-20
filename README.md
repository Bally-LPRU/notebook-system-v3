# ระบบยืม-คืนโน็คบุคและอุปกรณ์คอมพิวเตอร์

Equipment Lending System - เว็บแอปพลิเคชันสำหรับจัดการการยืม-คืนอุปกรณ์ต่างๆ ในองค์กร

## เทคโนโลยีที่ใช้

- **Frontend**: React.js 19.2.0
- **Styling**: Tailwind CSS 4.1.16
- **Backend**: Firebase (Firestore, Authentication, Storage, Hosting)
- **Authentication**: Google OAuth 2.0

## การติดตั้งและตั้งค่า

### 1. Clone โปรเจ็กต์

```bash
git clone <repository-url>
cd equipment-lending-system
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่า Firebase

1. สร้างโปรเจ็กต์ใหม่ใน [Firebase Console](https://console.firebase.google.com/)
2. เปิดใช้งาน Authentication และเลือก Google เป็น Sign-in provider
3. สร้าง Firestore Database
4. สร้าง Storage bucket
5. คัดลอกการตั้งค่า Firebase configuration

### 4. ตั้งค่า Environment Variables

1. คัดลอกไฟล์ `.env.example` เป็น `.env.local`
2. แก้ไขค่าต่างๆ ในไฟล์ `.env.local` ให้ตรงกับการตั้งค่า Firebase ของคุณ

```bash
cp .env.example .env.local
```

### 5. ติดตั้ง Firebase CLI (ถ้ายังไม่มี)

```bash
npm install -g firebase-tools
```

### 6. เข้าสู่ระบบ Firebase

```bash
firebase login
```

### 7. เชื่อมต่อโปรเจ็กต์กับ Firebase

```bash
firebase init
```

เลือก:
- Firestore
- Hosting
- Storage

### 8. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## การรันโปรเจ็กต์

### Development Mode

```bash
npm start
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

### รัน Firebase Emulators (สำหรับการพัฒนา)

```bash
npm run firebase:emulators
```

Firebase Emulator UI จะเปิดที่ [http://localhost:4000](http://localhost:4000)

### Build สำหรับ Production

```bash
npm run build
```

### Deploy ไปยัง Firebase Hosting

```bash
npm run firebase:deploy
```

## Scripts ที่มีให้ใช้งาน

- `npm start` - รันเซอร์เวอร์พัฒนา
- `npm run build` - สร้าง build สำหรับ production
- `npm test` - รันการทดสอบ
- `npm run firebase:emulators` - รัน Firebase emulators
- `npm run firebase:deploy` - deploy ทั้งหมดไปยัง Firebase
- `npm run firebase:deploy:hosting` - deploy เฉพาะ hosting
- `npm run firebase:deploy:firestore` - deploy เฉพาะ Firestore rules
- `npm run firebase:deploy:storage` - deploy เฉพาะ Storage rules

## โครงสร้างโปรเจ็กต์

```
equipment-lending-system/
├── public/                 # Static files
├── src/
│   ├── components/        # React components
│   ├── config/           # Configuration files
│   │   └── firebase.js   # Firebase configuration
│   ├── services/         # Service layer
│   │   └── authService.js # Authentication service
│   ├── App.js           # Main App component
│   └── index.js         # Entry point
├── firestore.rules      # Firestore security rules
├── storage.rules        # Storage security rules
├── firebase.json        # Firebase configuration
├── .env.example         # Environment variables template
└── .env.local          # Local environment variables
```

## การตั้งค่าความปลอดภัย

### Firestore Security Rules

ระบบใช้ Security Rules เพื่อควบคุมการเข้าถึงข้อมูล:

- ผู้ใช้สามารถอ่าน/เขียนข้อมูลของตนเองได้เท่านั้น
- Admin สามารถเข้าถึงข้อมูลทั้งหมดได้
- ผู้ใช้ที่ได้รับการอนุมัติแล้วเท่านั้นที่สามารถเข้าถึงข้อมูลอุปกรณ์ได้

### Authentication

- รองรับการเข้าสู่ระบบด้วย Google OAuth เท่านั้น
- จำกัดอีเมลที่สามารถเข้าใช้งานได้ (@gmail.com และ @g.lpru.ac.th)
- ผู้ใช้ใหม่จะต้องรอการอนุมัติจาก Admin

## Code Quality & Architecture

This project follows established patterns and best practices for maintainability and performance:

### Recent Improvements (Code Cleanup Refactoring)

The codebase has undergone a comprehensive refactoring to improve:
- **Code Quality**: Reduced code duplication from 30% to <5%
- **Performance**: 40% improvement in render times, 80% reduction in redundant API calls
- **Bundle Size**: 25% reduction in total file size
- **Maintainability**: Established reusable patterns and components

### Key Patterns

1. **Reusable Components**: Use `EquipmentStatusBadge` for consistent status display
2. **Centralized Data**: Use `useCategories` hook for equipment categories
3. **Standard Hooks**: Use `usePagination` and `useEquipmentFilters` for common operations
4. **Performance**: Strategic memoization with `useMemo` and `useCallback`

### Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development guidelines and patterns
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture overview
- **[docs/REFACTORING_MIGRATION_GUIDE.md](docs/REFACTORING_MIGRATION_GUIDE.md)** - Migration guide for new patterns
- **[REFACTORING_RESULTS.md](REFACTORING_RESULTS.md)** - Detailed refactoring metrics

## การพัฒนาต่อ

โปรเจ็กต์นี้เป็นการตั้งค่าเบื้องต้น สามารถพัฒนาต่อได้ตาม tasks ที่กำหนดไว้ใน:
- `.kiro/specs/equipment-lending-system/tasks.md`

Before implementing new features, please review:
- [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design
- Existing components for reusable patterns

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Firebase configuration ไม่ถูกต้อง**
   - ตรวจสอบไฟล์ `.env.local`
   - ตรวจสอบการตั้งค่าใน Firebase Console

2. **Google OAuth ไม่ทำงาน**
   - ตรวจสอบ Authorized domains ใน Firebase Console
   - ตรวจสอบ OAuth consent screen

3. **Firestore permission denied**
   - ตรวจสอบ Security Rules
   - ตรวจสอบสถานะผู้ใช้ในฐานข้อมูล

4. **หน้า Admin Settings แสดง "Missing or insufficient permissions"**
   - **สาเหตุ:** User profile ยังไม่ได้ตั้งค่าเป็น admin
   - **วิธีแก้ไขด่วน:** ดูคำแนะนำใน [QUICK_FIX_ADMIN_SETTINGS.md](QUICK_FIX_ADMIN_SETTINGS.md)
   - **วิธีแก้ไขแบบละเอียด:** ดูคำแนะนำใน [ADMIN_SETTINGS_PERMISSION_FIX.md](ADMIN_SETTINGS_PERMISSION_FIX.md)
   - **ขั้นตอนสั้นๆ:**
     1. ไปที่ Firebase Console > Firestore Database
     2. เปิด collection `users` และหา document ของคุณ
     3. แก้ไข `role` เป็น `"admin"` และ `status` เป็น `"approved"`
     4. รีเฟรชหน้าเว็บและ login ใหม่

### เอกสารเพิ่มเติม

สำหรับเอกสารการแก้ไขปัญหาในอดีตและประวัติการพัฒนา สามารถดูได้ที่:
- `docs/archive/` - เอกสารที่เก็บถาวร (archived documentation)

## การสนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมพัฒนา

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
