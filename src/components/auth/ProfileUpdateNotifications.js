import React, { useState, useEffect } from 'react';
import { useNotificationContext } from '../../contexts/NotificationContext';

/**
 * Profile Update Notifications Component
 * Implements requirements 2.4, 3.5
 * 
 * Features:
 * - Success confirmation messages after profile updates
 * - Timestamp display for last profile modifications
 * - Notification system for status changes
 */
const ProfileUpdateNotifications = ({ 
  profile, 
  lastUpdateResult = null,
  onDismiss = null,
  className = '' 
}) => {
  const { showToast } = useNotificationContext();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // Handle profile update success
  useEffect(() => {
    if (lastUpdateResult?.success) {
      setShowSuccessMessage(true);
      setLastUpdateTime(new Date());
      
      // Show toast notification
      showToast({
        type: 'success',
        title: 'บันทึกข้อมูลสำเร็จ',
        message: 'ข้อมูลโปรไฟล์ของคุณได้รับการอัปเดตแล้ว',
        icon: 'check-circle'
      });

      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [lastUpdateResult, showToast]);

  // Handle status change notifications
  useEffect(() => {
    if (profile?.status && lastUpdateResult?.previousStatus && 
        profile.status !== lastUpdateResult.previousStatus) {
      
      const statusMessages = {
        pending: {
          title: 'ส่งคำขอสำเร็จ',
          message: 'คำขอสมัครสมาชิกของคุณอยู่ระหว่างการตรวจสอบ',
          type: 'info',
          icon: 'clock'
        },
        approved: {
          title: 'บัญชีได้รับการอนุมัติ',
          message: 'ยินดีต้อนรับ! คุณสามารถใช้งานระบบได้แล้ว',
          type: 'success',
          icon: 'check-circle'
        },
        rejected: {
          title: 'บัญชีไม่ได้รับการอนุมัติ',
          message: 'กรุณาติดต่อผู้ดูแลระบบเพื่อข้อมูลเพิ่มเติม',
          type: 'error',
          icon: 'x-circle'
        }
      };

      const statusNotification = statusMessages[profile.status];
      if (statusNotification) {
        showToast({
          ...statusNotification,
          duration: 8000 // Longer duration for status changes
        });
      }
    }
  }, [profile?.status, lastUpdateResult, showToast]);

  // Get formatted timestamp
  const getFormattedTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'เมื่อสักครู่';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} นาทีที่แล้ว`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ชั่วโมงที่แล้ว`;
    } else {
      return date.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Success confirmation message
  const SuccessMessage = () => {
    if (!showSuccessMessage) return null;

    return (
      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-green-800">
              บันทึกข้อมูลสำเร็จ
            </h3>
            <p className="mt-1 text-sm text-green-700">
              ข้อมูลโปรไฟล์ของคุณได้รับการอัปเดตเรียบร้อยแล้ว
              {lastUpdateTime && (
                <span className="block text-xs text-green-600 mt-1">
                  อัปเดตเมื่อ: {getFormattedTimestamp(lastUpdateTime)}
                </span>
              )}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              type="button"
              className="inline-flex text-green-400 hover:text-green-600 focus:outline-none focus:text-green-600"
              onClick={() => {
                setShowSuccessMessage(false);
                if (onDismiss) onDismiss();
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Last update timestamp display
  const LastUpdateDisplay = () => {
    const updateTime = profile?.updatedAt || profile?.createdAt;
    if (!updateTime) return null;

    return (
      <div className="text-center py-2">
        <p className="text-xs text-gray-500">
          อัปเดตล่าสุด: {getFormattedTimestamp(updateTime)}
        </p>
      </div>
    );
  };

  // Status change notification
  const StatusChangeNotification = () => {
    if (!profile?.status || !lastUpdateResult?.statusChanged) return null;

    const getStatusInfo = (status) => {
      switch (status) {
        case 'pending':
          return {
            color: 'blue',
            icon: 'clock',
            title: 'ส่งคำขอสำเร็จ',
            message: 'คำขอสมัครสมาชิกของคุณอยู่ระหว่างการตรวจสอบ ระยะเวลาการอนุมัติโดยประมาณ 1-2 วันทำการ'
          };
        case 'approved':
          return {
            color: 'green',
            icon: 'check-circle',
            title: 'บัญชีได้รับการอนุมัติ',
            message: 'ยินดีต้อนรับ! บัญชีของคุณได้รับการอนุมัติแล้ว คุณสามารถใช้งานระบบได้เต็มรูปแบบ'
          };
        case 'rejected':
          return {
            color: 'red',
            icon: 'x-circle',
            title: 'บัญชีไม่ได้รับการอนุมัติ',
            message: 'บัญชีของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อผู้ดูแลระบบเพื่อข้อมูลเพิ่มเติม'
          };
        default:
          return null;
      }
    };

    const statusInfo = getStatusInfo(profile.status);
    if (!statusInfo) return null;

    const colorClasses = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: 'text-green-600'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-600'
      }
    };

    const colors = colorClasses[statusInfo.color];

    const getIcon = (iconName) => {
      const icons = {
        clock: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        'check-circle': (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        'x-circle': (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
      return icons[iconName];
    };

    return (
      <div className={`mb-4 p-4 ${colors.bg} ${colors.border} border rounded-lg`}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${colors.icon}`}>
            {getIcon(statusInfo.icon)}
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${colors.text}`}>
              {statusInfo.title}
            </h3>
            <p className={`mt-1 text-sm ${colors.text} opacity-90`}>
              {statusInfo.message}
            </p>
            {profile.updatedAt && (
              <p className={`mt-2 text-xs ${colors.text} opacity-75`}>
                เปลี่ยนแปลงเมื่อ: {getFormattedTimestamp(profile.updatedAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <SuccessMessage />
      <StatusChangeNotification />
      <LastUpdateDisplay />
    </div>
  );
};

// Toast Notification Component (for use with NotificationContext)
export const ProfileUpdateToast = ({ notification, onClose }) => {
  const getIcon = (iconName) => {
    const icons = {
      'check-circle': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      clock: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'x-circle': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      info: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
    return icons[iconName] || icons.info;
  };

  const getColorClasses = (type) => {
    const colors = {
      success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: 'text-green-600'
      },
      info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-600'
      },
      error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-600'
      },
      warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-600'
      }
    };
    return colors[type] || colors.info;
  };

  const colors = getColorClasses(notification.type);

  return (
    <div className={`max-w-sm w-full ${colors.bg} ${colors.border} border rounded-lg shadow-lg pointer-events-auto`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${colors.icon}`}>
            {getIcon(notification.icon)}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${colors.text}`}>
              {notification.title}
            </p>
            <p className={`mt-1 text-sm ${colors.text} opacity-90`}>
              {notification.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`inline-flex ${colors.text} hover:opacity-75 focus:outline-none focus:opacity-75`}
              onClick={onClose}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileUpdateNotifications;