import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../layout';
import { useUserLoanRequests } from '../../hooks/useLoanRequests';
import { useUserTypeLimits } from '../../hooks/useUserTypeLimits';
import { 
  LOAN_REQUEST_STATUS_LABELS, 
  LOAN_REQUEST_STATUS_COLORS,
  LOAN_REQUEST_STATUS 
} from '../../types/loanRequest';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

// จำนวนรายการต่อหน้า
const ITEMS_PER_PAGE = 10;

const MyRequests = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const {
    loanRequests,
    loading,
    error,
    updateFilters,
    cancelLoanRequest,
    refresh
  } = useUserLoanRequests(user?.uid, {
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Use user type limits hook for borrowing summary
  const {
    limits,
    loading: limitsLoading,
    currentBorrowedCount,
    pendingRequestsCount,
    remainingQuota,
    canBorrow
  } = useUserTypeLimits();

  useEffect(() => {
    updateFilters({ status: statusFilter });
    setCurrentPage(1); // Reset page when filter changes
  }, [statusFilter, updateFilters]);

  // Filter and paginate loan requests
  const filteredRequests = useMemo(() => {
    if (!statusFilter) return loanRequests;
    return loanRequests.filter(r => r.status === statusFilter);
  }, [loanRequests, statusFilter]);

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  // Count by status for badges
  const statusCounts = useMemo(() => {
    const counts = {};
    Object.keys(LOAN_REQUEST_STATUS_LABELS).forEach(status => {
      counts[status] = loanRequests.filter(r => r.status === status).length;
    });
    return counts;
  }, [loanRequests]);

  const handleCancelRequest = async (requestId) => {
    if (window.confirm('คุณต้องการยกเลิกคำขอยืมนี้หรือไม่?')) {
      try {
        await cancelLoanRequest(requestId, user.uid);
        alert('ยกเลิกคำขอยืมเรียบร้อยแล้ว');
      } catch (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
      }
    }
  };

  const getStatusColor = (status) => {
    // Map status directly to colors for accurate display
    const statusColorMap = {
      [LOAN_REQUEST_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [LOAN_REQUEST_STATUS.APPROVED]: 'bg-green-100 text-green-800 border-green-200',
      [LOAN_REQUEST_STATUS.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
      [LOAN_REQUEST_STATUS.BORROWED]: 'bg-blue-100 text-blue-800 border-blue-200',
      [LOAN_REQUEST_STATUS.RETURNED]: 'bg-gray-100 text-gray-600 border-gray-200',
      [LOAN_REQUEST_STATUS.OVERDUE]: 'bg-red-100 text-red-800 border-red-200'
    };
    return statusColorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case LOAN_REQUEST_STATUS.PENDING:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case LOAN_REQUEST_STATUS.APPROVED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case LOAN_REQUEST_STATUS.REJECTED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case LOAN_REQUEST_STATUS.BORROWED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        );
      case LOAN_REQUEST_STATUS.RETURNED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case LOAN_REQUEST_STATUS.OVERDUE:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">คำขอของฉัน</h1>
          <p className="mt-2 text-gray-600">
            ติดตามสถานะคำขอยืมและการจองของคุณ
          </p>
        </div>

        {/* Borrowing Summary Card - Requirements: 6.1, 6.2, 6.3, 6.4, 6.5 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            สรุปการยืมของคุณ
          </h2>
          
          {limitsLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Current Borrowed Count */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">กำลังยืมอยู่</p>
                    <p className="text-2xl font-bold text-blue-900">{currentBorrowedCount}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-blue-500 mt-1">อุปกรณ์ที่ยืมอยู่ในขณะนี้</p>
              </div>

              {/* Pending Requests Count */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">รอดำเนินการ</p>
                    <p className="text-2xl font-bold text-yellow-900">{pendingRequestsCount}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-yellow-500 mt-1">คำขอที่รอการอนุมัติ/รับอุปกรณ์</p>
              </div>

              {/* Remaining Quota */}
              <div className={`rounded-lg p-4 ${canBorrow ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${canBorrow ? 'text-green-600' : 'text-red-600'}`}>
                      ยืมได้อีก
                    </p>
                    <p className={`text-2xl font-bold ${canBorrow ? 'text-green-900' : 'text-red-900'}`}>
                      {remainingQuota}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${canBorrow ? 'bg-green-100' : 'bg-red-100'}`}>
                    <svg className={`w-6 h-6 ${canBorrow ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {canBorrow ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </div>
                </div>
                <p className={`text-xs mt-1 ${canBorrow ? 'text-green-500' : 'text-red-500'}`}>
                  จากโควต้าสูงสุด {limits.maxItems} ชิ้น
                </p>
              </div>

              {/* Max Items Limit */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">โควต้าสูงสุด</p>
                    <p className="text-2xl font-bold text-gray-900">{limits.maxItems}</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-full">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {limits.isEnabled 
                    ? `ตามประเภท: ${limits.userTypeName}` 
                    : 'ค่าเริ่มต้นของระบบ'}
                </p>
              </div>
            </div>
          )}

          {/* Warning if cannot borrow */}
          {!limitsLoading && !canBorrow && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm text-red-700">
                  คุณยืมอุปกรณ์ครบจำนวนสูงสุดแล้ว กรุณาคืนอุปกรณ์ก่อนยืมเพิ่ม
                </span>
              </div>
            </div>
          )}

          {/* User type warning */}
          {!limitsLoading && limits.warning && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-yellow-700">{limits.warning}</span>
              </div>
            </div>
          )}
        </div>

        {/* Status Filter with counts */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                statusFilter === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ทั้งหมด
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                statusFilter === '' ? 'bg-blue-500' : 'bg-gray-200'
              }`}>
                {loanRequests.length}
              </span>
            </button>
            {Object.entries(LOAN_REQUEST_STATUS_LABELS).map(([status, label]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusFilter === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
                {statusCounts[status] > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    statusFilter === status ? 'bg-blue-500' : 'bg-gray-200'
                  }`}>
                    {statusCounts[status]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={refresh}
                    className="text-sm font-medium text-red-800 hover:text-red-600"
                  >
                    ลองใหม่อีกครั้ง
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && loanRequests.length === 0 && (
          <div className="flex justify-center items-center py-12">
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
            description={
              statusFilter 
                ? `ไม่มีคำขอยืมที่มีสถานะ "${LOAN_REQUEST_STATUS_LABELS[statusFilter]}"` 
                : "คุณยังไม่เคยส่งคำขอยืมอุปกรณ์"
            }
            action={
              statusFilter ? (
                <button
                  onClick={() => setStatusFilter('')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ดูคำขอทั้งหมด
                </button>
              ) : null
            }
          />
        )}

        {/* Loan Requests List - Compact View */}
        {!loading && paginatedRequests.length > 0 && (
          <div className="space-y-3">
            {paginatedRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start gap-4">
                  {/* Equipment Image */}
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    {request.equipment?.imageURL || request.equipment?.imageUrl || request.equipmentSnapshot?.imageUrl || request.equipmentSnapshot?.imageURL ? (
                      <img
                        src={request.equipment?.imageURL || request.equipment?.imageUrl || request.equipmentSnapshot?.imageUrl || request.equipmentSnapshot?.imageURL}
                        alt={request.equipment?.name || request.equipmentSnapshot?.name || 'อุปกรณ์'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {request.equipment?.name || request.equipmentSnapshot?.name || 'อุปกรณ์ที่ไม่พบ'}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {LOAN_REQUEST_STATUS_LABELS[request.status]}
                      </span>
                    </div>
                    
                    {/* Compact Info Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                      {(request.equipment?.brand || request.equipment?.model) && (
                        <span>{request.equipment?.brand} {request.equipment?.model}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(request.borrowDate)} - {formatDate(request.expectedReturnDate)}
                      </span>
                    </div>

                    {/* Additional Info based on status */}
                    <div className="mt-2 text-sm">
                      {request.status === LOAN_REQUEST_STATUS.PENDING && (
                        <p className="text-yellow-700">รอการอนุมัติจากผู้ดูแลระบบ</p>
                      )}
                      {request.status === LOAN_REQUEST_STATUS.APPROVED && (
                        <p className="text-green-700">
                          อนุมัติเมื่อ: {formatDateTime(request.approvedAt)} - รอรับอุปกรณ์
                        </p>
                      )}
                      {request.status === LOAN_REQUEST_STATUS.BORROWED && (
                        <p className="text-blue-700">
                          กำหนดคืน: {formatDate(request.expectedReturnDate)}
                        </p>
                      )}
                      {request.status === LOAN_REQUEST_STATUS.RETURNED && request.actualReturnDate && (
                        <p className="text-gray-600">
                          คืนเมื่อ: {formatDateTime(request.actualReturnDate)}
                        </p>
                      )}
                      {request.status === LOAN_REQUEST_STATUS.OVERDUE && (
                        <p className="text-red-700 font-medium">
                          เกินกำหนดคืน! กรุณาติดต่อผู้ดูแลระบบ
                        </p>
                      )}
                      {request.status === LOAN_REQUEST_STATUS.REJECTED && request.rejectionReason && (
                        <p className="text-red-600">
                          เหตุผล: {request.rejectionReason}
                        </p>
                      )}
                    </div>

                    {/* Purpose - Collapsed */}
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      วัตถุประสงค์: {request.purpose}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {request.status === LOAN_REQUEST_STATUS.PENDING && (
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        ยกเลิก
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredRequests.length > ITEMS_PER_PAGE && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              แสดง {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length)} จาก {filteredRequests.length} รายการ
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Results Summary for small lists */}
        {filteredRequests.length > 0 && filteredRequests.length <= ITEMS_PER_PAGE && (
          <div className="mt-6 text-center text-sm text-gray-500">
            แสดง {filteredRequests.length} รายการ
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyRequests;