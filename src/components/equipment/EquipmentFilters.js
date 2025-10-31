import { useState, useEffect } from 'react';
import { 
  EQUIPMENT_CATEGORIES, 
  EQUIPMENT_CATEGORY_LABELS,
  EQUIPMENT_STATUS,
  EQUIPMENT_STATUS_LABELS 
} from '../../types/equipment';
import AdvancedSearchModal from '../search/AdvancedSearchModal';
import { useSavedSearches } from '../../hooks/useSavedSearches';

const EquipmentFilters = ({ 
  filters, 
  onFiltersChange, 
  onReset,
  loading = false 
}) => {
  const [localFilters, setLocalFilters] = useState({
    search: '',
    category: '',
    status: '',
    location: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...filters
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  const {
    savedSearches,
    saveSearch,
    deleteSavedSearch,
    loading: savedSearchLoading
  } = useSavedSearches('equipment');

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      ...filters
    }));
  }, [filters]);

  const handleInputChange = (field, value) => {
    const newFilters = {
      ...localFilters,
      [field]: value
    };
    setLocalFilters(newFilters);
    
    // Apply filters immediately for search
    if (field === 'search') {
      onFiltersChange(newFilters);
    }
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      category: '',
      status: '',
      location: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    if (onReset) {
      onReset();
    }
  };

  const hasActiveFilters = localFilters.category || localFilters.status || localFilters.location || localFilters.search;

  const handleAdvancedSearch = (advancedFilters) => {
    setLocalFilters(advancedFilters);
    onFiltersChange(advancedFilters);
  };

  const handleSaveSearch = async (searchData) => {
    try {
      await saveSearch(searchData);
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const handleLoadSearch = (savedSearch) => {
    const searchFilters = savedSearch.filters;
    setLocalFilters(searchFilters);
    onFiltersChange(searchFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="ค้นหาอุปกรณ์ (ชื่อ, ยี่ห้อ, รุ่น, รหัส)..."
                value={localFilters.search}
                onChange={(e) => handleInputChange('search', e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              {localFilters.search && (
                <button
                  onClick={() => handleInputChange('search', '')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            {/* Toggle Filters Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              ตัวกรอง
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {[localFilters.category, localFilters.status, localFilters.location].filter(Boolean).length}
                </span>
              )}
              <svg className={`ml-2 w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

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
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภทอุปกรณ์
                </label>
                <select
                  value={localFilters.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">ทั้งหมด</option>
                  {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สถานะ
                </label>
                <select
                  value={localFilters.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">ทั้งหมด</option>
                  {Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สถานที่
                </label>
                <input
                  type="text"
                  placeholder="ค้นหาสถานที่..."
                  value={localFilters.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เรียงตาม
                </label>
                <div className="flex space-x-2">
                  <select
                    value={localFilters.sortBy}
                    onChange={(e) => handleInputChange('sortBy', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="createdAt">วันที่สร้าง</option>
                    <option value="name">ชื่อ</option>
                    <option value="brand">ยี่ห้อ</option>
                    <option value="category">ประเภท</option>
                    <option value="status">สถานะ</option>
                  </select>
                  <select
                    value={localFilters.sortOrder}
                    onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="desc">ล่าสุด</option>
                    <option value="asc">เก่าสุด</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {hasActiveFilters && (
                  <span>
                    กำลังใช้ตัวกรอง: {[
                      localFilters.category && EQUIPMENT_CATEGORY_LABELS[localFilters.category],
                      localFilters.status && EQUIPMENT_STATUS_LABELS[localFilters.status],
                      localFilters.location && `สถานที่: ${localFilters.location}`
                    ].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  รีเซ็ต
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังค้นหา...
                    </>
                  ) : (
                    'ค้นหา'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearch={handleAdvancedSearch}
        searchType="equipment"
        initialFilters={localFilters}
        savedSearches={savedSearches}
        onSaveSearch={handleSaveSearch}
        onLoadSearch={handleLoadSearch}
        onDeleteSearch={deleteSavedSearch}
      />
    </div>
  );
};

export default EquipmentFilters;