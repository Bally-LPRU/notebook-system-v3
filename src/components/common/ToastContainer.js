import React from 'react';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { ProfileUpdateToast } from '../auth/ProfileUpdateNotifications';

/**
 * Toast Container Component
 * Displays toast notifications from the notification context
 * Implements requirements 2.4, 3.5
 */
const ToastContainer = ({ position = 'top-right', className = '' }) => {
  const { toastNotifications, hideToast } = useNotificationContext();

  if (!toastNotifications || toastNotifications.length === 0) {
    return null;
  }

  const getPositionClasses = () => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };
    return positions[position] || positions['top-right'];
  };

  return (
    <div 
      className={`fixed z-50 pointer-events-none ${getPositionClasses()} ${className}`}
      style={{ maxWidth: '420px' }}
    >
      <div className="space-y-3">
        {toastNotifications.map((toast) => (
          <div
            key={toast.id}
            className="transform transition-all duration-300 ease-in-out"
            style={{
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            <ProfileUpdateToast
              notification={toast}
              onClose={() => hideToast(toast.id)}
            />
          </div>
        ))}
      </div>
      
      {/* CSS Animation Styles */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        .toast-exit {
          animation: slideOutRight 0.3s ease-in forwards;
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;