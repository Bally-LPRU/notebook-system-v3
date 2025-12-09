/**
 * Property-Based Tests for Admin Notification Types
 * 
 * **Feature: unified-admin-notification-system, Property 1: Priority Assignment Correctness**
 * **Validates: Requirements 1.3**
 * 
 * Tests that priority assignment is correct for all source types:
 * - urgent for overdue_loan
 * - high for loan_request
 * - medium for user_registration and reservation_request
 * - original priority for personal notifications (if valid)
 */

import * as fc from 'fast-check';
import {
  SOURCE_TYPES,
  PRIORITY_LEVELS,
  PRIORITY_ORDER,
  getPriorityForSourceType,
  getCategoryForSourceType,
  isValidSourceType,
  isValidCategory,
  isValidPriority,
  isActionItem,
  isPersonalNotification,
  compareNotifications,
  sortNotifications,
  createNotificationId,
  parseNotificationId,
  filterByTab,
  filterByCategory,
  filterByPriority,
  filterBySearchTerm,
  NOTIFICATION_CATEGORIES
} from '../adminNotification';

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

// Generate valid source types
const sourceTypeArb = fc.constantFrom(
  SOURCE_TYPES.USER_REGISTRATION,
  SOURCE_TYPES.LOAN_REQUEST,
  SOURCE_TYPES.OVERDUE_LOAN,
  SOURCE_TYPES.RESERVATION_REQUEST,
  SOURCE_TYPES.PERSONAL
);

// Generate valid priority levels
const priorityArb = fc.constantFrom(
  PRIORITY_LEVELS.URGENT,
  PRIORITY_LEVELS.HIGH,
  PRIORITY_LEVELS.MEDIUM,
  PRIORITY_LEVELS.LOW
);

// Generate valid categories
const categoryArb = fc.constantFrom(
  NOTIFICATION_CATEGORIES.USERS,
  NOTIFICATION_CATEGORIES.LOANS,
  NOTIFICATION_CATEGORIES.RESERVATIONS,
  NOTIFICATION_CATEGORIES.SYSTEM
);

// Generate a mock notification
const notificationArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  sourceType: sourceTypeArb,
  priority: priorityArb,
  category: categoryArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 0, maxLength: 200 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  isRead: fc.boolean()
});

// Generate array of notifications
const notificationsArb = fc.array(notificationArb, { minLength: 0, maxLength: 50 });

// ============================================================================
// Property 1: Priority Assignment Correctness
// **Feature: unified-admin-notification-system, Property 1: Priority Assignment Correctness**
// **Validates: Requirements 1.3**
// ============================================================================

describe('Property 1: Priority Assignment Correctness', () => {
  test('overdue_loan always gets urgent priority', () => {
    fc.assert(
      fc.property(priorityArb, (originalPriority) => {
        const result = getPriorityForSourceType(SOURCE_TYPES.OVERDUE_LOAN, originalPriority);
        expect(result).toBe(PRIORITY_LEVELS.URGENT);
      }),
      { numRuns: 100 }
    );
  });

  test('loan_request always gets high priority', () => {
    fc.assert(
      fc.property(priorityArb, (originalPriority) => {
        const result = getPriorityForSourceType(SOURCE_TYPES.LOAN_REQUEST, originalPriority);
        expect(result).toBe(PRIORITY_LEVELS.HIGH);
      }),
      { numRuns: 100 }
    );
  });

  test('user_registration always gets medium priority', () => {
    fc.assert(
      fc.property(priorityArb, (originalPriority) => {
        const result = getPriorityForSourceType(SOURCE_TYPES.USER_REGISTRATION, originalPriority);
        expect(result).toBe(PRIORITY_LEVELS.MEDIUM);
      }),
      { numRuns: 100 }
    );
  });

  test('reservation_request always gets medium priority', () => {
    fc.assert(
      fc.property(priorityArb, (originalPriority) => {
        const result = getPriorityForSourceType(SOURCE_TYPES.RESERVATION_REQUEST, originalPriority);
        expect(result).toBe(PRIORITY_LEVELS.MEDIUM);
      }),
      { numRuns: 100 }
    );
  });

  test('personal notifications use original priority if valid', () => {
    fc.assert(
      fc.property(priorityArb, (originalPriority) => {
        const result = getPriorityForSourceType(SOURCE_TYPES.PERSONAL, originalPriority);
        expect(result).toBe(originalPriority);
      }),
      { numRuns: 100 }
    );
  });

  test('personal notifications default to medium if original priority is invalid', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(null), fc.constant(undefined), fc.string()),
        (invalidPriority) => {
          // Skip if the random string happens to be a valid priority
          if (isValidPriority(invalidPriority)) return true;
          
          const result = getPriorityForSourceType(SOURCE_TYPES.PERSONAL, invalidPriority);
          expect(result).toBe(PRIORITY_LEVELS.MEDIUM);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('unknown source types get low priority', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !isValidSourceType(s)),
        (unknownType) => {
          const result = getPriorityForSourceType(unknownType);
          expect(result).toBe(PRIORITY_LEVELS.LOW);
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Type Guard Tests
// ============================================================================

describe('Type Guards', () => {
  test('isValidSourceType returns true for all valid source types', () => {
    fc.assert(
      fc.property(sourceTypeArb, (sourceType) => {
        expect(isValidSourceType(sourceType)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  test('isValidSourceType returns false for invalid source types', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !Object.values(SOURCE_TYPES).includes(s)),
        (invalidType) => {
          expect(isValidSourceType(invalidType)).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('isValidPriority returns true for all valid priorities', () => {
    fc.assert(
      fc.property(priorityArb, (priority) => {
        expect(isValidPriority(priority)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  test('isValidCategory returns true for all valid categories', () => {
    fc.assert(
      fc.property(categoryArb, (category) => {
        expect(isValidCategory(category)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  test('isActionItem returns true only for action item source types', () => {
    const actionItemTypes = [
      SOURCE_TYPES.USER_REGISTRATION,
      SOURCE_TYPES.LOAN_REQUEST,
      SOURCE_TYPES.OVERDUE_LOAN,
      SOURCE_TYPES.RESERVATION_REQUEST
    ];

    fc.assert(
      fc.property(sourceTypeArb, (sourceType) => {
        const expected = actionItemTypes.includes(sourceType);
        expect(isActionItem(sourceType)).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  test('isPersonalNotification returns true only for personal source type', () => {
    fc.assert(
      fc.property(sourceTypeArb, (sourceType) => {
        const expected = sourceType === SOURCE_TYPES.PERSONAL;
        expect(isPersonalNotification(sourceType)).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Category Assignment Tests
// ============================================================================

describe('Category Assignment', () => {
  test('user_registration maps to users category', () => {
    expect(getCategoryForSourceType(SOURCE_TYPES.USER_REGISTRATION)).toBe(NOTIFICATION_CATEGORIES.USERS);
  });

  test('loan_request maps to loans category', () => {
    expect(getCategoryForSourceType(SOURCE_TYPES.LOAN_REQUEST)).toBe(NOTIFICATION_CATEGORIES.LOANS);
  });

  test('overdue_loan maps to loans category', () => {
    expect(getCategoryForSourceType(SOURCE_TYPES.OVERDUE_LOAN)).toBe(NOTIFICATION_CATEGORIES.LOANS);
  });

  test('reservation_request maps to reservations category', () => {
    expect(getCategoryForSourceType(SOURCE_TYPES.RESERVATION_REQUEST)).toBe(NOTIFICATION_CATEGORIES.RESERVATIONS);
  });

  test('personal maps to system category', () => {
    expect(getCategoryForSourceType(SOURCE_TYPES.PERSONAL)).toBe(NOTIFICATION_CATEGORIES.SYSTEM);
  });

  test('all source types map to valid categories', () => {
    fc.assert(
      fc.property(sourceTypeArb, (sourceType) => {
        const category = getCategoryForSourceType(sourceType);
        expect(isValidCategory(category)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Notification ID Tests
// ============================================================================

describe('Notification ID Functions', () => {
  test('createNotificationId and parseNotificationId are inverse operations', () => {
    fc.assert(
      fc.property(
        sourceTypeArb,
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('_')),
        (sourceType, sourceId) => {
          const notificationId = createNotificationId(sourceType, sourceId);
          const parsed = parseNotificationId(notificationId);
          
          expect(parsed.sourceType).toBe(sourceType);
          expect(parsed.sourceId).toBe(sourceId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('parseNotificationId handles IDs with underscores', () => {
    fc.assert(
      fc.property(
        sourceTypeArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        (sourceType, sourceId) => {
          const notificationId = createNotificationId(sourceType, sourceId);
          const parsed = parseNotificationId(notificationId);
          
          expect(parsed.sourceType).toBe(sourceType);
          expect(parsed.sourceId).toBe(sourceId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Sorting Tests (Property 2 preparation)
// ============================================================================

describe('Notification Sorting', () => {
  test('sortNotifications does not mutate input array', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const original = [...notifications];
        sortNotifications(notifications);
        expect(notifications).toEqual(original);
      }),
      { numRuns: 50 }
    );
  });

  test('sortNotifications returns array of same length', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const sorted = sortNotifications(notifications);
        expect(sorted.length).toBe(notifications.length);
      }),
      { numRuns: 50 }
    );
  });

  test('sortNotifications maintains all original elements', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const sorted = sortNotifications(notifications);
        const originalIds = new Set(notifications.map(n => n.id));
        const sortedIds = new Set(sorted.map(n => n.id));
        expect(sortedIds).toEqual(originalIds);
      }),
      { numRuns: 50 }
    );
  });

  test('higher priority items come before lower priority items', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const sorted = sortNotifications(notifications);
        
        for (let i = 0; i < sorted.length - 1; i++) {
          const current = sorted[i];
          const next = sorted[i + 1];
          
          // Current priority order should be <= next priority order
          // (lower order number = higher priority)
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
          
          // If same priority, current date should be >= next date (newer first)
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
});

// ============================================================================
// Filter Tests (Property 4 & 7 preparation)
// ============================================================================

describe('Tab Filtering', () => {
  test('filterByTab with "all" returns all notifications', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const filtered = filterByTab(notifications, 'all');
        expect(filtered.length).toBe(notifications.length);
      }),
      { numRuns: 50 }
    );
  });

  test('filterByTab with "action" returns only action items', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const filtered = filterByTab(notifications, 'action');
        filtered.forEach(n => {
          expect(isActionItem(n.sourceType)).toBe(true);
        });
      }),
      { numRuns: 50 }
    );
  });

  test('filterByTab with "personal" returns only personal notifications', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const filtered = filterByTab(notifications, 'personal');
        filtered.forEach(n => {
          expect(isPersonalNotification(n.sourceType)).toBe(true);
        });
      }),
      { numRuns: 50 }
    );
  });
});

describe('Category Filtering', () => {
  test('filterByCategory with "all" returns all notifications', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const filtered = filterByCategory(notifications, 'all');
        expect(filtered.length).toBe(notifications.length);
      }),
      { numRuns: 50 }
    );
  });

  test('filterByCategory returns only matching category', () => {
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
});

describe('Priority Filtering', () => {
  test('filterByPriority with "all" returns all notifications', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const filtered = filterByPriority(notifications, 'all');
        expect(filtered.length).toBe(notifications.length);
      }),
      { numRuns: 50 }
    );
  });

  test('filterByPriority returns only matching priority', () => {
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
});

describe('Search Filtering', () => {
  test('filterBySearchTerm with empty string returns all notifications', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const filtered = filterBySearchTerm(notifications, '');
        expect(filtered.length).toBe(notifications.length);
      }),
      { numRuns: 50 }
    );
  });

  test('filterBySearchTerm with whitespace only returns all notifications', () => {
    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        const filtered = filterBySearchTerm(notifications, '   ');
        expect(filtered.length).toBe(notifications.length);
      }),
      { numRuns: 50 }
    );
  });

  test('filterBySearchTerm matches title', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            sourceType: sourceTypeArb,
            priority: priorityArb,
            category: categoryArb,
            title: fc.constant('Test Notification Title'),
            description: fc.string(),
            createdAt: fc.date(),
            isRead: fc.boolean()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (notifications) => {
          const filtered = filterBySearchTerm(notifications, 'Test Notification');
          expect(filtered.length).toBe(notifications.length);
        }
      ),
      { numRuns: 20 }
    );
  });
});
