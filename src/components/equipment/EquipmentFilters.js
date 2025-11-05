import { useState, useEffect } from 'react';
import { 
  EQUIPMENT_MANAGEMENT_STATUS_LABELS 
} from '../../types/equipmentManagement';
import { useEquipmentCategories } from '../../hooks/useEquipmentCategories';
import { FunnelIcon, XMarkIcon, BookmarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import FilterPresets from './FilterPresets';
import DateRangePicker from './DateRangePicker';
import PriceRangeSlider from './PriceRangeSlider';

const EquipmentFilters = ({ 
  filters, 
  onFiltersChange, 
  onReset,
  loading = false,
  showPresets = true,
  showAdvancedFilters = true,
  className = ""
}) => {
  const { categories, loading: categoriesLoading } = useEquipmentCategories();
  
  const [localFilters, setLocalFilters] = useState({
    search: '',
    categories: [],
    statuses: [],
    dateRange: { start: '', end: '' },
    priceRange: { min: '', max: '' },
    location: { building: '', floor: '', room: '' },
    responsiblePerson: '',
    tags: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    ...filters
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [filterPresets, setFilterPresets] = useState([]);
  const [activePreset, setActivePreset] = useState(null);

  // Load filter presets from localStorage
  useEffect(() => {
    const savedPresets = JSON.parse(localStorage.getItem('equipment-filter-presets') || '[]');
    setFilterPresets(savedPresets);
  }, []);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      ...filters
    }));
  }, [filters]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    const newFilters = {
      ...localFilters,
      [field]: value
    };
    setLocalFilters(newFilters);
    setActivePreset(null); // Clear active preset when filters change
    
    // Apply filters immediately for search
    if (field === 'search') {
      onFiltersChange(newFilters);
    }
  };

  // Handle array field changes (categories, statuses, tags)
  const handleArrayChange = (field, value, checked) => {
    const currentArray = localFilters[field] || [];
    const newArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    handleInputChange(field, newArray);
  };

  // Handle nested object changes (location, dateRange, priceRange)
  const handleNestedChange = (parent, child, value) => {
    const newNestedValue = {
      ...localFilters[parent],
      [child]: value
    };
    handleInputChange(parent, newNestedValue);
  };

  // Apply filters
  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  // Reset all filters
  const handleReset = () => {
    const resetFilters = {
      search: '',
      categories: [],
      statuses: [],
      dateRange: { start: '', end: '' },
      priceRange: { min: '', max: '' },
      location: { building: '', floor: '', room: '' },
      responsiblePerson: '',
      tags: [],
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    };
    setLocalFilters(resetFilters);
    setActivePreset(null);
    onFiltersChange(resetFilters);
    if (onReset) {
      onReset();
    }
  };

  // Check if filters are active
  const hasActiveFilters = () => {
    return localFilters.search ||
           localFilters.categories.length > 0 ||
           localFilters.statuses.length > 0 ||
           localFilters.dateRange.start ||
           localFilters.dateRange.end ||
           localFilters.priceRange.min ||
           localFilters.priceRange.max ||
           localFilters.location.building ||
           localFilters.location.floor ||
           localFilters.location.room ||
           localFilters.responsiblePerson ||
           localFilters.tags.length > 0;
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.search) count++;
    if (localFilters.categories.length > 0) count++;
    if (localFilters.statuses.length > 0) count++;
    if (localFilters.dateRange.start || localFilters.dateRange.end) count++;
    if (localFilters.priceRange.min || localFilters.priceRange.max) count++;
    if (localFilters.location.building || localFilters.location.floor || localFilters.location.room) count++;
    if (localFilters.responsiblePerson) count++;
    if (localFilters.tags.length > 0) count++;
    return count;
  };

  // Save filter preset
  const saveFilterPreset = (name) => {
    const newPreset = {
      id: Date.now().toString(),
      name: name.trim(),
      filters: { ...localFilters },
      createdAt: new Date().toISOString()
    };
    
    const newPresets = [...filterPresets, newPreset];
    setFilterPresets(newPresets);
    localStorage.setItem('equipment-filter-presets', JSON.stringify(newPresets));
    setActivePreset(newPreset.id);
  };

  // Load filter preset
  const loadFilterPreset = (preset) => {
    setLocalFilters(preset.filters);
    setActivePreset(preset.id);
    onFiltersChange(preset.filters);
  };

  // Delete filter preset
  const deleteFilterPreset = (presetId) => {
    const newPresets = filterPresets.filter(preset => preset.id !== presetId);
    setFilterPresets(newPresets);
    localStorage.setItem('equipment-filter-presets', JSON.stringify(newPresets));
    if (activePreset === presetId) {
      setActivePreset(null);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-4">
        {/* Filter Presets */}
        {showPresets && filterPresets.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">ตัวกรองที่บันทึกไว้</h4>
              <button
                onClick={() => setShowPresetModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                จัดการ
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterPresets.slice(0, 5).map(preset => (
                <button
                  key={preset.id}
                  onClick={() => loadFilterPreset(preset)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    activePreset === preset.id
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <BookmarkIcon className="h-3 w-3 inline mr-1" />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="ค้นหาอุปกรณ์ (ชื่อ, ยี่ห้อ, รุ่น, หมายเลขครุภัณฑ์)..."
                value={localFilters.search}
                onChange={(e) => handleInputChange('search', e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              {localFilters.search && (
                <button
                  onClick={() => handleInputChange('search', '')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            {/* Quick Filters */}
            <div className="flex space-x-2">
              {/* Category Quick Filter */}
              <select
                value={localFilters.categories[0] || ''}
                onChange={(e) => handleInputChange('categories', e.target.value ? [e.target.value] : [])}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading || categoriesLoading}
              >
                <option value="">ทุกประเภท</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Status Quick Filter */}
              <select
                value={localFilters.statuses[0] || ''}
                onChange={(e) => handleInputChange('statuses', e.target.value ? [e.target.value] : [])}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">ทุกสถานะ</option>
                {Object.entries(EQUIPMENT_MANAGEMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Advanced Filters Toggle */}
            {showAdvancedFilters && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  hasActiveFilters() 
                    ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                ตัวกรองขั้นสูง
                {hasActiveFilters() && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getActiveFilterCount()}
                  </span>
                )}
                <svg className={`ml-2 w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && showAdvancedFilters && (
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-6">
              {/* Categories - Multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทอุปกรณ์ (เลือกได้หลายรายการ)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {categoriesLoading ? (
                    <div className="col-span-full text-center text-gray-500 py-2">กำลังโหลด...</div>
                  ) : (
                    categories.map(category => (
                      <label key={category.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={localFilters.categories.includes(category.id)}
                          onChange={(e) => handleArrayChange('categories', category.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={loading}
                        />
                        <span className="text-sm text-gray-700 truncate">{category.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Statuses - Multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะ (เลือกได้หลายรายการ)
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(EQUIPMENT_MANAGEMENT_STATUS_LABELS).map(([value, label]) => (
                    <label key={value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={localFilters.statuses.includes(value)}
                        onChange={(e) => handleArrayChange('statuses', value, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={loading}
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ช่วงวันที่ซื้อ
                </label>
                <DateRangePicker
                  startDate={localFilters.dateRange.start}
                  endDate={localFilters.dateRange.end}
                  onStartDateChange={(date) => handleNestedChange('dateRange', 'start', date)}
                  onEndDateChange={(date) => handleNestedChange('dateRange', 'end', date)}
                  disabled={loading}
                />
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ช่วงราคา (บาท)
                </label>
                <PriceRangeSlider
                  min={localFilters.priceRange.min}
                  max={localFilters.priceRange.max}
                  onMinChange={(value) => handleNestedChange('priceRange', 'min', value)}
                  onMaxChange={(value) => handleNestedChange('priceRange', 'max', value)}
                  disabled={loading}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานที่
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="อาคาร"
                    value={localFilters.location.building}
                    onChange={(e) => handleNestedChange('location', 'building', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                  <input
                    type="text"
                    placeholder="ชั้น"
                    value={localFilters.location.floor}
                    onChange={(e) => handleNestedChange('location', 'floor', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                  <input
                    type="text"
                    placeholder="ห้อง"
                    value={localFilters.location.room}
                    onChange={(e) => handleNestedChange('location', 'room', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เรียงตาม
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={localFilters.sortBy}
                    onChange={(e) => handleInputChange('sortBy', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="updatedAt">วันที่อัปเดต</option>
                    <option value="createdAt">วันที่สร้าง</option>
                    <option value="name">ชื่อ</option>
                    <option value="brand">ยี่ห้อ</option>
                    <option value="equipmentNumber">หมายเลขครุภัณฑ์</option>
                    <option value="purchaseDate">วันที่ซื้อ</option>
                    <option value="purchasePrice">ราคา</option>
                  </select>
                  <select
                    value={localFilters.sortOrder}
                    onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="desc">มากไปน้อย / ล่าสุด</option>
                    <option value="asc">น้อยไปมาก / เก่าสุด</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {hasActiveFilters() && (
                  <span>
                    กำลังใช้ตัวกรอง {getActiveFilterCount()} รายการ
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* Save Preset Button */}
                {hasActiveFilters() && (
                  <button
                    onClick={() => {
                      const name = prompt('ชื่อตัวกรอง:');
                      if (name) saveFilterPreset(name);
                    }}
                    className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <BookmarkIcon className="h-4 w-4 inline mr-1" />
                    บันทึกตัวกรอง
                  </button>
                )}
                
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
                    'ใช้ตัวกรอง'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Presets Modal */}
      {showPresetModal && (
        <FilterPresets
          presets={filterPresets}
          onLoad={loadFilterPreset}
          onDelete={deleteFilterPreset}
          onClose={() => setShowPresetModal(false)}
        />
      )}
    </div>
  );
};

export default EquipmentFilters;