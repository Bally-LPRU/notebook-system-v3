import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useUserTypeLimits } from '../hooks/useUserTypeLimits';
import { useClosedDates } from '../hooks/useClosedDates';
import { useCurrentLoans } from '../hooks/useCurrentLoans';
import { Layout } from './layout';
import { 
  BorrowingLimitsCard,
  LoanRulesSection,
  CurrentLoansCard
} from './dashboard/index';

// Pastel Color Classes
const COLORS = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:bg-blue-200' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200', hover: 'hover:bg-emerald-200' },
  purple: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200', hover: 'hover:bg-violet-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', hover: 'hover:bg-orange-200' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200', hover: 'hover:bg-cyan-200' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200', hover: 'hover:bg-pink-200' },
};

// Quick Action Card Component
const QuickActionCard = ({ to, icon, label, color, disabled = false, delay = 0 }) => (
  <Link
    to={disabled ? '#' : to}
    className={`group flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 animate-fade-in
      ${disabled 
        ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed' 
        : `${COLORS[color].bg} ${COLORS[color].border} ${COLORS[color].hover} hover:scale-105 hover:shadow-lg`
      }`}
    style={{ animationDelay: `${delay}ms` }}
    onClick={e => disabled && e.preventDefault()}
  >
    <div className={`p-3 rounded-xl transition-all duration-300 ${disabled ? 'bg-gray-200' : `bg-white/60 group-hover:bg-white group-hover:scale-110 group-hover:rotate-6`}`}>
      <span className={disabled ? 'text-gray-400' : COLORS[color].text}>{icon}</span>
    </div>
    <span className={`text-sm font-semibold mt-2 ${disabled ? 'text-gray-400' : COLORS[color].text}`}>
      {label}
    </span>
  </Link>
);

// Welcome Card Component
const WelcomeCard = ({ userName, isAdmin }) => (
  <div className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl p-6 text-white animate-fade-in">
    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
    <div className="relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm">ยินดีต้อนรับ</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            สวัสดี, {userName || 'ผู้ใช้งาน'} 👋
          </h1>
          <p className="text-white/70 mt-2 text-sm sm:text-base">
            ระบบยืม-คืนโน็คบุคและอุปกรณ์คอมพิวเตอร์
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/admin"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-300 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">Admin Panel</span>
          </Link>
        )}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { userProfile, isAdmin, user } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const { closedDates, loading: closedDatesLoading } = useClosedDates();
  const {
    limits,
    loading: limitsLoading,
    currentBorrowedCount,
    pendingRequestsCount,
    remainingQuota
  } = useUserTypeLimits();
  const { currentLoans, recentLoan, loading: loansLoading, error: loansError } = useCurrentLoans();

  const isReservationEnabled = settings?.reservationSystemEnabled !== false;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Card */}
        <WelcomeCard userName={user?.displayName || userProfile?.displayName} isAdmin={isAdmin} />

        {/* Quick Actions */}
        {userProfile?.status === 'approved' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                เมนูลัด
              </h3>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="sm:hidden inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors"
                >
                  👑 Admin
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              <QuickActionCard
                to="/equipment"
                color="blue"
                label="รายการอุปกรณ์"
                delay={150}
                icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              />
              <QuickActionCard
                to="/reservations"
                color="green"
                label="จองอุปกรณ์"
                delay={200}
                disabled={!isReservationEnabled}
                icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              />
              <QuickActionCard
                to="/my-requests"
                color="purple"
                label="คำขอของฉัน"
                delay={250}
                icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              />
              <QuickActionCard
                to="/loan-history"
                color="orange"
                label="ประวัติการยืม"
                delay={300}
                icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <QuickActionCard
                to="/notification-history"
                color="cyan"
                label="การแจ้งเตือน"
                delay={350}
                icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
              />
              <QuickActionCard
                to="/profile"
                color="pink"
                label="โปรไฟล์"
                delay={400}
                icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              />
            </div>
          </div>
        )}

        {/* Current Loans Card */}
        {userProfile?.status === 'approved' && (
          <div className="animate-fade-in" style={{ animationDelay: '450ms' }}>
            <CurrentLoansCard
              currentLoans={currentLoans}
              recentLoan={recentLoan}
              loading={loansLoading}
              error={loansError}
            />
          </div>
        )}

        {/* Borrowing Limits & Loan Rules */}
        {userProfile?.status === 'approved' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
              <BorrowingLimitsCard
                limits={limits}
                currentBorrowedCount={currentBorrowedCount}
                pendingRequestsCount={pendingRequestsCount}
                remainingQuota={remainingQuota}
                loading={limitsLoading}
              />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '550ms' }}>
              <LoanRulesSection
                settings={settings}
                closedDates={closedDates}
                loading={settingsLoading || closedDatesLoading}
              />
            </div>
          </div>
        )}

        {/* Pending Approval Message */}
        {userProfile?.status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center animate-float">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-800">รอการอนุมัติ</h3>
                <p className="text-amber-700 mt-1">บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ กรุณารอสักครู่</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
