import React from 'react';
import { render, screen } from '@testing-library/react';

// Keep the mocks lightweight to avoid hitting real Firebase/auth logic
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({
    user: null,
    userProfile: null,
    loading: false,
    authInitialized: true,
    needsProfileSetup: () => false
  })
}));

jest.mock('./contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }) => <>{children}</>,
  useNotificationContext: () => ({
    toastNotifications: [],
    showToast: jest.fn(),
    hideToast: jest.fn()
  })
}));

jest.mock('./contexts/EquipmentCategoriesContext', () => ({
  EquipmentCategoriesProvider: ({ children }) => <>{children}</>
}));

jest.mock('./contexts/SettingsContext', () => ({
  SettingsProvider: ({ children }) => <>{children}</>
}));

jest.mock('./hooks/useSystemNotifications', () => () => ({
  showModal: false,
  closeModal: jest.fn()
}));

jest.mock('./config/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  getServiceStatus: () => ({ status: 'ok' })
}));

jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  onIdTokenChanged: jest.fn(() => jest.fn())
}));

jest.mock('./components/common/FirebaseLoadingBoundary', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>
}));

jest.mock('./components/lazy/LazyComponents', () => ({
  LazyDashboardWithSkeleton: () => <div data-testid="dashboard">Dashboard</div>,
  LazyEquipmentListWithSkeleton: () => <div data-testid="equipment">Equipment</div>,
  LazyAdminDashboardWithSkeleton: () => <div data-testid="admin-dashboard">Admin Dashboard</div>,
  LazyUserApprovalListWithSkeleton: () => <div data-testid="user-approval">User Approval</div>,
  LazyMyRequestsWithSkeleton: () => <div data-testid="my-requests">My Requests</div>,
  LazyReservationPageWithSkeleton: () => <div data-testid="reservations">Reservations</div>,
  LazyReportsPageWithSkeleton: () => <div data-testid="reports">Reports</div>,
  preloadCriticalComponents: jest.fn()
}));

jest.mock('./components/notifications/NotificationCenter', () => () => (
  <div data-testid="notifications">Notifications</div>
));

jest.mock('./components/notifications/NotificationSettings', () => () => (
  <div data-testid="notification-settings">Notification Settings</div>
));

jest.mock('./components/auth/LoginPage', () => () => <div data-testid="login-page">Login</div>);
jest.mock('./components/auth/SimpleLogin', () => () => <div data-testid="simple-login">SimpleLogin</div>);
jest.mock('./components/auth/PopupLogin', () => () => <div data-testid="popup-login">PopupLogin</div>);
jest.mock('./components/public/PublicHomepage', () => () => <div data-testid="public-home">Home</div>);

jest.mock('./components/notifications/NotificationTestPage', () => () => (
  <div data-testid="notification-test">Notification Test</div>
));

jest.mock('./components/reservations/MyReservations', () => () => (
  <div data-testid="my-reservations">My Reservations</div>
));

jest.mock('./components/common/SimpleErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>
}));

jest.mock('./components/common/PWAInstallPrompt', () => () => null);
jest.mock('./components/common/OfflineIndicator', () => () => null);

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => <div data-testid="router">{children}</div>,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: ({ element }) => <div data-testid="route">{element}</div>,
  Navigate: ({ to }) => <div data-testid="navigate">Navigate to: {to}</div>,
  useNavigate: () => mockNavigate
}));

import App from './App';

describe('App Component', () => {
  it('renders router shell', async () => {
    render(<App />);
    expect(await screen.findByTestId('router')).toBeInTheDocument();
  });
});
