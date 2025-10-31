import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

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
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY_PROD || process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN_PROD || process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID_PROD || process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET_PROD || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID_PROD || process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID_PROD || process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID_PROD || process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  }
};

// Determine current environment
const environment = process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
const isDevelopment = environment === 'development';

// Select appropriate configuration
const firebaseConfig = firebaseConfigs[isProduction ? 'production' : 'development'];

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(`Firebase configuration is incomplete for ${environment} environment`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Analytics and Performance for production
let analytics = null;
let performance = null;

if (isProduction && typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
    performance = getPerformance(app);
    console.log('📊 Firebase Analytics and Performance initialized');
  } catch (error) {
    console.warn('Firebase Analytics/Performance initialization failed:', error.message);
  }
}

// Connect to emulators in development
if (process.env.REACT_APP_USE_EMULATOR === 'true' && isDevelopment) {
  try {
    // Connect to Auth emulator
    if (!auth._delegate._config.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
    
    // Connect to Firestore emulator
    if (!db._delegate._databaseId.projectId.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    
    // Connect to Storage emulator
    if (!storage._delegate._host.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
    
    console.log('🔥 Firebase emulators connected');
  } catch (error) {
    console.warn('Firebase emulator connection failed:', error.message);
  }
}

// Load production configuration
let productionConfig = {};
try {
  if (isProduction) {
    productionConfig = require('../../config/production.json');
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

// Export analytics, performance, and configuration
export { analytics, performance, productionConfig };

export default app;