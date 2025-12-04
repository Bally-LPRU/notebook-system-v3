import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  EQUIPMENT_STATUS 
} from '../../types/equipment';
import { canBorrowEquipment } from '../../utils/equipmentValidation';
import { getCategoryName } from '../../utils/equipmentHelpers';
import EquipmentStatusBadge from './EquipmentStatusBadge';

const EquipmentCard = ({ 
  equipment, 
  userActiveRequest = null,
  onBorrow, 
  onReserve, 
  onEdit, 
  onDelete,
  onViewDetail,
  isSelectable = false,
  isSelected = false,
  onSelect,
  viewMode = 'grid'
}) => {
  const { isAdmin } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleBorrow = () => {
    if (onBorrow) {
      onBorrow(equipment);
    }
  };

  const handleReserve = () => {
    if (onReserve) {
      onReserve(equipment);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(equipment);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(equipment);
    }
  };

  const handleViewDetail = () => {
    if (onViewDetail) {
      onViewDetail(equipment);
    }
  };

  const canBorrow = canBorrowEquipment(equipment) || { canBorrow: true, reason: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hasUserActiveRequest = (() => {
    if (!userActiveRequest) return false;
    const status = userActiveRequest.status;
    const blocking = ['pending', 'approved', 'borrowed'];
    if (!blocking.includes(status)) return false;

    if (userActiveRequest.expectedReturnDate) {
      const expected = userActiveRequest.expectedReturnDate.toDate
        ? userActiveRequest.expectedReturnDate.toDate()
        : new Date(userActiveRequest.expectedReturnDate);
      if (expected < today) {
        return false;
      }
    }
    return true;
  })();

  const userBlockReason = hasUserActiveRequest
    ? 'คุณมีคำขอหรือกำลังยืมอุปกรณ์นี้อยู่'
    : null;
  const isBorrowDisabled = !canBorrow.canBorrow || hasUserActiveRequest;
  const borrowDisableReason = userBlockReason || canBorrow.reason;

  const handleSelectChange = (e) => {
    if (onSelect) {
      onSelect(e.target.checked);
    }
  };

  // Different layouts based on view mode
  const isListMode = viewMode === 'list';
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border transition-all duration-200 ${
      isSelected 
        ? 'border-blue-500 shadow-md ring-2 ring-blue-200' 
        : 'border-gray-200 hover:shadow-md'
    } ${isListMode ? 'flex items-center p-4' : ''}`}>
      {/* Equipment Image */}
      <div className={`relative bg-gray-100 overflow-hidden ${
        isListMode 
          ? 'w-16 h-16 rounded-lg flex-shrink-0' 
          : 'h-48 rounded-t-lg'
      }`}>
        {equipment.imageURL && !imageError ? (
          <>
            {imageLoading && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                role="status"
                aria-live="polite"
                aria-label="กำลังโหลดภาพอุปกรณ์"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <svg
              className={`text-gray-400 ${isListMode ? 'w-8 h-8' : 'w-16 h-16'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="ไม่มีภาพอุปกรณ์"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Selection Checkbox */}
        {isSelectable && !isListMode && (
          <div className="absolute top-2 left-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        )}
        
        {/* Status Badge */}
        {!isListMode && (
          <div className="absolute top-2 right-2">
            <EquipmentStatusBadge status={equipment.status} size="sm" />
          </div>
        )}
      </div>

      {/* Selection Checkbox for List Mode */}
      {isSelectable && isListMode && (
        <div className="mr-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      )}

      {/* Equipment Info */}
      <div className={isListMode ? 'flex-1 ml-4' : 'p-4'}>
        <div className={isListMode ? 'flex items-center justify-between' : 'mb-2'}>
          <div className={isListMode ? 'flex-1' : ''}>
            <h3 className={`font-semibold text-gray-900 line-clamp-2 ${
              isListMode ? 'text-base mb-1' : 'text-lg mb-1'
            }`}>
              {equipment.name}
            </h3>
            <p className="text-sm text-gray-600">
              {getCategoryName(equipment.category)}
            </p>
          </div>
          
          {/* Status Badge for List Mode */}
          {isListMode && (
            <div className="ml-4">
              <EquipmentStatusBadge status={equipment.status} size="sm" />
            </div>
          )}
        </div>

        <div className={`space-y-1 ${isListMode ? 'mb-2' : 'mb-4'} ${isListMode ? 'grid grid-cols-2 gap-x-4 gap-y-1' : ''}`}>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ยี่ห้อ:</span>
            <span className="text-gray-900 font-medium">{equipment.brand}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">รุ่น:</span>
            <span className="text-gray-900 font-medium">{equipment.model}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">รหัส:</span>
            <span className="text-gray-900 font-medium font-mono text-xs">
              {equipment.serialNumber}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">สถานที่:</span>
            <span className="text-gray-900 font-medium">{equipment.location}</span>
          </div>
        </div>

        {/* Description */}
        {equipment.description && !isListMode && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {equipment.description}
            </p>
          </div>
        )}

      {/* Action Buttons */}
      <div className={isListMode ? 'ml-4 flex items-center space-x-2' : ''}>
        <div className={isListMode ? 'flex space-x-2' : 'flex flex-col space-y-2'}>
          {/* User Actions */}
          {!isAdmin && (
            <div className={isListMode ? 'flex space-x-1' : 'flex space-x-2'}>
              <button
                onClick={handleBorrow}
                disabled={isBorrowDisabled}
                className={`${isListMode ? 'px-2 py-1' : 'flex-1 px-3 py-2'} text-sm font-medium rounded-md transition-colors ${
                  !isBorrowDisabled
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title={borrowDisableReason || 'ขอยืมอุปกรณ์'}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {!isListMode && 'ขอยืม'}
              </button>
              
              <button
                onClick={handleReserve}
                disabled={isBorrowDisabled}
                className={`${isListMode ? 'px-2 py-1' : 'flex-1 px-3 py-2'} text-sm font-medium rounded-md transition-colors ${
                  !isBorrowDisabled
                    ? 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title={borrowDisableReason || 'จองล่วงหน้า'}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {!isListMode && 'จอง'}
              </button>
            </div>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <div className={isListMode ? 'flex space-x-1' : 'flex space-x-2'}>
              <button
                onClick={handleEdit}
                className={`${isListMode ? 'px-2 py-1' : 'flex-1 px-3 py-2'} text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors`}
                title="แก้ไข"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {!isListMode && 'แก้ไข'}
              </button>
              
              <button
                onClick={handleDelete}
                disabled={equipment.status === EQUIPMENT_STATUS.BORROWED}
                className={`${isListMode ? 'px-2 py-1' : 'flex-1 px-3 py-2'} text-sm font-medium rounded-md transition-colors ${
                  equipment.status === EQUIPMENT_STATUS.BORROWED
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                }`}
                title={equipment.status === EQUIPMENT_STATUS.BORROWED ? 'ไม่สามารถลบอุปกรณ์ที่กำลังถูกยืมได้' : 'ลบอุปกรณ์'}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {!isListMode && 'ลบ'}
              </button>
            </div>
          )}

          {/* View Detail Button */}
          {!isListMode && (
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

          {/* View Detail Button for List Mode */}
          {isListMode && (
            <button
              onClick={handleViewDetail}
              className="px-2 py-1 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
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
    </div>
  );
};

export default EquipmentCard;
