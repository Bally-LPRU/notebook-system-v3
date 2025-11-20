/**
 * Property-based tests for settingsService
 * Tests universal properties that should hold across all valid inputs
 * 
 * Note: These tests focus on validation logic rather than Firestore operations
 * to avoid issues with mocking and singleton state in property-based testing.
 */

import fc from 'fast-check';
import { SETTINGS_VALIDATION } from '../../types/settings';
import {
  validateLoanDuration,
  validateAdvanceBookingDays,
  validateCategoryLimit,
  validateDiscordWebhookUrl,
  validateSettings,
  areAllValid
} from '../../utils/settingsValidation';

// Generators for valid settings values
const validLoanDurationGenerator = fc.integer({
  min: SETTINGS_VALIDATION.maxLoanDuration.min,
  max: SETTINGS_VALIDATION.maxLoanDuration.max
});

const validAdvanceBookingDaysGenerator = fc.integer({
  min: SETTINGS_VALIDATION.maxAdvanceBookingDays.min,
  max: SETTINGS_VALIDATION.maxAdvanceBookingDays.max
});

const validCategoryLimitGenerator = fc.integer({
  min: SETTINGS_VALIDATION.defaultCategoryLimit.min,
  max: SETTINGS_VALIDATION.defaultCategoryLimit.max
});

const validDiscordWebhookGenerator = fc.oneof(
  fc.constant(null),
  fc.tuple(
    fc.integer({ min: 100000000000000000, max: 999999999999999999 }),
    fc.string({ minLength: 20, maxLength: 68 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
  ).map(([id, token]) => `https://discord.com/api/webhooks/${id}/${token}`)
);

const validSettingsGenerator = fc.record({
  maxLoanDuration: validLoanDurationGenerator,
  maxAdvanceBookingDays: validAdvanceBookingDaysGenerator,
  defaultCategoryLimit: validCategoryLimitGenerator,
  discordWebhookUrl: validDiscordWebhookGenerator,
  discordEnabled: fc.boolean()
});

const adminInfoGenerator = fc.record({
  adminId: fc.string({ minLength: 1, maxLength: 50 }),
  adminName: fc.string({ minLength: 1, maxLength: 100 })
});

describe('settingsService property-based tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // **Feature: admin-settings-system, Property 1: Settings persistence**
  // **Validates: Requirements 3.1, 4.1, 5.2, 6.1**
  describe('Property 1: Settings persistence - Validation ensures only valid values can be stored', () => {
    it('should accept all valid loan duration values', () => {
      fc.assert(
        fc.property(
          validLoanDurationGenerator,
          (value) => {
            const result = validateLoanDuration(value);
            expect(result.isValid).toBe(true);
            expect(result.error).toBe(null);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept all valid advance booking day values', () => {
      fc.assert(
        fc.property(
          validAdvanceBookingDaysGenerator,
          (value) => {
            const result = validateAdvanceBookingDays(value);
            expect(result.isValid).toBe(true);
            expect(result.error).toBe(null);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept all valid category limit values', () => {
      fc.assert(
        fc.property(
          validCategoryLimitGenerator,
          (value) => {
            const result = validateCategoryLimit(value);
            expect(result.isValid).toBe(true);
            expect(result.error).toBe(null);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept all valid Discord webhook URLs', () => {
      fc.assert(
        fc.property(
          validDiscordWebhookGenerator.filter(url => url !== null && url !== ''),
          (url) => {
            const result = validateDiscordWebhookUrl(url);
            expect(result.isValid).toBe(true);
            expect(result.error).toBe(null);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid settings objects', () => {
      fc.assert(
        fc.property(
          validSettingsGenerator,
          (settings) => {
            const results = validateSettings(settings);
            expect(areAllValid(results)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid loan duration values (out of range)', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ max: 0 }), // Too small
            fc.integer({ min: 366 }) // Too large
          ),
          (value) => {
            const result = validateLoanDuration(value);
            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid advance booking day values (out of range)', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ max: 0 }), // Too small
            fc.integer({ min: 366 }) // Too large
          ),
          (value) => {
            const result = validateAdvanceBookingDays(value);
            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid category limit values (out of range)', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ max: 0 }), // Too small
            fc.integer({ min: 101 }) // Too large
          ),
          (value) => {
            const result = validateCategoryLimit(value);
            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-integer values for numeric settings', () => {
      fc.assert(
        fc.property(
          fc.double({ noNaN: true }),
          (value) => {
            // Only test non-integer values
            if (Number.isInteger(value)) return;
            
            const loanResult = validateLoanDuration(value);
            const bookingResult = validateAdvanceBookingDays(value);
            const limitResult = validateCategoryLimit(value);
            
            expect(loanResult.isValid).toBe(false);
            expect(bookingResult.isValid).toBe(false);
            expect(limitResult.isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject malformed Discord webhook URLs', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.webUrl(), // Random web URL (not Discord)
            fc.string().filter(s => s !== '' && !s.startsWith('https://discord.com/api/webhooks/')),
            fc.constant('http://discord.com/api/webhooks/123/abc'), // Wrong protocol
            fc.constant('https://discord.com/webhooks/123/abc') // Missing /api/
          ),
          (url) => {
            const result = validateDiscordWebhookUrl(url);
            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null and empty string for Discord webhook URL', () => {
      // null should be rejected by validation
      const nullResult = validateDiscordWebhookUrl(null);
      expect(nullResult.isValid).toBe(false);
      
      // empty string should be rejected by validation
      const emptyResult = validateDiscordWebhookUrl('');
      expect(emptyResult.isValid).toBe(false);
    });
  });
});
