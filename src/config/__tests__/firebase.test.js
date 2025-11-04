import { jest } from '@jest/globals';

// Create mock functions
const mockInitializeApp = jest.fn();
const mockGetAuth = jest.fn();
const mockGetFirestore = jest.fn();
const mockGetStorage = jest.fn();
const mockGetAnalytics = jest.fn();
const mockGetPerformance = jest.fn();
const mockGoogleAuthProvider = jest.fn();
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
      this.setCustomParameters = jest.fn();
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
      }).toThrow('Firebase configuration validation failed');
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
      }).toThrow('Firebase configuration validation failed');
    });

    it('should throw error for placeholder values', () => {
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
      }).toThrow('Firebase project ID appears to be a placeholder value');
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

    it('should format validation errors with helpful messages', () => {
      const missingFields = ['apiKey', 'projectId'];
      const invalidFields = ['authDomain'];
      const environment = 'production';
      const config = { storageBucket: 'test.firebasestorage.app' };

      const errors = ConfigValidator.formatValidationErrors(
        missingFields, 
        invalidFields, 
        environment, 
        config
      );

      expect(errors).toContain('Missing required environment variables for production:');
      expect(errors).toContain('REACT_APP_FIREBASE_API_KEY');
      expect(errors).toContain('REACT_APP_FIREBASE_PROJECT_ID');
      expect(errors).toContain('Invalid (empty) environment variables for production: authDomain');
    });
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
        apiKey: 'AIzaSyTest123',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.firebasestorage.app',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef',
        measurementId: undefined
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
      // Set up production environment
      process.env = {
        ...originalEnv,
        REACT_APP_FIREBASE_API_KEY: 'AIzaSyTest123',
        REACT_APP_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
        REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
        REACT_APP_FIREBASE_STORAGE_BUCKET: 'test.firebasestorage.app',
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        REACT_APP_FIREBASE_APP_ID: '1:123456789:web:abcdef',
        NODE_ENV: 'production'
      };
    });

    it('should initialize optional services in production', async () => {
      // Mock window object for browser environment
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });

      await import('../../config/firebase');
      
      expect(mockGetAnalytics).toHaveBeenCalled();
      expect(mockGetPerformance).toHaveBeenCalled();
    });

    it('should handle Analytics initialization failure gracefully', async () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });

      const analyticsError = new Error('Analytics initialization failed');
      mockGetAnalytics.mockImplementation(() => {
        throw analyticsError;
      });

      // Should not throw error, just log warning
      await expect(import('../../config/firebase')).resolves.toBeDefined();
    });

    it('should handle Performance initialization failure gracefully', async () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });

      const performanceError = new Error('Performance initialization failed');
      mockGetPerformance.mockImplementation(() => {
        throw performanceError;
      });

      // Should not throw error, just log warning
      await expect(import('../../config/firebase')).resolves.toBeDefined();
    });

    it('should skip optional services in development', async () => {
      process.env.NODE_ENV = 'development';

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

    it('should safely use Analytics when available', async () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });
      
      process.env.NODE_ENV = 'production';
      
      const firebaseModule = await import('../../config/firebase');
      const mockCallback = jest.fn();
      
      firebaseModule.safelyUseAnalytics(mockCallback);
      
      // Should call callback if analytics is available
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should safely handle Analytics when unavailable', async () => {
      const firebaseModule = await import('../../config/firebase');
      const mockCallback = jest.fn();
      
      const result = firebaseModule.safelyUseAnalytics(mockCallback);
      
      // Should return null and not call callback when analytics unavailable
      expect(result).toBeNull();
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should safely use Performance when available', async () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });
      
      process.env.NODE_ENV = 'production';
      
      const firebaseModule = await import('../../config/firebase');
      const mockCallback = jest.fn();
      
      firebaseModule.safelyUsePerformance(mockCallback);
      
      // Should call callback if performance is available
      expect(mockCallback).toHaveBeenCalled();
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
});