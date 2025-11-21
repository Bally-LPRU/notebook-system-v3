# ปรับปรุงข้อความแจ้งเตือนให้อ่านง่ายขึ้น

## ปัญหาที่พบ
เมื่อเพิ่มวันปิดทำการ ข้อความแจ้งเตือนแสดง JSON object แบบ raw:
```
Admin changed closedDate from N/A to {"date":{"type":"firestore/timestamp/1.0","seconds":1765324800,"nanoseconds":0},"reason":"วันหยุดราชการ",...}
```

## สาเหตุ
- Method `_formatValue()` แปลง object เป็น `JSON.stringify()` ทำให้ยากต่อการอ่าน
- ข้อความไม่เป็นภาษาไทย
- ไม่มีการจัดรูปแบบตามประเภทของการเปลี่ยนแปลง

## การแก้ไข

### 1. เพิ่ม Method `_formatSettingName()`
แปลงชื่อ setting เป็นภาษาไทย:

```javascript
_formatSettingName(settingType) {
  const settingNames = {
    maxLoanDuration: 'ระยะเวลายืมสูงสุด',
    maxAdvanceBookingDays: 'จำนวนวันจองล่วงหน้าสูงสุด',
    defaultCategoryLimit: 'จำนวนรายการต่อหมวดหมู่เริ่มต้น',
    discordEnabled: 'การแจ้งเตือน Discord',
    discordWebhookUrl: 'Discord Webhook URL',
    closedDate: 'วันปิดทำการ',
    categoryLimit: 'ขอบเขตหมวดหมู่'
  };
  
  return settingNames[settingType] || settingType;
}
```

### 2. ปรับปรุง Method `_formatValue()`
จัดการแสดงผลตามประเภทข้อมูล:

```javascript
_formatValue(value) {
  if (value === null || value === undefined) {
    return 'ไม่ระบุ';
  }

  if (typeof value === 'boolean') {
    return value ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
  }

  if (typeof value === 'number') {
    return `${value} วัน`;
  }

  if (typeof value === 'object') {
    // Don't show raw JSON for objects
    return '[ข้อมูลซับซ้อน]';
  }

  return String(value);
}
```

### 3. ปรับปรุงการสร้างข้อความแจ้งเตือน
จัดรูปแบบข้อความตามประเภทการเปลี่ยนแปลง:

#### สำหรับวันปิดทำการ (closedDate):

**เพิ่มวันปิดทำการ:**
```
หัวข้อ: เพิ่มวันปิดทำการใหม่
ข้อความ: Admin เพิ่มวันปิดทำการ: 1/1/2568 (วันขึ้นปีใหม่)
```

**ลบวันปิดทำการ:**
```
หัวข้อ: ลบวันปิดทำการ
ข้อความ: Admin ลบวันปิดทำการ: 1/1/2568
```

#### สำหรับขอบเขตหมวดหมู่ (categoryLimit):
```
หัวข้อ: อัปเดตขอบเขตหมวดหมู่
ข้อความ: Admin เปลี่ยนขอบเขตหมวดหมู่จาก 5 วัน เป็น 10 วัน
```

#### สำหรับการตั้งค่าอื่นๆ:
```
หัวข้อ: การตั้งค่าสำคัญถูกเปลี่ยนแปลง: ระยะเวลายืมสูงสุด
ข้อความ: Admin เปลี่ยน ระยะเวลายืมสูงสุด จาก 7 วัน เป็น 14 วัน
```

### 4. ลดข้อมูลใน notification data
เก็บเฉพาะข้อมูลที่จำเป็น ไม่เก็บ oldValue/newValue ที่เป็น object ขนาดใหญ่:

```javascript
const notificationData = {
  settingType: change.settingType,
  action: change.action,
  changedBy: change.adminName
};

// เพิ่ม reason เฉพาะเมื่อมี
if (change.reason !== undefined && change.reason !== null) {
  notificationData.reason = change.reason;
}
```

## ผลลัพธ์

### ก่อนแก้ไข:
```
Critical Setting Changed: closedDate
Admin changed closedDate from N/A to {"date":{"type":"firestore/timestamp/1.0",...},"reason":"วันหยุดราชการ",...}
```

### หลังแก้ไข:
```
เพิ่มวันปิดทำการใหม่
Admin เพิ่มวันปิดทำการ: 1/1/2568 (วันหยุดราชการ)
```

## ประโยชน์
- ✅ ข้อความเป็นภาษาไทยที่อ่านง่าย
- ✅ แสดงข้อมูลที่สำคัญเท่านั้น
- ✅ จัดรูปแบบตามประเภทการเปลี่ยนแปลง
- ✅ ลดขนาดข้อมูลใน notification
- ✅ ปรับปรุง UX ให้ดีขึ้น

## การทดสอบ
1. เพิ่มวันปิดทำการใหม่
2. ลบวันปิดทำการ
3. เปลี่ยนการตั้งค่ากฎการยืม
4. เปลี่ยนขอบเขตหมวดหมู่
5. ตรวจสอบข้อความแจ้งเตือนในแต่ละกรณี
