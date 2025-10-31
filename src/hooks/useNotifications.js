import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NotificationService from '../services/notificationService';

export const useNotifications = (options = {}) => {
  const { user } = useAuth();
  const { 
    unreadOnly = false, 
    limit = 50, 
    realTime = true,
    autoMarkAsRead = false 
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      
      const [notificationsList, count] = await Promise.all([
        NotificationService.getUserNotifications(user.uid, unreadOnly, limit),
        NotificationService.getUnreadCount(user.uid)
      ]);
      
      setNotifications(notificationsList);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, unreadOnly, limit]);

  // Set up real-time listener
  useEffect(() => {
    if (!user?.uid || !realTime) {
      loadNotifications();
      return;
    }

    const unsubscribe = NotificationService.subscribeToUserNotifications(
      user.uid,
      (notificationsList) => {
        setNotifications(notificationsList);
        setLoading(false);
        setError(null);
      },
      unreadOnly
    );

    // Also get unread count
    const updateUnreadCount = async () => {
      try {
        const count = await NotificationService.getUnreadCount(user.uid);
        setUnreadCount(count);
      } catch (err) {
        console.error('Error getting unread count:', err);
      }
    };

    updateUnreadCount();

    // Listen for new notifications
    const handleNewNotification = (event) => {
      if (event.detail.userId === user.uid) {
        updateUnreadCount();
      }
    };

    window.addEventListener('newNotification', handleNewNotification);

    return () => {
      unsubscribe();
      NotificationService.unsubscribeFromUserNotifications(user.uid);
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, [user?.uid, unreadOnly, realTime, loadNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err.message);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;

    try {
      await NotificationService.markAllAsRead(user.uid);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          isRead: true, 
          readAt: new Date() 
        }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err.message);
    }
  }, [user?.uid]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if deleted notification was unread
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err.message);
    }
  }, [notifications]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    if (!user?.uid) return;

    try {
      await NotificationService.deleteAllUserNotifications(user.uid);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      setError(err.message);
    }
  }, [user?.uid]);

  // Refresh notifications
  const refresh = useCallback(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Auto mark as read when notification is viewed
  useEffect(() => {
    if (!autoMarkAsRead || !notifications.length) return;

    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    const timer = setTimeout(() => {
      unreadNotifications.forEach(notification => {
        markAsRead(notification.id);
      });
    }, 2000); // Mark as read after 2 seconds

    return () => clearTimeout(timer);
  }, [notifications, autoMarkAsRead, markAsRead]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh
  };
};

export const useNotificationSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load notification settings
  const loadSettings = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const userSettings = await NotificationService.getUserNotificationSettings(user.uid);
      setSettings(userSettings);
    } catch (err) {
      console.error('Error loading notification settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Update notification settings
  const updateSettings = useCallback(async (newSettings) => {
    if (!user?.uid) return;

    try {
      setError(null);
      const updatedSettings = await NotificationService.updateNotificationSettings(user.uid, newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError(err.message);
      throw err;
    }
  }, [user?.uid]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refresh: loadSettings
  };
};

export default useNotifications;