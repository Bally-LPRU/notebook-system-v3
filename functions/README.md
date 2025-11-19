# Firebase Cloud Functions - ระบบยืม-คืนอุปกรณ์

Cloud Functions สำหรับจัดการงานอัตโนมัติในระบบยืม-คืนอุปกรณ์

## 📋 รายการ Functions

### 1. checkOverdueLoans
ตรวจสอบและอัปเดตสถานะคำขอยืมที่เกินกำหนดคืน

- **Schedule:** ทุก 1 ชั่วโมง
- **Timezone:** Asia/Bangkok
- **หน้าที่:**
  - ตรวจสอบคำขอยืมที่ status = 'borrowed' และ expectedReturnDate < now
  - อัปเดตสถานะเป็น 'overdue'
  - สร้างการแจ้งเตือนไปยังผู้ยืม (priority: high)
  - สร้างการแจ้งเตือนไปยัง admin ทุกคน (priority: medium)
  - บันทึก activity log

### 2. sendLoanReminders
ส่งการแจ้งเตือนล่วงหน้าก่อนครบกำหนดคืน

- **Schedule:** ทุกวันเวลา 09:00 น.
- **Timezone:** Asia/Bangkok
- **หน้าที่:**
  - ตรวจสอบคำขอยืมที่ครบกำหนดคืนภายใน 1 วัน
  - ส่งการแจ้งเตือนล่วงหน้า (priority: high)
  - ตรวจสอบว่าส่งการแจ้งเตือนไปแล้วหรือยัง (ไม่ส่งซ้ำในวันเดียวกัน)

### 3. cancelExpiredReservations
ยกเลิกการจองที่หมดอายุอัตโนมัติ

- **Schedule:** ทุก 2 ชั่วโมง
- **Timezone:** Asia/Bangkok
- **หน้าที่:**
  - ตรวจสอบการจองที่ผ่านเวลานัดหมายมากกว่า 2 ชั่วโมง (status = 'ready')
  - อัปเดตสถานะการจองเป็น 'expired'
  - เปลี่ยนสถานะอุปกรณ์กลับเป็น 'available'
  - ส่งการแจ้งเตือนไปยังผู้จอง
  - บันทึก activity log

## 🚀 การติดตั้ง

### Prerequisites
- Node.js 18 หรือสูงกว่า
- Firebase CLI
- Firebase project ที่เปิดใช้งาน Blaze plan

### ขั้นตอนการติดตั้ง

1. **ติดตั้ง Firebase CLI (ถ้ายังไม่มี)**
```bash
npm install -g firebase-tools
```

2. **Login เข้า Firebase**
```bash
firebase login
```

3. **เลือก Firebase project**
```bash
firebase use <project-id>
```

4. **ติดตั้ง dependencies**
```bash
cd functions
npm install
```

5. **Deploy functions**
```bash
# Deploy ทั้งหมด
firebase deploy --only functions

# หรือ deploy ทีละฟังก์ชัน
firebase deploy --only functions:checkOverdueLoans
firebase deploy --only functions:sendLoanReminders
firebase deploy --only functions:cancelExpiredReservations
```

## 📦 Dependencies

```json
{
  "firebase-functions": "^4.5.0",
  "firebase-admin": "^11.11.0"
}
```

## ⚙️ Configuration

### Firebase Project Settings
1. เปิดใช้งาน Cloud Scheduler ใน Google Cloud Console
2. ตั้งค่า timezone เป็น 'Asia/Bangkok'
3. ตรวจสอบ billing account (ต้องการ Blaze plan)

### Firestore Indexes
ต้องการ composite indexes สำหรับ queries:

```json
{
  "indexes": [
    {
      "collectionGroup": "loanRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "expectedReturnDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "reservations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "data.loanRequestId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

## 🔍 Monitoring

### ดู Logs
```bash
# ดู logs ทั้งหมด
firebase functions:log

# ดู logs ของฟังก์ชันเฉพาะ
firebase functions:log --only checkOverdueLoans
firebase functions:log --only sendLoanReminders
firebase functions:log --only cancelExpiredReservations

# ดู logs แบบ real-time
firebase functions:log --follow
```

### ตรวจสอบ Execution
1. เปิด Firebase Console
2. ไปที่ Functions
3. ดู execution history และ logs

### Metrics
- จำนวนครั้งที่ execute
- เวลาเฉลี่ยในการ execute
- Error rate
- จำนวน notifications ที่ส่ง

## 🧪 Testing

### Local Testing
```bash
# ติดตั้ง Firebase Emulator
firebase init emulators

# เริ่ม emulator
firebase emulators:start

# Test functions locally
npm test
```

### Manual Testing
```bash
# เรียก function manually
firebase functions:shell

# ใน shell:
checkOverdueLoans()
sendLoanReminders()
cancelExpiredReservations()
```

## 🐛 Troubleshooting

### Function ไม่ทำงาน
1. ตรวจสอบ logs: `firebase functions:log`
2. ตรวจสอบ Cloud Scheduler ใน Firebase Console
3. ตรวจสอบว่า billing account เปิดใช้งาน
4. ตรวจสอบ timezone settings

### Notifications ไม่ถูกส่ง
1. ตรวจสอบว่า function execute สำเร็จ
2. ตรวจสอบ Firestore rules สำหรับ notifications collection
3. ตรวจสอบว่ามี admin users ในระบบ

### Index Errors
1. ตรวจสอบ error message ใน logs
2. Deploy indexes: `firebase deploy --only firestore:indexes`
3. รอ indexes build เสร็จ (อาจใช้เวลาหลายนาที)

## 📊 Performance

### Optimization Tips
1. ใช้ batch writes สำหรับ multiple updates
2. Limit จำนวน queries
3. ใช้ indexes ที่เหมาะสม
4. Monitor execution time

### Cost Optimization
- Functions ทำงานตาม schedule ที่กำหนด
- ใช้ batch operations เพื่อลด invocations
- Monitor usage ใน Firebase Console

## 🔐 Security

### Firestore Rules
Functions ใช้ Admin SDK ซึ่ง bypass Firestore rules
ต้องระวังเรื่อง:
- Validate data ก่อน write
- ตรวจสอบ permissions
- Log activities

### Best Practices
- ใช้ environment variables สำหรับ sensitive data
- Validate input data
- Handle errors properly
- Log important actions

## 📝 Maintenance

### Regular Tasks
- ตรวจสอบ logs เป็นประจำ
- Monitor error rates
- Update dependencies
- Review performance metrics

### Updates
```bash
# Update dependencies
cd functions
npm update

# Test locally
npm test

# Deploy
firebase deploy --only functions
```

## 📚 Additional Resources

- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [OVERDUE_MANAGEMENT_IMPLEMENTATION.md](../OVERDUE_MANAGEMENT_IMPLEMENTATION.md)

## 🆘 Support

หากพบปัญหาหรือมีคำถาม:
1. ตรวจสอบ logs และ error messages
2. อ่าน documentation
3. ตรวจสอบ Firebase Console
4. ติดต่อทีมพัฒนา

---

**หมายเหตุ:** Cloud Functions ต้องการ Firebase Blaze plan (pay-as-you-go)
