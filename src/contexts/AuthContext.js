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

  // Combined effect: Handle redirect result FIRST, then setup auth state listener
  useEffect(() => {
    let unsubscribe;
    let isInitialLoad = true;
    
    const initializeAuth = async () => {
      try {
        // STEP 1: Handle redirect result FIRST before setting up listener
        console.log('🔄 Step 1: Checking for redirect result...');
        console.log('🔍 Current URL:', window.location.href);
        console.log('🔍 URL params:', new URLSearchParams(window.location.search).toString());
        
        // Use AuthService to handle redirect result with full logic
        const result = await AuthService.handleRedirectResult();
        
        console.log('🔍 AuthService.handleRedirectResult returned:', result);
        
        if (result) {
          console.log('✅ Redirect authentication handled by AuthService');
          console.log('👤 User from redirect:', result);
          
          // Navigate to intended path after successful authentication
          const intendedPath = AuthService.getAndClearIntendedPath();
          console.log('🔍 Intended path:', intendedPath);
          if (intendedPath && intendedPath !== '/') {
            window.history.replaceState(null, '', intendedPath);
          }
        } else {
          console.log('ℹ️ No redirect result found');
        }
      } catch (error) {
        console.error('❌ Redirect result error:', error);
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        handleError(error, 'redirect_result');
      }
      
      // STEP 2: Wait a moment for Firebase to restore session, then setup listener
      console.log('🔥 Step 2: Waiting for Firebase Auth to restore session...');
      
      // Small delay to let Firebase Auth restore the session from localStorage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🔥 Step 2: Now setting up auth state listener...');
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

  // Token refresh and expiration handler
  useEffect(() => {
    console.log('🔥 Setting up token refresh listener...');
    
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          console.log('🔄 Token changed, refreshing...');
          
          // Get fresh token to ensure it's valid
          await user.getIdToken(true);
          console.log('✅ Token refreshed successfully');
          
          // Reset refresh attempts on successful refresh
          tokenRefreshAttempts.current = 0;
          
          // Verify token hasn't expired
          const tokenResult = await user.getIdTokenResult();
          const expirationTime = new Date(tokenResult.expirationTime);
          const now = new Date();
          const timeUntilExpiry = expirationTime - now;
          
          console.log('🔍 Token expiration:', {
            expiresAt: expirationTime.toISOString(),
            timeUntilExpiry: `${Math.floor(timeUntilExpiry / 1000 / 60)} minutes`
          });
          
          // If token is about to expire (less than 5 minutes), refresh it proactively
          if (timeUntilExpiry < 5 * 60 * 1000) {
            console.log('⚠️ Token expiring soon, refreshing proactively...');
            await user.getIdToken(true);
            console.log('✅ Proactive token refresh complete');
          }
          
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
      if (!user) throw new Error('No user logged in');
      
      console.log('📝 Updating profile:', data);
      
      return await withProfileRetry(async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const updateData = {
          ...data,
          updatedAt: serverTimestamp()
        };
        
        await setDoc(userDocRef, updateData, { merge: true });
        setUserProfile(prev => ({ ...prev, ...updateData }));
        
        console.log('✅ Profile updated successfully');
        return updateData;
      }, { operation: 'update_profile' });
    } catch (error) {
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