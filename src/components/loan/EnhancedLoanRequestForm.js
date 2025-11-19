/**
 * Enhanced Loan Request Form Component
 * 
 * Improved loan request form with:
 * - Real-time validation
 * - Better error feedback
 * - Equipment info fallback
 * - Clear status display
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import useLoanRequestValidation from '../../hooks/useLoanRequestValidation';
import EquipmentInfoFallback from './EquipmentInfoFallback';
import LoadingSpinner from '../common/LoadingSpinner';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const isFormValid = validateAllFields();
    if (!isFormValid) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
      </div>

      {/* Borrow Date */}
      <ValidatedInput
        label="วันที่ต้องการยืม"
        name="borrowDate"
        type="date"
        value={formData.borrowDate}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        error={getFieldError('borrowDate')}
        status={getFieldStatus('borrowDate')}
        required
        helpText="เลือกวันที่ต้องการรับอุปกรณ์"
      />

      {/* Expected Return Date */}
      <ValidatedInput
        label="วันที่คาดว่าจะคืน"
        name="expectedReturnDate"
        type="date"
        value={formData.expectedReturnDate}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        error={getFieldError('expectedReturnDate')}
        status={getFieldStatus('expectedReturnDate')}
        required
        helpText="เลือกวันที่จะคืนอุปกรณ์ (สูงสุด 30 วัน)"
      />

      {/* Loan Duration Display */}
      {loanDuration > 0 && (
        <div className={`rounded-md p-3 ${loanDuration > 30 ? 'bg-red-50' : 'bg-blue-50'}`}>
          <p className={`text-sm ${loanDuration > 30 ? 'text-red-700' : 'text-blue-700'}`}>
            ระยะเวลายืม: <span className="font-semibold">{loanDuration} วัน</span>
            {loanDuration > 30 && ' (เกินกำหนด 30 วัน)'}
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
          disabled={loading || !isValid || isValidating}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              กำลังส่งคำขอ...
            </>
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
