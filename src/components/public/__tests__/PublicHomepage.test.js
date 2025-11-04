import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PublicHomepage from '../PublicHomepage';

// Mock dependencies
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../../hooks/usePublicStats', () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock('../../../utils/performanceMonitor', () => ({
  startTiming: jest.fn(),
  endTiming: jest.fn()
}));

// Mock child components
jest.mock('../Header', () => {
  return function Header({ onLoginClick, isLoading }) {
    return (
      <div data-testid="header">
        <button 
          data-testid="login-button" 
          onClick={onLoginClick}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Login'}
        </button>
      </div>
    );
  };
});

jest.mock('../HeroSection', () => {
  return function HeroSection({ title, subtitle, onGetStarted }) {
    return (
      <div data-testid="hero-section">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <button data-testid="get-started-button" onClick={onGetStarted}>
          Get Started
        </button>
      </div>
    );
  };
});

jest.mock('../Footer', () => {
  return function Footer() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock('../StatsCard', () => {
  return function StatsCard({ title, value, loading, error }) {
    if (loading) {
      return <div data-testid={`stats-card-loading-${title}`}>Loading...</div>;
    }
    return (
      <div data-testid={`stats-card-${title}`}>
        <span>{title}: {value}</span>
        {error && <span data-testid="error-indicator">Error</span>}
      </div>
    );
  };
});

jest.mock('../LoadingSkeleton', () => ({
  OfflineIndicator: ({ message, onRetry }) => (
    <div data-testid="offline-indicator">
      <span>{message}</span>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
  LoadingOverlay: ({ message }) => (
    <div data-testid="loading-overlay">{message}</div>
  ),
  StatsSectionSkeleton: () => (
    <div data-testid="stats-skeleton">Loading stats...</div>
  )
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PublicHomepage', () => {
  const mockUseAuth = require('../../../contexts/AuthContext').useAuth;
  const mockUsePublicStats = require('../../../hooks/usePublicStats').default;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseAuth.mockReturnValue({
      signIn: jest.fn(),
      user: null,
      userProfile: null,
      needsProfileSetup: jest.fn(() => false)
    });

    mockUsePublicStats.mockReturnValue({
      stats: {
        totalEquipment: 100,
        availableEquipment: 75,
        borrowedEquipment: 20,
        pendingReservations: 5,
        lastUpdated: new Date()
      },
      loading: false,
      error: null,
      isRefreshing: false,
      isOnline: true,
      wasOffline: false,
      refreshStats: jest.fn(),
      retryWhenOnline: jest.fn()
    });
  });

  describe('Component Rendering', () => {
    it('should render all main sections', () => {
      renderWithRouter(<PublicHomepage />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should render statistics cards with correct data', () => {
      renderWithRouter(<PublicHomepage />);

      expect(screen.getByTestId('stats-card-อุปกรณ์ทั้งหมด')).toBeInTheDocument();
      expect(screen.getByTestId('stats-card-พร้อมใช้งาน')).toBeInTheDocument();
      expect(screen.getByTestId('stats-card-กำลังถูกยืม')).toBeInTheDocument();
      expect(screen.getByTestId('stats-card-รอการอนุมัติ')).toBeInTheDocument();
    });

    it('should show loading skeleton when stats are loading', () => {
      mockUsePublicStats.mockReturnValue({
        stats: null,
        loading: true,
        error: null,
        isRefreshing: false,
        isOnline: true,
        wasOffline: false,
        refreshStats: jest.fn(),
        retryWhenOnline: jest.fn()
      });

      renderWithRouter(<PublicHomepage />);

      expect(screen.getByTestId('stats-skeleton')).toBeInTheDocument();
    });
  });

  describe('Authentication Flow', () => {
    it('should handle login button click', async () => {
      const mockSignIn = jest.fn();
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        user: null,
        userProfile: null,
        needsProfileSetup: jest.fn(() => false)
      });

      renderWithRouter(<PublicHomepage />);

      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });
    });

    it('should handle get started button click', async () => {
      const mockSignIn = jest.fn();
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        user: null,
        userProfile: null,
        needsProfileSetup: jest.fn(() => false)
      });

      renderWithRouter(<PublicHomepage />);

      const getStartedButton = screen.getByTestId('get-started-button');
      fireEvent.click(getStartedButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });
    });

    it('should show loading state during authentication', async () => {
      const mockSignIn = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        user: null,
        userProfile: null,
        needsProfileSetup: jest.fn(() => false)
      });

      renderWithRouter(<PublicHomepage />);

      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      // Should show loading state
      expect(loginButton).toBeDisabled();
    });

    it('should display authentication errors', async () => {
      const mockSignIn = jest.fn().mockRejectedValue(new Error('Authentication failed'));
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        user: null,
        userProfile: null,
        needsProfileSetup: jest.fn(() => false)
      });

      renderWithRouter(<PublicHomepage />);

      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed/)).toBeInTheDocument();
      });
    });

    it('should handle popup blocked error', async () => {
      const mockSignIn = jest.fn().mockRejectedValue(new Error('popup blocked'));
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        user: null,
        userProfile: null,
        needsProfileSetup: jest.fn(() => false)
      });

      renderWithRouter(<PublicHomepage />);

      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/หน้าต่างการเข้าสู่ระบบถูกบล็อก/)).toBeInTheDocument();
      });
    });

    it('should handle email domain validation error', async () => {
      const mockSignIn = jest.fn().mockRejectedValue(new Error('อีเมลต้องเป็น @gmail.com หรือ @g.lpru.ac.th เท่านั้น'));
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        user: null,
        userProfile: null,
        needsProfileSetup: jest.fn(() => false)
      });

      renderWithRouter(<PublicHomepage />);

      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/อีเมลต้องเป็น @gmail.com หรือ @g.lpru.ac.th เท่านั้น/)).toBeInTheDocument();
      });
    });

    it('should allow clearing authentication errors', async () => {
      const mockSignIn = jest.fn().mockRejectedValue(new Error('Authentication failed'));
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        user: null,
        userProfile: null,
        needsProfileSetup: jest.fn(() => false)
      });

      renderWithRouter(<PublicHomepage />);

      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed/)).toBeInTheDocument();
      });

      // Find and click the close button (X button)
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(screen.queryByText(/Authentication failed/)).not.toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    it('should display statistics when loaded', () => {
      renderWithRouter(<PublicHomepage />);

      expect(screen.getByText('อุปกรณ์ทั้งหมด: 100')).toBeInTheDocument();
      expect(screen.getByText('พร้อมใช้งาน: 75')).toBeInTheDocument();
      expect(screen.getByText('กำลังถูกยืม: 20')).toBeInTheDocument();
      expect(screen.getByText('รอการอนุมัติ: 5')).toBeInTheDocument();
    });

    it('should show error state when stats fail to load', () => {
      mockUsePublicStats.mockReturnValue({
        stats: null,
        loading: false,
        error: 'Failed to load statistics',
        isRefreshing: false,
        isOnline: true,
        wasOffline: false,
        refreshStats: jest.fn(),
        retryWhenOnline: jest.fn()
      });

      renderWithRouter(<PublicHomepage />);

      expect(screen.getByText('Failed to load statistics')).toBeInTheDocument();
    });

    it('should show refresh button when there is an error', () => {
      const mockRefreshStats = jest.fn();
      mockUsePublicStats.mockReturnValue({
        stats: null,
        loading: false,
        error: 'Failed to load statistics',
        isRefreshing: false,
        isOnline: true,
        wasOffline: false,
        refreshStats: mockRefreshStats,
        retryWhenOnline: jest.fn()
      });

      renderWithRouter(<PublicHomepage />);

      const refreshButton = screen.getByText('ลองใหม่');
      fireEvent.click(refreshButton);

      expect(mockRefreshStats).toHaveBeenCalled();
    });

    it('should show loading overlay when refreshing', () => {
      mockUsePublicStats.mockReturnValue({
        stats: {
          totalEquipment: 100,
          availableEquipment: 75,
          borrowedEquipment: 20,
          pendingReservations: 5
        },
        loading: false,
        error: null,
        isRefreshing: true,
        isOnline: true,
        wasOffline: false,
        refreshStats: jest.fn(),
        retryWhenOnline: jest.fn()
      });

      renderWithRouter(<PublicHomepage />);

      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
      expect(screen.getByText('กำลังอัปเดตข้อมูล...')).toBeInTheDocument();
    });
  });

  describe('Offline Handling', () => {
    it('should show offline indicator when offline', () => {
      mockUsePublicStats.mockReturnValue({
        stats: {
          totalEquipment: 100,
          availableEquipment: 75,
          borrowedEquipment: 20,
          pendingReservations: 5
        },
        loading: false,
        error: null,
        isRefreshing: false,
        isOnline: false,
        wasOffline: false,
        refreshStats: jest.fn(),
        retryWhenOnline: jest.fn()
      });

      renderWithRouter(<PublicHomepage />);

      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
      expect(screen.getByText(/ไม่มีการเชื่อมต่ออินเทอร์เน็ต/)).toBeInTheDocument();
    });

    it('should show reconnection indicator when coming back online', () => {
      mockUsePublicStats.mockReturnValue({
        stats: {
          totalEquipment: 100,
          availableEquipment: 75,
          borrowedEquipment: 20,
          pendingReservations: 5
        },
        loading: false,
        error: null,
        isRefreshing: false,
        isOnline: true,
        wasOffline: true,
        refreshStats: jest.fn(),
        retryWhenOnline: jest.fn()
      });

      renderWithRouter(<PublicHomepage />);

      expect(screen.getByText(/เชื่อมต่ออินเทอร์เน็ตแล้ว/)).toBeInTheDocument();
    });

    it('should handle retry when online button click', () => {
      const mockRetryWhenOnline = jest.fn();
      const mockRefreshStats = jest.fn();
      
      mockUsePublicStats.mockReturnValue({
        stats: {
          totalEquipment: 100,
          availableEquipment: 75,
          borrowedEquipment: 20,
          pendingReservations: 5
        },
        loading: false,
        error: null,
        isRefreshing: false,
        isOnline: false,
        wasOffline: false,
        refreshStats: mockRefreshStats,
        retryWhenOnline: mockRetryWhenOnline
      });

      renderWithRouter(<PublicHomepage />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockRetryWhenOnline).toHaveBeenCalledWith(mockRefreshStats);
    });
  });

  describe('Last Updated Display', () => {
    it('should show last updated time when stats are available', () => {
      const lastUpdated = new Date('2023-01-01T12:00:00Z');
      mockUsePublicStats.mockReturnValue({
        stats: {
          totalEquipment: 100,
          availableEquipment: 75,
          borrowedEquipment: 20,
          pendingReservations: 5,
          lastUpdated
        },
        loading: false,
        error: null,
        isRefreshing: false,
        isOnline: true,
        wasOffline: false,
        refreshStats: jest.fn(),
        retryWhenOnline: jest.fn()
      });

      renderWithRouter(<PublicHomepage />);

      expect(screen.getByText(/อัปเดตล่าสุด:/)).toBeInTheDocument();
    });

    it('should show offline indicator in last updated when offline', () => {
      const lastUpdated = new Date('2023-01-01T12:00:00Z');
      mockUsePublicStats.mockReturnValue({
        stats: {
          totalEquipment: 100,
          availableEquipment: 75,
          borrowedEquipment: 20,
          pendingReservations: 5,
          lastUpdated,
          isOffline: true
        },
        loading: false,
        error: null,
        isRefreshing: false,
        isOnline: false,
        wasOffline: false,
        refreshStats: jest.fn(),
        retryWhenOnline: jest.fn()
      });

      renderWithRouter(<PublicHomepage />);

      expect(screen.getByText(/\(ออฟไลน์\)/)).toBeInTheDocument();
    });
  });

  describe('Performance Monitoring', () => {
    it('should start and end performance timing on mount', () => {
      const performanceMonitor = require('../../../utils/performanceMonitor');
      
      const { unmount } = renderWithRouter(<PublicHomepage />);

      expect(performanceMonitor.startTiming).toHaveBeenCalledWith('public_homepage_mount');

      unmount();

      expect(performanceMonitor.endTiming).toHaveBeenCalledWith('public_homepage_mount');
    });
  });
});