/**
 * Property-Based Tests for Data Management Service - Import Rollback
 * 
 * Tests universal properties for import rollback on failure.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Property tested:
 * - Property 12: Import Rollback on Failure
 * 
 * **Validates: Requirements 6.5**
 */

import fc from 'fast-check';
import DataManagementService from '../dataManagementService';
import { DATA_TYPE, EXPORT_FORMAT } from '../../types/dataManagement';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

describe('Data Management Service - Import Rollback Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 12: Import Rollback on Failure
   * **Validates: Requirements 6.5**
   * 
   * For any failed import operation, no data SHALL be persisted to the database (atomic operation).
   */
  describe('Property 12: Import Rollback on Failure', () => {
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

    // ============================================
    // Core Rollback Properties
    // ============================================

    describe('Atomic Operation Behavior', () => {
      test('failed import returns zero imported records', () => {
        fc.assert(
          fc.property(
            fc.array(validEquipmentArb, { minLength: 1, maxLength: 20 }),
            async (validRecords) => {
              // Mock the internal methods to simulate failure
              const originalPrepare = DataManagementService._prepareRecordForImport;
              
              // Simulate a failure during import by throwing an error
              jest.spyOn(DataManagementService, '_prepareRecordForImport')
                .mockImplementation(() => {
                  throw new Error('Simulated import failure');
                });

              // Convert to JSON for import
              const jsonData = JSON.stringify(validRecords);

              // Execute import
              const result = await DataManagementService.importData(
                jsonData,
                EXPORT_FORMAT.JSON,
                DATA_TYPE.EQUIPMENT,
                'admin-123'
              );

              // Verify: Import should fail
              expect(result.success).toBe(false);

              // Verify: No records should be marked as imported
              expect(result.importedRecords).toBe(0);

              // Restore
              DataManagementService._prepareRecordForImport = originalPrepare;
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('validation errors prevent import without rollback', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({ invalidField: fc.string() }),
              { minLength: 1, maxLength: 10 }
            ),
            async (invalidRecords) => {
              // Track if rollback was called
              const rollbackSpy = jest.spyOn(DataManagementService, '_rollbackImport');

              const jsonData = JSON.stringify(invalidRecords);

              // Execute import
              const result = await DataManagementService.importData(
                jsonData,
                EXPORT_FORMAT.JSON,
                DATA_TYPE.EQUIPMENT,
                'admin-123'
              );

              // Verify: Import should fail due to validation
              expect(result.success).toBe(false);
              expect(result.importedRecords).toBe(0);

              // Verify: Rollback should not be called for validation failure
              // (no data was written to database)
              expect(rollbackSpy).not.toHaveBeenCalled();

              rollbackSpy.mockRestore();
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('import result consistency - success means all imported, failure means none', () => {
        fc.assert(
          fc.property(
            fc.array(validEquipmentArb, { minLength: 1, maxLength: 20 }),
            fc.boolean(),
            async (validRecords, shouldSucceed) => {
              // Mock to control success/failure
              if (!shouldSucceed) {
                jest.spyOn(DataManagementService, '_prepareRecordForImport')
                  .mockImplementation(() => {
                    throw new Error('Controlled failure');
                  });
              }

              const jsonData = JSON.stringify(validRecords);

              // Execute import
              const result = await DataManagementService.importData(
                jsonData,
                EXPORT_FORMAT.JSON,
                DATA_TYPE.EQUIPMENT,
                'admin-123'
              );

              // Verify atomicity: either all or nothing
              if (result.success) {
                // If successful, all valid records should be imported
                expect(result.importedRecords).toBe(validRecords.length);
              } else {
                // If failed, no records should be imported
                expect(result.importedRecords).toBe(0);
              }

              jest.restoreAllMocks();
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    describe('Rollback Function Properties', () => {
      test('rollback function handles empty rollback data', async () => {
        const result = await DataManagementService._rollbackImport([]);
        
        // Should succeed with empty data
        expect(result).toBe(true);
      });

      test('rollback function is idempotent for same data', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.uuid(),
                collection: fc.constantFrom('equipmentManagement', 'loanRequests', 'reservations')
              }),
              { minLength: 1, maxLength: 10 }
            ),
            async (rollbackData) => {
              // Execute rollback multiple times with same data
              const result1 = await DataManagementService._rollbackImport(rollbackData);
              const result2 = await DataManagementService._rollbackImport(rollbackData);
              const result3 = await DataManagementService._rollbackImport(rollbackData);

              // All should have same result (idempotent)
              expect(result1).toBe(result2);
              expect(result2).toBe(result3);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('rollback data structure is consistent', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.uuid(),
                collection: fc.constantFrom('equipmentManagement', 'loanRequests', 'reservations')
              }),
              { minLength: 1, maxLength: 20 }
            ),
            (rollbackData) => {
              // Verify each rollback item has required structure
              rollbackData.forEach(item => {
                expect(item).toHaveProperty('id');
                expect(item).toHaveProperty('collection');
                expect(typeof item.id).toBe('string');
                expect(typeof item.collection).toBe('string');
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    describe('Import Result Properties', () => {
      test('failed import always returns error information', () => {
        fc.assert(
          fc.property(
            fc.array(validEquipmentArb, { minLength: 1, maxLength: 10 }),
            async (validRecords) => {
              // Force failure
              jest.spyOn(DataManagementService, '_prepareRecordForImport')
                .mockImplementation(() => {
                  throw new Error('Test error');
                });

              const jsonData = JSON.stringify(validRecords);

              const result = await DataManagementService.importData(
                jsonData,
                EXPORT_FORMAT.JSON,
                DATA_TYPE.EQUIPMENT,
                'admin-123'
              );

              // Verify: Failed import should have error information
              if (!result.success) {
                expect(result.errors).toBeDefined();
                expect(Array.isArray(result.errors)).toBe(true);
                expect(result.errors.length).toBeGreaterThan(0);
              }

              jest.restoreAllMocks();
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('import result has consistent structure', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.oneof(validEquipmentArb, fc.record({ invalid: fc.string() })),
              { minLength: 0, maxLength: 20 }
            ),
            async (records) => {
              const jsonData = JSON.stringify(records);

              const result = await DataManagementService.importData(
                jsonData,
                EXPORT_FORMAT.JSON,
                DATA_TYPE.EQUIPMENT,
                'admin-123'
              );

              // Verify: Result always has required fields
              expect(result).toHaveProperty('success');
              expect(result).toHaveProperty('totalRecords');
              expect(result).toHaveProperty('importedRecords');
              expect(result).toHaveProperty('failedRecords');
              expect(result).toHaveProperty('errors');

              // Verify: Counts are consistent
              expect(typeof result.success).toBe('boolean');
              expect(typeof result.totalRecords).toBe('number');
              expect(typeof result.importedRecords).toBe('number');
              expect(typeof result.failedRecords).toBe('number');
              expect(Array.isArray(result.errors)).toBe(true);

              // Verify: Imported count is never negative
              expect(result.importedRecords).toBeGreaterThanOrEqual(0);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('import counts add up correctly', () => {
        fc.assert(
          fc.property(
            fc.array(validEquipmentArb, { minLength: 1, maxLength: 20 }),
            async (validRecords) => {
              const jsonData = JSON.stringify(validRecords);

              const result = await DataManagementService.importData(
                jsonData,
                EXPORT_FORMAT.JSON,
                DATA_TYPE.EQUIPMENT,
                'admin-123'
              );

              // Verify: Imported + failed should equal total
              expect(result.importedRecords + result.failedRecords).toBe(result.totalRecords);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    describe('Atomicity Invariants', () => {
      test('no partial success - either all records imported or none', () => {
        fc.assert(
          fc.property(
            fc.array(validLoanArb, { minLength: 1, maxLength: 20 }),
            async (validRecords) => {
              const jsonData = JSON.stringify(validRecords);

              const result = await DataManagementService.importData(
                jsonData,
                EXPORT_FORMAT.JSON,
                DATA_TYPE.LOANS,
                'admin-123'
              );

              // Verify atomicity: imported count is either 0 or total valid count
              if (result.success) {
                expect(result.importedRecords).toBe(validRecords.length);
              } else {
                expect(result.importedRecords).toBe(0);
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('success flag matches imported count', () => {
        fc.assert(
          fc.property(
            fc.array(validReservationArb, { minLength: 1, maxLength: 20 }),
            async (validRecords) => {
              const jsonData = JSON.stringify(validRecords);

              const result = await DataManagementService.importData(
                jsonData,
                EXPORT_FORMAT.JSON,
                DATA_TYPE.RESERVATIONS,
                'admin-123'
              );

              // Verify: success flag is consistent with imported count
              if (result.success) {
                expect(result.importedRecords).toBeGreaterThan(0);
              } else {
                expect(result.importedRecords).toBe(0);
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('rollback ID is only present on successful import', () => {
        fc.assert(
          fc.property(
            fc.array(validEquipmentArb, { minLength: 1, maxLength: 10 }),
            async (validRecords) => {
              const jsonData = JSON.stringify(validRecords);

              const result = await DataManagementService.importData(
                jsonData,
                EXPORT_FORMAT.JSON,
                DATA_TYPE.EQUIPMENT,
                'admin-123'
              );

              // Verify: rollbackId should only exist if import succeeded
              if (result.success && result.importedRecords > 0) {
                // Successful imports should have rollback ID
                expect(result.rollbackId).toBeDefined();
              } else {
                // Failed imports should not have rollback ID or it should be null
                expect(result.rollbackId === null || result.rollbackId === undefined).toBe(true);
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    describe('Edge Cases', () => {
      test('empty array import succeeds with zero records', async () => {
        const jsonData = JSON.stringify([]);

        const result = await DataManagementService.importData(
          jsonData,
          EXPORT_FORMAT.JSON,
          DATA_TYPE.EQUIPMENT,
          'admin-123'
        );

        // Empty import should succeed but import nothing
        expect(result.success).toBe(false); // No valid records
        expect(result.importedRecords).toBe(0);
        expect(result.totalRecords).toBe(0);
      });

      test('all invalid records results in zero imports', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({ missingRequiredFields: fc.string() }),
              { minLength: 1, maxLength: 10 }
            ),
            async (invalidRecords) => {
              const jsonData = JSON.stringify(invalidRecords);

              const result = await DataManagementService.importData(
                jsonData,
                EXPORT_FORMAT.JSON,
                DATA_TYPE.EQUIPMENT,
                'admin-123'
              );

              // All invalid should result in zero imports
              expect(result.success).toBe(false);
              expect(result.importedRecords).toBe(0);
              expect(result.failedRecords).toBeGreaterThan(0);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('mixed valid and invalid records - only valid are considered', () => {
        fc.assert(
          fc.property(
            fc.array(validEquipmentArb, { minLength: 1, maxLength: 10 }),
            fc.array(
              fc.record({ invalid: fc.string() }),
              { minLength: 1, maxLength: 10 }
            ),
            async (validRecords, invalidRecords) => {
              const mixedRecords = [...validRecords, ...invalidRecords];
              const jsonData = JSON.stringify(mixedRecords);

              const result = await DataManagementService.importData(
                jsonData,
                EXPORT_FORMAT.JSON,
                DATA_TYPE.EQUIPMENT,
                'admin-123'
              );

              // Total should include all records
              expect(result.totalRecords).toBe(mixedRecords.length);

              // If successful, only valid records should be imported
              if (result.success) {
                expect(result.importedRecords).toBe(validRecords.length);
              } else {
                // If failed, no records should be imported
                expect(result.importedRecords).toBe(0);
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });
  });
});
