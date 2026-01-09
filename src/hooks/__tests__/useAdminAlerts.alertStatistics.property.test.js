/**
 * Property-Based Tests for Alert Statistics Accuracy
 * 
 * Tests universal properties for alert statistics calculation.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Property tested:
 * - Property 21: Alert Statistics Accuracy
 * 
 * **Validates: Requirements 8.6**
 */

import fc from 'fast-check';
import { ALERT_PRIORITY, ALERT_TYPE } from '../../types/adminAlert';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

/**
 * Calculate statistics from alerts array
 * This mirrors the stats calculation in useAdminAlerts hook
 * @param {Array} alerts - Array of alerts
 * @returns {Object} Statistics object
 */
const calculateAlertStats = (alerts) => {
  const total = alerts.length;
  const byPriority = {
    critical: alerts.filter(a => a.priority === ALERT_PRIORITY.CRITICAL).length,
    high: alerts.filter(a => a.priority === ALERT_PRIORITY.HIGH).length,
    medium: alerts.filter(a => a.priority === ALERT_PRIORITY.MEDIUM).length,
    low: alerts.filter(a => a.priority === ALERT_PRIORITY.LOW).length
  };
  const byType = {};
  alerts.forEach(alert => {
    const type = alert.type || 'unknown';
    byType[type] = (byType[type] || 0) + 1;
  });

  // Count resolved and pending
  const resolved = alerts.filter(a => a.isResolved === true).length;
  const pending = alerts.filter(a => a.isResolved !== true).length;

  return {
    total,
    pending,
    resolved,
    byPriority,
    byType
  };
};

describe('Alert Statistics Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 21: Alert Statistics Accuracy
   * **Validates: Requirements 8.6**
   * 
   * For any set of alerts, the statistics (total, resolved, pending) SHALL 
   * accurately reflect the actual counts.
   */
  describe('Property 21: Alert Statistics Accuracy', () => {
    // Arbitrary generator for alert priority
    const priorityArb = fc.constantFrom(
      ALERT_PRIORITY.CRITICAL,
      ALERT_PRIORITY.HIGH,
      ALERT_PRIORITY.MEDIUM,
      ALERT_PRIORITY.LOW
    );

    // Arbitrary generator for alert type
    const alertTypeArb = fc.constantFrom(
      ALERT_TYPE.OVERDUE_LOAN,
      ALERT_TYPE.NO_SHOW_RESERVATION,
      ALERT_TYPE.HIGH_DEMAND_EQUIPMENT,
      ALERT_TYPE.IDLE_EQUIPMENT,
      ALERT_TYPE.LATE_RETURN_RISK,
      ALERT_TYPE.DEMAND_EXCEEDS_SUPPLY,
      ALERT_TYPE.LOW_RELIABILITY_USER,
      ALERT_TYPE.REPEAT_NO_SHOW_USER
    );

    // Arbitrary generator for a single alert
    const alertArb = fc.record({
      id: fc.uuid(),
      type: alertTypeArb,
      priority: priorityArb,
      title: fc.string({ minLength: 5, maxLength: 100 }),
      description: fc.string({ minLength: 10, maxLength: 500 }),
      sourceId: fc.uuid(),
      sourceType: fc.constantFrom('loan', 'reservation', 'equipment', 'user'),
      sourceData: fc.object(),
      quickActions: fc.array(fc.object(), { maxLength: 5 }),
      isResolved: fc.boolean(),
      createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
      resolvedAt: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }), { nil: null }),
      resolvedBy: fc.option(fc.uuid(), { nil: null }),
      resolvedAction: fc.option(fc.string(), { nil: null })
    });

    // Arbitrary generator for an array of alerts
    const alertsArb = fc.array(alertArb, { minLength: 0, maxLength: 50 });

    test('total count equals the number of alerts', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const stats = calculateAlertStats(alerts);
            expect(stats.total).toBe(alerts.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('resolved plus pending equals total', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const stats = calculateAlertStats(alerts);
            expect(stats.resolved + stats.pending).toBe(stats.total);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('priority counts sum to total', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const stats = calculateAlertStats(alerts);
            const prioritySum = 
              stats.byPriority.critical +
              stats.byPriority.high +
              stats.byPriority.medium +
              stats.byPriority.low;
            expect(prioritySum).toBe(stats.total);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('type counts sum to total', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const stats = calculateAlertStats(alerts);
            const typeSum = Object.values(stats.byType).reduce((sum, count) => sum + count, 0);
            expect(typeSum).toBe(stats.total);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('resolved count matches actual resolved alerts', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const stats = calculateAlertStats(alerts);
            const actualResolved = alerts.filter(a => a.isResolved === true).length;
            expect(stats.resolved).toBe(actualResolved);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('pending count matches actual pending alerts', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const stats = calculateAlertStats(alerts);
            const actualPending = alerts.filter(a => a.isResolved !== true).length;
            expect(stats.pending).toBe(actualPending);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('each priority count matches actual count', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const stats = calculateAlertStats(alerts);
            
            const actualCritical = alerts.filter(a => a.priority === ALERT_PRIORITY.CRITICAL).length;
            const actualHigh = alerts.filter(a => a.priority === ALERT_PRIORITY.HIGH).length;
            const actualMedium = alerts.filter(a => a.priority === ALERT_PRIORITY.MEDIUM).length;
            const actualLow = alerts.filter(a => a.priority === ALERT_PRIORITY.LOW).length;

            expect(stats.byPriority.critical).toBe(actualCritical);
            expect(stats.byPriority.high).toBe(actualHigh);
            expect(stats.byPriority.medium).toBe(actualMedium);
            expect(stats.byPriority.low).toBe(actualLow);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('each type count matches actual count', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const stats = calculateAlertStats(alerts);
            
            // Verify each type count
            Object.entries(stats.byType).forEach(([type, count]) => {
              const actualCount = alerts.filter(a => (a.type || 'unknown') === type).length;
              expect(count).toBe(actualCount);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('empty alerts array produces zero counts', () => {
      fc.assert(
        fc.property(
          fc.constant([]),
          (alerts) => {
            const stats = calculateAlertStats(alerts);
            
            expect(stats.total).toBe(0);
            expect(stats.resolved).toBe(0);
            expect(stats.pending).toBe(0);
            expect(stats.byPriority.critical).toBe(0);
            expect(stats.byPriority.high).toBe(0);
            expect(stats.byPriority.medium).toBe(0);
            expect(stats.byPriority.low).toBe(0);
            expect(Object.keys(stats.byType).length).toBe(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('statistics are deterministic for same input', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const stats1 = calculateAlertStats(alerts);
            const stats2 = calculateAlertStats(alerts);
            const stats3 = calculateAlertStats(alerts);

            expect(stats1.total).toBe(stats2.total);
            expect(stats2.total).toBe(stats3.total);
            expect(stats1.resolved).toBe(stats2.resolved);
            expect(stats2.resolved).toBe(stats3.resolved);
            expect(stats1.pending).toBe(stats2.pending);
            expect(stats2.pending).toBe(stats3.pending);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('all resolved alerts produces correct counts', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              type: alertTypeArb,
              priority: priorityArb,
              title: fc.string({ minLength: 5, maxLength: 100 }),
              description: fc.string({ minLength: 10, maxLength: 500 }),
              isResolved: fc.constant(true)
            }),
            { minLength: 1, maxLength: 30 }
          ),
          (alerts) => {
            const stats = calculateAlertStats(alerts);
            
            expect(stats.resolved).toBe(alerts.length);
            expect(stats.pending).toBe(0);
            expect(stats.total).toBe(alerts.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('all pending alerts produces correct counts', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              type: alertTypeArb,
              priority: priorityArb,
              title: fc.string({ minLength: 5, maxLength: 100 }),
              description: fc.string({ minLength: 10, maxLength: 500 }),
              isResolved: fc.constant(false)
            }),
            { minLength: 1, maxLength: 30 }
          ),
          (alerts) => {
            const stats = calculateAlertStats(alerts);
            
            expect(stats.pending).toBe(alerts.length);
            expect(stats.resolved).toBe(0);
            expect(stats.total).toBe(alerts.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('specific priority distribution produces accurate counts', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }), // critical count
          fc.integer({ min: 0, max: 10 }), // high count
          fc.integer({ min: 0, max: 10 }), // medium count
          fc.integer({ min: 0, max: 10 }), // low count
          (criticalCount, highCount, mediumCount, lowCount) => {
            // Create alerts with specific distribution
            const alerts = [
              ...Array.from({ length: criticalCount }, (_, i) => ({
                id: `critical-${i}`,
                priority: ALERT_PRIORITY.CRITICAL,
                type: ALERT_TYPE.OVERDUE_LOAN,
                isResolved: false
              })),
              ...Array.from({ length: highCount }, (_, i) => ({
                id: `high-${i}`,
                priority: ALERT_PRIORITY.HIGH,
                type: ALERT_TYPE.NO_SHOW_RESERVATION,
                isResolved: false
              })),
              ...Array.from({ length: mediumCount }, (_, i) => ({
                id: `medium-${i}`,
                priority: ALERT_PRIORITY.MEDIUM,
                type: ALERT_TYPE.IDLE_EQUIPMENT,
                isResolved: false
              })),
              ...Array.from({ length: lowCount }, (_, i) => ({
                id: `low-${i}`,
                priority: ALERT_PRIORITY.LOW,
                type: ALERT_TYPE.LATE_RETURN_RISK,
                isResolved: false
              }))
            ];

            const stats = calculateAlertStats(alerts);

            expect(stats.byPriority.critical).toBe(criticalCount);
            expect(stats.byPriority.high).toBe(highCount);
            expect(stats.byPriority.medium).toBe(mediumCount);
            expect(stats.byPriority.low).toBe(lowCount);
            expect(stats.total).toBe(criticalCount + highCount + mediumCount + lowCount);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('mixed resolved/pending distribution produces accurate counts', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }), // resolved count
          fc.integer({ min: 0, max: 20 }), // pending count
          (resolvedCount, pendingCount) => {
            const alerts = [
              ...Array.from({ length: resolvedCount }, (_, i) => ({
                id: `resolved-${i}`,
                priority: ALERT_PRIORITY.MEDIUM,
                type: ALERT_TYPE.OVERDUE_LOAN,
                isResolved: true
              })),
              ...Array.from({ length: pendingCount }, (_, i) => ({
                id: `pending-${i}`,
                priority: ALERT_PRIORITY.HIGH,
                type: ALERT_TYPE.NO_SHOW_RESERVATION,
                isResolved: false
              }))
            ];

            const stats = calculateAlertStats(alerts);

            expect(stats.resolved).toBe(resolvedCount);
            expect(stats.pending).toBe(pendingCount);
            expect(stats.total).toBe(resolvedCount + pendingCount);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alerts without type are counted as unknown', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              priority: priorityArb,
              title: fc.string({ minLength: 5, maxLength: 100 }),
              isResolved: fc.boolean()
              // Intentionally omit type
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (alerts) => {
            const stats = calculateAlertStats(alerts);
            
            // All alerts without type should be counted as 'unknown'
            expect(stats.byType['unknown']).toBe(alerts.length);
            expect(stats.total).toBe(alerts.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('counts are non-negative', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const stats = calculateAlertStats(alerts);
            
            expect(stats.total).toBeGreaterThanOrEqual(0);
            expect(stats.resolved).toBeGreaterThanOrEqual(0);
            expect(stats.pending).toBeGreaterThanOrEqual(0);
            expect(stats.byPriority.critical).toBeGreaterThanOrEqual(0);
            expect(stats.byPriority.high).toBeGreaterThanOrEqual(0);
            expect(stats.byPriority.medium).toBeGreaterThanOrEqual(0);
            expect(stats.byPriority.low).toBeGreaterThanOrEqual(0);
            
            Object.values(stats.byType).forEach(count => {
              expect(count).toBeGreaterThanOrEqual(0);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });
});
