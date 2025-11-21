# คำแนะนำการ Migrate Loan Requests

## การเพิ่ม Denormalized Fields

หลังจากแก้ไขปัญหา Client-side Filtering แล้ว จำเป็นต้องรัน migration script เพื่ออัปเดต loan requests ที่มีอยู่แล้วให้มี denormalized fields

### ✅ Denormalized Fields ที่เพิ่ม

- `equipmentCategory` - หมวดหมู่อุปกรณ์ (สำหรับ server-side filtering)
- `equipmentName` - ชื่ออุปกรณ์ (สำหรับ sorting และ display)
- `userName` - ชื่อผู้ใช้ (สำหรับ sorting และ display)
- `userDepartment` - แผนกของผู้ใช้ (สำหรับ filtering)

---

## วิธีการรัน Migration

### ขั้นตอนที่ 1: ตรวจสอบ Environment Variables

ตรวจสอบว่าไฟล์ `.env.local` มีค่าต่อไปนี้:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### ขั้นตอนที่ 2: รัน Migration Script

```bash
# วิธีที่ 1: ใช้ npm script (แนะนำ)
npm run migrate:loan-denormalized

# วิธีที่ 2: รันโดยตรง
node scripts/migrate-loan-denormalized-fields-client.js
```

### ขั้นตอนที่ 3: ตรวจสอบผลลัพธ์

Script จะแสดงผลลัพธ์ดังนี้:

```
✅ Firebase initialized successfully
📦 Project ID: your-project-id

🔄 Starting migration: Add denormalized fields to loan requests...

📊 Found 50 loan requests to process

✅ Updated loan-request-id-1
   - equipmentCategory: computers
   - equipmentName: MacBook Pro 16"
   - userName: สมชาย ใจดี
   - userDepartment: วิศวกรรมคอมพิวเตอร์

⏭️  Skipping loan-request-id-2 - already has denormalized fields

...

============================================================
📊 MIGRATION SUMMARY
============================================================
✅ Successfully updated: 45
⏭️  Skipped (already migrated): 5
❌ Errors: 0
📝 Total processed: 50
============================================================

✅ Migration completed!
```

### ขั้นตอนที่ 4: ตรวจสอบข้อมูลใน Firestore

1. เปิด Firebase Console
2. ไปที่ Firestore Database
3. เปิด collection `loanRequests`
4. ตรวจสอบว่า documents มีฟิลด์ใหม่:
   - `equipmentCategory`
   - `equipmentName`
   - `userName`
   - `userDepartment`

### ขั้นตอนที่ 5: Deploy Firestore Indexes

```bash
# Deploy indexes ที่เพิ่มใหม่
firebase deploy --only firestore:indexes

# หรือใช้ npm script
npm run firebase:indexes:deploy
```

รอให้ indexes build เสร็จ (อาจใช้เวลา 5-10 นาที)

ตรวจสอบสถานะใน Firebase Console > Firestore > Indexes

---

## การทดสอบหลัง Migration

### 1. ทดสอบ Server-side Filtering

```javascript
// ใน application
const filters = {
  equipmentCategory: 'computers',
  status: 'pending'
};

const result = await LoanRequestService.getLoanRequests(filters);
// ควรได้เฉพาะ loan requests ที่มี equipmentCategory = 'computers'
```

### 2. ทดสอบ Pagination

```javascript
// ทดสอบว่า pagination ทำงานถูกต้องขณะ filter
const filters = {
  equipmentCategory: 'computers',
  limit: 10
};

const page1 = await LoanRequestService.getLoanRequests(filters);
console.log('Has next page:', page1.pagination.hasNextPage); // ควรเป็น true ถ้ามีข้อมูลมากกว่า 10

const page2 = await LoanRequestService.getLoanRequests({
  ...filters,
  lastDoc: page1.lastDoc
});
// ควรได้ข้อมูลหน้าถัดไป
```

### 3. ทดสอบ Performance

เปิด DevTools > Network tab และตรวจสอบ:

- จำนวน API calls ลดลง
- ขนาดข้อมูลที่ transfer ลดลง
- Loading time เร็วขึ้น

---

## Troubleshooting

### ปัญหา: Cannot find module 'dotenv'

```bash
npm install dotenv
```

### ปัญหา: Firebase configuration not found

ตรวจสอบว่าไฟล์ `.env.local` มีค่าครบถ้วน

### ปัญหา: Permission denied

ตรวจสอบ Firestore Rules ว่าอนุญาตให้อ่าน/เขียน loanRequests, equipmentManagement, และ users

### ปัญหา: Some loan requests failed to update

- ตรวจสอบ error messages ใน console
- อาจเป็นเพราะ equipmentId หรือ userId ไม่มีอยู่จริง
- Script จะใช้ snapshot data เป็น fallback

---

## Rollback (ถ้าจำเป็น)

ถ้าต้องการ rollback การ migration:

```javascript
// ไม่มี script rollback อัตโนมัติ
// แต่สามารถลบฟิลด์ที่เพิ่มได้ด้วยตนเอง:

const loanRequestRef = doc(db, 'loanRequests', 'loan-request-id');
await updateDoc(loanRequestRef, {
  equipmentCategory: deleteField(),
  equipmentName: deleteField(),
  userName: deleteField(),
  userDepartment: deleteField()
});
```

---

## Best Practices

### 1. Backup ก่อน Migrate

```bash
# Export Firestore data
firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)
```

### 2. ทดสอบใน Development Environment ก่อน

```bash
# ใช้ Firebase emulator
firebase emulators:start

# รัน migration กับ emulator
# (แก้ไข script ให้ connect กับ emulator)
```

### 3. Monitor หลัง Migration

- ตรวจสอบ error logs
- ตรวจสอบ performance metrics
- ตรวจสอบ user feedback

---

## สรุป

การ migrate loan requests เพื่อเพิ่ม denormalized fields จะช่วย:

✅ ปรับปรุง performance 70-90%
✅ ทำให้ pagination ทำงานถูกต้อง
✅ ลด API calls และ bandwidth
✅ เพิ่ม data consistency

**ระยะเวลาโดยประมาณ:** 5-15 นาที (ขึ้นอยู่กับจำนวน loan requests)

**ผลกระทบต่อ Production:** ไม่มี (migration ทำงานแบบ non-blocking)
