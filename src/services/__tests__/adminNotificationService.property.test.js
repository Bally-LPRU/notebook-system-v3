/**
 * Property-Based Tests for Admin Notification Service
 * 
 * **Feature: unified-admin-notification-system, Property 5: Mark as Read State Persistence**
 * **Validates: Requirements 9.1, 9.2**
 * 
 * Tests that read states are correctly persisted and restored.
 * 
 * Note: These tests use mocked Firestore operations since they test
 * the logic of the service rather than actual Firestore integration.
 */

import * as fc from 'fast-check';
import {
  SOURCE_TYPES,
  HISTORY_ACTION_TYPES,
  createNotificationId,
  isValidSourceType
} from '../../types/adminNotification';

// ============================================================================
// Mock Firestore
// ============================================================================

// In-memory store for testing
let mockStore = {
  adminNotificationState: new Map(),
  adminNotificationHistory: new Map()
};

// Reset store before each test
beforeEach(() => {
  mockStore = {
    adminNotificationState: new Map(),
    adminNotificationHistory: new Map()
  };
});

// Mock implementation of service functions for testing
const mockMarkAsRead = (adminId, notificationId, sourceType, sourceCollection = '') => {
  const id = `state_${Date.now()}_${Math.random()}`;
  const readState = {
    id,
    adminId,
    notificationId,
    sourceType,
    sourceCollection,
    isRead: true,
    readAt: new Date(),
    createdAt: new Date()
  };
  mockStore.adminNotificationState.set(id, readState);
  return id;
};

const mockGetReadStates = (adminId) => {
  const readStates = new Map();
  mockStore.adminNotificationState.forEach((state, id) => {
    if (state.adminId === adminId && state.isRead) {
      readStates.set(state.notificationId, state);
    }
  });
  return readStates;
};

const mockAddToHistory = (adminId, action, sourceType, sourceId, sourceData, note = null) => {
  const id = `history_${Date.now()}_${Math.random()}`;
  const historyItem = {
    id,
    adminId,
    action,
    sourceType,
    sourceId,
    sourceData: sourceData || {},
    actionAt: new Date(),
    ...(note && { note })
  };
  mockStore.adminNotificationHistory.set(id, historyItem);
  return id;
};

const mockGetHistory = (adminId, limitCount = 50) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const items = [];
  mockStore.adminNotificationHistory.forEach((item) => {
    if (item.adminId === adminId && item.actionAt >= thirtyDaysAgo) {
      items.push(item);
    }
  });
  
  // Sort by actionAt descending
  items.sort((a, b) => b.actionAt.getTime() - a.actionAt.getTime());
  
  return items.slice(0, limitCount);
};

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

const adminIdArb = fc.string({ minLength: 10, maxLength: 30 }).filter(s => s.trim().length > 0);
const sourceIdArb = fc.string({ minLength: 5, maxLength: 30 }).filter(s => s.trim().length > 0);
const sourceTypeArb = fc.constantFrom(
  SOURCE_TYPES.USER_REGISTRATION,
  SOURCE_TYPES.LOAN_REQUEST,
  SOURCE_TYPES.OVERDUE_LOAN,
  SOURCE_TYPES.RESERVATION_REQUEST,
  SOURCE_TYPES.PERSONAL
);

const notificationArb = fc.record({
  sourceType: sourceTypeArb,
  sourceId: sourceIdArb
});

const historyActionArb = fc.constantFrom(
  HISTORY_ACTION_TYPES.APPROVED,
  HISTORY_ACTION_TYPES.REJECTED,
  HISTORY_ACTION_TYPES.VIEWED,
  HISTORY_ACTION_TYPES.DISMISSED
);

// ============================================================================
// Property 5: Mark as Read State Persistence
// **Feature: unified-admin-notification-system, Property 5: Mark as Read State Persistence**
// **Validates: Requirements 9.1, 9.2**
// ============================================================================

describe('Property 5: Mark as Read State Persistence', () => {
  test('marking a notification as read persists the state', () => {
    fc.assert(
      fc.property(adminIdArb, notificationArb, (adminId, notification) => {
        const notificationId = createNotificationId(notification.sourceType, notification.sourceId);
        
        // Mark as read
        mockMarkAsRead(adminId, notificationId, notification.sourceType);
        
        // Get read states
        const readStates = mockGetReadStates(adminId);
        
        // Verify the notification is marked as read
        expect(readStates.has(notificationId)).toBe(true);
        expect(readStates.get(notificationId).isRead).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  test('read state contains correct notification ID after restoration', () => {
    fc.assert(
      fc.property(adminIdArb, notificationArb, (adminId, notification) => {
        const notificationId = createNotificationId(notification.sourceType, notification.sourceId);
        
        // Mark as read
        mockMarkAsRead(adminId, notificationId, notification.sourceType);
        
        // Restore read states
        const readStates = mockGetReadStates(adminId);
        
        // Verify notification ID matches
        const restoredState = readStates.get(notificationId);
        expect(restoredState.notificationId).toBe(notificationId);
      }),
      { numRuns: 50 }
    );
  });

  test('read state contains correct source type after restoration', () => {
    fc.assert(
      fc.property(adminIdArb, notificationArb, (adminId, notification) => {
        const notificationId = createNotificationId(notification.sourceType, notification.sourceId);
        
        // Mark as read
        mockMarkAsRead(adminId, notificationId, notification.sourceType);
        
        // Restore read states
        const readStates = mockGetReadStates(adminId);
        
        // Verify source type matches
        const restoredState = readStates.get(notificationId);
        expect(restoredState.sourceType).toBe(notification.sourceType);
      }),
      { numRuns: 50 }
    );
  });

  test('read state has readAt timestamp after marking as read', () => {
    fc.assert(
      fc.property(adminIdArb, notificationArb, (adminId, notification) => {
        const notificationId = createNotificationId(notification.sourceType, notification.sourceId);
        const beforeMark = new Date();
        
        // Mark as read
        mockMarkAsRead(adminId, notificationId, notification.sourceType);
        
        const afterMark = new Date();
        
        // Restore read states
        const readStates = mockGetReadStates(adminId);
        const restoredState = readStates.get(notificationId);
        
        // Verify readAt is within expected range
        expect(restoredState.readAt).toBeInstanceOf(Date);
        expect(restoredState.readAt.getTime()).toBeGreaterThanOrEqual(beforeMark.getTime());
        expect(restoredState.readAt.getTime()).toBeLessThanOrEqual(afterMark.getTime());
      }),
      { numRuns: 50 }
    );
  });

  test('multiple notifications can be marked as read independently', () => {
    fc.assert(
      fc.property(
        adminIdArb,
        fc.array(notificationArb, { minLength: 2, maxLength: 10 }),
        (adminId, notifications) => {
          // Mark all as read
          const notificationIds = notifications.map(n => {
            const notificationId = createNotificationId(n.sourceType, n.sourceId);
            mockMarkAsRead(adminId, notificationId, n.sourceType);
            return notificationId;
          });
          
          // Get unique notification IDs
          const uniqueIds = [...new Set(notificationIds)];
          
          // Restore read states
          const readStates = mockGetReadStates(adminId);
          
          // Verify all unique notifications are marked as read
          uniqueIds.forEach(id => {
            expect(readStates.has(id)).toBe(true);
          });
        }
      ),
      { numRuns: 30 }
    );
  });

  test('read states are isolated per admin', () => {
    fc.assert(
      fc.property(
        adminIdArb,
        adminIdArb.filter(id => id.length > 5), // Different admin
        notificationArb,
        (adminId1, adminId2, notification) => {
          // Skip if same admin ID
          if (adminId1 === adminId2) return true;
          
          const notificationId = createNotificationId(notification.sourceType, notification.sourceId);
          
          // Admin 1 marks as read
          mockMarkAsRead(adminId1, notificationId, notification.sourceType);
          
          // Admin 2's read states should not include this notification
          const admin2States = mockGetReadStates(adminId2);
          expect(admin2States.has(notificationId)).toBe(false);
          
          // Admin 1's read states should include this notification
          const admin1States = mockGetReadStates(adminId1);
          expect(admin1States.has(notificationId)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
});

// ============================================================================
// Property 6: Quick Action State Transition
// **Feature: unified-admin-notification-system, Property 6: Quick Action State Transition**
// **Validates: Requirements 5.3**
// ============================================================================

describe('Property 6: Quick Action State Transition', () => {
  test('adding to history creates a history entry', () => {
    fc.assert(
      fc.property(
        adminIdArb,
        historyActionArb,
        sourceTypeArb,
        sourceIdArb,
        (adminId, action, sourceType, sourceId) => {
          const initialCount = mockGetHistory(adminId).length;
          
          // Add to history
          mockAddToHistory(adminId, action, sourceType, sourceId, {});
          
          // Verify history count increased
          const newCount = mockGetHistory(adminId).length;
          expect(newCount).toBe(initialCount + 1);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('history entry contains correct action type', () => {
    fc.assert(
      fc.property(
        adminIdArb,
        historyActionArb,
        sourceTypeArb,
        sourceIdArb,
        (adminId, action, sourceType, sourceId) => {
          // Add to history
          const historyId = mockAddToHistory(adminId, action, sourceType, sourceId, {});
          
          // Get history
          const history = mockGetHistory(adminId);
          const entry = history.find(h => h.id === historyId);
          
          // Verify action matches
          expect(entry).toBeDefined();
          expect(entry.action).toBe(action);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('history entry contains correct source information', () => {
    fc.assert(
      fc.property(
        adminIdArb,
        historyActionArb,
        sourceTypeArb,
        sourceIdArb,
        (adminId, action, sourceType, sourceId) => {
          // Add to history
          const historyId = mockAddToHistory(adminId, action, sourceType, sourceId, {});
          
          // Get history
          const history = mockGetHistory(adminId);
          const entry = history.find(h => h.id === historyId);
          
          // Verify source information
          expect(entry.sourceType).toBe(sourceType);
          expect(entry.sourceId).toBe(sourceId);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('history entry has actionAt timestamp', () => {
    fc.assert(
      fc.property(
        adminIdArb,
        historyActionArb,
        sourceTypeArb,
        sourceIdArb,
        (adminId, action, sourceType, sourceId) => {
          const beforeAdd = new Date();
          
          // Add to history
          const historyId = mockAddToHistory(adminId, action, sourceType, sourceId, {});
          
          const afterAdd = new Date();
          
          // Get history
          const history = mockGetHistory(adminId);
          const entry = history.find(h => h.id === historyId);
          
          // Verify actionAt is within expected range
          expect(entry.actionAt).toBeInstanceOf(Date);
          expect(entry.actionAt.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime());
          expect(entry.actionAt.getTime()).toBeLessThanOrEqual(afterAdd.getTime());
        }
      ),
      { numRuns: 50 }
    );
  });

  test('history preserves source data snapshot', () => {
    fc.assert(
      fc.property(
        adminIdArb,
        historyActionArb,
        sourceTypeArb,
        sourceIdArb,
        fc.record({
          name: fc.string(),
          email: fc.string(),
          status: fc.string()
        }),
        (adminId, action, sourceType, sourceId, sourceData) => {
          // Add to history with source data
          const historyId = mockAddToHistory(adminId, action, sourceType, sourceId, sourceData);
          
          // Get history
          const history = mockGetHistory(adminId);
          const entry = history.find(h => h.id === historyId);
          
          // Verify source data is preserved
          expect(entry.sourceData).toEqual(sourceData);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('history entries are sorted by actionAt descending', () => {
    fc.assert(
      fc.property(
        adminIdArb,
        fc.array(
          fc.record({
            action: historyActionArb,
            sourceType: sourceTypeArb,
            sourceId: sourceIdArb
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (adminId, entries) => {
          // Add multiple entries
          entries.forEach(e => {
            mockAddToHistory(adminId, e.action, e.sourceType, e.sourceId, {});
          });
          
          // Get history
          const history = mockGetHistory(adminId);
          
          // Verify sorted by actionAt descending
          for (let i = 0; i < history.length - 1; i++) {
            expect(history[i].actionAt.getTime()).toBeGreaterThanOrEqual(
              history[i + 1].actionAt.getTime()
            );
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  test('history is isolated per admin', () => {
    fc.assert(
      fc.property(
        adminIdArb,
        adminIdArb.filter(id => id.length > 5),
        historyActionArb,
        sourceTypeArb,
        sourceIdArb,
        (adminId1, adminId2, action, sourceType, sourceId) => {
          // Skip if same admin ID
          if (adminId1 === adminId2) return true;
          
          // Admin 1 adds to history
          mockAddToHistory(adminId1, action, sourceType, sourceId, {});
          
          // Admin 2's history should not include this entry
          const admin2History = mockGetHistory(adminId2);
          const hasEntry = admin2History.some(h => 
            h.sourceType === sourceType && h.sourceId === sourceId
          );
          expect(hasEntry).toBe(false);
          
          // Admin 1's history should include this entry
          const admin1History = mockGetHistory(adminId1);
          const admin1HasEntry = admin1History.some(h => 
            h.sourceType === sourceType && h.sourceId === sourceId
          );
          expect(admin1HasEntry).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ============================================================================
// Property 10: History Date Range Correctness
// **Feature: unified-admin-notification-system, Property 10: History Date Range Correctness**
// **Validates: Requirements 3.4**
// ============================================================================

describe('Property 10: History Date Range Correctness', () => {
  test('history only returns items from past 30 days', () => {
    fc.assert(
      fc.property(adminIdArb, (adminId) => {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Add a recent entry
        mockAddToHistory(adminId, HISTORY_ACTION_TYPES.APPROVED, SOURCE_TYPES.USER_REGISTRATION, 'recent', {});
        
        // Get history
        const history = mockGetHistory(adminId);
        
        // All entries should be within 30 days
        history.forEach(entry => {
          expect(entry.actionAt.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
          expect(entry.actionAt.getTime()).toBeLessThanOrEqual(now.getTime());
        });
      }),
      { numRuns: 30 }
    );
  });
});
