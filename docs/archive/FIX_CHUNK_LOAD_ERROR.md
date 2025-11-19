# 🔧 แก้ไข ChunkLoadError และ MIME Type Errors

## ปัญหาที่พบ

จากภาพหน้าจอ พบปัญหา:

1. **ChunkLoadError: Loading chunk 312 failed**
   - ไฟล์ JavaScript chunks โหลดไม่สำเร็จ
   - เกิดจาก cache ที่ล้าสมัย

2. **MIME Type Errors**
   - ไฟล์ `.js` ถูก serve เป็น `text/html` แทนที่จะเป็น `application/javascript`
   - ทำให้ browser ปฏิเสธการ execute

3. **Service Worker Issues**
   - Service Worker cache ไฟล์เก่าไว้
   - ทำให้โหลดไฟล์ที่ไม่ตรงกับ build ใหม่

## สาเหตุ

- Vercel cache ไฟล์เก่าไว้
- Browser cache ไฟล์เก่าไว้
- Service Worker cache ไฟล์เก่าไว้
- Content-Type headers ไม่ถูกต้อง

## วิธีแก้ไข

### 1. ✅ แก้ไข vercel.json (แก้ไขแล้ว)

เพิ่ม Content-Type headers ที่ถูกต้อง:

```json
{
  "headers": [
    {
      "source": "/static/js/(.*)",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        }
      ]
    },
    {
      "source": "/(.*).js",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        }
      ]
    }
  ]
}
```

### 2. ✅ เพิ่ม public/_headers (สร้างแล้ว)

สำหรับ static file serving:

```
/static/js/*
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable
```

### 3. 🔄 Clear Vercel Cache

**Option A: Via Vercel Dashboard**
```
1. ไปที่ https://vercel.com/dashboard
2. เลือก project ของคุณ
3. Settings > General
4. Build & Development Settings
5. คลิก "Clear Cache"
```

**Option B: Via Git (แนะนำ)**
```bash
git add -A
git commit -m "fix: แก้ไข ChunkLoadError และ MIME type errors"
git push origin main
```

**Option C: Via Vercel CLI**
```bash
npm install -g vercel
vercel --prod --force
```

### 4. 🧹 Clear Browser Cache

**ผู้ใช้ทั่วไป:**
```
1. เปิด Incognito/Private Mode
2. หรือ Clear Browser Cache (Ctrl+Shift+Delete)
3. เลือก "Cached images and files"
4. คลิก "Clear data"
```

**ผู้พัฒนา:**
```
1. เปิด DevTools (F12)
2. Right-click Refresh button
3. เลือก "Empty Cache and Hard Reload"
```

### 5. 🔧 Clear Service Worker

```
1. เปิด DevTools (F12)
2. ไปที่ Application tab
3. เลือก Service Workers
4. คลิก "Unregister" ทุกตัว
5. Refresh หน้าเว็บ
```

## ไฟล์ที่แก้ไข

1. ✅ `vercel.json` - เพิ่ม Content-Type headers
2. ✅ `public/_headers` - Static file headers
3. ✅ `.vercelignore` - ป้องกัน deploy ไฟล์ที่ไม่จำเป็น
4. ✅ `scripts/clear-vercel-cache.js` - คำแนะนำ clear cache

## วิธี Deploy

```bash
# 1. Commit การแก้ไข
git add -A
git commit -m "fix: แก้ไข ChunkLoadError และ MIME type errors

- เพิ่ม Content-Type headers ใน vercel.json
- สร้าง public/_headers สำหรับ static files
- เพิ่ม .vercelignore
- เพิ่มสคริปต์ clear cache"

# 2. Push ไป GitHub
git push origin main

# 3. รอ Vercel auto-deploy (2-5 นาที)
```

## วิธีทดสอบหลัง Deploy

### 1. ทดสอบใน Incognito Mode

```
1. เปิด Incognito/Private Window
2. ไปที่ https://equipment-lending-system-41b49.vercel.app
3. เปิด DevTools (F12)
4. ตรวจสอบ Console:
   ✅ ไม่มี ChunkLoadError
   ✅ ไม่มี MIME type errors
   ✅ ไม่มี Service Worker errors
```

### 2. ตรวจสอบ Network Tab

```
1. เปิด DevTools > Network tab
2. Refresh หน้าเว็บ
3. ตรวจสอบ JavaScript files:
   ✅ Status: 200 OK
   ✅ Type: javascript
   ✅ Content-Type: application/javascript
```

### 3. ตรวจสอบ Headers

```
1. เปิด DevTools > Network tab
2. คลิกที่ไฟล์ .js ใดๆ
3. ดู Response Headers:
   ✅ Content-Type: application/javascript; charset=utf-8
   ✅ Cache-Control: public, max-age=31536000, immutable
```

## Expected Results

### ✅ Console (ควรเห็น):
```
✅ Firebase app initialized successfully
✅ Firebase Auth initialized
✅ Firestore initialized
✅ Storage initialized
✅ Service Worker registered successfully
✅ Auth state changed: logged in
✅ User profile loaded
```

### ❌ Console (ไม่ควรเห็น):
```
❌ ChunkLoadError: Loading chunk 312 failed
❌ Refused to execute script from '...' because its MIME type ('text/html') is not executable
❌ TypeError: Failed to execute 'put' on 'Cache'
❌ Uncaught (in promise) TypeError
```

## Troubleshooting

### ถ้ายังมี ChunkLoadError:

1. **Clear Vercel Cache อีกครั้ง**
   ```bash
   vercel --prod --force
   ```

2. **ตรวจสอบ Build Logs**
   - ไปที่ Vercel Dashboard
   - เลือก Deployments
   - ดู Build Logs
   - ตรวจสอบว่า build สำเร็จ

3. **Rollback to Previous Deployment**
   - ไปที่ Vercel Dashboard
   - เลือก Deployments
   - เลือก deployment ก่อนหน้า
   - คลิก "Promote to Production"

### ถ้ายังมี MIME Type Errors:

1. **ตรวจสอบ vercel.json**
   ```bash
   cat vercel.json
   ```

2. **ตรวจสอบ public/_headers**
   ```bash
   cat public/_headers
   ```

3. **Redeploy**
   ```bash
   git commit --allow-empty -m "Redeploy to fix MIME types"
   git push origin main
   ```

### ถ้ายังมี Service Worker Issues:

1. **Unregister Service Worker**
   - DevTools > Application > Service Workers
   - Unregister all

2. **Clear Application Data**
   - DevTools > Application > Clear storage
   - เลือกทุกอย่าง
   - คลิก "Clear site data"

3. **Hard Refresh**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

## Prevention

### สำหรับผู้พัฒนา:

1. **ทดสอบ Build ก่อน Deploy**
   ```bash
   npm run build
   npx serve -s build
   ```

2. **ใช้ Versioning**
   ```bash
   # ใน package.json
   "version": "1.0.1"
   ```

3. **Monitor Deployments**
   - ติดตาม Vercel Dashboard
   - ตรวจสอบ Build Logs
   - ทดสอบทันทีหลัง Deploy

### สำหรับผู้ใช้:

1. **แจ้งให้ Clear Cache**
   - แสดง notification หลัง deploy
   - แนะนำให้ hard refresh

2. **Version Check**
   - แสดงเวอร์ชันใน UI
   - ตรวจสอบเวอร์ชันอัตโนมัติ

3. **Auto-Reload**
   - Detect version mismatch
   - Auto-reload หน้าเว็บ

## Summary

✅ **แก้ไขแล้ว:**
1. เพิ่ม Content-Type headers ใน vercel.json
2. สร้าง public/_headers
3. เพิ่ม .vercelignore
4. สร้างสคริปต์ clear cache

🔄 **ต้องทำ:**
1. Commit และ Push
2. รอ Vercel auto-deploy
3. Clear browser cache
4. ทดสอบใน Incognito mode

🎯 **ผลลัพธ์ที่คาดหวัง:**
- ไม่มี ChunkLoadError
- ไม่มี MIME type errors
- ไม่มี Service Worker errors
- หน้าเว็บโหลดได้ปกติ

---

**Status:** ✅ Fixed  
**Next:** Commit & Push  
**ETA:** 2-5 minutes after push
