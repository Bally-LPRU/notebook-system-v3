import { useState, useEffect } from 'react';
import { EQUIPMENT_STATUS } from '../../types/equipment';
import LoadingSpinner from '../common/LoadingSpinner';
import EquipmentStatusBadge from './EquipmentStatusBadge';

const BulkDeleteModal = ({
  isOpen,
  onClose,
  selectedEquipment = [],
  onConfirm,
  loading = false
}) => {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [confirmText, setConfirmText] = useState('');
  const [errors, setErrors] = useState({});

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setProgress({ current: 0, total: 0 });
      setConfirmText('');
      setErrors({});
    }
  }, [isOpen]);

  // Check for items that cannot be deleted
  const borrowedItems = selectedEquipment.filter(item => item.status === EQUIPMENT_STATUS.BORROWED);
  const deletableItems = selectedEquipment.filter(item => item.status !== EQUIPMENT_STATUS.BORROWED);
  
  const canDelete = deletableItems.length > 0;
  const hasRestrictions = borrowedItems.length > 0;

  const handleConfirm = async () => {
    // Validate confirmation text
    if (confirmText.toLowerCase() !== 'ลบ') {
      setErrors({ confirm: 'กรุณาพิมพ์ "ลบ" เพื่อยืนยัน' });
      return;
    }

    if (!canDelete) {
      setErrors({ general: 'ไม่มีรายการที่สามารถลบได้' });
      return;
    }

    try {
      await onConfirm(deletableItems, setProgress);
      onClose();
    } catch (error) {
      setErrors({ general: error.message || 'เกิดข้อผิดพลาดในการลบข้อมูล' });
    }
  };

  const handleConfirmTextChange = (e) => {
    setConfirmText(e.target.value);
    if (errors.confirm) {
      setErrors(prev => ({ ...prev, confirm: null }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">
              ลบอุปกรณ์หลายรายการ
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Warning Message */}
        <div className="mt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  คำเตือน: การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>คุณกำลังจะลบอุปกรณ์ทั้งหมด {selectedEquipment.length} รายการ</p>
                  <p>ข้อมูลทั้งหมดรวมถึงรูปภาพและประวัติการใช้งานจะถูกลบอย่างถาวร</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Summary */}
        <div className="mt-6 space-y-4">
          {/* Deletable Items */}
          {deletableItems.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                รายการที่จะถูกลบ ({deletableItems.length} รายการ)
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {deletableItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.name}</span>
                    <EquipmentStatusBadge status={item.status} size="sm" />
                  </div>
                ))}
                {deletableItems.length > 5 && (
                  <div className="text-sm text-gray-500 text-center">
                    และอีก {deletableItems.length - 5} รายการ
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Restricted Items */}
          {hasRestrictions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    รายการที่ไม่สามารถลบได้ ({borrowedItems.length} รายการ)
                  </h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>รายการเหล่านี้ไม่สามารถลบได้เนื่องจากกำลังถูกยืมอยู่</p>
                  </div>
                  <div className="mt-3 space-y-1 max-h-24 overflow-y-auto">
                    {borrowedItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="text-sm text-yellow-700">
                        • {item.name}
                      </div>
                    ))}
                    {borrowedItems.length > 3 && (
                      <div className="text-sm text-yellow-700">
                        และอีก {borrowedItems.length - 3} รายการ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700">{errors.general}</span>
            </div>
          </div>
        )}

        {/* Confirmation Input */}
        {canDelete && (
          <div className="mt-6">
            <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
              พิมพ์ <span className="font-bold text-red-600">"ลบ"</span> เพื่อยืนยันการลบ
            </label>
            <input
              type="text"
              id="confirmText"
              value={confirmText}
              onChange={handleConfirmTextChange}
              placeholder="พิมพ์ 'ลบ' เพื่อยืนยัน"
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm ${
                errors.confirm ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.confirm && (
              <p className="mt-1 text-sm text-red-600">{errors.confirm}</p>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {loading && progress.total > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>กำลังลบ...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ยกเลิก
          </button>
          
          {canDelete && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || confirmText.toLowerCase() !== 'ลบ'}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  กำลังลบ...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ลบ {deletableItems.length} รายการ
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteModal;