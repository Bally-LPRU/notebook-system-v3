import { RetryHandler, withRetry, withManualRetry, withProfileRetry, withNetworkRetry, withFirestoreRetry } from '../retryHandler';
import { ErrorClassifier, ERROR_SEVERITY } from '../errorClassification';

// Mock dependencies
jest.mock('../errorClassification');
jest.mock('../errorLogger');

describe('RetryHandler', () => {
  let retryHandler;

  beforeEach(() => {
    retryHandler = new RetryHandler();
    jest.clearAllMocks();
    
    ErrorClassifier.classify.mockReturnValue({
      type: 'network',
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: true,
      category: 'network',
      originalError: new Error('Test error'),
      retryDelay: 1000
    });
  });

  describe('executeWithRetry', () => {
    test('executes operation successfully on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await retryHandler.executeWithRetry(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('retries operation on failure and succeeds', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');

      const result = await retryHandler.executeWithRetry(mockOperation, {}, { maxRetries: 2 });
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    test('exhausts retries and throws final error', async () => {
      const testError = new Error('Persistent failure');
      const mockOperation = jest.fn().mockRejectedValue(testError);

      await expect(
        retryHandler.executeWithRetry(mockOperation, {}, { maxRetries: 2 })
      ).rejects.toThrow();

      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    test('does not retry non-retryable errors', async () => {
      const testError = new Error('Validation error');
      const mockOperation = jest.fn().mockRejectedValue(testError);

      ErrorClassifier.classify.mockReturnValue({
        type: 'validation',
        severity: ERROR_SEVERITY.LOW,
        retryable: false,
        category: 'validation',
        originalError: testError
      });

      await expect(
        retryHandler.executeWithRetry(mockOperation, {}, { maxRetries: 3 })
      ).rejects.toThrow();

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('does not retry critical errors', async () => {
      const testError = new Error('Critical error');
      const mockOperation = jest.fn().mockRejectedValue(testError);

      ErrorClassifier.classify.mockReturnValue({
        type: 'system',
        severity: ERROR_SEVERITY.CRITICAL,
        retryable: true,
        category: 'system',
        originalError: testError
      });

      await expect(
        retryHandler.executeWithRetry(mockOperation, {}, { maxRetries: 3 })
      ).rejects.toThrow();

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('calls onRetryAttempt callback during retries', async () => {
      const testError = new Error('Retry error');
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(testError)
        .mockResolvedValueOnce('success');
      const mockOnRetryAttempt = jest.fn();

      await retryHandler.executeWithRetry(
        mockOperation, 
        {}, 
        { maxRetries: 2, onRetryAttempt: mockOnRetryAttempt }
      );

      expect(mockOnRetryAttempt).toHaveBeenCalledWith(2);
    });

    test('respects circuit breaker when open', async () => {
      // Simulate circuit breaker being open
      retryHandler.circuitBreaker.state = 'open';
      retryHandler.circuitBreaker.failures = 5;
      retryHandler.circuitBreaker.lastFailureTime = Date.now();

      const mockOperation = jest.fn().mockResolvedValue('success');

      await expect(
        retryHandler.executeWithRetry(mockOperation)
      ).rejects.toThrow('Circuit breaker is open');

      expect(mockOperation).not.toHaveBeenCalled();
    });
  });

  describe('executeWithManualRetry', () => {
    test('executes operation successfully', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await retryHandler.executeWithManualRetry(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('creates enhanced error with retry information on failure', async () => {
      const testError = new Error('Operation failed');
      const mockOperation = jest.fn().mockRejectedValue(testError);

      try {
        await retryHandler.executeWithManualRetry(mockOperation);
      } catch (error) {
        expect(error.manualRetryAvailable).toBe(true);
        expect(error.retryHandler).toBe(retryHandler);
        expect(error.retryOperation).toBe(mockOperation);
      }
    });
  });

  describe('retry method', () => {
    test('executes manual retry successfully', async () => {
      const testError = new Error('Initial failure');
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(testError)
        .mockResolvedValueOnce('success');

      // First execution fails
      let retryError;
      try {
        await retryHandler.executeWithManualRetry(mockOperation);
      } catch (error) {
        retryError = error;
      }

      // Manual retry succeeds
      const result = await retryHandler.retry(retryError);
      expect(result).toBe('success');
    });

    test('throws error when no retry operation available', async () => {
      const invalidError = { canRetry: false };

      await expect(
        retryHandler.retry(invalidError)
      ).rejects.toThrow('No retryable operation available');
    });
  });

  describe('delay calculation', () => {
    test('calculates exponential backoff correctly', () => {
      const baseDelay = 1000;
      const maxDelay = 10000;
      const multiplier = 2;

      const delay1 = retryHandler._calculateDelay(baseDelay, 1, maxDelay, multiplier, false);
      const delay2 = retryHandler._calculateDelay(baseDelay, 2, maxDelay, multiplier, false);
      const delay3 = retryHandler._calculateDelay(baseDelay, 3, maxDelay, multiplier, false);

      expect(delay1).toBe(1000);
      expect(delay2).toBe(2000);
      expect(delay3).toBe(4000);
    });

    test('respects maximum delay', () => {
      const baseDelay = 1000;
      const maxDelay = 5000;
      const multiplier = 2;

      const delay = retryHandler._calculateDelay(baseDelay, 10, maxDelay, multiplier, false);
      expect(delay).toBe(maxDelay);
    });

    test('adds jitter when enabled', () => {
      const baseDelay = 1000;
      const maxDelay = 10000;
      const multiplier = 2;

      const delay1 = retryHandler._calculateDelay(baseDelay, 1, maxDelay, multiplier, true);
      const delay2 = retryHandler._calculateDelay(baseDelay, 1, maxDelay, multiplier, true);

      // With jitter, delays should be different
      expect(delay1).not.toBe(delay2);
      expect(delay1).toBeGreaterThan(0);
      expect(delay2).toBeGreaterThan(0);
    });
  });

  describe('circuit breaker', () => {
    test('opens circuit breaker after threshold failures', () => {
      const threshold = 3;
      retryHandler.defaultOptions.circuitBreakerThreshold = threshold;

      // Simulate failures
      for (let i = 0; i < threshold; i++) {
        retryHandler._updateCircuitBreaker({
          severity: ERROR_SEVERITY.HIGH,
          type: 'network'
        });
      }

      expect(retryHandler.circuitBreaker.state).toBe('open');
      expect(retryHandler._isCircuitBreakerOpen()).toBe(true);
    });

    test('resets circuit breaker on success', () => {
      retryHandler.circuitBreaker.failures = 2;
      retryHandler.circuitBreaker.state = 'half-open';

      retryHandler._resetCircuitBreaker();

      expect(retryHandler.circuitBreaker.failures).toBe(0);
      expect(retryHandler.circuitBreaker.state).toBe('closed');
    });

    test('transitions to half-open after timeout', () => {
      const timeout = 1000;
      retryHandler.defaultOptions.circuitBreakerTimeout = timeout;
      retryHandler.circuitBreaker.state = 'open';
      retryHandler.circuitBreaker.lastFailureTime = Date.now() - timeout - 1;

      expect(retryHandler._isCircuitBreakerOpen()).toBe(false);
      expect(retryHandler.circuitBreaker.state).toBe('half-open');
    });

    test('provides circuit breaker status', () => {
      retryHandler.circuitBreaker.state = 'open';
      retryHandler.circuitBreaker.failures = 5;

      const status = retryHandler.getCircuitBreakerStatus();

      expect(status.state).toBe('open');
      expect(status.failures).toBe(5);
      expect(status.isOpen).toBe(true);
    });
  });
});

describe('Utility functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ErrorClassifier.classify.mockReturnValue({
      type: 'network',
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: true,
      category: 'network',
      originalError: new Error('Test error')
    });
  });

  test('withRetry executes operation with default retry handler', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    
    const result = await withRetry(mockOperation);
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  test('withManualRetry executes operation with manual retry capability', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    
    const result = await withManualRetry(mockOperation);
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  test('withProfileRetry uses profile-specific configuration', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    
    const result = await withProfileRetry(mockOperation, { userId: 'test-user' });
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  test('withNetworkRetry uses network-specific configuration', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    
    const result = await withNetworkRetry(mockOperation, { url: 'https://api.example.com' });
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  test('withFirestoreRetry uses Firestore-specific configuration', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    
    const result = await withFirestoreRetry(mockOperation, { collection: 'users' });
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  test('utility functions handle failures correctly', async () => {
    const testError = new Error('Network failure');
    const mockOperation = jest.fn().mockRejectedValue(testError);

    await expect(withRetry(mockOperation)).rejects.toThrow();
    expect(mockOperation).toHaveBeenCalled();
  });
});

describe('Error handling edge cases', () => {
  let retryHandler;

  beforeEach(() => {
    retryHandler = new RetryHandler();
    jest.clearAllMocks();
  });

  test('handles null/undefined errors gracefully', async () => {
    const mockOperation = jest.fn().mockRejectedValue(null);

    ErrorClassifier.classify.mockReturnValue({
      type: 'unknown',
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: false,
      category: 'unknown',
      originalError: null
    });

    await expect(
      retryHandler.executeWithRetry(mockOperation, {}, { maxRetries: 1 })
    ).rejects.toBeDefined();
  });

  test('handles operations that throw non-Error objects', async () => {
    const mockOperation = jest.fn().mockRejectedValue('string error');

    ErrorClassifier.classify.mockReturnValue({
      type: 'unknown',
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: true,
      category: 'unknown',
      originalError: 'string error'
    });

    await expect(
      retryHandler.executeWithRetry(mockOperation, {}, { maxRetries: 2 })
    ).rejects.toBe('string error');
  });

  test('handles very long retry delays', async () => {
    const testError = new Error('Delayed error');
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(testError)
      .mockResolvedValueOnce('success');

    ErrorClassifier.classify.mockReturnValue({
      type: 'network',
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: true,
      category: 'network',
      originalError: testError,
      retryDelay: 50000 // Very long delay
    });

    // Mock sleep to avoid actual delay in tests
    const originalSleep = retryHandler._sleep;
    retryHandler._sleep = jest.fn().mockResolvedValue();

    const result = await retryHandler.executeWithRetry(mockOperation, {}, { maxRetries: 2 });
    
    expect(result).toBe('success');
    expect(retryHandler._sleep).toHaveBeenCalledWith(expect.any(Number));
    
    // Restore original sleep
    retryHandler._sleep = originalSleep;
  });
});