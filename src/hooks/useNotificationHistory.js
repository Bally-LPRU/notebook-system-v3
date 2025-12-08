import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NotificationService from '../services/notificationService';

/**
 * Hook for managing notification history with filtering and grouping
 * Requirements: 10.1, 10.3, 10.4, 10.5
 */
export const useNotificationHistory = (options = {}) => {
  const { user } = useAuth();
  const { 
    limit = 100,
    realTime = true
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: null, // 'system' | 'loan' | 'approval' | 'reminder' | null (all)
    dateRange: null, // { start: Date, end: Date } | null
    readStatus: null // 'read' | 'unread' | null (all)
  });

  // Map notification types to filter categories
  const typeCategories = useMemo(() => ({
    system: ['system_update', 'equipment_maintenance'],
    loan: ['loan_request', 'loan_approved', 'loan_rejected', 'loan_reminder', 'loan_overdue', 'loan_returned'],
    approval: ['user_approval', 'user_approved', 'user_rejected', 'profile_updated', 'profile_status_pending', 'profile_status_approved', 'profile_status_rejected'],
    reminder: ['loan_reminder', 'reservation_reminder', 'reservation_ready']
  }), []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      
      const notificationsList = await NotificationService.getUserNotifications(user.uid, false, limit);
      setNotifications(notificationsList);
    } catch (err) {
      console.error('Error loading notification history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, limit]);

  // Set up real-time listener or one-time fetch
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    if (realTime) {
      const unsubscribe = NotificationService.subscribeToUserNotifications(
        user.uid,
        (notificationsList) => {
          setNotifications(notificationsList);
          setLoading(false);
          setError(null);
        },
        false // Get all notifications, not just unread
      );

      return () => {
        unsubscribe();
        NotificationService.unsubscribeFromUserNotifications(user.uid);
      };
    } else {
      loadNotifications();
    }
  }, [user?.uid, realTime, loadNotifications]);

  // Filter notifications based on current filters
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    // Filter by type category
    if (filters.type) {
      const allowedTypes = typeCategories[filters.type] || [];
      result = result.filter(n => allowedTypes.includes(n.type));
    }

    // Filter by date range
    if (filters.dateRange?.start || filters.dateRange?.end) {
      result = result.filter(n => {
        const notificationDate = n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt);
        
        if (filters.dateRange.start && notificationDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end) {
          const endOfDay = new Date(filters.dateRange.end);
          endOfDay.setHours(23, 59, 59, 999);
          if (notificationDate > endOfDay) {
            return false;
          }
        }
        return true;
      });
    }

    // Filter by read status
    if (filters.readStatus === 'read') {
      result = result.filter(n => n.isRead === true);
    } else if (filters.readStatus === 'unread') {
      result = result.filter(n => n.isRead === false);
    }

    return result;
  }, [notifications, filters, typeCategories]);

  // Group notifications by date
  const groupedByDate = useMemo(() => {
    return groupNotificationsByDate(filteredNotifications);
  }, [filteredNotifications]);

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
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err.message);
      throw err;
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
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err.message);
      throw err;
    }
  }, [user?.uid]);

  // Get unread count from filtered notifications
  const unreadCount = useMemo(() => {
    return filteredNotifications.filter(n => !n.isRead).length;
  }, [filteredNotifications]);

  // Refresh notifications
  const refresh = useCallback(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications: filteredNotifications,
    groupedByDate,
    loading,
    error,
    filters,
    setFilters,
    markAsRead,
    markAllAsRead,
    unreadCount,
    refresh,
    totalCount: notifications.length
  };
};

/**
 * Group notifications by date
 * Each notification appears in exactly one group corresponding to its timestamp's date
 * @param {Array} notifications - Array of notification objects
 * @returns {Object} Object with date strings as keys and arrays of notifications as values
 */
export function groupNotificationsByDate(notifications) {
  if (!notifications || !Array.isArray(notifications)) {
    return {};
  }
  
  const groups = {};
  
  for (const notification of notifications) {
    const dateKey = getDateKey(notification.createdAt);
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(notification);
  }
  
  return groups;
}

/**
 * Get date key string from timestamp
 * @param {Date|Object} timestamp - Date object or Firestore timestamp
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getDateKey(timestamp) {
  if (!timestamp) {
    return 'unknown';
  }
  
  let date;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return 'unknown';
  }
  
  // Format as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format date key for display in Thai
 * @param {string} dateKey - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string in Thai
 */
export function formatDateKeyThai(dateKey) {
  if (dateKey === 'unknown') {
    return 'ไม่ทราบวันที่';
  }
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayKey = getDateKey(today);
  const yesterdayKey = getDateKey(yesterday);
  
  if (dateKey === todayKey) {
    return 'วันนี้';
  }
  if (dateKey === yesterdayKey) {
    return 'เมื่อวาน';
  }
  
  // Parse the date key
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  // Format in Thai
  return date.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default useNotificationHistory;
