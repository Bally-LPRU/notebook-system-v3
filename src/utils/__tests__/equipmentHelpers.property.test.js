/**
 * Property-based tests for equipmentHelpers utility functions
 */

import fc from 'fast-check';
import { getCategoryName, getCategoryId } from '../equipmentHelpers';

describe('equipmentHelpers property tests', () => {
  // **Feature: code-cleanup-refactoring, Property 2: Category name extraction handles both formats**
  describe('Property 2: Category name extraction handles both formats', () => {
    it('should extract name from any category format', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // String format
            fc.string({ minLength: 1 }),
            // Object format with id and name
            fc.record({
              id: fc.string({ minLength: 1 }),
              name: fc.string({ minLength: 1 })
            })
          ),
          (category) => {
            const result = getCategoryName(category);
            
            if (typeof category === 'string') {
              // For string format, should return the string itself
              expect(result).toBe(category);
            } else {
              // For object format, should return the name property
              expect(result).toBe(category.name);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null and undefined gracefully', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined),
          (category) => {
            const result = getCategoryName(category);
            expect(result).toBe('-');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle objects without name property', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            // Intentionally no name property
            description: fc.string()
          }),
          (category) => {
            const result = getCategoryName(category);
            expect(result).toBe('-');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getCategoryId property tests', () => {
    it('should extract id from any category format', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // String format
            fc.string({ minLength: 1 }),
            // Object format with id and name
            fc.record({
              id: fc.string({ minLength: 1 }),
              name: fc.string({ minLength: 1 })
            })
          ),
          (category) => {
            const result = getCategoryId(category);
            
            if (typeof category === 'string') {
              // For string format, should return the string itself
              expect(result).toBe(category);
            } else {
              // For object format, should return the id property
              expect(result).toBe(category.id);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for null and undefined', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined),
          (category) => {
            const result = getCategoryId(category);
            expect(result).toBe(null);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
