/**
 * Alert Dashboard Component
 * 
 * Centralized dashboard for viewing and managing admin intelligence alerts.
 * Displays alerts grouped by priority with filtering and quick actions.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import React, { useState, useCallback } from 'react';
import { 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon,
  InformationCircleIcon,
  BellIcon,
  FunnelIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import useAdminAlerts from '../../hooks/useAdminAlerts';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { 
  ALERT_PRIORITY, 
  ALERT_TYPE,
  getAlertTypeLabel,
  getPriorityLabel
} from '../../types/adminAlert';

/**
 * Get priority icon and colors
 */
const getPriorityConfig = (priority) => {
  switch (priority) {
    case ALERT_PRIORITY.CRITICAL:
      return {
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-500',
        iconColor: 'text-red-600',
        badgeColor: 'bg-red-600'
      };
    case ALERT_PRIORITY.HIGH:
      return {
        icon: ExclamationCircleIcon,
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-500',
        iconColor: 'text-orange-600',
        badgeColor: 'bg-orange-500'
      };
    case ALERT_PRIORITY.MEDIUM:
      return {
        icon: InformationCircleIcon,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-500',
        iconColor: 'text-yellow-600',
        badgeColor: 'bg-yellow-500'
      };
    case ALERT_PRIORITY.LOW:
    default:
      return {
        icon: BellIcon,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-500',
        iconColor: 'text-blue-600',
        badgeColor: 'bg-blue-500'
      };
  }
};

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
 * Alert Card Component
 */
const AlertCard = ({ alert, onResolve, onQuickAction, isLoading }) => {
  const [expanded, setExpanded] = useState(false);
  const config = getPriorityConfig(alert.priority);
  const PriorityIcon = config.icon;

  const handleQuickAction = (action) => {
    onQuickAction(alert, action);
  };

  return (
    <div className={`bg-white rounded-lg shadow border-l-4 ${config.borderColor} overflow-hidden`}>
      {/* Header */}
      <div 
        className="px-4 py-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <PriorityIcon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {alert.title}
                </h4>
                <span className={`px-2 py-0.5 text-xs font-medium text-white rounded-full ${config.badgeColor}`}>
                  {getPriorityLabel(alert.priority)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {alert.description}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>{getAlertTypeLabel(alert.type)}</span>
                <span>•</span>
                <span>{formatDate(alert.createdAt)}</span>
              </div>
            </div>
          </div>
          <button className="p-1 text-gray-400 hover:text-gray-600">
            {expanded ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          {/* Source Data */}
          {alert.sourceData && Object.keys(alert.sourceData).length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                รายละเอียด
              </h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {alert.sourceData.equipmentName && (
                  <div>
                    <span className="text-gray-500">อุปกรณ์:</span>
                    <span className="ml-1 text-gray-900">{alert.sourceData.equipmentName}</span>
                  </div>
                )}
                {alert.sourceData.userName && (
                  <div>
                    <span className="text-gray-500">ผู้ใช้:</span>
                    <span className="ml-1 text-gray-900">{alert.sourceData.userName}</span>
                  </div>
                )}
                {alert.sourceData.userEmail && (
                  <div>
                    <span className="text-gray-500">อีเมล:</span>
                    <span className="ml-1 text-gray-900">{alert.sourceData.userEmail}</span>
                  </div>
                )}
                {alert.sourceData.daysOverdue !== undefined && (
                  <div>
                    <span className="text-gray-500">เกินกำหนด:</span>
                    <span className="ml-1 text-red-600 font-medium">{alert.sourceData.daysOverdue} วัน</span>
                  </div>
                )}
                {alert.sourceData.noShowCount !== undefined && (
                  <div>
                    <span className="text-gray-500">ไม่มารับ:</span>
                    <span className="ml-1 text-orange-600 font-medium">{alert.sourceData.noShowCount} ครั้ง</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {alert.quickActions && alert.quickActions.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                การดำเนินการ
              </h5>
              <div className="flex flex-wrap gap-2">
                {alert.quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    disabled={isLoading}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-md
                      ${action.action === 'dismiss' 
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'}
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Priority Group Component
 */
const PriorityGroup = ({ priority, alerts, onResolve, onQuickAction, isLoading }) => {
  const [collapsed, setCollapsed] = useState(false);
  const config = getPriorityConfig(priority);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg ${config.bgColor} mb-3`}
      >
        <div className="flex items-center space-x-2">
          <span className={`font-semibold ${config.textColor}`}>
            {getPriorityLabel(priority)}
          </span>
          <span className={`px-2 py-0.5 text-xs font-bold text-white rounded-full ${config.badgeColor}`}>
            {alerts.length}
          </span>
        </div>
        {collapsed ? (
          <ChevronDownIcon className={`w-5 h-5 ${config.textColor}`} />
        ) : (
          <ChevronUpIcon className={`w-5 h-5 ${config.textColor}`} />
        )}
      </button>

      {!collapsed && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onResolve={onResolve}
              onQuickAction={onQuickAction}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Filter Panel Component
 */
const FilterPanel = ({ filter, onFilterChange, onReset, alertTypes }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      {/* Search and Toggle */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาการแจ้งเตือน..."
            value={filter.searchTerm}
            onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
            showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="w-5 h-5" />
          <span>ตัวกรอง</span>
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ประเภท
              </label>
              <select
                value={filter.type}
                onChange={(e) => onFilterChange({ type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                {Object.values(ALERT_TYPE).map((type) => (
                  <option key={type} value={type}>
                    {getAlertTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ความสำคัญ
              </label>
              <select
                value={filter.priority}
                onChange={(e) => onFilterChange({ priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                {Object.values(ALERT_PRIORITY).map((priority) => (
                  <option key={priority} value={priority}>
                    {getPriorityLabel(priority)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ช่วงวันที่
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filter.dateRange?.start || ''}
                  onChange={(e) => onFilterChange({ 
                    dateRange: { ...filter.dateRange, start: e.target.value } 
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={filter.dateRange?.end || ''}
                  onChange={(e) => onFilterChange({ 
                    dateRange: { ...filter.dateRange, end: e.target.value } 
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              รีเซ็ตตัวกรอง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Statistics Cards Component
 */
const StatsCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
        <p className="text-sm text-gray-600">ทั้งหมด</p>
        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
        <p className="text-sm text-gray-600">วิกฤต</p>
        <p className="text-2xl font-bold text-red-600">{stats.byPriority.critical}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
        <p className="text-sm text-gray-600">สูง</p>
        <p className="text-2xl font-bold text-orange-600">{stats.byPriority.high}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
        <p className="text-sm text-gray-600">ปานกลาง</p>
        <p className="text-2xl font-bold text-yellow-600">{stats.byPriority.medium}</p>
      </div>
    </div>
  );
};

/**
 * Main Alert Dashboard Component
 */
const AlertDashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const {
    groupedAlerts,
    stats,
    filter,
    updateFilter,
    resetFilter,
    resolveAlert,
    executeQuickAction,
    refreshAlerts,
    loading,
    error,
    actionLoading,
    hasAlerts
  } = useAdminAlerts(isAdmin);

  const handleResolve = useCallback(async (alertId, action) => {
    if (!currentUser) return;
    await resolveAlert(alertId, currentUser.uid, action);
  }, [currentUser, resolveAlert]);

  const handleQuickAction = useCallback(async (alert, action) => {
    if (!currentUser) return;
    await executeQuickAction(alert, action, currentUser.uid);
  }, [currentUser, executeQuickAction]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
        <button
          onClick={refreshAlerts}
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
            ศูนย์การแจ้งเตือน
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            จัดการและติดตามการแจ้งเตือนทั้งหมดของระบบ
          </p>
        </div>
        <button
          onClick={refreshAlerts}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรช</span>
        </button>
      </div>

      {/* Statistics */}
      <StatsCards stats={stats} />

      {/* Filters */}
      <FilterPanel
        filter={filter}
        onFilterChange={updateFilter}
        onReset={resetFilter}
        alertTypes={Object.values(ALERT_TYPE)}
      />

      {/* Alerts by Priority */}
      {hasAlerts ? (
        <div>
          <PriorityGroup
            priority={ALERT_PRIORITY.CRITICAL}
            alerts={groupedAlerts[ALERT_PRIORITY.CRITICAL]}
            onResolve={handleResolve}
            onQuickAction={handleQuickAction}
            isLoading={actionLoading}
          />
          <PriorityGroup
            priority={ALERT_PRIORITY.HIGH}
            alerts={groupedAlerts[ALERT_PRIORITY.HIGH]}
            onResolve={handleResolve}
            onQuickAction={handleQuickAction}
            isLoading={actionLoading}
          />
          <PriorityGroup
            priority={ALERT_PRIORITY.MEDIUM}
            alerts={groupedAlerts[ALERT_PRIORITY.MEDIUM]}
            onResolve={handleResolve}
            onQuickAction={handleQuickAction}
            isLoading={actionLoading}
          />
          <PriorityGroup
            priority={ALERT_PRIORITY.LOW}
            alerts={groupedAlerts[ALERT_PRIORITY.LOW]}
            onResolve={handleResolve}
            onQuickAction={handleQuickAction}
            isLoading={actionLoading}
          />
        </div>
      ) : (
        <EmptyState
          icon={<CheckCircleIcon className="w-24 h-24" />}
          title="ไม่มีการแจ้งเตือน"
          description="ไม่มีการแจ้งเตือนที่ต้องดำเนินการในขณะนี้"
        />
      )}
    </div>
  );
};

export default AlertDashboard;
