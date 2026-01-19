/**
 * Staff Activity Section Component
 * 
 * Displays recent Staff activities in Admin Dashboard
 * Supports filtering by date range, staff member, and action type
 * 
 * Requirements: 12.6, 12.7
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffActivityNotificationService from '../../services/staffActivityNotificationService';

// Action type labels
const ACTION_TYPE_LABELS = {
  loan_approved: { label: 'อนุมัติคำขอยืม', icon: '✅', color: 'green' },
  loan_rejected: { label: 'ปฏิเสธคำขอยืม', icon: '❌', color: 'red' },
  return_processed: { label: 'รับคืนอุปกรณ์', icon: '📦', color: 'blue' },
  overdue_notified: { label: 'แจ้งเตือนค้างคืน', icon: '📢', color: 'yellow' }
};

// Color classes
const COLORS = {
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100' },
  red: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
  yellow: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100' },
  gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100' }
};

/**
 * Staff Activity Item Component
 */
const StaffActivityItem = ({ activity, onClick }) => {
  const actionInfo = ACTION_TYPE_LABELS[activity.actionType] || { 
    label: activity.actionType, 
    icon: '📋', 
    color: 'gray' 
  };
  const colorClasses = COLORS[actionInfo.color] || COLORS.gray;

  const formatTime = (date) => {
    if (!date) return '-';
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  return (
    <div 
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.01] ${colorClasses.bg} ${colorClasses.border}`}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses.badge}`}>
        <span className="text-lg">{actionInfo.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClasses.badge} ${colorClasses.text}`}>
            {actionInfo.label}
          </span>
        </div>
        <p className="text-sm text-gray-900 truncate">
          {activity.staffName || 'เจ้าหน้าที่'}: {activity.details?.equipmentName || 'อุปกรณ์'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          ผู้ยืม: {activity.details?.borrowerName || '-'}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
        <p className="text-sm font-medium text-gray-700">{formatTime(activity.timestamp)}</p>
      </div>
    </div>
  );
};


/**
 * Staff Activity Filter Component
 */
const StaffActivityFilter = ({ 
  selectedActionType, 
  onActionTypeChange,
  selectedDateRange,
  onDateRangeChange 
}) => {
  const actionTypes = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'loan_approved', label: 'อนุมัติ' },
    { value: 'loan_rejected', label: 'ปฏิเสธ' },
    { value: 'return_processed', label: 'รับคืน' },
    { value: 'overdue_notified', label: 'แจ้งเตือน' }
  ];

  const dateRanges = [
    { value: 'today', label: 'วันนี้' },
    { value: 'week', label: '7 วัน' },
    { value: 'month', label: '30 วัน' }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Action Type Filter */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {actionTypes.map(type => (
          <button
            key={type.value}
            onClick={() => onActionTypeChange(type.value)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              selectedActionType === type.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {dateRanges.map(range => (
          <button
            key={range.value}
            onClick={() => onDateRangeChange(range.value)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              selectedDateRange === range.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Staff Activity Section Component
 * Requirements: 12.6, 12.7
 */
const StaffActivitySection = ({ maxItems = 10, showFilters = true }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedActionType, setSelectedActionType] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('today');

  // Calculate date range
  const getDateRange = useCallback((range) => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    switch (range) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'today':
      default:
        // Already set to today
        break;
    }

    return { startDate, endDate };
  }, []);

  // Load activities
  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRange(selectedDateRange);

      const result = await StaffActivityNotificationService.getStaffActivityLogs({
        actionType: selectedActionType || null,
        startDate,
        endDate,
        limitCount: maxItems
      });

      setActivities(result.activities || []);
    } catch (err) {
      console.error('Error loading staff activities:', err);
      setError('ไม่สามารถโหลดข้อมูลกิจกรรมได้');
    } finally {
      setLoading(false);
    }
  }, [selectedActionType, selectedDateRange, maxItems, getDateRange]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Handle activity click
  const handleActivityClick = (activity) => {
    // Navigate to relevant page based on action type
    if (activity.details?.requestId) {
      navigate('/admin/loan-requests');
    } else if (activity.details?.loanId) {
      navigate('/admin/loan-requests');
    } else {
      navigate('/admin/staff-activity');
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-indigo-100 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
          กิจกรรม Staff ล่าสุด
          {activities.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
              {activities.length}
            </span>
          )}
        </h3>
        <button 
          onClick={() => navigate('/admin/staff-activity')}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 group"
        >
          ดูทั้งหมด
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <StaffActivityFilter
          selectedActionType={selectedActionType}
          onActionTypeChange={setSelectedActionType}
          selectedDateRange={selectedDateRange}
          onDateRangeChange={setSelectedDateRange}
        />
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={loadActivities}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            ลองใหม่
          </button>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-float">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500">ไม่มีกิจกรรม Staff ในช่วงเวลานี้</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity, idx) => (
            <StaffActivityItem
              key={activity.id}
              activity={activity}
              onClick={() => handleActivityClick(activity)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffActivitySection;
