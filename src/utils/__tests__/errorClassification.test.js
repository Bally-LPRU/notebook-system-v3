import { ErrorClassifier, ERROR_TYPES, ERROR_SEVERITY, ERROR_MESSAGES } from '../errorClassification';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('ErrorClassifier', () => {
  beforeEach(() => {
    navigator.onLine = true;
  });

  describe('classify method', () => {
    test('classifies network errors correctly', () => {
      const networkError = new Error('Network request failed');
      networkError.code = 'auth/network-request-failed';

      const classification = ErrorClassifier.classify(networkError);

      expect(classification.category).toBe('network');
      expect(classification.type).toBe(ERROR_TYPES.NETWORK);
      expect(classification.retryable).toBe(true);
      expect(classification.severity).toBe(ERROR_SEVERITY.HIGH);
    });

    test('classifies offline network errors correctly', () => {
      navigator.onLine = false;
      const networkError = new Error('Network unavailable');

      const classification = ErrorClassifier.classify(networkError);

      expect(classification.type).toBe(ERROR_TYPES.NETWORK_OFFLINE);
      expect(classification.severity).toBe(ERROR_SEVERITY.CRITICAL);
      expect(classification.retryDelay).toBe(5000);
    });

    test('classifies timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout');

      const classification = ErrorClassifier.classify(timeoutError);

      expect(classification.type).toBe(ERROR_TYPES.NETWORK_TIMEOUT);
      expect(classification.retryDelay).toBe(3000);
    });

    test('classifies authentication errors correctly', () => {
      const authError = new Error('Authentication failed');
      authError.code = 'auth/popup-blocked';

      const classification = ErrorClassifier.classify(authError);

      expect(classification.category).toBe('authentication');
      expect(classification.type).toBe(ERROR_TYPES.AUTH_REQUIRED);
      expect(classification.severity).toBe(ERROR_SEVERITY.MEDIUM);
    });

    test('classifies permission denied errors correctly', () => {
      const permissionError = new Error('Permission denied');
      permissionError.code = 'permission-denied';

      const classification = ErrorClassifier.classify(permissionError);

      expect(classification.type).toBe(ERROR_TYPES.PERMISSION_DENIED);
      expect(classification.severity).toBe(ERROR_SEVERITY.HIGH);
    });

    test('classifies expired token errors correctly', () => {
      const expiredError = new Error('Token expired');
      expiredError.code = 'auth/user-token-expired';

      const classification = ErrorClassifier.classify(expiredError);

      expect(classification.type).toBe(ERROR_TYPES.AUTH_EXPIRED);
      expect(classification.retryable).toBe(false);
    });

    test('classifies Firestore errors correctly', () => {
      const firestoreError = new Error('Firestore unavailable');
      firestoreError.code = 'unavailable';

      const classification = ErrorClassifier.classify(firestoreError);

      expect(classification.category).toBe('firestore');
      expect(classification.type).toBe(ERROR_TYPES.FIRESTORE_UNAVAILABLE);
      expect(classification.maxRetries).toBe(5);
    });

    test('classifies resource exhausted errors correctly', () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.code = 'resource-exhausted';

      const classification = ErrorClassifier.classify(quotaError);

      expect(classification.type).toBe(ERROR_TYPES.FIRESTORE_QUOTA);
      expect(classification.severity).toBe(ERROR_SEVERITY.CRITICAL);
      expect(classification.retryDelay).toBe(10000);
    });

    test('classifies validation errors correctly', () => {
      const validationError = new Error('กรุณากรอกข้อมูล');
      const context = { operation: 'validation' };

      const classification = ErrorClassifier.classify(validationError, context);

      expect(classification.category).toBe('validation');
      expect(classification.type).toBe(ERROR_TYPES.VALIDATION_REQUIRED);
      expect(classification.retryable).toBe(false);
      expect(classification.severity).toBe(ERROR_SEVERITY.LOW);
    });

    test('classifies format validation errors correctly', () => {
      const formatError = new Error('รูปแบบไม่ถูกต้อง');

      const classification = ErrorClassifier.classify(formatError);

      expect(classification.type).toBe(ERROR_TYPES.VALIDATION_FORMAT);
      expect(classification.retryable).toBe(false);
    });

    test('classifies duplicate validation errors correctly', () => {
      const duplicateError = new Error('ข้อมูลซ้ำ');

      const classification = ErrorClassifier.classify(duplicateError);

      expect(classification.type).toBe(ERROR_TYPES.VALIDATION_DUPLICATE);
    });

    test('classifies profile errors correctly', () => {
      const profileError = new Error('Profile not found');
      const context = { operation: 'profile_update' };

      const classification = ErrorClassifier.classify(profileError, context);

      expect(classification.category).toBe('profile');
      expect(classification.type).toBe(ERROR_TYPES.PROFILE_NOT_FOUND);
      expect(classification.retryable).toBe(false);
    });

    test('classifies incomplete profile errors correctly', () => {
      const incompleteError = new Error('Profile incomplete');

      const classification = ErrorClassifier.classify(incompleteError);

      expect(classification.type).toBe(ERROR_TYPES.PROFILE_INCOMPLETE);
      expect(classification.retryable).toBe(false);
    });

    test('classifies duplicate profile errors correctly', () => {
      const duplicateError = new Error('โปรไฟล์ซ้ำ');

      const classification = ErrorClassifier.classify(duplicateError);

      expect(classification.type).toBe(ERROR_TYPES.PROFILE_DUPLICATE);
      expect(classification.retryable).toBe(false);
    });

    test('classifies unknown errors correctly', () => {
      const unknownError = new Error('Something went wrong');

      const classification = ErrorClassifier.classify(unknownError);

      expect(classification.type).toBe(ERROR_TYPES.UNKNOWN);
      expect(classification.severity).toBe(ERROR_SEVERITY.MEDIUM);
      expect(classification.retryable).toBe(true);
      expect(classification.category).toBe('unknown');
    });

    test('handles null/undefined errors gracefully', () => {
      const classification = ErrorClassifier.classify(null);

      expect(classification.type).toBe(ERROR_TYPES.UNKNOWN);
      expect(classification.originalError).toBe(null);
    });

    test('includes context and timestamp in classification', () => {
      const error = new Error('Test error');
      const context = { operation: 'test', component: 'TestComponent' };

      const classification = ErrorClassifier.classify(error, context);

      expect(classification.context).toBe(context);
      expect(classification.timestamp).toBeDefined();
      expect(new Date(classification.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('getErrorMessage method', () => {
    test('returns correct message for network errors', () => {
      const classification = { type: ERROR_TYPES.NETWORK, severity: ERROR_SEVERITY.HIGH };
      const message = ErrorClassifier.getErrorMessage(classification);

      expect(message.title).toBe('ปัญหาการเชื่อมต่อ');
      expect(message.message).toBe('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      expect(message.suggestion).toBe('ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง');
      expect(message.icon).toBe('🌐');
    });

    test('returns correct message for validation errors', () => {
      const classification = { type: ERROR_TYPES.VALIDATION_REQUIRED, severity: ERROR_SEVERITY.LOW };
      const message = ErrorClassifier.getErrorMessage(classification);

      expect(message.title).toBe('ข้อมูลไม่ครบถ้วน');
      expect(message.message).toBe('กรุณากรอกข้อมูลในฟิลด์ที่จำเป็น');
      expect(message.suggestion).toBe('ฟิลด์ที่มีเครื่องหมาย * จำเป็นต้องกรอก');
    });

    test('returns correct message for permission errors', () => {
      const classification = { type: ERROR_TYPES.PERMISSION_DENIED, severity: ERROR_SEVERITY.HIGH };
      const message = ErrorClassifier.getErrorMessage(classification);

      expect(message.title).toBe('การเข้าถึงถูกปฏิเสธ');
      expect(message.message).toBe('ระบบปฏิเสธการเข้าถึงข้อมูลนี้');
      expect(message.suggestion).toBe('ลองออกจากระบบและเข้าสู่ระบบใหม่');
    });

    test('returns default message for unknown error types', () => {
      const classification = { type: 'non_existent_type', severity: ERROR_SEVERITY.MEDIUM };
      const message = ErrorClassifier.getErrorMessage(classification);

      expect(message.title).toBe('เกิดข้อผิดพลาด');
      expect(message.message).toBe('เกิดข้อผิดพลาดที่ไม่คาดคิด');
    });

    test('includes classification properties in message', () => {
      const classification = { 
        type: ERROR_TYPES.NETWORK, 
        severity: ERROR_SEVERITY.HIGH,
        retryable: true,
        timestamp: '2023-01-01T00:00:00.000Z'
      };
      const message = ErrorClassifier.getErrorMessage(classification);

      expect(message.severity).toBe(ERROR_SEVERITY.HIGH);
      expect(message.retryable).toBe(true);
      expect(message.timestamp).toBe('2023-01-01T00:00:00.000Z');
    });
  });

  describe('calculateRetryDelay method', () => {
    test('calculates exponential backoff correctly', () => {
      const baseDelay = 1000;
      const maxDelay = 10000;

      const delay1 = ErrorClassifier.calculateRetryDelay(baseDelay, 1, maxDelay);
      const delay2 = ErrorClassifier.calculateRetryDelay(baseDelay, 2, maxDelay);
      const delay3 = ErrorClassifier.calculateRetryDelay(baseDelay, 3, maxDelay);

      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(3000); // With jitter
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThan(4000);
      expect(delay3).toBeGreaterThanOrEqual(4000);
      expect(delay3).toBeLessThan(6000);
    });

    test('respects maximum delay', () => {
      const baseDelay = 1000;
      const maxDelay = 5000;

      const delay = ErrorClassifier.calculateRetryDelay(baseDelay, 10, maxDelay);
      expect(delay).toBeLessThanOrEqual(maxDelay);
    });

    test('adds jitter to delay', () => {
      const baseDelay = 1000;
      const maxDelay = 10000;

      const delay1 = ErrorClassifier.calculateRetryDelay(baseDelay, 1, maxDelay);
      const delay2 = ErrorClassifier.calculateRetryDelay(baseDelay, 1, maxDelay);

      // With jitter, delays should be different (most of the time)
      // We'll run this multiple times to increase confidence
      let different = false;
      for (let i = 0; i < 10; i++) {
        const d1 = ErrorClassifier.calculateRetryDelay(baseDelay, 1, maxDelay);
        const d2 = ErrorClassifier.calculateRetryDelay(baseDelay, 1, maxDelay);
        if (d1 !== d2) {
          different = true;
          break;
        }
      }
      expect(different).toBe(true);
    });
  });

  describe('shouldRetry method', () => {
    test('returns true for retryable errors within retry limit', () => {
      const classification = {
        retryable: true,
        maxRetries: 3,
        severity: ERROR_SEVERITY.MEDIUM
      };

      expect(ErrorClassifier.shouldRetry(classification, 1)).toBe(true);
      expect(ErrorClassifier.shouldRetry(classification, 2)).toBe(true);
    });

    test('returns false for non-retryable errors', () => {
      const classification = {
        retryable: false,
        maxRetries: 3,
        severity: ERROR_SEVERITY.MEDIUM
      };

      expect(ErrorClassifier.shouldRetry(classification, 1)).toBe(false);
    });

    test('returns false when retry limit exceeded', () => {
      const classification = {
        retryable: true,
        maxRetries: 3,
        severity: ERROR_SEVERITY.MEDIUM
      };

      expect(ErrorClassifier.shouldRetry(classification, 3)).toBe(false);
      expect(ErrorClassifier.shouldRetry(classification, 4)).toBe(false);
    });

    test('returns false for critical errors', () => {
      const classification = {
        retryable: true,
        maxRetries: 3,
        severity: ERROR_SEVERITY.CRITICAL
      };

      expect(ErrorClassifier.shouldRetry(classification, 1)).toBe(false);
    });
  });

  describe('Error detection methods', () => {
    test('detects network errors correctly', () => {
      const networkError1 = new Error('network request failed');
      const networkError2 = new Error('connection timeout');
      const networkError3 = { code: 'unavailable' };
      const nonNetworkError = new Error('validation failed');

      expect(ErrorClassifier._isNetworkError(networkError1, 'network request failed', '')).toBe(true);
      expect(ErrorClassifier._isNetworkError(networkError2, 'connection timeout', '')).toBe(true);
      expect(ErrorClassifier._isNetworkError(networkError3, '', 'unavailable')).toBe(true);
      expect(ErrorClassifier._isNetworkError(nonNetworkError, 'validation failed', '')).toBe(false);
    });

    test('detects authentication errors correctly', () => {
      const authError1 = { code: 'auth/popup-blocked' };
      const authError2 = new Error('permission denied');
      const authError3 = new Error('unauthorized access');
      const nonAuthError = new Error('network failed');

      expect(ErrorClassifier._isAuthError(authError1, '', 'auth/popup-blocked')).toBe(true);
      expect(ErrorClassifier._isAuthError(authError2, 'permission denied', '')).toBe(true);
      expect(ErrorClassifier._isAuthError(authError3, 'unauthorized access', '')).toBe(true);
      expect(ErrorClassifier._isAuthError(nonAuthError, 'network failed', '')).toBe(false);
    });

    test('detects Firestore errors correctly', () => {
      const firestoreError1 = { code: 'firestore/unavailable' };
      const firestoreError2 = { code: 'resource-exhausted' };
      const firestoreError3 = new Error('document not found');
      const nonFirestoreError = new Error('network failed');

      expect(ErrorClassifier._isFirestoreError(firestoreError1, '', 'firestore/unavailable')).toBe(true);
      expect(ErrorClassifier._isFirestoreError(firestoreError2, '', 'resource-exhausted')).toBe(true);
      expect(ErrorClassifier._isFirestoreError(firestoreError3, 'document not found', '')).toBe(true);
      expect(ErrorClassifier._isFirestoreError(nonFirestoreError, 'network failed', '')).toBe(false);
    });

    test('detects validation errors correctly', () => {
      const validationError1 = new Error('validation failed');
      const validationError2 = new Error('กรุณากรอกข้อมูล');
      const validationError3 = new Error('invalid format');
      const validationContext = { operation: 'validation' };
      const nonValidationError = new Error('network failed');

      expect(ErrorClassifier._isValidationError(validationError1, 'validation failed', {})).toBe(true);
      expect(ErrorClassifier._isValidationError(validationError2, 'กรุณากรอกข้อมูล', {})).toBe(true);
      expect(ErrorClassifier._isValidationError(validationError3, 'invalid format', {})).toBe(true);
      expect(ErrorClassifier._isValidationError(nonValidationError, 'network failed', validationContext)).toBe(true);
      expect(ErrorClassifier._isValidationError(nonValidationError, 'network failed', {})).toBe(false);
    });

    test('detects profile errors correctly', () => {
      const profileError1 = new Error('profile not found');
      const profileError2 = new Error('โปรไฟล์ไม่สมบูรณ์');
      const profileContext = { operation: 'profile_update' };
      const nonProfileError = new Error('network failed');

      expect(ErrorClassifier._isProfileError(profileError1, 'profile not found', {})).toBe(true);
      expect(ErrorClassifier._isProfileError(profileError2, 'โปรไฟล์ไม่สมบูรณ์', {})).toBe(true);
      expect(ErrorClassifier._isProfileError(nonProfileError, 'network failed', profileContext)).toBe(true);
      expect(ErrorClassifier._isProfileError(nonProfileError, 'network failed', {})).toBe(false);
    });
  });

  describe('Error message constants', () => {
    test('all error types have corresponding messages', () => {
      Object.values(ERROR_TYPES).forEach(errorType => {
        expect(ERROR_MESSAGES[errorType]).toBeDefined();
        expect(ERROR_MESSAGES[errorType].title).toBeDefined();
        expect(ERROR_MESSAGES[errorType].message).toBeDefined();
        expect(ERROR_MESSAGES[errorType].suggestion).toBeDefined();
        expect(ERROR_MESSAGES[errorType].icon).toBeDefined();
      });
    });

    test('error messages are in Thai language', () => {
      const networkMessage = ERROR_MESSAGES[ERROR_TYPES.NETWORK];
      expect(networkMessage.title).toMatch(/[ก-๙]/);
      expect(networkMessage.message).toMatch(/[ก-๙]/);
      expect(networkMessage.suggestion).toMatch(/[ก-๙]/);
    });
  });
});