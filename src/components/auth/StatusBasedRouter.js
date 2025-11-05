import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProfileSetupPage from './ProfileSetupPage';
import PendingApprovalPage from './PendingApprovalPage';
import AccountRejectedPage from './AccountRejectedPage';
import DuplicateDetectionService from '../../services/duplicateDetectionService';

/**
 * Component that routes users based on their profile status
 * Implements requirements 8.2, 8.4, 2.4, 2.5
 */
const StatusBasedRouter = ({ children }) => {
  const { user, userProfile, loading, needsProfileSetup } = useAuth();

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

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // No profile data
  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  // Profile incomplete - needs setup
  if (needsProfileSetup()) {
    return <ProfileSetupPage />;
  }

  // Route based on status
  switch (userProfile.status) {
    case 'incomplete':
      return <ProfileSetupPage />;
      
    case 'pending':
      return <PendingApprovalPage />;
      
    case 'rejected':
      return <AccountRejectedPage />;
      
    case 'approved':
      // User is approved, render children (main app)
      return children;
      
    default:
      // Unknown status, show generic status display
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                สถานะไม่ทราบ
              </h2>
              <p className="text-gray-600 mb-4">
                ไม่สามารถระบุสถานะบัญชีได้ กรุณาติดต่อผู้ดูแลระบบ
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  รีเฟรช
                </button>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  เข้าสู่ระบบใหม่
                </button>
              </div>
            </div>
          </div>
        </div>
      );
  }
};

export default StatusBasedRouter;