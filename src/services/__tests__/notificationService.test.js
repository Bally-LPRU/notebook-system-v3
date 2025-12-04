import NotificationService from '../notificationService';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES
} from '../../types/notification';

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
  setDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: 123456 })),
  writeBatch: jest.fn()
}));

const firestore = jest.requireMock('firebase/firestore');

const createSnapshot = (docs = []) => ({
  forEach: (callback) => docs.forEach((doc) => callback(doc)),
  size: docs.length
});

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    firestore.writeBatch.mockImplementation(() => ({
      delete: jest.fn(),
      commit: jest.fn()
    }));
  });

  describe('createNotification', () => {
    let settingsSpy;
    let realtimeSpy;

    beforeEach(() => {
      settingsSpy = jest
        .spyOn(NotificationService, 'getUserNotificationSettings')
        .mockResolvedValue(DEFAULT_NOTIFICATION_SETTINGS);
      realtimeSpy = jest
        .spyOn(NotificationService, 'triggerRealTimeNotification')
        .mockImplementation(() => {});
    });

    afterEach(() => {
      settingsSpy.mockRestore();
      realtimeSpy.mockRestore();
    });

    it('persists composed notification payloads', async () => {
      firestore.collection.mockReturnValue('notificationsRef');
      firestore.addDoc.mockResolvedValue({ id: 'notification-1' });
      firestore.serverTimestamp.mockReturnValue({ seconds: 999 });

      const result = await NotificationService.createNotification(
        'user-123',
        NOTIFICATION_TYPES.LOAN_APPROVED,
        'คำขอยืมได้รับการอนุมัติ',
        'คำขอยืม Laptop ได้รับการอนุมัติแล้ว',
        { equipmentName: 'Laptop', requestId: 'REQ-1' }
      );

      expect(firestore.collection).toHaveBeenCalledWith({}, 'notifications');
      expect(firestore.addDoc).toHaveBeenCalledWith(
        'notificationsRef',
        expect.objectContaining({
          userId: 'user-123',
          type: NOTIFICATION_TYPES.LOAN_APPROVED,
          title: 'คำขอยืมได้รับการอนุมัติ',
          message: 'คำขอยืม Laptop ได้รับการอนุมัติแล้ว',
          isRead: false,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          data: expect.objectContaining({ equipmentName: 'Laptop' }),
          createdAt: { seconds: 999 }
        })
      );
      expect(result).toMatchObject({ id: 'notification-1', userId: 'user-123' });
    });

    it('skips creation when notification type disabled in settings', async () => {
      jest
        .spyOn(NotificationService, 'getUserNotificationSettings')
        .mockResolvedValue({
          ...DEFAULT_NOTIFICATION_SETTINGS,
          inAppNotifications: {
            ...DEFAULT_NOTIFICATION_SETTINGS.inAppNotifications,
            loanApproval: false
          }
        });

      const result = await NotificationService.createNotification(
        'user-123',
        NOTIFICATION_TYPES.LOAN_APPROVED,
        'title',
        'message'
      );

      expect(firestore.addDoc).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getUserNotifications', () => {
    it('returns formatted notifications', async () => {
      firestore.collection.mockReturnValue('notificationsRef');
      firestore.query.mockReturnValue('queryRef');
      firestore.where.mockReturnValue('whereRef');
      firestore.orderBy.mockReturnValue('orderByRef');
      firestore.limit.mockReturnValue('limitRef');
      firestore.getDocs.mockResolvedValue(
        createSnapshot([
          { id: 'notif1', data: () => ({ type: 'loan', isRead: false }) },
          { id: 'notif2', data: () => ({ type: 'reminder', isRead: true }) }
        ])
      );

      const notifications = await NotificationService.getUserNotifications('user-123');

      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications).toHaveLength(2);
      expect(notifications[0]).toMatchObject({ id: 'notif1', type: 'loan' });
    });

    it('applies unread filter when requested', async () => {
      firestore.collection.mockReturnValue('notificationsRef');
      firestore.query.mockReturnValue('queryRef');
      firestore.where.mockReturnValue('whereRef');
      firestore.orderBy.mockReturnValue('orderByRef');
      firestore.limit.mockReturnValue('limitRef');
      firestore.getDocs.mockResolvedValue(createSnapshot());

      await NotificationService.getUserNotifications('user-123', true);

      expect(firestore.where).toHaveBeenCalledWith('isRead', '==', false);
    });
  });

  describe('markAsRead', () => {
    it('updates read flag for single notification', async () => {
      firestore.doc.mockReturnValue('docRef');
      firestore.updateDoc.mockResolvedValue();
      firestore.serverTimestamp.mockReturnValue({ seconds: 42 });

      await NotificationService.markAsRead('notif-123');

      expect(firestore.doc).toHaveBeenCalledWith({}, 'notifications', 'notif-123');
      expect(firestore.updateDoc).toHaveBeenCalledWith('docRef', {
        isRead: true,
        readAt: { seconds: 42 }
      });
    });
  });

  describe('markAllAsRead', () => {
    it('updates all unread documents', async () => {
      const docs = [{ ref: { id: 'doc1' } }, { ref: { id: 'doc2' } }];
      firestore.collection.mockReturnValue('notificationsRef');
      firestore.query.mockReturnValue('queryRef');
      firestore.where.mockReturnValue('whereRef');
      firestore.getDocs.mockResolvedValue(createSnapshot(docs));
      firestore.updateDoc.mockResolvedValue();
      firestore.serverTimestamp.mockReturnValue('ts');

      await NotificationService.markAllAsRead('user-123');

      expect(firestore.updateDoc).toHaveBeenCalledTimes(2);
      docs.forEach((snapshot) => {
        expect(firestore.updateDoc).toHaveBeenCalledWith(snapshot.ref, {
          isRead: true,
          readAt: 'ts'
        });
      });
    });
  });

  describe('deleteNotification', () => {
    it('removes a notification document', async () => {
      firestore.doc.mockReturnValue('docRef');
      firestore.deleteDoc.mockResolvedValue();

      await NotificationService.deleteNotification('notif-1');

      expect(firestore.deleteDoc).toHaveBeenCalledWith('docRef');
    });
  });

  describe('deleteAllUserNotifications', () => {
    it('uses a write batch for bulk removal', async () => {
      const docs = [{ ref: { id: 'a' } }, { ref: { id: 'b' } }];
      firestore.collection.mockReturnValue('notificationsRef');
      firestore.query.mockReturnValue('queryRef');
      firestore.where.mockReturnValue('whereRef');
      firestore.getDocs.mockResolvedValue(createSnapshot(docs));
      const batch = { delete: jest.fn(), commit: jest.fn() };
      firestore.writeBatch.mockReturnValue(batch);

      await NotificationService.deleteAllUserNotifications('user-123');

      expect(firestore.writeBatch).toHaveBeenCalledWith({});
      expect(batch.delete).toHaveBeenCalledTimes(2);
      expect(batch.commit).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredNotifications', () => {
    it('deletes expired notifications and commits batch', async () => {
      const docs = [{ ref: { id: 'expired-1' } }];
      firestore.collection.mockReturnValue('notificationsRef');
      firestore.query.mockReturnValue('queryRef');
      firestore.where.mockReturnValue('whereRef');
      firestore.getDocs.mockResolvedValue(createSnapshot(docs));
      const batch = { delete: jest.fn(), commit: jest.fn() };
      firestore.writeBatch.mockReturnValue(batch);

      await NotificationService.cleanupExpiredNotifications();

      expect(batch.delete).toHaveBeenCalledWith(docs[0].ref);
      expect(batch.commit).toHaveBeenCalled();
    });

    it('skips commit when no documents returned', async () => {
      firestore.collection.mockReturnValue('notificationsRef');
      firestore.query.mockReturnValue('queryRef');
      firestore.where.mockReturnValue('whereRef');
      firestore.getDocs.mockResolvedValue(createSnapshot());
      const batch = { delete: jest.fn(), commit: jest.fn() };
      firestore.writeBatch.mockReturnValue(batch);

      await NotificationService.cleanupExpiredNotifications();

      expect(firestore.writeBatch).toHaveBeenCalledWith({});
      expect(batch.delete).not.toHaveBeenCalled();
      expect(batch.commit).not.toHaveBeenCalled();
    });
  });

  describe('getUserNotificationSettings', () => {
    it('returns stored settings when document exists', async () => {
      const storedData = { inAppNotifications: { systemUpdates: false } };
      firestore.doc.mockReturnValue('settingsRef');
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => storedData
      });

      const result = await NotificationService.getUserNotificationSettings('user-123');

      expect(result.inAppNotifications.systemUpdates).toBe(false);
      expect(firestore.setDoc).not.toHaveBeenCalled();
    });

    it('creates defaults when no settings found', async () => {
      firestore.doc.mockReturnValue('settingsRef');
      firestore.getDoc.mockResolvedValue({ exists: () => false });
      firestore.serverTimestamp.mockReturnValue('ts');

      const result = await NotificationService.getUserNotificationSettings('user-123');

      expect(firestore.setDoc).toHaveBeenCalledWith(
        'settingsRef',
        expect.objectContaining({ userId: 'user-123' })
      );
      expect(result.userId).toBe('user-123');
    });
  });
});