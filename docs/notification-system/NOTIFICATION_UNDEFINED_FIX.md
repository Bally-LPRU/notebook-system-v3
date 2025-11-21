# แก้ไขปัญหา Undefined Field ใน Notification

## ปัญหาที่พบ
เมื่อทดสอบตั้งค่า "กฎการยืมและการจอง" พบ error:
```
FirebaseError: Function addDoc() called with invalid data. 
Unsupported field value: undefined (found in field data.reason in document notifications/...)
```

## สาเหตุ
1. ใน `settingsService.js` method `_notifyCriticalSettingChange` ส่ง `reason: change.reason` ไปยัง notification
2. แต่ `change.reason` เป็น optional field และอาจเป็น `undefined`
3. Firestore ไม่อนุญาตให้เก็บค่า `undefined` ใน document

## การแก้ไข

### 1. แก้ไขใน `settingsService.js`
เปลี่ยนจากการส่ง `reason` โดยตรง เป็นการตรวจสอบก่อนว่ามีค่าหรือไม่:

```javascript
// เดิม
{
  settingType: change.settingType,
  oldValue: change.oldValue,
  newValue: change.newValue,
  changedBy: change.adminName,
  reason: change.reason  // อาจเป็น undefined
}

// ใหม่
const notificationData = {
  settingType: change.settingType,
  oldValue: change.oldValue !== undefined ? change.oldValue : null,
  newValue: change.newValue !== undefined ? change.newValue : null,
  changedBy: change.adminName
};

// เพิ่ม reason เฉพาะเมื่อมีค่า
if (change.reason !== undefined && change.reason !== null) {
  notificationData.reason = change.reason;
}
```

### 2. เพิ่ม Helper Method ใน `notificationService.js`
เพิ่ม method `_removeUndefinedValues()` เพื่อทำความสะอาด data object:

```javascript
static _removeUndefinedValues(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      // Recursively clean nested objects
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = this._removeUndefinedValues(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}
```

### 3. ใช้ Helper Method ใน `createNotification()`
```javascript
// Clean data object to remove undefined values
const cleanData = this._removeUndefinedValues(data);

const notification = {
  userId,
  type,
  title: title || template?.title || 'การแจ้งเตือน',
  message: this.formatMessage(message || template?.message || '', cleanData),
  data: cleanData,  // ใช้ cleaned data
  // ...
};
```

## ผลลัพธ์
- ✅ ป้องกันการส่งค่า `undefined` ไปยัง Firestore
- ✅ แปลงค่า `undefined` เป็น `null` หรือไม่รวมใน object
- ✅ ทำงานกับ nested objects ได้
- ✅ ไม่กระทบกับ functionality อื่น

## การทดสอบ
1. ทดสอบการเปลี่ยนแปลงการตั้งค่าที่ไม่มี reason
2. ทดสอบการเปลี่ยนแปลงการตั้งค่าที่มี reason
3. ตรวจสอบว่า notification ถูกสร้างสำเร็จ
4. ตรวจสอบว่าไม่มี error ใน console

## วิธีทดสอบ
1. เข้าไปที่หน้า Admin Settings > Loan Rules
2. เปลี่ยนค่าการตั้งค่าใดๆ (เช่น Max Loan Duration)
3. บันทึกการเปลี่ยนแปลง
4. ตรวจสอบ console ว่าไม่มี error
5. ตรวจสอบว่า notification ถูกสร้างใน Firestore

## หมายเหตุ
- การแก้ไขนี้เป็น defensive programming เพื่อป้องกันปัญหาใน production
- ควรใช้ pattern นี้กับทุก service ที่เขียนข้อมูลลง Firestore
- TypeScript จะช่วยป้องกันปัญหานี้ได้ดีกว่า แต่เนื่องจากใช้ JavaScript จึงต้องตรวจสอบ runtime
