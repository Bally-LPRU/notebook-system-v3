/**
 * NotificationBell Component
 * 
 * A notification bell icon with dropdown that displays recent notifications.
 * For admin users, it uses the unified notification system to show combined
 * notifications from multiple sources (pending users, loan requests, etc.).
 * For regular users, it shows personal notifications only.
 * 
 * Features:
 * - Combined unread count badge
 * - Dropdown with recent notifications (top 5)
 * - Visual indicators for notification type and priority
 * - Mobile responsive design (full-width dropdown on mobile)
 * - Links to notification center
 * 
 * @component
 * @example
 * // Used in Navbar
 * <NotificationBell />
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import useAdminUnifiedNotifications from '../../hooks/useAdminUnifiedNotifications';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

const NotificationBell = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { 
    notifications: regularNotifications, 
    unreadCount: regularUnreadCount, 
    markAsRead: markRegularAsRead,
    showToast 
  } = useNotificationContext();
  
  // Callback for new admin notifications - show toast
  const handleNewAdminNotification = React.useCallback((notification) => {
    if (showToast) {
      showToast(notification);
    }
  }, [showToast]);
  
  // Use unified notifications for admin users with toast callback
  const {
    allNotifications: adminNotifications,
    counts: adminCounts,
    markAsRead: markAdminAsRead,
    loading: adminLoading
  } = useAdminUnifiedNotifications(user?.uid, isAdmin, handleNewAdminNotification);
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Determine which notifications to show based on user role
  const notifications = isAdmin ? adminNotifications : regularNotifications;
  const unreadCount = isAdmin ? adminCounts.unread : regularUnreadCount;
  
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
      if (isAdmin) {
        await markAdminAsRead(notification.id, notification.sourceType);
      } else {
        await markRegularAsRead(notification.id);
      }
    }
    
    // Navigate to action URL or link if available
    const targetUrl = notification.actionUrl || notification.link;
    if (targetUrl && targetUrl !== '#') {
      // Use react-router navigate for internal links to avoid page reload
      if (targetUrl.startsWith('/')) {
        navigate(targetUrl);
      } else {
        window.location.href = targetUrl;
      }
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

      {/* Dropdown Menu - Full width on mobile */}
      {isOpen && (
        <div className="fixed sm:absolute inset-x-0 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:mt-2 mx-2 sm:mx-0 sm:w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 max-h-[80vh] sm:max-h-[600px] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">การแจ้งเตือน</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {unreadCount} ใหม่
                  </span>
                )}
                {/* Close button for mobile */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden p-1 rounded-full hover:bg-gray-100"
                  aria-label="ปิด"
                >
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {adminLoading && isAdmin ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p>กำลังโหลด...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
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
                      {/* Icon or Priority Indicator for Admin */}
                      {isAdmin && notification.icon ? (
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${notification.iconBg || 'bg-gray-100'}`}>
                          {notification.icon}
                        </div>
                      ) : (
                        <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                          notification.priority === 'urgent' ? 'bg-red-500' :
                          notification.priority === 'high' ? 'bg-orange-500' :
                          notification.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`} />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <p className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            {/* Type badge for admin notifications */}
                            {isAdmin && notification.sourceType && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                notification.sourceType === 'personal' 
                                  ? 'bg-gray-100 text-gray-600' 
                                  : 'bg-blue-100 text-blue-600'
                              }`}>
                                {notification.sourceType === 'personal' ? 'ส่วนตัว' : 'งาน'}
                              </span>
                            )}
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className={`text-sm mt-1 ${
                          !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {notification.message || notification.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                          
                          {/* Priority badge for admin */}
                          {isAdmin && notification.priority && notification.priority !== 'low' && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              notification.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              notification.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {notification.priority === 'urgent' ? 'ด่วนมาก' :
                               notification.priority === 'high' ? 'ด่วน' : 'ปานกลาง'}
                            </span>
                          )}
                          
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
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <Link
              to={isAdmin ? '/admin/notifications' : '/notification-history'}
              className="block w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 sm:py-0"
              onClick={() => setIsOpen(false)}
            >
              ดูทั้งหมด
            </Link>
          </div>
        </div>
      )}
      
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;