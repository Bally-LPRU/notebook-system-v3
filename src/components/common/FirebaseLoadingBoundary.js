import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';

const FirebaseLoadingBoundary = ({ children, onRetry }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  const isRecoverableError = (error) => {
    const errorMessage = error?.message?.toLowerCase() || '';
    
    // Network errors are recoverable
    if (errorMessage.includes('network') || 
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection')) {
      return true;
    }
    
    // Firebase initialization errors are recoverable
    if (errorMessage.includes('firebase') && 
        errorMessage.includes('initialization')) {
      return true;
    }
    
    // Configuration errors are not recoverable
    if (errorMessage.includes('configuration') ||
        errorMessage.includes('environment variables')) {
      return false;
    }
    
    return true;
  };

  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      return;
    }
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Add a small delay to show the retry state
    setTimeout(() => {
      setIsRetrying(false);
    }, 500);
    
    if (onRetry) {
      onRetry(retryCount + 1);
    }
  }, [retryCount, maxRetries, onRetry]);

  useEffect(() => {
    // Simulate Firebase initialization check
    const checkFirebaseStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if Firebase services are available
        const { getServiceStatus } = await import('../../config/firebase');
        const serviceStatus = getServiceStatus();
        
        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if core services are available
        if (!serviceStatus.auth || !serviceStatus.firestore) {
          throw new Error('Core Firebase services are not available');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Firebase initialization check failed:', err);
        setError(err);
        setIsLoading(false);
        
        // Auto-retry for recoverable errors
        if (retryCount < maxRetries && isRecoverableError(err)) {
          setTimeout(() => {
            handleRetry();
          }, retryDelay * (retryCount + 1)); // Exponential backoff
        }
      }
    };

    checkFirebaseStatus();
  }, [retryCount, handleRetry, maxRetries, retryDelay]);

  const handleManualRetry = () => {
    setRetryCount(0);
    handleRetry();
  };

  if (isLoading || isRetrying) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto mb-6">
                <LoadingSpinner size="xl" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {isRetrying ? 'กำลังลองใหม่...' : 'กำลังเตรียมระบบ...'}
              </h2>
              
              <p className="text-gray-600 mb-4">
                {isRetrying 
                  ? `กำลังลองเชื่อมต่อใหม่ (ครั้งที่ ${retryCount + 1}/${maxRetries})`
                  : 'กรุณารอสักครู่ ระบบกำลังเตรียมความพร้อม'
                }
              </p>

              {isRetrying && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((retryCount + 1) / maxRetries) * 100}%` }}
                  ></div>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isRecoverable = isRecoverableError(error);
    
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mx-auto h-16 w-16 text-red-500 mb-6 flex items-center justify-center">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ไม่สามารถเชื่อมต่อระบบได้
              </h2>
              
              <p className="text-gray-600 mb-4">
                เกิดข้อผิดพลาดในการเตรียมระบบ
              </p>

              <p className="text-sm text-gray-500 mb-6">
                {error.message}
              </p>

              {retryCount >= maxRetries && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        ระบบได้ลองเชื่อมต่อใหม่ {maxRetries} ครั้งแล้ว กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือติดต่อผู้ดูแลระบบ
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {isRecoverable && retryCount < maxRetries && (
                  <button
                    onClick={handleManualRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    ลองใหม่
                  </button>
                )}
                
                <button
                  onClick={() => window.location.reload()}
                  className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isRecoverable && retryCount < maxRetries
                      ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50' 
                      : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  รีโหลดหน้า
                </button>
              </div>

              <div className="mt-6 text-sm text-gray-500">
                <p>
                  หากปัญหายังคงเกิดขึ้น กรุณาติดต่อผู้ดูแลระบบ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default FirebaseLoadingBoundary;