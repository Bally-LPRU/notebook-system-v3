/**
 * Property-Based Tests for Critical Setting Notifications
 * Feature: admin-settings-system, Property 18: Critical setting notifications
 * Validates: Requirements 8.5
 * 
 * Property 18: Critical setting notifications
 * For any critical setting change (loan duration, category limits, closed dates),
 * the system should send notifications to all system administrators
 */

import fc from 'fast-check';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import settingsService from '../settingsService';
import { CRITICAL_SETTINGS } from '../../types/settings';
import { db } from '../../config/firebase';
import { collection, getDocs, deleteDoc, addDoc, doc, setDoc } from 'firebase/firestore';

// Test configuration
const NUM_RUNS = 5;

// Mock Discord webhook service
const mockNotifyCriticalSettingChange = jest.fn().mockResolvedValue({ success: true });
jest.mock('../discordWebhookService', () => ({
  __esModule: true,
  default: {
    notifyCriticalSettingChange: mockNotifyCriticalSettingChange
  }
}));

// Mock notification service
const mockCreateNotification = jest.fn().mockResolvedValue('notification-id');
jest.mock('../notificationService', () => ({
  __esModule: true,
  default: {
    createNotification: mockCreateNotification
  }
}));

describe('Property 18: Critical Setting Notifications', () => {
  let testAdminIds = [];

  // Set up test admin users before each test
  beforeEach(async () => {
    // Clear mocks before each test
    mockNotifyCriticalSettingChange.mockClear();
    mockCreateNotification.mockClear();
    
    try {
      // Create a few test admin users
      const usersRef = collection(db, 'users');
      testAdminIds = [];
      
      for (let i = 0; i < 3; i++) {
        const adminId = `test-admin-${Date.now()}-${i}`;
        await setDoc(doc(usersRef, adminId), {
          uid: adminId,
          role: 'admin',
          email: `admin${i}@test.com`,
          displayName: `Test Admin ${i}`
        });
        testAdminIds.push(adminId);
      }
    } catch (error) {
      console.error('Error setting up test admins:', error);
    }
  });

  // Clean up after each test
  afterEach(async () => {
    try {
      // Clean up audit logs
      const auditLogRef = collection(db, 'settingsAuditLog');
      const auditSnapshot = await getDocs(auditLogRef);
      const auditDeletePromises = auditSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(auditDeletePromises);

      // Clean up test admin users
      const usersRef = collection(db, 'users');
      const deleteUserPromises = testAdminIds.map(adminId => 
        deleteDoc(doc(usersRef, adminId))
      );
      await Promise.all(deleteUserPromises);
      testAdminIds = [];

      // Clear mocks
      jest.clearAllMocks();
    } catch (error) {
      console.error('Error cleaning up:', error);
    }
  });

  it('should send notifications for critical setting changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          adminId: fc.stringMatching(/^[a-zA-Z0-9_-]{5,30}$/),
          adminName: fc.stringMatching(/^[a-zA-Z0-9 ]{3,50}$/).filter(s => s.trim().length > 0),
          action: fc.constant('update'),
          settingType: fc.constantFrom(...CRITICAL_SETTINGS),
          settingPath: fc.stringMatching(/^[a-zA-Z0-9._/-]{10,100}$/),
          oldValue: fc.integer({ min: 1, max: 50 }),
          newValue: fc.integer({ min: 51, max: 100 })
        }),
        async (change) => {
          try {
            // Log the critical setting change
            await settingsService.logSettingChange(change);

            // Wait a bit for async notifications to process
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify Discord webhook was called
            expect(mockNotifyCriticalSettingChange).toHaveBeenCalled();
            
            const discordCall = mockNotifyCriticalSettingChange.mock.calls[0][0];
            expect(discordCall.settingName).toBe(change.settingType);
            expect(discordCall.adminName).toBe(change.adminName);
            expect(discordCall.oldValue).toBe(change.oldValue);
            expect(discordCall.newValue).toBe(change.newValue);

            // Verify notifications were sent to all admins
            expect(mockCreateNotification).toHaveBeenCalled();
            
            // Should be called once for each admin
            const notificationCalls = mockCreateNotification.mock.calls;
            expect(notificationCalls.length).toBeGreaterThanOrEqual(testAdminIds.length);

            // Verify each admin received a notification
            const notifiedAdminIds = notificationCalls.map(call => call[0]);
            testAdminIds.forEach(adminId => {
              expect(notifiedAdminIds).toContain(adminId);
            });

            // Verify notification content
            const firstNotificationCall = notificationCalls[0];
            expect(firstNotificationCall[1]).toBe('critical_setting_change'); // type
            expect(firstNotificationCall[2]).toContain(change.settingType); // title
            expect(firstNotificationCall[3]).toContain(change.adminName); // message
          } catch (error) {
            console.error('Test failed with error:', error);
            console.error('Change data:', JSON.stringify(change, null, 2));
            throw error;
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 180000);

  it('should not send notifications for non-critical setting changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          adminId: fc.stringMatching(/^[a-zA-Z0-9_-]{5,30}$/),
          adminName: fc.stringMatching(/^[a-zA-Z0-9 ]{3,50}$/).filter(s => s.trim().length > 0),
          action: fc.constant('update'),
          settingType: fc.constant('discordEnabled'), // Non-critical setting
          settingPath: fc.constant('systemSettings.discordEnabled'),
          oldValue: fc.boolean(),
          newValue: fc.boolean()
        }),
        async (change) => {
          try {
            // Clear previous calls
            mockNotifyCriticalSettingChange.mockClear();
            mockCreateNotification.mockClear();

            // Log the non-critical setting change
            await settingsService.logSettingChange(change);

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify no notifications were sent
            expect(mockNotifyCriticalSettingChange).not.toHaveBeenCalled();
            expect(mockCreateNotification).not.toHaveBeenCalled();
          } catch (error) {
            console.error('Test failed with error:', error);
            throw error;
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 180000);

  it('should include old and new values in notification', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          adminId: fc.stringMatching(/^[a-zA-Z0-9_-]{5,30}$/),
          adminName: fc.stringMatching(/^[a-zA-Z0-9 ]{3,50}$/).filter(s => s.trim().length > 0),
          action: fc.constant('update'),
          settingType: fc.constant('maxLoanDuration'),
          settingPath: fc.constant('systemSettings.maxLoanDuration'),
          oldValue: fc.integer({ min: 1, max: 30 }),
          newValue: fc.integer({ min: 31, max: 100 }),
          reason: fc.option(fc.stringMatching(/^[a-zA-Z0-9 .,!?-]{10,100}$/), { nil: null })
        }),
        async (change) => {
          try {
            // Clear previous calls
            mockNotifyCriticalSettingChange.mockClear();
            mockCreateNotification.mockClear();

            // Log the change
            await settingsService.logSettingChange(change);

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify Discord notification includes old and new values
            expect(mockNotifyCriticalSettingChange).toHaveBeenCalled();
            
            const discordCall = mockNotifyCriticalSettingChange.mock.calls[0][0];
            expect(discordCall.oldValue).toBe(change.oldValue);
            expect(discordCall.newValue).toBe(change.newValue);
            
            if (change.reason) {
              expect(discordCall.reason).toBe(change.reason);
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
