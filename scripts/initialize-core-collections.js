/**
 * Initialize ALL 10 Core Collections for Equipment Lending System
 * 
 * สคริปต์นี้จะสร้าง collections ทั้งหมด 10 collections ที่จำเป็นสำหรับระบบยืม-คืนอุปกรณ์
 * รวมถึงข้อมูลตัวอย่างเพื่อให้ระบบพร้อมใช้งาน
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ตรวจสอบว่ามี service account key หรือไม่
const serviceAccountPath = path.join(__dirname, '../config/serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.log('📝 Please create config/serviceAccountKey.json with your Firebase Admin SDK credentials');
  console.log('   You can download it from: Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized successfully\n');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

/**
 * สร้าง collection: publicStats
 */
async function initializePublicStats() {
  console.log('📊 Initializing publicStats collection...');
  
  try {
    await db.collection('publicStats').doc('current').set({
      totalEquipment: 0,
      availableEquipment: 0,
      borrowedEquipment: 0,
      totalUsers: 0,
      totalLoans: 0,
      totalReservations: 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ publicStats initialized');
  } catch (error) {
    console.error('❌ Error initializing publicStats:', error);
  }
}

/**
 * สร้าง collection: closedDates (ตัวอย่าง)
 */
async function initializeClosedDates() {
  console.log('📅 Initializing closedDates collection...');
  
  try {
    // เพิ่มวันหยุดตัวอย่าง
    const sampleClosedDates = [
      {
        date: admin.firestore.Timestamp.fromDate(new Date('2025-01-01')),
        reason: 'วันขึ้นปีใหม่',
        type: 'holiday',
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    for (const closedDate of sampleClosedDates) {
      await db.collection('closedDates').add(closedDate);
    }
    
    console.log('✅ closedDates initialized with sample data');
  } catch (error) {
    console.error('❌ Error initializing closedDates:', error);
  }
}

/**
 * สร้าง collection: categoryLimits
 */
async function initializeCategoryLimits() {
  console.log('🏷️ Initializing categoryLimits collection...');
  
  try {
    // ดึงหมวดหมู่ที่มีอยู่
    const categoriesSnapshot = await db.collection('equipmentCategories').get();
    
    if (categoriesSnapshot.empty) {
      console.log('⚠️ No equipment categories found. Skipping categoryLimits initialization.');
      return;
    }
    
    // สร้าง limits เริ่มต้นสำหรับแต่ละหมวดหมู่
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryId = categoryDoc.id;
      
      await db.collection('categoryLimits').doc(categoryId).set({
        maxBorrowPerUser: 3,
        maxBorrowDuration: 7, // วัน
        requiresApproval: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`✅ categoryLimits initialized for ${categoriesSnapshot.size} categories`);
  } catch (error) {
    console.error('❌ Error initializing categoryLimits:', error);
  }
}

/**
 * สร้าง sample loan request (ตัวอย่าง)
 */
async function createSampleLoanRequest() {
  console.log('📝 Creating sample loan request...');
  
  try {
    // ตรวจสอบว่ามี admin user และ equipment หรือไม่
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();
    
    const equipmentSnapshot = await db.collection('equipmentManagement')
      .where('status', '==', 'available')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty || equipmentSnapshot.empty) {
      console.log('⚠️ No admin user or available equipment found. Skipping sample loan request.');
      return;
    }
    
    const adminUser = usersSnapshot.docs[0];
    const equipment = equipmentSnapshot.docs[0];
    
    const sampleLoanRequest = {
      equipmentId: equipment.id,
      equipmentName: equipment.data().name,
      userId: adminUser.id,
      userName: adminUser.data().displayName || 'Admin User',
      userEmail: adminUser.data().email,
      requestDate: admin.firestore.FieldValue.serverTimestamp(),
      borrowDate: admin.firestore.Timestamp.fromDate(new Date()),
      expectedReturnDate: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 วันจากนี้
      ),
      purpose: 'ทดสอบระบบยืม-คืนอุปกรณ์',
      notes: 'นี่คือคำขอยืมตัวอย่างสำหรับทดสอบระบบ',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('loanRequests').add(sampleLoanRequest);
    
    console.log('✅ Sample loan request created');
  } catch (error) {
    console.error('❌ Error creating sample loan request:', error);
  }
}

/**
 * สร้าง sample reservation (ตัวอย่าง)
 */
async function createSampleReservation() {
  console.log('📅 Creating sample reservation...');
  
  try {
    // ตรวจสอบว่ามี admin user และ equipment หรือไม่
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();
    
    const equipmentSnapshot = await db.collection('equipmentManagement')
      .where('status', '==', 'available')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty || equipmentSnapshot.empty) {
      console.log('⚠️ No admin user or available equipment found. Skipping sample reservation.');
      return;
    }
    
    const adminUser = usersSnapshot.docs[0];
    const equipment = equipmentSnapshot.docs[0];
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const endTime = new Date(tomorrow);
    endTime.setHours(17, 0, 0, 0);
    
    const sampleReservation = {
      equipmentId: equipment.id,
      equipmentName: equipment.data().name,
      userId: adminUser.id,
      userName: adminUser.data().displayName || 'Admin User',
      userEmail: adminUser.data().email,
      reservationDate: admin.firestore.FieldValue.serverTimestamp(),
      startTime: admin.firestore.Timestamp.fromDate(tomorrow),
      endTime: admin.firestore.Timestamp.fromDate(endTime),
      purpose: 'ทดสอบระบบจองอุปกรณ์',
      notes: 'นี่คือการจองตัวอย่างสำหรับทดสอบระบบ',
      status: 'pending',
      notificationSent: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('reservations').add(sampleReservation);
    
    console.log('✅ Sample reservation created');
  } catch (error) {
    console.error('❌ Error creating sample reservation:', error);
  }
}

/**
 * สร้าง sample notification
 */
async function createSampleNotification() {
  console.log('🔔 Creating sample notification...');
  
  try {
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ No admin user found. Skipping sample notification.');
      return;
    }
    
    const adminUser = usersSnapshot.docs[0];
    
    const sampleNotification = {
      userId: adminUser.id,
      type: 'system_update',
      title: 'ยินดีต้อนรับสู่ระบบยืม-คืนอุปกรณ์',
      message: 'ระบบพร้อมใช้งานแล้ว คุณสามารถเริ่มจัดการอุปกรณ์และคำขอยืมได้',
      data: {},
      isRead: false,
      priority: 'medium',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('notifications').add(sampleNotification);
    
    console.log('✅ Sample notification created');
  } catch (error) {
    console.error('❌ Error creating sample notification:', error);
  }
}

/**
 * สร้าง default notification settings สำหรับ admin user
 */
async function createDefaultNotificationSettings() {
  console.log('⚙️ Creating default notification settings...');
  
  try {
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ No admin user found. Skipping notification settings.');
      return;
    }
    
    const adminUser = usersSnapshot.docs[0];
    
    const defaultSettings = {
      emailNotifications: {
        loanApproval: true,
        loanReminder: true,
        reservationReminder: true,
        systemUpdates: true
      },
      inAppNotifications: {
        loanApproval: true,
        loanReminder: true,
        reservationReminder: true,
        systemUpdates: true
      },
      reminderTiming: {
        loanReminder: 1, // 1 วันก่อนครบกำหนด
        reservationReminder: 24 // 24 ชั่วโมงก่อนเวลานัดหมาย
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('notificationSettings').doc(adminUser.id).set(defaultSettings);
    
    console.log('✅ Default notification settings created');
  } catch (error) {
    console.error('❌ Error creating notification settings:', error);
  }
}

/**
 * สร้าง collection: activityLogs (ตัวอย่าง)
 */
async function createSampleActivityLog() {
  console.log('📝 Creating sample activity log...');
  
  try {
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ No admin user found. Skipping sample activity log.');
      return;
    }
    
    const adminUser = usersSnapshot.docs[0];
    
    const sampleActivityLog = {
      userId: adminUser.id,
      action: 'system_initialization',
      targetType: 'system',
      targetId: 'core_collections',
      details: {
        description: 'สร้าง collections พื้นฐานของระบบ',
        collectionsCreated: 10
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: '127.0.0.1'
    };
    
    await db.collection('activityLogs').add(sampleActivityLog);
    
    console.log('✅ Sample activity log created');
  } catch (error) {
    console.error('❌ Error creating sample activity log:', error);
  }
}

/**
 * สร้าง collection: scheduledNotifications (ตัวอย่าง)
 */
async function createSampleScheduledNotification() {
  console.log('⏰ Creating sample scheduled notification...');
  
  try {
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ No admin user found. Skipping sample scheduled notification.');
      return;
    }
    
    const adminUser = usersSnapshot.docs[0];
    
    // สร้างการแจ้งเตือนที่จะส่งในอีก 1 ชั่วโมง
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + 1);
    
    const sampleScheduledNotification = {
      userId: adminUser.id,
      type: 'system_reminder',
      scheduledTime: admin.firestore.Timestamp.fromDate(scheduledTime),
      data: {
        title: 'ตรวจสอบระบบ',
        message: 'อย่าลืมตรวจสอบคำขอยืมที่รอการอนุมัติ',
        priority: 'medium'
      },
      status: 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('scheduledNotifications').add(sampleScheduledNotification);
    
    console.log('✅ Sample scheduled notification created');
  } catch (error) {
    console.error('❌ Error creating sample scheduled notification:', error);
  }
}

/**
 * สร้าง collection: settingsAuditLog (ตัวอย่าง)
 */
async function createSampleSettingsAuditLog() {
  console.log('📋 Creating sample settings audit log...');
  
  try {
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ No admin user found. Skipping sample settings audit log.');
      return;
    }
    
    const adminUser = usersSnapshot.docs[0];
    
    const sampleAuditLog = {
      settingKey: 'maxLoanDuration',
      oldValue: 7,
      newValue: 14,
      changedBy: adminUser.id,
      changedByName: adminUser.data().displayName || 'Admin User',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      reason: 'เพิ่มระยะเวลายืมสูงสุดตามนโยบายใหม่'
    };
    
    await db.collection('settingsAuditLog').add(sampleAuditLog);
    
    console.log('✅ Sample settings audit log created');
  } catch (error) {
    console.error('❌ Error creating sample settings audit log:', error);
  }
}

/**
 * แสดงสรุปผล
 */
function displaySummary(collectionsCreated) {
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL COLLECTIONS INITIALIZATION COMPLETED!');
  console.log('='.repeat(60));
  
  console.log('\n📊 Collections Created (10 total):');
  collectionsCreated.forEach((collection, index) => {
    console.log(`  ${index + 1}. ✅ ${collection}`);
  });
  
  console.log('\n📝 Sample Data Created:');
  console.log('  - 1 loan request (pending)');
  console.log('  - 1 reservation (pending)');
  console.log('  - 1 notification (unread)');
  console.log('  - 1 notification settings (for admin)');
  console.log('  - 1 activity log');
  console.log('  - 1 scheduled notification');
  console.log('  - 1 settings audit log');
  console.log('  - 1 closed date (New Year)');
  console.log('  - Category limits (for all categories)');
  console.log('  - Public stats (initialized)');
  
  console.log('\n🔐 Security & Indexes:');
  console.log('  ⚠️  Make sure to deploy Security Rules:');
  console.log('      firebase deploy --only firestore:rules');
  console.log('  ⚠️  Make sure to deploy Indexes:');
  console.log('      firebase deploy --only firestore:indexes');
  
  console.log('\n🎯 Next Steps:');
  console.log('  1. ✅ ตรวจสอบ Firebase Console ว่า collections ถูกสร้างแล้ว');
  console.log('  2. ✅ ตรวจสอบข้อมูลตัวอย่างใน collections');
  console.log('  3. ⚠️  Deploy Security Rules และ Indexes');
  console.log('  4. ✅ เริ่มใช้งานระบบได้เลย!');
  
  console.log('\n💡 Tips:');
  console.log('  - ข้อมูลตัวอย่างสามารถลบได้หลังจากทดสอบเสร็จ');
  console.log('  - Collections จะถูกสร้างอัตโนมัติเมื่อมีการเพิ่มข้อมูลครั้งแรก');
  console.log('  - ตรวจสอบ firestore.rules ว่ามี rules สำหรับทุก collection');
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 INITIALIZING ALL 10 CORE COLLECTIONS');
  console.log('='.repeat(60) + '\n');
  
  const collectionsCreated = [];
  
  try {
    // 1. publicStats
    await initializePublicStats();
    collectionsCreated.push('publicStats');
    
    // 2. closedDates
    await initializeClosedDates();
    collectionsCreated.push('closedDates');
    
    // 3. categoryLimits
    await initializeCategoryLimits();
    collectionsCreated.push('categoryLimits');
    
    // 4. loanRequests
    await createSampleLoanRequest();
    collectionsCreated.push('loanRequests');
    
    // 5. reservations
    await createSampleReservation();
    collectionsCreated.push('reservations');
    
    // 6. notifications
    await createSampleNotification();
    collectionsCreated.push('notifications');
    
    // 7. notificationSettings
    await createDefaultNotificationSettings();
    collectionsCreated.push('notificationSettings');
    
    // 8. activityLogs
    await createSampleActivityLog();
    collectionsCreated.push('activityLogs');
    
    // 9. scheduledNotifications
    await createSampleScheduledNotification();
    collectionsCreated.push('scheduledNotifications');
    
    // 10. settingsAuditLog
    await createSampleSettingsAuditLog();
    collectionsCreated.push('settingsAuditLog');
    
    // แสดงสรุปผล
    displaySummary(collectionsCreated);
    
  } catch (error) {
    console.error('\n❌ Error during initialization:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
main();
