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

const Dashboard = () => {
  const { userProfile, isAdmin } = useAuth();
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            ระบบยืม-คืนโน็คบุคและอุปกรณ์คอมพิวเตอร์
          </p>
        </div>

        <div className="space-y-4">
          {/* Quick Actions - เมนูลัด (กระชับขึ้น) */}
          {userProfile?.status === 'approved' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">เมนูลัด</h3>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200"
                  >
                    แดชบอร์ดผู้ดูแล
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Link
                  to="/equipment"
                  className="flex flex-col items-center p-2 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium text-blue-800 mt-1">อุปกรณ์</span>
                </Link>
                
                <Link
                  to="/reservations"
                  className={`flex flex-col items-center p-2 rounded-lg border transition-colors ${
                    settings?.reservationSystemEnabled !== false
                      ? 'bg-green-50 border-green-200 hover:bg-green-100'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <svg className={`w-6 h-6 ${settings?.reservationSystemEnabled !== false ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className={`text-xs font-medium mt-1 ${settings?.reservationSystemEnabled !== false ? 'text-green-800' : 'text-gray-500'}`}>
                    จอง
                  </span>
                </Link>
                
                <Link
                  to="/my-requests"
                  className="flex flex-col items-center p-2 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-medium text-purple-800 mt-1">คำขอ</span>
                </Link>
                
                <Link
                  to="/loan-history"
                  className="flex flex-col items-center p-2 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium text-orange-800 mt-1">ประวัติ</span>
                </Link>
              </div>
            </div>
          )}

          {/* Current Loans Card - อุปกรณ์ที่กำลังยืมอยู่ */}
          {userProfile?.status === 'approved' && (
            <CurrentLoansCard
              currentLoans={currentLoans}
              recentLoan={recentLoan}
              loading={loansLoading}
              error={loansError}
            />
          )}

          {/* Borrowing Limits & Loan Rules - แสดงแบบ 2 คอลัมน์ */}
          {userProfile?.status === 'approved' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BorrowingLimitsCard
                limits={limits}
                currentBorrowedCount={currentBorrowedCount}
                pendingRequestsCount={pendingRequestsCount}
                remainingQuota={remainingQuota}
                loading={limitsLoading}
              />
              <LoanRulesSection
                settings={settings}
                closedDates={closedDates}
                loading={settingsLoading || closedDatesLoading}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;