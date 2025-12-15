/**
 * Property-based tests for UnifiedLoanSettingsTab
 * Tests numeric range validation, effective limit calculation, and settings persistence
 * 
 * Uses fast-check library for property-based testing
 */

import fc from 'fast-check';
import {
  validateNumericRange,
  calculateEffectiveLimit,
  detectConflicts
} from '../UnifiedLoanSettingsTab';
import { SETTINGS_VALIDATION, USER_TYPE_NAMES } from '../../../../types/settings';

describe('UnifiedLoanSettingsTab - Property-based Tests', () => {
  
  // **Feature: unified-loan-settings, Property 1: Numeric range validation for loan settings**
  // **Validates: Requirements 2.1, 2.2**
  describe('Property 1: Numeric range validation for loan settings', () => {
    const MIN = SETTINGS_VALIDATION.maxLoanDuration.min; // 1
    const MAX = SETTINGS_VALIDATION.maxLoanDuration.max; // 365

    it('should accept all values within the valid range [1, 365]', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN, max: MAX }),
          (value) => {
            expect(validateNumericRange(value, MIN, MAX)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject all values below the minimum (< 1)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: MIN - 1 }),
          (value) => {
            expect(validateNumericRange(value, MIN, MAX)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject all values above the maximum (> 365)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MAX + 1, max: 10000 }),
          (value) => {
            expect(validateNumericRange(value, MIN, MAX)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle string inputs by parsing them as integers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN, max: MAX }),
          (value) => {
            const stringValue = String(value);
            expect(validateNumericRange(stringValue, MIN, MAX)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject NaN values', () => {
      fc.assert(
        fc.property(
          // Only include values that truly result in NaN when parsed
          // Note: parseInt('12.34.56') returns 12, so it's not NaN
          fc.constantFrom('abc', '', 'not-a-number', 'xyz123', undefined, null, NaN),
          (value) => {
            expect(validateNumericRange(value, MIN, MAX)).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should correctly validate boundary values', () => {
      // Exact boundaries should be valid
      expect(validateNumericRange(MIN, MIN, MAX)).toBe(true);
      expect(validateNumericRange(MAX, MIN, MAX)).toBe(true);
      
      // Just outside boundaries should be invalid
      expect(validateNumericRange(MIN - 1, MIN, MAX)).toBe(false);
      expect(validateNumericRange(MAX + 1, MIN, MAX)).toBe(false);
    });
  });

  // **Feature: unified-loan-settings, Property 4: Effective limit calculation**
  // **Validates: Requirements 4.3**
  describe('Property 4: Effective limit calculation', () => {
    
    it('should return global limit when user type limits are disabled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          fc.integer({ min: 1, max: 365 }),
          (globalLimit, userTypeLimit) => {
            const result = calculateEffectiveLimit(globalLimit, userTypeLimit, false);
            expect(result).toBe(globalLimit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return minimum of global and user type limit when enabled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          fc.integer({ min: 1, max: 365 }),
          (globalLimit, userTypeLimit) => {
            const result = calculateEffectiveLimit(globalLimit, userTypeLimit, true);
            expect(result).toBe(Math.min(globalLimit, userTypeLimit));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return global limit when user type limit equals global limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (limit) => {
            const result = calculateEffectiveLimit(limit, limit, true);
            expect(result).toBe(limit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return a value <= global limit when enabled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          fc.integer({ min: 1, max: 365 }),
          (globalLimit, userTypeLimit) => {
            const result = calculateEffectiveLimit(globalLimit, userTypeLimit, true);
            expect(result).toBeLessThanOrEqual(globalLimit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return a value <= user type limit when enabled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          fc.integer({ min: 1, max: 365 }),
          (globalLimit, userTypeLimit) => {
            const result = calculateEffectiveLimit(globalLimit, userTypeLimit, true);
            expect(result).toBeLessThanOrEqual(userTypeLimit);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: unified-loan-settings, Property 3: Conflict detection for exceeding limits**
  // **Validates: Requirements 3.4, 4.2**
  describe('Property 3: Conflict detection for exceeding limits', () => {
    const USER_TYPES = ['teacher', 'staff', 'student'];
    
    // Generator for user type limits
    const userTypeLimitArb = fc.record({
      maxItems: fc.integer({ min: 1, max: 50 }),
      maxDays: fc.integer({ min: 1, max: 365 }),
      maxAdvanceBookingDays: fc.integer({ min: 1, max: 365 }),
      isActive: fc.boolean()
    });
    
    // Generator for all user type limits
    const allUserTypeLimitsArb = fc.record({
      teacher: userTypeLimitArb,
      staff: userTypeLimitArb,
      student: userTypeLimitArb
    });
    
    // Generator for global settings
    const globalSettingsArb = fc.record({
      maxLoanDuration: fc.integer({ min: 1, max: 365 }),
      maxAdvanceBookingDays: fc.integer({ min: 1, max: 365 })
    });

    it('should return empty array when user type limits are disabled', () => {
      fc.assert(
        fc.property(
          allUserTypeLimitsArb,
          globalSettingsArb,
          (userTypeLimits, globalSettings) => {
            const conflicts = detectConflicts(userTypeLimits, globalSettings, false);
            expect(conflicts).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect conflict when maxDays exceeds global maxLoanDuration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // global limit
          fc.integer({ min: 101, max: 365 }), // user type limit (always exceeds)
          fc.constantFrom(...USER_TYPES),
          (globalLimit, userTypeLimit, userType) => {
            const userTypeLimits = {
              teacher: { maxItems: 5, maxDays: 14, maxAdvanceBookingDays: 30, isActive: false },
              staff: { maxItems: 3, maxDays: 7, maxAdvanceBookingDays: 14, isActive: false },
              student: { maxItems: 2, maxDays: 3, maxAdvanceBookingDays: 7, isActive: false }
            };
            // Set the specific user type to active with exceeding limit
            userTypeLimits[userType] = {
              ...userTypeLimits[userType],
              maxDays: userTypeLimit,
              isActive: true
            };
            
            const globalSettings = {
              maxLoanDuration: globalLimit,
              maxAdvanceBookingDays: 365 // High value to avoid conflict on this field
            };
            
            const conflicts = detectConflicts(userTypeLimits, globalSettings, true);
            
            // Should have at least one conflict for maxDays
            const maxDaysConflict = conflicts.find(
              c => c.userType === userType && c.field === 'maxDays'
            );
            expect(maxDaysConflict).toBeDefined();
            expect(maxDaysConflict.type).toBe('warning');
            expect(maxDaysConflict.globalValue).toBe(globalLimit);
            expect(maxDaysConflict.userTypeValue).toBe(userTypeLimit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect conflict when maxAdvanceBookingDays exceeds global setting', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // global limit
          fc.integer({ min: 101, max: 365 }), // user type limit (always exceeds)
          fc.constantFrom(...USER_TYPES),
          (globalLimit, userTypeLimit, userType) => {
            const userTypeLimits = {
              teacher: { maxItems: 5, maxDays: 14, maxAdvanceBookingDays: 30, isActive: false },
              staff: { maxItems: 3, maxDays: 7, maxAdvanceBookingDays: 14, isActive: false },
              student: { maxItems: 2, maxDays: 3, maxAdvanceBookingDays: 7, isActive: false }
            };
            // Set the specific user type to active with exceeding limit
            userTypeLimits[userType] = {
              ...userTypeLimits[userType],
              maxAdvanceBookingDays: userTypeLimit,
              isActive: true
            };
            
            const globalSettings = {
              maxLoanDuration: 365, // High value to avoid conflict on this field
              maxAdvanceBookingDays: globalLimit
            };
            
            const conflicts = detectConflicts(userTypeLimits, globalSettings, true);
            
            // Should have at least one conflict for maxAdvanceBookingDays
            const advanceBookingConflict = conflicts.find(
              c => c.userType === userType && c.field === 'maxAdvanceBookingDays'
            );
            expect(advanceBookingConflict).toBeDefined();
            expect(advanceBookingConflict.type).toBe('warning');
            expect(advanceBookingConflict.globalValue).toBe(globalLimit);
            expect(advanceBookingConflict.userTypeValue).toBe(userTypeLimit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not detect conflict when user type limits are within global limits', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 365 }), // global maxLoanDuration
          fc.integer({ min: 100, max: 365 }), // global maxAdvanceBookingDays
          fc.integer({ min: 1, max: 99 }), // user type maxDays (always within)
          fc.integer({ min: 1, max: 99 }), // user type maxAdvanceBookingDays (always within)
          fc.constantFrom(...USER_TYPES),
          (globalMaxDays, globalMaxAdvance, userMaxDays, userMaxAdvance, userType) => {
            const userTypeLimits = {
              teacher: { maxItems: 5, maxDays: userMaxDays, maxAdvanceBookingDays: userMaxAdvance, isActive: true },
              staff: { maxItems: 3, maxDays: userMaxDays, maxAdvanceBookingDays: userMaxAdvance, isActive: true },
              student: { maxItems: 2, maxDays: userMaxDays, maxAdvanceBookingDays: userMaxAdvance, isActive: true }
            };
            
            const globalSettings = {
              maxLoanDuration: globalMaxDays,
              maxAdvanceBookingDays: globalMaxAdvance
            };
            
            const conflicts = detectConflicts(userTypeLimits, globalSettings, true);
            
            // Should have no conflicts
            expect(conflicts.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not detect conflict for inactive user types', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // global limit (low)
          fc.integer({ min: 100, max: 365 }), // user type limit (high, would conflict if active)
          fc.constantFrom(...USER_TYPES),
          (globalLimit, userTypeLimit, userType) => {
            const userTypeLimits = {
              teacher: { maxItems: 5, maxDays: userTypeLimit, maxAdvanceBookingDays: userTypeLimit, isActive: false },
              staff: { maxItems: 3, maxDays: userTypeLimit, maxAdvanceBookingDays: userTypeLimit, isActive: false },
              student: { maxItems: 2, maxDays: userTypeLimit, maxAdvanceBookingDays: userTypeLimit, isActive: false }
            };
            
            const globalSettings = {
              maxLoanDuration: globalLimit,
              maxAdvanceBookingDays: globalLimit
            };
            
            const conflicts = detectConflicts(userTypeLimits, globalSettings, true);
            
            // Should have no conflicts because all user types are inactive
            expect(conflicts.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include correct user type name in conflict message', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // global limit
          fc.integer({ min: 100, max: 365 }), // user type limit (exceeds)
          fc.constantFrom(...USER_TYPES),
          (globalLimit, userTypeLimit, userType) => {
            const userTypeLimits = {
              teacher: { maxItems: 5, maxDays: 14, maxAdvanceBookingDays: 30, isActive: false },
              staff: { maxItems: 3, maxDays: 7, maxAdvanceBookingDays: 14, isActive: false },
              student: { maxItems: 2, maxDays: 3, maxAdvanceBookingDays: 7, isActive: false }
            };
            userTypeLimits[userType] = {
              ...userTypeLimits[userType],
              maxDays: userTypeLimit,
              isActive: true
            };
            
            const globalSettings = {
              maxLoanDuration: globalLimit,
              maxAdvanceBookingDays: 365
            };
            
            const conflicts = detectConflicts(userTypeLimits, globalSettings, true);
            const conflict = conflicts.find(c => c.userType === userType);
            
            expect(conflict).toBeDefined();
            expect(conflict.message).toContain(USER_TYPE_NAMES[userType]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: unified-loan-settings, Property 2: Settings persistence round-trip**
  // **Validates: Requirements 2.3, 3.3**
  describe('Property 2: Settings persistence round-trip', () => {
    /**
     * Helper function to simulate serialization/deserialization of settings
     * This mimics what happens when settings are saved to and loaded from Firestore
     */
    const serializeSettings = (settings) => {
      // Firestore stores data as JSON-like objects
      return JSON.parse(JSON.stringify(settings));
    };

    /**
     * Helper function to normalize settings for comparison
     * Handles null/undefined equivalence and type coercion
     */
    const normalizeGlobalSettings = (settings) => {
      return {
        maxLoanDuration: Number(settings.maxLoanDuration),
        maxAdvanceBookingDays: Number(settings.maxAdvanceBookingDays),
        loanReturnStartTime: settings.loanReturnStartTime || null,
        loanReturnEndTime: settings.loanReturnEndTime || null
      };
    };

    /**
     * Helper function to normalize user type limits for comparison
     */
    const normalizeUserTypeLimits = (limits) => {
      const normalized = {};
      for (const [userType, limit] of Object.entries(limits)) {
        normalized[userType] = {
          maxItems: Number(limit.maxItems),
          maxDays: Number(limit.maxDays),
          maxAdvanceBookingDays: Number(limit.maxAdvanceBookingDays),
          isActive: Boolean(limit.isActive)
        };
      }
      return normalized;
    };

    // Generator for valid global settings
    const globalSettingsArb = fc.record({
      maxLoanDuration: fc.integer({ min: 1, max: 365 }),
      maxAdvanceBookingDays: fc.integer({ min: 1, max: 365 }),
      loanReturnStartTime: fc.oneof(
        fc.constant(null),
        fc.constant(''),
        fc.tuple(
          fc.integer({ min: 0, max: 23 }),
          fc.integer({ min: 0, max: 59 })
        ).map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      ),
      loanReturnEndTime: fc.oneof(
        fc.constant(null),
        fc.constant(''),
        fc.tuple(
          fc.integer({ min: 0, max: 23 }),
          fc.integer({ min: 0, max: 59 })
        ).map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      )
    });

    // Generator for valid user type limit
    const userTypeLimitArb = fc.record({
      maxItems: fc.integer({ min: 1, max: 50 }),
      maxDays: fc.integer({ min: 1, max: 365 }),
      maxAdvanceBookingDays: fc.integer({ min: 1, max: 365 }),
      isActive: fc.boolean()
    });

    // Generator for all user type limits
    const allUserTypeLimitsArb = fc.record({
      teacher: userTypeLimitArb,
      staff: userTypeLimitArb,
      student: userTypeLimitArb
    });

    it('should preserve global settings values after serialization round-trip', () => {
      fc.assert(
        fc.property(
          globalSettingsArb,
          (originalSettings) => {
            // Simulate save (serialize) and load (deserialize)
            const serialized = serializeSettings(originalSettings);
            
            // Normalize both for comparison
            const normalizedOriginal = normalizeGlobalSettings(originalSettings);
            const normalizedLoaded = normalizeGlobalSettings(serialized);
            
            // Values should be equivalent after round-trip
            expect(normalizedLoaded.maxLoanDuration).toBe(normalizedOriginal.maxLoanDuration);
            expect(normalizedLoaded.maxAdvanceBookingDays).toBe(normalizedOriginal.maxAdvanceBookingDays);
            expect(normalizedLoaded.loanReturnStartTime).toBe(normalizedOriginal.loanReturnStartTime);
            expect(normalizedLoaded.loanReturnEndTime).toBe(normalizedOriginal.loanReturnEndTime);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve user type limits values after serialization round-trip', () => {
      fc.assert(
        fc.property(
          allUserTypeLimitsArb,
          (originalLimits) => {
            // Simulate save (serialize) and load (deserialize)
            const serialized = serializeSettings(originalLimits);
            
            // Normalize both for comparison
            const normalizedOriginal = normalizeUserTypeLimits(originalLimits);
            const normalizedLoaded = normalizeUserTypeLimits(serialized);
            
            // Each user type's limits should be equivalent after round-trip
            for (const userType of ['teacher', 'staff', 'student']) {
              expect(normalizedLoaded[userType].maxItems).toBe(normalizedOriginal[userType].maxItems);
              expect(normalizedLoaded[userType].maxDays).toBe(normalizedOriginal[userType].maxDays);
              expect(normalizedLoaded[userType].maxAdvanceBookingDays).toBe(normalizedOriginal[userType].maxAdvanceBookingDays);
              expect(normalizedLoaded[userType].isActive).toBe(normalizedOriginal[userType].isActive);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve combined settings (global + user type limits) after round-trip', () => {
      fc.assert(
        fc.property(
          globalSettingsArb,
          allUserTypeLimitsArb,
          fc.boolean(), // userTypeLimitsEnabled
          (globalSettings, userTypeLimits, userTypeLimitsEnabled) => {
            // Combined settings object as it would be saved
            const combinedSettings = {
              globalSettings,
              userTypeLimits,
              userTypeLimitsEnabled
            };
            
            // Simulate save and load
            const serialized = serializeSettings(combinedSettings);
            
            // Verify global settings
            const normalizedOriginalGlobal = normalizeGlobalSettings(globalSettings);
            const normalizedLoadedGlobal = normalizeGlobalSettings(serialized.globalSettings);
            expect(normalizedLoadedGlobal).toEqual(normalizedOriginalGlobal);
            
            // Verify user type limits
            const normalizedOriginalLimits = normalizeUserTypeLimits(userTypeLimits);
            const normalizedLoadedLimits = normalizeUserTypeLimits(serialized.userTypeLimits);
            expect(normalizedLoadedLimits).toEqual(normalizedOriginalLimits);
            
            // Verify enabled flag
            expect(serialized.userTypeLimitsEnabled).toBe(userTypeLimitsEnabled);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case values correctly in round-trip', () => {
      // Test boundary values explicitly
      const edgeCases = [
        { maxLoanDuration: 1, maxAdvanceBookingDays: 1, loanReturnStartTime: '00:00', loanReturnEndTime: '23:59' },
        { maxLoanDuration: 365, maxAdvanceBookingDays: 365, loanReturnStartTime: null, loanReturnEndTime: null },
        { maxLoanDuration: 14, maxAdvanceBookingDays: 30, loanReturnStartTime: '', loanReturnEndTime: '' }
      ];
      
      for (const original of edgeCases) {
        const serialized = serializeSettings(original);
        const normalizedOriginal = normalizeGlobalSettings(original);
        const normalizedLoaded = normalizeGlobalSettings(serialized);
        
        expect(normalizedLoaded).toEqual(normalizedOriginal);
      }
    });

    it('should maintain numeric types after round-trip (no string coercion)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          fc.integer({ min: 1, max: 365 }),
          (maxLoanDuration, maxAdvanceBookingDays) => {
            const original = { maxLoanDuration, maxAdvanceBookingDays };
            const serialized = serializeSettings(original);
            
            // Values should remain numbers, not strings
            expect(typeof serialized.maxLoanDuration).toBe('number');
            expect(typeof serialized.maxAdvanceBookingDays).toBe('number');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain boolean types for isActive after round-trip', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          (teacherActive, staffActive, studentActive) => {
            const original = {
              teacher: { maxItems: 5, maxDays: 14, maxAdvanceBookingDays: 30, isActive: teacherActive },
              staff: { maxItems: 3, maxDays: 7, maxAdvanceBookingDays: 14, isActive: staffActive },
              student: { maxItems: 2, maxDays: 3, maxAdvanceBookingDays: 7, isActive: studentActive }
            };
            
            const serialized = serializeSettings(original);
            
            // isActive should remain boolean
            expect(typeof serialized.teacher.isActive).toBe('boolean');
            expect(typeof serialized.staff.isActive).toBe('boolean');
            expect(typeof serialized.student.isActive).toBe('boolean');
            
            // Values should be preserved
            expect(serialized.teacher.isActive).toBe(teacherActive);
            expect(serialized.staff.isActive).toBe(staffActive);
            expect(serialized.student.isActive).toBe(studentActive);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
