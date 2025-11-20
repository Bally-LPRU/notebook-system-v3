/**
 * Property-Based Tests for System Notifications
 * Feature: admin-settings-system
 * 
 * Tests universal properties that should hold for system notification operations.
 */

import fc from 'fast-check';
import settingsService from '../settingsService';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../types/settings';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  deleteDoc,
  doc,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';

// Test timeout
const TEST_TIMEOUT = 30000;

// Generators for property-based testing
const notificationTypeArb = fc.constantFrom(
  NOTIFICATION_TYPES.ANNOUNCEMENT,
  NOTIFICATION_TYPES.FEEDBACK_REQUEST,
  NOTIFICATION_TYPES.ALERT
);

const notificationPriorityArb = fc.constantFrom(
  NOTIFICATION_PRIORITIES.LOW,
  NOTIFICATION_PRIORITIES.MEDIUM,
  NOTIFICATION_PRIORITIES.HIGH
);

// Generator for non-empty strings (excluding whitespace-only)
const nonEmptyStringArb = (minLength, maxLength) => 
  fc.string({ minLength, maxLength })
    .filter(s => s.trim().length > 0);

const notificationDataArb = fc.record({
  title: nonEmptyStringArb(1, 100),
  content: nonEmptyStringArb(1, 500),
  type: notificationTypeArb,
  priority: notificationPriorityArb,
  feedbackEnabled: fc.boolean(),
  feedbackQuestion: fc.option(nonEmptyStringArb(1, 200), { nil: null }),
  expiresAt: fc.option(
    fc.date({ min: new Date(Date.now() + 86400000) }), // At least 1 day in future
    { nil: null }
  )
});

// Helper to create test users
const createTestUsers = async (count) => {
  const users = [];
  const usersRef = collection(db, 'users');
  
  for (let i = 0; i < count; i++) {
    const userId = `test-user-${Date.now()}-${i}`;
    const userData = {
      uid: userId,
      email: `test${i}@example.com`,
      status: 'approved',
      role: 'user',
      createdAt: new Date()
    };
    
    await settingsService._retryOperation(async () => {
      const userDoc = doc(db, 'users', userId);
      await setDoc(userDoc, userData);
    });
    
    users.push({ id: userId, ...userData });
  }
  
  return users;
};

// Helper to cleanup test data
const cleanupTestData = async () => {
  try {
    // Clean up test users
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('email', '>=', 'test'), where('email', '<', 'tesu'));
    const usersSnapshot = await getDocs(usersQuery);
    
    const batch = writeBatch(db);
    usersSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Clean up test notifications
    const notificationsRef = collection(db, 'systemNotifications');
    const notificationsSnapshot = await getDocs(notificationsRef);
    
    notificationsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.title?.includes('Test') || data.createdBy?.includes('test')) {
        batch.delete(doc.ref);
      }
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

describe('System Notifications Property-Based Tests', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  /**
   * Feature: admin-settings-system, Property 14: System notification persistence and delivery
   * Validates: Requirements 7.2, 7.3
   * 
   * Property: For any valid notification data and admin ID, when a system notification is created,
   * the system should store it with timestamp and author information, and deliver it to all active users.
   */
  test(
    'Property 14: System notification persistence and delivery',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          notificationDataArb,
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.integer({ min: 1, max: 5 }),
          async (notificationData, adminId, userCount) => {
            // Ensure feedbackQuestion is set if feedbackEnabled is true
            const validNotificationData = {
              ...notificationData,
              feedbackQuestion: notificationData.feedbackEnabled 
                ? (notificationData.feedbackQuestion || 'Test feedback question?')
                : null
            };

            // Create test users
            const testUsers = await createTestUsers(userCount);
            const testAdminId = `test-admin-${adminId}`;

            try {
              // Create system notification
              const result = await settingsService.createSystemNotification(
                validNotificationData,
                testAdminId
              );

              // Verify notification was created with correct data
              expect(result).toBeDefined();
              expect(result.id).toBeDefined();
              expect(result.title).toBe(validNotificationData.title);
              expect(result.content).toBe(validNotificationData.content);
              expect(result.type).toBe(validNotificationData.type);
              expect(result.priority).toBe(validNotificationData.priority);
              expect(result.createdBy).toBe(testAdminId);
              expect(result.feedbackEnabled).toBe(validNotificationData.feedbackEnabled);
              
              // Verify it was delivered to all active users
              expect(result.sentCount).toBe(userCount);
              expect(result.sentTo).toHaveLength(userCount);
              
              // Verify all test users are in sentTo list
              testUsers.forEach(user => {
                expect(result.sentTo).toContain(user.id);
              });

              // Verify notification can be retrieved
              const notifications = await settingsService.getSystemNotifications();
              const createdNotification = notifications.find(n => n.id === result.id);
              
              expect(createdNotification).toBeDefined();
              expect(createdNotification.title).toBe(validNotificationData.title);
              expect(createdNotification.deliveryStats.sent).toBe(userCount);

              return true;
            } finally {
              // Cleanup test users
              const batch = writeBatch(db);
              testUsers.forEach(user => {
                batch.delete(doc(db, 'users', user.id));
              });
              await batch.commit();
            }
          }
        ),
        { numRuns: 10, timeout: TEST_TIMEOUT }
      );
    },
    TEST_TIMEOUT
  );
});
