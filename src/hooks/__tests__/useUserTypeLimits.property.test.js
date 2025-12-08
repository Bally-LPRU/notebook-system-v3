/**
 * Property-based tests for useUserTypeLimits hook
 * Tests universal properties that should hold across all valid inputs
 * 
 * Feature: user-status-system-improvement
 * Requirements: 1.2, 1.3, 7.3, 7.4
 */

import fc from 'fast-check';
import {
  calculateRemainingQuota,
  getUserTypeLabel,
  getUserTypeLimitsFromSettings
} from '../useUserTypeLimits';
import {
  USER_TYPE_NAMES,
  DEFAULT_USER_TYPE_LIMITS,
  DEFAULT_SETTINGS
} from '../../types/settings';

// Generators for valid user types
const validUserTypeGenerator = fc.constantFrom('teacher', 'staff', 'student');

// Generator for invalid/null user types
const invalidUserTypeGenerator = fc.constantFrom(null, undefined, '', 'invalid', 'unknown');

// Generator for valid maxItems values
const validMaxItemsGenerator = fc.integer({ min: 1, max: 50 });

// Generator for valid maxDays values
const validMaxDaysGenerator = fc.integer({ min: 1, max: 365 });

// Generator for valid maxAdvanceBookingDays values
const validAdvanceBookingDaysGenerator = fc.integer({ min: 1, max: 365 });

// Generator for borrowed count (non-negative)
const borrowedCountGenerator = fc.integer({ min: 0, max: 100 });

// Generator for pending count (non-negative)
const pendingCountGenerator = fc.integer({ min: 0, max: 100 });

// Generator for user type limits object
const userTypeLimitsGenerator = fc.record({
  maxItems: validMaxItemsGenerator,
  maxDays: validMaxDaysGenerator,
  maxAdvanceBookingDays: validAdvanceBookingDaysGenerator,
  isActive: fc.boolean(),
  userTypeName: fc.string({ minLength: 1, maxLength: 50 })
});

// Generator for settings with userTypeLimitsEnabled = true
const settingsWithLimitsEnabledGenerator = fc.record({
  userTypeLimitsEnabled: fc.constant(true),
  userTypeLimits: fc.record({
    teacher: userTypeLimitsGenerator,
    staff: userTypeLimitsGenerator,
    student: userTypeLimitsGenerator
  }),
  maxLoanDuration: validMaxDaysGenerator,
  maxAdvanceBookingDays: validAdvanceBookingDaysGenerator,
  defaultCategoryLimit: validMaxItemsGenerator
});

// Generator for settings with userTypeLimitsEnabled = false
const settingsWithLimitsDisabledGenerator = fc.record({
  userTypeLimitsEnabled: fc.constant(false),
  maxLoanDuration: validMaxDaysGenerator,
  maxAdvanceBookingDays: validAdvanceBookingDaysGenerator,
  defaultCategoryLimit: validMaxItemsGenerator
});

describe('useUserTypeLimits property-based tests', () => {
  describe('Property 1: User Type Limits Return Correct Values', () => {
    /**
     * **Feature: user-status-system-improvement, Property 1: User Type Limits Return Correct Values**
     * **Validates: Requirements 1.2, 7.3**
     * 
     * For any user with a valid user type (teacher/staff/student), when userTypeLimitsEnabled 
     * is true, the getUserTypeLimitsFromSettings function should return the limits configured 
     * for that user type in settings.
     */
    test('should return correct limits for valid user types when limits are enabled', () => {
      fc.assert(
        fc.property(
          settingsWithLimitsEnabledGenerator,
          validUserTypeGenerator,
          (settings, userType) => {
            const result = getUserTypeLimitsFromSettings(settings, userType);
            const expectedLimits = settings.userTypeLimits[userType];
            
            // If the user type limit is active, should return those limits
            if (expectedLimits.isActive) {
              expect(result.maxItems).toBe(expectedLimits.maxItems);
              expect(result.maxDays).toBe(expectedLimits.maxDays);
              expect(result.maxAdvanceBookingDays).toBe(expectedLimits.maxAdvanceBookingDays);
              expect(result.isEnabled).toBe(true);
              expect(result.userType).toBe(userType);
            }
            
            // Should always have valid structure
            expect(typeof result.maxItems).toBe('number');
            expect(typeof result.maxDays).toBe('number');
            expect(typeof result.maxAdvanceBookingDays).toBe('number');
            expect(result.maxItems).toBeGreaterThan(0);
            expect(result.maxDays).toBeGreaterThan(0);
            expect(result.maxAdvanceBookingDays).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Default Limits Fallback', () => {
    /**
     * **Feature: user-status-system-improvement, Property 2: Default Limits Fallback**
     * **Validates: Requirements 1.3, 7.4**
     * 
     * For any user, when userTypeLimitsEnabled is false, the getUserTypeLimitsFromSettings 
     * function should return the default system-wide limits.
     */
    test('should return default system limits when userTypeLimitsEnabled is false', () => {
      fc.assert(
        fc.property(
          settingsWithLimitsDisabledGenerator,
          fc.oneof(validUserTypeGenerator, invalidUserTypeGenerator),
          (settings, userType) => {
            const result = getUserTypeLimitsFromSettings(settings, userType);
            
            // Should return system-wide defaults
            expect(result.maxItems).toBe(settings.defaultCategoryLimit);
            expect(result.maxDays).toBe(settings.maxLoanDuration);
            expect(result.maxAdvanceBookingDays).toBe(settings.maxAdvanceBookingDays);
            expect(result.isEnabled).toBe(false);
            expect(result.isDefault).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return default limits when settings is null or undefined', () => {
      fc.assert(
        fc.property(
          fc.oneof(validUserTypeGenerator, invalidUserTypeGenerator),
          (userType) => {
            const resultNull = getUserTypeLimitsFromSettings(null, userType);
            const resultUndefined = getUserTypeLimitsFromSettings(undefined, userType);
            
            // Should return DEFAULT_SETTINGS values
            expect(resultNull.maxItems).toBe(DEFAULT_SETTINGS.defaultCategoryLimit);
            expect(resultNull.maxDays).toBe(DEFAULT_SETTINGS.maxLoanDuration);
            expect(resultNull.maxAdvanceBookingDays).toBe(DEFAULT_SETTINGS.maxAdvanceBookingDays);
            expect(resultNull.isDefault).toBe(true);
            
            expect(resultUndefined.maxItems).toBe(DEFAULT_SETTINGS.defaultCategoryLimit);
            expect(resultUndefined.maxDays).toBe(DEFAULT_SETTINGS.maxLoanDuration);
            expect(resultUndefined.maxAdvanceBookingDays).toBe(DEFAULT_SETTINGS.maxAdvanceBookingDays);
            expect(resultUndefined.isDefault).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 7: User Type Label Mapping', () => {
    /**
     * **Feature: user-status-system-improvement, Property 7: User Type Label Mapping**
     * **Validates: Requirements 3.1, 8.1**
     * 
     * For any user type value, the corresponding Thai label should be:
     * teacher → "อาจารย์", staff → "เจ้าหน้าที่", student → "นักศึกษา"
     */
    test('should return correct Thai labels for all valid user types', () => {
      fc.assert(
        fc.property(
          validUserTypeGenerator,
          (userType) => {
            const label = getUserTypeLabel(userType);
            
            // Verify correct mapping
            expect(label).toBe(USER_TYPE_NAMES[userType]);
            
            // Verify specific mappings
            if (userType === 'teacher') {
              expect(label).toBe('อาจารย์');
            } else if (userType === 'staff') {
              expect(label).toBe('เจ้าหน้าที่');
            } else if (userType === 'student') {
              expect(label).toBe('นักศึกษา');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return "ไม่ระบุ" for invalid or null user types', () => {
      fc.assert(
        fc.property(
          invalidUserTypeGenerator,
          (userType) => {
            const label = getUserTypeLabel(userType);
            expect(label).toBe('ไม่ระบุ');
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});


describe('Property 3: Remaining Quota Calculation', () => {
  /**
   * **Feature: user-status-system-improvement, Property 3: Remaining Quota Calculation**
   * **Validates: Requirements 1.4, 6.2, 6.4**
   * 
   * For any user with maxItems limit M, currentBorrowedCount B, and pendingRequestsCount P,
   * the remainingQuota should equal max(0, M - B - P).
   */
  test('should calculate remaining quota correctly: max(0, maxItems - borrowed - pending)', () => {
    fc.assert(
      fc.property(
        validMaxItemsGenerator,
        borrowedCountGenerator,
        pendingCountGenerator,
        (maxItems, borrowed, pending) => {
          const result = calculateRemainingQuota(maxItems, borrowed, pending);
          const expected = Math.max(0, maxItems - borrowed - pending);
          
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should never return negative values', () => {
    fc.assert(
      fc.property(
        validMaxItemsGenerator,
        borrowedCountGenerator,
        pendingCountGenerator,
        (maxItems, borrowed, pending) => {
          const result = calculateRemainingQuota(maxItems, borrowed, pending);
          
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should return 0 when borrowed + pending >= maxItems', () => {
    fc.assert(
      fc.property(
        validMaxItemsGenerator,
        (maxItems) => {
          // Generate borrowed and pending that sum to at least maxItems
          const borrowed = maxItems;
          const pending = fc.sample(fc.integer({ min: 0, max: 50 }), 1)[0];
          
          const result = calculateRemainingQuota(maxItems, borrowed, pending);
          
          expect(result).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('should return maxItems when borrowed and pending are both 0', () => {
    fc.assert(
      fc.property(
        validMaxItemsGenerator,
        (maxItems) => {
          const result = calculateRemainingQuota(maxItems, 0, 0);
          
          expect(result).toBe(maxItems);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('should decrease by 1 for each borrowed item', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }), // maxItems at least 2
        fc.integer({ min: 0, max: 10 }), // pending
        (maxItems, pending) => {
          const quotaWithZeroBorrowed = calculateRemainingQuota(maxItems, 0, pending);
          const quotaWithOneBorrowed = calculateRemainingQuota(maxItems, 1, pending);
          
          // If quota with zero borrowed is > 0, then quota with one borrowed should be exactly 1 less
          if (quotaWithZeroBorrowed > 0) {
            expect(quotaWithOneBorrowed).toBe(quotaWithZeroBorrowed - 1);
          } else {
            // Both should be 0
            expect(quotaWithOneBorrowed).toBe(0);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('should decrease by 1 for each pending request', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }), // maxItems at least 2
        fc.integer({ min: 0, max: 10 }), // borrowed
        (maxItems, borrowed) => {
          const quotaWithZeroPending = calculateRemainingQuota(maxItems, borrowed, 0);
          const quotaWithOnePending = calculateRemainingQuota(maxItems, borrowed, 1);
          
          // If quota with zero pending is > 0, then quota with one pending should be exactly 1 less
          if (quotaWithZeroPending > 0) {
            expect(quotaWithOnePending).toBe(quotaWithZeroPending - 1);
          } else {
            // Both should be 0
            expect(quotaWithOnePending).toBe(0);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
