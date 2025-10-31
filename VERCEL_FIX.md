# 🔧 Vercel Deployment Fix

## 🚨 ปัญหาที่พบในการตั้งค่า Vercel:

### 1. Root Directory ผิด
- **ปัญหา**: ตั้งเป็น `./`
- **แก้ไข**: ต้องเป็น `equipment-lending-system`

### 2. Environment Variables ยังไม่ได้ตั้งค่า
- **ปัญหา**: ไม่มี Firebase config
- **แก้ไข**: ต้องเพิ่ม environment variables

## 🔧 วิธีแก้ไข:

### Step 1: แก้ไข Root Directory
1. ใน Vercel project settings
2. ไปที่ **General** → **Root Directory**
3. เปลี่ยนจาก `./` เป็น `equipment-lending-system`
4. คลิก **Save**

### Step 2: ตั้งค่า Environment Variables
ไปที่ **Settings** → **Environment Variables** และเพิ่ม:

```bash
# Environment Settings
REACT_APP_ENVIRONMENT=production
REACT_APP_USE_EMULATOR=false
GENERATE_SOURCEMAP=false

# Firebase Configuration (ใช้ข้อมูลจาก Firebase Console)
REACT_APP_FIREBASE_API_KEY_PROD=[your_api_key]
REACT_APP_FIREBASE_AUTH_DOMAIN_PROD=equipment-lending-system-41b49.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID_PROD=equipment-lending-system-41b49
REACT_APP_FIREBASE_STORAGE_BUCKET_PROD=equipment-lending-system-41b49.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID_PROD=[your_sender_id]
REACT_APP_FIREBASE_APP_ID_PROD=[your_app_id]
REACT_APP_FIREBASE_MEASUREMENT_ID_PROD=[your_measurement_id]
```

### Step 3: หา Firebase Config Values
1. ไปที่ [Firebase Console](https://console.firebase.google.com/project/equipment-lending-system-41b49)
2. คลิกไอคอน **⚙️ Settings** → **Project settings**
3. เลื่อนลงไปหา **"Your apps"**
4. คลิก **Config** ใน Web app
5. คัดลอกค่าต่างๆ มาใส่ใน Vercel

### Step 4: Redeploy
1. หลังจากตั้งค่าเสร็จ
2. ไปที่ **Deployments**
3. คลิก **"..."** → **Redeploy**

## 📋 Firebase Config ที่ต้องหา:

จาก Firebase Console คุณจะได้ config แบบนี้:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",                    // → REACT_APP_FIREBASE_API_KEY_PROD
  authDomain: "equipment-lending-system-41b49.firebaseapp.com",  // → REACT_APP_FIREBASE_AUTH_DOMAIN_PROD
  projectId: "equipment-lending-system-41b49",                   // → REACT_APP_FIREBASE_PROJECT_ID_PROD
  storageBucket: "equipment-lending-system-41b49.appspot.com",   // → REACT_APP_FIREBASE_STORAGE_BUCKET_PROD
  messagingSenderId: "123456789",          // → REACT_APP_FIREBASE_MESSAGING_SENDER_ID_PROD
  appId: "1:123456789:web:abc123",         // → REACT_APP_FIREBASE_APP_ID_PROD
  measurementId: "G-XXXXXXXXXX"            // → REACT_APP_FIREBASE_MEASUREMENT_ID_PROD
};
```

## 🎯 Quick Fix Commands:

หากต้องการสร้าง project ใหม่ใน Vercel:

### Option 1: ใช้ Vercel CLI
```bash
# ติดตั้ง Vercel CLI
npm install -g vercel

# ไปที่ folder โปรเจ็กต์
cd equipment-lending-system

# Deploy
vercel

# ตอบคำถาม:
# ? Set up and deploy "equipment-lending-system"? Y
# ? Which scope do you want to deploy to? [เลือก team ของคุณ]
# ? Link to existing project? N
# ? What's your project's name? equipment-lending-system
# ? In which directory is your code located? ./
```

### Option 2: แก้ไข Project ปัจจุบัน
1. ไปที่ Vercel Dashboard
2. เลือก project ที่สร้างไว้
3. **Settings** → **General**
4. แก้ไข **Root Directory** เป็น `equipment-lending-system`
5. **Settings** → **Environment Variables**
6. เพิ่ม environment variables ทั้งหมด
7. **Deployments** → **Redeploy**

## 🔗 Links สำคัญ:

### Firebase Console:
- **Project Settings**: https://console.firebase.google.com/project/equipment-lending-system-41b49/settings/general
- **Web App Config**: ดูใน Project Settings → Your apps

### Vercel Dashboard:
- **Project Settings**: https://vercel.com/[your-username]/equipment-lending-system/settings

## ✅ Success Checklist:

หลังจากแก้ไขแล้ว ตรวจสอบ:
- [ ] Root Directory = `equipment-lending-system`
- [ ] Build Command = `npm run build:production`
- [ ] Output Directory = `build`
- [ ] Environment Variables ครบ 7 ตัว
- [ ] Deploy สำเร็จ (ไม่มี error)
- [ ] เว็บไซต์เปิดได้
- [ ] ไม่มี console errors

## 🆘 หากยังมีปัญหา:

### Build Error:
```bash
# ทดสอบ build ใน local ก่อน
cd equipment-lending-system
npm run build:production
```

### Environment Variables Error:
- ตรวจสอบว่าชื่อตัวแปรถูกต้อง
- ตรวจสอบว่าค่าไม่มี space หรือ special characters
- ลอง redeploy อีกครั้ง

### Firebase Connection Error:
- ตรวจสอบ Firebase config values
- ตรวจสอบว่า Firebase services เปิดใช้งานแล้ว
- เพิ่ม Vercel domain ใน Firebase Authorized Domains

---

**🚀 หลังจากแก้ไขแล้ว ระบบควรจะ deploy สำเร็จ!**