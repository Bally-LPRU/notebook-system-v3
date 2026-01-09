/**
 * Usage Analytics Dashboard Component
 * 
 * Dashboard for viewing equipment utilization statistics, high-demand equipment,
 * idle equipment, and inventory recommendations.
 * 
 * Requirements: 3.4, 3.5
 * Design System: Matches AdminDashboard pastel color palette
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CalendarIcon,
  CubeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import EquipmentUsageAnalyzerService from '../../services/equipmentUsageAnalyzerService';
import {
  getClassificationLabel,
  getClassificationBadgeClass,
  formatUtilizationRate
} from '../../types/equipmentUtilization';
import { Layout } from '../layout';

// Pastel Color Palette (matching AdminDashboard)
const COLORS = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  red: { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
  purple: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
  gray: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

/**
 * Format date for display
 */
const formatDate = (date) => {
  if (!date) return '-';
  const d = date?.toDate?.() || new Date(date);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Stat Card Component
 */
const StatCard = ({ title, value, icon: Icon, color, delay = 0 }) => (
  <div
    className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border ${COLORS[color].border} p-6 
      hover:shadow-lg hover:scale-[1.02] transition-all duration-300 animate-fade-in`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className={`text-3xl font-bold ${COLORS[color].text} transition-all duration-300 group-hover:scale-110`}>
          {value}
        </p>
      </div>
      <div className={`w-14 h-14 ${COLORS[color].bg} rounded-2xl flex items-center justify-center 
        transition-all duration-300 group-hover:rotate-12 group-hover:scale-110`}>
        <Icon className={`w-7 h-7 ${COLORS[color].text}`} />
      </div>
    </div>
  </div>
);

/**
 * Equipment Card Component
 */
const EquipmentCard = ({ equipment, showRecommendation = false }) => {
  const daysSinceLastBorrow = equipment.lastBorrowedDate
    ? Math.floor((new Date() - new Date(equipment.lastBorrowedDate)) / (1000 * 60 * 60 * 24))
    : null;

  const utilizationColor = equipment.utilizationRate > 0.8 ? 'red' : 
    equipment.utilizationRate > 0.5 ? 'yellow' : 
    equipment.utilizationRate > 0.2 ? 'green' : 'gray';

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 
      hover:shadow-lg hover:scale-[1.02] transition-all duration-300 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">{equipment.equipmentName}</h4>
          {equipment.category && (
            <p className="text-xs text-gray-500 mt-1">{equipment.category}</p>
          )}
        </div>
        <span className={`px-3 py-1 text-xs font-medium ${COLORS[utilizationColor].text} ${COLORS[utilizationColor].bg} rounded-full`}>
          {getClassificationLabel(equipment.classification)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 rounded-xl p-3">
          <span className="text-gray-500 text-xs">อัตราการใช้งาน</span>
          <p className={`font-bold ${COLORS[utilizationColor].text}`}>
            {formatUtilizationRate(equipment.utilizationRate)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <span className="text-gray-500 text-xs">จำนวนการยืม</span>
          <p className="font-bold text-gray-900">{equipment.totalLoans} ครั้ง</p>
        </div>
        {equipment.averageLoanDuration > 0 && (
          <div className="bg-gray-50 rounded-xl p-3">
            <span className="text-gray-500 text-xs">ระยะเวลาเฉลี่ย</span>
            <p className="font-bold text-gray-900">{equipment.averageLoanDuration} วัน</p>
          </div>
        )}
        {daysSinceLastBorrow !== null && (
          <div className="bg-gray-50 rounded-xl p-3">
            <span className="text-gray-500 text-xs">ยืมล่าสุด</span>
            <p className="font-bold text-gray-900">{daysSinceLastBorrow} วันที่แล้ว</p>
          </div>
        )}
      </div>

      {showRecommendation && equipment.recommendation && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 bg-amber-50 rounded-xl p-3">{equipment.recommendation}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Recommendation Card Component
 */
const RecommendationCard = ({ recommendation, index }) => {
  const isIncrease = recommendation.recommendationType === 'increase_stock';
  const Icon = isIncrease ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const color = isIncrease ? 'red' : 'gray';

  return (
    <div className={`${COLORS[color].bg} rounded-2xl shadow-sm p-5 
      hover:shadow-lg transition-all duration-300 animate-fade-in`}
      style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-start space-x-4">
        <div className={`p-3 bg-white rounded-xl`}>
          <Icon className={`w-6 h-6 ${COLORS[color].text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">{recommendation.equipmentName}</h4>
          <p className="text-xs text-gray-600 mt-1">{recommendation.reason}</p>
          <div className="mt-3 flex items-center space-x-4 text-xs">
            <span className="px-2 py-1 bg-white rounded-lg">
              อัตราการใช้งาน: <span className="font-bold">{formatUtilizationRate(recommendation.utilizationRate)}</span>
            </span>
            <span className="px-2 py-1 bg-white rounded-lg">
              คะแนน: <span className="font-bold">{recommendation.demandScore}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Tab Button Component
 */
const TabButton = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 text-sm font-medium border-b-2 transition-all duration-300
      ${active ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
  >
    {children} {count !== undefined && <span className="ml-1 text-xs">({count})</span>}
  </button>
);

/**
 * Main Usage Analytics Dashboard Component
 */
const UsageAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');

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
          <button onClick={loadDashboard} className="mt-3 text-sm text-rose-600 hover:text-rose-800 underline">
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </Layout>
    );
  }

  if (!dashboardData) {
    return (
      <Layout>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-fade-in">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">ไม่มีข้อมูล</h3>
          <p className="text-gray-500 mt-1">ไม่มีข้อมูลการวิเคราะห์การใช้งานในขณะนี้</p>
        </div>
      </Layout>
    );
  }

  const { summary, highDemandEquipment, idleEquipment, topRecommendations, lastUpdated } = dashboardData;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              การวิเคราะห์การใช้งานอุปกรณ์
            </h1>
            <p className="mt-1 text-gray-500">ข้อมูลการใช้งานและคำแนะนำสำหรับการจัดการคลังอุปกรณ์</p>
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white/80 px-4 py-2 rounded-xl">
                <CalendarIcon className="w-4 h-4" />
                <span>อัปเดต: {formatDate(lastUpdated)}</span>
              </div>
            )}
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-gray-700 
                bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl 
                hover:bg-gray-50 hover:shadow-md transition-all duration-300 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="อุปกรณ์ทั้งหมด" value={summary?.totalEquipment || 0} icon={CubeIcon} color="blue" delay={0} />
          <StatCard title="ความต้องการสูง" value={summary?.highDemandCount || 0} icon={ArrowTrendingUpIcon} color="red" delay={100} />
          <StatCard title="ไม่ถูกใช้งาน" value={summary?.idleCount || 0} icon={ArrowTrendingDownIcon} color="gray" delay={200} />
          <StatCard title="อัตราการใช้งานเฉลี่ย" value={formatUtilizationRate(summary?.averageUtilization || 0)} icon={ChartBarIcon} color="green" delay={300} />
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
          <div className="border-b border-gray-200 px-2">
            <nav className="flex -mb-px">
              <TabButton active={selectedTab === 'overview'} onClick={() => setSelectedTab('overview')}>ภาพรวม</TabButton>
              <TabButton active={selectedTab === 'high-demand'} onClick={() => setSelectedTab('high-demand')} count={highDemandEquipment?.length}>ความต้องการสูง</TabButton>
              <TabButton active={selectedTab === 'idle'} onClick={() => setSelectedTab('idle')} count={idleEquipment?.length}>ไม่ถูกใช้งาน</TabButton>
              <TabButton active={selectedTab === 'recommendations'} onClick={() => setSelectedTab('recommendations')} count={topRecommendations?.length}>คำแนะนำ</TabButton>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {selectedTab === 'overview' && (
              <div className="space-y-8">
                {highDemandEquipment && highDemandEquipment.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></span>
                      <h3 className="text-lg font-semibold text-gray-900">อุปกรณ์ที่มีความต้องการสูง (Top 5)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {highDemandEquipment.slice(0, 5).map((equipment, index) => (
                        <div key={equipment.equipmentId} style={{ animationDelay: `${index * 50}ms` }}>
                          <EquipmentCard equipment={equipment} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {idleEquipment && idleEquipment.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                      <h3 className="text-lg font-semibold text-gray-900">อุปกรณ์ที่ไม่ถูกใช้งาน (Top 5)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {idleEquipment.slice(0, 5).map((equipment, index) => (
                        <div key={equipment.equipmentId} style={{ animationDelay: `${index * 50}ms` }}>
                          <EquipmentCard equipment={equipment} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {topRecommendations && topRecommendations.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <SparklesIcon className="w-5 h-5 text-amber-500" />
                      <h3 className="text-lg font-semibold text-gray-900">คำแนะนำสำคัญ (Top 5)</h3>
                    </div>
                    <div className="space-y-3">
                      {topRecommendations.slice(0, 5).map((rec, index) => (
                        <RecommendationCard key={index} recommendation={rec} index={index} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* High Demand Tab */}
            {selectedTab === 'high-demand' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">อุปกรณ์ที่มีความต้องการสูง</h3>
                {highDemandEquipment && highDemandEquipment.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {highDemandEquipment.map((equipment, index) => (
                      <div key={equipment.equipmentId} style={{ animationDelay: `${index * 50}ms` }}>
                        <EquipmentCard equipment={equipment} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">ไม่มีอุปกรณ์ที่มีความต้องการสูงในขณะนี้</div>
                )}
              </div>
            )}

            {/* Idle Tab */}
            {selectedTab === 'idle' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">อุปกรณ์ที่ไม่ถูกใช้งาน</h3>
                {idleEquipment && idleEquipment.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {idleEquipment.map((equipment, index) => (
                      <div key={equipment.equipmentId} style={{ animationDelay: `${index * 50}ms` }}>
                        <EquipmentCard equipment={equipment} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">อุปกรณ์ทั้งหมดมีการใช้งานอย่างสม่ำเสมอ</div>
                )}
              </div>
            )}

            {/* Recommendations Tab */}
            {selectedTab === 'recommendations' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">คำแนะนำการจัดการคลังอุปกรณ์</h3>
                {topRecommendations && topRecommendations.length > 0 ? (
                  <div className="space-y-3">
                    {topRecommendations.map((rec, index) => (
                      <RecommendationCard key={index} recommendation={rec} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">ไม่มีคำแนะนำในขณะนี้</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UsageAnalyticsDashboard;
