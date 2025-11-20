import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import settingsService from '../services/settingsService';

/**
 * useSystemNotifications Hook
 * 
 * Manages system notifications for the current user.
 * Checks for unread notifications on login and provides methods to interact with them.
 * 
 * Requirements: 7.4
 */
const useSystemNotifications = () => {
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Check for unread notifications when user logs in
  useEffect(() => {
    if (user?.uid && !hasChecked) {
      checkUnreadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, hasChecked]);

  const checkUnreadNotifications = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const unread = await settingsService.getUnreadSystemNotifications(user.uid);
      setUnreadNotifications(unread);
      setHasChecked(true);

      // Show modal if there are unread notifications
      if (unread.length > 0) {
        setShowModal(true);
      }
    } catch (error) {
      // Log error but don't block the app
      console.warn('System notifications check failed (non-critical):', error.message);
      setHasChecked(true); // Mark as checked to prevent retry loops
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const unread = await settingsService.getUnreadSystemNotifications(user.uid);
      setUnreadNotifications(unread);
    } catch (error) {
      // Log error but don't block the app
      console.warn('System notifications refresh failed (non-critical):', error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    if (!user?.uid) return;

    try {
      await settingsService.markSystemNotificationAsRead(notificationId, user.uid);
      // Remove from unread list
      setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const submitFeedback = async (notificationId, response) => {
    if (!user?.uid) return;

    try {
      await settingsService.submitNotificationFeedback(notificationId, user.uid, response);
      // Mark as read after submitting feedback
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const openModal = () => {
    setShowModal(true);
  };

  return {
    unreadNotifications,
    showModal,
    loading,
    checkUnreadNotifications,
    refreshNotifications,
    markAsRead,
    submitFeedback,
    closeModal,
    openModal
  };
};

export default useSystemNotifications;
