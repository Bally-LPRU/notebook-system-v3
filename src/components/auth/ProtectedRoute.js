import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false, requireApproval = true }) => {
  const { isAuthenticated, isApproved, isAdmin, loading, userProfile, needsProfileSetup } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
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

  // Check if admin access is required
  if (requireAdmin && !isAdmin) {
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
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            กลับหน้าก่อนหน้า
          </button>
        </div>
      </div>
    );
  }

  // Check if approval is required and user is not approved
  if (requireApproval && !isApproved) {
    // If user is pending approval, show pending message
    if (userProfile?.status === 'pending') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-yellow-100">
              <svg className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">รอการอนุมัติ</h2>
            <p className="mt-2 text-gray-600">
              บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ
            </p>
            <p className="mt-1 text-sm text-gray-500">
              กรุณารอการติดต่อกลับหรือติดต่อผู้ดูแลระบบโดยตรง
            </p>
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    หากคุณต้องการเข้าใช้งานระบบด่วน กรุณาติดต่อผู้ดูแลระบบ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // If user is suspended or rejected
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">บัญชีถูกระงับ</h2>
          <p className="mt-2 text-gray-600">
            บัญชีของคุณไม่สามารถเข้าใช้งานระบบได้ในขณะนี้
          </p>
          <p className="mt-1 text-sm text-gray-500">
            กรุณาติดต่อผู้ดูแลระบบเพื่อขอข้อมูลเพิ่มเติม
          </p>
        </div>
      </div>
    );
  }

  // If all checks pass, render the protected content
  return children;
};

export default ProtectedRoute;