import { renderHook, act, waitFor } from '@testing-library/react';
import { useEnhancedErrorHandling, useFormErrorHandling, useProfileErrorHandling } from '../useEnhancedErrorHandling';
import { ErrorClassifier } from '../../utils/errorClassification';

// Mock the error classification and retry handler
jest.mock('../../utils/errorClassification');
jest.mock('../../utils/retryHandler');
jest.mock('../../utils/errorLogger');

describe('useEnhancedErrorHandling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ErrorClassifier.classify.mockReturnValue({
      type: 'network',
      severity: 'high',
      retryable: true,
      category: 'network',
      originalError: new Error('Test error')
    });
    ErrorClassifier.getErrorMessage.mockReturnValue({
      title: 'ปัญหาการเชื่อมต่อ',
      message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
      suggestion: 'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
    });
  });

  test('initializes with correct default state', () => {
    const { result } = renderHook(() => useEnhancedErrorHandling());

    expect(result.current.error).toBe(null);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.hasError).toBe(false);
    expect(result.current.canRetry).toBe(false);
  });

  test('handles successful operation execution', async () => {
    const { result } = renderHook(() => useEnhancedErrorHandling());
    const mockOperation = jest.fn().mockResolvedValue('success');
    const mockOnSuccess = jest.fn();

    await act(async () => {
      const response = await result.current.executeWithErrorHandling(mockOperation, {}, { onSuccess: mockOnSuccess });
      expect(response).toBe('success');
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).toHaveBeenCalledWith('success');
    expect(result.current.error).toBe(null);
    expect(result.current.retryCount).toBe(0);
  });

  test('handles operation failure with error classification', async () => {
    const { result } = renderHook(() => useEnhancedErrorHandling());
    const testError = new Error('Network error');
    const mockOperation = jest.fn().mockRejectedValue(testError);
    const mockOnError = jest.fn();

    await act(async () => {
      try {
        await result.current.executeWithErrorHandling(mockOperation, {}, { onError: mockOnError });
      } catch (error) {
        expect(error).toBe(testError);
      }
    });

    expect(ErrorClassifier.classify).toHaveBeenCalledWith(testError, expect.any(Object));
    expect(mockOnError).toHaveBeenCalled();
    expect(result.current.hasError).toBe(true);
  });

  test('executes manual retry correctly', async () => {
    const { result } = renderHook(() => useEnhancedErrorHandling());
    const testError = new Error('Network error');
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(testError)
      .mockResolvedValueOnce('success');

    // First execution fails
    await act(async () => {
      try {
        await result.current.executeWithManualRetry(mockOperation);
      } catch (error) {
        expect(error.manualRetryAvailable).toBe(true);
      }
    });

    expect(result.current.hasError).toBe(true);
    expect(result.current.canRetry).toBe(true);

    // Manual retry succeeds
    await act(async () => {
      const response = await result.current.retry();
      expect(response).toBe('success');
    });

    expect(result.current.error).toBe(null);
    expect(result.current.retryCount).toBe(0);
  });

  test('clears error state correctly', () => {
    const { result } = renderHook(() => useEnhancedErrorHandling());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
  });

  test('cancels ongoing operations', () => {
    const { result } = renderHook(() => useEnhancedErrorHandling());

    act(() => {
      result.current.cancelOperation();
    });

    expect(result.current.isRetrying).toBe(false);
  });

  test('provides correct error classification properties', async () => {
    const { result } = renderHook(() => useEnhancedErrorHandling());
    const testError = new Error('Network error');
    const mockOperation = jest.fn().mockRejectedValue(testError);

    ErrorClassifier.classify.mockReturnValue({
      type: 'network',
      severity: 'high',
      retryable: true,
      category: 'network',
      originalError: testError
    });

    await act(async () => {
      try {
        await result.current.executeWithManualRetry(mockOperation);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.isNetworkError).toBe(true);
    expect(result.current.isRetryableError).toBe(true);
    expect(result.current.classification.category).toBe('network');
  });
});

describe('useFormErrorHandling', () => {
  test('handles form submission with error handling', async () => {
    const { result } = renderHook(() => useFormErrorHandling('test-form'));
    const mockSubmitFunction = jest.fn().mockResolvedValue('submitted');
    const mockFormData = { firstName: 'Test', lastName: 'User' };

    await act(async () => {
      const response = await result.current.submitForm(mockSubmitFunction, mockFormData);
      expect(response).toBe('submitted');
    });

    expect(mockSubmitFunction).toHaveBeenCalledWith(mockFormData);
  });

  test('handles form validation with error handling', async () => {
    const { result } = renderHook(() => useFormErrorHandling('test-form'));
    const mockValidateFunction = jest.fn().mockResolvedValue({ isValid: true });
    const mockFormData = { firstName: 'Test', lastName: 'User' };

    await act(async () => {
      const response = await result.current.validateForm(mockValidateFunction, mockFormData);
      expect(response).toEqual({ isValid: true });
    });

    expect(mockValidateFunction).toHaveBeenCalledWith(mockFormData);
  });
});

describe('useProfileErrorHandling', () => {
  test('handles profile update with error handling', async () => {
    const { result } = renderHook(() => useProfileErrorHandling());
    const mockUpdateFunction = jest.fn().mockResolvedValue('updated');
    const mockProfileData = { firstName: 'Test', lastName: 'User' };

    await act(async () => {
      const response = await result.current.updateProfile(mockUpdateFunction, mockProfileData);
      expect(response).toBe('updated');
    });

    expect(mockUpdateFunction).toHaveBeenCalledWith(mockProfileData);
  });

  test('handles profile creation with error handling', async () => {
    const { result } = renderHook(() => useProfileErrorHandling());
    const mockCreateFunction = jest.fn().mockResolvedValue('created');
    const mockProfileData = { firstName: 'Test', lastName: 'User' };

    await act(async () => {
      const response = await result.current.createProfile(mockCreateFunction, mockProfileData);
      expect(response).toBe('created');
    });

    expect(mockCreateFunction).toHaveBeenCalledWith(mockProfileData);
  });

  test('handles profile operation failures', async () => {
    const { result } = renderHook(() => useProfileErrorHandling());
    const testError = new Error('Profile error');
    const mockUpdateFunction = jest.fn().mockRejectedValue(testError);

    await act(async () => {
      try {
        await result.current.updateProfile(mockUpdateFunction, {});
      } catch (error) {
        expect(error).toBe(testError);
      }
    });

    expect(result.current.hasError).toBe(true);
  });
});

describe('Error handling integration', () => {
  test('handles network errors with proper classification', async () => {
    const { result } = renderHook(() => useEnhancedErrorHandling());
    const networkError = new Error('Network request failed');
    const mockOperation = jest.fn().mockRejectedValue(networkError);

    ErrorClassifier.classify.mockReturnValue({
      type: 'network',
      severity: 'high',
      retryable: true,
      category: 'network',
      originalError: networkError
    });

    await act(async () => {
      try {
        await result.current.executeWithManualRetry(mockOperation);
      } catch (error) {
        expect(error.classification.category).toBe('network');
      }
    });

    expect(result.current.isNetworkError).toBe(true);
    expect(result.current.canRetry).toBe(true);
  });

  test('handles validation errors correctly', async () => {
    const { result } = renderHook(() => useEnhancedErrorHandling());
    const validationError = new Error('Validation failed');
    const mockOperation = jest.fn().mockRejectedValue(validationError);

    ErrorClassifier.classify.mockReturnValue({
      type: 'validation',
      severity: 'low',
      retryable: false,
      category: 'validation',
      originalError: validationError
    });

    await act(async () => {
      try {
        await result.current.executeWithManualRetry(mockOperation);
      } catch (error) {
        expect(error.classification.category).toBe('validation');
      }
    });

    expect(result.current.canRetry).toBe(false);
    expect(result.current.classification.retryable).toBe(false);
  });

  test('handles permission errors correctly', async () => {
    const { result } = renderHook(() => useEnhancedErrorHandling());
    const permissionError = new Error('Permission denied');
    const mockOperation = jest.fn().mockRejectedValue(permissionError);

    ErrorClassifier.classify.mockReturnValue({
      type: 'permission_denied',
      severity: 'high',
      retryable: true,
      category: 'authentication',
      originalError: permissionError
    });

    await act(async () => {
      try {
        await result.current.executeWithManualRetry(mockOperation);
      } catch (error) {
        expect(error.classification.category).toBe('authentication');
      }
    });

    expect(result.current.canRetry).toBe(true);
    expect(result.current.classification.type).toBe('permission_denied');
  });
});