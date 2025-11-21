# Deployment Documentation

เอกสารเกี่ยวกับการ Deploy และ Migration

## 📁 เอกสารในโฟลเดอร์นี้

### คู่มือ Deployment
- `DEPLOYMENT.md` - คู่มือการ Deploy หลัก
- `DEPLOYMENT_CHECKLIST.md` - Checklist ก่อน Deploy
- `README-DEPLOYMENT.md` - คู่มือ Deploy เพิ่มเติม

### Migration
- `MIGRATION_GUIDE.md` - คู่มือการ Migrate ข้อมูล

### Git & Version Control
- `GIT_COMMANDS.md` - คำสั่ง Git ที่ใช้บ่อย
- `PUSH_INSTRUCTIONS.md` - คำแนะนำการ Push

### Pre-Deployment
- `PRE_COMMIT_CHECKLIST.md` - Checklist ก่อน Commit

## 🚀 ขั้นตอนการ Deploy

### 1. Pre-Deployment
```bash
# ตรวจสอบ Checklist
- [ ] ทดสอบทุก feature
- [ ] ตรวจสอบ errors
- [ ] Review code
- [ ] Update documentation
```

### 2. Build
```bash
npm run build
```

### 3. Deploy to Vercel
```bash
vercel --prod
```

### 4. Deploy Firebase
```bash
firebase deploy
```

## 📋 Deployment Checklist

### ก่อน Deploy
- [ ] ทดสอบ local environment
- [ ] ตรวจสอบ environment variables
- [ ] Review security rules
- [ ] ตรวจสอบ indexes
- [ ] Backup database

### หลัง Deploy
- [ ] ทดสอบ production
- [ ] ตรวจสอบ logs
- [ ] Monitor performance
- [ ] ตรวจสอบ errors

## 🔧 Scripts ที่เกี่ยวข้อง

### Deployment
- `scripts/deploy-production-equipment.js` - Deploy อุปกรณ์
- `scripts/validate-production-equipment.js` - Validate production

### Testing
- `scripts/run-production-tests.js` - ทดสอบ production
- `scripts/production-test-suite.js` - Test suite
- `scripts/security-performance-audit.js` - Audit security & performance

### Cache
- `scripts/clear-vercel-cache.js` - ล้าง Vercel cache

## 🔗 เอกสารที่เกี่ยวข้อง

- [Production Deployment Checklist](../production-deployment-checklist.md)
- [Production Testing Guide](../production-testing-guide.md)
- [Production Setup Equipment](../production-setup-equipment.md)

## ⚙️ Configuration Files

- `vercel.json` - Vercel configuration
- `firebase.json` - Firebase configuration
- `.vercelignore` - Vercel ignore files
- `.env.production` - Production environment variables
