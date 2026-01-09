/**
 * Report History Viewer Component
 * 
 * Component for viewing report history with download options and preferences configuration.
 * Displays daily and weekly reports with filtering and download capabilities.
 * 
 * Requirements: 9.4, 9.5
 * Design System: Matches AdminDashboard pastel color palette
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowPathIcon,
  FunnelIcon,
  XMarkIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../layout';
import ScheduledReportService, { REPORT_TYPE } from '../../services/scheduledReportService';

// Pastel Color Palette (matching AdminDashboard)
const COLORS = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  purple: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  gray: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

/**
 * Format date for display - handles various date formats safely
 */
const formatDate = (date) => {
  if (!date) return '-';
  try {
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (typeof date.toDate === 'function') {
      d = date.toDate();
    } else if (typeof date === 'object' && date.seconds) {
      d = new Date(date.seconds * 1000);
    } else if (typeof date === 'string' || typeof date === 'number') {
      d = new Date(date);
    } else {
      return '-';
    }
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return '-';
  }
};

/**
 * Get report type config
 */
const getReportTypeConfig = (type) => {
  switch (type) {
    case REPORT_TYPE.DAILY_SUMMARY:
      return { label: 'สรุปรายวัน', icon: CalendarIcon, color: 'blue' };
    case REPORT_TYPE.WEEKLY_UTILIZATION:
      return { label: 'การใช้งานรายสัปดาห์', icon: ChartBarIcon, color: 'purple' };
    case REPORT_TYPE.MONTHLY_ANALYTICS:
      return { label: 'วิเคราะห์รายเดือน', icon: DocumentTextIcon, color: 'green' };
    default:
      return { label: type, icon: DocumentTextIcon, color: 'gray' };
  }
};

/**
 * Report Card Component
 */
const ReportCard = ({ report, onDownload, onView, isDownloading, index }) => {
  const config = getReportTypeConfig(report.reportType);
  const Icon = config.icon;
  const isViewed = report.viewedBy && report.viewedBy.length > 0;

  return (
    <div 
      className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border-2 overflow-hidden 
        hover:shadow-lg hover:scale-[1.02] transition-all duration-300 animate-fade-in
        ${isViewed ? 'border-gray-100' : `${COLORS[config.color].border}`}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className={`p-3 ${COLORS[config.color].bg} rounded-xl transition-all duration-300 group-hover:scale-110`}>
              <Icon className={`w-6 h-6 ${COLORS[config.color].text}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-semibold text-gray-900">{config.label}</h4>
                {!isViewed && (
                  <span className={`px-2 py-0.5 text-xs font-medium ${COLORS[config.color].text} ${COLORS[config.color].bg} rounded-full animate-pulse`}>
                    ใหม่
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">ช่วงเวลา: {report.period}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <ClockIcon className="w-4 h-4" />
            <span>{formatDate(report.generatedAt)}</span>
          </div>
          {report.downloadCount > 0 && (
            <div className="flex items-center space-x-1">
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>{report.downloadCount} ครั้ง</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => onView(report)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium 
              ${COLORS[config.color].text} ${COLORS[config.color].bg} rounded-xl 
              hover:shadow-md transition-all duration-300`}
          >
            <DocumentTextIcon className="w-4 h-4" />
            <span>ดูรายงาน</span>
          </button>
          <button
            onClick={() => onDownload(report)}
            disabled={isDownloading}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium 
              text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 hover:shadow-md 
              disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
 * Report Detail Modal Component
 */
const ReportDetailModal = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  const config = getReportTypeConfig(report.reportType);

  const renderDailySummary = (data) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-blue-50 rounded-2xl p-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-3">การยืม</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">คำขอใหม่:</span><span className="font-bold">{data.loans?.newRequests || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">อนุมัติ:</span><span className="font-bold text-emerald-600">{data.loans?.approved || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">ปฏิเสธ:</span><span className="font-bold text-rose-600">{data.loans?.rejected || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">คืนแล้ว:</span><span className="font-bold">{data.loans?.returned || 0}</span></div>
        </div>
      </div>
      <div className="bg-violet-50 rounded-2xl p-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-3">การจอง</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">จองใหม่:</span><span className="font-bold">{data.reservations?.newReservations || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">อนุมัติ:</span><span className="font-bold text-emerald-600">{data.reservations?.approved || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">ยกเลิก:</span><span className="font-bold text-gray-600">{data.reservations?.cancelled || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">ไม่มารับ:</span><span className="font-bold text-orange-600">{data.reservations?.noShows || 0}</span></div>
        </div>
      </div>
      <div className="bg-amber-50 rounded-2xl p-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-3">การแจ้งเตือน</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">ทั้งหมด:</span><span className="font-bold">{data.alerts?.total || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">วิกฤต:</span><span className="font-bold text-rose-600">{data.alerts?.critical || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">สูง:</span><span className="font-bold text-orange-600">{data.alerts?.high || 0}</span></div>
        </div>
      </div>
      <div className="bg-rose-50 rounded-2xl p-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-3">เกินกำหนด</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">ทั้งหมด:</span><span className="font-bold text-rose-600">{data.overdue?.total || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">วิกฤต:</span><span className="font-bold text-rose-600">{data.overdue?.critical || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">รวมวันเกิน:</span><span className="font-bold">{data.overdue?.totalDaysOverdue || 0}</span></div>
        </div>
      </div>
    </div>
  );

  const renderWeeklyUtilization = (data) => (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-2xl p-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-3">สรุปอุปกรณ์</h5>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-600">ความต้องการสูง:</span><span className="ml-2 font-bold text-rose-600">{data.equipment?.highDemand?.length || 0}</span></div>
          <div><span className="text-gray-600">ไม่ถูกใช้:</span><span className="ml-2 font-bold text-gray-600">{data.equipment?.idle?.length || 0}</span></div>
          <div><span className="text-gray-600">การใช้งานเฉลี่ย:</span><span className="ml-2 font-bold">{Math.round((data.equipment?.averageUtilization || 0) * 100)}%</span></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-violet-50 rounded-2xl p-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-3">การยืม</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">ทั้งหมด:</span><span className="font-bold">{data.loans?.totalRequests || 0}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">เวลาประมวลผลเฉลี่ย:</span><span className="font-bold">{data.loans?.averageProcessingTime || 0} ชม.</span></div>
          </div>
        </div>
        <div className="bg-orange-50 rounded-2xl p-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-3">การจอง</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">ทั้งหมด:</span><span className="font-bold">{data.reservations?.totalReservations || 0}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">อัตราไม่มารับ:</span><span className="font-bold text-orange-600">{Math.round((data.reservations?.noShowRate || 0) * 100)}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full animate-fade-in">
          <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${COLORS[config.color].bg} rounded-xl`}>
                  <config.icon className={`w-5 h-5 ${COLORS[config.color].text}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
                  <p className="text-sm text-gray-500">ช่วงเวลา: {report.period}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-5 max-h-96 overflow-y-auto">
            {report.reportType === REPORT_TYPE.DAILY_SUMMARY && renderDailySummary(report.data)}
            {report.reportType === REPORT_TYPE.WEEKLY_UTILIZATION && renderWeeklyUtilization(report.data)}
          </div>
          <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState({ reportType: 'all', limit: 10 });

  const loadData = useCallback(async () => {
    if (!currentUser || !isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      const queryOptions = { limit: filter.limit };
      if (filter.reportType !== 'all') queryOptions.reportType = filter.reportType;

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

  const handleDownload = async (report) => {
    try {
      setDownloading(true);
      const jsonData = await ScheduledReportService.exportReportToJSON(report.id);
      
      if (jsonData) {
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${report.reportType}_${report.period}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        await loadData();
      }
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('ไม่สามารถดาวน์โหลดรายงานได้');
    } finally {
      setDownloading(false);
    }
  };

  const handleView = async (report) => {
    try {
      if (currentUser) {
        await ScheduledReportService.markReportViewed(report.id, currentUser.uid);
      }
      setSelectedReport(report);
      await loadData();
    } catch (err) {
      console.error('Error viewing report:', err);
      setSelectedReport(report);
    }
  };

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
      <Layout>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 animate-fade-in">
          <p className="text-amber-800 font-medium">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </Layout>
    );
  }

  if (loading && reports.length === 0) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 animate-fade-in">
          <p className="text-rose-800 font-medium">{error}</p>
          <button onClick={loadData} className="mt-3 text-sm text-rose-600 hover:text-rose-800 underline">
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              ประวัติรายงาน
            </h1>
            <p className="mt-1 text-gray-500">ดูและดาวน์โหลดรายงานที่สร้างไว้</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-gray-700 
              bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl 
              hover:bg-gray-50 hover:shadow-md transition-all duration-300 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
        </div>

        {/* Quick Generate Buttons */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-900">สร้างรายงานใหม่</h3>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleGenerateReport(REPORT_TYPE.DAILY_SUMMARY)}
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-blue-700 
                bg-white border border-blue-200 rounded-xl hover:bg-blue-50 hover:shadow-md 
                transition-all duration-300 disabled:opacity-50"
            >
              <CalendarIcon className="w-5 h-5" />
              <span>สรุปรายวัน</span>
            </button>
            <button
              onClick={() => handleGenerateReport(REPORT_TYPE.WEEKLY_UTILIZATION)}
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-violet-700 
                bg-white border border-violet-200 rounded-xl hover:bg-violet-50 hover:shadow-md 
                transition-all duration-300 disabled:opacity-50"
            >
              <ChartBarIcon className="w-5 h-5" />
              <span>การใช้งานรายสัปดาห์</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทรายงาน</label>
                <select
                  value={filter.reportType}
                  onChange={(e) => setFilter({ ...filter, reportType: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value={REPORT_TYPE.DAILY_SUMMARY}>สรุปรายวัน</option>
                  <option value={REPORT_TYPE.WEEKLY_UTILIZATION}>การใช้งานรายสัปดาห์</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนที่แสดง</label>
                <select
                  value={filter.limit}
                  onChange={(e) => setFilter({ ...filter, limit: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
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
            {reports.map((report, index) => (
              <ReportCard
                key={report.id}
                report={report}
                onDownload={handleDownload}
                onView={handleView}
                isDownloading={downloading}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">ไม่มีรายงาน</h3>
            <p className="text-gray-500 mt-1">ยังไม่มีรายงานที่สร้างไว้ คุณสามารถสร้างรายงานใหม่ได้จากปุ่มด้านบน</p>
          </div>
        )}

        {/* Report Detail Modal */}
        <ReportDetailModal
          isOpen={selectedReport !== null}
          onClose={() => setSelectedReport(null)}
          report={selectedReport}
        />
      </div>
    </Layout>
  );
};

export default ReportHistoryViewer;
