# แก้ไขปัญหาเข้าหน้าจัดการอุปกรณ์ไม่ได้

## 🔍 สาเหตุของปัญหา

เมื่อพยายามเข้าหน้าจัดการอุปกรณ์ (`/admin/equipment`) เกิดข้อผิดพลาด:

```
Error loading equipment list: FirebaseError: Missing or insufficient permissions
```

### สาเหตุหลัก:

1. **Auth Token ไม่ได้ Refresh** - เมื่อ admin approve user หรือเปลี่ยนสถานะ user, auth token ของ user ยังคงเป็นแบบเก่าที่ไม่มีข้อมูล status ใหม่

2. **Firestore Rules ตรวจสอบ Status** - Firestore rules สำหรับ `equipmentManagement` collection ต้องการให้ user มี `status == 'approved'`:
   ```javascript
   allow read: if isApprovedUser();
   ```

3. **Token ไม่ Sync กับ Firestore** - Auth token ที่ client ใช้อาจจะยังไม่ได้ sync กับข้อมูลล่าสุดใน Firestore

## ✅ วิธีแก้ไข

### วิธีที่ 1: ใช้ปุ่ม Refresh Token (แนะนำ)

เมื่อเจอข้อผิดพลาด permission denied ในหน้าจัดการอุปกรณ์:

1. คลิกปุ่ม **"🔄 Refresh Token"** ที่แสดงในหน้า error
2. รอสักครู่จนกว่าจะ refresh เสร็จ
3. ระบบจะโหลดข้อมูลอุปกรณ์ใหม่อัตโนมัติ

### วิธีที่ 2: Sign Out และ Sign In ใหม่

1. คลิกปุ่ม Sign Out ที่มุมบนขวา
2. เข้าสู่ระบบใหม่อีกครั้ง
3. ลองเข้าหน้าจัดการอุปกรณ์อีกครั้ง

### วิธีที่ 3: รีเฟรชหน้าเว็บ

1. กด F5 หรือคลิกปุ่ม Refresh ในเบราว์เซอร์
2. รอให้หน้าเว็บโหลดใหม่
3. ลองเข้าหน้าจัดการอุปกรณ์อีกครั้ง

### วิธีที่ 4: ลบ Cache และ Cookies

1. เปิด Developer Tools (F12)
2. ไปที่ Application > Storage
3. คลิก "Clear site data"
4. รีเฟรชหน้าเว็บและเข้าสู่ระบบใหม่

## 🔧 การแก้ไขที่ทำไปแล้ว

### 1. เพิ่มฟังก์ชัน Refresh Token ใน AuthContext

```javascript
const refreshToken = async () => {
  try {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    console.log('🔄 Manually refreshing token...');
    const token = await user.getIdToken(true);
    console.log('✅ Token manually refreshed');
    
    return token;
  } catch (error) {
    console.error('❌ Manual token refresh error:', error);
    handleError(error, 'manual_token_refresh');
    throw error;
  }
};
```

### 2. เพิ่ม Error Handling ใน EquipmentManagementContainer

- ตรวจสอบว่า error เป็น permission error หรือไม่
- แสดงปุ่ม "Refresh Token" เมื่อเจอ permission error
- แสดงคำแนะนำวิธีแก้ไขปัญหา

### 3. เพิ่มปุ่ม Refresh Token ใน AdminEquipmentManagement

- เพิ่มปุ่มสำหรับ refresh token ด้วยตนเอง
- Auto reload หน้าหลังจาก refresh token สำเร็จ

## 📋 การตรวจสอบปัญหา

### ตรวจสอบ User Status

```javascript
// ใน Browser Console
console.log('User:', auth.currentUser);
console.log('User Profile:', userProfile);
```

ตรวจสอบว่า:
- `userProfile.role === 'admin'`
- `userProfile.status === 'approved'`

### ตรวจสอบ Auth Token

```javascript
// ใน Browser Console
auth.currentUser.getIdTokenResult().then(result => {
  console.log('Token claims:', result.claims);
  console.log('Token expiration:', result.expirationTime);
});
```

### ตรวจสอบ Firestore Rules

ใน Firebase Console > Firestore Database > Rules:

```javascript
match /equipmentManagement/{equipmentId} {
  allow read: if isApprovedUser();
  // ...
}

function isApprovedUser() {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'approved';
}
```

## 🚨 ปัญหาที่อาจพบเพิ่มเติม

### 1. User Document ไม่มีใน Firestore

**อาการ:** Permission denied แม้ว่า user จะ login แล้ว

**วิธีแก้:**
```javascript
// สร้าง user document ใหม่
const userDocRef = doc(db, 'users', user.uid);
await setDoc(userDocRef, {
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  role: 'admin',
  status: 'approved',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```

### 2. Firestore Rules ไม่ได้ Deploy

**อาการ:** แก้ไข rules แล้วแต่ยังเจอ permission denied

**วิธีแก้:**
```bash
firebase deploy --only firestore:rules
```

### 3. Token หมดอายุ

**อาการ:** เข้าได้ตอนแรก แต่หลังจากนั้นเข้าไม่ได้

**วิธีแก้:**
- ใช้ปุ่ม Refresh Token
- หรือ Sign Out และ Sign In ใหม่

## 📝 หมายเหตุ

- Auth token มีอายุ 1 ชั่วโมง
- หลังจาก token หมดอายุ ต้อง refresh token ใหม่
- การเปลี่ยนแปลง user status ใน Firestore ไม่ได้ update auth token อัตโนมัติ
- ต้อง refresh token ด้วยตนเองหรือ sign out/in ใหม่

## 🔗 ไฟล์ที่เกี่ยวข้อง

- `src/contexts/AuthContext.js` - Auth context และ refresh token function
- `src/components/equipment/EquipmentManagementContainer.js` - Equipment list container
- `src/components/admin/AdminEquipmentManagement.js` - Admin equipment management page
- `src/services/equipmentManagementService.js` - Equipment management service
- `firestore.rules` - Firestore security rules
