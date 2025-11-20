import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import settingsService from '../../services/settingsService';
import { NOTIFICATION_PRIORITIES } from '../../types/settings';

/**
 * SystemNotificationModal Component
 * 
 * Displays unread system notifications to users on login.
 * Allows users to mark notifications as read and submit feedback.
 * 
 * Requirements: 7.4, 7.6
 */
const SystemNotificationModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (isOpen && user?.uid) {
      loadUnreadNotifications();
    }
  }, [isOpen, user?.uid]);

  const loadUnreadNotifications = async () => {
    try {
      setLoading(true);
      const unread = await settingsService.getUnreadSystemNotifications(user.uid);
      setNotifications(unread);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading unread notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    if (notifications.length === 0) return;

    const currentNotification = notifications[currentIndex];
    
    try {
      await settingsService.markSystemNotificationAsRead(currentNotification.id, user.uid);
      
      // Move to next notification or close if this was the last one
      if (currentIndex < notifications.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setFeedbackText('');
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;

    const currentNotification = notifications[currentIndex];
    
    try {
      setSubmittingFeedback(true);
      await settingsService.submitNotificationFeedback(
        currentNotification.id,
        user.uid,
        feedbackText
      );
      
      // Mark as read and move to next
      await handleMarkAsRead();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSkip = () => {
    if (currentIndex < notifications.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFeedbackText('');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-700">กำลังโหลดการแจ้งเตือน...</span>
          </div>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  const currentNotification = notifications[currentIndex];
  const priorityColors = {
    [NOTIFICATION_PRIORITIES.LOW]: 'bg-gray-100 text-gray-800',
    [NOTIFICATION_PRIORITIES.MEDIUM]: 'bg-blue-100 text-blue-800',
    [NOTIFICATION_PRIORITIES.HIGH]: 'bg-red-100 text-red-800'
  };

  const priorityLabels = {
    [NOTIFICATION_PRIORITIES.LOW]: 'ต่ำ',
    [NOTIFICATION_PRIORITIES.MEDIUM]: 'ปานกลาง',
    [NOTIFICATION_PRIORITIES.HIGH]: 'สูง'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">การแจ้งเตือนจากระบบ</h2>
            <span className="text-sm bg-blue-500 px-3 py-1 rounded-full">
              {currentIndex + 1} / {notifications.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Priority Badge */}
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${priorityColors[currentNotification.priority]}`}>
              ระดับความสำคัญ: {priorityLabels[currentNotification.priority]}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {currentNotification.title}
          </h3>

          {/* Content */}
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">
              {currentNotification.content}
            </p>
          </div>

          {/* Expiration Notice */}
          {currentNotification.expiresAt && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">หมายเหตุ:</span> การแจ้งเตือนนี้จะหมดอายุในวันที่{' '}
                {new Date(currentNotification.expiresAt).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Feedback Section */}
          {currentNotification.feedbackEnabled && (
            <div className="border-t pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentNotification.feedbackQuestion}
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="กรุณาแสดงความคิดเห็นของคุณ..."
                disabled={submittingFeedback}
              />
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-4 text-sm text-gray-500">
            ส่งเมื่อ: {new Date(currentNotification.createdAt).toLocaleString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 focus:outline-none"
            disabled={submittingFeedback}
          >
            ข้าม
          </button>

          <div className="flex space-x-3">
            {currentNotification.feedbackEnabled ? (
              <button
                onClick={handleSubmitFeedback}
                disabled={!feedbackText.trim() || submittingFeedback}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingFeedback ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
              </button>
            ) : (
              <button
                onClick={handleMarkAsRead}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currentIndex < notifications.length - 1 ? 'ถัดไป' : 'ปิด'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemNotificationModal;
