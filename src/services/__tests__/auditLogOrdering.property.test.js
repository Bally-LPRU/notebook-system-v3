/**
 * Property-Based Tests for Audit Log Ordering
 * Feature: admin-settings-system, Property 17: Audit log ordering
 * Validates: Requirements 8.3
 * 
 * Property 17: Audit log ordering
 * For any audit log query, the system should return entries in reverse chronological order (newest first)
 */

import fc from 'fast-check';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import settingsService from '../settingsService';
import { db } from '../../config/firebase';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';

// Test configuration
const NUM_RUNS = 5;

describe('Property 17: Audit Log Ordering', () => {
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

  it('should return audit log entries in reverse chronological order (newest first)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate an array of setting changes
        fc.array(
          fc.record({
            adminId: fc.stringMatching(/^[a-zA-Z0-9_-]{5,30}$/),
            adminName: fc.stringMatching(/^[a-zA-Z0-9 ]{3,50}$/).filter(s => s.trim().length > 0),
            action: fc.constantFrom('create', 'update', 'delete'),
            settingType: fc.constantFrom(
              'maxLoanDuration',
              'maxAdvanceBookingDays',
              'defaultCategoryLimit'
            ),
            settingPath: fc.stringMatching(/^[a-zA-Z0-9._/-]{10,100}$/),
            oldValue: fc.integer({ min: 1, max: 100 }),
            newValue: fc.integer({ min: 1, max: 100 })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (changes) => {
          try {
            // Create audit log entries with small delays to ensure different timestamps
            const logIds = [];
            for (const change of changes) {
              const logId = await settingsService.logSettingChange(change);
              logIds.push(logId);
              // Small delay to ensure different timestamps
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Retrieve all audit logs
            const auditLogs = await settingsService.getAuditLog({});

            // Verify we got all the logs
            expect(auditLogs.length).toBeGreaterThanOrEqual(changes.length);

            // Verify logs are in reverse chronological order (newest first)
            for (let i = 0; i < auditLogs.length - 1; i++) {
              const currentTimestamp = auditLogs[i].timestamp.getTime();
              const nextTimestamp = auditLogs[i + 1].timestamp.getTime();
              
              // Current entry should be newer than or equal to next entry
              expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
            }

            // Verify the first entry is the most recent one we created
            const firstLog = auditLogs[0];
            const lastChange = changes[changes.length - 1];
            expect(firstLog.adminId).toBe(lastChange.adminId);
            expect(firstLog.settingType).toBe(lastChange.settingType);
          } catch (error) {
            console.error('Test failed with error:', error);
            console.error('Number of changes:', changes.length);
            throw error;
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 180000); // 3 minute timeout

  it('should maintain ordering when filtering by date range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            adminId: fc.stringMatching(/^[a-zA-Z0-9_-]{5,30}$/),
            adminName: fc.stringMatching(/^[a-zA-Z0-9 ]{3,50}$/).filter(s => s.trim().length > 0),
            action: fc.constant('update'),
            settingType: fc.constant('maxLoanDuration'),
            settingPath: fc.constant('systemSettings.maxLoanDuration'),
            oldValue: fc.integer({ min: 1, max: 50 }),
            newValue: fc.integer({ min: 51, max: 100 })
          }),
          { minLength: 3, maxLength: 8 }
        ),
        async (changes) => {
          try {
            // Create audit log entries
            for (const change of changes) {
              await settingsService.logSettingChange(change);
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Get all logs to determine date range
            const allLogs = await settingsService.getAuditLog({});
            
            if (allLogs.length < 2) {
              return; // Skip if not enough logs
            }

            // Use a date range that includes all logs
            const startDate = new Date(allLogs[allLogs.length - 1].timestamp.getTime() - 1000);
            const endDate = new Date(allLogs[0].timestamp.getTime() + 1000);

            // Retrieve logs with date filter
            const filteredLogs = await settingsService.getAuditLog({
              startDate,
              endDate
            });

            // Verify ordering is maintained
            for (let i = 0; i < filteredLogs.length - 1; i++) {
              const currentTimestamp = filteredLogs[i].timestamp.getTime();
              const nextTimestamp = filteredLogs[i + 1].timestamp.getTime();
              expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
            }
          } catch (error) {
            console.error('Test failed with error:', error);
            throw error;
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 180000);

  it('should maintain ordering when filtering by setting type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            adminId: fc.stringMatching(/^[a-zA-Z0-9_-]{5,30}$/),
            adminName: fc.stringMatching(/^[a-zA-Z0-9 ]{3,50}$/).filter(s => s.trim().length > 0),
            action: fc.constant('update'),
            settingType: fc.constantFrom('maxLoanDuration', 'maxAdvanceBookingDays'),
            settingPath: fc.stringMatching(/^[a-zA-Z0-9._/-]{10,100}$/),
            oldValue: fc.integer({ min: 1, max: 50 }),
            newValue: fc.integer({ min: 51, max: 100 })
          }),
          { minLength: 3, maxLength: 8 }
        ),
        async (changes) => {
          try {
            // Create audit log entries
            for (const change of changes) {
              await settingsService.logSettingChange(change);
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Pick a setting type that exists in our changes
            const settingType = changes[0].settingType;

            // Retrieve logs filtered by setting type
            const filteredLogs = await settingsService.getAuditLog({
              settingType
            });

            // Verify all returned logs match the filter
            filteredLogs.forEach(log => {
              expect(log.settingType).toBe(settingType);
            });

            // Verify ordering is maintained
            for (let i = 0; i < filteredLogs.length - 1; i++) {
              const currentTimestamp = filteredLogs[i].timestamp.getTime();
              const nextTimestamp = filteredLogs[i + 1].timestamp.getTime();
              expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
            }
          } catch (error) {
            console.error('Test failed with error:', error);
            throw error;
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 180000);
});
