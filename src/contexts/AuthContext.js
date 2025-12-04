import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../config/firebase';
import { signOut, onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import DuplicateDetectionService from '../services/duplicateDetectionService';
import AuthService from '../services/authService';
import { ErrorClassifier } from '../utils/errorClassification';
import { withRetry, withProfileRetry } from '../utils/retryHandler';
import { logError } from '../utils/errorLogger';
import { AuthDebugger } from '../utils/authDebugger';

const VALID_DEPARTMENTS = new Set([
  'accounting',
  'digital-business',
  'business-admin',
  'management',
  'computer-business',
  'communication',
  'logistics',
  'tourism',
  'modern-business',
  'dean-office'
]);

const STATUS_TRANSITIONS = {
  incomplete: ['pending'],
  pending: ['approved', 'rejected'],
  approved: ['approved'],
  rejected: ['pending']
};

const isValidStatusTransition = (currentStatus = 'incomplete', nextStatus) => {
  if (!nextStatus || nextStatus === currentStatus) {
    return true;
  }

  const allowedTargets = STATUS_TRANSITIONS[currentStatus];
  if (!allowedTargets) {
    return false;
  }

  return allowedTargets.includes(nextStatus);
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [errorState, setErrorState] = useState({
    hasError: false,
    classification: null,
    retryable: false,
    retryCount: 0
  });
  
  // Ref to track token refresh attempts
  const tokenRefreshAttempts = useRef(0);
  const maxTokenRefreshAttempts = 3;
  const tokenRefreshInProgress = useRef(false);
  const lastTokenRefreshTime = useRef(0);

  // Enhanced error handling helper
  const handleError = (error, context = 'auth_context') => {
    console.error(`🚨 AuthContext Error (${context}):`, error);
    
    const classification = ErrorClassifier.classify(error, { 
      operation: context,
      component: 'AuthContext'
    });
    
    const errorMessage = ErrorClassifier.getErrorMessage(classification);
    
    setError(errorMessage.message);
    setErrorState({
      hasError: true,
      classification,
      retryable: classification.retryable,
      retryCount: 0
    });
    
    // Log error for monitoring
    logError({
      type: 'auth_context_error',
      error,
      context: { operation: context, component: 'AuthContext' },
      severity: classification.severity
    });
    
    return classification;
  };

  // Clear error state
  const clearErrorState = () => {
    setError(null);
    setErrorState({
      hasError: false,
      classification: null,
      retryable: false,
      retryCount: 0
    });
  };

  // Setup auth state listener
  useEffect(() => {
    let unsubscribe;
    let isInitialLoad = true;
    
    const initializeAuth = async () => {
      // Wait a moment for Firebase to restore session from localStorage
      console.log('🔥 Waiting for Firebase Auth to restore session...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🔥 Now setting up auth state listener...');
      console.log('🔍 Current auth.currentUser before listener:', auth.currentUser);
      
      unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔥 Auth state changed:', user ? 'logged in' : 'logged out');
      console.log('🔍 Is initial load:', isInitialLoad);
      console.log('🔍 User details:', user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      } : null);
      
      try {
        clearErrorState(); // Clear any previous errors
        
        if (user) {
          setUser(user);
          console.log('🔍 Setting user in state:', user.uid);
          
          // Get user profile with retry logic
          await withProfileRetry(async () => {
            console.log('🔍 Looking for user profile in Firestore...');
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            console.log('🔍 Firestore document exists:', userDoc.exists());
            
            if (userDoc.exists()) {
              const profile = { id: userDoc.id, ...userDoc.data() };
              setUserProfile(profile);
              console.log('👤 User profile loaded from Firestore:', profile);
            } else {
              // Create new user profile with retry logic
              console.log('🔍 Creating new user profile in Firestore...');
              const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: 'user',
                status: 'incomplete',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              
              await setDoc(userDocRef, userData);
              setUserProfile(userData);
              console.log('👤 New user profile created in Firestore:', userData);
            }
          }, { operation: 'load_user_profile' });
        } else {
          console.log('🔍 No user, clearing state');
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error);
        handleError(error, 'auth_state_change');
      } finally {
        // Mark auth as initialized after first state change
        if (isInitialLoad) {
          setAuthInitialized(true);
          console.log('✅ Auth initialization complete');
          isInitialLoad = false;
        }
        setLoading(false);
        console.log('🔍 Auth loading set to false');
      }
    }, (error) => {
      // Error callback for onAuthStateChanged
      console.error('❌ Auth state listener error:', error);
      handleError(error, 'auth_state_listener');
      if (isInitialLoad) {
        setAuthInitialized(true);
        isInitialLoad = false;
      }
        setLoading(false);
      });
    };
    
    // Start initialization
    initializeAuth();

    return () => {
      console.log('🔥 Cleaning up auth state listener');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Token refresh and expiration handler with debounce
  useEffect(() => {
    console.log('🔥 Setting up token refresh listener...');
    
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        // Prevent multiple simultaneous refreshes
        if (tokenRefreshInProgress.current) {
          console.log('⏭️ Token refresh already in progress, skipping...');
          return;
        }

        // Debounce: Don't refresh if we just refreshed less than 30 seconds ago
        const now = Date.now();
        const timeSinceLastRefresh = now - lastTokenRefreshTime.current;
        if (timeSinceLastRefresh < 30000) {
          console.log('⏭️ Token refreshed recently, skipping...');
          return;
        }

        try {
          tokenRefreshInProgress.current = true;
          console.log('🔄 Token changed, checking validity...');
          
          // Check if token is still valid before refreshing
          const tokenResult = await user.getIdTokenResult(false); // Don't force refresh yet
          const expirationTime = new Date(tokenResult.expirationTime);
          const timeUntilExpiry = expirationTime - now;
          
          console.log('🔍 Token expiration:', {
            expiresAt: expirationTime.toISOString(),
            timeUntilExpiry: `${Math.floor(timeUntilExpiry / 1000 / 60)} minutes`
          });
          
          // Only refresh if token is about to expire (less than 5 minutes)
          if (timeUntilExpiry < 5 * 60 * 1000) {
            console.log('⚠️ Token expiring soon, refreshing...');
            await user.getIdToken(true);
            lastTokenRefreshTime.current = Date.now();
            console.log('✅ Token refreshed successfully');
          } else {
            console.log('✅ Token still valid, no refresh needed');
          }
          
          // Reset refresh attempts on successful check
          tokenRefreshAttempts.current = 0;
          
        } catch (error) {
          console.error('❌ Token refresh error:', error);
          tokenRefreshAttempts.current++;
          
          // If we've exceeded max refresh attempts, sign out the user
          if (tokenRefreshAttempts.current >= maxTokenRefreshAttempts) {
            console.error('❌ Max token refresh attempts exceeded, signing out...');
            
            setError('เซสชันของคุณหมดอายุ กรุณาเข้าสู่ระบบใหม่');
            
            // Sign out user
            try {
              await signOut(auth);
            } catch (signOutError) {
              console.error('❌ Error signing out after token refresh failure:', signOutError);
            }
          } else {
            // Log error but don't sign out yet
            handleError(error, 'token_refresh');
          }
        } finally {
          tokenRefreshInProgress.current = false;
        }
      }
    });
    
    return () => {
      console.log('🔥 Cleaning up token refresh listener');
      unsubscribe();
    };
  }, []);



  const signIn = async () => {
    try {
      clearErrorState();
      console.log('🔐 Starting Google sign in with redirect...');
      console.log('🔍 Current auth state:', auth.currentUser);
      console.log('🔍 Auth domain:', auth.config.authDomain);
      
      // Use AuthService for consistent authentication logic
      const result = await AuthService.signInWithGoogle();
      console.log('🔍 AuthService.signInWithGoogle result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ SignIn error in AuthContext:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Enhanced error handling
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/user-cancelled') {
        error.message = 'การเข้าสู่ระบบถูกยกเลิก';
      } else if (error.code === 'auth/network-request-failed') {
        error.message = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่';
      } else if (error.code === 'auth/operation-not-allowed') {
        error.message = 'การเข้าสู่ระบบด้วย Google ไม่ได้รับอนุญาต กรุณาติดต่อผู้ดูแลระบบ';
      } else if (error.code === 'auth/unauthorized-domain') {
        error.message = 'โดเมนนี้ไม่ได้รับอนุญาตให้ใช้งาน Firebase Authentication';
      }
      
      // Log failed auth attempt
      AuthDebugger.logAuthAttempt('google_signin', false, error);
      
      handleError(error, 'sign_in');
      throw error;
    }
  };







  const handleSignOut = async () => {
    try {
      clearErrorState();
      console.log('🚪 Signing out...');
      
      await withRetry(async () => {
        await signOut(auth);
      }, { operation: 'sign_out' }, { maxRetries: 2 });
      
      console.log('✅ Sign out successful');
    } catch (error) {
      handleError(error, 'sign_out');
      throw error;
    }
  };

  const updateProfile = async (data) => {
    try {
      clearErrorState();
      
      // Get current user from auth (more reliable than state)
      const currentUser = auth.currentUser;
      console.log('📝 Updating profile - current user:', currentUser?.uid);
      console.log('📝 Update data:', data);
      
      if (!currentUser) {
        console.error('❌ No user logged in');
        throw new Error('กรุณาเข้าสู่ระบบก่อนอัปเดตโปรไฟล์');
      }

      if ('firstName' in data && (!data.firstName || !data.firstName.trim())) {
        throw new Error('ชื่อต้องมีความยาว 1-50 ตัวอักษร');
      }

      if ('lastName' in data && (!data.lastName || !data.lastName.trim())) {
        throw new Error('นามสกุลต้องมีความยาว 1-50 ตัวอักษร');
      }

      if ('department' in data) {
        const departmentValue = data.department;
        if (!departmentValue || !departmentValue.value || !departmentValue.label) {
          throw new Error('กรุณาเลือกสังกัด');
        }

        if (!VALID_DEPARTMENTS.has(departmentValue.value)) {
          throw new Error('สังกัดที่เลือกไม่ถูกต้อง');
        }
      }

      const validationResult = AuthService.validateProfileData(data);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors[0] || 'ข้อมูลโปรไฟล์ไม่ถูกต้อง');
      }

      if (typeof data.status !== 'undefined') {
        const currentStatus = userProfile?.status || 'incomplete';
        if (!isValidStatusTransition(currentStatus, data.status)) {
          throw new Error('Invalid status transition');
        }
      }
      
      return await withProfileRetry(async () => {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Prepare update data
        const updateData = {
          ...data,
          updatedAt: serverTimestamp()
        };
        
        console.log('📝 Saving to Firestore:', {
          uid: currentUser.uid,
          data: updateData
        });
        
        // Update Firestore
        await setDoc(userDocRef, updateData, { merge: true });
        
        // Update local state
        setUserProfile(prev => ({ ...prev, ...updateData }));
        
        console.log('✅ Profile updated successfully');
        
        // Verify the update
        const updatedDoc = await getDoc(userDocRef);
        if (updatedDoc.exists()) {
          const verifiedData = updatedDoc.data();
          console.log('✅ Verified profile data:', verifiedData);
          setUserProfile({ id: updatedDoc.id, ...verifiedData });
        }
        
        return updateData;
      }, { operation: 'update_profile' });
    } catch (error) {
      console.error('❌ Profile update error:', error);
      handleError(error, 'update_profile');
      throw error;
    }
  };

  // Retry failed operations
  const retryLastOperation = async () => {
    if (!errorState.retryable || !errorState.classification) {
      throw new Error('Operation is not retryable');
    }

    try {
      setErrorState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1
      }));

      // The specific retry logic would depend on the last failed operation
      // For now, we'll clear the error and let the user try again
      clearErrorState();
      
      console.log('🔄 Retry operation initiated');
    } catch (error) {
      handleError(error, 'retry_operation');
      throw error;
    }
  };

  const needsProfileSetup = () => {
    if (!userProfile) return true;
    
    // If user is already approved, don't require profile setup
    // This is especially important for admin users
    if (userProfile.status === 'approved') return false;
    
    // If user is pending or rejected, don't require profile setup
    // They should see the status page instead
    if (userProfile.status === 'pending' || userProfile.status === 'rejected') return false;
    
    // Only require profile setup if status is incomplete or missing required fields
    return (
      userProfile.status === 'incomplete' ||
      !userProfile.firstName ||
      !userProfile.lastName ||
      !userProfile.phoneNumber ||
      !userProfile.department ||
      !userProfile.userType
    );
  };

  const clearError = () => {
    clearErrorState();
  };

  const checkProfileExists = async (email) => {
    try {
      return await withRetry(async () => {
        return await DuplicateDetectionService.checkProfileByEmail(email);
      }, { operation: 'check_profile_exists' }, { maxRetries: 2 });
    } catch (error) {
      handleError(error, 'check_profile_exists');
      return null;
    }
  };

  const getDashboardRoute = () => {
    if (!userProfile) return '/';
    return DuplicateDetectionService.getDashboardRoute(userProfile);
  };

  const getStatusDisplayInfo = () => {
    return DuplicateDetectionService.getStatusDisplayInfo(userProfile);
  };

  // Manually refresh authentication token
  const refreshToken = async () => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }
      
      console.log('🔄 Manually refreshing token...');
      const token = await user.getIdToken(true);
      console.log('✅ Token manually refreshed');
      
      return token;
    } catch (error) {
      console.error('❌ Manual token refresh error:', error);
      handleError(error, 'manual_token_refresh');
      throw error;
    }
  };

  // Check if token is valid and not expired
  const isTokenValid = async () => {
    try {
      if (!user) return false;
      
      const tokenResult = await user.getIdTokenResult();
      const expirationTime = new Date(tokenResult.expirationTime);
      const now = new Date();
      
      return expirationTime > now;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return false;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    authInitialized,
    error,
    errorState,
    signIn,
    signOut: handleSignOut,
    login: signIn,
    logout: handleSignOut,
    updateProfile,
    clearError,
    retryLastOperation,
    needsProfileSetup,
    checkProfileExists,
    getDashboardRoute,
    getStatusDisplayInfo,
    refreshToken,
    isTokenValid,
    isAuthenticated: !!user,
    isApproved: userProfile?.status === 'approved',
    isAdmin: userProfile?.role === 'admin',
    isPending: userProfile?.status === 'pending',
    isIncomplete: userProfile?.status === 'incomplete',
    // Enhanced error handling properties
    hasRetryableError: errorState.retryable,
    canRetry: errorState.retryable && errorState.retryCount < 3,
    errorClassification: errorState.classification
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;