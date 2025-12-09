/**
 * UnifiedNotificationCenter Component Tests
 * 
 * Tests for the UnifiedNotificationCenter component including:
 * - Tab switching
 * - Filter application
 * - Quick action execution
 * 
 * **Feature: unified-admin-notification-system**
 * **Validates: Requirements 3.1, 6.1, 5.3**
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UnifiedNotificationCenter from '../UnifiedNotificationCenter';

// Mock the hooks and services
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../../hooks/useAdminUnifiedNotifications', () => jest.fn());

jest.mock('../../../services/adminNotificationService', () => ({
  getHistory: jest.fn()
}));

// Import mocked modules
import { useAuth } from '../../../contexts/AuthContext';
import useAdminUnifiedNotifications from '../../../hooks/useAdminUnifiedNotifications';
import { getHistory } from '../../../services/adminNotificationService';

// Helper to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Mock notification data
const mockActionItems = [
  {
    id: 'user_registration_1',
    title: 'ผู้ใช้ใหม่สมัครสมาชิก',
    description: 'John Doe',
    sourceType: 'user_registration',
    sourceId: 'user1',
    category: 'users',
    priority: 'medium',
    isRead: false,
    icon: '👤',
    iconBg: 'bg-green-100 text-green-600',
    createdAt: new Date(),
    quickActions: [
      { label: 'อนุมัติ', action: 'approve', variant: 'primary' },
      { label: 'ปฏิเสธ', action: 'reject', variant: 'danger' }
    ]
  },
  {
    id: 'loan_request_1',
    title: 'คำขอยืมอุปกรณ์ใหม่',
    description: 'Jane ขอยืม Laptop',
    sourceType: 'loan_request',
    sourceId: 'loan1',
    category: 'loans',
    priority: 'high',
    isRead: false,
    icon: '📋',
    iconBg: 'bg-blue-100 text-blue-600',
    createdAt: new Date(),
    quickActions: [
      { label: 'อนุมัติ', action: 'approve', variant: 'primary' },
      { label: 'ปฏิเสธ', action: 'reject', variant: 'danger' }
    ]
  }
];

const mockPersonalNotifications = [
  {
    id: 'personal_1',
    title: 'ระบบแจ้งเตือน',
    description: 'มีการอัพเดทระบบใหม่',
    sourceType: 'personal',
    category: 'system',
    priority: 'low',
    isRead: true,
    icon: '🔔',
    iconBg: 'bg-gray-100 text-gray-600',
    createdAt: new Date(),
    quickActions: []
  }
];

const mockCounts = {
  total: 3,
  unread: 2,
  actionItems: 2,
  personal: 1,
  users: 1,
  loans: 1,
  overdue: 0,
  reservations: 0
};

describe('UnifiedNotificationCenter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      user: { uid: 'admin123' },
      isAdmin: true
    });

    getHistory.mockResolvedValue({ items: [], lastDoc: null });
  });

  describe('Tab Switching', () => {
    beforeEach(() => {
      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: [...mockActionItems, ...mockPersonalNotifications],
        actionItems: mockActionItems,
        personalNotifications: mockPersonalNotifications,
        counts: mockCounts,
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        executeQuickAction: jest.fn().mockResolvedValue({ success: true }),
        filter: { tab: 'action', category: 'all', priority: 'all', searchTerm: '' },
        setFilter: jest.fn(),
        setSearchTerm: jest.fn(),
        loading: false,
        error: null,
        loadMore: jest.fn(),
        hasMore: false
      });
    });

    it('should render all three tabs', () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      expect(screen.getByText('งานรอดำเนินการ')).toBeInTheDocument();
      expect(screen.getByText('แจ้งเตือนส่วนตัว')).toBeInTheDocument();
      expect(screen.getByText('ประวัติ')).toBeInTheDocument();
    });

    it('should show action items tab by default', () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      // Action items should be visible
      expect(screen.getByText('ผู้ใช้ใหม่สมัครสมาชิก')).toBeInTheDocument();
      expect(screen.getByText('คำขอยืมอุปกรณ์ใหม่')).toBeInTheDocument();
    });

    it('should switch to personal notifications tab when clicked', async () => {
      const mockSetFilter = jest.fn();
      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: mockPersonalNotifications,
        actionItems: mockActionItems,
        personalNotifications: mockPersonalNotifications,
        counts: mockCounts,
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        executeQuickAction: jest.fn(),
        filter: { tab: 'personal', category: 'all', priority: 'all', searchTerm: '' },
        setFilter: mockSetFilter,
        setSearchTerm: jest.fn(),
        loading: false,
        error: null,
        loadMore: jest.fn(),
        hasMore: false
      });

      renderWithRouter(<UnifiedNotificationCenter />);
      
      const personalTab = screen.getByText('แจ้งเตือนส่วนตัว');
      fireEvent.click(personalTab);
      
      await waitFor(() => {
        expect(mockSetFilter).toHaveBeenCalled();
      });
    });

    it('should show tab counts', () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      // Should show count badges on tabs
      expect(screen.getByText('2')).toBeInTheDocument(); // Action items count
    });
  });


  describe('Filter Application', () => {
    let mockSetFilter;
    let mockSetSearchTerm;

    beforeEach(() => {
      mockSetFilter = jest.fn();
      mockSetSearchTerm = jest.fn();

      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: mockActionItems,
        actionItems: mockActionItems,
        personalNotifications: mockPersonalNotifications,
        counts: mockCounts,
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        executeQuickAction: jest.fn().mockResolvedValue({ success: true }),
        filter: { tab: 'action', category: 'all', priority: 'all', searchTerm: '' },
        setFilter: mockSetFilter,
        setSearchTerm: mockSetSearchTerm,
        loading: false,
        error: null,
        loadMore: jest.fn(),
        hasMore: false
      });
    });

    it('should render search input', () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      const searchInput = screen.getByPlaceholderText('ค้นหาการแจ้งเตือน...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should call setSearchTerm when typing in search', async () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      const searchInput = screen.getByPlaceholderText('ค้นหาการแจ้งเตือน...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      
      await waitFor(() => {
        expect(mockSetSearchTerm).toHaveBeenCalledWith('test search');
      });
    });

    it('should render filter toggle button', () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      expect(screen.getByText('ตัวกรอง')).toBeInTheDocument();
    });

    it('should show filter options when filter button is clicked', () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      const filterButton = screen.getByText('ตัวกรอง');
      fireEvent.click(filterButton);
      
      // Priority filter options should appear
      expect(screen.getByText('ความสำคัญ')).toBeInTheDocument();
      // Use getAllByText since these texts may appear multiple times
      const allButtons = screen.getAllByText('ทั้งหมด');
      expect(allButtons.length).toBeGreaterThan(0);
      expect(screen.getByText('ด่วนมาก')).toBeInTheDocument();
      // "ด่วน" may appear multiple times (in filter and in notification badges)
      const urgentButtons = screen.getAllByText('ด่วน');
      expect(urgentButtons.length).toBeGreaterThan(0);
    });

    it('should call setFilter when priority filter is clicked', async () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      // Open filters
      const filterButton = screen.getByText('ตัวกรอง');
      fireEvent.click(filterButton);
      
      // Click on urgent priority
      const urgentButton = screen.getByText('ด่วนมาก');
      fireEvent.click(urgentButton);
      
      await waitFor(() => {
        expect(mockSetFilter).toHaveBeenCalledWith(expect.objectContaining({
          priority: 'urgent'
        }));
      });
    });

    it('should filter by category when summary card is clicked', async () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      // Click on users summary card
      const usersCard = screen.getByText('ผู้ใช้รออนุมัติ');
      fireEvent.click(usersCard);
      
      await waitFor(() => {
        expect(mockSetFilter).toHaveBeenCalledWith(expect.objectContaining({
          category: 'users'
        }));
      });
    });
  });

  describe('Quick Action Execution', () => {
    let mockExecuteQuickAction;

    beforeEach(() => {
      mockExecuteQuickAction = jest.fn().mockResolvedValue({ success: true });

      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: mockActionItems,
        actionItems: mockActionItems,
        personalNotifications: mockPersonalNotifications,
        counts: mockCounts,
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        executeQuickAction: mockExecuteQuickAction,
        filter: { tab: 'action', category: 'all', priority: 'all', searchTerm: '' },
        setFilter: jest.fn(),
        setSearchTerm: jest.fn(),
        loading: false,
        error: null,
        loadMore: jest.fn(),
        hasMore: false
      });
    });

    it('should render quick action buttons for action items', () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      // Should show approve and reject buttons
      const approveButtons = screen.getAllByText('อนุมัติ');
      const rejectButtons = screen.getAllByText('ปฏิเสธ');
      
      expect(approveButtons.length).toBeGreaterThan(0);
      expect(rejectButtons.length).toBeGreaterThan(0);
    });

    it('should call executeQuickAction when approve button is clicked', async () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      const approveButtons = screen.getAllByText('อนุมัติ');
      fireEvent.click(approveButtons[0]);
      
      await waitFor(() => {
        expect(mockExecuteQuickAction).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'user_registration_1' }),
          'approve'
        );
      });
    });

    it('should show reject modal when reject button is clicked', async () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      const rejectButtons = screen.getAllByText('ปฏิเสธ');
      fireEvent.click(rejectButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('ยืนยันการปฏิเสธ')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('เหตุผลในการปฏิเสธ...')).toBeInTheDocument();
      });
    });

    it('should call executeQuickAction with reason when reject is confirmed', async () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      // Click reject button
      const rejectButtons = screen.getAllByText('ปฏิเสธ');
      fireEvent.click(rejectButtons[0]);
      
      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText('ยืนยันการปฏิเสธ')).toBeInTheDocument();
      });
      
      // Enter reason
      const reasonInput = screen.getByPlaceholderText('เหตุผลในการปฏิเสธ...');
      fireEvent.change(reasonInput, { target: { value: 'ข้อมูลไม่ครบถ้วน' } });
      
      // Confirm reject
      const confirmButton = screen.getByText('ยืนยันปฏิเสธ');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockExecuteQuickAction).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'user_registration_1' }),
          'reject',
          'ข้อมูลไม่ครบถ้วน'
        );
      });
    });

    it('should close reject modal when cancel is clicked', async () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      // Click reject button
      const rejectButtons = screen.getAllByText('ปฏิเสธ');
      fireEvent.click(rejectButtons[0]);
      
      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText('ยืนยันการปฏิเสธ')).toBeInTheDocument();
      });
      
      // Click cancel
      const cancelButton = screen.getByText('ยกเลิก');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('ยืนยันการปฏิเสธ')).not.toBeInTheDocument();
      });
    });
  });

  describe('Summary Cards', () => {
    beforeEach(() => {
      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: mockActionItems,
        actionItems: mockActionItems,
        personalNotifications: mockPersonalNotifications,
        counts: mockCounts,
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        executeQuickAction: jest.fn(),
        filter: { tab: 'action', category: 'all', priority: 'all', searchTerm: '' },
        setFilter: jest.fn(),
        setSearchTerm: jest.fn(),
        loading: false,
        error: null,
        loadMore: jest.fn(),
        hasMore: false
      });
    });

    it('should render all summary cards', () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      expect(screen.getByText('ผู้ใช้รออนุมัติ')).toBeInTheDocument();
      expect(screen.getByText('คำขอยืมรออนุมัติ')).toBeInTheDocument();
      expect(screen.getByText('เกินกำหนดคืน')).toBeInTheDocument();
      expect(screen.getByText('การจองรออนุมัติ')).toBeInTheDocument();
    });

    it('should display correct counts in summary cards', () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      // Users count should be 1
      const usersCard = screen.getByText('ผู้ใช้รออนุมัติ').closest('button');
      expect(usersCard).toHaveTextContent('1');
      
      // Loans count should be 1
      const loansCard = screen.getByText('คำขอยืมรออนุมัติ').closest('button');
      expect(loansCard).toHaveTextContent('1');
    });
  });

  describe('Mark as Read', () => {
    let mockMarkAllAsRead;

    beforeEach(() => {
      mockMarkAllAsRead = jest.fn();

      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: mockActionItems,
        actionItems: mockActionItems,
        personalNotifications: mockPersonalNotifications,
        counts: { ...mockCounts, unread: 2 },
        markAsRead: jest.fn(),
        markAllAsRead: mockMarkAllAsRead,
        executeQuickAction: jest.fn(),
        filter: { tab: 'action', category: 'all', priority: 'all', searchTerm: '' },
        setFilter: jest.fn(),
        setSearchTerm: jest.fn(),
        loading: false,
        error: null,
        loadMore: jest.fn(),
        hasMore: false
      });
    });

    it('should render mark all as read button when there are unread items', () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      expect(screen.getByText('อ่านทั้งหมด')).toBeInTheDocument();
    });

    it('should call markAllAsRead when button is clicked', async () => {
      renderWithRouter(<UnifiedNotificationCenter />);
      
      const markAllButton = screen.getByText('อ่านทั้งหมด');
      fireEvent.click(markAllButton);
      
      await waitFor(() => {
        expect(mockMarkAllAsRead).toHaveBeenCalledWith('action');
      });
    });
  });

  describe('Loading and Empty States', () => {
    it('should show loading state', () => {
      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: [],
        actionItems: [],
        personalNotifications: [],
        counts: { total: 0, unread: 0, actionItems: 0, personal: 0, users: 0, loans: 0, overdue: 0, reservations: 0 },
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        executeQuickAction: jest.fn(),
        filter: { tab: 'action', category: 'all', priority: 'all', searchTerm: '' },
        setFilter: jest.fn(),
        setSearchTerm: jest.fn(),
        loading: true,
        error: null,
        loadMore: jest.fn(),
        hasMore: false
      });

      renderWithRouter(<UnifiedNotificationCenter />);
      
      expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();
    });

    it('should show empty state when no notifications', () => {
      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: [],
        actionItems: [],
        personalNotifications: [],
        counts: { total: 0, unread: 0, actionItems: 0, personal: 0, users: 0, loans: 0, overdue: 0, reservations: 0 },
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        executeQuickAction: jest.fn(),
        filter: { tab: 'action', category: 'all', priority: 'all', searchTerm: '' },
        setFilter: jest.fn(),
        setSearchTerm: jest.fn(),
        loading: false,
        error: null,
        loadMore: jest.fn(),
        hasMore: false
      });

      renderWithRouter(<UnifiedNotificationCenter />);
      
      expect(screen.getByText('ไม่มีการแจ้งเตือน')).toBeInTheDocument();
    });
  });

  describe('Access Control', () => {
    it('should show access denied for non-admin users', () => {
      useAuth.mockReturnValue({
        user: { uid: 'user123' },
        isAdmin: false
      });

      useAdminUnifiedNotifications.mockReturnValue({
        allNotifications: [],
        actionItems: [],
        personalNotifications: [],
        counts: { total: 0, unread: 0, actionItems: 0, personal: 0, users: 0, loans: 0, overdue: 0, reservations: 0 },
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        executeQuickAction: jest.fn(),
        filter: { tab: 'action', category: 'all', priority: 'all', searchTerm: '' },
        setFilter: jest.fn(),
        setSearchTerm: jest.fn(),
        loading: false,
        error: null,
        loadMore: jest.fn(),
        hasMore: false
      });

      renderWithRouter(<UnifiedNotificationCenter />);
      
      expect(screen.getByText('คุณไม่มีสิทธิ์เข้าถึงหน้านี้')).toBeInTheDocument();
    });
  });
});
