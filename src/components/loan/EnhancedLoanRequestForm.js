/**
 * Enhanced Loan Request Form Component
 * 
 * Improved loan request form with:
 * - Real-time validation
 * - Better error feedback
 * - Equipment info fallback
 * - Clear status display
 * - User type limits enforcement (Requirements: 4.1, 4.2, 4.3, 4.4, 4.5)
 */

import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import useLoanRequestValidation from '../../hooks/useLoanRequestValidation';
import EquipmentInfoFallback from './EquipmentInfoFallback';
import LoadingSpinner from '../common/LoadingSpinner';
import { useSettings } from '../../contexts/SettingsContext';
import { useClosedDates } from '../../hooks/useClosedDates';
import { useCategoryLimits } from '../../hooks/useCategoryLimits';
import { useUserTypeLimits } from '../../hooks/useUserTypeLimits';
import useLunchBreak from '../../hooks/useLunchBreak';

/**
 * Field Input Component with validation feedback
 */
const ValidatedInput = ({ 
  label, 
  name, 
  type = 'text',
  value, 
  onChange, 
  onBlur,
  error,
  isValid,
  status,
  required = false,
  placeholder = '',
  helpText = '',
  ...props 
}) => {
  const getStatusIcon = () => {
    if (status === 'error') {
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    }
    if (status === 'success') {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
    return null;
  };

  const getInputClasses = () => {
    const base = 'block w-full rounded-md shadow-sm sm:text-sm';
    if (status === 'error') {
      return `${base} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
    }
    if (status === 'success') {
      return `${base} border-green-300 focus:ring-green-500 focus:border-green-500`;
    }
    return `${base} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
  };

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        {type === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={4}
            className={getInputClasses()}
            {...props}
          />
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            className={getInputClasses()}
            {...props}
          />
        )}
        {(status === 'error' || status === 'success') && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {getStatusIcon()}
          </div>
        )}
      </div>
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <ExclamationCircleIcon className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
      {status === 'success' && !error && (
        <p className="mt-1 text-sm text-green-600 flex items-center">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          ถูกต้อง
        </p>
      )}
    </div>
  );
};

/**
 * EnhancedLoanRequestForm Component
 */
const EnhancedLoanRequestForm = ({ 
  equipment: initialEquipment,
  equipmentId,
  onSubmit, 
  onCancel,
  loading = false 
}) => {
  const [equipment, setEquipment] = useState(initialEquipment);
  const { settings } = useSettings();
  const { isDateClosed, closedDates } = useClosedDates();
  const { getCategoryLimit } = useCategoryLimits();
  
  // Use user type limits hook (Requirements: 4.1, 4.4, 4.5)
  const {
    limits,
    loading: limitsLoading,
    currentBorrowedCount,
    pendingRequestsCount,
    remainingQuota,
    canBorrow
  } = useUserTypeLimits();
  
  // Use lunch break hook
  const { 
    lunchBreak, 
    lunchBreakDisplay, 
    lunchBreakMessage 
  } = useLunchBreak();
  
  // Get max loan duration from user type limits (Requirements: 4.2)
  // Use user type specific maxDays if available, otherwise fall back to settings
  const maxLoanDuration = limits?.maxDays || settings?.maxLoanDuration || 30;
  
  // Get max items from user type limits (Requirements: 4.3)
  const maxItems = limits?.maxItems || 5;
  
  // Check if user has exceeded max items (Requirements: 4.3)
  const hasExceededMaxItems = !canBorrow;
  
  // Get category limit for this equipment
  const categoryLimit = equipment?.category ? getCategoryLimit(equipment.category) : null;
  
  const {
    formData,
    handleFieldChange,
    handleFieldBlur,
    validateAllFields,
    getFieldError,
    getFieldStatus,
    isValid,
    isValidating
  } = useLoanRequestValidation({
    equipmentId: equipmentId || '',
    borrowDate: '',
    expectedReturnDate: '',
    purpose: '',
    notes: ''
  });

  // Calculate loan duration
  const loanDuration = formData.borrowDate && formData.expectedReturnDate
    ? Math.ceil((new Date(formData.expectedReturnDate) - new Date(formData.borrowDate)) / (1000 * 60 * 60 * 24))
    : 0;
  
  // Calculate max return date based on borrow date and maxLoanDuration
  const maxReturnDate = formData.borrowDate 
    ? (() => {
        const maxDate = new Date(formData.borrowDate);
        maxDate.setDate(maxDate.getDate() + maxLoanDuration);
        return maxDate.toISOString().split('T')[0];
      })()
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const isFormValid = validateAllFields();
    if (!isFormValid) {
      return;
    }
    
    // Check for closed dates
    if (isDateStringClosed(formData.borrowDate)) {
      alert(`ไม่สามารถยืมในวันที่เลือกได้ เนื่องจากเป็นวันปิดทำการ: ${getClosedDateReason(formData.borrowDate)}`);
      return;
    }
    
    if (isDateStringClosed(formData.expectedReturnDate)) {
      alert(`ไม่สามารถคืนในวันที่เลือกได้ เนื่องจากเป็นวันปิดทำการ: ${getClosedDateReason(formData.expectedReturnDate)}`);
      return;
    }

    // Submit form
    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    handleFieldChange(name, value);
  };

  const handleInputBlur = (e) => {
    const { name } = e.target;
    handleFieldBlur(name);
  };

  /**
   * Check if a date string is closed
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {boolean} True if date is closed
   */
  const isDateStringClosed = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return isDateClosed(date);
  };

  /**
   * Get tooltip text for a closed date
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {string|null} Reason for closure or null
   */
  const getClosedDateReason = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    
    const closedDate = closedDates.find(cd => {
      if (!cd.date) return false;
      const cdDate = new Date(cd.date);
      cdDate.setHours(0, 0, 0, 0);
      return cdDate.getTime() === date.getTime();
    });
    
    return closedDate ? closedDate.reason : null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Lunch Break Notice */}
      {lunchBreak.enabled && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-orange-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-orange-800">เวลาพักกลางวัน</h4>
              <p className="mt-1 text-sm text-orange-700">
                {lunchBreakMessage || `พักกลางวัน ${lunchBreakDisplay || '12:00 - 13:00 น.'} ไม่สามารถรับ-คืนอุปกรณ์ได้`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Borrowing Limits Info (Requirements: 4.1, 4.4) */}
      {!limitsLoading && (
        <div className={`rounded-lg border p-4 ${hasExceededMaxItems ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-start">
            <InformationCircleIcon className={`w-5 h-5 mt-0.5 mr-2 ${hasExceededMaxItems ? 'text-red-500' : 'text-blue-500'}`} />
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${hasExceededMaxItems ? 'text-red-800' : 'text-blue-800'}`}>
                สิทธิ์การยืมของคุณ ({limits?.userTypeName || 'ไม่ระบุประเภท'})
              </h4>
              <div className="mt-2 text-sm space-y-1">
                {/* Remaining Quota Display (Requirements: 4.4) */}
                <p className={hasExceededMaxItems ? 'text-red-700 font-medium' : 'text-blue-700'}>
                  {hasExceededMaxItems ? (
                    <>
                      <ExclamationCircleIcon className="w-4 h-4 inline mr-1" />
                      คุณยืมอุปกรณ์ครบจำนวนสูงสุดแล้ว ({currentBorrowedCount + pendingRequestsCount}/{maxItems} ชิ้น)
                    </>
                  ) : (
                    <>คุณยืมได้อีก <span className="font-semibold">{remainingQuota} ชิ้น</span> จากทั้งหมด {maxItems} ชิ้น</>
                  )}
                </p>
                <p className="text-blue-600">
                  ระยะเวลายืมสูงสุด: <span className="font-semibold">{maxLoanDuration} วัน</span>
                </p>
                {limits?.maxAdvanceBookingDays && (
                  <p className="text-blue-600">
                    จองล่วงหน้าได้สูงสุด: <span className="font-semibold">{limits.maxAdvanceBookingDays} วัน</span>
                  </p>
                )}
              </div>
              {/* Current Status */}
              {(currentBorrowedCount > 0 || pendingRequestsCount > 0) && (
                <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-600">
                  {currentBorrowedCount > 0 && <span>กำลังยืม: {currentBorrowedCount} ชิ้น</span>}
                  {currentBorrowedCount > 0 && pendingRequestsCount > 0 && <span className="mx-1">|</span>}
                  {pendingRequestsCount > 0 && <span>รอดำเนินการ: {pendingRequestsCount} รายการ</span>}
                </div>
              )}
              {/* Warning for user type not set */}
              {limits?.warning && (
                <p className="mt-2 text-xs text-amber-600">
                  <ExclamationCircleIcon className="w-4 h-4 inline mr-1" />
                  {limits.warning}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Max Items Exceeded Warning (Requirements: 4.3) */}
      {hasExceededMaxItems && (
        <div className="rounded-md bg-red-100 border border-red-300 p-4">
          <div className="flex">
            <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-800">ไม่สามารถส่งคำขอยืมได้</h4>
              <p className="mt-1 text-sm text-red-700">
                คุณมีอุปกรณ์ที่กำลังยืมและคำขอที่รอดำเนินการรวม {currentBorrowedCount + pendingRequestsCount} ชิ้น 
                ซึ่งถึงจำนวนสูงสุดที่อนุญาต ({maxItems} ชิ้น) แล้ว
              </p>
              <p className="mt-1 text-sm text-red-600">
                กรุณาคืนอุปกรณ์หรือรอให้คำขอได้รับการดำเนินการก่อน
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          อุปกรณ์ที่ต้องการยืม
        </label>
        <EquipmentInfoFallback
          equipment={equipment}
          equipmentId={equipmentId}
          onEquipmentLoaded={setEquipment}
          showRetry={true}
        />
        
        {/* Category Limit Info */}
        {equipment && categoryLimit && (
          <div className="mt-2 rounded-md bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">ข้อจำกัดหมวดหมู่:</span> สามารถยืมอุปกรณ์ในหมวดหมู่นี้ได้สูงสุด {categoryLimit} ชิ้นพร้อมกัน
            </p>
          </div>
        )}
      </div>

      {/* Borrow Date */}
      <ValidatedInput
        label="วันที่ต้องการยืม"
        name="borrowDate"
        type="date"
        value={formData.borrowDate}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        error={getFieldError('borrowDate') || (isDateStringClosed(formData.borrowDate) ? `วันนี้ปิดทำการ: ${getClosedDateReason(formData.borrowDate)}` : null)}
        status={isDateStringClosed(formData.borrowDate) ? 'error' : getFieldStatus('borrowDate')}
        required
        helpText="เลือกวันที่ต้องการรับอุปกรณ์ (ไม่รวมวันปิดทำการ)"
      />
      
      {/* Closed Date Warning for Borrow Date */}
      {formData.borrowDate && isDateStringClosed(formData.borrowDate) && (
        <div className="mt-2 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">
            <ExclamationCircleIcon className="w-5 h-5 inline mr-1" />
            วันที่เลือกเป็นวันปิดทำการ: {getClosedDateReason(formData.borrowDate)}
          </p>
        </div>
      )}

      {/* Expected Return Date */}
      <ValidatedInput
        label="วันที่คาดว่าจะคืน"
        name="expectedReturnDate"
        type="date"
        value={formData.expectedReturnDate}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        error={getFieldError('expectedReturnDate') || (isDateStringClosed(formData.expectedReturnDate) ? `วันนี้ปิดทำการ: ${getClosedDateReason(formData.expectedReturnDate)}` : null)}
        status={isDateStringClosed(formData.expectedReturnDate) ? 'error' : getFieldStatus('expectedReturnDate')}
        required
        min={formData.borrowDate || undefined}
        max={maxReturnDate || undefined}
        helpText={`เลือกวันที่จะคืนอุปกรณ์ (สูงสุด ${maxLoanDuration} วัน, ไม่รวมวันปิดทำการ)`}
      />
      
      {/* Closed Date Warning for Return Date */}
      {formData.expectedReturnDate && isDateStringClosed(formData.expectedReturnDate) && (
        <div className="mt-2 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">
            <ExclamationCircleIcon className="w-5 h-5 inline mr-1" />
            วันที่เลือกเป็นวันปิดทำการ: {getClosedDateReason(formData.expectedReturnDate)}
          </p>
        </div>
      )}

      {/* Loan Duration Display */}
      {loanDuration > 0 && (
        <div className={`rounded-md p-3 ${loanDuration > maxLoanDuration ? 'bg-red-50' : 'bg-blue-50'}`}>
          <p className={`text-sm ${loanDuration > maxLoanDuration ? 'text-red-700' : 'text-blue-700'}`}>
            ระยะเวลายืม: <span className="font-semibold">{loanDuration} วัน</span>
            {loanDuration > maxLoanDuration && ` (เกินกำหนด ${maxLoanDuration} วัน)`}
          </p>
        </div>
      )}

      {/* Purpose */}
      <ValidatedInput
        label="วัตถุประสงค์การใช้งาน"
        name="purpose"
        type="textarea"
        value={formData.purpose}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        error={getFieldError('purpose')}
        status={getFieldStatus('purpose')}
        required
        placeholder="ระบุวัตถุประสงค์ในการยืมอุปกรณ์ (อย่างน้อย 10 ตัวอักษร)"
        helpText={`${formData.purpose.length}/500 ตัวอักษร`}
      />

      {/* Notes */}
      <ValidatedInput
        label="หมายเหตุเพิ่มเติม"
        name="notes"
        type="textarea"
        value={formData.notes}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        error={getFieldError('notes')}
        status={getFieldStatus('notes')}
        placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
        helpText={`${formData.notes.length}/500 ตัวอักษร`}
      />

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={
            loading || 
            !isValid || 
            isValidating || 
            isDateStringClosed(formData.borrowDate) || 
            isDateStringClosed(formData.expectedReturnDate) ||
            hasExceededMaxItems ||
            limitsLoading
          }
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              กำลังส่งคำขอ...
            </>
          ) : hasExceededMaxItems ? (
            'ไม่สามารถยืมได้ (เกินจำนวนสูงสุด)'
          ) : (
            'ส่งคำขอยืม'
          )}
        </button>
      </div>

      {/* Validation Status */}
      {isValidating && (
        <div className="text-sm text-gray-500 flex items-center justify-center">
          <LoadingSpinner size="sm" className="mr-2" />
          กำลังตรวจสอบข้อมูล...
        </div>
      )}
    </form>
  );
};

export default EnhancedLoanRequestForm;
