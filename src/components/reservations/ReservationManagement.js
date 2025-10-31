import React, { useState, useEffect } from 'react';
import ReservationList from './ReservationList';
import { useReservationStats } from '../../hooks/useReservations';
import { 
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_COLORS
} from '../../types/reservation';

/**
 * ReservationManagement Component
 * หน้าจัดการการจองสำหรับ admin
 */
const ReservationManagement = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  const { stats, loading: statsLoading, refresh: refreshStats } = useReservationStats();

  // Auto-refresh stats when component mounts
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Get status color class
  const getStatusColorClass = (status) => {
    const colorMap = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return colorMap[RESERVATION_STATUS_COLORS[status]] || colorMap.gray;
  };

  // Handle date filter change
  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateFilter({
      startDate: '',
      endDate: ''
    });
  };

  // Get filters for current tab
  const getFiltersForTab = () => {
    const filters = {};

    // Add status filter
    if (activeTab !== 'all') {
      filters.status = activeTab;
    }

    // Add date filters
    if (dateFilter.startDate) {
      filters.startDate = new Date(dateFilter.startDate);
    }
    if (dateFilter.endDate) {
      filters.endDate = new Date(dateFilter.endDate);
    }

    return filters;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          จัดการการจองอุปกรณ์
        </h2>
        <p className="text-gray-600">
          อนุมัติ ปฏิเสธ และจัดการการจองอุปกรณ์ทั้งหมด
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">การจองทั้งหมด</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">รอการอนุมัติ</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">อนุมัติแล้ว</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">เสร็จสิ้น</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ตัวกรอง</h3>
        
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ทั้งหมด ({stats.total})
          </button>
          {Object.entries(RESERVATION_STATUS_LABELS).map(([status, label]) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === status
                  ? getStatusColorClass(status)
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label} ({stats[status] || 0})
            </button>
          ))}
        </div>

        {/* Date Range Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={dateFilter.startDate}
              onChange={handleDateFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={dateFilter.endDate}
              onChange={handleDateFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearDateFilter}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>
      </div>

      {/* Reservation List */}
      <ReservationList
        isAdmin={true}
        filters={getFiltersForTab()}
        key={`${activeTab}-${dateFilter.startDate}-${dateFilter.endDate}`}
      />
    </div>
  );
};

export default ReservationManagement;