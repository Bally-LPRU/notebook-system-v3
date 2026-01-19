import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PermissionService from '../../services/permissionService';

/**
 * StaffRoute - Protected route component for Staff-only pages
 * 
 * This component checks if the user has Staff or Admin role.
 * Staff can access loan management pages, but not admin-only pages.
 * Admin can access all pages including Staff pages.
 * 
 * Requirements: 7.1-7.6
 */
const StaffRoute = ({ children }) => {
  const { isAuthenticated, isApproved, isAdmin, isStaff, loading, userProfile, needsProfileSetup } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to profile setup if profile is incomplete
  if (needsProfileSetup()) {
    return <Navigate to="/profile-setup" replace />;
  }

  // Check if user is approved
  if (!isApproved) {
    // If user is pending approval, redirect to dashboard
    if (userProfile?.status === 'pending') {
      return <Navigate to="/dashboard" replace />;
    }
    // If user is suspended or rejected, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user has Staff or Admin role
  const canAccessStaffPages = PermissionService.canPerformStaffFunctions(userProfile);

  if (!canAccessStaffPages) {
    // Show access denied message and redirect to dashboard
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="mt-2 text-gray-600">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้ หน้านี้สำหรับเจ้าหน้าที่ให้บริการยืม-คืนเท่านั้น
          </p>
          <p className="mt-1 text-sm text-gray-500">
            กรุณาติดต่อผู้ดูแลระบบหากคุณต้องการสิทธิ์เข้าถึง
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              กลับหน้าก่อนหน้า
            </button>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              ไปหน้าหลัก
            </a>
          </div>
        </div>
      </div>
    );
  }

  // If all checks pass, render the protected content
  return children;
};

export default StaffRoute;
