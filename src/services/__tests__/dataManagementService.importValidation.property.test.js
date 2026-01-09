/**
 * Property-Based Tests for Data Management Service - Import Validation
 * 
 * Tests universal properties for import data validation.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Property tested:
 * - Property 11: Import Validation
 * 
 * **Validates: Requirements 6.2, 6.3**
 */

import fc from 'fast-check';
import DataManagementService from '../dataManagementService';
import { DATA_TYPE } from '../../types/dataManagement';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

describe('Data Management Service - Import Validation Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 11: Import Validation
   * **Validates: Requirements 6.2, 6.3**
   * 
   * For any import data, records with validation errors SHALL NOT be imported,
   * and detailed error messages SHALL be generated for each invalid record.
   */
  describe('Property 11: Import Validation', () => {
    // ============================================
    // Arbitrary Generators
    // ============================================

    /**
     * Generate valid equipment record
     */
    const validEquipmentArb = fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      category: fc.constantFrom('Electronics', 'Tools', 'Furniture', 'Vehicles', 'Sports')
    });

    /**
     * Generate invalid equipment record (missing required fields)
     */
    const invalidEquipmentArb = fc.oneof(
      // Missing name
      fc.record({
        category: fc.string({ minLength: 1, maxLength: 50 })
      }),
      // Missing category
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 })
      }),
      // Empty name
      fc.record({
        name: fc.constant(''),
        category: fc.string({ minLength: 1, maxLength: 50 })
      }),
      // Empty category
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }),
        category: fc.constant('')
      }),
      // Both missing
      fc.record({})
    );

    /**
     * Generate valid loan record
     */
    const validLoanArb = fc.record({
      equipmentId: fc.uuid(),
      userId: fc.uuid(),
      borrowDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-06-01') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      expectedReturnDate: fc.date({ min: new Date('2026-06-02'), max: new Date('2026-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString())
    });

    /**
     * Generate invalid loan record
     */
    const invalidLoanArb = fc.oneof(
      // Missing equipmentId
      fc.record({
        userId: fc.uuid(),
        borrowDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
          .filter(d => !isNaN(d.getTime()))
          .map(d => d.toISOString()),
        expectedReturnDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
          .filter(d => !isNaN(d.getTime()))
          .map(d => d.toISOString())
      }),
      // Missing userId
      fc.record({
        equipmentId: fc.uuid(),
        borrowDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
          .filter(d => !isNaN(d.getTime()))
          .map(d => d.toISOString()),
        expectedReturnDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
          .filter(d => !isNaN(d.getTime()))
          .map(d => d.toISOString())
      }),
      // Missing borrowDate
      fc.record({
        equipmentId: fc.uuid(),
        userId: fc.uuid(),
        expectedReturnDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
          .filter(d => !isNaN(d.getTime()))
          .map(d => d.toISOString())
      }),
      // Missing expectedReturnDate
      fc.record({
        equipmentId: fc.uuid(),
        userId: fc.uuid(),
        borrowDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
          .filter(d => !isNaN(d.getTime()))
          .map(d => d.toISOString())
      }),
      // Invalid date (return before borrow)
      fc.record({
        equipmentId: fc.uuid(),
        userId: fc.uuid(),
        borrowDate: fc.constant('2026-06-15T00:00:00.000Z'),
        expectedReturnDate: fc.constant('2026-06-10T00:00:00.000Z')
      }),
      // Invalid date format
      fc.record({
        equipmentId: fc.uuid(),
        userId: fc.uuid(),
        borrowDate: fc.constant('not-a-date'),
        expectedReturnDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
          .filter(d => !isNaN(d.getTime()))
          .map(d => d.toISOString())
      })
    );

    /**
     * Generate valid reservation record
     */
    const validReservationArb = fc.record({
      equipmentId: fc.uuid(),
      userId: fc.uuid(),
      startTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-06-01') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      endTime: fc.date({ min: new Date('2026-06-02'), max: new Date('2026-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString())
    });

    /**
     * Generate invalid reservation record
     */
    const invalidReservationArb = fc.oneof(
      // Missing equipmentId
      fc.record({
        userId: fc.uuid(),
        startTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
          .filter(d => !isNaN(d.getTime()))
          .map(d => d.toISOString()),
        endTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
          .filter(d => !isNaN(d.getTime()))
          .map(d => d.toISOString())
      }),
      // Missing userId
      fc.record({
        equipmentId: fc.uuid(),
        startTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
          .filter(d => !isNaN(d.getTime()))
          .map(d => d.toISOString()),
        endTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
          .filter(d => !isNaN(d.getTime()))
          .map(d => d.toISOString())
      }),
      // Missing startTime
      fc.record({
        equipmentId: fc.uuid(),
        userId: fc.uuid(),
        endTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
          .filter(d => !isNaN(d.getTime()))
          .map(d => d.toISOString())
      }),
      // Missing endTime
      fc.record({
        equipmentId: fc.uuid(),
        userId: fc.uuid(),
        startTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
          .filter(d => !isNaN(d.getTime()))
          .map(d => d.toISOString())
      }),
      // Invalid time (end before start)
      fc.record({
        equipmentId: fc.uuid(),
        userId: fc.uuid(),
        startTime: fc.constant('2026-06-15T10:00:00.000Z'),
        endTime: fc.constant('2026-06-15T09:00:00.000Z')
      })
    );

    // ============================================
    // Core Validation Properties
    // ============================================

    describe('Invalid Records Rejection', () => {
      test('validation rejects all invalid equipment records', () => {
        fc.assert(
          fc.property(
            fc.array(invalidEquipmentArb, { minLength: 1, maxLength: 20 }),
            (invalidRecords) => {
              const result = DataManagementService.validateImportData(
                invalidRecords,
                DATA_TYPE.EQUIPMENT
              );

              // Should not be valid
              expect(result.isValid).toBe(false);

              // Should have errors for all records
              expect(result.errorCount).toBeGreaterThan(0);
              expect(result.errors.length).toBeGreaterThan(0);

              // Valid count should be less than total
              expect(result.validCount).toBeLessThan(result.totalRecords);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('validation rejects all invalid loan records', () => {
        fc.assert(
          fc.property(
            fc.array(invalidLoanArb, { minLength: 1, maxLength: 20 }),
            (invalidRecords) => {
              const result = DataManagementService.validateImportData(
                invalidRecords,
                DATA_TYPE.LOANS
              );

              // Should not be valid
              expect(result.isValid).toBe(false);

              // Should have errors
              expect(result.errorCount).toBeGreaterThan(0);
              expect(result.errors.length).toBeGreaterThan(0);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('validation rejects all invalid reservation records', () => {
        fc.assert(
          fc.property(
            fc.array(invalidReservationArb, { minLength: 1, maxLength: 20 }),
            (invalidRecords) => {
              const result = DataManagementService.validateImportData(
                invalidRecords,
                DATA_TYPE.RESERVATIONS
              );

              // Should not be valid
              expect(result.isValid).toBe(false);

              // Should have errors
              expect(result.errorCount).toBeGreaterThan(0);
              expect(result.errors.length).toBeGreaterThan(0);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    describe('Valid Records Acceptance', () => {
      test('validation accepts all valid equipment records', () => {
        fc.assert(
          fc.property(
            fc.array(validEquipmentArb, { minLength: 1, maxLength: 20 }),
            (validRecords) => {
              const result = DataManagementService.validateImportData(
                validRecords,
                DATA_TYPE.EQUIPMENT
              );

              // Should be valid
              expect(result.isValid).toBe(true);

              // Should have no errors
              expect(result.errorCount).toBe(0);
              expect(result.errors.length).toBe(0);

              // All records should be valid
              expect(result.validCount).toBe(result.totalRecords);
              expect(result.validRecords.length).toBe(validRecords.length);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('validation accepts all valid loan records', () => {
        fc.assert(
          fc.property(
            fc.array(validLoanArb, { minLength: 1, maxLength: 20 }),
            (validRecords) => {
              const result = DataManagementService.validateImportData(
                validRecords,
                DATA_TYPE.LOANS
              );

              // Should be valid
              expect(result.isValid).toBe(true);

              // Should have no errors
              expect(result.errorCount).toBe(0);
              expect(result.errors.length).toBe(0);

              // All records should be valid
              expect(result.validCount).toBe(result.totalRecords);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('validation accepts all valid reservation records', () => {
        fc.assert(
          fc.property(
            fc.array(validReservationArb, { minLength: 1, maxLength: 20 }),
            (validRecords) => {
              const result = DataManagementService.validateImportData(
                validRecords,
                DATA_TYPE.RESERVATIONS
              );

              // Should be valid
              expect(result.isValid).toBe(true);

              // Should have no errors
              expect(result.errorCount).toBe(0);
              expect(result.errors.length).toBe(0);

              // All records should be valid
              expect(result.validCount).toBe(result.totalRecords);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    describe('Mixed Valid and Invalid Records', () => {
      test('validation separates valid from invalid equipment records', () => {
        fc.assert(
          fc.property(
            fc.array(validEquipmentArb, { minLength: 1, maxLength: 10 }),
            fc.array(invalidEquipmentArb, { minLength: 1, maxLength: 10 }),
            (validRecords, invalidRecords) => {
              // Mix valid and invalid records
              const mixedRecords = [...validRecords, ...invalidRecords];

              const result = DataManagementService.validateImportData(
                mixedRecords,
                DATA_TYPE.EQUIPMENT
              );

              // Should not be fully valid (has some invalid)
              expect(result.isValid).toBe(false);

              // Should have some valid records
              expect(result.validCount).toBeGreaterThan(0);

              // Should have some errors
              expect(result.errorCount).toBeGreaterThan(0);

              // Total should match
              expect(result.totalRecords).toBe(mixedRecords.length);
              expect(result.validCount + result.errorCount).toBe(result.totalRecords);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('validation separates valid from invalid loan records', () => {
        fc.assert(
          fc.property(
            fc.array(validLoanArb, { minLength: 1, maxLength: 10 }),
            fc.array(invalidLoanArb, { minLength: 1, maxLength: 10 }),
            (validRecords, invalidRecords) => {
              const mixedRecords = [...validRecords, ...invalidRecords];

              const result = DataManagementService.validateImportData(
                mixedRecords,
                DATA_TYPE.LOANS
              );

              // Should not be fully valid
              expect(result.isValid).toBe(false);

              // Should have some valid and some invalid
              expect(result.validCount).toBeGreaterThan(0);
              expect(result.errorCount).toBeGreaterThan(0);

              // Counts should add up
              expect(result.validCount + result.errorCount).toBe(result.totalRecords);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('validation separates valid from invalid reservation records', () => {
        fc.assert(
          fc.property(
            fc.array(validReservationArb, { minLength: 1, maxLength: 10 }),
            fc.array(invalidReservationArb, { minLength: 1, maxLength: 10 }),
            (validRecords, invalidRecords) => {
              const mixedRecords = [...validRecords, ...invalidRecords];

              const result = DataManagementService.validateImportData(
                mixedRecords,
                DATA_TYPE.RESERVATIONS
              );

              // Should not be fully valid
              expect(result.isValid).toBe(false);

              // Should have some valid and some invalid
              expect(result.validCount).toBeGreaterThan(0);
              expect(result.errorCount).toBeGreaterThan(0);

              // Counts should add up
              expect(result.validCount + result.errorCount).toBe(result.totalRecords);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // Error Message Generation
    // ============================================

    describe('Detailed Error Messages', () => {
      test('validation provides error details for each invalid record', () => {
        fc.assert(
          fc.property(
            fc.array(invalidEquipmentArb, { minLength: 1, maxLength: 20 }),
            (invalidRecords) => {
              const result = DataManagementService.validateImportData(
                invalidRecords,
                DATA_TYPE.EQUIPMENT
              );

              // Each error should have required structure
              result.errors.forEach(error => {
                expect(error).toHaveProperty('index');
                expect(error).toHaveProperty('record');
                expect(error).toHaveProperty('errors');
                expect(Array.isArray(error.errors)).toBe(true);
                expect(error.errors.length).toBeGreaterThan(0);
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('error messages are descriptive strings', () => {
        fc.assert(
          fc.property(
            fc.array(invalidEquipmentArb, { minLength: 1, maxLength: 20 }),
            (invalidRecords) => {
              const result = DataManagementService.validateImportData(
                invalidRecords,
                DATA_TYPE.EQUIPMENT
              );

              // Each error message should be a non-empty string
              result.errors.forEach(error => {
                error.errors.forEach(message => {
                  expect(typeof message).toBe('string');
                  expect(message.length).toBeGreaterThan(0);
                });
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('error includes record index for tracking', () => {
        fc.assert(
          fc.property(
            fc.array(invalidEquipmentArb, { minLength: 1, maxLength: 20 }),
            (invalidRecords) => {
              const result = DataManagementService.validateImportData(
                invalidRecords,
                DATA_TYPE.EQUIPMENT
              );

              // Each error should have a valid index
              result.errors.forEach(error => {
                expect(typeof error.index).toBe('number');
                expect(error.index).toBeGreaterThanOrEqual(0);
                expect(error.index).toBeLessThan(invalidRecords.length);
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('error includes the problematic record', () => {
        fc.assert(
          fc.property(
            fc.array(invalidEquipmentArb, { minLength: 1, maxLength: 20 }),
            (invalidRecords) => {
              const result = DataManagementService.validateImportData(
                invalidRecords,
                DATA_TYPE.EQUIPMENT
              );

              // Each error should include the record
              result.errors.forEach(error => {
                expect(error.record).toBeDefined();
                expect(typeof error.record).toBe('object');
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // Validation Result Structure
    // ============================================

    describe('Validation Result Structure', () => {
      test('validation result has all required fields', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.oneof(validEquipmentArb, invalidEquipmentArb),
              { minLength: 0, maxLength: 20 }
            ),
            (records) => {
              const result = DataManagementService.validateImportData(
                records,
                DATA_TYPE.EQUIPMENT
              );

              // Check all required fields exist
              expect(result).toHaveProperty('isValid');
              expect(result).toHaveProperty('validRecords');
              expect(result).toHaveProperty('errors');
              expect(result).toHaveProperty('totalRecords');
              expect(result).toHaveProperty('validCount');
              expect(result).toHaveProperty('errorCount');
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('validation counts are consistent', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.oneof(validEquipmentArb, invalidEquipmentArb),
              { minLength: 0, maxLength: 20 }
            ),
            (records) => {
              const result = DataManagementService.validateImportData(
                records,
                DATA_TYPE.EQUIPMENT
              );

              // Counts should be consistent
              expect(result.totalRecords).toBe(records.length);
              expect(result.validCount).toBe(result.validRecords.length);
              expect(result.errorCount).toBe(result.errors.length);
              expect(result.validCount + result.errorCount).toBe(result.totalRecords);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('isValid flag is correct', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.oneof(validEquipmentArb, invalidEquipmentArb),
              { minLength: 0, maxLength: 20 }
            ),
            (records) => {
              const result = DataManagementService.validateImportData(
                records,
                DATA_TYPE.EQUIPMENT
              );

              // isValid should be true only if no errors
              if (result.errorCount === 0) {
                expect(result.isValid).toBe(true);
              } else {
                expect(result.isValid).toBe(false);
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // Edge Cases
    // ============================================

    describe('Edge Cases', () => {
      test('validation handles empty array', () => {
        const result = DataManagementService.validateImportData(
          [],
          DATA_TYPE.EQUIPMENT
        );

        expect(result.isValid).toBe(true);
        expect(result.totalRecords).toBe(0);
        expect(result.validCount).toBe(0);
        expect(result.errorCount).toBe(0);
        expect(result.validRecords).toEqual([]);
        expect(result.errors).toEqual([]);
      });

      test('validation handles non-array input', () => {
        const result = DataManagementService.validateImportData(
          'not an array',
          DATA_TYPE.EQUIPMENT
        );

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBeGreaterThan(0);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      test('validation handles null input', () => {
        const result = DataManagementService.validateImportData(
          null,
          DATA_TYPE.EQUIPMENT
        );

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBeGreaterThan(0);
      });

      test('validation handles undefined input', () => {
        const result = DataManagementService.validateImportData(
          undefined,
          DATA_TYPE.EQUIPMENT
        );

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBeGreaterThan(0);
      });
    });

    // ============================================
    // Type-Specific Validation Rules
    // ============================================

    describe('Equipment-Specific Validation', () => {
      test('equipment validation requires name field', () => {
        const recordWithoutName = { category: 'Electronics' };
        
        const result = DataManagementService.validateImportData(
          [recordWithoutName],
          DATA_TYPE.EQUIPMENT
        );

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBe(1);
        expect(result.errors[0].errors.some(e => e.includes('name'))).toBe(true);
      });

      test('equipment validation requires category field', () => {
        const recordWithoutCategory = { name: 'Test Equipment' };
        
        const result = DataManagementService.validateImportData(
          [recordWithoutCategory],
          DATA_TYPE.EQUIPMENT
        );

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBe(1);
        expect(result.errors[0].errors.some(e => e.includes('category'))).toBe(true);
      });

      test('equipment validation rejects empty name', () => {
        const recordWithEmptyName = { name: '', category: 'Electronics' };
        
        const result = DataManagementService.validateImportData(
          [recordWithEmptyName],
          DATA_TYPE.EQUIPMENT
        );

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBe(1);
      });
    });

    describe('Loan-Specific Validation', () => {
      test('loan validation requires all date fields', () => {
        const recordMissingDates = {
          equipmentId: 'eq-123',
          userId: 'user-123'
        };
        
        const result = DataManagementService.validateImportData(
          [recordMissingDates],
          DATA_TYPE.LOANS
        );

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBe(1);
      });

      test('loan validation checks date order', () => {
        const recordWithInvalidDates = {
          equipmentId: 'eq-123',
          userId: 'user-123',
          borrowDate: '2026-06-15T00:00:00.000Z',
          expectedReturnDate: '2026-06-10T00:00:00.000Z' // Before borrow date
        };
        
        const result = DataManagementService.validateImportData(
          [recordWithInvalidDates],
          DATA_TYPE.LOANS
        );

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBe(1);
        expect(result.errors[0].errors.some(e => 
          e.includes('after') || e.includes('before')
        )).toBe(true);
      });

      test('loan validation rejects invalid date formats', () => {
        const recordWithInvalidDate = {
          equipmentId: 'eq-123',
          userId: 'user-123',
          borrowDate: 'not-a-date',
          expectedReturnDate: '2026-06-15T00:00:00.000Z'
        };
        
        const result = DataManagementService.validateImportData(
          [recordWithInvalidDate],
          DATA_TYPE.LOANS
        );

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBe(1);
      });
    });

    describe('Reservation-Specific Validation', () => {
      test('reservation validation requires time fields', () => {
        const recordMissingTimes = {
          equipmentId: 'eq-123',
          userId: 'user-123'
        };
        
        const result = DataManagementService.validateImportData(
          [recordMissingTimes],
          DATA_TYPE.RESERVATIONS
        );

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBe(1);
      });

      test('reservation validation checks time order', () => {
        const recordWithInvalidTimes = {
          equipmentId: 'eq-123',
          userId: 'user-123',
          startTime: '2026-06-15T10:00:00.000Z',
          endTime: '2026-06-15T09:00:00.000Z' // Before start time
        };
        
        const result = DataManagementService.validateImportData(
          [recordWithInvalidTimes],
          DATA_TYPE.RESERVATIONS
        );

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBe(1);
        expect(result.errors[0].errors.some(e => 
          e.includes('after') || e.includes('before')
        )).toBe(true);
      });
    });

    // ============================================
    // Invariant Properties
    // ============================================

    describe('Validation Invariants', () => {
      test('valid records array never contains invalid records', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.oneof(validEquipmentArb, invalidEquipmentArb),
              { minLength: 1, maxLength: 20 }
            ),
            (records) => {
              const result = DataManagementService.validateImportData(
                records,
                DATA_TYPE.EQUIPMENT
              );

              // Re-validate each "valid" record to ensure it's actually valid
              result.validRecords.forEach(record => {
                const revalidation = DataManagementService.validateRecord(
                  record,
                  DATA_TYPE.EQUIPMENT
                );
                expect(revalidation.length).toBe(0);
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('error array never contains valid records', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.oneof(validEquipmentArb, invalidEquipmentArb),
              { minLength: 1, maxLength: 20 }
            ),
            (records) => {
              const result = DataManagementService.validateImportData(
                records,
                DATA_TYPE.EQUIPMENT
              );

              // Each error record should actually have validation errors
              result.errors.forEach(error => {
                expect(error.errors.length).toBeGreaterThan(0);
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('validation is deterministic', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.oneof(validEquipmentArb, invalidEquipmentArb),
              { minLength: 0, maxLength: 20 }
            ),
            (records) => {
              // Validate multiple times
              const result1 = DataManagementService.validateImportData(
                records,
                DATA_TYPE.EQUIPMENT
              );
              const result2 = DataManagementService.validateImportData(
                records,
                DATA_TYPE.EQUIPMENT
              );
              const result3 = DataManagementService.validateImportData(
                records,
                DATA_TYPE.EQUIPMENT
              );

              // Results should be identical
              expect(result1.isValid).toBe(result2.isValid);
              expect(result2.isValid).toBe(result3.isValid);
              expect(result1.validCount).toBe(result2.validCount);
              expect(result2.validCount).toBe(result3.validCount);
              expect(result1.errorCount).toBe(result2.errorCount);
              expect(result2.errorCount).toBe(result3.errorCount);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('validation preserves record order in valid records', () => {
        fc.assert(
          fc.property(
            fc.array(validEquipmentArb, { minLength: 2, maxLength: 20 }),
            (validRecords) => {
              const result = DataManagementService.validateImportData(
                validRecords,
                DATA_TYPE.EQUIPMENT
              );

              // Valid records should maintain order
              expect(result.validRecords.length).toBe(validRecords.length);
              
              // Check that records appear in same order
              result.validRecords.forEach((record, index) => {
                expect(record.name).toBe(validRecords[index].name);
                expect(record.category).toBe(validRecords[index].category);
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });
  });
});
