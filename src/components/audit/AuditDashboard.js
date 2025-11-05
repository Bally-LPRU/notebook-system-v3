import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import ActivityLoggerService from '../../services/activityLoggerService';
import PermissionGuard, { PermissionDeniedMessage } from '../common/PermissionGuard';
import PermissionService from '../../services/permissionService';
import AuditLogViewer from './AuditLogViewer';
import UserActivityTracker from './UserActivityTracker';

/**
 * Audit Dashboard Component
 * Main dashboard for audit trail and system monitoring
 */
const AuditDashboard = () => {
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    end: new Date()
  });

  // Load system statistics
  const loadSystemStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = await ActivityLoggerService.getSystemActivityStats(dateRange);
      setSystemStats(stats);
    } catch (err) {
      console.error('Error loading system stats:', err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลสถิติ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissions.canViewAudit) {
      loadSystemStats();
    }
  }, [dateRange, permissions.canViewAudit]);

  // Handle date range change
  const handleDateRangeChange = (days) => {
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    setDateRange({ start, end });
  };

  // Get activity type display name
  const getActivityTypeDisplayName = (activityType) => {
    const typeMap = {
      equipment_created: 'สร้างอุปกรณ์',
      equipment_updated: 'แก้ไขอุปกรณ์',
      equipment_deleted: 'ลบอุปกรณ์',
      equipment_viewed: 'ดูอุปกรณ์',
      equipment_exported: 'ส่งออกอุปกรณ์',
      bulk_update: 'แก้ไขหลายรายการ',
      bulk_delete: 'ลบหลายรายการ',
      permission_denied: 'ถูกปฏิเสธสิทธิ์',
      system_error: 'ข้อผิดพลาดระบบ'
    };
    return typeMap[activityType] || activityType;
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    const colorMap = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colorMap[severity] || 'text-gray-600 bg-gray-100';
  };

  if (!permissions.canViewAudit) {
    return (
      <PermissionDeniedMessage
        message="คุณไม่มีสิทธิ์ในการดู audit dashboard"
        requiredRole={PermissionService.ROLES.ADMIN}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Dashboard</h1>
          <p className="text-gray-600">ติดตามและวิเคราะห์กิจกรรมในระบบ</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => handleDateRangeChange(1)}
            className={`px-3 py-1 text-sm rounded-md ${
              dateRange.start.getTime() === new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).getTime()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            วันนี้
          </button>
          <button
            onClick={() => handleDateRangeChange(7)}
            className={`px-3 py-1 text-sm rounded-md ${
              dateRange.start.getTime() === new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 วัน
          </button>
          <button
            onClick={() => handleDateRangeChange(30)}
            className={`px-3 py-1 text-sm rounded-md ${
              dateRange.start.getTime() === new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 วัน
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ภาพรวม
          </button>
          <button
            onClick={() => setActiveTab('audit-log')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'audit-log'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Audit Log
          </button>
          <button
            onClick={() => setActiveTab('user-activity')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'user-activity'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            กิจกรรมผู้ใช้
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
              <button
                onClick={loadSystemStats}
                className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                ลองใหม่
              </button>
            </div>
          ) : systemStats ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {systemStats.totalActivities.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">กิจกรรมทั้งหมด</div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {systemStats.uniqueUsers}
                  </div>
                  <div className="text-sm text-gray-600">ผู้ใช้ที่มีกิจกรรม</div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {systemStats.errorCount}
                  </div>
                  <div className="text-sm text-gray-600">ข้อผิดพลาด</div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {systemStats.permissionDeniedCount}
                  </div>
                  <div className="text-sm text-gray-600">การปฏิเสธสิทธิ์</div>
                </div>
              </div>

              {/* Activity Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Types */}
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ประเภทกิจกรรม</h3>
                  <div className="space-y-3">
                    {Object.entries(systemStats.activityTypes)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 8)
                      .map(([activityType, count]) => {
                        const percentage = (count / systemStats.totalActivities) * 100;
                        return (
                          <div key={activityType} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {getActivityTypeDisplayName(activityType)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {count.toLocaleString()} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Severity Levels */}
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ระดับความสำคัญ</h3>
                  <div className="space-y-3">
                    {Object.entries(systemStats.severityLevels)
                      .sort(([,a], [,b]) => b - a)
                      .map(([severity, count]) => {
                        const percentage = (count / systemStats.totalActivities) * 100;
                        const severityNames = {
                          low: 'ต่ำ',
                          medium: 'ปานกลาง',
                          high: 'สูง',
                          critical: 'วิกฤต'
                        };
                        
                        return (
                          <div key={severity} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${getSeverityColor(severity)}`}>
                                  {severityNames[severity] || severity}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {count.toLocaleString()} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    severity === 'low' ? 'bg-green-500' :
                                    severity === 'medium' ? 'bg-yellow-500' :
                                    severity === 'high' ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Daily Activity Chart */}
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">กิจกรรมรายวัน</h3>
                <div className="flex items-end justify-between h-40 gap-2">
                  {Object.entries(systemStats.dailyActivity)
                    .sort(([a], [b]) => new Date(a) - new Date(b))
                    .slice(-14) // Show last 14 days
                    .map(([date, count]) => {
                      const maxCount = Math.max(...Object.values(systemStats.dailyActivity));
                      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      
                      return (
                        <div key={date} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600"
                            style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0px' }}
                            title={`${count} กิจกรรม`}
                          ></div>
                          <div className="text-xs text-gray-500 mt-2 text-center transform -rotate-45 origin-top-left">
                            {new Date(date).toLocaleDateString('th-TH', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="text-xs font-medium text-gray-700 mt-1">
                            {count}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Top Users */}
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ผู้ใช้ที่มีกิจกรรมมากที่สุด</h3>
                <div className="space-y-3">
                  {Object.entries(systemStats.topUsers).map(([userId, count], index) => {
                    const percentage = (count / systemStats.totalActivities) * 100;
                    return (
                      <div key={userId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              User ID: {userId.substring(0, 8)}...
                            </div>
                            <div className="text-xs text-gray-500">
                              {count.toLocaleString()} กิจกรรม ({percentage.toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {activeTab === 'audit-log' && <AuditLogViewer />}

      {activeTab === 'user-activity' && <UserActivityTracker showHeader={false} />}
    </div>
  );
};

export default AuditDashboard;