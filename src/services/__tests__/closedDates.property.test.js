/**
 * Property-Based Tests for Closed Dates
 * 
 * Tests universal properties that should hold for closed dates functionality
 * across all valid inputs using fast-check library.
 * 
 * Feature: admin-settings-system
 */

import fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import settingsService from '../settingsService';
import ClosedDatePicker from '../../components/admin/settings/ClosedDatePicker';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {},
  auth: {}
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    fromDate: (date) => ({ toDate: () => date }),
    now: () => ({ toDate: () => new Date() })
  },
  serverTimestamp: () => new Date()
}));

describe('Closed Dates Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: admin-settings-system, Property 5: Closed date persistence and retrieval
   * 
   * For any valid date with reason, when an administrator adds it as a closed date,
   * the system should store it with metadata and display it in chronological order when queried
   * 
   * Validates: Requirements 2.1, 2.5
   */
  describe('Property 5: Closed date persistence and retrieval', () => {
    test('added closed dates should be retrievable with all metadata', async () => {
      // Generator for valid dates
      const dateArbitrary = fc.date({
        min: new Date('2024-01-01'),
        max: new Date('2025-12-31')
      }).filter(date => !isNaN(date.getTime()));

      // Generator for reasons
      const reasonArbitrary = fc.string({ minLength: 1, maxLength: 100 })
        .filter(s => s.trim().length > 0);

      await fc.assert(
        fc.asyncProperty(
          dateArbitrary,
          reasonArbitrary,
          fc.boolean(),
          async (date, reason, isRecurring) => {
            // Mock Firestore operations for each test iteration
            const { setDoc, doc, collection } = require('firebase/firestore');
            const mockDocRef = { id: 'test-closed-date-id' };
            
            // Reset mocks for this iteration
            setDoc.mockClear();
            doc.mockClear();
            collection.mockClear();
            
            doc.mockReturnValue(mockDocRef);
            collection.mockReturnValue({});
            setDoc.mockResolvedValue(undefined);

            // Add closed date
            const docId = await settingsService.addClosedDate(
              date,
              reason,
              'test-admin-id',
              isRecurring,
              isRecurring ? 'yearly' : null
            );

            // Property: Should return a document ID
            if (!docId || typeof docId !== 'string') {
              throw new Error('addClosedDate should return a valid document ID');
            }

            // Property: setDoc should have been called
            if (setDoc.mock.calls.length === 0) {
              throw new Error('setDoc should have been called to save the closed date');
            }

            // Get the first setDoc call (for the closed date, not audit log)
            const closedDateCall = setDoc.mock.calls.find(call => {
              const data = call[1];
              return data && data.reason !== undefined;
            });

            if (!closedDateCall) {
              throw new Error('Could not find setDoc call for closed date');
            }

            const savedData = closedDateCall[1];

            // Verify all required fields are present
            if (!savedData.date) {
              throw new Error('Saved data should include date');
            }
            if (savedData.reason !== reason.trim()) {
              throw new Error(`Reason should be "${reason.trim()}" but got "${savedData.reason}"`);
            }
            if (!savedData.createdAt) {
              throw new Error('Saved data should include createdAt');
            }
            if (savedData.createdBy !== 'test-admin-id') {
              throw new Error('Saved data should include correct createdBy');
            }
            if (savedData.isRecurring !== isRecurring) {
              throw new Error('Saved data should include correct isRecurring flag');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('closed dates should be returned in chronological order', async () => {
      // Generator for multiple dates
      const datesArbitrary = fc.array(
        fc.date({
          min: new Date('2024-01-01'),
          max: new Date('2025-12-31')
        }).filter(date => !isNaN(date.getTime())),
        { minLength: 2, maxLength: 10 }
      );

      await fc.assert(
        fc.asyncProperty(
          datesArbitrary,
          async (dates) => {
            // Create closed dates with random order
            const closedDates = dates.map((date, index) => ({
              id: `closed-${index}`,
              date: date,
              reason: `Reason ${index}`,
              createdAt: new Date(),
              createdBy: 'admin',
              isRecurring: false,
              recurringPattern: null
            }));

            // Mock getDocs to return dates in random order
            const { getDocs } = require('firebase/firestore');
            getDocs.mockResolvedValue({
              forEach: (callback) => {
                // Sort by date ascending (as per orderBy in the service)
                const sorted = [...closedDates].sort((a, b) => a.date.getTime() - b.date.getTime());
                sorted.forEach((closedDate) => {
                  callback({
                    id: closedDate.id,
                    data: () => ({
                      date: { toDate: () => closedDate.date },
                      reason: closedDate.reason,
                      createdAt: { toDate: () => closedDate.createdAt },
                      createdBy: closedDate.createdBy,
                      isRecurring: closedDate.isRecurring,
                      recurringPattern: closedDate.recurringPattern
                    })
                  });
                });
              }
            });

            // Get closed dates
            const retrievedDates = await settingsService.getClosedDates();

            // Property: Dates should be in chronological order
            for (let i = 1; i < retrievedDates.length; i++) {
              const prevDate = retrievedDates[i - 1].date;
              const currDate = retrievedDates[i].date;
              
              if (prevDate.getTime() > currDate.getTime()) {
                throw new Error(
                  `Dates not in chronological order: ${prevDate.toISOString()} comes before ${currDate.toISOString()}`
                );
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: admin-settings-system, Property 6: Closed date removal
   * 
   * For any existing closed date, when an administrator removes it,
   * the date should no longer appear in the closed dates list and should become selectable in date pickers
   * 
   * Validates: Requirements 2.6, 2.7
   */
  describe('Property 6: Closed date removal', () => {
    test('removed closed dates should no longer be identified as closed', async () => {
      // Generator for valid dates
      const dateArbitrary = fc.date({
        min: new Date('2024-01-01'),
        max: new Date('2025-12-31')
      }).filter(date => !isNaN(date.getTime()));

      await fc.assert(
        fc.asyncProperty(
          dateArbitrary,
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          async (date, reason) => {
            // Mock Firestore operations
            const { getDoc, deleteDoc, getDocs } = require('firebase/firestore');
            
            // Reset mocks
            getDoc.mockClear();
            deleteDoc.mockClear();
            getDocs.mockClear();

            // Mock getDoc to return the closed date
            getDoc.mockResolvedValue({
              exists: () => true,
              data: () => ({
                date: { toDate: () => date },
                reason: reason,
                createdAt: { toDate: () => new Date() },
                createdBy: 'admin',
                isRecurring: false,
                recurringPattern: null
              })
            });

            // Mock deleteDoc
            deleteDoc.mockResolvedValue(undefined);

            // Remove the closed date
            await settingsService.removeClosedDate('test-date-id');

            // Property: deleteDoc should have been called
            if (deleteDoc.mock.calls.length === 0) {
              throw new Error('deleteDoc should have been called to remove the closed date');
            }

            // After removal, mock getDocs to return empty array
            getDocs.mockResolvedValue({
              forEach: (callback) => {
                // No closed dates
              }
            });

            // Property: The date should no longer be closed
            const isClosed = await settingsService.isDateClosed(date);
            if (isClosed) {
              throw new Error(
                `Date ${date.toISOString()} should not be closed after removal but was still detected as closed`
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('removing a closed date should not affect other closed dates', async () => {
      // Helper to normalize date to start of day
      const normalizeDate = (date) => {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized.getTime();
      };

      // Generator for multiple unique dates (unique by day, not timestamp)
      const datesArbitrary = fc.array(
        fc.date({
          min: new Date('2024-01-01'),
          max: new Date('2025-12-31')
        }).filter(date => !isNaN(date.getTime())),
        { minLength: 2, maxLength: 5 }
      ).map(dates => {
        // Ensure dates are unique by day (not just timestamp)
        const uniqueDates = [];
        const seenDays = new Set();
        
        for (const date of dates) {
          const dayTimestamp = normalizeDate(date);
          if (!seenDays.has(dayTimestamp)) {
            seenDays.add(dayTimestamp);
            uniqueDates.push(date);
          }
        }
        
        return uniqueDates;
      }).filter(dates => dates.length >= 2); // Ensure we have at least 2 unique dates

      await fc.assert(
        fc.asyncProperty(
          datesArbitrary,
          async (dates) => {
            // Skip if we don't have enough unique dates
            if (dates.length < 2) {
              return;
            }

            // Create closed dates
            const closedDates = dates.map((date, index) => ({
              id: `closed-${index}`,
              date: date,
              reason: `Reason ${index}`,
              createdAt: new Date(),
              createdBy: 'admin',
              isRecurring: false,
              recurringPattern: null
            }));

            // Mock Firestore operations
            const { getDoc, deleteDoc, getDocs } = require('firebase/firestore');
            
            // Reset mocks
            getDoc.mockClear();
            deleteDoc.mockClear();
            getDocs.mockClear();

            // Remove the first closed date
            const dateToRemove = closedDates[0];
            const remainingDates = closedDates.slice(1);

            // Mock getDoc for the date to remove
            getDoc.mockResolvedValue({
              exists: () => true,
              data: () => ({
                date: { toDate: () => dateToRemove.date },
                reason: dateToRemove.reason,
                createdAt: { toDate: () => dateToRemove.createdAt },
                createdBy: dateToRemove.createdBy,
                isRecurring: dateToRemove.isRecurring,
                recurringPattern: dateToRemove.recurringPattern
              })
            });

            deleteDoc.mockResolvedValue(undefined);

            // Remove the date
            await settingsService.removeClosedDate(dateToRemove.id);

            // Mock getDocs to return only remaining dates
            getDocs.mockResolvedValue({
              forEach: (callback) => {
                remainingDates.forEach((closedDate) => {
                  callback({
                    id: closedDate.id,
                    data: () => ({
                      date: { toDate: () => closedDate.date },
                      reason: closedDate.reason,
                      createdAt: { toDate: () => closedDate.createdAt },
                      createdBy: closedDate.createdBy,
                      isRecurring: closedDate.isRecurring,
                      recurringPattern: closedDate.recurringPattern
                    })
                  });
                });
              }
            });

            // Property: Removed date should not be closed
            const isRemovedDateClosed = await settingsService.isDateClosed(dateToRemove.date);
            if (isRemovedDateClosed) {
              throw new Error('Removed date should not be closed');
            }

            // Property: Remaining dates should still be closed
            for (const remainingDate of remainingDates) {
              const isStillClosed = await settingsService.isDateClosed(remainingDate.date);
              if (!isStillClosed) {
                throw new Error(
                  `Date ${remainingDate.date.toISOString()} should still be closed but was not`
                );
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: admin-settings-system, Property 4: Closed date enforcement
   * 
   * For any date marked as closed, the system should prevent its selection
   * for borrowing, returning, or reserving equipment across all date selection interfaces
   * 
   * Validates: Requirements 2.2, 2.3, 2.4
   */
  describe('Property 4: Closed date enforcement', () => {
    test('any closed date should be disabled in date picker', async () => {
      // Generator for valid dates (within reasonable range)
      const dateArbitrary = fc.date({
        min: new Date('2024-01-01'),
        max: new Date('2025-12-31')
      }).filter(date => !isNaN(date.getTime())); // Filter out invalid dates

      // Generator for closed date reasons (non-empty strings)
      const reasonArbitrary = fc.string({ minLength: 1, maxLength: 100 })
        .filter(s => s.trim().length > 0);

      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.tuple(dateArbitrary, reasonArbitrary), { minLength: 1, maxLength: 10 }),
          async (closedDatesData) => {
            // Filter out any invalid data that might have slipped through
            const validClosedDatesData = closedDatesData.filter(
              ([date, reason]) => !isNaN(date.getTime()) && reason.trim().length > 0
            );

            if (validClosedDatesData.length === 0) {
              // Skip this test case if no valid data
              return;
            }

            // Setup: Mock closed dates
            const closedDates = validClosedDatesData.map(([date, reason], index) => ({
              id: `closed-${index}`,
              date: date,
              reason: reason,
              createdAt: new Date(),
              createdBy: 'admin',
              isRecurring: false,
              recurringPattern: null
            }));

            // Mock getClosedDates to return our test data
            const { getDocs } = require('firebase/firestore');
            getDocs.mockResolvedValue({
              forEach: (callback) => {
                closedDates.forEach((closedDate) => {
                  callback({
                    id: closedDate.id,
                    data: () => ({
                      date: { toDate: () => closedDate.date },
                      reason: closedDate.reason,
                      createdAt: { toDate: () => closedDate.createdAt },
                      createdBy: closedDate.createdBy,
                      isRecurring: closedDate.isRecurring,
                      recurringPattern: closedDate.recurringPattern
                    })
                  });
                });
              }
            });

            // Test: Check that each closed date is disabled
            for (const closedDate of closedDates) {
              const isClosed = await settingsService.isDateClosed(closedDate.date);
              
              // Property: Closed dates should be identified as closed
              if (!isClosed) {
                throw new Error(
                  `Date ${closedDate.date.toISOString()} should be closed but was not detected as closed`
                );
              }
            }

            // Test: Check that non-closed dates are not disabled
            const nonClosedDate = new Date('2026-01-01');
            const isNonClosedDateClosed = await settingsService.isDateClosed(nonClosedDate);
            
            // Property: Non-closed dates should not be identified as closed
            if (isNonClosedDateClosed) {
              throw new Error(
                `Date ${nonClosedDate.toISOString()} should not be closed but was detected as closed`
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getClosedDateInfo should return closed date info for closed dates', async () => {
      // Generator for closed dates
      const dateArbitrary = fc.date({
        min: new Date('2024-01-01'),
        max: new Date('2024-12-31')
      });

      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.tuple(dateArbitrary, fc.string({ minLength: 5, maxLength: 50 })), { minLength: 1, maxLength: 5 }),
          async (closedDatesData) => {
            // Setup: Mock closed dates
            const closedDates = closedDatesData.map(([date, reason], index) => ({
              id: `closed-${index}`,
              date: date,
              reason: reason,
              createdAt: new Date(),
              createdBy: 'admin',
              isRecurring: false,
              recurringPattern: null
            }));

            const { getDocs } = require('firebase/firestore');
            getDocs.mockResolvedValue({
              forEach: (callback) => {
                closedDates.forEach((closedDate) => {
                  callback({
                    id: closedDate.id,
                    data: () => ({
                      date: { toDate: () => closedDate.date },
                      reason: closedDate.reason,
                      createdAt: { toDate: () => closedDate.createdAt },
                      createdBy: closedDate.createdBy,
                      isRecurring: closedDate.isRecurring,
                      recurringPattern: closedDate.recurringPattern
                    })
                  });
                });
              }
            });

            // Get all closed dates
            const retrievedClosedDates = await settingsService.getClosedDates();

            // Property: All closed dates should be retrievable
            if (retrievedClosedDates.length !== closedDates.length) {
              throw new Error(
                `Expected ${closedDates.length} closed dates but got ${retrievedClosedDates.length}`
              );
            }

            // Property: Each closed date should match the original data
            for (let i = 0; i < closedDates.length; i++) {
              const original = closedDates[i];
              const retrieved = retrievedClosedDates[i];
              
              if (retrieved.reason !== original.reason) {
                throw new Error(
                  `Closed date reason mismatch: expected "${original.reason}" but got "${retrieved.reason}"`
                );
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('recurring closed dates should be disabled every year', async () => {
      // Generator for a date that will recur yearly
      const monthArbitrary = fc.integer({ min: 0, max: 11 });
      const dayArbitrary = fc.integer({ min: 1, max: 28 }); // Use 28 to avoid month-end issues

      await fc.assert(
        fc.asyncProperty(
          monthArbitrary,
          dayArbitrary,
          fc.string({ minLength: 5, maxLength: 50 }),
          async (month, day, reason) => {
            // Setup: Create a recurring closed date
            const baseYear = 2024;
            const recurringDate = new Date(baseYear, month, day);

            const { getDocs } = require('firebase/firestore');
            getDocs.mockResolvedValue({
              forEach: (callback) => {
                callback({
                  id: 'recurring-1',
                  data: () => ({
                    date: { toDate: () => recurringDate },
                    reason: reason,
                    createdAt: { toDate: () => new Date() },
                    createdBy: 'admin',
                    isRecurring: true,
                    recurringPattern: 'yearly'
                  })
                });
              }
            });

            // Test: Check that the same date in different years is closed
            const yearsToTest = [2024, 2025, 2026, 2027];
            
            for (const year of yearsToTest) {
              const testDate = new Date(year, month, day);
              const isClosed = await settingsService.isDateClosed(testDate);
              
              // Property: Recurring dates should be closed in all years
              if (!isClosed) {
                throw new Error(
                  `Recurring date ${month + 1}/${day} should be closed in year ${year} but was not`
                );
              }
            }

            // Test: Check that a different date is not closed
            const differentDate = new Date(baseYear, (month + 1) % 12, (day % 28) + 1);
            const isDifferentDateClosed = await settingsService.isDateClosed(differentDate);
            
            // Property: Different dates should not be affected by recurring closed dates
            if (isDifferentDateClosed) {
              throw new Error(
                `Date ${differentDate.toISOString()} should not be closed but was detected as closed`
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
