import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoanRequests } from '../../hooks/useLoanRequests';
import { LOAN_REQUEST_STATUS_LABELS } from '../../types/loanRequest';
import LoanRequestCard from './LoanRequestCard';
import BulkActions from '../common/BulkActions';
import AdvancedSearchModal from '../search/AdvancedSearchModal';
import { useSavedSearches } from '../../hooks/useSavedSearches';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import Layout from '../layout/Layout';

const LoanRequestList = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const savedSearchesHook = useSavedSearches('loans');
  const savedSearches = savedSearchesHook?.savedSearches || [];
  const saveSearch = savedSearchesHook?.saveSearch || (async () => {});
  const deleteSavedSearch = savedSearchesHook?.deleteSavedSearch || (async () => {});

  const {
    loanRequests,
    loading,
    error,
    pagination,
    updateFilters,
    loadMore,
    approveLoanRequest,
    rejectLoanRequest,
    markAsPickedUp,
    markAsReturned,
    refresh
  } = useLoanRequests({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 10
  });

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      updateFilters({ status: statusFilter, search: searchTerm });
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [statusFilter, searchTerm, updateFilters]);

  const handleApprove = async (requestId) => {
    try {
      await approveLoanRequest(requestId, user.uid);
      alert('อนุมัติคำขอยืมเรียบร้อยแล้ว');
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleReject = async (requestId, rejectionReason) => {
    try {
      await rejectLoanRequest(requestId, rejectionReason, user.uid);
      alert('ปฏิเสธคำขอยืมเรียบร้อยแล้ว');
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleMarkAsPickedUp = async (requestId) => {
    try {
      await markAsPickedUp(requestId, user.uid);
      alert('บันทึกการรับอุปกรณ์เรียบร้อยแล้ว');
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleMarkAsReturned = async (requestId, returnData = {}) => {
    try {
      await markAsReturned(requestId, user.uid, returnData);
      alert('บันทึกการคืนอุปกรณ์เรียบร้อยแล้ว');
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleLoadMore = () => {
    if (!loading && pagination.hasNextPage) {
      loadMore();
    }
  };

  const statusCounts = useMemo(() => {
    const counts = { all: loanRequests.length };
    Object.keys(LOAN_REQUEST_STATUS_LABELS).forEach(status => {
      counts[status] = loanRequests.filter(r => r.status === status).length;
    });
    return counts;
  }, [loanRequests]);

  const handleSelectItem = (requestId, isSelected) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, requestId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== requestId));
    }
  };

  const handleSelectAll = () => setSelectedItems(loanRequests.map(r => r.id));
  const handleDeselectAll = () => setSelectedItems([]);

  const handleBulkAction = async (actionId, itemIds, actionData) => {
    setBulkActionLoading(true);
    try {
      if (actionId === 'approve') {
        for (const itemId of itemIds) {
          await approveLoanRequest(itemId, user.uid);
        }
      } else if (actionId === 'reject') {
        if (!actionData.reason) throw new Error('กรุณาระบุเหตุผลในการปฏิเสธ');
        for (const itemId of itemIds) {
          await rejectLoanRequest(itemId, actionData.reason, user.uid);
        }
      } else if (actionId === 'export') {
        await exportSelectedLoans(itemIds);
      }
      setSelectedItems([]);
      alert('ดำเนินการเรียบร้อยแล้ว (' + itemIds.length + ' รายการ)');
    } catch (err) {
      console.error('Bulk action error:', err);
      throw err;
    } finally {
      setBulkActionLoading(false);
    }
  };


  const exportSelectedLoans = async (itemIds) => {
    try {
      const selectedLoans = loanRequests.filter(r => itemIds.includes(r.id));
      const csvData = selectedLoans.map(request => ({
        'วันที่ขอยืม': request.createdAt?.toDate?.().toLocaleDateString('th-TH') || '-',
        'ชื่ออุปกรณ์': request.equipment?.name || request._equipmentName || '-',
        'ผู้ขอยืม': request.user?.displayName || request._userName || '-',
        'วันที่ยืม': request.borrowDate?.toDate?.().toLocaleDateString('th-TH') || '-',
        'วันที่คืน': request.expectedReturnDate?.toDate?.().toLocaleDateString('th-TH') || '-',
        'สถานะ': LOAN_REQUEST_STATUS_LABELS[request.status] || '-',
        'วัตถุประสงค์': request.purpose || '-'
      }));
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(h => '"' + (row[h] || '') + '"').join(','))
      ].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'loan-requests-' + new Date().toISOString().split('T')[0] + '.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
      throw new Error('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  const handleAdvancedSearch = (advancedFilters) => updateFilters(advancedFilters);
  const handleSaveSearch = async (searchData) => {
    try { await saveSearch(searchData); } catch (err) { console.error('Error saving search:', err); }
  };
  const handleLoadSearch = (savedSearch) => updateFilters(savedSearch.filters);

  const statusFilters = [
    { key: '', label: 'ทั้งหมด', count: statusCounts.all },
    ...Object.entries(LOAN_REQUEST_STATUS_LABELS).map(([status, label]) => ({
      key: status, label, count: statusCounts[status] || 0
    }))
  ];

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">จัดการคำขอยืม</h2>
            <p className="text-sm text-gray-600 hidden sm:block">อนุมัติหรือปฏิเสธคำขอยืมอุปกรณ์จากผู้ใช้</p>
          </div>
          <button onClick={refresh} disabled={loading} className="self-end sm:self-auto inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <svg className={'w-4 h-4 mr-1.5 ' + (loading ? 'animate-spin' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            รีเฟรช
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-3 sm:p-4 border-b border-gray-100">
            <div className="flex gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input type="text" placeholder="ค้นหา..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-9 sm:pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <button onClick={() => setShowAdvancedSearch(true)} className="hidden sm:inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                ค้นหาขั้นสูง
              </button>
              <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="sm:hidden inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
          </div>


          <div className="hidden sm:flex flex-wrap gap-2 p-3 sm:p-4">
            {statusFilters.map(({ key, label, count }) => (
              <button key={key} onClick={() => setStatusFilter(key)} className={'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' + (statusFilter === key ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                {label}
                <span className={'ml-1.5 px-1.5 py-0.5 rounded-full text-xs ' + (statusFilter === key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600')}>{count}</span>
              </button>
            ))}
          </div>

          {showMobileFilters && (
            <div className="sm:hidden p-3 border-t border-gray-100 space-y-3">
              <div className="flex flex-wrap gap-2">
                {statusFilters.map(({ key, label, count }) => (
                  <button key={key} onClick={() => { setStatusFilter(key); setShowMobileFilters(false); }} className={'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ' + (statusFilter === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700')}>
                    {label} ({count})
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAdvancedSearch(true)} className="w-full inline-flex items-center justify-center px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                ค้นหาขั้นสูง
              </button>
            </div>
          )}
        </div>

        {selectedItems.length > 0 && (
          <BulkActions selectedItems={selectedItems} onSelectAll={handleSelectAll} onDeselectAll={handleDeselectAll} totalItems={loanRequests.length} itemType="loans" onBulkAction={handleBulkAction} loading={bulkActionLoading} />
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button onClick={refresh} className="mt-2 text-sm font-medium text-red-800 hover:text-red-600">ลองใหม่อีกครั้ง</button>
              </div>
            </div>
          </div>
        )}

        {loading && loanRequests.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!loading && loanRequests.length === 0 && !error && (
          <EmptyState
            icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            title="ไม่มีคำขอยืม"
            description={statusFilter || searchTerm ? "ไม่พบคำขอยืมที่ตรงกับเงื่อนไขการค้นหา" : "ยังไม่มีคำขอยืมอุปกรณ์ในระบบ"}
            action={(statusFilter || searchTerm) ? <button onClick={() => { setStatusFilter(''); setSearchTerm(''); }} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors">ล้างตัวกรอง</button> : null}
          />
        )}


        {!loading && loanRequests.length > 0 && (
          <div className="space-y-3">
            {loanRequests.map((request) => (
              <LoanRequestCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
                onMarkAsPickedUp={handleMarkAsPickedUp}
                onMarkAsReturned={handleMarkAsReturned}
                isSelectable={true}
                isSelected={selectedItems.includes(request.id)}
                onSelect={(isSelected) => handleSelectItem(request.id, isSelected)}
              />
            ))}

            {pagination.hasNextPage && (
              <div className="text-center pt-4">
                <button onClick={handleLoadMore} disabled={loading} className="inline-flex items-center px-5 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
                      <svg className="ml-1.5 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {loanRequests.length > 0 && (
          <div className="text-center text-sm text-gray-500 pb-2">
            แสดง {loanRequests.length} รายการ{pagination.hasNextPage && ' (มีรายการเพิ่มเติม)'}
          </div>
        )}

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
    </Layout>
  );
};

export default LoanRequestList;
