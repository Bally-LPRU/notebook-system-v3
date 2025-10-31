import React, { useState, useMemo } from 'react';
import { 
  BellIcon, 
  TrashIcon, 
  CheckIcon, 
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { formatDistanceToNow, format } from 'date-fns';
import { th } from 'date-fns/locale';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../types/notification';

const NotificationCenter = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error,
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    deleteAllNotifications,
    refresh 
  } = useNotificationContext();

  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by read status
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.isRead);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(n => n.priority === priorityFilter);
    }

    return filtered;
  }, [notifications, filter, typeFilter, priorityFilter]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleSelectNotification = (notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const handleBulkMarkAsRead = async () => {
    const promises = Array.from(selectedNotifications).map(id => {
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.isRead) {
        return markAsRead(id);
      }
      return Promise.resolve();
    });
    
    await Promise.all(promises);
    setSelectedNotifications(new Set());
  };

  const handleBulkDelete = async () => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบการแจ้งเตือนที่เลือก?')) {
      const promises = Array.from(selectedNotifications).map(id => deleteNotification(id));
      await Promise.all(promises);
      setSelectedNotifications(new Set());
    }
  };

  const formatNotificationTime = (createdAt) => {
    if (!createdAt) return '';
    
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true, locale: th });
    } else {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: th });
    }
  };

  const getNotificationIcon = (type) => {
    // Return appropriate icon based on notification type
    return <BellIcon className="h-5 w-5" />;
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      urgent: 'ด่วนมาก',
      high: 'สำคัญ',
      medium: 'ปานกลาง',
      low: 'ทั่วไป'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || colors.low}`}>
        {labels[priority] || labels.low}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      [NOTIFICATION_TYPES.USER_APPROVAL]: 'อนุมัติผู้ใช้',
      [NOTIFICATION_TYPES.LOAN_REQUEST]: 'คำขอยืม',
      [NOTIFICATION_TYPES.LOAN_APPROVED]: 'อนุมัติการยืม',
      [NOTIFICATION_TYPES.LOAN_REJECTED]: 'ปฏิเสธการยืม',
      [NOTIFICATION_TYPES.LOAN_REMINDER]: 'แจ้งเตือนคืน',
      [NOTIFICATION_TYPES.RESERVATION_REQUEST]: 'คำขอจอง',
      [NOTIFICATION_TYPES.RESERVATION_APPROVED]: 'อนุมัติการจอง',
      [NOTIFICATION_TYPES.SYSTEM_UPDATE]: 'อัปเดตระบบ'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">เกิดข้อผิดพลาด: {error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ศูนย์การแจ้งเตือน</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `มีการแจ้งเตือนใหม่ ${unreadCount} รายการ` : 'ไม่มีการแจ้งเตือนใหม่'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              ตัวกรอง
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                อ่านทั้งหมด
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สถานะ
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="unread">ยังไม่อ่าน</option>
                  <option value="read">อ่านแล้ว</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภท
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">ทั้งหมด</option>
                  {Object.values(NOTIFICATION_TYPES).map(type => (
                    <option key={type} value={type}>{getTypeLabel(type)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ความสำคัญ
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">ทั้งหมด</option>
                  {Object.values(NOTIFICATION_PRIORITIES).map(priority => (
                    <option key={priority} value={priority}>
                      {priority === 'urgent' ? 'ด่วนมาก' :
                       priority === 'high' ? 'สำคัญ' :
                       priority === 'medium' ? 'ปานกลาง' : 'ทั่วไป'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedNotifications.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-800">
              เลือกแล้ว {selectedNotifications.size} รายการ
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkMarkAsRead}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                ทำเครื่องหมายว่าอ่านแล้ว
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                ลบ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white shadow rounded-lg">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีการแจ้งเตือน</h3>
            <p className="text-gray-500">
              {filter === 'unread' ? 'ไม่มีการแจ้งเตือนที่ยังไม่อ่าน' : 'ไม่มีการแจ้งเตือนในขณะนี้'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Select All Header */}
            <div className="px-6 py-3 bg-gray-50 flex items-center">
              <input
                type="checkbox"
                checked={selectedNotifications.size === filteredNotifications.length}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-3 text-sm text-gray-700">
                เลือกทั้งหมด ({filteredNotifications.length} รายการ)
              </label>
            </div>

            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors duration-200 ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getNotificationIcon(notification.type)}
                        <h3 className={`text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(notification.priority)}
                        <span className="text-xs text-gray-500">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <p className={`text-sm mt-1 ${
                      !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getTypeLabel(notification.type)}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        {notification.actionText && notification.actionUrl && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {notification.actionText}
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                          title="ลบการแจ้งเตือน"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear All Button */}
      {notifications.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบการแจ้งเตือนทั้งหมด?')) {
                deleteAllNotifications();
              }
            }}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            ลบการแจ้งเตือนทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;