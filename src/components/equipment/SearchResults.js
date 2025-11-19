import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowsUpDownIcon,
  Bars3Icon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import EquipmentGrid from './EquipmentGrid';
import EquipmentListView from './EquipmentListView';
import LoadingSpinner from '../common/LoadingSpinner';

const SearchResults = ({
  results = [],
  loading = false,
  error = null,
  totalCount = 0,
  currentPage = 1,
  totalPages = 1,
  pageSize = 20,
  sortBy = 'updatedAt',
  sortOrder = 'desc',
  viewMode = 'grid',
  onPageChange,
  onSortChange,
  onViewModeChange,
  onLoadMore,
  onEdit,
  onDelete,
  onView,
  showPagination = true,
  showSort = true,
  showViewToggle = true,
  showLoadMore = false,
  className = ""
}) => {
  const [isInfiniteScrollEnabled, setIsInfiniteScrollEnabled] = useState(false);

  // Memoize sort options to avoid recreating on every render
  const sortOptions = useMemo(() => [
    { value: 'updatedAt', label: 'วันที่อัปเดต', icon: '📅' },
    { value: 'createdAt', label: 'วันที่สร้าง', icon: '📅' },
    { value: 'name', label: 'ชื่อ', icon: '🔤' },
    { value: 'brand', label: 'ยี่ห้อ', icon: '🏢' },
    { value: 'equipmentNumber', label: 'หมายเลขครุภัณฑ์', icon: '🔢' },
    { value: 'purchaseDate', label: 'วันที่ซื้อ', icon: '💰' },
    { value: 'purchasePrice', label: 'ราคา', icon: '💰' }
  ], []);

  // Memoize event handlers
  const handleSortChange = useCallback((field) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newOrder);
  }, [sortBy, sortOrder, onSortChange]);

  // Memoize page number generation
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  // Infinite scroll handler
  useEffect(() => {
    if (!isInfiniteScrollEnabled || !showLoadMore) return;

    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        if (!loading && currentPage < totalPages) {
          onLoadMore();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInfiniteScrollEnabled, loading, currentPage, totalPages, onLoadMore, showLoadMore]);

  // Memoize results summary
  const resultsSummary = useMemo(() => {
    if (loading && results.length === 0) return 'กำลังค้นหา...';
    if (error) return 'เกิดข้อผิดพลาดในการค้นหา';
    if (results.length === 0) return 'ไม่พบผลลัพธ์';
    
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    
    return `แสดง ${start.toLocaleString()}-${end.toLocaleString()} จาก ${totalCount.toLocaleString()} รายการ`;
  }, [loading, error, results.length, currentPage, pageSize, totalCount]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          {/* Results Summary */}
          <div className="text-sm text-gray-600">
            {resultsSummary}
          </div>
          
          {/* Loading Indicator */}
          {loading && (
            <LoadingSpinner size="sm" />
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Sort Options */}
          {showSort && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">เรียงตาม:</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  onSortChange(field, order);
                }}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                {sortOptions.map(option => (
                  <optgroup key={option.value} label={option.label}>
                    <option value={`${option.value}-desc`}>
                      {option.label} (มากไปน้อย/ล่าสุด)
                    </option>
                    <option value={`${option.value}-asc`}>
                      {option.label} (น้อยไปมาก/เก่าสุด)
                    </option>
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle */}
          {showViewToggle && (
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="มุมมองแบบกริด"
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="มุมมองแบบรายการ"
              >
                <Bars3Icon className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Infinite Scroll Toggle */}
          {showLoadMore && (
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={isInfiniteScrollEnabled}
                onChange={(e) => setIsInfiniteScrollEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-600">เลื่อนอัตโนมัติ</span>
            </label>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
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
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && results.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบผลลัพธ์</h3>
          <p className="mt-1 text-sm text-gray-500">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            <EquipmentGrid
              equipment={results}
              loading={loading}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSortChange}
            />
          ) : (
            <EquipmentListView
              equipment={results}
              loading={loading}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSortChange}
            />
          )}
        </>
      )}

      {/* Load More Button */}
      {showLoadMore && !isInfiniteScrollEnabled && currentPage < totalPages && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">กำลังโหลด...</span>
              </>
            ) : (
              <>
                <span>โหลดเพิ่มเติม</span>
                <span className="ml-2 text-gray-500">
                  ({totalCount - (currentPage * pageSize)} รายการ)
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Pagination */}
      {showPagination && !showLoadMore && totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg border border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ถัดไป
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                แสดง <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> ถึง{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalCount)}
                </span>{' '}
                จาก <span className="font-medium">{totalCount.toLocaleString()}</span> รายการ
              </p>
            </div>
            
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {/* First Page */}
                <button
                  onClick={() => onPageChange(1)}
                  disabled={currentPage <= 1 || loading}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="หน้าแรก"
                >
                  <ChevronDoubleLeftIcon className="h-5 w-5" />
                </button>
                
                {/* Previous Page */}
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="ก่อนหน้า"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                {/* Page Numbers */}
                {pageNumbers.map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    disabled={typeof page !== 'number' || loading}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    } ${typeof page !== 'number' ? 'cursor-default' : 'cursor-pointer'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {page}
                  </button>
                ))}
                
                {/* Next Page */}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="ถัดไป"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
                
                {/* Last Page */}
                <button
                  onClick={() => onPageChange(totalPages)}
                  disabled={currentPage >= totalPages || loading}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="หน้าสุดท้าย"
                >
                  <ChevronDoubleRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Infinite Scroll Loading */}
      {isInfiniteScrollEnabled && loading && currentPage > 1 && (
        <div className="text-center py-4">
          <LoadingSpinner size="md" />
          <p className="mt-2 text-sm text-gray-500">กำลังโหลดเพิ่มเติม...</p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;