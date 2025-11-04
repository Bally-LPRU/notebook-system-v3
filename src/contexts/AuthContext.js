import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, googleProvider, db } from '../config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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

  // Simple error logging
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
  }, []);

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

  // Simple auth state handler
  const handleAuthStateChange = useCallback(async (user) => {
    try {
      setError(null);
      if (user) {
        setUser(user);
        // Get user profile from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserProfile({ id: userDoc.id, ...userDoc.data() });
        } else {
          // Create new user profile
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
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setRetryCount(0);
    } catch (error) {
      logError(error, 'auth state change');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [logError]);

  useEffect(() => {
    // Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
    return () => unsubscribe();
  }, [handleAuthStateChange]);

  const signIn = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Validate email domain
      const allowedDomains = ['gmail.com', 'g.lpru.ac.th'];
      const userDomain = user.email.split('@')[1];
      
      if (!allowedDomains.includes(userDomain)) {
        await signOut(auth);
        throw new Error('อีเมลของคุณไม่ได้รับอนุญาตให้เข้าใช้งานระบบ กรุณาใช้อีเมล @gmail.com หรือ @g.lpru.ac.th');
      }
      
      return user;
    } catch (error) {
      logError(error, 'sign in');
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      await signOut(auth);
      setRetryCount(0);
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
      
      const userDocRef = doc(db, 'users', user.uid);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userDocRef, updateData, { merge: true });
      setUserProfile(prev => ({ ...prev, ...updateData }));
      return updateData;
    } catch (error) {
      logError(error, 'update profile');
      setError(error.message);
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
    signOut: handleSignOut,
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