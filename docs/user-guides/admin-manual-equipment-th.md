# คู่มือผู้ดูแลระบบ - ระบบจัดการอุปกรณ์

## สารบัญ
1. [การติดตั้งและกำหนดค่าระบบ](#การติดตั้งและกำหนดค่าระบบ)
2. [การจัดการผู้ใช้งานและสิทธิ์](#การจัดการผู้ใช้งานและสิทธิ์)
3. [การจัดการหมวดหมู่อุปกรณ์](#การจัดการหมวดหมู่อุปกรณ์)
4. [การตรวจสอบและบำรุงรักษาระบบ](#การตรวจสอบและบำรุงรักษาระบบ)
5. [การสำรองและกู้คืนข้อมูล](#การสำรองและกู้คืนข้อมูล)
6. [การตรวจสอบความปลอดภัย](#การตรวจสอบความปลอดภัย)
7. [การแก้ไขปัญหาขั้นสูง](#การแก้ไขปัญหาขั้นสูง)
8. [การอัปเดตระบบ](#การอัปเดตระบบ)

---

## การติดตั้งและกำหนดค่าระบบ

### ข้อกำหนดระบบ
- **เซิร์ฟเวอร์**: Firebase Hosting
- **ฐานข้อมูล**: Cloud Firestore
- **จัดเก็บไฟล์**: Firebase Storage
- **การยืนยันตัวตน**: Firebase Authentication
- **เบราว์เซอร์ที่รองรับ**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### การติดตั้งครั้งแรก
1. **เตรียม Firebase Project**
   ```bash
   # ติดตั้ง Firebase CLI
   npm install -g firebase-tools
   
   # เข้าสู่ระบบ Firebase
   firebase login
   
   # เริ่มต้นโปรเจค
   firebase init
   ```

2. **กำหนดค่าสภาพแวดล้อม**
   ```bash
   # คัดลอกไฟล์ environment
   cp .env.example .env.production.local
   
   # แก้ไขค่าตัวแปร
   nano .env.production.local
   ```

3. **ตั้งค่า Firestore Security Rules**
   ```bash
   # Deploy security rules
   firebase deploy --only firestore:rules
   
   # Deploy storage rules  
   firebase deploy --only storage
   ```4
. **สร้างผู้ดูแลระบบคนแรก**
   ```bash
   # รันสคริปต์สร้าง admin
   node scripts/setup-first-admin.js
   ```

5. **ตั้งค่าหมวดหมู่อุปกรณ์เริ่มต้น**
   ```bash
   # รันสคริปต์ตั้งค่าหมวดหมู่
   node scripts/setup-equipment-management.js
   ```

### การกำหนดค่า Firebase

#### Firestore Database
- **โหมด**: Production mode
- **ตำแหน่ง**: asia-southeast1 (Singapore)
- **Security Rules**: ใช้ไฟล์ `firestore.rules`

#### Firebase Storage
- **Bucket**: `[project-id].appspot.com`
- **Security Rules**: ใช้ไฟล์ `storage.rules`
- **CORS Configuration**: อนุญาต origin ของเว็บไซต์

#### Firebase Authentication
- **Sign-in methods**: Email/Password
- **Authorized domains**: เพิ่มโดเมนของเว็บไซต์

---

## การจัดการผู้ใช้งานและสิทธิ์

### ระดับสิทธิ์ผู้ใช้งาน

#### 1. Super Admin
- จัดการผู้ใช้งานทั้งหมด
- เข้าถึงข้อมูลทั้งหมด
- แก้ไขการตั้งค่าระบบ
- ดู audit logs ทั้งหมด

#### 2. Admin
- จัดการข้อมูลอุปกรณ์
- อนุมัติผู้ใช้งานใหม่
- ส่งออกข้อมูล
- ดู audit logs ของตนเอง

#### 3. Editor
- เพิ่ม/แก้ไขข้อมูลอุปกรณ์
- อัปโหลดรูปภาพ
- ค้นหาและกรองข้อมูล

#### 4. Viewer
- ดูข้อมูลอุปกรณ์เท่านั้น
- ค้นหาและกรองข้อมูล
- ส่งออกข้อมูลที่ได้รับอนุญาต

### การเพิ่มผู้ใช้งานใหม่

#### ผ่าน Firebase Console
1. เข้า Firebase Console > Authentication
2. คลิก "Add user"
3. กรอกอีเมลและรหัสผ่าน
4. เพิ่ม Custom Claims สำหรับสิทธิ์

#### ผ่านสคริปต์
```bash
# เพิ่มผู้ใช้งานใหม่
node scripts/add-user.js --email="user@example.com" --role="editor"
```

### การจัดการสิทธิ์

#### การเปลี่ยนสิทธิ์ผู้ใช้งาน
```javascript
// ใน Firebase Admin SDK
await admin.auth().setCustomUserClaims(uid, {
  role: 'admin',
  permissions: ['read', 'write', 'delete']
});
```

#### การตรวจสอบสิทธิ์
```javascript
// ตรวจสอบสิทธิ์ใน Security Rules
function hasRole(role) {
  return request.auth.token.role == role;
}

function hasPermission(permission) {
  return permission in request.auth.token.permissions;
}
```

---

## การจัดการหมวดหมู่อุปกรณ์

### การเพิ่มหมวดหมู่ใหม่

#### ผ่านหน้าเว็บ
1. เข้าเมนู "การตั้งค่า" > "หมวดหมู่อุปกรณ์"
2. คลิก "เพิ่มหมวดหมู่ใหม่"
3. กรอกข้อมูล:
   - ชื่อหมวดหมู่ (ไทย/อังกฤษ)
   - คำอธิบาย
   - ไอคอน
   - สี
   - หมวดหมู่แม่ (ถ้ามี)

#### ผ่านสคริปต์
```bash
# เพิ่มหมวดหมู่จากไฟล์ JSON
node scripts/import-categories.js --file="categories.json"
```

### การจัดการ Custom Fields

#### การเพิ่มฟิลด์เฉพาะหมวดหมู่
```javascript
// ตัวอย่างการกำหนด custom fields
const categoryData = {
  name: 'คอมพิวเตอร์',
  customFields: [
    {
      name: 'CPU',
      type: 'text',
      required: true
    },
    {
      name: 'RAM',
      type: 'select',
      options: ['4GB', '8GB', '16GB', '32GB'],
      required: true
    },
    {
      name: 'วันหมดประกัน',
      type: 'date',
      required: false
    }
  ]
};
```

### การจัดการลำดับชั้นหมวดหมู่

#### โครงสร้างแบบ Hierarchical
```
อิเล็กทรอนิกส์
├── คอมพิวเตอร์
│   ├── เดสก์ท็อป
│   ├── โน้ตบุ๊ก
│   └── แท็บเล็ต
├── เครื่องพิมพ์
│   ├── เลเซอร์
│   └── อิงค์เจ็ท
└── อุปกรณ์เครือข่าย
    ├── สวิตช์
    └── เราเตอร์
```

---

## การตรวจสอบและบำรุงรักษาระบบ

### การตรวจสอบประจำวัน

#### สคริปต์ตรวจสอบอัตโนมัติ
```bash
# รันการทดสอบระบบ
node scripts/production-test-suite.js

# ตรวจสอบประสิทธิภาพ
node scripts/security-performance-audit.js

# ทดสอบมือถือ
node scripts/mobile-device-testing.js
```

#### การตรวจสอบ Manual
1. **ทดสอบการเข้าสู่ระบบ**
   - ลองเข้าสู่ระบบด้วยบัญชีต่างๆ
   - ตรวจสอบการทำงานของ 2FA (ถ้ามี)

2. **ทดสอบการอัปโหลดรูปภาพ**
   - อัปโหลดรูปขนาดต่างๆ
   - ตรวจสอบการบีบอัดรูป
   - ทดสอบการลบรูป

3. **ทดสอบการค้นหา**
   - ค้นหาด้วยคำต่างๆ
   - ทดสอบตัวกรอง
   - ตรวจสอบความเร็วในการค้นหา

### การตรวจสอบ Database

#### การตรวจสอบ Indexes
```bash
# ดู Firestore indexes
firebase firestore:indexes

# สร้าง index ใหม่ถ้าจำเป็น
firebase deploy --only firestore:indexes
```

#### การตรวจสอบ Query Performance
```javascript
// ตรวจสอบเวลาในการ query
const startTime = Date.now();
const results = await getDocs(query(
  collection(db, 'equipment'),
  where('status', '==', 'active'),
  orderBy('updatedAt', 'desc'),
  limit(50)
));
const queryTime = Date.now() - startTime;
console.log(`Query time: ${queryTime}ms`);
```

### การตรวจสอบ Storage

#### การตรวจสอบพื้นที่ใช้งาน
```bash
# ดูการใช้งาน Storage
gsutil du -sh gs://[project-id].appspot.com/

# ดูไฟล์ที่ใหญ่ที่สุด
gsutil du -h gs://[project-id].appspot.com/** | sort -hr | head -20
```

#### การทำความสะอาดไฟล์
```bash
# ลบไฟล์ที่ไม่ได้ใช้งาน
node scripts/cleanup-unused-images.js

# ลบไฟล์เก่าเกิน 1 ปี
node scripts/cleanup-old-files.js --days=365
```

---

## การสำรองและกู้คืนข้อมูล

### การสำรองข้อมูล Firestore

#### การสำรองอัตโนมัติ
```bash
# ตั้งค่าการสำรองอัตโนมัติ
gcloud firestore operations list
gcloud firestore export gs://[backup-bucket]/firestore-backup
```

#### การสำรองด้วยสคริปต์
```bash
# สำรองข้อมูลทั้งหมด
node scripts/backup-firestore.js

# สำรองเฉพาะ collection
node scripts/backup-collection.js --collection="equipment"
```

### การสำรองไฟล์ Storage

#### การ Sync ไฟล์
```bash
# สำรองไฟล์ทั้งหมด
gsutil -m rsync -r -d gs://[project-id].appspot.com gs://[backup-bucket]

# สำรองเฉพาะโฟลเดอร์
gsutil -m rsync -r gs://[project-id].appspot.com/equipment-images gs://[backup-bucket]/equipment-images
```

### การกู้คืนข้อมูล

#### การกู้คืน Firestore
```bash
# กู้คืนจากไฟล์สำรอง
gcloud firestore import gs://[backup-bucket]/firestore-backup/[timestamp]

# กู้คืนเฉพาะ collection
node scripts/restore-collection.js --collection="equipment" --backup="backup-file.json"
```

#### การกู้คืนไฟล์
```bash
# กู้คืนไฟล์ทั้งหมด
gsutil -m rsync -r -d gs://[backup-bucket] gs://[project-id].appspot.com

# กู้คืนไฟล์เฉพาะ
gsutil cp gs://[backup-bucket]/equipment-images/[file] gs://[project-id].appspot.com/equipment-images/
```

---

## การตรวจสอบความปลอดภัย

### การตรวจสอบ Security Rules

#### Firestore Rules
```javascript
// ตัวอย่าง Security Rules ที่ปลอดภัย
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Equipment collection
    match /equipment/{equipmentId} {
      allow read: if isAuthenticated() && isApproved();
      allow write: if isAuthenticated() && hasRole('admin');
      allow delete: if isAuthenticated() && hasRole('super_admin');
    }
  }
}

function isAuthenticated() {
  return request.auth != null;
}

function isApproved() {
  return request.auth.token.status == 'approved';
}

function hasRole(role) {
  return request.auth.token.role == role;
}
```

#### Storage Rules
```javascript
// ตัวอย่าง Storage Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /equipment-images/{equipmentId}/{imageId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && 
                      hasRole('admin') && 
                      isValidImage();
    }
  }
}

function isValidImage() {
  return request.resource.contentType.matches('image/.*') &&
         request.resource.size < 5 * 1024 * 1024;
}
```

### การตรวจสอบ Audit Logs

#### การดู Activity Logs
```bash
# ดู logs ล่าสุด
node scripts/view-audit-logs.js --days=7

# ดู logs ของผู้ใช้เฉพาะ
node scripts/view-audit-logs.js --user="user@example.com"

# ดู logs การเปลี่ยนแปลงข้อมูล
node scripts/view-audit-logs.js --action="equipment_updated"
```

#### การวิเคราะห์ Security Events
```javascript
// ตัวอย่างการตรวจสอบ suspicious activities
const suspiciousActivities = await getDocs(query(
  collection(db, 'auditLogs'),
  where('action', 'in', ['failed_login', 'unauthorized_access']),
  where('timestamp', '>=', yesterday),
  orderBy('timestamp', 'desc')
));
```

### การตรวจสอบ Vulnerabilities

#### การสแกน Dependencies
```bash
# ตรวจสอบ security vulnerabilities
npm audit

# แก้ไขปัญหาอัตโนมัติ
npm audit fix

# ตรวจสอบ outdated packages
npm outdated
```

#### การตรวจสอบ Web Security
```bash
# ใช้เครื่องมือตรวจสอบ security headers
curl -I https://[your-domain.com]

# ตรวจสอบ SSL certificate
openssl s_client -connect [your-domain.com]:443
```

---

## การแก้ไขปัญหาขั้นสูง

### ปัญหา Performance

#### Database Query ช้า
1. **ตรวจสอบ Indexes**
   ```bash
   # ดู missing indexes
   firebase firestore:indexes
   ```

2. **ปรับปรุง Query**
   ```javascript
   // แทนที่จะใช้
   where('searchKeywords', 'array-contains-any', keywords)
   
   // ใช้
   where('searchKeywords', 'array-contains', keyword)
   ```

3. **ใช้ Pagination**
   ```javascript
   // ใช้ pagination แทน limit ขนาดใหญ่
   const query = query(
     collection(db, 'equipment'),
     orderBy('updatedAt'),
     startAfter(lastDoc),
     limit(20)
   );
   ```

#### Image Loading ช้า
1. **ตรวจสอบ Image Optimization**
   ```bash
   # ตรวจสอบขนาดรูปภาพ
   node scripts/analyze-image-sizes.js
   ```

2. **ใช้ CDN**
   ```javascript
   // ใช้ Firebase CDN
   const imageUrl = `https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[path]?alt=media&token=[token]`;
   ```

### ปัญหา Authentication

#### ผู้ใช้งานไม่สามารถเข้าสู่ระบบได้
1. **ตรวจสอบ Firebase Auth**
   ```bash
   # ดูสถานะ Firebase services
   firebase status
   ```

2. **ตรวจสอบ Custom Claims**
   ```javascript
   // ตรวจสอบ claims ของผู้ใช้งาน
   const user = await admin.auth().getUser(uid);
   console.log(user.customClaims);
   ```

### ปัญหา Storage

#### ไฟล์อัปโหลดไม่สำเร็จ
1. **ตรวจสอบ CORS**
   ```bash
   # ตั้งค่า CORS สำหรับ Storage
   gsutil cors set cors.json gs://[bucket-name]
   ```

2. **ตรวจสอบ Storage Rules**
   ```javascript
   // ทดสอบ Storage Rules
   firebase emulators:start --only storage
   ```

### ปัญหา Deployment

#### Build ล้มเหลว
1. **ตรวจสอบ Dependencies**
   ```bash
   # ลบ node_modules และติดตั้งใหม่
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **ตรวจสอบ Environment Variables**
   ```bash
   # ตรวจสอบไฟล์ .env
   cat .env.production.local
   ```

#### Hosting ไม่อัปเดต
1. **Clear Cache**
   ```bash
   # Clear Firebase Hosting cache
   firebase hosting:channel:deploy preview --expires 1h
   ```

2. **Force Deploy**
   ```bash
   # Force deploy ใหม่
   firebase deploy --force
   ```

---

## การอัปเดตระบบ

### การเตรียมตัวก่อนอัปเดต

#### 1. สำรองข้อมูล
```bash
# สำรองข้อมูลทั้งหมด
node scripts/full-backup.js
```

#### 2. ทดสอบใน Staging
```bash
# Deploy ไป staging environment
firebase use staging
firebase deploy
```

#### 3. แจ้งผู้ใช้งาน
- ส่งอีเมลแจ้งการอัปเดต
- แสดงข้อความในระบบ
- กำหนดเวลา maintenance

### ขั้นตอนการอัปเดต

#### 1. อัปเดต Dependencies
```bash
# อัปเดต packages
npm update

# ตรวจสอบ security vulnerabilities
npm audit fix
```

#### 2. อัปเดต Database Schema
```bash
# รัน migration scripts
node scripts/migrate-database.js
```

#### 3. อัปเดต Security Rules
```bash
# Deploy rules ใหม่
firebase deploy --only firestore:rules,storage
```

#### 4. Deploy Application
```bash
# Build และ deploy
npm run build
firebase deploy --only hosting
```

### การตรวจสอบหลังอัปเดต

#### 1. รันการทดสอบ
```bash
# ทดสอบระบบทั้งหมด
node scripts/production-test-suite.js
```

#### 2. ตรวจสอบ Logs
```bash
# ดู error logs
firebase functions:log
```

#### 3. ตรวจสอบ Performance
```bash
# ตรวจสอบประสิทธิภาพ
node scripts/performance-check.js
```

### การ Rollback

#### ถ้าพบปัญหาหลังอัปเดต
```bash
# Rollback ไปเวอร์ชันก่อนหน้า
firebase hosting:clone [source-site-id]:[source-version-id] [target-site-id]

# กู้คืนฐานข้อมูล
node scripts/restore-database.js --backup=[backup-file]
```

---

## การติดตาม Monitoring

### การตั้งค่า Alerts

#### Firebase Performance Monitoring
```javascript
// เพิ่ม performance monitoring
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);
```

#### Custom Metrics
```javascript
// ติดตาม custom metrics
const trace = perf.trace('equipment_load_time');
trace.start();
// ... load equipment data
trace.stop();
```

### การตั้งค่า Error Reporting

#### Sentry Integration
```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

### การสร้าง Dashboard

#### Google Analytics
```javascript
// เพิ่ม Google Analytics
import { getAnalytics } from 'firebase/analytics';
const analytics = getAnalytics(app);
```

#### Custom Dashboard
```bash
# สร้างรายงานประจำวัน
node scripts/generate-daily-report.js
```

---

*คู่มือนี้อัปเดตล่าสุด: [วันที่]*  
*เวอร์ชันระบบ: [เวอร์ชัน]*  
*ติดต่อ Technical Support: [อีเมล/โทรศัพท์]*