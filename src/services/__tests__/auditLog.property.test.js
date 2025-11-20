/**
 * Property-Based Tests for Audit Log Creation
 * Feature: admin-settings-system, Property 16: Audit log creation
 * Validates: Requirements 8.1, 8.2
 * 
 * Property 16: Audit log creation
 * For any setting modification, the system should create an audit log entry containing
 * administrator ID, timestamp, setting name, old value, and new value
 */

import fc from 'fast-check';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import settingsService from '../settingsService';
import { db } from '../../config/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';

// Test configuration
const NUM_RUNS = 5;

describe('Property 16: Audit Log Creation', () => {
  // Clean up audit logs after each test
  afterEach(async () => {
    try {
      const auditLogRef = collection(db, 'settingsAuditLog');
      const snapshot = await getDocs(auditLogRef);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
    }
  });

  it('should create audit log entry with all required fields for any setting change', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random setting changes
        fc.record({
          adminId: fc.stringMatching(/^[a-zA-Z0-9_-]{5,30}$/),
          adminName: fc.stringMatching(/^[a-zA-Z0-9 ]{3,50}$/).filter(s => s.trim().length > 0),
          action: fc.constantFrom('create', 'update', 'delete'),
          settingType: fc.constantFrom(
            'maxLoanDuration',
            'maxAdvanceBookingDays',
            'defaultCategoryLimit',
            'closedDate',
            'categoryLimit',
            'discordWebhookUrl'
          ),
          settingPath: fc.stringMatching(/^[a-zA-Z0-9._/-]{10,100}$/),
          oldValue: fc.oneof(
            fc.constant(null),
            fc.integer({ min: 1, max: 365 }),
            fc.stringMatching(/^[a-zA-Z0-9 ._-]{0,200}$/),
            fc.boolean()
          ),
          newValue: fc.oneof(
            fc.constant(null),
            fc.integer({ min: 1, max: 365 }),
            fc.stringMatching(/^[a-zA-Z0-9 ._-]{0,200}$/),
            fc.boolean()
          ),
          reason: fc.option(fc.stringMatching(/^[a-zA-Z0-9 .,!?-]{0,200}$/), { nil: null }),
          ipAddress: fc.option(
            fc.tuple(
              fc.integer({ min: 0, max: 255 }),
              fc.integer({ min: 0, max: 255 }),
              fc.integer({ min: 0, max: 255 }),
              fc.integer({ min: 0, max: 255 })
            ).map(parts => parts.join('.')),
            { nil: 'unknown' }
          ),
          userAgent: fc.option(fc.stringMatching(/^[a-zA-Z0-9 ./_()-]{0,200}$/), { nil: 'unknown' })
        }),
        async (change) => {
          try {
            // Log the setting change
            const logId = await settingsService.logSettingChange(change);

            // Verify the log entry was created
            expect(logId).toBeDefined();
            expect(typeof logId).toBe('string');
            expect(logId.length).toBeGreaterThan(0);

            // Retrieve the audit log entry
            const auditLogs = await settingsService.getAuditLog({ limit: 1 });
            expect(auditLogs.length).toBeGreaterThan(0);

            const logEntry = auditLogs[0];

            // Verify all required fields are present
            expect(logEntry.id).toBe(logId);
            expect(logEntry.adminId).toBe(change.adminId);
            expect(logEntry.adminName).toBe(change.adminName);
            expect(logEntry.action).toBe(change.action);
            expect(logEntry.settingType).toBe(change.settingType);
            expect(logEntry.settingPath).toBe(change.settingPath);
            
            // Verify old and new values (handle null/undefined)
            if (change.oldValue !== undefined) {
              expect(logEntry.oldValue).toEqual(change.oldValue);
            }
            if (change.newValue !== undefined) {
              expect(logEntry.newValue).toEqual(change.newValue);
            }

            // Verify optional fields
            if (change.reason) {
              expect(logEntry.reason).toBe(change.reason);
            }
            
            expect(logEntry.ipAddress).toBeDefined();
            expect(logEntry.userAgent).toBeDefined();

            // Verify timestamp exists and is a Date
            expect(logEntry.timestamp).toBeDefined();
            expect(logEntry.timestamp instanceof Date).toBe(true);
            
            // Verify timestamp is recent (within last minute)
            const now = new Date();
            const timeDiff = now - logEntry.timestamp;
            expect(timeDiff).toBeGreaterThanOrEqual(0);
            expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
          } catch (error) {
            console.error('Test failed with error:', error);
            console.error('Change data:', JSON.stringify(change, null, 2));
            throw error;
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 120000); // 2 minute timeout for property test

  it('should preserve data types in audit log entries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          adminId: fc.stringMatching(/^[a-zA-Z0-9_-]{5,30}$/),
          adminName: fc.stringMatching(/^[a-zA-Z0-9 ]{3,50}$/).filter(s => s.trim().length > 0),
          action: fc.constant('update'),
          settingType: fc.constant('maxLoanDuration'),
          settingPath: fc.constant('systemSettings.maxLoanDuration'),
          oldValue: fc.integer({ min: 1, max: 100 }),
          newValue: fc.integer({ min: 1, max: 100 })
        }),
        async (change) => {
          // Log the change
          await settingsService.logSettingChange(change);

          // Retrieve and verify
          const auditLogs = await settingsService.getAuditLog({ limit: 1 });
          const logEntry = auditLogs[0];

          // Verify integer values are preserved as numbers
          expect(typeof logEntry.oldValue).toBe('number');
          expect(typeof logEntry.newValue).toBe('number');
          expect(logEntry.oldValue).toBe(change.oldValue);
          expect(logEntry.newValue).toBe(change.newValue);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 120000);

  it('should handle null values correctly in audit log', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          adminId: fc.stringMatching(/^[a-zA-Z0-9_-]{5,30}$/),
          adminName: fc.stringMatching(/^[a-zA-Z0-9 ]{3,50}$/).filter(s => s.trim().length > 0),
          action: fc.constantFrom('create', 'delete'),
          settingType: fc.constant('closedDate'),
          settingPath: fc.stringMatching(/^[a-zA-Z0-9._/-]{10,100}$/)
        }),
        async (change) => {
          // For create action, oldValue should be null
          // For delete action, newValue should be null
          const changeWithNulls = {
            ...change,
            oldValue: change.action === 'create' ? null : 'some-value',
            newValue: change.action === 'delete' ? null : 'some-value'
          };

          await settingsService.logSettingChange(changeWithNulls);

          const auditLogs = await settingsService.getAuditLog({ limit: 1 });
          const logEntry = auditLogs[0];

          if (change.action === 'create') {
            expect(logEntry.oldValue).toBeNull();
            expect(logEntry.newValue).toBe('some-value');
          } else {
            expect(logEntry.oldValue).toBe('some-value');
            expect(logEntry.newValue).toBeNull();
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 120000);
});
