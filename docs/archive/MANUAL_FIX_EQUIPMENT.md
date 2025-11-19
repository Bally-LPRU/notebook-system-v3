# แก้ไขข้อมูล Equipment ด้วยตนเอง (Manual Fix)

เนื่องจาก Firestore Rules เข้มงวด ให้แก้ไขข้อมูลผ่าน Firebase Console โดยตรง

## 🎯 ขั้นตอนการแก้ไข

### 1. เปิด Firebase Console
1. ไปที่ https://console.firebase.google.com
2. เลือกโปรเจค `equipment-lending-system-41b49`
3. ไปที่ **Firestore Database**
4. เลือก collection **equipmentManagement**

### 2. แก้ไขเอกสาร "โน้ตบุ๊ค Acer" (JivFIeeI3cK54wc3qP4F)

คลิกที่เอกสาร แล้วแก้ไขฟิลด์ต่อไปนี้:

#### ✏️ แก้ไขฟิลด์ที่มีอยู่:

**status:**
```
เปลี่ยนจาก: "available"
เป็น: "active"
```

#### ➕ เพิ่มฟิลด์ใหม่:

**brand** (string):
```
""
```

**model** (string):
```
""
```

**description** (string):
```
""
```

**specifications** (map):
```
{}
```

**location** (map):
```
{
  building: "",
  floor: "",
  room: "",
  description: ""
}
```

**responsiblePerson** (map):
```
{
  uid: "GXaNYt9mkoCbS3MmIaubr3mBJ3",
  name: "ไม่ระบุ",
  email: "",
  department: ""
}
```

**purchaseDate** (timestamp หรือ null):
```
null
```

**purchasePrice** (number):
```
0
```

**vendor** (string):
```
""
```

**warrantyExpiry** (timestamp หรือ null):
```
null
```

**qrCode** (map หรือ null):
```
null
```

**notes** (string):
```
""
```

**lastViewed** (timestamp หรือ null):
```
null
```

### 3. ตรวจสอบฟิลด์ที่มีอยู่แล้ว

ตรวจสอบว่าฟิลด์เหล่านี้มีค่าถูกต้อง:

- ✅ **equipmentNumber**: "EQ-001"
- ✅ **name**: "โน้ตบุ๊ค Acer"
- ✅ **category** (map):
  ```
  {
    id: "computers",
    name: "คอมพิวเตอร์",
    icon: "💻"
  }
  ```
- ✅ **images** (array): `[]`
- ✅ **tags** (array): `[]`
- ✅ **searchKeywords** (array): `["eq-001", "โน้ตบุ๊ค"]`
- ✅ **isActive** (boolean): `true`
- ✅ **viewCount** (number): `0`
- ✅ **version** (number): `1` หรือมากกว่า
- ✅ **createdAt** (timestamp): มีค่าอยู่แล้ว
- ✅ **createdBy** (string): มีค่าอยู่แล้ว
- ✅ **updatedAt** (timestamp): มีค่าอยู่แล้ว
- ✅ **updatedBy** (string): มีค่าอยู่แล้ว

### 4. บันทึกการเปลี่ยนแปลง

กดปุ่ม **Update** หรือ **Save** ใน Firebase Console

## 🔄 วิธีที่ 2: ปรับ Firestore Rules ชั่วคราว (ไม่แนะนำสำหรับ Production)

ถ้าต้องการใช้สคริปต์แก้ไข ให้แก้ไข `firestore.rules` ชั่วคราว:

```javascript
// Equipment Management collection rules
match /equipmentManagement/{equipmentId} {
  allow read: if isApprovedUser();
  
  // ชั่วคราว: อนุญาตให้ admin update ได้ง่ายขึ้น
  allow update: if isAdmin();
  
  allow create: if isAdmin() && 
                   request.resource.data.createdBy == request.auth.uid &&
                   request.resource.data.createdAt == request.time;
  
  allow delete: if isAdmin();
}
```

**หลังจากแก้ไขข้อมูลเสร็จแล้ว ต้องเปลี่ยน rules กลับเป็นแบบเดิม!**

## 🔍 ตรวจสอบผลลัพธ์

หลังจากแก้ไขเสร็จ:

1. เปิดแอปที่ http://localhost:3000
2. Login ด้วยบัญชี Admin
3. ไปที่หน้า **จัดการอุปกรณ์**
4. ตรวจสอบว่าแสดงข้อมูลได้ถูกต้อง

## 📝 โครงสร้างที่ถูกต้องทั้งหมด

```javascript
{
  // Required fields
  equipmentNumber: "EQ-001",
  name: "โน้ตบุ๊ค Acer",
  category: {
    id: "computers",
    name: "คอมพิวเตอร์",
    icon: "💻"
  },
  status: "active",  // ⚠️ ต้องเป็น active, maintenance, retired, หรือ lost
  location: {
    building: "",
    floor: "",
    room: "",
    description: ""
  },
  responsiblePerson: {
    uid: "GXaNYt9mkoCbS3MmIaubr3mBJ3",
    name: "ไม่ระบุ",
    email: "",
    department: ""
  },
  
  // Optional fields
  brand: "",
  model: "",
  description: "",
  specifications: {},
  purchaseDate: null,
  purchasePrice: 0,
  vendor: "",
  warrantyExpiry: null,
  images: [],
  qrCode: null,
  tags: [],
  searchKeywords: ["eq-001", "โน้ตบุ๊ค"],
  notes: "",
  
  // Metadata
  createdAt: Timestamp,
  createdBy: "GXaNYt9mkoCbS3MmIaubr3mBJ3",
  updatedAt: Timestamp,
  updatedBy: "GXaNYt9mkoCbS3MmIaubr3mBJ3",
  version: 1,
  isActive: true,
  viewCount: 0,
  lastViewed: null
}
```

## ✅ เมื่อแก้ไขเสร็จแล้ว

หน้าจัดการอุปกรณ์ควรใช้งานได้ปกติ และแสดงข้อมูลครบถ้วน
