import { jest } from '@jest/globals';
import AuthService from '../authService';

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
  logFirebaseError: () => {}
}));

describe('AuthService Error Handling', () => {
  let mockSignInWithPopup;
  let mockSignOut;
  let mockGetDoc;
  let mockSetDoc;
  let mockDoc;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Firebase mocks
    const firebaseAuth = require('firebase/auth');
    const firebaseFirestore = require('firebase/firestore');
    
    mockSignInWithPopup = firebaseAuth.signInWithPopup;
    mockSignOut = firebaseAuth.signOut;
    mockGetDoc = firebaseFirestore.getDoc;
    mockSetDoc = firebaseFirestore.setDoc;
    mockDoc = firebaseFirestore.doc;
    
    mockDoc.mockReturnValue({ id: 'test-uid' });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors during sign in', async () => {
      const networkError = new Error('Network request failed');
      networkError.code = 'auth/network-request-failed';
      mockSignInWithPopup.mockRejectedValue(networkError);

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
      );
    });

    it('should handle network errors during profile fetch', async () => {
      const networkError = new Error('Network connection failed');
      networkError.message = 'fetch failed';
      mockGetDoc.mockRejectedValue(networkError);

      await expect(AuthService.getUserProfile('test-uid')).rejects.toThrow(
        'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
      );
    });

    it('should check network connectivity before operations', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        'ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อและลองใหม่'
      );

      // Restore navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle popup blocked errors', async () => {
      const popupError = new Error('Popup blocked');
      popupError.code = 'auth/popup-blocked';
      mockSignInWithPopup.mockRejectedValue(popupError);

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        'หน้าต่างการเข้าสู่ระบบถูกบล็อก กรุณาอนุญาตป๊อปอัพและลองใหม่'
      );
    });

    it('should handle popup closed by user errors', async () => {
      const popupError = new Error('Popup closed');
      popupError.code = 'auth/popup-closed-by-user';
      mockSignInWithPopup.mockRejectedValue(popupError);

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        'หน้าต่างการเข้าสู่ระบบถูกปิด กรุณาลองใหม่'
      );
    });

    it('should handle cancelled popup request errors', async () => {
      const popupError = new Error('Popup cancelled');
      popupError.code = 'auth/cancelled-popup-request';
      mockSignInWithPopup.mockRejectedValue(popupError);

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        'การเข้าสู่ระบบถูกยกเลิก'
      );
    });

    it('should handle generic auth errors', async () => {
      const authError = new Error('Authentication failed');
      authError.code = 'auth/user-disabled';
      mockSignInWithPopup.mockRejectedValue(authError);

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        'Authentication failed'
      );
    });

    it('should handle sign out errors', async () => {
      const signOutError = new Error('Sign out failed');
      signOutError.code = 'auth/network-request-failed';
      mockSignOut.mockRejectedValue(signOutError);

      await expect(AuthService.signOut()).rejects.toThrow(
        'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
      );
    });
  });

  describe('Email Validation Error Handling', () => {
    it('should reject invalid email domains', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      const mockResult = { user: mockUser };
      mockSignInWithPopup.mockResolvedValue(mockResult);
      mockSignOut.mockResolvedValue();

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        'อีเมลของคุณไม่ได้รับอนุญาตให้เข้าใช้งานระบบ กรุณาใช้อีเมล @gmail.com หรือ @g.lpru.ac.th'
      );

      // Should call signOut after invalid email
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should validate email domains correctly', () => {
      expect(AuthService.isValidEmail('test@gmail.com')).toBe(true);
      expect(AuthService.isValidEmail('test@g.lpru.ac.th')).toBe(true);
      expect(AuthService.isValidEmail('test@example.com')).toBe(false);
      expect(AuthService.isValidEmail('test@yahoo.com')).toBe(false);
      expect(AuthService.isValidEmail('')).toBe(false);
      expect(AuthService.isValidEmail(null)).toBe(false);
      expect(AuthService.isValidEmail(undefined)).toBe(false);
    });
  });

  describe('Firestore Error Handling', () => {
    it('should handle profile fetch errors', async () => {
      const firestoreError = new Error('Firestore error');
      firestoreError.code = 'firestore/permission-denied';
      mockGetDoc.mockRejectedValue(firestoreError);

      await expect(AuthService.getUserProfile('test-uid')).rejects.toThrow(
        'ไม่สามารถดึงข้อมูลโปรไฟล์ได้ กรุณาลองใหม่'
      );
    });

    it('should handle profile creation errors', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@gmail.com',
        displayName: 'Test User'
      };

      const firestoreError = new Error('Document write failed');
      mockSetDoc.mockRejectedValue(firestoreError);

      await expect(AuthService.createUserProfile(mockUser)).rejects.toThrow(
        'ไม่สามารถสร้างโปรไฟล์ได้ กรุณาลองใหม่'
      );
    });

    it('should handle profile update errors', async () => {
      const firestoreError = new Error('Update failed');
      mockSetDoc.mockRejectedValue(firestoreError);

      await expect(AuthService.updateUserProfile('test-uid', { firstName: 'Test' }))
        .rejects.toThrow('ไม่สามารถอัปเดตโปรไฟล์ได้ กรุณาลองใหม่');
    });

    it('should handle missing user ID in profile operations', async () => {
      await expect(AuthService.getUserProfile('')).rejects.toThrow(
        'User ID is required'
      );

      await expect(AuthService.updateUserProfile('', {})).rejects.toThrow(
        'User ID is required'
      );
    });

    it('should handle missing update data', async () => {
      await expect(AuthService.updateUserProfile('test-uid', {})).rejects.toThrow(
        'Update data is required'
      );

      await expect(AuthService.updateUserProfile('test-uid', null)).rejects.toThrow(
        'Update data is required'
      );
    });

    it('should handle missing user object in profile creation', async () => {
      await expect(AuthService.createUserProfile(null)).rejects.toThrow(
        'Valid user object is required'
      );

      await expect(AuthService.createUserProfile({})).rejects.toThrow(
        'Valid user object is required'
      );
    });
  });

  describe('Retry Logic and Error Recovery', () => {
    it('should retry profile fetch operations on failure', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@gmail.com',
        displayName: 'Test User'
      };

      const mockResult = { user: mockUser };
      mockSignInWithPopup.mockResolvedValue(mockResult);

      // First two calls fail, third succeeds
      mockGetDoc
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ uid: 'test-uid', firstName: 'Test' }),
          id: 'test-uid'
        });

      const result = await AuthService.signInWithGoogle();

      expect(result).toEqual(mockUser);
      expect(mockGetDoc).toHaveBeenCalledTimes(3);
    });

    it('should retry profile creation operations on failure', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@gmail.com',
        displayName: 'Test User'
      };

      const mockResult = { user: mockUser };
      mockSignInWithPopup.mockResolvedValue(mockResult);
      
      // Profile doesn't exist
      mockGetDoc.mockResolvedValue({ exists: () => false });

      // First two profile creation calls fail, third succeeds
      mockSetDoc
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce();

      const result = await AuthService.signInWithGoogle();

      expect(result).toEqual(mockUser);
      expect(mockSetDoc).toHaveBeenCalledTimes(3);
    });

    it('should fail after maximum retry attempts', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@gmail.com',
        displayName: 'Test User'
      };

      const mockResult = { user: mockUser };
      mockSignInWithPopup.mockResolvedValue(mockResult);

      // All profile fetch attempts fail
      const persistentError = new Error('Persistent network error');
      mockGetDoc.mockRejectedValue(persistentError);

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        'ไม่สามารถดึงข้อมูลโปรไฟล์ได้ กรุณาลองใหม่'
      );

      expect(mockGetDoc).toHaveBeenCalledTimes(3); // Max retries
    });
  });

  describe('Error Classification and Logging', () => {
    it('should classify errors correctly', () => {
      const networkError = new Error('Network failed');
      networkError.code = 'auth/network-request-failed';
      
      const handledError = AuthService._handleError(networkError, 'test context');
      
      expect(handledError.type).toBe('network');
      expect(handledError.retryable).toBe(true);
      expect(handledError.message).toContain('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    });

    it('should log errors to error logger', async () => {
      const { logAuthError } = require('../../utils/errorLogger');
      
      const authError = new Error('Auth failed');
      authError.code = 'auth/popup-blocked';
      mockSignInWithPopup.mockRejectedValue(authError);

      await expect(AuthService.signInWithGoogle()).rejects.toThrow();

      expect(logAuthError).toHaveBeenCalledWith(
        authError,
        expect.stringContaining('sign in'),
        expect.objectContaining({ service: 'AuthService' })
      );
    });

    it('should log Firestore errors appropriately', async () => {
      const { logFirebaseError } = require('../../utils/errorLogger');
      
      const firestoreError = new Error('Firestore failed');
      mockGetDoc.mockRejectedValue(firestoreError);

      await expect(AuthService.getUserProfile('test-uid')).rejects.toThrow();

      expect(logFirebaseError).toHaveBeenCalledWith(
        firestoreError,
        'firestore',
        expect.stringContaining('get user profile'),
        expect.objectContaining({ service: 'AuthService' })
      );
    });

    it('should expose error types and messages', () => {
      const errorTypes = AuthService.getErrorTypes();
      const errorMessages = AuthService.getErrorMessages();

      expect(errorTypes).toHaveProperty('NETWORK');
      expect(errorTypes).toHaveProperty('AUTH');
      expect(errorTypes).toHaveProperty('FIRESTORE');

      expect(errorMessages).toHaveProperty('NETWORK_ERROR');
      expect(errorMessages).toHaveProperty('AUTH_POPUP_BLOCKED');
      expect(errorMessages).toHaveProperty('PROFILE_FETCH_ERROR');
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle undefined or null errors gracefully', () => {
      const handledError = AuthService._handleError(null, 'test context');
      
      expect(handledError.type).toBe('unknown');
      expect(handledError.message).toBe('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่');
    });

    it('should handle errors without codes', () => {
      const genericError = new Error('Generic error message');
      const handledError = AuthService._handleError(genericError, 'test context');
      
      expect(handledError.type).toBe('unknown');
      expect(handledError.message).toBe('Generic error message');
    });

    it('should handle custom validation errors', () => {
      const validationError = new Error('อีเมลไม่ถูกต้อง');
      const handledError = AuthService._handleError(validationError, 'validation');
      
      expect(handledError.type).toBe('validation');
      expect(handledError.message).toBe('อีเมลไม่ถูกต้อง');
      expect(handledError.retryable).toBe(false);
    });

    it('should handle profile setup detection correctly', () => {
      // Profile needs setup - incomplete status
      expect(AuthService.needsProfileSetup({ status: 'incomplete' })).toBe(true);
      
      // Profile needs setup - missing required fields
      expect(AuthService.needsProfileSetup({ 
        status: 'approved',
        firstName: 'Test'
        // Missing other required fields
      })).toBe(true);
      
      // Profile complete
      expect(AuthService.needsProfileSetup({
        status: 'approved',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '0123456789',
        department: 'IT',
        userType: 'staff'
      })).toBe(false);
      
      // No profile
      expect(AuthService.needsProfileSetup(null)).toBe(true);
      expect(AuthService.needsProfileSetup(undefined)).toBe(true);
    });
  });
});