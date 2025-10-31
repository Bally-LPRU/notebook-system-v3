# ระบบจัดการการแจ้งเตือน (Notifications) — สำหรับระบบยืม–คืน (Firebase Ready)

> ครอบคลุม **Logic ที่จำเป็น**, โครงสร้าง Firestore, Cloud Functions/Scheduler ครบชุด  
> รองรับช่องทาง: **Discord Webhook, อีเมล, Push Notification (FCM)**  
> รองรับกำหนดเวลาอัตโนมัติ: **ตรวจสอบเกินกำหนด (09:00), เตือนคืน (14:00), รายงานประจำวัน (18:00)**

---

## 0) คำจำกัดความ
- **Event**: เหตุการณ์ในระบบ (เช่น คำขอยืมใหม่, ใกล้ครบกำหนด, เกินกำหนด, การคืนอุปกรณ์, อุปกรณ์เสียหาย, ผู้ใช้ใหม่, แจ้งเตือนระบบ)
- **Channel**: ช่องทางส่ง (Discord / Email / Push)
- **Preference**: ค่าการเปิด/ปิดของแต่ละ Event/Channel ต่อองค์กร/ต่อผู้ใช้
- **Schedule**: เวลารันอัตโนมัติ (CRON) สำหรับงานรวม เช่น รายงานประจำวัน
- **Template**: ไฟล์ข้อความรูปแบบ (i18n/variables) สำหรับแต่ละ Event/Channel
- **Dispatcher**: ฟังก์ชันรวมคิว → ส่งต่อ adapter ของแต่ละ Channel
- **Adapter**: โค้ดส่งจริงของ Discord/Email/Push
- **Queue**: เอกสารการแจ้งเตือนรอส่ง พร้อมสถานะ, retry, idempotency

---

## 1) แผนภาพลอจิก (สรุปย่อ)
1. **Trigger**: จากการเปลี่ยนสถานะใน Firestore (`bookings`, `items`, `users`) หรือจาก **Scheduler** เวลา 09:00 / 14:00 / 18:00  
2. **Rule Check**: ตรวจสิทธิ์ + ตรวจ **Preferences** (เปิด/ปิด event/channel)  
3. **Compose**: ประกอบข้อความจาก **Template** + แทนตัวแปร (ผู้ยืม, รายการ, เวลา, ลิงก์)  
4. **Enqueue**: เขียนเข้า `notif_queue` พร้อม `idempotencyKey` (กันส่งซ้ำ)  
5. **Dispatch**: Cloud Function แบบ background อ่านคิว → เรียก **adapter** (Discord/Email/Push)  
6. **Retry**: ถ้าส่งล้มเหลวให้ backoff (เช่น 1m, 5m, 15m) สูงสุด 5 ครั้ง แล้ว mark `failed`  
7. **Audit**: เก็บ `notif_logs` ทุกครั้งที่สำเร็จ/ล้มเหลว เพื่อตรวจสอบย้อนหลัง

---

## 2) ประเภทการแจ้งเตือน (สอดคล้องกับภาพหน้าจอ)
- `NEW_REQUEST` — คำขอยืมใหม่
- `OVERDUE` — อุปกรณ์เกินกำหนด
- `DUE_SOON` — เตือนคืนอุปกรณ์ (ใกล้ครบกำหนด)
- `RETURNED` — การคืนอุปกรณ์
- `LOST_DAMAGED` — รายงานอุปกรณ์เสียหาย/สูญหาย
- `NEW_USER` — ผู้ใช้ใหม่สมัครใช้งาน
- `SYSTEM_ALERT` — แจ้งเตือนปัญหาระบบ

> สามารถขยายเพิ่มได้ โดยคุมผ่าน Template + Preferences

---

## 3) โครงสร้าง Firestore

### 3.1 Preferences ระดับองค์กร (Admin ตั้งค่าภาพรวม)
```
/org_settings/{orgId}
  channels:
    discord.enabled: boolean
    email.enabled: boolean
    push.enabled: boolean
    discord.webhookUrl: string       # ถ้ามีหลายช่อง ใช้ collection แยกห้องก็ได้
  events:
    NEW_REQUEST.enabled: boolean
    OVERDUE.enabled: boolean
    DUE_SOON.enabled: boolean
    RETURNED.enabled: boolean
    LOST_DAMAGED.enabled: boolean
    NEW_USER.enabled: boolean
    SYSTEM_ALERT.enabled: boolean
  schedules:
    overdueCheck: "09:00"            # Asia/Bangkok
    dueSoonReminder: "14:00"
    dailyReport: "18:00"
  updatedAt: timestamp
```

### 3.2 Preferences ระดับผู้ใช้ (ทับค่าระดับองค์กรได้)
```
/user_settings/{uid}
  channels:
    discord.enabled: boolean         # ส่วนใหญ่ staff/admin เท่านั้น
    email.enabled: boolean
    push.enabled: boolean
  events:
    NEW_REQUEST.enabled: boolean
    OVERDUE.enabled: boolean
    ...
  updatedAt: timestamp
```

### 3.3 คิวและล็อก
```
/notif_queue/{queueId}
  orgId: string
  userId: string | null
  event: string
  channel: "discord" | "email" | "push"
  payload: object             # ข้อมูลสำหรับ template
  idempotencyKey: string      # กันส่งซ้ำ (เช่น `${event}:${bookingId}:${channel}`)
  status: "queued" | "sending" | "sent" | "failed"
  attempts: number
  scheduledAt: timestamp      # สำหรับงานตั้งเวลา
  createdAt: timestamp
  updatedAt: timestamp

/notif_logs/{logId}
  ... (สำเนาจากคิว + response/status/error)
```

---

## 4) Security Rules (แนวทาง)
- `org_settings` เขียนได้เฉพาะ `role in ["admin","staff"]`
- `user_settings` เจ้าของ (`request.auth.uid == resource.id`) หรือ admin
- `notif_queue` เขียนผ่าน Cloud Functions เท่านั้น (client ห้ามเขียนตรง)
- ใช้ **Custom Claims** หรือเอกสารโปรไฟล์เพื่อเช็กบทบาท

---

## 5) Cloud Scheduler (เวลาอัตโนมัติ)
> ตั้งสามงานหลัก (ตัวอย่างเวลาใน Asia/Bangkok ตรงกับ UI)
- `overdueCheck` — **09:00** ตรวจหา `bookings` ที่ `endAt < now && status in ('approved','checked_out')`
- `dueSoonReminder` — **14:00** แจ้ง `bookings` ที่จะครบกำหนดภายใน 24 ชม.
- `dailyReport` — **18:00** สรุปรายงานประจำวัน (จำนวนคำขอใหม่, อนุมัติ, คืน, ค้าง, เกินกำหนด)

**CRON ตัวอย่าง (GCP Scheduler):**
```
overdueCheck:     0 9 * * *      # 09:00 ทุกวัน
dueSoonReminder:  0 14 * * *     # 14:00 ทุกวัน
dailyReport:      0 18 * * *     # 18:00 ทุกวัน
```

---

## 6) Templates (โครง)
```
/templates/{event}
  email.subjectTh: string
  email.bodyTh: string (รองรับ Markdown)
  discord.contentTh: string
  push.titleTh: string
  push.bodyTh: string
  variables: ["userName","itemName","bookingId","startAt","endAt","link"]
```

> ใช้รูปแบบ `{{variable}}` แล้วแทนค่าใน Cloud Functions

---

## 7) โค้ดตัวอย่าง (TypeScript/Cloud Functions)

### 7.1 สร้างคิวจากเหตุการณ์จองใหม่
```ts
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
const db = admin.firestore();

export const onBookingCreated = functions.firestore
  .document("bookings/{id}")
  .onCreate(async (snap, ctx) => {
    const b = snap.data();
    // ตรวจ org settings
    const org = (await db.doc(`org_settings/${b.orgId}`).get()).data();
    if (!org?.events?.NEW_REQUEST?.enabled) return;

    const payload = {
      bookingId: ctx.params.id,
      itemName: b.itemName,
      userName: b.userName,
      startAt: b.startAt,
      endAt: b.endAt,
      link: `https://app.example.com/admin/bookings/${ctx.params.id}`
    };

    const channels: ("discord"|"email"|"push")[] = [];
    if (org.channels?.discord?.enabled) channels.push("discord");
    if (org.channels?.email?.enabled) channels.push("email");
    if (org.channels?.push?.enabled) channels.push("push");

    const batch = db.batch();
    channels.forEach(ch => {
      const ref = db.collection("notif_queue").doc();
      batch.set(ref, {
        orgId: b.orgId,
        userId: b.requesterId ?? null,
        event: "NEW_REQUEST",
        channel: ch,
        payload,
        idempotencyKey: `NEW_REQUEST:${ctx.params.id}:${ch}`,
        status: "queued",
        attempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  });
```

### 7.2 Dispatcher (อ่านคิว → ส่งต่อ adapter)
```ts
export const dispatchNotifications = functions.pubsub
  .schedule("every 1 minutes")
  .timeZone("Asia/Bangkok")
  .onRun(async () => {
    const snap = await db.collection("notif_queue")
      .where("status", "==", "queued")
      .orderBy("createdAt", "asc").limit(50).get();

    const tasks = snap.docs.map(async d => {
      const q = d.data();
      try {
        await d.ref.update({ status: "sending" });

        if (q.channel === "discord") await sendDiscord(q);
        else if (q.channel === "email") await sendEmail(q);
        else if (q.channel === "push") await sendPush(q);

        await d.ref.update({
          status: "sent",
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await db.collection("notif_logs").add({ ...q, result: "ok", at: admin.firestore.FieldValue.serverTimestamp() });
      } catch (err:any) {
        const attempts = (q.attempts ?? 0) + 1;
        const max = 5;
        const nextStatus = attempts >= max ? "failed" : "queued";
        await d.ref.update({
          status: nextStatus,
          attempts,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await db.collection("notif_logs").add({ ...q, result: "error", error: String(err), at: admin.firestore.FieldValue.serverTimestamp() });
      }
    });

    await Promise.all(tasks);
  });
```

### 7.3 Discord Adapter (Webhook)
```ts
import fetch from "node-fetch";

async function sendDiscord(q:any) {
  const org = (await db.doc(`org_settings/${q.orgId}`).get()).data();
  const url = org?.channels?.discord?.webhookUrl;
  if (!url) throw new Error("Missing Discord Webhook URL");

  const content = `📢 ${q.event}\nผู้ขอ: ${q.payload.userName}\nอุปกรณ์: ${q.payload.itemName}\nช่วงเวลา: ${q.payload.startAt} - ${q.payload.endAt}\nลิงก์: ${q.payload.link}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error(`Discord HTTP ${res.status}`);
}
```

### 7.4 Email Adapter (ตัวอย่าง SendGrid/SMTP — โค้ดสมมติ)
```ts
async function sendEmail(q:any) {
  // ใช้ SendGrid / Gmail API ก็ได้
  // compose subject/body จาก template
  return;
}
```

### 7.5 Push Adapter (FCM)
```ts
async function sendPush(q:any) {
  const tokenSnap = await db.collection("push_tokens").where("uid", "==", q.userId).get();
  const tokens = tokenSnap.docs.map(d => d.data().token);
  if (!tokens.length) return;

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: "แจ้งเตือนระบบยืม–คืน",
      body: `${q.event}: ${q.payload.itemName}`
    },
    data: { link: q.payload.link || "" }
  });
}
```

---

## 8) งานตั้งเวลาเฉพาะ (ตัวอย่าง Overdue/DueSoon/Daily Report)

### Overdue (09:00)
```ts
export const cronOverdue = functions.pubsub
  .schedule("0 9 * * *").timeZone("Asia/Bangkok").onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const snap = await db.collection("bookings")
      .where("status", "in", ["approved","checked_out"])
      .where("endAt", "<", now).get();

    const batch = db.batch();
    snap.docs.forEach(d => {
      const b = d.data();
      const ref = db.collection("notif_queue").doc();
      batch.set(ref, {
        orgId: b.orgId, userId: b.requesterId, event: "OVERDUE", channel: "email",
        payload: { itemName: b.itemName, endAt: b.endAt, link: `https://app.example.com/loans/${d.id}` },
        idempotencyKey: `OVERDUE:${d.id}:email`, status: "queued", attempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  });
```

### Due Soon (14:00 – ครบกำหนดภายใน 24 ชม.)
```ts
export const cronDueSoon = functions.pubsub
  .schedule("0 14 * * *").timeZone("Asia/Bangkok").onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const soon = admin.firestore.Timestamp.fromMillis(now.toMillis() + 24*60*60*1000);

    const snap = await db.collection("bookings")
      .where("status", "in", ["approved","checked_out"])
      .where("endAt", ">", now).where("endAt", "<=", soon).get();

    const batch = db.batch();
    snap.docs.forEach(d => {
      const b = d.data();
      const ref = db.collection("notif_queue").doc();
      batch.set(ref, {
        orgId: b.orgId, userId: b.requesterId, event: "DUE_SOON", channel: "push",
        payload: { itemName: b.itemName, endAt: b.endAt, link: `https://app.example.com/loans/${d.id}` },
        idempotencyKey: `DUE_SOON:${d.id}:push`, status: "queued", attempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  });
```

### Daily Report (18:00)
- รวมตัวเลขวันนี้: คำขอใหม่/อนุมัติ/คืน/ค้าง/เกินกำหนด  
- ส่งไป **Discord + Email** ของแอดมิน

```ts
export const cronDailyReport = functions.pubsub
  .schedule("0 18 * * *").timeZone("Asia/Bangkok").onRun(async () => {
    // query สรุปตัวเลขของวัน แล้ว enqueue discord/email 1 รายการต่อองค์กร
    return;
  });
```

---

## 9) การทดสอบและความน่าเชื่อถือ
- ปุ่ม **“ทดสอบการส่งแจ้งเตือน”**: เรียก HTTPS Callable Function → สร้างคิวหลอก แล้วให้ Dispatcher ส่งจริง
- **Idempotency**: เช็ก `idempotencyKey` ก่อนส่ง ถ้าเคยส่งสำเร็จแล้วใน 24 ชม. ให้ข้าม
- **Rate limit**: จำกัดจำนวนต่อผู้ใช้/ช่องทาง (เช่น ไม่เกิน 10/min) ป้องกันสแปม
- **Observability**: เก็บ `notif_logs` + ส่ง error ไป Cloud Logging/Alerting
- **Privacy**: payload ไม่ควรมีข้อมูลส่วนบุคคลเกินจำเป็น

---

## 10) ตัวแปรสภาพแวดล้อม (แนะนำ)
- `DISCORD_WEBHOOK_URL` (ถ้าตั้งค่ากลาง) หรือเก็บต่อ org ใน Firestore ตามตัวอย่าง
- `SENDGRID_API_KEY` หรือ Gmail API credentials
- `FIREBASE_CONFIG` (มาตรฐาน)
- `TZ=Asia/Bangkok` (สำหรับ container/runtime ที่รองรับ)

---

## 11) UX/หน้าตั้งค่าที่ควรมี (ตามภาพ)
- Toggle **ประเภทการแจ้งเตือน** รายการในข้อ (2)
- Toggle **ช่องทาง** (Discord/Email/Push) พร้อมสถานะการเชื่อมต่อ (เช่น Discord: Connected)
- ตั้งค่า **เวลารันอัตโนมัติ** 09:00 / 14:00 / 18:00 (แยก org ได้)
- ปุ่ม **บันทึกการตั้งค่า** + **ทดสอบการส่งแจ้งเตือน**
- ส่วนอธิบาย **วิธีตั้งค่า Discord Webhook** (ขั้นตอน 1–5)

---

## 12) เช็คลิสต์ก่อนขึ้นโปรดักชัน
- [ ] Security Rules ปิดการเขียน `notif_queue` จาก client
- [ ] เปิด Cloud Scheduler + ตั้ง time zone
- [ ] ตั้งค่า Environment Variables/Secrets
- [ ] เปิด CORS เฉพาะโดเมนที่อนุญาตสำหรับ Callable
- [ ] ทดสอบ load: สร้างคิว 100 รายการ → Dispatcher ต้องทยอยส่งและ retry ได้
- [ ] ตั้ง Dashboard ดู error rate/latency

---

## 13) ภาคผนวก: โครงสร้างคอลเลกชันที่เกี่ยวข้อง (อ้างอิงระบบยืม–คืน)
```
/bookings/{id}    # มี startAt, endAt, status, requesterId, itemName, orgId, ...
/items/{id}
/users/{uid}
/org_settings/{orgId}
/user_settings/{uid}
/notif_queue/{queueId}
/notif_logs/{logId}
/push_tokens/{docId} { uid, token, platform }
```
