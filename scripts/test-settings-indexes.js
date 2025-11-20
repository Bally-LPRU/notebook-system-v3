/**
 * Test Settings Firestore Indexes
 * 
 * This script tests that Firestore indexes for the admin settings system
 * are working correctly and queries perform well.
 * 
 * Run with: node scripts/test-settings-indexes.js
 */

const admin = require('firebase-admin');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    initializeApp();
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    process.exit(1);
  }
}

const db = getFirestore();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n📋 Testing: ${testName}`, 'cyan');
}

function logPass(message) {
  log(`  ✓ ${message}`, 'green');
}

function logFail(message) {
  log(`  ✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`  ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runTest(testName, testFn) {
  totalTests++;
  logTest(testName);
  const startTime = Date.now();
  
  try {
    await testFn();
    const duration = Date.now() - startTime;
    passedTests++;
    logPass(`Test passed (${duration}ms)`);
  } catch (error) {
    failedTests++;
    logFail(`Test failed: ${error.message}`);
  }
}

// Helper function to create test data
async function setupTestData() {
  log('\n🔧 Setting up test data...', 'yellow');
  
  try {
    // Create test audit log entries
    const auditLogRef = db.collection('settingsAuditLog');
    
    const testEntries = [
      {
        timestamp: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
        adminId: 'admin1',
        adminName: 'Admin One',
        action: 'update',
        settingType: 'maxLoanDuration',
        oldValue: 7,
        newValue: 14
      },
      {
        timestamp: admin.firestore.Timestamp.fromDate(new Date('2024-01-02')),
        adminId: 'admin2',
        adminName: 'Admin Two',
        action: 'update',
        settingType: 'maxAdvanceBookingDays',
        oldValue: 30,
        newValue: 60
      },
      {
        timestamp: admin.firestore.Timestamp.fromDate(new Date('2024-01-03')),
        adminId: 'admin1',
        adminName: 'Admin One',
        action: 'update',
        settingType: 'defaultCategoryLimit',
        oldValue: 3,
        newValue: 5
      }
    ];
    
    for (const entry of testEntries) {
      await auditLogRef.add(entry);
    }
    
    logInfo('Created test audit log entries');
    
    // Create test closed dates
    const closedDatesRef = db.collection('closedDates');
    
    const testDates = [
      {
        date: admin.firestore.Timestamp.fromDate(new Date('2024-12-25')),
        reason: 'TEST - Christmas',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'admin1'
      },
      {
        date: admin.firestore.Timestamp.fromDate(new Date('2024-12-31')),
        reason: 'TEST - New Year',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'admin1'
      }
    ];
    
    for (const date of testDates) {
      await closedDatesRef.add(date);
    }
    
    logInfo('Created test closed dates');
    
    // Create test system notifications
    const notificationsRef = db.collection('systemNotifications');
    
    const testNotifications = [
      {
        title: 'Test Announcement',
        content: 'This is a test',
        type: 'announcement',
        priority: 'low',
        createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
        createdBy: 'admin1',
        sentTo: [],
        readBy: [],
        responses: []
      },
      {
        title: 'Test Alert',
        content: 'This is a test alert',
        type: 'alert',
        priority: 'high',
        createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-02')),
        createdBy: 'admin1',
        sentTo: [],
        readBy: [],
        responses: []
      }
    ];
    
    for (const notification of testNotifications) {
      await notificationsRef.add(notification);
    }
    
    logInfo('Created test system notifications');
    
    logPass('Test data setup complete');
  } catch (error) {
    logFail(`Failed to setup test data: ${error.message}`);
    throw error;
  }
}

// Helper function to cleanup test data
async function cleanupTestData() {
  log('\n🧹 Cleaning up test data...', 'yellow');
  
  try {
    // Clean up test audit logs
    const auditLogsSnapshot = await db.collection('settingsAuditLog')
      .where('adminName', 'in', ['Admin One', 'Admin Two'])
      .get();
    
    const deletePromises = auditLogsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    
    // Clean up test closed dates
    const closedDatesSnapshot = await db.collection('closedDates')
      .where('reason', '>=', 'TEST')
      .where('reason', '<=', 'TEST\uf8ff')
      .get();
    
    const deleteDatesPromises = closedDatesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deleteDatesPromises);
    
    // Clean up test notifications
    const notificationsSnapshot = await db.collection('systemNotifications')
      .where('title', '>=', 'Test')
      .where('title', '<=', 'Test\uf8ff')
      .get();
    
    const deleteNotificationsPromises = notificationsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deleteNotificationsPromises);
    
    logPass('Cleanup complete');
  } catch (error) {
    logInfo(`Cleanup warning: ${error.message}`);
  }
}

// Test 1: Audit Log - Query by timestamp (DESC)
async function testAuditLogTimestampQuery() {
  const snapshot = await db.collection('settingsAuditLog')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
  
  if (snapshot.empty) {
    logWarning('No audit log entries found');
    return;
  }
  
  logInfo(`Found ${snapshot.size} audit log entries`);
  
  // Verify ordering
  let previousTimestamp = null;
  for (const doc of snapshot.docs) {
    const timestamp = doc.data().timestamp;
    if (previousTimestamp && timestamp > previousTimestamp) {
      throw new Error('Audit log entries not in descending order');
    }
    previousTimestamp = timestamp;
  }
  
  logInfo('Entries are correctly ordered by timestamp (DESC)');
}

// Test 2: Audit Log - Query by adminId + timestamp
async function testAuditLogAdminQuery() {
  const snapshot = await db.collection('settingsAuditLog')
    .where('adminId', '==', 'admin1')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
  
  if (snapshot.empty) {
    logWarning('No audit log entries found for admin1');
    return;
  }
  
  logInfo(`Found ${snapshot.size} entries for admin1`);
  
  // Verify all entries are for admin1
  for (const doc of snapshot.docs) {
    if (doc.data().adminId !== 'admin1') {
      throw new Error('Query returned entries for wrong admin');
    }
  }
  
  logInfo('All entries are for the correct admin');
}

// Test 3: Audit Log - Query by settingType + timestamp
async function testAuditLogSettingTypeQuery() {
  const snapshot = await db.collection('settingsAuditLog')
    .where('settingType', '==', 'maxLoanDuration')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
  
  if (snapshot.empty) {
    logWarning('No audit log entries found for maxLoanDuration');
    return;
  }
  
  logInfo(`Found ${snapshot.size} entries for maxLoanDuration`);
  
  // Verify all entries are for correct setting type
  for (const doc of snapshot.docs) {
    if (doc.data().settingType !== 'maxLoanDuration') {
      throw new Error('Query returned entries for wrong setting type');
    }
  }
  
  logInfo('All entries are for the correct setting type');
}

// Test 4: Audit Log - Combined query (adminId + settingType + timestamp)
async function testAuditLogCombinedQuery() {
  const snapshot = await db.collection('settingsAuditLog')
    .where('adminId', '==', 'admin1')
    .where('settingType', '==', 'maxLoanDuration')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
  
  logInfo(`Found ${snapshot.size} entries for admin1 + maxLoanDuration`);
  
  // Verify all entries match both filters
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.adminId !== 'admin1' || data.settingType !== 'maxLoanDuration') {
      throw new Error('Query returned entries that don\'t match filters');
    }
  }
  
  logInfo('All entries match both filters');
}

// Test 5: Closed Dates - Query by date (ASC)
async function testClosedDatesQuery() {
  const snapshot = await db.collection('closedDates')
    .orderBy('date', 'asc')
    .limit(10)
    .get();
  
  if (snapshot.empty) {
    logWarning('No closed dates found');
    return;
  }
  
  logInfo(`Found ${snapshot.size} closed dates`);
  
  // Verify ordering
  let previousDate = null;
  for (const doc of snapshot.docs) {
    const date = doc.data().date;
    if (previousDate && date < previousDate) {
      throw new Error('Closed dates not in ascending order');
    }
    previousDate = date;
  }
  
  logInfo('Dates are correctly ordered (ASC)');
}

// Test 6: System Notifications - Query by createdAt (DESC)
async function testSystemNotificationsQuery() {
  const snapshot = await db.collection('systemNotifications')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  
  if (snapshot.empty) {
    logWarning('No system notifications found');
    return;
  }
  
  logInfo(`Found ${snapshot.size} system notifications`);
  
  // Verify ordering
  let previousTimestamp = null;
  for (const doc of snapshot.docs) {
    const timestamp = doc.data().createdAt;
    if (previousTimestamp && timestamp > previousTimestamp) {
      throw new Error('Notifications not in descending order');
    }
    previousTimestamp = timestamp;
  }
  
  logInfo('Notifications are correctly ordered by createdAt (DESC)');
}

// Test 7: System Notifications - Query by type + createdAt
async function testSystemNotificationsTypeQuery() {
  const snapshot = await db.collection('systemNotifications')
    .where('type', '==', 'announcement')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  
  logInfo(`Found ${snapshot.size} announcement notifications`);
  
  // Verify all entries are announcements
  for (const doc of snapshot.docs) {
    if (doc.data().type !== 'announcement') {
      throw new Error('Query returned wrong notification type');
    }
  }
  
  logInfo('All notifications are of type announcement');
}

// Test 8: System Notifications - Query by priority + createdAt
async function testSystemNotificationsPriorityQuery() {
  const snapshot = await db.collection('systemNotifications')
    .where('priority', '==', 'high')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  
  logInfo(`Found ${snapshot.size} high priority notifications`);
  
  // Verify all entries are high priority
  for (const doc of snapshot.docs) {
    if (doc.data().priority !== 'high') {
      throw new Error('Query returned wrong priority');
    }
  }
  
  logInfo('All notifications are high priority');
}

// Test 9: Performance - Measure query times
async function testQueryPerformance() {
  const queries = [
    {
      name: 'Audit Log (timestamp)',
      query: () => db.collection('settingsAuditLog')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get()
    },
    {
      name: 'Audit Log (admin filter)',
      query: () => db.collection('settingsAuditLog')
        .where('adminId', '==', 'admin1')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get()
    },
    {
      name: 'Closed Dates',
      query: () => db.collection('closedDates')
        .orderBy('date', 'asc')
        .get()
    },
    {
      name: 'System Notifications',
      query: () => db.collection('systemNotifications')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get()
    }
  ];
  
  for (const { name, query } of queries) {
    const startTime = Date.now();
    await query();
    const duration = Date.now() - startTime;
    
    if (duration < 1000) {
      logInfo(`${name}: ${duration}ms ✓`);
    } else {
      logWarning(`${name}: ${duration}ms (slow)`);
    }
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('Settings Indexes Test Suite', 'cyan');
  log('='.repeat(60), 'cyan');
  
  try {
    // Setup
    await setupTestData();
    
    // Run tests
    await runTest('Audit Log - Timestamp Query', testAuditLogTimestampQuery);
    await runTest('Audit Log - Admin Filter Query', testAuditLogAdminQuery);
    await runTest('Audit Log - Setting Type Query', testAuditLogSettingTypeQuery);
    await runTest('Audit Log - Combined Query', testAuditLogCombinedQuery);
    await runTest('Closed Dates - Date Query', testClosedDatesQuery);
    await runTest('System Notifications - Timestamp Query', testSystemNotificationsQuery);
    await runTest('System Notifications - Type Query', testSystemNotificationsTypeQuery);
    await runTest('System Notifications - Priority Query', testSystemNotificationsPriorityQuery);
    await runTest('Query Performance', testQueryPerformance);
    
    // Cleanup
    await cleanupTestData();
    
    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('Test Summary', 'cyan');
    log('='.repeat(60), 'cyan');
    log(`Total Tests: ${totalTests}`, 'blue');
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
    log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 
        failedTests === 0 ? 'green' : 'yellow');
    
    if (failedTests === 0) {
      log('\n✅ All tests passed! Indexes are working correctly.', 'green');
      process.exit(0);
    } else {
      log('\n❌ Some tests failed. Check if indexes are still building.', 'red');
      logInfo('Run: firebase firestore:indexes to check status');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  setupTestData,
  cleanupTestData
};
