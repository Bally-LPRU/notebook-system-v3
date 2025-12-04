import { jest } from '@jest/globals';

// Create mock functions
const mockInitializeApp = jest.fn();
const mockGetAuth = jest.fn();
const mockGetFirestore = jest.fn();
const mockGetStorage = jest.fn();
const mockGetAnalytics = jest.fn();
const mockGetPerformance = jest.fn();
const mockGoogleAuthProvider = jest.fn();
const mockSetCustomParameters = jest.fn();
const mockConnectAuthEmulator = jest.fn();
const mockConnectFirestoreEmulator = jest.fn();
const mockConnectStorageEmulator = jest.fn();
const mockLogFirebaseError = jest.fn();
const mockLogFirebaseServiceStatus = jest.fn();

// Mock Firebase modules before importing
jest.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp
}));

jest.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
  GoogleAuthProvider: class MockGoogleAuthProvider {
    constructor() {
      this.setCustomParameters = mockSetCustomParameters;
    }
  },
  connectAuthEmulator: mockConnectAuthEmulator
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: mockGetFirestore,
  connectFirestoreEmulator: mockConnectFirestoreEmulator
}));

jest.mock('firebase/storage', () => ({
  getStorage: mockGetStorage,
  connectStorageEmulator: mockConnectStorageEmulator
}));

jest.mock('firebase/analytics', () => ({
  getAnalytics: mockGetAnalytics
}));

jest.mock('firebase/performance', () => ({
  getPerformance: mockGetPerformance
}));

jest.mock('../../utils/errorLogger', () => ({
  logFirebaseError: mockLogFirebaseError,
  logFirebaseServiceStatus: mockLogFirebaseServiceStatus
}));

describe('Firebase Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = process.env;
    
    // Clear all mocks
    jest.clearAllMocks();
    jest.resetModules();
    
    // Setup successful mocks by default
    mockInitializeApp.mockReturnValue({ name: 'test-app' });
    mockGetAuth.mockReturnValue({ currentUser: null });
    mockGetFirestore.mockReturnValue({ app: { name: 'test-app' } });
    mockGetStorage.mockReturnValue({ app: { name: 'test-app' } });
    mockGetAnalytics.mockReturnValue({ app: { name: 'test-app' } });
    mockGetPerformance.mockReturnValue({ app: { name: 'test-app' } });
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('ConfigValidator', () => {
    let ConfigValidator;

    beforeEach(async () => {
      // Set up valid environment
      process.env = {
        ...originalEnv,
        REACT_APP_FIREBASE_API_KEY: 'AIzaSyTest123',
        REACT_APP_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
        REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
        REACT_APP_FIREBASE_STORAGE_BUCKET: 'test.firebasestorage.app',
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        REACT_APP_FIREBASE_APP_ID: '1:123456789:web:abcdef',
        NODE_ENV: 'test'
      };

      // Import ConfigValidator after setting up environment
      const firebaseModule = await import('../../config/firebase');
      ConfigValidator = firebaseModule.ConfigValidator;
    });

    it('should validate complete Firebase configuration successfully', () => {
      const validConfig = {
        apiKey: 'AIzaSyTest123',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.firebasestorage.app',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef'
      };

      expect(() => {
        ConfigValidator.validateFirebaseConfig(validConfig, 'production');
      }).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const incompleteConfig = {
        apiKey: 'AIzaSyTest123',
        authDomain: 'test.firebaseapp.com'
        // Missing other required fields
      };

      expect(() => {
        ConfigValidator.validateFirebaseConfig(incompleteConfig, 'production');
      }).toThrow('Missing Firebase configuration: projectId, storageBucket, messagingSenderId, appId');
    });

    it('should throw error for empty field values', () => {
      const configWithEmptyFields = {
        apiKey: '',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.firebasestorage.app',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef'
      };

      expect(() => {
        ConfigValidator.validateFirebaseConfig(configWithEmptyFields, 'production');
      }).toThrow('Missing Firebase configuration: apiKey');
    });

    it('should allow placeholder values (validation deferred elsewhere)', () => {
      const configWithPlaceholders = {
        apiKey: 'AIzaSyTest123',
        authDomain: 'test.firebaseapp.com',
        projectId: 'your_production_project_id',
        storageBucket: 'test.firebasestorage.app',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef'
      };

      expect(() => {
        ConfigValidator.validateFirebaseConfig(configWithPlaceholders, 'production');
      }).not.toThrow();
    });

    it('should return required fields for environment', () => {
      const requiredFields = ConfigValidator.getRequiredFields('production');
      
      expect(requiredFields).toEqual([
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId'
      ]);
    });

    // formatValidationErrors removed in current implementation; no test needed
  });

  describe('Firebase Initialization', () => {
    beforeEach(() => {
      // Set up valid environment
      process.env = {
        ...originalEnv,
        REACT_APP_FIREBASE_API_KEY: 'AIzaSyTest123',
        REACT_APP_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
        REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
        REACT_APP_FIREBASE_STORAGE_BUCKET: 'test.firebasestorage.app',
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        REACT_APP_FIREBASE_APP_ID: '1:123456789:web:abcdef',
        NODE_ENV: 'test'
      };
    });

    it('should initialize Firebase app successfully', async () => {
      await import('../../config/firebase');
      
      expect(mockInitializeApp).toHaveBeenCalledWith({
        apiKey: 'AIzaSyA9D6ReIlhiaaJ1g1Obd-dcjp2R0LO_eyo',
        authDomain: 'equipment-lending-system-41b49.firebaseapp.com',
        projectId: 'equipment-lending-system-41b49',
        storageBucket: 'equipment-lending-system-41b49.firebasestorage.app',
        messagingSenderId: '47770598089',
        appId: '1:47770598089:web:9d898f247f742fe1686b18',
        measurementId: 'G-YQ5GGVMR4V'
      });
    });

    it('should initialize required services successfully', async () => {
      await import('../../config/firebase');
      
      expect(mockGetAuth).toHaveBeenCalled();
      expect(mockGetFirestore).toHaveBeenCalled();
      expect(mockGetStorage).toHaveBeenCalled();
    });

    it('should handle Firebase app initialization failure', async () => {
      const initError = new Error('Firebase app initialization failed');
      mockInitializeApp.mockImplementation(() => {
        throw initError;
      });

      await expect(import('../../config/firebase')).rejects.toThrow(
        'Firebase app initialization failed'
      );
    });

    it('should handle Auth service initialization failure', async () => {
      const authError = new Error('Auth initialization failed');
      mockGetAuth.mockImplementation(() => {
        throw authError;
      });

      await expect(import('../../config/firebase')).rejects.toThrow(
        'Auth initialization failed'
      );
    });

    it('should handle Firestore initialization failure', async () => {
      const firestoreError = new Error('Firestore initialization failed');
      mockGetFirestore.mockImplementation(() => {
        throw firestoreError;
      });

      await expect(import('../../config/firebase')).rejects.toThrow(
        'Firestore initialization failed'
      );
    });

    it('should handle Storage initialization failure', async () => {
      const storageError = new Error('Storage initialization failed');
      mockGetStorage.mockImplementation(() => {
        throw storageError;
      });

      await expect(import('../../config/firebase')).rejects.toThrow(
        'Storage initialization failed'
      );
    });
  });

  describe('Optional Services', () => {
    beforeEach(() => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production'
      };
    });

    it('should not initialize analytics or performance services (deliberately disabled)', async () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });

      await import('../../config/firebase');

      expect(mockGetAnalytics).not.toHaveBeenCalled();
      expect(mockGetPerformance).not.toHaveBeenCalled();
    });
  });

  describe('Service Status and Safety Functions', () => {
    beforeEach(() => {
      process.env = {
        ...originalEnv,
        REACT_APP_FIREBASE_API_KEY: 'AIzaSyTest123',
        REACT_APP_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
        REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
        REACT_APP_FIREBASE_STORAGE_BUCKET: 'test.firebasestorage.app',
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        REACT_APP_FIREBASE_APP_ID: '1:123456789:web:abcdef',
        NODE_ENV: 'test'
      };
    });

    it('should return service status correctly', async () => {
      const firebaseModule = await import('../../config/firebase');
      const status = firebaseModule.getServiceStatus();
      
      expect(status).toHaveProperty('analytics');
      expect(status).toHaveProperty('performance');
      expect(status).toHaveProperty('auth');
      expect(status).toHaveProperty('firestore');
      expect(status).toHaveProperty('storage');
    });

    it('should safely handle Analytics when unavailable', async () => {
      const firebaseModule = await import('../../config/firebase');
      const mockCallback = jest.fn();
      
      const result = firebaseModule.safelyUseAnalytics(mockCallback);
      
      // Should return null and not call callback when analytics unavailable
      expect(result).toBeNull();
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should safely handle Performance when unavailable', async () => {
      const firebaseModule = await import('../../config/firebase');
      const mockCallback = jest.fn();
      
      const result = firebaseModule.safelyUsePerformance(mockCallback);
      
      // Should return null and not call callback when performance unavailable
      expect(result).toBeNull();
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Emulator Configuration', () => {
    beforeEach(() => {
      process.env = {
        ...originalEnv,
        REACT_APP_FIREBASE_API_KEY: 'AIzaSyTest123',
        REACT_APP_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
        REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
        REACT_APP_FIREBASE_STORAGE_BUCKET: 'test.firebasestorage.app',
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        REACT_APP_FIREBASE_APP_ID: '1:123456789:web:abcdef',
        NODE_ENV: 'test',
        REACT_APP_USE_FIREBASE_EMULATORS: 'true',
        REACT_APP_FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9999',
        REACT_APP_FIRESTORE_EMULATOR_HOST: 'http://127.0.0.1:8999',
        REACT_APP_FIREBASE_STORAGE_EMULATOR_HOST: 'storage.local:9555'
      };
    });

    it('should connect to Firebase emulators when flag is enabled', async () => {
      await import('../../config/firebase');

      expect(mockConnectAuthEmulator).toHaveBeenCalledWith(
        expect.any(Object),
        'http://127.0.0.1:9999',
        { disableWarnings: true }
      );
      expect(mockConnectFirestoreEmulator).toHaveBeenCalledWith(
        expect.any(Object),
        '127.0.0.1',
        8999
      );
      expect(mockConnectStorageEmulator).toHaveBeenCalledWith(
        expect.any(Object),
        'storage.local',
        9555
      );
    });

    it('should skip emulator connection when flag is disabled', async () => {
      process.env.REACT_APP_USE_FIREBASE_EMULATORS = 'false';
      process.env.REACT_APP_USE_EMULATOR = 'false';

      await import('../../config/firebase');

      expect(mockConnectAuthEmulator).not.toHaveBeenCalled();
      expect(mockConnectFirestoreEmulator).not.toHaveBeenCalled();
      expect(mockConnectStorageEmulator).not.toHaveBeenCalled();
    });
  });
});