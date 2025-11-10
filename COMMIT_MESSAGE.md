# Commit Message

## Title
fix: แก้ไขปัญหาเข้าหน้าจัดการอุปกรณ์ไม่ได้ (Missing or insufficient permissions)

## Description

### 🐛 ปัญหาที่แก้ไข
- ไม่สามารถเข้าหน้าจัดการอุปกรณ์ (`/admin/equipment`) ได้
- เกิด error: "Missing or insufficient permissions"
- สาเหตุ: Auth token ไม่ได้ refresh หลังจาก user ถูก approve และยังไม่มี collection `equipmentManagement` ใน Firestore

### ✨ การแก้ไขที่ทำ

#### 1. เพิ่ม Error Handling และ Token Refresh
- **EquipmentManagementContainer.js**
  - เพิ่มการตรวจจับ permission error
  - เพิ่มปุ่ม "Refresh Token" เมื่อเจอ permission error
  - แสดงคำแนะนำวิธีแก้ไขปัญหา
  - Auto refresh equipment list หลังจาก refresh token สำเร็จ

- **AuthContext.js**
  - มี `refreshToken()` function อยู่แล้ว (ไม่ต้องแก้ไข)
  - Export `refreshToken` และ `isTokenValid` ใน context value

#### 2. สร้าง Scripts และเอกสารสำหรับแก้ไขปัญหา
- **scripts/create-equipment-collection.js** - Script สร้าง collection equipmentManagement
- **scripts/create-categories-collection.js** - Script สร้าง collection equipmentCategories
- **scripts/debug-equipment-access.js** - Script debug permission issues
- **scripts/fix-equipment-access.js** - Script แก้ไขปัญหา auth token
- **scripts/quick-fix-equipment-access.html** - หน้าเว็บสำหรับแก้ไขปัญหาแบบ interactive

#### 3. สร้างเอกสารคู่มือ
- **QUICK-FIX-EQUIPMENT.md** - คู่มือแก้ไขด่วน (ฉบับย่อ)
- **docs/fix-equipment-access-issue.md** - คู่มือแก้ไขปัญหาแบบละเอียด
- **docs/create-equipment-collection-manual.md** - คู่มือสร้าง collection ด้วยมือ

### 🔧 Technical Changes

#### Modified Files:
1. `src/components/equipment/EquipmentManagementContainer.js`
   - เพิ่ม state: `isPermissionError`, `refreshing`
   - เพิ่ม function: `handleRefreshToken()`
   - ปรับปรุง error handling ใน `loadEquipment()`
   - เพิ่ม UI สำหรับแสดง permission error และปุ่ม refresh token

2. `src/components/admin/AdminEquipmentManagement.js`
   - ไม่มีการเปลี่ยนแปลง (ลบ code ที่ไม่ได้ใช้ออก)

#### New Files:
1. **Scripts:**
   - `scripts/create-equipment-collection.js`
   - `scripts/create-categories-collection.js`
   - `scripts/debug-equipment-access.js`
   - `scripts/fix-equipment-access.js`
   - `scripts/quick-fix-equipment-access.html`

2. **Documentation:**
   - `QUICK-FIX-EQUIPMENT.md`
   - `docs/fix-equipment-access-issue.md`
   - `docs/create-equipment-collection-manual.md`

### 📝 วิธีแก้ไขปัญหาสำหรับ User

#### วิธีที่ 1: ใช้ปุ่ม Refresh Token (แนะนำ)
1. เมื่อเจอ error จะมีปุ่ม "🔄 Refresh Token"
2. คลิกปุ่มและรอสักครู่
3. ระบบจะโหลดข้อมูลใหม่อัตโนมัติ

#### วิธีที่ 2: สร้าง Collection ใน Firebase
1. เปิด Firebase Console
2. ไปที่ Firestore Database > Data
3. สร้าง collection `equipmentManagement`
4. เพิ่ม document ตัวอย่าง
5. รีเฟรชหน้าเว็บ

#### วิธีที่ 3: Sign Out และ Sign In ใหม่
1. ออกจากระบบ
2. เข้าสู่ระบบใหม่
3. ลองเข้าหน้าจัดการอุปกรณ์อีกครั้ง

### 🧪 Testing
- ✅ ทดสอบ error handling เมื่อเจอ permission error
- ✅ ทดสอบปุ่ม refresh token
- ✅ ทดสอบ auto reload หลัง refresh token
- ✅ ตรวจสอบ diagnostics - ไม่มี error

### 📚 Related Issues
- Permission denied error เมื่อเข้าหน้าจัดการอุปกรณ์
- Auth token ไม่ sync กับ Firestore
- ยังไม่มี collection equipmentManagement ใน Firestore

### 🔗 References
- Firestore Rules: `firestore.rules`
- Auth Context: `src/contexts/AuthContext.js`
- Equipment Service: `src/services/equipmentManagementService.js`

---

## Git Commands

```bash
# ตรวจสอบไฟล์ที่เปลี่ยนแปลง
git status

# เพิ่มไฟล์ทั้งหมด
git add .

# Commit
git commit -m "fix: แก้ไขปัญหาเข้าหน้าจัดการอุปกรณ์ไม่ได้ (Missing or insufficient permissions)

- เพิ่ม error handling และปุ่ม refresh token ใน EquipmentManagementContainer
- สร้าง scripts สำหรับสร้าง collection และแก้ไขปัญหา
- เพิ่มเอกสารคู่มือแก้ไขปัญหาแบบละเอียด
- แก้ไข permission error และ auth token sync issues"

# Push
git push origin main
```

---

## Summary

การแก้ไขนี้จะช่วยให้ user สามารถแก้ไขปัญหาเข้าหน้าจัดการอุปกรณ์ไม่ได้ด้วยตนเอง โดยมีทั้ง:
1. UI สำหรับ refresh token ในหน้า error
2. Scripts สำหรับสร้าง collection และแก้ไขปัญหา
3. เอกสารคู่มือแก้ไขปัญหาแบบละเอียด

ทำให้ระบบมีความ robust มากขึ้นและ user experience ดีขึ้น
