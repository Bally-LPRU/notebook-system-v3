import React from 'react';
import { Link } from 'react-router-dom';
import useUnifiedNotifications from '../../hooks/useUnifiedNotifications';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Badge component showing count of pending user approvals
 * Displays in admin navigation with real-time updates
 * Now uses unified notification system for better performance
 */
const PendingUsersBadge = ({ className = '', showLabel = false }) => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const {
    counts,
    loading
  } = useUnifiedNotifications(isAdmin);

  const pendingCount = counts.users;

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


    </>
  );
};

export default PendingUsersBadge;
