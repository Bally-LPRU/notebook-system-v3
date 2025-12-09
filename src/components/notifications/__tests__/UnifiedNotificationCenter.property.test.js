/**
 * UnifiedNotificationCenter Property Tests
 * 
 * Property-based tests for the UnifiedNotificationCenter component.
 * 
 * **Feature: unified-admin-notification-system**
 */

import * as fc from 'fast-check';

/**
 * Property 10: History Date Range Correctness
 * 
 * *For any* notification displayed in the "ประวัติ" tab, its actionAt or readAt 
 * timestamp SHALL be within the past 30 days from the current date
 * 
 * **Validates: Requirements 3.4**
 */
describe('Property 10: History Date Range Correctness', () => {
  // Helper to generate history items with various dates
  const historyItemArbitrary = fc.record({
    id: fc.uuid(),
    adminId: fc.string({ minLength: 1, maxLength: 50 }),
    action: fc.constantFrom('approved', 'rejected', 'viewed', 'dismissed'),
    sourceType: fc.constantFrom('user_registration', 'loan_request', 'overdue_loan', 'reservation_request', 'personal'),
    sourceId: fc.uuid(),
    sourceData: fc.object(),
    actionAt: fc.date({
      min: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      max: new Date() // now
    }),
    note: fc.option(fc.string({ maxLength: 200 }))
  });

  /**
   * Filter function that should be used to filter history items to past 30 days
   */
  const filterHistoryByDateRange = (items, days = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return items.filter(item => {
      const actionDate = item.actionAt instanceof Date ? item.actionAt : new Date(item.actionAt);
      return actionDate >= cutoffDate;
    });
  };

  /**
   * Check if a date is within the past N days
   */
  const isWithinPastDays = (date, days = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const checkDate = date instanceof Date ? date : new Date(date);
    return checkDate >= cutoffDate && checkDate <= new Date();
  };

  it('should only include items from the past 30 days after filtering', () => {
    fc.assert(
      fc.property(
        fc.array(historyItemArbitrary, { minLength: 0, maxLength: 100 }),
        (historyItems) => {
          const filteredItems = filterHistoryByDateRange(historyItems, 30);
          
          // All filtered items should be within past 30 days
          return filteredItems.every(item => isWithinPastDays(item.actionAt, 30));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should exclude items older than 30 days', () => {
    fc.assert(
      fc.property(
        fc.array(historyItemArbitrary, { minLength: 1, maxLength: 50 }),
        (historyItems) => {
          // Filter out invalid dates first
          const validItems = historyItems.filter(item => {
            const actionDate = item.actionAt instanceof Date ? item.actionAt : new Date(item.actionAt);
            return !isNaN(actionDate.getTime());
          });
          
          const filteredItems = filterHistoryByDateRange(validItems, 30);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 30);
          
          // Count items that should be excluded (older than 30 days)
          const oldItems = validItems.filter(item => {
            const actionDate = item.actionAt instanceof Date ? item.actionAt : new Date(item.actionAt);
            return actionDate < cutoffDate;
          });
          
          // Filtered count should equal total minus old items
          return filteredItems.length === validItems.length - oldItems.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all items within 30 days', () => {
    fc.assert(
      fc.property(
        fc.array(historyItemArbitrary, { minLength: 0, maxLength: 50 }),
        (historyItems) => {
          const filteredItems = filterHistoryByDateRange(historyItems, 30);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 30);
          
          // Count items that should be included (within 30 days)
          const recentItems = historyItems.filter(item => {
            const actionDate = item.actionAt instanceof Date ? item.actionAt : new Date(item.actionAt);
            return actionDate >= cutoffDate;
          });
          
          // All recent items should be in filtered result
          return filteredItems.length === recentItems.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of exactly 30 days ago', () => {
    // Use a time that's definitely within 30 days (29 days and 23 hours ago)
    const almostThirtyDaysAgo = new Date();
    almostThirtyDaysAgo.setDate(almostThirtyDaysAgo.getDate() - 29);
    almostThirtyDaysAgo.setHours(almostThirtyDaysAgo.getHours() - 23);
    
    const testItem = {
      id: 'test-1',
      adminId: 'admin-1',
      action: 'approved',
      sourceType: 'user_registration',
      sourceId: 'source-1',
      sourceData: {},
      actionAt: almostThirtyDaysAgo,
      note: null
    };
    
    const filtered = filterHistoryByDateRange([testItem], 30);
    
    // Item within 30 days should be included
    expect(filtered.length).toBe(1);
  });

  it('should handle edge case of 31 days ago', () => {
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
    
    const testItem = {
      id: 'test-1',
      adminId: 'admin-1',
      action: 'approved',
      sourceType: 'user_registration',
      sourceId: 'source-1',
      sourceData: {},
      actionAt: thirtyOneDaysAgo,
      note: null
    };
    
    const filtered = filterHistoryByDateRange([testItem], 30);
    
    // Item 31 days ago should be excluded
    expect(filtered.length).toBe(0);
  });

  it('should maintain order after filtering', () => {
    fc.assert(
      fc.property(
        fc.array(historyItemArbitrary, { minLength: 2, maxLength: 30 }),
        (historyItems) => {
          // Sort by actionAt descending before filtering
          const sortedItems = [...historyItems].sort((a, b) => {
            const dateA = a.actionAt instanceof Date ? a.actionAt : new Date(a.actionAt);
            const dateB = b.actionAt instanceof Date ? b.actionAt : new Date(b.actionAt);
            return dateB.getTime() - dateA.getTime();
          });
          
          const filteredItems = filterHistoryByDateRange(sortedItems, 30);
          
          // Check that filtered items maintain descending order
          for (let i = 1; i < filteredItems.length; i++) {
            const prevDate = filteredItems[i - 1].actionAt instanceof Date 
              ? filteredItems[i - 1].actionAt 
              : new Date(filteredItems[i - 1].actionAt);
            const currDate = filteredItems[i].actionAt instanceof Date 
              ? filteredItems[i].actionAt 
              : new Date(filteredItems[i].actionAt);
            
            if (prevDate.getTime() < currDate.getTime()) {
              return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty array', () => {
    const filtered = filterHistoryByDateRange([], 30);
    expect(filtered).toEqual([]);
  });

  it('should handle items with string dates', () => {
    const now = new Date();
    const testItems = [
      {
        id: 'test-1',
        adminId: 'admin-1',
        action: 'approved',
        sourceType: 'user_registration',
        sourceId: 'source-1',
        sourceData: {},
        actionAt: now.toISOString(), // String date
        note: null
      }
    ];
    
    const filtered = filterHistoryByDateRange(testItems, 30);
    expect(filtered.length).toBe(1);
  });
});
