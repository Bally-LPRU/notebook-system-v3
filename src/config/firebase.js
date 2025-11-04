import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Simple Firebase configuration for production
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Log environment status
console.log('🌍 Environment:', process.env.NODE_ENV);
console.log('🔧 Firebase Config Status:', {
  apiKey: firebaseConfig.apiKey ? '✅ set' : '❌ missing',
  authDomain: firebaseConfig.authDomain ? '✅ set' : '❌ missing',
  projectId: firebaseConfig.projectId ? '✅ set' : '❌ missing',
  storageBucket: firebaseConfig.storageBucket ? '✅ set' : '❌ missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✅ set' : '❌ missing',
  appId: firebaseConfig.appId ? '✅ set' : '❌ missing'
});

// Validate required fields
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  const error = `Missing Firebase configuration: ${missingFields.join(', ')}`;
  console.error('🚨 Firebase Configuration Error:', error);
  throw new Error(error);
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
} catch (error) {
  console.error('🚨 Firebase initialization failed:', error);
  throw error;
}

// Initialize services
let auth, db, storage;

try {
  auth = getAuth(app);
  console.log('✅ Firebase Auth initialized');
} catch (error) {
  console.error('🚨 Auth initialization failed:', error);
  throw error;
}

try {
  db = getFirestore(app);
  console.log('✅ Firestore initialized');
} catch (error) {
  console.error('🚨 Firestore initialization failed:', error);
  throw error;
}

try {
  storage = getStorage(app);
  console.log('✅ Storage initialized');
} catch (error) {
  console.error('🚨 Storage initialization failed:', error);
  throw error;
}

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Stub functions for compatibility
export const getServiceStatus = () => ({
  analytics: false,
  performance: false,
  auth: auth !== null,
  firestore: db !== null,
  storage: storage !== null
});

export const safelyUseAnalytics = (callback) => {
  console.warn('📊 Analytics not available - operation skipped');
  return null;
};

export const safelyUsePerformance = (callback) => {
  console.warn('⚡ Performance monitoring not available - operation skipped');
  return null;
};

// Simple ConfigValidator for compatibility
export const ConfigValidator = {
  validateFirebaseConfig: (config, environment) => {
    const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missing = required.filter(field => !config[field]);
    if (missing.length > 0) {
      throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`);
    }
    return true;
  },
  getRequiredFields: () => ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
};

// Export services
export { auth, db, storage };
export default app;