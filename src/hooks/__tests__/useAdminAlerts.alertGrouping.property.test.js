/**
 * Property-Based Tests for Alert Grouping
 * 
 * Tests universal properties for alert grouping by priority.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Property tested:
 * - Property 17: Alert Grouping by Priority
 * 
 * **Validates: Requirements 8.2**
 */

import fc from 'fast-check';
import { ALERT_PRIORITY, ALERT_TYPE } from '../../types/adminAlert';
import { groupAlertsByPriority } from '../useAdminAlerts';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

describe('Alert Grouping Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 17: Alert Grouping by Priority
   * **Validates: Requirements 8.2**
   * 
   * For any set of alerts, when grouped by priority, each alert SHALL appear in 
   * exactly one priority group matching its priority level.
   */
  describe('Property 17: Alert Grouping by Priority', () => {
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

    test('each alert appears in exactly one priority group', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const grouped = groupAlertsByPriority(alerts);

            // Count total alerts in all groups
            const totalInGroups = 
              grouped[ALERT_PRIORITY.CRITICAL].length +
              grouped[ALERT_PRIORITY.HIGH].length +
              grouped[ALERT_PRIORITY.MEDIUM].length +
              grouped[ALERT_PRIORITY.LOW].length;

            // Total should match input length
            expect(totalInGroups).toBe(alerts.length);

            // Each alert should appear in exactly one group
            alerts.forEach(alert => {
              const priority = alert.priority || ALERT_PRIORITY.MEDIUM;
              let foundCount = 0;

              // Check all groups
              Object.values(grouped).forEach(group => {
                if (group.some(a => a.id === alert.id)) {
                  foundCount++;
                }
              });

              // Should be found exactly once
              expect(foundCount).toBe(1);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alerts are grouped by their priority level', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const grouped = groupAlertsByPriority(alerts);

            // Verify each group contains only alerts with matching priority
            Object.entries(grouped).forEach(([priority, group]) => {
              group.forEach(alert => {
                const alertPriority = alert.priority || ALERT_PRIORITY.MEDIUM;
                expect(alertPriority).toBe(priority);
              });
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('all four priority groups exist in the result', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const grouped = groupAlertsByPriority(alerts);

            // All four priority levels should have groups (even if empty)
            expect(grouped).toHaveProperty(ALERT_PRIORITY.CRITICAL);
            expect(grouped).toHaveProperty(ALERT_PRIORITY.HIGH);
            expect(grouped).toHaveProperty(ALERT_PRIORITY.MEDIUM);
            expect(grouped).toHaveProperty(ALERT_PRIORITY.LOW);

            // Each group should be an array
            expect(Array.isArray(grouped[ALERT_PRIORITY.CRITICAL])).toBe(true);
            expect(Array.isArray(grouped[ALERT_PRIORITY.HIGH])).toBe(true);
            expect(Array.isArray(grouped[ALERT_PRIORITY.MEDIUM])).toBe(true);
            expect(Array.isArray(grouped[ALERT_PRIORITY.LOW])).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alerts without priority are placed in medium priority group', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              type: alertTypeArb,
              // Intentionally omit priority
              title: fc.string({ minLength: 5, maxLength: 100 }),
              description: fc.string({ minLength: 10, maxLength: 500 })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (alerts) => {
            const grouped = groupAlertsByPriority(alerts);

            // All alerts without priority should be in medium group
            const mediumGroup = grouped[ALERT_PRIORITY.MEDIUM];
            expect(mediumGroup.length).toBe(alerts.length);

            // Other groups should be empty
            expect(grouped[ALERT_PRIORITY.CRITICAL].length).toBe(0);
            expect(grouped[ALERT_PRIORITY.HIGH].length).toBe(0);
            expect(grouped[ALERT_PRIORITY.LOW].length).toBe(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alerts with invalid priority are placed in medium priority group', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              type: alertTypeArb,
              priority: fc.constantFrom('invalid', 'unknown', 'super-high', ''),
              title: fc.string({ minLength: 5, maxLength: 100 }),
              description: fc.string({ minLength: 10, maxLength: 500 })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (alerts) => {
            const grouped = groupAlertsByPriority(alerts);

            // All alerts with invalid priority should be in medium group
            const mediumGroup = grouped[ALERT_PRIORITY.MEDIUM];
            expect(mediumGroup.length).toBe(alerts.length);

            // Other groups should be empty
            expect(grouped[ALERT_PRIORITY.CRITICAL].length).toBe(0);
            expect(grouped[ALERT_PRIORITY.HIGH].length).toBe(0);
            expect(grouped[ALERT_PRIORITY.LOW].length).toBe(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('empty alert array produces empty groups', () => {
      fc.assert(
        fc.property(
          fc.constant([]),
          (alerts) => {
            const grouped = groupAlertsByPriority(alerts);

            // All groups should be empty
            expect(grouped[ALERT_PRIORITY.CRITICAL].length).toBe(0);
            expect(grouped[ALERT_PRIORITY.HIGH].length).toBe(0);
            expect(grouped[ALERT_PRIORITY.MEDIUM].length).toBe(0);
            expect(grouped[ALERT_PRIORITY.LOW].length).toBe(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('grouping is deterministic for same input', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            // Group the same alerts multiple times
            const grouped1 = groupAlertsByPriority(alerts);
            const grouped2 = groupAlertsByPriority(alerts);
            const grouped3 = groupAlertsByPriority(alerts);

            // Results should be identical
            expect(grouped1[ALERT_PRIORITY.CRITICAL].length).toBe(grouped2[ALERT_PRIORITY.CRITICAL].length);
            expect(grouped2[ALERT_PRIORITY.CRITICAL].length).toBe(grouped3[ALERT_PRIORITY.CRITICAL].length);

            expect(grouped1[ALERT_PRIORITY.HIGH].length).toBe(grouped2[ALERT_PRIORITY.HIGH].length);
            expect(grouped2[ALERT_PRIORITY.HIGH].length).toBe(grouped3[ALERT_PRIORITY.HIGH].length);

            expect(grouped1[ALERT_PRIORITY.MEDIUM].length).toBe(grouped2[ALERT_PRIORITY.MEDIUM].length);
            expect(grouped2[ALERT_PRIORITY.MEDIUM].length).toBe(grouped3[ALERT_PRIORITY.MEDIUM].length);

            expect(grouped1[ALERT_PRIORITY.LOW].length).toBe(grouped2[ALERT_PRIORITY.LOW].length);
            expect(grouped2[ALERT_PRIORITY.LOW].length).toBe(grouped3[ALERT_PRIORITY.LOW].length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('grouping preserves alert data integrity', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const grouped = groupAlertsByPriority(alerts);

            // Collect all alerts from groups
            const allGroupedAlerts = [
              ...grouped[ALERT_PRIORITY.CRITICAL],
              ...grouped[ALERT_PRIORITY.HIGH],
              ...grouped[ALERT_PRIORITY.MEDIUM],
              ...grouped[ALERT_PRIORITY.LOW]
            ];

            // Each original alert should have a matching alert in groups
            alerts.forEach(originalAlert => {
              const foundAlert = allGroupedAlerts.find(a => a.id === originalAlert.id);
              expect(foundAlert).toBeDefined();
              
              // Verify data integrity
              expect(foundAlert.id).toBe(originalAlert.id);
              expect(foundAlert.type).toBe(originalAlert.type);
              expect(foundAlert.title).toBe(originalAlert.title);
              expect(foundAlert.description).toBe(originalAlert.description);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('group counts sum to total alert count', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const grouped = groupAlertsByPriority(alerts);

            const criticalCount = grouped[ALERT_PRIORITY.CRITICAL].length;
            const highCount = grouped[ALERT_PRIORITY.HIGH].length;
            const mediumCount = grouped[ALERT_PRIORITY.MEDIUM].length;
            const lowCount = grouped[ALERT_PRIORITY.LOW].length;

            const totalGrouped = criticalCount + highCount + mediumCount + lowCount;

            expect(totalGrouped).toBe(alerts.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alerts with same priority are all in the same group', () => {
      fc.assert(
        fc.property(
          priorityArb,
          fc.integer({ min: 1, max: 20 }),
          (priority, count) => {
            // Create alerts all with the same priority
            const alerts = Array.from({ length: count }, (_, i) => ({
              id: `alert-${i}`,
              type: ALERT_TYPE.OVERDUE_LOAN,
              priority: priority,
              title: `Alert ${i}`,
              description: `Description ${i}`
            }));

            const grouped = groupAlertsByPriority(alerts);

            // All alerts should be in the group matching their priority
            expect(grouped[priority].length).toBe(count);

            // Other groups should be empty
            Object.entries(grouped).forEach(([groupPriority, group]) => {
              if (groupPriority === priority) {
                expect(group.length).toBe(count);
              } else {
                expect(group.length).toBe(0);
              }
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('grouping handles mixed priority distributions', () => {
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
                title: `Critical ${i}`,
                description: `Critical alert ${i}`
              })),
              ...Array.from({ length: highCount }, (_, i) => ({
                id: `high-${i}`,
                priority: ALERT_PRIORITY.HIGH,
                type: ALERT_TYPE.NO_SHOW_RESERVATION,
                title: `High ${i}`,
                description: `High alert ${i}`
              })),
              ...Array.from({ length: mediumCount }, (_, i) => ({
                id: `medium-${i}`,
                priority: ALERT_PRIORITY.MEDIUM,
                type: ALERT_TYPE.IDLE_EQUIPMENT,
                title: `Medium ${i}`,
                description: `Medium alert ${i}`
              })),
              ...Array.from({ length: lowCount }, (_, i) => ({
                id: `low-${i}`,
                priority: ALERT_PRIORITY.LOW,
                type: ALERT_TYPE.LATE_RETURN_RISK,
                title: `Low ${i}`,
                description: `Low alert ${i}`
              }))
            ];

            const grouped = groupAlertsByPriority(alerts);

            // Verify each group has the expected count
            expect(grouped[ALERT_PRIORITY.CRITICAL].length).toBe(criticalCount);
            expect(grouped[ALERT_PRIORITY.HIGH].length).toBe(highCount);
            expect(grouped[ALERT_PRIORITY.MEDIUM].length).toBe(mediumCount);
            expect(grouped[ALERT_PRIORITY.LOW].length).toBe(lowCount);

            // Verify total
            const total = criticalCount + highCount + mediumCount + lowCount;
            expect(alerts.length).toBe(total);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('grouping does not modify original alert array', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            // Create a deep copy for comparison
            const originalAlerts = JSON.parse(JSON.stringify(alerts));

            // Group the alerts
            groupAlertsByPriority(alerts);

            // Original array should be unchanged
            expect(alerts.length).toBe(originalAlerts.length);
            alerts.forEach((alert, index) => {
              expect(alert.id).toBe(originalAlerts[index].id);
              expect(alert.priority).toBe(originalAlerts[index].priority);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('no alerts are lost during grouping', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const grouped = groupAlertsByPriority(alerts);

            // Collect all alert IDs from original array
            const originalIds = new Set(alerts.map(a => a.id));

            // Collect all alert IDs from grouped result
            const groupedIds = new Set();
            Object.values(grouped).forEach(group => {
              group.forEach(alert => {
                groupedIds.add(alert.id);
              });
            });

            // Sets should be identical
            expect(groupedIds.size).toBe(originalIds.size);
            originalIds.forEach(id => {
              expect(groupedIds.has(id)).toBe(true);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('no duplicate alerts appear in groups', () => {
      fc.assert(
        fc.property(
          alertsArb,
          (alerts) => {
            const grouped = groupAlertsByPriority(alerts);

            // Collect all alert IDs from groups
            const seenIds = new Set();
            let duplicateFound = false;

            Object.values(grouped).forEach(group => {
              group.forEach(alert => {
                if (seenIds.has(alert.id)) {
                  duplicateFound = true;
                }
                seenIds.add(alert.id);
              });
            });

            // No duplicates should be found
            expect(duplicateFound).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });
});
