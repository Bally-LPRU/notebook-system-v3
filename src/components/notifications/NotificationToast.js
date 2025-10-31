import React, { useEffect, useState, useCallback } from 'react';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import { useNotificationContext } from '../../contexts/NotificationContext';

const NotificationToast = ({ notification, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-hide after duration
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [duration, handleClose]);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const getToastStyle = () => {
    const baseClasses = "fixed top-4 right-4 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out z-50";
    
    if (isLeaving) {
      return `${baseClasses} translate-x-full opacity-0`;
    }
    
    if (isVisible) {
      return `${baseClasses} translate-x-0 opacity-100`;
    }
    
    return `${baseClasses} translate-x-full opacity-0`;
  };

  const getIcon = () => {
    const iconClasses = "h-6 w-6";
    
    switch (notification.priority) {
      case 'urgent':
        return <ExclamationCircleIcon className={`${iconClasses} text-red-600`} />;
      case 'high':
        return <ExclamationTriangleIcon className={`${iconClasses} text-orange-600`} />;
      case 'medium':
        return <InformationCircleIcon className={`${iconClasses} text-blue-600`} />;
      default:
        return <CheckCircleIcon className={`${iconClasses} text-green-600`} />;
    }
  };

  const getBorderColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-red-600';
      case 'high':
        return 'border-l-orange-600';
      case 'medium':
        return 'border-l-blue-600';
      default:
        return 'border-l-green-600';
    }
  };

  const handleActionClick = () => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    handleClose();
  };

  return (
    <div className={getToastStyle()}>
      <div className={`border-l-4 ${getBorderColor()}`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              
              <p className="mt-1 text-sm text-gray-500">
                {notification.message}
              </p>
              
              {notification.actionText && notification.actionUrl && (
                <div className="mt-3">
                  <button
                    onClick={handleActionClick}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                  >
                    {notification.actionText}
                  </button>
                </div>
              )}
            </div>
            
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleClose}
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <span className="sr-only">ปิด</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="bg-gray-200 h-1">
          <div 
            className={`h-full transition-all ease-linear ${
              notification.priority === 'urgent' ? 'bg-red-600' :
              notification.priority === 'high' ? 'bg-orange-600' :
              notification.priority === 'medium' ? 'bg-blue-600' :
              'bg-green-600'
            }`}
            style={{
              width: '100%',
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// Toast Container Component
export const NotificationToastContainer = () => {
  const { toastNotifications, hideToast } = useNotificationContext();

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 pointer-events-none">
      {toastNotifications.map((toast, index) => (
        <div
          key={toast.id}
          style={{ 
            transform: `translateY(${index * 10}px)`,
            zIndex: 1000 - index 
          }}
        >
          <NotificationToast
            notification={toast}
            onClose={() => hideToast(toast.id)}
            duration={toast.duration || 5000}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;