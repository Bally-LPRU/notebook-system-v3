const CLASSIFIED_ERROR_MESSAGE = 'Mock classified message';

const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockServerTimestamp = jest.fn();

const mockSignInWithPopup = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChanged = jest.fn();
const mockSetPersistence = jest.fn();
const mockBrowserLocalPersistence = {};

const mockLogError = jest.fn();
const mockLogAuthError = jest.fn();
const mockLogFirebaseError = jest.fn();

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

const mockErrorClassifier = {
  classify: jest.fn(),
  getErrorMessage: jest.fn()
};

const mockGoogleProvider = {
  setCustomParameters: jest.fn(),
  customParameters: {}
};

if (typeof global.navigator === 'undefined') {
  global.navigator = { onLine: true };
}

jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null,
    app: { name: 'test-app' },
    config: { authDomain: 'test.firebaseapp.com' }
  },
  googleProvider: mockGoogleProvider,
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
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  setPersistence: mockSetPersistence,
  browserLocalPersistence: mockBrowserLocalPersistence
}));

jest.mock('../../utils/errorLogger', () => ({
  logError: mockLogError,
  logAuthError: mockLogAuthError,
  logFirebaseError: mockLogFirebaseError
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

describe('AuthService Error Handling', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@gmail.com',
    displayName: 'Test User'
  };

  let connectivitySpy;

  const expectClassifiedRejection = async (action, message = CLASSIFIED_ERROR_MESSAGE) => {
    await expect(action).rejects.toThrow(message);
    expect(mockErrorClassifier.getErrorMessage).toHaveBeenCalled();
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSignInWithPopup.mockReset();
    mockSignOut.mockReset();
    mockOnAuthStateChanged.mockReset();
    mockSetPersistence.mockReset();
    mockGetDoc.mockReset();
    mockSetDoc.mockReset();
    mockDoc.mockReset();
    mockServerTimestamp.mockReset();
    mockLogError.mockReset();
    mockLogAuthError.mockReset();
    mockLogFirebaseError.mockReset();
    mockWithRetry.mockImplementation(async (fn) => (fn ? fn() : undefined));
    mockWithProfileRetry.mockImplementation(async (fn) => (fn ? fn() : undefined));
    mockWithFirestoreRetry.mockImplementation(async (fn) => (fn ? fn() : undefined));

    mockErrorClassifier.classify.mockReset();
    mockErrorClassifier.getErrorMessage.mockReset();
    mockErrorClassifier.classify.mockReturnValue({ type: 'unknown', severity: 'low', retryable: false });
    mockErrorClassifier.getErrorMessage.mockReturnValue({ message: CLASSIFIED_ERROR_MESSAGE });

    mockSignInWithPopup.mockResolvedValue({ user: mockUser });
    mockSignOut.mockResolvedValue();
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue();
    mockDoc.mockReturnValue({ id: 'users/test-uid' });
    mockServerTimestamp.mockReturnValue({ seconds: Date.now() / 1000 });

    connectivitySpy = jest.spyOn(AuthService, '_checkNetworkConnectivity').mockResolvedValue();
    jest.spyOn(AuthService, 'checkForDuplicateProfile').mockResolvedValue({ hasDuplicate: false });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('propagates classified errors from popup failures', async () => {
      const popupError = new Error('Popup failed');
      mockSignInWithPopup.mockRejectedValueOnce(popupError);

      await expectClassifiedRejection(() => AuthService.signInWithGoogle());

      expect(mockErrorClassifier.classify).toHaveBeenCalledWith(
        popupError,
        expect.objectContaining({ operation: 'sign in with google' })
      );
      expect(mockLogError).toHaveBeenCalled();
    });

    it('stops before popup when network check fails', async () => {
      connectivitySpy.mockRejectedValueOnce(new Error('offline'));

      await expectClassifiedRejection(() => AuthService.signInWithGoogle());
      expect(mockSignInWithPopup).not.toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('classifies sign-out failures', async () => {
      const error = new Error('Sign out failed');
      mockSignOut.mockRejectedValueOnce(error);

      await expectClassifiedRejection(() => AuthService.signOut());
      expect(mockErrorClassifier.classify).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ operation: 'sign out' })
      );
    });
  });

  describe('createUserProfile', () => {
    it('returns classified error when Firestore fails', async () => {
      mockSetDoc.mockRejectedValueOnce(new Error('Firestore down'));

      await expectClassifiedRejection(() => AuthService.createUserProfile(mockUser));
      expect(mockWithFirestoreRetry).toHaveBeenCalled();
    });

    it('validates user object before creation', async () => {
      await expectClassifiedRejection(() => AuthService.createUserProfile(null));
      expect(mockErrorClassifier.classify).toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('classifies Firestore errors', async () => {
      const firestoreError = new Error('permission denied');
      mockGetDoc.mockRejectedValueOnce(firestoreError);

      await expectClassifiedRejection(() => AuthService.getUserProfile('test-uid'));
      expect(mockErrorClassifier.classify).toHaveBeenCalledWith(
        firestoreError,
        expect.objectContaining({ operation: 'get user profile' })
      );
    });

    it('validates uid before fetching profile', async () => {
      await expectClassifiedRejection(() => AuthService.getUserProfile(''));
    });
  });

  describe('updateUserProfile', () => {
    it('requires update data', async () => {
      await expectClassifiedRejection(() => AuthService.updateUserProfile('test-uid', {}));
    });

    it('returns classified error when Firestore update fails', async () => {
      mockSetDoc.mockRejectedValueOnce(new Error('permission denied'));

      await expectClassifiedRejection(() => AuthService.updateUserProfile('test-uid', { firstName: 'A' }));
      expect(mockWithFirestoreRetry).toHaveBeenCalled();
    });
  });

  describe('_handleError', () => {
    it('returns classifier payload and logs the error', () => {
      const classification = { type: 'network', severity: 'medium', retryable: true };
      mockErrorClassifier.classify.mockReturnValueOnce(classification);

      const handled = AuthService._handleError(new Error('boom'), 'unit test');

      expect(handled).toBe(classification);
      expect(mockLogError).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth_service_error' })
      );
    });
  });

  describe('public helpers', () => {
    it('exposes known error messages', () => {
      const messages = AuthService.getErrorMessages();

      expect(messages).toHaveProperty('NETWORK_ERROR');
      expect(messages).toHaveProperty('PROFILE_FETCH_ERROR');
      expect(messages).toHaveProperty('SIGN_OUT_ERROR');
    });

    it('detects incomplete profiles', () => {
      expect(
        AuthService.needsProfileSetup({
          uid: '1',
          status: 'incomplete',
          firstName: 'Test'
        })
      ).toBe(true);

      expect(
        AuthService.needsProfileSetup({
          uid: '1',
          status: 'approved',
          firstName: 'A',
          lastName: 'B',
          phoneNumber: '0123456789',
          department: { value: 'dept', label: 'Dept' },
          userType: 'staff'
        })
      ).toBe(false);
    });
  });
});