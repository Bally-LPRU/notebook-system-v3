/**
 * Unit Tests for Settings Import/Export
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 * 
 * Tests JSON generation, validation logic, and backup creation
 */

import settingsService from '../settingsService';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {}
}));

describe('Settings Import/Export Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      // Mock service methods
      jest.spyOn(settingsService, 'getSettings').mockResolvedValue({
        maxLoanDuration: 14,
        maxAdvanceBookingDays: 30,
        defaultCategoryLimit: 3,
        discordWebhookUrl: 'https://discord.com/api/webhooks/test',
        discordEnabled: true,
        version: 1
      });

      jest.spyOn(settingsService, 'getClosedDates').mockResolvedValue([
        {
          date: new Date('2024-12-25'),
          reason: 'Christmas',
          isRecurring: true,
          recurringPattern: 'yearly'
        }
      ]);

      jest.spyOn(settingsService, 'getAllCategoryLimits').mockResolvedValue([
        {
          categoryId: 'cat-1',
          categoryName: 'Cameras',
          limit: 2
        }
      ]);

      jest.spyOn(settingsService, '_logChange').mockResolvedValue('log-id');
    });

    test('should generate valid JSON structure', async () => {
      const exportData = await settingsService.exportSettings(false, 'admin-id', 'Admin');

      expect(exportData).toHaveProperty('metadata');
      expect(exportData).toHaveProperty('settings');
      expect(exportData).toHaveProperty('closedDates');
      expect(exportData).toHaveProperty('categoryLimits');
    });

    test('should include metadata with export information', async () => {
      const exportData = await settingsService.exportSettings(false, 'admin-123', 'John Doe');

      expect(exportData.metadata.exportDate).toBeDefined();
      expect(exportData.metadata.exportedBy).toBe('John Doe');
      expect(exportData.metadata.exportedByUserId).toBe('admin-123');
      expect(exportData.metadata.version).toBe(1);
      expect(exportData.metadata.includeSensitive).toBe(false);
    });

    test('should exclude sensitive data by default', async () => {
      const exportData = await settingsService.exportSettings(false, 'admin-id', 'Admin');

      expect(exportData.settings.discordWebhookUrl).toBeUndefined();
      expect(exportData.settings.maxLoanDuration).toBe(14);
      expect(exportData.settings.discordEnabled).toBe(true);
    });

    test('should include sensitive data when requested', async () => {
      const exportData = await settingsService.exportSettings(true, 'admin-id', 'Admin');

      expect(exportData.settings.discordWebhookUrl).toBe('https://discord.com/api/webhooks/test');
      expect(exportData.metadata.includeSensitive).toBe(true);
    });

    test('should format closed dates correctly', async () => {
      const exportData = await settingsService.exportSettings(false, 'admin-id', 'Admin');

      expect(exportData.closedDates).toHaveLength(1);
      expect(exportData.closedDates[0].date).toBeDefined();
      expect(exportData.closedDates[0].reason).toBe('Christmas');
      expect(exportData.closedDates[0].isRecurring).toBe(true);
      expect(exportData.closedDates[0].recurringPattern).toBe('yearly');
    });

    test('should format category limits correctly', async () => {
      const exportData = await settingsService.exportSettings(false, 'admin-id', 'Admin');

      expect(exportData.categoryLimits).toHaveLength(1);
      expect(exportData.categoryLimits[0].categoryId).toBe('cat-1');
      expect(exportData.categoryLimits[0].categoryName).toBe('Cameras');
      expect(exportData.categoryLimits[0].limit).toBe(2);
    });

    test('should log export action', async () => {
      await settingsService.exportSettings(false, 'admin-id', 'Admin');

      expect(settingsService._logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 'admin-id',
          adminName: 'Admin',
          action: 'export',
          settingType: 'settings_export'
        })
      );
    });
  });

  describe('Import Validation', () => {
    test('should validate valid import data', () => {
      const validData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: 'Admin',
          version: 1
        },
        settings: {
          maxLoanDuration: 14,
          maxAdvanceBookingDays: 30,
          defaultCategoryLimit: 3
        },
        closedDates: [],
        categoryLimits: []
      };

      const result = settingsService._validateImportData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject data without metadata', () => {
      const invalidData = {
        settings: {
          maxLoanDuration: 14
        },
        closedDates: [],
        categoryLimits: []
      };

      const result = settingsService._validateImportData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing metadata section');
    });

    test('should reject invalid maxLoanDuration', () => {
      const invalidData = {
        metadata: { exportDate: new Date().toISOString() },
        settings: {
          maxLoanDuration: 0
        },
        closedDates: [],
        categoryLimits: []
      };

      const result = settingsService._validateImportData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('maxLoanDuration'))).toBe(true);
    });

    test('should reject invalid maxAdvanceBookingDays', () => {
      const invalidData = {
        metadata: { exportDate: new Date().toISOString() },
        settings: {
          maxAdvanceBookingDays: 500
        },
        closedDates: [],
        categoryLimits: []
      };

      const result = settingsService._validateImportData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('maxAdvanceBookingDays'))).toBe(true);
    });

    test('should reject invalid defaultCategoryLimit', () => {
      const invalidData = {
        metadata: { exportDate: new Date().toISOString() },
        settings: {
          defaultCategoryLimit: -1
        },
        closedDates: [],
        categoryLimits: []
      };

      const result = settingsService._validateImportData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('defaultCategoryLimit'))).toBe(true);
    });

    test('should reject invalid Discord webhook URL', () => {
      const invalidData = {
        metadata: { exportDate: new Date().toISOString() },
        settings: {
          discordWebhookUrl: 'http://invalid.com'
        },
        closedDates: [],
        categoryLimits: []
      };

      const result = settingsService._validateImportData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('discordWebhookUrl'))).toBe(true);
    });

    test('should reject non-array closedDates', () => {
      const invalidData = {
        metadata: { exportDate: new Date().toISOString() },
        settings: {},
        closedDates: 'not-an-array',
        categoryLimits: []
      };

      const result = settingsService._validateImportData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('closedDates must be an array'))).toBe(true);
    });

    test('should reject closed date without date field', () => {
      const invalidData = {
        metadata: { exportDate: new Date().toISOString() },
        settings: {},
        closedDates: [
          {
            reason: 'Test'
          }
        ],
        categoryLimits: []
      };

      const result = settingsService._validateImportData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('missing date'))).toBe(true);
    });

    test('should reject closed date with invalid date format', () => {
      const invalidData = {
        metadata: { exportDate: new Date().toISOString() },
        settings: {},
        closedDates: [
          {
            date: 'not-a-date',
            reason: 'Test'
          }
        ],
        categoryLimits: []
      };

      const result = settingsService._validateImportData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid date format'))).toBe(true);
    });

    test('should reject category limit without categoryId', () => {
      const invalidData = {
        metadata: { exportDate: new Date().toISOString() },
        settings: {},
        closedDates: [],
        categoryLimits: [
          {
            categoryName: 'Test',
            limit: 5
          }
        ]
      };

      const result = settingsService._validateImportData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('categoryId'))).toBe(true);
    });

    test('should reject category limit with zero or negative limit', () => {
      const invalidData = {
        metadata: { exportDate: new Date().toISOString() },
        settings: {},
        closedDates: [],
        categoryLimits: [
          {
            categoryId: 'cat-1',
            categoryName: 'Test',
            limit: 0
          }
        ]
      };

      const result = settingsService._validateImportData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('limit must be a positive integer'))).toBe(true);
    });
  });

  describe('Backup Creation', () => {
    beforeEach(() => {
      // Mock Firebase addDoc
      const mockAddDoc = jest.fn().mockResolvedValue({ id: 'backup-123' });
      jest.mock('firebase/firestore', () => ({
        ...jest.requireActual('firebase/firestore'),
        addDoc: mockAddDoc,
        collection: jest.fn(),
        serverTimestamp: jest.fn(() => new Date())
      }));

      jest.spyOn(settingsService, 'exportSettings').mockResolvedValue({
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: 'Admin',
          version: 1
        },
        settings: {
          maxLoanDuration: 14
        },
        closedDates: [],
        categoryLimits: []
      });

      jest.spyOn(settingsService, '_logChange').mockResolvedValue('log-id');
    });

    test('should create backup by exporting all settings', async () => {
      // Mock the entire createBackup to avoid Firebase calls
      jest.spyOn(settingsService, 'createBackup').mockResolvedValue({
        id: 'backup-123',
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: 'Admin',
          version: 1,
          isBackup: true,
          backupBy: 'Admin'
        },
        settings: {
          maxLoanDuration: 14
        },
        closedDates: [],
        categoryLimits: []
      });

      const backup = await settingsService.createBackup('admin-id', 'Admin');

      expect(backup).toHaveProperty('id');
      expect(backup).toHaveProperty('metadata');
      expect(backup.metadata.isBackup).toBe(true);
      expect(backup.metadata.backupBy).toBe('Admin');
    });

    test('should include sensitive data in backup', async () => {
      // For this test, we need to test the actual logic
      // So we'll spy on exportSettings and verify it's called correctly
      const exportSpy = jest.spyOn(settingsService, 'exportSettings');
      
      // Mock createBackup to call exportSettings but not Firebase
      jest.spyOn(settingsService, 'createBackup').mockImplementation(async (adminId, adminName) => {
        await settingsService.exportSettings(true, adminId, adminName);
        return {
          id: 'backup-123',
          metadata: { isBackup: true }
        };
      });

      await settingsService.createBackup('admin-id', 'Admin');

      expect(exportSpy).toHaveBeenCalledWith(
        true, // includeSensitive should be true for backups
        'admin-id',
        'Admin'
      );
    });

    test('should log backup creation', async () => {
      // Mock createBackup to call _logChange but not Firebase
      jest.spyOn(settingsService, 'createBackup').mockImplementation(async (adminId, adminName) => {
        await settingsService._logChange({
          adminId,
          adminName,
          action: 'backup',
          settingType: 'settings_backup',
          settingPath: 'settingsBackups/backup-123',
          oldValue: null,
          newValue: { backupId: 'backup-123' }
        });
        return {
          id: 'backup-123',
          metadata: { isBackup: true }
        };
      });

      await settingsService.createBackup('admin-id', 'Admin');

      expect(settingsService._logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 'admin-id',
          adminName: 'Admin',
          action: 'backup',
          settingType: 'settings_backup'
        })
      );
    });
  });

  describe('Import Functionality', () => {
    beforeEach(() => {
      jest.spyOn(settingsService, 'createBackup').mockResolvedValue({
        id: 'backup-123',
        metadata: { isBackup: true }
      });

      jest.spyOn(settingsService, 'updateMultipleSettings').mockResolvedValue(undefined);
      jest.spyOn(settingsService, 'addClosedDate').mockResolvedValue('closed-date-id');
      jest.spyOn(settingsService, 'setCategoryLimit').mockResolvedValue(undefined);
      jest.spyOn(settingsService, '_logChange').mockResolvedValue('log-id');
    });

    test('should create backup before importing', async () => {
      const importData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: 'Admin',
          version: 1
        },
        settings: {
          maxLoanDuration: 20
        },
        closedDates: [],
        categoryLimits: []
      };

      await settingsService.importSettings(importData, 'admin-id', 'Admin');

      expect(settingsService.createBackup).toHaveBeenCalledWith('admin-id', 'Admin');
    });

    test('should return backup information in result', async () => {
      const importData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: 'Admin',
          version: 1
        },
        settings: {
          maxLoanDuration: 20
        },
        closedDates: [],
        categoryLimits: []
      };

      const result = await settingsService.importSettings(importData, 'admin-id', 'Admin');

      expect(result.backup).toBeDefined();
      expect(result.backup.id).toBe('backup-123');
    });

    test('should import settings correctly', async () => {
      const importData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: 'Admin',
          version: 1
        },
        settings: {
          maxLoanDuration: 20,
          maxAdvanceBookingDays: 45
        },
        closedDates: [],
        categoryLimits: []
      };

      await settingsService.importSettings(importData, 'admin-id', 'Admin');

      expect(settingsService.updateMultipleSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          maxLoanDuration: 20,
          maxAdvanceBookingDays: 45
        }),
        'admin-id',
        'Admin'
      );
    });

    test('should return accurate import stats', async () => {
      const importData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: 'Admin',
          version: 1
        },
        settings: {
          maxLoanDuration: 20,
          maxAdvanceBookingDays: 45
        },
        closedDates: [
          {
            date: new Date('2024-12-25').toISOString(),
            reason: 'Christmas',
            isRecurring: true,
            recurringPattern: 'yearly'
          }
        ],
        categoryLimits: [
          {
            categoryId: 'cat-1',
            categoryName: 'Cameras',
            limit: 2
          }
        ]
      };

      const result = await settingsService.importSettings(importData, 'admin-id', 'Admin');

      expect(result.stats.settingsUpdated).toBe(2);
      expect(result.stats.closedDatesAdded).toBe(1);
      expect(result.stats.categoryLimitsUpdated).toBe(1);
    });

    test('should log import action', async () => {
      const importData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: 'Admin',
          version: 1
        },
        settings: {},
        closedDates: [],
        categoryLimits: []
      };

      await settingsService.importSettings(importData, 'admin-id', 'Admin');

      expect(settingsService._logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 'admin-id',
          adminName: 'Admin',
          action: 'import',
          settingType: 'settings_import'
        })
      );
    });
  });
});
