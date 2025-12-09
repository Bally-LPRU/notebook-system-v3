import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useUserTypeLimits } from '../hooks/useUserTypeLimits';
import { useClosedDates } from '../hooks/useClosedDates';
import { Layout } from './layout';
import { 
  BorrowingLimitsCard,
  LoanRulesSection
} from './dashboard/index';

const Dashboard = () => {
  const { user, userProfile, isAdmin } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const { closedDates, loading: closedDatesLoading } = useClosedDates();
  const {
    limits,
    loading: limitsLoading,
    currentBorrowedCount,
    pendingRequestsCount,
    remainingQuota
  } = useUserTypeLimits();

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
          {/* User Profile Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <img
                className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-full"
                src={user?.photoURL || '/default-avatar.png'}
                alt={user?.displayName}
              />
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">
                  สวัสดี, {user?.displayName}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 truncate">{user?.email}</p>
              </div>
            </div>

            {userProfile && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">
                  สถานะบัญชี
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center flex-wrap">
                    <span className="text-xs sm:text-sm font-medium text-gray-500">บทบาท:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      userProfile.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {userProfile.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap">
                    <span className="text-xs sm:text-sm font-medium text-gray-500">สถานะ:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      userProfile.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : userProfile.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {userProfile.status === 'approved' 
                        ? 'อนุมัติแล้ว' 
                        : userProfile.status === 'pending'
                        ? 'รอการอนุมัติ'
                        : 'ถูกระงับ'
                      }
                    </span>
                  </div>
                </div>

                {userProfile.status === 'approved' && (
                  <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xs sm:text-sm text-green-800">
                      ยินดีต้อนรับ! คุณสามารถใช้งานระบบได้แล้ว
                    </p>
                  </div>
                )}

                {isAdmin && (
                  <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-purple-50 border border-purple-200 rounded-md">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-purple-800">
                          เมนูผู้ดูแลระบบ
                        </p>
                        <p className="text-xs text-purple-600">
                          จัดการผู้ใช้และระบบ
                        </p>
                      </div>
                      <Link
                        to="/admin"
                        className="inline-flex items-center justify-center px-3 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 w-full sm:w-auto"
                      >
                        แดชบอร์ดผู้ดูแล
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Borrowing Limits Card */}
          {userProfile?.status === 'approved' && (
            <BorrowingLimitsCard
              limits={limits}
              currentBorrowedCount={currentBorrowedCount}
              pendingRequestsCount={pendingRequestsCount}
              remainingQuota={remainingQuota}
              loading={limitsLoading}
            />
          )}

          {/* Loan Rules Section */}
          {userProfile?.status === 'approved' && (
            <LoanRulesSection
              settings={settings}
              closedDates={closedDates}
              loading={settingsLoading || closedDatesLoading}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;