/**
 * Property-based tests for useLoanHistory hook
 * Tests universal properties that should hold across all valid inputs
 * 
 * Feature: user-status-system-improvement
 * Requirements: 9.3, 9.4
 */

import fc from 'fast-check';
import {
  filterLoanHistory,
  calculateLoanHistoryStats,
  HISTORY_STATUSES
} from '../useLoanHistory';
import { LOAN_REQUEST_STATUS } from '../../types/loanRequest';

// Generator for valid loan history statuses
const validStatusGenerator = fc.constantFrom(...HISTORY_STATUSES);

// Generator for category IDs
const categoryGenerator = fc.constantFrom('electronics', 'tools', 'furniture', 'sports', 'other');

// Generator for equipment names
const equipmentNameGenerator = fc.string({ minLength: 1, maxLength: 50 });

// Generator for serial numbers
const serialNumberGenerator = fc.string({ minLength: 5, maxLength: 20 });

// Generator for a single loan history item with valid dates
// Using integer-based date generation to avoid Date(NaN) issues during shrinking
const loanHistoryItemGenerator = fc.record({
  id: fc.uuid(),
  equipmentId: fc.uuid(),
  equipmentName: equipmentNameGenerator,
  equipmentCategory: categoryGenerator,
  equipmentSnapshot: fc.record({
    name: equipmentNameGenerator,
    category: categoryGenerator,
    serialNumber: serialNumberGenerator,
    equipmentNumber: serialNumberGenerator
  }),
  // Use integer days offset from a base date to ensure valid dates
  borrowDaysOffset: fc.integer({ min: 0, max: 1000 }),
  loanDuration: fc.integer({ min: 1, max: 30 }),
  hasActualReturn: fc.boolean(),
  actualReturnOffset: fc.integer({ min: 1, max: 35 }),
  status: validStatusGenerator,
  purpose: fc.string({ minLength: 0, maxLength: 100 })
}).map(item => {
  // Base date for calculations
  const baseDate = new Date('2022-01-01');
  
  // Calculate borrow date
  const borrowDate = new Date(baseDate);
  borrowDate.setDate(borrowDate.getDate() + item.borrowDaysOffset);
  
  // Calculate expected return date
  const expectedReturnDate = new Date(borrowDate);
  expectedReturnDate.setDate(expectedReturnDate.getDate() + item.loanDuration);
  
  // Calculate actual return date if applicable
  let actualReturnDate = null;
  if (item.hasActualReturn) {
    actualReturnDate = new Date(borrowDate);
    actualReturnDate.setDate(actualReturnDate.getDate() + item.actualReturnOffset);
  }
  
  return {
    id: item.id,
    equipmentId: item.equipmentId,
    equipmentName: item.equipmentName,
    equipmentCategory: item.equipmentCategory,
    equipmentSnapshot: item.equipmentSnapshot,
    borrowDate,
    expectedReturnDate,
    actualReturnDate,
    status: item.status,
    purpose: item.purpose
  };
});

// Generator for loan history array
const loanHistoryArrayGenerator = fc.array(loanHistoryItemGenerator, { minLength: 0, maxLength: 50 });

// Generator for date range filter using integer offsets to avoid Date(NaN)
const dateRangeFilterGenerator = fc.record({
  hasStart: fc.boolean(),
  hasEnd: fc.boolean(),
  startOffset: fc.integer({ min: 0, max: 500 }),
  endOffset: fc.integer({ min: 501, max: 1000 })
}).map(range => {
  const baseDate = new Date('2022-01-01');
  
  let start = null;
  let end = null;
  
  if (range.hasStart) {
    start = new Date(baseDate);
    start.setDate(start.getDate() + range.startOffset);
  }
  
  if (range.hasEnd) {
    end = new Date(baseDate);
    end.setDate(end.getDate() + range.endOffset);
  }
  
  return { start, end };
});

// Generator for filters object
const filtersGenerator = fc.record({
  dateRange: fc.option(dateRangeFilterGenerator, { nil: null }),
  category: fc.option(categoryGenerator, { nil: '' }),
  status: fc.option(validStatusGenerator, { nil: '' }),
  search: fc.option(fc.string({ minLength: 0, maxLength: 20 }), { nil: '' })
});

describe('useLoanHistory property-based tests', () => {
  describe('Property 8: Loan History Filtering', () => {
    /**
     * **Feature: user-status-system-improvement, Property 8: Loan History Filtering**
     * **Validates: Requirements 9.3**
     * 
     * For any loan history filter with dateRange, category, and status, 
     * the returned results should only include items matching all specified filter criteria.
     */
    test('filtered results should only contain items matching ALL filter criteria', () => {
      fc.assert(
        fc.property(
          loanHistoryArrayGenerator,
          filtersGenerator,
          (items, filters) => {
            const result = filterLoanHistory(items, filters);
            
            // Every item in result should match all active filters
            result.forEach(item => {
              // Check date range filter
              if (filters.dateRange) {
                const borrowDate = item.borrowDate instanceof Date 
                  ? item.borrowDate 
                  : new Date(item.borrowDate);
                
                if (filters.dateRange.start) {
                  const startDate = new Date(filters.dateRange.start);
                  startDate.setHours(0, 0, 0, 0);
                  expect(borrowDate >= startDate).toBe(true);
                }
                
                if (filters.dateRange.end) {
                  const endDate = new Date(filters.dateRange.end);
                  endDate.setHours(23, 59, 59, 999);
                  expect(borrowDate <= endDate).toBe(true);
                }
              }
              
              // Check category filter
              if (filters.category) {
                const itemCategory = item.equipmentCategory || item.equipmentSnapshot?.category || '';
                expect(itemCategory).toBe(filters.category);
              }
              
              // Check status filter
              if (filters.status) {
                expect(item.status).toBe(filters.status);
              }
              
              // Check search filter
              if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const equipmentName = (item.equipmentName || item.equipmentSnapshot?.name || '').toLowerCase();
                const serialNumber = (item.equipmentSnapshot?.serialNumber || item.equipmentSnapshot?.equipmentNumber || '').toLowerCase();
                
                const matchesSearch = equipmentName.includes(searchLower) || serialNumber.includes(searchLower);
                expect(matchesSearch).toBe(true);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('filtered results should be a subset of original items', () => {
      fc.assert(
        fc.property(
          loanHistoryArrayGenerator,
          filtersGenerator,
          (items, filters) => {
            const result = filterLoanHistory(items, filters);
            
            // Result length should be <= original length
            expect(result.length).toBeLessThanOrEqual(items.length);
            
            // Every item in result should exist in original
            result.forEach(resultItem => {
              const existsInOriginal = items.some(item => item.id === resultItem.id);
              expect(existsInOriginal).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('empty filters should return all items', () => {
      fc.assert(
        fc.property(
          loanHistoryArrayGenerator,
          (items) => {
            const emptyFilters = {
              dateRange: null,
              category: '',
              status: '',
              search: ''
            };
            
            const result = filterLoanHistory(items, emptyFilters);
            
            expect(result.length).toBe(items.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('filtering with non-existent category should return empty array', () => {
      fc.assert(
        fc.property(
          loanHistoryArrayGenerator,
          (items) => {
            const filters = {
              dateRange: null,
              category: 'non-existent-category-xyz-123',
              status: '',
              search: ''
            };
            
            const result = filterLoanHistory(items, filters);
            
            expect(result.length).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should handle null or undefined items gracefully', () => {
      const filters = { dateRange: null, category: '', status: '', search: '' };
      
      expect(filterLoanHistory(null, filters)).toEqual([]);
      expect(filterLoanHistory(undefined, filters)).toEqual([]);
      expect(filterLoanHistory([], filters)).toEqual([]);
    });
  });

  describe('Property 9: Loan History Statistics Calculation', () => {
    /**
     * **Feature: user-status-system-improvement, Property 9: Loan History Statistics Calculation**
     * **Validates: Requirements 9.4**
     * 
     * For any set of completed loans, the statistics should correctly calculate:
     * totalLoans (count), averageDuration (sum of durations / count), 
     * onTimeReturnRate (on-time returns / total returns * 100).
     */
    test('totalLoans should equal the number of items', () => {
      fc.assert(
        fc.property(
          loanHistoryArrayGenerator,
          (items) => {
            const stats = calculateLoanHistoryStats(items);
            
            expect(stats.totalLoans).toBe(items.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('averageDuration should be non-negative', () => {
      fc.assert(
        fc.property(
          loanHistoryArrayGenerator,
          (items) => {
            const stats = calculateLoanHistoryStats(items);
            
            expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('onTimeReturnRate should be between 0 and 100', () => {
      fc.assert(
        fc.property(
          loanHistoryArrayGenerator,
          (items) => {
            const stats = calculateLoanHistoryStats(items);
            
            expect(stats.onTimeReturnRate).toBeGreaterThanOrEqual(0);
            expect(stats.onTimeReturnRate).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('empty array should return zero statistics', () => {
      const stats = calculateLoanHistoryStats([]);
      
      expect(stats.totalLoans).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.onTimeReturnRate).toBe(0);
    });

    test('null or undefined should return zero statistics', () => {
      const statsNull = calculateLoanHistoryStats(null);
      const statsUndefined = calculateLoanHistoryStats(undefined);
      
      expect(statsNull.totalLoans).toBe(0);
      expect(statsNull.averageDuration).toBe(0);
      expect(statsNull.onTimeReturnRate).toBe(0);
      
      expect(statsUndefined.totalLoans).toBe(0);
      expect(statsUndefined.averageDuration).toBe(0);
      expect(statsUndefined.onTimeReturnRate).toBe(0);
    });

    test('statistics should be integers (rounded)', () => {
      fc.assert(
        fc.property(
          loanHistoryArrayGenerator,
          (items) => {
            const stats = calculateLoanHistoryStats(items);
            
            // averageDuration and onTimeReturnRate should be integers
            expect(Number.isInteger(stats.averageDuration)).toBe(true);
            expect(Number.isInteger(stats.onTimeReturnRate)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('single item with return date should have averageDuration >= 1', () => {
      fc.assert(
        fc.property(
          loanHistoryItemGenerator.filter(item => 
            item.actualReturnDate !== null && 
            item.status === LOAN_REQUEST_STATUS.RETURNED
          ),
          (item) => {
            const stats = calculateLoanHistoryStats([item]);
            
            // With a returned item, average duration should be at least 1 day
            expect(stats.averageDuration).toBeGreaterThanOrEqual(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * **Feature: user-status-system-improvement, Property 9: Loan History Statistics Calculation**
     * **Validates: Requirements 9.4**
     * 
     * Verify that averageDuration is correctly calculated as sum of durations / count
     */
    test('averageDuration should equal sum of durations divided by count for returned items', () => {
      // Generator for items that are guaranteed to have return dates
      // Using integer-based date generation to avoid Date(NaN) issues
      const returnedItemGenerator = fc.record({
        id: fc.uuid(),
        equipmentId: fc.uuid(),
        equipmentName: fc.string({ minLength: 1, maxLength: 50 }),
        borrowDaysOffset: fc.integer({ min: 0, max: 500 }),
        durationDays: fc.integer({ min: 1, max: 30 }),
        status: fc.constant(LOAN_REQUEST_STATUS.RETURNED)
      }).map(item => {
        const baseDate = new Date('2023-01-01');
        const borrowDate = new Date(baseDate);
        borrowDate.setDate(borrowDate.getDate() + item.borrowDaysOffset);
        
        const actualReturnDate = new Date(borrowDate);
        actualReturnDate.setDate(actualReturnDate.getDate() + item.durationDays);
        
        const expectedReturnDate = new Date(borrowDate);
        expectedReturnDate.setDate(expectedReturnDate.getDate() + item.durationDays + 5);
        
        return {
          id: item.id,
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName,
          borrowDate,
          actualReturnDate,
          expectedReturnDate,
          status: item.status,
          durationDays: item.durationDays
        };
      });

      fc.assert(
        fc.property(
          fc.array(returnedItemGenerator, { minLength: 1, maxLength: 20 }),
          (items) => {
            const stats = calculateLoanHistoryStats(items);
            
            // Calculate expected average duration manually
            let totalDuration = 0;
            items.forEach(item => {
              totalDuration += item.durationDays;
            });
            
            const expectedAverage = Math.round(totalDuration / items.length);
            
            expect(stats.averageDuration).toBe(expectedAverage);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: user-status-system-improvement, Property 9: Loan History Statistics Calculation**
     * **Validates: Requirements 9.4**
     * 
     * Verify that onTimeReturnRate is correctly calculated as (on-time returns / total returns) * 100
     */
    test('onTimeReturnRate should equal (on-time returns / total returns) * 100', () => {
      // Generator for items with controlled on-time/late status
      // Using integer-based date generation to avoid Date(NaN) issues
      const controlledReturnItemGenerator = fc.record({
        id: fc.uuid(),
        equipmentId: fc.uuid(),
        equipmentName: fc.string({ minLength: 1, maxLength: 50 }),
        borrowDaysOffset: fc.integer({ min: 0, max: 500 }),
        expectedDays: fc.integer({ min: 5, max: 15 }),
        isOnTime: fc.boolean(),
        status: fc.constant(LOAN_REQUEST_STATUS.RETURNED)
      }).map(item => {
        const baseDate = new Date('2023-01-01');
        const borrowDate = new Date(baseDate);
        borrowDate.setDate(borrowDate.getDate() + item.borrowDaysOffset);
        
        const expectedReturnDate = new Date(borrowDate);
        expectedReturnDate.setDate(expectedReturnDate.getDate() + item.expectedDays);
        
        // If on time, return before or on expected date; if late, return after
        const actualReturnDate = new Date(borrowDate);
        if (item.isOnTime) {
          actualReturnDate.setDate(actualReturnDate.getDate() + item.expectedDays - 1);
        } else {
          actualReturnDate.setDate(actualReturnDate.getDate() + item.expectedDays + 2);
        }
        
        return {
          id: item.id,
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName,
          borrowDate,
          expectedReturnDate,
          actualReturnDate,
          status: item.status,
          isOnTime: item.isOnTime
        };
      });

      fc.assert(
        fc.property(
          fc.array(controlledReturnItemGenerator, { minLength: 1, maxLength: 20 }),
          (items) => {
            const stats = calculateLoanHistoryStats(items);
            
            // Calculate expected on-time rate manually
            const onTimeCount = items.filter(item => item.isOnTime).length;
            const expectedRate = Math.round((onTimeCount / items.length) * 100);
            
            expect(stats.onTimeReturnRate).toBe(expectedRate);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: user-status-system-improvement, Property 9: Loan History Statistics Calculation**
     * **Validates: Requirements 9.4**
     * 
     * Verify that all on-time returns result in 100% rate
     */
    test('all on-time returns should result in 100% onTimeReturnRate', () => {
      // Using integer-based date generation to avoid Date(NaN) issues
      const onTimeItemGenerator = fc.record({
        id: fc.uuid(),
        equipmentId: fc.uuid(),
        equipmentName: fc.string({ minLength: 1, maxLength: 50 }),
        borrowDaysOffset: fc.integer({ min: 0, max: 500 }),
        expectedDays: fc.integer({ min: 5, max: 15 }),
        status: fc.constant(LOAN_REQUEST_STATUS.RETURNED)
      }).map(item => {
        const baseDate = new Date('2023-01-01');
        const borrowDate = new Date(baseDate);
        borrowDate.setDate(borrowDate.getDate() + item.borrowDaysOffset);
        
        const expectedReturnDate = new Date(borrowDate);
        expectedReturnDate.setDate(expectedReturnDate.getDate() + item.expectedDays);
        
        // Return exactly on expected date (on time)
        const actualReturnDate = new Date(expectedReturnDate);
        
        return {
          id: item.id,
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName,
          borrowDate,
          expectedReturnDate,
          actualReturnDate,
          status: item.status
        };
      });

      fc.assert(
        fc.property(
          fc.array(onTimeItemGenerator, { minLength: 1, maxLength: 20 }),
          (items) => {
            const stats = calculateLoanHistoryStats(items);
            
            expect(stats.onTimeReturnRate).toBe(100);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * **Feature: user-status-system-improvement, Property 9: Loan History Statistics Calculation**
     * **Validates: Requirements 9.4**
     * 
     * Verify that all late returns result in 0% rate
     */
    test('all late returns should result in 0% onTimeReturnRate', () => {
      // Using integer-based date generation to avoid Date(NaN) issues
      const lateItemGenerator = fc.record({
        id: fc.uuid(),
        equipmentId: fc.uuid(),
        equipmentName: fc.string({ minLength: 1, maxLength: 50 }),
        borrowDaysOffset: fc.integer({ min: 0, max: 500 }),
        expectedDays: fc.integer({ min: 5, max: 15 }),
        lateDays: fc.integer({ min: 1, max: 10 }),
        status: fc.constant(LOAN_REQUEST_STATUS.RETURNED)
      }).map(item => {
        const baseDate = new Date('2023-01-01');
        const borrowDate = new Date(baseDate);
        borrowDate.setDate(borrowDate.getDate() + item.borrowDaysOffset);
        
        const expectedReturnDate = new Date(borrowDate);
        expectedReturnDate.setDate(expectedReturnDate.getDate() + item.expectedDays);
        
        // Return after expected date (late)
        const actualReturnDate = new Date(expectedReturnDate);
        actualReturnDate.setDate(actualReturnDate.getDate() + item.lateDays);
        
        return {
          id: item.id,
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName,
          borrowDate,
          expectedReturnDate,
          actualReturnDate,
          status: item.status
        };
      });

      fc.assert(
        fc.property(
          fc.array(lateItemGenerator, { minLength: 1, maxLength: 20 }),
          (items) => {
            const stats = calculateLoanHistoryStats(items);
            
            expect(stats.onTimeReturnRate).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
