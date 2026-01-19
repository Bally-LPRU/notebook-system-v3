/**
 * Staff Activity Page
 * 
 * Full page view for Staff activities with filtering and daily summary
 * Requirements: 12.6, 12.7, 12.9
 */

import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../layout';
import StaffActivityNotificationService from '../../services/staffActivityNotificationService';
import StaffDailySummaryReport from './StaffDailySummaryReport';

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
 * Activity Table Row Component
 */
const ActivityTableRow = ({ activity }) => {
  const actionInfo = ACTION_TYPE_LABELS[activity.actionType] || { 
    label: activity.actionType, 
    icon: '📋', 
    color: 'gray' 
  };
  const colorClasses = COLORS[actionInfo.color] || COLORS.gray;

  const formatDateTime = (date) => {
    if (!date) return '-';
    return date.toLocaleString('th-TH', { 
      day: 'numeric', 
      month: 'short', 
      year: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-sm text-gray-600">{formatDateTime(activity.timestamp)}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 font-semibold text-xs">
              {(activity.staffName || 'S').charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900">{activity.staffName || 'Unknown'}</span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${colorClasses.badge} ${colorClasses.text}`}>
          <span>{actionInfo.icon}</span>
          {actionInfo.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-900">{activity.details?.equipmentName || '-'}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-600">{activity.details?.borrowerName || '-'}</p>
      </td>
      <td className="px-4 py-3">
        {activity.details?.rejectionReason && (
          <p className="text-xs text-gray-500 truncate max-w-xs" title={activity.details.rejectionReason}>
            {activity.details.rejectionReason}
          </p>
        )}
        {activity.details?.condition && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activity.details.condition === 'good' ? 'bg-green-100 text-green-700' :
            activity.details.condition === 'damaged' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {activity.details.conditionLabel || activity.details.condition}
          </span>
        )}
      </td>
    </tr>
  );
};


/**
 * Staff Activity Page Component
 */
const StaffActivityPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('activities'); // 'activities' or 'summary'
  
  // Filters
  const [selectedActionType, setSelectedActionType] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Staff list for filter
  const [staffList, setStaffList] = useState([]);

  // Load activities
  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await StaffActivityNotificationService.getStaffActivityLogs({
        staffId: selectedStaffId || null,
        actionType: selectedActionType || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate + 'T23:59:59') : null,
        limitCount: 100
      });

      setActivities(result.activities || []);

      // Extract unique staff for filter
      const uniqueStaff = new Map();
      result.activities.forEach(a => {
        if (a.staffId && !uniqueStaff.has(a.staffId)) {
          uniqueStaff.set(a.staffId, {
            id: a.staffId,
            name: a.staffName || 'Unknown'
          });
        }
      });
      setStaffList(Array.from(uniqueStaff.values()));

    } catch (err) {
      console.error('Error loading activities:', err);
      setError('ไม่สามารถโหลดข้อมูลกิจกรรมได้');
    } finally {
      setLoading(false);
    }
  }, [selectedActionType, selectedStaffId, startDate, endDate]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Action type options
  const actionTypeOptions = [
    { value: '', label: 'ทุกประเภท' },
    { value: 'loan_approved', label: 'อนุมัติคำขอยืม' },
    { value: 'loan_rejected', label: 'ปฏิเสธคำขอยืม' },
    { value: 'return_processed', label: 'รับคืนอุปกรณ์' },
    { value: 'overdue_notified', label: 'แจ้งเตือนค้างคืน' }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">กิจกรรม Staff</h1>
            <p className="text-sm text-gray-500 mt-1">ติดตามและตรวจสอบกิจกรรมของเจ้าหน้าที่ให้บริการ</p>
          </div>
          <button
            onClick={loadActivities}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="รีเฟรช"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('activities')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'activities'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              รายการกิจกรรม
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'summary'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              สรุปรายวัน
            </button>
          </nav>
        </div>

        {activeTab === 'activities' ? (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Action Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทกิจกรรม</label>
                  <select
                    value={selectedActionType}
                    onChange={(e) => setSelectedActionType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {actionTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Staff Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เจ้าหน้าที่</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">ทุกคน</option>
                    {staffList.map(staff => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ตั้งแต่วันที่</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ถึงวันที่</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Activities Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 mt-4">กำลังโหลด...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">{error}</p>
                  <button onClick={loadActivities} className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm">
                    ลองใหม่
                  </button>
                </div>
              ) : activities.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500">ไม่พบกิจกรรมในช่วงเวลาที่เลือก</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันเวลา</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เจ้าหน้าที่</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">กิจกรรม</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อุปกรณ์</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ยืม</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activities.map(activity => (
                        <ActivityTableRow key={activity.id} activity={activity} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Results count */}
              {!loading && !error && activities.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                  แสดง {activities.length} รายการ
                </div>
              )}
            </div>
          </>
        ) : (
          /* Daily Summary Tab */
          <StaffDailySummaryReport />
        )}
      </div>
    </Layout>
  );
};

export default StaffActivityPage;
