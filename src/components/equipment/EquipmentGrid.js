import { useMemo, useCallback } from 'react';
import EquipmentCard from './EquipmentCard';
import BulkActionBar from './BulkActionBar';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import useBulkSelection from '../../hooks/useBulkSelection';

const EquipmentGrid = ({
  equipment = [],
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onView,
  onBorrow,
  onReserve,
  isSelectable = false,
  selectedItems = [],
  onSelectItem,
  onSelectAll,
  onDeselectAll,
  pagination = {},
  onLoadMore,
  viewMode = 'grid',
  sortBy = 'createdAt',
  sortOrder = 'desc',
  // Bulk operation handlers
  onBulkEdit,
  onBulkDelete,
  onBulkExport,
  onBulkStatusUpdate,
  onBulkLocationUpdate,
  onGenerateQRCodes,
  onPrintLabels
}) => {
  // Use bulk selection hook
  const {
    selectedItems: bulkSelectedItems,
    isAllSelected,
    isSomeSelected,
    selectionStats,
    toggleItem,
    selectAll,
    deselectAll,
    selectFiltered,
    clearSelection,
    getSelectedItems,
    isItemSelected
  } = useBulkSelection(equipment, 'id');

  // Use external selection state if provided, otherwise use internal state
  const currentSelectedItems = selectedItems.length > 0 ? selectedItems : bulkSelectedItems;
  const currentIsAllSelected = selectedItems.length > 0 ? 
    (selectedItems.length === equipment.length && equipment.length > 0) : isAllSelected;
  const currentSelectionCount = selectedItems.length > 0 ? selectedItems.length : selectionStats.selectedCount;

  // Memoize event handlers to prevent unnecessary re-renders
  const handleSelectItem = useCallback((equipmentId, isSelected) => {
    if (onSelectItem) {
      onSelectItem(equipmentId, isSelected);
    } else {
      toggleItem(equipmentId, isSelected);
    }
  }, [onSelectItem, toggleItem]);

  const handleSelectAll = useCallback(() => {
    if (onSelectAll) {
      onSelectAll();
    } else {
      selectAll();
    }
  }, [onSelectAll, selectAll]);

  const handleDeselectAll = useCallback(() => {
    if (onDeselectAll) {
      onDeselectAll();
    } else {
      deselectAll();
    }
  }, [onDeselectAll, deselectAll]);

  const handleToggleAll = useCallback(() => {
    if (currentIsAllSelected) {
      handleDeselectAll();
    } else {
      handleSelectAll();
    }
  }, [currentIsAllSelected, handleDeselectAll, handleSelectAll]);

  // Filter-based selection handlers
  const handleSelectByStatus = useCallback((status) => {
    selectFiltered(item => item.status === status);
  }, [selectFiltered]);

  // Bulk operation handlers
  const handleBulkAction = useCallback((actionHandler) => {
    const selectedEquipment = selectedItems.length > 0 ? 
      equipment.filter(item => selectedItems.includes(item.id)) :
      getSelectedItems();
    
    if (actionHandler && selectedEquipment.length > 0) {
      actionHandler(selectedEquipment);
    }
  }, [selectedItems, equipment, getSelectedItems]);

  const handleLoadMore = useCallback(() => {
    if (!loading && pagination.hasNextPage && onLoadMore) {
      onLoadMore();
    }
  }, [loading, pagination.hasNextPage, onLoadMore]);

  // Memoize sorted equipment to avoid re-sorting on every render
  const sortedEquipment = useMemo(() => {
    return [...equipment].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle different data types
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = aValue?.toDate?.() || aValue;
        bValue = bValue?.toDate?.() || bValue;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
  }, [equipment, sortBy, sortOrder]);

  // Memoize grid layout classes
  const gridClasses = useMemo(() => {
    switch (viewMode) {
      case 'grid':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6';
      case 'list':
        return 'grid grid-cols-1 gap-4';
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6';
    }
  }, [viewMode]);

  // Loading skeleton
  const renderLoadingSkeleton = () => {
    const skeletonCount = viewMode === 'list' ? 5 : 12;
    return (
      <div className={gridClasses}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="flex space-x-2 pt-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Error state
  if (error) {
    return (
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
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && equipment.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
        title="ไม่พบอุปกรณ์"
        description="ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไขการค้นหา ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Selection Controls */}
      {isSelectable && equipment.length > 0 && (
        <div className="space-y-4">
          {/* Selection Header */}
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={currentIsAllSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = isSomeSelected && !currentIsAllSelected;
                    }
                  }}
                  onChange={handleToggleAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  เลือกทั้งหมด
                </label>
              </div>
              {currentSelectionCount > 0 && (
                <span className="text-sm text-gray-600">
                  เลือกแล้ว {currentSelectionCount} จาก {equipment.length} รายการ
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Quick Filter Selection */}
              {currentSelectionCount === 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">เลือกตาม:</span>
                  <button
                    onClick={() => handleSelectByStatus('available')}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    พร้อมใช้
                  </button>
                  <button
                    onClick={() => handleSelectByStatus('maintenance')}
                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                  >
                    ซ่อมบำรุง
                  </button>
                </div>
              )}
              
              {currentSelectionCount > 0 && (
                <button
                  onClick={selectedItems.length > 0 ? onDeselectAll : clearSelection}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ยกเลิกการเลือก
                </button>
              )}
            </div>
          </div>

          {/* Bulk Action Bar */}
          {currentSelectionCount > 0 && (
            <BulkActionBar
              selectedItems={currentSelectedItems}
              totalItems={equipment.length}
              onBulkEdit={() => handleBulkAction(onBulkEdit)}
              onBulkDelete={() => handleBulkAction(onBulkDelete)}
              onBulkExport={() => handleBulkAction(onBulkExport)}
              onBulkStatusUpdate={() => handleBulkAction(onBulkStatusUpdate)}
              onBulkLocationUpdate={() => handleBulkAction(onBulkLocationUpdate)}
              onGenerateQRCodes={() => handleBulkAction(onGenerateQRCodes)}
              onPrintLabels={() => handleBulkAction(onPrintLabels)}
              onClearSelection={selectedItems.length > 0 ? onDeselectAll : clearSelection}
            />
          )}
        </div>
      )}

      {/* Equipment Grid/List */}
      {loading && equipment.length === 0 ? (
        renderLoadingSkeleton()
      ) : (
        <div className={gridClasses}>
          {sortedEquipment.map((item) => (
            <EquipmentCard
              key={item.id}
              equipment={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetail={onView}
              onBorrow={onBorrow}
              onReserve={onReserve}
              isSelectable={isSelectable}
              isSelected={selectedItems.length > 0 ? selectedItems.includes(item.id) : isItemSelected(item.id)}
              onSelect={(isSelected) => handleSelectItem(item.id, isSelected)}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {pagination.hasNextPage && (
        <div className="text-center">
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

      {/* Loading Indicator for Additional Items */}
      {loading && equipment.length > 0 && (
        <div className="flex justify-center items-center py-4">
          <LoadingSpinner size="md" />
          <span className="ml-2 text-sm text-gray-600">กำลังโหลดเพิ่มเติม...</span>
        </div>
      )}

      {/* Results Summary */}
      {equipment.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          แสดง {equipment.length} รายการ
          {pagination.hasNextPage && ' (มีรายการเพิ่มเติม)'}
          {currentSelectionCount > 0 && ` • เลือกแล้ว ${currentSelectionCount} รายการ`}
        </div>
      )}
    </div>
  );
};

export default EquipmentGrid;