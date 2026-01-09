/**
 * Property-Based Tests for Equipment Usage Analyzer Service
 * 
 * Tests universal properties for utilization rate calculation and equipment classification.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Properties tested:
 * - Property 4: Equipment Utilization Classification
 * - Property 5: Utilization Rate Calculation
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */

import fc from 'fast-check';
import EquipmentUsageAnalyzerService from '../equipmentUsageAnalyzerService';
import { EQUIPMENT_CLASSIFICATION, UTILIZATION_THRESHOLDS } from '../../types/equipmentUtilization';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

describe('Equipment Usage Analyzer Service Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 4: Equipment Utilization Classification
   * **Validates: Requirements 3.2, 3.3**
   * 
   * For any equipment item:
   * - If utilization rate >= 80% in past 30 days → classified as high-demand
   * - If not borrowed in past 60 days → classified as idle
   * - Otherwise → classified as normal
   */
  describe('Property 4: Equipment Utilization Classification', () => {
    // Helper to create a date N days ago
    const daysAgo = (days, fromDate = new Date()) => {
      const date = new Date(fromDate);
      date.setDate(date.getDate() - days);
      return date;
    };

    test('equipment with utilization rate >= 80% is classified as high-demand', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.8), max: Math.fround(1.0), noNaN: true }), // utilizationRate >= 80%
          fc.integer({ min: 0, max: 59 }), // days since last borrow (< 60 to not trigger idle)
          (utilizationRate, daysSinceLastBorrow) => {
            const currentDate = new Date();
            const lastBorrowedDate = daysAgo(daysSinceLastBorrow, currentDate);
            
            const classification = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate,
              lastBorrowedDate,
              currentDate
            );
            
            // High utilization should always result in high-demand classification
            expect(classification).toBe(EQUIPMENT_CLASSIFICATION.HIGH_DEMAND);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('equipment with utilization rate exactly at 80% threshold is classified as high-demand', () => {
      const currentDate = new Date();
      const lastBorrowedDate = daysAgo(10, currentDate);
      
      const classification = EquipmentUsageAnalyzerService.classifyEquipment(
        UTILIZATION_THRESHOLDS.HIGH_DEMAND, // exactly 0.8
        lastBorrowedDate,
        currentDate
      );
      
      expect(classification).toBe(EQUIPMENT_CLASSIFICATION.HIGH_DEMAND);
    });

    test('equipment not borrowed in 60+ days is classified as idle (when utilization < 80%)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(0.79), noNaN: true }), // utilizationRate < 80%
          fc.integer({ min: 60, max: 365 }), // days since last borrow >= 60
          (utilizationRate, daysSinceLastBorrow) => {
            const currentDate = new Date();
            const lastBorrowedDate = daysAgo(daysSinceLastBorrow, currentDate);
            
            const classification = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate,
              lastBorrowedDate,
              currentDate
            );
            
            // Equipment not borrowed in 60+ days should be idle
            expect(classification).toBe(EQUIPMENT_CLASSIFICATION.IDLE);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('equipment never borrowed (null lastBorrowedDate) is classified as idle (when utilization < 80%)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(0.79), noNaN: true }), // utilizationRate < 80%
          (utilizationRate) => {
            const currentDate = new Date();
            
            const classification = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate,
              null, // never borrowed
              currentDate
            );
            
            // Never borrowed equipment should be idle
            expect(classification).toBe(EQUIPMENT_CLASSIFICATION.IDLE);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('equipment with utilization < 80% and borrowed within 60 days is classified as normal', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(0.79), noNaN: true }), // utilizationRate < 80%
          fc.integer({ min: 0, max: 59 }), // days since last borrow < 60
          (utilizationRate, daysSinceLastBorrow) => {
            const currentDate = new Date();
            const lastBorrowedDate = daysAgo(daysSinceLastBorrow, currentDate);
            
            const classification = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate,
              lastBorrowedDate,
              currentDate
            );
            
            // Normal utilization and recent borrow should be normal
            expect(classification).toBe(EQUIPMENT_CLASSIFICATION.NORMAL);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('classification is deterministic for same inputs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), // utilizationRate
          fc.integer({ min: 0, max: 365 }), // days since last borrow
          (utilizationRate, daysSinceLastBorrow) => {
            const currentDate = new Date();
            const lastBorrowedDate = daysAgo(daysSinceLastBorrow, currentDate);
            
            // Call multiple times with same inputs
            const result1 = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate, lastBorrowedDate, currentDate
            );
            const result2 = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate, lastBorrowedDate, currentDate
            );
            const result3 = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate, lastBorrowedDate, currentDate
            );
            
            // Results should always be the same
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('classification always returns a valid EQUIPMENT_CLASSIFICATION value', () => {
      const validClassifications = Object.values(EQUIPMENT_CLASSIFICATION);
      
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-0.5), max: Math.fround(1.5), noNaN: true }), // utilizationRate (including edge cases)
          fc.option(fc.date({ min: daysAgo(1000), max: new Date() }), { nil: null }), // lastBorrowedDate or null
          (utilizationRate, lastBorrowedDate) => {
            const currentDate = new Date();
            
            const classification = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate,
              lastBorrowedDate,
              currentDate
            );
            
            // Classification should always be one of the valid values
            expect(validClassifications).toContain(classification);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('high utilization takes precedence over idle days', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.8), max: Math.fround(1.0), noNaN: true }), // utilizationRate >= 80%
          fc.integer({ min: 60, max: 365 }), // days since last borrow >= 60 (would be idle otherwise)
          (utilizationRate, daysSinceLastBorrow) => {
            const currentDate = new Date();
            const lastBorrowedDate = daysAgo(daysSinceLastBorrow, currentDate);
            
            const classification = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate,
              lastBorrowedDate,
              currentDate
            );
            
            // High utilization should override idle classification
            expect(classification).toBe(EQUIPMENT_CLASSIFICATION.HIGH_DEMAND);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('classification handles various date formats for lastBorrowedDate', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(0.5), noNaN: true }), // utilizationRate < 80%
          fc.integer({ min: 0, max: 30 }), // days since last borrow < 60
          (utilizationRate, daysSinceLastBorrow) => {
            const currentDate = new Date();
            const lastBorrowedDate = daysAgo(daysSinceLastBorrow, currentDate);
            
            // Test with Date object
            const result1 = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate, lastBorrowedDate, currentDate
            );
            
            // Test with timestamp number
            const result2 = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate, lastBorrowedDate.getTime(), currentDate
            );
            
            // Test with ISO string
            const result3 = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate, lastBorrowedDate.toISOString(), currentDate
            );
            
            // Test with Firestore-like timestamp object
            const firestoreTimestamp = { 
              seconds: Math.floor(lastBorrowedDate.getTime() / 1000),
              toDate: () => lastBorrowedDate
            };
            const result4 = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate, firestoreTimestamp, currentDate
            );
            
            // All formats should produce the same classification
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
            expect(result3).toBe(result4);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('exactly at 60 days idle threshold is classified as idle (when utilization < 80%)', () => {
      const currentDate = new Date();
      const lastBorrowedDate = daysAgo(UTILIZATION_THRESHOLDS.IDLE_DAYS, currentDate); // exactly 60 days
      
      const classification = EquipmentUsageAnalyzerService.classifyEquipment(
        0.5, // utilization < 80%
        lastBorrowedDate,
        currentDate
      );
      
      expect(classification).toBe(EQUIPMENT_CLASSIFICATION.IDLE);
    });

    test('at 59 days (just under idle threshold) is classified as normal (when utilization < 80%)', () => {
      const currentDate = new Date();
      const lastBorrowedDate = daysAgo(UTILIZATION_THRESHOLDS.IDLE_DAYS - 1, currentDate); // 59 days
      
      const classification = EquipmentUsageAnalyzerService.classifyEquipment(
        0.5, // utilization < 80%
        lastBorrowedDate,
        currentDate
      );
      
      expect(classification).toBe(EQUIPMENT_CLASSIFICATION.NORMAL);
    });

    test('classification covers all three categories exhaustively', () => {
      // This test verifies that the classification logic is complete
      // by checking that every possible input maps to exactly one category
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), // utilizationRate
          fc.option(fc.integer({ min: 0, max: 365 }), { nil: null }), // days since last borrow or null
          (utilizationRate, daysSinceLastBorrow) => {
            const currentDate = new Date();
            const lastBorrowedDate = daysSinceLastBorrow !== null 
              ? daysAgo(daysSinceLastBorrow, currentDate) 
              : null;
            
            const classification = EquipmentUsageAnalyzerService.classifyEquipment(
              utilizationRate,
              lastBorrowedDate,
              currentDate
            );
            
            // Verify the classification follows the documented rules
            if (utilizationRate >= UTILIZATION_THRESHOLDS.HIGH_DEMAND) {
              expect(classification).toBe(EQUIPMENT_CLASSIFICATION.HIGH_DEMAND);
            } else if (lastBorrowedDate === null || daysSinceLastBorrow >= UTILIZATION_THRESHOLDS.IDLE_DAYS) {
              expect(classification).toBe(EQUIPMENT_CLASSIFICATION.IDLE);
            } else {
              expect(classification).toBe(EQUIPMENT_CLASSIFICATION.NORMAL);
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });

  /**
   * Feature: admin-intelligence-assistant, Property 5: Utilization Rate Calculation
   * **Validates: Requirements 3.1**
   * 
   * For any equipment with loan history, the utilization rate SHALL equal 
   * (borrowed days / total days) and be bounded between 0 and 1.
   */
  describe('Property 5: Utilization Rate Calculation', () => {
    test('utilization rate equals borrowedDays / totalDays for valid inputs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }), // borrowedDays
          fc.integer({ min: 1, max: 1000 }), // totalDays (must be > 0)
          (borrowedDays, totalDays) => {
            const rate = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays, totalDays);
            const expectedRate = Math.min(borrowedDays / totalDays, 1);
            
            expect(rate).toBeCloseTo(expectedRate, 10);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('utilization rate is always bounded between 0 and 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 10000 }), // borrowedDays (including negative edge cases)
          fc.integer({ min: -100, max: 10000 }), // totalDays (including edge cases)
          (borrowedDays, totalDays) => {
            const rate = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays, totalDays);
            
            // Rate should always be between 0 and 1
            expect(rate).toBeGreaterThanOrEqual(0);
            expect(rate).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('utilization rate is 0 when totalDays is 0 or negative', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }), // borrowedDays
          fc.integer({ min: -1000, max: 0 }), // totalDays <= 0
          (borrowedDays, totalDays) => {
            const rate = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays, totalDays);
            
            expect(rate).toBe(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('utilization rate is 0 when borrowedDays is negative', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: -1 }), // borrowedDays < 0
          fc.integer({ min: 1, max: 1000 }), // totalDays > 0
          (borrowedDays, totalDays) => {
            const rate = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays, totalDays);
            
            expect(rate).toBe(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('utilization rate is capped at 1 when borrowedDays exceeds totalDays', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // totalDays
          fc.integer({ min: 1, max: 1000 }), // extra days beyond totalDays
          (totalDays, extraDays) => {
            const borrowedDays = totalDays + extraDays;
            const rate = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays, totalDays);
            
            // Rate should be capped at 1
            expect(rate).toBe(1);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('utilization rate is 0 when borrowedDays is 0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // totalDays > 0
          (totalDays) => {
            const rate = EquipmentUsageAnalyzerService.calculateUtilizationRate(0, totalDays);
            
            expect(rate).toBe(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('utilization rate is 1 when borrowedDays equals totalDays', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // days (both borrowed and total)
          (days) => {
            const rate = EquipmentUsageAnalyzerService.calculateUtilizationRate(days, days);
            
            expect(rate).toBe(1);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('utilization rate calculation is deterministic', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }), // borrowedDays
          fc.integer({ min: 1, max: 1000 }), // totalDays
          (borrowedDays, totalDays) => {
            // Call the function multiple times with same input
            const result1 = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays, totalDays);
            const result2 = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays, totalDays);
            const result3 = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays, totalDays);
            
            // Results should always be the same for same input
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('utilization rate increases monotonically with borrowedDays (for fixed totalDays)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 999 }), // borrowedDays
          fc.integer({ min: 1, max: 1000 }), // totalDays
          (borrowedDays, totalDays) => {
            const currentRate = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays, totalDays);
            const nextRate = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays + 1, totalDays);
            
            // Rate should never decrease as borrowedDays increases
            expect(nextRate).toBeGreaterThanOrEqual(currentRate);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('utilization rate decreases monotonically with totalDays (for fixed borrowedDays)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // borrowedDays
          fc.integer({ min: 1, max: 999 }), // totalDays
          (borrowedDays, totalDays) => {
            const currentRate = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays, totalDays);
            const nextRate = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays, totalDays + 1);
            
            // Rate should never increase as totalDays increases (with fixed borrowedDays)
            expect(nextRate).toBeLessThanOrEqual(currentRate);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('utilization rate handles floating point inputs correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }), // borrowedDays
          fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }), // totalDays > 0
          (borrowedDays, totalDays) => {
            const rate = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays, totalDays);
            
            // Rate should still be bounded between 0 and 1
            expect(rate).toBeGreaterThanOrEqual(0);
            expect(rate).toBeLessThanOrEqual(1);
            
            // Rate should be a valid number
            expect(Number.isFinite(rate)).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('utilization rate is proportional to borrowedDays', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // borrowedDays
          fc.integer({ min: 100, max: 1000 }), // totalDays (larger to avoid capping)
          fc.integer({ min: 2, max: 5 }), // multiplier
          (borrowedDays, totalDays, multiplier) => {
            const rate1 = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays, totalDays);
            const rate2 = EquipmentUsageAnalyzerService.calculateUtilizationRate(borrowedDays * multiplier, totalDays);
            
            // If neither rate is capped at 1, rate2 should be approximately multiplier * rate1
            if (rate2 < 1) {
              expect(rate2).toBeCloseTo(rate1 * multiplier, 10);
            } else {
              // If rate2 is capped, it should be 1
              expect(rate2).toBe(1);
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });
});
