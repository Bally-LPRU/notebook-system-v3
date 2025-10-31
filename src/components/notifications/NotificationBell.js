import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get recent notifications (last 5)
  const recentNotifications = notifications.slice(0, 5);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    setIsOpen(false);
  };

  const formatNotificationTime = (createdAt) => {
    if (!createdAt) return '';
    
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: th 
    });
  };



  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-colors duration-200"
        aria-label={`การแจ้งเตือน ${unreadCount > 0 ? `(${unreadCount} รายการใหม่)` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6 text-blue-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[1.25rem] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {unreadCount} ใหม่
                </span>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Priority Indicator */}
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        notification.priority === 'urgent' ? 'bg-red-500' :
                        notification.priority === 'high' ? 'bg-orange-500' :
                        notification.priority === 'medium' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className={`text-sm mt-1 ${
                          !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                          
                          {notification.actionText && (
                            <span className="text-xs text-blue-600 font-medium">
                              {notification.actionText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                window.location.href = '/notifications';
                setIsOpen(false);
              }}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
            >
              ดูการแจ้งเตือนทั้งหมด
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;