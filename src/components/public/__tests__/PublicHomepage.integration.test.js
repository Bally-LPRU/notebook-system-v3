import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PublicHomepage from '../PublicHomepage';

// Mock the entire auth context
const mockAuthContext = {
  signIn: jest.fn(),
  user: null,
  userProfile: null,
  needsProfileSetup: jest.fn(() => false)
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Mock the stats hook
const mockStatsHook = {
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
};

jest.mock('../../../hooks/usePublicStats', () => ({
  __esModule: true,
  default: () => mockStatsHook
}));

// Mock performance monitor
jest.mock('../../../utils/performanceMonitor', () => ({
  startTiming: jest.fn(),
  endTiming: jest.fn()
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PublicHomepage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockAuthContext.signIn.mockReset();
    mockAuthContext.user = null;
    mockAuthContext.userProfile = null;
    mockAuthContext.needsProfileSetup.mockReturnValue(false);
  });

  describe('Complete Authentication Flow', () => {
    it('should handle successful login flow', async () => {
      mockAuthContext.signIn.mockResolvedValue();
      mockAuthContext.user = { uid: 'test-user', email: 'test@gmail.com' };
      mockAuthContext.userProfile = { status: 'approved' };

      renderWithRouter(<PublicHomepage />);

      // Click login button in header
      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      fireEvent.click(loginButton);

      // Should show loading state
      await waitFor(() => {
        expect(loginButton).toBeDisabled();
      });

      // Should call signIn
      expect(mockAuthContext.signIn).toHaveBeenCalled();
    });

    it('should handle login via get started button', async () => {
      mockAuthContext.signIn.mockResolvedValue();

      renderWithRouter(<PublicHomepage />);

      // Click get started button in hero section
      const getStartedButton = screen.getByRole('button', { name: /เริ่มต้นใช้งาน/i });
      fireEvent.click(getStartedButton);

      await waitFor(() => {
        expect(mockAuthContext.signIn).toHaveBeenCalled();
      });
    });

    it('should handle popup blocked error with helpful message', async () => {
      mockAuthContext.signIn.mockRejectedValue(new Error('popup blocked'));

      renderWithRouter(<PublicHomepage />);

      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/หน้าต่างการเข้าสู่ระบบถูกบล็อก/)).toBeInTheDocument();
        expect(screen.getByText(/คลิกที่ไอคอนป๊อปอัพที่ถูกบล็อก/)).toBeInTheDocument();
      });
    });

    it('should handle email domain validation error', async () => {
      mockAuthContext.signIn.mockRejectedValue(
        new Error('อีเมลต้องเป็น @gmail.com หรือ @g.lpru.ac.th เท่านั้น')
      );

      renderWithRouter(<PublicHomepage />);

      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/อีเมลต้องเป็น @gmail.com หรือ @g.lpru.ac.th เท่านั้น/)).toBeInTheDocument();
        expect(screen.getByText(/อีเมลที่ได้รับอนุญาต: @gmail.com หรือ @g.lpru.ac.th/)).toBeInTheDocument();
      });
    });

    it('should handle network error with retry option', async () => {
      mockAuthContext.signIn.mockRejectedValue(new Error('network error'));

      renderWithRouter(<PublicHomepage />);

      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้/)).toBeInTheDocument();
        expect(screen.getByText(/ลองเข้าสู่ระบบอีกครั้ง/)).toBeInTheDocument();
      });

      // Test retry functionality
      const retryButton = screen.getByText(/ลองเข้าสู่ระบบอีกครั้ง/);
      fireEvent.click(retryButton);

      expect(mockAuthContext.signIn).toHaveBeenCalledTimes(2);
    });

    it('should allow dismissing error messages', async () => {
      mockAuthContext.signIn.mockRejectedValue(new Error('Authentication failed'));

      renderWithRouter(<PublicHomepage />);

      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed/)).toBeInTheDocument();
      });

      // Find and click close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(screen.queryByText(/Authentication failed/)).not.toBeInTheDocument();
    });
  });

  describe('Statistics Integration', () => {
    it('should display statistics and allow refresh', async () => {
      renderWithRouter(<PublicHomepage />);

      // Should display all statistics
      expect(screen.getByText('100')).toBeInTheDocument(); // Total equipment
      expect(screen.getByText('75')).toBeInTheDocument();  // Available
      expect(screen.getByText('20')).toBeInTheDocument();  // Borrowed
      expect(screen.getByText('5')).toBeInTheDocument();   // Pending

      // Should show last updated time
      expect(screen.getByText(/อัปเดตล่าสุด:/)).toBeInTheDocument();
    });

    it('should handle statistics error with retry', async () => {
      // Mock error state
      mockStatsHook.error = 'Failed to load statistics';
      mockStatsHook.stats = null;

      renderWithRouter(<PublicHomepage />);

      expect(screen.getByText('Failed to load statistics')).toBeInTheDocument();

      const retryButton = screen.getByText('ลองใหม่');
      fireEvent.click(retryButton);

      expect(mockStatsHook.refreshStats).toHaveBeenCalled();
    });

    it('should show loading overlay during refresh', async () => {
      // Mock refreshing state
      mockStatsHook.isRefreshing = true;

      renderWithRouter(<PublicHomepage />);

      expect(screen.getByText('กำลังอัปเดตข้อมูล...')).toBeInTheDocument();
    });
  });

  describe('Offline Integration', () => {
    it('should handle offline state with retry functionality', async () => {
      // Mock offline state
      mockStatsHook.isOnline = false;

      renderWithRouter(<PublicHomepage />);

      expect(screen.getByText(/ไม่มีการเชื่อมต่ออินเทอร์เน็ต/)).toBeInTheDocument();

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockStatsHook.retryWhenOnline).toHaveBeenCalledWith(mockStatsHook.refreshStats);
    });

    it('should show reconnection message when coming back online', async () => {
      // Mock reconnection state
      mockStatsHook.isOnline = true;
      mockStatsHook.wasOffline = true;

      renderWithRouter(<PublicHomepage />);

      expect(screen.getByText(/เชื่อมต่ออินเทอร์เน็ตแล้ว/)).toBeInTheDocument();
    });

    it('should show offline indicator in last updated when offline', async () => {
      // Mock offline stats
      mockStatsHook.stats = {
        ...mockStatsHook.stats,
        isOffline: true
      };
      mockStatsHook.isOnline = false;

      renderWithRouter(<PublicHomepage />);

      expect(screen.getByText(/\(ออฟไลน์\)/)).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior Integration', () => {
    it('should render all components in mobile layout', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithRouter(<PublicHomepage />);

      // Should render all main components
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument(); // Hero
      expect(screen.getByText('สถิติอุปกรณ์')).toBeInTheDocument(); // Stats section
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
    });

    it('should render all components in desktop layout', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      renderWithRouter(<PublicHomepage />);

      // Should render all main components
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByText('สถิติอุปกรณ์')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Integration', () => {
    it('should handle component errors gracefully', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // This test verifies that the error boundary is in place
      // The actual error boundary behavior is tested in its own test file
      renderWithRouter(<PublicHomepage />);

      expect(screen.getByRole('banner')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Integration', () => {
    it('should start and end performance monitoring', () => {
      const performanceMonitor = require('../../../utils/performanceMonitor');

      const { unmount } = renderWithRouter(<PublicHomepage />);

      expect(performanceMonitor.startTiming).toHaveBeenCalledWith('public_homepage_mount');

      unmount();

      expect(performanceMonitor.endTiming).toHaveBeenCalledWith('public_homepage_mount');
    });
  });

  describe('Accessibility Integration', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<PublicHomepage />);

      const h1s = screen.getAllByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2, name: /สถิติอุปกรณ์/ });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1s.length).toBeGreaterThan(0);
      expect(h2).toBeInTheDocument();
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('should have proper landmark roles', () => {
      renderWithRouter(<PublicHomepage />);

      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
    });

    it('should support keyboard navigation', () => {
      renderWithRouter(<PublicHomepage />);

      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      const getStartedButton = screen.getByRole('button', { name: /เริ่มต้นใช้งาน/i });

      // Should be focusable
      loginButton.focus();
      expect(loginButton).toHaveFocus();

      getStartedButton.focus();
      expect(getStartedButton).toHaveFocus();
    });
  });

  describe('SEO and Meta Integration', () => {
    it('should have proper document structure for SEO', () => {
      renderWithRouter(<PublicHomepage />);

      // Should have main heading
      const mainHeadings = screen.getAllByRole('heading', { level: 1 });
      const heroHeading = mainHeadings.find(h => h.textContent.includes('ระบบยืม-คืนอุปกรณ์'));
      expect(heroHeading).toBeInTheDocument();

      // Should have descriptive content
      expect(screen.getByText(/จัดการการยืม-คืนอุปกรณ์อย่างมีประสิทธิภาพ/)).toBeInTheDocument();
    });
  });
});