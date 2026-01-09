/**
 * User Reliability Dashboard Component
 * 
 * Dashboard for viewing user behavior statistics, top borrowers,
 * most reliable users, and flagged users for review.
 * 
 * Requirements: 10.3, 10.4, 10.5
 * Design System: Matches AdminDashboard pastel color palette
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserGroupIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CalendarIcon,
  StarIcon,
  FlagIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import UserReliabilityService from '../../services/userReliabilityService';
import {
  getClassificationLabel,
  formatReliabilityScore
} from '../../types/userReliability';
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
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '-';
  }
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
 * Top User Card Component (for rankings)
 */
const TopUserCard = ({ user, rank, index }) => {
  const getRankStyle = (rank) => {
    if (rank === 1) return { bg: 'bg-gradient-to-r from-amber-400 to-yellow-500', text: 'text-white' };
    if (rank === 2) return { bg: 'bg-gradient-to-r from-slate-300 to-gray-400', text: 'text-white' };
    if (rank === 3) return { bg: 'bg-gradient-to-r from-orange-400 to-amber-500', text: 'text-white' };
    return { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  const rankStyle = getRankStyle(rank);
  const scoreColor = user.reliabilityScore >= 80 ? 'green' : user.reliabilityScore >= 60 ? 'yellow' : 'red';

  return (
    <div 
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 
        hover:shadow-lg hover:scale-[1.02] transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start space-x-4">
        <div className={`w-10 h-10 ${rankStyle.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {rank <= 3 ? (
            <TrophyIcon className={`w-5 h-5 ${rankStyle.text}`} />
          ) : (
            <span className={`text-sm font-bold ${rankStyle.text}`}>#{rank}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {user.userName || 'ไม่ระบุชื่อ'}
          </h4>
          {user.userEmail && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{user.userEmail}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {user.rankType === 'top_borrower' && (
              <>
                <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg">
                  ยืม {user.value} ครั้ง
                </span>
                <span className={`px-2 py-1 text-xs font-medium ${COLORS[scoreColor].bg} ${COLORS[scoreColor].text} rounded-lg`}>
                  คะแนน {formatReliabilityScore(user.reliabilityScore)}
                </span>
              </>
            )}
            {user.rankType === 'most_reliable' && (
              <>
                <span className={`px-2 py-1 text-xs font-medium ${COLORS[scoreColor].bg} ${COLORS[scoreColor].text} rounded-lg`}>
                  คะแนน {formatReliabilityScore(user.value)}
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-gray-50 text-gray-700 rounded-lg">
                  ยืม {user.totalLoans} ครั้ง
                </span>
              </>
            )}
          </div>
          {user.classification && (
            <div className="mt-2">
              <span className={`px-3 py-1 text-xs font-medium rounded-full
                ${user.classification === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
                  user.classification === 'good' ? 'bg-blue-100 text-blue-700' :
                  user.classification === 'fair' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'}`}>
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
const FlaggedUserCard = ({ user, index }) => (
  <div 
    className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl shadow-sm border-l-4 border-rose-500 p-5 
      hover:shadow-lg transition-all duration-300 animate-fade-in"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <div className="flex items-start space-x-4">
      <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <FlagIcon className="w-5 h-5 text-rose-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate">
          {user.userName || 'ไม่ระบุชื่อ'}
        </h4>
        {user.userEmail && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{user.userEmail}</p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl p-2">
            <span className="text-xs text-gray-500">คะแนน</span>
            <p className="font-bold text-rose-600">{formatReliabilityScore(user.reliabilityScore)}</p>
          </div>
          {user.recentNoShows > 0 && (
            <div className="bg-white rounded-xl p-2">
              <span className="text-xs text-gray-500">ไม่มารับ (30 วัน)</span>
              <p className="font-bold text-rose-600">{user.recentNoShows} ครั้ง</p>
            </div>
          )}
          {user.lateReturns > 0 && (
            <div className="bg-white rounded-xl p-2">
              <span className="text-xs text-gray-500">คืนช้า</span>
              <p className="font-bold text-orange-600">{user.lateReturns} ครั้ง</p>
            </div>
          )}
          {user.totalLoans > 0 && (
            <div className="bg-white rounded-xl p-2">
              <span className="text-xs text-gray-500">จำนวนการยืม</span>
              <p className="font-bold text-gray-900">{user.totalLoans} ครั้ง</p>
            </div>
          )}
        </div>
        {user.isRepeatOffender && (
          <div className="mt-3 px-3 py-2 bg-rose-100 rounded-xl text-xs text-rose-800 font-medium">
            ⚠️ ผู้กระทำผิดซ้ำ - ไม่มารับ 3 ครั้งขึ้นไปใน 30 วัน
          </div>
        )}
      </div>
    </div>
  </div>
);

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
 * Distribution Card Component
 */
const DistributionCard = ({ label, value, color }) => (
  <div className="text-center p-4 bg-white/50 rounded-2xl">
    <div className={`text-3xl font-bold ${COLORS[color].text}`}>{value}</div>
    <div className="text-sm text-gray-600 mt-1">{label}</div>
  </div>
);

/**
 * Main User Reliability Dashboard Component
 */
const UserReliabilityDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');

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
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
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
          <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-10 h-10 text-teal-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">ไม่มีข้อมูล</h3>
          <p className="text-gray-500 mt-1">ไม่มีข้อมูลความน่าเชื่อถือของผู้ใช้ในขณะนี้</p>
        </div>
      </Layout>
    );
  }

  const { summary, topBorrowers, mostReliable, flaggedUsers, lastUpdated } = dashboardData;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
              ความน่าเชื่อถือของผู้ใช้
            </h1>
            <p className="mt-1 text-gray-500">ข้อมูลพฤติกรรมและความน่าเชื่อถือของผู้ใช้งานระบบ</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="ผู้ใช้ทั้งหมด" value={summary?.totalUsers || 0} icon={UserGroupIcon} color="blue" delay={0} />
          <StatCard title="ดีเยี่ยม" value={summary?.excellentCount || 0} icon={CheckBadgeIcon} color="green" delay={100} />
          <StatCard title="ต้องติดตาม" value={summary?.flaggedCount || 0} icon={FlagIcon} color="red" delay={200} />
          <StatCard title="คะแนนเฉลี่ย" value={formatReliabilityScore(summary?.averageReliabilityScore || 0)} icon={StarIcon} color="purple" delay={300} />
        </div>

        {/* Classification Distribution */}
        {summary && (
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl shadow-sm border border-teal-100 p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">การกระจายตามระดับความน่าเชื่อถือ</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DistributionCard label="ดีเยี่ยม" value={summary.excellentCount} color="green" />
              <DistributionCard label="ดี" value={summary.goodCount} color="blue" />
              <DistributionCard label="พอใช้" value={summary.fairCount} color="yellow" />
              <DistributionCard label="ต้องปรับปรุง" value={summary.poorCount} color="red" />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
          <div className="border-b border-gray-200 px-2">
            <nav className="flex -mb-px">
              <TabButton active={selectedTab === 'overview'} onClick={() => setSelectedTab('overview')}>ภาพรวม</TabButton>
              <TabButton active={selectedTab === 'top-borrowers'} onClick={() => setSelectedTab('top-borrowers')} count={topBorrowers?.length}>ผู้ยืมมากที่สุด</TabButton>
              <TabButton active={selectedTab === 'reliable'} onClick={() => setSelectedTab('reliable')} count={mostReliable?.length}>น่าเชื่อถือที่สุด</TabButton>
              <TabButton active={selectedTab === 'flagged'} onClick={() => setSelectedTab('flagged')} count={flaggedUsers?.length}>ต้องติดตาม</TabButton>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {selectedTab === 'overview' && (
              <div className="space-y-8">
                {topBorrowers && topBorrowers.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <TrophyIcon className="w-5 h-5 text-amber-500" />
                      <h3 className="text-lg font-semibold text-gray-900">ผู้ยืมมากที่สุด (Top 5)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topBorrowers.slice(0, 5).map((user, index) => (
                        <TopUserCard key={user.userId} user={user} rank={index + 1} index={index} />
                      ))}
                    </div>
                  </div>
                )}

                {mostReliable && mostReliable.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <StarIcon className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-lg font-semibold text-gray-900">ผู้ใช้ที่น่าเชื่อถือที่สุด (Top 5)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mostReliable.slice(0, 5).map((user, index) => (
                        <TopUserCard key={user.userId} user={user} rank={index + 1} index={index} />
                      ))}
                    </div>
                  </div>
                )}

                {flaggedUsers && flaggedUsers.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <FlagIcon className="w-5 h-5 text-rose-500" />
                      <h3 className="text-lg font-semibold text-gray-900">ผู้ใช้ที่ต้องติดตาม</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {flaggedUsers.slice(0, 4).map((user, index) => (
                        <FlaggedUserCard key={user.userId} user={user} index={index} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Top Borrowers Tab */}
            {selectedTab === 'top-borrowers' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ผู้ยืมมากที่สุด</h3>
                {topBorrowers && topBorrowers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topBorrowers.map((user, index) => (
                      <TopUserCard key={user.userId} user={user} rank={index + 1} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">ไม่มีข้อมูลผู้ยืมในขณะนี้</div>
                )}
              </div>
            )}

            {/* Most Reliable Tab */}
            {selectedTab === 'reliable' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ผู้ใช้ที่น่าเชื่อถือที่สุด</h3>
                {mostReliable && mostReliable.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mostReliable.map((user, index) => (
                      <TopUserCard key={user.userId} user={user} rank={index + 1} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">ไม่มีข้อมูลผู้ใช้ที่น่าเชื่อถือในขณะนี้</div>
                )}
              </div>
            )}

            {/* Flagged Users Tab */}
            {selectedTab === 'flagged' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ผู้ใช้ที่ต้องติดตาม</h3>
                {flaggedUsers && flaggedUsers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flaggedUsers.map((user, index) => (
                      <FlaggedUserCard key={user.userId} user={user} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">ไม่มีผู้ใช้ที่ต้องติดตามในขณะนี้</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserReliabilityDashboard;
