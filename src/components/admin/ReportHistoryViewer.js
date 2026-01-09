/**
 * Report History Viewer Component
 * 
 * Component for viewing report history with download options and preferences configuration.
 * Displays daily and weekly reports with filtering and download capabilities.
 * 
 * Requirements: 9.4, 9.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowPathIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import ScheduledReportService, { REPORT_TYPE } from '../../services/scheduledReportService';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

/**
 * Format date for display
 */
const formatDate = (date) => {
  if (!date) return '-';
  const d = date?.toDate?.() || new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get report type label
 */
const getReportTypeLabel = (type) => {
  const labels = {
    [REPORT_TYPE.DAILY_SUMMARY]: 'สรุปรายวัน',
    [REPORT_TYPE.WEEKLY_UTILIZATION]: 'การใช้งานรายสัปดาห์',
    [REPORT_TYPE.MONTHLY_ANALYTICS]: 'วิเคราะห์รายเดือน'
  };
  return labels[type] || type;
};

/**
 * Get report type icon
 */
const getReportTypeIcon = (type) => {
  switch (type) {
    case REPORT_TYPE.DAILY_SUMMARY:
      return CalendarIcon;
    case REPORT_TYPE.WEEKLY_UTILIZATION:
      return ChartBarIcon;
    case REPORT_TYPE.MONTHLY_ANALYTICS:
      return DocumentTextIcon;
    default:
      return DocumentTextIcon;
  }
};

/**
 * Report Card Component
 */
const ReportCard = ({ report, onDownload, onView, isDownloading }) => {
  const Icon = getReportTypeIcon(report.reportType);
  const isViewed = report.viewedBy && report.viewedBy.length > 0;

  return (
    <div className={`bg-white rounded-lg shadow border ${isViewed ? 'border-gray-200' : 'border-blue-300'} overflow-hidden hover:shadow-md transition-shadow`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`p-2 rounded-lg ${isViewed ? 'bg-gray-100' : 'bg-blue-100'}`}>
              <Icon className={`w-6 h-6 ${isViewed ? 'text-gray-600' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-semibold text-gray-900">
                  {getReportTypeLabel(report.reportType)}
                </h4>
                {!isViewed && (
                  <span className="px-2 py-0.5 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                    ใหม่
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                ช่วงเวลา: {report.period}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>สร้างเมื่อ: {formatDate(report.generatedAt)}</span>
                {report.downloadCount > 0 && (
                  <>
                    <span>•</span>
                    <span>ดาวน์โหลด: {report.downloadCount} ครั้ง</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => onView(report)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            <DocumentTextIcon className="w-4 h-4" />
            <span>ดูรายงาน</span>
          </button>
          <button
            onClick={() => onDownload(report)}
            disabled={isDownloading}
            className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>ดาวน์โหลด</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Report Preferences Modal Component
 */
const PreferencesModal = ({ isOpen, onClose, preferences, onSave }) => {
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(localPrefs);
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                ตั้งค่ารายงาน
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Preferences Form */}
            <div className="space-y-4">
              {/* Daily Summary Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  รายงานสรุปรายวัน
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localPrefs.dailySummary?.enabled}
                      onChange={(e) => setLocalPrefs({
                        ...localPrefs,
                        dailySummary: {
                          ...localPrefs.dailySummary,
                          enabled: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">เปิดใช้งาน</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localPrefs.dailySummary?.autoGenerate}
                      onChange={(e) => setLocalPrefs({
                        ...localPrefs,
                        dailySummary: {
                          ...localPrefs.dailySummary,
                          autoGenerate: e.target.checked
                        }
                      })}
                      disabled={!localPrefs.dailySummary?.enabled}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">สร้างอัตโนมัติ</span>
                  </label>
                </div>
              </div>

              {/* Weekly Utilization Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  รายงานการใช้งานรายสัปดาห์
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localPrefs.weeklyUtilization?.enabled}
                      onChange={(e) => setLocalPrefs({
                        ...localPrefs,
                        weeklyUtilization: {
                          ...localPrefs.weeklyUtilization,
                          enabled: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">เปิดใช้งาน</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localPrefs.weeklyUtilization?.autoGenerate}
                      onChange={(e) => setLocalPrefs({
                        ...localPrefs,
                        weeklyUtilization: {
                          ...localPrefs.weeklyUtilization,
                          autoGenerate: e.target.checked
                        }
                      })}
                      disabled={!localPrefs.weeklyUtilization?.enabled}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">สร้างอัตโนมัติ</span>
                  </label>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      วันที่สร้างรายงาน
                    </label>
                    <select
                      value={localPrefs.weeklyUtilization?.dayOfWeek || 0}
                      onChange={(e) => setLocalPrefs({
                        ...localPrefs,
                        weeklyUtilization: {
                          ...localPrefs.weeklyUtilization,
                          dayOfWeek: parseInt(e.target.value)
                        }
                      })}
                      disabled={!localPrefs.weeklyUtilization?.enabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="0">วันอาทิตย์</option>
                      <option value="1">วันจันทร์</option>
                      <option value="2">วันอังคาร</option>
                      <option value="3">วันพุธ</option>
                      <option value="4">วันพฤหัสบดี</option>
                      <option value="5">วันศุกร์</option>
                      <option value="6">วันเสาร์</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Display Options */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  ตัวเลือกการแสดงผล
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      รายงานเริ่มต้น
                    </label>
                    <select
                      value={localPrefs.displayOptions?.defaultReportType || REPORT_TYPE.DAILY_SUMMARY}
                      onChange={(e) => setLocalPrefs({
                        ...localPrefs,
                        displayOptions: {
                          ...localPrefs.displayOptions,
                          defaultReportType: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={REPORT_TYPE.DAILY_SUMMARY}>สรุปรายวัน</option>
                      <option value={REPORT_TYPE.WEEKLY_UTILIZATION}>การใช้งานรายสัปดาห์</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      จำนวนรายการต่อหน้า
                    </label>
                    <select
                      value={localPrefs.displayOptions?.itemsPerPage || 10}
                      onChange={(e) => setLocalPrefs({
                        ...localPrefs,
                        displayOptions: {
                          ...localPrefs.displayOptions,
                          itemsPerPage: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Report Detail Modal Component
 */
const ReportDetailModal = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  const renderDailySummary = (data) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">การยืม</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">คำขอใหม่:</span>
              <span className="font-medium">{data.loans?.newRequests || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">อนุมัติ:</span>
              <span className="font-medium text-green-600">{data.loans?.approved || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ปฏิเสธ:</span>
              <span className="font-medium text-red-600">{data.loans?.rejected || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">คืนแล้ว:</span>
              <span className="font-medium">{data.loans?.returned || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">การจอง</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">จองใหม่:</span>
              <span className="font-medium">{data.reservations?.newReservations || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">อนุมัติ:</span>
              <span className="font-medium text-green-600">{data.reservations?.approved || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ยกเลิก:</span>
              <span className="font-medium text-gray-600">{data.reservations?.cancelled || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ไม่มารับ:</span>
              <span className="font-medium text-orange-600">{data.reservations?.noShows || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-yellow-50 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">การแจ้งเตือน</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ทั้งหมด:</span>
              <span className="font-medium">{data.alerts?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">วิกฤต:</span>
              <span className="font-medium text-red-600">{data.alerts?.critical || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">สูง:</span>
              <span className="font-medium text-orange-600">{data.alerts?.high || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">เกินกำหนด</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ทั้งหมด:</span>
              <span className="font-medium text-red-600">{data.overdue?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">วิกฤต:</span>
              <span className="font-medium text-red-600">{data.overdue?.critical || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">รวมวันเกิน:</span>
              <span className="font-medium">{data.overdue?.totalDaysOverdue || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWeeklyUtilization = (data) => (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-2">สรุปอุปกรณ์</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">ความต้องการสูง:</span>
            <span className="ml-2 font-medium text-red-600">
              {data.equipment?.highDemand?.length || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">ไม่ถูกใช้:</span>
            <span className="ml-2 font-medium text-gray-600">
              {data.equipment?.idle?.length || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">การใช้งานเฉลี่ย:</span>
            <span className="ml-2 font-medium">
              {Math.round((data.equipment?.averageUtilization || 0) * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-2">สรุปผู้ใช้</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">ผู้ยืมอันดับต้น:</span>
            <span className="ml-2 font-medium">
              {data.users?.topBorrowers?.length || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">ผู้ใช้เชื่อถือได้:</span>
            <span className="ml-2 font-medium text-green-600">
              {data.users?.mostReliable?.length || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-50 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">การยืม</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ทั้งหมด:</span>
              <span className="font-medium">{data.loans?.totalRequests || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">เวลาประมวลผลเฉลี่ย:</span>
              <span className="font-medium">{data.loans?.averageProcessingTime || 0} ชม.</span>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">การจอง</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ทั้งหมด:</span>
              <span className="font-medium">{data.reservations?.totalReservations || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">อัตราไม่มารับ:</span>
              <span className="font-medium text-orange-600">
                {Math.round((data.reservations?.noShowRate || 0) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getReportTypeLabel(report.reportType)}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  ช่วงเวลา: {report.period}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-4 py-5 sm:p-6 max-h-96 overflow-y-auto">
            {report.reportType === REPORT_TYPE.DAILY_SUMMARY && renderDailySummary(report.data)}
            {report.reportType === REPORT_TYPE.WEEKLY_UTILIZATION && renderWeeklyUtilization(report.data)}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Report History Viewer Component
 */
const ReportHistoryViewer = () => {
  const { currentUser, isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState({
    reportType: 'all',
    limit: 10
  });

  // Load reports and preferences
  const loadData = useCallback(async () => {
    if (!currentUser || !isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      // Load preferences
      const prefs = await ScheduledReportService.getReportPreferences(currentUser.uid);
      setPreferences(prefs);

      // Load reports
      const queryOptions = {
        limit: filter.limit
      };
      if (filter.reportType !== 'all') {
        queryOptions.reportType = filter.reportType;
      }

      const reportHistory = await ScheduledReportService.getReportHistory(queryOptions);
      setReports(reportHistory);
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('ไม่สามารถโหลดข้อมูลรายงานได้');
    } finally {
      setLoading(false);
    }
  }, [currentUser, isAdmin, filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle download
  const handleDownload = async (report) => {
    try {
      setDownloading(true);
      const jsonData = await ScheduledReportService.exportReportToJSON(report.id);
      
      if (jsonData) {
        // Create download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${report.reportType}_${report.period}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Reload to update download count
        await loadData();
      }
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('ไม่สามารถดาวน์โหลดรายงานได้');
    } finally {
      setDownloading(false);
    }
  };

  // Handle view report
  const handleView = async (report) => {
    try {
      // Mark as viewed
      if (currentUser) {
        await ScheduledReportService.markReportViewed(report.id, currentUser.uid);
      }
      setSelectedReport(report);
      // Reload to update viewed status
      await loadData();
    } catch (err) {
      console.error('Error viewing report:', err);
      setSelectedReport(report);
    }
  };

  // Handle save preferences
  const handleSavePreferences = async (newPrefs) => {
    if (!currentUser) return;

    try {
      await ScheduledReportService.saveReportPreferences(currentUser.uid, newPrefs);
      setPreferences(newPrefs);
    } catch (err) {
      console.error('Error saving preferences:', err);
      alert('ไม่สามารถบันทึกการตั้งค่าได้');
    }
  };

  // Handle generate report
  const handleGenerateReport = async (reportType) => {
    try {
      setLoading(true);
      if (reportType === REPORT_TYPE.DAILY_SUMMARY) {
        await ScheduledReportService.generateDailySummaryReport();
      } else if (reportType === REPORT_TYPE.WEEKLY_UTILIZATION) {
        await ScheduledReportService.generateWeeklyUtilizationReport();
      }
      await loadData();
    } catch (err) {
      console.error('Error generating report:', err);
      alert('ไม่สามารถสร้างรายงานได้');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  if (loading && reports.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            ประวัติรายงาน
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            ดูและดาวน์โหลดรายงานที่สร้างไว้
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPreferences(true)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Cog6ToothIcon className="w-5 h-5" />
            <span>ตั้งค่า</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* Quick Generate Buttons */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          สร้างรายงานใหม่
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => handleGenerateReport(REPORT_TYPE.DAILY_SUMMARY)}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 disabled:opacity-50"
          >
            <CalendarIcon className="w-5 h-5" />
            <span>สรุปรายวัน</span>
          </button>
          <button
            onClick={() => handleGenerateReport(REPORT_TYPE.WEEKLY_UTILIZATION)}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-purple-700 bg-white border border-purple-300 rounded-md hover:bg-purple-50 disabled:opacity-50"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>การใช้งานรายสัปดาห์</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ประเภทรายงาน
              </label>
              <select
                value={filter.reportType}
                onChange={(e) => setFilter({ ...filter, reportType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value={REPORT_TYPE.DAILY_SUMMARY}>สรุปรายวัน</option>
                <option value={REPORT_TYPE.WEEKLY_UTILIZATION}>การใช้งานรายสัปดาห์</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนที่แสดง
              </label>
              <select
                value={filter.limit}
                onChange={(e) => setFilter({ ...filter, limit: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onDownload={handleDownload}
              onView={handleView}
              isDownloading={downloading}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<DocumentTextIcon className="w-24 h-24" />}
          title="ไม่มีรายงาน"
          description="ยังไม่มีรายงานที่สร้างไว้ คุณสามารถสร้างรายงานใหม่ได้จากปุ่มด้านบน"
        />
      )}

      {/* Modals */}
      {preferences && (
        <PreferencesModal
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          preferences={preferences}
          onSave={handleSavePreferences}
        />
      )}

      <ReportDetailModal
        isOpen={selectedReport !== null}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
      />
    </div>
  );
};

export default ReportHistoryViewer;
