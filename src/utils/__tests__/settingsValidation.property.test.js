/**
 * Property-based tests for settings validation
 * Tests Property 3: Settings validation
 */

import fc from 'fast-check';
import {
  validateLoanDuration,
  validateAdvanceBookingDays,
  validateCategoryLimit,
  validateDiscordWebhookUrl,
  validateClosedDate,
  validateClosedDateReason,
  validateNotificationTitle,
  validateNotificationContent,
  validateSettings,
  areAllValid,
  getFirstError
} from '../settingsValidation';
import { SETTINGS_VALIDATION } from '../../types/settings';

describe('settingsValidation property-based tests', () => {
  // **Feature: admin-settings-system, Property 3: Settings validation**
  // **Validates: Requirements 3.4, 4.4, 5.1**
  describe('Property 3: Settings validation - Invalid values are always rejected', () => {
    
    describe('Loan Duration Validation', () => {
      it('should reject all values below minimum', () => {
        fc.assert(
          fc.property(
            fc.integer({ max: SETTINGS_VALIDATION.maxLoanDuration.min - 1 }),
            (value) => {
              const result = validateLoanDuration(value);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
              expect(result.error).toContain('between');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject all values above maximum', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: SETTINGS_VALIDATION.maxLoanDuration.max + 1 }),
            (value) => {
              const result = validateLoanDuration(value);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
              expect(result.error).toContain('between');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject all non-integer numbers', () => {
        fc.assert(
          fc.property(
            fc.double({ noNaN: true }).filter(n => !Number.isInteger(n)),
            (value) => {
              const result = validateLoanDuration(value);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
              expect(result.error).toContain('integer');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject all non-number types', () => {
        fc.assert(
          fc.property(
            fc.oneof(
              fc.string(),
              fc.boolean(),
              fc.constant(null),
              fc.constant(undefined),
              fc.object()
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

      it('should accept all values within valid range', () => {
        fc.assert(
          fc.property(
            fc.integer({
              min: SETTINGS_VALIDATION.maxLoanDuration.min,
              max: SETTINGS_VALIDATION.maxLoanDuration.max
            }),
            (value) => {
              const result = validateLoanDuration(value);
              expect(result.isValid).toBe(true);
              expect(result.error).toBe(null);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Advance Booking Days Validation', () => {
      it('should reject all values below minimum', () => {
        fc.assert(
          fc.property(
            fc.integer({ max: SETTINGS_VALIDATION.maxAdvanceBookingDays.min - 1 }),
            (value) => {
              const result = validateAdvanceBookingDays(value);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject all values above maximum', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: SETTINGS_VALIDATION.maxAdvanceBookingDays.max + 1 }),
            (value) => {
              const result = validateAdvanceBookingDays(value);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should accept all values within valid range', () => {
        fc.assert(
          fc.property(
            fc.integer({
              min: SETTINGS_VALIDATION.maxAdvanceBookingDays.min,
              max: SETTINGS_VALIDATION.maxAdvanceBookingDays.max
            }),
            (value) => {
              const result = validateAdvanceBookingDays(value);
              expect(result.isValid).toBe(true);
              expect(result.error).toBe(null);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Category Limit Validation', () => {
      it('should reject all values below minimum', () => {
        fc.assert(
          fc.property(
            fc.integer({ max: SETTINGS_VALIDATION.defaultCategoryLimit.min - 1 }),
            (value) => {
              const result = validateCategoryLimit(value);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject all values above maximum', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: SETTINGS_VALIDATION.defaultCategoryLimit.max + 1 }),
            (value) => {
              const result = validateCategoryLimit(value);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should accept all values within valid range', () => {
        fc.assert(
          fc.property(
            fc.integer({
              min: SETTINGS_VALIDATION.defaultCategoryLimit.min,
              max: SETTINGS_VALIDATION.defaultCategoryLimit.max
            }),
            (value) => {
              const result = validateCategoryLimit(value);
              expect(result.isValid).toBe(true);
              expect(result.error).toBe(null);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Discord Webhook URL Validation', () => {
      it('should reject all non-Discord URLs', () => {
        fc.assert(
          fc.property(
            fc.webUrl().filter(url => !url.startsWith('https://discord.com/api/webhooks/')),
            (url) => {
              const result = validateDiscordWebhookUrl(url);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject URLs with wrong protocol', () => {
        fc.assert(
          fc.property(
            fc.tuple(
              fc.integer({ min: 100000000000000000, max: 999999999999999999 }),
              fc.string({ minLength: 20, maxLength: 68 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
            ).map(([id, token]) => `http://discord.com/api/webhooks/${id}/${token}`),
            (url) => {
              const result = validateDiscordWebhookUrl(url);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject empty strings and null', () => {
        expect(validateDiscordWebhookUrl('').isValid).toBe(false);
        expect(validateDiscordWebhookUrl(null).isValid).toBe(false);
        expect(validateDiscordWebhookUrl(undefined).isValid).toBe(false);
      });

      it('should accept valid Discord webhook URLs', () => {
        fc.assert(
          fc.property(
            fc.tuple(
              fc.integer({ min: 100000000000000000, max: 999999999999999999 }),
              fc.string({ minLength: 20, maxLength: 68 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
            ).map(([id, token]) => `https://discord.com/api/webhooks/${id}/${token}`),
            (url) => {
              const result = validateDiscordWebhookUrl(url);
              expect(result.isValid).toBe(true);
              expect(result.error).toBe(null);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Closed Date Validation', () => {
      it('should reject dates more than 1 year in the past', () => {
        fc.assert(
          fc.property(
            fc.date({ max: new Date(Date.now() - 366 * 24 * 60 * 60 * 1000) }),
            (date) => {
              const result = validateClosedDate(date);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should accept dates within 1 year in the past and future dates', () => {
        fc.assert(
          fc.property(
            fc.date({ 
              min: new Date(Date.now() - 364 * 24 * 60 * 60 * 1000),
              max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }).filter(date => !isNaN(date.getTime())), // Filter out invalid dates
            (date) => {
              const result = validateClosedDate(date);
              expect(result.isValid).toBe(true);
              expect(result.error).toBe(null);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject invalid date strings', () => {
        fc.assert(
          fc.property(
            fc.string().filter(s => isNaN(new Date(s).getTime())),
            (dateStr) => {
              const result = validateClosedDate(dateStr);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Closed Date Reason Validation', () => {
      it('should reject empty strings', () => {
        expect(validateClosedDateReason('').isValid).toBe(false);
        expect(validateClosedDateReason('   ').isValid).toBe(false);
        expect(validateClosedDateReason('\t\t').isValid).toBe(false);
      });

      it('should reject null and undefined', () => {
        expect(validateClosedDateReason(null).isValid).toBe(false);
        expect(validateClosedDateReason(undefined).isValid).toBe(false);
      });

      it('should reject reasons longer than 200 characters', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 201 }),
            (reason) => {
              const result = validateClosedDateReason(reason);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should accept valid reasons', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            (reason) => {
              const result = validateClosedDateReason(reason);
              expect(result.isValid).toBe(true);
              expect(result.error).toBe(null);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Notification Title Validation', () => {
      it('should reject empty strings', () => {
        expect(validateNotificationTitle('').isValid).toBe(false);
        expect(validateNotificationTitle('   ').isValid).toBe(false);
      });

      it('should reject titles longer than 100 characters', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 101 }),
            (title) => {
              const result = validateNotificationTitle(title);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should accept valid titles', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            (title) => {
              const result = validateNotificationTitle(title);
              expect(result.isValid).toBe(true);
              expect(result.error).toBe(null);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Notification Content Validation', () => {
      it('should reject empty strings', () => {
        expect(validateNotificationContent('').isValid).toBe(false);
        expect(validateNotificationContent('   ').isValid).toBe(false);
      });

      it('should reject content longer than 1000 characters', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1001 }),
            (content) => {
              const result = validateNotificationContent(content);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeTruthy();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should accept valid content', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
            (content) => {
              const result = validateNotificationContent(content);
              expect(result.isValid).toBe(true);
              expect(result.error).toBe(null);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Composite Settings Validation', () => {
      it('should validate all settings in an object', () => {
        fc.assert(
          fc.property(
            fc.record({
              maxLoanDuration: fc.integer({
                min: SETTINGS_VALIDATION.maxLoanDuration.min,
                max: SETTINGS_VALIDATION.maxLoanDuration.max
              }),
              maxAdvanceBookingDays: fc.integer({
                min: SETTINGS_VALIDATION.maxAdvanceBookingDays.min,
                max: SETTINGS_VALIDATION.maxAdvanceBookingDays.max
              }),
              defaultCategoryLimit: fc.integer({
                min: SETTINGS_VALIDATION.defaultCategoryLimit.min,
                max: SETTINGS_VALIDATION.defaultCategoryLimit.max
              })
            }),
            (settings) => {
              const results = validateSettings(settings);
              expect(areAllValid(results)).toBe(true);
              expect(getFirstError(results)).toBe(null);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should detect invalid settings in an object', () => {
        fc.assert(
          fc.property(
            fc.record({
              maxLoanDuration: fc.integer({ max: 0 }) // Invalid
            }),
            (settings) => {
              const results = validateSettings(settings);
              expect(areAllValid(results)).toBe(false);
              expect(getFirstError(results)).toBeTruthy();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should handle partial settings objects', () => {
        fc.assert(
          fc.property(
            fc.oneof(
              fc.record({ maxLoanDuration: fc.integer({ min: 1, max: 365 }) }),
              fc.record({ maxAdvanceBookingDays: fc.integer({ min: 1, max: 365 }) }),
              fc.record({ defaultCategoryLimit: fc.integer({ min: 1, max: 100 }) })
            ),
            (settings) => {
              const results = validateSettings(settings);
              expect(areAllValid(results)).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
