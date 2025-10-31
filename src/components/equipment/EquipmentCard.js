import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  EQUIPMENT_STATUS_LABELS, 
  EQUIPMENT_CATEGORY_LABELS,
  EQUIPMENT_STATUS 
} from '../../types/equipment';
import { getEquipmentStatusColor, canBorrowEquipment } from '../../utils/equipmentValidation';

const EquipmentCard = ({ 
  equipment, 
  onBorrow, 
  onReserve, 
  onEdit, 
  onDelete,
  onViewDetail,
  isSelectable = false,
  isSelected = false,
  onSelect
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

  const canBorrow = canBorrowEquipment(equipment);
  const statusColor = getEquipmentStatusColor(equipment.status);

  const handleSelectChange = (e) => {
    if (onSelect) {
      onSelect(e.target.checked);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border transition-all duration-200 ${
      isSelected 
        ? 'border-blue-500 shadow-md ring-2 ring-blue-200' 
        : 'border-gray-200 hover:shadow-md'
    }`}>
      {/* Equipment Image */}
      <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
        {equipment.imageURL && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
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
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Selection Checkbox */}
        {isSelectable && (
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
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            {EQUIPMENT_STATUS_LABELS[equipment.status]}
          </span>
        </div>
      </div>

      {/* Equipment Info */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {equipment.name}
          </h3>
          <p className="text-sm text-gray-600">
            {EQUIPMENT_CATEGORY_LABELS[equipment.category] || equipment.category}
          </p>
        </div>

        <div className="space-y-1 mb-4">
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
        {equipment.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {equipment.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          {/* User Actions */}
          {!isAdmin && (
            <div className="flex space-x-2">
              <button
                onClick={handleBorrow}
                disabled={!canBorrow.canBorrow}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  canBorrow.canBorrow
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title={!canBorrow.canBorrow ? canBorrow.reason : 'ขอยืมอุปกรณ์'}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                ขอยืม
              </button>
              
              <button
                onClick={handleReserve}
                disabled={!canBorrow.canBorrow}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  canBorrow.canBorrow
                    ? 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title={!canBorrow.canBorrow ? canBorrow.reason : 'จองล่วงหน้า'}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                จอง
              </button>
            </div>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                แก้ไข
              </button>
              
              <button
                onClick={handleDelete}
                disabled={equipment.status === EQUIPMENT_STATUS.BORROWED}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  equipment.status === EQUIPMENT_STATUS.BORROWED
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                }`}
                title={equipment.status === EQUIPMENT_STATUS.BORROWED ? 'ไม่สามารถลบอุปกรณ์ที่กำลังถูกยืมได้' : 'ลบอุปกรณ์'}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                ลบ
              </button>
            </div>
          )}

          {/* View Detail Button */}
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
        </div>
      </div>
    </div>
  );
};

export default EquipmentCard;