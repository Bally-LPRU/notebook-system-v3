/**
 * UnifiedNotificationCenter Component
 * 
 * Main notification center for admin users with:
 * - Tabbed interface (งานรอดำเนินการ, แจ้งเตือนส่วนตัว, ประวัติ)
 * - Summary cards
 * - Filtering and search
 * - Quick actions
 * - Pagination
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../layout';
import useAdminUnifiedNotifications from '../../hooks/useAdminUnifiedNotifications';
import { getHistory } from '../../services/adminNotificationService';
import { formatDistanceToNow, format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  BellIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Tab definitions
const TABS = [
  { id: 'action', label: 'งานรอดำเนินการ', icon: ClipboardDocumentListIcon },
  { id: 'personal', label: 'แจ้งเตือนส่วนตัว', icon: BellIcon },
  { id: 'history', label: 'ประวัติ', icon: ClockIcon }
];

// Category definitions for summary cards
const CATEGORIES = [
  { id: 'users', label: 'ผู้ใช้รออนุมัติ', icon: UserGroupIcon, color: 'green' },
  { id: 'loans', label: 'คำขอยืมรออนุมัติ', icon: ClipboardDocumentListIcon, color: 'blue' },
  { id: 'overdue', label: 'เกินกำหนดคืน', icon: ExclamationTriangleIcon, color: 'red' },
  { id: 'reservations', label: 'การจองรออนุมัติ', icon: CalendarIcon, color: 'purple' }
];

// Priority options
const PRIORITIES = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'urgent', label: 'ด่วนมาก', color: 'red' },
  { id: 'high', label: 'ด่วน', color: 'orange' },
  { id: 'medium', label: 'ปานกลาง', color: 'yellow' },
  { id: 'low', label: 'ต่ำ', color: 'gray' }
];

const UnifiedNotificationCenter = ({ defaultTab = 'action' }) => {
  const { user, isAdmin } = useAuth();

  const {
    allNotifications,
    actionItems,
    personalNotifications,
    counts,
    markAsRead,
    markAllAsRead,
    executeQuickAction,
    filter,
    setFilter,
    setSearchTerm,
    loading,
    error,
    loadMore,
    hasMore
  } = useAdminUnifiedNotifications(user?.uid, isAdmin);

  // Local state
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, notification: null });
  const [rejectReason, setRejectReason] = useState('');

  // Load history when history tab is active
  useEffect(() => {
    if (activeTab === 'history' && user?.uid) {
      loadHistory();
    }
  }, [activeTab, user?.uid]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { items } = await getHistory(user.uid, 50);
      setHistoryItems(items);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Get notifications for current tab
  const getCurrentNotifications = () => {
    switch (activeTab) {
      case 'action':
        return actionItems;
      case 'personal':
        return personalNotifications;
      case 'history':
        return historyItems;
      default:
        return allNotifications;
    }
  };

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Reset filters when changing tabs
    setFilter({ tab: tabId, category: 'all', priority: 'all', searchTerm: '' });
  };

  // Handle category filter from summary card
  const handleCategoryFilter = (categoryId) => {
    setActiveTab('action');
    setFilter({ ...filter, category: categoryId });
  };

  // Handle quick action
  const handleQuickAction = async (notification, action) => {
    if (action === 'reject') {
      setRejectModal({ open: true, notification });
      return;
    }

    setActionInProgress(notification.id);
    try {
      const result = await executeQuickAction(notification, action);
      if (!result.success) {
        alert(`เกิดข้อผิดพลาด: ${result.error}`);
      }
    } catch (err) {
      console.error('Quick action error:', err);
      alert('เกิดข้อผิดพลาดในการดำเนินการ');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle reject with reason
  const handleRejectConfirm = async () => {
    if (!rejectModal.notification) return;

    setActionInProgress(rejectModal.notification.id);
    try {
      const result = await executeQuickAction(rejectModal.notification, 'reject', rejectReason);
      if (!result.success) {
        alert(`เกิดข้อผิดพลาด: ${result.error}`);
      }
    } catch (err) {
      console.error('Reject error:', err);
      alert('เกิดข้อผิดพลาดในการปฏิเสธ');
    } finally {
      setActionInProgress(null);
      setRejectModal({ open: false, notification: null });
      setRejectReason('');
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead && activeTab !== 'history') {
      await markAsRead(notification.id, notification.sourceType);
    }
  };

  // Format time
  const formatTime = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return formatDistanceToNow(d, { addSuffix: true, locale: th });
  };

  // Get color classes
  const getColorClasses = (color) => {
    const colors = {
      green: 'bg-green-100 text-green-600 border-green-200',
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      red: 'bg-red-100 text-red-600 border-red-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
      orange: 'bg-orange-100 text-orange-600 border-orange-200',
      yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      gray: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    return colors[color] || colors.gray;
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <p className="text-gray-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </Layout>
    );
  }

  const currentNotifications = getCurrentNotifications();

  return (
    <Layout>
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ศูนย์การแจ้งเตือน</h1>
        <p className="text-gray-500 mt-1">จัดการการแจ้งเตือนและงานที่ต้องดำเนินการทั้งหมด</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryFilter(category.id)}
            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
              filter.category === category.id 
                ? `${getColorClasses(category.color)} border-current` 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <category.icon className={`h-6 w-6 ${
                filter.category === category.id ? '' : 'text-gray-400'
              }`} />
              <span className={`text-2xl font-bold ${
                filter.category === category.id ? '' : 'text-gray-900'
              }`}>
                {counts[category.id] || 0}
              </span>
            </div>
            <p className={`text-sm mt-2 text-left ${
              filter.category === category.id ? '' : 'text-gray-600'
            }`}>
              {category.label}
            </p>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4 overflow-x-auto">
        <nav className="flex space-x-4 min-w-max" aria-label="Tabs">
          {TABS.map((tab) => {
            const count = tab.id === 'action' ? counts.actionItems :
                         tab.id === 'personal' ? counts.personal :
                         historyItems.length;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
                {count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>


      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาการแจ้งเตือน..."
            value={filter.searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
            showFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          ตัวกรอง
          <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Mark All as Read */}
        {activeTab !== 'history' && counts.unread > 0 && (
          <button
            onClick={() => markAllAsRead(activeTab)}
            className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            อ่านทั้งหมด
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap gap-4">
            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ความสำคัญ</label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((priority) => (
                  <button
                    key={priority.id}
                    onClick={() => setFilter({ ...filter, priority: priority.id })}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filter.priority === priority.id
                        ? priority.color ? getColorClasses(priority.color) : 'bg-blue-100 text-blue-600'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter (for action tab) */}
            {activeTab === 'action' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter({ ...filter, category: 'all' })}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filter.category === 'all'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setFilter({ ...filter, category: category.id })}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        filter.category === category.id
                          ? getColorClasses(category.color)
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification List */}
      <div className="bg-white rounded-lg shadow">
        {loading || (activeTab === 'history' && historyLoading) ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">กำลังโหลด...</p>
          </div>
        ) : currentNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              {activeTab === 'history' ? 'ไม่มีประวัติการดำเนินการ' : 'ไม่มีการแจ้งเตือน'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {currentNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isHistory={activeTab === 'history'}
                actionInProgress={actionInProgress === notification.id}
                onNotificationClick={handleNotificationClick}
                onQuickAction={handleQuickAction}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && activeTab !== 'history' && (
          <div className="p-4 text-center border-t">
            <button
              onClick={loadMore}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              โหลดเพิ่มเติม
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">ยืนยันการปฏิเสธ</h3>
            <p className="text-gray-600 mb-4">
              กรุณาระบุเหตุผลในการปฏิเสธ (ไม่บังคับ)
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="เหตุผลในการปฏิเสธ..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRejectModal({ open: false, notification: null });
                  setRejectReason('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionInProgress}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionInProgress ? 'กำลังดำเนินการ...' : 'ยืนยันปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
};


// Notification Item Component
const NotificationItem = ({
  notification,
  isHistory,
  actionInProgress,
  onNotificationClick,
  onQuickAction,
  formatTime
}) => {
  const hasQuickActions = !isHistory && notification.quickActions && notification.quickActions.length > 0;

  return (
    <div
      onClick={() => onNotificationClick(notification)}
      className={`p-4 hover:bg-gray-50 transition-colors ${
        !notification.isRead && !isHistory ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${
          notification.iconBg || 'bg-gray-100'
        }`}>
          {notification.icon || '🔔'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className={`text-sm font-medium ${
                  !notification.isRead && !isHistory ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {notification.title}
                </h4>
                
                {/* Priority Badge */}
                {notification.priority && notification.priority !== 'low' && !isHistory && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    notification.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    notification.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {notification.priority === 'urgent' ? 'ด่วนมาก' :
                     notification.priority === 'high' ? 'ด่วน' : 'ปานกลาง'}
                  </span>
                )}

                {/* History Action Badge */}
                {isHistory && notification.action && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    notification.action === 'approved' ? 'bg-green-100 text-green-700' :
                    notification.action === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {notification.action === 'approved' ? 'อนุมัติแล้ว' :
                     notification.action === 'rejected' ? 'ปฏิเสธแล้ว' :
                     notification.action === 'viewed' ? 'ดูแล้ว' : notification.action}
                  </span>
                )}

                {/* Unread Indicator */}
                {!notification.isRead && !isHistory && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </div>

              <p className={`text-sm mt-1 ${
                !notification.isRead && !isHistory ? 'text-gray-700' : 'text-gray-500'
              }`}>
                {notification.description || notification.message}
              </p>

              {notification.detail && (
                <p className="text-xs text-gray-400 mt-1">{notification.detail}</p>
              )}

              {/* History Note */}
              {isHistory && notification.note && (
                <p className="text-xs text-gray-500 mt-1 italic">
                  เหตุผล: {notification.note}
                </p>
              )}

              <p className="text-xs text-gray-400 mt-2">
                {formatTime(isHistory ? notification.actionAt : notification.createdAt)}
              </p>
            </div>

            {/* Quick Actions */}
            {hasQuickActions && (
              <div className="flex items-center space-x-2 ml-4">
                {notification.quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAction(notification, action.action);
                    }}
                    disabled={actionInProgress}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                      action.variant === 'primary'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : action.variant === 'danger'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {action.action === 'approve' && <CheckCircleIcon className="h-4 w-4 inline mr-1" />}
                    {action.action === 'reject' && <XCircleIcon className="h-4 w-4 inline mr-1" />}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedNotificationCenter;
