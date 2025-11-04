import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { logAuthError, logFirebaseError } from '../utils/errorLogger';

// Error types for better error handling
const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'auth',
  PERMISSION: 'permission',
  VALIDATION: 'validation',
  FIRESTORE: 'firestore',
  UNKNOWN: 'unknown'
};

// Error messages in Thai for user-friendly display
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
  AUTH_POPUP_BLOCKED: 'หน้าต่างการเข้าสู่ระบบถูกบล็อก กรุณาอนุญาตป๊อปอัพและลองใหม่',
  AUTH_POPUP_CLOSED: 'หน้าต่างการเข้าสู่ระบบถูกปิด กรุณาลองใหม่',
  AUTH_CANCELLED: 'การเข้าสู่ระบบถูกยกเลิก',
  INVALID_EMAIL_DOMAIN: 'อีเมลของคุณไม่ได้รับอนุญาตให้เข้าใช้งานระบบ กรุณาใช้อีเมล @gmail.com หรือ @g.lpru.ac.th',
  PROFILE_FETCH_ERROR: 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้ กรุณาลองใหม่',
  PROFILE_CREATE_ERROR: 'ไม่สามารถสร้างโปรไฟล์ได้ กรุณาลองใหม่',
  PROFILE_UPDATE_ERROR: 'ไม่สามารถอัปเดตโปรไฟล์ได้ กรุณาลองใหม่',
  SIGN_OUT_ERROR: 'ไม่สามารถออกจากระบบได้ กรุณาลองใหม่',
  GENERIC_ERROR: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่'
};

class AuthService {
  // Helper method to classify and format errors
  static _handleError(error, context = '') {
    console.error(`AuthService Error (${context}):`, error);
    
    // Log to error logger
    if (context.includes('firestore') || context.includes('profile')) {
      logFirebaseError(error, 'firestore', context, { service: 'AuthService' });
    } else {
      logAuthError(error, context, { service: 'AuthService' });
    }
    
    // Network connectivity issues
    if (error.code === 'auth/network-request-failed' || 
        error.message?.includes('network') ||
        error.message?.includes('fetch')) {
      return {
        type: ERROR_TYPES.NETWORK,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        originalError: error,
        retryable: true
      };
    }
    
    // Authentication specific errors
    if (error.code?.startsWith('auth/')) {
      switch (error.code) {
        case 'auth/popup-blocked':
          return {
            type: ERROR_TYPES.AUTH,
            message: ERROR_MESSAGES.AUTH_POPUP_BLOCKED,
            originalError: error,
            retryable: true
          };
        case 'auth/popup-closed-by-user':
          return {
            type: ERROR_TYPES.AUTH,
            message: ERROR_MESSAGES.AUTH_POPUP_CLOSED,
            originalError: error,
            retryable: true
          };
        case 'auth/cancelled-popup-request':
          return {
            type: ERROR_TYPES.AUTH,
            message: ERROR_MESSAGES.AUTH_CANCELLED,
            originalError: error,
            retryable: true
          };
        default:
          return {
            type: ERROR_TYPES.AUTH,
            message: error.message || ERROR_MESSAGES.GENERIC_ERROR,
            originalError: error,
            retryable: false
          };
      }
    }
    
    // Firestore errors
    if (error.code?.startsWith('firestore/') || 
        error.message?.includes('firestore') ||
        error.message?.includes('document')) {
      return {
        type: ERROR_TYPES.FIRESTORE,
        message: context.includes('profile') ? ERROR_MESSAGES.PROFILE_FETCH_ERROR : ERROR_MESSAGES.GENERIC_ERROR,
        originalError: error,
        retryable: true
      };
    }
    
    // Custom validation errors (already in Thai)
    if (error.message?.includes('อีเมล') || error.message?.includes('email')) {
      return {
        type: ERROR_TYPES.VALIDATION,
        message: error.message,
        originalError: error,
        retryable: false
      };
    }
    
    // Default error handling
    return {
      type: ERROR_TYPES.UNKNOWN,
      message: error.message || ERROR_MESSAGES.GENERIC_ERROR,
      originalError: error,
      retryable: false
    };
  }

  // Helper method to check network connectivity
  static async _checkNetworkConnectivity() {
    if (!navigator.onLine) {
      throw new Error('ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อและลองใหม่');
    }
  }

  // Sign in with Google with enhanced error handling
  static async signInWithGoogle() {
    try {
      // Check network connectivity first
      await this._checkNetworkConnectivity();
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Validate email domain
      if (!this.isValidEmail(user.email)) {
        await this.signOut();
        const error = new Error(ERROR_MESSAGES.INVALID_EMAIL_DOMAIN);
        throw this._handleError(error, 'email validation');
      }
      
      // Check if user exists in Firestore with retry logic
      let userDoc = null;
      const maxRetries = 3;
      
      for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
        try {
          userDoc = await this.getUserProfile(user.uid);
          break;
        } catch (profileError) {
          if (retryCount >= maxRetries - 1) {
            throw profileError;
          }
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, retryCount + 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (!userDoc) {
        // Create new user profile with retry logic
        for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
          try {
            await this.createUserProfile(user);
            break;
          } catch (createError) {
            if (retryCount >= maxRetries - 1) {
              throw createError;
            }
            const delay = Math.pow(2, retryCount + 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      return user;
    } catch (error) {
      const handledError = this._handleError(error, 'sign in');
      throw new Error(handledError.message);
    }
  }

  // Helper method to validate email domains
  static isValidEmail(email) {
    if (!email) return false;
    const allowedDomains = ['gmail.com', 'g.lpru.ac.th'];
    const userDomain = email.split('@')[1];
    return allowedDomains.includes(userDomain);
  }

  // Sign out with enhanced error handling
  static async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      const handledError = this._handleError(error, 'sign out');
      throw new Error(handledError.message);
    }
  }

  // Get user profile from Firestore with enhanced error handling
  static async getUserProfile(uid) {
    try {
      if (!uid) {
        throw new Error('User ID is required');
      }
      
      await this._checkNetworkConnectivity();
      
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      
      return null;
    } catch (error) {
      const handledError = this._handleError(error, 'get user profile');
      throw new Error(handledError.message);
    }
  }

  // Create user profile in Firestore with enhanced error handling
  static async createUserProfile(user, additionalData = {}) {
    try {
      if (!user || !user.uid) {
        throw new Error('Valid user object is required');
      }
      
      await this._checkNetworkConnectivity();
      
      const userDocRef = doc(db, 'users', user.uid);
      
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'user', // Default role
        status: 'incomplete', // Profile not yet completed
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...additionalData
      };
      
      await setDoc(userDocRef, userData);
      return userData;
    } catch (error) {
      const handledError = this._handleError(error, 'create user profile');
      throw new Error(handledError.message);
    }
  }

  // Check if user needs to complete profile setup
  static needsProfileSetup(userProfile) {
    if (!userProfile) return true;
    
    return (
      userProfile.status === 'incomplete' ||
      !userProfile.firstName ||
      !userProfile.lastName ||
      !userProfile.phoneNumber ||
      !userProfile.department ||
      !userProfile.userType
    );
  }

  // Update user profile with enhanced error handling
  static async updateUserProfile(uid, data) {
    try {
      if (!uid) {
        throw new Error('User ID is required');
      }
      
      if (!data || Object.keys(data).length === 0) {
        throw new Error('Update data is required');
      }
      
      await this._checkNetworkConnectivity();
      
      const userDocRef = doc(db, 'users', uid);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userDocRef, updateData, { merge: true });
      
      // If this is a profile completion (status changing to pending), notify admins
      if (data.status === 'pending' && data.firstName && data.lastName) {
        try {
          // Import NotificationService dynamically to avoid circular dependency
          const { default: NotificationService } = await import('./notificationService');
          await NotificationService.notifyAdminsNewUser({
            uid,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email || 'ไม่ระบุ'
          });
        } catch (notificationError) {
          console.error('Error sending notification to admins:', notificationError);
          // Don't throw error here as profile update was successful
        }
      }
      
      return updateData;
    } catch (error) {
      const handledError = this._handleError(error, 'update user profile');
      throw new Error(handledError.message);
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Expose error types for external use
  static getErrorTypes() {
    return ERROR_TYPES;
  }

  // Expose error messages for external use
  static getErrorMessages() {
    return ERROR_MESSAGES;
  }
}

export default AuthService;