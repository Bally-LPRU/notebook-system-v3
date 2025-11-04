import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Simple login component for testing
const SimpleLogin = () => {
  const handleGoogleLogin = async () => {
    try {
      // Import Firebase dynamically to avoid circular dependency
      const { auth, googleProvider, db } = await import('./config/firebase');
      const { signInWithPopup } = await import('firebase/auth');
      const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
      
      console.log('Starting Google login...');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log('Login successful:', user);
      
      // Check if user profile exists in Firestore
      console.log('Checking user profile in Firestore...');
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log('Creating new user profile...');
        
        // Create user profile in Firestore
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'user', // Default role
          status: 'incomplete', // Profile not yet completed
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(userDocRef, userData);
        console.log('User profile created successfully');
        
        alert(`Login successful! New user created: ${user.email}\nPlease check Firestore for user data.`);
      } else {
        console.log('User profile already exists');
        const existingData = userDoc.data();
        console.log('Existing user data:', existingData);
        
        alert(`Login successful! Welcome back: ${user.email}\nRole: ${existingData.role || 'user'}`);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ทดสอบระบบเข้าสู่ระบบ
            </h2>
            
            <button
              onClick={handleGoogleLogin}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              เข้าสู่ระบบด้วย Google
            </button>
            
            <p className="mt-4 text-sm text-gray-600">
              นี่คือหน้าทดสอบเพื่อตรวจสอบการทำงานของระบบ login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<SimpleLogin />} />
      </Routes>
    </Router>
  );
}

export default App;