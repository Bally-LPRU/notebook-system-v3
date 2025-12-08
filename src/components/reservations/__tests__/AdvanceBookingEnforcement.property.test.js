/**
 * Property-Based Tests for Advance Booking Enforcement
 * 
 * Feature: user-status-system-improvement, Property 5: Advance Booking Enforcement
 * Validates: Requirements 2.4, 5.2
 * 
 * For any reservation with startDate, the number of days from today to startDate
 * should not exceed the user's maxAdvanceBookingDays limit.
 */

import fc from 'fast-check';

/**
 * Calculate the number of days from today to a given date
 * @param {Date} targetDate - The target date
 * @returns {number} Number of days from today (can be negative for past dates)
 */
const calculateDaysFromToday = (targetDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Validate if a reservation date is within the user's advance booking limit
 * This function mirrors the validation logic in ReservationForm.js
 * 
 * @param {Date} reservationDate - The date of the reservation
 * @param {number} maxAdvanceBookingDays - User's maximum advance booking days
 * @returns {Object} Validation result with isValid and error
 */
const validateAdvanceBooking = (reservationDate, maxAdvanceBookingDays) => {
  const daysFromToday = calculateDaysFromToday(reservationDate);
  
  // Past dates are always invalid
  if (daysFromToday < 0) {
    return {
      isValid: false,
      error: 'ไม่สามารถจองในวันที่ผ่านมาแล้ว',
      daysFromToday
    };
  }
  
  // Check if exceeds user's maxAdvanceBookingDays
  if (daysFromToday > maxAdvanceBookingDays) {
    return {
      isValid: false,
      error: `ไม่สามารถจองล่วงหน้าเกิน ${maxAdvanceBookingDays} วัน`,
      daysFromToday
    };
  }
  
  return {
    isValid: true,
    error: null,
    daysFromToday
  };
};

/**
 * Check if a date selection should be allowed in the calendar/date picker
 * This mirrors the isDateSelectable logic in ReservationCalendar.js
 * 
 * @param {Date} date - The date to check
 * @param {number} maxAdvanceBookingDays - User's maximum advance booking days
 * @returns {boolean} Whether the date is selectable
 */
const isDateSelectable = (date, maxAdvanceBookingDays) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxAdvanceBookingDays);
  maxDate.setHours(23, 59, 59, 999);
  
  return targetDate >= today && targetDate <= maxDate;
};

describe('Advance Booking Enforcement - Property-Based Tests', () => {
  /**
   * Feature: user-status-system-improvement, Property 5: Advance Booking Enforcement
   * Validates: Requirements 2.4, 5.2
   * 
   * For any reservation with startDate, the number of days from today to startDate
   * should not exceed the user's maxAdvanceBookingDays limit.
   */
  describe('Property 5: Advance Booking Enforcement', () => {
    it('should enforce that days from today to startDate does not exceed maxAdvanceBookingDays', () => {
      fc.assert(
        fc.property(
          // Generate user-type-specific maxAdvanceBookingDays (teacher: 60, staff: 45, student: 30)
          fc.constantFrom(30, 45, 60),
          // Generate days in advance for reservation
          fc.integer({ min: 0, max: 100 }),
          (maxAdvanceBookingDays, daysInAdvance) => {
            // Create reservation date
            const reservationDate = new Date();
            reservationDate.setDate(reservationDate.getDate() + daysInAdvance);
            reservationDate.setHours(0, 0, 0, 0);
            
            // Validate
            const result = validateAdvanceBooking(reservationDate, maxAdvanceBookingDays);
            
            // Property: If daysInAdvance > maxAdvanceBookingDays, validation should fail
            // If daysInAdvance <= maxAdvanceBookingDays, validation should pass
            if (daysInAdvance > maxAdvanceBookingDays) {
              return !result.isValid && result.error.includes(`${maxAdvanceBookingDays} วัน`);
            } else {
              return result.isValid;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate days from today for any reservation date', () => {
      fc.assert(
        fc.property(
          // Generate days offset from today (-30 to +100)
          fc.integer({ min: -30, max: 100 }),
          (daysOffset) => {
            // Create target date
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + daysOffset);
            targetDate.setHours(0, 0, 0, 0);
            
            // Calculate days from today
            const calculatedDays = calculateDaysFromToday(targetDate);
            
            // Property: Calculated days should equal the offset
            return calculatedDays === daysOffset;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should make date selectable only within maxAdvanceBookingDays range', () => {
      fc.assert(
        fc.property(
          // Generate user-type-specific maxAdvanceBookingDays
          fc.constantFrom(30, 45, 60),
          // Generate days offset
          fc.integer({ min: -10, max: 100 }),
          (maxAdvanceBookingDays, daysOffset) => {
            // Create target date
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + daysOffset);
            
            // Check if date is selectable
            const selectable = isDateSelectable(targetDate, maxAdvanceBookingDays);
            
            // Property: Date should be selectable only if:
            // 1. It's not in the past (daysOffset >= 0)
            // 2. It's within maxAdvanceBookingDays (daysOffset <= maxAdvanceBookingDays)
            const shouldBeSelectable = daysOffset >= 0 && daysOffset <= maxAdvanceBookingDays;
            
            return selectable === shouldBeSelectable;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce stricter limits for user types with lower maxAdvanceBookingDays', () => {
      fc.assert(
        fc.property(
          // Generate a date that's between student (30) and teacher (60) limits
          fc.integer({ min: 31, max: 59 }),
          (daysInAdvance) => {
            // Create reservation date
            const reservationDate = new Date();
            reservationDate.setDate(reservationDate.getDate() + daysInAdvance);
            
            // Student limit (30 days)
            const studentResult = validateAdvanceBooking(reservationDate, 30);
            
            // Staff limit (45 days)
            const staffResult = validateAdvanceBooking(reservationDate, 45);
            
            // Teacher limit (60 days)
            const teacherResult = validateAdvanceBooking(reservationDate, 60);
            
            // Property: Student should always be rejected for dates > 30 days
            // Staff should be rejected for dates > 45 days
            // Teacher should accept dates up to 60 days
            const studentRejected = !studentResult.isValid;
            const staffCorrect = daysInAdvance <= 45 ? staffResult.isValid : !staffResult.isValid;
            const teacherAccepted = teacherResult.isValid;
            
            return studentRejected && staffCorrect && teacherAccepted;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display correct error message when exceeding limit', () => {
      fc.assert(
        fc.property(
          // Generate maxAdvanceBookingDays
          fc.constantFrom(30, 45, 60),
          // Generate excess days (1 to 50 days over limit)
          fc.integer({ min: 1, max: 50 }),
          (maxAdvanceBookingDays, excessDays) => {
            // Create reservation date that exceeds the limit
            const reservationDate = new Date();
            reservationDate.setDate(reservationDate.getDate() + maxAdvanceBookingDays + excessDays);
            
            // Validate
            const result = validateAdvanceBooking(reservationDate, maxAdvanceBookingDays);
            
            // Property: Error message should include the specific limit
            return !result.isValid && 
                   result.error === `ไม่สามารถจองล่วงหน้าเกิน ${maxAdvanceBookingDays} วัน`;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle boundary case exactly at maxAdvanceBookingDays', () => {
      fc.assert(
        fc.property(
          // Generate maxAdvanceBookingDays
          fc.constantFrom(30, 45, 60),
          (maxAdvanceBookingDays) => {
            // Create reservation date exactly at the limit
            const reservationDateAtLimit = new Date();
            reservationDateAtLimit.setDate(reservationDateAtLimit.getDate() + maxAdvanceBookingDays);
            reservationDateAtLimit.setHours(0, 0, 0, 0);
            
            // Create reservation date one day over the limit
            const reservationDateOverLimit = new Date();
            reservationDateOverLimit.setDate(reservationDateOverLimit.getDate() + maxAdvanceBookingDays + 1);
            reservationDateOverLimit.setHours(0, 0, 0, 0);
            
            // Validate both
            const resultAtLimit = validateAdvanceBooking(reservationDateAtLimit, maxAdvanceBookingDays);
            const resultOverLimit = validateAdvanceBooking(reservationDateOverLimit, maxAdvanceBookingDays);
            
            // Property: Exactly at limit should be valid, one day over should be invalid
            return resultAtLimit.isValid && !resultOverLimit.isValid;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
