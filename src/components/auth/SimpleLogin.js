import React, { useState, useEffect } from 'react';
import { auth } from '../../config/firebase';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';

/**
 * Simple Login Component - Minimal implementation for debugging
 * ใช้สำหรับทดสอบ authentication โดยไม่มี complexity
 */
const SimpleLogin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 SimpleLogin: Setting up auth listener...');
    
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔍 SimpleLogin: Auth state changed:', user ? 'logged in' : 'logged out');
      if (user) {
        console.log('👤 User details:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      }
      setUser(user);
      setLoading(false);
    });

    // Check for redirect result on component mount
    const checkRedirectResult = async () => {
      try {
        console.log('🔍 SimpleLogin: Checking redirect result...');
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('✅ SimpleLogin: Redirect result found:', result.user.email);
        } else {
          console.log('ℹ️ SimpleLogin: No redirect result');
        }
      } catch (error) {
        console.error('❌ SimpleLogin: Redirect result error:', error);
        setError(error.message);
      }
    };

    checkRedirectResult();

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setError(null);
      console.log('🔍 SimpleLogin: Starting sign in...');
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('🔍 SimpleLogin: Calling signInWithRedirect...');
      await signInWithRedirect(auth, provider);
      console.log('🔍 SimpleLogin: signInWithRedirect called - should redirect now');
      
    } catch (error) {
      console.error('❌ SimpleLogin: Sign in error:', error);
      setError(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('🔍 SimpleLogin: Signing out...');
      await auth.signOut();
      console.log('✅ SimpleLogin: Signed out successfully');
    } catch (error) {
      console.error('❌ SimpleLogin: Sign out error:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Simple Login Test
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ทดสอบ Firebase Authentication
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {user ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-green-800 mb-2">เข้าสู่ระบบสำเร็จ!</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>UID:</strong> {user.uid}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {user.displayName}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            เข้าสู่ระบบด้วย Google (Simple Test)
          </button>
        )}

        <div className="text-center text-xs text-gray-500">
          <p>เปิด Developer Console (F12) เพื่อดู debug logs</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;