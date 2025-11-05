import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EQUIPMENT_STATUS, EQUIPMENT_STATUS_LABELS } from '../../types/equipment';
import LoadingSpinner from '../common/LoadingSpinner';

const BulkEditModal = ({
  isOpen,
  onClose,
  selectedEquipment = [],
  onSave,
  loading = false
}) => {
  const { isAdmin } = useAuth();
  const [editData, setEditData] = useState({
    status: '',
    location: '',
    responsiblePerson: '',
    notes: '',
    // Fields to update flags
    updateStatus: false,
    updateLocation: false,
    updateResponsiblePerson: false,
    updateNotes: false
  });
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEditData({
        status: '',
        location: '',
        responsiblePerson: '',
        notes: '',
        updateStatus: false,
        updateLocation: false,
        updateResponsiblePerson: false,
        updateNotes: false
      });
      setErrors({});
      setProgress({ current: 0, total: 0 });
    }
  }, [isOpen]);

  const handleFieldChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleUpdateToggle = (field) => {
    setEditData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Check if at least one field is selected for update
    const hasUpdates = editData.updateStatus || editData.updateLocation || 
                      editData.updateResponsiblePerson || editData.updateNotes;
    
    if (!hasUpdates) {
      newErrors.general = 'กรุณาเลือกฟิลด์อย่างน้อยหนึ่งฟิลด์เพื่อทำการอัปเดต';
    }

    // Validate required fields if they're selected for update
    if (editData.updateStatus && !editData.status) {
      newErrors.status = 'กรุณาเลือกสถานะ';
    }

    if (editData.updateLocation && !editData.location.trim()) {
      newErrors.location = 'กรุณากรอกสถานที่';
    }

    if (editData.updateResponsiblePerson && !editData.responsiblePerson.trim()) {
      newErrors.responsiblePerson = 'กรุณากรอกผู้รับผิดชอบ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare update data
    const updateData = {};
    if (editData.updateStatus) updateData.status = editData.status;
    if (editData.updateLocation) updateData.location = editData.location.trim();
    if (editData.updateResponsiblePerson) updateData.responsiblePerson = editData.responsiblePerson.trim();
    if (editData.updateNotes) updateData.notes = editData.notes.trim();

    try {
      await onSave(selectedEquipment, updateData, setProgress);
      onClose();
    } catch (error) {
      setErrors({ general: error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            แก้ไขอุปกรณ์หลายรายการ
          </h3>
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

        {/* Selected Items Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-800">
              จะทำการอัปเดต {selectedEquipment.length} รายการ
            </span>
          </div>
          
          {/* Show first few items */}
          <div className="mt-2 text-xs text-blue-700">
            {selectedEquipment.slice(0, 3).map((item, index) => (
              <div key={item.id}>• {item.name}</div>
            ))}
            {selectedEquipment.length > 3 && (
              <div>และอีก {selectedEquipment.length - 3} รายการ</div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700">{errors.general}</span>
              </div>
            </div>
          )}

          {/* Status Update */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="updateStatus"
                checked={editData.updateStatus}
                onChange={() => handleUpdateToggle('updateStatus')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="updateStatus" className="ml-2 text-sm font-medium text-gray-700">
                อัปเดตสถานะ
              </label>
            </div>
            
            {editData.updateStatus && (
              <div>
                <select
                  value={editData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.status ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">เลือกสถานะ</option>
                  {Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                )}
              </div>
            )}
          </div>

          {/* Location Update */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="updateLocation"
                checked={editData.updateLocation}
                onChange={() => handleUpdateToggle('updateLocation')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="updateLocation" className="ml-2 text-sm font-medium text-gray-700">
                อัปเดตสถานที่
              </label>
            </div>
            
            {editData.updateLocation && (
              <div>
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  placeholder="กรอกสถานที่ใหม่"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.location ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}
              </div>
            )}
          </div>

          {/* Responsible Person Update */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="updateResponsiblePerson"
                checked={editData.updateResponsiblePerson}
                onChange={() => handleUpdateToggle('updateResponsiblePerson')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="updateResponsiblePerson" className="ml-2 text-sm font-medium text-gray-700">
                อัปเดตผู้รับผิดชอบ
              </label>
            </div>
            
            {editData.updateResponsiblePerson && (
              <div>
                <input
                  type="text"
                  value={editData.responsiblePerson}
                  onChange={(e) => handleFieldChange('responsiblePerson', e.target.value)}
                  placeholder="กรอกชื่อผู้รับผิดชอบใหม่"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.responsiblePerson ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.responsiblePerson && (
                  <p className="mt-1 text-sm text-red-600">{errors.responsiblePerson}</p>
                )}
              </div>
            )}
          </div>

          {/* Notes Update */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="updateNotes"
                checked={editData.updateNotes}
                onChange={() => handleUpdateToggle('updateNotes')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="updateNotes" className="ml-2 text-sm font-medium text-gray-700">
                อัปเดตหมายเหตุ
              </label>
            </div>
            
            {editData.updateNotes && (
              <div>
                <textarea
                  value={editData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="กรอกหมายเหตุเพิ่มเติม"
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {loading && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>กำลังอัปเดต...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  กำลังอัปเดต...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  อัปเดต {selectedEquipment.length} รายการ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEditModal;