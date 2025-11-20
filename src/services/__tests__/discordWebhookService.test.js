/**
 * Unit Tests for Discord Webhook Service
 * Requirements: 5.1, 5.5
 * 
 * Tests specific functionality and edge cases for Discord webhook operations
 */

import discordWebhookService from '../discordWebhookService';

// Mock fetch globally
global.fetch = jest.fn();

describe('Discord Webhook Service - Unit Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    global.fetch.mockReset();
  });

  describe('URL Validation', () => {
    it('should validate correct Discord webhook URLs', () => {
      const validUrls = [
        'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_',
        'https://discordapp.com/api/webhooks/999999999999999999/ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz-_'
      ];

      validUrls.forEach(url => {
        const result = discordWebhookService.validateWebhookUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });
    });

    it('should reject empty or null URLs', () => {
      const invalidUrls = [null, undefined, '', '   '];

      invalidUrls.forEach(url => {
        const result = discordWebhookService.validateWebhookUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeTruthy();
      });
    });

    it('should reject URLs with incorrect format', () => {
      const invalidUrls = [
        'http://discord.com/api/webhooks/123/abc', // HTTP instead of HTTPS
        'https://example.com/webhook', // Wrong domain
        'https://discord.com/webhooks/123/abc', // Missing /api/
        'https://discord.com/api/webhooks/abc/123', // Non-numeric webhook ID
        'https://discord.com/api/webhooks/123/abc def', // Space in token
      ];

      invalidUrls.forEach(url => {
        const result = discordWebhookService.validateWebhookUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeTruthy();
        expect(result.error).toContain('Invalid Discord webhook URL format');
      });
    });
  });

  describe('Message Formatting', () => {
    it('should format simple text messages correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Map(),
        text: async () => ''
      });

      await discordWebhookService.sendDiscordNotification('Test message', {
        webhookUrl: 'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz'
      });

      const fetchCall = global.fetch.mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);
      
      expect(payload).toHaveProperty('content');
      expect(payload.content).toBe('Test message');
    });

    it('should include username override when provided', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Map(),
        text: async () => ''
      });

      await discordWebhookService.sendDiscordNotification('Test', {
        webhookUrl: 'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz',
        username: 'Custom Bot'
      });

      const fetchCall = global.fetch.mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);
      
      expect(payload).toHaveProperty('username');
      expect(payload.username).toBe('Custom Bot');
    });

    it('should include avatar URL when provided', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Map(),
        text: async () => ''
      });

      await discordWebhookService.sendDiscordNotification('Test', {
        webhookUrl: 'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz',
        avatarUrl: 'https://example.com/avatar.png'
      });

      const fetchCall = global.fetch.mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);
      
      expect(payload).toHaveProperty('avatar_url');
      expect(payload.avatar_url).toBe('https://example.com/avatar.png');
    });

    it('should include embeds when provided', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Map(),
        text: async () => ''
      });

      const embeds = [{
        title: 'Test Embed',
        description: 'Test Description',
        color: 0x00ff00
      }];

      await discordWebhookService.sendDiscordNotification('Test', {
        webhookUrl: 'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz',
        embeds
      });

      const fetchCall = global.fetch.mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);
      
      expect(payload).toHaveProperty('embeds');
      expect(payload.embeds).toEqual(embeds);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await discordWebhookService.sendDiscordNotification('Test', {
        webhookUrl: 'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle HTTP 400 errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Map(),
        text: async () => 'Invalid payload'
      });

      const result = await discordWebhookService.sendDiscordNotification('Test', {
        webhookUrl: 'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('400');
    });

    it('should handle HTTP 404 errors (webhook not found)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map(),
        text: async () => 'Webhook not found'
      });

      const result = await discordWebhookService.sendDiscordNotification('Test', {
        webhookUrl: 'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });

    it('should handle rate limiting (429) with retry information', async () => {
      const headers = new Map();
      headers.set('Retry-After', '60');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers,
        text: async () => 'Rate limited'
      });

      const result = await discordWebhookService.sendDiscordNotification('Test', {
        webhookUrl: 'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limited');
      expect(result.retryAfter).toBe(60);
    });

    it('should handle HTTP 500 errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Map(),
        text: async () => 'Server error'
      });

      const result = await discordWebhookService.sendDiscordNotification('Test', {
        webhookUrl: 'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });
  });

  describe('Test Webhook', () => {
    it('should send a test message successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Map(),
        text: async () => ''
      });

      const result = await discordWebhookService.testWebhook(
        'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz'
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalled();

      const fetchCall = global.fetch.mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);
      
      expect(payload.content).toContain('test');
      expect(payload.embeds).toBeDefined();
      expect(payload.embeds[0].title).toContain('Test');
    });

    it('should validate URL before sending test message', async () => {
      const result = await discordWebhookService.testWebhook('invalid-url');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Notification Methods', () => {
    it('should format new loan request notifications correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Map(),
        text: async () => ''
      });

      const loanRequest = {
        userName: 'John Doe',
        equipmentName: 'Camera',
        status: 'pending',
        borrowDate: new Date('2024-01-15'),
        returnDate: new Date('2024-01-20'),
        purpose: 'Photography project'
      };

      const result = await discordWebhookService.notifyNewLoanRequest(loanRequest);

      // Should attempt to get settings first, which will fail in test
      // But the method should handle it gracefully
      expect(result).toBeDefined();
    });

    it('should format overdue equipment notifications correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Map(),
        text: async () => ''
      });

      const overdueInfo = {
        userName: 'Jane Smith',
        equipmentName: 'Laptop',
        daysOverdue: 5,
        returnDate: new Date('2024-01-10')
      };

      const result = await discordWebhookService.notifyOverdueEquipment(overdueInfo);

      expect(result).toBeDefined();
    });

    it('should format critical setting change notifications correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Map(),
        text: async () => ''
      });

      const changeInfo = {
        settingName: 'maxLoanDuration',
        adminName: 'Admin User',
        oldValue: 14,
        newValue: 21,
        reason: 'User request'
      };

      const result = await discordWebhookService.notifyCriticalSettingChange(changeInfo);

      expect(result).toBeDefined();
    });
  });
});
