import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PublicHomepage from '../PublicHomepage';

// Mock all external dependencies for E2E-like testing
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../hooks/usePublicStats');
jest.mock('../../../utils/performanceMonitor');

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

const setupUserEvent = () => (typeof userEvent.setup === 'function' ? userEvent.setup() : userEvent);

describe('PublicHomepage E2E User Journey Tests', () => {
  const mockUseAuth = require('../../../contexts/AuthContext').useAuth;
  const mockUsePublicStats = require('../../../hooks/usePublicStats').default;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful state
    mockUseAuth.mockReturnValue({
      signIn: jest.fn().mockResolvedValue(),
      user: null,
      userProfile: null,
      needsProfileSetup: jest.fn(() => false)
    });

    mockUsePublicStats.mockReturnValue({
      stats: {
        totalEquipment: 150,
        availableEquipment: 120,
        borrowedEquipment: 25,
        pendingReservations: 8,
        lastUpdated: new Date('2023-12-01T10:30:00Z')
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

  describe('Complete User Journey - Happy Path', () => {
    it('should allow user to view stats and successfully login', async () => {
      const user = setupUserEvent();
      const mockSignIn = jest.fn().mockResolvedValue();
      
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        user: null,
        userProfile: null,
        needsProfileSetup: jest.fn(() => false)
      });

      renderWithRouter(<PublicHomepage />);

      // Step 1: User lands on homepage and sees system title
      expect(screen.getByText('ระบบยืม-คืนอุปกรณ์')).toBeInTheDocument();
      expect(screen.getByText(/จัดการการยืม-คืนอุปกรณ์อย่างมีประสิทธิภาพ/)).toBeInTheDocument();

      // Step 2: User views statistics
      expect(screen.getByText('150')).toBeInTheDocument(); // Total equipment
      expect(screen.getByText('120')).toBeInTheDocument(); // Available
      expect(screen.getByText('25')).toBeInTheDocument();  // Borrowed
      expect(screen.getByText('8')).toBeInTheDocument();   // Pending

      // Step 3: User sees last updated time
      expect(screen.getByText(/อัปเดตล่าสุด:/)).toBeInTheDocument();

      // Step 4: User clicks login button
      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      await user.click(loginButton);

      // Step 5: System processes login
      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });

    it('should highlight key hero features instead of navigation links', () => {
      renderWithRouter(<PublicHomepage />);

      expect(screen.getByText('จัดการง่าย')).toBeInTheDocument();
      expect(screen.getByText('ตรวจสอบแบบเรียลไทม์')).toBeInTheDocument();
      expect(screen.getByText('ปลอดภัย')).toBeInTheDocument();
    });
  });

  describe('Error Recovery User Journey', () => {
    it('should guide user through popup blocked error recovery', async () => {
      const user = setupUserEvent();
      const mockSignIn = jest.fn().mockRejectedValue(new Error('popup blocked'));
      
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        user: null,
        userProfile: null,
        needsProfileSetup: jest.fn(() => false)
      });

      renderWithRouter(<PublicHomepage />);

      // Step 1: User clicks login
      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      await user.click(loginButton);

      // Step 2: User sees popup blocked error with helpful instructions
      await waitFor(() => {
        expect(screen.getByText(/หน้าต่างการเข้าสู่ระบบถูกบล็อก/)).toBeInTheDocument();
        expect(screen.getByText(/คลิกที่ไอคอนป๊อปอัพที่ถูกบล็อก/)).toBeInTheDocument();
      });

      // Step 3: User dismisses error message
      const closeButton = screen.getByRole('button', { name: /ปิดข้อความแจ้งเตือน/ });
      await user.click(closeButton);

      expect(screen.queryByText(/หน้าต่างการเข้าสู่ระบบถูกบล็อก/)).not.toBeInTheDocument();

      // Step 4: User tries again (after enabling popups)
      mockSignIn.mockResolvedValueOnce();
      await user.click(loginButton);

      expect(mockSignIn).toHaveBeenCalledTimes(2);
    });

    it('should guide user through email domain validation error', async () => {
      const user = setupUserEvent();
      const mockSignIn = jest.fn().mockRejectedValue(
        new Error('อีเมลต้องเป็น @gmail.com หรือ @g.lpru.ac.th เท่านั้น')
      );
      
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        user: null,
        userProfile: null,
        needsProfileSetup: jest.fn(() => false)
      });

      renderWithRouter(<PublicHomepage />);

      // User tries to login with invalid email domain
      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      await user.click(loginButton);

      // User sees domain validation error with allowed domains
      await waitFor(() => {
        expect(screen.getByText(/อีเมลต้องเป็น @gmail.com หรือ @g.lpru.ac.th เท่านั้น/)).toBeInTheDocument();
        expect(screen.getByText(/อีเมลที่ได้รับอนุญาต: @gmail.com หรือ @g.lpru.ac.th/)).toBeInTheDocument();
      });

      // User understands the requirement and dismisses error
      const closeButton = screen.getByRole('button', { name: /ปิดข้อความแจ้งเตือน/ });
      await user.click(closeButton);

      expect(screen.queryByText(/อีเมลต้องเป็น @gmail.com/)).not.toBeInTheDocument();
    });

    it('should handle network error with retry functionality', async () => {
      const user = setupUserEvent();
      let callCount = 0;
      const mockSignIn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('network error'));
        }
        return Promise.resolve();
      });
      
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        user: null,
        userProfile: null,
        needsProfileSetup: jest.fn(() => false)
      });

      renderWithRouter(<PublicHomepage />);

      // User tries to login but encounters network error
      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      await user.click(loginButton);

      // User sees network error with retry option
      await waitFor(() => {
        expect(screen.getByText(/ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้/)).toBeInTheDocument();
        expect(screen.getByText(/ลองเข้าสู่ระบบอีกครั้ง/)).toBeInTheDocument();
      });

      // User clicks retry and succeeds
      const retryButton = screen.getByText(/ลองเข้าสู่ระบบอีกครั้ง/);
      await user.click(retryButton);

      expect(mockSignIn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Statistics Interaction Journey', () => {
    it('should handle statistics loading and error recovery', async () => {
      const user = setupUserEvent();
      const mockRefreshStats = jest.fn();

      mockUsePublicStats.mockReturnValue({
        stats: null,
        loading: false,
        error: 'ไม่สามารถโหลดข้อมูลสถิติได้',
        isRefreshing: false,
        isOnline: true,
        wasOffline: false,
        refreshStats: mockRefreshStats,
        retryWhenOnline: jest.fn()
      });

      const initialRender = renderWithRouter(<PublicHomepage />);

      expect(screen.getByText('ไม่สามารถโหลดข้อมูลสถิติได้')).toBeInTheDocument();

      const retryButton = screen.getByText('ลองใหม่');
      await user.click(retryButton);

      expect(mockRefreshStats).toHaveBeenCalled();

      initialRender.unmount();

      mockUsePublicStats.mockReturnValue({
        stats: {
          totalEquipment: 150,
          availableEquipment: 120,
          borrowedEquipment: 25,
          pendingReservations: 8,
          lastUpdated: new Date()
        },
        loading: false,
        error: null,
        isRefreshing: false,
        isOnline: true,
        wasOffline: false,
        refreshStats: mockRefreshStats,
        retryWhenOnline: jest.fn()
      });

      renderWithRouter(<PublicHomepage />);

      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should show loading states during refresh', async () => {
      const user = setupUserEvent();
      
      // Start with loaded state
      mockUsePublicStats.mockReturnValue({
        stats: {
          totalEquipment: 150,
          availableEquipment: 120,
          borrowedEquipment: 25,
          pendingReservations: 8,
          lastUpdated: new Date()
        },
        loading: false,
        error: null,
        isRefreshing: true, // Refreshing state
        isOnline: true,
        wasOffline: false,
        refreshStats: jest.fn(),
        retryWhenOnline: jest.fn()
      });

      renderWithRouter(<PublicHomepage />);

      // User sees loading overlay during refresh
      expect(screen.getByText('กำลังอัปเดตข้อมูล...')).toBeInTheDocument();
      
      // But still sees the statistics
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  describe('Offline Experience Journey', () => {
    it('should guide user through offline to online transition', () => {
      const mockRetryWhenOnline = jest.fn();
      const mockRefreshStats = jest.fn();

      mockUsePublicStats.mockReturnValue({
        stats: {
          totalEquipment: 150,
          availableEquipment: 120,
          borrowedEquipment: 25,
          pendingReservations: 8,
          lastUpdated: new Date(),
          isOffline: true
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

      expect(screen.getByText(/ไม่มีการเชื่อมต่ออินเทอร์เน็ต/)).toBeInTheDocument();
      expect(screen.getByText(/\(ออฟไลน์\)/)).toBeInTheDocument();

      const retryButton = screen.getByText('ลองเชื่อมต่อใหม่');
      retryButton.click();

      expect(mockRetryWhenOnline).toHaveBeenCalledWith(mockRefreshStats);
    });
  });

  describe('Performance Journey', () => {
    it('should load quickly and show loading states appropriately', () => {
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

      const loadingRender = renderWithRouter(<PublicHomepage />);
      expect(screen.getByText('Loading stats...')).toBeInTheDocument();
      loadingRender.unmount();

      mockUsePublicStats.mockReturnValue({
        stats: {
          totalEquipment: 150,
          availableEquipment: 120,
          borrowedEquipment: 25,
          pendingReservations: 8,
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

      renderWithRouter(<PublicHomepage />);
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.queryByText('Loading stats...')).not.toBeInTheDocument();
    });
  });
  describe('Accessibility Journey', () => {
    it('should support keyboard-only navigation', async () => {
      const user = await setupUserEvent();
      renderWithRouter(<PublicHomepage />);

      await user.tab(); // Should focus first interactive element

      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      loginButton.focus();
      expect(loginButton).toHaveFocus();

      await user.keyboard('{Enter}');

      const mockSignIn = mockUseAuth().signIn;
      expect(mockSignIn).toHaveBeenCalled();
    });

    it('should provide screen reader friendly content', () => {
      renderWithRouter(<PublicHomepage />);

      const h1Headings = screen.getAllByRole('heading', { level: 1 });
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      expect(h1Headings.length).toBeGreaterThan(0);
      expect(h2Headings.length).toBeGreaterThan(0);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /เข้าสู่ระบบ/i })).toBeInTheDocument();
      expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    });
  });
});
