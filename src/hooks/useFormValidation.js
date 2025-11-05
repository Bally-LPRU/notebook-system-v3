import { useState, useCallback, useMemo } from 'react';

const useFormValidation = (initialData = {}, validationRules = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Validation functions
  const validateField = useCallback((fieldName, value, rules) => {
    if (!rules) return { isValid: true, error: null };

    // Required field validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return { 
        isValid: false, 
        error: rules.requiredMessage || `กรุณากรอก${rules.label || fieldName}` 
      };
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) {
      return { isValid: true, error: null };
    }

    // String validations
    if (typeof value === 'string') {
      // Minimum length
      if (rules.minLength && value.length < rules.minLength) {
        return { 
          isValid: false, 
          error: `${rules.label || fieldName}ต้องมีอย่างน้อย ${rules.minLength} ตัวอักษร` 
        };
      }

      // Maximum length
      if (rules.maxLength && value.length > rules.maxLength) {
        return { 
          isValid: false, 
          error: `${rules.label || fieldName}ต้องไม่เกิน ${rules.maxLength} ตัวอักษร` 
        };
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        return { 
          isValid: false, 
          error: rules.patternError || `รูปแบบ${rules.label || fieldName}ไม่ถูกต้อง` 
        };
      }
    }

    // Custom validation function
    if (rules.customValidator) {
      const customResult = rules.customValidator(value, formData);
      if (!customResult.isValid) {
        return customResult;
      }
    }

    return { isValid: true, error: null };
  }, [formData]);

  // Validate all fields
  const validateForm = useCallback(() => {
    setIsValidating(true);
    const newErrors = {};
    let isFormValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const fieldValue = formData[fieldName];
      const fieldRules = validationRules[fieldName];
      const validation = validateField(fieldName, fieldValue, fieldRules);
      
      if (!validation.isValid) {
        newErrors[fieldName] = validation.error;
        isFormValid = false;
      }
    });

    setErrors(newErrors);
    setIsValidating(false);
    return { isValid: isFormValid, errors: newErrors };
  }, [formData, validationRules, validateField]);

  // Handle field change
  const handleFieldChange = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Real-time validation for touched fields
    if (touchedFields[fieldName]) {
      const fieldRules = validationRules[fieldName];
      const validation = validateField(fieldName, value, fieldRules);
      
      setErrors(prev => ({
        ...prev,
        [fieldName]: validation.error
      }));
    }
  }, [touchedFields, validationRules, validateField]);

  // Handle field blur (mark as touched)
  const handleFieldBlur = useCallback((fieldName) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Validate field on blur
    const fieldValue = formData[fieldName];
    const fieldRules = validationRules[fieldName];
    const validation = validateField(fieldName, fieldValue, fieldRules);
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: validation.error
    }));
  }, [formData, validationRules, validateField]);

  // Clear field error
  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouchedFields({});
    setIsValidating(false);
  }, [initialData]);

  // Get completed fields
  const completedFields = useMemo(() => {
    return Object.keys(validationRules).filter(fieldName => {
      const value = formData[fieldName];
      const rules = validationRules[fieldName];
      
      if (rules.required) {
        return value && (typeof value !== 'string' || value.trim());
      }
      
      return true; // Non-required fields are considered completed
    });
  }, [formData, validationRules]);

  // Get required fields
  const requiredFields = useMemo(() => {
    return Object.keys(validationRules)
      .filter(fieldName => validationRules[fieldName].required)
      .map(fieldName => ({
        name: fieldName,
        label: validationRules[fieldName].label || fieldName
      }));
  }, [validationRules]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return Object.keys(errors).length === 0 && 
           requiredFields.every(field => 
             formData[field.name] && 
             (typeof formData[field.name] !== 'string' || formData[field.name].trim())
           );
  }, [errors, requiredFields, formData]);

  // Get field validation state
  const getFieldState = useCallback((fieldName) => {
    const value = formData[fieldName];
    const error = errors[fieldName];
    const isTouched = touchedFields[fieldName];
    const rules = validationRules[fieldName];
    
    let isValid = null;
    if (isTouched && value) {
      const validation = validateField(fieldName, value, rules);
      isValid = validation.isValid;
    }

    return {
      value,
      error,
      isTouched,
      isValid,
      hasValue: Boolean(value && (typeof value !== 'string' || value.trim()))
    };
  }, [formData, errors, touchedFields, validationRules, validateField]);

  return {
    formData,
    errors,
    touchedFields,
    isValidating,
    isFormValid,
    completedFields,
    requiredFields,
    handleFieldChange,
    handleFieldBlur,
    clearFieldError,
    validateForm,
    validateField,
    resetForm,
    getFieldState,
    setFormData
  };
};

export default useFormValidation;