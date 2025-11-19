import { useState, useEffect } from 'react';
import { 
  EQUIPMENT_STATUS_LABELS
} from '../../types/equipment';
import { LOAN_REQUEST_STATUS_LABELS } from '../../types/loanRequest';
import { RESERVATION_STATUS_LABELS } from '../../types/reservation';
import { useCategories } from '../../contexts/EquipmentCategoriesContext';

const AdvancedSearchModal = ({ 
  isOpen, 
  onClose, 
  onSearch, 
  searchType = 'equipment', // equipment, loans, reservations, reports
  initialFilters = {},
  savedSearches = [],
  onSaveSearch,
  onLoadSearch,
  onDeleteSearch
}) => {
  const [filters, setFilters] = useState({
    // Common filters
    search: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    
    // Equipment specific
    category: '',
    status: '',
    location: '',
    brand: '',
    model: '',
    serialNumber: '',
    
    // Loan specific
    loanStatus: '',
    userId: '',
    equipmentId: '',
    purpose: '',
    overdue: false,
    
    // Reservation specific
    reservationStatus: '',
    startTime: '',
    endTime: '',
    
    // Report specific
    reportType: '',
    groupBy: '',
    includeStats: true,
    
    ...initialFilters
  });

  const [searchName, setSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('filters');
  
  // Load categories from context
  const { categories, loading: categoriesLoading } = useCategories();

  useEffect(() => {
    if (isOpen) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }
  }, [isOpen, initialFilters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    // Remove empty filters
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== false && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    onSearch(cleanFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      category: '',
      status: '',
      location: '',
      brand: '',
      model: '',
      serialNumber: '',
      loanStatus: '',
      userId: '',
      equipmentId: '',
      purpose: '',
      overdue: false,
      reservationStatus: '',
      startTime: '',
      endTime: '',
      reportType: '',
      groupBy: '',
      includeStats: true
    };
    setFilters(resetFilters);
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      alert('กรุณาใส่ชื่อการค้นหา');
      return;
    }

    const searchData = {
      name: searchName.trim(),
      type: searchType,
      filters: { ...filters },
      createdAt: new Date(),
      id: Date.now().toString()
    };

    onSaveSearch(searchData);
    setSearchName('');
    setShowSaveDialog(false);
    alert('บันทึกการค้นหาเรียบร้อยแล้ว');
  };

  const handleLoadSearch = (savedSearch) => {
    setFilters({ ...filters, ...savedSearch.filters });
    setActiveTab('filters');
  };

  const handleDeleteSearch = (searchId) => {
    if (window.confirm('คุณต้องการลบการค้นหาที่บันทึกไว้นี้หรือไม่?')) {
      onDeleteSearch(searchId);
    }
  };

  if (!isOpen) return null;

  const renderEquipmentFilters = () => (
    <div className="space-y-4">
      {/* Basic Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ค้นหาทั่วไป
        </label>
        <input
          type="text"
          placeholder="ค้นหาชื่อ, ยี่ห้อ, รุ่น, หมายเลขซีเรียล..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ประเภทอุปกรณ์
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={categoriesLoading}
          >
            <option value="">ทั้งหมด</option>
            {categoriesLoading ? (
              <option disabled>กำลังโหลด...</option>
            ) : (
              categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))
            )}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            สถานะ
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">ทั้งหมด</option>
            {Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ยี่ห้อ
          </label>
          <input
            type="text"
            placeholder="ค้นหายี่ห้อ..."
            value={filters.brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            รุ่น
          </label>
          <input
            type="text"
            placeholder="ค้นหารุ่น..."
            value={filters.model}
            onChange={(e) => handleFilterChange('model', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Serial Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            หมายเลขซีเรียล
          </label>
          <input
            type="text"
            placeholder="ค้นหาหมายเลขซีเรียล..."
            value={filters.serialNumber}
            onChange={(e) => handleFilterChange('serialNumber', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            สถานที่
          </label>
          <input
            type="text"
            placeholder="ค้นหาสถานที่..."
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderLoanFilters = () => (
    <div className="space-y-4">
      {/* Basic Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ค้นหาทั่วไป
        </label>
        <input
          type="text"
          placeholder="ค้นหาชื่ออุปกรณ์, ผู้ยืม, วัตถุประสงค์..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Loan Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            สถานะการยืม
          </label>
          <select
            value={filters.loanStatus}
            onChange={(e) => handleFilterChange('loanStatus', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">ทั้งหมด</option>
            {Object.entries(LOAN_REQUEST_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันที่เริ่มต้น
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันที่สิ้นสุด
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วัตถุประสงค์
          </label>
          <input
            type="text"
            placeholder="ค้นหาวัตถุประสงค์..."
            value={filters.purpose}
            onChange={(e) => handleFilterChange('purpose', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Overdue Only */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="overdue"
          checked={filters.overdue}
          onChange={(e) => handleFilterChange('overdue', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="overdue" className="ml-2 block text-sm text-gray-900">
          แสดงเฉพาะรายการที่คืนล่าช้า
        </label>
      </div>
    </div>
  );

  const renderReservationFilters = () => (
    <div className="space-y-4">
      {/* Basic Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ค้นหาทั่วไป
        </label>
        <input
          type="text"
          placeholder="ค้นหาชื่ออุปกรณ์, ผู้จอง, วัตถุประสงค์..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reservation Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            สถานะการจอง
          </label>
          <select
            value={filters.reservationStatus}
            onChange={(e) => handleFilterChange('reservationStatus', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">ทั้งหมด</option>
            {Object.entries(RESERVATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันที่เริ่มต้น
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันที่สิ้นสุด
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เวลาเริ่มต้น
          </label>
          <input
            type="time"
            value={filters.startTime}
            onChange={(e) => handleFilterChange('startTime', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* End Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เวลาสิ้นสุด
          </label>
          <input
            type="time"
            value={filters.endTime}
            onChange={(e) => handleFilterChange('endTime', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderReportFilters = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Report Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ประเภทรายงาน
          </label>
          <select
            value={filters.reportType}
            onChange={(e) => handleFilterChange('reportType', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">ทั้งหมด</option>
            <option value="monthly">รายงานรายเดือน</option>
            <option value="popular">อุปกรณ์ยอดนิยม</option>
            <option value="overdue">ผู้ใช้คืนล่าช้า</option>
            <option value="utilization">การใช้งานอุปกรณ์</option>
          </select>
        </div>

        {/* Group By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            จัดกลุ่มตาม
          </label>
          <select
            value={filters.groupBy}
            onChange={(e) => handleFilterChange('groupBy', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">ไม่จัดกลุ่ม</option>
            <option value="category">ประเภทอุปกรณ์</option>
            <option value="department">สังกัด</option>
            <option value="status">สถานะ</option>
            <option value="month">เดือน</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันที่เริ่มต้น
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันที่สิ้นสุด
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Include Statistics */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="includeStats"
          checked={filters.includeStats}
          onChange={(e) => handleFilterChange('includeStats', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="includeStats" className="ml-2 block text-sm text-gray-900">
          รวมสถิติในรายงาน
        </label>
      </div>
    </div>
  );

  const renderSortOptions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          เรียงตาม
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="createdAt">วันที่สร้าง</option>
          <option value="updatedAt">วันที่อัปเดต</option>
          <option value="name">ชื่อ</option>
          {searchType === 'equipment' && (
            <>
              <option value="brand">ยี่ห้อ</option>
              <option value="category">ประเภท</option>
              <option value="status">สถานะ</option>
            </>
          )}
          {searchType === 'loans' && (
            <>
              <option value="borrowDate">วันที่ยืม</option>
              <option value="expectedReturnDate">วันที่ครบกำหนด</option>
              <option value="status">สถานะ</option>
            </>
          )}
          {searchType === 'reservations' && (
            <>
              <option value="startTime">เวลาเริ่มต้น</option>
              <option value="endTime">เวลาสิ้นสุด</option>
              <option value="status">สถานะ</option>
            </>
          )}
        </select>
      </div>

      {/* Sort Order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ลำดับ
        </label>
        <select
          value={filters.sortOrder}
          onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="desc">ล่าสุดก่อน</option>
          <option value="asc">เก่าสุดก่อน</option>
        </select>
      </div>
    </div>
  );

  const renderSavedSearches = () => (
    <div className="space-y-4">
      {savedSearches.length === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <p className="text-gray-500">ยังไม่มีการค้นหาที่บันทึกไว้</p>
        </div>
      ) : (
        <div className="space-y-2">
          {savedSearches.map((search) => (
            <div key={search.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{search.name}</h4>
                <p className="text-xs text-gray-500">
                  {search.createdAt.toLocaleDateString('th-TH')} • {search.type}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleLoadSearch(search)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ใช้งาน
                </button>
                <button
                  onClick={() => handleDeleteSearch(search.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFilterContent = () => {
    switch (searchType) {
      case 'equipment':
        return renderEquipmentFilters();
      case 'loans':
        return renderLoanFilters();
      case 'reservations':
        return renderReservationFilters();
      case 'reports':
        return renderReportFilters();
      default:
        return renderEquipmentFilters();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto max-w-4xl">
        <div className="bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              ค้นหาขั้นสูง
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('filters')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'filters'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ตัวกรอง
              </button>
              <button
                onClick={() => setActiveTab('sort')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'sort'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                การเรียงลำดับ
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'saved'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                การค้นหาที่บันทึกไว้
                {savedSearches.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {savedSearches.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'filters' && renderFilterContent()}
            {activeTab === 'sort' && renderSortOptions()}
            {activeTab === 'saved' && renderSavedSearches()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                บันทึกการค้นหา
              </button>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                รีเซ็ต
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSearch}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ค้นหา
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">บันทึกการค้นหา</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อการค้นหา
                </label>
                <input
                  type="text"
                  placeholder="ใส่ชื่อการค้นหา..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSearchName('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveSearch}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchModal;