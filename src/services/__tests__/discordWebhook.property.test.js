/**
 * Property-Based Tests for Discord Webhook Service
 * Feature: admin-settings-system
 * 
 * Tests universal properties that should hold across all Discord webhook operations
 */

import fc from 'fast-check';
import discordWebhookService from '../discordWebhookService';

// Mock fetch globally
global.fetch = jest.fn();

describe('Discord Webhook Service - Property-Based Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    global.fetch.mockReset();
  });

  describe('Property 10: Discord webhook notification delivery', () => {
    /**
     * Feature: admin-settings-system, Property 10: Discord webhook notification delivery
     * Validates: Requirements 5.3
     * 
     * Property: For any significant system event, when a Discord webhook URL is configured,
     * the system should send a properly formatted notification message to that webhook
     */
    it('should send properly formatted notifications for any valid webhook URL and message', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid Discord webhook URLs
          fc.record({
            webhookId: fc.integer({ min: 100000000000000000, max: 999999999999999999 }),
            webhookToken: fc.array(
              fc.constantFrom(
                ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split('')
              ),
              { minLength: 64, maxLength: 68 }
            ).map(chars => chars.join(''))
          }).map(({ webhookId, webhookToken }) => 
            `https://discord.com/api/webhooks/${webhookId}/${webhookToken}`
          ),
          // Generate message content (alphanumeric to avoid special characters that might cause issues)
          fc.string({ minLength: 1, maxLength: 200 })
            .filter(s => s.trim().length > 0 && /[a-zA-Z0-9]/.test(s))
            .map(s => s.trim()),
          async (webhookUrl, message) => {
            // Clear mocks before each property test iteration
            global.fetch.mockClear();
            
            // Mock successful response
            global.fetch.mockResolvedValueOnce({
              ok: true,
              status: 204,
              statusText: 'No Content',
              headers: new Map(),
              text: async () => ''
            });

            // Send notification
            const result = await discordWebhookService.sendDiscordNotification(message, {
              webhookUrl
            });

            // Verify result indicates success
            expect(result.success).toBe(true);
            expect(result.error).toBeNull();

            // Verify fetch was called exactly once in this iteration
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Verify fetch was called with correct URL
            const fetchCall = global.fetch.mock.calls[0];
            expect(fetchCall[0]).toBe(webhookUrl);

            // Verify request method and headers
            const fetchOptions = fetchCall[1];
            expect(fetchOptions.method).toBe('POST');
            expect(fetchOptions.headers['Content-Type']).toBe('application/json');

            // Verify payload structure
            const payload = JSON.parse(fetchOptions.body);
            expect(payload).toHaveProperty('content');
            expect(typeof payload.content).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include proper embed structure when embeds are provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid Discord webhook URL
          fc.record({
            webhookId: fc.integer({ min: 100000000000000000, max: 999999999999999999 }),
            webhookToken: fc.array(
              fc.constantFrom(
                ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split('')
              ),
              { minLength: 64, maxLength: 68 }
            ).map(chars => chars.join(''))
          }).map(({ webhookId, webhookToken }) => 
            `https://discord.com/api/webhooks/${webhookId}/${webhookToken}`
          ),
          // Generate embed data
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 256 }),
            description: fc.string({ minLength: 1, maxLength: 2048 }),
            color: fc.integer({ min: 0, max: 0xFFFFFF })
          }),
          async (webhookUrl, embedData) => {
            // Mock successful response
            global.fetch.mockResolvedValueOnce({
              ok: true,
              status: 204,
              statusText: 'No Content',
              headers: new Map(),
              text: async () => ''
            });

            // Send notification with embed
            const result = await discordWebhookService.sendDiscordNotification('Test message', {
              webhookUrl,
              embeds: [embedData]
            });

            // Verify result indicates success
            expect(result.success).toBe(true);

            // Verify payload includes embeds
            const fetchCall = global.fetch.mock.calls[0];
            const payload = JSON.parse(fetchCall[1].body);
            expect(payload).toHaveProperty('embeds');
            expect(Array.isArray(payload.embeds)).toBe(true);
            expect(payload.embeds.length).toBeGreaterThan(0);
            
            // Verify embed structure
            const embed = payload.embeds[0];
            expect(embed).toHaveProperty('title');
            expect(embed).toHaveProperty('description');
            expect(embed).toHaveProperty('color');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format new loan request notifications with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate loan request data
          fc.record({
            userName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            equipmentName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            status: fc.constantFrom('pending', 'approved', 'rejected'),
            borrowDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
            returnDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
            purpose: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0)
          }),
          // Generate valid webhook URL
          fc.record({
            webhookId: fc.integer({ min: 100000000000000000, max: 999999999999999999 }),
            webhookToken: fc.array(
              fc.constantFrom(
                ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split('')
              ),
              { minLength: 64, maxLength: 68 }
            ).map(chars => chars.join(''))
          }).map(({ webhookId, webhookToken }) => 
            `https://discord.com/api/webhooks/${webhookId}/${webhookToken}`
          ),
          async (loanRequest, webhookUrl) => {
            // Mock successful response
            global.fetch.mockResolvedValueOnce({
              ok: true,
              status: 204,
              statusText: 'No Content',
              headers: new Map(),
              text: async () => ''
            });

            // Send notification with explicit webhook URL
            const result = await discordWebhookService.sendDiscordNotification('New loan request', {
              webhookUrl,
              embeds: [{
                title: '📋 New Loan Request',
                color: 0x3498db,
                fields: [
                  { name: 'Requester', value: loanRequest.userName, inline: true },
                  { name: 'Equipment', value: loanRequest.equipmentName, inline: true },
                  { name: 'Status', value: loanRequest.status, inline: true }
                ]
              }]
            });

            // Verify result indicates success
            expect(result.success).toBe(true);

            // Verify fetch was called
            expect(global.fetch).toHaveBeenCalled();

            // Verify payload structure
            const fetchCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
            const payload = JSON.parse(fetchCall[1].body);
            
            // Should have embeds
            expect(payload).toHaveProperty('embeds');
            expect(Array.isArray(payload.embeds)).toBe(true);
            expect(payload.embeds.length).toBeGreaterThan(0);

            // Verify embed contains loan request information
            const embed = payload.embeds[0];
            expect(embed).toHaveProperty('title');
            expect(embed.title).toContain('Loan Request');
            expect(embed).toHaveProperty('fields');
            expect(Array.isArray(embed.fields)).toBe(true);
            
            // Verify all required fields are present
            const fieldNames = embed.fields.map(f => f.name);
            expect(fieldNames).toContain('Requester');
            expect(fieldNames).toContain('Equipment');
            expect(fieldNames).toContain('Status');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format overdue equipment notifications with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate overdue info
          fc.record({
            userName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            equipmentName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            daysOverdue: fc.integer({ min: 1, max: 365 }),
            returnDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
          }),
          // Generate valid webhook URL
          fc.record({
            webhookId: fc.integer({ min: 100000000000000000, max: 999999999999999999 }),
            webhookToken: fc.array(
              fc.constantFrom(
                ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split('')
              ),
              { minLength: 64, maxLength: 68 }
            ).map(chars => chars.join(''))
          }).map(({ webhookId, webhookToken }) => 
            `https://discord.com/api/webhooks/${webhookId}/${webhookToken}`
          ),
          async (overdueInfo, webhookUrl) => {
            // Mock successful response
            global.fetch.mockResolvedValueOnce({
              ok: true,
              status: 204,
              statusText: 'No Content',
              headers: new Map(),
              text: async () => ''
            });

            // Send notification with explicit webhook URL
            const result = await discordWebhookService.sendDiscordNotification('Overdue equipment', {
              webhookUrl,
              embeds: [{
                title: '⚠️ Overdue Equipment Alert',
                color: 0xe74c3c,
                fields: [
                  { name: 'Borrower', value: overdueInfo.userName, inline: true },
                  { name: 'Equipment', value: overdueInfo.equipmentName, inline: true },
                  { name: 'Days Overdue', value: overdueInfo.daysOverdue.toString(), inline: true }
                ]
              }]
            });

            // Verify result indicates success
            expect(result.success).toBe(true);

            // Verify payload structure
            const fetchCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
            const payload = JSON.parse(fetchCall[1].body);
            
            // Should have embeds
            expect(payload).toHaveProperty('embeds');
            const embed = payload.embeds[0];
            
            // Verify embed contains overdue information
            expect(embed.title).toContain('Overdue');
            const fieldNames = embed.fields.map(f => f.name);
            expect(fieldNames).toContain('Borrower');
            expect(fieldNames).toContain('Equipment');
            expect(fieldNames).toContain('Days Overdue');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format critical setting change notifications with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate setting change info
          fc.record({
            settingName: fc.constantFrom('maxLoanDuration', 'maxAdvanceBookingDays', 'defaultCategoryLimit'),
            adminName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            oldValue: fc.integer({ min: 1, max: 100 }),
            newValue: fc.integer({ min: 1, max: 100 }),
            reason: fc.option(fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0), { nil: null })
          }),
          // Generate valid webhook URL
          fc.record({
            webhookId: fc.integer({ min: 100000000000000000, max: 999999999999999999 }),
            webhookToken: fc.array(
              fc.constantFrom(
                ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split('')
              ),
              { minLength: 64, maxLength: 68 }
            ).map(chars => chars.join(''))
          }).map(({ webhookId, webhookToken }) => 
            `https://discord.com/api/webhooks/${webhookId}/${webhookToken}`
          ),
          async (changeInfo, webhookUrl) => {
            // Mock successful response
            global.fetch.mockResolvedValueOnce({
              ok: true,
              status: 204,
              statusText: 'No Content',
              headers: new Map(),
              text: async () => ''
            });

            // Send notification with explicit webhook URL
            const result = await discordWebhookService.sendDiscordNotification('Critical setting changed', {
              webhookUrl,
              embeds: [{
                title: '🔧 Critical Setting Changed',
                color: 0xf39c12,
                fields: [
                  { name: 'Setting', value: changeInfo.settingName, inline: true },
                  { name: 'Changed By', value: changeInfo.adminName, inline: true },
                  { name: 'Old Value', value: changeInfo.oldValue.toString(), inline: true },
                  { name: 'New Value', value: changeInfo.newValue.toString(), inline: true }
                ]
              }]
            });

            // Verify result indicates success
            expect(result.success).toBe(true);

            // Verify payload structure
            const fetchCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
            const payload = JSON.parse(fetchCall[1].body);
            
            // Should have embeds
            expect(payload).toHaveProperty('embeds');
            const embed = payload.embeds[0];
            
            // Verify embed contains setting change information
            expect(embed.title).toContain('Setting');
            const fieldNames = embed.fields.map(f => f.name);
            expect(fieldNames).toContain('Setting');
            expect(fieldNames).toContain('Changed By');
            expect(fieldNames).toContain('Old Value');
            expect(fieldNames).toContain('New Value');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
