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
  const { currentLoans, recentLoan, loading: loansLoading } = useCurrentLoans();

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

        <div className="space-y-4 sm:space-y-6">
          {/* Quick Actions - เมนูลัด (ย้ายมาด้านบน) */}
          {userProfile?.status === 'approved' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">เมนูลัด</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Link
                  to="/equipment"
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">รายการอุปกรณ์</span>
                </Link>
                
                <Link
                  to="/reservations"
                  className={`flex flex-col items-center p-4 rounded-lg border transition-colors ${
                    settings?.reservationSystemEnabled !== false
                      ? 'bg-green-50 border-green-200 hover:bg-green-100'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <svg className={`w-8 h-8 mb-2 ${settings?.reservationSystemEnabled !== false ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className={`text-sm font-medium ${settings?.reservationSystemEnabled !== false ? 'text-green-800' : 'text-gray-500'}`}>
                    จองอุปกรณ์
                    {settings?.reservationSystemEnabled === false && (
                      <span className="block text-xs text-gray-400">(ปิดใช้งาน)</span>
                    )}
                  </span>
                </Link>
                
                <Link
                  to="/my-requests"
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
                >
                  <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-purple-800">คำขอของฉัน</span>
                </Link>
                
                <Link
                  to="/loan-history"
                  className="flex flex-col items-center p-4 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
                >
                  <svg className="w-8 h-8 text-orange-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-orange-800">ประวัติการยืม</span>
                </Link>
              </div>

              {isAdmin && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-800">เมนูผู้ดูแลระบบ</span>
                    <Link
                      to="/admin"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                      แดชบอร์ดผู้ดูแล
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current Loans Card - อุปกรณ์ที่กำลังยืมอยู่ */}
          {userProfile?.status === 'approved' && (
            <CurrentLoansCard
              currentLoans={currentLoans}
              recentLoan={recentLoan}
              loading={loansLoading}
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