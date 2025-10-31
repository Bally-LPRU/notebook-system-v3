import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '../layout';
import EquipmentManagement from '../equipment/EquipmentManagement';
import UserApprovalList from './UserApprovalList';
import LoanRequestList from './LoanRequestList';
import BorrowedEquipmentList from './BorrowedEquipmentList';
import { ReservationManagement } from '../reservations';
import { useLoanRequestStats } from '../../hooks/useLoanRequests';
import { useEquipment } from '../../hooks/useEquipment';

const AdminDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Get statistics
  const { stats: loanStats, loading: loanStatsLoading } = useLoanRequestStats();
  const { equipment, loading: equipmentLoading } = useEquipment({ limit: 1 });

  // Determine active tab from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/equipment')) {
      setActiveTab('equipment');
    } else if (path.includes('/admin/users')) {
      setActiveTab('users');
    } else if (path.includes('/admin/loan-requests')) {
      setActiveTab('loan-requests');
    } else if (path.includes('/admin/borrowed-equipment')) {
      setActiveTab('borrowed-equipment');
    } else if (path.includes('/admin/reservations')) {
      setActiveTab('reservations');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  const tabs = [
    { id: 'dashboard', name: 'ภาพรวม', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'equipment', name: 'จัดการอุปกรณ์', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'loan-requests', name: 'คำขอยืม', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'borrowed-equipment', name: 'อุปกรณ์ที่ยืม', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'reservations', name: 'การจอง', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'users', name: 'จัดการผู้ใช้', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'equipment':
        return <EquipmentManagement />;
      case 'users':
        return <UserApprovalList />;
      case 'loan-requests':
        return <LoanRequestList />;
      case 'borrowed-equipment':
        return <BorrowedEquipmentList />;
      case 'reservations':
        return <ReservationManagement />;
      default:
        return (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Loan Requests Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">คำขอรอการอนุมัติ</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {loanStatsLoading ? '...' : loanStats.pending}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">คำขอทั้งหมด</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {loanStatsLoading ? '...' : loanStats.total}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">อนุมัติแล้ว</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {loanStatsLoading ? '...' : loanStats.approved}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">อุปกรณ์ทั้งหมด</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {equipmentLoading ? '...' : equipment.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">การดำเนินการด่วน</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('loan-requests')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">จัดการคำขอยืม</p>
                    <p className="text-sm text-gray-500">อนุมัติหรือปฏิเสธคำขอ</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('equipment')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">จัดการอุปกรณ์</p>
                    <p className="text-sm text-gray-500">เพิ่ม แก้ไข หรือลบอุปกรณ์</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('borrowed-equipment')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">อุปกรณ์ที่ยืม</p>
                    <p className="text-sm text-gray-500">ติดตามและบันทึกการคืน</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">จัดการผู้ใช้</p>
                    <p className="text-sm text-gray-500">อนุมัติสมาชิกใหม่</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">กิจกรรมล่าสุด</h3>
              <div className="text-center py-8">
                <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">ฟีเจอร์กิจกรรมล่าสุดจะพัฒนาในขั้นตอนถัดไป</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดผู้ดูแลระบบ</h1>
          <p className="mt-2 text-gray-600">
            จัดการระบบยืม-คืนอุปกรณ์และผู้ใช้งาน
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.name}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </Layout>
  );
};

export default AdminDashboard;