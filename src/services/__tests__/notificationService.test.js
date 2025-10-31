import { jest } from '@jest/globals';
import NotificationService from '../notificationService';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 }))
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      const notificationData = {
        userId: 'user1',
        type: 'loan_approved',
        title: 'คำขอยืมได้รับการอนุมัติ',
        message: 'คำขอยืม Laptop Dell ของคุณได้รับการอนุมัติแล้ว',
        data: { loanRequestId: 'loan-req-1' }
      };

      const mockDocRef = { id: 'notification-1' };

      const { collection, addDoc, serverTimestamp } = require('firebase/firestore');
      collection.mockReturnValue('notifications');
      addDoc.mockResolvedValue(mockDocRef);
      serverTimestamp.mockReturnValue({ seconds: Date.now() / 1000 });

      const result = await NotificationService.createNotification(notificationData);

      expect(addDoc).toHaveBeenCalledWith('notifications', {
        ...notificationData,
        isRead: false,
        priority: 'medium',
        createdAt: expect.any(Object)
      });
      expect(result).toBe('notification-1');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        userId: 'user1'
        // Missing required fields
      };

      await expect(NotificationService.createNotification(incompleteData))
        .rejects.toThrow();
    });

    it('should handle creation errors', async () => {
      const notificationData = {
        userId: 'user1',
        type: 'loan_approved',
        title: 'Test',
        message: 'Test message'
      };

      const { addDoc } = require('firebase/firestore');
      addDoc.mockRejectedValue(new Error('Creation failed'));

      await expect(NotificationService.createNotification(notificationData))
        .rejects.toThrow('Creation failed');
    });
  });

  describe('getUserNotifications', () => {
    it('should get user notifications successfully', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          userId: 'user1',
          type: 'loan_approved',
          title: 'คำขอยืมได้รับการอนุมัติ',
          message: 'คำขอยืม Laptop Dell ของคุณได้รับการอนุมัติแล้ว',
          isRead: false,
          priority: 'high',
          createdAt: { seconds: Date.now() / 1000 }
        },
        {
          id: 'notif2',
          userId: 'user1',
          type: 'loan_reminder',
          title: 'แจ้งเตือนคืนอุปกรณ์',
          message: 'กรุณาคืน Laptop Dell ภายในวันพรุ่งนี้',
          isRead: true,
          priority: 'medium',
          createdAt: { seconds: (Date.now() - 86400000) / 1000 }
        }
      ];

      const mockSnapshot = {
        docs: mockNotifications.map(notif => ({
          id: notif.id,
          data: () => ({ ...notif, id: undefined })
        })),
        empty: false
      };

      const { collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');
      collection.mockReturnValue('notifications');
      query.mockReturnValue('query');
      where.mockReturnValue('where');
      orderBy.mockReturnValue('orderBy');
      limit.mockReturnValue('limit');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await NotificationService.getUserNotifications('user1');

      expect(where).toHaveBeenCalledWith('userId', '==', 'user1');
      expect(result.notifications).toHaveLength(2);
      expect(result.unreadCount).toBe(1);
    });

    it('should handle empty notifications', async () => {
      const mockSnapshot = {
        docs: [],
        empty: true
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await NotificationService.getUserNotifications('user1');

      expect(result.notifications).toHaveLength(0);
      expect(result.unreadCount).toBe(0);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        isRead: false,
        type: 'loan_approved',
        priority: 'high'
      };

      const { where } = require('firebase/firestore');
      where.mockReturnValue('where');

      await NotificationService.getUserNotifications('user1', filters);

      expect(where).toHaveBeenCalledWith('isRead', '==', false);
      expect(where).toHaveBeenCalledWith('type', '==', 'loan_approved');
      expect(where).toHaveBeenCalledWith('priority', '==', 'high');
    });
  });

  describe('markAsRead', () => {
    it('should mark single notification as read', async () => {
      const { doc, updateDoc, serverTimestamp } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'notif1' });
      updateDoc.mockResolvedValue();
      serverTimestamp.mockReturnValue({ seconds: Date.now() / 1000 });

      await NotificationService.markAsRead('notif1');

      expect(updateDoc).toHaveBeenCalledWith(
        { id: 'notif1' },
        {
          isRead: true,
          readAt: expect.any(Object)
        }
      );
    });

    it('should mark multiple notifications as read', async () => {
      const notificationIds = ['notif1', 'notif2', 'notif3'];

      const { doc, updateDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'mock-id' });
      updateDoc.mockResolvedValue();

      await NotificationService.markAsRead(notificationIds);

      expect(updateDoc).toHaveBeenCalledTimes(3);
    });

    it('should handle mark as read errors', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(NotificationService.markAsRead('notif1'))
        .rejects.toThrow('Update failed');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      const mockNotifications = [
        { id: 'notif1', isRead: false },
        { id: 'notif2', isRead: false },
        { id: 'notif3', isRead: true } // Already read
      ];

      const mockSnapshot = {
        docs: mockNotifications.map(notif => ({
          id: notif.id,
          data: () => notif
        }))
      };

      const { getDocs, doc, updateDoc } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);
      doc.mockReturnValue({ id: 'mock-id' });
      updateDoc.mockResolvedValue();

      const result = await NotificationService.markAllAsRead('user1');

      expect(updateDoc).toHaveBeenCalledTimes(2); // Only unread notifications
      expect(result).toBe(2); // Number of updated notifications
    });

    it('should handle no unread notifications', async () => {
      const mockSnapshot = {
        docs: []
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await NotificationService.markAllAsRead('user1');

      expect(result).toBe(0);
    });
  });

  describe('deleteNotification', () => {
    it('should delete single notification successfully', async () => {
      const { doc, deleteDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'notif1' });
      deleteDoc.mockResolvedValue();

      await NotificationService.deleteNotification('notif1');

      expect(deleteDoc).toHaveBeenCalledWith({ id: 'notif1' });
    });

    it('should delete multiple notifications successfully', async () => {
      const notificationIds = ['notif1', 'notif2'];

      const { doc, deleteDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'mock-id' });
      deleteDoc.mockResolvedValue();

      await NotificationService.deleteNotification(notificationIds);

      expect(deleteDoc).toHaveBeenCalledTimes(2);
    });

    it('should handle deletion errors', async () => {
      const { deleteDoc } = require('firebase/firestore');
      deleteDoc.mockRejectedValue(new Error('Deletion failed'));

      await expect(NotificationService.deleteNotification('notif1'))
        .rejects.toThrow('Deletion failed');
    });
  });

  describe('subscribeToUserNotifications', () => {
    it('should subscribe to user notifications successfully', () => {
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();

      const { collection, query, where, orderBy, onSnapshot } = require('firebase/firestore');
      collection.mockReturnValue('notifications');
      query.mockReturnValue('query');
      where.mockReturnValue('where');
      orderBy.mockReturnValue('orderBy');
      onSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = NotificationService.subscribeToUserNotifications('user1', mockCallback);

      expect(where).toHaveBeenCalledWith('userId', '==', 'user1');
      expect(onSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should handle subscription errors', () => {
      const mockCallback = jest.fn();
      const mockError = new Error('Subscription failed');

      const { onSnapshot } = require('firebase/firestore');
      onSnapshot.mockImplementation((query, callback, errorCallback) => {
        errorCallback(mockError);
        return jest.fn();
      });

      expect(() => {
        NotificationService.subscribeToUserNotifications('user1', mockCallback);
      }).not.toThrow(); // Should handle error gracefully
    });
  });

  describe('getNotificationStats', () => {
    it('should get notification statistics successfully', async () => {
      const mockNotifications = [
        { type: 'loan_approved', priority: 'high', isRead: false },
        { type: 'loan_approved', priority: 'medium', isRead: true },
        { type: 'loan_reminder', priority: 'high', isRead: false },
        { type: 'reservation_reminder', priority: 'medium', isRead: false }
      ];

      const mockSnapshot = {
        docs: mockNotifications.map((notif, index) => ({
          id: `notif${index}`,
          data: () => notif
        }))
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const stats = await NotificationService.getNotificationStats('user1');

      expect(stats.total).toBe(4);
      expect(stats.unread).toBe(3);
      expect(stats.byType.loan_approved).toBe(2);
      expect(stats.byType.loan_reminder).toBe(1);
      expect(stats.byPriority.high).toBe(2);
      expect(stats.byPriority.medium).toBe(2);
    });

    it('should handle empty notifications', async () => {
      const mockSnapshot = {
        docs: []
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const stats = await NotificationService.getNotificationStats('user1');

      expect(stats.total).toBe(0);
      expect(stats.unread).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.byPriority).toEqual({});
    });
  });

  describe('cleanupExpiredNotifications', () => {
    it('should cleanup expired notifications successfully', async () => {
      const expiredDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
      const mockExpiredNotifications = [
        {
          id: 'expired1',
          createdAt: { seconds: expiredDate.getTime() / 1000 },
          expiresAt: { seconds: (Date.now() - 86400000) / 1000 }
        }
      ];

      const mockSnapshot = {
        docs: mockExpiredNotifications.map(notif => ({
          id: notif.id,
          data: () => notif
        }))
      };

      const { getDocs, doc, deleteDoc } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);
      doc.mockReturnValue({ id: 'expired1' });
      deleteDoc.mockResolvedValue();

      const result = await NotificationService.cleanupExpiredNotifications();

      expect(deleteDoc).toHaveBeenCalledWith({ id: 'expired1' });
      expect(result).toBe(1); // Number of deleted notifications
    });

    it('should handle no expired notifications', async () => {
      const mockSnapshot = {
        docs: []
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await NotificationService.cleanupExpiredNotifications();

      expect(result).toBe(0);
    });
  });

  describe('createBulkNotifications', () => {
    it('should create bulk notifications successfully', async () => {
      const notificationsData = [
        {
          userId: 'user1',
          type: 'system_update',
          title: 'System Update',
          message: 'System will be updated tonight'
        },
        {
          userId: 'user2',
          type: 'system_update',
          title: 'System Update',
          message: 'System will be updated tonight'
        }
      ];

      const { addDoc } = require('firebase/firestore');
      addDoc.mockResolvedValue({ id: 'mock-id' });

      const result = await NotificationService.createBulkNotifications(notificationsData);

      expect(addDoc).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should handle bulk creation errors', async () => {
      const notificationsData = [
        {
          userId: 'user1',
          type: 'test',
          title: 'Test',
          message: 'Test message'
        }
      ];

      const { addDoc } = require('firebase/firestore');
      addDoc.mockRejectedValue(new Error('Bulk creation failed'));

      await expect(NotificationService.createBulkNotifications(notificationsData))
        .rejects.toThrow('Bulk creation failed');
    });
  });
});