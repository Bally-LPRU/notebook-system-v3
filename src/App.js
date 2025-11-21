import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { EquipmentCategoriesProvider } from './contexts/EquipmentCategoriesContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { NotificationToastContainer } from './components/notifications/NotificationToast';
import SimpleErrorBoundary from './components/common/SimpleErrorBoundary';
import FirebaseLoadingBoundary from './components/common/FirebaseLoadingBoundary';
import LoginPage from './components/auth/LoginPage';
import ProfileSetupPage from './components/auth/ProfileSetupPage';
import ProfileStatusDisplay from './components/auth/ProfileStatusDisplay';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NotFound from './components/NotFound';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import OfflineIndicator from './components/common/OfflineIndicator';
import { lazy, Suspense, useEffect, useState } from 'react';
import { register } from './utils/serviceWorkerRegistration';
import PopupBlockingDetector from './utils/popupBlockingDetector';
import useSystemNotifications from './hooks/useSystemNotifications';
import './App.css';

// Public components
import PublicHomepage from './components/public/PublicHomepage';

// Direct import for CategoryManagement (temporary fix for 404 issue)
import CategoryManagement from './components/admin/CategoryManagement';

// Admin Settings
const LazyAdminSettingsPage = lazy(() => import('./components/admin/settings/AdminSettingsPage'));

// Lazy loaded components
const LazyDashboard = lazy(() => import('./components/Dashboard'));
const LazyEquipmentList = lazy(() => import('./components/equipment/EquipmentList'));
const LazyAdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const LazyUserApprovalList = lazy(() => import('./components/admin/UserApprovalList'));
const LazyAdminEquipmentManagement = lazy(() => import('./components/admin/AdminEquipmentManagement'));
const LazyLoanRequestList = lazy(() => import('./components/admin/LoanRequestList'));
const LazyReservationManagement = lazy(() => import('./components/reservations/ReservationManagement'));
const LazyMyRequests = lazy(() => import('./components/requests/MyRequests'));
const LazyReservationPage = lazy(() => import('./components/reservations/ReservationPage'));
const LazyReportsPage = lazy(() => import('./components/reports/ReportsPage'));
const LazyProfilePage = lazy(() => import('./components/profile/ProfilePage'));
const LazyNotificationCenter = lazy(() => import('./components/admin/NotificationCenter'));
const LazyNotificationSettings = lazy(() => import('./components/notifications/NotificationSettings'));

// Simple login for debugging
const SimpleLogin = lazy(() => import('./components/auth/SimpleLogin'));
const PopupLogin = lazy(() => import('./components/auth/PopupLogin'));

// Auth initialization loader component
const AuthInitializingLoader = lazy(() => import('./components/common/AuthInitializingLoader'));

// System Notification Modal
const SystemNotificationModal = lazy(() => import('./components/notifications/SystemNotificationModal'));

// Main App Routes Component
const AppRoutes = () => {
  const { user, userProfile, loading, authInitialized, needsProfileSetup } = useAuth();
  const { showModal, closeModal } = useSystemNotifications();

  // Wait for auth to initialize before rendering routes
  // This ensures we check for persisted auth state before deciding what to show
  if (!authInitialized || loading) {
    return <AuthInitializingLoader />;
  }

  // If user exists but userProfile is still loading, show loader
  if (user && !userProfile && loading) {
    return <AuthInitializingLoader />;
  }

  // Not authenticated - show public homepage
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<PublicHomepage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/simple-login" element={<SimpleLogin />} />
        <Route path="/popup-login" element={<PopupLogin />} />
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
    <Suspense fallback={<AuthInitializingLoader />}>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            {userProfile?.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : (
              <LazyDashboard />
            )}
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
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <LazyProfilePage />
        </ProtectedRoute>
      } />
      
      <Route path="/notifications" element={
        <ProtectedRoute>
          <LazyNotificationCenter />
        </ProtectedRoute>
      } />
      
      <Route path="/notification-settings" element={
        <ProtectedRoute>
          <LazyNotificationSettings />
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
      
      <Route path="/admin/equipment" element={
        <ProtectedRoute requireAdmin={true}>
          <LazyAdminEquipmentManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/categories" element={
        <ProtectedRoute requireAdmin={true}>
          <CategoryManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/loan-requests" element={
        <ProtectedRoute requireAdmin={true}>
          <LazyLoanRequestList />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/reservations" element={
        <ProtectedRoute requireAdmin={true}>
          <LazyReservationManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/reports" element={
        <ProtectedRoute requireAdmin={true}>
          <LazyReportsPage />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/notifications" element={
        <ProtectedRoute requireAdmin={true}>
          <LazyNotificationCenter />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/settings" element={
        <ProtectedRoute requireAdmin={true}>
          <LazyAdminSettingsPage />
        </ProtectedRoute>
      } />

      {/* Status Pages - redirect approved users */}
      <Route path="/pending-approval" element={<Navigate to="/" replace />} />
      <Route path="/account-rejected" element={<Navigate to="/" replace />} />
      
      <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* System Notification Modal */}
      <SystemNotificationModal isOpen={showModal} onClose={closeModal} />
    </Suspense>
  );
};

function App() {
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  useEffect(() => {
    // Initialize popup blocking detection
    PopupBlockingDetector.initializeInteractionTracking();
    
    // Register service worker
    register({
      onSuccess: (registration) => {
        console.log('SW registered successfully');
        setSwRegistration(registration);
      },
      onUpdate: (registration) => {
        console.log('SW update available');
        setSwUpdateAvailable(true);
        setSwRegistration(registration);
      }
    });

    // Handle PWA shortcuts
    const urlParams = new URLSearchParams(window.location.search);
    const shortcut = urlParams.get('shortcut');
    
    if (shortcut) {
      // Handle PWA shortcuts
      switch (shortcut) {
        case 'search':
          // Navigate to search page or trigger search
          console.log('PWA shortcut: search');
          break;
        case 'add':
          // Navigate to add equipment page
          console.log('PWA shortcut: add equipment');
          break;
        case 'scan':
          // Open QR scanner
          console.log('PWA shortcut: scan QR');
          break;
        default:
          break;
      }
    }
  }, []);

  const handleFirebaseRetry = () => {
    console.log('Retrying Firebase connection...');
    window.location.reload();
  };

  const handleSwUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const handlePWAInstall = () => {
    console.log('PWA installed successfully');
  };

  const handleSyncClick = () => {
    console.log('Manual sync triggered');
  };

  return (
    <SimpleErrorBoundary>
      <FirebaseLoadingBoundary onRetry={handleFirebaseRetry}>
        <AuthProvider>
          <SettingsProvider>
            <NotificationProvider>
              <EquipmentCategoriesProvider>
                <Router>
                  <AppRoutes />
                  <NotificationToastContainer />
              
              {/* PWA Install Prompt */}
              <PWAInstallPrompt 
                onInstall={handlePWAInstall}
                autoShow={true}
              />
              
              {/* Offline Indicator */}
              <OfflineIndicator 
                onSyncClick={handleSyncClick}
                showPendingCount={true}
              />
              
              {/* Service Worker Update Notification */}
              {swUpdateAvailable && (
                <div className="fixed bottom-4 left-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">อัปเดตใหม่พร้อมใช้งาน</p>
                      <p className="text-sm opacity-90">คลิกเพื่อรีเฟรชและใช้เวอร์ชันล่าสุด</p>
                    </div>
                    <button
                      onClick={handleSwUpdate}
                      className="ml-4 bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      อัปเดต
                    </button>
                  </div>
                </div>
              )}
              </Router>
              </EquipmentCategoriesProvider>
            </NotificationProvider>
          </SettingsProvider>
        </AuthProvider>
      </FirebaseLoadingBoundary>
    </SimpleErrorBoundary>
  );
}

export default App;