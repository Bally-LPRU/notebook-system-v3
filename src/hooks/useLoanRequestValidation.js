/**
 * Loan Request Validation Hook
 * 
 * Provides real-time validation for loan request forms.
 * Validates fields as user types with debouncing.
 * Integrates with settings for dynamic loan duration limits.
 */

import { useState, useCallback, useEffect } from 'react';
import { LOAN_REQUEST_VALIDATION } from '../types/loanRequest';
import { useSettings } from '../contexts/SettingsContext';
import { useClosedDates } from './useClosedDates';

/**
 * Get validation rules for loan request fields
 * @param {number} maxLoanDuration - Maximum loan duration from settings
 * @param {Function} isDateClosed - Function to check if a date is closed
 * @returns {Object} Validation rules
 */
const getValidationRules = (maxLoanDuration = 30, isDateClosed = () => false) => ({
  equipmentId: {
    required: true,
    validate: (value) => {
      if (!value) return 'กรุณาเลือกอุปกรณ์';
      return null;
    }
  },
  borrowDate: {
    required: true,
    validate: (value, formData) => {
      if (!value) return 'กรุณาระบุวันที่ยืม';
      
      const borrowDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (borrowDate < today) {
        return 'วันที่ยืมต้องไม่เป็นวันที่ผ่านมาแล้ว';
      }
      
      // Check if date is closed
      if (isDateClosed(borrowDate)) {
        return 'วันที่เลือกเป็นวันปิดทำการ';
      }
      
      return null;
    }
  },
  expectedReturnDate: {
    required: true,
    validate: (value, formData) => {
      if (!value) return 'กรุณาระบุวันที่คืน';
      
      const returnDate = new Date(value);
      const borrowDate = formData.borrowDate ? new Date(formData.borrowDate) : null;
      
      if (borrowDate && returnDate <= borrowDate) {
        return 'วันที่คืนต้องหลังจากวันที่ยืม';
      }
      
      // Check if date is closed
      if (isDateClosed(returnDate)) {
        return 'วันที่เลือกเป็นวันปิดทำการ';
      }
      
      // Check max duration using setting value
      if (borrowDate) {
        const diffTime = returnDate.getTime() - borrowDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > maxLoanDuration) {
          return `ระยะเวลายืมต้องไม่เกิน ${maxLoanDuration} วัน`;
        }
      }
      
      return null;
    }
  },
  purpose: {
    required: true,
    validate: (value) => {
      if (!value || !value.trim()) {
        return 'กรุณาระบุวัตถุประสงค์';
      }
      
      const trimmed = value.trim();
      
      if (trimmed.length < LOAN_REQUEST_VALIDATION.purpose.minLength) {
        return `วัตถุประสงค์ต้องมีอย่างน้อย ${LOAN_REQUEST_VALIDATION.purpose.minLength} ตัวอักษร`;
      }
      
      if (trimmed.length > LOAN_REQUEST_VALIDATION.purpose.maxLength) {
        return `วัตถุประสงค์ต้องไม่เกิน ${LOAN_REQUEST_VALIDATION.purpose.maxLength} ตัวอักษร`;
      }
      
      return null;
    }
  },
  notes: {
    required: false,
    validate: (value) => {
      if (!value) return null;
      
      const trimmed = value.trim();
      
      if (trimmed.length > LOAN_REQUEST_VALIDATION.notes.maxLength) {
        return `หมายเหตุต้องไม่เกิน ${LOAN_REQUEST_VALIDATION.notes.maxLength} ตัวอักษร`;
      }
      
      return null;
    }
  }
});

/**
 * useLoanRequestValidation Hook
 * @param {Object} initialFormData - Initial form data
 * @returns {Object} Validation state and methods
 */
const useLoanRequestValidation = (initialFormData = {}) => {
  const { settings } = useSettings();
  const { isDateClosed } = useClosedDates();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Debounce timer
  const [debounceTimers, setDebounceTimers] = useState({});
  
  // Get max loan duration from settings (default to 30 if not available)
  const maxLoanDuration = settings?.maxLoanDuration || 30;

  /**
   * Validate a single field
   */
  const validateField = useCallback((fieldName, value, currentFormData = formData) => {
    // Get validation rules with current maxLoanDuration and isDateClosed
    const validationRules = getValidationRules(maxLoanDuration, isDateClosed);
    const rule = validationRules[fieldName];
    if (!rule) return null;

    const error = rule.validate(value, currentFormData);
    return error;
  }, [formData, maxLoanDuration, isDateClosed]);

  /**
   * Validate all fields
   */
  const validateAllFields = useCallback(() => {
    const newErrors = {};
    let hasErrors = false;

    // Get validation rules with current settings
    const validationRules = getValidationRules(maxLoanDuration, isDateClosed);
    
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName], formData);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    setIsValid(!hasErrors);
    return !hasErrors;
  }, [formData, validateField, maxLoanDuration, isDateClosed]);

  /**
   * Handle field change with debounced validation
   */
  const handleFieldChange = useCallback((fieldName, value) => {
    // Update form data immediately
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    // Clear existing timer for this field
    if (debounceTimers[fieldName]) {
      clearTimeout(debounceTimers[fieldName]);
    }

    // Set new timer for validation
    const timer = setTimeout(() => {
      setIsValidating(true);
      const error = validateField(fieldName, value, { ...formData, [fieldName]: value });
      
      setErrors(prev => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[fieldName] = error;
        } else {
          delete newErrors[fieldName];
        }
        return newErrors;
      });
      
      setIsValidating(false);
    }, 500); // 500ms debounce

    setDebounceTimers(prev => ({ ...prev, [fieldName]: timer }));
  }, [formData, validateField, debounceTimers]);

  /**
   * Handle field blur
   */
  const handleFieldBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    // Validate immediately on blur
    const error = validateField(fieldName, formData[fieldName], formData);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[fieldName] = error;
      } else {
        delete newErrors[fieldName];
      }
      return newErrors;
    });
  }, [formData, validateField]);

  /**
   * Reset validation state
   */
  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, []);

  /**
   * Get field error (only if touched)
   */
  const getFieldError = useCallback((fieldName) => {
    return touched[fieldName] ? errors[fieldName] : null;
  }, [errors, touched]);

  /**
   * Check if field is valid
   */
  const isFieldValid = useCallback((fieldName) => {
    return touched[fieldName] && !errors[fieldName];
  }, [errors, touched]);

  /**
   * Get field status (for styling)
   */
  const getFieldStatus = useCallback((fieldName) => {
    if (!touched[fieldName]) return 'default';
    if (errors[fieldName]) return 'error';
    return 'success';
  }, [errors, touched]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach(timer => clearTimeout(timer));
    };
  }, [debounceTimers]);

  // Validate all fields when form data changes (after debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(touched).length > 0) {
        validateAllFields();
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData, touched, validateAllFields]);

  return {
    formData,
    setFormData,
    errors,
    touched,
    isValidating,
    isValid,
    handleFieldChange,
    handleFieldBlur,
    validateField,
    validateAllFields,
    resetValidation,
    getFieldError,
    isFieldValid,
    getFieldStatus
  };
};

export default useLoanRequestValidation;
