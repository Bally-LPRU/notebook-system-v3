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

## การพัฒนาต่อ

โปรเจ็กต์นี้เป็นการตั้งค่าเบื้องต้น สามารถพัฒนาต่อได้ตาม tasks ที่กำหนดไว้ใน:
- `.kiro/specs/equipment-lending-system/tasks.md`

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
