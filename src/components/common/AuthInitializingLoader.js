import React from 'react';

/**
 * Loading component shown while Firebase Auth is initializing
 * and checking for persisted authentication state
 */
const AuthInitializingLoader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        {/* Animated spinner */}
        <div className="relative mb-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-blue-600 rounded-full opacity-20 animate-pulse"></div>
          </div>
        </div>
        
        {/* Loading text */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          กำลังตรวจสอบสถานะการเข้าสู่ระบบ
        </h2>
        <p className="text-gray-600 text-sm">
          กรุณารอสักครู่...
        </p>
        
        {/* Progress dots animation */}
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default AuthInitializingLoader;
