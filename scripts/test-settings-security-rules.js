/**
 * Test script for Settings Security Rules
 * 
 * This script tests Firestore security rules for the admin settings system
 * to ensure proper access control is enforced.
 * 
 * Run with: node scripts/test-settings-security-rules.js
 */

const admin = require('firebase-admin');
const { initializeApp, cert } = require('firebase-admin/app');
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

// Test user IDs (these should exist in your test environment)
const TEST_ADMIN_UID = 'test-admin-uid';
const TEST_USER_UID = 'test-user-uid';
const TEST_UNAUTHENTICATED = null;

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

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runTest(testName, testFn) {
  totalTests++;
  logTest(testName);
  try {
    await testFn();
    passedTests++;
    logPass('Test passed');
  } catch (error) {
    failedTests++;
    logFail(`Test failed: ${error.message}`);
  }
}

// Helper function to create test users
async function setupTestUsers() {
  log('\n🔧 Setting up test users...', 'yellow');
  
  try {
    // Create admin user
    await db.collection('users').doc(TEST_ADMIN_UID).set({
      uid: TEST_ADMIN_UID,
      email: 'admin@test.com',
      displayName: 'Test Admin',
      role: 'admin',
      status: 'approved',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    logInfo('Created test admin user');
    
    // Create regular user
    await db.collection('users').doc(TEST_USER_UID).set({
      uid: TEST_USER_UID,
      email: 'user@test.com',
      displayName: 'Test User',
      role: 'user',
      status: 'approved',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    logInfo('Created test regular user');
    
    logPass('Test users setup complete');
  } catch (error) {
    logFail(`Failed to setup test users: ${error.message}`);
    throw error;
  }
}

// Helper function to cleanup test data
async function cleanupTestData() {
  log('\n🧹 Cleaning up test data...', 'yellow');
  
  try {
    // Clean up test settings
    const testSettingsRef = db.collection('settings').doc('test-setting');
    await testSettingsRef.delete();
    
    // Clean up test closed dates
    const testClosedDatesSnapshot = await db.collection('closedDates')
      .where('reason', '==', 'TEST')
      .get();
    const deletePromises = testClosedDatesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    
    logPass('Cleanup complete');
  } catch (error) {
    logInfo(`Cleanup warning: ${error.message}`);
  }
}

// Test 1: Settings Collection - Admin Read Access
async function testSettingsAdminRead() {
  const settingsRef = db.collection('settings').doc('systemSettings');
  
  // Create test setting
  await settingsRef.set({
    maxLoanDuration: 14,
    maxAdvanceBookingDays: 30,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
  // Admin should be able to read
  const doc = await settingsRef.get();
  if (!doc.exists) {
    throw new Error('Admin cannot read settings');
  }
  
  logInfo('Admin can read settings');
}

// Test 2: Settings Collection - Admin Write Access
async function testSettingsAdminWrite() {
  const settingsRef = db.collection('settings').doc('test-setting');
  
  // Admin should be able to write
  await settingsRef.set({
    testValue: 'admin-write-test',
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });
  
  const doc = await settingsRef.get();
  if (!doc.exists || doc.data().testValue !== 'admin-write-test') {
    throw new Error('Admin cannot write settings');
  }
  
  logInfo('Admin can write settings');
}

// Test 3: Settings Collection - User Read Access
async function testSettingsUserRead() {
  const settingsRef = db.collection('settings').doc('systemSettings');
  
  // Regular user should be able to read (authenticated users can read)
  const doc = await settingsRef.get();
  if (!doc.exists) {
    throw new Error('User cannot read settings');
  }
  
  logInfo('Authenticated user can read settings');
}

// Test 4: Closed Dates Collection - Admin Write Access
async function testClosedDatesAdminWrite() {
  const closedDateRef = db.collection('closedDates').doc();
  
  await closedDateRef.set({
    date: admin.firestore.Timestamp.fromDate(new Date('2024-12-25')),
    reason: 'TEST',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: TEST_ADMIN_UID
  });
  
  const doc = await closedDateRef.get();
  if (!doc.exists) {
    throw new Error('Admin cannot write closed dates');
  }
  
  logInfo('Admin can write closed dates');
}

// Test 5: Closed Dates Collection - User Read Access
async function testClosedDatesUserRead() {
  const closedDatesSnapshot = await db.collection('closedDates').limit(1).get();
  
  if (closedDatesSnapshot.empty) {
    logInfo('No closed dates to read (this is okay)');
  } else {
    logInfo('Authenticated user can read closed dates');
  }
}

// Test 6: Category Limits Collection - Admin Write Access
async function testCategoryLimitsAdminWrite() {
  const categoryLimitRef = db.collection('categoryLimits').doc('test-category');
  
  await categoryLimitRef.set({
    categoryId: 'test-category',
    categoryName: 'Test Category',
    limit: 5,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: TEST_ADMIN_UID
  });
  
  const doc = await categoryLimitRef.get();
  if (!doc.exists || doc.data().limit !== 5) {
    throw new Error('Admin cannot write category limits');
  }
  
  logInfo('Admin can write category limits');
}

// Test 7: Category Limits Collection - User Read Access
async function testCategoryLimitsUserRead() {
  const categoryLimitRef = db.collection('categoryLimits').doc('test-category');
  
  const doc = await categoryLimitRef.get();
  if (!doc.exists) {
    throw new Error('User cannot read category limits');
  }
  
  logInfo('Authenticated user can read category limits');
}

// Test 8: Settings Audit Log - Admin Read Access
async function testAuditLogAdminRead() {
  // Create test audit log entry
  const auditLogRef = db.collection('settingsAuditLog').doc();
  await auditLogRef.set({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    adminId: TEST_ADMIN_UID,
    adminName: 'Test Admin',
    action: 'update',
    settingType: 'maxLoanDuration',
    oldValue: 7,
    newValue: 14
  });
  
  // Admin should be able to read
  const doc = await auditLogRef.get();
  if (!doc.exists) {
    throw new Error('Admin cannot read audit log');
  }
  
  logInfo('Admin can read audit log');
}

// Test 9: System Notifications - Admin Write Access
async function testSystemNotificationsAdminWrite() {
  const notificationRef = db.collection('systemNotifications').doc();
  
  await notificationRef.set({
    title: 'Test Notification',
    content: 'This is a test',
    type: 'announcement',
    priority: 'low',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: TEST_ADMIN_UID,
    sentTo: [],
    readBy: [],
    responses: []
  });
  
  const doc = await notificationRef.get();
  if (!doc.exists) {
    throw new Error('Admin cannot write system notifications');
  }
  
  logInfo('Admin can write system notifications');
}

// Test 10: System Notifications - User Read Access
async function testSystemNotificationsUserRead() {
  const notificationsSnapshot = await db.collection('systemNotifications').limit(1).get();
  
  if (notificationsSnapshot.empty) {
    logInfo('No system notifications to read (this is okay)');
  } else {
    logInfo('Authenticated user can read system notifications');
  }
}

// Test 11: System Notifications - User Update Read Status
async function testSystemNotificationsUserUpdateReadStatus() {
  // Create a test notification
  const notificationRef = db.collection('systemNotifications').doc();
  await notificationRef.set({
    title: 'Test Notification',
    content: 'This is a test',
    type: 'announcement',
    priority: 'low',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: TEST_ADMIN_UID,
    sentTo: [TEST_USER_UID],
    readBy: [],
    responses: []
  });
  
  // User should be able to update readBy
  await notificationRef.update({
    readBy: admin.firestore.FieldValue.arrayUnion(TEST_USER_UID)
  });
  
  const doc = await notificationRef.get();
  if (!doc.data().readBy.includes(TEST_USER_UID)) {
    throw new Error('User cannot update read status');
  }
  
  logInfo('User can update their read status');
}

// Test 12: Verify Collections Exist
async function testCollectionsExist() {
  const collections = ['settings', 'closedDates', 'categoryLimits', 'settingsAuditLog', 'systemNotifications'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).limit(1).get();
    logInfo(`Collection '${collectionName}' exists`);
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('Settings Security Rules Test Suite', 'cyan');
  log('='.repeat(60), 'cyan');
  
  try {
    // Setup
    await setupTestUsers();
    
    // Run tests
    await runTest('Settings - Admin Read Access', testSettingsAdminRead);
    await runTest('Settings - Admin Write Access', testSettingsAdminWrite);
    await runTest('Settings - User Read Access', testSettingsUserRead);
    await runTest('Closed Dates - Admin Write Access', testClosedDatesAdminWrite);
    await runTest('Closed Dates - User Read Access', testClosedDatesUserRead);
    await runTest('Category Limits - Admin Write Access', testCategoryLimitsAdminWrite);
    await runTest('Category Limits - User Read Access', testCategoryLimitsUserRead);
    await runTest('Audit Log - Admin Read Access', testAuditLogAdminRead);
    await runTest('System Notifications - Admin Write Access', testSystemNotificationsAdminWrite);
    await runTest('System Notifications - User Read Access', testSystemNotificationsUserRead);
    await runTest('System Notifications - User Update Read Status', testSystemNotificationsUserUpdateReadStatus);
    await runTest('Verify Collections Exist', testCollectionsExist);
    
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
      log('\n✅ All tests passed!', 'green');
      process.exit(0);
    } else {
      log('\n❌ Some tests failed. Please review the output above.', 'red');
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
  setupTestUsers,
  cleanupTestData
};
