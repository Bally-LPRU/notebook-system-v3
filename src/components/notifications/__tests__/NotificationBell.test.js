/**
 * NotificationBell Component Tests
 * 
 * Tests for the NotificationBell component including:
 * - Combined count display for admin users
 * - Dropdown item rendering
 * - Admin vs regular user behavior
 * 
 * **Feature: unified-admin-notification-system**
 * **Validates: Requirements 2.1, 2.2**
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotificationBell from '../NotificationBell';

// Mock the hooks and contexts
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../../contexts/NotificationContext', () => ({
  useNotificationContext: jest.fn()
}));

jest.mock('../../../hooks/useAdminUnifiedNotifications', () => jest.fn());

// Import mocked modules
import { useAuth } from '../../../contexts/AuthContext';
import { useNotificationContext } from '../../../contexts/NotificationContext';
import useAdminUnifiedNotifications from '../../../hooks/useAdminUnifiedNotifications';

// Helper to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NotificationBell Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Regular User Mode', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { uid: 'user123' },
        isAdmin: false
      });

      useNotificationContext.mockReturnValue({
        notifications: [
          { id: '1', title: 'Test Notification', message: 'Test message', isRead: false, createdAt: new Date() }
        ],
        unreadCount: 1,
        markAsRead: jest.fn()
      });

      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: [],
        counts: { unread: 0 },
        markAsRead: jest.fn(),
        loading: false
      });
    });

    it('should render notification bell for regular users', () => {
      renderWithRouter(<NotificationBell />);
      
      const bellButton = screen.getByRole('button', { name: /การแจ้งเตือน/i });
      expect(bellButton).toBeInTheDocument();
    });

    it('should display unread count badge for regular users', () => {
      renderWithRouter(<NotificationBell />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should show dropdown when clicked', () => {
      renderWithRouter(<NotificationBell />);
      
      const bellButton = screen.getByRole('button', { name: /การแจ้งเตือน/i });
      fireEvent.click(bellButton);
      
      expect(screen.getByText('การแจ้งเตือน')).toBeInTheDocument();
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });

    it('should link to notification-history for regular users', () => {
      renderWithRouter(<NotificationBell />);
      
      const bellButton = screen.getByRole('button', { name: /การแจ้งเตือน/i });
      fireEvent.click(bellButton);
      
      const viewAllLink = screen.getByText('ดูทั้งหมด');
      expect(viewAllLink).toHaveAttribute('href', '/notification-history');
    });
  });


  describe('Admin User Mode', () => {
    const mockAdminNotifications = [
      {
        id: 'user_registration_1',
        title: 'ผู้ใช้ใหม่สมัครสมาชิก',
        description: 'John Doe',
        sourceType: 'user_registration',
        priority: 'medium',
        isRead: false,
        icon: '👤',
        iconBg: 'bg-green-100 text-green-600',
        createdAt: new Date()
      },
      {
        id: 'loan_request_1',
        title: 'คำขอยืมอุปกรณ์ใหม่',
        description: 'Jane ขอยืม Laptop',
        sourceType: 'loan_request',
        priority: 'high',
        isRead: false,
        icon: '📋',
        iconBg: 'bg-blue-100 text-blue-600',
        createdAt: new Date()
      },
      {
        id: 'overdue_1',
        title: 'อุปกรณ์เกินกำหนดคืน',
        description: 'Bob ยืม Camera เกินกำหนด',
        sourceType: 'overdue_loan',
        priority: 'urgent',
        isRead: true,
        icon: '⚠️',
        iconBg: 'bg-red-100 text-red-600',
        createdAt: new Date()
      }
    ];

    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { uid: 'admin123' },
        isAdmin: true
      });

      useNotificationContext.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        markAsRead: jest.fn()
      });

      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: mockAdminNotifications,
        counts: { unread: 2, total: 3 },
        markAsRead: jest.fn(),
        loading: false
      });
    });

    it('should display combined unread count for admin users', () => {
      renderWithRouter(<NotificationBell />);
      
      // Should show 2 unread (from admin counts)
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show admin notifications in dropdown', () => {
      renderWithRouter(<NotificationBell />);
      
      const bellButton = screen.getByRole('button', { name: /การแจ้งเตือน/i });
      fireEvent.click(bellButton);
      
      expect(screen.getByText('ผู้ใช้ใหม่สมัครสมาชิก')).toBeInTheDocument();
      expect(screen.getByText('คำขอยืมอุปกรณ์ใหม่')).toBeInTheDocument();
    });

    it('should show type badges for admin notifications', () => {
      renderWithRouter(<NotificationBell />);
      
      const bellButton = screen.getByRole('button', { name: /การแจ้งเตือน/i });
      fireEvent.click(bellButton);
      
      // Should show "งาน" badges for action items
      const workBadges = screen.getAllByText('งาน');
      expect(workBadges.length).toBeGreaterThan(0);
    });

    it('should show priority badges for high/urgent notifications', () => {
      renderWithRouter(<NotificationBell />);
      
      const bellButton = screen.getByRole('button', { name: /การแจ้งเตือน/i });
      fireEvent.click(bellButton);
      
      // Should show priority badge for high priority
      expect(screen.getByText('ด่วน')).toBeInTheDocument();
    });

    it('should link to admin notifications for admin users', () => {
      renderWithRouter(<NotificationBell />);
      
      const bellButton = screen.getByRole('button', { name: /การแจ้งเตือน/i });
      fireEvent.click(bellButton);
      
      const viewAllLink = screen.getByText('ดูทั้งหมด');
      expect(viewAllLink).toHaveAttribute('href', '/admin/notifications');
    });

    it('should show icons for admin notifications', () => {
      renderWithRouter(<NotificationBell />);
      
      const bellButton = screen.getByRole('button', { name: /การแจ้งเตือน/i });
      fireEvent.click(bellButton);
      
      // Icons should be rendered
      expect(screen.getByText('👤')).toBeInTheDocument();
      expect(screen.getByText('📋')).toBeInTheDocument();
    });

    it('should show loading state when admin notifications are loading', () => {
      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: [],
        counts: { unread: 0 },
        markAsRead: jest.fn(),
        loading: true
      });

      renderWithRouter(<NotificationBell />);
      
      const bellButton = screen.getByRole('button', { name: /การแจ้งเตือน/i });
      fireEvent.click(bellButton);
      
      expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();
    });

    it('should call markAsRead when clicking unread notification', async () => {
      const mockMarkAsRead = jest.fn();
      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: mockAdminNotifications,
        counts: { unread: 2 },
        markAsRead: mockMarkAsRead,
        loading: false
      });

      renderWithRouter(<NotificationBell />);
      
      const bellButton = screen.getByRole('button', { name: /การแจ้งเตือน/i });
      fireEvent.click(bellButton);
      
      // Click on unread notification
      const notification = screen.getByText('ผู้ใช้ใหม่สมัครสมาชิก').closest('div[class*="cursor-pointer"]');
      fireEvent.click(notification);
      
      await waitFor(() => {
        expect(mockMarkAsRead).toHaveBeenCalledWith('user_registration_1', 'user_registration');
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no notifications', () => {
      useAuth.mockReturnValue({
        user: { uid: 'user123' },
        isAdmin: false
      });

      useNotificationContext.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        markAsRead: jest.fn()
      });

      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: [],
        counts: { unread: 0 },
        markAsRead: jest.fn(),
        loading: false
      });

      renderWithRouter(<NotificationBell />);
      
      const bellButton = screen.getByRole('button', { name: /การแจ้งเตือน/i });
      fireEvent.click(bellButton);
      
      expect(screen.getByText('ไม่มีการแจ้งเตือน')).toBeInTheDocument();
    });

    it('should not show badge when unread count is 0', () => {
      useAuth.mockReturnValue({
        user: { uid: 'user123' },
        isAdmin: false
      });

      useNotificationContext.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        markAsRead: jest.fn()
      });

      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: [],
        counts: { unread: 0 },
        markAsRead: jest.fn(),
        loading: false
      });

      renderWithRouter(<NotificationBell />);
      
      // Badge should not be present
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('Badge Display', () => {
    it('should show 99+ when count exceeds 99', () => {
      useAuth.mockReturnValue({
        user: { uid: 'admin123' },
        isAdmin: true
      });

      useNotificationContext.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        markAsRead: jest.fn()
      });

      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: [],
        counts: { unread: 150 },
        markAsRead: jest.fn(),
        loading: false
      });

      renderWithRouter(<NotificationBell />);
      
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });
});
