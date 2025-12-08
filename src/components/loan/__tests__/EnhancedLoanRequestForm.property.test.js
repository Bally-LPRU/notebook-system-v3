/**
 * Property-based tests for EnhancedLoanRequestForm
 * Tests universal properties that should hold across all valid inputs
 * 
 * Feature: user-status-system-improvement
 * Requirements: 2.2, 2.3, 4.2, 4.3
 */

import fc from 'fast-check';

/**
 * Loan Duration Enforcement Logic
 * 
 * Validates that loan duration (expectedReturnDate - borrowDate) does not exceed maxDays limit.
 * This is the core validation logic used in the form.
 * 
 * @param {Date} borrowDate - The borrow date
 * @param {Date} expectedReturnDate - The expected return date
 * @param {number} maxDays - Maximum allowed loan duration in days
 * @returns {Object} Validation result with isValid and duration
 */
export const validateLoanDuration = (borrowDate, expectedReturnDate, maxDays) => {
  if (!borrowDate || !expectedReturnDate || !maxDays) {
    return { isValid: false, duration: 0, error: 'Missing required parameters' };
  }
  
  const borrowDateObj = borrowDate instanceof Date ? borrowDate : new Date(borrowDate);
  const returnDateObj = expectedReturnDate instanceof Date ? expectedReturnDate : new Date(expectedReturnDate);
  
  // Calculate duration in days
  const duration = Math.ceil((returnDateObj - borrowDateObj) / (1000 * 60 * 60 * 24));
  
  // Duration must be positive and not exceed maxDays
  const isValid = duration > 0 && duration <= maxDays;
  
  return {
    isValid,
    duration,
    error: duration <= 0 
      ? 'Return date must be after borrow date' 
      : duration > maxDays 
        ? `Loan duration (${duration} days) exceeds maximum allowed (${maxDays} days)`
        : null
  };
};

/**
 * Max Items Enforcement Logic
 * 
 * Validates that user can create a loan request based on their current borrowed count,
 * pending requests count, and max items limit.
 * 
 * @param {number} currentBorrowedCount - Number of items currently borrowed
 * @param {number} pendingRequestsCount - Number of pending loan requests
 * @param {number} maxItems - Maximum items allowed
 * @returns {Object} Validation result with canBorrow and remainingQuota
 */
export const validateMaxItems = (currentBorrowedCount, pendingRequestsCount, maxItems) => {
  const totalUsed = currentBorrowedCount + pendingRequestsCount;
  const remainingQuota = Math.max(0, maxItems - totalUsed);
  const canBorrow = remainingQuota > 0;
  
  return {
    canBorrow,
    remainingQuota,
    totalUsed,
    maxItems,
    error: !canBorrow 
      ? `Cannot borrow: ${totalUsed}/${maxItems} items already used`
      : null
  };
};

/**
 * Calculate max return date based on borrow date and max days
 * 
 * @param {Date} borrowDate - The borrow date
 * @param {number} maxDays - Maximum loan duration in days
 * @returns {Date} Maximum allowed return date
 */
export const calculateMaxReturnDate = (borrowDate, maxDays) => {
  const borrowDateObj = borrowDate instanceof Date ? borrowDate : new Date(borrowDate);
  const maxReturnDate = new Date(borrowDateObj);
  maxReturnDate.setDate(maxReturnDate.getDate() + maxDays);
  return maxReturnDate;
};

// Generators
const validMaxDaysGenerator = fc.integer({ min: 1, max: 365 });
const validMaxItemsGenerator = fc.integer({ min: 1, max: 50 });
const borrowedCountGenerator = fc.integer({ min: 0, max: 100 });
const pendingCountGenerator = fc.integer({ min: 0, max: 100 });

// Generator for valid date (within reasonable range)
// Filter out invalid dates (NaN) to ensure all generated dates are valid
const validDateGenerator = fc.date({
  min: new Date('2024-01-01'),
  max: new Date('2030-12-31')
}).filter(date => !isNaN(date.getTime()));

// Generator for valid borrow and return date pair
const validDatePairGenerator = fc.tuple(
  validDateGenerator,
  fc.integer({ min: 1, max: 365 }) // days to add for return date
).map(([borrowDate, daysToAdd]) => {
  const returnDate = new Date(borrowDate);
  returnDate.setDate(returnDate.getDate() + daysToAdd);
  return { borrowDate, returnDate, daysToAdd };
});

describe('EnhancedLoanRequestForm property-based tests', () => {
  describe('Property 4: Loan Duration Enforcement', () => {
    /**
     * **Feature: user-status-system-improvement, Property 4: Loan Duration Enforcement**
     * **Validates: Requirements 2.3, 4.2**
     * 
     * For any loan request with borrowDate and expectedReturnDate, the duration 
     * (expectedReturnDate - borrowDate) should not exceed the user's maxDays limit.
     */
    test('should reject loan requests where duration exceeds maxDays', () => {
      fc.assert(
        fc.property(
          validDateGenerator,
          validMaxDaysGenerator,
          fc.integer({ min: 1, max: 100 }), // extra days beyond maxDays
          (borrowDate, maxDays, extraDays) => {
            // Create return date that exceeds maxDays
            const returnDate = new Date(borrowDate);
            returnDate.setDate(returnDate.getDate() + maxDays + extraDays);
            
            const result = validateLoanDuration(borrowDate, returnDate, maxDays);
            
            // Should be invalid when duration exceeds maxDays
            expect(result.isValid).toBe(false);
            expect(result.duration).toBe(maxDays + extraDays);
            expect(result.error).toContain('exceeds maximum');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should accept loan requests where duration is within maxDays', () => {
      fc.assert(
        fc.property(
          validDateGenerator,
          validMaxDaysGenerator,
          (borrowDate, maxDays) => {
            // Create return date within maxDays (use random duration from 1 to maxDays)
            const duration = fc.sample(fc.integer({ min: 1, max: maxDays }), 1)[0];
            const returnDate = new Date(borrowDate);
            returnDate.setDate(returnDate.getDate() + duration);
            
            const result = validateLoanDuration(borrowDate, returnDate, maxDays);
            
            // Should be valid when duration is within maxDays
            expect(result.isValid).toBe(true);
            expect(result.duration).toBe(duration);
            expect(result.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should accept loan requests where duration equals exactly maxDays', () => {
      fc.assert(
        fc.property(
          validDateGenerator,
          validMaxDaysGenerator,
          (borrowDate, maxDays) => {
            // Create return date exactly at maxDays
            const returnDate = new Date(borrowDate);
            returnDate.setDate(returnDate.getDate() + maxDays);
            
            const result = validateLoanDuration(borrowDate, returnDate, maxDays);
            
            // Should be valid when duration equals maxDays exactly
            expect(result.isValid).toBe(true);
            expect(result.duration).toBe(maxDays);
            expect(result.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should reject loan requests where return date is before or same as borrow date', () => {
      fc.assert(
        fc.property(
          validDateGenerator,
          validMaxDaysGenerator,
          fc.integer({ min: 0, max: 30 }), // days to subtract (0 = same day)
          (borrowDate, maxDays, daysToSubtract) => {
            // Create return date that is same or before borrow date
            const returnDate = new Date(borrowDate);
            returnDate.setDate(returnDate.getDate() - daysToSubtract);
            
            const result = validateLoanDuration(borrowDate, returnDate, maxDays);
            
            // Should be invalid when return date is not after borrow date
            expect(result.isValid).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should calculate max return date correctly', () => {
      fc.assert(
        fc.property(
          validDateGenerator,
          validMaxDaysGenerator,
          (borrowDate, maxDays) => {
            const maxReturnDate = calculateMaxReturnDate(borrowDate, maxDays);
            
            // Max return date should be exactly maxDays after borrow date
            const expectedDate = new Date(borrowDate);
            expectedDate.setDate(expectedDate.getDate() + maxDays);
            
            expect(maxReturnDate.getTime()).toBe(expectedDate.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Max Items Enforcement', () => {
    /**
     * **Feature: user-status-system-improvement, Property 6: Max Items Enforcement**
     * **Validates: Requirements 2.2, 4.3**
     * 
     * For any user attempting to create a loan request, if currentBorrowedCount + 
     * pendingRequestsCount >= maxItems, the request should be prevented.
     */
    test('should prevent loan request when borrowed + pending >= maxItems', () => {
      fc.assert(
        fc.property(
          validMaxItemsGenerator,
          (maxItems) => {
            // Generate borrowed and pending that sum to at least maxItems
            const borrowed = fc.sample(fc.integer({ min: 0, max: maxItems }), 1)[0];
            const pending = maxItems - borrowed; // This makes total = maxItems
            
            const result = validateMaxItems(borrowed, pending, maxItems);
            
            // Should not be able to borrow when at limit
            expect(result.canBorrow).toBe(false);
            expect(result.remainingQuota).toBe(0);
            expect(result.error).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should prevent loan request when borrowed + pending > maxItems', () => {
      fc.assert(
        fc.property(
          validMaxItemsGenerator,
          fc.integer({ min: 1, max: 50 }), // extra items beyond limit
          (maxItems, extraItems) => {
            // Generate borrowed and pending that sum to more than maxItems
            const borrowed = maxItems;
            const pending = extraItems;
            
            const result = validateMaxItems(borrowed, pending, maxItems);
            
            // Should not be able to borrow when over limit
            expect(result.canBorrow).toBe(false);
            expect(result.remainingQuota).toBe(0);
            expect(result.error).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should allow loan request when borrowed + pending < maxItems', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 50 }), // maxItems at least 2 to have room
          (maxItems) => {
            // Generate borrowed and pending that sum to less than maxItems
            const maxUsed = maxItems - 1;
            const borrowed = fc.sample(fc.integer({ min: 0, max: maxUsed }), 1)[0];
            const pending = fc.sample(fc.integer({ min: 0, max: maxUsed - borrowed }), 1)[0];
            
            const result = validateMaxItems(borrowed, pending, maxItems);
            
            // Should be able to borrow when under limit
            expect(result.canBorrow).toBe(true);
            expect(result.remainingQuota).toBeGreaterThan(0);
            expect(result.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should calculate remaining quota correctly', () => {
      fc.assert(
        fc.property(
          validMaxItemsGenerator,
          borrowedCountGenerator,
          pendingCountGenerator,
          (maxItems, borrowed, pending) => {
            const result = validateMaxItems(borrowed, pending, maxItems);
            
            // Remaining quota should be max(0, maxItems - borrowed - pending)
            const expectedQuota = Math.max(0, maxItems - borrowed - pending);
            expect(result.remainingQuota).toBe(expectedQuota);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should never return negative remaining quota', () => {
      fc.assert(
        fc.property(
          validMaxItemsGenerator,
          borrowedCountGenerator,
          pendingCountGenerator,
          (maxItems, borrowed, pending) => {
            const result = validateMaxItems(borrowed, pending, maxItems);
            
            // Remaining quota should never be negative
            expect(result.remainingQuota).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return maxItems as remaining quota when borrowed and pending are 0', () => {
      fc.assert(
        fc.property(
          validMaxItemsGenerator,
          (maxItems) => {
            const result = validateMaxItems(0, 0, maxItems);
            
            // Should have full quota available
            expect(result.canBorrow).toBe(true);
            expect(result.remainingQuota).toBe(maxItems);
            expect(result.error).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    test('canBorrow should be true if and only if remainingQuota > 0', () => {
      fc.assert(
        fc.property(
          validMaxItemsGenerator,
          borrowedCountGenerator,
          pendingCountGenerator,
          (maxItems, borrowed, pending) => {
            const result = validateMaxItems(borrowed, pending, maxItems);
            
            // canBorrow should be equivalent to remainingQuota > 0
            expect(result.canBorrow).toBe(result.remainingQuota > 0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
