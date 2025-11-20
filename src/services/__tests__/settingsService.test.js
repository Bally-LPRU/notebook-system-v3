/**
 * Unit tests for settingsService
 * Tests CRUD operations, error handling, and validation logic
 */

import settingsService from '../settingsService';
import { DEFAULT_SETTINGS } from '../../types/settings';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {}
}));

// Mock Firestore functions
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => new Date());
const mockDoc = jest.fn(() => ({}));
const mockCollection = jest.fn(() => ({}));

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  doc: (...args) => mockDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  Timestamp: {
    now: () => ({ toDate: () => new Date() })
  }
}));

describe('settingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return existing settings when document exists', async () => {
      const mockSettings = {
        maxLoanDuration: 21,
        maxAdvanceBookingDays: 45,
        defaultCategoryLimit: 5,
        discordWebhookUrl: 'https://discord.com/api/webhooks/123/abc',
        discordEnabled: true
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockSettings,
        id: 'systemSettings'
      });

      const settings = await settingsService.getSettings();

      expect(settings).toEqual({
        ...mockSettings,
        id: 'systemSettings'
      });
      expect(mockGetDoc).toHaveBeenCalled();
    });

    it('should initialize and return default settings when document does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false
      });
      mockSetDoc.mockResolvedValue();

      const settings = await settingsService.getSettings();

      expect(settings).toEqual({
        ...DEFAULT_SETTINGS,
        id: 'systemSettings'
      });
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should throw error when Firestore operation fails', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(settingsService.getSettings()).rejects.toThrow('Firestore error');
    });
  });

  describe('updateSetting', () => {
    beforeEach(() => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          maxLoanDuration: 14,
          maxAdvanceBookingDays: 30,
          defaultCategoryLimit: 3
        }),
        id: 'systemSettings'
      });
      mockUpdateDoc.mockResolvedValue();
      mockSetDoc.mockResolvedValue();
    });

    it('should update a valid setting', async () => {
      await settingsService.updateSetting('maxLoanDuration', 21, 'admin123', 'Admin User');

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls.find(call => 
        call[1] && call[1].hasOwnProperty('maxLoanDuration')
      );
      expect(updateCall).toBeDefined();
      expect(updateCall[1].maxLoanDuration).toBe(21);
      expect(updateCall[1].lastUpdatedBy).toBe('admin123');
    });

    it('should reject invalid loan duration', async () => {
      await expect(
        settingsService.updateSetting('maxLoanDuration', 0, 'admin123', 'Admin User')
      ).rejects.toThrow();
    });

    it('should reject invalid advance booking days', async () => {
      await expect(
        settingsService.updateSetting('maxAdvanceBookingDays', 500, 'admin123', 'Admin User')
      ).rejects.toThrow();
    });

    it('should reject invalid category limit', async () => {
      await expect(
        settingsService.updateSetting('defaultCategoryLimit', -1, 'admin123', 'Admin User')
      ).rejects.toThrow();
    });

    it('should reject invalid Discord webhook URL', async () => {
      await expect(
        settingsService.updateSetting('discordWebhookUrl', 'not-a-valid-url', 'admin123', 'Admin User')
      ).rejects.toThrow();
    });

    it('should accept null for Discord webhook URL', async () => {
      await settingsService.updateSetting('discordWebhookUrl', null, 'admin123', 'Admin User');

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls.find(call => 
        call[1] && call[1].hasOwnProperty('discordWebhookUrl')
      );
      expect(updateCall).toBeDefined();
      expect(updateCall[1].discordWebhookUrl).toBe(null);
    });

    it('should accept valid Discord webhook URL', async () => {
      const validUrl = 'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz';
      await settingsService.updateSetting('discordWebhookUrl', validUrl, 'admin123', 'Admin User');

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls.find(call => 
        call[1] && call[1].hasOwnProperty('discordWebhookUrl')
      );
      expect(updateCall).toBeDefined();
      expect(updateCall[1].discordWebhookUrl).toBe(validUrl);
    });

    it('should create audit log entry', async () => {
      await settingsService.updateSetting('maxLoanDuration', 21, 'admin123', 'Admin User');

      // Audit log is created with setDoc
      expect(mockSetDoc).toHaveBeenCalled();
    });
  });

  describe('updateMultipleSettings', () => {
    beforeEach(() => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          maxLoanDuration: 14,
          maxAdvanceBookingDays: 30,
          defaultCategoryLimit: 3
        }),
        id: 'systemSettings'
      });
      mockUpdateDoc.mockResolvedValue();
      mockSetDoc.mockResolvedValue();
    });

    it('should update multiple valid settings', async () => {
      const settings = {
        maxLoanDuration: 21,
        maxAdvanceBookingDays: 45,
        defaultCategoryLimit: 5
      };

      await settingsService.updateMultipleSettings(settings, 'admin123', 'Admin User');

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0];
      expect(updateCall[1].maxLoanDuration).toBe(21);
      expect(updateCall[1].maxAdvanceBookingDays).toBe(45);
      expect(updateCall[1].defaultCategoryLimit).toBe(5);
      expect(updateCall[1].lastUpdatedBy).toBe('admin123');
    });

    it('should reject if any setting is invalid', async () => {
      const settings = {
        maxLoanDuration: 21,
        maxAdvanceBookingDays: 500, // Invalid
        defaultCategoryLimit: 5
      };

      await expect(
        settingsService.updateMultipleSettings(settings, 'admin123', 'Admin User')
      ).rejects.toThrow();

      // Should not update any settings
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should create audit log entries for each changed setting', async () => {
      const settings = {
        maxLoanDuration: 21,
        maxAdvanceBookingDays: 45
      };

      await settingsService.updateMultipleSettings(settings, 'admin123', 'Admin User');

      // Should create audit log entries (using setDoc)
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should handle empty settings object', async () => {
      await settingsService.updateMultipleSettings({}, 'admin123', 'Admin User');

      expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore connection errors', async () => {
      mockGetDoc.mockRejectedValue(new Error('Network error'));

      await expect(settingsService.getSettings()).rejects.toThrow('Network error');
    });

    it('should handle update failures', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ maxLoanDuration: 14 }),
        id: 'systemSettings'
      });
      mockUpdateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(
        settingsService.updateSetting('maxLoanDuration', 21, 'admin123', 'Admin User')
      ).rejects.toThrow('Update failed');
    });

    it('should handle validation errors gracefully', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ maxLoanDuration: 14 }),
        id: 'systemSettings'
      });

      await expect(
        settingsService.updateSetting('maxLoanDuration', 'not-a-number', 'admin123', 'Admin User')
      ).rejects.toThrow();

      // Should not call updateDoc if validation fails
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
  });

  describe('Validation Logic', () => {
    beforeEach(() => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          maxLoanDuration: 14,
          maxAdvanceBookingDays: 30,
          defaultCategoryLimit: 3
        }),
        id: 'systemSettings'
      });
      mockUpdateDoc.mockResolvedValue();
      mockSetDoc.mockResolvedValue();
    });

    it('should validate loan duration range', async () => {
      // Valid values
      await expect(
        settingsService.updateSetting('maxLoanDuration', 1, 'admin123', 'Admin User')
      ).resolves.not.toThrow();

      await expect(
        settingsService.updateSetting('maxLoanDuration', 365, 'admin123', 'Admin User')
      ).resolves.not.toThrow();

      // Invalid values
      await expect(
        settingsService.updateSetting('maxLoanDuration', 0, 'admin123', 'Admin User')
      ).rejects.toThrow();

      await expect(
        settingsService.updateSetting('maxLoanDuration', 366, 'admin123', 'Admin User')
      ).rejects.toThrow();
    });

    it('should validate advance booking days range', async () => {
      // Valid values
      await expect(
        settingsService.updateSetting('maxAdvanceBookingDays', 1, 'admin123', 'Admin User')
      ).resolves.not.toThrow();

      await expect(
        settingsService.updateSetting('maxAdvanceBookingDays', 365, 'admin123', 'Admin User')
      ).resolves.not.toThrow();

      // Invalid values
      await expect(
        settingsService.updateSetting('maxAdvanceBookingDays', 0, 'admin123', 'Admin User')
      ).rejects.toThrow();

      await expect(
        settingsService.updateSetting('maxAdvanceBookingDays', 366, 'admin123', 'Admin User')
      ).rejects.toThrow();
    });

    it('should validate category limit range', async () => {
      // Valid values
      await expect(
        settingsService.updateSetting('defaultCategoryLimit', 1, 'admin123', 'Admin User')
      ).resolves.not.toThrow();

      await expect(
        settingsService.updateSetting('defaultCategoryLimit', 100, 'admin123', 'Admin User')
      ).resolves.not.toThrow();

      // Invalid values
      await expect(
        settingsService.updateSetting('defaultCategoryLimit', 0, 'admin123', 'Admin User')
      ).rejects.toThrow();

      await expect(
        settingsService.updateSetting('defaultCategoryLimit', 101, 'admin123', 'Admin User')
      ).rejects.toThrow();
    });

    it('should validate Discord webhook URL format', async () => {
      // Valid URL
      await expect(
        settingsService.updateSetting(
          'discordWebhookUrl',
          'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz',
          'admin123',
          'Admin User'
        )
      ).resolves.not.toThrow();

      // Invalid URLs
      await expect(
        settingsService.updateSetting('discordWebhookUrl', 'http://example.com', 'admin123', 'Admin User')
      ).rejects.toThrow();

      await expect(
        settingsService.updateSetting('discordWebhookUrl', 'not-a-url', 'admin123', 'Admin User')
      ).rejects.toThrow();
    });

    it('should validate boolean values for discordEnabled', async () => {
      // Valid values
      await expect(
        settingsService.updateSetting('discordEnabled', true, 'admin123', 'Admin User')
      ).resolves.not.toThrow();

      await expect(
        settingsService.updateSetting('discordEnabled', false, 'admin123', 'Admin User')
      ).resolves.not.toThrow();

      // Invalid values
      await expect(
        settingsService.updateSetting('discordEnabled', 'yes', 'admin123', 'Admin User')
      ).rejects.toThrow();

      await expect(
        settingsService.updateSetting('discordEnabled', 1, 'admin123', 'Admin User')
      ).rejects.toThrow();
    });
  });
});
