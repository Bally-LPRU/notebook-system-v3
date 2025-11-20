/**
 * Property-based tests for useCategoryLimits hook
 * Tests universal properties that should hold across all valid inputs
 * 
 * Feature: admin-settings-system
 * Requirements: 6.2, 6.6
 */

import { renderHook, waitFor } from '@testing-library/react';
import fc from 'fast-check';
import React from 'react';
import { useCategoryLimits } from '../useCategoryLimits';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { SETTINGS_VALIDATION } from '../../types/settings';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {},
  auth: {}
}));

// Mock settingsService
jest.mock('../../services/settingsService', () => ({
  getAllCategoryLimits: jest.fn(),
  getSettings: jest.fn()
}));

// Mock settingsCache
jest.mock('../../utils/settingsCache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  invalidate: jest.fn()
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  onSnapshot: jest.fn((ref, onNext) => {
    // Return unsubscribe function
    return () => {};
  }),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn()
}));

const settingsService = require('../../services/settingsService');
const settingsCache = require('../../utils/settingsCache');

// Generator for valid category IDs
const categoryIdGenerator = fc.string({ minLength: 5, maxLength: 30 });

// Generator for valid category names
const categoryNameGenerator = fc.string({ minLength: 1, maxLength: 50 });

// Generator for valid limits
const validLimitGenerator = fc.integer({
  min: SETTINGS_VALIDATION.defaultCategoryLimit.min,
  max: SETTINGS_VALIDATION.defaultCategoryLimit.max
});

// Generator for category limit objects
const categoryLimitGenerator = fc.record({
  id: categoryIdGenerator,
  categoryId: categoryIdGenerator,
  categoryName: categoryNameGenerator,
  limit: validLimitGenerator,
  updatedAt: fc.date(),
  updatedBy: fc.string({ minLength: 5, maxLength: 30 })
});

// Generator for array of category limits
const categoryLimitsArrayGenerator = fc.array(categoryLimitGenerator, { minLength: 0, maxLength: 20 });

// Generator for default settings
const defaultSettingsGenerator = fc.record({
  maxLoanDuration: fc.integer({ min: 1, max: 365 }),
  maxAdvanceBookingDays: fc.integer({ min: 1, max: 365 }),
  defaultCategoryLimit: validLimitGenerator,
  discordWebhookUrl: fc.constant(null),
  discordEnabled: fc.boolean(),
  version: fc.constant(1)
});

describe('useCategoryLimits property-based tests', () => {
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

  // **Feature: admin-settings-system, Property 13: Default category limit application**
  // **Validates: Requirements 6.6**
  describe('Property 13: Default category limit application', () => {
    it('should return default limit for any category without specific limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          categoryLimitsArrayGenerator,
          defaultSettingsGenerator,
          categoryIdGenerator,
          async (mockCategoryLimits, mockSettings, testCategoryId) => {
            // Ensure test category is not in the limits array
            const filteredLimits = mockCategoryLimits.filter(cl => cl.categoryId !== testCategoryId);
            
            settingsService.getAllCategoryLimits.mockResolvedValue(filteredLimits);
            settingsService.getSettings.mockResolvedValue(mockSettings);
            settingsCache.get.mockReturnValue(null);

            const { result } = renderHookWithProvider(() => useCategoryLimits());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Get limit for category not in the list
            const limit = result.current.getCategoryLimit(testCategoryId);
            
            // Should return the default limit
            expect(limit).toBe(mockSettings.defaultCategoryLimit);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return default limit when category limits array is empty', async () => {
      await fc.assert(
        fc.asyncProperty(
          defaultSettingsGenerator,
          categoryIdGenerator,
          async (mockSettings, testCategoryId) => {
            settingsService.getAllCategoryLimits.mockResolvedValue([]);
            settingsService.getSettings.mockResolvedValue(mockSettings);
            settingsCache.get.mockReturnValue(null);

            const { result } = renderHookWithProvider(() => useCategoryLimits());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Get limit for any category
            const limit = result.current.getCategoryLimit(testCategoryId);
            
            // Should return the default limit
            expect(limit).toBe(mockSettings.defaultCategoryLimit);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // **Feature: admin-settings-system, Property 12: Category limit enforcement**
  // **Validates: Requirements 6.2, 6.3**
  describe('Property 12: Category limit retrieval for enforcement', () => {
    it('should return specific limit for any category that has one configured', async () => {
      await fc.assert(
        fc.asyncProperty(
          categoryLimitsArrayGenerator,
          defaultSettingsGenerator,
          async (mockCategoryLimits, mockSettings) => {
            // Skip if no category limits
            if (mockCategoryLimits.length === 0) return;

            settingsService.getAllCategoryLimits.mockResolvedValue(mockCategoryLimits);
            settingsService.getSettings.mockResolvedValue(mockSettings);
            settingsCache.get.mockReturnValue(null);

            const { result } = renderHookWithProvider(() => useCategoryLimits());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Pick a random category from the limits
            const randomCategory = mockCategoryLimits[Math.floor(Math.random() * mockCategoryLimits.length)];
            
            // Get limit for that category
            const limit = result.current.getCategoryLimit(randomCategory.categoryId);
            
            // Should return the specific limit, not the default
            expect(limit).toBe(randomCategory.limit);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should always return a valid positive integer limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          categoryLimitsArrayGenerator,
          defaultSettingsGenerator,
          categoryIdGenerator,
          async (mockCategoryLimits, mockSettings, testCategoryId) => {
            settingsService.getAllCategoryLimits.mockResolvedValue(mockCategoryLimits);
            settingsService.getSettings.mockResolvedValue(mockSettings);
            settingsCache.get.mockReturnValue(null);

            const { result } = renderHookWithProvider(() => useCategoryLimits());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Get limit for any category
            const limit = result.current.getCategoryLimit(testCategoryId);
            
            // Should always be a positive integer
            expect(typeof limit).toBe('number');
            expect(Number.isInteger(limit)).toBe(true);
            expect(limit).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Invalid category IDs return default limit', () => {
    it('should return default limit for invalid category IDs', async () => {
      await fc.assert(
        fc.asyncProperty(
          categoryLimitsArrayGenerator,
          defaultSettingsGenerator,
          fc.constantFrom(null, undefined, '', 123, {}, []),
          async (mockCategoryLimits, mockSettings, invalidCategoryId) => {
            settingsService.getAllCategoryLimits.mockResolvedValue(mockCategoryLimits);
            settingsService.getSettings.mockResolvedValue(mockSettings);
            settingsCache.get.mockReturnValue(null);

            const { result } = renderHookWithProvider(() => useCategoryLimits());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Get limit with invalid ID
            const limit = result.current.getCategoryLimit(invalidCategoryId);
            
            // Should return default limit
            expect(limit).toBe(mockSettings.defaultCategoryLimit);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Category limits array contains valid data', () => {
    it('should provide array with all expected properties', async () => {
      await fc.assert(
        fc.asyncProperty(
          categoryLimitsArrayGenerator,
          defaultSettingsGenerator,
          async (mockCategoryLimits, mockSettings) => {
            settingsService.getAllCategoryLimits.mockResolvedValue(mockCategoryLimits);
            settingsService.getSettings.mockResolvedValue(mockSettings);
            settingsCache.get.mockReturnValue(null);

            const { result } = renderHookWithProvider(() => useCategoryLimits());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            const categoryLimits = result.current.categoryLimits;

            // Verify each category limit has required properties
            categoryLimits.forEach(cl => {
              expect(cl).toHaveProperty('categoryId');
              expect(cl).toHaveProperty('categoryName');
              expect(cl).toHaveProperty('limit');
              expect(typeof cl.limit).toBe('number');
              expect(cl.limit).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Default limit is always accessible', () => {
    it('should expose default limit from settings', async () => {
      await fc.assert(
        fc.asyncProperty(
          categoryLimitsArrayGenerator,
          defaultSettingsGenerator,
          async (mockCategoryLimits, mockSettings) => {
            settingsService.getAllCategoryLimits.mockResolvedValue(mockCategoryLimits);
            settingsService.getSettings.mockResolvedValue(mockSettings);
            settingsCache.get.mockReturnValue(null);

            const { result } = renderHookWithProvider(() => useCategoryLimits());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Default limit should match settings
            expect(result.current.defaultLimit).toBe(mockSettings.defaultCategoryLimit);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
