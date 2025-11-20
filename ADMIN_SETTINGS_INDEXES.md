# Admin Settings System - Firestore Indexes

## 📊 สรุป Indexes ที่จำเป็น

เอกสารนี้อธิบาย Firestore indexes ที่จำเป็นสำหรับ Admin Settings System

---

## ✅ Indexes ที่มีอยู่แล้ว

### 1. settingsAuditLog Collection

#### Index 1: Basic Ordering
```json
{
  "collectionGroup": "settingsAuditLog",
  "fields": [
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```
**ใช้สำหรับ:** `getAuditLog()` แบบไม่มี filter - แสดงประวัติการเปลี่ยนแปลงทั้งหมด

#### Index 2: Filter by Admin
```json
{
  "collectionGroup": "settingsAuditLog",
  "fields": [
    { "fieldPath": "adminId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```
**ใช้สำหรับ:** `getAuditLog({ adminId: 'xxx' })` - ดูประวัติการเปลี่ยนแปลงของ admin คนใดคนหนึ่ง

#### Index 3: Filter by Setting Type
```json
{
  "collectionGroup": "settingsAuditLog",
  "fields": [
    { "fieldPath": "settingType", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```
**ใช้สำหรับ:** `getAuditLog({ settingType: 'closedDate' })` - ดูประวัติการเปลี่ยนแปลงของการตั้งค่าประเภทใดประเภทหนึ่ง

#### Index 4: Filter by Admin and Setting Type
```json
{
  "collectionGroup": "settingsAuditLog",
  "fields": [
    { "fieldPath": "adminId", "order": "ASCENDING" },
    { "fieldPath": "settingType", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```
**ใช้สำหรับ:** `getAuditLog({ adminId: 'xxx', settingType: 'closedDate' })` - ดูประวัติการเปลี่ยนแปลงแบบละเอียด

#### Index 5: Date Range Filter (NEW)
```json
{
  "collectionGroup": "settingsAuditLog",
  "fields": [
    { "fieldPath": "timestamp", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```
**ใช้สำหรับ:** `getAuditLog({ startDate: date1, endDate: date2 })` - ดูประวัติในช่วงเวลาที่กำหนด

---

### 2. closedDates Collection

#### Index 1: Date Ordering
```json
{
  "collectionGroup": "closedDates",
  "fields": [
    { "fieldPath": "date", "order": "ASCENDING" }
  ]
}
```
**ใช้สำหรับ:** `getClosedDates()` - แสดงวันปิดทำการเรียงตามวันที่

---

### 3. systemNotifications Collection

#### Index 1: Basic Ordering
```json
{
  "collectionGroup": "systemNotifications",
  "fields": [
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**ใช้สำหรับ:** `getSystemNotifications()` - แสดงการแจ้งเตือนทั้งหมด

#### Index 2: Filter by Type
```json
{
  "collectionGroup": "systemNotifications",
  "fields": [
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**ใช้สำหรับ:** `getSystemNotifications({ type: 'announcement' })` - กรองตามประเภทการแจ้งเตือน

#### Index 3: Filter by Priority
```json
{
  "collectionGroup": "systemNotifications",
  "fields": [
    { "fieldPath": "priority", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**ใช้สำหรับ:** `getSystemNotifications({ priority: 'high' })` - กรองตามความสำคัญ

#### Index 4: Filter by User (NEW)
```json
{
  "collectionGroup": "systemNotifications",
  "fields": [
    { "fieldPath": "sentTo", "arrayConfig": "CONTAINS" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**ใช้สำหรับ:** `getUnreadNotifications(userId)` - ดูการแจ้งเตือนที่ส่งถึง user คนใดคนหนึ่ง

#### Index 5: Date Range Filter (NEW)
```json
{
  "collectionGroup": "systemNotifications",
  "fields": [
    { "fieldPath": "createdAt", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**ใช้สำหรับ:** `getSystemNotifications({ startDate: date1, endDate: date2 })` - ดูการแจ้งเตือนในช่วงเวลาที่กำหนด

---

## 🆕 Indexes ที่เพิ่มใหม่

### 1. systemNotifications - sentTo Array Contains
**เหตุผล:** สำหรับ query `where('sentTo', 'array-contains', userId)` ใน `getUnreadNotifications()`

### 2. systemNotifications - Date Range
**เหตุผล:** สำหรับ query ที่มี `where('createdAt', '>=', startDate)` และ `where('createdAt', '<=', endDate)`

### 3. settingsAuditLog - Date Range
**เหตุผล:** สำหรับ query ที่มี `where('timestamp', '>=', startDate)` และ `where('timestamp', '<=', endDate)`

---

## 📋 Query Patterns ที่ใช้

### settingsService.js

#### 1. getClosedDates()
```javascript
query(closedDatesRef, orderBy('date', 'asc'))
```
**Index:** `closedDates` - `date ASC`

#### 2. getAuditLog() - No Filter
```javascript
query(auditLogRef, orderBy('timestamp', 'desc'))
```
**Index:** `settingsAuditLog` - `timestamp DESC`

#### 3. getAuditLog() - Filter by adminId
```javascript
query(auditLogRef, 
  where('adminId', '==', adminId),
  orderBy('timestamp', 'desc')
)
```
**Index:** `settingsAuditLog` - `adminId ASC, timestamp DESC`

#### 4. getAuditLog() - Filter by settingType
```javascript
query(auditLogRef,
  where('settingType', '==', settingType),
  orderBy('timestamp', 'desc')
)
```
**Index:** `settingsAuditLog` - `settingType ASC, timestamp DESC`

#### 5. getAuditLog() - Date Range
```javascript
query(auditLogRef,
  where('timestamp', '>=', startDate),
  where('timestamp', '<=', endDate),
  orderBy('timestamp', 'desc')
)
```
**Index:** `settingsAuditLog` - `timestamp ASC, timestamp DESC` ⚠️ **ใหม่**

#### 6. getSystemNotifications() - No Filter
```javascript
query(notificationsRef, orderBy('createdAt', 'desc'))
```
**Index:** `systemNotifications` - `createdAt DESC`

#### 7. getSystemNotifications() - Filter by Type
```javascript
query(notificationsRef,
  where('type', '==', type),
  orderBy('createdAt', 'desc')
)
```
**Index:** `systemNotifications` - `type ASC, createdAt DESC`

#### 8. getSystemNotifications() - Date Range
```javascript
query(notificationsRef,
  where('createdAt', '>=', startDate),
  where('createdAt', '<=', endDate),
  orderBy('createdAt', 'desc')
)
```
**Index:** `systemNotifications` - `createdAt ASC, createdAt DESC` ⚠️ **ใหม่**

#### 9. getUnreadNotifications()
```javascript
query(notificationsRef,
  where('sentTo', 'array-contains', userId),
  orderBy('createdAt', 'desc')
)
```
**Index:** `systemNotifications` - `sentTo CONTAINS, createdAt DESC` ⚠️ **ใหม่**

---

## 🚀 การ Deploy Indexes

### วิธีที่ 1: ใช้ Firebase CLI (แนะนำ)
```bash
firebase deploy --only firestore:indexes
```

### วิธีที่ 2: ใช้ Script
```bash
node scripts/deploy-settings-indexes.js
```

### วิธีที่ 3: ผ่าน Firebase Console
1. ไปที่ Firebase Console > Firestore Database
2. คลิกแท็บ "Indexes"
3. คลิก "Add Index"
4. เพิ่ม indexes ตามที่ระบุด้านบน

---

## ✅ การตรวจสอบ Indexes

### ตรวจสอบว่า Indexes ถูก Deploy แล้ว
```bash
firebase firestore:indexes
```

### ทดสอบ Indexes
```bash
node scripts/test-settings-indexes.js
```

---

## 📊 สถิติ Indexes

| Collection | จำนวน Indexes | ใหม่ | เดิม |
|-----------|--------------|------|------|
| settingsAuditLog | 5 | 1 | 4 |
| closedDates | 1 | 0 | 1 |
| systemNotifications | 5 | 2 | 3 |
| **รวม** | **11** | **3** | **8** |

---

## ⚠️ หมายเหตุสำคัญ

### 1. Composite Indexes
Firestore ต้องการ composite index สำหรับ query ที่มี:
- หลาย `where` clauses
- `where` + `orderBy` บนฟิลด์ต่างกัน
- `array-contains` + `orderBy`

### 2. Index Exemptions
Query ที่ไม่ต้องการ index:
- `where` เดียวบนฟิลด์เดียว
- `orderBy` เดียวบนฟิลด์เดียว
- `where` + `orderBy` บนฟิลด์เดียวกัน

### 3. Index Limits
- Maximum 200 composite indexes per database
- Maximum 200 single-field index configurations per database

### 4. Index Building Time
- Indexes ใหม่อาจใช้เวลาสร้าง 5-30 นาที
- ขึ้นอยู่กับจำนวนข้อมูลใน collection

---

## 🔗 เอกสารที่เกี่ยวข้อง

- [Firestore Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Admin Settings Infrastructure](docs/admin-settings-infrastructure.md)
- [Settings Service](src/services/settingsService.js)
- [Deploy Settings Indexes Script](scripts/deploy-settings-indexes.js)
- [Test Settings Indexes Script](scripts/test-settings-indexes.js)

---

**อัพเดทล่าสุด:** 20 พฤศจิกายน 2025  
**เวอร์ชัน:** 1.1  
**สถานะ:** ✅ พร้อมใช้งาน
