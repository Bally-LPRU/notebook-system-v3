/**
 * Unit tests for AdminSettingsPage
 * Tests tab navigation, admin access control, and loading states
 * 
 * Requirements: 1.1, 1.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminSettingsPage from '../AdminSettingsPage';

// Mock the contexts
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../../../contexts/SettingsContext', () => ({
  useSettings: jest.fn()
}));

// Mock Layout component
jest.mock('../../../layout', () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>
}));

// Mock Navigate component
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, replace }) => {
    mockNavigate(to, replace);
    return <div data-testid="navigate-redirect">Redirecting to {to}</div>;
  }
}));

const { useAuth } = require('../../../../contexts/AuthContext');
const { useSettings } = require('../../../../contexts/SettingsContext');

describe('AdminSettingsPage', () => {
  const mockAdminUser = {
    uid: 'admin-123',
    email: 'admin@example.com',
    displayName: 'Admin User'
  };

  const mockAdminProfile = {
    uid: 'admin-123',
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: 'admin',
    status: 'approved'
  };

  const mockSettings = {
    maxLoanDuration: 14,
    maxAdvanceBookingDays: 30,
    defaultCategoryLimit: 3,
    discordWebhookUrl: null,
    discordEnabled: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();

    // Default mock for settings
    useSettings.mockReturnValue({
      settings: mockSettings,
      loading: false,
      error: null,
      updateSetting: jest.fn(),
      updateMultipleSettings: jest.fn(),
      refreshSettings: jest.fn(),
      getSetting: jest.fn((key, defaultValue) => mockSettings[key] || defaultValue)
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: mockAdminUser,
        userProfile: mockAdminProfile,
        loading: false,
        authInitialized: true,
        isAdmin: true,
        isAuthenticated: true,
        isApproved: true
      });
    });

    it('should render all tab buttons', () => {
      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Verify all tabs are rendered by finding buttons with role="button"
      const tabs = screen.getAllByRole('button');
      const tabTexts = tabs.map(tab => tab.textContent);
      
      expect(tabTexts).toContain('ทั่วไป');
      expect(tabTexts).toContain('กฎการยืม');
      expect(tabTexts).toContain('วันปิดทำการ');
      expect(tabTexts).toContain('จำกัดการยืม');
      expect(tabTexts).toContain('การแจ้งเตือน');
      expect(tabTexts).toContain('บันทึกการเปลี่ยนแปลง');
    });

    it('should have "ทั่วไป" tab active by default', () => {
      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Find the tab button with aria-current="page"
      const activeTab = screen.getByRole('button', { current: 'page' });
      expect(activeTab.textContent).toContain('ทั่วไป');
      expect(activeTab).toHaveClass('border-blue-500', 'text-blue-600');
    });

    it('should switch tabs when clicked', () => {
      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Click on "กฎการยืม" tab
      const loanRulesTab = screen.getByText('กฎการยืม');
      fireEvent.click(loanRulesTab);

      // Verify tab is now active
      const loanRulesButton = loanRulesTab.closest('button');
      expect(loanRulesButton).toHaveClass('border-blue-500', 'text-blue-600');

      // Verify general tab is no longer active
      const generalTab = screen.getByText('ทั่วไป').closest('button');
      expect(generalTab).not.toHaveClass('border-blue-500', 'text-blue-600');
    });

    it('should update tab content when switching tabs', () => {
      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Initially shows general settings placeholder
      expect(screen.getByText('การตั้งค่าทั่วไปของระบบ')).toBeInTheDocument();

      // Click on "วันปิดทำการ" tab
      fireEvent.click(screen.getByText('วันปิดทำการ'));

      // Verify content changed - should show the loading state or the form
      expect(screen.getByText(/กำลังโหลดวันปิดทำการ|เพิ่มวันปิดทำการ/)).toBeInTheDocument();
      expect(screen.queryByText('การตั้งค่าทั่วไปของระบบ')).not.toBeInTheDocument();
    });

    it('should allow switching between multiple tabs', () => {
      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Switch to different tabs
      fireEvent.click(screen.getByText('การแจ้งเตือน'));
      expect(screen.getByText('Discord webhook และข้อความแจ้งเตือน')).toBeInTheDocument();

      fireEvent.click(screen.getByText('บันทึกการเปลี่ยนแปลง'));
      expect(screen.getByText('ประวัติการแก้ไขการตั้งค่า')).toBeInTheDocument();
    });
  });

  describe('Admin Access Control', () => {
    it('should allow admin users to access the page', () => {
      useAuth.mockReturnValue({
        user: mockAdminUser,
        userProfile: mockAdminProfile,
        loading: false,
        authInitialized: true,
        isAdmin: true,
        isAuthenticated: true,
        isApproved: true
      });

      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Verify page content is rendered
      expect(screen.getByText('การตั้งค่าระบบ')).toBeInTheDocument();
      expect(screen.getByText(/จัดการการตั้งค่าต่างๆ ของระบบยืม-คืนอุปกรณ์/)).toBeInTheDocument();
      
      // Verify no redirect occurred
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should redirect non-admin users to dashboard', () => {
      useAuth.mockReturnValue({
        user: { uid: 'user-123', email: 'user@example.com' },
        userProfile: { role: 'user', status: 'approved' },
        loading: false,
        authInitialized: true,
        isAdmin: false,
        isAuthenticated: true,
        isApproved: true
      });

      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Verify redirect occurred
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', true);
      
      // Verify page content is not rendered
      expect(screen.queryByText('การตั้งค่าระบบ')).not.toBeInTheDocument();
    });

    it('should display admin info banner with user details', () => {
      useAuth.mockReturnValue({
        user: mockAdminUser,
        userProfile: mockAdminProfile,
        loading: false,
        authInitialized: true,
        isAdmin: true,
        isAuthenticated: true,
        isApproved: true
      });

      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Verify admin info banner is displayed
      expect(screen.getByText(/คุณกำลังเข้าถึงหน้าการตั้งค่าในฐานะผู้ดูแลระบบ/)).toBeInTheDocument();
      expect(screen.getByText(/Admin User/)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while checking authentication', () => {
      useAuth.mockReturnValue({
        user: null,
        userProfile: null,
        loading: true,
        authInitialized: false,
        isAdmin: false,
        isAuthenticated: false,
        isApproved: false
      });

      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Verify loading state is shown
      expect(screen.getByText('กำลังตรวจสอบสิทธิ์...')).toBeInTheDocument();
      
      // Verify page content is not rendered
      expect(screen.queryByText('การตั้งค่าระบบ')).not.toBeInTheDocument();
    });

    it('should show loading spinner while fetching settings', () => {
      useAuth.mockReturnValue({
        user: mockAdminUser,
        userProfile: mockAdminProfile,
        loading: false,
        authInitialized: true,
        isAdmin: true,
        isAuthenticated: true,
        isApproved: true
      });

      useSettings.mockReturnValue({
        settings: null,
        loading: true,
        error: null,
        updateSetting: jest.fn(),
        updateMultipleSettings: jest.fn(),
        refreshSettings: jest.fn(),
        getSetting: jest.fn()
      });

      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Verify settings loading state is shown
      expect(screen.getByText('กำลังโหลดการตั้งค่า...')).toBeInTheDocument();
    });

    it('should show error message when settings fail to load', () => {
      useAuth.mockReturnValue({
        user: mockAdminUser,
        userProfile: mockAdminProfile,
        loading: false,
        authInitialized: true,
        isAdmin: true,
        isAuthenticated: true,
        isApproved: true
      });

      const mockError = new Error('Failed to load settings');
      useSettings.mockReturnValue({
        settings: null,
        loading: false,
        error: mockError,
        updateSetting: jest.fn(),
        updateMultipleSettings: jest.fn(),
        refreshSettings: jest.fn(),
        getSetting: jest.fn()
      });

      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Verify error message is shown
      expect(screen.getByText('เกิดข้อผิดพลาดในการโหลดการตั้งค่า')).toBeInTheDocument();
      expect(screen.getByText('Failed to load settings')).toBeInTheDocument();
    });

    it('should render page content after loading completes', () => {
      useAuth.mockReturnValue({
        user: mockAdminUser,
        userProfile: mockAdminProfile,
        loading: false,
        authInitialized: true,
        isAdmin: true,
        isAuthenticated: true,
        isApproved: true
      });

      useSettings.mockReturnValue({
        settings: mockSettings,
        loading: false,
        error: null,
        updateSetting: jest.fn(),
        updateMultipleSettings: jest.fn(),
        refreshSettings: jest.fn(),
        getSetting: jest.fn()
      });

      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Verify page content is rendered
      expect(screen.getByText('การตั้งค่าระบบ')).toBeInTheDocument();
      expect(screen.queryByText('กำลังตรวจสอบสิทธิ์...')).not.toBeInTheDocument();
      expect(screen.queryByText('กำลังโหลดการตั้งค่า...')).not.toBeInTheDocument();
    });
  });

  describe('Page Layout', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: mockAdminUser,
        userProfile: mockAdminProfile,
        loading: false,
        authInitialized: true,
        isAdmin: true,
        isAuthenticated: true,
        isApproved: true
      });
    });

    it('should render page header with title and description', () => {
      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      expect(screen.getByText('การตั้งค่าระบบ')).toBeInTheDocument();
      expect(screen.getByText('จัดการการตั้งค่าต่างๆ ของระบบยืม-คืนอุปกรณ์')).toBeInTheDocument();
    });

    it('should render help text section', () => {
      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      expect(screen.getByText('คำแนะนำ')).toBeInTheDocument();
      expect(screen.getByText(/การเปลี่ยนแปลงการตั้งค่าจะมีผลทันทีกับระบบ/)).toBeInTheDocument();
    });

    it('should wrap content in Layout component', () => {
      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });
  });
});
