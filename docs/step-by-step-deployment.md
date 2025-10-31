# คู่มือการสร้าง Project และ Deploy แบบละเอียด

## 📋 สารบัญ
1. [การสร้าง Firebase Project](#1-การสร้าง-firebase-project)
2. [การสร้าง Vercel Project](#2-การสร้าง-vercel-project)
3. [การเชื่อมต่อ GitHub กับ Vercel](#3-การเชื่อมต่อ-github-กับ-vercel)
4. [การตั้งค่า Environment Variables](#4-การตั้งค่า-environment-variables)
5. [การ Deploy และทดสอบ](#5-การ-deploy-และทดสอบ)

---

## 1. การสร้าง Firebase Project

### ขั้นตอนที่ 1.1: เข้าสู่ Firebase Console
1. เปิดเบราว์เซอร์ไปที่ [https://console.firebase.google.com](https://console.firebase.google.com)
2. เข้าสู่ระบบด้วย Google Account ของคุณ
3. คลิกปุ่ม **"Create a project"** หรือ **"เพิ่มโปรเจ็กต์"**

### ขั้นตอนที่ 1.2: ตั้งค่าโปรเจ็กต์
1. **ชื่อโปรเจ็กต์**: พิมพ์ `equipment-lending-system` หรือชื่อที่คุณต้องการ
2. **Project ID**: Firebase จะสร้างให้อัตโนมัติ (เช่น `equipment-lending-system-12345`)
3. คลิก **"Continue"**

### ขั้นตอนที่ 1.3: Google Analytics (ไม่บังคับ)
1. เลือก **"Enable Google Analytics for this project"** (แนะนำให้เปิด)
2. เลือก Analytics account หรือสร้างใหม่
3. คลิก **"Create project"**
4. รอสักครู่จนโปรเจ็กต์สร้างเสร็จ

### ขั้นตอนที่ 1.4: เพิ่ม Web App
1. ในหน้า Project Overview คลิกไอคอน **"</>"** (Web)
2. **App nickname**: พิมพ์ `Equipment Lending Web App`
3. ✅ เลือก **"Also set up Firebase Hosting for this app"**
4. คลิก **"Register app"**

### ขั้นตอนที่ 1.5: บันทึก Firebase Configuration
Firebase จะแสดง configuration object ประมาณนี้:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "equipment-lending-system-12345.firebaseapp.com",
  projectId: "equipment-lending-system-12345",
  storageBucket: "equipment-lending-system-12345.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```
**⚠️ สำคัญ: คัดลอกและเก็บข้อมูลนี้ไว้ เราจะใช้ในขั้นตอนต่อไป**

### ขั้นตอนที่ 1.6: ตั้งค่า Authentication
1. ไปที่เมนู **"Authentication"** ทางซ้าย
2. คลิกแท็บ **"Sign-in method"**
3. คลิก **"Google"**
4. เปิดใช้งาน **"Enable"**
5. ใส่ **Project support email** (อีเมลของคุณ)
6. คลิก **"Save"**

### ขั้นตอนที่ 1.7: สร้าง Firestore Database
1. ไปที่เมนู **"Firestore Database"**
2. คลิก **"Create database"**
3. เลือก **"Start in test mode"** (เราจะเปลี่ยนเป็น production rules ทีหลัง)
4. เลือก **Location**: `asia-southeast1 (Singapore)` (ใกล้ไทยที่สุด)
5. คลิก **"Done"**

### ขั้นตอนที่ 1.8: เปิดใช้งาน Storage
1. ไปที่เมนู **"Storage"**
2. คลิก **"Get started"**
3. เลือก **"Start in test mode"**
4. เลือก **Location**: `asia-southeast1 (Singapore)`
5. คลิก **"Done"**

### ขั้นตอนที่ 1.9: ตั้งค่า Authorized Domains
1. ไปที่ **Authentication > Settings**
2. ในส่วน **"Authorized domains"** คลิก **"Add domain"**
3. เพิ่ม domains เหล่านี้:
   - `localhost` (สำหรับ development)
   - `your-project-name.vercel.app` (เราจะได้จาก Vercel ในขั้นตอนต่อไป)

---

## 2. การสร้าง Vercel Project

### ขั้นตอนที่ 2.1: สร้างบัญชี Vercel
1. เปิดเบราว์เซอร์ไปที่ [https://vercel.com](https://vercel.com)
2. คลิก **"Sign Up"**
3. เลือก **"Continue with GitHub"**
4. อนุญาตให้ Vercel เข้าถึง GitHub account ของคุณ

### ขั้นตอนที่ 2.2: Import Project จาก GitHub
1. ในหน้า Dashboard คลิก **"Add New..."** → **"Project"**
2. ค้นหา repository `notebook-system-v3`
3. คลิก **"Import"** ข้างๆ repository ของคุณ

### ขั้นตอนที่ 2.3: Configure Project
1. **Project Name**: `equipment-lending-system` (หรือชื่อที่ต้องการ)
2. **Framework Preset**: Vercel จะตรวจจับ "Create React App" อัตโนมัติ
3. **Root Directory**: เลือก `equipment-lending-system` (เพราะโค้ดอยู่ใน subfolder)
4. **Build and Output Settings**:
   - Build Command: `npm run build:production`
   - Output Directory: `build`
   - Install Command: `npm install`

### ขั้นตอนที่ 2.4: Environment Variables (ยังไม่ต้องใส่)
ข้ามขั้นตอนนี้ไปก่อน เราจะกลับมาตั้งค่าทีหลัง

### ขั้นตอนที่ 2.5: Deploy
1. คลิก **"Deploy"**
2. รอสักครู่ (ประมาณ 2-3 นาที)
3. หาก deploy สำเร็จ จะได้ URL เช่น `https://equipment-lending-system-abc123.vercel.app`

**⚠️ หมายเหตุ: การ deploy ครั้งแรกอาจล้มเหลวเพราะยังไม่มี environment variables**

---

## 3. การเชื่อมต่อ GitHub กับ Vercel

### ขั้นตอนที่ 3.1: Auto-deployment Setup
Vercel จะตั้งค่า auto-deployment ให้อัตโนมัติ:
- ทุกครั้งที่ push ไป `main` branch → deploy ไป production
- ทุกครั้งที่สร้าง pull request → สร้าง preview deployment

### ขั้นตอนที่ 3.2: ตรวจสอบการเชื่อมต่อ
1. ไปที่ **Project Settings** → **Git**
2. ตรวจสอบว่าเชื่อมต่อกับ repository ที่ถูกต้อง
3. ตรวจสอบ **Production Branch**: ควรเป็น `main`

---

## 4. การตั้งค่า Environment Variables

### ขั้นตอนที่ 4.1: ไปที่ Environment Variables
1. ใน Vercel Dashboard ไปที่ **Project Settings**
2. คลิกแท็บ **"Environment Variables"**

### ขั้นตอนที่ 4.2: เพิ่ม Environment Variables
เพิ่มตัวแปรเหล่านี้ (ใช้ข้อมูลจาก Firebase ที่เก็บไว้):

#### Environment Settings:
```
Name: REACT_APP_ENVIRONMENT
Value: production
Environments: Production, Preview
```

```
Name: REACT_APP_USE_EMULATOR
Value: false
Environments: Production, Preview
```

```
Name: GENERATE_SOURCEMAP
Value: false
Environments: Production, Preview
```

#### Firebase Configuration:
```
Name: REACT_APP_FIREBASE_API_KEY_PROD
Value: [ใส่ apiKey จาก Firebase]
Environments: Production, Preview
```

```
Name: REACT_APP_FIREBASE_AUTH_DOMAIN_PROD
Value: [ใส่ authDomain จาก Firebase]
Environments: Production, Preview
```

```
Name: REACT_APP_FIREBASE_PROJECT_ID_PROD
Value: [ใส่ projectId จาก Firebase]
Environments: Production, Preview
```

```
Name: REACT_APP_FIREBASE_STORAGE_BUCKET_PROD
Value: [ใส่ storageBucket จาก Firebase]
Environments: Production, Preview
```

```
Name: REACT_APP_FIREBASE_MESSAGING_SENDER_ID_PROD
Value: [ใส่ messagingSenderId จาก Firebase]
Environments: Production, Preview
```

```
Name: REACT_APP_FIREBASE_APP_ID_PROD
Value: [ใส่ appId จาก Firebase]
Environments: Production, Preview
```

```
Name: REACT_APP_FIREBASE_MEASUREMENT_ID_PROD
Value: [ใส่ measurementId จาก Firebase]
Environments: Production, Preview
```

### ขั้นตอนที่ 4.3: บันทึกและ Redeploy
1. หลังจากเพิ่ม environment variables เสร็จ
2. ไปที่แท็บ **"Deployments"**
3. คลิก **"..."** ข้างๆ deployment ล่าสุด
4. เลือก **"Redeploy"**
5. รอจน deployment เสร็จ

---

## 5. การ Deploy และทดสอบ

### ขั้นตอนที่ 5.1: อัพเดท Firebase Authorized Domains
1. กลับไปที่ Firebase Console
2. ไปที่ **Authentication > Settings**
3. ในส่วน **"Authorized domains"** เพิ่ม:
   - URL ที่ได้จาก Vercel (เช่น `equipment-lending-system-abc123.vercel.app`)

### ขั้นตอนที่ 5.2: Deploy Firebase Security Rules
เปิด Terminal/Command Prompt และรันคำสั่ง:

```bash
# ติดตั้ง Firebase CLI (ถ้ายังไม่มี)
npm install -g firebase-tools

# เข้าสู่ระบบ Firebase
firebase login

# ไปที่ folder โปรเจ็กต์
cd equipment-lending-system

# เลือกโปรเจ็กต์ Firebase
firebase use your-project-id

# Deploy security rules
firebase deploy --only firestore:rules,storage
```

### ขั้นตอนที่ 5.3: ทดสอบระบบ
1. เปิด URL ที่ได้จาก Vercel
2. ทดสอบการเข้าสู่ระบบด้วย Google
3. ตรวจสอบว่าระบบทำงานปกติ

### ขั้นตอนที่ 5.4: ตั้งค่า Custom Domain (ไม่บังคับ)
หากต้องการใช้ domain ของตัวเอง:

1. ใน Vercel ไปที่ **Project Settings > Domains**
2. คลิก **"Add"**
3. ใส่ domain ที่ต้องการ (เช่น `equipment.yourdomain.com`)
4. ตั้งค่า DNS ตามที่ Vercel แนะนำ
5. เพิ่ม domain นี้ใน Firebase Authorized Domains

---

## 🎯 สรุปขั้นตอนทั้งหมด

### ✅ Firebase Project:
- [x] สร้างโปรเจ็กต์
- [x] เปิดใช้งาน Authentication (Google)
- [x] สร้าง Firestore Database
- [x] เปิดใช้งาน Storage
- [x] ตั้งค่า Authorized Domains
- [x] Deploy Security Rules

### ✅ Vercel Project:
- [x] เชื่อมต่อกับ GitHub
- [x] ตั้งค่า Build Configuration
- [x] เพิ่ม Environment Variables
- [x] Deploy สำเร็จ

### ✅ การทดสอบ:
- [x] เว็บไซต์เปิดได้
- [x] เข้าสู่ระบบได้
- [x] ฟีเจอร์ทำงานปกติ

---

## 🚨 การแก้ไขปัญหาที่พบบ่อย

### ปัญหา: Build Failed
**สาเหตุ**: Environment variables ไม่ครบ
**วิธีแก้**: ตรวจสอบว่าใส่ environment variables ครบทุกตัว

### ปัญหา: Authentication Error
**สาเหตุ**: Domain ไม่อยู่ใน Authorized Domains
**วิธีแก้**: เพิ่ม Vercel URL ใน Firebase Authorized Domains

### ปัญหา: Firestore Permission Denied
**สาเหตุ**: Security rules ยังไม่ได้ deploy
**วิธีแก้**: รัน `firebase deploy --only firestore:rules`

### ปัญหา: 404 Error เมื่อ Refresh หน้า
**สาเหตุ**: SPA routing ไม่ทำงาน
**วิธีแก้**: ตรวจสอบ `vercel.json` มี rewrites ที่ถูกต้อง

---

## 📞 การขอความช่วยเหลือ

หากมีปัญหา สามารถ:
1. ตรวจสอบ logs ใน Vercel Dashboard
2. ดู Console ใน Firebase
3. เปิด Developer Tools ในเบราว์เซอร์ดู errors
4. ติดต่อขอความช่วยเหลือ

**ขอให้โชคดีกับการ deploy! 🚀**