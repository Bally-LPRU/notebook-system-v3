import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Auth state change handler
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔥 Auth state changed:', user ? 'logged in' : 'logged out');
      
      try {
        if (user) {
          setUser(user);
          
          // Get user profile
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const profile = { id: userDoc.id, ...userDoc.data() };
            setUserProfile(profile);
            console.log('👤 User profile loaded:', profile);
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
            console.log('👤 New user profile created:', userData);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('🚨 Auth state error:', error);
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
      console.log('🔐 Starting Google sign in...');
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log('✅ Sign in successful:', user.email);
      
      // Validate email domain
      const allowedDomains = ['gmail.com', 'g.lpru.ac.th'];
      const userDomain = user.email.split('@')[1];
      
      if (!allowedDomains.includes(userDomain)) {
        await signOut(auth);
        throw new Error('อีเมลของคุณไม่ได้รับอนุญาตให้เข้าใช้งานระบบ กรุณาใช้อีเมล @gmail.com หรือ @g.lpru.ac.th');
      }
      
      return user;
    } catch (error) {
      console.error('🚨 Sign in error:', error);
      setError(error.message);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      console.log('🚪 Signing out...');
      await signOut(auth);
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('🚨 Sign out error:', error);
      setError(error.message);
      throw error;
    }
  };

  const updateProfile = async (data) => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');
      
      console.log('📝 Updating profile:', data);
      
      const userDocRef = doc(db, 'users', user.uid);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userDocRef, updateData, { merge: true });
      setUserProfile(prev => ({ ...prev, ...updateData }));
      
      console.log('✅ Profile updated successfully');
      return updateData;
    } catch (error) {
      console.error('🚨 Profile update error:', error);
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
  };

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
    isIncomplete: userProfile?.status === 'incomplete'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;