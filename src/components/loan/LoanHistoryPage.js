/**
 * LoanHistoryPage Component
 * Displays user's loan history with filtering, search, and statistics
 * 
 * Feature: user-status-system-improvement
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useLoanHistory, HISTORY_STATUSES } from '../../hooks/useLoanHistory';
import { useEquipmentCategories } from '../../hooks/useEquipmentCategories';
import { Layout } from '../layout';
import LoanStatusBadge from './LoanStatusBadge';
import { LOAN_REQUEST_STATUS_LABELS } from '../../types/loanRequest';

/**
 * Format date for display
 */
const formatDate = (date) => {
  if (!date) return '-';
  try {
    const d = date?.toDate?.() || new Date(date);
    // Check if date is valid
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (err) {
    console.warn('Error formatting date:', err);
    return '-';
  }
};

/**
 * Format date and time for display
 */
const formatDateTime = (date) => {
  if (!date) return '-';
  try {
    const d = date?.toDate?.() || new Date(date);
    // Check if date is valid
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (err) {
    console.warn('Error formatting datetime:', err);
    return '-';
  }
};

/**
 * Calculate loan duration in days
 */
const calculateDuration = (borrowDate, returnDate) => {
  if (!borrowDate) return '-';
  try {
    const borrow = borrowDate?.toDate?.() || new Date(borrowDate);
    const returnD = returnDate?.toDate?.() || (returnDate ? new Date(returnDate) : new Date());
    // Check if dates are valid
    if (isNaN(borrow.getTime()) || isNaN(returnD.getTime())) return '-';
    const diffMs = returnD.getTime() - borrow.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return `${Math.max(1, diffDays)} วัน`;
  } catch (err) {
    console.warn('Error calculating duration:', err);
    return '-';
  }
};

/**
 * Statistics Card Component
 */
const StatCard = ({ icon: Icon, label, value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center">
        <div className={`p-1.5 sm:p-2 rounded-lg ${colorClasses[color]} mx-auto sm:mx-0 mb-1 sm:mb-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="sm:ml-3 text-center sm:text-left">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-sm sm:text-xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Loan History Item Component
 */
const LoanHistoryItem = ({ item }) => {
  // Ensure all values are strings to prevent React error #31
  const rawEquipmentName = item.equipmentName || item._equipmentName || item.equipmentSnapshot?.name;
  const equipmentName = typeof rawEquipmentName === 'string' ? rawEquipmentName : 'ไม่ทราบชื่ออุปกรณ์';
  const rawSerialNumber = item.equipmentSnapshot?.serialNumber || item.equipmentSnapshot?.equipmentNumber;
  const serialNumber = typeof rawSerialNumber === 'string' ? rawSerialNumber : '-';
  // Ensure category is a string, not an object
  const rawCategory = item.equipmentCategory || item._equipmentCategory || item.equipmentSnapshot?.category;
  const category = typeof rawCategory === 'object' ? (rawCategory?.name || '-') : (typeof rawCategory === 'string' ? rawCategory : '-');
  // Ensure status is a string
  const status = typeof item.status === 'string' ? item.status : 'pending';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {equipmentName}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              หมายเลข: {serialNumber}
            </p>
          </div>
          <LoanStatusBadge status={status} size="sm" />
        </div>

        {/* Dates */}
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="text-gray-400">วันที่ยืม:</span>{' '}
            {formatDate(item.borrowDate)}
          </div>
          <div>
            <span className="text-gray-400">กำหนดคืน:</span>{' '}
            {formatDate(item.expectedReturnDate)}
          </div>
        </div>

        {/* Pickup and Return Times */}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {item.pickedUpAt && (
            <div className="flex items-center text-blue-600">
              <ClockIcon className="w-3.5 h-3.5 mr-1" />
              <span className="text-gray-400 mr-1">รับอุปกรณ์:</span>
              {formatDateTime(item.pickedUpAt)}
            </div>
          )}
          {item.actualReturnDate && (
            <div className="flex items-center text-green-600">
              <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
              <span className="text-gray-400 mr-1">คืนอุปกรณ์:</span>
              {formatDateTime(item.actualReturnDate)}
            </div>
          )}
        </div>

        {/* Duration and Category */}
        <div className="mt-2 flex items-center gap-4 text-xs">
          <span className="inline-flex items-center text-gray-500">
            <ClockIcon className="w-3.5 h-3.5 mr-1" />
            {calculateDuration(item.borrowDate, item.actualReturnDate || item.expectedReturnDate)}
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">{category}</span>
        </div>

        {/* Purpose */}
        {item.purpose && typeof item.purpose === 'string' && (
          <p className="mt-2 text-xs text-gray-500 line-clamp-1">
            วัตถุประสงค์: {item.purpose}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Filter Panel Component
 */
const FilterPanel = ({ filters, onFilterChange, onReset, categories }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <FunnelIcon className="w-4 h-4 mr-1.5" />
          ตัวกรอง
        </h3>
        <button
          onClick={onReset}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          รีเซ็ต
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Date Range */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">ช่วงวันที่</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.dateRange?.start || ''}
              onChange={(e) => onFilterChange({
                dateRange: { ...filters.dateRange, start: e.target.value }
              })}
              className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="date"
              value={filters.dateRange?.end || ''}
              onChange={(e) => onFilterChange({
                dateRange: { ...filters.dateRange, end: e.target.value }
              })}
              className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">หมวดหมู่</label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">ทั้งหมด</option>
            {Array.isArray(categories) && categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {typeof cat.name === 'string' ? cat.name : String(cat.name || '')}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">สถานะ</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">ทั้งหมด</option>
            {HISTORY_STATUSES.map(status => (
              <option key={status} value={status}>
                {LOAN_REQUEST_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// จำนวนรายการต่อหน้า
const ITEMS_PER_PAGE = 5;

/**
 * LoanHistoryPage Component
 */
const LoanHistoryPage = () => {
  const { 
    history, 
    stats, 
    loading, 
    error, 
    filters, 
    setFilters, 
    resetFilters, 
    search, 
    refresh 
  } = useLoanHistory();
  
  const { categories } = useEquipmentCategories();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const paginatedHistory = history.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (e) => {
    e.preventDefault();
    search(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    search('');
  };

  return (
    <Layout>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ประวัติการยืม-คืน</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          ดูประวัติการยืมและคืนอุปกรณ์ทั้งหมดของคุณ
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          icon={ChartBarIcon}
          label="ยืมทั้งหมด"
          value={`${stats.totalLoans}`}
          color="blue"
        />
        <StatCard
          icon={ClockIcon}
          label="เฉลี่ย"
          value={`${stats.averageDuration} วัน`}
          color="purple"
        />
        <StatCard
          icon={CheckCircleIcon}
          label="ตรงเวลา"
          value={`${stats.onTimeReturnRate}%`}
          color="green"
        />
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่ออุปกรณ์หรือหมายเลข..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
            showFilters
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="w-4 h-4 mr-2" />
          ตัวกรอง
        </button>

        {/* Refresh */}
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={() => { resetFilters(); setCurrentPage(1); }}
          categories={categories}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && history.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">ไม่พบประวัติการยืม</h3>
          <p className="text-sm text-gray-500">
            {filters.search || filters.category || filters.status || filters.dateRange
              ? 'ลองปรับตัวกรองหรือคำค้นหาใหม่'
              : 'คุณยังไม่มีประวัติการยืมอุปกรณ์'}
          </p>
        </div>
      )}

      {/* History List */}
      {!loading && paginatedHistory.length > 0 && (
        <div className="space-y-3">
          {paginatedHistory.map(item => (
            <LoanHistoryItem key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {history.length > ITEMS_PER_PAGE && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            แสดง {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, history.length)} จาก {history.length} รายการ
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
      {history.length > 0 && history.length <= ITEMS_PER_PAGE && (
        <div className="mt-4 text-center text-sm text-gray-500">
          แสดง {history.length} รายการ
        </div>
      )}
    </div>
    </Layout>
  );
};

export default LoanHistoryPage;
