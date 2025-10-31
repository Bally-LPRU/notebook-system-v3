import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/authService';
import DevelopmentService from '../services/developmentService';

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
          console.error('Error in dev auth:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
      
      initDevAuth();
      return () => {}; // No cleanup needed for dev mode
    }

    // Production mode - Firebase auth
    const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
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
      } catch (error) {
        console.error('Error in auth state change:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setError(null);
      setLoading(true);
      const user = await AuthService.signInWithGoogle();
      return user;
    } catch (error) {
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
    } catch (error) {
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
      setError(error.message);
      throw error;
    }
  };

  const needsProfileSetup = () => {
    return AuthService.needsProfileSetup(userProfile);
  };

  const clearError = () => {
    setError(null);
  };

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
    isIncomplete: userProfile?.status === 'incomplete'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;