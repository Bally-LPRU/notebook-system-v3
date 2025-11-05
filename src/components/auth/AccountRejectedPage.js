import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileStatusDisplay from './ProfileStatusDisplay';

/**
 * Page component for users with rejected account status
 * Implements requirements 8.5, 2.4, 2.5
 */
const AccountRejectedPage = () => {
  const { userProfile } = useAuth();

  const handleRetry = () => {
    window.location.reload();
  };

  const handleContactAdmin = () => {
    // This could open a contact form or redirect to support
    window.open('mailto:admin@lpru.ac.th?subject=Account Rejection Inquiry', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileStatusDisplay 
        profile={userProfile}
        onRetry={handleRetry}
        showActions={true}
      />
      
      {/* Additional contact information */}
      <div className="max-w-md mx-auto mt-8 px-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">ติดต่อผู้ดูแลระบบ</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>admin@lpru.ac.th</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>02-XXX-XXXX</span>
            </div>
            <div className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>เวลาทำการ: จันทร์-ศุกร์ 8:00-17:00 น.</span>
            </div>
          </div>
          
          <button
            onClick={handleContactAdmin}
            className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            ส่งอีเมลติดต่อ
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountRejectedPage;