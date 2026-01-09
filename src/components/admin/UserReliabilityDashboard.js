/**
 * User Reliability Dashboard Component
 * 
 * Dashboard for viewing user behavior statistics, top borrowers,
 * most reliable users, and flagged users for review.
 * 
 * Requirements: 10.3, 10.4, 10.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserGroupIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CalendarIcon,
  StarIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import UserReliabilityService from '../../services/userReliabilityService';
import {
  getClassificationLabel,
  getClassificationBadgeClass,
  formatReliabilityScore
} from '../../types/userReliability';
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
        <p className="text-sm text-gray-600">ผู้ใช้ทั้งหมด</p>
        <p className="text-2xl font-bold text-gray-900">{summary.totalUsers || 0}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
        <p className="text-sm text-gray-600">ดีเยี่ยม</p>
        <p className="text-2xl font-bold text-green-600">{summary.excellentCount || 0}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
        <p className="text-sm text-gray-600">ต้องติดตาม</p>
        <p className="text-2xl font-bold text-red-600">{summary.flaggedCount || 0}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
        <p className="text-sm text-gray-600">คะแนนเฉลี่ย</p>
        <p className="text-2xl font-bold text-purple-600">
          {formatReliabilityScore(summary.averageReliabilityScore || 0)}
        </p>
      </div>
    </div>
  );
};

/**
 * Top User Card Component (for rankings)
 */
const TopUserCard = ({ user, rank }) => {
  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getRankIcon = (rank) => {
    if (rank <= 3) return <TrophyIcon className={`w-6 h-6 ${getRankColor(rank)}`} />;
    return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getRankIcon(rank)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {user.userName || 'ไม่ระบุชื่อ'}
          </h4>
          {user.userEmail && (
            <p className="text-xs text-gray-500 mt-1 truncate">{user.userEmail}</p>
          )}
          <div className="mt-2 flex items-center space-x-4 text-sm">
            {user.rankType === 'top_borrower' && (
              <>
                <div>
                  <span className="text-gray-500">จำนวนการยืม:</span>
                  <span className="ml-1 font-bold text-blue-600">{user.value}</span>
                </div>
                <div>
                  <span className="text-gray-500">คะแนน:</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {formatReliabilityScore(user.reliabilityScore)}
                  </span>
                </div>
              </>
            )}
            {user.rankType === 'most_reliable' && (
              <>
                <div>
                  <span className="text-gray-500">คะแนน:</span>
                  <span className="ml-1 font-bold text-green-600">
                    {formatReliabilityScore(user.value)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">จำนวนการยืม:</span>
                  <span className="ml-1 font-medium text-gray-900">{user.totalLoans}</span>
                </div>
              </>
            )}
          </div>
          {user.classification && (
            <div className="mt-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getClassificationBadgeClass(user.classification)}`}>
                {getClassificationLabel(user.classification)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Flagged User Card Component
 */
const FlaggedUserCard = ({ user }) => {
  return (
    <div className="bg-red-50 rounded-lg shadow p-4 border-l-4 border-red-500">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <FlagIcon className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {user.userName || 'ไม่ระบุชื่อ'}
          </h4>
          {user.userEmail && (
            <p className="text-xs text-gray-500 mt-1 truncate">{user.userEmail}</p>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">คะแนน:</span>
              <span className="ml-1 font-bold text-red-600">
                {formatReliabilityScore(user.reliabilityScore)}
              </span>
            </div>
            {user.recentNoShows > 0 && (
              <div>
                <span className="text-gray-600">ไม่มารับ (30 วัน):</span>
                <span className="ml-1 font-bold text-red-600">
                  {user.recentNoShows} ครั้ง
                </span>
              </div>
            )}
            {user.lateReturns > 0 && (
              <div>
                <span className="text-gray-600">คืนช้า:</span>
                <span className="ml-1 font-medium text-gray-900">
                  {user.lateReturns} ครั้ง
                </span>
              </div>
            )}
            {user.totalLoans > 0 && (
              <div>
                <span className="text-gray-600">จำนวนการยืม:</span>
                <span className="ml-1 font-medium text-gray-900">
                  {user.totalLoans} ครั้ง
                </span>
              </div>
            )}
          </div>
          {user.isRepeatOffender && (
            <div className="mt-2 px-2 py-1 bg-red-100 rounded text-xs text-red-800 font-medium">
              ผู้กระทำผิดซ้ำ - ไม่มารับ 3 ครั้งขึ้นไปใน 30 วัน
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Main User Reliability Dashboard Component
 */
const UserReliabilityDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview'); // overview, top-borrowers, reliable, flagged

  /**
   * Load dashboard data
   */
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await UserReliabilityService.getReliabilityDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading user reliability dashboard:', err);
      setError('ไม่สามารถโหลดข้อมูลความน่าเชื่อถือของผู้ใช้ได้');
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
        icon={<UserGroupIcon className="w-24 h-24" />}
        title="ไม่มีข้อมูล"
        description="ไม่มีข้อมูลความน่าเชื่อถือของผู้ใช้ในขณะนี้"
      />
    );
  }

  const { summary, topBorrowers, mostReliable, flaggedUsers, lastUpdated } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            ความน่าเชื่อถือของผู้ใช้
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            ข้อมูลพฤติกรรมและความน่าเชื่อถือของผู้ใช้งานระบบ
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

      {/* Classification Distribution */}
      {summary && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            การกระจายตามระดับความน่าเชื่อถือ
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{summary.excellentCount}</div>
              <div className="text-sm text-gray-600 mt-1">ดีเยี่ยม</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{summary.goodCount}</div>
              <div className="text-sm text-gray-600 mt-1">ดี</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{summary.fairCount}</div>
              <div className="text-sm text-gray-600 mt-1">พอใช้</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{summary.poorCount}</div>
              <div className="text-sm text-gray-600 mt-1">ต้องปรับปรุง</div>
            </div>
          </div>
        </div>
      )}

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
              onClick={() => setSelectedTab('top-borrowers')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                selectedTab === 'top-borrowers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ผู้ยืมมากที่สุด ({topBorrowers?.length || 0})
            </button>
            <button
              onClick={() => setSelectedTab('reliable')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                selectedTab === 'reliable'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              น่าเชื่อถือที่สุด ({mostReliable?.length || 0})
            </button>
            <button
              onClick={() => setSelectedTab('flagged')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                selectedTab === 'flagged'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ต้องติดตาม ({flaggedUsers?.length || 0})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Borrowers Preview */}
              {topBorrowers && topBorrowers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <TrophyIcon className="w-5 h-5 text-yellow-500" />
                    <span>ผู้ยืมมากที่สุด (Top 5)</span>
                  </h3>
                  <div className="space-y-3">
                    {topBorrowers.slice(0, 5).map((user, index) => (
                      <TopUserCard key={user.userId} user={user} rank={index + 1} />
                    ))}
                  </div>
                </div>
              )}

              {/* Most Reliable Preview */}
              {mostReliable && mostReliable.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <StarIcon className="w-5 h-5 text-green-500" />
                    <span>ผู้ใช้ที่น่าเชื่อถือที่สุด (Top 5)</span>
                  </h3>
                  <div className="space-y-3">
                    {mostReliable.slice(0, 5).map((user, index) => (
                      <TopUserCard key={user.userId} user={user} rank={index + 1} />
                    ))}
                  </div>
                </div>
              )}

              {/* Flagged Users Preview */}
              {flaggedUsers && flaggedUsers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <FlagIcon className="w-5 h-5 text-red-500" />
                    <span>ผู้ใช้ที่ต้องติดตาม</span>
                  </h3>
                  <div className="space-y-3">
                    {flaggedUsers.slice(0, 5).map((user) => (
                      <FlaggedUserCard key={user.userId} user={user} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Top Borrowers Tab */}
          {selectedTab === 'top-borrowers' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                ผู้ยืมมากที่สุด
              </h3>
              {topBorrowers && topBorrowers.length > 0 ? (
                <div className="space-y-3">
                  {topBorrowers.map((user, index) => (
                    <TopUserCard key={user.userId} user={user} rank={index + 1} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<UserGroupIcon className="w-24 h-24" />}
                  title="ไม่มีข้อมูล"
                  description="ไม่มีข้อมูลผู้ยืมในขณะนี้"
                />
              )}
            </div>
          )}

          {/* Most Reliable Tab */}
          {selectedTab === 'reliable' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                ผู้ใช้ที่น่าเชื่อถือที่สุด
              </h3>
              {mostReliable && mostReliable.length > 0 ? (
                <div className="space-y-3">
                  {mostReliable.map((user, index) => (
                    <TopUserCard key={user.userId} user={user} rank={index + 1} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<StarIcon className="w-24 h-24" />}
                  title="ไม่มีข้อมูล"
                  description="ไม่มีข้อมูลผู้ใช้ที่น่าเชื่อถือในขณะนี้"
                />
              )}
            </div>
          )}

          {/* Flagged Users Tab */}
          {selectedTab === 'flagged' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                ผู้ใช้ที่ต้องติดตาม
              </h3>
              {flaggedUsers && flaggedUsers.length > 0 ? (
                <div className="space-y-3">
                  {flaggedUsers.map((user) => (
                    <FlaggedUserCard key={user.userId} user={user} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<FlagIcon className="w-24 h-24" />}
                  title="ไม่มีผู้ใช้ที่ต้องติดตาม"
                  description="ไม่มีผู้ใช้ที่มีพฤติกรรมที่ต้องติดตามในขณะนี้"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserReliabilityDashboard;
