import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EquipmentGrid from './EquipmentGrid';
import EquipmentListView from './EquipmentListView';
import EquipmentFilters from './EquipmentFilters';
import ViewModeToggle from './ViewModeToggle';
import BulkActions from '../common/BulkActions';
import LoadingSpinner from '../common/LoadingSpinner';

const EquipmentListContainer = ({
  equipment = [],
  loading = false,
  error = null,
  pagination = {},
  filters = {},
  onFiltersChange,
  onResetFilters,
  onLoadMore,
  onRefresh,
  onEdit,
  onDelete,
  onView,
  onBorrow,
  onReserve,
  onBulkAction,
  showFilters = true,
  showBulkActions = true,
  showViewToggle = true,
  initialViewMode = 'grid'
}) => {
  const { isAdmin } = useAuth();
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Load view mode from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('equipment-view-mode');
    if (savedViewMode && ['grid', 'list'].includes(savedViewMode)) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode to localStorage
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    localStorage.setItem('equipment-view-mode', mode);
  }, []);

  // Handle item selection
  const handleSelectItem = useCallback((equipmentId, isSelected) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, equipmentId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== equipmentId));
    }
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedItems(equipment.map(item => item.id));
  }, [equipment]);

  const handleDeselectAll = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // Handle sorting
  const handleSort = useCallback((field, order) => {
    setSortBy(field);
    setSortOrder(order);
  }, []);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (actionId, itemIds, actionData) => {
    setBulkActionLoading(true);
    try {
      if (onBulkAction) {
        await onBulkAction(actionId, itemIds, actionData);
      }
      setSelectedItems([]);
    } catch (error) {
      console.error('Bulk action error:', error);
      throw error;
    } finally {
      setBulkActionLoading(false);
    }
  }, [onBulkAction]);

  // Clear selection when equipment list changes
  useEffect(() => {
    setSelectedItems(prev => prev.filter(id => equipment.some(item => item.id === id)));
  }, [equipment]);

  // Memoize sorted equipment to avoid recalculating on every render
  const sortedEquipment = useMemo(() => {
    if (!equipment || equipment.length === 0) return [];
    
    const sorted = [...equipment].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'brand':
          aValue = (a.brand || '').toLowerCase();
          bValue = (b.brand || '').toLowerCase();
          break;
        case 'category':
          aValue = (typeof a.category === 'object' ? a.category?.name : a.category || '').toLowerCase();
          bValue = (typeof b.category === 'object' ? b.category?.name : b.category || '').toLowerCase();
          break;
        case 'createdAt':
        default:
          aValue = a.createdAt?.toMillis?.() || a.createdAt || 0;
          bValue = b.createdAt?.toMillis?.() || b.createdAt || 0;
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    return sorted;
  }, [equipment, sortBy, sortOrder]);

  // Common props for both grid and list views
  const commonProps = useMemo(() => ({
    equipment: sortedEquipment,
    loading,
    error,
    pagination,
    onLoadMore,
    onEdit,
    onDelete,
    onView,
    onBorrow,
    onReserve,
    isSelectable: isAdmin && showBulkActions,
    selectedItems,
    onSelectItem: handleSelectItem,
    onSelectAll: handleSelectAll,
    onDeselectAll: handleDeselectAll,
    sortBy,
    sortOrder,
    onSort: handleSort
  }), [
    sortedEquipment,
    loading,
    error,
    pagination,
    onLoadMore,
    onEdit,
    onDelete,
    onView,
    onBorrow,
    onReserve,
    isAdmin,
    showBulkActions,
    selectedItems,
    handleSelectItem,
    handleSelectAll,
    handleDeselectAll,
    sortBy,
    sortOrder,
    handleSort
  ]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <EquipmentFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          onReset={onResetFilters}
          loading={loading}
        />
      )}

      {/* Header with View Toggle and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* Results Count */}
          {!loading && sortedEquipment.length > 0 && (
            <div className="text-sm text-gray-600">
              แสดง <span className="font-medium">{sortedEquipment.length}</span> รายการ
              {pagination.hasNextPage && ' (มีรายการเพิ่มเติม)'}
            </div>
          )}
          
          {/* Loading Indicator */}
          {loading && sortedEquipment.length === 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <LoadingSpinner size="sm" />
              <span className="ml-2">กำลังโหลดข้อมูล...</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Sort Options for Mobile */}
          <div className="sm:hidden">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                handleSort(field, order);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="createdAt-desc">วันที่สร้าง (ล่าสุด)</option>
              <option value="createdAt-asc">วันที่สร้าง (เก่าสุด)</option>
              <option value="name-asc">ชื่อ (A-Z)</option>
              <option value="name-desc">ชื่อ (Z-A)</option>
              <option value="brand-asc">ยี่ห้อ (A-Z)</option>
              <option value="brand-desc">ยี่ห้อ (Z-A)</option>
              <option value="category-asc">ประเภท (A-Z)</option>
              <option value="category-desc">ประเภท (Z-A)</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title="รีเฟรชข้อมูล"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="ml-2 hidden sm:inline">รีเฟรช</span>
          </button>

          {/* View Mode Toggle */}
          {showViewToggle && (
            <ViewModeToggle
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {isAdmin && showBulkActions && selectedItems.length > 0 && (
        <BulkActions
          selectedItems={selectedItems}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          totalItems={sortedEquipment.length}
          itemType="equipment"
          onBulkAction={handleBulkAction}
          loading={bulkActionLoading}
        />
      )}

      {/* Equipment List/Grid */}
      {viewMode === 'grid' ? (
        <EquipmentGrid
          {...commonProps}
          viewMode={viewMode}
        />
      ) : (
        <EquipmentListView
          {...commonProps}
        />
      )}

      {/* Mobile-specific enhancements */}
      <div className="sm:hidden">
        {/* Mobile Stats */}
        {selectedItems.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-40">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                เลือกแล้ว {selectedItems.length} รายการ
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDeselectAll}
                  className="text-blue-200 hover:text-white text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    // Open bulk actions modal on mobile
                    // This would be implemented based on your modal system
                    console.log('Open bulk actions modal');
                  }}
                  className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm font-medium"
                >
                  ดำเนินการ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentListContainer;