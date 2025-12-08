# แก้ไขปัญหา "Missing or insufficient permissions" ในหน้า Admin Settings

## วันที่: พฤศจิกายน 2567

## ปัญหา
หน้า /admin/settings แสดงข้อความ error:
"เกิดข้อผิดพลาดในการโหลดการตั้งค่า Missing or insufficient permissions."

## วิธีแก้ไข (ใช้เวลา 5 นาที)

### 1. เข้า Firebase Console
- https://console.firebase.google.com
- เลือกโปรเจค Equipment Lending System
- คลิก Firestore Database

### 2. แก้ไข User Document
- เปิด collection "users"
- หา document ของคุณ (ดูจาก email)
- คลิกที่ document นั้น
- แก้ไขฟิลด์:
  - `role`: เปลี่ยนจาก "user" เป็น "admin"
  - `status`: เปลี่ยนเป็น "approved"
- คลิก "Update"

### 3. สร้าง Settings Document (ถ้ายังไม่มี)
- ดูว่ามี collection "settings" หรือไม่
- ถ้าไม่มี ให้สร้าง:
  - Collection ID: `settings`
  - Document ID: `systemSettings`
  - เพิ่มฟิลด์:
    - `maxLoanDuration` (number): 7
    - `maxAdvanceBookingDays` (number): 30
    - `defaultCategoryLimit` (number): 3
    - `discordEnabled` (boolean): false
    - `discordWebhookUrl` (string): ""
    - `lastUpdated` (timestamp): ใช้ server timestamp
    - `lastUpdatedBy` (string): "system"

### 4. ทดสอบ
- ออกจากระบบ (Sign Out)
- ล้าง cache (Ctrl+Shift+Delete)
- ปิดและเปิด browser ใหม่
- เข้าสู่ระบบอีกครั้ง
- ไปที่หน้า Admin Settings

## เอกสารเพิ่มเติม
- `docs/admin-system/QUICK_FIX_ADMIN_SETTINGS.md`
- `docs/admin-system/ADMIN_SETTINGS_PERMISSION_FIX.md`

## Script ที่ใช้ได้
```bash
node scripts/check-admin-status.js
```

## หมายเหตุ
- ทำเพียงครั้งเดียวสำหรับ admin คนแรก
- Admin คนต่อไปตั้งค่าผ่านหน้า User Management ได้
- การเปลี่ยนแปลงมีผลทันทีหลัง login ใหม่
