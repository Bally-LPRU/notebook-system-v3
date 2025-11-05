import React, { useState, useEffect, useMemo } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import ActivityLoggerService from '../../services/activityLoggerService';
import PermissionGuard, { PermissionDeniedMessage } from '../common/PermissionGuard';
import PermissionService from '../../services/permissionService';

/**
 * Audit Log Viewer Component
 * Displays audit trail and activity logs for administrators
 */
const AuditLogViewer = () => {
  const permissions = usePermissions();
  const [auditEntries, setAuditEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    userId: '',
    resourceId: '',
    activityTypes: [],
    dateRange: {
      start: null,
      end: null
    },
    severity: '',
    category: '',
    searchQuery: ''
  });
  const [pagination, setPagination] = useState({
    hasNextPage: false,
    totalItems: 0,
    pageSize: 50
  });
  const [lastDoc, setLastDoc] = useState(null);
  const [stats, setStats] = useState(null);

  // Load audit log entries
  const loadAuditEntries = async (resetPagination = true) => {
    try {
      setLoading(true);
      setError(null);

      const result = await ActivityLoggerService.getAuditLog({
        ...filters,
        pageSize: pagination.pageSize,
        lastDoc: resetPagination ? null : lastDoc
      });

      if (resetPagination) {
        setAuditEntries(result.entries);
        setLastDoc(result.lastDoc);
      } else {
        setAuditEntries(prev => [...prev, ...result.entries]);
        setLastDoc(result.lastDoc);
      }

      setPagination(result.pagination);
    } catch (err) {
      console.error('Error loading audit entries:', err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล audit log');
    } finally {
      setLoading(false);
    }
  };

  // Load system statistics
  const loadStats = async () => {
    try {
      const systemStats = await ActivityLoggerService.getSystemActivityStats(filters.dateRange);
      setStats(systemStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Load data on component mount and filter changes
  useEffect(() => {
    if (permissions.canViewAudit) {
      loadAuditEntries(true);
      loadStats();
    }
  }, [filters, permissions.canViewAudit]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle date range change
  const handleDateRangeChange = (start, end) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end }
    }));
  };

  // Load more entries
  const loadMore = () => {
    if (pagination.hasNextPage && !loading) {
      loadAuditEntries(false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      userId: '',
      resourceId: '',
      activityTypes: [],
      dateRange: { start: null, end: null },
      severity: '',
      category: '',
      searchQuery: ''
    });
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
      user_logout: 'ออกจากระบบ',
      permission_denied: 'ถูกปฏิเสธสิทธิ์',
      system_error: 'ข้อผิดพลาดระบบ'
    };
    return typeMap[activityType] || activityType;
  };

  // Get severity badge color
  const getSeverityColor = (severity) => {
    const colorMap = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colorMap[severity] || 'bg-gray-100 text-gray-800';
  };

  // Get severity display name
  const getSeverityName = (severity) => {
    const nameMap = {
      low: 'ต่ำ',
      medium: 'ปานกลาง',
      high: 'สูง',
      critical: 'วิกฤต'
    };
    return nameMap[severity] || severity;
  };

  if (!permissions.canViewAudit) {
    return (
      <PermissionDeniedMessage
        message="คุณไม่มีสิทธิ์ในการดู audit log"
        requiredRole={PermissionService.ROLES.ADMIN}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-600">ติดตามกิจกรรมและการเปลี่ยนแปลงในระบบ</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{stats.totalActivities}</div>
            <div className="text-sm text-gray-600">กิจกรรมทั้งหมด</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{stats.uniqueUsers}</div>
            <div className="text-sm text-gray-600">ผู้ใช้ที่มีกิจกรรม</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">{stats.errorCount}</div>
            <div className="text-sm text-gray-600">ข้อผิดพลาด</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">{stats.permissionDeniedCount}</div>
            <div className="text-sm text-gray-600">การปฏิเสธสิทธิ์</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ค้นหา
            </label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              placeholder="ค้นหาในกิจกรรม..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประเภทกิจกรรม
            </label>
            <select
              value={filters.activityTypes[0] || ''}
              onChange={(e) => handleFilterChange('activityTypes', e.target.value ? [e.target.value] : [])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              {Object.values(ActivityLoggerService.ACTIVITY_TYPES).map(type => (
                <option key={type} value={type}>
                  {formatActivityType(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ระดับความสำคัญ
            </label>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              {Object.values(ActivityLoggerService.SEVERITY_LEVELS).map(level => (
                <option key={level} value={level}>
                  {getSeverityName(level)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateRangeChange(
                e.target.value ? new Date(e.target.value) : null,
                filters.dateRange.end
              )}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateRangeChange(
                filters.dateRange.start,
                e.target.value ? new Date(e.target.value) : null
              )}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>
      </div>

      {/* Audit Entries */}
      <div className="bg-white rounded-lg border">
        {loading && auditEntries.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={() => loadAuditEntries(true)}
              className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              ลองใหม่
            </button>
          </div>
        ) : auditEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>ไม่พบข้อมูล audit log</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {auditEntries.map((entry) => (
              <AuditLogEntry
                key={entry.id}
                entry={entry}
                formatActivityType={formatActivityType}
                getSeverityColor={getSeverityColor}
                getSeverityName={getSeverityName}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {pagination.hasNextPage && (
          <div className="p-4 text-center border-t">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Individual Audit Log Entry Component
 */
const AuditLogEntry = ({ entry, formatActivityType, getSeverityColor, getSeverityName }) => {
  const [expanded, setExpanded] = useState(false);

  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp);
  };

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(entry.severity)}`}>
              {getSeverityName(entry.severity)}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatActivityType(entry.activityType)}
            </span>
            <span className="text-xs text-gray-500">
              {formatTimestamp(entry.timestamp)}
            </span>
          </div>

          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">ผู้ใช้:</span> {entry.userInfo?.displayName || 'ไม่ระบุ'} ({entry.userInfo?.email || 'ไม่ระบุ'})
            {entry.details?.equipmentNumber && (
              <>
                <span className="ml-4 font-medium">อุปกรณ์:</span> {entry.details.equipmentNumber}
              </>
            )}
            {entry.details?.equipmentName && (
              <span className="ml-2">({entry.details.equipmentName})</span>
            )}
          </div>

          {entry.details?.reason && (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">เหตุผล:</span> {entry.details.reason}
            </div>
          )}

          {expanded && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">รายละเอียดกิจกรรม</h4>
                  <div className="space-y-1">
                    <div><span className="font-medium">ID:</span> {entry.id}</div>
                    <div><span className="font-medium">ประเภททรัพยากร:</span> {entry.resourceType}</div>
                    {entry.resourceId && (
                      <div><span className="font-medium">ID ทรัพยากร:</span> {entry.resourceId}</div>
                    )}
                    <div><span className="font-medium">หมวดหมู่:</span> {entry.category}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">ข้อมูลเทคนิค</h4>
                  <div className="space-y-1">
                    <div><span className="font-medium">User Agent:</span> {entry.metadata?.userAgent?.substring(0, 50)}...</div>
                    <div><span className="font-medium">Session ID:</span> {entry.metadata?.sessionId}</div>
                    {entry.metadata?.browserInfo && (
                      <div><span className="font-medium">เบราว์เซอร์:</span> {entry.metadata.browserInfo.platform}</div>
                    )}
                  </div>
                </div>
              </div>

              {entry.details?.changes && entry.details.changes.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">การเปลี่ยนแปลง</h4>
                  <div className="space-y-2">
                    {entry.details.changes.map((change, index) => (
                      <div key={index} className="p-2 bg-white rounded border">
                        <div className="font-medium text-sm">{change.field}</div>
                        <div className="text-xs text-gray-600">
                          <span className="text-red-600">เก่า:</span> {JSON.stringify(change.oldValue)} →{' '}
                          <span className="text-green-600">ใหม่:</span> {JSON.stringify(change.newValue)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-4 p-1 text-gray-400 hover:text-gray-600"
        >
          <svg
            className={`w-5 h-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AuditLogViewer;