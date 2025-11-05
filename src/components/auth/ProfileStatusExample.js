import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileStatusTracker from './ProfileStatusTracker';
import ProfileUpdateNotifications from './ProfileUpdateNotifications';
import useProfileUpdateNotifications from '../../hooks/useProfileUpdateNotifications';
import ToastContainer from '../common/ToastContainer';

/**
 * Example component showing how to integrate ProfileStatusTracker and ProfileUpdateNotifications
 * This demonstrates the implementation of requirements 2.1, 2.4, 2.5
 */
const ProfileStatusExample = () => {
  const { user, profile, updateProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const {
    lastUpdateResult,
    handleUpdateSuccess,
    handleUpdateError,
    setInitialStatus,
    showProfileCompletionNotification,
    showValidationErrorNotification
  } = useProfileUpdateNotifications();

  // Set initial status when profile loads
  useEffect(() => {
    if (profile?.status) {
      setInitialStatus(profile.status);
    }
  }, [profile?.status, setInitialStatus]);

  // Example function to simulate profile update
  const handleExampleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Simulate validation
      const hasErrors = !profile?.firstName || !profile?.lastName;
      if (hasErrors) {
        showValidationErrorNotification(['firstName', 'lastName']);
        return;
      }

      // Simulate profile update
      const updatedProfile = {
        ...profile,
        updatedAt: new Date(),
        // Simulate status change from incomplete to pending
        status: profile.status === 'incomplete' ? 'pending' : profile.status
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile through auth context
      await updateProfile(updatedProfile);

      // Show success notification
      handleUpdateSuccess(updatedProfile, { 
        fields: ['firstName', 'lastName'],
        updateType: 'general'
      });

      // Show completion notification if profile is now complete
      if (updatedProfile.status === 'pending') {
        setTimeout(() => {
          showProfileCompletionNotification();
        }, 2000);
      }

    } catch (error) {
      handleUpdateError(error, profile);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            สถานะโปรไฟล์
          </h1>
          <p className="mt-2 text-gray-600">
            ตัวอย่างการใช้งาน ProfileStatusTracker และ ProfileUpdateNotifications
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Profile Status Tracker - Full Version */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Status Tracker (แบบเต็ม)
            </h2>
            
            <ProfileStatusTracker 
              profile={profile}
              showDetailedProgress={true}
              showEstimatedTime={true}
              compact={false}
            />
          </div>

          {/* Profile Status Tracker - Compact Version */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Status Tracker (แบบกะทัดรัด)
            </h2>
            
            <ProfileStatusTracker 
              profile={profile}
              showDetailedProgress={false}
              showEstimatedTime={true}
              compact={true}
            />

            {/* Profile Update Notifications */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                การแจ้งเตือนการอัปเดต
              </h3>
              
              <ProfileUpdateNotifications
                profile={profile}
                lastUpdateResult={lastUpdateResult}
                className="mb-4"
              />
            </div>

            {/* Example Actions */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ทดสอบการทำงาน
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleExampleUpdate}
                  disabled={isUpdating}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? 'กำลังอัปเดต...' : 'ทดสอบอัปเดตโปรไฟล์'}
                </button>

                <div className="text-sm text-gray-600">
                  <p><strong>สถานะปัจจุบัน:</strong> {profile.status}</p>
                  <p><strong>อัปเดตล่าสุด:</strong> {
                    profile.updatedAt 
                      ? new Date(profile.updatedAt.toDate ? profile.updatedAt.toDate() : profile.updatedAt).toLocaleString('th-TH')
                      : 'ไม่มีข้อมูล'
                  }</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            วิธีการใช้งาน
          </h3>
          
          <div className="space-y-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium">ProfileStatusTracker:</h4>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>แสดงความคืบหน้าการสมัครสมาชิก</li>
                <li>รองรับทั้งแบบเต็มและแบบกะทัดรัด</li>
                <li>แสดงเวลาประมาณการอนุมัติ</li>
                <li>แสดงขั้นตอนที่เสร็จสิ้นและที่ยังค้างอยู่</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">ProfileUpdateNotifications:</h4>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>แสดงข้อความยืนยันหลังการอัปเดต</li>
                <li>แสดงเวลาการอัปเดตล่าสุด</li>
                <li>แจ้งเตือนการเปลี่ยนแปลงสถานะ</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">useProfileUpdateNotifications Hook:</h4>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>จัดการสถานะการแจ้งเตือน</li>
                <li>แสดง Toast notifications</li>
                <li>ติดตามการเปลี่ยนแปลงสถานะ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container for notifications */}
      <ToastContainer position="top-right" />
    </div>
  );
};

export default ProfileStatusExample;