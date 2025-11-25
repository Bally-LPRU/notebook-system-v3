import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import LoanRequestService from '../../services/loanRequestService';
import EquipmentService from '../../services/equipmentService';
import { 
  DEFAULT_LOAN_REQUEST_FORM, 
  DEFAULT_LOAN_DURATION_DAYS,
  MAX_LOAN_DURATION_DAYS
} from '../../types/loanRequest';
import { EQUIPMENT_STATUS } from '../../types/equipment';

const LoanRequestForm = ({ equipmentId, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    ...DEFAULT_LOAN_REQUEST_FORM,
    borrowDate: '',
    expectedReturnDate: '',
    expectedReturnTime: ''
  });
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const maxLoanDuration = useMemo(
    () => settings?.maxLoanDuration || MAX_LOAN_DURATION_DAYS,
    [settings?.maxLoanDuration]
  );
  const returnWindowStart = settings?.loanReturnStartTime || null;
  const returnWindowEnd = settings?.loanReturnEndTime || null;

  useEffect(() => {
    const loadEquipmentData = async () => {
      try {
        const equipmentData = await EquipmentService.getEquipmentById(equipmentId);
        setEquipment(equipmentData);
      } catch (error) {
        console.error('Error loading equipment:', error);
        setErrors({ general: 'ไม่สามารถโหลดข้อมูลอุปกรณ์ได้' });
      }
    };

    if (equipmentId) {
      loadEquipmentData();

      // Default borrow date = today, return fields empty
      const today = new Date();
      const borrowDate = today.toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        equipmentId,
        borrowDate,
        expectedReturnDate: '',
        expectedReturnTime: ''
      }));
    }
  }, [equipmentId]);



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Reset return date/time when borrow date changes
    if (name === 'borrowDate' && value) {
      setFormData(prev => ({
        ...prev,
        expectedReturnDate: '',
        expectedReturnTime: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Equipment validation
    if (!formData.equipmentId) {
      newErrors.equipmentId = 'กรุณาเลือกอุปกรณ์';
    }

    // Borrow date validation
    if (!formData.borrowDate) {
      newErrors.borrowDate = 'กรุณาเลือกวันที่ยืม';
    } else {
      const borrowDate = new Date(formData.borrowDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (borrowDate < today) {
        newErrors.borrowDate = 'วันที่ยืมต้องไม่เป็นวันที่ผ่านมาแล้ว';
      }
    }

    // Return date/time validation
    if (!formData.expectedReturnDate) {
      newErrors.expectedReturnDate = 'กรุณาเลือกวันที่คืน';
    }

    if (!formData.expectedReturnTime) {
      newErrors.expectedReturnTime = 'กรุณาเลือกเวลาคืน';
    }

    if (
      formData.borrowDate &&
      formData.expectedReturnDate &&
      formData.expectedReturnTime
    ) {
      const borrowDateTime = new Date(`${formData.borrowDate}T00:00`);
      const returnDateTime = new Date(`${formData.expectedReturnDate}T${formData.expectedReturnTime}`);
      
      if (returnDateTime <= borrowDateTime) {
        newErrors.expectedReturnDate = 'วัน/เวลาคืนต้องหลังจากวันยืม';
      } else {
        const loanDurationMs = returnDateTime.getTime() - borrowDateTime.getTime();
        const loanDurationDays = Math.ceil(loanDurationMs / (1000 * 60 * 60 * 24));
        
        if (loanDurationDays > maxLoanDuration) {
          newErrors.expectedReturnDate = `ระยะเวลายืมต้องไม่เกิน ${maxLoanDuration} วัน (ตามกฎผู้ดูแลระบบ)`;
        }

        // Optional admin-defined return window
        const selectedTime = formData.expectedReturnTime;
        if (returnWindowStart && selectedTime < returnWindowStart) {
          newErrors.expectedReturnTime = `เวลาคืนต้องไม่น้อยกว่า ${returnWindowStart}`;
        }
        if (returnWindowEnd && selectedTime > returnWindowEnd) {
          newErrors.expectedReturnTime = `เวลาคืนต้องไม่เกิน ${returnWindowEnd}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const expectedReturnDateTime = new Date(`${formData.expectedReturnDate}T${formData.expectedReturnTime || '23:59'}`);

      await LoanRequestService.createLoanRequest(
        {
          ...formData,
          expectedReturnDate: expectedReturnDateTime,
          purpose: 'ยืมอุปกรณ์เพื่อการปฏิบัติงาน',
          notes: ''
        },
        user.uid
      );
      onSuccess?.();
    } catch (error) {
      console.error('Error creating loan request:', error);
      setErrors({ general: error.message || 'เกิดข้อผิดพลาดในการส่งคำขอยืม' });
    } finally {
      setLoading(false);
    }
  };

  const calculateLoanDuration = () => {
    if (formData.borrowDate && formData.expectedReturnDate) {
      const borrowDateTime = new Date(`${formData.borrowDate}T00:00`);
      const returnDateTime = new Date(`${formData.expectedReturnDate}T${formData.expectedReturnTime || '23:59'}`);
      const diffTime = returnDateTime.getTime() - borrowDateTime.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (!equipment) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">กำลังโหลดข้อมูลอุปกรณ์...</span>
      </div>
    );
  }

  if (equipment.status !== EQUIPMENT_STATUS.AVAILABLE) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-red-800">อุปกรณ์ไม่พร้อมใช้งาน</h3>
            <p className="text-red-700 mt-1">
              อุปกรณ์นี้ไม่พร้อมสำหรับการยืมในขณะนี้
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">ส่งคำขอยืมอุปกรณ์</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Equipment Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">ข้อมูลอุปกรณ์</h3>
          <div className="flex items-start space-x-4">
            {equipment.imageURL && (
              <img
                src={equipment.imageURL}
                alt={equipment.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{equipment.name}</h4>
              <p className="text-gray-600">{equipment.brand} {equipment.model}</p>
              <p className="text-sm text-gray-500">หมายเลขอุปกรณ์: {equipment.equipmentNumber || equipment.serialNumber || '-'}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                พร้อมใช้งาน
              </span>
            </div>
          </div>
          <div className="mt-3 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-medium">กฎการยืม</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>ยืมได้สูงสุด {maxLoanDuration} วัน (ตามที่ผู้ดูแลระบบกำหนด)</li>
              <li>เวลายืมถูกบันทึกอัตโนมัติเมื่อผู้ดูแลอนุมัติ</li>
              <li>โปรดระบุเวลาคืนที่ต้องการ</li>
              {returnWindowStart && returnWindowEnd && (
                <li>เวลาคืนต้องอยู่ระหว่าง {returnWindowStart} - {returnWindowEnd}</li>
              )}
            </ul>
          </div>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-800">{errors.general}</p>
            </div>
          </div>
        )}

        {/* Date & Time Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label htmlFor="borrowDate" className="block text-sm font-medium text-gray-700 mb-2">
              วันที่ต้องการยืม <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="borrowDate"
              name="borrowDate"
              value={formData.borrowDate}
              onChange={handleInputChange}
              min={getTodayDate()}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.borrowDate ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.borrowDate && (
              <p className="mt-1 text-sm text-red-600">{errors.borrowDate}</p>
            )}
          </div>

          <div className="md:col-span-1">
            <label htmlFor="expectedReturnDate" className="block text-sm font-medium text-gray-700 mb-2">
              วันที่คาดว่าจะคืน <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="expectedReturnDate"
              name="expectedReturnDate"
              value={formData.expectedReturnDate}
              onChange={handleInputChange}
              min={formData.borrowDate || getTodayDate()}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.expectedReturnDate ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.expectedReturnDate && (
              <p className="mt-1 text-sm text-red-600">{errors.expectedReturnDate}</p>
            )}
          </div>

          <div className="md:col-span-1">
            <label htmlFor="expectedReturnTime" className="block text-sm font-medium text-gray-700 mb-2">
              เวลาคืนที่ต้องการ <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="expectedReturnTime"
              name="expectedReturnTime"
              value={formData.expectedReturnTime}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.expectedReturnTime ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.expectedReturnTime && (
              <p className="mt-1 text-sm text-red-600">{errors.expectedReturnTime}</p>
            )}
          </div>
        </div>

        {/* Loan Duration Display */}
        {formData.borrowDate && formData.expectedReturnDate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800">
                ระยะเวลายืม: <strong>{calculateLoanDuration()} วัน</strong>
                {calculateLoanDuration() > maxLoanDuration && (
                  <span className="text-red-600 ml-2">(เกินกฎสูงสุด {maxLoanDuration} วัน)</span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                กำลังส่งคำขอ...
              </div>
            ) : (
              'ส่งคำขอยืม'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoanRequestForm;
