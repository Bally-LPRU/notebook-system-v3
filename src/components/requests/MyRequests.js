import { useState, useEffect } from 'react';
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

const MyRequests = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  
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
  }, [statusFilter, updateFilters]);

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
    const colorMap = {
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      blue: 'bg-blue-100 text-blue-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colorMap[LOAN_REQUEST_STATUS_COLORS[status]] || colorMap.gray;
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

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ทั้งหมด
            </button>
            {Object.entries(LOAN_REQUEST_STATUS_LABELS).map(([status, label]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
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

        {/* Loan Requests List */}
        {!loading && loanRequests.length > 0 && (
          <div className="space-y-4">
            {loanRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.equipment?.name || 'อุปกรณ์ที่ไม่พบ'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {LOAN_REQUEST_STATUS_LABELS[request.status]}
                      </span>
                    </div>
                    
                    {request.equipment && (
                      <div className="text-sm text-gray-600 mb-3">
                        <p>{request.equipment.brand} {request.equipment.model}</p>
                        <p>รหัส: {request.equipment.serialNumber}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">วันที่ส่งคำขอ:</span>
                        <p className="text-gray-600">{formatDateTime(request.createdAt)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">วันที่ต้องการยืม:</span>
                        <p className="text-gray-600">{formatDate(request.borrowDate)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">วันที่คาดว่าจะคืน:</span>
                        <p className="text-gray-600">{formatDate(request.expectedReturnDate)}</p>
                      </div>
                      {request.approvedAt && (
                        <div>
                          <span className="font-medium text-gray-700">วันที่อนุมัติ:</span>
                          <p className="text-gray-600">{formatDateTime(request.approvedAt)}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <span className="font-medium text-gray-700">วัตถุประสงค์:</span>
                      <p className="text-gray-600 mt-1">{request.purpose}</p>
                    </div>

                    {request.notes && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700">หมายเหตุ:</span>
                        <p className="text-gray-600 mt-1">{request.notes}</p>
                      </div>
                    )}

                    {request.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <span className="font-medium text-red-700">เหตุผลที่ปฏิเสธ:</span>
                        <p className="text-red-600 mt-1">{request.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex-shrink-0">
                    {request.status === LOAN_REQUEST_STATUS.PENDING && (
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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

        {/* Results Summary */}
        {loanRequests.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            แสดง {loanRequests.length} รายการ
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyRequests;