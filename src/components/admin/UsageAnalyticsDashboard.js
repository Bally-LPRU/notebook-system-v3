/**
 * Usage Analytics Dashboard Component
 * 
 * Dashboard for viewing equipment utilization statistics, high-demand equipment,
 * idle equipment, and inventory recommendations.
 * 
 * Requirements: 3.4, 3.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CalendarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import EquipmentUsageAnalyzerService from '../../services/equipmentUsageAnalyzerService';
import {
  EQUIPMENT_CLASSIFICATION,
  getClassificationLabel,
  getClassificationBadgeClass,
  formatUtilizationRate
} from '../../types/equipmentUtilization';
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
    day: 'numeric'
  });
};

/**
 * Statistics Summary Cards Component
 */
const StatsSummaryCards = ({ summary }) => {
  if (!summary) return null;

  const totalEquipment = summary.totalEquipment || 0;
  const avgUtilization = summary.averageUtilization || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
        <p className="text-sm text-gray-600">อุปกรณ์ทั้งหมด</p>
        <p className="text-2xl font-bold text-gray-900">{totalEquipment}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
        <p className="text-sm text-gray-600">ความต้องการสูง</p>
        <p className="text-2xl font-bold text-red-600">{summary.highDemandCount || 0}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
        <p className="text-sm text-gray-600">ไม่ถูกใช้งาน</p>
        <p className="text-2xl font-bold text-gray-600">{summary.idleCount || 0}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
        <p className="text-sm text-gray-600">อัตราการใช้งานเฉลี่ย</p>
        <p className="text-2xl font-bold text-green-600">
          {formatUtilizationRate(avgUtilization)}
        </p>
      </div>
    </div>
  );
};

/**
 * Equipment List Item Component
 */
const EquipmentListItem = ({ equipment, showRecommendation = false }) => {
  const badgeClass = getClassificationBadgeClass(equipment.classification);
  const daysSinceLastBorrow = equipment.lastBorrowedDate
    ? Math.floor((new Date() - new Date(equipment.lastBorrowedDate)) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {equipment.equipmentName}
          </h4>
          {equipment.category && (
            <p className="text-xs text-gray-500 mt-1">{equipment.category}</p>
          )}
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeClass}`}>
          {getClassificationLabel(equipment.classification)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">อัตราการใช้งาน:</span>
          <span className="ml-1 font-medium text-gray-900">
            {formatUtilizationRate(equipment.utilizationRate)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">จำนวนการยืม:</span>
          <span className="ml-1 font-medium text-gray-900">
            {equipment.totalLoans} ครั้ง
          </span>
        </div>
        {equipment.averageLoanDuration > 0 && (
          <div>
            <span className="text-gray-500">ระยะเวลาเฉลี่ย:</span>
            <span className="ml-1 font-medium text-gray-900">
              {equipment.averageLoanDuration} วัน
            </span>
          </div>
        )}
        {daysSinceLastBorrow !== null && (
          <div>
            <span className="text-gray-500">ยืมล่าสุด:</span>
            <span className="ml-1 font-medium text-gray-900">
              {daysSinceLastBorrow} วันที่แล้ว
            </span>
          </div>
        )}
      </div>

      {showRecommendation && equipment.recommendation && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-700">{equipment.recommendation}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Recommendation Card Component
 */
const RecommendationCard = ({ recommendation }) => {
  const isIncrease = recommendation.recommendationType === 'increase_stock';
  const Icon = isIncrease ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const colorClass = isIncrease ? 'text-red-600' : 'text-gray-600';
  const bgClass = isIncrease ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className={`rounded-lg shadow p-4 ${bgClass}`}>
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-full ${isIncrease ? 'bg-red-100' : 'bg-gray-100'}`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">
            {recommendation.equipmentName}
          </h4>
          <p className="text-xs text-gray-600 mt-1">
            {recommendation.reason}
          </p>
          <div className="mt-2 flex items-center space-x-4 text-xs">
            <span className="text-gray-500">
              อัตราการใช้งาน: <span className="font-medium text-gray-900">
                {formatUtilizationRate(recommendation.utilizationRate)}
              </span>
            </span>
            <span className="text-gray-500">
              คะแนน: <span className="font-medium text-gray-900">
                {recommendation.demandScore}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Usage Analytics Dashboard Component
 */
const UsageAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview'); // overview, high-demand, idle, recommendations

  /**
   * Load dashboard data
   */
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await EquipmentUsageAnalyzerService.getUtilizationDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading usage analytics:', err);
      setError('ไม่สามารถโหลดข้อมูลการวิเคราะห์การใช้งานได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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
          onClick={loadDashboard}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <EmptyState
        icon={ChartBarIcon}
        title="ไม่มีข้อมูล"
        description="ไม่มีข้อมูลการวิเคราะห์การใช้งานในขณะนี้"
      />
    );
  }

  const { summary, highDemandEquipment, idleEquipment, topRecommendations, lastUpdated } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            การวิเคราะห์การใช้งานอุปกรณ์
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            ข้อมูลการใช้งานและคำแนะนำสำหรับการจัดการคลังอุปกรณ์
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4" />
              <span>อัปเดต: {formatDate(lastUpdated)}</span>
            </div>
          )}
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      <StatsSummaryCards summary={summary} />

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                selectedTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ภาพรวม
            </button>
            <button
              onClick={() => setSelectedTab('high-demand')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                selectedTab === 'high-demand'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ความต้องการสูง ({highDemandEquipment?.length || 0})
            </button>
            <button
              onClick={() => setSelectedTab('idle')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                selectedTab === 'idle'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ไม่ถูกใช้งาน ({idleEquipment?.length || 0})
            </button>
            <button
              onClick={() => setSelectedTab('recommendations')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                selectedTab === 'recommendations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              คำแนะนำ ({topRecommendations?.length || 0})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* High Demand Preview */}
              {highDemandEquipment && highDemandEquipment.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    อุปกรณ์ที่มีความต้องการสูง (Top 5)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {highDemandEquipment.slice(0, 5).map((equipment) => (
                      <EquipmentListItem key={equipment.equipmentId} equipment={equipment} />
                    ))}
                  </div>
                </div>
              )}

              {/* Idle Equipment Preview */}
              {idleEquipment && idleEquipment.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    อุปกรณ์ที่ไม่ถูกใช้งาน (Top 5)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {idleEquipment.slice(0, 5).map((equipment) => (
                      <EquipmentListItem key={equipment.equipmentId} equipment={equipment} />
                    ))}
                  </div>
                </div>
              )}

              {/* Top Recommendations Preview */}
              {topRecommendations && topRecommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    คำแนะนำสำคัญ (Top 5)
                  </h3>
                  <div className="space-y-3">
                    {topRecommendations.slice(0, 5).map((rec, index) => (
                      <RecommendationCard key={index} recommendation={rec} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* High Demand Tab */}
          {selectedTab === 'high-demand' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                อุปกรณ์ที่มีความต้องการสูง
              </h3>
              {highDemandEquipment && highDemandEquipment.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {highDemandEquipment.map((equipment) => (
                    <EquipmentListItem key={equipment.equipmentId} equipment={equipment} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ChartBarIcon}
                  title="ไม่มีอุปกรณ์ที่มีความต้องการสูง"
                  description="ไม่มีอุปกรณ์ที่มีอัตราการใช้งานสูงกว่า 80% ในขณะนี้"
                />
              )}
            </div>
          )}

          {/* Idle Equipment Tab */}
          {selectedTab === 'idle' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                อุปกรณ์ที่ไม่ถูกใช้งาน
              </h3>
              {idleEquipment && idleEquipment.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {idleEquipment.map((equipment) => (
                    <EquipmentListItem key={equipment.equipmentId} equipment={equipment} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ChartBarIcon}
                  title="ไม่มีอุปกรณ์ที่ไม่ถูกใช้งาน"
                  description="อุปกรณ์ทั้งหมดมีการใช้งานอย่างสม่ำเสมอ"
                />
              )}
            </div>
          )}

          {/* Recommendations Tab */}
          {selectedTab === 'recommendations' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                คำแนะนำการจัดการคลังอุปกรณ์
              </h3>
              {topRecommendations && topRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {topRecommendations.map((rec, index) => (
                    <RecommendationCard key={index} recommendation={rec} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ChartBarIcon}
                  title="ไม่มีคำแนะนำ"
                  description="ไม่มีคำแนะนำสำหรับการจัดการคลังอุปกรณ์ในขณะนี้"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsageAnalyticsDashboard;
