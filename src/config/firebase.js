import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration with fallback for production
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyA9D6ReIlhiaaJ1g1Obd-dcjp2R0LO_eyo',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'equipment-lending-system-41b49.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'equipment-lending-system-41b49',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'equipment-lending-system-41b49.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '47770598089',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:47770598089:web:9d898f247f742fe1686b18',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-YQ5GGVMR4V'
};

// Log environment status
console.log('🌍 Environment:', process.env.NODE_ENV);
console.log('🔧 All Environment Variables:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
console.log('🔧 Firebase Config Status:', {
  apiKey: firebaseConfig.apiKey ? `✅ set (${firebaseConfig.apiKey.substring(0, 10)}...)` : '❌ missing',
  authDomain: firebaseConfig.authDomain ? `✅ set (${firebaseConfig.authDomain})` : '❌ missing',
  projectId: firebaseConfig.projectId ? `✅ set (${firebaseConfig.projectId})` : '❌ missing',
  storageBucket: firebaseConfig.storageBucket ? `✅ set (${firebaseConfig.storageBucket})` : '❌ missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? `✅ set (${firebaseConfig.messagingSenderId})` : '❌ missing',
  appId: firebaseConfig.appId ? `✅ set (${firebaseConfig.appId})` : '❌ missing'
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