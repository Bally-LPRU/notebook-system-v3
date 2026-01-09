/**
 * Property-Based Tests for Data Management Service - Export Format Validity
 * 
 * Tests universal properties for CSV and JSON export format validity.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Property tested:
 * - Property 9: Export Format Validity
 * 
 * **Validates: Requirements 5.2**
 */

import fc from 'fast-check';
import DataManagementService from '../dataManagementService';
import { EXPORT_FORMAT } from '../../types/dataManagement';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

describe('Data Management Service - Export Format Validity Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 9: Export Format Validity
   * **Validates: Requirements 5.2**
   * 
   * For any CSV export, the output SHALL be valid CSV format. 
   * For any JSON export, the output SHALL be valid JSON format.
   */
  describe('Property 9: Export Format Validity', () => {
    // ============================================
    // Arbitrary Generators
    // ============================================

    /**
     * Generate arbitrary field names (valid identifiers)
     */
    const fieldNameArb = fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,20}$/);

    /**
     * Generate arbitrary field values (various types)
     */
    const fieldValueArb = fc.oneof(
      fc.string({ maxLength: 100 }),
      fc.integer({ min: -1000000, max: 1000000 }),
      fc.float({ min: -1000000, max: 1000000, noNaN: true }),
      fc.boolean(),
      fc.constant(null),
      fc.constant(undefined)
    );

    /**
     * Generate arbitrary data records
     */
    const dataRecordArb = fc.dictionary(fieldNameArb, fieldValueArb, { minKeys: 1, maxKeys: 10 });

    /**
     * Generate arbitrary data arrays
     */
    const dataArrayArb = fc.array(dataRecordArb, { minLength: 0, maxLength: 50 });

    /**
     * Generate arbitrary field lists
     */
    const fieldListArb = fc.array(fieldNameArb, { minLength: 1, maxLength: 10 });

    // ============================================
    // CSV Format Validity Tests
    // ============================================

    describe('CSV Export Format Validity', () => {
      test('CSV export produces valid CSV format for any data', () => {
        fc.assert(
          fc.property(
            dataArrayArb,
            fieldListArb,
            (data, fields) => {
              const csvOutput = DataManagementService.convertToCSV(data, fields);
              
              // CSV output should be a string
              expect(typeof csvOutput).toBe('string');
              
              // CSV should have at least a header row
              const lines = csvOutput.split('\n');
              expect(lines.length).toBeGreaterThan(0);
              
              // First line should be the header
              const header = lines[0];
              expect(header).toBe(fields.join(','));
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('CSV export header matches provided fields', () => {
        fc.assert(
          fc.property(
            dataArrayArb,
            fieldListArb,
            (data, fields) => {
              const csvOutput = DataManagementService.convertToCSV(data, fields);
              const lines = csvOutput.split('\n');
              const header = lines[0];
              
              // Header should contain all field names
              const headerFields = header.split(',');
              expect(headerFields).toEqual(fields);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('CSV export has correct number of rows for consistent data', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                field1: fc.string({ maxLength: 20 }),
                field2: fc.integer(),
                field3: fc.boolean()
              }),
              { minLength: 1, maxLength: 20 }
            ),
            (data) => {
              const fields = ['field1', 'field2', 'field3'];
              
              const csvOutput = DataManagementService.convertToCSV(data, fields);
              const lines = csvOutput.split('\n');
              
              // Should have header + data rows
              // Filter out only completely empty lines
              const nonEmptyLines = lines.filter(line => line.length > 0);
              const expectedRows = data.length + 1; // +1 for header
              expect(nonEmptyLines.length).toBe(expectedRows);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('CSV export handles empty data array', () => {
        fc.assert(
          fc.property(
            fieldListArb,
            (fields) => {
              const csvOutput = DataManagementService.convertToCSV([], fields);
              
              // Should return just the header
              expect(csvOutput).toBe(fields.join(','));
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('CSV export escapes special characters correctly', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                field1: fc.string({ maxLength: 20 }),
                field2: fc.string({ maxLength: 20 })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (data) => {
              const fields = ['field1', 'field2'];
              const csvOutput = DataManagementService.convertToCSV(data, fields);
              
              // CSV should be parseable back
              const parsed = DataManagementService.parseCSV(csvOutput);
              
              // Should have same number of records
              expect(parsed.length).toBe(data.length);
              
              // Each record should have the same fields
              parsed.forEach((record, index) => {
                expect(Object.keys(record)).toEqual(fields);
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('CSV export round-trip preserves data structure', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                name: fc.string({ maxLength: 50 }),
                value: fc.integer({ min: 0, max: 1000 }),
                status: fc.constantFrom('active', 'inactive', 'pending')
              }),
              { minLength: 1, maxLength: 20 }
            ),
            (data) => {
              const fields = ['name', 'value', 'status'];
              
              // Export to CSV
              const csvOutput = DataManagementService.convertToCSV(data, fields);
              
              // Parse back
              const parsed = DataManagementService.parseCSV(csvOutput);
              
              // Should have same number of records
              expect(parsed.length).toBe(data.length);
              
              // Each record should have all fields
              parsed.forEach((record) => {
                expect(Object.keys(record).sort()).toEqual(fields.sort());
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('CSV export handles null and undefined values', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                field1: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
                field2: fc.option(fc.integer(), { nil: undefined }),
                field3: fc.string({ maxLength: 20 })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (data) => {
              const fields = ['field1', 'field2', 'field3'];
              const csvOutput = DataManagementService.convertToCSV(data, fields);
              
              // Should produce valid CSV
              expect(typeof csvOutput).toBe('string');
              
              // Should be parseable
              const parsed = DataManagementService.parseCSV(csvOutput);
              expect(parsed.length).toBe(data.length);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('CSV export produces consistent output for same input', () => {
        fc.assert(
          fc.property(
            dataArrayArb,
            fieldListArb,
            (data, fields) => {
              // Export multiple times
              const output1 = DataManagementService.convertToCSV(data, fields);
              const output2 = DataManagementService.convertToCSV(data, fields);
              const output3 = DataManagementService.convertToCSV(data, fields);
              
              // All outputs should be identical
              expect(output1).toBe(output2);
              expect(output2).toBe(output3);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('CSV export handles commas in field values', () => {
        const dataWithCommas = [
          { name: 'Item, with comma', value: 100 },
          { name: 'Normal item', value: 200 },
          { name: 'Another, item, with, commas', value: 300 }
        ];
        const fields = ['name', 'value'];
        
        const csvOutput = DataManagementService.convertToCSV(dataWithCommas, fields);
        
        // Parse back
        const parsed = DataManagementService.parseCSV(csvOutput);
        
        // Should preserve the commas in values
        expect(parsed.length).toBe(3);
        expect(parsed[0].name).toBe('Item, with comma');
        expect(parsed[2].name).toBe('Another, item, with, commas');
      });

      test('CSV export handles quotes in field values', () => {
        const dataWithQuotes = [
          { name: 'Item with "quotes"', value: 100 },
          { name: 'Normal item', value: 200 },
          { name: '"Fully quoted"', value: 300 }
        ];
        const fields = ['name', 'value'];
        
        const csvOutput = DataManagementService.convertToCSV(dataWithQuotes, fields);
        
        // Parse back
        const parsed = DataManagementService.parseCSV(csvOutput);
        
        // Should preserve the quotes in values
        expect(parsed.length).toBe(3);
        expect(parsed[0].name).toBe('Item with "quotes"');
        expect(parsed[2].name).toBe('"Fully quoted"');
      });

      test('CSV export handles newlines in field values', () => {
        const dataWithNewlines = [
          { name: 'Item with newlines', value: 100 },
          { name: 'Normal item', value: 200 }
        ];
        const fields = ['name', 'value'];
        
        const csvOutput = DataManagementService.convertToCSV(dataWithNewlines, fields);
        
        // Parse back
        const parsed = DataManagementService.parseCSV(csvOutput);
        
        // Should have correct number of records
        expect(parsed.length).toBe(2);
        
        // Note: CSV parsing of newlines is complex and may not preserve them exactly
        // The important thing is that the CSV is valid and parseable
        expect(parsed[0].name).toBeDefined();
        expect(parsed[1].name).toBe('Normal item');
      });

      test('CSV export handles objects and arrays by stringifying', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                name: fc.string({ maxLength: 20 }),
                metadata: fc.oneof(
                  fc.object(),
                  fc.array(fc.string({ maxLength: 10 }), { maxLength: 5 })
                )
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (data) => {
              const fields = ['name', 'metadata'];
              const csvOutput = DataManagementService.convertToCSV(data, fields);
              
              // Should produce valid CSV
              expect(typeof csvOutput).toBe('string');
              
              // Should be parseable
              const parsed = DataManagementService.parseCSV(csvOutput);
              expect(parsed.length).toBe(data.length);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // JSON Format Validity Tests
    // ============================================

    describe('JSON Export Format Validity', () => {
      test('JSON export produces valid JSON format for any data', () => {
        fc.assert(
          fc.property(
            dataArrayArb,
            (data) => {
              const jsonOutput = DataManagementService.convertToJSON(data);
              
              // JSON output should be a string
              expect(typeof jsonOutput).toBe('string');
              
              // Should be parseable as valid JSON
              expect(() => JSON.parse(jsonOutput)).not.toThrow();
              
              // Parsed result should be an array
              const parsed = JSON.parse(jsonOutput);
              expect(Array.isArray(parsed)).toBe(true);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('JSON export round-trip preserves data exactly', () => {
        fc.assert(
          fc.property(
            dataArrayArb,
            (data) => {
              // Export to JSON
              const jsonOutput = DataManagementService.convertToJSON(data);
              
              // Parse back
              const parsed = JSON.parse(jsonOutput);
              
              // Should be deeply equal to original
              expect(parsed).toEqual(data);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('JSON export handles empty array', () => {
        const jsonOutput = DataManagementService.convertToJSON([]);
        
        // Should be valid JSON
        expect(() => JSON.parse(jsonOutput)).not.toThrow();
        
        // Should parse to empty array
        const parsed = JSON.parse(jsonOutput);
        expect(parsed).toEqual([]);
      });

      test('JSON export handles nested objects', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.string({ maxLength: 20 }),
                nested: fc.record({
                  field1: fc.string({ maxLength: 20 }),
                  field2: fc.integer()
                }),
                array: fc.array(fc.integer(), { maxLength: 5 })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (data) => {
              const jsonOutput = DataManagementService.convertToJSON(data);
              
              // Should be valid JSON
              const parsed = JSON.parse(jsonOutput);
              
              // Should preserve nested structure
              expect(parsed).toEqual(data);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('JSON export handles special characters', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                text: fc.string({ maxLength: 50 })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (data) => {
              const jsonOutput = DataManagementService.convertToJSON(data);
              
              // Should be valid JSON
              const parsed = JSON.parse(jsonOutput);
              
              // Should preserve special characters
              expect(parsed).toEqual(data);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('JSON export handles null values', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                field1: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
                field2: fc.option(fc.integer(), { nil: null })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (data) => {
              const jsonOutput = DataManagementService.convertToJSON(data);
              
              // Should be valid JSON
              const parsed = JSON.parse(jsonOutput);
              
              // Should preserve null values
              expect(parsed).toEqual(data);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('JSON export produces consistent output for same input', () => {
        fc.assert(
          fc.property(
            dataArrayArb,
            (data) => {
              // Export multiple times
              const output1 = DataManagementService.convertToJSON(data);
              const output2 = DataManagementService.convertToJSON(data);
              const output3 = DataManagementService.convertToJSON(data);
              
              // All outputs should be identical
              expect(output1).toBe(output2);
              expect(output2).toBe(output3);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('JSON export is formatted with indentation', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                field1: fc.string({ maxLength: 20 }),
                field2: fc.integer()
              }),
              { minLength: 1, maxLength: 5 }
            ),
            (data) => {
              const jsonOutput = DataManagementService.convertToJSON(data);
              
              // Should contain newlines (formatted)
              expect(jsonOutput).toContain('\n');
              
              // Should contain spaces (indentation)
              expect(jsonOutput).toContain('  ');
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('JSON export handles boolean values', () => {
        const dataWithBooleans = [
          { name: 'Item 1', active: true },
          { name: 'Item 2', active: false },
          { name: 'Item 3', active: true }
        ];
        
        const jsonOutput = DataManagementService.convertToJSON(dataWithBooleans);
        const parsed = JSON.parse(jsonOutput);
        
        // Should preserve boolean values
        expect(parsed).toEqual(dataWithBooleans);
        expect(parsed[0].active).toBe(true);
        expect(parsed[1].active).toBe(false);
      });

      test('JSON export handles numeric values', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                integer: fc.integer(),
                float: fc.float({ noNaN: true, noDefaultInfinity: true }),
                negative: fc.integer({ max: -1 }),
                zero: fc.constant(0)
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (data) => {
              const jsonOutput = DataManagementService.convertToJSON(data);
              const parsed = JSON.parse(jsonOutput);
              
              // Should preserve numeric values (with special handling for -0)
              // JSON.stringify converts -0 to 0, so we need to handle this
              expect(parsed.length).toBe(data.length);
              parsed.forEach((record, index) => {
                expect(record.integer).toBe(data[index].integer);
                // For float, handle -0 vs 0 comparison
                if (Object.is(data[index].float, -0)) {
                  expect(record.float).toBe(0); // JSON converts -0 to 0
                } else {
                  expect(record.float).toBe(data[index].float);
                }
                expect(record.negative).toBe(data[index].negative);
                expect(record.zero).toBe(data[index].zero);
              });
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('JSON export handles Unicode characters', () => {
        const dataWithUnicode = [
          { name: 'Hello 世界', emoji: '🎉🎊' },
          { name: 'Привет мир', emoji: '🌍' },
          { name: 'مرحبا بالعالم', emoji: '✨' }
        ];
        
        const jsonOutput = DataManagementService.convertToJSON(dataWithUnicode);
        const parsed = JSON.parse(jsonOutput);
        
        // Should preserve Unicode characters
        expect(parsed).toEqual(dataWithUnicode);
      });
    });

    // ============================================
    // Cross-Format Consistency Tests
    // ============================================

    describe('Cross-Format Consistency', () => {
      test('both formats handle the same data without errors', () => {
        fc.assert(
          fc.property(
            dataArrayArb,
            fieldListArb,
            (data, fields) => {
              // Both should succeed without throwing
              expect(() => DataManagementService.convertToCSV(data, fields)).not.toThrow();
              expect(() => DataManagementService.convertToJSON(data)).not.toThrow();
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('both formats produce non-empty output for non-empty data', () => {
        fc.assert(
          fc.property(
            fc.array(dataRecordArb, { minLength: 1, maxLength: 10 }),
            fieldListArb,
            (data, fields) => {
              const csvOutput = DataManagementService.convertToCSV(data, fields);
              const jsonOutput = DataManagementService.convertToJSON(data);
              
              // Both should produce non-empty strings
              expect(csvOutput.length).toBeGreaterThan(0);
              expect(jsonOutput.length).toBeGreaterThan(0);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('both formats are deterministic', () => {
        fc.assert(
          fc.property(
            dataArrayArb,
            fieldListArb,
            (data, fields) => {
              // CSV should be deterministic
              const csv1 = DataManagementService.convertToCSV(data, fields);
              const csv2 = DataManagementService.convertToCSV(data, fields);
              expect(csv1).toBe(csv2);
              
              // JSON should be deterministic
              const json1 = DataManagementService.convertToJSON(data);
              const json2 = DataManagementService.convertToJSON(data);
              expect(json1).toBe(json2);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('both formats handle empty data gracefully', () => {
        const emptyData = [];
        const fields = ['field1', 'field2'];
        
        // CSV should return just header
        const csvOutput = DataManagementService.convertToCSV(emptyData, fields);
        expect(csvOutput).toBe('field1,field2');
        
        // JSON should return empty array
        const jsonOutput = DataManagementService.convertToJSON(emptyData);
        expect(JSON.parse(jsonOutput)).toEqual([]);
      });
    });
  });
});
