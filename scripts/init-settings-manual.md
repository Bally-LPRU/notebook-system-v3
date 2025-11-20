# วิธีสร้างข้อมูลการตั้งค่าเริ่มต้นใน Firebase Console

เนื่องจากไม่สามารถใช้ script สร้างข้อมูลได้โดยตรง (ต้องการ authentication) ให้ทำตามขั้นตอนนี้:

## 1. เข้า Firebase Console
1. ไปที่ https://console.firebase.google.com/
2. เลือกโปรเจค `equipment-lending-system-41b49`
3. ไปที่ Firestore Database

## 2. สร้าง Collection: settings
1. คลิก "Start collection"
2. Collection ID: `settings`
3. Document ID: `systemSettings`
4. เพิ่ม fields ต่อไปนี้:

```
maxLoanDuration: 14 (number)
maxAdvanceBookingDays: 30 (number)
defaultCategoryLimit: 3 (number)
discordWebhookUrl: null
discordEnabled: false (boolean)
lastUpdated: (timestamp - ใช้ current time)
lastUpdatedBy: "system" (string)
version: 1 (number)
```

## 3. สร้าง Collection: systemNotifications
1. คลิก "Start collection"
2. Collection ID: `systemNotifications`
3. สร้าง document ตัวอย่าง (optional):

```
Document ID: (auto-generate)
type: "info" (string)
title: "ระบบพร้อมใช้งาน" (string)
message: "ระบบการตั้งค่าพร้อมใช้งานแล้ว" (string)
priority: "normal" (string)
createdAt: (timestamp - current time)
createdBy: "system" (string)
sentTo: ["all"] (array)
readBy: [] (array)
responses: [] (array)
```

## 4. สร้าง Collection: savedSearches
1. คลิก "Start collection"
2. Collection ID: `savedSearches`
3. ไม่ต้องสร้าง document (ปล่อยว่างไว้)

## 5. ตรวจสอบ Collections ที่มีอยู่แล้ว
ตรวจสอบว่า collections เหล่านี้มีอยู่แล้ว:
- ✅ closedDates
- ✅ categoryLimits
- ✅ settingsAuditLog

## 6. ทดสอบการเข้าถึง
หลังจากสร้างเสร็จแล้ว ให้:
1. Login เข้าระบบด้วย admin account
2. ไปที่หน้า Admin Settings
3. ตรวจสอบว่าสามารถดูและแก้ไขการตั้งค่าได้

## หมายเหตุ
- Firestore rules ได้ถูก deploy แล้ว
- Admin account ต้องมี role = 'admin' ใน users collection
- หากยังมีปัญหา ให้ตรวจสอบ Console logs ใน browser
