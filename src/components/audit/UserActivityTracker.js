import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ActivityLoggerService from '../../services/activityLoggerService';

/**
 * User Activity Tracker Component
 * Displays activity summary for the current user
 */
const UserActivityTracker = ({ userId = null, showHeader = true }) => {
  const { userProfile } = useAuth();
  const [activitySummary, setActivitySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date()
  });

  const targetUserId = userId || userProfile?.uid;

  // Load user activity summary
  const loadActivitySummary = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      setError(null);

      const summary = await ActivityLoggerService.getUserActivitySummary(targetUserId, dateRange);
      setActivitySummary(summary);
    } catch (err) {
      console.error('Error loading user activity summary:', err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลกิจกรรม');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivitySummary();
  }, [targetUserId, dateRange]);

  // Handle date range change
  const handleDateRangeChange = (days) => {
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    setDateRange({ start, end });
  };

  // Format activity type for display
  const formatActivityType = (activityType) => {
    const typeMap = {
      equipment_created: 'สร้างอุปกรณ์',
      equipment_updated: 'แก้ไขอุปกรณ์',
      equipment_deleted: 'ลบอุปกรณ์',
      equipment_viewed: 'ดูอุปกรณ์',
      equipment_exported: 'ส่งออกอุปกรณ์',
      bulk_update: 'แก้ไขหลายรายการ',
      bulk_delete: 'ลบหลายรายการ',
      bulk_export: 'ส่งออกหลายรายการ',
      image_uploaded: 'อัปโหลดรูปภาพ',
      image_deleted: 'ลบรูปภาพ',
      category_created: 'สร้างหมวดหมู่',
      category_updated: 'แก้ไขหมวดหมู่',
      category_deleted: 'ลบหมวดหมู่',
      report_generated: 'สร้างรายงาน',
      report_exported: 'ส่งออกรายงาน',
      user_login: 'เข้าสู่ระบบ',
      user_logout: 'ออกจากระบบ'
    };
    return typeMap[activityType] || activityType;
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    const colorMap = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colorMap[severity] || 'text-gray-600';
  };

  if (!targetUserId) {
    return (
      <div className="text-center py-8 text-gray-500">
        ไม่พบข้อมูลผู้ใช้
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">กิจกรรมของฉัน</h2>
            <p className="text-gray-600">ติดตามกิจกรรมและการใช้งานของคุณ</p>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2">
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
            <button
              onClick={() => handleDateRangeChange(90)}
              className={`px-3 py-1 text-sm rounded-md ${
                dateRange.start.getTime() === new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).getTime()
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              90 วัน
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p>{error}</p>
          <button
            onClick={loadActivitySummary}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            ลองใหม่
          </button>
        </div>
      ) : !activitySummary ? (
        <div className="text-center py-8 text-gray-500">
          ไม่พบข้อมูลกิจกรรม
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                {activitySummary.totalActivities}
              </div>
              <div className="text-sm text-gray-600">กิจกรรมทั้งหมด</div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {activitySummary.mostActiveDay?.count || 0}
              </div>
              <div className="text-sm text-gray-600">
                กิจกรรมสูงสุดต่อวัน
                {activitySummary.mostActiveDay && (
                  <div className="text-xs text-gray-500">
                    ({new Date(activitySummary.mostActiveDay.date).toLocaleDateString('th-TH')})
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(activitySummary.activityBreakdown).length}
              </div>
              <div className="text-sm text-gray-600">ประเภทกิจกรรม</div>
            </div>
          </div>

          {/* Activity Trend Chart */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">แนวโน้มกิจกรรม (7 วันล่าสุด)</h3>
            <div className="flex items-end justify-between h-32 gap-2">
              {activitySummary.activityTrend.map((day, index) => {
                const maxCount = Math.max(...activitySummary.activityTrend.map(d => d.count));
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0px' }}
                      title={`${day.count} กิจกรรม`}
                    ></div>
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      {new Date(day.date).toLocaleDateString('th-TH', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      {day.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Types */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ประเภทกิจกรรม</h3>
              <div className="space-y-3">
                {Object.entries(activitySummary.activityBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([activityType, count]) => {
                    const percentage = (count / activitySummary.totalActivities) * 100;
                    return (
                      <div key={activityType} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {formatActivityType(activityType)}
                            </span>
                            <span className="text-sm text-gray-500">{count}</span>
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

            {/* Severity Breakdown */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ระดับความสำคัญ</h3>
              <div className="space-y-3">
                {Object.entries(activitySummary.severityBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([severity, count]) => {
                    const percentage = (count / activitySummary.totalActivities) * 100;
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
                            <span className={`text-sm font-medium ${getSeverityColor(severity)}`}>
                              {severityNames[severity] || severity}
                            </span>
                            <span className="text-sm text-gray-500">{count}</span>
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

          {/* Recent Activities */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">กิจกรรมล่าสุด</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {activitySummary.recentActivities.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  ไม่มีกิจกรรมล่าสุด
                </div>
              ) : (
                activitySummary.recentActivities.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatActivityType(activity.activityType)}
                        </div>
                        {activity.details?.equipmentNumber && (
                          <div className="text-sm text-gray-600">
                            อุปกรณ์: {activity.details.equipmentNumber}
                            {activity.details.equipmentName && (
                              <span> ({activity.details.equipmentName})</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Intl.DateTimeFormat('th-TH', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserActivityTracker;