import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy,
  limit,
  onSnapshot,
  deleteDoc,
  setDoc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  NOTIFICATION_TYPES, 
  NOTIFICATION_PRIORITIES, 
  NOTIFICATION_TEMPLATES,
  DEFAULT_NOTIFICATION_SETTINGS 
} from '../types/notification';

class NotificationService {
  // Real-time listeners storage
  static listeners = new Map();

  // Create a new notification
  static async createNotification(userId, type, title, message, data = {}) {
    try {
      // Check user notification settings
      const settings = await this.getUserNotificationSettings(userId);
      if (!this.shouldSendNotification(type, settings)) {
        return null;
      }

      const template = NOTIFICATION_TEMPLATES[type];
      const notification = {
        userId,
        type,
        title: title || template?.title || 'การแจ้งเตือน',
        message: this.formatMessage(message || template?.message || '', data),
        data,
        isRead: false,
        priority: template?.priority || NOTIFICATION_PRIORITIES.LOW,
        actionUrl: this.formatActionUrl(template?.actionUrl, data),
        actionText: template?.actionText,
        expiresAt: data.expiresAt || null,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'notifications'), notification);
      
      // Trigger real-time notification for active listeners
      this.triggerRealTimeNotification(userId, { id: docRef.id, ...notification });
      
      return { id: docRef.id, ...notification };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Format message with data placeholders
  static formatMessage(template, data) {
    let message = template;
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      if (message.includes(placeholder)) {
        message = message.replace(new RegExp(placeholder, 'g'), data[key] || '');
      }
    });
    return message;
  }

  // Format action URL with data placeholders
  static formatActionUrl(template, data) {
    if (!template) return null;
    let url = template;
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      if (url.includes(placeholder)) {
        url = url.replace(new RegExp(placeholder, 'g'), data[key] || '');
      }
    });
    return url;
  }

  // Check if notification should be sent based on user settings
  static shouldSendNotification(type, settings) {
    if (!settings) return true; // Default to sending if no settings found
    
    const typeMapping = {
      [NOTIFICATION_TYPES.LOAN_APPROVED]: 'loanApproval',
      [NOTIFICATION_TYPES.LOAN_REJECTED]: 'loanApproval',
      [NOTIFICATION_TYPES.LOAN_REMINDER]: 'loanReminder',
      [NOTIFICATION_TYPES.LOAN_OVERDUE]: 'loanReminder',
      [NOTIFICATION_TYPES.RESERVATION_REMINDER]: 'reservationReminder',
      [NOTIFICATION_TYPES.RESERVATION_READY]: 'reservationReminder',
      [NOTIFICATION_TYPES.SYSTEM_UPDATE]: 'systemUpdates'
    };
    
    const settingKey = typeMapping[type];
    if (!settingKey) return true; // Send if no specific setting
    
    return settings.inAppNotifications?.[settingKey] !== false;
  }

  // Get priority level for notification type (legacy support)
  static getPriority(type) {
    const template = NOTIFICATION_TEMPLATES[type];
    return template?.priority || NOTIFICATION_PRIORITIES.LOW;
  }

  // Set up real-time listener for user notifications
  static subscribeToUserNotifications(userId, callback, unreadOnly = false) {
    try {
      const notificationsRef = collection(db, 'notifications');
      let q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      if (unreadOnly) {
        q = query(
          notificationsRef,
          where('userId', '==', userId),
          where('isRead', '==', false),
          orderBy('createdAt', 'desc')
        );
      }
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = [];
        querySnapshot.forEach((doc) => {
          notifications.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(notifications);
      }, (error) => {
        console.error('Error in notification listener:', error);
        callback([]);
      });
      
      // Store the unsubscribe function
      this.listeners.set(`user_${userId}`, unsubscribe);
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notification listener:', error);
      return () => {};
    }
  }

  // Unsubscribe from real-time notifications
  static unsubscribeFromUserNotifications(userId) {
    const unsubscribe = this.listeners.get(`user_${userId}`);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(`user_${userId}`);
    }
  }

  // Trigger real-time notification for active listeners
  static triggerRealTimeNotification(userId, notification) {
    // This would typically integrate with a real-time system
    // For now, we'll emit a custom event that components can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('newNotification', {
        detail: { userId, notification }
      }));
    }
  }

  // Get notifications for a user (one-time fetch)
  static async getUserNotifications(userId, unreadOnly = false, limitCount = 50) {
    try {
      const notificationsRef = collection(db, 'notifications');
      let q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      if (unreadOnly) {
        q = query(
          notificationsRef,
          where('userId', '==', userId),
          where('isRead', '==', false),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const notifications = [];
      
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const updatePromises = [];
      
      querySnapshot.forEach((doc) => {
        updatePromises.push(
          updateDoc(doc.ref, {
            isRead: true,
            readAt: serverTimestamp()
          })
        );
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Delete all notifications for a user
  static async deleteAllUserNotifications(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting all user notifications:', error);
      throw error;
    }
  }

  // Get user notification settings
  static async getUserNotificationSettings(userId) {
    try {
      const settingsRef = doc(db, 'notificationSettings', userId);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        return settingsDoc.data();
      } else {
        // Create default settings if they don't exist
        const defaultSettings = {
          ...DEFAULT_NOTIFICATION_SETTINGS,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(settingsRef, defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  // Update user notification settings
  static async updateNotificationSettings(userId, settings) {
    try {
      const settingsRef = doc(db, 'notificationSettings', userId);
      const updateData = {
        ...settings,
        userId,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(settingsRef, updateData, { merge: true });
      return updateData;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // Schedule a notification
  static async scheduleNotification(userId, type, scheduledTime, data = {}) {
    try {
      const scheduledNotification = {
        userId,
        type,
        scheduledTime,
        data,
        status: 'scheduled',
        relatedId: data.relatedId || null,
        relatedType: data.relatedType || null,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'scheduledNotifications'), scheduledNotification);
      return { id: docRef.id, ...scheduledNotification };
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // Cancel scheduled notification
  static async cancelScheduledNotification(scheduledNotificationId) {
    try {
      const scheduledRef = doc(db, 'scheduledNotifications', scheduledNotificationId);
      await updateDoc(scheduledRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error cancelling scheduled notification:', error);
      throw error;
    }
  }

  // Process scheduled notifications (would typically be called by Cloud Functions)
  static async processScheduledNotifications() {
    try {
      const now = new Date();
      const scheduledRef = collection(db, 'scheduledNotifications');
      const q = query(
        scheduledRef,
        where('status', '==', 'scheduled'),
        where('scheduledTime', '<=', now)
      );
      
      const querySnapshot = await getDocs(q);
      const processPromises = [];
      
      querySnapshot.forEach((doc) => {
        const scheduled = doc.data();
        processPromises.push(this.processScheduledNotification(doc.id, scheduled));
      });
      
      await Promise.all(processPromises);
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      throw error;
    }
  }

  // Process individual scheduled notification
  static async processScheduledNotification(scheduledId, scheduledData) {
    try {
      const template = NOTIFICATION_TEMPLATES[scheduledData.type];
      if (!template) {
        console.warn(`No template found for notification type: ${scheduledData.type}`);
        return;
      }

      // Create the actual notification
      await this.createNotification(
        scheduledData.userId,
        scheduledData.type,
        template.title,
        template.message,
        scheduledData.data
      );

      // Mark scheduled notification as sent
      const scheduledRef = doc(db, 'scheduledNotifications', scheduledId);
      await updateDoc(scheduledRef, {
        status: 'sent',
        sentAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error processing individual scheduled notification:', error);
      throw error;
    }
  }

  // Notify all admins about new user registration
  static async notifyAdminsNewUser(newUser) {
    try {
      // Get all admin users
      const usersRef = collection(db, 'users');
      const adminQuery = query(
        usersRef,
        where('role', '==', 'admin'),
        where('status', '==', 'approved')
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      const notificationPromises = [];
      
      adminSnapshot.forEach((adminDoc) => {
        const admin = adminDoc.data();
        notificationPromises.push(
          this.createNotification(
            admin.uid,
            'user_approval',
            'ผู้ใช้ใหม่รอการอนุมัติ',
            `${newUser.firstName} ${newUser.lastName} (${newUser.email}) ได้สมัครสมาชิกใหม่และรอการอนุมัติ`,
            {
              newUserId: newUser.uid,
              userEmail: newUser.email,
              userName: `${newUser.firstName} ${newUser.lastName}`,
              actionUrl: '/admin/users'
            }
          )
        );
      });
      
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error notifying admins about new user:', error);
      throw error;
    }
  }

  // Notify user about approval status
  static async notifyUserApprovalStatus(userId, approved, approvedBy, rejectionReason = '') {
    try {
      const title = approved ? 'บัญชีได้รับการอนุมัติ' : 'บัญชีถูกปฏิเสธ';
      const message = approved 
        ? 'ยินดีต้อนรับสู่ระบบยืม-คืนอุปกรณ์! คุณสามารถใช้งานระบบได้แล้ว'
        : `บัญชีของคุณถูกปฏิเสธ${rejectionReason ? `: ${rejectionReason}` : ''}`;
      
      await this.createNotification(
        userId,
        approved ? 'user_approved' : 'user_rejected',
        title,
        message,
        {
          approved,
          approvedBy,
          rejectionReason,
          actionUrl: approved ? '/dashboard' : '/profile-setup'
        }
      );
    } catch (error) {
      console.error('Error notifying user about approval status:', error);
      throw error;
    }
  }

  // Notify user about profile update success
  static async notifyProfileUpdateSuccess(userId, updateType = 'general') {
    try {
      const messages = {
        general: 'ข้อมูลโปรไฟล์ของคุณได้รับการอัปเดตเรียบร้อยแล้ว',
        submission: 'คำขอสมัครสมาชิกของคุณได้รับการส่งเรียบร้อยแล้ว รอการตรวจสอบจากผู้ดูแลระบบ',
        completion: 'ข้อมูลโปรไฟล์ครบถ้วนแล้ว พร้อมส่งคำขอสมัครสมาชิก'
      };

      const titles = {
        general: 'อัปเดตข้อมูลสำเร็จ',
        submission: 'ส่งคำขอสำเร็จ',
        completion: 'โปรไฟล์ครบถ้วน'
      };

      await this.createNotification(
        userId,
        'profile_updated',
        titles[updateType] || titles.general,
        messages[updateType] || messages.general,
        {
          updateType,
          timestamp: new Date().toISOString(),
          actionUrl: updateType === 'submission' ? '/pending-approval' : '/profile-setup'
        }
      );
    } catch (error) {
      console.error('Error notifying user about profile update:', error);
      throw error;
    }
  }

  // Notify user about profile status change
  static async notifyProfileStatusChange(userId, newStatus, oldStatus, additionalData = {}) {
    try {
      const statusMessages = {
        pending: {
          title: 'ส่งคำขอสำเร็จ',
          message: 'คำขอสมัครสมาชิกของคุณอยู่ระหว่างการตรวจสอบ ระยะเวลาการอนุมัติโดยประมาณ 1-2 วันทำการ',
          actionUrl: '/pending-approval'
        },
        approved: {
          title: 'บัญชีได้รับการอนุมัติ',
          message: 'ยินดีต้อนรับ! บัญชีของคุณได้รับการอนุมัติแล้ว คุณสามารถใช้งานระบบได้เต็มรูปแบบ',
          actionUrl: '/dashboard'
        },
        rejected: {
          title: 'บัญชีไม่ได้รับการอนุมัติ',
          message: 'บัญชีของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อผู้ดูแลระบบเพื่อข้อมูลเพิ่มเติม',
          actionUrl: '/account-rejected'
        }
      };

      const statusInfo = statusMessages[newStatus];
      if (!statusInfo) return;

      await this.createNotification(
        userId,
        `profile_status_${newStatus}`,
        statusInfo.title,
        statusInfo.message,
        {
          newStatus,
          oldStatus,
          timestamp: new Date().toISOString(),
          actionUrl: statusInfo.actionUrl,
          ...additionalData
        }
      );
    } catch (error) {
      console.error('Error notifying user about profile status change:', error);
      throw error;
    }
  }

  // Notify admins about new loan request
  static async notifyAdminsNewLoanRequest(loanRequest, equipment, user) {
    try {
      // Get all admin users
      const usersRef = collection(db, 'users');
      const adminQuery = query(
        usersRef,
        where('role', '==', 'admin'),
        where('status', '==', 'approved')
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      const notificationPromises = [];
      
      adminSnapshot.forEach((adminDoc) => {
        const admin = adminDoc.data();
        notificationPromises.push(
          this.createNotification(
            admin.uid,
            'loan_request',
            'คำขอยืมอุปกรณ์ใหม่',
            `${user.firstName} ${user.lastName} ขอยืม ${equipment.name} (${equipment.brand} ${equipment.model})`,
            {
              loanRequestId: loanRequest.id,
              equipmentId: equipment.id,
              equipmentName: equipment.name,
              userId: user.uid,
              userName: `${user.firstName} ${user.lastName}`,
              actionUrl: '/admin/loan-requests'
            }
          )
        );
      });
      
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error notifying admins about new loan request:', error);
      throw error;
    }
  }

  // Notify user about loan request status
  static async notifyUserLoanRequestStatus(loanRequest, equipment, approved, rejectionReason = '') {
    try {
      const type = approved ? NOTIFICATION_TYPES.LOAN_APPROVED : NOTIFICATION_TYPES.LOAN_REJECTED;
      const data = {
        requestId: loanRequest.id,
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        approved,
        rejectionReason: rejectionReason ? `: ${rejectionReason}` : ''
      };
      
      await this.createNotification(
        loanRequest.userId,
        type,
        null, // Use template title
        null, // Use template message
        data
      );

      // Schedule reminder if approved
      if (approved && loanRequest.expectedReturnDate) {
        await this.scheduleLoanReminder(loanRequest, equipment);
      }
    } catch (error) {
      console.error('Error notifying user about loan request status:', error);
      throw error;
    }
  }

  // Schedule loan reminder notification
  static async scheduleLoanReminder(loanRequest, equipment) {
    try {
      const settings = await this.getUserNotificationSettings(loanRequest.userId);
      const reminderDays = settings.reminderTiming?.loanReminder || 1;
      
      const reminderDate = new Date(loanRequest.expectedReturnDate.toDate());
      reminderDate.setDate(reminderDate.getDate() - reminderDays);
      
      // Only schedule if reminder date is in the future
      if (reminderDate > new Date()) {
        await this.scheduleNotification(
          loanRequest.userId,
          NOTIFICATION_TYPES.LOAN_REMINDER,
          reminderDate,
          {
            loanId: loanRequest.id,
            equipmentName: equipment.name,
            dueDate: loanRequest.expectedReturnDate.toDate().toLocaleDateString('th-TH'),
            relatedId: loanRequest.id,
            relatedType: 'loan'
          }
        );
      }
    } catch (error) {
      console.error('Error scheduling loan reminder:', error);
      throw error;
    }
  }

  // Notify about reservation status
  static async notifyUserReservationStatus(reservation, equipment, approved, rejectionReason = '') {
    try {
      const type = approved ? NOTIFICATION_TYPES.RESERVATION_APPROVED : NOTIFICATION_TYPES.RESERVATION_REJECTED;
      const data = {
        reservationId: reservation.id,
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        reservationDate: reservation.startTime.toDate().toLocaleDateString('th-TH'),
        approved,
        rejectionReason: rejectionReason ? `: ${rejectionReason}` : ''
      };
      
      await this.createNotification(
        reservation.userId,
        type,
        null,
        null,
        data
      );

      // Schedule reminder if approved
      if (approved) {
        await this.scheduleReservationReminder(reservation, equipment);
      }
    } catch (error) {
      console.error('Error notifying user about reservation status:', error);
      throw error;
    }
  }

  // Schedule reservation reminder notification
  static async scheduleReservationReminder(reservation, equipment) {
    try {
      const settings = await this.getUserNotificationSettings(reservation.userId);
      const reminderHours = settings.reminderTiming?.reservationReminder || 24;
      
      const reminderDate = new Date(reservation.startTime.toDate());
      reminderDate.setHours(reminderDate.getHours() - reminderHours);
      
      // Only schedule if reminder date is in the future
      if (reminderDate > new Date()) {
        await this.scheduleNotification(
          reservation.userId,
          NOTIFICATION_TYPES.RESERVATION_REMINDER,
          reminderDate,
          {
            reservationId: reservation.id,
            equipmentName: equipment.name,
            hours: reminderHours,
            relatedId: reservation.id,
            relatedType: 'reservation'
          }
        );
      }

      // Schedule "ready" notification for reservation start time
      await this.scheduleNotification(
        reservation.userId,
        NOTIFICATION_TYPES.RESERVATION_READY,
        reservation.startTime.toDate(),
        {
          reservationId: reservation.id,
          equipmentName: equipment.name,
          relatedId: reservation.id,
          relatedType: 'reservation'
        }
      );
    } catch (error) {
      console.error('Error scheduling reservation reminder:', error);
      throw error;
    }
  }

  // Notify admins about new reservation request
  static async notifyAdminsNewReservationRequest(reservation, equipment, user) {
    try {
      // Get all admin users
      const usersRef = collection(db, 'users');
      const adminQuery = query(
        usersRef,
        where('role', '==', 'admin'),
        where('status', '==', 'approved')
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      const notificationPromises = [];
      
      adminSnapshot.forEach((adminDoc) => {
        const admin = adminDoc.data();
        notificationPromises.push(
          this.createNotification(
            admin.uid,
            NOTIFICATION_TYPES.RESERVATION_REQUEST,
            null,
            null,
            {
              reservationId: reservation.id,
              equipmentId: equipment.id,
              equipmentName: equipment.name,
              userId: user.uid,
              userName: `${user.firstName} ${user.lastName}`,
              reservationDate: reservation.startTime.toDate().toLocaleDateString('th-TH')
            }
          )
        );
      });
      
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error notifying admins about new reservation request:', error);
      throw error;
    }
  }

  // Notify about equipment return
  static async notifyEquipmentReturned(loanRequest, equipment, returnedBy) {
    try {
      await this.createNotification(
        loanRequest.userId,
        NOTIFICATION_TYPES.LOAN_RETURNED,
        'อุปกรณ์ถูกบันทึกการคืนแล้ว',
        `${equipment.name} ได้รับการบันทึกการคืนเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ`,
        {
          loanId: loanRequest.id,
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          returnedBy: returnedBy.displayName || returnedBy.email
        }
      );

      // Cancel any pending reminders for this loan
      await this.cancelLoanReminders(loanRequest.id);
    } catch (error) {
      console.error('Error notifying about equipment return:', error);
      throw error;
    }
  }

  // Cancel loan reminders
  static async cancelLoanReminders(loanId) {
    try {
      const scheduledRef = collection(db, 'scheduledNotifications');
      const q = query(
        scheduledRef,
        where('relatedId', '==', loanId),
        where('relatedType', '==', 'loan'),
        where('status', '==', 'scheduled')
      );
      
      const querySnapshot = await getDocs(q);
      const cancelPromises = [];
      
      querySnapshot.forEach((doc) => {
        cancelPromises.push(this.cancelScheduledNotification(doc.id));
      });
      
      await Promise.all(cancelPromises);
    } catch (error) {
      console.error('Error cancelling loan reminders:', error);
      throw error;
    }
  }

  // Send system notification to all users
  static async sendSystemNotification(title, message, data = {}, targetRole = null) {
    try {
      const usersRef = collection(db, 'users');
      let q = query(usersRef, where('status', '==', 'approved'));
      
      if (targetRole) {
        q = query(usersRef, where('role', '==', targetRole), where('status', '==', 'approved'));
      }
      
      const userSnapshot = await getDocs(q);
      const notificationPromises = [];
      
      userSnapshot.forEach((userDoc) => {
        const user = userDoc.data();
        notificationPromises.push(
          this.createNotification(
            user.uid,
            NOTIFICATION_TYPES.SYSTEM_UPDATE,
            title,
            message,
            data
          )
        );
      });
      
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error sending system notification:', error);
      throw error;
    }
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications() {
    try {
      const now = new Date();
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('expiresAt', '<=', now)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      if (querySnapshot.size > 0) {
        await batch.commit();
        console.log(`Cleaned up ${querySnapshot.size} expired notifications`);
      }
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }
}

export default NotificationService;