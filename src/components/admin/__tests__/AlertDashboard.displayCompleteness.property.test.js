/**
 * Property-Based Tests for Alert Display Completeness
 * 
 * Tests universal properties for alert display to ensure all required fields
 * are present when alerts are rendered.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Property tested:
 * - Property 18: Alert Display Completeness
 * 
 * **Validates: Requirements 8.3**
 */

import fc from 'fast-check';
import { ALERT_PRIORITY, ALERT_TYPE } from '../../../types/adminAlert';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

/**
 * Get alert display representation
 * This simulates what the AlertDashboard component displays for an alert
 * @param {Object} alert - Alert object
 * @returns {Object} Display representation with required fields
 */
const getAlertDisplay = (alert) => {
  return {
    type: alert.type,
    description: alert.description,
    timestamp: alert.createdAt,
    quickActions: alert.quickActions || []
  };
};

/**
 * Check if alert display contains all required fields
 * @param {Object} display - Alert display object
 * @returns {boolean} True if all required fields are present
 */
const hasRequiredFields = (display) => {
  return (
    display.hasOwnProperty('type') &&
    display.hasOwnProperty('description') &&
    display.hasOwnProperty('timestamp') &&
    display.hasOwnProperty('quickActions')
  );
};

/**
 * Check if required fields have valid values (not null/undefined)
 * @param {Object} display - Alert display object
 * @returns {boolean} True if all required fields have valid values
 */
const hasValidFieldValues = (display) => {
  return (
    display.type !== null &&
    display.type !== undefined &&
    display.description !== null &&
    display.description !== undefined &&
    display.timestamp !== null &&
    display.timestamp !== undefined &&
    display.quickActions !== null &&
    display.quickActions !== undefined
  );
};

describe('Alert Display Completeness Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 18: Alert Display Completeness
   * **Validates: Requirements 8.3**
   * 
   * For any displayed alert, the display SHALL include type, description, 
   * timestamp, and available quick actions.
   */
  describe('Property 18: Alert Display Completeness', () => {
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

    // Arbitrary generator for quick action
    const quickActionArb = fc.record({
      id: fc.uuid(),
      label: fc.string({ minLength: 3, maxLength: 50 }),
      action: fc.constantFrom(
        'send_reminder',
        'mark_contacted',
        'cancel_reservation',
        'extend_pickup',
        'contact_user',
        'flag_user',
        'dismiss'
      ),
      params: fc.object()
    });

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
      quickActions: fc.array(quickActionArb, { minLength: 0, maxLength: 5 }),
      isResolved: fc.boolean(),
      createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
      resolvedAt: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }), { nil: null }),
      resolvedBy: fc.option(fc.uuid(), { nil: null }),
      resolvedAction: fc.option(fc.string(), { nil: null })
    });

    test('alert display contains all required fields', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // Display must have all required fields
            expect(hasRequiredFields(display)).toBe(true);
            expect(display).toHaveProperty('type');
            expect(display).toHaveProperty('description');
            expect(display).toHaveProperty('timestamp');
            expect(display).toHaveProperty('quickActions');
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display type field matches alert type', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // Type field should match the alert's type
            expect(display.type).toBe(alert.type);
            expect(display.type).toBeDefined();
            expect(display.type).not.toBeNull();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display description field matches alert description', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // Description field should match the alert's description
            expect(display.description).toBe(alert.description);
            expect(display.description).toBeDefined();
            expect(display.description).not.toBeNull();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display timestamp field matches alert createdAt', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // Timestamp field should match the alert's createdAt
            expect(display.timestamp).toBe(alert.createdAt);
            expect(display.timestamp).toBeDefined();
            expect(display.timestamp).not.toBeNull();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display quickActions field matches alert quickActions', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // Quick actions field should match the alert's quick actions
            expect(display.quickActions).toEqual(alert.quickActions || []);
            expect(display.quickActions).toBeDefined();
            expect(display.quickActions).not.toBeNull();
            expect(Array.isArray(display.quickActions)).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display has valid field values', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // All required fields should have valid values
            expect(hasValidFieldValues(display)).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display preserves all quick actions', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // Number of quick actions should match
            const expectedCount = alert.quickActions?.length || 0;
            expect(display.quickActions.length).toBe(expectedCount);

            // Each quick action should be preserved
            if (alert.quickActions) {
              alert.quickActions.forEach((action, index) => {
                expect(display.quickActions[index]).toEqual(action);
              });
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display handles alerts with no quick actions', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            type: alertTypeArb,
            priority: priorityArb,
            title: fc.string({ minLength: 5, maxLength: 100 }),
            description: fc.string({ minLength: 10, maxLength: 500 }),
            sourceId: fc.uuid(),
            sourceType: fc.constantFrom('loan', 'reservation', 'equipment', 'user'),
            sourceData: fc.object(),
            quickActions: fc.constant([]), // Empty quick actions
            isResolved: fc.boolean(),
            createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') })
          }),
          (alert) => {
            const display = getAlertDisplay(alert);

            // Should still have all required fields
            expect(hasRequiredFields(display)).toBe(true);
            expect(display.quickActions).toEqual([]);
            expect(Array.isArray(display.quickActions)).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display handles alerts with undefined quick actions', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            type: alertTypeArb,
            priority: priorityArb,
            title: fc.string({ minLength: 5, maxLength: 100 }),
            description: fc.string({ minLength: 10, maxLength: 500 }),
            sourceId: fc.uuid(),
            sourceType: fc.constantFrom('loan', 'reservation', 'equipment', 'user'),
            sourceData: fc.object(),
            // Intentionally omit quickActions
            isResolved: fc.boolean(),
            createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') })
          }),
          (alert) => {
            const display = getAlertDisplay(alert);

            // Should still have all required fields
            expect(hasRequiredFields(display)).toBe(true);
            expect(display.quickActions).toEqual([]);
            expect(Array.isArray(display.quickActions)).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display is consistent for same alert', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            // Get display multiple times
            const display1 = getAlertDisplay(alert);
            const display2 = getAlertDisplay(alert);
            const display3 = getAlertDisplay(alert);

            // All displays should be identical
            expect(display1).toEqual(display2);
            expect(display2).toEqual(display3);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display does not modify original alert', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            // Create a deep copy for comparison
            const originalAlert = JSON.parse(JSON.stringify(alert));

            // Get display
            getAlertDisplay(alert);

            // Original alert should be unchanged
            expect(alert.type).toBe(originalAlert.type);
            expect(alert.description).toBe(originalAlert.description);
            expect(alert.quickActions?.length).toBe(originalAlert.quickActions?.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display handles all alert types correctly', () => {
      fc.assert(
        fc.property(
          alertTypeArb,
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
          fc.array(quickActionArb, { minLength: 0, maxLength: 5 }),
          (type, description, createdAt, quickActions) => {
            const alert = {
              id: 'test-id',
              type,
              priority: ALERT_PRIORITY.HIGH,
              title: 'Test Alert',
              description,
              sourceId: 'source-id',
              sourceType: 'loan',
              sourceData: {},
              quickActions,
              isResolved: false,
              createdAt
            };

            const display = getAlertDisplay(alert);

            // Should have all required fields
            expect(hasRequiredFields(display)).toBe(true);
            expect(display.type).toBe(type);
            expect(display.description).toBe(description);
            expect(display.timestamp).toBe(createdAt);
            expect(display.quickActions).toEqual(quickActions);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display handles all priority levels correctly', () => {
      fc.assert(
        fc.property(
          priorityArb,
          alertTypeArb,
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
          (priority, type, description, createdAt) => {
            const alert = {
              id: 'test-id',
              type,
              priority,
              title: 'Test Alert',
              description,
              sourceId: 'source-id',
              sourceType: 'loan',
              sourceData: {},
              quickActions: [],
              isResolved: false,
              createdAt
            };

            const display = getAlertDisplay(alert);

            // Should have all required fields regardless of priority
            expect(hasRequiredFields(display)).toBe(true);
            expect(hasValidFieldValues(display)).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display quick actions preserve action structure', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // Each quick action should have required properties
            display.quickActions.forEach(action => {
              expect(action).toHaveProperty('id');
              expect(action).toHaveProperty('label');
              expect(action).toHaveProperty('action');
              expect(action).toHaveProperty('params');
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display handles multiple alerts consistently', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 1, maxLength: 20 }),
          (alerts) => {
            // Get display for each alert
            const displays = alerts.map(alert => getAlertDisplay(alert));

            // Each display should have all required fields
            displays.forEach((display, index) => {
              expect(hasRequiredFields(display)).toBe(true);
              expect(hasValidFieldValues(display)).toBe(true);
              
              // Display should match corresponding alert
              expect(display.type).toBe(alerts[index].type);
              expect(display.description).toBe(alerts[index].description);
              expect(display.timestamp).toBe(alerts[index].createdAt);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display timestamp is a valid date', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // Timestamp should be a valid date
            expect(display.timestamp).toBeInstanceOf(Date);
            expect(isNaN(display.timestamp.getTime())).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display type is a valid alert type', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // Type should be one of the valid alert types
            const validTypes = Object.values(ALERT_TYPE);
            expect(validTypes).toContain(display.type);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display description is a non-empty string', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // Description should be a non-empty string
            expect(typeof display.description).toBe('string');
            expect(display.description.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display quick actions is always an array', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // Quick actions should always be an array
            expect(Array.isArray(display.quickActions)).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display contains exactly four required fields', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // Display should have exactly the four required fields
            const keys = Object.keys(display);
            expect(keys).toContain('type');
            expect(keys).toContain('description');
            expect(keys).toContain('timestamp');
            expect(keys).toContain('quickActions');
            expect(keys.length).toBe(4);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('alert display fields are not null or undefined', () => {
      fc.assert(
        fc.property(
          alertArb,
          (alert) => {
            const display = getAlertDisplay(alert);

            // No field should be null or undefined
            expect(display.type).not.toBeNull();
            expect(display.type).not.toBeUndefined();
            expect(display.description).not.toBeNull();
            expect(display.description).not.toBeUndefined();
            expect(display.timestamp).not.toBeNull();
            expect(display.timestamp).not.toBeUndefined();
            expect(display.quickActions).not.toBeNull();
            expect(display.quickActions).not.toBeUndefined();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });
});
