import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MobileEquipmentGrid from './MobileEquipmentGrid';
import MobileNavigation from './MobileNavigation';
import EquipmentSearch from './EquipmentSearch';
import EquipmentFilters from './EquipmentFilters';
import EquipmentManagementForm from './EquipmentManagementForm';
import { useEquipmentSearch } from '../../hooks/useEquipmentSearch';
import { useEquipmentCategories } from '../../hooks/useEquipmentCategories';
import { HapticFeedback, ViewportUtils } from '../../utils/gestureSupport';

const MobileEquipmentContainer = ({
  onBorrow,
  onReserve,
  onEdit,
  onDelete,
  onView,
  // Bulk operations
  onBulkEdit,
  onBulkDelete,
  onBulkExport,
  onBulkStatusUpdate,
  onBulkLocationUpdate,
  onGenerateQRCodes,
  onPrintLabels
}) => {
  const { isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState('equipment');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('mobile');
  
  // Search and filter state
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading: searchLoading,
    error: searchError,
    searchEquipment,
    clearSearch
  } = useEquipmentSearch();
  
  const { categories } = useEquipmentCategories();
  
  const [filters, setFilters] = useState({
    categories: [],
    statuses: [],
    dateRange: null,
    priceRange: null,
    location: '',
    responsiblePerson: ''
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    hasNextPage: true,
    total: 0
  });

  // Handle section changes
  const handleSectionChange = useCallback((section) => {
    HapticFeedback.light();
    
    switch (section) {
      case 'add-equipment':
        setShowAddForm(true);
        break;
      case 'search':
        setActiveSection('search');
        break;
      case 'quick-actions':
        setShowFilters(true);
        break;
      default:
        setActiveSection(section);
        setShowAddForm(false);
        setShowFilters(false);
    }
  }, []);

  // Handle swipe actions on equipment cards
  const handleSwipeAction = useCallback((swipeData) => {
    const { equipment, direction, action } = swipeData;
    
    HapticFeedback.medium();
    
    switch (action) {
      case 'borrow':
        onBorrow?.(equipment);
        break;
      case 'reserve':
        onReserve?.(equipment);
        break;
      case 'edit':
        onEdit?.(equipment);
        break;
      default:
        break;
    }
  }, [onBorrow, onReserve, onEdit]);

  // Handle selection mode
  const handleToggleSelectionMode = useCallback(() => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedItems([]);
    }
    HapticFeedback.light();
  }, [isSelectionMode]);

  const handleSelectItem = useCallback((equipmentId, isSelected) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, equipmentId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== equipmentId));
    }
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = searchResults.map(item => item.id);
    setSelectedItems(allIds);
    HapticFeedback.medium();
  }, [searchResults]);

  const handleDeselectAll = useCallback(() => {
    setSelectedItems([]);
    HapticFeedback.light();
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await searchEquipment(searchQuery, filters);
      HapticFeedback.success();
    } catch (error) {
      console.error('Refresh failed:', error);
      HapticFeedback.error();
    }
  }, [searchQuery, filters, searchEquipment]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (pagination.hasNextPage && !searchLoading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [pagination.hasNextPage, searchLoading]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [setSearchQuery]);

  // Initialize viewport utilities
  useEffect(() => {
    ViewportUtils.preventZoom();
  }, []);

  // Search effect
  useEffect(() => {
    searchEquipment(searchQuery, filters);
  }, [searchQuery, filters, pagination.page, searchEquipment]);

  // Render different sections based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'search':
        return (
          <div className="space-y-4">
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
              <EquipmentSearch
                onSearch={handleSearch}
                placeholder="ค้นหาอุปกรณ์..."
                value={searchQuery}
                isMobile={true}
              />
            </div>
            <MobileEquipmentGrid
              equipment={searchResults}
              loading={searchLoading}
              error={searchError}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              onBorrow={onBorrow}
              onReserve={onReserve}
              isSelectable={isSelectionMode}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              pagination={pagination}
              onLoadMore={handleLoadMore}
              onSwipeAction={handleSwipeAction}
              onRefresh={handleRefresh}
              onBulkEdit={onBulkEdit}
              onBulkDelete={onBulkDelete}
              onBulkExport={onBulkExport}
              onBulkStatusUpdate={onBulkStatusUpdate}
              onBulkLocationUpdate={onBulkLocationUpdate}
              onGenerateQRCodes={onGenerateQRCodes}
              onPrintLabels={onPrintLabels}
            />
          </div>
        );
      
      case 'categories':
        return (
          <div className="px-4 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">หมวดหมู่อุปกรณ์</h2>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, categories: [category.id] }));
                    setActiveSection('equipment');
                  }}
                  className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow touch-manipulation"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">{category.icon || '📦'}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm">{category.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{category.equipmentCount || 0} รายการ</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      
      case 'pending':
        return (
          <div className="px-4 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">รออนุมัติ</h2>
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">ไม่มีรายการรออนุมัติ</p>
            </div>
          </div>
        );
      
      case 'reports':
        return (
          <div className="px-4 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">รายงาน</h2>
            <div className="space-y-4">
              <button className="w-full p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-left touch-manipulation">
                <h3 className="font-medium text-gray-900">รายงานสถิติอุปกรณ์</h3>
                <p className="text-sm text-gray-500 mt-1">ดูสถิติการใช้งานอุปกรณ์</p>
              </button>
              <button className="w-full p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-left touch-manipulation">
                <h3 className="font-medium text-gray-900">รายงานการยืม-คืน</h3>
                <p className="text-sm text-gray-500 mt-1">ดูประวัติการยืม-คืนอุปกรณ์</p>
              </button>
            </div>
          </div>
        );
      
      default:
        return (
          <MobileEquipmentGrid
            equipment={searchResults}
            loading={searchLoading}
            error={searchError}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onBorrow={onBorrow}
            onReserve={onReserve}
            isSelectable={isSelectionMode}
            selectedItems={selectedItems}
            onSelectItem={handleSelectItem}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            pagination={pagination}
            onLoadMore={handleLoadMore}
            onSwipeAction={handleSwipeAction}
            onRefresh={handleRefresh}
            onBulkEdit={onBulkEdit}
            onBulkDelete={onBulkDelete}
            onBulkExport={onBulkExport}
            onBulkStatusUpdate={onBulkStatusUpdate}
            onBulkLocationUpdate={onBulkLocationUpdate}
            onGenerateQRCodes={onGenerateQRCodes}
            onPrintLabels={onPrintLabels}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">
            {activeSection === 'equipment' && 'อุปกรณ์'}
            {activeSection === 'search' && 'ค้นหาอุปกรณ์'}
            {activeSection === 'categories' && 'หมวดหมู่'}
            {activeSection === 'pending' && 'รออนุมัติ'}
            {activeSection === 'reports' && 'รายงาน'}
          </h1>
          
          <div className="flex items-center space-x-2">
            {/* Selection Mode Toggle */}
            {activeSection === 'equipment' && (
              <button
                onClick={handleToggleSelectionMode}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors touch-manipulation ${
                  isSelectionMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSelectionMode ? 'ยกเลิก' : 'เลือก'}
              </button>
            )}
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-16">
        {renderContent()}
      </div>

      {/* Add Equipment Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
          <div className="w-full bg-white rounded-t-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">เพิ่มอุปกรณ์ใหม่</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg touch-manipulation"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <EquipmentManagementForm
                onSubmit={(data) => {
                  // Handle form submission
                  setShowAddForm(false);
                  handleRefresh();
                }}
                onCancel={() => setShowAddForm(false)}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
          <div className="w-full bg-white rounded-t-xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">ตัวกรอง</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg touch-manipulation"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <EquipmentFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                categories={categories}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <MobileNavigation
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        equipmentCount={searchResults.length}
        pendingCount={0}
      />
    </div>
  );
};

export default MobileEquipmentContainer;