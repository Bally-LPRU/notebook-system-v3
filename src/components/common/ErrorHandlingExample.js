/**
 * Example component demonstrating enhanced error handling integration
 * This shows how to use the new error handling system in profile management
 */

import React, { useState, useEffect } from 'react';
import EnhancedErrorBoundary from './EnhancedErrorBoundary';
import NetworkStatusMonitor from './NetworkStatusMonitor';
import { useProfileErrorHandling } from '../../hooks/useEnhancedErrorHandling';
import { createFormPreserver } from '../../utils/formDataPreservation';

const ProfileFormWithErrorHandling = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    department: '',
    userType: ''
  });

  const [formPreserver, setFormPreserver] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enhanced error handling for profile operations
  const {
    error,
    isRetrying,
    retryCount,
    hasError,
    canRetry,
    updateProfile,
    retry,
    clearError,
    errorMessage
  } = useProfileErrorHandling({
    onError: (error, classification) => {
      console.log('Profile operation error:', error, classification);
    },
    onRetry: (attempt, type) => {
      console.log(`Retry attempt ${attempt} (${type})`);
    },
    onSuccess: (result) => {
      console.log('Profile operation successful:', result);
      // Clear preserved form data on success
      if (formPreserver) {
        formPreserver.clearPreservedData();
      }
    }
  });

  // Initialize form data preservation
  useEffect(() => {
    const preserver = createFormPreserver('profile-form', {
      autoSave: true,
      saveInterval: 30000, // 30 seconds
      excludeFields: ['password']
    });

    setFormPreserver(preserver);

    // Try to restore preserved data
    const formElement = document.getElementById('profile-form');
    if (formElement) {
      const restoredData = preserver.restoreFormData(formElement);
      if (restoredData) {
        setFormData(restoredData);
      }
      
      // Start auto-save
      preserver.startAutoSave(formElement);
    }

    return () => {
      preserver.cleanup();
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate profile update operation
      await updateProfile(async (profileData) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate random failures for demonstration
        if (Math.random() < 0.3) {
          throw new Error('Network request failed');
        }
        
        console.log('Profile updated:', profileData);
        return { success: true, data: profileData };
      }, formData);

      // Success - form will be cleared by onSuccess callback
      setFormData({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        department: '',
        userType: ''
      });

    } catch (error) {
      // Error is handled by the hook
      console.log('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (canRetry) {
      setIsSubmitting(true);
      try {
        await retry();
        // Success handled by hook
      } catch (error) {
        // Error handled by hook
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDataRestore = (preservedData) => {
    setFormData(preservedData);
  };

  return (
    <NetworkStatusMonitor>
      <EnhancedErrorBoundary
        componentName="ProfileForm"
        operation="profile_form"
        formData={formData}
        onDataRestore={handleDataRestore}
        onError={(error, errorInfo, classification) => {
          console.log('Error boundary caught error:', error, classification);
        }}
        onRetry={(retryCount, type) => {
          console.log(`Error boundary retry: ${retryCount} (${type})`);
        }}
      >
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Profile Form with Enhanced Error Handling
          </h2>

          {/* Error display */}
          {hasError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {errorMessage?.title || 'เกิดข้อผิดพลาด'}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{errorMessage?.message || error?.message}</p>
                  </div>
                  {canRetry && (
                    <div className="mt-3">
                      <button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {isRetrying ? 'กำลังลองใหม่...' : 'ลองใหม่'}
                        {retryCount > 0 && (
                          <span className="ml-1 text-xs">({retryCount})</span>
                        )}
                      </button>
                      <button
                        onClick={clearError}
                        className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        ปิด
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                ชื่อ
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                นามสกุล
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                สังกัด
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">เลือกสังกัด</option>
                <option value="accounting">สาขาวิชาการบัญชี</option>
                <option value="digital-business">สาขาวิชาการจัดการธุรกิจดิจิทัล</option>
                <option value="business-admin">สาขาวิชาบริหารธุรกิจ</option>
              </select>
            </div>

            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
                ประเภทผู้ใช้
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">เลือกประเภทผู้ใช้</option>
                <option value="student">นักศึกษา</option>
                <option value="teacher">อาจารย์</option>
                <option value="staff">เจ้าหน้าที่</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isRetrying}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isRetrying ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isRetrying ? 'กำลังลองใหม่...' : 'กำลังบันทึก...'}
                </div>
              ) : (
                'บันทึกข้อมูล'
              )}
            </button>
          </form>

          {/* Status information */}
          <div className="mt-4 text-sm text-gray-500 text-center">
            {formPreserver?.hasPreservedData() && (
              <p className="text-blue-600">
                💾 ข้อมูลถูกบันทึกอัตโนมัติแล้ว
              </p>
            )}
            {retryCount > 0 && (
              <p className="text-orange-600">
                🔄 ลองใหม่แล้ว {retryCount} ครั้ง
              </p>
            )}
          </div>
        </div>
      </EnhancedErrorBoundary>
    </NetworkStatusMonitor>
  );
};

export default ProfileFormWithErrorHandling;