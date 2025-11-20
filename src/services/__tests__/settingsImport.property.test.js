/**
 * Property-Based Tests for Settings Import
 * Feature: admin-settings-system, Property 20: Settings import validation and backup
 * Validates: Requirements 9.2, 9.3, 9.4
 * 
 * Property 20: Settings import validation and backup
 * For any settings import operation, the system should validate the JSON format, 
 * create a backup of current settings before applying changes, and preserve current 
 * settings if validation fails
 */

import fc from 'fast-check';
import settingsService from '../settingsService';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {}
}));

describe('Property 20: Settings Import Validation and Backup', () => {
  let mockBackupId = 0;

  beforeEach(() => {
    // Reset mock backup ID
    mockBackupId = 0;

    // Mock the service methods
    jest.spyOn(settingsService, 'getSettings').mockResolvedValue({
      maxLoanDuration: 14,
      maxAdvanceBookingDays: 30,
      defaultCategoryLimit: 3,
      discordWebhookUrl: null,
      discordEnabled: false,
      version: 1
    });

    jest.spyOn(settingsService, 'getClosedDates').mockResolvedValue([]);
    jest.spyOn(settingsService, 'getAllCategoryLimits').mockResolvedValue([]);
    jest.spyOn(settingsService, 'updateMultipleSettings').mockResolvedValue(undefined);
    jest.spyOn(settingsService, 'addClosedDate').mockResolvedValue('closed-date-id');
    jest.spyOn(settingsService, 'setCategoryLimit').mockResolvedValue(undefined);
    jest.spyOn(settingsService, '_logChange').mockResolvedValue('log-id');

    // Mock createBackup to return a backup object
    jest.spyOn(settingsService, 'createBackup').mockImplementation(async () => {
      mockBackupId++;
      return {
        id: `backup-${mockBackupId}`,
        metadata: {
          exportDate: new Date().toISOString(),
          isBackup: true
        }
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property Test: Valid import data passes validation
   * For any valid settings data, import should succeed and create a backup
   */
  test('property: valid import data passes validation and creates backup', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          metadata: fc.record({
            exportDate: fc.date().map(d => d.toISOString()),
            exportedBy: fc.string({ minLength: 1, maxLength: 100 }),
            version: fc.integer({ min: 1, max: 10 })
          }),
          settings: fc.record({
            maxLoanDuration: fc.integer({ min: 1, max: 365 }),
            maxAdvanceBookingDays: fc.integer({ min: 1, max: 365 }),
            defaultCategoryLimit: fc.integer({ min: 1, max: 100 }),
            discordEnabled: fc.boolean()
          }),
          closedDates: fc.array(
            fc.record({
              date: fc.date().map(d => d.toISOString()),
              reason: fc.string({ minLength: 1, maxLength: 100 }),
              isRecurring: fc.boolean(),
              recurringPattern: fc.constantFrom('yearly', null)
            }),
            { maxLength: 5 }
          ),
          categoryLimits: fc.array(
            fc.record({
              categoryId: fc.uuid(),
              categoryName: fc.string({ minLength: 1, maxLength: 50 }),
              limit: fc.integer({ min: 1, max: 100 })
            }),
            { maxLength: 5 }
          )
        }),
        async (importData) => {
          // Import settings
          const result = await settingsService.importSettings(
            importData,
            'admin-id',
            'Admin'
          );

          // Verify backup was created
          expect(result.backup).toBeDefined();
          expect(result.backup.id).toBeDefined();
          expect(result.backup.id).toMatch(/^backup-\d+$/);

          // Verify import succeeded
          expect(result.success).toBe(true);
          expect(result.stats).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Invalid maxLoanDuration is rejected
   * For any invalid loan duration value, import should fail validation
   */
  test('property: invalid maxLoanDuration is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer({ max: 0 }),
          fc.integer({ min: 366 }),
          fc.constant('invalid'),
          fc.constant(null)
        ),
        async (invalidValue) => {
          const importData = {
            metadata: {
              exportDate: new Date().toISOString(),
              exportedBy: 'Test',
              version: 1
            },
            settings: {
              maxLoanDuration: invalidValue
            },
            closedDates: [],
            categoryLimits: []
          };

          // Import should fail
          await expect(
            settingsService.importSettings(importData, 'admin-id', 'Admin')
          ).rejects.toThrow(/validation failed/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Invalid maxAdvanceBookingDays is rejected
   * For any invalid advance booking value, import should fail validation
   */
  test('property: invalid maxAdvanceBookingDays is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer({ max: 0 }),
          fc.integer({ min: 366 }),
          fc.constant('invalid'),
          fc.constant(null)
        ),
        async (invalidValue) => {
          const importData = {
            metadata: {
              exportDate: new Date().toISOString(),
              exportedBy: 'Test',
              version: 1
            },
            settings: {
              maxAdvanceBookingDays: invalidValue
            },
            closedDates: [],
            categoryLimits: []
          };

          // Import should fail
          await expect(
            settingsService.importSettings(importData, 'admin-id', 'Admin')
          ).rejects.toThrow(/validation failed/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Invalid defaultCategoryLimit is rejected
   * For any invalid category limit value, import should fail validation
   */
  test('property: invalid defaultCategoryLimit is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer({ max: 0 }),
          fc.integer({ min: 101 }),
          fc.constant('invalid'),
          fc.constant(null)
        ),
        async (invalidValue) => {
          const importData = {
            metadata: {
              exportDate: new Date().toISOString(),
              exportedBy: 'Test',
              version: 1
            },
            settings: {
              defaultCategoryLimit: invalidValue
            },
            closedDates: [],
            categoryLimits: []
          };

          // Import should fail
          await expect(
            settingsService.importSettings(importData, 'admin-id', 'Admin')
          ).rejects.toThrow(/validation failed/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Invalid Discord webhook URL is rejected
   * For any invalid webhook URL, import should fail validation
   */
  test('property: invalid Discord webhook URL is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('http://invalid.com'),
          fc.constant('not-a-url'),
          fc.constant('https://example.com/webhook'),
          fc.integer()
        ),
        async (invalidUrl) => {
          const importData = {
            metadata: {
              exportDate: new Date().toISOString(),
              exportedBy: 'Test',
              version: 1
            },
            settings: {
              discordWebhookUrl: invalidUrl
            },
            closedDates: [],
            categoryLimits: []
          };

          // Import should fail
          await expect(
            settingsService.importSettings(importData, 'admin-id', 'Admin')
          ).rejects.toThrow(/validation failed/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Missing metadata causes validation failure
   * For any import data without metadata, validation should fail
   */
  test('property: missing metadata causes validation failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          settings: fc.record({
            maxLoanDuration: fc.integer({ min: 1, max: 365 })
          }),
          closedDates: fc.constant([]),
          categoryLimits: fc.constant([])
        }),
        async (importData) => {
          // Import should fail due to missing metadata
          await expect(
            settingsService.importSettings(importData, 'admin-id', 'Admin')
          ).rejects.toThrow(/validation failed/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Invalid closed date format is rejected
   * For any closed date with invalid date format, validation should fail
   */
  test('property: invalid closed date format is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('not-a-date'),
          fc.constant('2024-13-45'),
          fc.constant('invalid-date-string'),
          fc.constant(null),
          fc.constant(undefined)
        ),
        async (invalidDate) => {
          const importData = {
            metadata: {
              exportDate: new Date().toISOString(),
              exportedBy: 'Test',
              version: 1
            },
            settings: {},
            closedDates: [
              {
                date: invalidDate,
                reason: 'Test reason',
                isRecurring: false,
                recurringPattern: null
              }
            ],
            categoryLimits: []
          };

          // Import should fail
          await expect(
            settingsService.importSettings(importData, 'admin-id', 'Admin')
          ).rejects.toThrow(/validation failed/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Invalid category limit in array is rejected
   * For any category limit with invalid limit value, validation should fail
   */
  test('property: invalid category limit in array is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer({ max: 0 }), // 0 and negative values are invalid
          fc.constant('invalid'),
          fc.constant(null),
          fc.double().filter(n => !Number.isInteger(n)) // Only non-integer floats
        ),
        async (invalidLimit) => {
          const importData = {
            metadata: {
              exportDate: new Date().toISOString(),
              exportedBy: 'Test',
              version: 1
            },
            settings: {},
            closedDates: [],
            categoryLimits: [
              {
                categoryId: 'cat-123',
                categoryName: 'Test Category',
                limit: invalidLimit
              }
            ]
          };

          // Import should fail
          await expect(
            settingsService.importSettings(importData, 'admin-id', 'Admin')
          ).rejects.toThrow(/validation failed/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Backup is created before any changes
   * For any valid import, backup should be created before applying changes
   */
  test('property: backup is created before any changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          metadata: fc.record({
            exportDate: fc.date().map(d => d.toISOString()),
            exportedBy: fc.string({ minLength: 1, maxLength: 100 }),
            version: fc.integer({ min: 1, max: 10 })
          }),
          settings: fc.record({
            maxLoanDuration: fc.integer({ min: 1, max: 365 })
          }),
          closedDates: fc.constant([]),
          categoryLimits: fc.constant([])
        }),
        async (importData) => {
          // Track call order
          const callOrder = [];
          
          jest.spyOn(settingsService, 'createBackup').mockImplementation(async () => {
            callOrder.push('backup');
            mockBackupId++;
            return {
              id: `backup-${mockBackupId}`,
              metadata: { isBackup: true }
            };
          });

          jest.spyOn(settingsService, 'updateMultipleSettings').mockImplementation(async () => {
            callOrder.push('update');
          });

          // Import settings
          await settingsService.importSettings(importData, 'admin-id', 'Admin');

          // Verify backup was called before update
          expect(callOrder[0]).toBe('backup');
          if (callOrder.length > 1) {
            expect(callOrder[1]).toBe('update');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Import stats are accurate
   * For any valid import, stats should accurately reflect what was imported
   */
  test('property: import stats are accurate', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          settingsCount: fc.integer({ min: 0, max: 4 }), // Max 4 since we only have 4 settings keys
          closedDatesCount: fc.integer({ min: 0, max: 5 }),
          categoryLimitsCount: fc.integer({ min: 0, max: 5 })
        }),
        async ({ settingsCount, closedDatesCount, categoryLimitsCount }) => {
          // Build import data based on counts
          const settings = {};
          const settingsKeys = ['maxLoanDuration', 'maxAdvanceBookingDays', 'defaultCategoryLimit', 'discordEnabled'];
          for (let i = 0; i < settingsCount; i++) {
            if (settingsKeys[i] === 'discordEnabled') {
              settings[settingsKeys[i]] = true;
            } else {
              settings[settingsKeys[i]] = 10 + i;
            }
          }

          const closedDates = Array.from({ length: closedDatesCount }, (_, i) => ({
            date: new Date(2024, 0, i + 1).toISOString(),
            reason: `Reason ${i}`,
            isRecurring: false,
            recurringPattern: null
          }));

          const categoryLimits = Array.from({ length: categoryLimitsCount }, (_, i) => ({
            categoryId: `cat-${i}`,
            categoryName: `Category ${i}`,
            limit: 5
          }));

          const importData = {
            metadata: {
              exportDate: new Date().toISOString(),
              exportedBy: 'Test',
              version: 1
            },
            settings,
            closedDates,
            categoryLimits
          };

          // Import settings
          const result = await settingsService.importSettings(importData, 'admin-id', 'Admin');

          // Verify stats
          expect(result.stats.settingsUpdated).toBe(settingsCount);
          expect(result.stats.closedDatesAdded).toBe(closedDatesCount);
          expect(result.stats.categoryLimitsUpdated).toBe(categoryLimitsCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
