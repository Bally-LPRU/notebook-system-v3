import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthService from '../services/authService';
import DevelopmentService from '../services/developmentService';
import { logAuthError } from '../utils/errorLogger';

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
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Enhanced error state management
  const [errorHistory, setErrorHistory] = useState([]);
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY_BASE = 2000; // 2 seconds base delay

  // Enhanced error logging
  const logError = useCallback((error, context = '') => {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message || error,
      type: error.type || 'unknown',
      retryable: error.retryable || false
    };
    
    setErrorHistory(prev => [...prev.slice(-9), errorEntry]); // Keep last 10 errors
    console.error(`AuthContext Error (${context}):`, error);
    
    // Log to error logger with user context
    logAuthError(error, context, {
      uid: user?.uid,
      email: user?.email,
      userProfileStatus: userProfile?.status,
      userRole: userProfile?.role
    });
  }, [user, userProfile]);

  // Enhanced error recovery mechanism
  const handleErrorWithRecovery = useCallback(async (error, context, retryFunction) => {
    logError(error, context);
    
    // Check if error is retryable and we haven't exceeded max attempts
    const isRetryable = error.retryable !== false && retryCount < MAX_RETRY_ATTEMPTS;
    
    if (isRetryable && retryFunction) {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
      
      // Calculate delay with exponential backoff
      const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
      
      setTimeout(async () => {
        try {
          await retryFunction();
          setRetryCount(0); // Reset on success
          setError(null);
        } catch (retryError) {
          await handleErrorWithRecovery(retryError, `${context} (retry ${retryCount + 1})`, retryFunction);
        } finally {
          setIsRetrying(false);
        }
      }, delay);
    } else {
      setError(error.message || error);
      setRetryCount(0);
      setIsRetrying(false);
    }
  }, [retryCount, logError]);

  // Enhanced auth state handler with retry logic
  const handleAuthStateChange = useCallback(async (user) => {
    try {
      setError(null);
      if (user) {
        setUser(user);
        const profile = await AuthService.getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      const retryFunction = () => handleAuthStateChange(user);
      await handleErrorWithRecovery(error, 'auth state change', retryFunction);
    } finally {
      setLoading(false);
    }
  }, [handleErrorWithRecovery]);

  useEffect(() => {
    // Development mode - auto login
    if (DevelopmentService.isDevMode()) {
      const initDevAuth = async () => {
        try {
          setError(null);
          const devUser = await DevelopmentService.getCurrentUser();
          const devProfile = await DevelopmentService.getUserProfile(devUser.uid);
          
          setUser(devUser);
          setUserProfile(devProfile);
        } catch (error) {
          logError(error, 'dev auth initialization');
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
      
      initDevAuth();
      return () => {}; // No cleanup needed for dev mode
    }

    // Production mode - Firebase auth with enhanced error handling
    const unsubscribe = AuthService.onAuthStateChanged(handleAuthStateChange);

    return () => unsubscribe();
  }, [handleAuthStateChange, logError]);

  const signIn = async () => {
    try {
      setError(null);
      setLoading(true);
      setRetryCount(0);
      const user = await AuthService.signInWithGoogle();
      return user;
    } catch (error) {
      logError(error, 'sign in');
      
      // For sign-in errors, we generally don't auto-retry as they often require user action
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await AuthService.signOut();
      setRetryCount(0); // Reset retry count on successful sign out
    } catch (error) {
      logError(error, 'sign out');
      setError(error.message);
      throw error;
    }
  };

  const updateProfile = async (data) => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');
      
      const updatedProfile = await AuthService.updateUserProfile(user.uid, data);
      setUserProfile(prev => ({ ...prev, ...updatedProfile }));
      return updatedProfile;
    } catch (error) {
      logError(error, 'update profile');
      
      // For profile updates, we can implement retry logic
      const retryFunction = () => updateProfile(data);
      await handleErrorWithRecovery(error, 'update profile', retryFunction);
      throw error;
    }
  };

  const needsProfileSetup = () => {
    return AuthService.needsProfileSetup(userProfile);
  };

  const clearError = () => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  };

  // Manual retry function for user-initiated retries
  const retryLastOperation = useCallback(async () => {
    if (errorHistory.length === 0) return;
    
    const lastError = errorHistory[errorHistory.length - 1];
    if (!lastError.retryable) return;
    
    setIsRetrying(true);
    setError(null);
    
    try {
      // Based on the context, retry the appropriate operation
      if (lastError.context.includes('auth state change')) {
        await handleAuthStateChange(user);
      } else if (lastError.context.includes('sign in')) {
        // For sign-in retry, we'll just clear the error and let user try again manually
        setError('กรุณาลองเข้าสู่ระบบอีกครั้ง');
      } else if (lastError.context.includes('update profile')) {
        // This would need the original data, so we'll just clear the error
        setError('กรุณาลองอัปเดตโปรไฟล์อีกครั้ง');
      }
    } catch (error) {
      logError(error, `manual retry: ${lastError.context}`);
      setError(error.message);
    } finally {
      setIsRetrying(false);
    }
  }, [errorHistory, user, handleAuthStateChange, logError]);

  // Get error statistics for debugging
  const getErrorStats = useCallback(() => {
    return {
      totalErrors: errorHistory.length,
      recentErrors: errorHistory.slice(-5),
      retryCount,
      isRetrying
    };
  }, [errorHistory, retryCount, isRetrying]);

  const value = {
    user,
    userProfile,
    loading,
    error,
    signIn,
    signOut,
    updateProfile,
    clearError,
    needsProfileSetup,
    isAuthenticated: !!user,
    isApproved: userProfile?.status === 'approved',
    isAdmin: userProfile?.role === 'admin',
    isPending: userProfile?.status === 'pending',
    isIncomplete: userProfile?.status === 'incomplete',
    // Enhanced error management features
    isRetrying,
    retryCount,
    retryLastOperation,
    getErrorStats,
    errorHistory: errorHistory.slice(-5) // Only expose last 5 errors
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;