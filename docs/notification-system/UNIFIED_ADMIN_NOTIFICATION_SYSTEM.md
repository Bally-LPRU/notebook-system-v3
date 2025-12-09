# Unified Admin Notification System

## Overview

ระบบ Unified Admin Notification System เป็นการรวมระบบแจ้งเตือนทั้งหมดสำหรับ Admin ไว้ที่เดียว ช่วยให้ Admin สามารถจัดการงานและการแจ้งเตือนได้อย่างมีประสิทธิภาพจากที่เดียว

## วันที่ปรับปรุง

- **วันที่สร้าง:** 9 ธันวาคม 2567
- **สถานะ:** เสร็จสมบูรณ์ ✅

## คุณสมบัติหลัก

### 1. รวมข้อมูลจากหลายแหล่ง
- **Action Items** - งานที่ต้องดำเนินการ
  - ผู้ใช้รออนุมัติ (users collection - pending status)
  - คำขอยืมรออนุมัติ (loanRequests collection - pending)
  - คำขอยืมเกินกำหนด (loanRequests collection - overdue)
  - การจองรออนุมัติ (reservations collection - pending)
- **Personal Notifications** - แจ้งเตือนส่วนตัว
- **History** - ประวัติการดำเนินการ (30 วันย้อนหลัง)

### 2. ระบบ Priority
- **Urgent** - เกินกำหนดคืน (สีแดง)
- **High** - คำขอยืมรออนุมัติ (สีส้ม)
- **Medium** - ผู้ใช้รออนุมัติ, การจองรออนุมัติ (สีเหลือง)
- **Low** - แจ้งเตือนทั่วไป (สีเทา)

### 3. Quick Actions
- อนุมัติ/ปฏิเสธผู้ใช้โดยตรงจากการแจ้งเตือน
- อนุมัติ/ปฏิเสธคำขอยืมโดยตรงจากการแจ้งเตือน
- บันทึกเหตุผลเมื่อปฏิเสธ

### 4. การกรองและค้นหา
- ค้นหาตามชื่อ, คำอธิบาย, ชื่อผู้ใช้, ชื่ออุปกรณ์
- กรองตามหมวดหมู่ (users, loans, reservations, system)
- กรองตามระดับความสำคัญ
- กรองตามช่วงวันที่

### 5. Responsive Design
- รองรับการใช้งานบน Mobile
- Tabs แบบ horizontal scroll บนหน้าจอเล็ก
- Summary cards stack แนวตั้งบน mobile

## โครงสร้างไฟล์

```
src/
├── components/
│   └── notifications/
│       ├── UnifiedNotificationCenter.js    # Component หลัก
│       ├── NotificationBell.js             # ไอคอนระฆัง (ปรับปรุง)
│       └── __tests__/
│           ├── UnifiedNotificationCenter.test.js
│           ├── UnifiedNotificationCenter.property.test.js
│           └── NotificationBell.test.js
├── hooks/
│   ├── useAdminUnifiedNotifications.js     # Hook หลัก
│   └── __tests__/
│       └── useAdminUnifiedNotifications.property.test.js
├── services/
│   ├── adminNotificationService.js         # Service layer
│   └── __tests__/
│       └── adminNotificationService.property.test.js
└── types/
    ├── adminNotification.js                # Type definitions
    └── __tests__/
        └── adminNotification.property.test.js
```

## Firestore Collections

### adminNotificationState (ใหม่)
เก็บสถานะการอ่านของ notification แต่ละรายการ

```javascript
{
  id: string,
  adminId: string,
  notificationId: string,
  sourceType: 'user_registration' | 'loan_request' | 'overdue_loan' | 'reservation_request' | 'personal',
  sourceCollection: string,
  isRead: boolean,
  readAt: Timestamp | null,
  createdAt: Timestamp
}
```

### adminNotificationHistory (ใหม่)
เก็บประวัติการดำเนินการ

```javascript
{
  id: string,
  adminId: string,
  action: 'approved' | 'rejected' | 'viewed' | 'dismissed',
  sourceType: string,
  sourceId: string,
  sourceData: object,
  actionAt: Timestamp,
  note: string | null
}
```

## Firestore Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "adminNotificationState",
      "fields": [
        { "fieldPath": "adminId", "order": "ASCENDING" },
        { "fieldPath": "sourceType", "order": "ASCENDING" },
        { "fieldPath": "isRead", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "adminNotificationState",
      "fields": [
        { "fieldPath": "adminId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "adminNotificationHistory",
      "fields": [
        { "fieldPath": "adminId", "order": "ASCENDING" },
        { "fieldPath": "actionAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Security Rules

```javascript
match /adminNotificationState/{docId} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

match /adminNotificationHistory/{docId} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## การใช้งาน

### เข้าถึง Notification Center
- คลิกที่ไอคอนระฆังใน Navbar
- เลือก "ดูทั้งหมด" หรือไปที่ `/admin/notifications`

### Tab Navigation
1. **งานรอดำเนินการ** - แสดง action items ทั้งหมด
2. **แจ้งเตือนส่วนตัว** - แสดง personal notifications
3. **ประวัติ** - แสดงประวัติการดำเนินการ 30 วันย้อนหลัง

### Quick Actions
1. คลิกปุ่ม "อนุมัติ" เพื่ออนุมัติทันที
2. คลิกปุ่ม "ปฏิเสธ" เพื่อเปิด modal ใส่เหตุผล
3. รายการจะย้ายไปที่ประวัติโดยอัตโนมัติ

## Testing

### Property-Based Tests (10 Properties)
1. Priority Assignment Correctness
2. Priority Sorting Correctness
3. Notification Count Consistency
4. Tab Filtering Correctness
5. Mark as Read State Persistence
6. Quick Action State Transition
7. Filter Correctness
8. Filter Count Consistency
9. Pagination Data Integrity
10. History Date Range Correctness

### Unit Tests
- Tab switching
- Filter application
- Quick action execution
- Summary cards
- Mark as read functionality
- Loading and empty states
- Access control

## รันทดสอบ

```bash
# รัน tests ทั้งหมดของ notification system
npm test -- --testPathPattern="UnifiedNotificationCenter|adminNotificationService|useAdminUnifiedNotifications|adminNotification" --watchAll=false
```

## Performance Considerations

- ใช้ Firestore real-time listeners สำหรับ live updates
- จำกัด query ไม่เกิน 50 items ต่อ category
- รองรับ pagination สำหรับรายการจำนวนมาก
- เก็บ read state แยกเพื่อไม่แก้ไข source documents

## Related Documentation

- [Spec: Requirements](.kiro/specs/unified-admin-notification-system/requirements.md)
- [Spec: Design](.kiro/specs/unified-admin-notification-system/design.md)
- [Spec: Tasks](.kiro/specs/unified-admin-notification-system/tasks.md)
