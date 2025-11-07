import { 
  signInWithRedirect, 
  getRedirectResult,
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { logError } from '../utils/errorLogger';
import { ErrorClassifier } from '../utils/errorClassification';
import { withRetry, withProfileRetry, withFirestoreRetry } from '../utils/retryHandler';
import DuplicateDetectionService from './duplicateDetectionService';


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
  AUTH_CANCELLED: 'การเข้าสู่ระบบถูกยกเลิก',
  AUTH_REDIRECT_ERROR: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่',
  INVALID_EMAIL_DOMAIN: 'อีเมลของคุณไม่ได้รับอนุญาตให้เข้าใช้งานระบบ กรุณาใช้อีเมล @gmail.com หรือ @g.lpru.ac.th',
  PROFILE_FETCH_ERROR: 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้ กรุณาลองใหม่',
  PROFILE_CREATE_ERROR: 'ไม่สามารถสร้างโปรไฟล์ได้ กรุณาลองใหม่',
  PROFILE_UPDATE_ERROR: 'ไม่สามารถอัปเดตโปรไฟล์ได้ กรุณาลองใหม่',
  SIGN_OUT_ERROR: 'ไม่สามารถออกจากระบบได้ กรุณาลองใหม่',
  GENERIC_ERROR: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่'
};

class AuthService {
  // Enhanced error handling using ErrorClassifier
  static _handleError(error, context = '') {
    console.error(`AuthService Error (${context}):`, error);
    
    // Use ErrorClassifier for comprehensive error handling
    const classification = ErrorClassifier.classify(error, {
      operation: context,
      component: 'AuthService'
    });
    
    // Log to error logger with classification
    logError({
      type: 'auth_service_error',
      error,
      context: { operation: context, component: 'AuthService' },
      severity: classification.severity,
      classification
    });
    
    return classification;
  }

  // Helper method to check network connectivity
  static async _checkNetworkConnectivity() {
    if (!navigator.onLine) {
      throw new Error('ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อและลองใหม่');
    }
  }

  // Sign in with Google using popup method (properly implemented to avoid blocking)
  static async signInWithGoogle() {
    try {
      console.log('🔍 AuthService.signInWithGoogle: Starting...');
      
      // Check network connectivity first
      await this._checkNetworkConnectivity();
      console.log('✅ Network connectivity check passed');
      
      // Use popup method instead of redirect to avoid localStorage issues
      console.log('🔍 Calling _signInWithPopup...');
      const result = await this._signInWithPopup();
      console.log('🔍 _signInWithPopup result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ AuthService.signInWithGoogle error:', error);
      const classification = this._handleError(error, 'sign in with google');
      const errorMessage = ErrorClassifier.getErrorMessage(classification);
      throw new Error(errorMessage.message);
    }
  }



  // Private method for popup authentication (properly implemented)
  static async _signInWithPopup() {
    try {
      console.log('🔐 Using popup authentication...');
      
      // CRITICAL: Set persistence BEFORE calling signInWithPopup
      const { signInWithPopup, setPersistence, browserLocalPersistence } = await import('firebase/auth');
      await setPersistence(auth, browserLocalPersistence);
      console.log('✅ Auth persistence set to LOCAL before popup');
      
      // Configure Google provider with additional parameters
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        hd: 'g.lpru.ac.th' // Prefer institutional domain
      });
      
      console.log('🔍 Google provider configured:', googleProvider.customParameters);
      
      return await withRetry(async () => {
        console.log('🔍 Calling signInWithPopup...');
        // Use popup - this returns immediately with the user
        const result = await signInWithPopup(auth, googleProvider);
        console.log('🔍 signInWithPopup returned:', result);
        
        const user = result.user;
        console.log('👤 User from popup:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
        
        // Validate email domain
        if (!this.isValidEmail(user.email)) {
          console.log('❌ Invalid email domain:', user.email);
          await this.signOut();
          throw new Error(ERROR_MESSAGES.INVALID_EMAIL_DOMAIN);
        }
        
        console.log('✅ Email domain valid');
        
        // Check for duplicate profiles
        console.log('🔍 Checking for duplicates...');
        try {
          const duplicateCheck = await this.checkForDuplicateProfile(user.email);
          console.log('🔍 Duplicate check result:', duplicateCheck);
          
          if (duplicateCheck.hasDuplicate) {
            console.log('🔍 Duplicate profile detected:', duplicateCheck.duplicateType);
            // User already exists - just return the user, don't create new profile
            return user;
          }
          
          console.log('✅ No duplicates found');
        } catch (duplicateError) {
          // If duplicate check fails, log but continue (don't block login)
          console.error('⚠️ Duplicate check failed, continuing anyway:', duplicateError);
        }
        
        // Check if user exists in Firestore
        console.log('🔍 Checking if user profile exists...');
        const userDoc = await withProfileRetry(async () => {
          return await this.getUserProfile(user.uid);
        }, { operation: 'get_user_profile_signin' });
        
        console.log('🔍 Existing user profile:', userDoc);
        
        if (!userDoc) {
          // Create new user profile
          console.log('🔍 Creating new user profile...');
          await withProfileRetry(async () => {
            await this.createUserProfile(user);
          }, { operation: 'create_user_profile_signin' });
          console.log('✅ New user profile created');
        } else {
          console.log('✅ User profile already exists');
        }
        
        console.log('✅ signInWithPopup completed successfully');
        return user;
      }, { operation: 'google_sign_in_popup' }, { maxRetries: 2 });
    } catch (error) {
      console.error('❌ _signInWithPopup error:', error);
      throw error;
    }
  }



  // Handle redirect result after authentication
  static async handleRedirectResult() {
    try {
      console.log('🔍 AuthService.handleRedirectResult: Starting...');
      console.log('🔍 Current auth state:', auth.currentUser);
      console.log('🔍 Auth config:', {
        apiKey: auth.config.apiKey?.substring(0, 10) + '...',
        authDomain: auth.config.authDomain
      });
      
      // CRITICAL: Set persistence BEFORE checking redirect result
      const { setPersistence, browserLocalPersistence } = await import('firebase/auth');
      await setPersistence(auth, browserLocalPersistence);
      console.log('✅ Auth persistence set to LOCAL before checking redirect result');
      
      await this._checkNetworkConnectivity();
      
      return await withRetry(async () => {
        console.log('🔍 AuthService: Calling getRedirectResult...');
        console.log('🔍 Auth instance:', auth);
        console.log('🔍 Auth app name:', auth.app.name);
        console.log('🔍 Auth config authDomain:', auth.config.authDomain);
        
        // Check localStorage for pending redirect
        const pendingRedirect = localStorage.getItem('firebase:pendingRedirect');
        console.log('🔍 Pending redirect in localStorage:', pendingRedirect);
        
        // Check all firebase keys in localStorage
        const firebaseKeys = Object.keys(localStorage).filter(key => key.startsWith('firebase:'));
        console.log('🔍 All Firebase localStorage keys:', firebaseKeys);
        firebaseKeys.forEach(key => {
          console.log(`  - ${key}:`, localStorage.getItem(key)?.substring(0, 100));
        });
        
        const result = await getRedirectResult(auth);
        
        console.log('🔍 AuthService: getRedirectResult returned:', result);
        console.log('🔍 Result type:', typeof result);
        console.log('🔍 Result is null?', result === null);
        console.log('🔍 Result.user:', result?.user);
        console.log('🔍 Result.operationType:', result?.operationType);
        
        // Check if result has a user (not just if result exists)
        if (!result || !result.user) {
          // No redirect result (user didn't just complete authentication)
          console.log('🔍 AuthService: No redirect result found (no user in result)');
          return null;
        }
        
        const user = result.user;
        console.log('🔍 AuthService: User from redirect:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
        
        // Validate email domain
        if (!this.isValidEmail(user.email)) {
          console.log('❌ AuthService: Invalid email domain:', user.email);
          await this.signOut();
          throw new Error(ERROR_MESSAGES.INVALID_EMAIL_DOMAIN);
        }
        
        console.log('✅ AuthService: Email domain valid');
        
        // Check for duplicate profiles before proceeding
        console.log('🔍 AuthService: Checking for duplicates...');
        const duplicateCheck = await this.checkForDuplicateProfile(user.email);
        if (duplicateCheck.hasDuplicate) {
          console.log('🔍 Duplicate profile detected during sign in:', duplicateCheck);
          // Return user - the auth state handler will manage the existing profile
          return user;
        }
        
        console.log('✅ AuthService: No duplicates found');
        
        // Check if user exists in Firestore with retry logic
        console.log('🔍 AuthService: Checking if user profile exists...');
        const userDoc = await withProfileRetry(async () => {
          return await this.getUserProfile(user.uid);
        }, { operation: 'get_user_profile_signin' });
        
        console.log('🔍 AuthService: Existing user profile:', userDoc);
        
        if (!userDoc) {
          // Create new user profile with retry logic
          console.log('🔍 AuthService: Creating new user profile...');
          await withProfileRetry(async () => {
            await this.createUserProfile(user);
          }, { operation: 'create_user_profile_signin' });
          console.log('✅ AuthService: New user profile created');
        } else {
          console.log('✅ AuthService: User profile already exists');
        }
        
        console.log('✅ AuthService: handleRedirectResult completed successfully');
        return user;
      }, { operation: 'handle_redirect_result' }, { maxRetries: 3 });
    } catch (error) {
      console.error('❌ AuthService.handleRedirectResult error:', error);
      const classification = this._handleError(error, 'handle redirect result');
      const errorMessage = ErrorClassifier.getErrorMessage(classification);
      throw new Error(errorMessage.message);
    }
  }

  // Store intended path before authentication redirect
  static storeIntendedPath() {
    try {
      const currentPath = window.location.pathname + window.location.search;
      // Don't store auth-related paths
      if (!currentPath.includes('/auth') && !currentPath.includes('/login')) {
        sessionStorage.setItem('auth_intended_path', currentPath);
      }
    } catch (error) {
      console.warn('Failed to store intended path:', error);
    }
  }

  // Get and clear stored intended path
  static getAndClearIntendedPath() {
    try {
      const intendedPath = sessionStorage.getItem('auth_intended_path');
      if (intendedPath) {
        sessionStorage.removeItem('auth_intended_path');
        return intendedPath;
      }
      return '/';
    } catch (error) {
      console.warn('Failed to get intended path:', error);
      return '/';
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
      await withRetry(async () => {
        await signOut(auth);
      }, { operation: 'sign_out' }, { maxRetries: 2 });
    } catch (error) {
      const classification = this._handleError(error, 'sign out');
      const errorMessage = ErrorClassifier.getErrorMessage(classification);
      throw new Error(errorMessage.message);
    }
  }

  // Get user profile from Firestore with enhanced error handling
  static async getUserProfile(uid) {
    try {
      if (!uid) {
        throw new Error('User ID is required');
      }
      
      await this._checkNetworkConnectivity();
      
      return await withFirestoreRetry(async () => {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          return { id: userDoc.id, ...userDoc.data() };
        }
        
        return null;
      }, { operation: 'get_user_profile' });
    } catch (error) {
      const classification = this._handleError(error, 'get user profile');
      const errorMessage = ErrorClassifier.getErrorMessage(classification);
      throw new Error(errorMessage.message);
    }
  }

  // Create user profile in Firestore with enhanced error handling and validation
  static async createUserProfile(user, additionalData = {}) {
    try {
      if (!user || !user.uid) {
        throw new Error('Valid user object is required');
      }
      
      // Validate email before creating profile
      if (!this.isValidEmail(user.email)) {
        throw new Error(ERROR_MESSAGES.INVALID_EMAIL_DOMAIN);
      }
      
      await this._checkNetworkConnectivity();
      
      // Check for duplicates before creating
      const duplicateCheck = await this.checkForDuplicateProfile(user.email);
      if (duplicateCheck.hasDuplicate) {
        throw new Error(`โปรไฟล์สำหรับอีเมล ${user.email} มีอยู่ในระบบแล้ว`);
      }
      
      return await withFirestoreRetry(async () => {
        const userDocRef = doc(db, 'users', user.uid);
        
        const userData = {
          uid: user.uid,
          email: user.email.toLowerCase().trim(),
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'user', // Default role
          status: 'incomplete', // Profile not yet completed
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...additionalData
        };
        
        await setDoc(userDocRef, userData);
        
        // Log profile creation for audit
        logError({
          type: 'profile_created',
          context: {
            uid: user.uid,
            email: user.email,
            component: 'AuthService'
          },
          severity: 'info'
        });
        
        return userData;
      }, { operation: 'create_user_profile' });
    } catch (error) {
      const classification = this._handleError(error, 'create user profile');
      const errorMessage = ErrorClassifier.getErrorMessage(classification);
      throw new Error(errorMessage.message);
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

  // Update user profile with enhanced error handling and validation
  static async updateUserProfile(uid, data) {
    try {
      if (!uid) {
        throw new Error('User ID is required');
      }
      
      if (!data || Object.keys(data).length === 0) {
        throw new Error('Update data is required');
      }
      
      // Validate profile data before update
      const validationResult = this.validateProfileData(data);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }
      
      await this._checkNetworkConnectivity();
      
      return await withFirestoreRetry(async () => {
        const userDocRef = doc(db, 'users', uid);
        const updateData = {
          ...data,
          updatedAt: serverTimestamp()
        };
        
        await setDoc(userDocRef, updateData, { merge: true });
        
        // Log profile update for audit
        logError({
          type: 'profile_updated',
          context: {
            uid,
            updatedFields: Object.keys(data),
            status: data.status,
            component: 'AuthService'
          },
          severity: 'info'
        });
        
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
      }, { operation: 'update_user_profile' });
    } catch (error) {
      const classification = this._handleError(error, 'update user profile');
      const errorMessage = ErrorClassifier.getErrorMessage(classification);
      throw new Error(errorMessage.message);
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

  // Refresh authentication token
  static async refreshToken(forceRefresh = false) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }
      
      console.log('🔄 Refreshing authentication token...');
      const token = await user.getIdToken(forceRefresh);
      console.log('✅ Token refreshed successfully');
      
      return token;
    } catch (error) {
      const classification = this._handleError(error, 'refresh token');
      const errorMessage = ErrorClassifier.getErrorMessage(classification);
      throw new Error(errorMessage.message);
    }
  }

  // Check if token is valid
  static async isTokenValid() {
    try {
      const user = auth.currentUser;
      if (!user) return false;
      
      const tokenResult = await user.getIdTokenResult();
      const expirationTime = new Date(tokenResult.expirationTime);
      const now = new Date();
      
      return expirationTime > now;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Get token expiration time
  static async getTokenExpirationTime() {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      
      const tokenResult = await user.getIdTokenResult();
      return new Date(tokenResult.expirationTime);
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  }

  // Expose error types for external use
  static getErrorTypes() {
    return ERROR_TYPES;
  }

  // Expose error messages for external use
  static getErrorMessages() {
    return ERROR_MESSAGES;
  }

  // Enhanced duplicate detection methods
  static async checkForDuplicateProfile(email, phoneNumber = null) {
    try {
      return await withRetry(async () => {
        return await DuplicateDetectionService.detectDuplicates(email, phoneNumber);
      }, { operation: 'check_duplicate_profile' }, { maxRetries: 2 });
    } catch (error) {
      const classification = this._handleError(error, 'check duplicate profile');
      const errorMessage = ErrorClassifier.getErrorMessage(classification);
      throw new Error(errorMessage.message);
    }
  }

  // Validate profile data before operations
  static validateProfileData(data) {
    const errors = [];
    const result = {
      isValid: true,
      errors: []
    };

    // Required fields validation
    if (data.firstName && (!data.firstName.trim() || data.firstName.length > 50)) {
      errors.push('ชื่อต้องมีความยาว 1-50 ตัวอักษร');
    }

    if (data.lastName && (!data.lastName.trim() || data.lastName.length > 50)) {
      errors.push('นามสกุลต้องมีความยาว 1-50 ตัวอักษร');
    }

    if (data.phoneNumber) {
      const phoneRegex = /^[0-9]{9,10}$/;
      const cleanPhone = data.phoneNumber.replace(/[-\s]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.push('เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก');
      }
    }

    if (data.department && (!data.department.value || !data.department.label)) {
      errors.push('กรุณาเลือกสังกัด');
    }

    if (data.userType && !['student', 'teacher', 'staff'].includes(data.userType)) {
      errors.push('ประเภทผู้ใช้ไม่ถูกต้อง');
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('อีเมลไม่ได้รับอนุญาตให้เข้าใช้งานระบบ');
    }

    result.isValid = errors.length === 0;
    result.errors = errors;

    return result;
  }

  // Get profile completion status
  static getProfileCompletionStatus(profile) {
    if (!profile) {
      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: ['ข้อมูลทั้งหมด']
      };
    }

    const requiredFields = [
      { key: 'firstName', label: 'ชื่อ' },
      { key: 'lastName', label: 'นามสกุล' },
      { key: 'phoneNumber', label: 'เบอร์โทรศัพท์' },
      { key: 'department', label: 'สังกัด' },
      { key: 'userType', label: 'ประเภทผู้ใช้' }
    ];

    const missingFields = [];
    let completedFields = 0;

    requiredFields.forEach(field => {
      if (profile[field.key] && 
          (typeof profile[field.key] === 'string' ? profile[field.key].trim() : profile[field.key])) {
        completedFields++;
      } else {
        missingFields.push(field.label);
      }
    });

    const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);
    const isComplete = completionPercentage === 100 && profile.status !== 'incomplete';

    return {
      isComplete,
      completionPercentage,
      missingFields,
      completedFields,
      totalFields: requiredFields.length
    };
  }

  // Enhanced logging and error reporting
  static async reportError(error, context = {}) {
    try {
      const classification = this._handleError(error, context.operation || 'unknown');
      
      // Enhanced error reporting with more context
      logError({
        type: 'auth_service_error_report',
        error,
        context: {
          ...context,
          component: 'AuthService',
          classification,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        },
        severity: classification.severity
      });

      return classification;
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      return null;
    }
  }
}

export default AuthService;