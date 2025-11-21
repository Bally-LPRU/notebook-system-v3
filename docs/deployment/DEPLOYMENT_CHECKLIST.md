# ✅ Deployment Checklist

## 🎯 Pre-Deployment
- [ ] โค้ดถูก push ไป GitHub แล้ว
- [ ] มี Google Account สำหรับ Firebase
- [ ] มี GitHub Account สำหรับ Vercel

---

## 🔥 Firebase Setup

### Project Creation
- [ ] เปิด [Firebase Console](https://console.firebase.google.com)
- [ ] สร้างโปรเจ็กต์ใหม่ชื่อ `equipment-lending-system`
- [ ] เปิดใช้งาน Google Analytics (แนะนำ)

### Web App Setup
- [ ] เพิ่ม Web App ใหม่
- [ ] ตั้งชื่อ `Equipment Lending Web App`
- [ ] เลือก "Also set up Firebase Hosting"
- [ ] **คัดลอกและเก็บ Firebase Config**

### Services Configuration
- [ ] **Authentication**: เปิดใช้งาน Google Sign-in
- [ ] **Firestore**: สร้าง database (test mode, asia-southeast1)
- [ ] **Storage**: เปิดใช้งาน (test mode, asia-southeast1)

---

## ⚡ Vercel Setup

### Account & Project
- [ ] สร้างบัญชี [Vercel](https://vercel.com) ด้วย GitHub
- [ ] Import project `notebook-system-v3`
- [ ] ตั้งชื่อ `equipment-lending-system`

### Build Configuration
- [ ] Root Directory: `equipment-lending-system`
- [ ] Build Command: `npm run build:production`
- [ ] Output Directory: `build`
- [ ] Install Command: `npm install`

### Environment Variables
เพิ่มตัวแปรเหล่านี้ใน Vercel Project Settings:

#### Basic Settings
- [ ] `REACT_APP_ENVIRONMENT` = `production`
- [ ] `REACT_APP_USE_EMULATOR` = `false`
- [ ] `GENERATE_SOURCEMAP` = `false`

#### Firebase Configuration (ใช้ข้อมูลจาก Firebase)
- [ ] `REACT_APP_FIREBASE_API_KEY_PROD` = `[apiKey]`
- [ ] `REACT_APP_FIREBASE_AUTH_DOMAIN_PROD` = `[authDomain]`
- [ ] `REACT_APP_FIREBASE_PROJECT_ID_PROD` = `[projectId]`
- [ ] `REACT_APP_FIREBASE_STORAGE_BUCKET_PROD` = `[storageBucket]`
- [ ] `REACT_APP_FIREBASE_MESSAGING_SENDER_ID_PROD` = `[messagingSenderId]`
- [ ] `REACT_APP_FIREBASE_APP_ID_PROD` = `[appId]`
- [ ] `REACT_APP_FIREBASE_MEASUREMENT_ID_PROD` = `[measurementId]`

### Deployment
- [ ] Deploy project (อาจล้มเหลวครั้งแรก)
- [ ] หลังจากใส่ environment variables แล้ว redeploy
- [ ] ได้ URL สำเร็จ (เช่น `https://equipment-lending-system-abc123.vercel.app`)

---

## 🔗 Integration

### Firebase Authorized Domains
- [ ] กลับไป Firebase Console
- [ ] Authentication > Settings > Authorized domains
- [ ] เพิ่ม `localhost` (สำหรับ development)
- [ ] เพิ่ม Vercel URL ที่ได้

### Security Rules Deployment
เปิด Terminal และรันคำสั่ง:
- [ ] `npm install -g firebase-tools`
- [ ] `firebase login`
- [ ] `cd equipment-lending-system`
- [ ] `firebase use [your-project-id]`
- [ ] `firebase deploy --only firestore:rules,storage`

---

## 🧪 Testing

### Basic Functionality
- [ ] เปิดเว็บไซต์ได้ (ไม่มี error)
- [ ] หน้าแรกแสดงผลถูกต้อง
- [ ] ไม่มี console errors

### Authentication
- [ ] คลิก "เข้าสู่ระบบ" ได้
- [ ] Google OAuth ทำงาน
- [ ] เข้าสู่ระบบสำเร็จ
- [ ] หน้า profile setup แสดงผล (สำหรับ user ใหม่)

### Core Features
- [ ] ดูรายการอุปกรณ์ได้
- [ ] ค้นหาอุปกรณ์ได้
- [ ] ส่งคำขอยืมได้ (สำหรับ approved users)
- [ ] ระบบ notification ทำงาน

---

## 🎯 Post-Deployment

### Admin Setup
- [ ] เข้าสู่ระบบด้วย admin account
- [ ] เพิ่มอุปกรณ์ตัวอย่าง
- [ ] ทดสอบการอนุมัติ user
- [ ] ทดสอบการจัดการคำขอยืม

### Performance Check
- [ ] ตรวจสอบ page load speed
- [ ] ทดสอบบน mobile device
- [ ] ตรวจสอบ responsive design

### Monitoring Setup
- [ ] ตรวจสอบ Vercel Analytics
- [ ] ตรวจสอบ Firebase Analytics
- [ ] ตั้งค่า error monitoring

---

## 🆘 Troubleshooting

### Common Issues
- [ ] **Build Failed**: ตรวจสอบ environment variables
- [ ] **Auth Error**: ตรวจสอบ authorized domains
- [ ] **Permission Denied**: deploy security rules
- [ ] **404 on Refresh**: ตรวจสอบ vercel.json rewrites

### Debug Tools
- [ ] Vercel Function Logs
- [ ] Firebase Console Logs
- [ ] Browser Developer Tools
- [ ] Network Tab ใน DevTools

---

## 📝 Documentation

### URLs to Save
- [ ] **Firebase Console**: `https://console.firebase.google.com/project/[project-id]`
- [ ] **Vercel Dashboard**: `https://vercel.com/[username]/equipment-lending-system`
- [ ] **Live Website**: `https://equipment-lending-system-[id].vercel.app`

### Credentials to Save
- [ ] Firebase Project ID
- [ ] Firebase Config Object
- [ ] Vercel Project URL
- [ ] Admin Email Addresses

---

## 🎉 Success Criteria

### ✅ Deployment Successful When:
- [ ] Website loads without errors
- [ ] Google authentication works
- [ ] Users can register and get approved
- [ ] Equipment management works
- [ ] Loan requests can be submitted and approved
- [ ] Notifications system works
- [ ] Admin functions work properly
- [ ] Mobile responsive design works
- [ ] Performance is acceptable (< 3s load time)

---

## 📞 Support

### If You Need Help:
1. **Check Logs**: Vercel Dashboard > Functions > View Function Logs
2. **Firebase Console**: Check Authentication, Firestore, Storage tabs
3. **Browser DevTools**: Check Console and Network tabs
4. **Documentation**: Refer to step-by-step-deployment.md

### Contact Information:
- **Project Repository**: https://github.com/Bally-LPRU/notebook-system-v3
- **Documentation**: Available in `/docs` folder

---

**🚀 Ready to Deploy? Let's Go!**