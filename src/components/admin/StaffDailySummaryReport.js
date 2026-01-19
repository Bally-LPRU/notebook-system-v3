/**
 * Staff Daily Summary Report Component
 * 
 * Displays daily summary of Staff activities
 * Requirement: 12.9
 */

import { useState, useEffect, useCallback } from 'react';
import StaffActivityNotificationService from '../../services/staffActivityNotificationService';

/**
 * Summary Card Component
 */
const SummaryCard = ({ title, value, icon, color, subtext }) => {
  const colorClasses = {
    green: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
    red: { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
    yellow: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
    purple: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
  };

  const classes = colorClasses[color] || colorClasses.gray;

  return (
    <div className={`bg-white rounded-xl border ${classes.border} p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-2xl font-bold ${classes.text}`}>{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 ${classes.bg} rounded-xl flex items-center justify-center`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Staff Summary Row Component
 */
const StaffSummaryRow = ({ summary }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <span className="text-indigo-600 font-semibold text-sm">
            {(summary.staffName || 'S').charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{summary.staffName || 'Unknown Staff'}</p>
          <p className="text-xs text-gray-500">{summary.totalActions} กิจกรรม</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-center">
          <p className="font-semibold text-emerald-600">{summary.approvedCount}</p>
          <p className="text-xs text-gray-400">อนุมัติ</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-rose-600">{summary.rejectedCount}</p>
          <p className="text-xs text-gray-400">ปฏิเสธ</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-blue-600">{summary.returnsProcessed}</p>
          <p className="text-xs text-gray-400">รับคืน</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-amber-600">{summary.overdueNotificationsSent}</p>
          <p className="text-xs text-gray-400">แจ้งเตือน</p>
        </div>
      </div>
    </div>
  );
};


/**
 * Staff Daily Summary Report Component
 * Requirement: 12.9
 */
const StaffDailySummaryReport = ({ date = null }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    date || new Date().toISOString().split('T')[0]
  );

  // Load summary data
  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await StaffActivityNotificationService.generateDailySummaryReport(selectedDate);
      setSummary(result);
    } catch (err) {
      console.error('Error loading daily summary:', err);
      setError('ไม่สามารถโหลดข้อมูลสรุปได้');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Navigate to previous/next day
  const navigateDay = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={loadSummary}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header with Date Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
            สรุปกิจกรรม Staff รายวัน
          </h3>
          <p className="text-sm text-gray-500 mt-1">{formatDisplayDate(selectedDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDay(-1)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="วันก่อนหน้า"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => navigateDay(1)}
            disabled={selectedDate >= new Date().toISOString().split('T')[0]}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="วันถัดไป"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <SummaryCard
          title="กิจกรรมทั้งหมด"
          value={summary?.totalActions || 0}
          icon="📊"
          color="purple"
        />
        <SummaryCard
          title="อนุมัติ"
          value={summary?.totalApproved || 0}
          icon="✅"
          color="green"
        />
        <SummaryCard
          title="ปฏิเสธ"
          value={summary?.totalRejected || 0}
          icon="❌"
          color="red"
        />
        <SummaryCard
          title="รับคืน"
          value={summary?.totalReturns || 0}
          icon="📦"
          color="blue"
        />
        <SummaryCard
          title="แจ้งเตือนค้างคืน"
          value={summary?.totalOverdueNotifications || 0}
          icon="📢"
          color="yellow"
        />
        <SummaryCard
          title="รายงานความเสียหาย"
          value={summary?.totalDamageReports || 0}
          icon="⚠️"
          color="red"
          subtext={summary?.totalDamageReports > 0 ? 'ต้องตรวจสอบ' : ''}
        />
      </div>

      {/* Staff Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          รายละเอียดตาม Staff ({summary?.totalStaff || 0} คน)
        </h4>
        
        {(!summary?.staffSummaries || summary.staffSummaries.length === 0) ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">ไม่มีกิจกรรม Staff ในวันนี้</p>
          </div>
        ) : (
          <div className="space-y-2">
            {summary.staffSummaries.map((staffSummary, idx) => (
              <StaffSummaryRow key={staffSummary.staffId || idx} summary={staffSummary} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDailySummaryReport;
