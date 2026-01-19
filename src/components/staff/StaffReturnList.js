/**
 * StaffReturnList Component
 * Page for Staff to process equipment returns - view active loans and process returns
 * Requirements: 5.1
 */
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoanRequests } from '../../hooks/useLoanRequests';
import { useStaffLoanManagement } from '../../hooks/useStaffLoanManagement';
import { LOAN_REQUEST_STATUS } from '../../types/loanRequest';
import { Layout } from '../layout';
import ReturnProcessModal from './ReturnProcessModal';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const StaffReturnList = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' = borrowed + overdue
  
  // Modal state
  const [returnModal, setReturnModal] = useState({ isOpen: false, loan: null });

  // Use the Staff loan management hook for return processing
  const { 
    processReturn,
    loading: processingReturn,
    error: processError
  } = useStaffLoanManagement();

  const {
    loanRequests,
    loading,
    error,
    pagination,
    updateFilters,
    loadMore,
    refresh
  } = useLoanRequests({
    sortBy: 'expectedReturnDate',
    sortOrder: 'asc',
    limit: 20
  });

  // Filter for active loans (borrowed or overdue)
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      // We'll filter client-side for active loans since we need both borrowed and overdue
      updateFilters({ search: searchTerm });
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [searchTerm, updateFilters]);

  // Filter loans based on status filter
  const filteredLoans = useMemo(() => {
    let filtered = loanRequests;
    
    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter(loan => 
        loan.status === LOAN_REQUEST_STATUS.BORROWED || 
        loan.status === LOAN_REQUEST_STATUS.OVERDUE
      );
    } else if (statusFilter === 'borrowed') {
      filtered = filtered.filter(loan => loan.status === LOAN_REQUEST_STATUS.BORROWED);
    } else if (statusFilter === 'overdue') {
      filtered = filtered.filter(loan => loan.status === LOAN_REQUEST_STATUS.OVERDUE);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(loan => {
        const userName = loan.userSnapshot?.displayName || loan.userName || '';
        const equipmentName = loan.equipmentSnapshot?.name || loan.equipmentName || '';
        const equipmentNumber = loan.equipmentSnapshot?.equipmentNumber || loan.equipmentNumber || '';
        return (
          userName.toLowerCase().includes(search) ||
          equipmentName.toLowerCase().includes(search) ||
          equipmentNumber.toLowerCase().includes(search)
        );
      });
    }

    return filtered;
  }, [loanRequests, statusFilter, searchTerm]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const activeLoans = loanRequests.filter(loan => 
      loan.status === LOAN_REQUEST_STATUS.BORROWED || 
      loan.status === LOAN_REQUEST_STATUS.OVERDUE
    );
    return {
      active: activeLoans.length,
      borrowed: loanRequests.filter(loan => loan.status === LOAN_REQUEST_STATUS.BORROWED).length,
      overdue: loanRequests.filter(loan => loan.status === LOAN_REQUEST_STATUS.OVERDUE).length
    };
  }, [loanRequests]);

  // Handle return action
  const handleReturn = (loan) => {
    setReturnModal({ isOpen: true, loan });
  };

  const handleConfirmReturn = async (returnData) => {
    if (!returnModal.loan) return;
    
    try {
      const result = await processReturn(returnModal.loan.id, returnData);
      
      if (result.success) {
        refresh();
        setReturnModal({ isOpen: false, loan: null });
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.error);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!loading && pagination.hasNextPage) {
      loadMore();
    }
  };

  // Helper functions
  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDaysOverdue = (expectedReturnDate) => {
    if (!expectedReturnDate) return 0;
    const returnDate = expectedReturnDate.toDate ? expectedReturnDate.toDate() : new Date(expectedReturnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    returnDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - returnDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const isOverdue = (loan) => {
    return loan.status === LOAN_REQUEST_STATUS.OVERDUE || calculateDaysOverdue(loan.expectedReturnDate) > 0;
  };

  // Status filter options
  const statusFilters = [
    { key: 'active', label: 'ทั้งหมด', count: statusCounts.active },
    { key: 'borrowed', label: 'กำลังยืม', count: statusCounts.borrowed },
    { key: 'overdue', label: 'เกินกำหนด', count: statusCounts.overdue }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              รับคืนอุปกรณ์
            </h1>
            <p className="text-sm text-gray-600 hidden sm:block">
              ดำเนินการรับคืนอุปกรณ์และตรวจสอบสภาพ
            </p>
          </div>
          <button 
            onClick={refresh} 
            disabled={loading} 
            className="self-end sm:self-auto inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 hover:shadow-sm"
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            รีเฟรช
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="ค้นหาตามชื่อผู้ยืม, อุปกรณ์, หรือหมายเลขอุปกรณ์..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="block w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
              />
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 p-4">
            {statusFilters.map(({ key, label, count }) => (
              <button 
                key={key} 
                onClick={() => setStatusFilter(key)} 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  statusFilter === key 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  statusFilter === key 
                    ? 'bg-indigo-500 text-white' 
                    : key === 'overdue' && count > 0
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button onClick={refresh} className="mt-2 text-sm font-medium text-red-800 hover:text-red-600">
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && filteredLoans.length === 0 && (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredLoans.length === 0 && !error && (
          <EmptyState
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            title="ไม่มีรายการที่กำลังยืม"
            description={searchTerm ? "ไม่พบรายการที่ตรงกับการค้นหา" : "ยังไม่มีอุปกรณ์ที่กำลังถูกยืมอยู่"}
            action={searchTerm ? (
              <button 
                onClick={() => setSearchTerm('')} 
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
              >
                ล้างการค้นหา
              </button>
            ) : null}
          />
        )}

        {/* Loan Cards */}
        {!loading && filteredLoans.length > 0 && (
          <div className="space-y-4">
            {filteredLoans.map((loan) => {
              const daysOverdue = calculateDaysOverdue(loan.expectedReturnDate);
              const loanIsOverdue = isOverdue(loan);
              const equipmentName = loan.equipmentSnapshot?.name || loan.equipmentName || 'ไม่ทราบชื่ออุปกรณ์';
              const userName = loan.userSnapshot?.displayName || loan.userName || 'ไม่ทราบชื่อ';
              const userEmail = loan.userSnapshot?.email || loan.userEmail || '';
              const userPhone = loan.userSnapshot?.phone || loan.userPhone || '';
              const equipmentImage = loan.equipmentSnapshot?.imageUrl || loan.equipmentSnapshot?.imageURL;

              return (
                <div 
                  key={loan.id} 
                  className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md ${
                    loanIsOverdue ? 'border-rose-200 bg-rose-50/30' : 'border-gray-100'
                  }`}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Equipment Image */}
                      <div className="flex-shrink-0">
                        {equipmentImage ? (
                          <img
                            src={equipmentImage}
                            alt={equipmentName}
                            className="w-20 h-20 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Loan Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {equipmentName}
                              </h3>
                              {loanIsOverdue && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  ค้างคืน {daysOverdue} วัน
                                </span>
                              )}
                              {!loanIsOverdue && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  กำลังยืม
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              ผู้ยืม: <span className="font-medium">{userName}</span>
                            </p>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                          {userEmail && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{userEmail}</span>
                            </div>
                          )}
                          {userPhone && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{userPhone}</span>
                            </div>
                          )}
                        </div>

                        {/* Dates */}
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">วันที่ยืม</p>
                            <p className="font-medium text-gray-900">{formatDate(loan.borrowDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">กำหนดคืน</p>
                            <p className={`font-medium ${loanIsOverdue ? 'text-rose-600' : 'text-gray-900'}`}>
                              {formatDate(loan.expectedReturnDate)}
                            </p>
                          </div>
                          {loan.pickedUpAt && (
                            <div>
                              <p className="text-gray-500">รับอุปกรณ์</p>
                              <p className="font-medium text-gray-900">{formatDate(loan.pickedUpAt)}</p>
                            </div>
                          )}
                        </div>

                        {/* Purpose */}
                        {loan.purpose && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500">วัตถุประสงค์</p>
                            <p className="text-sm text-gray-700 line-clamp-2">{loan.purpose}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2 sm:ml-4">
                        <button
                          onClick={() => handleReturn(loan)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium transition-colors shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          รับคืน
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {pagination.hasNextPage && (
              <div className="text-center pt-4">
                <button 
                  onClick={handleLoadMore} 
                  disabled={loading} 
                  className="inline-flex items-center px-6 py-3 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังโหลด...
                    </>
                  ) : (
                    <>
                      โหลดเพิ่มเติม
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        {filteredLoans.length > 0 && (
          <div className="text-center text-sm text-gray-500 pb-4">
            แสดง {filteredLoans.length} รายการ{pagination.hasNextPage && ' (มีรายการเพิ่มเติม)'}
          </div>
        )}

        {/* Return Process Modal */}
        <ReturnProcessModal
          isOpen={returnModal.isOpen}
          loan={returnModal.loan}
          onConfirm={handleConfirmReturn}
          onClose={() => setReturnModal({ isOpen: false, loan: null })}
          loading={processingReturn}
        />
      </div>
    </Layout>
  );
};

export default StaffReturnList;
