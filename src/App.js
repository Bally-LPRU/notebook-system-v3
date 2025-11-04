import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationToastContainer } from './components/notifications/NotificationToast';
import SimpleErrorBoundary from './components/common/SimpleErrorBoundary';
import FirebaseLoadingBoundary from './components/common/FirebaseLoadingBoundary';
import LoginPage from './components/auth/LoginPage';
import ProfileSetupPage from './components/auth/ProfileSetupPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NotFound from './components/NotFound';
import { lazy } from 'react';
import './App.css';

// Lazy loaded components
const LazyDashboard = lazy(() => import('./components/Dashboard'));
const LazyEquipmentList = lazy(() => import('./components/equipment/EquipmentList'));
const LazyAdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const LazyUserApprovalList = lazy(() => import('./components/admin/UserApprovalList'));
const LazyMyRequests = lazy(() => import('./components/requests/MyRequests'));
const LazyReservationPage = lazy(() => import('./components/reservations/ReservationPage'));
const LazyReportsPage = lazy(() => import('./components/reports/ReportsPage'));

// Main App Routes Component
const AppRoutes = () => {
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

  // Not authenticated - show login
  if (!user) {
    return <LoginPage />;
  }

  // Needs profile setup
  if (needsProfileSetup()) {
    return <ProfileSetupPage />;
  }

  // User not approved yet
  if (userProfile?.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              รอการอนุมัติ
            </h2>
            <p className="text-gray-600 mb-4">
              บัญชีของคุณอยู่ระหว่างการตรวจสอบ กรุณารอการอนุมัติจากผู้ดูแลระบบ
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              รีเฟรช
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated and approved - show main app
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <LazyDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/equipment" element={
        <ProtectedRoute>
          <LazyEquipmentList />
        </ProtectedRoute>
      } />
      
      <Route path="/my-requests" element={
        <ProtectedRoute>
          <LazyMyRequests />
        </ProtectedRoute>
      } />
      
      <Route path="/reservations" element={
        <ProtectedRoute>
          <LazyReservationPage />
        </ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute>
          <LazyReportsPage />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin={true}>
          <LazyAdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/users" element={
        <ProtectedRoute requireAdmin={true}>
          <LazyUserApprovalList />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  const handleFirebaseRetry = () => {
    console.log('Retrying Firebase connection...');
    window.location.reload();
  };

  return (
    <SimpleErrorBoundary>
      <FirebaseLoadingBoundary onRetry={handleFirebaseRetry}>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <AppRoutes />
              <NotificationToastContainer />
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </FirebaseLoadingBoundary>
    </SimpleErrorBoundary>
  );
}

export default App;