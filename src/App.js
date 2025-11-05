import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationToastContainer } from './components/notifications/NotificationToast';
import SimpleErrorBoundary from './components/common/SimpleErrorBoundary';
import FirebaseLoadingBoundary from './components/common/FirebaseLoadingBoundary';
import LoginPage from './components/auth/LoginPage';
import ProfileSetupPage from './components/auth/ProfileSetupPage';
import ProfileStatusDisplay from './components/auth/ProfileStatusDisplay';
import PendingApprovalPage from './components/auth/PendingApprovalPage';
import AccountRejectedPage from './components/auth/AccountRejectedPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NotFound from './components/NotFound';
import { lazy } from 'react';
import './App.css';

// Public components
import PublicHomepage from './components/public/PublicHomepage';

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

  // Not authenticated - show public homepage
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<PublicHomepage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pending-approval" element={<Navigate to="/login" replace />} />
        <Route path="/account-rejected" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Needs profile setup
  if (needsProfileSetup()) {
    return <ProfileSetupPage />;
  }

  // User not approved yet - show status display
  if (userProfile?.status !== 'approved') {
    return (
      <ProfileStatusDisplay 
        profile={userProfile} 
        onRetry={() => window.location.reload()}
        showActions={true}
      />
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

      {/* Status Pages - redirect approved users */}
      <Route path="/pending-approval" element={<Navigate to="/" replace />} />
      <Route path="/account-rejected" element={<Navigate to="/" replace />} />
      
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