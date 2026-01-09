/**
 * Property-Based Tests for User Reliability Service
 * 
 * Tests universal properties for reliability score calculation.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Properties tested:
 * - Property 6: User Reliability Score Calculation
 * - Property 7: Low Reliability User Flagging
 * 
 * **Validates: Requirements 10.1, 10.2**
 */

import fc from 'fast-check';
import UserReliabilityService from '../userReliabilityService';
import { SCORE_WEIGHTS, RELIABILITY_THRESHOLDS } from '../../types/userReliability';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

describe('User Reliability Service Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 6: User Reliability Score Calculation
   * **Validates: Requirements 10.1**
   * 
   * For any user, the reliability score SHALL be calculated as:
   * (onTimeReturnRate * 0.6 + (1 - noShowRate) * 0.4) * 100
   * and be bounded between 0 and 100.
   */
  describe('Property 6: User Reliability Score Calculation', () => {
    test('reliability score follows the formula: (onTimeReturnRate * 0.6 + (1 - noShowRate) * 0.4) * 100', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), // onTimeReturnRate (0-1)
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), // noShowRate (0-1)
          (onTimeReturnRate, noShowRate) => {
            const score = UserReliabilityService.calculateReliabilityScore(onTimeReturnRate, noShowRate);
            
            // Calculate expected score using the formula
            const expectedScore = Math.round(
              (onTimeReturnRate * SCORE_WEIGHTS.ON_TIME_RETURN + 
               (1 - noShowRate) * SCORE_WEIGHTS.NO_SHOW) * 100
            );
            
            expect(score).toBe(expectedScore);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('reliability score is always bounded between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-1), max: Math.fround(2), noNaN: true }), // onTimeReturnRate (including edge cases)
          fc.float({ min: Math.fround(-1), max: Math.fround(2), noNaN: true }), // noShowRate (including edge cases)
          (onTimeReturnRate, noShowRate) => {
            const score = UserReliabilityService.calculateReliabilityScore(onTimeReturnRate, noShowRate);
            
            // Score should always be between 0 and 100
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('perfect user (100% on-time, 0% no-show) gets score of 100', () => {
      const score = UserReliabilityService.calculateReliabilityScore(1, 0);
      expect(score).toBe(100);
    });

    test('worst case user (0% on-time, 100% no-show) gets score of 0', () => {
      const score = UserReliabilityService.calculateReliabilityScore(0, 1);
      expect(score).toBe(0);
    });

    test('reliability score is deterministic for same inputs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), // onTimeReturnRate
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), // noShowRate
          (onTimeReturnRate, noShowRate) => {
            // Call multiple times with same inputs
            const result1 = UserReliabilityService.calculateReliabilityScore(onTimeReturnRate, noShowRate);
            const result2 = UserReliabilityService.calculateReliabilityScore(onTimeReturnRate, noShowRate);
            const result3 = UserReliabilityService.calculateReliabilityScore(onTimeReturnRate, noShowRate);
            
            // Results should always be the same
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('reliability score increases monotonically with onTimeReturnRate (for fixed noShowRate)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(0.99), noNaN: true }), // onTimeReturnRate
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), // noShowRate
          fc.float({ min: Math.fround(0.001), max: Math.fround(0.1), noNaN: true }), // increment
          (onTimeReturnRate, noShowRate, increment) => {
            const currentScore = UserReliabilityService.calculateReliabilityScore(onTimeReturnRate, noShowRate);
            const higherRate = Math.min(onTimeReturnRate + increment, 1);
            const nextScore = UserReliabilityService.calculateReliabilityScore(higherRate, noShowRate);
            
            // Score should never decrease as onTimeReturnRate increases
            expect(nextScore).toBeGreaterThanOrEqual(currentScore);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('reliability score decreases monotonically with noShowRate (for fixed onTimeReturnRate)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), // onTimeReturnRate
          fc.float({ min: Math.fround(0), max: Math.fround(0.99), noNaN: true }), // noShowRate
          fc.float({ min: Math.fround(0.001), max: Math.fround(0.1), noNaN: true }), // increment
          (onTimeReturnRate, noShowRate, increment) => {
            const currentScore = UserReliabilityService.calculateReliabilityScore(onTimeReturnRate, noShowRate);
            const higherNoShowRate = Math.min(noShowRate + increment, 1);
            const nextScore = UserReliabilityService.calculateReliabilityScore(onTimeReturnRate, higherNoShowRate);
            
            // Score should never increase as noShowRate increases
            expect(nextScore).toBeLessThanOrEqual(currentScore);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('reliability score handles invalid inputs gracefully', () => {
      // Test with NaN
      expect(UserReliabilityService.calculateReliabilityScore(NaN, 0)).toBeGreaterThanOrEqual(0);
      expect(UserReliabilityService.calculateReliabilityScore(0, NaN)).toBeGreaterThanOrEqual(0);
      expect(UserReliabilityService.calculateReliabilityScore(NaN, NaN)).toBeGreaterThanOrEqual(0);
      
      // Test with undefined
      expect(UserReliabilityService.calculateReliabilityScore(undefined, 0)).toBeGreaterThanOrEqual(0);
      expect(UserReliabilityService.calculateReliabilityScore(0, undefined)).toBeGreaterThanOrEqual(0);
      
      // Test with null
      expect(UserReliabilityService.calculateReliabilityScore(null, 0)).toBeGreaterThanOrEqual(0);
      expect(UserReliabilityService.calculateReliabilityScore(0, null)).toBeGreaterThanOrEqual(0);
    });

    test('reliability score clamps input values to valid range [0, 1]', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }), // onTimeReturnRate (out of range)
          fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }), // noShowRate (out of range)
          (onTimeReturnRate, noShowRate) => {
            const score = UserReliabilityService.calculateReliabilityScore(onTimeReturnRate, noShowRate);
            
            // Score should still be valid (0-100)
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
            
            // Score should be an integer (rounded)
            expect(Number.isInteger(score)).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('reliability score returns an integer', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), // onTimeReturnRate
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), // noShowRate
          (onTimeReturnRate, noShowRate) => {
            const score = UserReliabilityService.calculateReliabilityScore(onTimeReturnRate, noShowRate);
            
            // Score should be an integer
            expect(Number.isInteger(score)).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('on-time return rate has 60% weight in score calculation', () => {
      // Test with 100% on-time, 0% no-show contribution
      // Score should be 60 (from on-time) + 40 (from no-show = 0) = 100
      const scoreWithPerfectOnTime = UserReliabilityService.calculateReliabilityScore(1, 0);
      expect(scoreWithPerfectOnTime).toBe(100);
      
      // Test with 0% on-time, 0% no-show
      // Score should be 0 (from on-time) + 40 (from no-show = 0) = 40
      const scoreWithZeroOnTime = UserReliabilityService.calculateReliabilityScore(0, 0);
      expect(scoreWithZeroOnTime).toBe(40);
      
      // The difference should be 60 (the weight of on-time return)
      expect(scoreWithPerfectOnTime - scoreWithZeroOnTime).toBe(60);
    });

    test('no-show rate has 40% weight in score calculation', () => {
      // Test with 0% on-time, 0% no-show
      // Score should be 0 (from on-time) + 40 (from no-show = 0) = 40
      const scoreWithZeroNoShow = UserReliabilityService.calculateReliabilityScore(0, 0);
      expect(scoreWithZeroNoShow).toBe(40);
      
      // Test with 0% on-time, 100% no-show
      // Score should be 0 (from on-time) + 0 (from no-show = 1) = 0
      const scoreWithFullNoShow = UserReliabilityService.calculateReliabilityScore(0, 1);
      expect(scoreWithFullNoShow).toBe(0);
      
      // The difference should be 40 (the weight of no-show)
      expect(scoreWithZeroNoShow - scoreWithFullNoShow).toBe(40);
    });

    test('score calculation uses correct weights from SCORE_WEIGHTS', () => {
      // Verify the weights are as expected
      expect(SCORE_WEIGHTS.ON_TIME_RETURN).toBe(0.6);
      expect(SCORE_WEIGHTS.NO_SHOW).toBe(0.4);
      
      // Verify weights sum to 1
      expect(SCORE_WEIGHTS.ON_TIME_RETURN + SCORE_WEIGHTS.NO_SHOW).toBe(1);
    });

    test('mid-range values produce expected scores', () => {
      // 50% on-time, 50% no-show
      // Score = (0.5 * 0.6 + 0.5 * 0.4) * 100 = (0.3 + 0.2) * 100 = 50
      const midScore = UserReliabilityService.calculateReliabilityScore(0.5, 0.5);
      expect(midScore).toBe(50);
      
      // 75% on-time, 25% no-show
      // Score = (0.75 * 0.6 + 0.75 * 0.4) * 100 = (0.45 + 0.3) * 100 = 75
      const goodScore = UserReliabilityService.calculateReliabilityScore(0.75, 0.25);
      expect(goodScore).toBe(75);
    });
  });

  /**
   * Feature: admin-intelligence-assistant, Property 7: Low Reliability User Flagging
   * **Validates: Requirements 10.2**
   * 
   * For any user with reliability score below 50%, the system SHALL flag them for review.
   */
  describe('Property 7: Low Reliability User Flagging', () => {
    test('users with reliability score below 50 are flagged', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 49 }), // Scores below threshold
          (reliabilityScore) => {
            const shouldFlag = UserReliabilityService.shouldFlagUser(reliabilityScore);
            
            // All scores below 50 should be flagged
            expect(shouldFlag).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('users with reliability score at or above 50 are not flagged', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 100 }), // Scores at or above threshold
          (reliabilityScore) => {
            const shouldFlag = UserReliabilityService.shouldFlagUser(reliabilityScore);
            
            // All scores >= 50 should NOT be flagged
            expect(shouldFlag).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('flagging threshold is exactly 50', () => {
      // Test boundary conditions
      expect(UserReliabilityService.shouldFlagUser(49)).toBe(true);
      expect(UserReliabilityService.shouldFlagUser(50)).toBe(false);
      expect(UserReliabilityService.shouldFlagUser(49.9)).toBe(true);
      expect(UserReliabilityService.shouldFlagUser(50.1)).toBe(false);
    });

    test('flagging is consistent for the same score', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // Any valid score
          (reliabilityScore) => {
            // Call multiple times with same score
            const result1 = UserReliabilityService.shouldFlagUser(reliabilityScore);
            const result2 = UserReliabilityService.shouldFlagUser(reliabilityScore);
            const result3 = UserReliabilityService.shouldFlagUser(reliabilityScore);
            
            // Results should always be the same
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('flagging uses the correct threshold from RELIABILITY_THRESHOLDS', () => {
      // Verify the threshold is as expected
      expect(RELIABILITY_THRESHOLDS.FLAG_THRESHOLD).toBe(50);
      
      // Test that the function uses this threshold
      expect(UserReliabilityService.shouldFlagUser(RELIABILITY_THRESHOLDS.FLAG_THRESHOLD - 1)).toBe(true);
      expect(UserReliabilityService.shouldFlagUser(RELIABILITY_THRESHOLDS.FLAG_THRESHOLD)).toBe(false);
    });

    test('flagging handles invalid inputs gracefully', () => {
      // Test with NaN
      expect(UserReliabilityService.shouldFlagUser(NaN)).toBe(false);
      
      // Test with undefined
      expect(UserReliabilityService.shouldFlagUser(undefined)).toBe(false);
      
      // Test with null
      expect(UserReliabilityService.shouldFlagUser(null)).toBe(false);
      
      // Test with string
      expect(UserReliabilityService.shouldFlagUser('50')).toBe(false);
      
      // Test with object
      expect(UserReliabilityService.shouldFlagUser({})).toBe(false);
    });

    test('flagging works correctly for edge case scores', () => {
      // Test minimum score
      expect(UserReliabilityService.shouldFlagUser(0)).toBe(true);
      
      // Test maximum score
      expect(UserReliabilityService.shouldFlagUser(100)).toBe(false);
      
      // Test negative scores (should be treated as invalid)
      expect(UserReliabilityService.shouldFlagUser(-1)).toBe(true);
      expect(UserReliabilityService.shouldFlagUser(-100)).toBe(true);
      
      // Test scores above 100 (should not be flagged)
      expect(UserReliabilityService.shouldFlagUser(101)).toBe(false);
      expect(UserReliabilityService.shouldFlagUser(200)).toBe(false);
    });

    test('flagging decision is deterministic based on score', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // Any valid score
          (reliabilityScore) => {
            const shouldFlag = UserReliabilityService.shouldFlagUser(reliabilityScore);
            const expectedFlag = reliabilityScore < RELIABILITY_THRESHOLDS.FLAG_THRESHOLD;
            
            // Flagging decision should match expected based on threshold
            expect(shouldFlag).toBe(expectedFlag);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('all scores below threshold are flagged regardless of how they were calculated', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), // onTimeReturnRate
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), // noShowRate
          (onTimeReturnRate, noShowRate) => {
            // Calculate score
            const score = UserReliabilityService.calculateReliabilityScore(onTimeReturnRate, noShowRate);
            
            // Check if should be flagged
            const shouldFlag = UserReliabilityService.shouldFlagUser(score);
            
            // Verify flagging matches score threshold
            if (score < RELIABILITY_THRESHOLDS.FLAG_THRESHOLD) {
              expect(shouldFlag).toBe(true);
            } else {
              expect(shouldFlag).toBe(false);
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('flagging boundary is precise at 50', () => {
      // Test values very close to the boundary
      const testCases = [
        { score: 49.0, expected: true },
        { score: 49.5, expected: true },
        { score: 49.9, expected: true },
        { score: 49.99, expected: true },
        { score: 50.0, expected: false },
        { score: 50.01, expected: false },
        { score: 50.1, expected: false },
        { score: 50.5, expected: false },
        { score: 51.0, expected: false }
      ];

      testCases.forEach(({ score, expected }) => {
        expect(UserReliabilityService.shouldFlagUser(score)).toBe(expected);
      });
    });

    test('flagging returns boolean type', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // Any valid score
          (reliabilityScore) => {
            const result = UserReliabilityService.shouldFlagUser(reliabilityScore);
            
            // Result should be a boolean
            expect(typeof result).toBe('boolean');
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });

  /**
   * Feature: admin-intelligence-assistant, Property 23: User Statistics Accuracy
   * **Validates: Requirements 10.3**
   * 
   * For any user, the displayed statistics (on-time return rate, no-show rate, total loans)
   * SHALL accurately reflect their actual history.
   */
  describe('Property 23: User Statistics Accuracy', () => {
    test('loan statistics accurately calculate on-time return rate', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              status: fc.constantFrom('returned', 'overdue', 'approved', 'pending'),
              expectedReturnDate: fc.date(),
              actualReturnDate: fc.date()
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (loans) => {
            const stats = UserReliabilityService.calculateLoanStatistics(loans);
            
            // Count expected values manually
            let expectedTotal = 0;
            let expectedOnTime = 0;
            let expectedLate = 0;
            
            for (const loan of loans) {
              if (loan.status === 'returned') {
                expectedTotal++;
                const expectedDate = new Date(loan.expectedReturnDate);
                expectedDate.setHours(23, 59, 59, 999);
                const actualDate = new Date(loan.actualReturnDate);
                
                if (actualDate <= expectedDate) {
                  expectedOnTime++;
                } else {
                  expectedLate++;
                }
              } else if (loan.status === 'overdue') {
                expectedTotal++;
                expectedLate++;
              }
            }
            
            const expectedRate = expectedTotal > 0 ? expectedOnTime / expectedTotal : 1;
            
            // Verify statistics match expected values
            expect(stats.totalLoans).toBe(expectedTotal);
            expect(stats.onTimeReturns).toBe(expectedOnTime);
            expect(stats.lateReturns).toBe(expectedLate);
            expect(stats.onTimeReturnRate).toBeCloseTo(expectedRate, 10);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('loan statistics handle empty loan history correctly', () => {
      const stats = UserReliabilityService.calculateLoanStatistics([]);
      
      expect(stats.totalLoans).toBe(0);
      expect(stats.onTimeReturns).toBe(0);
      expect(stats.lateReturns).toBe(0);
      expect(stats.onTimeReturnRate).toBe(1); // Default to 1 (100%) for no history
    });

    test('loan statistics only count completed or overdue loans', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              status: fc.constantFrom('pending', 'approved', 'rejected', 'cancelled'),
              expectedReturnDate: fc.date(),
              actualReturnDate: fc.date()
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (loans) => {
            const stats = UserReliabilityService.calculateLoanStatistics(loans);
            
            // None of these statuses should be counted
            expect(stats.totalLoans).toBe(0);
            expect(stats.onTimeReturns).toBe(0);
            expect(stats.lateReturns).toBe(0);
            expect(stats.onTimeReturnRate).toBe(1);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('reservation statistics accurately calculate no-show rate', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              status: fc.constantFrom('approved', 'ready', 'completed', 'cancelled', 'no_show', 'pending'),
              isNoShow: fc.boolean()
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (reservations) => {
            const stats = UserReliabilityService.calculateReservationStatistics(reservations);
            
            // Count expected values manually
            let expectedTotal = 0;
            let expectedNoShows = 0;
            
            for (const reservation of reservations) {
              if (['approved', 'ready', 'completed', 'cancelled', 'no_show'].includes(reservation.status)) {
                expectedTotal++;
                
                if (reservation.status === 'no_show' || reservation.isNoShow === true) {
                  expectedNoShows++;
                }
              }
            }
            
            const expectedRate = expectedTotal > 0 ? expectedNoShows / expectedTotal : 0;
            
            // Verify statistics match expected values
            expect(stats.totalReservations).toBe(expectedTotal);
            expect(stats.noShows).toBe(expectedNoShows);
            expect(stats.noShowRate).toBeCloseTo(expectedRate, 10);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('reservation statistics handle empty reservation history correctly', () => {
      const stats = UserReliabilityService.calculateReservationStatistics([]);
      
      expect(stats.totalReservations).toBe(0);
      expect(stats.noShows).toBe(0);
      expect(stats.noShowRate).toBe(0); // Default to 0 (0%) for no history
    });

    test('reservation statistics only count relevant statuses', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              status: fc.constantFrom('pending', 'rejected'),
              isNoShow: fc.boolean()
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (reservations) => {
            const stats = UserReliabilityService.calculateReservationStatistics(reservations);
            
            // Pending and rejected should not be counted
            expect(stats.totalReservations).toBe(0);
            expect(stats.noShows).toBe(0);
            expect(stats.noShowRate).toBe(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('on-time return rate is bounded between 0 and 1', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              status: fc.constantFrom('returned', 'overdue'),
              expectedReturnDate: fc.date(),
              actualReturnDate: fc.date()
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (loans) => {
            const stats = UserReliabilityService.calculateLoanStatistics(loans);
            
            // Rate should always be between 0 and 1
            expect(stats.onTimeReturnRate).toBeGreaterThanOrEqual(0);
            expect(stats.onTimeReturnRate).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('no-show rate is bounded between 0 and 1', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              status: fc.constantFrom('approved', 'ready', 'completed', 'no_show'),
              isNoShow: fc.boolean()
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (reservations) => {
            const stats = UserReliabilityService.calculateReservationStatistics(reservations);
            
            // Rate should always be between 0 and 1
            expect(stats.noShowRate).toBeGreaterThanOrEqual(0);
            expect(stats.noShowRate).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('total loans equals sum of on-time and late returns', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              status: fc.constantFrom('returned', 'overdue', 'approved'),
              expectedReturnDate: fc.date(),
              actualReturnDate: fc.date()
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (loans) => {
            const stats = UserReliabilityService.calculateLoanStatistics(loans);
            
            // Total should equal sum of on-time and late
            expect(stats.totalLoans).toBe(stats.onTimeReturns + stats.lateReturns);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('statistics are deterministic for same input', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              status: fc.constantFrom('returned', 'overdue'),
              expectedReturnDate: fc.date(),
              actualReturnDate: fc.date()
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (loans) => {
            // Calculate multiple times with same input
            const stats1 = UserReliabilityService.calculateLoanStatistics(loans);
            const stats2 = UserReliabilityService.calculateLoanStatistics(loans);
            const stats3 = UserReliabilityService.calculateLoanStatistics(loans);
            
            // Results should always be the same
            expect(stats1.totalLoans).toBe(stats2.totalLoans);
            expect(stats1.totalLoans).toBe(stats3.totalLoans);
            expect(stats1.onTimeReturns).toBe(stats2.onTimeReturns);
            expect(stats1.onTimeReturns).toBe(stats3.onTimeReturns);
            expect(stats1.lateReturns).toBe(stats2.lateReturns);
            expect(stats1.lateReturns).toBe(stats3.lateReturns);
            expect(stats1.onTimeReturnRate).toBe(stats2.onTimeReturnRate);
            expect(stats1.onTimeReturnRate).toBe(stats3.onTimeReturnRate);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('overdue loans are always counted as late returns', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // Number of overdue loans
          (numOverdue) => {
            const loans = Array(numOverdue).fill(null).map(() => ({
              status: 'overdue',
              expectedReturnDate: new Date(),
              actualReturnDate: new Date()
            }));
            
            const stats = UserReliabilityService.calculateLoanStatistics(loans);
            
            // All overdue loans should be counted as late
            expect(stats.totalLoans).toBe(numOverdue);
            expect(stats.lateReturns).toBe(numOverdue);
            expect(stats.onTimeReturns).toBe(0);
            expect(stats.onTimeReturnRate).toBe(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('no-show status reservations are always counted as no-shows', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // Number of no-show reservations
          (numNoShows) => {
            const reservations = Array(numNoShows).fill(null).map(() => ({
              status: 'no_show',
              isNoShow: false // Even if isNoShow is false, status takes precedence
            }));
            
            const stats = UserReliabilityService.calculateReservationStatistics(reservations);
            
            // All no_show status should be counted as no-shows
            expect(stats.totalReservations).toBe(numNoShows);
            expect(stats.noShows).toBe(numNoShows);
            expect(stats.noShowRate).toBe(1);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('isNoShow flag correctly identifies no-shows regardless of status', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // Number of reservations
          (numReservations) => {
            const reservations = Array(numReservations).fill(null).map(() => ({
              status: 'completed', // Status is not no_show
              isNoShow: true // But flag is true
            }));
            
            const stats = UserReliabilityService.calculateReservationStatistics(reservations);
            
            // All should be counted as no-shows due to flag
            expect(stats.totalReservations).toBe(numReservations);
            expect(stats.noShows).toBe(numReservations);
            expect(stats.noShowRate).toBe(1);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('loan statistics handle missing date fields gracefully', () => {
      const loansWithMissingDates = [
        { status: 'returned', expectedReturnDate: null, actualReturnDate: new Date() },
        { status: 'returned', expectedReturnDate: new Date(), actualReturnDate: null },
        { status: 'returned', expectedReturnDate: null, actualReturnDate: null },
        { status: 'returned', expectedReturnDate: undefined, actualReturnDate: undefined }
      ];
      
      const stats = UserReliabilityService.calculateLoanStatistics(loansWithMissingDates);
      
      // Should count all as loans and assume on-time when dates are missing
      expect(stats.totalLoans).toBe(4);
      expect(stats.onTimeReturns).toBe(4);
      expect(stats.lateReturns).toBe(0);
      expect(stats.onTimeReturnRate).toBe(1);
    });

    test('statistics calculation handles various date formats', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const loans = [
        // On-time: returned before expected
        { 
          status: 'returned', 
          expectedReturnDate: tomorrow, 
          actualReturnDate: now 
        },
        // Late: returned after expected
        { 
          status: 'returned', 
          expectedReturnDate: yesterday, 
          actualReturnDate: now 
        }
      ];
      
      const stats = UserReliabilityService.calculateLoanStatistics(loans);
      
      expect(stats.totalLoans).toBe(2);
      expect(stats.onTimeReturns).toBe(1);
      expect(stats.lateReturns).toBe(1);
      expect(stats.onTimeReturnRate).toBe(0.5);
    });

    test('on-time comparison uses end of expected day', () => {
      const expectedDate = new Date('2026-01-10T10:00:00');
      const returnedSameDay = new Date('2026-01-10T23:00:00'); // Same day, later time
      const returnedNextDay = new Date('2026-01-11T01:00:00'); // Next day, early
      
      const loansOnTime = [
        { status: 'returned', expectedReturnDate: expectedDate, actualReturnDate: returnedSameDay }
      ];
      
      const loansLate = [
        { status: 'returned', expectedReturnDate: expectedDate, actualReturnDate: returnedNextDay }
      ];
      
      const statsOnTime = UserReliabilityService.calculateLoanStatistics(loansOnTime);
      const statsLate = UserReliabilityService.calculateLoanStatistics(loansLate);
      
      // Same day return should be on-time
      expect(statsOnTime.onTimeReturns).toBe(1);
      expect(statsOnTime.lateReturns).toBe(0);
      
      // Next day return should be late
      expect(statsLate.onTimeReturns).toBe(0);
      expect(statsLate.lateReturns).toBe(1);
    });

    test('statistics maintain accuracy with mixed loan statuses', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }), // returned loans
          fc.integer({ min: 0, max: 20 }), // overdue loans
          fc.integer({ min: 0, max: 20 }), // pending loans
          (numReturned, numOverdue, numPending) => {
            const loans = [
              ...Array(numReturned).fill(null).map(() => ({
                status: 'returned',
                expectedReturnDate: new Date('2026-01-10'),
                actualReturnDate: new Date('2026-01-09') // On-time
              })),
              ...Array(numOverdue).fill(null).map(() => ({
                status: 'overdue',
                expectedReturnDate: new Date(),
                actualReturnDate: new Date()
              })),
              ...Array(numPending).fill(null).map(() => ({
                status: 'pending',
                expectedReturnDate: new Date(),
                actualReturnDate: new Date()
              }))
            ];
            
            const stats = UserReliabilityService.calculateLoanStatistics(loans);
            
            // Only returned and overdue should be counted
            expect(stats.totalLoans).toBe(numReturned + numOverdue);
            expect(stats.onTimeReturns).toBe(numReturned);
            expect(stats.lateReturns).toBe(numOverdue);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('statistics maintain accuracy with mixed reservation statuses', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }), // completed reservations
          fc.integer({ min: 0, max: 20 }), // no-show reservations
          fc.integer({ min: 0, max: 20 }), // pending reservations
          (numCompleted, numNoShows, numPending) => {
            const reservations = [
              ...Array(numCompleted).fill(null).map(() => ({
                status: 'completed',
                isNoShow: false
              })),
              ...Array(numNoShows).fill(null).map(() => ({
                status: 'no_show',
                isNoShow: true
              })),
              ...Array(numPending).fill(null).map(() => ({
                status: 'pending',
                isNoShow: false
              }))
            ];
            
            const stats = UserReliabilityService.calculateReservationStatistics(reservations);
            
            // Only completed and no_show should be counted
            expect(stats.totalReservations).toBe(numCompleted + numNoShows);
            expect(stats.noShows).toBe(numNoShows);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });
});
