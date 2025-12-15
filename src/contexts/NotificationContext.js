import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import NotificationService from '../services/notificationService';

// Notification context
const NotificationContext = createContext();

// Action types
const NOTIFICATION_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
  DELETE_ALL_NOTIFICATIONS: 'DELETE_ALL_NOTIFICATIONS',
  SET_ERROR: 'SET_ERROR',
  SHOW_TOAST: 'SHOW_TOAST',
  HIDE_TOAST: 'HIDE_TOAST'
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: null,
  toastNotifications: []
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
        loading: false,
        error: null
      };

    case NOTIFICATION_ACTIONS.SET_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload
      };

    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };

    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date()
        })),
        unreadCount: 0
      };

    case NOTIFICATION_ACTIONS.DELETE_NOTIFICATION:
      const deletedNotification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: deletedNotification && !deletedNotification.isRead 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount
      };

    case NOTIFICATION_ACTIONS.DELETE_ALL_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };

    case NOTIFICATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case NOTIFICATION_ACTIONS.SHOW_TOAST:
      return {
        ...state,
        toastNotifications: [...state.toastNotifications, action.payload]
      };

    case NOTIFICATION_ACTIONS.HIDE_TOAST:
      return {
        ...state,
        toastNotifications: state.toastNotifications.filter(
          toast => toast.id !== action.payload
        )
      };

    default:
      return state;
  }
};

// Provider component
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Load initial notifications
  useEffect(() => {
    if (!user?.uid) {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: false });
      return;
    }

    const loadInitialData = async () => {
      try {
        dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: true });
        
        const [notifications, unreadCount] = await Promise.all([
          NotificationService.getUserNotifications(user.uid, false, 50),
          NotificationService.getUnreadCount(user.uid)
        ]);
        
        dispatch({ type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS, payload: notifications });
        dispatch({ type: NOTIFICATION_ACTIONS.SET_UNREAD_COUNT, payload: unreadCount });
      } catch (error) {
        console.error('Error loading notifications:', error);
        dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: error.message });
      }
    };

    loadInitialData();
  }, [user?.uid]);

  // Actions
  const hideToast = useCallback((toastId) => {
    dispatch({ type: NOTIFICATION_ACTIONS.HIDE_TOAST, payload: toastId });
  }, []);

  const showToast = useCallback((notification, duration = 5000) => {
    const toastId = Date.now().toString();
    const toast = {
      id: toastId,
      ...notification,
      duration
    };

    dispatch({ type: NOTIFICATION_ACTIONS.SHOW_TOAST, payload: toast });

    // Auto-hide toast after duration
    setTimeout(() => {
      hideToast(toastId);
    }, duration);
  }, [hideToast]);

  const markAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      dispatch({ type: NOTIFICATION_ACTIONS.MARK_AS_READ, payload: notificationId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  const markAllAsRead = async () => {
    if (!user?.uid) return;

    try {
      await NotificationService.markAllAsRead(user.uid);
      dispatch({ type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      dispatch({ type: NOTIFICATION_ACTIONS.DELETE_NOTIFICATION, payload: notificationId });
    } catch (error) {
      console.error('Error deleting notification:', error);
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  const deleteAllNotifications = async () => {
    if (!user?.uid) return;

    try {
      await NotificationService.deleteAllUserNotifications(user.uid);
      dispatch({ type: NOTIFICATION_ACTIONS.DELETE_ALL_NOTIFICATIONS });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Set up real-time listener with toast notifications for new items
  useEffect(() => {
    if (!user?.uid) return;

    let previousNotificationIds = new Set();
    let isInitialLoad = true;

    const unsubscribe = NotificationService.subscribeToUserNotifications(
      user.uid,
      (notifications) => {
        // Get current notification IDs
        const currentIds = new Set(notifications.map(n => n.id));
        
        // Find new notifications (not in previous set)
        if (!isInitialLoad) {
          const newNotifications = notifications.filter(n => !previousNotificationIds.has(n.id));
          
          // Show toast for each new notification
          newNotifications.forEach(notification => {
            console.log('🔔 New notification received:', notification.title);
            showToast({
              title: notification.title,
              message: notification.message,
              type: notification.type,
              priority: notification.priority
            });
          });
        }
        
        // Update previous IDs for next comparison
        previousNotificationIds = currentIds;
        isInitialLoad = false;
        
        // Update state
        dispatch({ type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS, payload: notifications });
        
        // Update unread count
        const unreadCount = notifications.filter(n => !n.isRead).length;
        dispatch({ type: NOTIFICATION_ACTIONS.SET_UNREAD_COUNT, payload: unreadCount });
      }
    );

    // Listen for new notifications from window events (for same-tab updates)
    const handleNewNotification = async (event) => {
      if (event.detail.userId === user.uid) {
        const { notification } = event.detail;
        
        // Show toast notification
        showToast({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority
        });
      }
    };

    window.addEventListener('newNotification', handleNewNotification);

    return () => {
      unsubscribe();
      NotificationService.unsubscribeFromUserNotifications(user.uid);
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, [user?.uid, showToast]);

  const refresh = async () => {
    if (!user?.uid) return;

    try {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: true });
      
      const [notifications, unreadCount] = await Promise.all([
        NotificationService.getUserNotifications(user.uid, false, 50),
        NotificationService.getUnreadCount(user.uid)
      ]);
      
      dispatch({ type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS, payload: notifications });
      dispatch({ type: NOTIFICATION_ACTIONS.SET_UNREAD_COUNT, payload: unreadCount });
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  const value = {
    ...state,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    showToast,
    hideToast,
    refresh
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notification context
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;