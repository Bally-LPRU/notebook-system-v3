import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoanRequests } from '../../hooks/useLoanRequests';
import { 
  LOAN_REQUEST_STATUS_LABELS, 
  LOAN_REQUEST_STATUS_COLORS,
  LOAN_REQUEST_STATUS 
} from '../../types/loanRequest';
import LoanRequestService from '../../services/loanRequestService';
import EquipmentService from '../../services/equipmentService';
import { EQUIPMENT_STATUS } from '../../types/equipment';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const BorrowedEquipmentList = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [returningEquipment, setReturningEquipment] = useState(null);
  
  const {
    loanRequests,
    loading,
    error,
    pagination,
    updateFilters,
    loadMore,
    refresh
  } = useLoanRequests({
    status: LOAN_REQUEST_STATUS.BORROWED,
    sortBy: 'expectedReturnDate',
    sortOrder: 'asc',
    limit: 10
  });

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      updateFilters({ 
        status: LOAN_REQUEST_STATUS.BORROWED,
        search: searchTerm 
      });
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, updateFilters]);

  const handleReturn = async (loanRequestId) => {
    if (!window.confirm('คุณต้องการบันทึกการคืนอุปกรณ์นี้หรือไม่?')) {
      return;
    }

    setReturningEquipment(loanRequestId);
    try {
      await returnEquipment(loanRequestId);
      refresh();
      alert('บันทึกการคืนอุปกรณ์เรียบร้อยแล้ว');
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setReturningEquipment(null);
    }
  };

  const returnEquipment = async (loanRequestId) => {
    try {
      // Get loan request details
      const loanRequest = await LoanRequestService.getLoanRequestById(loanRequestId);
      if (!loanRequest) {
        throw new Error('ไม่พบข้อมูลการยืม');
      }

      // Update loan request status to returned
      await LoanRequestService.updateLoanRequestStatus(
        loanRequestId, 
        LOAN_REQUEST_STATUS.RETURNED, 
        user.uid
      );

      // Update equipment status to available
      await EquipmentService.updateEquipmentStatus(
        loanRequest.equipmentId,
        EQUIPMENT_STATUS.AVAILABLE,
        user.uid
      );

      return true;
    } catch (error) {
      console.error('Error returning equipment:', error);
      throw error;
    }
  };

  const handleLoadMore = () => {
    if (!loading && pagination.hasNextPage) {
      loadMore();
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

  const isOverdue = (expectedReturnDate) => {
    if (!expectedReturnDate) return false;
    const returnDate = expectedReturnDate.toDate ? expectedReturnDate.toDate() : new Date(expectedReturnDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return returnDate < today;
  };

  const getDaysOverdue = (expectedReturnDate) => {
    if (!expectedReturnDate) return 0;
    const returnDate = expectedReturnDate.toDate ? expectedReturnDate.toDate() : new Date(expectedReturnDate);
    const today = new Date();
    const diffTime = today.getTime() - returnDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getDaysUntilDue = (expectedReturnDate) => {
    if (!expectedReturnDate) return 0;
    const returnDate = expectedReturnDate.toDate ? expectedReturnDate.toDate() : new Date(expectedReturnDate);
    const today = new Date();
    const diffTime = returnDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter overdue items if needed
  const filteredLoanRequests = showOverdueOnly 
    ? loanRequests.filter(request => isOverdue(request.expectedReturnDate))
    : loanRequests;

  const overdueCount = loanRequests.filter(request => isOverdue(request.expectedReturnDate)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">อุปกรณ์ที่ถูกยืม</h2>
        <p className="mt-1 text-gray-600">
          ติดตามและจัดการการคืนอุปกรณ์ที่ถูกยืม
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="ค้นหาตามชื่ออุปกรณ์, ผู้ยืม..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showOverdueOnly}
                onChange={(e) => setShowOverdueOnly(e.target.checked)}
                className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">
                แสดงเฉพาะที่เกินกำหนด ({overdueCount})
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">กำลังยืม</p>
              <p className="text-xl font-semibold text-gray-900">{loanRequests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">เกินกำหนด</p>
              <p className="text-xl font-semibold text-red-600">{overdueCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">ครบกำหนดใน 3 วัน</p>
              <p className="text-xl font-semibold text-yellow-600">
                {loanRequests.filter(request => {
                  const daysUntilDue = getDaysUntilDue(request.expectedReturnDate);
                  return daysUntilDue >= 0 && daysUntilDue <= 3;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
      {loading && filteredLoanRequests.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredLoanRequests.length === 0 && !error && (
        <EmptyState
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          title={showOverdueOnly ? "ไม่มีอุปกรณ์ที่เกินกำหนด" : "ไม่มีอุปกรณ์ที่ถูกยืม"}
          description={
            showOverdueOnly 
              ? "ไม่มีอุปกรณ์ที่เกินกำหนดคืนในขณะนี้"
              : searchTerm 
                ? "ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไขการค้นหา"
                : "ไม่มีอุปกรณ์ที่กำลังถูกยืมในขณะนี้"
          }
          action={
            (showOverdueOnly || searchTerm) ? (
              <button
                onClick={() => {
                  setShowOverdueOnly(false);
                  setSearchTerm('');
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ล้างตัวกรอง
              </button>
            ) : null
          }
        />
      )}

      {/* Borrowed Equipment List */}
      {!loading && filteredLoanRequests.length > 0 && (
        <div className="space-y-4">
          {filteredLoanRequests.map((request) => {
            const overdue = isOverdue(request.expectedReturnDate);
            const daysOverdue = getDaysOverdue(request.expectedReturnDate);
            const daysUntilDue = getDaysUntilDue(request.expectedReturnDate);
            const isReturning = returningEquipment === request.id;

            return (
              <div key={request.id} className={`bg-white rounded-lg shadow-sm border p-6 ${overdue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.equipment?.name || 'อุปกรณ์ที่ไม่พบ'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {LOAN_REQUEST_STATUS_LABELS[request.status]}
                      </span>
                      {overdue && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          เกินกำหนด {daysOverdue} วัน
                        </span>
                      )}
                      {!overdue && daysUntilDue <= 3 && daysUntilDue >= 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ครบกำหนดใน {daysUntilDue} วัน
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Equipment Info */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">ข้อมูลอุปกรณ์</h4>
                        {request.equipment ? (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              {request.equipment.imageURL && (
                                <img
                                  src={request.equipment.imageURL}
                                  alt={request.equipment.name}
                                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{request.equipment.name}</p>
                                <p className="text-sm text-gray-600">{request.equipment.brand} {request.equipment.model}</p>
                                <p className="text-xs text-gray-500 font-mono">รหัส: {request.equipment.serialNumber}</p>
                                <p className="text-xs text-gray-500">สถานที่: {request.equipment.location}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50 rounded-lg p-4">
                            <p className="text-sm text-red-600">ไม่พบข้อมูลอุปกรณ์</p>
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">ข้อมูลผู้ยืม</h4>
                        {request.user ? (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              {request.user.photoURL && (
                                <img
                                  src={request.user.photoURL}
                                  alt={`${request.user.firstName} ${request.user.lastName}`}
                                  className="w-12 h-12 rounded-full flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {request.user.firstName} {request.user.lastName}
                                </p>
                                <p className="text-sm text-gray-600">{request.user.email}</p>
                                <p className="text-xs text-gray-500">
                                  {request.user.department} ({request.user.userType})
                                </p>
                                {request.user.phoneNumber && (
                                  <p className="text-xs text-gray-500">โทร: {request.user.phoneNumber}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50 rounded-lg p-4">
                            <p className="text-sm text-red-600">ไม่พบข้อมูลผู้ใช้</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Loan Details */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">วันที่ยืม:</span>
                        <p className="text-gray-600">{formatDate(request.borrowDate)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">กำหนดคืน:</span>
                        <p className={overdue ? "text-red-600 font-medium" : "text-gray-600"}>
                          {formatDate(request.expectedReturnDate)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">อนุมัติเมื่อ:</span>
                        <p className="text-gray-600">{formatDateTime(request.approvedAt)}</p>
                      </div>
                    </div>

                    {/* Purpose */}
                    <div className="mt-4">
                      <span className="font-medium text-gray-700">วัตถุประสงค์:</span>
                      <p className="text-gray-600 mt-1 bg-gray-50 rounded-lg p-3">{request.purpose}</p>
                    </div>
                  </div>

                  {/* Return Button */}
                  <div className="ml-6 flex-shrink-0">
                    <button
                      onClick={() => handleReturn(request.id)}
                      disabled={isReturning}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isReturning ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          กำลังบันทึก...
                        </div>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          บันทึกการคืน
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {pagination.hasNextPage && !showOverdueOnly && (
            <div className="text-center pt-6">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
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

      {/* Results Summary */}
      {filteredLoanRequests.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          แสดง {filteredLoanRequests.length} รายการ
          {pagination.hasNextPage && !showOverdueOnly && ' (มีรายการเพิ่มเติม)'}
        </div>
      )}
    </div>
  );
};

export default BorrowedEquipmentList;