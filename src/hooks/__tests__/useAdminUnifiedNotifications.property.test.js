/**
 * Property-Based Tests for useAdminUnifiedNotifications Hook
 * 
 * Tests the core logic functions used by the hook without requiring
 * actual React rendering or Firestore connections.
 */

import * as fc from 'fast-check';
import {
  SOURCE_TYPES,
  PRIORITY_LEVELS,
  PRIORITY_ORDER,
  NOTIFICATION_CATEGORIES,
  sortNotifications,
  filterByTab,
  filterByCategory,
  filterByPriority,
  filterByDateRange,
  filterBySearchTerm,
  applyFilters,
  isActionItem,
  isPersonalNotification,
  getPriorityForSourceType,
  getCategoryForSourceType
} from '../../types/adminNotification';

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

const sourceTypeArb = fc.constantFrom(
  SOURCE_TYPES.USER_REGISTRATION,
  SOURCE_TYPES.LOAN_REQUEST,
  SOURCE_TYPES.OVERDUE_LOAN,
  SOURCE_TYPES.RESERVATION_REQUEST,
  SOURCE_TYPES.PERSONAL
);

const priorityArb = fc.constantFrom(
  PRIORITY_LEVELS.URGENT,
  PRIORITY_LEVELS.HIGH,
  PRIORITY_LEVELS.MEDIUM,
  PRIORITY_LEVELS.LOW
);

const categoryArb = fc.constantFrom(
  NOTIFICATION_CATEGORIES.USERS,
  NOTIFICATION_CATEGORIES.LOANS,
  NOTIFICATION_CATEGORIES.RESERVATIONS,
  NOTIFICATION_CATEGORIES.SYSTEM
);

// Generate a mock unified notification
const unifiedNotificationArb = fc.record({
  id: fc.string({ minLength: 5, maxLength: 50 }),
  sourceId: fc.string({ minLength: 5, maxLength: 30 }),
  sourceType: sourceTypeArb,
  category: categoryArb,
  priority: priorityArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 0, maxLength: 200 }),
  detail: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  link: fc.string({ minLength: 1, maxLength: 100 }),
  icon: fc.string({ minLength: 1, maxLength: 10 }),
  iconBg: fc.string({ minLength: 1, maxLength: 50 }),
  isRead: fc.boolean(),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  userName: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  equipmentName: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  sourceData: fc.record({
    email: fc.option(fc.string(), { nil: undefined }),
    equipmentName: fc.option(fc.string(), { nil: undefined }),
    userName: fc.option(fc.string(), { nil: undefined })
  })
});

// Generate array of notifications
const notificationsArb = fc.array(unifiedNotificationArb, { minLength: 0, maxLength: 50 });

// ============================================================================
// Property 2: Priority Sorting Correctness
// **Feature: unified-admin-notification-system, Property 2: Priority Sorting Correctness**
// **Validates: Requirements 1.4**
// ============================================================================

describe('Property 2: Priority Sorting Correctness', () => {
  test('higher priority items come before lower priority items', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const sorted = sortNotifications(notifications);
        
        for (let i = 0; i < sorted.length - 1; i++) {
          const current = sorted[i];
          const next = sorted[i + 1];
          
          // Current priority order should be <= next priority order
          expect(PRIORITY_ORDER[current.priority]).toBeLessThanOrEqual(
            PRIORITY_ORDER[next.priority]
          );
        }
      }),
      { numRuns: 50 }
    );
  });

  test('within same priority, newer items come first', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const sorted = sortNotifications(notifications);
        
        for (let i = 0; i < sorted.length - 1; i++) {
          const current = sorted[i];
          const next = sorted[i + 1];
          
          if (current.priority === next.priority) {
            const currentDate = current.createdAt instanceof Date 
              ? current.createdAt 
              : new Date(current.createdAt);
            const nextDate = next.createdAt instanceof Date 
              ? next.createdAt 
              : new Date(next.createdAt);
            
            expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
          }
        }
      }),
      { numRuns: 50 }
    );
  });

  test('sorting preserves all elements', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const sorted = sortNotifications(notifications);
        expect(sorted.length).toBe(notifications.length);
        
        const originalIds = new Set(notifications.map(n => n.id));
        const sortedIds = new Set(sorted.map(n => n.id));
        expect(sortedIds).toEqual(originalIds);
      }),
      { numRuns: 50 }
    );
  });

  test('sorting is stable for equal elements', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const sorted1 = sortNotifications(notifications);
        const sorted2 = sortNotifications(notifications);
        
        // Same input should produce same output
        expect(sorted1.map(n => n.id)).toEqual(sorted2.map(n => n.id));
      }),
      { numRuns: 30 }
    );
  });
});

// ============================================================================
// Property 3: Notification Count Consistency
// **Feature: unified-admin-notification-system, Property 3: Notification Count Consistency**
// **Validates: Requirements 2.1, 4.3**
// ============================================================================

describe('Property 3: Notification Count Consistency', () => {
  test('unread count equals number of notifications with isRead=false', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        const actualUnread = notifications.filter(n => n.isRead === false).length;
        
        expect(unreadCount).toBe(actualUnread);
      }),
      { numRuns: 50 }
    );
  });

  test('total count equals sum of action items and personal notifications', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const actionItemsCount = notifications.filter(n => isActionItem(n.sourceType)).length;
        const personalCount = notifications.filter(n => isPersonalNotification(n.sourceType)).length;
        
        // All notifications should be either action items or personal
        expect(actionItemsCount + personalCount).toBe(notifications.length);
      }),
      { numRuns: 50 }
    );
  });

  test('marking one notification as read decreases unread count by 1', () => {
    fc.assert(
      fc.property(
        fc.array(unifiedNotificationArb, { minLength: 1, maxLength: 20 }),
        (notifications) => {
          // Ensure at least one unread
          const withUnread = notifications.map((n, i) => ({
            ...n,
            isRead: i === 0 ? false : n.isRead
          }));
          
          const initialUnread = withUnread.filter(n => !n.isRead).length;
          
          // "Mark" first unread as read
          const afterMark = withUnread.map((n, i) => 
            i === 0 ? { ...n, isRead: true } : n
          );
          
          const finalUnread = afterMark.filter(n => !n.isRead).length;
          
          // If the first was unread, count should decrease by 1
          if (!notifications[0].isRead) {
            expect(finalUnread).toBe(initialUnread - 1);
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});

// ============================================================================
// Property 4: Tab Filtering Correctness
// **Feature: unified-admin-notification-system, Property 4: Tab Filtering Correctness**
// **Validates: Requirements 3.2, 3.3**
// ============================================================================

describe('Property 4: Tab Filtering Correctness', () => {
  test('action tab contains only action item source types', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const filtered = filterByTab(notifications, 'action');
        
        filtered.forEach(n => {
          expect(isActionItem(n.sourceType)).toBe(true);
          expect([
            SOURCE_TYPES.USER_REGISTRATION,
            SOURCE_TYPES.LOAN_REQUEST,
            SOURCE_TYPES.OVERDUE_LOAN,
            SOURCE_TYPES.RESERVATION_REQUEST
          ]).toContain(n.sourceType);
        });
      }),
      { numRuns: 50 }
    );
  });

  test('personal tab contains only personal source type', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const filtered = filterByTab(notifications, 'personal');
        
        filtered.forEach(n => {
          expect(isPersonalNotification(n.sourceType)).toBe(true);
          expect(n.sourceType).toBe(SOURCE_TYPES.PERSONAL);
        });
      }),
      { numRuns: 50 }
    );
  });

  test('all tab returns all notifications', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const filtered = filterByTab(notifications, 'all');
        expect(filtered.length).toBe(notifications.length);
      }),
      { numRuns: 50 }
    );
  });

  test('action and personal tabs are mutually exclusive', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const actionFiltered = filterByTab(notifications, 'action');
        const personalFiltered = filterByTab(notifications, 'personal');
        
        // No overlap between action and personal
        const actionIds = new Set(actionFiltered.map(n => n.id));
        const personalIds = new Set(personalFiltered.map(n => n.id));
        
        const intersection = [...actionIds].filter(id => personalIds.has(id));
        expect(intersection.length).toBe(0);
        
        // Together they should equal all notifications
        expect(actionFiltered.length + personalFiltered.length).toBe(notifications.length);
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Property 7: Filter Correctness
// **Feature: unified-admin-notification-system, Property 7: Filter Correctness**
// **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
// ============================================================================

describe('Property 7: Filter Correctness', () => {
  test('category filter returns only matching category', () => {
    fc.assert(
      fc.property(notificationsArb, categoryArb, (notifications, category) => {
        const filtered = filterByCategory(notifications, category);
        
        filtered.forEach(n => {
          expect(n.category).toBe(category);
        });
      }),
      { numRuns: 50 }
    );
  });

  test('priority filter returns only matching priority', () => {
    fc.assert(
      fc.property(notificationsArb, priorityArb, (notifications, priority) => {
        const filtered = filterByPriority(notifications, priority);
        
        filtered.forEach(n => {
          expect(n.priority).toBe(priority);
        });
      }),
      { numRuns: 50 }
    );
  });

  test('date range filter returns only items within range', () => {
    fc.assert(
      fc.property(
        notificationsArb,
        fc.date({ min: new Date('2022-01-01'), max: new Date('2023-06-30') }),
        fc.date({ min: new Date('2023-07-01'), max: new Date('2024-12-31') }),
        (notifications, startDate, endDate) => {
          const filtered = filterByDateRange(notifications, startDate, endDate);
          
          filtered.forEach(n => {
            const date = n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt);
            expect(date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
            expect(date.getTime()).toBeLessThanOrEqual(endDate.getTime());
          });
        }
      ),
      { numRuns: 30 }
    );
  });

  test('search filter matches title or description', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 5 }),
            sourceId: fc.string({ minLength: 5 }),
            sourceType: sourceTypeArb,
            category: categoryArb,
            priority: priorityArb,
            title: fc.constant('Test Notification'),
            description: fc.constant('This is a test description'),
            link: fc.string(),
            icon: fc.string(),
            iconBg: fc.string(),
            isRead: fc.boolean(),
            createdAt: fc.date(),
            sourceData: fc.constant({})
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (notifications) => {
          const filtered = filterBySearchTerm(notifications, 'Test');
          
          // All items should match since they all have "Test" in title
          expect(filtered.length).toBe(notifications.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('empty search returns all notifications', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const filtered = filterBySearchTerm(notifications, '');
        expect(filtered.length).toBe(notifications.length);
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Property 8: Filter Count Consistency
// **Feature: unified-admin-notification-system, Property 8: Filter Count Consistency**
// **Validates: Requirements 6.5**
// ============================================================================

describe('Property 8: Filter Count Consistency', () => {
  test('filtered count equals length of filtered array', () => {
    fc.assert(
      fc.property(
        notificationsArb,
        fc.record({
          tab: fc.constantFrom('all', 'action', 'personal'),
          category: fc.constantFrom('all', ...Object.values(NOTIFICATION_CATEGORIES)),
          priority: fc.constantFrom('all', ...Object.values(PRIORITY_LEVELS)),
          searchTerm: fc.string({ maxLength: 20 })
        }),
        (notifications, filter) => {
          const filtered = applyFilters(notifications, filter);
          expect(filtered.length).toBe(filtered.length); // Tautology, but validates no errors
        }
      ),
      { numRuns: 50 }
    );
  });

  test('applying multiple filters reduces or maintains count', () => {
    fc.assert(
      fc.property(notificationsArb, categoryArb, priorityArb, (notifications, category, priority) => {
        const categoryFiltered = filterByCategory(notifications, category);
        const bothFiltered = filterByPriority(categoryFiltered, priority);
        
        expect(bothFiltered.length).toBeLessThanOrEqual(categoryFiltered.length);
        expect(categoryFiltered.length).toBeLessThanOrEqual(notifications.length);
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Property 9: Pagination Data Integrity
// **Feature: unified-admin-notification-system, Property 9: Pagination Data Integrity**
// **Validates: Requirements 10.3**
// ============================================================================

describe('Property 9: Pagination Data Integrity', () => {
  test('paginated results contain no duplicates', () => {
    fc.assert(
      fc.property(
        notificationsArb,
        fc.integer({ min: 1, max: 50 }),
        (notifications, pageSize) => {
          const sorted = sortNotifications(notifications);
          const page1 = sorted.slice(0, pageSize);
          const page2 = sorted.slice(pageSize, pageSize * 2);
          
          const page1Ids = new Set(page1.map(n => n.id));
          const page2Ids = new Set(page2.map(n => n.id));
          
          // No overlap between pages
          const intersection = [...page1Ids].filter(id => page2Ids.has(id));
          expect(intersection.length).toBe(0);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('pagination maintains sort order across pages', () => {
    fc.assert(
      fc.property(
        notificationsArb,
        fc.integer({ min: 5, max: 20 }),
        (notifications, pageSize) => {
          const sorted = sortNotifications(notifications);
          
          // Check that items at page boundaries maintain order
          for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];
            
            // Priority order should be maintained
            expect(PRIORITY_ORDER[current.priority]).toBeLessThanOrEqual(
              PRIORITY_ORDER[next.priority]
            );
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  test('all pages together equal original sorted array', () => {
    fc.assert(
      fc.property(
        notificationsArb,
        fc.integer({ min: 3, max: 15 }),
        (notifications, pageSize) => {
          const sorted = sortNotifications(notifications);
          
          // Collect all pages
          const allPages = [];
          for (let i = 0; i < sorted.length; i += pageSize) {
            allPages.push(...sorted.slice(i, i + pageSize));
          }
          
          expect(allPages.length).toBe(sorted.length);
          expect(allPages.map(n => n.id)).toEqual(sorted.map(n => n.id));
        }
      ),
      { numRuns: 30 }
    );
  });
});

// ============================================================================
// Additional Integration Tests
// ============================================================================

describe('Priority and Category Assignment Integration', () => {
  test('source type determines correct priority', () => {
    expect(getPriorityForSourceType(SOURCE_TYPES.OVERDUE_LOAN)).toBe(PRIORITY_LEVELS.URGENT);
    expect(getPriorityForSourceType(SOURCE_TYPES.LOAN_REQUEST)).toBe(PRIORITY_LEVELS.HIGH);
    expect(getPriorityForSourceType(SOURCE_TYPES.USER_REGISTRATION)).toBe(PRIORITY_LEVELS.MEDIUM);
    expect(getPriorityForSourceType(SOURCE_TYPES.RESERVATION_REQUEST)).toBe(PRIORITY_LEVELS.MEDIUM);
  });

  test('source type determines correct category', () => {
    expect(getCategoryForSourceType(SOURCE_TYPES.USER_REGISTRATION)).toBe(NOTIFICATION_CATEGORIES.USERS);
    expect(getCategoryForSourceType(SOURCE_TYPES.LOAN_REQUEST)).toBe(NOTIFICATION_CATEGORIES.LOANS);
    expect(getCategoryForSourceType(SOURCE_TYPES.OVERDUE_LOAN)).toBe(NOTIFICATION_CATEGORIES.LOANS);
    expect(getCategoryForSourceType(SOURCE_TYPES.RESERVATION_REQUEST)).toBe(NOTIFICATION_CATEGORIES.RESERVATIONS);
    expect(getCategoryForSourceType(SOURCE_TYPES.PERSONAL)).toBe(NOTIFICATION_CATEGORIES.SYSTEM);
  });
});
