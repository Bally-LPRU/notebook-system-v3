/**
 * Property-based tests for useClosedDates hook
 * Tests universal properties that should hold across all valid inputs
 * 
 * Feature: admin-settings-system
 * Requirements: 2.2, 2.3, 2.4
 */

import { renderHook, waitFor } from '@testing-library/react';
import fc from 'fast-check';
import { useClosedDates } from '../useClosedDates';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {},
  auth: {}
}));

// Mock settingsService
jest.mock('../../services/settingsService', () => ({
  getClosedDates: jest.fn(),
  isDateClosed: jest.fn()
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  onSnapshot: jest.fn((query, onNext) => {
    // Return unsubscribe function
    return () => {};
  }),
  orderBy: jest.fn(),
  query: jest.fn()
}));

const settingsService = require('../../services/settingsService');

// Generator for valid dates
const validDateGenerator = fc.date({
  min: new Date('2020-01-01'),
  max: new Date('2030-12-31')
});

// Generator for closed date objects
const closedDateGenerator = fc.record({
  id: fc.string({ minLength: 10, maxLength: 30 }),
  date: validDateGenerator,
  reason: fc.string({ minLength: 1, maxLength: 100 }),
  createdAt: validDateGenerator,
  createdBy: fc.string({ minLength: 5, maxLength: 30 }),
  isRecurring: fc.boolean(),
  recurringPattern: fc.constantFrom(null, 'yearly')
});

// Generator for array of closed dates
const closedDatesArrayGenerator = fc.array(closedDateGenerator, { minLength: 0, maxLength: 20 });

describe('useClosedDates property-based tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property: isDateClosed correctly identifies closed dates', () => {
    it('should return true for any date that matches a closed date', async () => {
      await fc.assert(
        fc.asyncProperty(
          closedDatesArrayGenerator,
          async (mockClosedDates) => {
            // Skip if no closed dates
            if (mockClosedDates.length === 0) return;

            settingsService.getClosedDates.mockResolvedValue(mockClosedDates);

            const { result } = renderHook(() => useClosedDates());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Pick a random closed date from the array
            const randomClosedDate = mockClosedDates[Math.floor(Math.random() * mockClosedDates.length)];
            
            // Check if that exact date is identified as closed
            const isClosed = result.current.isDateClosed(randomClosedDate.date);
            
            // Should return true since it's in the closed dates list
            expect(isClosed).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle invalid dates gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          closedDatesArrayGenerator,
          fc.constantFrom(null, undefined, 'invalid', 123, {}, []),
          async (mockClosedDates, invalidDate) => {
            settingsService.getClosedDates.mockResolvedValue(mockClosedDates);

            const { result } = renderHook(() => useClosedDates());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Should not throw and should return false for invalid dates
            const isClosed = result.current.isDateClosed(invalidDate);
            expect(isClosed).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly identify recurring yearly dates', async () => {
      await fc.assert(
        fc.asyncProperty(
          validDateGenerator,
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          async (baseDate, reason) => {
            // Create a recurring closed date
            const recurringClosedDate = {
              id: 'recurring-1',
              date: baseDate,
              reason: reason,
              createdAt: new Date(),
              createdBy: 'admin',
              isRecurring: true,
              recurringPattern: 'yearly'
            };

            settingsService.getClosedDates.mockResolvedValue([recurringClosedDate]);

            const { result } = renderHook(() => useClosedDates());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Create a date in a different year but same month/day
            const futureDate = new Date(baseDate);
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            // Should be identified as closed due to recurring pattern
            const isClosed = result.current.isDateClosed(futureDate);
            expect(isClosed).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    }, 10000);
  });

  describe('Property: Closed dates are always sorted chronologically', () => {
    it('should maintain chronological order for any set of closed dates', async () => {
      await fc.assert(
        fc.asyncProperty(
          closedDatesArrayGenerator,
          async (mockClosedDates) => {
            // Skip if less than 2 dates
            if (mockClosedDates.length < 2) return;

            settingsService.getClosedDates.mockResolvedValue(mockClosedDates);

            const { result } = renderHook(() => useClosedDates());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            const closedDates = result.current.closedDates;

            // Verify dates are in ascending order
            for (let i = 1; i < closedDates.length; i++) {
              const prevDate = new Date(closedDates[i - 1].date);
              const currDate = new Date(closedDates[i].date);
              
              // Current date should be >= previous date
              expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 20000);
  });

  describe('Property: Date normalization ensures consistent comparisons', () => {
    it('should identify dates as closed regardless of time component', async () => {
      await fc.assert(
        fc.asyncProperty(
          validDateGenerator,
          fc.integer({ min: 0, max: 23 }),
          fc.integer({ min: 0, max: 59 }),
          fc.integer({ min: 0, max: 59 }),
          async (baseDate, hours, minutes, seconds) => {
            // Create closed date at midnight
            const closedDate = new Date(baseDate);
            closedDate.setHours(0, 0, 0, 0);

            const closedDateObj = {
              id: 'test-1',
              date: closedDate,
              reason: 'Test',
              createdAt: new Date(),
              createdBy: 'admin',
              isRecurring: false,
              recurringPattern: null
            };

            settingsService.getClosedDates.mockResolvedValue([closedDateObj]);

            const { result } = renderHook(() => useClosedDates());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Create same date but with different time
            const testDate = new Date(baseDate);
            testDate.setHours(hours, minutes, seconds, 0);

            // Should still be identified as closed despite different time
            const isClosed = result.current.isDateClosed(testDate);
            expect(isClosed).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    }, 10000);
  });

  describe('Property: Empty closed dates list allows all dates', () => {
    it('should return false for any date when no closed dates exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          validDateGenerator,
          async (testDate) => {
            settingsService.getClosedDates.mockResolvedValue([]);

            const { result } = renderHook(() => useClosedDates());

            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // No dates should be closed
            const isClosed = result.current.isDateClosed(testDate);
            expect(isClosed).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
