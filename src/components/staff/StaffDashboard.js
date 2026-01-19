/**
 * StaffDashboard Component
 * Dashboard for Staff role showing loan management statistics and recent activity
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout';
import { useLoanRequestStats, useLoanRequests } from '../../hooks/useLoanRequests';
import { LOAN_REQUEST_STATUS } from '../../types/loanRequest';
import StaffStatsCard from './StaffStatsCard';
import StaffRecentActivity from './StaffRecentActivity';

// Quick Action Button Component
const QuickActionButton = ({ title, description, icon, onClick, color }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
    yellow: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
    red: { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
    purple: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border ${colors.border}
        hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-left w-full`}
    >
      <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center 
        transition-all duration-300 group-hover:rotate-6 group-hover:scale-110`}>
        <span className={colors.text}>{icon}</span>
      </div>
      <div>
        <p className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <svg className="w-5 h-5 text-gray-300 ml-auto group-hover:text-gray-500 group-hover:translate-x-1 transition-all" 
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [todayReturns, setTodayReturns] = useState(0);
  
  // Get loan statistics
  const { stats: loanStats, loading: loanStatsLoading } = useLoanRequestStats();
  
  // Get today's returns count
  const { loanRequests: borrowedLoans, loading: borrowedLoading } = useLoanRequests({
    status: LOAN_REQUEST_STATUS.BORROWED,
    sortBy: 'expectedReturnDate',
    sortOrder: 'asc',
    limit: 50
  });

  // Calculate today's returns
  useEffect(() => {
    if (!borrowedLoading && borrowedLoans.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCount = borrowedLoans.filter(loan => {
        const returnDate = loan.expectedReturnDate?.toDate?.() || new Date(loan.expectedReturnDate);
        return returnDate >= today && returnDate < tomorrow;
      }).length;

      setTodayReturns(todayCount);
    }
  }, [borrowedLoans, borrowedLoading]);

  const isLoading = loanStatsLoading;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              แดชบอร์ดเจ้าหน้าที่ให้บริการ
            </h1>
            <p className="mt-1 text-gray-500">ภาพรวมการให้บริการยืม-คืนอุปกรณ์</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">
              อัปเดต: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={() => window.location.reload()}
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-xl transition-all duration-200 hover:rotate-180"
              title="รีเฟรช"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Overdue Alert Banner */}
        {!isLoading && loanStats.overdue > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-2xl p-6 shadow-sm animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">มีรายการค้างคืน</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    มี {loanStats.overdue} รายการที่เกินกำหนดคืน กรุณาติดตามและแจ้งเตือนผู้ยืม
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/staff/overdue')}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm flex items-center gap-2"
              >
                ดูรายการค้างคืน
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards - Requirements 9.2, 9.3, 9.4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StaffStatsCard
            title="คำขอรอดำเนินการ"
            value={isLoading ? '...' : loanStats.pending}
            color="yellow"
            delay={0}
            loading={isLoading}
            onClick={() => navigate('/staff/loan-requests')}
            icon={
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StaffStatsCard
            title="กำลังยืมอยู่"
            value={isLoading ? '...' : loanStats.borrowed}
            color="blue"
            delay={100}
            loading={isLoading}
            onClick={() => navigate('/staff/returns')}
            icon={
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            }
          />
          <StaffStatsCard
            title="เกินกำหนดคืน"
            value={isLoading ? '...' : loanStats.overdue}
            color="red"
            delay={200}
            loading={isLoading}
            onClick={() => navigate('/staff/overdue')}
            icon={
              <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <StaffStatsCard
            title="กำหนดคืนวันนี้"
            value={borrowedLoading ? '...' : todayReturns}
            color="indigo"
            delay={300}
            loading={borrowedLoading}
            onClick={() => navigate('/staff/returns')}
            icon={
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">การดำเนินการด่วน</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickActionButton
              title="จัดการคำขอยืม"
              description="อนุมัติ/ปฏิเสธคำขอ"
              color="blue"
              onClick={() => navigate('/staff/loan-requests')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
            />
            <QuickActionButton
              title="รับคืนอุปกรณ์"
              description="บันทึกการคืนอุปกรณ์"
              color="purple"
              onClick={() => navigate('/staff/returns')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              }
            />
            <QuickActionButton
              title="รายการค้างคืน"
              description="ติดตามและแจ้งเตือน"
              color="red"
              onClick={() => navigate('/staff/overdue')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Recent Activity - Requirement 9.5 */}
        <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <StaffRecentActivity limit={10} />
        </div>

        {/* Summary Stats */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-100 p-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            สรุปสถานะการยืม
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{isLoading ? '...' : loanStats.approved}</p>
              <p className="text-sm text-gray-500">อนุมัติแล้ว</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{isLoading ? '...' : loanStats.rejected}</p>
              <p className="text-sm text-gray-500">ปฏิเสธ</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-600">{isLoading ? '...' : loanStats.returned}</p>
              <p className="text-sm text-gray-500">คืนแล้ว</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{isLoading ? '...' : loanStats.total}</p>
              <p className="text-sm text-gray-500">ทั้งหมด</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StaffDashboard;
