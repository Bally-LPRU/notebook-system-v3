import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoanRequests } from '../../hooks/useLoanRequests';
import { 
  LOAN_REQUEST_STATUS_LABELS
} from '../../types/loanRequest';
import LoanRequestCard from './LoanRequestCard';
import BulkActions from '../common/BulkActions';
import AdvancedSearchModal from '../search/AdvancedSearchModal';
import { useSavedSearches } from '../../hooks/useSavedSearches';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const LoanRequestList = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  const {
    savedSearches,
    saveSearch,
    deleteSavedSearch
  } = useSavedSearches('loans');
  
  const {
    loanRequests,
    loading,
    error,
    pagination,
    updateFilters,
    loadMore,
    approveLoanRequest,
    rejectLoanRequest,
    refresh
  } = useLoanRequests({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 10
  });

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      updateFilters({ 
        status: statusFilter,
        search: searchTerm 
      });
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [statusFilter, searchTerm, updateFilters]);

  const handleApprove = async (requestId) => {
    try {
      await approveLoanRequest(requestId, user.uid);
      // Show success message (could be implemented with a toast notification)
      alert('อนุมัติคำขอยืมเรียบร้อยแล้ว');
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleReject = async (requestId, rejectionReason) => {
    try {
      await rejectLoanRequest(requestId, rejectionReason, user.uid);
      // Show success message (could be implemented with a toast notification)
      alert('ปฏิเสธคำขอยืมเรียบร้อยแล้ว');
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleLoadMore = () => {
    if (!loading && pagination.hasNextPage) {
      loadMore();
    }
  };



  const getStatusCount = (status) => {
    if (!status) return loanRequests.length;
    return loanRequests.filter(request => request.status === status).length;
  };

  // Bulk actions handlers
  const handleSelectItem = (requestId, isSelected) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, requestId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== requestId));
    }
  };

  const handleSelectAll = () => {
    setSelectedItems(loanRequests.map(request => request.id));
  };

  const handleDeselectAll = () => {
    setSelectedItems([]);
  };

  const handleBulkAction = async (actionId, itemIds, actionData) => {
    setBulkActionLoading(true);
    try {
      switch (actionId) {
        case 'approve':
          for (const itemId of itemIds) {
            await approveLoanRequest(itemId, user.uid);
          }
          break;

        case 'reject':
          if (!actionData.reason) {
            throw new Error('กรุณาระบุเหตุผลในการปฏิเสธ');
          }
          for (const itemId of itemIds) {
            await rejectLoanRequest(itemId, actionData.reason, user.uid);
          }
          break;

        case 'markReturned':
          // Implementation would depend on your loan service
          for (const _itemId of itemIds) {
            // await markLoanAsReturned(_itemId);
          }
          break;

        case 'sendReminder':
          // Implementation would depend on your notification service
          console.log('Sending reminders to:', itemIds, 'Message:', actionData.message);
          break;

        case 'export':
          await exportSelectedLoans(itemIds);
          break;

        default:
          throw new Error('การดำเนินการไม่ถูกต้อง');
      }

      setSelectedItems([]);
      alert(`ดำเนินการเรียบร้อยแล้ว (${itemIds.length} รายการ)`);
    } catch (error) {
      console.error('Bulk action error:', error);
      throw error;
    } finally {
      setBulkActionLoading(false);
    }
  };

  const exportSelectedLoans = async (itemIds) => {
    try {
      const selectedLoans = loanRequests.filter(request => itemIds.includes(request.id));
      
      const csvData = selectedLoans.map(request => ({
        'วันที่ขอยืม': request.createdAt?.toDate().toLocaleDateString('th-TH'),
        'ชื่ออุปกรณ์': request.equipment?.name || 'ไม่ระบุ',
        'ผู้ขอยืม': request.user?.displayName || 'ไม่ระบุ',
        'วันที่ยืม': request.borrowDate?.toDate().toLocaleDateString('th-TH'),
        'วันที่คืน': request.expectedReturnDate?.toDate().toLocaleDateString('th-TH'),
        'สถานะ': LOAN_REQUEST_STATUS_LABELS[request.status],
        'วัตถุประสงค์': request.purpose || 'ไม่ระบุ'
      }));

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `loan-requests-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  const handleAdvancedSearch = (advancedFilters) => {
    updateFilters(advancedFilters);
  };

  const handleSaveSearch = async (searchData) => {
    try {
      await saveSearch(searchData);
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const handleLoadSearch = (savedSearch) => {
    const filters = savedSearch.filters;
    updateFilters(filters);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">จัดการคำขอยืมอุปกรณ์</h2>
        <p className="mt-1 text-gray-600">
          อนุมัติหรือปฏิเสธคำขอยืมอุปกรณ์จากผู้ใช้
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
                placeholder="ค้นหาตามชื่ออุปกรณ์, ผู้ขอยืม, หรือวัตถุประสงค์..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Advanced Search Button */}
          <button
            onClick={() => setShowAdvancedSearch(true)}
            className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            ค้นหาขั้นสูง
          </button>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ทั้งหมด ({getStatusCount('')})
            </button>
            {Object.entries(LOAN_REQUEST_STATUS_LABELS).map(([status, label]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({getStatusCount(status)})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedItems}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        totalItems={loanRequests.length}
        itemType="loans"
        onBulkAction={handleBulkAction}
        loading={bulkActionLoading}
      />

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
            statusFilter || searchTerm
              ? "ไม่พบคำขอยืมที่ตรงกับเงื่อนไขการค้นหา"
              : "ยังไม่มีคำขอยืมอุปกรณ์ในระบบ"
          }
          action={
            (statusFilter || searchTerm) ? (
              <button
                onClick={() => {
                  setStatusFilter('');
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

      {/* Loan Requests List */}
      {!loading && loanRequests.length > 0 && (
        <div className="space-y-4">
          {loanRequests.map((request) => (
            <LoanRequestCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onReject={handleReject}
              isSelectable={true}
              isSelected={selectedItems.includes(request.id)}
              onSelect={(isSelected) => handleSelectItem(request.id, isSelected)}
            />
          ))}

          {/* Load More Button */}
          {pagination.hasNextPage && (
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
      {loanRequests.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          แสดง {loanRequests.length} รายการ
          {pagination.hasNextPage && ' (มีรายการเพิ่มเติม)'}
        </div>
      )}

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearch={handleAdvancedSearch}
        searchType="loans"
        initialFilters={{ status: statusFilter, search: searchTerm }}
        savedSearches={savedSearches}
        onSaveSearch={handleSaveSearch}
        onLoadSearch={handleLoadSearch}
        onDeleteSearch={deleteSavedSearch}
      />
    </div>
  );
};

export default LoanRequestList;