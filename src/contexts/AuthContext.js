import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
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
  const [error, setError] = useState(null);
  const [errorState, setErrorState] = useState({
    hasError: false,
    classification: null,
    retryable: false,
    retryCount: 0
  });

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

  // Handle redirect result on app initialization
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        console.log('🔄 Checking for redirect result...');
        
        // Use AuthService to handle redirect result with full logic
        const result = await AuthService.handleRedirectResult();
        
        if (result) {
          console.log('✅ Redirect authentication handled by AuthService');
          
          // Navigate to intended path after successful authentication
          const intendedPath = AuthService.getAndClearIntendedPath();
          if (intendedPath && intendedPath !== '/') {
            window.history.replaceState(null, '', intendedPath);
          }
        }
      } catch (error) {
        console.error('❌ Redirect result error:', error);
        handleError(error, 'redirect_result');
      }
    };

    handleRedirectResult();
  }, []);

  // Auth state change handler with enhanced error handling
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔥 Auth state changed:', user ? 'logged in' : 'logged out');
      
      try {
        clearErrorState(); // Clear any previous errors
        
        if (user) {
          setUser(user);
          
          // Get user profile with retry logic
          await withProfileRetry(async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const profile = { id: userDoc.id, ...userDoc.data() };
              setUserProfile(profile);
              console.log('👤 User profile loaded:', profile);
            } else {
              // Create new user profile with retry logic
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
              console.log('👤 New user profile created:', userData);
            }
          }, { operation: 'load_user_profile' });
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        handleError(error, 'auth_state_change');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);



  const signIn = async () => {
    try {
      clearErrorState();
      console.log('🔐 Starting Google sign in with redirect...');
      
      // Use AuthService for consistent authentication logic
      return await AuthService.signInWithGoogle();
      
    } catch (error) {
      // Enhanced error handling
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/user-cancelled') {
        error.message = 'การเข้าสู่ระบบถูกยกเลิก';
      } else if (error.code === 'auth/network-request-failed') {
        error.message = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่';
      } else if (error.code === 'auth/operation-not-allowed') {
        error.message = 'การเข้าสู่ระบบด้วย Google ไม่ได้รับอนุญาต กรุณาติดต่อผู้ดูแลระบบ';
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

  const value = {
    user,
    userProfile,
    loading,
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