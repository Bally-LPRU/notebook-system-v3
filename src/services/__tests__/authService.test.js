const CLASSIFIED_ERROR_MESSAGE = 'Mock classified message';

const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => ({ seconds: Date.now() / 1000 }));

const mockFirebaseSignOut = jest.fn();
const mockGetRedirectResult = jest.fn();
const mockOnAuthStateChanged = jest.fn();
const mockSetPersistence = jest.fn();
const mockBrowserLocalPersistence = {};
const mockFirebaseSignInWithPopup = jest.fn();

const mockLogError = jest.fn();

const mockErrorClassifier = {
  classify: jest.fn(() => ({ type: 'unknown', severity: 'low' })),
  getErrorMessage: jest.fn(() => ({ message: CLASSIFIED_ERROR_MESSAGE }))
};

const createRetryMock = () =>
  jest.fn(async (operationFn) => {
    if (typeof operationFn === 'function') {
      return operationFn();
    }
    return undefined;
  });

const mockWithRetry = createRetryMock();
const mockWithProfileRetry = createRetryMock();
const mockWithFirestoreRetry = createRetryMock();

jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null,
    app: { name: 'test-app' },
    config: { authDomain: 'test.firebaseapp.com' }
  },
  googleProvider: {
    setCustomParameters: jest.fn(),
    customParameters: {}
  },
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  serverTimestamp: mockServerTimestamp
}));

jest.mock('firebase/auth', () => ({
  __esModule: true,
  signOut: mockFirebaseSignOut,
  getRedirectResult: mockGetRedirectResult,
  onAuthStateChanged: mockOnAuthStateChanged,
  setPersistence: mockSetPersistence,
  browserLocalPersistence: mockBrowserLocalPersistence,
  signInWithPopup: mockFirebaseSignInWithPopup
}));

jest.mock('../../utils/errorLogger', () => ({
  logError: mockLogError
}));

jest.mock('../../utils/errorClassification', () => ({
  ErrorClassifier: mockErrorClassifier
}));

jest.mock('../../utils/retryHandler', () => ({
  withRetry: mockWithRetry,
  withProfileRetry: mockWithProfileRetry,
  withFirestoreRetry: mockWithFirestoreRetry
}));

const AuthService = require('../authService').default;

describe('AuthService', () => {
  let connectivitySpy;
  let duplicateSpy;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();

    mockWithRetry.mockImplementation(async (operationFn) => operationFn());
    mockWithProfileRetry.mockImplementation(async (operationFn) => operationFn());
    mockWithFirestoreRetry.mockImplementation(async (operationFn) => operationFn());
    mockServerTimestamp.mockImplementation(() => ({ seconds: Date.now() / 1000 }));
    mockErrorClassifier.classify.mockReturnValue({ type: 'unknown', severity: 'low' });
    mockErrorClassifier.getErrorMessage.mockReturnValue({ message: CLASSIFIED_ERROR_MESSAGE });

    connectivitySpy = jest.spyOn(AuthService, '_checkNetworkConnectivity').mockResolvedValue();
    duplicateSpy = jest
      .spyOn(AuthService, 'checkForDuplicateProfile')
      .mockResolvedValue({ hasDuplicate: false });
  });

  describe('signInWithGoogle', () => {
    it('should return popup result when sign in succeeds', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@gmail.com',
        displayName: 'Test User'
      };

      const popupSpy = jest.spyOn(AuthService, '_signInWithPopup').mockResolvedValue(mockUser);

      const result = await AuthService.signInWithGoogle();

      expect(connectivitySpy).toHaveBeenCalled();
      expect(popupSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('should surface classified errors from popup failures', async () => {
      const popupError = new Error('Sign in failed');
      jest.spyOn(AuthService, '_signInWithPopup').mockRejectedValue(popupError);

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(CLASSIFIED_ERROR_MESSAGE);
      expect(mockErrorClassifier.classify).toHaveBeenCalled();
      expect(mockErrorClassifier.getErrorMessage).toHaveBeenCalled();
    });

    it('should stop when network connectivity check fails', async () => {
      const popupSpy = jest.spyOn(AuthService, '_signInWithPopup').mockResolvedValue({});
      connectivitySpy.mockRejectedValueOnce(new Error('offline'));

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(CLASSIFIED_ERROR_MESSAGE);
      expect(popupSpy).not.toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      const { auth } = require('../../config/firebase');
      const { signOut } = require('firebase/auth');
      signOut.mockResolvedValue();

      await AuthService.signOut();

      expect(signOut).toHaveBeenCalledWith(auth);
    });

    it('should handle sign out errors', async () => {
      const { signOut } = require('firebase/auth');
      signOut.mockRejectedValue(new Error('Sign out failed'));

      await expect(AuthService.signOut()).rejects.toThrow(CLASSIFIED_ERROR_MESSAGE);
      expect(mockErrorClassifier.classify).toHaveBeenCalled();
    });
  });

  describe('createUserProfile', () => {
    it('should create user profile successfully', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@gmail.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      };

      const mockProfileData = {
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '0123456789',
        department: 'IT',
        userType: 'staff'
      };

      const { doc, setDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'users/test-uid' });
      setDoc.mockResolvedValue();

      const result = await AuthService.createUserProfile(mockUser, mockProfileData);

      expect(setDoc).toHaveBeenCalledWith(
        { id: 'users/test-uid' },
        expect.objectContaining({
          uid: mockUser.uid,
          email: mockUser.email.toLowerCase(),
          role: 'user',
          status: 'incomplete'
        })
      );
        expect(duplicateSpy).toHaveBeenCalledWith(mockUser.email);
      expect(result).toEqual(
        expect.objectContaining({
          uid: mockUser.uid,
          email: mockUser.email.toLowerCase(),
          ...mockProfileData,
          role: 'user',
          status: 'incomplete',
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object)
        })
      );
    });

    it('should handle profile creation errors', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@gmail.com'
      };

      const mockProfileData = {
        firstName: 'Test',
        lastName: 'User'
      };

      const { doc, setDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'users/test-uid' });
      setDoc.mockRejectedValue(new Error('Profile creation failed'));

      await expect(AuthService.createUserProfile(mockUser, mockProfileData))
        .rejects.toThrow(CLASSIFIED_ERROR_MESSAGE);
      expect(mockErrorClassifier.classify).toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockProfile = {
        uid: 'test-uid',
        email: 'test@gmail.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        status: 'approved'
      };

      const { doc, getDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'test-uid' });
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
        id: 'test-uid'
      });

      const result = await AuthService.getUserProfile('test-uid');

      expect(getDoc).toHaveBeenCalled();
      expect(result).toEqual({ id: 'test-uid', ...mockProfile });
    });

    it('should return null for non-existent profile', async () => {
      const { doc, getDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'test-uid' });
      getDoc.mockResolvedValue({
        exists: () => false
      });

      const result = await AuthService.getUserProfile('test-uid');

      expect(result).toBeNull();
    });

    it('should handle profile fetch errors', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValue(new Error('Profile fetch failed'));

      await expect(AuthService.getUserProfile('test-uid'))
        .rejects.toThrow(CLASSIFIED_ERROR_MESSAGE);
      expect(mockErrorClassifier.classify).toHaveBeenCalled();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const { doc, setDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'test-uid' });
      setDoc.mockResolvedValue();

      await AuthService.updateUserProfile('test-uid', updateData);

      expect(setDoc).toHaveBeenCalledWith(
        { id: 'test-uid' },
        {
          ...updateData,
          updatedAt: expect.any(Object)
        },
        { merge: true }
      );
    });

    it('should handle profile update errors', async () => {
      const { doc, setDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'test-uid' });
      setDoc.mockRejectedValue(new Error('Profile update failed'));

      await expect(AuthService.updateUserProfile('test-uid', { firstName: 'Test' }))
        .rejects.toThrow(CLASSIFIED_ERROR_MESSAGE);
      expect(mockErrorClassifier.classify).toHaveBeenCalled();
    });
  });

  describe('isValidEmail', () => {
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
});