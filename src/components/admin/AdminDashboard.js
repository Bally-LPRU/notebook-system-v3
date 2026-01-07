import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout';
import { useLoanRequestStats, useLoanRequests } from '../../hooks/useLoanRequests';
import StatisticsService from '../../services/statisticsService';
import { LOAN_REQUEST_STATUS } from '../../types/loanRequest';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [equipmentStats, setEquipmentStats] = useState({ total: 0 });
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  
  // Get statistics
  const { stats: loanStats, loading: loanStatsLoading } = useLoanRequestStats();
  
  // Get borrowed equipment sorted by expected return date
  const { loanRequests: borrowedLoans, loading: borrowedLoading } = useLoanRequests({
    status: LOAN_REQUEST_STATUS.BORROWED,
    sortBy: 'expectedReturnDate',
    sortOrder: 'asc',
    limit: 20
  });

  // Get overdue equipment
  const { loanRequests: overdueLoans, loading: overdueLoading } = useLoanRequests({
    status: LOAN_REQUEST_STATUS.OVERDUE,
    sortBy: 'expectedReturnDate',
    sortOrder: 'asc',
    limit: 10
  });

  // Get pending requests
  const { loanRequests: pendingLoans, loading: pendingLoading } = useLoanRequests({
    status: LOAN_REQUEST_STATUS.PENDING,
    sortBy: 'createdAt',
    sortOrder: 'asc',
    limit: 10
  });

  // Combine overdue and borrowed, sort by expected return date
  const allBorrowedItems = [...overdueLoans, ...borrowedLoans].sort((a, b) => {
    const dateA = a.expectedReturnDate?.toDate?.() || new Date(a.expectedReturnDate);
    const dateB = b.expectedReturnDate?.toDate?.() || new Date(b.expectedReturnDate);
    return dateA - dateB;
  });
  
  // Load equipment statistics
  useEffect(() => {
    const loadEquipmentStats = async () => {
      try {
        setEquipmentLoading(true);
        const stats = await StatisticsService.getPublicStats();
        setEquipmentStats({ 
          total: stats?.totalEquipment || 0,
          available: stats?.availableEquipment || 0,
          borrowed: stats?.borrowedEquipment || 0
        });
      } catch (error) {
        console.error('Error loading equipment stats:', error);
        setEquipmentStats({ total: 0, available: 0, borrowed: 0 });
      } finally {
        setEquipmentLoading(false);
      }
    };
    loadEquipmentStats();
  }, []);

  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  const getDaysUntilReturn = (expectedReturnDate) => {
    if (!expectedReturnDate) return null;
    const returnDate = expectedReturnDate.toDate ? expectedReturnDate.toDate() : new Date(expectedReturnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    returnDate.setHours(0, 0, 0, 0);
    return Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getReturnStatusColor = (daysUntilReturn, status) => {
    if (status === LOAN_REQUEST_STATUS.OVERDUE || daysUntilReturn < 0) return 'bg-red-100 text-red-800 border-red-200';
    if (daysUntilReturn === 0) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (daysUntilReturn <= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getReturnStatusText = (daysUntilReturn, status) => {
    if (status === LOAN_REQUEST_STATUS.OVERDUE || daysUntilReturn < 0) return `เกินกำหนด ${Math.abs(daysUntilReturn)} วัน`;
    if (daysUntilReturn === 0) return 'ครบกำหนดวันนี้';
    if (daysUntilReturn === 1) return 'ครบกำหนดพรุ่งนี้';
    return `อีก ${daysUntilReturn} วัน`;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดผู้ดูแลระบบ</h1>
          <p className="mt-2 text-gray-600">จัดการระบบยืม-คืนอุปกรณ์และผู้ใช้งาน</p>
        </div>

        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">คำขอรอการอนุมัติ</p>
                  <p className="text-2xl font-semibold text-gray-900">{loanStatsLoading ? '...' : loanStats.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">กำลังยืมอยู่</p>
                  <p className="text-2xl font-semibold text-gray-900">{loanStatsLoading ? '...' : loanStats.borrowed}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">เกินกำหนดคืน</p>
                  <p className="text-2xl font-semibold text-gray-900">{loanStatsLoading ? '...' : loanStats.overdue}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">อุปกรณ์ทั้งหมด</p>
                  <p className="text-2xl font-semibold text-gray-900">{equipmentLoading ? '...' : equipmentStats.total}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Requests Section */}
          {pendingLoans.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  คำขอรอการอนุมัติ ({pendingLoans.length})
                </h3>
                <button onClick={() => navigate('/admin/loan-requests')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  ดูทั้งหมด →
                </button>
              </div>
              <div className="space-y-3">
                {pendingLoading ? (
                  <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div></div>
                ) : (
                  pendingLoans.slice(0, 5).map((loan) => (
                    <div key={loan.id} className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100 hover:bg-yellow-100 cursor-pointer transition-colors" onClick={() => navigate('/admin/loan-requests')}>
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        {loan.equipment?.imageURL || loan.equipment?.imageUrl || loan.equipmentSnapshot?.imageUrl || loan.equipmentSnapshot?.imageURL ? (
                          <img src={loan.equipment?.imageURL || loan.equipment?.imageUrl || loan.equipmentSnapshot?.imageUrl || loan.equipmentSnapshot?.imageURL} alt={loan.equipment?.name || 'อุปกรณ์'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{loan.equipment?.name || loan.equipmentSnapshot?.name || loan._equipmentName || 'ไม่ทราบชื่ออุปกรณ์'}</p>
                        <p className="text-xs text-gray-600">ผู้ขอ: {loan.user?.displayName || loan.userSnapshot?.displayName || loan._userName || 'ไม่ทราบชื่อ'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">ต้องการยืม</p>
                        <p className="text-sm font-medium text-gray-700">{formatDate(loan.borrowDate)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Borrowed Equipment Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                อุปกรณ์ที่ถูกยืม (เรียงตามกำหนดคืน)
              </h3>
              <button onClick={() => navigate('/admin/loan-requests')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                จัดการคำขอยืม →
              </button>
            </div>
            
            {borrowedLoading || overdueLoading ? (
              <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
            ) : allBorrowedItems.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500">ไม่มีอุปกรณ์ที่ถูกยืมในขณะนี้</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allBorrowedItems.map((loan) => {
                  const daysUntilReturn = getDaysUntilReturn(loan.expectedReturnDate);
                  const statusColor = getReturnStatusColor(daysUntilReturn, loan.status);
                  const statusText = getReturnStatusText(daysUntilReturn, loan.status);
                  return (
                    <div key={loan.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => navigate('/admin/loan-requests')}>
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        {loan.equipment?.imageURL || loan.equipment?.imageUrl || loan.equipmentSnapshot?.imageUrl || loan.equipmentSnapshot?.imageURL ? (
                          <img src={loan.equipment?.imageURL || loan.equipment?.imageUrl || loan.equipmentSnapshot?.imageUrl || loan.equipmentSnapshot?.imageURL} alt={loan.equipment?.name || 'อุปกรณ์'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{loan.equipment?.name || loan.equipmentSnapshot?.name || loan._equipmentName || 'ไม่ทราบชื่ออุปกรณ์'}</p>
                        <p className="text-xs text-gray-600">ผู้ยืม: {loan.user?.displayName || loan.userSnapshot?.displayName || loan._userName || 'ไม่ทราบชื่อ'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">กำหนดคืน</p>
                        <p className="text-sm font-medium text-gray-700">{formatDate(loan.expectedReturnDate)}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor}`}>{statusText}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
