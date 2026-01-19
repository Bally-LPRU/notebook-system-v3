/**
 * StaffLoanRequestList Component
 * Page for Staff to manage loan requests - view, filter, search, approve/reject
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoanRequests } from '../../hooks/useLoanRequests';
import { useStaffLoanManagement } from '../../hooks/useStaffLoanManagement';
import { LOAN_REQUEST_STATUS_LABELS, LOAN_REQUEST_STATUS } from '../../types/loanRequest';
import { Layout } from '../layout';
import StaffLoanRequestCard from './StaffLoanRequestCard';
import LoanApprovalModal from './LoanApprovalModal';
import LoanRejectionModal from './LoanRejectionModal';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const StaffLoanRequestList = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Modal states
  const [approvalModal, setApprovalModal] = useState({ isOpen: false, request: null });
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, request: null });

  // Use the new Staff loan management hook for approve/reject with audit logging
  const { 
    approveLoanRequest: staffApproveLoan, 
    rejectLoanRequest: staffRejectLoan
  } = useStaffLoanManagement();

  const {
    loanRequests,
    loading,
    error,
    pagination,
    updateFilters,
    loadMore,
    markAsPickedUp,
    markAsReturned,
    refresh
  } = useLoanRequests({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 10
  });

  // Update filters when search or status changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      updateFilters({ status: statusFilter, search: searchTerm });
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [statusFilter, searchTerm, updateFilters]);

  // Handle approve action
  const handleApprove = async (request) => {
    setApprovalModal({ isOpen: true, request });
  };

  const handleConfirmApprove = async () => {
    if (!approvalModal.request) return;
    
    try {
      // Use the new Staff loan management service with audit logging
      const result = await staffApproveLoan(approvalModal.request.id);
      
      if (result.success) {
        // Refresh the list to show updated status
        refresh();
        setApprovalModal({ isOpen: false, request: null });
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.error);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  // Handle reject action
  const handleReject = async (request) => {
    setRejectionModal({ isOpen: true, request });
  };

  const handleConfirmReject = async (reason) => {
    if (!rejectionModal.request) return;
    
    try {
      // Use the new Staff loan management service with audit logging
      const result = await staffRejectLoan(rejectionModal.request.id, reason);
      
      if (result.success) {
        // Refresh the list to show updated status
        refresh();
        setRejectionModal({ isOpen: false, request: null });
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.error);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  // Handle mark as picked up
  const handleMarkAsPickedUp = async (requestId) => {
    try {
      await markAsPickedUp(requestId, user.uid);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  // Handle mark as returned
  const handleMarkAsReturned = async (requestId, returnData = {}) => {
    try {
      await markAsReturned(requestId, user.uid, returnData);
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

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts = { all: loanRequests.length };
    Object.keys(LOAN_REQUEST_STATUS_LABELS).forEach(status => {
      counts[status] = loanRequests.filter(r => r.status === status).length;
    });
    return counts;
  }, [loanRequests]);

  // Status filter options
  const statusFilters = [
    { key: '', label: 'ทั้งหมด', count: statusCounts.all },
    { key: LOAN_REQUEST_STATUS.PENDING, label: 'รอดำเนินการ', count: statusCounts[LOAN_REQUEST_STATUS.PENDING] || 0 },
    { key: LOAN_REQUEST_STATUS.APPROVED, label: 'อนุมัติแล้ว', count: statusCounts[LOAN_REQUEST_STATUS.APPROVED] || 0 },
    { key: LOAN_REQUEST_STATUS.BORROWED, label: 'กำลังยืม', count: statusCounts[LOAN_REQUEST_STATUS.BORROWED] || 0 },
    { key: LOAN_REQUEST_STATUS.OVERDUE, label: 'เกินกำหนด', count: statusCounts[LOAN_REQUEST_STATUS.OVERDUE] || 0 },
    { key: LOAN_REQUEST_STATUS.RETURNED, label: 'คืนแล้ว', count: statusCounts[LOAN_REQUEST_STATUS.RETURNED] || 0 },
    { key: LOAN_REQUEST_STATUS.REJECTED, label: 'ปฏิเสธ', count: statusCounts[LOAN_REQUEST_STATUS.REJECTED] || 0 }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              จัดการคำขอยืม
            </h1>
            <p className="text-sm text-gray-600 hidden sm:block">
              อนุมัติหรือปฏิเสธคำขอยืมอุปกรณ์จากผู้ใช้
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
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  placeholder="ค้นหาตามชื่อผู้ยืมหรืออุปกรณ์..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="block w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                />
              </div>
              {/* Mobile filter toggle */}
              <button 
                onClick={() => setShowMobileFilters(!showMobileFilters)} 
                className="sm:hidden inline-flex items-center px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop Status Filters */}
          <div className="hidden sm:flex flex-wrap gap-2 p-4">
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
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Mobile Status Filters */}
          {showMobileFilters && (
            <div className="sm:hidden p-4 border-t border-gray-100 space-y-3">
              <div className="flex flex-wrap gap-2">
                {statusFilters.map(({ key, label, count }) => (
                  <button 
                    key={key} 
                    onClick={() => { setStatusFilter(key); setShowMobileFilters(false); }} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      statusFilter === key 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>
            </div>
          )}
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
        {loading && loanRequests.length === 0 && (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Empty State */}
        {!loading && loanRequests.length === 0 && !error && (
          <EmptyState
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="ไม่มีคำขอยืม"
            description={statusFilter || searchTerm ? "ไม่พบคำขอยืมที่ตรงกับเงื่อนไขการค้นหา" : "ยังไม่มีคำขอยืมอุปกรณ์ในระบบ"}
            action={(statusFilter || searchTerm) ? (
              <button 
                onClick={() => { setStatusFilter(''); setSearchTerm(''); }} 
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
              >
                ล้างตัวกรอง
              </button>
            ) : null}
          />
        )}

        {/* Loan Request Cards */}
        {!loading && loanRequests.length > 0 && (
          <div className="space-y-4">
            {loanRequests.map((request) => (
              <StaffLoanRequestCard
                key={request.id}
                request={request}
                onApprove={() => handleApprove(request)}
                onReject={() => handleReject(request)}
                onMarkAsPickedUp={handleMarkAsPickedUp}
                onMarkAsReturned={handleMarkAsReturned}
              />
            ))}

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
        {loanRequests.length > 0 && (
          <div className="text-center text-sm text-gray-500 pb-4">
            แสดง {loanRequests.length} รายการ{pagination.hasNextPage && ' (มีรายการเพิ่มเติม)'}
          </div>
        )}

        {/* Approval Modal */}
        <LoanApprovalModal
          isOpen={approvalModal.isOpen}
          request={approvalModal.request}
          onConfirm={handleConfirmApprove}
          onClose={() => setApprovalModal({ isOpen: false, request: null })}
        />

        {/* Rejection Modal */}
        <LoanRejectionModal
          isOpen={rejectionModal.isOpen}
          request={rejectionModal.request}
          onConfirm={handleConfirmReject}
          onClose={() => setRejectionModal({ isOpen: false, request: null })}
        />
      </div>
    </Layout>
  );
};

export default StaffLoanRequestList;
