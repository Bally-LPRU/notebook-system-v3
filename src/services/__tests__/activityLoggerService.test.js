import ActivityLoggerService from '../activityLoggerService';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {},
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  doc: jest.fn(),
  getDoc: jest.fn()
}));

describe('ActivityLoggerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock navigator
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Test Browser)',
      configurable: true
    });
  });

  describe('logEquipmentActivity', () => {
    test('should log equipment creation activity', async () => {
      const mockAddDoc = require('../../config/firebase').addDoc;
      mockAddDoc.mockResolvedValue({ id: 'activity-123' });

      const mockGetDoc = require('../../config/firebase').getDoc;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          displayName: 'Test User',
          email: 'test@example.com',
          role: 'editor',
          department: 'IT'
        })
      });

      const activityData = {
        equipmentId: 'equipment-123',
        equipmentNumber: 'EQ001',
        equipmentName: 'Test Equipment',
        reason: 'สร้างอุปกรณ์ใหม่'
      };

      const result = await ActivityLoggerService.logEquipmentActivity(
        ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_CREATED,
        activityData,
        'user-123'
      );

      expect(result).toBe('activity-123');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          activityType: ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_CREATED,
          resourceType: 'equipment',
          resourceId: 'equipment-123',
          userId: 'user-123',
          details: expect.objectContaining({
            equipmentNumber: 'EQ001',
            equipmentName: 'Test Equipment',
            reason: 'สร้างอุปกรณ์ใหม่'
          }),
          severity: expect.any(String),
          category: expect.any(String)
        })
      );
    });

    test('should handle errors gracefully', async () => {
      const mockAddDoc = require('../../config/firebase').addDoc;
      mockAddDoc.mockRejectedValue(new Error('Database error'));

      const result = await ActivityLoggerService.logEquipmentActivity(
        ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_CREATED,
        { equipmentId: 'test' },
        'user-123'
      );

      expect(result).toBeNull();
    });
  });

  describe('logPermissionDenied', () => {
    test('should log permission denied activity', async () => {
      const mockAddDoc = require('../../config/firebase').addDoc;
      mockAddDoc.mockResolvedValue({ id: 'activity-123' });

      await ActivityLoggerService.logPermissionDenied(
        'user-123',
        'create_equipment',
        'equipment',
        'ไม่มีสิทธิ์'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          activityType: ActivityLoggerService.ACTIVITY_TYPES.PERMISSION_DENIED,
          userId: 'user-123',
          details: expect.objectContaining({
            attemptedAction: 'create_equipment',
            resource: 'equipment',
            reason: 'ไม่มีสิทธิ์'
          }),
          metadata: expect.objectContaining({
            severity: ActivityLoggerService.SEVERITY_LEVELS.MEDIUM,
            requiresReview: true
          })
        })
      );
    });
  });

  describe('logSystemError', () => {
    test('should log system error activity', async () => {
      const mockAddDoc = require('../../config/firebase').addDoc;
      mockAddDoc.mockResolvedValue({ id: 'activity-123' });

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      await ActivityLoggerService.logSystemError(
        error,
        'equipment_service',
        'user-123'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          activityType: ActivityLoggerService.ACTIVITY_TYPES.SYSTEM_ERROR,
          userId: 'user-123',
          details: expect.objectContaining({
            errorMessage: 'Test error',
            errorStack: 'Error stack trace',
            context: 'equipment_service'
          }),
          metadata: expect.objectContaining({
            severity: ActivityLoggerService.SEVERITY_LEVELS.HIGH,
            requiresReview: true
          })
        })
      );
    });
  });

  describe('getSeverityLevel', () => {
    test('should return correct severity for different activity types', () => {
      expect(ActivityLoggerService.getSeverityLevel(
        ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_VIEWED
      )).toBe(ActivityLoggerService.SEVERITY_LEVELS.LOW);

      expect(ActivityLoggerService.getSeverityLevel(
        ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_CREATED
      )).toBe(ActivityLoggerService.SEVERITY_LEVELS.MEDIUM);

      expect(ActivityLoggerService.getSeverityLevel(
        ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_DELETED
      )).toBe(ActivityLoggerService.SEVERITY_LEVELS.HIGH);

      expect(ActivityLoggerService.getSeverityLevel(
        ActivityLoggerService.ACTIVITY_TYPES.SYSTEM_ERROR
      )).toBe(ActivityLoggerService.SEVERITY_LEVELS.HIGH);
    });

    test('should return default severity for unknown activity type', () => {
      expect(ActivityLoggerService.getSeverityLevel('unknown_activity'))
        .toBe(ActivityLoggerService.SEVERITY_LEVELS.LOW);
    });
  });

  describe('getActivityCategory', () => {
    test('should return correct category for different activity types', () => {
      expect(ActivityLoggerService.getActivityCategory('equipment_created'))
        .toBe('equipment');

      expect(ActivityLoggerService.getActivityCategory('bulk_update'))
        .toBe('bulk_operation');

      expect(ActivityLoggerService.getActivityCategory('category_created'))
        .toBe('category');

      expect(ActivityLoggerService.getActivityCategory('report_generated'))
        .toBe('report');

      expect(ActivityLoggerService.getActivityCategory('user_login'))
        .toBe('user');

      expect(ActivityLoggerService.getActivityCategory('unknown_activity'))
        .toBe('system');
    });
  });

  describe('generateSearchKeywords', () => {
    test('should generate keywords from equipment data', () => {
      const data = {
        equipmentNumber: 'EQ001',
        equipmentName: 'Test Equipment Name',
        searchQuery: 'search term'
      };

      const keywords = ActivityLoggerService.generateSearchKeywords(data);

      expect(keywords).toContain('eq001');
      expect(keywords).toContain('test');
      expect(keywords).toContain('equipment');
      expect(keywords).toContain('name');
      expect(keywords).toContain('search');
      expect(keywords).toContain('term');
    });

    test('should filter out short keywords', () => {
      const data = {
        equipmentName: 'A B Test Equipment'
      };

      const keywords = ActivityLoggerService.generateSearchKeywords(data);

      expect(keywords).not.toContain('a');
      expect(keywords).not.toContain('b');
      expect(keywords).toContain('test');
      expect(keywords).toContain('equipment');
    });
  });

  describe('getSessionId', () => {
    test('should generate and store session ID', () => {
      // Mock sessionStorage
      const mockSessionStorage = {
        getItem: jest.fn(),
        setItem: jest.fn()
      };
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage
      });

      mockSessionStorage.getItem.mockReturnValue(null);

      const sessionId = ActivityLoggerService.getSessionId();

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('sessionId', sessionId);
    });

    test('should return existing session ID', () => {
      const mockSessionStorage = {
        getItem: jest.fn().mockReturnValue('existing-session-id'),
        setItem: jest.fn()
      };
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage
      });

      const sessionId = ActivityLoggerService.getSessionId();

      expect(sessionId).toBe('existing-session-id');
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('getBrowserInfo', () => {
    test('should return browser information', () => {
      // Mock navigator and screen
      Object.defineProperty(navigator, 'language', { value: 'th-TH' });
      Object.defineProperty(navigator, 'platform', { value: 'Win32' });
      Object.defineProperty(navigator, 'cookieEnabled', { value: true });
      Object.defineProperty(navigator, 'onLine', { value: true });
      Object.defineProperty(window, 'screen', {
        value: { width: 1920, height: 1080 }
      });

      // Mock Intl
      global.Intl = {
        DateTimeFormat: jest.fn(() => ({
          resolvedOptions: () => ({ timeZone: 'Asia/Bangkok' })
        }))
      };

      const browserInfo = ActivityLoggerService.getBrowserInfo();

      expect(browserInfo).toEqual({
        language: 'th-TH',
        platform: 'Win32',
        cookieEnabled: true,
        onLine: true,
        screenResolution: '1920x1080',
        timezone: 'Asia/Bangkok'
      });
    });
  });
});