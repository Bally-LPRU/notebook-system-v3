import React from 'react';
import { Link } from 'react-router-dom';
import usePendingUsersNotification from '../../hooks/usePendingUsersNotification';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Badge component showing count of pending user approvals
 * Displays in admin navigation with real-time updates
 */
const PendingUsersBadge = ({ className = '', showLabel = false }) => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const {
    pendingCount,
    newUserAlert,
    loading,
    clearAlert
  } = usePendingUsersNotification(isAdmin);

  // Don't show anything if not admin or no pending users
  if (!isAdmin || loading) {
    return null;
  }

  if (pendingCount === 0) {
    return null;
  }

  return (
    <>
      {/* Badge */}
      <Link
        to="/admin/users?tab=pending"
        className={`relative inline-flex items-center ${className}`}
        title={`${pendingCount} ผู้ใช้รอการอนุมัติ`}
      >
        {showLabel && (
          <span className="mr-2 text-sm text-gray-700">
            ผู้ใช้รอการอนุมัติ
          </span>
        )}
        
        <div className="relative">
          <svg
            className="w-6 h-6 text-gray-600 hover:text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          
          {/* Count badge */}
          <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full animate-pulse">
            {pendingCount}
          </span>
        </div>
      </Link>

      {/* Toast notification for new user */}
      {newUserAlert && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-white rounded-lg shadow-lg border-l-4 border-blue-500 p-4 max-w-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  ผู้ใช้ใหม่สมัครสมาชิก
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {newUserAlert.name}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {newUserAlert.email}
                </p>
                
                <div className="mt-3 flex space-x-2">
                  <Link
                    to="/admin/users?tab=pending"
                    className="text-xs font-medium text-blue-600 hover:text-blue-500"
                    onClick={clearAlert}
                  >
                    ดูรายละเอียด →
                  </Link>
                  <button
                    onClick={clearAlert}
                    className="text-xs font-medium text-gray-600 hover:text-gray-500"
                  >
                    ปิด
                  </button>
                </div>
              </div>
              
              <button
                onClick={clearAlert}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PendingUsersBadge;
