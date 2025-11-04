import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { logFirebaseError, logFirebaseServiceStatus } from '../utils/errorLogger';

// Environment-specific Firebase configurations
const firebaseConfigs = {
  development: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY_DEV || process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN_DEV || process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID_DEV || process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET_DEV || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID_DEV || process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID_DEV || process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID_DEV || process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  },
  production: {
    // Production now uses standard environment variable names (matching .env.production)
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  }
};

// Determine current environment
const environment = process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
const isDevelopment = environment === 'development';

// Validate environment configuration
if (!['development', 'production', 'test'].includes(environment)) {
  console.warn(`⚠️  Unknown environment: ${environment}. Defaulting to development mode.`);
}

// Log environment detection
console.log(`🌍 Environment detected: ${environment}`);
console.log(`📋 Environment variables status:`, {
  REACT_APP_ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'not set',
  NODE_ENV: process.env.NODE_ENV || 'not set',
  REACT_APP_USE_EMULATOR: process.env.REACT_APP_USE_EMULATOR || 'not set'
});

// Log Firebase environment variables availability (without exposing values)
const firebaseEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
  'REACT_APP_FIREBASE_MEASUREMENT_ID'
];

const envVarStatus = {};
firebaseEnvVars.forEach(varName => {
  envVarStatus[varName] = process.env[varName] ? '✅ set' : '❌ missing';
});

console.log(`🔧 Firebase environment variables:`, envVarStatus);

// Select appropriate configuration
const firebaseConfig = firebaseConfigs[isProduction ? 'production' : 'development'];

// Log which configuration is being used (without sensitive data)
console.log(`🔧 Using ${isProduction ? 'production' : 'development'} Firebase configuration`);
console.log(`📦 Configuration keys available:`, Object.keys(firebaseConfig).filter(key => firebaseConfig[key]));

// Configuration Validator Class
class ConfigValidator {
  static getRequiredFields(environment) {
    return [
      'apiKey',
      'authDomain', 
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId'
    ];
  }

  static validateFirebaseConfig(config, environment) {
    const requiredFields = this.getRequiredFields(environment);
    const missingFields = [];
    const invalidFields = [];

    // Check for missing or invalid fields
    requiredFields.forEach(field => {
      if (!config[field]) {
        missingFields.push(field);
      } else if (typeof config[field] !== 'string' || config[field].trim() === '') {
        invalidFields.push(field);
      }
    });

    // Generate validation errors if any
    if (missingFields.length > 0 || invalidFields.length > 0) {
      const errors = this.formatValidationErrors(missingFields, invalidFields, environment, config);
      throw new Error(`Firebase configuration validation failed:\n${errors.join('\n')}`);
    }

    // Validate specific field formats
    this.validateFieldFormats(config);

    console.log(`✅ Firebase configuration validation passed for ${environment} environment`);
    return true;
  }

  static formatValidationErrors(missingFields, invalidFields, environment, config) {
    const errorMessages = [];
    
    if (missingFields.length > 0) {
      const envVarNames = missingFields.map(field => {
        const baseVar = `REACT_APP_FIREBASE_${field.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
        return baseVar.replace('_I_D', '_ID').replace('_A_P_I', '_API');
      });
      errorMessages.push(`Missing required environment variables for ${environment}:`);
      errorMessages.push(`  ${envVarNames.join('\n  ')}`);
    }
    
    if (invalidFields.length > 0) {
      errorMessages.push(`Invalid (empty) environment variables for ${environment}: ${invalidFields.join(', ')}`);
    }

    // Add helpful debugging information
    errorMessages.push(`\nCurrent environment: ${environment}`);
    errorMessages.push(`Available config keys: ${Object.keys(config).filter(key => config[key]).join(', ')}`);
    
    return errorMessages;
  }

  static validateFieldFormats(config) {
    // Validate API key format
    if (config.apiKey && !config.apiKey.startsWith('AIza')) {
      console.warn('⚠️  Firebase API key format may be incorrect - should start with "AIza"');
    }

    // Check for placeholder values
    if (config.projectId && (config.projectId.includes('your_production') || config.projectId.includes('placeholder'))) {
      throw new Error(`Firebase project ID appears to be a placeholder value: ${config.projectId}`);
    }

    // Validate domain format
    if (config.authDomain && !config.authDomain.includes('.firebaseapp.com')) {
      console.warn('⚠️  Firebase auth domain format may be incorrect - should end with ".firebaseapp.com"');
    }

    // Validate storage bucket format
    if (config.storageBucket && !config.storageBucket.includes('.firebasestorage.app')) {
      console.warn('⚠️  Firebase storage bucket format may be incorrect - should end with ".firebasestorage.app"');
    }

    // Validate app ID format
    if (config.appId && !config.appId.includes(':web:')) {
      console.warn('⚠️  Firebase app ID format may be incorrect - should contain ":web:"');
    }
  }
}

// Validate configuration using ConfigValidator
try {
  ConfigValidator.validateFirebaseConfig(firebaseConfig, environment);
} catch (error) {
  console.error('🚨 Firebase Configuration Error:', error.message);
  
  // Log configuration error
  logFirebaseError(error, 'configuration', 'validation', {
    environment: environment,
    configKeys: Object.keys(firebaseConfig).filter(key => firebaseConfig[key])
  });
  
  throw error;
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
} catch (error) {
  console.error('🚨 Firebase app initialization failed:', error.message);
  
  // Log Firebase initialization error
  logFirebaseError(error, 'app', 'initialization', {
    environment: environment,
    configKeys: Object.keys(firebaseConfig).filter(key => firebaseConfig[key])
  });
  
  throw error;
}

// Utility function for initializing optional services
const initializeOptionalService = (serviceName, initFunction, successMessage, warningMessage) => {
  try {
    const service = initFunction();
    console.log(`✅ ${successMessage}`);
    return service;
  } catch (error) {
    console.warn(`⚠️  ${warningMessage}:`, error.message);
    console.warn(`📱 Application will continue without ${serviceName}`);
    
    // Log Firebase service error
    logFirebaseError(error, serviceName.toLowerCase(), 'initialization', {
      isOptionalService: true,
      environment: environment
    });
    
    return null;
  }
};

// Initialize Firebase Authentication and get a reference to the service
let auth, db, storage;
try {
  auth = getAuth(app);
  console.log('✅ Firebase Auth initialized successfully');
} catch (error) {
  console.error('🚨 Firebase Auth initialization failed:', error.message);
  logFirebaseError(error, 'auth', 'initialization', { environment });
  throw error;
}

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Cloud Firestore and get a reference to the service
try {
  db = getFirestore(app);
  console.log('✅ Firebase Firestore initialized successfully');
} catch (error) {
  console.error('🚨 Firebase Firestore initialization failed:', error.message);
  logFirebaseError(error, 'firestore', 'initialization', { environment });
  throw error;
}

// Initialize Cloud Storage and get a reference to the service
try {
  storage = getStorage(app);
  console.log('✅ Firebase Storage initialized successfully');
} catch (error) {
  console.error('🚨 Firebase Storage initialization failed:', error.message);
  logFirebaseError(error, 'storage', 'initialization', { environment });
  throw error;
}

export { auth, db, storage };

// Initialize optional services (Analytics and Performance) for production
let analytics = null;
let performance = null;

// Temporarily disable optional services to prevent initialization errors
console.log('🔧 Skipping optional Firebase services initialization to prevent errors');
console.log('📊 Optional services status: { analytics: "disabled", performance: "disabled" }');

// Optional services will be re-enabled after fixing initialization issues
analytics = null;
performance = null;

// Validate emulator settings
const useEmulator = process.env.REACT_APP_USE_EMULATOR === 'true';
if (useEmulator && isProduction) {
  console.warn('⚠️  REACT_APP_USE_EMULATOR is set to true in production environment - this should be false');
}

// Connect to emulators in development with graceful degradation
if (useEmulator && isDevelopment) {
  console.log('🔥 Connecting to Firebase emulators...');
  
  // Connect to Auth emulator with graceful degradation
  try {
    if (!auth._delegate._config.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('✅ Auth emulator connected');
    }
  } catch (error) {
    console.warn('⚠️  Auth emulator connection failed:', error.message);
    console.warn('🔐 Using production Auth service instead');
    logFirebaseError(error, 'auth', 'emulator_connection', { environment: 'development' });
  }
  
  // Connect to Firestore emulator with graceful degradation
  try {
    if (!db._delegate._databaseId.projectId.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('✅ Firestore emulator connected');
    }
  } catch (error) {
    console.warn('⚠️  Firestore emulator connection failed:', error.message);
    console.warn('🗄️  Using production Firestore service instead');
    logFirebaseError(error, 'firestore', 'emulator_connection', { environment: 'development' });
  }
  
  // Connect to Storage emulator with graceful degradation
  try {
    if (!storage._delegate._host.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('✅ Storage emulator connected');
    }
  } catch (error) {
    console.warn('⚠️  Storage emulator connection failed:', error.message);
    console.warn('💾 Using production Storage service instead');
    logFirebaseError(error, 'storage', 'emulator_connection', { environment: 'development' });
  }
}

// Load production configuration
let productionConfig = {};
try {
  if (isProduction) {
    productionConfig = require('./production.json');
  }
} catch (error) {
  console.warn('Production config not found, using defaults');
}

// Log current configuration (without sensitive data)
console.log(`🔧 Firebase initialized for ${environment} environment`);
console.log(`📦 Project ID: ${firebaseConfig.projectId}`);

if (isProduction) {
  console.log(`🚀 Production features enabled:`, {
    analytics: productionConfig.firebase?.enableAnalytics,
    performance: productionConfig.firebase?.enablePerformance,
    notifications: productionConfig.notifications?.enabled
  });
}

// Service availability checker
export const getServiceStatus = () => {
  const status = {
    analytics: analytics !== null,
    performance: performance !== null,
    auth: auth !== null,
    firestore: db !== null,
    storage: storage !== null
  };
  
  // Log service status for monitoring
  logFirebaseServiceStatus(status);
  
  return status;
};

// Helper function to safely use optional services
export const safelyUseAnalytics = (callback) => {
  if (analytics) {
    try {
      return callback(analytics);
    } catch (error) {
      console.warn('⚠️  Analytics operation failed:', error.message);
      return null;
    }
  } else {
    console.warn('📊 Analytics not available - operation skipped');
    return null;
  }
};

export const safelyUsePerformance = (callback) => {
  if (performance) {
    try {
      return callback(performance);
    } catch (error) {
      console.warn('⚠️  Performance operation failed:', error.message);
      return null;
    }
  } else {
    console.warn('⚡ Performance monitoring not available - operation skipped');
    return null;
  }
};

// Export analytics, performance, and configuration
export { analytics, performance, productionConfig, ConfigValidator };

export default app;