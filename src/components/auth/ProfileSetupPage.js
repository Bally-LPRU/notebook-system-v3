import React, { useState, useCallback } from 'react';
import EnhancedProfileSetupForm from './EnhancedProfileSetupForm';
import EnhancedErrorBoundary from '../common/EnhancedErrorBoundary';
import NetworkStatusMonitor from '../common/NetworkStatusMonitor';
import { useProfileErrorHandling } from '../../hooks/useEnhancedErrorHandling';

const ProfileSetupPage = () => {
  const [formData, setFormData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced error handling for profile operations
  const {
    error: profileError,
    isRetrying,
    canRetry,
    retry: retryProfileOperation,
    clearError,
    errorMessage,
    classification
  } = useProfileErrorHandling({
    component: 'ProfileSetupPage',
    operation: 'profile_setup',
    maxRetries: 3,
    onError: (error, classification) => {
      console.error('Profile setup error:', error, classification);
    },
    onRetry: (attempt, type) => {
      console.log(`Profile setup retry attempt ${attempt} (${type})`);
      setRetryCount(attempt);
    },
    onSuccess: (result) => {
      console.log('Profile setup successful:', result);
      clearError();
    }
  });

  // Handle form data preservation during errors
  const handleDataPreservation = useCallback((data) => {
    setFormData(data);
  }, []);

  // Handle data restoration after error recovery
  const handleDataRestore = useCallback((preservedData) => {
    if (preservedData && typeof preservedData === 'object') {
      setFormData(preservedData);
    }
  }, []);

  // Handle error boundary retry
  const handleErrorBoundaryRetry = useCallback((retryAttempt, retryType) => {
    setRetryCount(retryAttempt);
    
    // Clear any profile errors when error boundary retries
    if (profileError) {
      clearError();
    }
  }, [profileError, clearError]);

  // Handle network status changes
  const handleNetworkStatusChange = useCallback((isOnline) => {
    if (isOnline && profileError && canRetry) {
      // Auto-retry when network comes back online
      setTimeout(() => {
        retryProfileOperation();
      }, 1000);
    }
  }, [profileError, canRetry, retryProfileOperation]);

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="skip-link focus-visible-enhanced"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>
      
      {/* Network Status Monitor */}
      <NetworkStatusMonitor 
        onStatusChange={handleNetworkStatusChange}
        showNotifications={true}
      />
      
      {/* Enhanced Error Boundary with retry functionality */}
      <EnhancedErrorBoundary
        componentName="ProfileSetupPage"
        operation="profile_setup_page"
        formData={formData}
        onDataRestore={handleDataRestore}
        onRetry={handleErrorBoundaryRetry}
        onError={(error, errorInfo, classification) => {
          console.error('ProfileSetupPage Error Boundary:', {
            error,
            errorInfo,
            classification,
            retryCount
          });
        }}
        fallback={(error, errorInfo, retryFn, classification, preservedData) => (
          <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-lg">
              <div className="bg-white py-8 px-6 shadow sm:rounded-lg sm:px-10">
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 text-red-500 mb-6 flex items-center justify-center">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    เกิดข้อผิดพลาดในการตั้งค่าโปรไฟล์
                  </h2>
                  
                  <p className="text-gray-600 mb-4">
                    {classification?.message || 'ขออภัย เกิดข้อผิดพลาดในการโหลดหน้าตั้งค่าโปรไฟล์'}
                  </p>

                  {preservedData && (
                    <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">
                        ข้อมูลที่คุณกรอกได้ถูกเก็บไว้แล้ว และจะถูกกู้คืนเมื่อลองใหม่
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={retryFn}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      ลองใหม่
                      {retryCount > 0 && (
                        <span className="ml-1 text-xs opacity-75">
                          ({retryCount})
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      รีโหลดหน้า
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      >
        <div id="main-content" tabIndex="-1">
          <EnhancedProfileSetupForm 
            initialFormData={formData}
            onFormDataChange={handleDataPreservation}
            profileError={profileError}
            isRetrying={isRetrying}
            canRetry={canRetry}
            onRetry={retryProfileOperation}
            onClearError={clearError}
            errorMessage={errorMessage}
            errorClassification={classification}
          />
        </div>
      </EnhancedErrorBoundary>
    </>
  );
};

export default ProfileSetupPage;