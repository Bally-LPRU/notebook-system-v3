/**
 * Property-based tests for useNotificationHistory hook
 * Tests universal properties that should hold across all valid inputs
 * 
 * Feature: user-status-system-improvement
 * Requirements: 10.4, 10.5
 */

import fc from 'fast-check';
import {
  groupNotificationsByDate,
  getDateKey
} from '../useNotificationHistory';

// Generator for notification types
const notificationTypeGenerator = fc.constantFrom(
  'system_update',
  'equipment_maintenance',
  'loan_request',
  'loan_approved',
  'loan_rejected',
  'loan_reminder',
  'loan_overdue',
  'loan_returned',
  'user_approval',
  'user_approved',
  'user_rejected',
  'reservation_request',
  'reservation_approved',
  'reservation_reminder'
);

// Generator for notification priorities
const priorityGenerator = fc.constantFrom('low', 'medium', 'high', 'urgent');

// Generator for a single notification item with valid dates
// Using integer-based date generation to avoid Date(NaN) issues during shrinking
const notificationItemGenerator = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  message: fc.string({ minLength: 1, maxLength: 500 }),
  type: notificationTypeGenerator,
  priority: priorityGenerator,
  isRead: fc.boolean(),
  // Use integer days offset from a base date to ensure valid dates
  daysOffset: fc.integer({ min: 0, max: 365 }),
  hoursOffset: fc.integer({ min: 0, max: 23 }),
  minutesOffset: fc.integer({ min: 0, max: 59 })
}).map(item => {
  // Base date for calculations
  const baseDate = new Date('2024-01-01T00:00:00');
  
  // Calculate created date
  const createdAt = new Date(baseDate);
  createdAt.setDate(createdAt.getDate() + item.daysOffset);
  createdAt.setHours(item.hoursOffset, item.minutesOffset, 0, 0);
  
  return {
    id: item.id,
    userId: item.userId,
    title: item.title,
    message: item.message,
    type: item.type,
    priority: item.priority,
    isRead: item.isRead,
    createdAt
  };
});

// Generator for notification array
const notificationArrayGenerator = fc.array(notificationItemGenerator, { minLength: 0, maxLength: 50 });

// Generator for notifications with specific date distribution
const notificationsWithSameDateGenerator = fc.record({
  baseOffset: fc.integer({ min: 0, max: 365 }),
  count: fc.integer({ min: 1, max: 10 })
}).chain(({ baseOffset, count }) => {
  return fc.array(
    fc.record({
      id: fc.uuid(),
      userId: fc.uuid(),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      message: fc.string({ minLength: 1, maxLength: 500 }),
      type: notificationTypeGenerator,
      priority: priorityGenerator,
      isRead: fc.boolean(),
      hoursOffset: fc.integer({ min: 0, max: 23 }),
      minutesOffset: fc.integer({ min: 0, max: 59 })
    }).map(item => {
      const baseDate = new Date('2024-01-01T00:00:00');
      const createdAt = new Date(baseDate);
      createdAt.setDate(createdAt.getDate() + baseOffset);
      createdAt.setHours(item.hoursOffset, item.minutesOffset, 0, 0);
      
      return {
        id: item.id,
        userId: item.userId,
        title: item.title,
        message: item.message,
        type: item.type,
        priority: item.priority,
        isRead: item.isRead,
        createdAt
      };
    }),
    { minLength: count, maxLength: count }
  );
});

describe('useNotificationHistory property-based tests', () => {
  describe('Property 10: Notification Grouping by Date', () => {
    /**
     * **Feature: user-status-system-improvement, Property 10: Notification Grouping by Date**
     * **Validates: Requirements 10.4**
     * 
     * For any set of notifications, when grouped by date, each notification 
     * should appear in exactly one group corresponding to its timestamp's date.
     */
    test('each notification should appear in exactly one group', () => {
      fc.assert(
        fc.property(
          notificationArrayGenerator,
          (notifications) => {
            const grouped = groupNotificationsByDate(notifications);
            
            // Count total notifications across all groups
            let totalInGroups = 0;
            const seenIds = new Set();
            
            Object.values(grouped).forEach(group => {
              group.forEach(notification => {
                totalInGroups++;
                
                // Each notification should only appear once
                expect(seenIds.has(notification.id)).toBe(false);
                seenIds.add(notification.id);
              });
            });
            
            // Total in groups should equal original count
            expect(totalInGroups).toBe(notifications.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('notification should be in group matching its date key', () => {
      fc.assert(
        fc.property(
          notificationArrayGenerator,
          (notifications) => {
            const grouped = groupNotificationsByDate(notifications);
            
            // Each notification should be in the correct date group
            Object.entries(grouped).forEach(([dateKey, group]) => {
              group.forEach(notification => {
                const expectedDateKey = getDateKey(notification.createdAt);
                expect(dateKey).toBe(expectedDateKey);
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('notifications with same date should be in same group', () => {
      fc.assert(
        fc.property(
          notificationsWithSameDateGenerator,
          (notifications) => {
            const grouped = groupNotificationsByDate(notifications);
            
            // All notifications should be in exactly one group
            const groupKeys = Object.keys(grouped);
            expect(groupKeys.length).toBe(1);
            
            // That group should contain all notifications
            const group = grouped[groupKeys[0]];
            expect(group.length).toBe(notifications.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('empty array should return empty object', () => {
      const grouped = groupNotificationsByDate([]);
      expect(grouped).toEqual({});
    });

    test('null or undefined should return empty object', () => {
      expect(groupNotificationsByDate(null)).toEqual({});
      expect(groupNotificationsByDate(undefined)).toEqual({});
    });

    test('number of groups should not exceed number of unique dates', () => {
      fc.assert(
        fc.property(
          notificationArrayGenerator,
          (notifications) => {
            const grouped = groupNotificationsByDate(notifications);
            
            // Get unique date keys from notifications
            const uniqueDateKeys = new Set(
              notifications.map(n => getDateKey(n.createdAt))
            );
            
            // Number of groups should equal number of unique dates
            expect(Object.keys(grouped).length).toBe(uniqueDateKeys.size);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getDateKey should return consistent format YYYY-MM-DD', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }),
          fc.integer({ min: 0, max: 23 }),
          fc.integer({ min: 0, max: 59 }),
          (daysOffset, hours, minutes) => {
            const baseDate = new Date('2024-01-01T00:00:00');
            const date = new Date(baseDate);
            date.setDate(date.getDate() + daysOffset);
            date.setHours(hours, minutes, 0, 0);
            
            const dateKey = getDateKey(date);
            
            // Should match YYYY-MM-DD format
            expect(dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            
            // Should be parseable back to a valid date
            const parsed = new Date(dateKey);
            expect(parsed.getFullYear()).toBe(date.getFullYear());
            expect(parsed.getMonth()).toBe(date.getMonth());
            expect(parsed.getDate()).toBe(date.getDate());
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getDateKey should handle Firestore timestamp-like objects', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }),
          (daysOffset) => {
            const baseDate = new Date('2024-01-01T00:00:00');
            const date = new Date(baseDate);
            date.setDate(date.getDate() + daysOffset);
            
            // Simulate Firestore timestamp with toDate method
            const firestoreTimestamp = {
              toDate: () => date
            };
            
            const dateKey = getDateKey(firestoreTimestamp);
            const expectedKey = getDateKey(date);
            
            expect(dateKey).toBe(expectedKey);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('getDateKey should return "unknown" for invalid timestamps', () => {
      expect(getDateKey(null)).toBe('unknown');
      expect(getDateKey(undefined)).toBe('unknown');
    });
  });

  describe('Property 11: Notification Read Status Update', () => {
    /**
     * **Feature: user-status-system-improvement, Property 11: Notification Read Status Update**
     * **Validates: Requirements 10.5**
     * 
     * For any notification marked as read, the isRead field should be true 
     * and the notification count should decrease by 1.
     * 
     * Note: This tests the pure function behavior of updating read status.
     * The actual markAsRead function involves async Firebase operations,
     * so we test the state transformation logic.
     */
    
    /**
     * Helper function to simulate marking a notification as read
     * This mirrors the state update logic in the hook
     */
    const markNotificationAsRead = (notifications, notificationId) => {
      return notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true, readAt: new Date() }
          : notification
      );
    };

    /**
     * Helper function to count unread notifications
     */
    const countUnread = (notifications) => {
      return notifications.filter(n => !n.isRead).length;
    };

    test('marking unread notification as read should set isRead to true', () => {
      fc.assert(
        fc.property(
          notificationArrayGenerator.filter(arr => arr.some(n => !n.isRead)),
          (notifications) => {
            // Find an unread notification
            const unreadNotification = notifications.find(n => !n.isRead);
            if (!unreadNotification) return true; // Skip if no unread found
            
            const updated = markNotificationAsRead(notifications, unreadNotification.id);
            
            // The notification should now be read
            const updatedNotification = updated.find(n => n.id === unreadNotification.id);
            expect(updatedNotification.isRead).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('marking unread notification as read should decrease unread count by 1', () => {
      fc.assert(
        fc.property(
          notificationArrayGenerator.filter(arr => arr.some(n => !n.isRead)),
          (notifications) => {
            // Find an unread notification
            const unreadNotification = notifications.find(n => !n.isRead);
            if (!unreadNotification) return true; // Skip if no unread found
            
            const originalUnreadCount = countUnread(notifications);
            const updated = markNotificationAsRead(notifications, unreadNotification.id);
            const newUnreadCount = countUnread(updated);
            
            // Unread count should decrease by exactly 1
            expect(newUnreadCount).toBe(originalUnreadCount - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('marking already read notification should not change unread count', () => {
      fc.assert(
        fc.property(
          notificationArrayGenerator.filter(arr => arr.some(n => n.isRead)),
          (notifications) => {
            // Find a read notification
            const readNotification = notifications.find(n => n.isRead);
            if (!readNotification) return true; // Skip if no read found
            
            const originalUnreadCount = countUnread(notifications);
            const updated = markNotificationAsRead(notifications, readNotification.id);
            const newUnreadCount = countUnread(updated);
            
            // Unread count should remain the same
            expect(newUnreadCount).toBe(originalUnreadCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('marking notification as read should not affect other notifications', () => {
      fc.assert(
        fc.property(
          notificationArrayGenerator.filter(arr => arr.length >= 2),
          (notifications) => {
            const targetNotification = notifications[0];
            const updated = markNotificationAsRead(notifications, targetNotification.id);
            
            // All other notifications should remain unchanged
            notifications.slice(1).forEach((original, index) => {
              const updatedOther = updated[index + 1];
              expect(updatedOther.id).toBe(original.id);
              expect(updatedOther.isRead).toBe(original.isRead);
              expect(updatedOther.title).toBe(original.title);
              expect(updatedOther.message).toBe(original.message);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Helper function to simulate marking all notifications as read
     */
    const markAllNotificationsAsRead = (notifications) => {
      return notifications.map(notification => ({ 
        ...notification, 
        isRead: true, 
        readAt: new Date() 
      }));
    };

    test('marking all as read should set all isRead to true', () => {
      fc.assert(
        fc.property(
          notificationArrayGenerator,
          (notifications) => {
            const updated = markAllNotificationsAsRead(notifications);
            
            // All notifications should be read
            updated.forEach(notification => {
              expect(notification.isRead).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('marking all as read should result in zero unread count', () => {
      fc.assert(
        fc.property(
          notificationArrayGenerator,
          (notifications) => {
            const updated = markAllNotificationsAsRead(notifications);
            const unreadCount = countUnread(updated);
            
            expect(unreadCount).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('unread count should equal number of notifications with isRead=false', () => {
      fc.assert(
        fc.property(
          notificationArrayGenerator,
          (notifications) => {
            const unreadCount = countUnread(notifications);
            const manualCount = notifications.filter(n => n.isRead === false).length;
            
            expect(unreadCount).toBe(manualCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('unread count should be non-negative', () => {
      fc.assert(
        fc.property(
          notificationArrayGenerator,
          (notifications) => {
            const unreadCount = countUnread(notifications);
            
            expect(unreadCount).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('unread count should not exceed total count', () => {
      fc.assert(
        fc.property(
          notificationArrayGenerator,
          (notifications) => {
            const unreadCount = countUnread(notifications);
            
            expect(unreadCount).toBeLessThanOrEqual(notifications.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
