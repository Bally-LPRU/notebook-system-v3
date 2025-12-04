import AuthService from '../authService';
import { ErrorClassifier, ERROR_TYPES, ERROR_MESSAGES } from '../../utils/errorClassification';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null
  },
  googleProvider: {},
  db: {}
}));

jest.mock('firebase/auth', () => ({
  signInWithPopup: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
  onAuthStateChanged: () => {}
}));

jest.mock('firebase/firestore', () => ({
  doc: () => ({ id: 'test-uid' }),
  getDoc: () => Promise.resolve({ exists: () => false }),
  setDoc: () => Promise.resolve(),
  serverTimestamp: () => ({ seconds: Date.now() / 1000 })
}));

jest.mock('../../utils/errorLogger', () => ({
  logAuthError: () => {},
  logFirebaseError: () => {},
  logError: () => {}
}));

describe('AuthService Error Handling', () => {
  beforeAll(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Classification', () => {
    it('should classify network errors correctly', () => {
      const networkError = new Error('Network failed');
      networkError.code = 'auth/network-request-failed';
      
      const handledError = AuthService._handleError(networkError, 'test context');
      const messageInfo = ErrorClassifier.getErrorMessage(handledError);
      
      expect(handledError.type).toBe(ERROR_TYPES.NETWORK);
      expect(handledError.retryable).toBe(true);
      expect(messageInfo.message).toContain('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    });

    it('should classify authentication errors correctly', () => {
      const authError = new Error('Auth failed');
      authError.code = 'auth/popup-blocked';
      
      const handledError = AuthService._handleError(authError, 'sign in');
      const messageInfo = ErrorClassifier.getErrorMessage(handledError);
      
      expect(handledError.type).toBe(ERROR_TYPES.AUTH_REQUIRED);
      expect(handledError.retryable).toBe(true);
      expect(messageInfo.message).toContain('เข้าสู่ระบบ');
    });

    it('should classify Firestore errors correctly', () => {
      const firestoreError = new Error('Firestore failed');
      firestoreError.code = 'firestore/permission-denied';
      
      const handledError = AuthService._handleError(firestoreError, 'get user profile');
      const messageInfo = ErrorClassifier.getErrorMessage(handledError);
      
      expect(handledError.type).toBe(ERROR_TYPES.FIRESTORE);
      expect(handledError.retryable).toBe(true);
      expect(messageInfo.message).toContain('ฐานข้อมูล');
    });

    it('should classify validation errors correctly', () => {
      const validationError = new Error('อีเมลไม่ถูกต้อง');
      
      const handledError = AuthService._handleError(validationError, 'validation');
      const messageInfo = ErrorClassifier.getErrorMessage(handledError);
      
      expect(handledError.type).toBe(ERROR_TYPES.VALIDATION);
      expect(handledError.retryable).toBe(false);
      expect(messageInfo.message).toContain('ตรวจสอบข้อมูล');
    });

    it('should handle unknown errors gracefully', () => {
      const unknownError = new Error('Unknown error');
      
      const handledError = AuthService._handleError(unknownError, 'test context');
      const messageInfo = ErrorClassifier.getErrorMessage(handledError);
      
      expect(handledError.type).toBe(ERROR_TYPES.UNKNOWN);
      expect(messageInfo.message).toContain('เกิดข้อผิดพลาด');
    });

    it('should handle null/undefined errors', () => {
      const handledError = AuthService._handleError(null, 'test context');
      const messageInfo = ErrorClassifier.getErrorMessage(handledError);
      
      expect(handledError.type).toBe(ERROR_TYPES.UNKNOWN);
      expect(messageInfo.message).toContain('เกิดข้อผิดพลาดที่ไม่คาดคิด');
    });
  });

  describe('Email Validation', () => {
    it('should validate gmail.com emails', () => {
      expect(AuthService.isValidEmail('test@gmail.com')).toBe(true);
    });

    it('should validate g.lpru.ac.th emails', () => {
      expect(AuthService.isValidEmail('test@g.lpru.ac.th')).toBe(true);
    });

    it('should reject other email domains', () => {
      expect(AuthService.isValidEmail('test@example.com')).toBe(false);
      expect(AuthService.isValidEmail('test@yahoo.com')).toBe(false);
      expect(AuthService.isValidEmail('test@hotmail.com')).toBe(false);
    });

    it('should handle invalid email formats', () => {
      expect(AuthService.isValidEmail('invalid-email')).toBe(false);
      expect(AuthService.isValidEmail('')).toBe(false);
      expect(AuthService.isValidEmail(null)).toBe(false);
      expect(AuthService.isValidEmail(undefined)).toBe(false);
    });
  });

  describe('Profile Setup Detection', () => {
    it('should detect when profile setup is needed - incomplete status', () => {
      expect(AuthService.needsProfileSetup({ status: 'incomplete' })).toBe(true);
    });

    it('should detect when profile setup is needed - missing required fields', () => {
      expect(AuthService.needsProfileSetup({ 
        status: 'approved',
        firstName: 'Test'
        // Missing other required fields
      })).toBe(true);
    });

    it('should detect when profile setup is complete', () => {
      expect(AuthService.needsProfileSetup({
        status: 'approved',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '0123456789',
        department: 'IT',
        userType: 'staff'
      })).toBe(false);
    });

    it('should handle null/undefined profiles', () => {
      expect(AuthService.needsProfileSetup(null)).toBe(true);
      expect(AuthService.needsProfileSetup(undefined)).toBe(true);
    });
  });

  describe('Error Types and Messages', () => {
    it('should expose error types', () => {
      const errorTypes = AuthService.getErrorTypes();

      expect(errorTypes).toHaveProperty('NETWORK');
      expect(errorTypes).toHaveProperty('AUTH');
      expect(errorTypes).toHaveProperty('PERMISSION');
      expect(errorTypes).toHaveProperty('VALIDATION');
      expect(errorTypes).toHaveProperty('FIRESTORE');
      expect(errorTypes).toHaveProperty('UNKNOWN');
    });

    it('should expose error messages', () => {
      const errorMessages = AuthService.getErrorMessages();

      const expectedKeys = [
        'NETWORK_ERROR',
        'AUTH_CANCELLED',
        'AUTH_REDIRECT_ERROR',
        'INVALID_EMAIL_DOMAIN',
        'PROFILE_FETCH_ERROR',
        'PROFILE_CREATE_ERROR',
        'PROFILE_UPDATE_ERROR',
        'SIGN_OUT_ERROR',
        'GENERIC_ERROR'
      ];

      expectedKeys.forEach((key) => {
        expect(errorMessages).toHaveProperty(key);
      });
    });

    it('should provide Thai error messages', () => {
      const errorMessages = AuthService.getErrorMessages();

      expect(errorMessages.NETWORK_ERROR).toContain('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      expect(errorMessages.INVALID_EMAIL_DOMAIN).toContain('อีเมลของคุณไม่ได้รับอนุญาต');
      expect(errorMessages.PROFILE_FETCH_ERROR).toContain('ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
    });
  });

  describe('Network Connectivity Check', () => {
    let originalOnLine;

    beforeEach(() => {
      originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    });

    afterEach(() => {
      if (originalOnLine) {
        Object.defineProperty(navigator, 'onLine', originalOnLine);
      }
    });

    it('should check network connectivity', async () => {
      // Mock navigator.onLine to false
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      await expect(AuthService._checkNetworkConnectivity()).rejects.toThrow(
        'ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อและลองใหม่'
      );
    });

    it('should pass when network is available', async () => {
      // Mock navigator.onLine to true
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      await expect(AuthService._checkNetworkConnectivity()).resolves.toBeUndefined();
    });
  });

  describe('Error Message Mapping', () => {
    it('should map popup blocked errors', () => {
      const error = new Error('Popup blocked');
      error.code = 'auth/popup-blocked';
      
      const handledError = AuthService._handleError(error, 'sign in');
      const messageInfo = ErrorClassifier.getErrorMessage(handledError);

      expect(handledError.type).toBe(ERROR_TYPES.AUTH_REQUIRED);
      expect(messageInfo.message).toContain('เข้าสู่ระบบ');
    });

    it('should map popup closed errors', () => {
      const error = new Error('Popup closed');
      error.code = 'auth/popup-closed-by-user';
      
      const handledError = AuthService._handleError(error, 'sign in');
      const messageInfo = ErrorClassifier.getErrorMessage(handledError);

      expect(handledError.type).toBe(ERROR_TYPES.AUTH_REQUIRED);
      expect(messageInfo.message).toContain('เข้าสู่ระบบ');
    });

    it('should map cancelled popup errors', () => {
      const error = new Error('Popup cancelled');
      error.code = 'auth/cancelled-popup-request';
      
      const handledError = AuthService._handleError(error, 'sign in');
      const messageInfo = ErrorClassifier.getErrorMessage(handledError);

      expect(handledError.type).toBe(ERROR_TYPES.AUTH_REQUIRED);
      expect(messageInfo.message).toContain('เข้าสู่ระบบ');
    });

    it('should map network errors', () => {
      const error = new Error('Network failed');
      error.code = 'auth/network-request-failed';
      
      const handledError = AuthService._handleError(error, 'sign in');
      const messageInfo = ErrorClassifier.getErrorMessage(handledError);

      expect(handledError.type).toBe(ERROR_TYPES.NETWORK);
      expect(messageInfo.message).toContain('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    });

    it('should map fetch errors as network errors', () => {
      const error = new Error('fetch failed');
      
      const handledError = AuthService._handleError(error, 'profile fetch');
      const messageInfo = ErrorClassifier.getErrorMessage(handledError);

      expect(handledError.type).toBe(ERROR_TYPES.NETWORK);
      expect(messageInfo.message).toContain('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    });
  });
});