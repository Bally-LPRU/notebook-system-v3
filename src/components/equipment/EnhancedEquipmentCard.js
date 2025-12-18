import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  EQUIPMENT_STATUS 
} from '../../types/equipment';
import { canBorrowEquipment } from '../../utils/equipmentValidation';
import { getCategoryName } from '../../utils/equipmentHelpers';
import ImageGallery from './ImageGallery';
import EquipmentStatusBadge from './EquipmentStatusBadge';

const EnhancedEquipmentCard = ({ 
  equipment, 
  onBorrow, 
  onReserve, 
  onEdit, 
  onDelete,
  onViewDetail,
  isSelectable = false,
  isSelected = false,
  onSelect,
  viewMode = 'grid',
  showImageCarousel = true,
  showQuickActions = true,
  showStatusBadge = true,
  showHoverEffects = true,
  className = ''
}) => {
  const { isAdmin } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleBorrow = (e) => {
    e.stopPropagation();
    if (onBorrow) {
      onBorrow(equipment);
    }
  };

  const handleReserve = (e) => {
    e.stopPropagation();
    if (onReserve) {
      onReserve(equipment);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(equipment);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(equipment);
    }
  };

  const handleViewDetail = (e) => {
    e.stopPropagation();
    if (onViewDetail) {
      onViewDetail(equipment);
    }
  };

  const handleCardClick = () => {
    if (onViewDetail) {
      onViewDetail(equipment);
    }
  };

  const canBorrow = canBorrowEquipment(equipment);

  const handleSelectChange = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(e.target.checked);
    }
  };

  // Different layouts based on view mode
  const isListMode = viewMode === 'list';
  const isCompactMode = viewMode === 'compact';

  // Prepare images for carousel
  const images = equipment.images || (equipment.imageURL ? [{ url: equipment.imageURL, id: 'main' }] : []);

  // Animation classes
  const hoverClasses = showHoverEffects ? {
    card: isHovered ? 'transform scale-105 shadow-xl' : 'transform scale-100',
    image: isHovered ? 'transform scale-110' : 'transform scale-100'
  } : { card: '', image: '' };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border transition-all duration-300 cursor-pointer ${
        isSelected 
          ? 'border-blue-500 shadow-md ring-2 ring-blue-200' 
          : 'border-gray-200 hover:shadow-lg'
      } ${
        isListMode ? 'flex items-center p-4' : ''
      } ${
        isCompactMode ? 'p-3' : ''
      } ${hoverClasses.card} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Selection Checkbox for List Mode */}
      {isSelectable && isListMode && (
        <div className="mr-4 flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      )}

      {/* Equipment Image */}
      <div className={`relative bg-gray-100 overflow-hidden ${
        isListMode 
          ? 'w-20 h-20 rounded-lg flex-shrink-0' 
          : isCompactMode
          ? 'h-32 rounded-t-lg'
          : 'h-48 rounded-t-lg'
      }`}>
        {images.length > 0 && showImageCarousel ? (
          <div className={`h-full transition-transform duration-300 ${hoverClasses.image}`}>
            {images.length === 1 ? (
              // Single image
              <>
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                <img
                  src={images[0].url}
                  alt={equipment.name}
                  className="w-full h-full object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </>
            ) : (
              // Multiple images with carousel
              <ImageGallery
                images={images}
                showThumbnails={false}
                autoPlay={isHovered}
                autoPlayInterval={2000}
                className="h-full"
              />
            )}
          </div>
        ) : (
          // No image placeholder
          <div className="flex items-center justify-center h-full">
            <svg className={`text-gray-400 ${
              isListMode ? 'w-8 h-8' : isCompactMode ? 'w-12 h-12' : 'w-16 h-16'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Selection Checkbox for Grid Mode */}
        {isSelectable && !isListMode && (
          <div className="absolute top-2 left-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded shadow-sm"
            />
          </div>
        )}
        
        {/* Status Badge */}
        {showStatusBadge && !isListMode && (
          <div className="absolute top-2 right-2">
            <EquipmentStatusBadge 
              status={equipment.status} 
              size="md" 
              className="shadow-sm"
            />
          </div>
        )}

        {/* Image Count Indicator */}
        {images.length > 1 && !isListMode && (
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black bg-opacity-50 text-white">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {images.length}
            </span>
          </div>
        )}

        {/* Quick Action Overlay (appears on hover) */}
        {showQuickActions && showHoverEffects && isHovered && !isListMode && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="flex space-x-2">
              <button
                onClick={handleViewDetail}
                className="p-2 bg-white bg-opacity-90 rounded-full text-gray-700 hover:bg-opacity-100 transition-all duration-200"
                title="ดูรายละเอียด"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              
              {isAdmin ? (
                <button
                  onClick={handleEdit}
                  className="p-2 bg-white bg-opacity-90 rounded-full text-gray-700 hover:bg-opacity-100 transition-all duration-200"
                  title="แก้ไข"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              ) : canBorrow.canBorrow && (
                <button
                  onClick={handleBorrow}
                  className="p-2 bg-white bg-opacity-90 rounded-full text-gray-700 hover:bg-opacity-100 transition-all duration-200"
                  title="ขอยืม"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Equipment Info */}
      <div className={isListMode ? 'flex-1 ml-4' : isCompactMode ? 'p-3' : 'p-4'}>
        <div className={isListMode ? 'flex items-center justify-between' : 'mb-2'}>
          <div className={isListMode ? 'flex-1' : ''}>
            <h3 className={`font-semibold text-gray-900 line-clamp-2 ${
              isListMode ? 'text-base mb-1' : isCompactMode ? 'text-base mb-1' : 'text-lg mb-1'
            }`}>
              {equipment.name}
            </h3>
            <p className={`text-gray-600 ${isCompactMode ? 'text-xs' : 'text-sm'}`}>
              {getCategoryName(equipment.category)}
            </p>
          </div>
          
          {/* Status Badge for List Mode */}
          {showStatusBadge && isListMode && (
            <div className="ml-4 flex-shrink-0">
              <EquipmentStatusBadge 
                status={equipment.status} 
                size="md"
              />
            </div>
          )}
        </div>

        {/* Equipment Details */}
        <div className={`space-y-1 ${
          isListMode ? 'mb-2 grid grid-cols-2 gap-x-4 gap-y-1' : 
          isCompactMode ? 'mb-2' : 'mb-4'
        }`}>
          <div className={`flex justify-between ${isCompactMode ? 'text-xs' : 'text-sm'}`}>
            <span className="text-gray-500">ยี่ห้อ:</span>
            <span className="text-gray-900 font-medium">{equipment.brand}</span>
          </div>
          <div className={`flex justify-between ${isCompactMode ? 'text-xs' : 'text-sm'}`}>
            <span className="text-gray-500">รุ่น:</span>
            <span className="text-gray-900 font-medium">{equipment.model}</span>
          </div>
          <div className={`flex justify-between ${isCompactMode ? 'text-xs' : 'text-sm'}`}>
            <span className="text-gray-500">รหัส:</span>
            <span className="text-gray-900 font-medium font-mono text-xs">
              {equipment.serialNumber}
            </span>
          </div>
          <div className={`flex justify-between ${isCompactMode ? 'text-xs' : 'text-sm'}`}>
            <span className="text-gray-500">สถานที่:</span>
            <span className="text-gray-900 font-medium">
              {typeof equipment.location === 'string' 
                ? equipment.location 
                : equipment.location?.room 
                  ? `${equipment.location.room}${equipment.location.building ? `, ${equipment.location.building}` : ''}${equipment.location.floor ? ` ชั้น ${equipment.location.floor}` : ''}`
                  : 'ไม่ระบุ'}
            </span>
          </div>
        </div>

        {/* Description */}
        {equipment.description && !isListMode && !isCompactMode && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {equipment.description}
            </p>
          </div>
        )}

        {/* Visual Indicators */}
        <div className={`flex items-center space-x-2 ${isListMode || isCompactMode ? 'mb-2' : 'mb-4'}`}>
          {/* Availability Indicator */}
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-1 ${
              equipment.status === EQUIPMENT_STATUS.AVAILABLE ? 'bg-green-400' :
              equipment.status === EQUIPMENT_STATUS.BORROWED ? 'bg-red-400' :
              equipment.status === EQUIPMENT_STATUS.MAINTENANCE ? 'bg-yellow-400' :
              'bg-gray-400'
            }`}></div>
            <span className={`${isCompactMode ? 'text-xs' : 'text-sm'} text-gray-600`}>
              {equipment.status === EQUIPMENT_STATUS.AVAILABLE ? 'พร้อมใช้' :
               equipment.status === EQUIPMENT_STATUS.BORROWED ? 'ถูกยืม' :
               equipment.status === EQUIPMENT_STATUS.MAINTENANCE ? 'ซ่อมบำรุง' :
               'ไม่พร้อมใช้'}
            </span>
          </div>

          {/* New/Updated Indicator */}
          {equipment.createdAt && (
            (() => {
              const createdDate = equipment.createdAt.toDate ? equipment.createdAt.toDate() : new Date(equipment.createdAt);
              const daysSinceCreated = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
              
              if (daysSinceCreated <= 7) {
                return (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                    isCompactMode ? 'text-xs' : 'text-xs'
                  } font-medium bg-blue-100 text-blue-800`}>
                    ใหม่
                  </span>
                );
              }
              return null;
            })()
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={isListMode ? 'ml-4 flex items-center space-x-2 flex-shrink-0' : ''}>
        <div className={isListMode ? 'flex space-x-1' : isCompactMode ? 'flex space-x-1 px-3 pb-3' : 'flex flex-col space-y-2'}>
          {/* User Actions */}
          {!isAdmin && (
            <div className={isListMode || isCompactMode ? 'flex space-x-1' : 'flex space-x-2'}>
              <button
                onClick={handleBorrow}
                disabled={!canBorrow.canBorrow}
                className={`${
                  isListMode || isCompactMode ? 'px-2 py-1 text-xs' : 'flex-1 px-3 py-2 text-sm'
                } font-medium rounded-md transition-colors ${
                  canBorrow.canBorrow
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title={!canBorrow.canBorrow ? canBorrow.reason : 'ขอยืมอุปกรณ์'}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {!(isListMode || isCompactMode) && 'ขอยืม'}
              </button>
              
              <button
                onClick={handleReserve}
                disabled={!canBorrow.canBorrow}
                className={`${
                  isListMode || isCompactMode ? 'px-2 py-1 text-xs' : 'flex-1 px-3 py-2 text-sm'
                } font-medium rounded-md transition-colors ${
                  canBorrow.canBorrow
                    ? 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title={!canBorrow.canBorrow ? canBorrow.reason : 'จองล่วงหน้า'}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {!(isListMode || isCompactMode) && 'จอง'}
              </button>
            </div>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <div className={isListMode || isCompactMode ? 'flex space-x-1' : 'flex space-x-2'}>
              <button
                onClick={handleEdit}
                className={`${
                  isListMode || isCompactMode ? 'px-2 py-1 text-xs' : 'flex-1 px-3 py-2 text-sm'
                } font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors`}
                title="แก้ไข"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {!(isListMode || isCompactMode) && 'แก้ไข'}
              </button>
              
              <button
                onClick={handleDelete}
                disabled={equipment.status === EQUIPMENT_STATUS.BORROWED}
                className={`${
                  isListMode || isCompactMode ? 'px-2 py-1 text-xs' : 'flex-1 px-3 py-2 text-sm'
                } font-medium rounded-md transition-colors ${
                  equipment.status === EQUIPMENT_STATUS.BORROWED
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                }`}
                title={equipment.status === EQUIPMENT_STATUS.BORROWED ? 'ไม่สามารถลบอุปกรณ์ที่กำลังถูกยืมได้' : 'ลบอุปกรณ์'}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {!(isListMode || isCompactMode) && 'ลบ'}
              </button>
            </div>
          )}

          {/* View Detail Button */}
          {!(isListMode || isCompactMode) && (
            <button
              onClick={handleViewDetail}
              className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              ดูรายละเอียด
            </button>
          )}

          {/* View Detail Button for List/Compact Mode */}
          {(isListMode || isCompactMode) && (
            <button
              onClick={handleViewDetail}
              className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              title="ดูรายละเอียด"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedEquipmentCard;