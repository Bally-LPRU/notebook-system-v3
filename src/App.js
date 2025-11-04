import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from './config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔥 Setting up auth listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('👤 Auth state changed:', user ? 'logged in' : 'logged out');
      setUser(user);
      setLoading(false);
    }, (error) => {
      console.error('🚨 Auth state error:', error);
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setError(null);
      console.log('🔐 Starting login...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Login successful:', result.user.email);
    } catch (error) {
      console.error('🚨 Login failed:', error);
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...');
      await signOut(auth);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('🚨 Logout failed:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังเตรียมระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">
            Equipment Lending System
          </h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {user ? (
            <div className="text-center">
              <div className="mb-4">
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full mx-auto mb-2"
                />
                <h2 className="text-lg font-semibold">{user.displayName}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                กรุณาเข้าสู่ระบบเพื่อใช้งาน
              </p>
              
              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                เข้าสู่ระบบด้วย Google
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;