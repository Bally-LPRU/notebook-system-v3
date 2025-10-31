# Vercel Deployment Guide

## Overview
คู่มือการ deploy ระบบยืม-คืนโน็คบุคและอุปกรณ์คอมพิวเตอร์ไปยัง Vercel พร้อมการเชื่อมต่อ Firebase

## Prerequisites

### 1. Vercel Account Setup
1. สร้างบัญชี Vercel ที่ [vercel.com](https://vercel.com)
2. เชื่อมต่อกับ GitHub account
3. ติดตั้ง Vercel CLI:
   ```bash
   npm install -g vercel
   ```

### 2. Firebase Project Setup
1. สร้าง Firebase project ที่ [Firebase Console](https://console.firebase.google.com)
2. เปิดใช้งาน Authentication (Google provider)
3. ตั้งค่า Firestore Database
4. เปิดใช้งาน Firebase Storage
5. กำหนดค่า authorized domains ใน Authentication settings

## Deployment Steps

### Step 1: Prepare Project
1. Clone หรือ download project
2. ติดตั้ง dependencies:
   ```bash
   cd equipment-lending-system
   npm install
   ```

### Step 2: Configure Environment Variables

#### ใน Vercel Dashboard:
1. ไปที่ Project Settings > Environment Variables
2. เพิ่ม environment variables ต่อไปนี้:

```bash
# Environment
REACT_APP_ENVIRONMENT=production
REACT_APP_USE_EMULATOR=false

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY_PROD=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN_PROD=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID_PROD=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET_PROD=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID_PROD=your_sender_id
REACT_APP_FIREBASE_APP_ID_PROD=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID_PROD=your_measurement_id

# Build Settings
GENERATE_SOURCEMAP=false
CI=false
```

### Step 3: Deploy to Vercel

#### Option 1: Using Vercel CLI
```bash
# Login to Vercel
vercel login

# Deploy to preview
npm run deploy:vercel:preview

# Deploy to production
npm run deploy:vercel
```

#### Option 2: Using Deployment Script
```bash
# Deploy to preview
node scripts/deploy-vercel.js

# Deploy to production
node scripts/deploy-vercel.js --prod
```

#### Option 3: GitHub Integration
1. Push code ไปยัง GitHub repository
2. ใน Vercel Dashboard, เลือก "Import Project"
3. เชื่อมต่อกับ GitHub repository
4. Vercel จะ auto-deploy ทุกครั้งที่ push code

### Step 4: Configure Firebase Authentication
1. ใน Firebase Console > Authentication > Settings
2. เพิ่ม Vercel domain ใน "Authorized domains":
   - `your-project.vercel.app`
   - `your-custom-domain.com` (ถ้ามี)

### Step 5: Test Deployment
1. เปิด deployed URL
2. ทดสอบ Google OAuth login
3. ทดสอบฟีเจอร์หลักทั้งหมด

## Custom Domain Setup

### Step 1: Add Domain in Vercel
1. ไปที่ Project Settings > Domains
2. เพิ่ม custom domain
3. ตั้งค่า DNS records ตามที่ Vercel แนะนำ

### Step 2: Update Firebase Configuration
1. เพิ่ม custom domain ใน Firebase authorized domains
2. อัพเดท OAuth redirect URIs

### Step 3: SSL Certificate
Vercel จะจัดการ SSL certificate อัตโนมัติ

## Environment-Specific Configuration

### Development
```bash
REACT_APP_ENVIRONMENT=development
REACT_APP_USE_EMULATOR=true
```

### Production (Vercel)
```bash
REACT_APP_ENVIRONMENT=production
REACT_APP_USE_EMULATOR=false
```

## Performance Optimization

### 1. Build Optimization
- Source maps ถูกปิดใน production
- Code splitting เปิดใช้งานอัตโนมัติ
- Bundle size optimization

### 2. Caching Strategy
```json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 3. CDN Distribution
Vercel ใช้ global CDN สำหรับ static assets

## Monitoring and Analytics

### 1. Vercel Analytics
เปิดใช้งาน Vercel Analytics ใน project settings

### 2. Firebase Analytics
Firebase Analytics จะทำงานอัตโนมัติใน production

### 3. Error Monitoring
ตั้งค่า error reporting ใน Firebase Console

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs
vercel logs

# Local build test
npm run build:production
```

#### 2. Environment Variables Not Working
- ตรวจสอบว่าตั้งค่าใน Vercel Dashboard แล้ว
- Redeploy หลังจากเปลี่ยน environment variables

#### 3. Firebase Connection Issues
- ตรวจสอบ authorized domains ใน Firebase
- ตรวจสอบ API keys และ configuration

#### 4. Authentication Problems
- ตรวจสอบ OAuth configuration
- ตรวจสอบ redirect URIs

### Debug Commands
```bash
# View deployments
vercel ls

# View logs
vercel logs

# Open project in browser
vercel open

# Check environment variables
vercel env ls
```

## Security Considerations

### 1. Environment Variables
- ไม่เก็บ sensitive data ใน code
- ใช้ Vercel environment variables

### 2. Firebase Security Rules
- ตรวจสอบ Firestore security rules
- ตรวจสอบ Storage security rules

### 3. Domain Security
- ใช้ HTTPS เท่านั้น
- ตั้งค่า security headers

## Continuous Deployment

### GitHub Actions Integration
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Build project
        run: npm run build:production
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Backup and Recovery

### 1. Database Backup
- Firebase Firestore มี automatic backup
- สามารถ export data ได้จาก Firebase Console

### 2. Code Backup
- Code เก็บใน GitHub repository
- Vercel เก็บ deployment history

### 3. Recovery Process
1. Rollback ไปยัง previous deployment ใน Vercel
2. Restore database จาก Firebase backup
3. ตรวจสอบการทำงานของระบบ

## Cost Optimization

### Vercel Pricing
- Hobby plan: ฟรีสำหรับ personal projects
- Pro plan: สำหรับ commercial use
- Enterprise plan: สำหรับองค์กรขนาดใหญ่

### Firebase Pricing
- Spark plan: ฟรีสำหรับการใช้งานเบื้องต้น
- Blaze plan: Pay-as-you-go สำหรับการใช้งานจริง

## Support and Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

### Community Support
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Firebase Community](https://firebase.google.com/support)

### Contact Information
- Vercel Support: support@vercel.com
- Firebase Support: Firebase Console > Support

## Checklist

### Pre-deployment
- [ ] Firebase project ตั้งค่าเรียบร้อย
- [ ] Environment variables ตั้งค่าใน Vercel
- [ ] Build ผ่านใน local environment
- [ ] Tests ผ่านทั้งหมด

### Post-deployment
- [ ] Application เปิดได้ปกติ
- [ ] Authentication ทำงานได้
- [ ] Database connection ปกติ
- [ ] All features ทำงานได้
- [ ] Performance ตรวจสอบแล้ว
- [ ] Security headers ตั้งค่าแล้ว

### Monitoring
- [ ] Analytics เปิดใช้งาน
- [ ] Error monitoring ตั้งค่า
- [ ] Performance monitoring เปิดใช้งาน
- [ ] Backup strategy ตั้งค่า