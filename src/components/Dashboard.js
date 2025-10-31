import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from './layout';
import { DashboardStats, RecentActivity, StatsChart, QuickActions } from './dashboard/index';

const Dashboard = () => {
  const { user, userProfile, isAdmin } = useAuth();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
          <p className="mt-2 text-gray-600">
            ยินดีต้อนรับสู่ระบบยืม-คืนโน็คบุคและอุปกรณ์คอมพิวเตอร์
          </p>
        </div>

        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <img
                className="h-16 w-16 rounded-full"
                src={user?.photoURL || '/default-avatar.png'}
                alt={user?.displayName}
              />
              <div className="ml-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  สวัสดี, {user?.displayName}
                </h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>

            {userProfile && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  สถานะบัญชี
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">บทบาท:</span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userProfile.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {userProfile.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">สถานะ:</span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      ยินดีต้อนรับสู่ระบบยืม-คืนอุปกรณ์! คุณสามารถใช้งานระบบได้แล้ว
                    </p>
                  </div>
                )}

                {isAdmin && (
                  <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-800">
                          เมนูผู้ดูแลระบบ
                        </p>
                        <p className="text-xs text-purple-600">
                          จัดการผู้ใช้และระบบ
                        </p>
                      </div>
                      <Link
                        to="/admin"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        แดชบอร์ดผู้ดูแล
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dashboard Statistics */}
          <DashboardStats />

          {/* Quick Actions */}
          <QuickActions />

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatsChart />
            <RecentActivity />
          </div>

          {/* Firebase Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              สถานะระบบ
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    Firebase เชื่อมต่อสำเร็จ! ระบบพร้อมใช้งาน
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;