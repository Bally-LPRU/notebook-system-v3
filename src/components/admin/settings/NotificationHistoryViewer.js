import React, { useState, useEffect } from 'react';
import settingsService from '../../../services/settingsService';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../../types/settings';

/**
 * NotificationHistoryViewer Component
 * 
 * Displays all sent system notifications with delivery statistics.
 * Allows filtering by date and type.
 * 
 * Requirements: 7.5, 7.6
 */
const NotificationHistoryViewer = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: ''
  });
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const filterParams = {};
      
      if (filters.type) {
        filterParams.type = filters.type;
      }
      
      if (filters.startDate && filters.endDate) {
        filterParams.startDate = new Date(filters.startDate);
        filterParams.endDate = new Date(filters.endDate);
      }

      const data = await settingsService.getSystemNotifications(filterParams);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    loadNotifications();
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: ''
    });
    // Reload without filters
    setTimeout(() => loadNotifications(), 0);
  };

  const handleViewDetails = async (notification) => {
    setSelectedNotification(notification);
    
    if (notification.feedbackEnabled) {
      try {
        setLoadingFeedback(true);
        const feedback = await settingsService.getNotificationFeedback(notification.id);
        setFeedbackData(feedback);
      } catch (error) {
        console.error('Error loading feedback:', error);
      } finally {
        setLoadingFeedback(false);
      }
    }
  };

  const handleCloseDetails = () => {
    setSelectedNotification(null);
    setFeedbackData(null);
  };

  const getTypeLabel = (type) => {
    const labels = {
      [NOTIFICATION_TYPES.ANNOUNCEMENT]: 'ประกาศ',
      [NOTIFICATION_TYPES.FEEDBACK_REQUEST]: 'ขอความคิดเห็น',
      [NOTIFICATION_TYPES.ALERT]: 'แจ้งเตือนสำคัญ'
    };
    return labels[type] || type;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      [NOTIFICATION_PRIORITIES.LOW]: 'ต่ำ',
      [NOTIFICATION_PRIORITIES.MEDIUM]: 'ปานกลาง',
      [NOTIFICATION_PRIORITIES.HIGH]: 'สูง'
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      [NOTIFICATION_PRIORITIES.LOW]: 'bg-gray-100 text-gray-800',
      [NOTIFICATION_PRIORITIES.MEDIUM]: 'bg-blue-100 text-blue-800',
      [NOTIFICATION_PRIORITIES.HIGH]: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const calculateReadPercentage = (notification) => {
    if (!notification.deliveryStats.sent) return 0;
    return Math.round((notification.deliveryStats.read / notification.deliveryStats.sent) * 100);
  };

  const calculateResponsePercentage = (notification) => {
    if (!notification.deliveryStats.sent) return 0;
    return Math.round((notification.deliveryStats.responded / notification.deliveryStats.sent) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-700">กำลังโหลดประวัติการแจ้งเตือน...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4">กรองข้อมูล</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              ประเภท
            </label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              <option value={NOTIFICATION_TYPES.ANNOUNCEMENT}>ประกาศ</option>
              <option value={NOTIFICATION_TYPES.FEEDBACK_REQUEST}>ขอความคิดเห็น</option>
              <option value={NOTIFICATION_TYPES.ALERT}>แจ้งเตือนสำคัญ</option>
            </select>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ล้างตัวกรอง
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ค้นหา
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">ประวัติการแจ้งเตือน ({notifications.length})</h3>
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            ไม่พบประวัติการแจ้งเตือน
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                        {getPriorityLabel(notification.priority)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getTypeLabel(notification.type)}
                      </span>
                    </div>

                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {notification.title}
                    </h4>

                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {notification.content}
                    </p>

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span>
                        ส่งเมื่อ: {new Date(notification.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {notification.expiresAt && (
                        <span>
                          หมดอายุ: {new Date(notification.expiresAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewDetails(notification)}
                    className="ml-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    ดูรายละเอียด
                  </button>
                </div>

                {/* Delivery Statistics */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">ส่งแล้ว</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {notification.deliveryStats.sent}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">อ่านแล้ว</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {notification.deliveryStats.read}
                      <span className="text-sm ml-2">({calculateReadPercentage(notification)}%)</span>
                    </div>
                  </div>

                  {notification.feedbackEnabled && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600 mb-1">ตอบกลับ</div>
                      <div className="text-2xl font-bold text-green-600">
                        {notification.deliveryStats.responded}
                        <span className="text-sm ml-2">({calculateResponsePercentage(notification)}%)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-semibold">รายละเอียดการแจ้งเตือน</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ</label>
                <p className="text-lg font-semibold">{selectedNotification.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เนื้อหา</label>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedNotification.content}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
                  <p>{getTypeLabel(selectedNotification.type)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ระดับความสำคัญ</label>
                  <p>{getPriorityLabel(selectedNotification.priority)}</p>
                </div>
              </div>

              {/* Feedback Section */}
              {selectedNotification.feedbackEnabled && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">ความคิดเห็นจากผู้ใช้</h3>
                  
                  {loadingFeedback ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">กำลังโหลด...</span>
                    </div>
                  ) : feedbackData && feedbackData.responses.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        คำถาม: {feedbackData.feedbackQuestion}
                      </p>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {feedbackData.responses.map((response, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-700">{response.response}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(response.timestamp.toDate()).toLocaleString('th-TH')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">ยังไม่มีความคิดเห็น</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationHistoryViewer;
