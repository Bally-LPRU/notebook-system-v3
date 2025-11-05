import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DuplicateDetectionService from '../../services/duplicateDetectionService';
import StatusMessage from './StatusMessage';

/**
 * Component for displaying profile status and appropriate messaging
 * Implements requirements 8.5, 2.4, 2.5
 */
const ProfileStatusDisplay = ({ profile, onRetry, showActions = true }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  if (!profile) {
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
              ไม่พบข้อมูลผู้ใช้
            </h2>
            <p className="text-gray-600 mb-4">
              ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง
            </p>
            {showActions && (
              <div className="space-y-2">
                <button
                  onClick={onRetry}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  ลองใหม่
                </button>
                <button
                  onClick={() => signOut()}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = DuplicateDetectionService.getStatusDisplayInfo(profile);

  const handlePrimaryAction = () => {
    switch (statusInfo.status) {
      case 'incomplete':
        // Stay on current page to complete profile
        break;
      case 'approved':
        const dashboardRoute = DuplicateDetectionService.getDashboardRoute(profile);
        navigate(dashboardRoute);
        break;
      default:
        if (onRetry) onRetry();
        break;
    }
  };

  const getPrimaryActionText = () => {
    switch (statusInfo.status) {
      case 'incomplete':
        return 'กรอกข้อมูลโปรไฟล์';
      case 'pending':
        return 'รีเฟรชสถานะ';
      case 'approved':
        return 'เข้าสู่ระบบ';
      case 'rejected':
        return 'ติดต่อผู้ดูแลระบบ';
      default:
        return 'ลองใหม่';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          {/* Status Message Component */}
          <div className="mb-6">
            <StatusMessage 
              profile={profile} 
              showNextSteps={false}
              compact={false}
            />
          </div>

          {/* User Info */}
          {profile.firstName && profile.lastName && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="font-medium text-gray-900">
                  {profile.firstName} {profile.lastName}
                </p>
                <p className="text-sm text-gray-600">{profile.email}</p>
                {profile.department && (
                  <p className="text-sm text-gray-600">
                    {typeof profile.department === 'object' ? profile.department.label : profile.department}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {statusInfo.nextSteps && statusInfo.nextSteps.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">ขั้นตอนถัดไป:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {statusInfo.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-300 text-white text-xs flex items-center justify-center mr-2 mt-0.5">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="space-y-3">
              {/* Primary Action */}
              <button
                onClick={handlePrimaryAction}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                {getPrimaryActionText()}
              </button>

              {/* Secondary Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  รีเฟรช
                </button>
                <button
                  onClick={() => signOut()}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          )}

          {/* Estimated Time (for pending status) */}
          {statusInfo.status === 'pending' && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                ระยะเวลาการอนุมัติโดยประมาณ: 1-2 วันทำการ
              </p>
            </div>
          )}

          {/* Last Updated */}
          {profile.updatedAt && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                อัปเดตล่าสุด: {new Date(profile.updatedAt.toDate ? profile.updatedAt.toDate() : profile.updatedAt).toLocaleString('th-TH')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileStatusDisplay;