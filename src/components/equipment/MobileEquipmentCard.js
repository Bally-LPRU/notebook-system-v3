import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  EQUIPMENT_STATUS_LABELS, 
  EQUIPMENT_CATEGORY_LABELS,
  EQUIPMENT_STATUS 
} from '../../types/equipment';
import { getEquipmentStatusColor, canBorrowEquipment } from '../../utils/equipmentValidation';

const MobileEquipmentCard = ({ 
  equipment, 
  onBorrow, 
  onReserve, 
  onEdit, 
  onDelete,
  onViewDetail,
  isSelectable = false,
  isSelected = false,
  onSelect,
  onSwipeAction
}) => {
  const { isAdmin } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const cardRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const canBorrow = canBorrowEquipment(equipment);
  const statusColor = getEquipmentStatusColor(equipment.status);

  // Touch event handlers for swipe gestures
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    isDragging.current = false;
    setIsSwipeActive(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwipeActive) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;
    
    // Check if it's a horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isDragging.current = true;
      e.preventDefault(); // Prevent scrolling
      
      // Limit swipe distance
      const maxSwipe = 120;
      const limitedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
      setSwipeOffset(limitedDelta);
      
      // Determine swipe direction
      if (limitedDelta > 30) {
        setSwipeDirection('right');
      } else if (limitedDelta < -30) {
        setSwipeDirection('left');
      } else {
        setSwipeDirection(null);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsSwipeActive(false);
    
    if (isDragging.current && Math.abs(swipeOffset) > 60) {
      // Execute swipe action
      if (swipeDirection === 'right' && !isAdmin && canBorrow.canBorrow) {
        onBorrow?.(equipment);
      } else if (swipeDirection === 'left' && isAdmin) {
        onEdit?.(equipment);
      } else if (swipeDirection === 'left' && !isAdmin && canBorrow.canBorrow) {
        onReserve?.(equipment);
      }
      
      // Notify parent about swipe action
      if (onSwipeAction) {
        onSwipeAction({
          equipment,
          direction: swipeDirection,
          action: swipeDirection === 'right' ? 'borrow' : (isAdmin ? 'edit' : 'reserve')
        });
      }
    }
    
    // Reset swipe state
    setSwipeOffset(0);
    setSwipeDirection(null);
    isDragging.current = false;
  };

  const handleSelectChange = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(e.target.checked);
    }
  };

  const handleCardTap = () => {
    if (!isDragging.current) {
      onViewDetail?.(equipment);
    }
  };

  // Quick action buttons
  const renderQuickActions = () => {
    if (isAdmin) {
      return (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(equipment);
            }}
            className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors touch-manipulation"
          >
            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(equipment);
            }}
            disabled={equipment.status === EQUIPMENT_STATUS.BORROWED}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors touch-manipulation ${
              equipment.status === EQUIPMENT_STATUS.BORROWED
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200'
            }`}
          >
            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      );
    } else {
      return (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBorrow?.(equipment);
            }}
            disabled={!canBorrow.canBorrow}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors touch-manipulation ${
              canBorrow.canBorrow
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReserve?.(equipment);
            }}
            disabled={!canBorrow.canBorrow}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors touch-manipulation ${
              canBorrow.canBorrow
                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      );
    }
  };

  // Swipe hint indicators
  const renderSwipeHints = () => {
    if (!isSwipeActive || !swipeDirection) return null;

    return (
      <>
        {/* Left swipe hint */}
        {swipeDirection === 'left' && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
            {isAdmin ? 'แก้ไข' : 'จอง'}
          </div>
        )}
        
        {/* Right swipe hint */}
        {swipeDirection === 'right' && !isAdmin && canBorrow.canBorrow && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
            ขอยืม
          </div>
        )}
      </>
    );
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4 bg-gradient-to-r from-green-500 to-blue-500">
        <div className="text-white font-medium">
          {!isAdmin && canBorrow.canBorrow && '← ขอยืม'}
        </div>
        <div className="text-white font-medium">
          {isAdmin ? 'แก้ไข →' : (canBorrow.canBorrow && 'จอง →')}
        </div>
      </div>

      {/* Main card */}
      <div
        ref={cardRef}
        className={`bg-white rounded-xl shadow-sm border transition-all duration-200 transform ${
          isSelected 
            ? 'border-blue-500 shadow-md ring-2 ring-blue-200' 
            : 'border-gray-200'
        }`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwipeActive ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardTap}
      >
        <div className="flex p-4 space-x-4">
          {/* Selection Checkbox */}
          {isSelectable && (
            <div className="flex-shrink-0 pt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelectChange}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded touch-manipulation"
              />
            </div>
          )}

          {/* Equipment Image */}
          <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {equipment.imageURL && !imageError ? (
              <>
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}
                <img
                  src={equipment.imageURL}
                  alt={equipment.name}
                  className="w-full h-full object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* Status Badge */}
            <div className="absolute -top-1 -right-1">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                {EQUIPMENT_STATUS_LABELS[equipment.status]}
              </span>
            </div>
          </div>

          {/* Equipment Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {equipment.name}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  {EQUIPMENT_CATEGORY_LABELS[equipment.category] || equipment.category}
                </p>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ยี่ห้อ:</span>
                <span className="text-gray-900 font-medium truncate ml-2">{equipment.brand}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">รุ่น:</span>
                <span className="text-gray-900 font-medium truncate ml-2">{equipment.model}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">รหัส:</span>
                <span className="text-gray-900 font-medium font-mono text-xs truncate ml-2">
                  {equipment.serialNumber}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-3">
              {renderQuickActions()}
            </div>
          </div>
        </div>

        {/* Swipe hints */}
        {renderSwipeHints()}
      </div>

      {/* Swipe instruction hint (show only on first few items) */}
      {!isSwipeActive && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
          ← → เลื่อนเพื่อดำเนินการ
        </div>
      )}
    </div>
  );
};

export default MobileEquipmentCard;