import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import settingsService from '../../../services/settingsService';
import SystemNotificationComposer from './SystemNotificationComposer';
import NotificationHistoryViewer from './NotificationHistoryViewer';

/**
 * SystemNotificationsTab Component
 * 
 * Main tab for managing system notifications.
 * Combines the composer and history viewer.
 * 
 * Requirements: 7.1, 7.2, 7.5, 7.6
 */
const SystemNotificationsTab = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('compose'); // 'compose' or 'history'
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendNotification = async (notificationData) => {
    try {
      setSending(true);
      setSuccessMessage('');
      setErrorMessage('');

      const result = await settingsService.createSystemNotification(notificationData, user.uid);

      setSuccessMessage(`ส่งการแจ้งเตือนสำเร็จ! ส่งถึง ${result.sentCount} ผู้ใช้`);
      
      // Switch to history view after 2 seconds
      setTimeout(() => {
        setActiveView('history');
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error sending notification:', error);
      setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveView('compose')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeView === 'compose'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            สร้างการแจ้งเตือน
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeView === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ประวัติการแจ้งเตือน
          </button>
        </nav>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setErrorMessage('')}
                className="inline-flex text-red-400 hover:text-red-500"
              >
                <span className="sr-only">ปิด</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {activeView === 'compose' ? (
        <SystemNotificationComposer
          onSend={handleSendNotification}
          loading={sending}
        />
      ) : (
        <NotificationHistoryViewer />
      )}
    </div>
  );
};

export default SystemNotificationsTab;
