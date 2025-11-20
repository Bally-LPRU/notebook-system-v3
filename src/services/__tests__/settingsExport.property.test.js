/**
 * Property-Based Tests for Settings Export
 * Feature: admin-settings-system, Property 19: Settings export completeness
 * Validates: Requirements 9.1, 9.5
 * 
 * Property 19: Settings export completeness
 * For any settings export operation, the system should generate a JSON file 
 * containing all current settings, excluding sensitive information unless explicitly requested
 */

import fc from 'fast-check';
import settingsService from '../settingsService';
import { db } from '../../config/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  Timestamp
} from 'firebase/firestore';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {}
}));

describe('Property 19: Settings Export Completeness', () => {
  let mockSettings;
  let mockClosedDates;
  let mockCategoryLimits;

  beforeEach(() => {
    // Reset mocks
    mockSettings = {
      maxLoanDuration: 14,
      maxAdvanceBookingDays: 30,
      defaultCategoryLimit: 3,
      discordWebhookUrl: 'https://discord.com/api/webhooks/test',
      discordEnabled: true,
      version: 1
    };

    mockClosedDates = [];
    mockCategoryLimits = [];

    // Mock Firestore operations
    jest.spyOn(settingsService, 'getSettings').mockResolvedValue(mockSettings);
    jest.spyOn(settingsService, 'getClosedDates').mockImplementation(() => 
      Promise.resolve(mockClosedDates)
    );
    jest.spyOn(settingsService, 'getAllCategoryLimits').mockImplementation(() => 
      Promise.resolve(mockCategoryLimits)
    );
    jest.spyOn(settingsService, '_logChange').mockResolvedValue('log-id');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property Test: Export includes all non-sensitive settings
   * For any valid settings configuration, export should include all non-sensitive fields
   */
  test('property: export includes all non-sensitive settings', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random settings
        fc.record({
          maxLoanDuration: fc.integer({ min: 1, max: 365 }),
          maxAdvanceBookingDays: fc.integer({ min: 1, max: 365 }),
          defaultCategoryLimit: fc.integer({ min: 1, max: 100 }),
          discordEnabled: fc.boolean(),
          discordWebhookUrl: fc.constantFrom(
            'https://discord.com/api/webhooks/123',
            'https://discord.com/api/webhooks/456',
            null
          )
        }),
        async (settings) => {
          // Setup mock
          mockSettings = { ...settings, version: 1 };
          jest.spyOn(settingsService, 'getSettings').mockResolvedValue(mockSettings);

          // Export without sensitive data
          const exportData = await settingsService.exportSettings(false, 'admin-id', 'Admin');

          // Verify all non-sensitive settings are included
          expect(exportData.settings).toBeDefined();
          expect(exportData.settings.maxLoanDuration).toBe(settings.maxLoanDuration);
          expect(exportData.settings.maxAdvanceBookingDays).toBe(settings.maxAdvanceBookingDays);
          expect(exportData.settings.defaultCategoryLimit).toBe(settings.defaultCategoryLimit);
          expect(exportData.settings.discordEnabled).toBe(settings.discordEnabled);

          // Verify sensitive data is excluded
          expect(exportData.settings.discordWebhookUrl).toBeUndefined();

          // Verify metadata is present
          expect(exportData.metadata).toBeDefined();
          expect(exportData.metadata.exportDate).toBeDefined();
          expect(exportData.metadata.exportedBy).toBe('Admin');
          expect(exportData.metadata.includeSensitive).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Export includes sensitive data when requested
   * For any valid settings with sensitive data, export should include it when explicitly requested
   */
  test('property: export includes sensitive data when requested', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random webhook URL
        fc.constantFrom(
          'https://discord.com/api/webhooks/123/abc',
          'https://discord.com/api/webhooks/456/def',
          'https://discord.com/api/webhooks/789/ghi'
        ),
        async (webhookUrl) => {
          // Setup mock with webhook
          mockSettings = {
            ...mockSettings,
            discordWebhookUrl: webhookUrl
          };
          jest.spyOn(settingsService, 'getSettings').mockResolvedValue(mockSettings);

          // Export with sensitive data
          const exportData = await settingsService.exportSettings(true, 'admin-id', 'Admin');

          // Verify sensitive data is included
          expect(exportData.settings.discordWebhookUrl).toBe(webhookUrl);
          expect(exportData.metadata.includeSensitive).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Export includes all closed dates
   * For any set of closed dates, export should include all of them
   */
  test('property: export includes all closed dates', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random closed dates
        fc.array(
          fc.record({
            date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
            reason: fc.string({ minLength: 1, maxLength: 100 }),
            isRecurring: fc.boolean(),
            recurringPattern: fc.constantFrom('yearly', null)
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (closedDates) => {
          // Setup mock
          mockClosedDates = closedDates;
          jest.spyOn(settingsService, 'getClosedDates').mockResolvedValue(mockClosedDates);

          // Export settings
          const exportData = await settingsService.exportSettings(false, 'admin-id', 'Admin');

          // Verify all closed dates are included
          expect(exportData.closedDates).toBeDefined();
          expect(exportData.closedDates.length).toBe(closedDates.length);

          // Verify each closed date has required fields
          exportData.closedDates.forEach((cd, index) => {
            expect(cd.date).toBeDefined();
            expect(cd.reason).toBe(closedDates[index].reason);
            expect(cd.isRecurring).toBe(closedDates[index].isRecurring);
            expect(cd.recurringPattern).toBe(closedDates[index].recurringPattern);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Export includes all category limits
   * For any set of category limits, export should include all of them
   */
  test('property: export includes all category limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random category limits
        fc.array(
          fc.record({
            categoryId: fc.uuid(),
            categoryName: fc.string({ minLength: 1, maxLength: 50 }),
            limit: fc.integer({ min: 1, max: 100 })
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (categoryLimits) => {
          // Setup mock
          mockCategoryLimits = categoryLimits;
          jest.spyOn(settingsService, 'getAllCategoryLimits').mockResolvedValue(mockCategoryLimits);

          // Export settings
          const exportData = await settingsService.exportSettings(false, 'admin-id', 'Admin');

          // Verify all category limits are included
          expect(exportData.categoryLimits).toBeDefined();
          expect(exportData.categoryLimits.length).toBe(categoryLimits.length);

          // Verify each category limit has required fields
          exportData.categoryLimits.forEach((cl, index) => {
            expect(cl.categoryId).toBe(categoryLimits[index].categoryId);
            expect(cl.categoryName).toBe(categoryLimits[index].categoryName);
            expect(cl.limit).toBe(categoryLimits[index].limit);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Export metadata is always complete
   * For any export operation, metadata should always include required fields
   */
  test('property: export metadata is always complete', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          adminId: fc.uuid(),
          adminName: fc.string({ minLength: 1, maxLength: 100 }),
          includeSensitive: fc.boolean()
        }),
        async ({ adminId, adminName, includeSensitive }) => {
          // Export settings
          const exportData = await settingsService.exportSettings(
            includeSensitive,
            adminId,
            adminName
          );

          // Verify metadata completeness
          expect(exportData.metadata).toBeDefined();
          expect(exportData.metadata.exportDate).toBeDefined();
          expect(new Date(exportData.metadata.exportDate)).toBeInstanceOf(Date);
          expect(exportData.metadata.exportedBy).toBe(adminName);
          expect(exportData.metadata.exportedByUserId).toBe(adminId);
          expect(exportData.metadata.version).toBeDefined();
          expect(exportData.metadata.includeSensitive).toBe(includeSensitive);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Export structure is consistent
   * For any export operation, the structure should always be the same
   */
  test('property: export structure is consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (includeSensitive) => {
          // Export settings
          const exportData = await settingsService.exportSettings(
            includeSensitive,
            'admin-id',
            'Admin'
          );

          // Verify top-level structure
          expect(exportData).toHaveProperty('metadata');
          expect(exportData).toHaveProperty('settings');
          expect(exportData).toHaveProperty('closedDates');
          expect(exportData).toHaveProperty('categoryLimits');

          // Verify types
          expect(typeof exportData.metadata).toBe('object');
          expect(typeof exportData.settings).toBe('object');
          expect(Array.isArray(exportData.closedDates)).toBe(true);
          expect(Array.isArray(exportData.categoryLimits)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
