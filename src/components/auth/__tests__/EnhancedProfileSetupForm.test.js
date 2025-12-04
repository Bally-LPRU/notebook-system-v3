import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EnhancedProfileSetupForm from '../EnhancedProfileSetupForm';
import { useAuth } from '../../../contexts/AuthContext';
import useFormValidation from '../../../hooks/useFormValidation';
import useAutoSave from '../../../hooks/useAutoSave';
import useDuplicateDetection from '../../../hooks/useDuplicateDetection';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('../../../contexts/AuthContext');
jest.mock('../../../hooks/useFormValidation');
jest.mock('../../../hooks/useAutoSave');
jest.mock('../../../hooks/useDuplicateDetection');

jest.mock('../../common/FormField', () => {
  return ({ id, name, label, value, onChange, onBlur, placeholder, type = 'text' }) => (
    <label htmlFor={id} data-testid={`form-field-${name}`}>
      <span>{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange({ target: { name, value: event.target.value } })}
        onBlur={onBlur}
      />
    </label>
  );
});

jest.mock('../../common/DepartmentSelector', () => {
  return ({ value, onChange }) => (
    <select
      data-testid="department-selector"
      value={value}
      onChange={(event) => onChange({ target: { value: event.target.value } })}
    >
      <option value="">เลือก</option>
      <option value="accounting">บัญชี</option>
      <option value="digital-business">ธุรกิจดิจิทัล</option>
    </select>
  );
});

jest.mock('../../common/ProgressIndicator', () => (props) => (
  <div data-testid="progress-indicator">progress-{props.requiredFields?.length || 0}</div>
));

jest.mock('../../common/DraftManager', () => ({ onLoadDraft, onClearDraft }) => (
  <div data-testid="draft-manager">
    <button type="button" onClick={() => onLoadDraft?.({ firstName: 'Drafty' })}>
      โหลดร่าง
    </button>
    <button type="button" onClick={() => onClearDraft?.()}>
      ลบร่าง
    </button>
  </div>
));

jest.mock('../../common/LoadingState', () => ({
  AutoSaveIndicator: ({ status = 'idle', lastSaved }) => (
    <div data-testid="auto-save-indicator">
      {status}
      {lastSaved ? `-${lastSaved}` : ''}
    </div>
  ),
  ButtonLoadingState: ({ message }) => (
    <span data-testid="button-loading-state">{message}</span>
  ),
  FormLoadingState: ({ message }) => (
    <div data-testid="form-loading-state">{message}</div>
  )
}));

jest.mock('../ProfileStatusDisplay', () => ({ profile, onRetry }) => (
  <div data-testid="profile-status-display">
    <p>status-{profile?.status}</p>
    <button type="button" onClick={onRetry}>retry</button>
  </div>
));

const renderForm = (props = {}, additionalProps = {}) =>
  render(<EnhancedProfileSetupForm {...props} {...additionalProps} />);

const setupUserEvent = () => (typeof userEvent.setup === 'function' ? userEvent.setup() : userEvent);

const baseFormData = {
  firstName: 'โทนี่',
  lastName: 'สตาร์ค',
  phoneNumber: '0812345678',
  department: 'accounting',
  userType: 'student'
};

describe('EnhancedProfileSetupForm', () => {
  let mockProps;
  let mockValidation;
  let mockAutoSave;
  let mockDuplicate;
  let mockUpdateProfile;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProps = {
      initialFormData: null,
      onFormDataChange: jest.fn(),
      profileError: null,
      isRetrying: false,
      canRetry: false,
      onRetry: jest.fn(),
      onClearError: jest.fn(),
      errorMessage: null,
      errorClassification: null
    };

    mockValidation = {
      formData: { ...baseFormData },
      errors: {},
      isFormValid: true,
      completedFields: ['firstName', 'lastName'],
      requiredFields: [
        { name: 'firstName' },
        { name: 'lastName' },
        { name: 'phoneNumber' },
        { name: 'department' },
        { name: 'userType' }
      ],
      handleFieldChange: jest.fn(),
      handleFieldBlur: jest.fn(),
      validateForm: jest.fn().mockReturnValue({ isValid: true }),
      setFormData: jest.fn(),
      clearFieldError: jest.fn()
    };

    mockAutoSave = {
      saveStatus: 'idle',
      lastSaved: null
    };

    mockDuplicate = {
      isChecking: false,
      duplicateResult: null,
      error: null,
      checkDuplicates: jest.fn().mockResolvedValue({ hasDuplicate: false }),
      clearState: jest.fn(),
      hasDuplicate: false,
      existingProfile: null
    };

    mockUpdateProfile = jest.fn().mockResolvedValue(undefined);

    useFormValidation.mockReturnValue(mockValidation);
    useAutoSave.mockReturnValue(mockAutoSave);
    useDuplicateDetection.mockReturnValue(mockDuplicate);
    useAuth.mockReturnValue({
      user: {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: '/avatar.png'
      },
      updateProfile: mockUpdateProfile,
      loading: false,
      error: null
    });
  });

  it('renders key form sections and helper widgets', () => {
    renderForm(mockProps);

    expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('draft-manager')).toBeInTheDocument();
    expect(screen.getByTestId('auto-save-indicator')).toHaveTextContent('idle');
    expect(screen.getByLabelText(/^ชื่อ$/)).toBeInTheDocument();
    expect(screen.getByLabelText('นามสกุล')).toBeInTheDocument();
    expect(screen.getByLabelText('เบอร์โทรศัพท์')).toBeInTheDocument();
    expect(screen.getByTestId('department-selector')).toBeInTheDocument();
  });

  it('propagates input changes to validation hook and parent callback', async () => {
    const user = setupUserEvent();
    renderForm(mockProps);

    const firstNameInput = screen.getByLabelText(/^ชื่อ$/);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'นาย');

    expect(mockValidation.handleFieldChange).toHaveBeenCalledWith('firstName', expect.any(String));
    expect(mockProps.onFormDataChange).toHaveBeenCalled();
    const lastCallIndex = mockProps.onFormDataChange.mock.calls.length - 1;
    const lastFormUpdate = mockProps.onFormDataChange.mock.calls[lastCallIndex][0];
    expect(lastFormUpdate).toMatchObject({ firstName: expect.any(String) });

    fireEvent.blur(firstNameInput);
    expect(mockValidation.handleFieldBlur).toHaveBeenCalledWith('firstName');
  });

  it('submits profile data after validation succeeds', async () => {
    const user = setupUserEvent();
    renderForm(mockProps);

    const submitButton = screen.getByRole('button', { name: /บันทึกข้อมูล/ });
    await user.click(submitButton);

    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledTimes(1));
    expect(mockDuplicate.checkDuplicates).toHaveBeenNthCalledWith(1, 'test@example.com');
    expect(mockDuplicate.checkDuplicates).toHaveBeenNthCalledWith(2, 'test@example.com', '0812345678');
  });

  it('shows retry controls when error props present', async () => {
    const user = setupUserEvent();
    renderForm({
      ...mockProps,
      errorMessage: 'เกิดข้อผิดพลาด',
      profileError: { message: 'เกิดข้อผิดพลาด' },
      canRetry: true
    });

    expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: 'ลองใหม่' });
    await user.click(retryButton);
    expect(mockProps.onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator inside submit button when retrying', () => {
    renderForm({ ...mockProps, isRetrying: true });
    expect(screen.getByTestId('button-loading-state')).toHaveTextContent('กำลังลองใหม่...');
  });

  it('renders profile status display when duplicate detected', async () => {
    mockDuplicate.duplicateResult = {
      hasDuplicate: true,
      existingProfile: { status: 'active' }
    };
    mockDuplicate.existingProfile = { status: 'active' };
    useDuplicateDetection.mockReturnValueOnce(mockDuplicate);

    renderForm(mockProps);

    expect(await screen.findByTestId('profile-status-display')).toBeInTheDocument();
  });

  it('loads preserved draft data via DraftManager helper', async () => {
    const user = setupUserEvent();
    renderForm(mockProps);

    await user.click(screen.getByText('โหลดร่าง'));
    expect(mockValidation.setFormData).toHaveBeenCalledWith({ firstName: 'Drafty' });
  });

  it('triggers duplicate check on mount', async () => {
    renderForm(mockProps);
    await waitFor(() => expect(mockDuplicate.checkDuplicates).toHaveBeenCalledWith('test@example.com'));
  });
});
