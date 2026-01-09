/**
 * Alert Dashboard Component
 * 
 * Centralized dashboard for viewing and managing admin intelligence alerts.
 * Displays alerts grouped by priority with filtering and quick actions.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * Design System: Matches AdminDashboard pastel color palette
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
import { Layout } from '../layout';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { 
  ALERT_PRIORITY, 
  ALERT_TYPE,
  getAlertTypeLabel,
  getPriorityLabel
} from '../../types/adminAlert';

// Pastel Color Palette (matching AdminDashboard)
const COLORS = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', fill: '#93C5FD', border: 'border-blue-200' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-600', fill: '#6EE7B7', border: 'border-emerald-200' },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-600', fill: '#FCD34D', border: 'border-amber-200' },
  red: { bg: 'bg-rose-100', text: 'text-rose-600', fill: '#FDA4AF', border: 'border-rose-200' },
  purple: { bg: 'bg-violet-100', text: 'text-violet-600', fill: '#C4B5FD', border: 'border-violet-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', fill: '#FDBA74', border: 'border-orange-200' },
  gray: { bg: 'bg-slate-100', text: 'text-slate-600', fill: '#CBD5E1', border: 'border-slate-200' },
};

/**
 * Get priority config with pastel colors
 */
const getPriorityConfig = (priority) => {
  switch (priority) {
    case ALERT_PRIORITY.CRITICAL:
      return { ...COLORS.red, icon: ExclamationTriangleIcon };
    case ALERT_PRIORITY.HIGH:
      return { ...COLORS.orange, icon: ExclamationCircleIcon };
    case ALERT_PRIORITY.MEDIUM:
      return { ...COLORS.yellow, icon: InformationCircleIcon };
    case ALERT_PRIORITY.LOW:
    default:
      return { ...COLORS.blue, icon: BellIcon };
  }
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
};

/**
 * Stat Card Component (matching AdminDashboard style)
 */
const StatCard = ({ title, value, color, delay = 0 }) => (
  <div
    className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border ${COLORS[color].border} p-6 
      hover:shadow-lg hover:scale-[1.02] transition-all duration-300 animate-fade-in`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
    <p className={`text-3xl font-bold ${COLORS[color].text} transition-all duration-300 group-hover:scale-110`}>
      {value}
    </p>
  </div>
);

/**
 * Alert Card Component with modern design
 */
const AlertCard = ({ alert, onQuickAction, isLoading }) => {
  const [expanded, setExpanded] = useState(false);
  const config = getPriorityConfig(alert.priority);
  const PriorityIcon = config.icon;

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border-l-4 ${config.border} 
      overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in`}>
      {/* Header */}
      <div 
        className="px-5 py-4 cursor-pointer hover:bg-gray-50/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className={`p-3 ${config.bg} rounded-xl transition-all duration-300 group-hover:scale-110`}>
              <PriorityIcon className={`w-5 h-5 ${config.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {alert.title}
                </h4>
                <span className={`px-3 py-1 text-xs font-medium ${config.text} ${config.bg} rounded-full`}>
                  {getPriorityLabel(alert.priority)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">
                {alert.description}
              </p>
              <div className="flex items-center space-x-4 mt-2.5 text-xs text-gray-500">
                <span className="px-2 py-0.5 bg-gray-100 rounded-full">{getAlertTypeLabel(alert.type)}</span>
                <span>{formatDate(alert.createdAt)}</span>
              </div>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            {expanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100">
          {/* Source Data */}
          {alert.sourceData && Object.keys(alert.sourceData).length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-semibold text-gray-700 uppercase mb-3">รายละเอียด</h5>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {alert.sourceData.equipmentName && (
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <span className="text-gray-500 text-xs">อุปกรณ์</span>
                    <p className="font-medium text-gray-900">{alert.sourceData.equipmentName}</p>
                  </div>
                )}
                {alert.sourceData.userName && (
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <span className="text-gray-500 text-xs">ผู้ใช้</span>
                    <p className="font-medium text-gray-900">{alert.sourceData.userName}</p>
                  </div>
                )}
                {alert.sourceData.daysOverdue !== undefined && (
                  <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                    <span className="text-gray-500 text-xs">เกินกำหนด</span>
                    <p className="font-bold text-rose-600">{alert.sourceData.daysOverdue} วัน</p>
                  </div>
                )}
                {alert.sourceData.noShowCount !== undefined && (
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                    <span className="text-gray-500 text-xs">ไม่มารับ</span>
                    <p className="font-bold text-orange-600">{alert.sourceData.noShowCount} ครั้ง</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {alert.quickActions && alert.quickActions.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-700 uppercase mb-3">การดำเนินการ</h5>
              <div className="flex flex-wrap gap-2">
                {alert.quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => onQuickAction(alert, action)}
                    disabled={isLoading}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300
                      ${action.action === 'dismiss' 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02]'}
                      disabled:opacity-50 disabled:cursor-not-allowed`}
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
const PriorityGroup = ({ priority, alerts, onQuickAction, isLoading }) => {
  const [collapsed, setCollapsed] = useState(false);
  const config = getPriorityConfig(priority);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 animate-fade-in">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-5 py-3 ${config.bg} rounded-2xl mb-4
          hover:shadow-md transition-all duration-300`}
      >
        <div className="flex items-center space-x-3">
          <span className={`font-semibold ${config.text}`}>{getPriorityLabel(priority)}</span>
          <span className={`px-3 py-1 text-xs font-bold text-white bg-gradient-to-r 
            ${priority === ALERT_PRIORITY.CRITICAL ? 'from-rose-500 to-red-600' :
              priority === ALERT_PRIORITY.HIGH ? 'from-orange-500 to-amber-600' :
              priority === ALERT_PRIORITY.MEDIUM ? 'from-amber-500 to-yellow-600' :
              'from-blue-500 to-cyan-600'} rounded-full`}>
            {alerts.length}
          </span>
        </div>
        {collapsed ? <ChevronDownIcon className={`w-5 h-5 ${config.text}`} /> : <ChevronUpIcon className={`w-5 h-5 ${config.text}`} />}
      </button>

      {!collapsed && (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div key={alert.id} style={{ animationDelay: `${index * 50}ms` }}>
              <AlertCard alert={alert} onQuickAction={onQuickAction} isLoading={isLoading} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Filter Panel Component
 */
const FilterPanel = ({ filter, onFilterChange, onReset }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 animate-fade-in">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาการแจ้งเตือน..."
            value={filter.searchTerm}
            onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl border transition-all duration-300
            ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          <FunnelIcon className="w-5 h-5" />
          <span className="font-medium">ตัวกรอง</span>
        </button>
      </div>

      {showFilters && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
              <select
                value={filter.type}
                onChange={(e) => onFilterChange({ type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                {Object.values(ALERT_TYPE).map((type) => (
                  <option key={type} value={type}>{getAlertTypeLabel(type)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ความสำคัญ</label>
              <select
                value={filter.priority}
                onChange={(e) => onFilterChange({ priority: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                {Object.values(ALERT_PRIORITY).map((priority) => (
                  <option key={priority} value={priority}>{getPriorityLabel(priority)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={onReset} className="px-5 py-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all">
                รีเซ็ตตัวกรอง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main Alert Dashboard Component
 */
const AlertDashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const {
    groupedAlerts, stats, filter, updateFilter, resetFilter,
    resolveAlert, executeQuickAction, refreshAlerts,
    loading, error, actionLoading, hasAlerts
  } = useAdminAlerts(isAdmin);

  const handleQuickAction = useCallback(async (alert, action) => {
    if (!currentUser) return;
    await executeQuickAction(alert, action, currentUser.uid);
  }, [currentUser, executeQuickAction]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-rose-600" />
            <p className="text-rose-800 font-medium">{error}</p>
          </div>
          <button onClick={refreshAlerts} className="mt-3 text-sm text-rose-600 hover:text-rose-800 underline">
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
              ศูนย์การแจ้งเตือน
            </h1>
            <p className="mt-1 text-gray-500">จัดการและติดตามการแจ้งเตือนทั้งหมดของระบบ</p>
          </div>
          <button
            onClick={refreshAlerts}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-gray-700 
              bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl 
              hover:bg-gray-50 hover:shadow-md transition-all duration-300 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="ทั้งหมด" value={stats.total} color="gray" delay={0} />
          <StatCard title="วิกฤต" value={stats.byPriority.critical} color="red" delay={100} />
          <StatCard title="สูง" value={stats.byPriority.high} color="orange" delay={200} />
          <StatCard title="ปานกลาง" value={stats.byPriority.medium} color="yellow" delay={300} />
        </div>

        {/* Filters */}
        <FilterPanel filter={filter} onFilterChange={updateFilter} onReset={resetFilter} />

        {/* Alerts by Priority */}
        {hasAlerts ? (
          <div>
            <PriorityGroup priority={ALERT_PRIORITY.CRITICAL} alerts={groupedAlerts[ALERT_PRIORITY.CRITICAL]} onQuickAction={handleQuickAction} isLoading={actionLoading} />
            <PriorityGroup priority={ALERT_PRIORITY.HIGH} alerts={groupedAlerts[ALERT_PRIORITY.HIGH]} onQuickAction={handleQuickAction} isLoading={actionLoading} />
            <PriorityGroup priority={ALERT_PRIORITY.MEDIUM} alerts={groupedAlerts[ALERT_PRIORITY.MEDIUM]} onQuickAction={handleQuickAction} isLoading={actionLoading} />
            <PriorityGroup priority={ALERT_PRIORITY.LOW} alerts={groupedAlerts[ALERT_PRIORITY.LOW]} onQuickAction={handleQuickAction} isLoading={actionLoading} />
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">ไม่มีการแจ้งเตือน</h3>
            <p className="text-gray-500 mt-1">ไม่มีการแจ้งเตือนที่ต้องดำเนินการในขณะนี้</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AlertDashboard;
