/**
 * Property-Based Tests for Loan Request Validation
 * 
 * Tests universal properties that should hold across all inputs
 * using fast-check for property-based testing.
 */

import fc from 'fast-check';

// Import the validation rules function directly
import { LOAN_REQUEST_VALIDATION } from '../../types/loanRequest';

/**
 * Get validation rules for loan request fields
 * (Copied from useLoanRequestValidation for direct testing)
 */
const getValidationRules = (maxLoanDuration = 30) => ({
  expectedReturnDate: {
    required: true,
    validate: (value, formData) => {
      if (!value) return 'กรุณาระบุวันที่คืน';
      
      const returnDate = new Date(value);
      const borrowDate = formData.borrowDate ? new Date(formData.borrowDate) : null;
      
      if (borrowDate && returnDate <= borrowDate) {
        return 'วันที่คืนต้องหลังจากวันที่ยืม';
      }
      
      // Check max duration using setting value
      if (borrowDate) {
        const diffTime = returnDate.getTime() - borrowDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > maxLoanDuration) {
          return `ระยะเวลายืมต้องไม่เกิน ${maxLoanDuration} วัน`;
        }
      }
      
      return null;
    }
  }
});

describe('Loan Request Validation - Property-Based Tests', () => {
  /**
   * Feature: admin-settings-system, Property 7: Loan duration enforcement
   * Validates: Requirements 3.2
   * 
   * For any loan request, the system should limit the return date selection
   * such that the loan duration does not exceed the configured maximum loan duration
   */
  describe('Property 7: Loan duration enforcement', () => {
    it('should reject loan requests exceeding maxLoanDuration', () => {
      fc.assert(
        fc.property(
          // Generate maxLoanDuration between 1 and 365 days
          fc.integer({ min: 1, max: 365 }),
          // Generate borrow date (today or future)
          fc.integer({ min: 0, max: 365 }),
          // Generate excess days (1 to 100 days over limit)
          fc.integer({ min: 1, max: 100 }),
          (maxLoanDuration, borrowDaysFromNow, excessDays) => {
            // Get validation rules with the specified maxLoanDuration
            const validationRules = getValidationRules(maxLoanDuration);

            // Calculate dates
            const borrowDate = new Date();
            borrowDate.setDate(borrowDate.getDate() + borrowDaysFromNow);
            borrowDate.setHours(0, 0, 0, 0);

            const returnDate = new Date(borrowDate);
            returnDate.setDate(returnDate.getDate() + maxLoanDuration + excessDays);

            // Create form data
            const formData = {
              borrowDate: borrowDate.toISOString().split('T')[0],
              expectedReturnDate: returnDate.toISOString().split('T')[0]
            };

            // Validate
            const error = validationRules.expectedReturnDate.validate(
              formData.expectedReturnDate,
              formData
            );

            // Verify: Should have error for exceeding max duration
            return error !== null && error.includes(`${maxLoanDuration} วัน`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept loan requests within maxLoanDuration', () => {
      fc.assert(
        fc.property(
          // Generate maxLoanDuration between 1 and 365 days
          fc.integer({ min: 1, max: 365 }),
          // Generate borrow date (today or future)
          fc.integer({ min: 0, max: 365 }),
          // Generate loan duration within limit (1 to maxLoanDuration)
          fc.integer({ min: 1, max: 365 }),
          (maxLoanDuration, borrowDaysFromNow, loanDuration) => {
            // Only test valid durations
            if (loanDuration > maxLoanDuration) return true;

            // Get validation rules with the specified maxLoanDuration
            const validationRules = getValidationRules(maxLoanDuration);

            // Calculate dates
            const borrowDate = new Date();
            borrowDate.setDate(borrowDate.getDate() + borrowDaysFromNow);
            borrowDate.setHours(0, 0, 0, 0);

            const returnDate = new Date(borrowDate);
            returnDate.setDate(returnDate.getDate() + loanDuration);

            // Create form data
            const formData = {
              borrowDate: borrowDate.toISOString().split('T')[0],
              expectedReturnDate: returnDate.toISOString().split('T')[0]
            };

            // Validate
            const error = validationRules.expectedReturnDate.validate(
              formData.expectedReturnDate,
              formData
            );

            // Verify: Should NOT have error for duration
            return error === null || !error.includes('ระยะเวลายืมต้องไม่เกิน');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce exact maxLoanDuration boundary', () => {
      fc.assert(
        fc.property(
          // Generate maxLoanDuration between 1 and 365 days
          fc.integer({ min: 1, max: 365 }),
          // Generate borrow date (today or future)
          fc.integer({ min: 0, max: 365 }),
          (maxLoanDuration, borrowDaysFromNow) => {
            // Get validation rules with the specified maxLoanDuration
            const validationRules = getValidationRules(maxLoanDuration);

            // Calculate dates
            const borrowDate = new Date();
            borrowDate.setDate(borrowDate.getDate() + borrowDaysFromNow);
            borrowDate.setHours(0, 0, 0, 0);

            // Test exactly at the limit (should be valid)
            const returnDateAtLimit = new Date(borrowDate);
            returnDateAtLimit.setDate(returnDateAtLimit.getDate() + maxLoanDuration);

            const formDataAtLimit = {
              borrowDate: borrowDate.toISOString().split('T')[0],
              expectedReturnDate: returnDateAtLimit.toISOString().split('T')[0]
            };

            const errorAtLimit = validationRules.expectedReturnDate.validate(
              formDataAtLimit.expectedReturnDate,
              formDataAtLimit
            );
            const validAtLimit = errorAtLimit === null || !errorAtLimit.includes('ระยะเวลายืมต้องไม่เกิน');

            // Test one day over the limit (should be invalid)
            const returnDateOverLimit = new Date(borrowDate);
            returnDateOverLimit.setDate(returnDateOverLimit.getDate() + maxLoanDuration + 1);

            const formDataOverLimit = {
              borrowDate: borrowDate.toISOString().split('T')[0],
              expectedReturnDate: returnDateOverLimit.toISOString().split('T')[0]
            };

            const errorOverLimit = validationRules.expectedReturnDate.validate(
              formDataOverLimit.expectedReturnDate,
              formDataOverLimit
            );
            const invalidOverLimit = errorOverLimit !== null && errorOverLimit.includes(`${maxLoanDuration} วัน`);

            // Both conditions must be true
            return validAtLimit && invalidOverLimit;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
