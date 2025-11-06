import React, { useState, useEffect } from 'react';
import { auth } from '../../config/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * Popup Login Component - แก้ไขปัญหาป๊อปอัพให้ทำงานได้
 */
const PopupLogin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    console.log('🔍 PopupLogin: Setting up auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 PopupLogin: Auth state changed:', user ? 'logged in' : 'logged out');
      
      if (user) {
        console.log('👤 User details:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
        
        // Create user profile in Firestore if not exists
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            console.log('🔍 Creating user profile in Firestore...');
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
            console.log('✅ User profile created in Firestore');
          } else {
            console.log('✅ User profile already exists in Firestore');
          }
        } catch (error) {
          console.error('❌ Error creating user profile:', error);
        }
      }
      
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setError(null);
      setIsSigningIn(true);
      console.log('🔍 PopupLogin: Starting popup sign in...');
      
      // Create provider
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('🔍 PopupLogin: Calling signInWithPopup...');
      
      // Try popup authentication with user interaction
      const result = await signInWithPopup(auth, provider);
      console.log('✅ PopupLogin: Popup sign in successful:', result.user.email);
      
      // Validate email domain
      const allowedDomains = ['gmail.com', 'g.lpru.ac.th'];
      const userDomain = result.user.email.split('@')[1];
      
      if (!allowedDomains.includes(userDomain)) {
        await auth.signOut();
        throw new Error('อีเมลของคุณไม่ได้รับอนุญาตให้เข้าใช้งานระบบ กรุณาใช้อีเมล @gmail.com หรือ @g.lpru.ac.th');
      }
      
      console.log('✅ PopupLogin: Email domain valid');
      
    } catch (error) {
      console.error('❌ PopupLogin: Sign in error:', error);
      
      let errorMessage = error.message;
      
      // Handle specific popup errors
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'เบราว์เซอร์บล็อกป๊อปอัพ กรุณาอนุญาตป๊อปอัพสำหรับเว็บไซต์นี้และลองใหม่';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'หน้าต่างการเข้าสู่ระบบถูกปิด กรุณาลองใหม่';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'การเข้าสู่ระบบถูกยกเลิก';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'โดเมนนี้ไม่ได้รับอนุญาตใน Firebase Console กรุณาติดต่อผู้ดูแลระบบ';
      }
      
      setError(errorMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('🔍 PopupLogin: Signing out...');
      await auth.signOut();
      console.log('✅ PopupLogin: Signed out successfully');
    } catch (error) {
      console.error('❌ PopupLogin: Sign out error:', error);
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
            Popup Login Test
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ทดสอบ Firebase Authentication ด้วย Popup
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
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
          <div className="space-y-4">
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningIn ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  กำลังเข้าสู่ระบบ...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  เข้าสู่ระบบด้วย Google (Popup)
                </div>
              )}
            </button>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-2">หากป๊อปอัพถูกบล็อก:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>คลิกที่ไอคอนป๊อปอัพในแถบที่อยู่ของเบราว์เซอร์</li>
                  <li>เลือก "อนุญาตป๊อปอัพสำหรับไซต์นี้"</li>
                  <li>รีเฟรชหน้าเว็บและลองใหม่</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-500">
          <p>เปิด Developer Console (F12) เพื่อดู debug logs</p>
        </div>
      </div>
    </div>
  );
};

export default PopupLogin;