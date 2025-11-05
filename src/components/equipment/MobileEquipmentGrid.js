import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MobileEquipmentCard from './MobileEquipmentCard';
import BulkActionBar from './BulkActionBar';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import useBulkSelection from '../../hooks/useBulkSelection';

const MobileEquipmentGrid = ({
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
  sortBy = 'createdAt',
  sortOrder = 'desc',
  // Bulk operation handlers
  onBulkEdit,
  onBulkDelete,
  onBulkExport,
  onBulkStatusUpdate,
  onBulkLocationUpdate,
  onGenerateQRCodes,
  onPrintLabels,
  // Mobile-specific props
  onSwipeAction,
  enablePullToRefresh = true,
  onRefresh
}) => {
  const { isAdmin } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const scrollTop = useRef(0);
  
  // Use bulk selection hook
  const {
    selectedItems: bulkSelectedItems,
    isAllSelected,
    isSomeSelected,
    selectionStats,
    toggleItem,
    selectAll,
    deselectAll,
    toggleAll,
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

  // Pull to refresh handlers
  const handleTouchStart = useCallback((e) => {
    if (!enablePullToRefresh || window.scrollY > 0) return;
    
    startY.current = e.touches[0].clientY;
    scrollTop.current = window.scrollY;
    setIsPulling(true);
  }, [enablePullToRefresh]);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    
    if (distance > 0 && distance < 120) {
      setPullDistance(distance);
      // Add some resistance
      const resistedDistance = distance * 0.6;
      document.body.style.transform = `translateY(${resistedDistance}px)`;
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    document.body.style.transform = '';
    
    if (pullDistance > 80 && onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [isPulling, pullDistance, onRefresh]);

  // Add touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enablePullToRefresh) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enablePullToRefresh]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !pagination.hasNextPage) return;
      
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 1000) {
        onLoadMore?.();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, pagination.hasNextPage, onLoadMore]);

  const handleSelectItem = (equipmentId, isSelected) => {
    if (onSelectItem) {
      onSelectItem(equipmentId, isSelected);
    } else {
      toggleItem(equipmentId, isSelected);
    }
  };

  const handleSelectAll = () => {
    if (onSelectAll) {
      onSelectAll();
    } else {
      selectAll();
    }
  };

  const handleDeselectAll = () => {
    if (onDeselectAll) {
      onDeselectAll();
    } else {
      deselectAll();
    }
  };

  const handleToggleAll = () => {
    if (currentIsAllSelected) {
      handleDeselectAll();
    } else {
      handleSelectAll();
    }
  };

  // Bulk operation handlers
  const handleBulkAction = (actionHandler) => {
    const selectedEquipment = selectedItems.length > 0 ? 
      equipment.filter(item => selectedItems.includes(item.id)) :
      getSelectedItems();
    
    if (actionHandler && selectedEquipment.length > 0) {
      actionHandler(selectedEquipment);
    }
  };

  // Sort equipment
  const sortedEquipment = [...equipment].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

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

  // Loading skeleton for mobile
  const renderLoadingSkeleton = () => (
    <div className="space-y-4 px-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
          <div className="flex p-4 space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="flex space-x-2 pt-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Pull to refresh indicator
  const renderPullToRefreshIndicator = () => {
    if (!enablePullToRefresh) return null;

    return (
      <div 
        className={`fixed top-0 left-0 right-0 z-50 bg-blue-50 border-b border-blue-200 transition-all duration-300 ${
          isPulling || isRefreshing ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-center py-4">
          {isRefreshing ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-blue-600">กำลังรีเฟรช...</span>
            </>
          ) : (
            <div className="flex items-center text-blue-600">
              <svg 
                className={`w-5 h-5 mr-2 transition-transform duration-300 ${
                  pullDistance > 80 ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="text-sm">
                {pullDistance > 80 ? 'ปล่อยเพื่อรีเฟรช' : 'ดึงลงเพื่อรีเฟรช'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Error state
  if (error) {
    return (
      <div className="px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
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
      </div>
    );
  }

  // Empty state
  if (!loading && equipment.length === 0) {
    return (
      <div className="px-4 py-12">
        <EmptyState
          icon={
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          title="ไม่พบอุปกรณ์"
          description="ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไขการค้นหา ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Pull to refresh indicator */}
      {renderPullToRefreshIndicator()}

      {/* Bulk Selection Controls */}
      {isSelectable && equipment.length > 0 && (
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={currentIsAllSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = isSomeSelected && !currentIsAllSelected;
                  }
                }}
                onChange={handleToggleAll}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded touch-manipulation"
              />
              <span className="text-sm text-gray-700">
                {currentSelectionCount > 0 
                  ? `เลือกแล้ว ${currentSelectionCount} รายการ`
                  : 'เลือกทั้งหมด'
                }
              </span>
            </div>
            
            {currentSelectionCount > 0 && (
              <button
                onClick={selectedItems.length > 0 ? onDeselectAll : clearSelection}
                className="text-sm text-blue-600 hover:text-blue-800 touch-manipulation"
              >
                ยกเลิก
              </button>
            )}
          </div>

          {/* Bulk Action Bar */}
          {currentSelectionCount > 0 && (
            <div className="mt-3">
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
                isMobile={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Equipment List */}
      {loading && equipment.length === 0 ? (
        renderLoadingSkeleton()
      ) : (
        <div className="space-y-4 px-4 py-4">
          {sortedEquipment.map((item) => (
            <MobileEquipmentCard
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
              onSwipeAction={onSwipeAction}
            />
          ))}
        </div>
      )}

      {/* Loading Indicator for Additional Items */}
      {loading && equipment.length > 0 && (
        <div className="flex justify-center items-center py-6">
          <LoadingSpinner size="md" />
          <span className="ml-2 text-sm text-gray-600">กำลังโหลดเพิ่มเติม...</span>
        </div>
      )}

      {/* End of list indicator */}
      {!loading && equipment.length > 0 && !pagination.hasNextPage && (
        <div className="text-center py-6 text-sm text-gray-500">
          แสดงครบทุกรายการแล้ว ({equipment.length} รายการ)
        </div>
      )}

      {/* Swipe instruction overlay (show on first visit) */}
      {equipment.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 bg-black bg-opacity-75 text-white text-center py-2 px-4 rounded-lg text-sm opacity-0 animate-fade-in-out pointer-events-none">
          เลื่อนซ้าย-ขวาบนการ์ดเพื่อดำเนินการด่วน
        </div>
      )}
    </div>
  );
};

export default MobileEquipmentGrid;