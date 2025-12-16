import React, { useState, useMemo } from 'react';
import { 
  BellIcon, 
  CheckIcon, 
  FunnelIcon,
  CalendarIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import { th } from 'date-fns/locale';
import Layout from '../layout/Layout';
import { useNotificationHistory, formatDateKeyThai } from '../../hooks/useNotificationHistory';

// จำนวนรายการต่อหน้า
const ITEMS_PER_PAGE = 5;

/**
 * NotificationHistoryPage - แสดงประวัติการแจ้งเตือนทั้งหมด
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
const NotificationHistoryPage = () => {
  const { 
    notifications,
    groupedByDate,
    loading, 
    error,
    filters,
    setFilters,
    markAsRead, 
    markAllAsRead,
    unreadCount,
    refresh,
    totalCount
  } = useNotificationHistory();

  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination
  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = notifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Group paginated notifications by date
  const paginatedGroupedByDate = useMemo(() => {
    const grouped = {};
    paginatedNotifications.forEach(notification => {
      const dateKey = notification.createdAt 
        ? format(notification.createdAt.toDate ? notification.createdAt.toDate() : new Date(notification.createdAt), 'yyyy-MM-dd')
        : 'unknown';
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(notification);
    });
    return grouped;
  }, [paginatedNotifications]);

  // Get sorted date keys for paginated data
  const paginatedSortedDateKeys = useMemo(() => {
    return Object.keys(paginatedGroupedByDate).sort((a, b) => {
      if (a === 'unknown') return 1;
      if (b === 'unknown') return -1;
      return b.localeCompare(a);
    });
  }, [paginatedGroupedByDate]);

  // Type filter options
  const typeFilterOptions = [
    { value: null, label: 'ทั้งหมด' },
    { value: 'system', label: 'ระบบ' },
    { value: 'loan', label: 'การยืม' },
    { value: 'approval', label: 'การอนุมัติ' },
    { value: 'reminder', label: 'แจ้งเตือน' }
  ];

  // Read status filter options
  const readStatusOptions = [
    { value: null, label: 'ทั้งหมด' },
    { value: 'unread', label: 'ยังไม่อ่าน' },
    { value: 'read', label: 'อ่านแล้ว' }
  ];

  // Handle filter changes
  const handleTypeFilterChange = (value) => {
    setFilters(prev => ({ ...prev, type: value }));
    setCurrentPage(1);
  };

  const handleReadStatusChange = (value) => {
    setFilters(prev => ({ ...prev, readStatus: value }));
    setCurrentPage(1);
  };

  const handleDateRangeChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value ? new Date(value) : null
      }
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      type: null,
      dateRange: null,
      readStatus: null
    });
    setCurrentPage(1);
  };

  // Get sorted date keys (newest first)
  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedByDate).sort((a, b) => {
      if (a === 'unknown') return 1;
      if (b === 'unknown') return -1;
      return b.localeCompare(a);
    });
  }, [groupedByDate]);

  // Format notification time
  const formatNotificationTime = (createdAt) => {
    if (!createdAt) return '';
    
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true, locale: th });
    } else {
      return format(date, 'HH:mm น.', { locale: th });
    }
  };

  // Get notification type label
  const getTypeLabel = (type) => {
    const labels = {
      'user_approval': 'อนุมัติผู้ใช้',
      'user_approved': 'บัญชีอนุมัติ',
      'user_rejected': 'บัญชีถูกปฏิเสธ',
      'loan_request': 'คำขอยืม',
      'loan_approved': 'อนุมัติการยืม',
      'loan_rejected': 'ปฏิเสธการยืม',
      'loan_reminder': 'แจ้งเตือนคืน',
      'loan_overdue': 'เกินกำหนดคืน',
      'loan_returned': 'คืนอุปกรณ์',
      'reservation_request': 'คำขอจอง',
      'reservation_approved': 'อนุมัติการจอง',
      'reservation_rejected': 'ปฏิเสธการจอง',
      'reservation_reminder': 'แจ้งเตือนจอง',
      'reservation_ready': 'พร้อมรับ',
      'system_update': 'อัปเดตระบบ',
      'profile_updated': 'อัปเดตโปรไฟล์',
      'profile_status_pending': 'รอการอนุมัติ',
      'profile_status_approved': 'อนุมัติแล้ว',
      'profile_status_rejected': 'ถูกปฏิเสธ'
    };
    return labels[type] || type;
  };

  // Get type category label
  const getTypeCategoryLabel = (type) => {
    const systemTypes = ['system_update', 'equipment_maintenance'];
    const loanTypes = ['loan_request', 'loan_approved', 'loan_rejected', 'loan_reminder', 'loan_overdue', 'loan_returned'];
    const approvalTypes = ['user_approval', 'user_approved', 'user_rejected', 'profile_updated', 'profile_status_pending', 'profile_status_approved', 'profile_status_rejected'];
    const reminderTypes = ['loan_reminder', 'reservation_reminder', 'reservation_ready'];

    if (systemTypes.includes(type)) return 'ระบบ';
    if (loanTypes.includes(type)) return 'การยืม';
    if (approvalTypes.includes(type)) return 'การอนุมัติ';
    if (reminderTypes.includes(type)) return 'แจ้งเตือน';
    return 'อื่นๆ';
  };

  // Get type category color
  const getTypeCategoryColor = (type) => {
    const systemTypes = ['system_update', 'equipment_maintenance'];
    const loanTypes = ['loan_request', 'loan_approved', 'loan_rejected', 'loan_reminder', 'loan_overdue', 'loan_returned'];
    const approvalTypes = ['user_approval', 'user_approved', 'user_rejected', 'profile_updated', 'profile_status_pending', 'profile_status_approved', 'profile_status_rejected'];

    if (systemTypes.includes(type)) return 'bg-purple-100 text-purple-800';
    if (loanTypes.includes(type)) return 'bg-blue-100 text-blue-800';
    if (approvalTypes.includes(type)) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  // Get priority badge
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
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[priority] || colors.low}`}>
        {labels[priority] || labels.low}
      </span>
    );
  };

  // Handle marking notification as read
  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  // Check if any filters are active
  const hasActiveFilters = filters.type || filters.readStatus || filters.dateRange?.start || filters.dateRange?.end;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">เกิดข้อผิดพลาด: {error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ประวัติการแจ้งเตือน</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 
                  ? `มีการแจ้งเตือนที่ยังไม่อ่าน ${unreadCount} รายการ จากทั้งหมด ${totalCount} รายการ`
                  : `ทั้งหมด ${totalCount} รายการ`
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                  hasActiveFilters 
                    ? 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                ตัวกรอง
                {hasActiveFilters && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                    !
                  </span>
                )}
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

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ประเภท
                  </label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => handleTypeFilterChange(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {typeFilterOptions.map(option => (
                      <option key={option.value || 'all'} value={option.value || ''}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Read Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    สถานะการอ่าน
                  </label>
                  <select
                    value={filters.readStatus || ''}
                    onChange={(e) => handleReadStatusChange(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {readStatusOptions.map(option => (
                      <option key={option.value || 'all'} value={option.value || ''}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Date Range - Start */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ตั้งแต่วันที่
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange?.start ? format(filters.dateRange.start, 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Date Range - End */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ถึงวันที่
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange?.end ? format(filters.dateRange.end, 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications List - Grouped by Date */}
        {notifications.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="text-center py-12">
              <BellIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีการแจ้งเตือน</h3>
              <p className="text-gray-500">
                {hasActiveFilters 
                  ? 'ไม่พบการแจ้งเตือนที่ตรงกับตัวกรองที่เลือก' 
                  : 'ไม่มีการแจ้งเตือนในขณะนี้'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  ล้างตัวกรอง
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedSortedDateKeys.map(dateKey => (
              <div key={dateKey} className="bg-white shadow rounded-lg overflow-hidden">
                {/* Date Header */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h2 className="text-sm font-semibold text-gray-700">
                      {formatDateKeyThai(dateKey)}
                    </h2>
                    <span className="ml-2 text-xs text-gray-500">
                      ({paginatedGroupedByDate[dateKey].length} รายการ)
                    </span>
                  </div>
                </div>

                {/* Notifications for this date */}
                <div className="divide-y divide-gray-100">
                  {paginatedGroupedByDate[dateKey].map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-6 py-4 hover:bg-gray-50 transition-colors duration-200 ${
                        !notification.isRead ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => {
                        // Mark as read when clicked, but don't navigate
                        if (!notification.isRead) {
                          handleMarkAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Read Status Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {notification.isRead ? (
                            <EnvelopeOpenIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Title and Time */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3 className={`text-sm font-medium ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <ClockIcon className="h-4 w-4" />
                              <span>{formatNotificationTime(notification.createdAt)}</span>
                            </div>
                          </div>
                          
                          {/* Message */}
                          <p className={`text-sm mt-1 ${
                            !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                          }`}>
                            {notification.message}
                          </p>

                          {/* Additional Data - Show full details */}
                          {notification.data && (
                            <div className="mt-2 text-sm text-gray-600 space-y-1">
                              {notification.data.equipmentName && (
                                <p><span className="font-medium">อุปกรณ์:</span> {notification.data.equipmentName}</p>
                              )}
                              {notification.data.userName && (
                                <p><span className="font-medium">ผู้ใช้:</span> {notification.data.userName}</p>
                              )}
                              {notification.data.borrowDate && (
                                <p><span className="font-medium">วันที่ยืม:</span> {notification.data.borrowDate}</p>
                              )}
                              {notification.data.dueDate && (
                                <p><span className="font-medium">กำหนดคืน:</span> {notification.data.dueDate}</p>
                              )}
                              {notification.data.reservationDate && (
                                <p><span className="font-medium">วันที่จอง:</span> {notification.data.reservationDate}</p>
                              )}
                              {notification.data.rejectionReason && (
                                <p className="text-red-600"><span className="font-medium">เหตุผล:</span> {notification.data.rejectionReason}</p>
                              )}
                            </div>
                          )}
                          
                          {/* Tags */}
                          <div className="flex items-center flex-wrap gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeCategoryColor(notification.type)}`}>
                              {getTypeCategoryLabel(notification.type)}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {getTypeLabel(notification.type)}
                            </span>
                            {notification.priority && notification.priority !== 'low' && (
                              getPriorityBadge(notification.priority)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {notifications.length > ITEMS_PER_PAGE && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              แสดง {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, notifications.length)} จาก {notifications.length} รายการ
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Summary Footer for small lists */}
        {notifications.length > 0 && notifications.length <= ITEMS_PER_PAGE && (
          <div className="mt-6 text-center text-sm text-gray-500">
            แสดง {notifications.length} รายการ จากทั้งหมด {totalCount} รายการ
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationHistoryPage;
