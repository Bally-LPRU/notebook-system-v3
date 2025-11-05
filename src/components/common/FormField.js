import React, { useState, useEffect, useCallback } from 'react';
import FormGuidance from './FormGuidance';

const FormField = ({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  error,
  helpText,
  tooltip,
  validationRules = {},
  showValidationIcon = true,
  showGuidance = true,
  showInlineGuidance = false,
  className = '',
  ...props
}) => {
  const [isValid, setIsValid] = useState(null);
  const [isTouched, setIsTouched] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const validateField = useCallback((fieldValue, rules) => {
    if (!fieldValue && !required) {
      return { isValid: true, error: null };
    }

    if (!fieldValue && required) {
      return { isValid: false, error: `กรุณากรอก${label}` };
    }

    // Check minimum length
    if (rules.minLength && fieldValue.length < rules.minLength) {
      return { 
        isValid: false, 
        error: `${label}ต้องมีอย่างน้อย ${rules.minLength} ตัวอักษร` 
      };
    }

    // Check maximum length
    if (rules.maxLength && fieldValue.length > rules.maxLength) {
      return { 
        isValid: false, 
        error: `${label}ต้องไม่เกิน ${rules.maxLength} ตัวอักษร` 
      };
    }

    // Check pattern
    if (rules.pattern && !rules.pattern.test(fieldValue)) {
      return { 
        isValid: false, 
        error: rules.patternError || `รูปแบบ${label}ไม่ถูกต้อง` 
      };
    }

    return { isValid: true, error: null };
  }, [label, required]);

  // Real-time validation
  useEffect(() => {
    if (value && isTouched) {
      const validation = validateField(value, validationRules);
      setIsValid(validation.isValid);
    }
  }, [value, validationRules, isTouched, validateField]);

  const handleChange = (e) => {
    onChange(e);
    
    if (!isTouched) {
      setIsTouched(true);
    }
  };

  const handleBlur = (e) => {
    setIsTouched(true);
    if (onBlur) {
      onBlur(e);
    }
  };

  const getFieldClasses = () => {
    let classes = `mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:z-10 sm:text-sm transition-colors duration-200 ${className}`;
    
    if (error) {
      classes += ' border-red-300 focus:ring-red-500 focus:border-red-500';
    } else if (isValid === true && isTouched) {
      classes += ' border-green-300 focus:ring-green-500 focus:border-green-500';
    } else if (isValid === false && isTouched) {
      classes += ' border-red-300 focus:ring-red-500 focus:border-red-500';
    } else {
      classes += ' border-gray-300 focus:ring-primary-500 focus:border-primary-500';
    }
    
    return classes;
  };

  const ValidationIcon = () => {
    if (!showValidationIcon || !isTouched) return null;
    
    if (isValid === true && !error) {
      return (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    
    if (isValid === false || error) {
      return (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        <span className="flex items-center">
          {label} {required && <span className="text-red-500 ml-1">*</span>}
          {showGuidance && (
            <span className="ml-2">
              <FormGuidance fieldName={name} />
            </span>
          )}
          {tooltip && (
            <button
              type="button"
              className="ml-1 inline-flex items-center"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </span>
      </label>
      
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={getFieldClasses()}
          {...props}
        />
        <ValidationIcon />
      </div>
      
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute z-10 w-64 p-2 mt-1 text-sm text-white bg-gray-800 rounded-md shadow-lg">
          {tooltip}
          <div className="absolute top-0 left-4 w-2 h-2 bg-gray-800 transform rotate-45 -translate-y-1"></div>
        </div>
      )}
      
      {/* Help text */}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      
      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      
      {/* Inline guidance */}
      {showInlineGuidance && !error && (
        <FormGuidance fieldName={name} showInline={true} />
      )}
    </div>
  );
};

export default FormField;