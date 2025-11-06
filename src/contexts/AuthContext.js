import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../config/firebase';
import { signInWithRedirect as firebaseSignInWithRedirect, signInWithPopup, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import DuplicateDetectionService from '../services/duplicateDetectionService';
import { ErrorClassifier } from '../utils/errorClassification';
import { withRetry, withProfileRetry } from '../utils/retryHandler';
import { logError } from '../utils/errorLogger';
import { AuthDebugger } from '../utils/authDebugger';
import PopupBlockingDetector from '../utils/popupBlockingDetector';

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
        const result = await getRedirectResult(auth);
        
        if (result) {
          console.log('✅ Redirect authentication successful:', result.user.email);
          
          // Validate email domain
          const allowedDomains = ['gmail.com', 'g.lpru.ac.th'];
          const userDomain = result.user.email.split('@')[1];
          
          if (!allowedDomains.includes(userDomain)) {
            await signOut(auth);
            throw new Error('อีเมลของคุณไม่ได้รับอนุญาตให้เข้าใช้งานระบบ กรุณาใช้อีเมล @gmail.com หรือ @g.lpru.ac.th');
          }

          // Check for duplicate profiles
          const duplicateCheck = await DuplicateDetectionService.detectDuplicates(result.user.email);
          if (duplicateCheck.hasDuplicate) {
            console.log('🔍 Duplicate profile detected during redirect:', duplicateCheck);
          }
          
          // Navigate to intended path after successful authentication
          const intendedPath = getAndClearIntendedPath();
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

  // Store intended path before authentication redirect
  const storeIntendedPath = () => {
    try {
      const currentPath = window.location.pathname + window.location.search;
      // Don't store auth-related paths
      if (!currentPath.includes('/auth') && !currentPath.includes('/login')) {
        sessionStorage.setItem('auth_intended_path', currentPath);
      }
    } catch (error) {
      console.warn('Failed to store intended path:', error);
    }
  };

  // Get and clear stored intended path
  const getAndClearIntendedPath = () => {
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
  };

  const signIn = async (forceRedirect = false) => {
    try {
      clearErrorState();
      console.log('🔐 Starting Google sign in...');
      
      // Configure Google provider with additional parameters
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        hd: 'g.lpru.ac.th' // Prefer institutional domain
      });
      
      // If forced to use redirect, skip popup detection
      if (forceRedirect) {
        return await signInWithRedirect();
      }

      // Try popup with fallback to redirect
      return await signInWithPopupFallback();
      
    } catch (error) {
      // Enhanced error handling
      if (error.code === 'auth/cancelled-popup-request') {
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

  // Popup authentication with fallback
  const signInWithPopupFallback = async () => {
    try {
      // First, detect if popups are likely to be blocked
      const blockingDetection = await PopupBlockingDetector.detectPopupBlocking();
      
      if (blockingDetection.isBlocked && blockingDetection.confidence > 70) {
        console.log('🚫 Popup blocking detected, using redirect method');
        return await signInWithRedirect();
      }

      // Try popup authentication
      console.log('🔐 Attempting popup authentication...');
      AuthDebugger.logAuthAttempt('google_signin_popup', false);
      
      const result = await withRetry(async () => {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        console.log('✅ Popup sign in successful:', user.email);
        
        // Validate email domain
        const allowedDomains = ['gmail.com', 'g.lpru.ac.th'];
        const userDomain = user.email.split('@')[1];
        
        if (!allowedDomains.includes(userDomain)) {
          await signOut(auth);
          throw new Error('อีเมลของคุณไม่ได้รับอนุญาตให้เข้าใช้งานระบบ กรุณาใช้อีเมล @gmail.com หรือ @g.lpru.ac.th');
        }

        // Check for duplicate profiles before proceeding
        const duplicateCheck = await DuplicateDetectionService.detectDuplicates(user.email);
        if (duplicateCheck.hasDuplicate) {
          console.log('🔍 Duplicate profile detected during popup sign in:', duplicateCheck);
        }
        
        return user;
      }, { operation: 'google_sign_in_popup' }, { maxRetries: 1 });
      
      AuthDebugger.logAuthAttempt('google_signin_popup', true);
      return result;
      
    } catch (error) {
      // Check if error is popup-related
      if (isPopupBlockedError(error)) {
        console.log('🔄 Popup blocked, falling back to redirect method');
        return await signInWithRedirect();
      }
      
      throw error;
    }
  };

  // Redirect authentication
  const signInWithRedirect = async () => {
    try {
      console.log('🔐 Using redirect authentication...');
      AuthDebugger.logAuthAttempt('google_signin_redirect', false);
      
      // Store current path for redirect back after authentication
      storeIntendedPath();
      
      await withRetry(async () => {
        await firebaseSignInWithRedirect(auth, googleProvider);
        // Note: This method doesn't return immediately - the page will redirect
      }, { operation: 'google_sign_in_redirect' }, { maxRetries: 2 });
      
      AuthDebugger.logAuthAttempt('google_signin_redirect', true);
      
    } catch (error) {
      throw error;
    }
  };

  // Check if error is related to popup blocking
  const isPopupBlockedError = (error) => {
    const popupBlockedCodes = [
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request'
    ];
    
    const popupBlockedMessages = [
      'popup',
      'blocked',
      'closed'
    ];
    
    return popupBlockedCodes.includes(error.code) ||
           popupBlockedMessages.some(msg => 
             error.message.toLowerCase().includes(msg)
           );
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