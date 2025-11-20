/**
 * Property-based tests for useSettings hook
 * Tests universal properties that should hold across all valid inputs
 * 
 * Feature: admin-settings-system
 * Requirements: 1.2
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import fc from 'fast-check';
import React from 'react';
import { useSettings } from '../useSettings';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { SETTINGS_VALIDATION } from '../../types/settings';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {},
  auth: {}
}));

// Mock settingsService
jest.mock('../../services/settingsService', () => ({
  getSettings: jest.fn(),
  updateSetting: jest.fn(),
  updateMultipleSettings: jest.fn()
}));

// Mock settingsCache
jest.mock('../../utils/settingsCache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  invalidate: jest.fn()
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn((ref, onNext) => {
    // Return unsubscribe function
    return () => {};
  }),
  collection: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn()
}));

const settingsService = require('../../services/settingsService');
const settingsCache = require('../../utils/settingsCache');

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

const validSettingsGenerator = fc.record({
  maxLoanDuration: validLoanDurationGenerator,
  maxAdvanceBookingDays: validAdvanceBookingDaysGenerator,
  defaultCategoryLimit: validCategoryLimitGenerator,
  discordWebhookUrl: fc.constant(null),
  discordEnabled: fc.boolean(),
  version: fc.constant(1)
});

describe('useSettings property-based tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to render hook with provider
  const renderHookWithProvider = (hook) => {
    const wrapper = ({ children }) => (
      <SettingsProvider>{children}</SettingsProvider>
    );
    return renderHook(hook, { wrapper });
  };

  describe('Property: Settings access provides consistent data', () => {
    it('should provide settings object that matches fetched data', async () => {
      await fc.assert(
        fc.asyncProperty(
          validSettingsGenerator,
          async (mockSettings) => {
            // Mock the service to return our generated settings
            settingsService.getSettings.mockResolvedValue(mockSettings);
            settingsCache.get.mockReturnValue(null);

            const { result } = renderHookWithProvider(() => useSettings());

            // Wait for loading to complete
            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Verify settings match what was fetched
            expect(result.current.settings.maxLoanDuration).toBe(mockSettings.maxLoanDuration);
            expect(result.current.settings.maxAdvanceBookingDays).toBe(mockSettings.maxAdvanceBookingDays);
            expect(result.current.settings.defaultCategoryLimit).toBe(mockSettings.defaultCategoryLimit);
            expect(result.current.error).toBe(null);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: getSetting returns correct values with defaults', () => {
    it('should return setting value when it exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          validSettingsGenerator,
          fc.constantFrom('maxLoanDuration', 'maxAdvanceBookingDays', 'defaultCategoryLimit'),
          async (mockSettings, settingKey) => {
            settingsService.getSettings.mockResolvedValue(mockSettings);
            settingsCache.get.mockReturnValue(null);

            const { result } = renderHookWithProvider(() => useSettings());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Get the setting value
            const value = result.current.getSetting(settingKey);
            
            // Should match the mock settings value
            expect(value).toBe(mockSettings[settingKey]);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return default value when setting does not exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          validSettingsGenerator,
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => {
            const existingKeys = ['maxLoanDuration', 'maxAdvanceBookingDays', 'defaultCategoryLimit', 'discordWebhookUrl', 'discordEnabled', 'version'];
            // Also filter out Object.prototype properties
            return !existingKeys.includes(s) && !Object.prototype.hasOwnProperty(s);
          }),
          fc.integer(),
          async (mockSettings, nonExistentKey, defaultValue) => {
            settingsService.getSettings.mockResolvedValue(mockSettings);
            settingsCache.get.mockReturnValue(null);

            const { result } = renderHookWithProvider(() => useSettings());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Get a non-existent setting with default
            const value = result.current.getSetting(nonExistentKey, defaultValue);
            
            // Should return the default value
            expect(value).toBe(defaultValue);
          }
        ),
        { numRuns: 30 }
      );
    }, 10000);
  });

  describe('Property: Hook throws error when used outside provider', () => {
    it('should throw error for any component not wrapped in provider', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Attempt to use hook without provider should throw
            expect(() => {
              renderHook(() => useSettings());
            }).toThrow('useSettings must be used within a SettingsProvider');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property: Refresh functionality reloads settings', () => {
    it('should fetch fresh settings when refresh is called', async () => {
      await fc.assert(
        fc.asyncProperty(
          validSettingsGenerator,
          validSettingsGenerator,
          async (initialSettings, updatedSettings) => {
            // Start with initial settings
            settingsService.getSettings.mockResolvedValueOnce(initialSettings);
            settingsCache.get.mockReturnValue(null);

            const { result } = renderHookWithProvider(() => useSettings());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Verify initial settings
            expect(result.current.settings.maxLoanDuration).toBe(initialSettings.maxLoanDuration);

            // Mock updated settings for refresh
            settingsService.getSettings.mockResolvedValueOnce(updatedSettings);

            // Call refresh
            await act(async () => {
              await result.current.refreshSettings();
            });

            // Verify settings were updated
            expect(result.current.settings.maxLoanDuration).toBe(updatedSettings.maxLoanDuration);
            expect(settingsCache.invalidate).toHaveBeenCalled();
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
