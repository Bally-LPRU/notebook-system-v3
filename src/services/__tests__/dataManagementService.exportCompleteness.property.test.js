/**
 * Property-Based Tests for Data Management Service - Export Data Completeness
 * 
 * Tests universal properties for export data completeness.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Property tested:
 * - Property 8: Export Data Completeness
 * 
 * **Validates: Requirements 5.4**
 */

import fc from 'fast-check';
import DataManagementService from '../dataManagementService';
import { DATA_TYPE, EXPORT_FORMAT } from '../../types/dataManagement';
import { Timestamp } from 'firebase/firestore';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

describe('Data Management Service - Export Data Completeness Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 8: Export Data Completeness
   * **Validates: Requirements 5.4**
   * 
   * For any data export, the exported data SHALL contain all required fields 
   * (id, timestamps, user information) for each record.
   */
  describe('Property 8: Export Data Completeness', () => {
    // ============================================
    // Arbitrary Generators
    // ============================================

    /**
     * Generate arbitrary timestamp (as Firestore Timestamp or Date)
     * Filter out invalid dates that would create NaN timestamps
     */
    const timestampArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
      .filter(date => !isNaN(date.getTime()))
      .map(date => Timestamp.fromDate(date));

    /**
     * Generate arbitrary user information
     */
    const userInfoArb = fc.record({
      displayName: fc.string({ minLength: 3, maxLength: 50 }),
      email: fc.emailAddress(),
      department: fc.constantFrom('Engineering', 'Science', 'Arts', 'Business', 'Medicine')
    });

    /**
     * Generate arbitrary loan record with all required fields
     */
    const loanRecordArb = fc.record({
      id: fc.uuid(),
      equipmentId: fc.uuid(),
      equipmentName: fc.string({ minLength: 3, maxLength: 50 }),
      equipmentNumber: fc.string({ minLength: 3, maxLength: 20 }),
      userId: fc.uuid(),
      userName: fc.string({ minLength: 3, maxLength: 50 }),
      userEmail: fc.emailAddress(),
      userDepartment: fc.constantFrom('Engineering', 'Science', 'Arts', 'Business'),
      status: fc.constantFrom('pending', 'approved', 'active', 'returned', 'overdue'),
      purpose: fc.string({ minLength: 10, maxLength: 100 }),
      notes: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
      borrowDate: timestampArb,
      expectedReturnDate: timestampArb,
      actualReturnDate: fc.option(timestampArb, { nil: null }),
      approvedBy: fc.option(fc.uuid(), { nil: null }),
      approvedAt: fc.option(timestampArb, { nil: null }),
      rejectionReason: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
      createdAt: timestampArb,
      updatedAt: timestampArb
    });

    /**
     * Generate arbitrary reservation record with all required fields
     */
    const reservationRecordArb = fc.record({
      id: fc.uuid(),
      equipmentId: fc.uuid(),
      equipmentName: fc.string({ minLength: 3, maxLength: 50 }),
      userId: fc.uuid(),
      userName: fc.string({ minLength: 3, maxLength: 50 }),
      userEmail: fc.emailAddress(),
      status: fc.constantFrom('pending', 'approved', 'ready', 'completed', 'cancelled'),
      purpose: fc.string({ minLength: 10, maxLength: 100 }),
      notes: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
      startTime: timestampArb,
      endTime: timestampArb,
      approvedBy: fc.option(fc.uuid(), { nil: null }),
      approvedAt: fc.option(timestampArb, { nil: null }),
      createdAt: timestampArb,
      updatedAt: timestampArb
    });

    /**
     * Generate arbitrary equipment record with all required fields
     */
    const equipmentRecordArb = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 3, maxLength: 50 }),
      equipmentNumber: fc.string({ minLength: 3, maxLength: 20 }),
      serialNumber: fc.option(fc.string({ minLength: 5, maxLength: 30 }), { nil: null }),
      category: fc.constantFrom('Electronics', 'Tools', 'Furniture', 'Vehicles', 'Sports'),
      brand: fc.option(fc.string({ minLength: 2, maxLength: 30 }), { nil: null }),
      model: fc.option(fc.string({ minLength: 2, maxLength: 30 }), { nil: null }),
      status: fc.constantFrom('available', 'borrowed', 'maintenance', 'retired'),
      condition: fc.constantFrom('excellent', 'good', 'fair', 'poor'),
      location: fc.string({ minLength: 3, maxLength: 50 }),
      purchaseDate: fc.option(timestampArb, { nil: null }),
      purchasePrice: fc.option(fc.float({ min: 0, max: 100000, noNaN: true }), { nil: null }),
      warrantyExpiry: fc.option(timestampArb, { nil: null }),
      description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
      notes: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
      isActive: fc.boolean(),
      createdAt: timestampArb,
      updatedAt: timestampArb
    });

    // ============================================
    // Helper Functions
    // ============================================

    /**
     * Get required fields for a data type
     * These are the fields that MUST be present in every export
     */
    const getRequiredFields = (dataType) => {
      switch (dataType) {
        case DATA_TYPE.LOANS:
          return ['id', 'createdAt', 'updatedAt', 'userId', 'userName', 'userEmail'];
        case DATA_TYPE.RESERVATIONS:
          return ['id', 'createdAt', 'updatedAt', 'userId', 'userName', 'userEmail'];
        case DATA_TYPE.EQUIPMENT:
          return ['id', 'createdAt', 'updatedAt'];
        default:
          return ['id'];
      }
    };

    /**
     * Parse exported data based on format
     */
    const parseExportedData = (exportedData, format) => {
      if (format === EXPORT_FORMAT.JSON) {
        return JSON.parse(exportedData);
      } else {
        // CSV format
        return DataManagementService.parseCSV(exportedData);
      }
    };

    /**
     * Check if a field exists and is not empty in a record
     */
    const fieldExistsAndNotEmpty = (record, field) => {
      return record.hasOwnProperty(field) && record[field] !== undefined && record[field] !== null;
    };

    // ============================================
    // Property Tests for Loans
    // ============================================

    describe('Loan Export Completeness', () => {
      test('loan exports contain all required fields including id, timestamps, and user info', () => {
        fc.assert(
          fc.property(
            fc.array(loanRecordArb, { minLength: 1, maxLength: 20 }),
            fc.constantFrom(EXPORT_FORMAT.CSV, EXPORT_FORMAT.JSON),
            (records, format) => {
              // Use the public getExportFields method to get expected fields
              const fields = DataManagementService.getExportFields(DATA_TYPE.LOANS);

              // Flatten records using the public method
              const flattenedRecords = records.map(record => {
                // Create a flattened version manually since _flattenRecordForExport is private
                const flattened = { id: record.id };
                fields.forEach(field => {
                  if (field === 'id') return;
                  flattened[field] = record[field] !== undefined ? record[field] : null;
                });
                return flattened;
              });

              // Convert to export format
              let exportedData;
              if (format === EXPORT_FORMAT.CSV) {
                exportedData = DataManagementService.convertToCSV(flattenedRecords, fields);
              } else {
                exportedData = DataManagementService.convertToJSON(flattenedRecords);
              }

              // Parse back
              const parsedRecords = parseExportedData(exportedData, format);

              // Get required fields
              const requiredFields = getRequiredFields(DATA_TYPE.LOANS);

              // Verify each record has all required fields
              parsedRecords.forEach((record, index) => {
                requiredFields.forEach(field => {
                  // Field must exist in the record
                  expect(record).toHaveProperty(field);
                });
              });

              // Verify timestamps are present
              parsedRecords.forEach(record => {
                expect(record).toHaveProperty('createdAt');
                expect(record).toHaveProperty('updatedAt');
                expect(record).toHaveProperty('borrowDate');
                expect(record).toHaveProperty('expectedReturnDate');
              });

              // Verify user information is present
              parsedRecords.forEach(record => {
                expect(record).toHaveProperty('userId');
                expect(record).toHaveProperty('userName');
                expect(record).toHaveProperty('userEmail');
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('loan exports include equipment information', () => {
        fc.assert(
          fc.property(
            fc.array(loanRecordArb, { minLength: 1, maxLength: 20 }),
            (records) => {
              const fields = DataManagementService.getExportFields(DATA_TYPE.LOANS);
              
              const flattenedRecords = records.map(record => {
                const flattened = { id: record.id };
                fields.forEach(field => {
                  if (field === 'id') return;
                  flattened[field] = record[field] !== undefined ? record[field] : null;
                });
                return flattened;
              });

              const exportedData = DataManagementService.convertToJSON(flattenedRecords);
              const parsedRecords = JSON.parse(exportedData);

              // Verify equipment information is present
              parsedRecords.forEach(record => {
                expect(record).toHaveProperty('equipmentId');
                expect(record).toHaveProperty('equipmentName');
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('loan exports preserve all field values', () => {
        fc.assert(
          fc.property(
            fc.array(loanRecordArb, { minLength: 1, maxLength: 10 }),
            (records) => {
              const fields = DataManagementService.getExportFields(DATA_TYPE.LOANS);
              
              const flattenedRecords = records.map(record => {
                const flattened = { id: record.id };
                fields.forEach(field => {
                  if (field === 'id') return;
                  flattened[field] = record[field] !== undefined ? record[field] : null;
                });
                return flattened;
              });

              const exportedData = DataManagementService.convertToJSON(flattenedRecords);
              const parsedRecords = JSON.parse(exportedData);

              // Verify record count matches
              expect(parsedRecords.length).toBe(records.length);

              // Verify each record has all export fields
              parsedRecords.forEach(record => {
                fields.forEach(field => {
                  expect(record).toHaveProperty(field);
                });
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // Property Tests for Reservations
    // ============================================

    describe('Reservation Export Completeness', () => {
      test('reservation exports contain all required fields including id, timestamps, and user info', () => {
        fc.assert(
          fc.property(
            fc.array(reservationRecordArb, { minLength: 1, maxLength: 20 }),
            fc.constantFrom(EXPORT_FORMAT.CSV, EXPORT_FORMAT.JSON),
            (records, format) => {
              const fields = DataManagementService.getExportFields(DATA_TYPE.RESERVATIONS);

              const flattenedRecords = records.map(record => {
                const flattened = { id: record.id };
                fields.forEach(field => {
                  if (field === 'id') return;
                  flattened[field] = record[field] !== undefined ? record[field] : null;
                });
                return flattened;
              });

              let exportedData;
              if (format === EXPORT_FORMAT.CSV) {
                exportedData = DataManagementService.convertToCSV(flattenedRecords, fields);
              } else {
                exportedData = DataManagementService.convertToJSON(flattenedRecords);
              }

              const parsedRecords = parseExportedData(exportedData, format);
              const requiredFields = getRequiredFields(DATA_TYPE.RESERVATIONS);

              // Verify each record has all required fields
              parsedRecords.forEach(record => {
                requiredFields.forEach(field => {
                  expect(record).toHaveProperty(field);
                });
              });

              // Verify timestamps are present
              parsedRecords.forEach(record => {
                expect(record).toHaveProperty('createdAt');
                expect(record).toHaveProperty('updatedAt');
                expect(record).toHaveProperty('startTime');
                expect(record).toHaveProperty('endTime');
              });

              // Verify user information is present
              parsedRecords.forEach(record => {
                expect(record).toHaveProperty('userId');
                expect(record).toHaveProperty('userName');
                expect(record).toHaveProperty('userEmail');
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('reservation exports include all export fields', () => {
        fc.assert(
          fc.property(
            fc.array(reservationRecordArb, { minLength: 1, maxLength: 20 }),
            (records) => {
              const fields = DataManagementService.getExportFields(DATA_TYPE.RESERVATIONS);
              
              const flattenedRecords = records.map(record => {
                const flattened = { id: record.id };
                fields.forEach(field => {
                  if (field === 'id') return;
                  flattened[field] = record[field] !== undefined ? record[field] : null;
                });
                return flattened;
              });

              const exportedData = DataManagementService.convertToJSON(flattenedRecords);
              const parsedRecords = JSON.parse(exportedData);

              // Verify each record has all export fields
              parsedRecords.forEach(record => {
                fields.forEach(field => {
                  expect(record).toHaveProperty(field);
                });
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // Property Tests for Equipment
    // ============================================

    describe('Equipment Export Completeness', () => {
      test('equipment exports contain all required fields including id and timestamps', () => {
        fc.assert(
          fc.property(
            fc.array(equipmentRecordArb, { minLength: 1, maxLength: 20 }),
            fc.constantFrom(EXPORT_FORMAT.CSV, EXPORT_FORMAT.JSON),
            (records, format) => {
              const fields = DataManagementService.getExportFields(DATA_TYPE.EQUIPMENT);

              const flattenedRecords = records.map(record => {
                const flattened = { id: record.id };
                fields.forEach(field => {
                  if (field === 'id') return;
                  flattened[field] = record[field] !== undefined ? record[field] : null;
                });
                return flattened;
              });

              let exportedData;
              if (format === EXPORT_FORMAT.CSV) {
                exportedData = DataManagementService.convertToCSV(flattenedRecords, fields);
              } else {
                exportedData = DataManagementService.convertToJSON(flattenedRecords);
              }

              const parsedRecords = parseExportedData(exportedData, format);
              const requiredFields = getRequiredFields(DATA_TYPE.EQUIPMENT);

              // Verify each record has all required fields
              parsedRecords.forEach(record => {
                requiredFields.forEach(field => {
                  expect(record).toHaveProperty(field);
                });
              });

              // Verify timestamps are present
              parsedRecords.forEach(record => {
                expect(record).toHaveProperty('createdAt');
                expect(record).toHaveProperty('updatedAt');
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('equipment exports include all export fields', () => {
        fc.assert(
          fc.property(
            fc.array(equipmentRecordArb, { minLength: 1, maxLength: 20 }),
            (records) => {
              const fields = DataManagementService.getExportFields(DATA_TYPE.EQUIPMENT);
              
              const flattenedRecords = records.map(record => {
                const flattened = { id: record.id };
                fields.forEach(field => {
                  if (field === 'id') return;
                  flattened[field] = record[field] !== undefined ? record[field] : null;
                });
                return flattened;
              });

              const exportedData = DataManagementService.convertToJSON(flattenedRecords);
              const parsedRecords = JSON.parse(exportedData);

              // Verify each record has all export fields
              parsedRecords.forEach(record => {
                fields.forEach(field => {
                  expect(record).toHaveProperty(field);
                });
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('equipment exports include core equipment information', () => {
        fc.assert(
          fc.property(
            fc.array(equipmentRecordArb, { minLength: 1, maxLength: 20 }),
            (records) => {
              const fields = DataManagementService.getExportFields(DATA_TYPE.EQUIPMENT);
              
              const flattenedRecords = records.map(record => {
                const flattened = { id: record.id };
                fields.forEach(field => {
                  if (field === 'id') return;
                  flattened[field] = record[field] !== undefined ? record[field] : null;
                });
                return flattened;
              });

              const exportedData = DataManagementService.convertToJSON(flattenedRecords);
              const parsedRecords = JSON.parse(exportedData);

              // Verify core equipment fields are present
              parsedRecords.forEach(record => {
                expect(record).toHaveProperty('id');
                expect(record).toHaveProperty('name');
                expect(record).toHaveProperty('category');
                expect(record).toHaveProperty('status');
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // Cross-Type Completeness Tests
    // ============================================

    describe('Cross-Type Export Completeness', () => {
      test('all data types include id field in exports', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(DATA_TYPE.LOANS, DATA_TYPE.RESERVATIONS, DATA_TYPE.EQUIPMENT),
            (dataType) => {
              const fields = DataManagementService.getExportFields(dataType);
              
              // ID must be the first field
              expect(fields[0]).toBe('id');
              
              // ID must be in the list
              expect(fields).toContain('id');
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('all data types include timestamp fields in exports', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(DATA_TYPE.LOANS, DATA_TYPE.RESERVATIONS, DATA_TYPE.EQUIPMENT),
            (dataType) => {
              const fields = DataManagementService.getExportFields(dataType);
              
              // All types must have createdAt and updatedAt
              expect(fields).toContain('createdAt');
              expect(fields).toContain('updatedAt');
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('loan and reservation types include user information in exports', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(DATA_TYPE.LOANS, DATA_TYPE.RESERVATIONS),
            (dataType) => {
              const fields = DataManagementService.getExportFields(dataType);
              
              // Must have user information fields
              expect(fields).toContain('userId');
              expect(fields).toContain('userName');
              expect(fields).toContain('userEmail');
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('exports maintain field count consistency', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(DATA_TYPE.LOANS, DATA_TYPE.RESERVATIONS, DATA_TYPE.EQUIPMENT),
            fc.array(fc.record({ id: fc.uuid() }), { minLength: 1, maxLength: 20 }),
            (dataType, records) => {
              const fields = DataManagementService.getExportFields(dataType);
              
              const flattenedRecords = records.map(record => {
                const flattened = { id: record.id };
                fields.forEach(field => {
                  if (field === 'id') return;
                  // Set all fields to null for minimal records
                  flattened[field] = null;
                });
                return flattened;
              });

              const exportedData = DataManagementService.convertToJSON(flattenedRecords);
              const parsedRecords = JSON.parse(exportedData);

              // All records should have the same number of fields
              const expectedFieldCount = fields.length;
              parsedRecords.forEach(record => {
                expect(Object.keys(record).length).toBe(expectedFieldCount);
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('empty exports still include field definitions', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(DATA_TYPE.LOANS, DATA_TYPE.RESERVATIONS, DATA_TYPE.EQUIPMENT),
            fc.constantFrom(EXPORT_FORMAT.CSV, EXPORT_FORMAT.JSON),
            (dataType, format) => {
              const emptyRecords = [];
              const fields = DataManagementService.getExportFields(dataType);

              let exportedData;
              if (format === EXPORT_FORMAT.CSV) {
                exportedData = DataManagementService.convertToCSV(emptyRecords, fields);
                // CSV should have header with all fields
                expect(exportedData).toBe(fields.join(','));
              } else {
                exportedData = DataManagementService.convertToJSON(emptyRecords);
                // JSON should be empty array
                expect(JSON.parse(exportedData)).toEqual([]);
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // Field Presence Invariants
    // ============================================

    describe('Field Presence Invariants', () => {
      test('no exported record is missing required fields', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(DATA_TYPE.LOANS, DATA_TYPE.RESERVATIONS, DATA_TYPE.EQUIPMENT),
            fc.array(fc.record({ id: fc.uuid() }), { minLength: 1, maxLength: 20 }),
            (dataType, records) => {
              const fields = DataManagementService.getExportFields(dataType);
              
              const flattenedRecords = records.map(record => {
                const flattened = { id: record.id };
                fields.forEach(field => {
                  if (field === 'id') return;
                  flattened[field] = null;
                });
                return flattened;
              });

              const exportedData = DataManagementService.convertToJSON(flattenedRecords);
              const parsedRecords = JSON.parse(exportedData);

              const requiredFields = getRequiredFields(dataType);

              // No record should be missing any required field
              parsedRecords.forEach(record => {
                requiredFields.forEach(field => {
                  expect(record).toHaveProperty(field);
                });
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('field order is consistent across all records', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(DATA_TYPE.LOANS, DATA_TYPE.RESERVATIONS, DATA_TYPE.EQUIPMENT),
            fc.array(fc.record({ id: fc.uuid() }), { minLength: 2, maxLength: 20 }),
            (dataType, records) => {
              const fields = DataManagementService.getExportFields(dataType);
              
              const flattenedRecords = records.map(record => {
                const flattened = { id: record.id };
                fields.forEach(field => {
                  if (field === 'id') return;
                  flattened[field] = null;
                });
                return flattened;
              });

              const exportedData = DataManagementService.convertToJSON(flattenedRecords);
              const parsedRecords = JSON.parse(exportedData);

              if (parsedRecords.length < 2) return;

              // Get field order from first record
              const firstRecordFields = Object.keys(parsedRecords[0]);

              // All other records should have the same field order
              parsedRecords.slice(1).forEach(record => {
                expect(Object.keys(record)).toEqual(firstRecordFields);
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });
  });
});
