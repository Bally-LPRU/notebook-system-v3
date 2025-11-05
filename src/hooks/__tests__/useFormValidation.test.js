import { renderHook, act } from '@testing-library/react';
import useFormValidation from '../useFormValidation';

describe('useFormValidation', () => {
  const mockValidationRules = {
    firstName: {
      required: true,
      label: 'ชื่อ',
      minLength: 1,
      maxLength: 50,
      pattern: /^[ก-๙a-zA-Z\s]+$/,
      patternError: 'ชื่อต้องเป็นตัวอักษรเท่านั้น'
    },
    lastName: {
      required: true,
      label: 'นามสกุล',
      minLength: 1,
      maxLength: 50,
      pattern: /^[ก-๙a-zA-Z\s]+$/,
      patternError: 'นามสกุลต้องเป็นตัวอักษรเท่านั้น'
    },
    phoneNumber: {
      required: true,
      label: 'เบอร์โทรศัพท์',
      pattern: /^[0-9]{9,10}$/,
      patternError: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก'
    },
    department: {
      required: true,
      label: 'สังกัด',
      customValidator: (value) => {
        if (!value || !value.value) {
          return { isValid: false, error: 'กรุณาเลือกสังกัด' };
        }
        return { isValid: true, error: null };
      }
    },
    email: {
      required: false,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternError: 'รูปแบบอีเมลไม่ถูกต้อง'
    }
  };

  const mockInitialData = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    department: null,
    email: ''
  };

  test('initializes with correct default values', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    expect(result.current.formData).toEqual(mockInitialData);
    expect(result.current.errors).toEqual({});
    expect(result.current.touchedFields).toEqual({});
    expect(result.current.isValidating).toBe(false);
    expect(result.current.isFormValid).toBe(false);
  });

  test('handles field changes correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    act(() => {
      result.current.handleFieldChange('firstName', 'สมชาย');
    });

    expect(result.current.formData.firstName).toBe('สมชาย');
  });

  test('validates required fields correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    act(() => {
      const validation = result.current.validateField('firstName', '', mockValidationRules.firstName);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('กรุณากรอกชื่อ');
    });

    act(() => {
      const validation = result.current.validateField('firstName', 'สมชาย', mockValidationRules.firstName);
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBe(null);
    });
  });

  test('validates field patterns correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    act(() => {
      const validation = result.current.validateField('phoneNumber', '123abc', mockValidationRules.phoneNumber);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก');
    });

    act(() => {
      const validation = result.current.validateField('phoneNumber', '0812345678', mockValidationRules.phoneNumber);
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBe(null);
    });
  });

  test('validates field length correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    // Test minimum length
    act(() => {
      const validation = result.current.validateField('firstName', '', mockValidationRules.firstName);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('กรุณากรอกชื่อ');
    });

    // Test maximum length
    const longName = 'a'.repeat(51);
    act(() => {
      const validation = result.current.validateField('firstName', longName, mockValidationRules.firstName);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('ชื่อต้องไม่เกิน 50 ตัวอักษร');
    });
  });

  test('handles custom validation correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    act(() => {
      const validation = result.current.validateField('department', null, mockValidationRules.department);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('กรุณากรอกสังกัด');
    });

    act(() => {
      const validation = result.current.validateField('department', { value: 'accounting', label: 'สาขาวิชาการบัญชี' }, mockValidationRules.department);
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBe(null);
    });
  });

  test('validates entire form correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    // Test with empty form
    act(() => {
      const validation = result.current.validateForm();
      expect(validation.isValid).toBe(false);
      expect(Object.keys(validation.errors)).toContain('firstName');
      expect(Object.keys(validation.errors)).toContain('lastName');
      expect(Object.keys(validation.errors)).toContain('phoneNumber');
      expect(Object.keys(validation.errors)).toContain('department');
    });

    // Fill form with valid data
    act(() => {
      result.current.setFormData({
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        email: 'somchai@gmail.com'
      });
    });

    act(() => {
      const validation = result.current.validateForm();
      expect(validation.isValid).toBe(true);
      expect(Object.keys(validation.errors)).toHaveLength(0);
    });
  });

  test('handles field blur correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    act(() => {
      result.current.handleFieldBlur('firstName');
    });

    expect(result.current.touchedFields.firstName).toBe(true);
    expect(result.current.errors.firstName).toBe('กรุณากรอกชื่อ');
  });

  test('provides real-time validation for touched fields', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    // Mark field as touched
    act(() => {
      result.current.handleFieldBlur('firstName');
    });

    // Change field value - should trigger validation
    act(() => {
      result.current.handleFieldChange('firstName', 'สมชาย');
    });

    expect(result.current.errors.firstName).toBe(null);
  });

  test('clears field errors correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    // Create an error
    act(() => {
      result.current.handleFieldBlur('firstName');
    });

    expect(result.current.errors.firstName).toBeTruthy();

    // Clear the error
    act(() => {
      result.current.clearFieldError('firstName');
    });

    expect(result.current.errors.firstName).toBeUndefined();
  });

  test('resets form correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    // Make changes to form
    act(() => {
      result.current.handleFieldChange('firstName', 'สมชาย');
      result.current.handleFieldBlur('lastName');
    });

    expect(result.current.formData.firstName).toBe('สมชาย');
    expect(result.current.touchedFields.lastName).toBe(true);

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData).toEqual(mockInitialData);
    expect(result.current.errors).toEqual({});
    expect(result.current.touchedFields).toEqual({});
    expect(result.current.isValidating).toBe(false);
  });

  test('calculates completed fields correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    // Initially no required fields completed (email is not required so it's considered completed)
    expect(result.current.completedFields).toHaveLength(1); // email field

    // Fill required fields
    act(() => {
      result.current.setFormData({
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        email: '' // Optional field
      });
    });

    expect(result.current.completedFields).toHaveLength(5); // All fields including email
    expect(result.current.completedFields).toContain('firstName');
    expect(result.current.completedFields).toContain('lastName');
    expect(result.current.completedFields).toContain('phoneNumber');
    expect(result.current.completedFields).toContain('department');
    expect(result.current.completedFields).toContain('email');
  });

  test('provides correct field state information', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    // Test initial field state
    const initialState = result.current.getFieldState('firstName');
    expect(initialState.value).toBe('');
    expect(initialState.error).toBeUndefined();
    expect(initialState.isTouched).toBeUndefined(); // Not touched initially
    expect(initialState.isValid).toBe(null);
    expect(initialState.hasValue).toBe(false);

    // Touch field and add value
    act(() => {
      result.current.handleFieldBlur('firstName');
      result.current.handleFieldChange('firstName', 'สมชาย');
    });

    const updatedState = result.current.getFieldState('firstName');
    expect(updatedState.value).toBe('สมชาย');
    expect(updatedState.isTouched).toBe(true);
    expect(updatedState.isValid).toBe(true);
    expect(updatedState.hasValue).toBe(true);
  });

  test('handles non-required fields correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    // Email is not required, should be valid when empty
    act(() => {
      const validation = result.current.validateField('email', '', mockValidationRules.email);
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBe(null);
    });

    // But should validate format when provided
    act(() => {
      const validation = result.current.validateField('email', 'invalid-email', mockValidationRules.email);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('รูปแบบอีเมลไม่ถูกต้อง');
    });
  });

  test('calculates form validity correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(mockInitialData, mockValidationRules)
    );

    // Initially invalid
    expect(result.current.isFormValid).toBe(false);

    // Fill all required fields
    act(() => {
      result.current.setFormData({
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        email: ''
      });
    });

    expect(result.current.isFormValid).toBe(true);

    // Add validation error
    act(() => {
      result.current.handleFieldChange('phoneNumber', 'invalid');
      result.current.handleFieldBlur('phoneNumber');
    });

    expect(result.current.isFormValid).toBe(false);
  });
});