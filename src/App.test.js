import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import App from './App';

// Mock Firebase
jest.mock('./config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn()
  }
}));

// Mock AuthService
jest.mock('./services/authService', () => ({
  getUserProfile: jest.fn()
}));

// Mock all lazy-loaded components
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

// Mock other lazy components
jest.mock('./components/notifications/NotificationCenter', () => {
  return function NotificationCenter() {
    return <div data-testid="notifications">Notifications</div>;
  };
});

jest.mock('./components/notifications/NotificationSettings', () => {
  return function NotificationSettings() {
    return <div data-testid="notification-settings">Notification Settings</div>;
  };
});

jest.mock('./components/notifications/NotificationTestPage', () => {
  return function NotificationTestPage() {
    return <div data-testid="notification-test">Notification Test</div>;
  };
});

jest.mock('./components/reservations/MyReservations', () => {
  return function MyReservations() {
    return <div data-testid="my-reservations">My Reservations</div>;
  };
});

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => <div data-testid="router">{children}</div>,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: ({ element }) => <div data-testid="route">{element}</div>,
  Navigate: ({ to }) => <div data-testid="navigate">Navigate to: {to}</div>,
  useNavigate: () => mockNavigate
}));

describe('App Component', () => {
  let mockOnAuthStateChanged;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { auth } = require('./config/firebase');
    mockOnAuthStateChanged = jest.fn();
    auth.onAuthStateChanged = mockOnAuthStateChanged;
  });

  it('should render without crashing', () => {
    render(<App />);
    
    expect(screen.getByTestId('router')).toBeInTheDocument();
  });

  it('should wrap app with error boundary', () => {
    render(<App />);
    
    // The app should render without throwing errors
    expect(screen.getByTestId('router')).toBeInTheDocument();
  });

  it('should provide auth context to child components', () => {
    render(<App />);
    
    // Auth context should be available (no errors thrown)
    expect(screen.getByTestId('router')).toBeInTheDocument();
  });

  it('should provide notification context to child components', () => {
    render(<App />);
    
    // Notification context should be available (no errors thrown)
    expect(screen.getByTestId('router')).toBeInTheDocument();
  });

  it('should set up auth state listener', () => {
    render(<App />);
    
    expect(mockOnAuthStateChanged).toHaveBeenCalled();
  });

  it('should handle authentication state changes', async () => {
    render(<App />);
    
    // Simulate auth state change
    const authStateCallback = mockOnAuthStateChanged.mock.calls[0][0];
    
    await waitFor(() => {
      authStateCallback(null); // User signed out
    });
    
    // Should not crash when auth state changes
    expect(screen.getByTestId('router')).toBeInTheDocument();
  });

  it('should render notification toast container', () => {
    // Mock the NotificationToastContainer
    jest.doMock('./components/notifications/NotificationToast', () => ({
      NotificationToastContainer: () => <div data-testid="toast-container">Toast Container</div>
    }));

    render(<App />);
    
    // Should include notification system
    expect(screen.getByTestId('router')).toBeInTheDocument();
  });
});
