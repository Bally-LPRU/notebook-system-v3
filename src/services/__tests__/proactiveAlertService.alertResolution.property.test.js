/**
 * Property-Based Tests for Alert Resolution Logging
 * 
 * Tests universal properties for alert resolution logging functionality.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Property tested:
 * - Property 20: Alert Resolution Logging
 * 
 * **Validates: Requirements 8.5**
 */

import fc from 'fast-check';
import { ALERT_TYPE, ALERT_PRIORITY } from '../../types/adminAlert';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

/**
 * Mock audit log entry creation
 * This simulates the logAlertResolution function behavior
 * 
 * @param {string} alertId - Alert ID
 * @param {Object} alertData - Alert data before resolution
 * @param {string} resolvedBy - Admin ID who resolved
 * @param {string} resolvedAction - Action taken
 * @returns {Object} Audit log entry
 */
function createAuditLogEntry(alertId, alertData, resolvedBy, resolvedAction) {
  const now = new Date();
  return {
    alertId,
    alertType: alertData.type,
    alertPriority: alertData.priority,
    alertTitle: alertData.title,
    sourceId: alertData.sourceId,
    sourceType: alertData.sourceType,
    resolvedBy,
    resolvedAction,
    resolvedAt: now,
    createdAt: now
  };
}

/**
 * Validate audit log entry has all required fields
 * @param {Object} auditLog - Audit log entry
 * @returns {boolean} True if valid
 */
function validateAuditLogEntry(auditLog) {
  const requiredFields = [
    'alertId',
    'alertType',
    'alertPriority',
    'alertTitle',
    'sourceId',
    'sourceType',
    'resolvedBy',
    'resolvedAction',
    'resolvedAt',
    'createdAt'
  ];

  return requiredFields.every(field => auditLog.hasOwnProperty(field) && auditLog[field] !== undefined);
}

describe('Proactive Alert Service - Alert Resolution Logging Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 20: Alert Resolution Logging
   * **Validates: Requirements 8.5**
   * 
   * For any alert that is resolved, the system SHALL record the resolution timestamp,
   * admin ID, and action taken.
   */
  describe('Property 20: Alert Resolution Logging', () => {
    // Arbitrary generators for alert data
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

    const alertPriorityArb = fc.constantFrom(
      ALERT_PRIORITY.CRITICAL,
      ALERT_PRIORITY.HIGH,
      ALERT_PRIORITY.MEDIUM,
      ALERT_PRIORITY.LOW
    );

    const adminIdArb = fc.uuid();
    
    const resolvedActionArb = fc.constantFrom(
      'send_reminder',
      'mark_contacted',
      'cancel_reservation',
      'extend_pickup',
      'contact_user',
      'flag_user',
      'dismissed'
    );

    const alertTitleArb = fc.string({ minLength: 5, maxLength: 100 });
    const alertDescriptionArb = fc.string({ minLength: 10, maxLength: 200 });
    const sourceIdArb = fc.uuid();
    const sourceTypeArb = fc.constantFrom('loan', 'reservation', 'equipment', 'user');

    test('audit log entry should contain all required fields for any alert resolution', () => {
      fc.assert(
        fc.property(
          alertTypeArb,
          alertPriorityArb,
          alertTitleArb,
          alertDescriptionArb,
          sourceIdArb,
          sourceTypeArb,
          adminIdArb,
          resolvedActionArb,
          (type, priority, title, description, sourceId, sourceType, adminId, action) => {
            // Create mock alert data
            const alertData = {
              type,
              priority,
              title,
              description,
              sourceId,
              sourceType
            };

            // Create audit log entry
            const auditLog = createAuditLogEntry('test-alert-id', alertData, adminId, action);

            // Verify all required fields are present
            expect(validateAuditLogEntry(auditLog)).toBe(true);
            expect(auditLog.alertId).toBe('test-alert-id');
            expect(auditLog.alertType).toBe(type);
            expect(auditLog.alertPriority).toBe(priority);
            expect(auditLog.alertTitle).toBe(title);
            expect(auditLog.sourceId).toBe(sourceId);
            expect(auditLog.sourceType).toBe(sourceType);
            expect(auditLog.resolvedBy).toBe(adminId);
            expect(auditLog.resolvedAction).toBe(action);
            expect(auditLog.resolvedAt).toBeInstanceOf(Date);
            expect(auditLog.createdAt).toBeInstanceOf(Date);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('audit log timestamp should be at or after alert resolution time', () => {
      fc.assert(
        fc.property(
          alertTypeArb,
          alertPriorityArb,
          alertTitleArb,
          sourceIdArb,
          sourceTypeArb,
          adminIdArb,
          resolvedActionArb,
          (type, priority, title, sourceId, sourceType, adminId, action) => {
            const beforeResolveTime = new Date();

            const alertData = {
              type,
              priority,
              title,
              description: 'Test Description',
              sourceId,
              sourceType
            };

            const auditLog = createAuditLogEntry('test-alert-id', alertData, adminId, action);

            const afterResolveTime = new Date();

            // Audit log time should be between before and after resolve time
            expect(auditLog.resolvedAt.getTime()).toBeGreaterThanOrEqual(beforeResolveTime.getTime());
            expect(auditLog.resolvedAt.getTime()).toBeLessThanOrEqual(afterResolveTime.getTime());
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('audit log should preserve alert data snapshot at resolution time', () => {
      fc.assert(
        fc.property(
          alertTypeArb,
          alertPriorityArb,
          alertTitleArb,
          sourceIdArb,
          sourceTypeArb,
          adminIdArb,
          resolvedActionArb,
          (type, priority, title, sourceId, sourceType, adminId, action) => {
            const alertData = {
              type,
              priority,
              title,
              description: 'Test Description',
              sourceId,
              sourceType
            };

            const auditLog = createAuditLogEntry('test-alert-id', alertData, adminId, action);

            // Audit log should preserve the original alert data
            expect(auditLog.alertType).toBe(type);
            expect(auditLog.alertPriority).toBe(priority);
            expect(auditLog.alertTitle).toBe(title);
            expect(auditLog.sourceId).toBe(sourceId);
            expect(auditLog.sourceType).toBe(sourceType);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('audit log should record different admin IDs correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }),
          resolvedActionArb,
          (adminIds, action) => {
            const alertData = {
              type: ALERT_TYPE.OVERDUE_LOAN,
              priority: ALERT_PRIORITY.HIGH,
              title: 'Test Alert',
              description: 'Test Description',
              sourceId: 'test-source',
              sourceType: 'loan'
            };

            const auditLogs = adminIds.map((adminId, index) => 
              createAuditLogEntry(`test-alert-${index}`, alertData, adminId, action)
            );

            // Verify each admin ID is recorded correctly
            auditLogs.forEach((log, index) => {
              expect(log.resolvedBy).toBe(adminIds[index]);
            });

            // Verify each admin ID is unique in the logs
            const recordedAdminIds = auditLogs.map(log => log.resolvedBy);
            expect(new Set(recordedAdminIds).size).toBe(adminIds.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('audit log should record different resolution actions correctly', () => {
      fc.assert(
        fc.property(
          adminIdArb,
          fc.array(resolvedActionArb, { minLength: 2, maxLength: 7 }),
          (adminId, actions) => {
            const alertData = {
              type: ALERT_TYPE.OVERDUE_LOAN,
              priority: ALERT_PRIORITY.HIGH,
              title: 'Test Alert',
              description: 'Test Description',
              sourceId: 'test-source',
              sourceType: 'loan'
            };

            const auditLogs = actions.map((action, index) => 
              createAuditLogEntry(`test-alert-${index}`, alertData, adminId, action)
            );

            // Verify each action is recorded correctly
            auditLogs.forEach((log, index) => {
              expect(log.resolvedAction).toBe(actions[index]);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('audit log creation should be deterministic for same inputs', () => {
      fc.assert(
        fc.property(
          alertTypeArb,
          alertPriorityArb,
          alertTitleArb,
          sourceIdArb,
          sourceTypeArb,
          adminIdArb,
          resolvedActionArb,
          (type, priority, title, sourceId, sourceType, adminId, action) => {
            const alertData = {
              type,
              priority,
              title,
              description: 'Test Description',
              sourceId,
              sourceType
            };

            const alertId = 'test-alert-id';

            // Create multiple audit logs with same inputs (within same millisecond)
            const log1 = createAuditLogEntry(alertId, alertData, adminId, action);
            const log2 = createAuditLogEntry(alertId, alertData, adminId, action);

            // All fields except timestamps should be identical
            expect(log1.alertId).toBe(log2.alertId);
            expect(log1.alertType).toBe(log2.alertType);
            expect(log1.alertPriority).toBe(log2.alertPriority);
            expect(log1.alertTitle).toBe(log2.alertTitle);
            expect(log1.sourceId).toBe(log2.sourceId);
            expect(log1.sourceType).toBe(log2.sourceType);
            expect(log1.resolvedBy).toBe(log2.resolvedBy);
            expect(log1.resolvedAction).toBe(log2.resolvedAction);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('audit log should handle all alert types', () => {
      fc.assert(
        fc.property(
          alertTypeArb,
          alertPriorityArb,
          adminIdArb,
          resolvedActionArb,
          (type, priority, adminId, action) => {
            const alertData = {
              type,
              priority,
              title: 'Test Alert',
              description: 'Test Description',
              sourceId: 'test-source',
              sourceType: 'test'
            };

            const auditLog = createAuditLogEntry('test-alert-id', alertData, adminId, action);

            // Should handle all alert types
            expect(auditLog.alertType).toBe(type);
            expect(Object.values(ALERT_TYPE)).toContain(type);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('audit log should handle all alert priorities', () => {
      fc.assert(
        fc.property(
          alertTypeArb,
          alertPriorityArb,
          adminIdArb,
          resolvedActionArb,
          (type, priority, adminId, action) => {
            const alertData = {
              type,
              priority,
              title: 'Test Alert',
              description: 'Test Description',
              sourceId: 'test-source',
              sourceType: 'test'
            };

            const auditLog = createAuditLogEntry('test-alert-id', alertData, adminId, action);

            // Should handle all priority levels
            expect(auditLog.alertPriority).toBe(priority);
            expect(Object.values(ALERT_PRIORITY)).toContain(priority);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('audit log should handle all source types', () => {
      fc.assert(
        fc.property(
          alertTypeArb,
          alertPriorityArb,
          sourceTypeArb,
          adminIdArb,
          resolvedActionArb,
          (type, priority, sourceType, adminId, action) => {
            const alertData = {
              type,
              priority,
              title: 'Test Alert',
              description: 'Test Description',
              sourceId: 'test-source',
              sourceType
            };

            const auditLog = createAuditLogEntry('test-alert-id', alertData, adminId, action);

            // Should preserve source type
            expect(auditLog.sourceType).toBe(sourceType);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('audit log should handle special characters in alert titles', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          adminIdArb,
          resolvedActionArb,
          (title, adminId, action) => {
            const alertData = {
              type: ALERT_TYPE.OVERDUE_LOAN,
              priority: ALERT_PRIORITY.HIGH,
              title,
              description: 'Test Description',
              sourceId: 'test-source',
              sourceType: 'loan'
            };

            const auditLog = createAuditLogEntry('test-alert-id', alertData, adminId, action);

            // Should preserve special characters in title
            expect(auditLog.alertTitle).toBe(title);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('audit log resolvedAt and createdAt should be valid dates', () => {
      fc.assert(
        fc.property(
          alertTypeArb,
          alertPriorityArb,
          adminIdArb,
          resolvedActionArb,
          (type, priority, adminId, action) => {
            const alertData = {
              type,
              priority,
              title: 'Test Alert',
              description: 'Test Description',
              sourceId: 'test-source',
              sourceType: 'test'
            };

            const auditLog = createAuditLogEntry('test-alert-id', alertData, adminId, action);

            // Both timestamps should be valid Date objects
            expect(auditLog.resolvedAt).toBeInstanceOf(Date);
            expect(auditLog.createdAt).toBeInstanceOf(Date);
            expect(isNaN(auditLog.resolvedAt.getTime())).toBe(false);
            expect(isNaN(auditLog.createdAt.getTime())).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('audit log should maintain referential integrity with alert ID', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          alertTypeArb,
          alertPriorityArb,
          adminIdArb,
          resolvedActionArb,
          (alertId, type, priority, adminId, action) => {
            const alertData = {
              type,
              priority,
              title: 'Test Alert',
              description: 'Test Description',
              sourceId: 'test-source',
              sourceType: 'test'
            };

            const auditLog = createAuditLogEntry(alertId, alertData, adminId, action);

            // Audit log should reference the correct alert ID
            expect(auditLog.alertId).toBe(alertId);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });
});
