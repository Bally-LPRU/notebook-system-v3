import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Production Firebase configuration - hardcoded for reliability
const firebaseConfig = {
  apiKey: "AIzaSyA9D6ReIlhiaaJ1g1Obd-dcjp2R0LO_eyo",
  authDomain: "equipment-lending-system-41b49.firebaseapp.com",
  projectId: "equipment-lending-system-41b49",
  storageBucket: "equipment-lending-system-41b49.firebasestorage.app",
  messagingSenderId: "47770598089",
  appId: "1:47770598089:web:9d898f247f742fe1686b18",
  measurementId: "G-YQ5GGVMR4V"
};

// Log Firebase initialization
console.log('🔥 Initializing Firebase with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

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

// Service status check
export const getServiceStatus = () => ({
  analytics: false,
  performance: false,
  auth: !!auth,
  firestore: !!db,
  storage: !!storage
});

// Compatibility functions
export const safelyUseAnalytics = () => null;
export const safelyUsePerformance = () => null;

// Config validator
export const ConfigValidator = {
  validateFirebaseConfig: (config) => {
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