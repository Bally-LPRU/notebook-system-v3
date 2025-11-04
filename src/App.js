import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationToastContainer } from './components/notifications/NotificationToast';
import ErrorBoundary from './components/common/ErrorBoundary';
import FirebaseLoadingBoundary from './components/common/FirebaseLoadingBoundary';
import LoginPage from './components/auth/LoginPage';
import ProfileSetupPage from './components/auth/ProfileSetupPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NotFound from './components/NotFound';
import { lazy } from 'react';
import './App.css';

// Lazy loaded components
import {
  LazyDashboardWithSkeleton,
  LazyEquipmentListWithSkeleton,
  LazyAdminDashboardWithSkeleton,
  LazyUserApprovalListWithSkeleton,
  LazyMyRequestsWithSkeleton,
  LazyReservationPageWithSkeleton,
  LazyReportsPageWithSkeleton,
  preloadCriticalComponents
} from './components/lazy/LazyComponents';

// Lazy load notification components
const LazyNotificationCenter = lazy(() => import('./components/notifications/NotificationCenter'));
const LazyNotificationSettings = lazy(() => import('./components/notifications/NotificationSettings'));

// Initialize debug utils in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/debugUtils');
}
const LazyNotificationTestPage = lazy(() => import('./components/notifications/NotificationTestPage'));
const LazyMyReservations = lazy(() => import('./components/reservations/MyReservations'));

// App Router Component
const AppRouter = () => {
  const { isAuthenticated, needsProfileSetup } = useAuth();

  // Preload critical components on app start
  React.useEffect(() => {
    if (isAuthenticated && !needsProfileSetup()) {
      preloadCriticalComponents();
    }
  }, [isAuthenticated, needsProfileSetup]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} 
      />
      
      {/* Profile Setup Route */}
      <Route 
        path="/profile-setup" 
        element={
          isAuthenticated ? (
            needsProfileSetup() ? (
              <ProfileSetupPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Protected User Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute requireApproval={true}>
            <LazyDashboardWithSkeleton />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/equipment" 
        element={
          <ProtectedRoute requireApproval={true}>
            <LazyEquipmentListWithSkeleton />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-requests" 
        element={
          <ProtectedRoute requireApproval={true}>
            <LazyMyRequestsWithSkeleton />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reservations" 
        element={
          <ProtectedRoute requireApproval={true}>
            <LazyReservationPageWithSkeleton />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-reservations" 
        element={
          <ProtectedRoute requireApproval={true}>
            <LazyMyReservations />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute requireApproval={true}>
            <LazyNotificationCenter />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/notification-settings" 
        element={
          <ProtectedRoute requireApproval={true}>
            <LazyNotificationSettings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/notification-test" 
        element={
          <ProtectedRoute requireApproval={true}>
            <LazyNotificationTestPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <LazyAdminDashboardWithSkeleton />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <LazyUserApprovalListWithSkeleton />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/equipment" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <LazyAdminDashboardWithSkeleton />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/loan-requests" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <LazyAdminDashboardWithSkeleton />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reservations" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <LazyAdminDashboardWithSkeleton />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <LazyReportsPageWithSkeleton />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/notifications" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <LazyAdminDashboardWithSkeleton />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <LazyAdminDashboardWithSkeleton />
          </ProtectedRoute>
        } 
      />
      
      {/* Root Route */}
      <Route 
        path="/" 
        element={
          <Navigate 
            to={
              isAuthenticated 
                ? needsProfileSetup() 
                  ? "/profile-setup" 
                  : "/dashboard"
                : "/login"
            } 
            replace 
          />
        } 
      />
      
      {/* 404 Not Found Route */}
      <Route 
        path="*" 
        element={<NotFound />} 
      />
    </Routes>
  );
};

function App() {
  const handleFirebaseRetry = (retryCount) => {
    console.log(`Firebase initialization retry attempt: ${retryCount}`);
  };

  return (
    <ErrorBoundary>
      <FirebaseLoadingBoundary onRetry={handleFirebaseRetry}>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <AppRouter />
              <NotificationToastContainer />
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </FirebaseLoadingBoundary>
    </ErrorBoundary>
  );
}

export default App;
