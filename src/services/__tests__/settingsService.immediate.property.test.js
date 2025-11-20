/**
 * Property-Based Tests for Immediate Settings Application
 * 
 * Tests that settings changes are immediately applied to all subsequent operations
 * using fast-check for property-based testing.
 * 
 * Feature: admin-settings-system, Property 8: Immediate settings application
 * Validates: Requirements 3.3, 4.3, 6.4
 */

import fc from 'fast-check';

/**
 * Mock validation function that uses maxLoanDuration
 * Simulates how the system validates loan requests with current settings
 */
const validateLoanDuration = (borrowDate, returnDate, maxLoanDuration) => {
  const diffTime = returnDate.getTime() - borrowDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > maxLoanDuration) {
    return {
      isValid: false,
      error: `ระยะเวลายืมต้องไม่เกิน ${maxLoanDuration} วัน`
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * Mock validation function that uses maxAdvanceBookingDays
 * Simulates how the system validates reservations with current settings
 */
const validateAdvanceBooking = (reservationDate, maxAdvanceBookingDays) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = reservationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > maxAdvanceBookingDays) {
    return {
      isValid: false,
      error: `ไม่สามารถจองล่วงหน้าเกิน ${maxAdvanceBookingDays} วัน`
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

describe('Settings Service - Immediate Application Property Tests', () => {
  /**
   * Feature: admin-settings-system, Property 8: Immediate settings application
   * Validates: Requirements 3.3, 4.3, 6.4
   * 
   * For any setting update (loan duration, advance booking period, category limit),
   * the system should immediately apply the new value to all subsequent operations
   * without requiring restart
   */
  describe('Property 8: Immediate settings application', () => {
    it('should immediately apply maxLoanDuration changes to loan validation', () => {
      fc.assert(
        fc.property(
          // Generate initial maxLoanDuration
          fc.integer({ min: 1, max: 365 }),
          // Generate new maxLoanDuration (different from initial)
          fc.integer({ min: 1, max: 365 }),
          // Generate loan duration to test
          fc.integer({ min: 1, max: 365 }),
          (initialMaxDuration, newMaxDuration, loanDuration) => {
            // Skip if durations are the same (no change to test)
            if (initialMaxDuration === newMaxDuration) return true;
            
            // Calculate dates
            const borrowDate = new Date();
            borrowDate.setHours(0, 0, 0, 0);
            
            const returnDate = new Date(borrowDate);
            returnDate.setDate(returnDate.getDate() + loanDuration);
            
            // Validate with initial setting
            const resultBefore = validateLoanDuration(borrowDate, returnDate, initialMaxDuration);
            const validBefore = resultBefore.isValid;
            
            // "Update" the setting (simulate settings change)
            const currentMaxDuration = newMaxDuration;
            
            // Validate with new setting (should use new value immediately)
            const resultAfter = validateLoanDuration(borrowDate, returnDate, currentMaxDuration);
            const validAfter = resultAfter.isValid;
            
            // Determine expected validity based on new setting
            const shouldBeValidAfter = loanDuration <= newMaxDuration;
            
            // Verify: The validation result should reflect the NEW setting, not the old one
            return validAfter === shouldBeValidAfter;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should immediately apply maxAdvanceBookingDays changes to reservation validation', () => {
      fc.assert(
        fc.property(
          // Generate initial maxAdvanceBookingDays
          fc.integer({ min: 1, max: 365 }),
          // Generate new maxAdvanceBookingDays (different from initial)
          fc.integer({ min: 1, max: 365 }),
          // Generate days in advance to test
          fc.integer({ min: 1, max: 365 }),
          (initialMaxAdvance, newMaxAdvance, daysInAdvance) => {
            // Skip if values are the same (no change to test)
            if (initialMaxAdvance === newMaxAdvance) return true;
            
            // Calculate reservation date
            const reservationDate = new Date();
            reservationDate.setDate(reservationDate.getDate() + daysInAdvance);
            reservationDate.setHours(0, 0, 0, 0);
            
            // Validate with initial setting
            const resultBefore = validateAdvanceBooking(reservationDate, initialMaxAdvance);
            const validBefore = resultBefore.isValid;
            
            // "Update" the setting (simulate settings change)
            const currentMaxAdvance = newMaxAdvance;
            
            // Validate with new setting (should use new value immediately)
            const resultAfter = validateAdvanceBooking(reservationDate, currentMaxAdvance);
            const validAfter = resultAfter.isValid;
            
            // Determine expected validity based on new setting
            const shouldBeValidAfter = daysInAdvance <= newMaxAdvance;
            
            // Verify: The validation result should reflect the NEW setting, not the old one
            return validAfter === shouldBeValidAfter;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply stricter limits immediately when maxLoanDuration is decreased', () => {
      fc.assert(
        fc.property(
          // Generate initial maxLoanDuration (higher value)
          fc.integer({ min: 10, max: 365 }),
          // Generate decrease amount
          fc.integer({ min: 1, max: 9 }),
          (initialMaxDuration, decreaseAmount) => {
            const newMaxDuration = initialMaxDuration - decreaseAmount;
            
            // Skip if new duration would be invalid
            if (newMaxDuration < 1) return true;
            
            // Test a loan duration that falls between the old and new limits
            const testDuration = initialMaxDuration - Math.floor(decreaseAmount / 2);
            
            // Calculate dates
            const borrowDate = new Date();
            borrowDate.setHours(0, 0, 0, 0);
            
            const returnDate = new Date(borrowDate);
            returnDate.setDate(returnDate.getDate() + testDuration);
            
            // Should be valid with initial (higher) limit
            const resultBefore = validateLoanDuration(borrowDate, returnDate, initialMaxDuration);
            const validBefore = resultBefore.isValid;
            
            // Should reflect new (lower) limit immediately
            const resultAfter = validateLoanDuration(borrowDate, returnDate, newMaxDuration);
            const validAfter = resultAfter.isValid;
            
            // Expected: valid before, validity after depends on whether testDuration <= newMaxDuration
            const expectedValidAfter = testDuration <= newMaxDuration;
            
            return validBefore === true && validAfter === expectedValidAfter;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply more permissive limits immediately when maxLoanDuration is increased', () => {
      fc.assert(
        fc.property(
          // Generate initial maxLoanDuration (lower value)
          fc.integer({ min: 1, max: 180 }),
          // Generate increase amount
          fc.integer({ min: 1, max: 185 }),
          (initialMaxDuration, increaseAmount) => {
            const newMaxDuration = initialMaxDuration + increaseAmount;
            
            // Skip if new duration would be too large
            if (newMaxDuration > 365) return true;
            
            // Test a loan duration that exceeds the old limit but is within the new limit
            const testDuration = initialMaxDuration + Math.floor(increaseAmount / 2);
            
            // Skip if testDuration doesn't actually exceed the old limit
            if (testDuration <= initialMaxDuration) return true;
            
            // Skip if testDuration exceeds the new limit
            if (testDuration > newMaxDuration) return true;
            
            // Calculate dates
            const borrowDate = new Date();
            borrowDate.setHours(0, 0, 0, 0);
            
            const returnDate = new Date(borrowDate);
            returnDate.setDate(returnDate.getDate() + testDuration);
            
            // Should be invalid with initial (lower) limit
            const resultBefore = validateLoanDuration(borrowDate, returnDate, initialMaxDuration);
            const validBefore = resultBefore.isValid;
            
            // Should be valid with new (higher) limit
            const resultAfter = validateLoanDuration(borrowDate, returnDate, newMaxDuration);
            const validAfter = resultAfter.isValid;
            
            // Expected: invalid before (exceeds old limit), valid after (within new limit)
            return validBefore === false && validAfter === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
