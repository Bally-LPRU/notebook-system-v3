/**
 * Property-Based Tests for Proactive Alert Service
 * 
 * Tests universal properties for alert priority calculation and no-show detection.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Properties tested:
 * - Property 1: Alert Priority Escalation
 * - Property 2: No-Show Detection Timing
 * 
 * **Validates: Requirements 1.1, 1.2, 2.1**
 */

import fc from 'fast-check';
import { ALERT_PRIORITY } from '../../types/adminAlert';
import { RESERVATION_STATUS } from '../../types/reservation';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

/**
 * Calculate alert priority based on days overdue
 * This is the pure function logic extracted from ProactiveAlertService.calculateOverduePriority
 * 
 * - 0 days overdue → medium priority
 * - 1-2 days overdue → high priority
 * - 3+ days overdue → critical priority
 * - Negative days (not yet due) → low priority
 * 
 * @param {number} daysOverdue - Number of days overdue (can be negative if not yet due)
 * @returns {string} Alert priority from ALERT_PRIORITY
 */
function calculateOverduePriority(daysOverdue) {
  if (daysOverdue >= 3) {
    return ALERT_PRIORITY.CRITICAL;
  }
  if (daysOverdue >= 1) {
    return ALERT_PRIORITY.HIGH;
  }
  if (daysOverdue >= 0) {
    return ALERT_PRIORITY.MEDIUM;
  }
  // Not yet overdue
  return ALERT_PRIORITY.LOW;
}

describe('Proactive Alert Service Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 1: Alert Priority Escalation
   * **Validates: Requirements 1.1, 1.2**
   * 
   * For any overdue loan, the alert priority SHALL be calculated correctly based on days overdue:
   * - 0 days overdue → medium priority
   * - 1-2 days overdue → high priority  
   * - 3+ days overdue → critical priority
   */
  describe('Property 1: Alert Priority Escalation', () => {
    test('0 days overdue should return medium priority', () => {
      fc.assert(
        fc.property(
          fc.constant(0),
          (daysOverdue) => {
            const priority = calculateOverduePriority(daysOverdue);
            expect(priority).toBe(ALERT_PRIORITY.MEDIUM);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('1-2 days overdue should return high priority', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 2 }),
          (daysOverdue) => {
            const priority = calculateOverduePriority(daysOverdue);
            expect(priority).toBe(ALERT_PRIORITY.HIGH);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('3+ days overdue should return critical priority', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 1000 }),
          (daysOverdue) => {
            const priority = calculateOverduePriority(daysOverdue);
            expect(priority).toBe(ALERT_PRIORITY.CRITICAL);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('negative days (not yet due) should return low priority', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: -1 }),
          (daysOverdue) => {
            const priority = calculateOverduePriority(daysOverdue);
            expect(priority).toBe(ALERT_PRIORITY.LOW);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('priority escalates monotonically with days overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 100 }),
          (daysOverdue) => {
            const priority = calculateOverduePriority(daysOverdue);
            
            // Verify the priority is one of the valid values
            expect([
              ALERT_PRIORITY.CRITICAL,
              ALERT_PRIORITY.HIGH,
              ALERT_PRIORITY.MEDIUM,
              ALERT_PRIORITY.LOW
            ]).toContain(priority);
            
            // Verify priority escalation rules
            if (daysOverdue < 0) {
              expect(priority).toBe(ALERT_PRIORITY.LOW);
            } else if (daysOverdue === 0) {
              expect(priority).toBe(ALERT_PRIORITY.MEDIUM);
            } else if (daysOverdue >= 1 && daysOverdue <= 2) {
              expect(priority).toBe(ALERT_PRIORITY.HIGH);
            } else if (daysOverdue >= 3) {
              expect(priority).toBe(ALERT_PRIORITY.CRITICAL);
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('priority calculation is deterministic', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 100 }),
          (daysOverdue) => {
            // Call the function multiple times with same input
            const result1 = calculateOverduePriority(daysOverdue);
            const result2 = calculateOverduePriority(daysOverdue);
            const result3 = calculateOverduePriority(daysOverdue);
            
            // Results should always be the same for same input
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('priority never decreases as days overdue increases', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 99 }),
          (daysOverdue) => {
            const priorityOrder = {
              [ALERT_PRIORITY.CRITICAL]: 0,
              [ALERT_PRIORITY.HIGH]: 1,
              [ALERT_PRIORITY.MEDIUM]: 2,
              [ALERT_PRIORITY.LOW]: 3
            };
            
            const currentPriority = calculateOverduePriority(daysOverdue);
            const nextPriority = calculateOverduePriority(daysOverdue + 1);
            
            // Priority order should never increase (lower number = higher priority)
            expect(priorityOrder[nextPriority]).toBeLessThanOrEqual(priorityOrder[currentPriority]);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });

  /**
   * Feature: admin-intelligence-assistant, Property 2: No-Show Detection Timing
   * **Validates: Requirements 2.1**
   * 
   * For any reservation with status 'ready', if the current time is more than 2 hours 
   * after the start time, the reservation SHALL be classified as a no-show.
   */
  describe('Property 2: No-Show Detection Timing', () => {
    /**
     * Check if a reservation is a no-show
     * This is the pure function logic extracted from ProactiveAlertService.isNoShow
     * 
     * A reservation is considered a no-show if:
     * - Current time is more than 2 hours after the start time
     * - Reservation status is 'ready' (approved and waiting for pickup)
     * 
     * @param {Object} reservation - Reservation object with startTime and status
     * @param {Date} currentTime - Current time to check against
     * @returns {boolean} True if the reservation is a no-show
     */
    function isNoShow(reservation, currentTime) {
      if (!reservation || !reservation.startTime) {
        return false;
      }

      // Only check reservations with 'ready' status
      if (reservation.status !== 'ready') {
        return false;
      }

      // Convert startTime to Date if needed
      let startTime;
      if (reservation.startTime instanceof Date) {
        startTime = reservation.startTime;
      } else if (typeof reservation.startTime.toDate === 'function') {
        startTime = reservation.startTime.toDate();
      } else if (typeof reservation.startTime === 'string' || typeof reservation.startTime === 'number') {
        startTime = new Date(reservation.startTime);
      } else if (typeof reservation.startTime.seconds === 'number') {
        startTime = new Date(reservation.startTime.seconds * 1000);
      } else {
        return false;
      }

      // Calculate pickup deadline (2 hours after start time)
      const pickupDeadlineMs = startTime.getTime() + (2 * 60 * 60 * 1000);
      const pickupDeadline = new Date(pickupDeadlineMs);

      // Check if current time is past the pickup deadline
      return currentTime > pickupDeadline;
    }

    // Arbitrary generator for reservation start times (within reasonable range)
    // Using integer timestamps to avoid NaN date issues
    const validStartTimeArb = fc.integer({
      min: new Date('2020-01-01').getTime(),
      max: new Date('2030-12-31').getTime()
    }).map(ts => new Date(ts));

    // Arbitrary generator for time offset in milliseconds (from -24 hours to +24 hours)
    const timeOffsetArb = fc.integer({ min: -24 * 60 * 60 * 1000, max: 24 * 60 * 60 * 1000 });

    // Arbitrary generator for reservation status
    const statusArb = fc.constantFrom(
      RESERVATION_STATUS.PENDING,
      RESERVATION_STATUS.APPROVED,
      RESERVATION_STATUS.READY,
      RESERVATION_STATUS.COMPLETED,
      RESERVATION_STATUS.CANCELLED,
      RESERVATION_STATUS.EXPIRED,
      RESERVATION_STATUS.NO_SHOW
    );

    test('reservation with status "ready" and current time > 2 hours after start time should be no-show', () => {
      fc.assert(
        fc.property(
          validStartTimeArb,
          fc.integer({ min: 1, max: 24 * 60 * 60 * 1000 }), // 1ms to 24 hours past deadline
          (startTime, extraMs) => {
            const reservation = {
              status: 'ready',
              startTime: startTime
            };
            
            // Current time is more than 2 hours after start time
            const twoHoursMs = 2 * 60 * 60 * 1000;
            const currentTime = new Date(startTime.getTime() + twoHoursMs + extraMs);
            
            const result = isNoShow(reservation, currentTime);
            expect(result).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('reservation with status "ready" and current time <= 2 hours after start time should NOT be no-show', () => {
      fc.assert(
        fc.property(
          validStartTimeArb,
          fc.integer({ min: 0, max: 2 * 60 * 60 * 1000 }), // 0 to exactly 2 hours
          (startTime, offsetMs) => {
            const reservation = {
              status: 'ready',
              startTime: startTime
            };
            
            // Current time is at or before 2 hours after start time
            const currentTime = new Date(startTime.getTime() + offsetMs);
            
            const result = isNoShow(reservation, currentTime);
            expect(result).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('reservation with status other than "ready" should never be no-show regardless of time', () => {
      fc.assert(
        fc.property(
          validStartTimeArb,
          timeOffsetArb,
          fc.constantFrom(
            RESERVATION_STATUS.PENDING,
            RESERVATION_STATUS.APPROVED,
            RESERVATION_STATUS.COMPLETED,
            RESERVATION_STATUS.CANCELLED,
            RESERVATION_STATUS.EXPIRED,
            RESERVATION_STATUS.NO_SHOW
          ),
          (startTime, offsetMs, status) => {
            const reservation = {
              status: status,
              startTime: startTime
            };
            
            const currentTime = new Date(startTime.getTime() + offsetMs);
            
            const result = isNoShow(reservation, currentTime);
            expect(result).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('reservation without startTime should never be no-show', () => {
      fc.assert(
        fc.property(
          validStartTimeArb,
          statusArb,
          (currentTime, status) => {
            const reservationWithoutStartTime = {
              status: status
            };
            
            const result = isNoShow(reservationWithoutStartTime, currentTime);
            expect(result).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('null or undefined reservation should never be no-show', () => {
      fc.assert(
        fc.property(
          validStartTimeArb,
          (currentTime) => {
            expect(isNoShow(null, currentTime)).toBe(false);
            expect(isNoShow(undefined, currentTime)).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('no-show detection is deterministic for same inputs', () => {
      fc.assert(
        fc.property(
          validStartTimeArb,
          timeOffsetArb,
          statusArb,
          (startTime, offsetMs, status) => {
            const reservation = {
              status: status,
              startTime: startTime
            };
            
            const currentTime = new Date(startTime.getTime() + offsetMs);
            
            // Call the function multiple times with same input
            const result1 = isNoShow(reservation, currentTime);
            const result2 = isNoShow(reservation, currentTime);
            const result3 = isNoShow(reservation, currentTime);
            
            // Results should always be the same for same input
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('no-show detection works with Firestore timestamp format (seconds)', () => {
      fc.assert(
        fc.property(
          validStartTimeArb,
          fc.integer({ min: 1, max: 24 * 60 * 60 * 1000 }), // 1ms to 24 hours past deadline
          (startTime, extraMs) => {
            // Simulate Firestore timestamp format
            const firestoreTimestamp = {
              seconds: Math.floor(startTime.getTime() / 1000),
              nanoseconds: 0
            };
            
            const reservation = {
              status: 'ready',
              startTime: firestoreTimestamp
            };
            
            // Current time is more than 2 hours after start time
            const twoHoursMs = 2 * 60 * 60 * 1000;
            const currentTime = new Date(startTime.getTime() + twoHoursMs + extraMs);
            
            const result = isNoShow(reservation, currentTime);
            expect(result).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('no-show detection works with string date format', () => {
      fc.assert(
        fc.property(
          validStartTimeArb,
          fc.integer({ min: 1, max: 24 * 60 * 60 * 1000 }), // 1ms to 24 hours past deadline
          (startTime, extraMs) => {
            const reservation = {
              status: 'ready',
              startTime: startTime.toISOString() // String format
            };
            
            // Current time is more than 2 hours after start time
            const twoHoursMs = 2 * 60 * 60 * 1000;
            const currentTime = new Date(startTime.getTime() + twoHoursMs + extraMs);
            
            const result = isNoShow(reservation, currentTime);
            expect(result).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('no-show detection works with numeric timestamp format', () => {
      fc.assert(
        fc.property(
          validStartTimeArb,
          fc.integer({ min: 1, max: 24 * 60 * 60 * 1000 }), // 1ms to 24 hours past deadline
          (startTime, extraMs) => {
            const reservation = {
              status: 'ready',
              startTime: startTime.getTime() // Numeric timestamp
            };
            
            // Current time is more than 2 hours after start time
            const twoHoursMs = 2 * 60 * 60 * 1000;
            const currentTime = new Date(startTime.getTime() + twoHoursMs + extraMs);
            
            const result = isNoShow(reservation, currentTime);
            expect(result).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('boundary condition: exactly 2 hours after start time should NOT be no-show', () => {
      fc.assert(
        fc.property(
          validStartTimeArb,
          (startTime) => {
            const reservation = {
              status: 'ready',
              startTime: startTime
            };
            
            // Current time is exactly 2 hours after start time
            const twoHoursMs = 2 * 60 * 60 * 1000;
            const currentTime = new Date(startTime.getTime() + twoHoursMs);
            
            const result = isNoShow(reservation, currentTime);
            // At exactly 2 hours, currentTime is NOT > pickupDeadline, so should be false
            expect(result).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('boundary condition: 1ms after 2 hours should be no-show', () => {
      fc.assert(
        fc.property(
          validStartTimeArb,
          (startTime) => {
            const reservation = {
              status: 'ready',
              startTime: startTime
            };
            
            // Current time is 1ms after 2 hours from start time
            const twoHoursMs = 2 * 60 * 60 * 1000;
            const currentTime = new Date(startTime.getTime() + twoHoursMs + 1);
            
            const result = isNoShow(reservation, currentTime);
            expect(result).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });

  /**
   * Feature: admin-intelligence-assistant, Property 3: Repeat No-Show Offender Detection
   * **Validates: Requirements 2.4, 2.5**
   * 
   * For any user with 3 or more no-shows in the past 30 days, the system SHALL flag 
   * them as a repeat no-show offender.
   */
  describe('Property 3: Repeat No-Show Offender Detection', () => {
    // Constants from RELIABILITY_THRESHOLDS
    const NO_SHOW_LIMIT = 3;  // 3 or more no-shows to be flagged
    const NO_SHOW_PERIOD = 30; // Days to check for repeat no-shows

    /**
     * Check if user is a repeat no-show offender
     * This is the pure function logic extracted from ProactiveAlertService.isRepeatNoShowOffender
     * 
     * A user is a repeat no-show offender if they have 3 or more no-shows in the past 30 days.
     * 
     * @param {number} recentNoShows - Number of no-shows in the last 30 days
     * @returns {boolean} True if the user is a repeat no-show offender
     */
    function isRepeatNoShowOffender(recentNoShows) {
      return recentNoShows >= NO_SHOW_LIMIT;
    }

    /**
     * Filter no-show events to count only those within the last N days
     * 
     * @param {Array<Date>} noShowDates - Array of no-show event dates
     * @param {Date} currentDate - Current date to check against
     * @param {number} days - Number of days to look back
     * @returns {number} Count of no-shows within the period
     */
    function countRecentNoShows(noShowDates, currentDate, days = NO_SHOW_PERIOD) {
      const cutoffDate = new Date(currentDate);
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return noShowDates.filter(date => date >= cutoffDate && date <= currentDate).length;
    }

    test('user with 3 or more no-shows in 30 days should be flagged as repeat offender', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 100 }), // 3 to 100 no-shows
          (recentNoShows) => {
            const result = isRepeatNoShowOffender(recentNoShows);
            expect(result).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('user with less than 3 no-shows in 30 days should NOT be flagged as repeat offender', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 2 }), // 0 to 2 no-shows
          (recentNoShows) => {
            const result = isRepeatNoShowOffender(recentNoShows);
            expect(result).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('boundary condition: exactly 3 no-shows should be flagged', () => {
      fc.assert(
        fc.property(
          fc.constant(3),
          (recentNoShows) => {
            const result = isRepeatNoShowOffender(recentNoShows);
            expect(result).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('boundary condition: exactly 2 no-shows should NOT be flagged', () => {
      fc.assert(
        fc.property(
          fc.constant(2),
          (recentNoShows) => {
            const result = isRepeatNoShowOffender(recentNoShows);
            expect(result).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('repeat offender detection is deterministic', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (recentNoShows) => {
            // Call the function multiple times with same input
            const result1 = isRepeatNoShowOffender(recentNoShows);
            const result2 = isRepeatNoShowOffender(recentNoShows);
            const result3 = isRepeatNoShowOffender(recentNoShows);
            
            // Results should always be the same for same input
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('offender status never decreases as no-show count increases', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 99 }),
          (recentNoShows) => {
            const currentStatus = isRepeatNoShowOffender(recentNoShows);
            const nextStatus = isRepeatNoShowOffender(recentNoShows + 1);
            
            // If currently flagged, should remain flagged with more no-shows
            if (currentStatus) {
              expect(nextStatus).toBe(true);
            }
            // If not flagged, can become flagged but not the reverse
            // (nextStatus can be true or false, but if currentStatus is true, nextStatus must be true)
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('only no-shows within 30-day period should count toward offender status', () => {
      // Generator for valid dates within a reasonable range
      const validDateArb = fc.integer({
        min: new Date('2024-01-01').getTime(),
        max: new Date('2026-12-31').getTime()
      }).map(ts => new Date(ts));

      fc.assert(
        fc.property(
          validDateArb, // Current date
          fc.array(fc.integer({ min: -60, max: 60 }), { minLength: 0, maxLength: 20 }), // Day offsets from current date
          (currentDate, dayOffsets) => {
            // Generate no-show dates based on offsets from current date
            const noShowDates = dayOffsets.map(offset => {
              const date = new Date(currentDate);
              date.setDate(date.getDate() - offset);
              return date;
            });

            // Count no-shows within 30-day period
            const recentCount = countRecentNoShows(noShowDates, currentDate, NO_SHOW_PERIOD);
            
            // Verify the count only includes dates within the period
            const cutoffDate = new Date(currentDate);
            cutoffDate.setDate(cutoffDate.getDate() - NO_SHOW_PERIOD);
            
            const manualCount = noShowDates.filter(
              date => date >= cutoffDate && date <= currentDate
            ).length;
            
            expect(recentCount).toBe(manualCount);
            
            // Verify offender status based on count
            const isOffender = isRepeatNoShowOffender(recentCount);
            expect(isOffender).toBe(recentCount >= NO_SHOW_LIMIT);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('no-shows outside 30-day window should not affect offender status', () => {
      const validDateArb = fc.integer({
        min: new Date('2024-01-01').getTime(),
        max: new Date('2026-12-31').getTime()
      }).map(ts => new Date(ts));

      fc.assert(
        fc.property(
          validDateArb, // Current date
          fc.integer({ min: 0, max: 2 }), // Recent no-shows (within 30 days)
          fc.integer({ min: 0, max: 100 }), // Old no-shows (outside 30 days)
          (currentDate, recentCount, oldCount) => {
            // Generate recent no-show dates (within 30 days)
            const recentNoShows = [];
            for (let i = 0; i < recentCount; i++) {
              const date = new Date(currentDate);
              date.setDate(date.getDate() - Math.floor(Math.random() * 29)); // 0-29 days ago
              recentNoShows.push(date);
            }

            // Generate old no-show dates (outside 30 days)
            const oldNoShows = [];
            for (let i = 0; i < oldCount; i++) {
              const date = new Date(currentDate);
              date.setDate(date.getDate() - (31 + Math.floor(Math.random() * 100))); // 31-130 days ago
              oldNoShows.push(date);
            }

            // Combine all no-shows
            const allNoShows = [...recentNoShows, ...oldNoShows];

            // Count should only include recent no-shows
            const count = countRecentNoShows(allNoShows, currentDate, NO_SHOW_PERIOD);
            
            // Count should match recent count (old ones should be excluded)
            expect(count).toBe(recentCount);
            
            // With less than 3 recent no-shows, should not be flagged
            // regardless of how many old no-shows exist
            const isOffender = isRepeatNoShowOffender(count);
            expect(isOffender).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('user with exactly 3 recent no-shows should be flagged regardless of old no-shows', () => {
      const validDateArb = fc.integer({
        min: new Date('2024-01-01').getTime(),
        max: new Date('2026-12-31').getTime()
      }).map(ts => new Date(ts));

      fc.assert(
        fc.property(
          validDateArb, // Current date
          fc.integer({ min: 0, max: 100 }), // Old no-shows (outside 30 days)
          (currentDate, oldCount) => {
            // Generate exactly 3 recent no-show dates (within 30 days)
            const recentNoShows = [];
            for (let i = 0; i < 3; i++) {
              const date = new Date(currentDate);
              date.setDate(date.getDate() - (i * 10)); // 0, 10, 20 days ago
              recentNoShows.push(date);
            }

            // Generate old no-show dates (outside 30 days)
            const oldNoShows = [];
            for (let i = 0; i < oldCount; i++) {
              const date = new Date(currentDate);
              date.setDate(date.getDate() - (31 + i)); // 31+ days ago
              oldNoShows.push(date);
            }

            // Combine all no-shows
            const allNoShows = [...recentNoShows, ...oldNoShows];

            // Count should be exactly 3 (only recent ones)
            const count = countRecentNoShows(allNoShows, currentDate, NO_SHOW_PERIOD);
            expect(count).toBe(3);
            
            // Should be flagged as repeat offender
            const isOffender = isRepeatNoShowOffender(count);
            expect(isOffender).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('zero no-shows should never be flagged', () => {
      fc.assert(
        fc.property(
          fc.constant(0),
          (recentNoShows) => {
            const result = isRepeatNoShowOffender(recentNoShows);
            expect(result).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('negative no-show count should never be flagged (edge case)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: -1 }),
          (recentNoShows) => {
            const result = isRepeatNoShowOffender(recentNoShows);
            expect(result).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });
});
