/**
 * Property-Based Tests for Unread System Notifications
 * Feature: admin-settings-system
 * 
 * Tests universal properties for unread notification display on user login.
 */

import fc from 'fast-check';
import settingsService from '../settingsService';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../types/settings';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  writeBatch,
  setDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';

// Test timeout
const TEST_TIMEOUT = 30000;

const sanitizeUserId = (userId) => {
  if (typeof userId !== 'string') {
    return 'test-user';
  }

  const normalized = userId.replace(/[^a-zA-Z0-9_-]/g, '').trim().toLowerCase();
  return normalized.length > 0 ? normalized : 'test-user';
};

// Helper to create a test user
const createTestUser = async (userId) => {
  const userData = {
    uid: userId,
    email: `${userId}@example.com`,
    status: 'approved',
    role: 'user',
    createdAt: new Date()
  };
  
  const userDoc = doc(db, 'users', userId);
  await setDoc(userDoc, userData);
  
  return userData;
};

// Helper to create a system notification directly in Firestore
const createSystemNotificationDirect = async (notificationData, userIds) => {
  const notificationsRef = collection(db, 'systemNotifications');
  const notificationDoc = await addDoc(notificationsRef, {
    ...notificationData,
    createdAt: serverTimestamp(),
    sentTo: userIds,
    readBy: [],
    responses: []
  });
  
  return notificationDoc.id;
};

// Helper to cleanup test data
const cleanupTestData = async () => {
  try {
    const batch = writeBatch(db);
    
    // Clean up test users
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('email', '>=', 'test'), where('email', '<', 'tesu'));
    const usersSnapshot = await getDocs(usersQuery);
    
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

describe('Unread System Notifications Property-Based Tests', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  /**
   * Feature: admin-settings-system, Property 15: Unread notification display
   * Validates: Requirements 7.4
   * 
   * Property: For any user login event, the system should display all system notifications
   * that the user has not yet read (i.e., notifications where the user is in sentTo but not in readBy).
   */
  test(
    'Property 15: Unread notification display',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 0, max: 4 }),
          async (userId, totalNotifications, readCount) => {
            // Ensure readCount doesn't exceed totalNotifications
            const actualReadCount = Math.min(readCount, totalNotifications);
            const testUserId = `test-user-${sanitizeUserId(userId)}`;

            try {
              // Create test user
              await createTestUser(testUserId);

              // Create notifications
              const notificationIds = [];
              for (let i = 0; i < totalNotifications; i++) {
                const notificationData = {
                  title: `Test Notification ${i}`,
                  content: `Test content ${i}`,
                  type: NOTIFICATION_TYPES.ANNOUNCEMENT,
                  priority: NOTIFICATION_PRIORITIES.MEDIUM,
                  createdBy: 'test-admin',
                  feedbackEnabled: false,
                  feedbackQuestion: null,
                  expiresAt: null
                };

                const notificationId = await createSystemNotificationDirect(
                  notificationData,
                  [testUserId]
                );
                notificationIds.push(notificationId);
              }

              // Mark some notifications as read
              for (let i = 0; i < actualReadCount; i++) {
                await settingsService.markSystemNotificationAsRead(
                  notificationIds[i],
                  testUserId
                );
              }

              // Get unread notifications
              const unreadNotifications = await settingsService.getUnreadSystemNotifications(testUserId);

              // Verify the count of unread notifications
              const expectedUnreadCount = totalNotifications - actualReadCount;
              expect(unreadNotifications).toHaveLength(expectedUnreadCount);

              // Verify all returned notifications are actually unread
              unreadNotifications.forEach(notification => {
                expect(notification.sentTo).toContain(testUserId);
                expect(notification.readBy || []).not.toContain(testUserId);
              });

              // Verify read notifications are not in the unread list
              const unreadIds = unreadNotifications.map(n => n.id);
              for (let i = 0; i < actualReadCount; i++) {
                expect(unreadIds).not.toContain(notificationIds[i]);
              }

              return true;
            } finally {
              // Cleanup
              const batch = writeBatch(db);
              batch.delete(doc(db, 'users', testUserId));
              
              for (const notificationId of notificationIds) {
                batch.delete(doc(db, 'systemNotifications', notificationId));
              }
              
              await batch.commit();
            }
          }
        ),
        { numRuns: 10, timeout: TEST_TIMEOUT }
      );
    },
    TEST_TIMEOUT
  );

  /**
   * Additional property: Expired notifications should not be displayed
   */
  test(
    'Property 15b: Expired notifications are not displayed as unread',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }),
          async (userId) => {
            const testUserId = `test-user-${sanitizeUserId(userId)}`;

            try {
              // Create test user
              await createTestUser(testUserId);

              // Create an expired notification
              const expiredNotificationData = {
                title: 'Expired Test Notification',
                content: 'This notification has expired',
                type: NOTIFICATION_TYPES.ANNOUNCEMENT,
                priority: NOTIFICATION_PRIORITIES.LOW,
                createdBy: 'test-admin',
                feedbackEnabled: false,
                feedbackQuestion: null,
                expiresAt: new Date(Date.now() - 86400000) // Expired yesterday
              };

              const expiredNotificationId = await createSystemNotificationDirect(
                expiredNotificationData,
                [testUserId]
              );

              // Create a non-expired notification
              const validNotificationData = {
                title: 'Valid Test Notification',
                content: 'This notification is still valid',
                type: NOTIFICATION_TYPES.ANNOUNCEMENT,
                priority: NOTIFICATION_PRIORITIES.LOW,
                createdBy: 'test-admin',
                feedbackEnabled: false,
                feedbackQuestion: null,
                expiresAt: null
              };

              const validNotificationId = await createSystemNotificationDirect(
                validNotificationData,
                [testUserId]
              );

              // Get unread notifications
              const unreadNotifications = await settingsService.getUnreadSystemNotifications(testUserId);

              // Verify only the non-expired notification is returned
              expect(unreadNotifications).toHaveLength(1);
              expect(unreadNotifications[0].id).toBe(validNotificationId);
              expect(unreadNotifications[0].title).toBe('Valid Test Notification');

              // Verify expired notification is not in the list
              const unreadIds = unreadNotifications.map(n => n.id);
              expect(unreadIds).not.toContain(expiredNotificationId);

              return true;
            } finally {
              // Cleanup
              const batch = writeBatch(db);
              batch.delete(doc(db, 'users', testUserId));
              
              const notificationsRef = collection(db, 'systemNotifications');
              const notificationsSnapshot = await getDocs(notificationsRef);
              notificationsSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.title?.includes('Test')) {
                  batch.delete(doc.ref);
                }
              });
              
              await batch.commit();
            }
          }
        ),
        { numRuns: 5, timeout: TEST_TIMEOUT }
      );
    },
    TEST_TIMEOUT
  );

});
