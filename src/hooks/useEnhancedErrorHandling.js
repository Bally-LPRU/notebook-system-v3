/**
 * Enhanced Error Handling Hook
 * Provides comprehensive error handling with retry functionality for React components
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ErrorClassifier } from '../utils/errorClassification';
import { RetryHandler } from '../utils/retryHandler';
import { logError } from '../utils/errorLogger';

/**
 * Enhanced error handling hook with retry functionality
 */
export const useEnhancedErrorHandling = (options = {}) => {
  const {
    component = 'unknown',
    operation = 'unknown',
    maxRetries = 3,
    onError,
    onRetry,
    onSuccess
  } = options;

  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);

  const retryHandlerRef = useRef(new RetryHandler());
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Execute operation with error handling and retry logic
   */
  const executeWithErrorHandling = useCallback(async (asyncOperation, context = {}) => {
    // Cancel any ongoing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const operationContext = {
      component,
      operation,
      ...context
    };

    try {
      setError(null);
      setIsRetrying(false);
      setLastAttemptTime(Date.now());

      // Execute with retry logic
      const result = await retryHandlerRef.current.executeWithRetry(
        async () => {
          // Check if operation was aborted
          if (signal.aborted) {
            throw new Error('Operation was aborted');
          }
          
          return await asyncOperation(signal);
        },
        operationContext,
        {
          maxRetries,
          onRetryAttempt: (attempt) => {
            setRetryCount(attempt);
            setIsRetrying(true);
            
            if (onRetry) {
              onRetry(attempt, 'auto');
            }
          }
        }
      );

      // Success
      setRetryCount(0);
      setIsRetrying(false);
      
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      // Don't handle aborted operations
      if (signal.aborted || err.message === 'Operation was aborted') {
        return;
      }

      const classification = ErrorClassifier.classify(err, operationContext);
      
      setError({
        ...err,
        classification,
        errorMessage: ErrorClassifier.getErrorMessage(classification),
        retryCount,
        canRetry: classification.retryable && retryCount < maxRetries
      });
      
      setIsRetrying(false);

      // Log error
      logError({
        type: 'hook_error_handling',
        error: err,
        context: {
          ...operationContext,
          retryCount,
          classification
        },
        severity: classification.severity
      });

      if (onError) {
        onError(err, classification);
      }

      throw err;
    }
  }, [component, operation, maxRetries, retryCount, onError, onRetry, onSuccess]);

  /**
   * Execute operation with manual retry capability
   */
  const executeWithManualRetry = useCallback(async (asyncOperation, context = {}) => {
    const operationContext = {
      component,
      operation,
      ...context
    };

    try {
      setError(null);
      setLastAttemptTime(Date.now());

      const result = await asyncOperation();
      
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const classification = ErrorClassifier.classify(err, operationContext);
      
      const enhancedError = {
        ...err,
        classification,
        errorMessage: ErrorClassifier.getErrorMessage(classification),
        canRetry: classification.retryable,
        retryOperation: asyncOperation,
        retryContext: operationContext
      };

      setError(enhancedError);

      // Log error
      logError({
        type: 'hook_manual_retry_error',
        error: err,
        context: {
          ...operationContext,
          classification,
          manualRetryAvailable: classification.retryable
        },
        severity: classification.severity
      });

      if (onError) {
        onError(err, classification);
      }

      throw enhancedError;
    }
  }, [component, operation, onError, onSuccess]);

  /**
   * Manual retry function
   */
  const retry = useCallback(async () => {
    if (!error || !error.canRetry || !error.retryOperation) {
      throw new Error('No retryable operation available');
    }

    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    setIsRetrying(true);

    try {
      const result = await error.retryOperation();
      
      setError(null);
      setRetryCount(0);
      setIsRetrying(false);

      if (onRetry) {
        onRetry(newRetryCount, 'manual');
      }

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const classification = ErrorClassifier.classify(err, error.retryContext);
      
      const enhancedError = {
        ...err,
        classification,
        errorMessage: ErrorClassifier.getErrorMessage(classification),
        canRetry: classification.retryable && newRetryCount < maxRetries,
        retryOperation: error.retryOperation,
        retryContext: error.retryContext
      };

      setError(enhancedError);
      setIsRetrying(false);

      if (onError) {
        onError(err, classification);
      }

      throw enhancedError;
    }
  }, [error, retryCount, maxRetries, onError, onRetry, onSuccess]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  /**
   * Cancel ongoing operation
   */
  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRetrying(false);
  }, []);

  return {
    // State
    error,
    isRetrying,
    retryCount,
    lastAttemptTime,
    hasError: !!error,
    canRetry: error?.canRetry || false,
    
    // Methods
    executeWithErrorHandling,
    executeWithManualRetry,
    retry,
    clearError,
    cancelOperation,
    
    // Computed properties
    errorMessage: error?.errorMessage,
    classification: error?.classification,
    isNetworkError: error?.classification?.category === 'network',
    isRetryableError: error?.classification?.retryable || false
  };
};

/**
 * Specialized hook for form operations
 */
export const useFormErrorHandling = (formId, options = {}) => {
  const formOptions = {
    component: 'Form',
    operation: 'form_operation',
    maxRetries: 2,
    ...options
  };

  const errorHandling = useEnhancedErrorHandling(formOptions);

  /**
   * Execute form submission with error handling
   */
  const submitForm = useCallback(async (submitFunction, formData) => {
    return errorHandling.executeWithManualRetry(
      () => submitFunction(formData),
      {
        operation: 'form_submit',
        formId,
        fieldCount: formData ? Object.keys(formData).length : 0
      }
    );
  }, [errorHandling, formId]);

  /**
   * Execute form validation with error handling
   */
  const validateForm = useCallback(async (validateFunction, formData) => {
    return errorHandling.executeWithErrorHandling(
      () => validateFunction(formData),
      {
        operation: 'form_validate',
        formId,
        fieldCount: formData ? Object.keys(formData).length : 0
      }
    );
  }, [errorHandling, formId]);

  return {
    ...errorHandling,
    submitForm,
    validateForm
  };
};

/**
 * Specialized hook for network operations
 */
export const useNetworkErrorHandling = (options = {}) => {
  const networkOptions = {
    component: 'NetworkManager',
    operation: 'network_operation',
    maxRetries: 5,
    enableAutoRetry: true,
    ...options
  };

  const errorHandling = useEnhancedErrorHandling(networkOptions);

  /**
   * Execute network request with error handling
   */
  const executeRequest = useCallback(async (requestFunction, requestConfig = {}) => {
    return errorHandling.executeWithErrorHandling(
      (signal) => requestFunction({ ...requestConfig, signal }),
      {
        operation: 'network_request',
        url: requestConfig.url,
        method: requestConfig.method
      }
    );
  }, [errorHandling]);

  return {
    ...errorHandling,
    executeRequest
  };
};

/**
 * Specialized hook for profile operations
 */
export const useProfileErrorHandling = (options = {}) => {
  const profileOptions = {
    component: 'ProfileManager',
    operation: 'profile_operation',
    maxRetries: 3,
    ...options
  };

  const errorHandling = useEnhancedErrorHandling(profileOptions);

  /**
   * Execute profile update with error handling
   */
  const updateProfile = useCallback(async (updateFunction, profileData) => {
    return errorHandling.executeWithManualRetry(
      () => updateFunction(profileData),
      {
        operation: 'profile_update',
        hasProfileData: !!profileData
      }
    );
  }, [errorHandling]);

  /**
   * Execute profile creation with error handling
   */
  const createProfile = useCallback(async (createFunction, profileData) => {
    return errorHandling.executeWithManualRetry(
      () => createFunction(profileData),
      {
        operation: 'profile_create',
        hasProfileData: !!profileData
      }
    );
  }, [errorHandling]);

  return {
    ...errorHandling,
    updateProfile,
    createProfile
  };
};

export default useEnhancedErrorHandling;