import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnhancedProfileSetupForm from '../EnhancedProfileSetupForm';

// Mock hooks and utilities
jest.mock('../../../hooks/useFormValidation');
jest.mock('../../../hooks/useEnhancedErrorHandling');
jest.mock('../../../hooks/useAutoSave');
jest.mock('../../../utils/formDataPreservation');

// Mock components
jest.mock('../../common/DepartmentSelector', () => {
  return function MockDepartmentSelector({ value, onChange, error, disabled }) {
    return (
      <div data-testid="department-selector">
        <select
          value={value?.value || ''}
          onChange={(e) => onChange({
            target: {
              name: 'department',
              value: e.target.value ? { value: e.target.value, label: `Department ${e.target.value}` } : null
            }
          })}
          disabled={disabled}
        >
          <option value="">เลือกสังกัด</option>
          <option value="accounting">สาขาวิชาการบัญชี</option>
          <option value="computer-business">สาขาวิชาคอมพิวเตอร์ธุรกิจ</option>
        </select>
        {error && <div data-testid="department-error">{error}</div>}
      </div>
    );
  };
});

jest.mock('../../common/ProgressIndicator', () => {
  return function MockProgressIndicator({ progress, steps }) {
    return (
      <div data-testid="progress-indicator">
        Progress: {progress}% ({steps?.completed || 0}/{steps?.total || 0})
      </div>
    );
  };
});

jest.mock('../../common/LoadingState', () => {
  return function MockLoadingState({ message }) {
    return <div data-testid="loading-state">{message}</div>;
  };
});

describe('EnhancedProfileSetupForm', () => {
  const mockProps = {
    onSubmit: jest.fn(),
    onSaveDraft: jest.fn(),
    initialData: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      department: null,
      userType: 'student'
    },
    isEditing: false
  };

  const mockFormValidation = {
    formData: mockProps.initialData,
    errors: {},
    touchedFields: {},
    isValidating: false,
    isFormValid: false,
    completedFields: [],
    requiredFields: [
      { name: 'firstName', label: 'ชื่อ' },
      { name: 'lastName', label: 'นามสกุล' },
      { name: 'phoneNumber', label: 'เบอร์โทรศัพท์' },
      { name: 'department', label: 'สังกัด' }
    ],
    handleFieldChange: jest.fn(),
    handleFieldBlur: jest.fn(),
    validateForm: jest.fn(),
    getFieldState: jest.fn(),
    resetForm: jest.fn()
  };

  const mockErrorHandling = {
    error: null,
    isRetrying: false,
    hasError: false,
    canRetry: false,
    submitForm: jest.fn(),
    retry: jest.fn(),
    clearError: jest.fn()
  };

  const mockAutoSave = {
    isDraftSaved: false,
    lastSavedAt: null,
    saveDraft: jest.fn(),
    clearDraft: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock implementations
    require('../../../hooks/useFormValidation').default.mockReturnValue(mockFormValidation);
    require('../../../hooks/useEnhancedErrorHandling').useFormErrorHandling.mockReturnValue(mockErrorHandling);
    require('../../../hooks/useAutoSave').default.mockReturnValue(mockAutoSave);
    require('../../../utils/formDataPreservation').preserveFormData.mockImplementation(() => {});
    require('../../../utils/formDataPreservation').restoreFormData.mockReturnValue({});
  });

  test('renders form with all required fields', () => {
    render(<EnhancedProfileSetupForm {...mockProps} />);

    expect(screen.getByLabelText(/ชื่อ/)).toBeInTheDocument();
    expect(screen.getByLabelText(/นามสกุล/)).toBeInTheDocument();
    expect(screen.getByLabelText(/เบอร์โทรศัพท์/)).toBeInTheDocument();
    expect(screen.getByTestId('department-selector')).toBeInTheDocument();
    expect(screen.getByLabelText(/ประเภทผู้ใช้/)).toBeInTheDocument();
  });

  test('displays progress indicator', () => {
    mockFormValidation.completedFields = ['firstName', 'lastName'];
    mockFormValidation.requiredFields = [
      { name: 'firstName', label: 'ชื่อ' },
      { name: 'lastName', label: 'นามสกุล' },
      { name: 'phoneNumber', label: 'เบอร์โทรศัพท์' },
      { name: 'department', label: 'สังกัด' }
    ];

    render(<EnhancedProfileSetupForm {...mockProps} />);

    expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
    expect(screen.getByText(/Progress: 50%/)).toBeInTheDocument();
  });

  test('handles field changes correctly', async () => {
    const user = userEvent.setup();
    render(<EnhancedProfileSetupForm {...mockProps} />);

    const firstNameInput = screen.getByLabelText(/ชื่อ/);
    await user.type(firstNameInput, 'สมชาย');

    expect(mockFormValidation.handleFieldChange).toHaveBeenCalledWith('firstName', 'สมชาย');
  });

  test('handles field blur events', async () => {
    const user = userEvent.setup();
    render(<EnhancedProfileSetupForm {...mockProps} />);

    const firstNameInput = screen.getByLabelText(/ชื่อ/);
    await user.click(firstNameInput);
    await user.tab();

    expect(mockFormValidation.handleFieldBlur).toHaveBeenCalledWith('firstName');
  });

  test('displays field validation errors', () => {
    mockFormValidation.errors = {
      firstName: 'กรุณากรอกชื่อ',
      phoneNumber: 'เบอร์โทรศัพท์ไม่ถูกต้อง'
    };

    render(<EnhancedProfileSetupForm {...mockProps} />);

    expect(screen.getByText('กรุณากรอกชื่อ')).toBeInTheDocument();
    expect(screen.getByText('เบอร์โทรศัพท์ไม่ถูกต้อง')).toBeInTheDocument();
  });

  test('handles department selection', async () => {
    const user = userEvent.setup();
    render(<EnhancedProfileSetupForm {...mockProps} />);

    const departmentSelect = screen.getByRole('combobox');
    await user.selectOptions(departmentSelect, 'accounting');

    expect(mockFormValidation.handleFieldChange).toHaveBeenCalledWith(
      'department',
      { value: 'accounting', label: 'Department accounting' }
    );
  });

  test('handles user type selection', async () => {
    const user = userEvent.setup();
    render(<EnhancedProfileSetupForm {...mockProps} />);

    const teacherRadio = screen.getByLabelText(/อาจารย์/);
    await user.click(teacherRadio);

    expect(mockFormValidation.handleFieldChange).toHaveBeenCalledWith('userType', 'teacher');
  });

  test('submits form when valid', async () => {
    const user = userEvent.setup();
    mockFormValidation.isFormValid = true;
    mockFormValidation.validateForm.mockReturnValue({ isValid: true, errors: {} });
    mockErrorHandling.submitForm.mockResolvedValue('success');

    render(<EnhancedProfileSetupForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /บันทึกข้อมูล/ });
    await user.click(submitButton);

    expect(mockFormValidation.validateForm).toHaveBeenCalled();
    expect(mockErrorHandling.submitForm).toHaveBeenCalled();
  });

  test('prevents submission when form is invalid', async () => {
    const user = userEvent.setup();
    mockFormValidation.isFormValid = false;
    mockFormValidation.validateForm.mockReturnValue({ 
      isValid: false, 
      errors: { firstName: 'กรุณากรอกชื่อ' } 
    });

    render(<EnhancedProfileSetupForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /บันทึกข้อมูล/ });
    await user.click(submitButton);

    expect(mockErrorHandling.submitForm).not.toHaveBeenCalled();
  });

  test('displays loading state during submission', () => {
    mockErrorHandling.isRetrying = true;

    render(<EnhancedProfileSetupForm {...mockProps} />);

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.getByText(/กำลังบันทึกข้อมูล/)).toBeInTheDocument();
  });

  test('displays error message when submission fails', () => {
    mockErrorHandling.hasError = true;
    mockErrorHandling.error = {
      errorMessage: {
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถบันทึกข้อมูลได้',
        suggestion: 'กรุณาลองใหม่อีกครั้ง'
      },
      canRetry: true
    };

    render(<EnhancedProfileSetupForm {...mockProps} />);

    expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
    expect(screen.getByText('ไม่สามารถบันทึกข้อมูลได้')).toBeInTheDocument();
    expect(screen.getByText('กรุณาลองใหม่อีกครั้ง')).toBeInTheDocument();
  });

  test('shows retry button when error is retryable', async () => {
    const user = userEvent.setup();
    mockErrorHandling.hasError = true;
    mockErrorHandling.canRetry = true;
    mockErrorHandling.error = {
      errorMessage: {
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถบันทึกข้อมูลได้'
      }
    };

    render(<EnhancedProfileSetupForm {...mockProps} />);

    const retryButton = screen.getByRole('button', { name: /ลองใหม่/ });
    expect(retryButton).toBeInTheDocument();

    await user.click(retryButton);
    expect(mockErrorHandling.retry).toHaveBeenCalled();
  });

  test('auto-saves draft data', async () => {
    const user = userEvent.setup();
    render(<EnhancedProfileSetupForm {...mockProps} />);

    const firstNameInput = screen.getByLabelText(/ชื่อ/);
    await user.type(firstNameInput, 'สมชาย');

    // Wait for auto-save to trigger
    await waitFor(() => {
      expect(mockAutoSave.saveDraft).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test('displays draft saved indicator', () => {
    mockAutoSave.isDraftSaved = true;
    mockAutoSave.lastSavedAt = new Date();

    render(<EnhancedProfileSetupForm {...mockProps} />);

    expect(screen.getByText(/บันทึกแบบร่างแล้ว/)).toBeInTheDocument();
  });

  test('handles editing mode correctly', () => {
    const editingProps = {
      ...mockProps,
      isEditing: true,
      initialData: {
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student'
      }
    };

    render(<EnhancedProfileSetupForm {...editingProps} />);

    expect(screen.getByRole('button', { name: /อัปเดตข้อมูล/ })).toBeInTheDocument();
  });

  test('provides field guidance and help text', () => {
    render(<EnhancedProfileSetupForm {...mockProps} />);

    // Check for help text
    expect(screen.getByText(/กรอกชื่อจริงของคุณ/)).toBeInTheDocument();
    expect(screen.getByText(/กรอกนามสกุลของคุณ/)).toBeInTheDocument();
    expect(screen.getByText(/กรอกเบอร์โทรศัพท์ที่สามารถติดต่อได้/)).toBeInTheDocument();
  });

  test('shows field completion indicators', () => {
    mockFormValidation.getFieldState.mockImplementation((fieldName) => {
      if (fieldName === 'firstName') {
        return { hasValue: true, isValid: true, error: null };
      }
      return { hasValue: false, isValid: null, error: null };
    });

    render(<EnhancedProfileSetupForm {...mockProps} />);

    // Check for completion indicators (checkmarks, etc.)
    const firstNameField = screen.getByLabelText(/ชื่อ/).closest('.form-field');
    expect(firstNameField).toHaveClass('completed');
  });

  test('handles phone number formatting', async () => {
    const user = userEvent.setup();
    render(<EnhancedProfileSetupForm {...mockProps} />);

    const phoneInput = screen.getByLabelText(/เบอร์โทรศัพท์/);
    await user.type(phoneInput, '0812345678');

    expect(mockFormValidation.handleFieldChange).toHaveBeenCalledWith('phoneNumber', '0812345678');
  });

  test('validates required fields on blur', async () => {
    const user = userEvent.setup();
    mockFormValidation.getFieldState.mockReturnValue({
      hasValue: false,
      isValid: false,
      error: 'กรุณากรอกชื่อ'
    });

    render(<EnhancedProfileSetupForm {...mockProps} />);

    const firstNameInput = screen.getByLabelText(/ชื่อ/);
    await user.click(firstNameInput);
    await user.tab();

    expect(mockFormValidation.handleFieldBlur).toHaveBeenCalledWith('firstName');
  });

  test('clears errors when user starts typing', async () => {
    const user = userEvent.setup();
    mockErrorHandling.hasError = true;

    render(<EnhancedProfileSetupForm {...mockProps} />);

    const firstNameInput = screen.getByLabelText(/ชื่อ/);
    await user.type(firstNameInput, 'ส');

    expect(mockErrorHandling.clearError).toHaveBeenCalled();
  });

  test('preserves form data on unmount', () => {
    const { unmount } = render(<EnhancedProfileSetupForm {...mockProps} />);

    unmount();

    expect(require('../../../utils/formDataPreservation').preserveFormData).toHaveBeenCalled();
  });

  test('restores form data on mount', () => {
    require('../../../utils/formDataPreservation').restoreFormData.mockReturnValue({
      firstName: 'สมชาย',
      lastName: 'ใจดี'
    });

    render(<EnhancedProfileSetupForm {...mockProps} />);

    expect(require('../../../utils/formDataPreservation').restoreFormData).toHaveBeenCalled();
  });
});