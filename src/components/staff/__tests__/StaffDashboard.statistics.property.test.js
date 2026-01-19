/**
 * Property-based tests for Staff Dashboard Statistics Accuracy
 * 
 * **Feature: staff-role-system, Property 14: Staff Dashboard Statistics Accuracy**
 * **Validates: Requirements 9.2, 9.3, 9.4**
 * 
 * Property: For any Staff dashboard, the displayed counts SHALL match the actual 
 * database counts for: pending requests, active loans, overdue loans.
 */

import fc from 'fast-check';
import { LOAN_REQUEST_STATUS } from '../../../types/loanRequest';

/**
 * Pure function to calculate statistics from loan requests
 * This mirrors the logic in getLoanRequestStats from loanRequestService.js
 * 
 * @param {Array} loanRequests - Array of loan request objects
 * @returns {Object} Statistics object with counts for each status
 */
const calculateStatsFromLoanRequests = (loanRequests) => {
  const stats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    borrowed: 0,
    returned: 0,
    overdue: 0
  };

  loanRequests.forEach((loanRequest) => {
    stats.total++;

    switch (loanRequest.status) {
      case LOAN_REQUEST_STATUS.PENDING:
        stats.pending++;
        break;
      case LOAN_REQUEST_STATUS.APPROVED:
        stats.approved++;
        break;
      case LOAN_REQUEST_STATUS.REJECTED:
        stats.rejected++;
        break;
      case LOAN_REQUEST_STATUS.BORROWED:
        stats.borrowed++;
        break;
      case LOAN_REQUEST_STATUS.RETURNED:
        stats.returned++;
        break;
      case LOAN_REQUEST_STATUS.OVERDUE:
        stats.overdue++;
        break;
      default:
        // Unknown status - not counted in any category
        break;
    }
  });

  return stats;
};

/**
 * Calculate today's returns count from borrowed loans
 * This mirrors the logic in StaffDashboard.js
 * 
 * @param {Array} borrowedLoans - Array of borrowed loan requests
 * @param {Date} referenceDate - The date to check against (defaults to today)
 * @returns {number} Count of loans due today
 */
const calculateTodayReturns = (borrowedLoans, referenceDate = new Date()) => {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return borrowedLoans.filter(loan => {
    if (!loan.expectedReturnDate) return false;
    const returnDate = loan.expectedReturnDate instanceof Date 
      ? loan.expectedReturnDate 
      : new Date(loan.expectedReturnDate);
    return returnDate >= today && returnDate < tomorrow;
  }).length;
};

// Generator for valid loan request status
const loanStatusGenerator = fc.constantFrom(
  LOAN_REQUEST_STATUS.PENDING,
  LOAN_REQUEST_STATUS.APPROVED,
  LOAN_REQUEST_STATUS.REJECTED,
  LOAN_REQUEST_STATUS.BORROWED,
  LOAN_REQUEST_STATUS.RETURNED,
  LOAN_REQUEST_STATUS.OVERDUE
);

// Generator for a single loan request
const loanRequestGenerator = fc.record({
  id: fc.uuid(),
  equipmentId: fc.uuid(),
  userId: fc.uuid(),
  status: loanStatusGenerator,
  requestDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
  borrowDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
  expectedReturnDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
  purpose: fc.string({ minLength: 10, maxLength: 100 }),
  notes: fc.string({ maxLength: 200 })
});

// Generator for array of loan requests (0 to 100 items)
const loanRequestsArrayGenerator = fc.array(loanRequestGenerator, { minLength: 0, maxLength: 100 });

// Generator for borrowed loans with specific return dates
const borrowedLoanGenerator = (referenceDate) => {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  
  // Generate dates around today (-7 to +7 days)
  return fc.record({
    id: fc.uuid(),
    equipmentId: fc.uuid(),
    userId: fc.uuid(),
    status: fc.constant(LOAN_REQUEST_STATUS.BORROWED),
    expectedReturnDate: fc.integer({ min: -7, max: 7 }).map(dayOffset => {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      return date;
    }),
    purpose: fc.string({ minLength: 10, maxLength: 100 })
  });
};

describe('Staff Dashboard Statistics Accuracy Property Tests', () => {
  /**
   * **Feature: staff-role-system, Property 14: Staff Dashboard Statistics Accuracy**
   * **Validates: Requirements 9.2, 9.3, 9.4**
   */
  describe('Property 14: Staff Dashboard Statistics Accuracy', () => {
    
    /**
     * Property: Total count SHALL equal the sum of all status counts
     * Validates: Requirements 9.2, 9.3, 9.4
     */
    it('For any set of loan requests, total SHALL equal sum of all status counts', () => {
      fc.assert(
        fc.property(
          loanRequestsArrayGenerator,
          (loanRequests) => {
            const stats = calculateStatsFromLoanRequests(loanRequests);
            
            const sumOfStatuses = stats.pending + stats.approved + stats.rejected + 
                                  stats.borrowed + stats.returned + stats.overdue;
            
            // Total should equal sum of all categorized statuses
            expect(stats.total).toBe(sumOfStatuses);
            // Total should also equal the input array length
            expect(stats.total).toBe(loanRequests.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Pending count SHALL match actual pending requests
     * Validates: Requirement 9.2 - Dashboard SHALL display count of pending loan requests
     */
    it('For any set of loan requests, pending count SHALL match actual pending requests', () => {
      fc.assert(
        fc.property(
          loanRequestsArrayGenerator,
          (loanRequests) => {
            const stats = calculateStatsFromLoanRequests(loanRequests);
            
            // Count pending manually
            const actualPending = loanRequests.filter(
              lr => lr.status === LOAN_REQUEST_STATUS.PENDING
            ).length;
            
            expect(stats.pending).toBe(actualPending);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Borrowed (active loans) count SHALL match actual borrowed requests
     * Validates: Requirement 9.3 - Dashboard SHALL display count of active loans
     */
    it('For any set of loan requests, borrowed count SHALL match actual active loans', () => {
      fc.assert(
        fc.property(
          loanRequestsArrayGenerator,
          (loanRequests) => {
            const stats = calculateStatsFromLoanRequests(loanRequests);
            
            // Count borrowed manually
            const actualBorrowed = loanRequests.filter(
              lr => lr.status === LOAN_REQUEST_STATUS.BORROWED
            ).length;
            
            expect(stats.borrowed).toBe(actualBorrowed);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Overdue count SHALL match actual overdue requests
     * Validates: Requirement 9.4 - Dashboard SHALL display count of overdue loans
     */
    it('For any set of loan requests, overdue count SHALL match actual overdue loans', () => {
      fc.assert(
        fc.property(
          loanRequestsArrayGenerator,
          (loanRequests) => {
            const stats = calculateStatsFromLoanRequests(loanRequests);
            
            // Count overdue manually
            const actualOverdue = loanRequests.filter(
              lr => lr.status === LOAN_REQUEST_STATUS.OVERDUE
            ).length;
            
            expect(stats.overdue).toBe(actualOverdue);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Statistics calculation is idempotent
     * Validates: Requirements 9.2, 9.3, 9.4 - Consistent display
     */
    it('For any set of loan requests, calculating stats twice SHALL produce identical results', () => {
      fc.assert(
        fc.property(
          loanRequestsArrayGenerator,
          (loanRequests) => {
            const stats1 = calculateStatsFromLoanRequests(loanRequests);
            const stats2 = calculateStatsFromLoanRequests(loanRequests);
            
            expect(stats1).toEqual(stats2);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Empty loan requests array SHALL produce all zero counts
     */
    it('For empty loan requests, all counts SHALL be zero', () => {
      const stats = calculateStatsFromLoanRequests([]);
      
      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.approved).toBe(0);
      expect(stats.rejected).toBe(0);
      expect(stats.borrowed).toBe(0);
      expect(stats.returned).toBe(0);
      expect(stats.overdue).toBe(0);
    });

    /**
     * Property: All counts SHALL be non-negative integers
     * Validates: Requirements 9.2, 9.3, 9.4 - Valid display values
     */
    it('For any set of loan requests, all counts SHALL be non-negative integers', () => {
      fc.assert(
        fc.property(
          loanRequestsArrayGenerator,
          (loanRequests) => {
            const stats = calculateStatsFromLoanRequests(loanRequests);
            
            Object.values(stats).forEach(count => {
              expect(Number.isInteger(count)).toBe(true);
              expect(count).toBeGreaterThanOrEqual(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Adding a loan request SHALL increase the appropriate count by exactly 1
     */
    it('For any loan request added, the corresponding status count SHALL increase by 1', () => {
      fc.assert(
        fc.property(
          loanRequestsArrayGenerator,
          loanRequestGenerator,
          (existingRequests, newRequest) => {
            const statsBefore = calculateStatsFromLoanRequests(existingRequests);
            const statsAfter = calculateStatsFromLoanRequests([...existingRequests, newRequest]);
            
            // Total should increase by 1
            expect(statsAfter.total).toBe(statsBefore.total + 1);
            
            // The specific status count should increase by 1
            const statusKey = newRequest.status;
            expect(statsAfter[statusKey]).toBe(statsBefore[statusKey] + 1);
            
            // Other status counts should remain unchanged
            Object.keys(statsBefore).forEach(key => {
              if (key !== 'total' && key !== statusKey) {
                expect(statsAfter[key]).toBe(statsBefore[key]);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Today's Returns Calculation Tests
   * Validates the calculation of loans due today
   */
  describe('Today Returns Calculation', () => {
    
    /**
     * Property: Today's returns count SHALL only include loans with expectedReturnDate today
     */
    it('For any set of borrowed loans, today returns SHALL only count loans due today', () => {
      const referenceDate = new Date('2026-01-12'); // Fixed reference date for testing
      
      fc.assert(
        fc.property(
          fc.array(borrowedLoanGenerator(referenceDate), { minLength: 0, maxLength: 50 }),
          (borrowedLoans) => {
            const todayReturns = calculateTodayReturns(borrowedLoans, referenceDate);
            
            // Manually count loans due today
            const today = new Date(referenceDate);
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const actualTodayCount = borrowedLoans.filter(loan => {
              const returnDate = new Date(loan.expectedReturnDate);
              return returnDate >= today && returnDate < tomorrow;
            }).length;
            
            expect(todayReturns).toBe(actualTodayCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Today's returns count SHALL be non-negative
     */
    it('For any set of borrowed loans, today returns count SHALL be non-negative', () => {
      const referenceDate = new Date('2026-01-12');
      
      fc.assert(
        fc.property(
          fc.array(borrowedLoanGenerator(referenceDate), { minLength: 0, maxLength: 50 }),
          (borrowedLoans) => {
            const todayReturns = calculateTodayReturns(borrowedLoans, referenceDate);
            
            expect(todayReturns).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(todayReturns)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Today's returns count SHALL not exceed total borrowed loans
     */
    it('For any set of borrowed loans, today returns SHALL not exceed total count', () => {
      const referenceDate = new Date('2026-01-12');
      
      fc.assert(
        fc.property(
          fc.array(borrowedLoanGenerator(referenceDate), { minLength: 0, maxLength: 50 }),
          (borrowedLoans) => {
            const todayReturns = calculateTodayReturns(borrowedLoans, referenceDate);
            
            expect(todayReturns).toBeLessThanOrEqual(borrowedLoans.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Empty borrowed loans array SHALL produce zero today returns
     */
    it('For empty borrowed loans, today returns SHALL be zero', () => {
      const todayReturns = calculateTodayReturns([]);
      expect(todayReturns).toBe(0);
    });

    /**
     * Property: Loans without expectedReturnDate SHALL not be counted
     */
    it('Loans without expectedReturnDate SHALL not be counted in today returns', () => {
      const referenceDate = new Date('2026-01-12');
      const loansWithoutDate = [
        { id: '1', status: LOAN_REQUEST_STATUS.BORROWED, expectedReturnDate: null },
        { id: '2', status: LOAN_REQUEST_STATUS.BORROWED, expectedReturnDate: undefined },
        { id: '3', status: LOAN_REQUEST_STATUS.BORROWED } // No expectedReturnDate field
      ];
      
      const todayReturns = calculateTodayReturns(loansWithoutDate, referenceDate);
      expect(todayReturns).toBe(0);
    });
  });

  /**
   * Edge Cases and Boundary Tests
   */
  describe('Statistics Edge Cases', () => {
    
    /**
     * Test with unknown/invalid status values
     */
    it('Loan requests with unknown status SHALL not be counted in any category', () => {
      const loanRequestsWithUnknownStatus = [
        { id: '1', status: 'unknown_status' },
        { id: '2', status: 'invalid' },
        { id: '3', status: '' },
        { id: '4', status: null },
        { id: '5', status: undefined }
      ];
      
      const stats = calculateStatsFromLoanRequests(loanRequestsWithUnknownStatus);
      
      // Total should count all items
      expect(stats.total).toBe(5);
      
      // But no specific category should have any count
      expect(stats.pending).toBe(0);
      expect(stats.approved).toBe(0);
      expect(stats.rejected).toBe(0);
      expect(stats.borrowed).toBe(0);
      expect(stats.returned).toBe(0);
      expect(stats.overdue).toBe(0);
    });

    /**
     * Test with mixed valid and invalid statuses
     */
    it('Mixed valid and invalid statuses SHALL be counted correctly', () => {
      const mixedLoanRequests = [
        { id: '1', status: LOAN_REQUEST_STATUS.PENDING },
        { id: '2', status: 'invalid' },
        { id: '3', status: LOAN_REQUEST_STATUS.BORROWED },
        { id: '4', status: null },
        { id: '5', status: LOAN_REQUEST_STATUS.OVERDUE }
      ];
      
      const stats = calculateStatsFromLoanRequests(mixedLoanRequests);
      
      expect(stats.total).toBe(5);
      expect(stats.pending).toBe(1);
      expect(stats.borrowed).toBe(1);
      expect(stats.overdue).toBe(1);
      expect(stats.approved).toBe(0);
      expect(stats.rejected).toBe(0);
      expect(stats.returned).toBe(0);
    });

    /**
     * Test with large dataset
     */
    it('Statistics calculation SHALL handle large datasets correctly', () => {
      // Generate a large dataset with known distribution
      const largeDataset = [];
      const statusCounts = {
        [LOAN_REQUEST_STATUS.PENDING]: 100,
        [LOAN_REQUEST_STATUS.APPROVED]: 50,
        [LOAN_REQUEST_STATUS.REJECTED]: 30,
        [LOAN_REQUEST_STATUS.BORROWED]: 200,
        [LOAN_REQUEST_STATUS.RETURNED]: 500,
        [LOAN_REQUEST_STATUS.OVERDUE]: 20
      };
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        for (let i = 0; i < count; i++) {
          largeDataset.push({ id: `${status}-${i}`, status });
        }
      });
      
      const stats = calculateStatsFromLoanRequests(largeDataset);
      
      expect(stats.total).toBe(900);
      expect(stats.pending).toBe(100);
      expect(stats.approved).toBe(50);
      expect(stats.rejected).toBe(30);
      expect(stats.borrowed).toBe(200);
      expect(stats.returned).toBe(500);
      expect(stats.overdue).toBe(20);
    });
  });
});
