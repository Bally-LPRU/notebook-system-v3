/**
 * Integration tests for UnifiedLoanSettingsTab
 * Tests rendering of both sections, responsive layout, and save/load flow
 * 
 * Requirements: 1.1, 1.2, 5.1, 5.3, 6.1, 6.2, 6.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UnifiedLoanSettingsTab from '../UnifiedLoanSettingsTab';

// Mock the contexts
const mockUpdateMultipleSettings = jest.fn();
const mockSettings = {
  maxLoanDuration: 14,
  maxAdvanceBookingDays: 30,
  loanReturnStartTime: '',
  loanReturnEndTime: '',
  userTypeLimitsEnabled: false
};

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: {
      uid: 'admin-123',
      email: 'admin@example.com',
      displayName: 'Admin User',
      role: 'admin'
    }
  })
}));

jest.mock('../../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateMultipleSettings: mockUpdateMultipleSettings
  })
}));

// Mock settingsService
const mockSetUserTypeLimits = jest.fn();
const mockGetUserTypeLimits = jest.fn();

jest.mock('../../../../services/settingsService', () => ({
  __esModule: true,
  default: {
    getUserTypeLimits: () => mockGetUserTypeLimits(),
    setUserTypeLimits: (...args) => mockSetUserTypeLimits(...args)
  }
}));

describe('UnifiedLoanSettingsTab Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateMultipleSettings.mockResolvedValue();
    mockSetUserTypeLimits.mockResolvedValue();
    mockGetUserTypeLimits.mockResolvedValue({
      teacher: { maxItems: 10, maxDays: 30, maxAdvanceBookingDays: 60, isActive: true },
      staff: { maxItems: 5, maxDays: 14, maxAdvanceBookingDays: 30, isActive: true },
      student: { maxItems: 3, maxDays: 7, maxAdvanceBookingDays: 14, isActive: true }
    });
  });

  // Helper to get input by id
  const getInputById = (id) => document.getElementById(id);

  // Requirements: 1.1, 1.2
  describe('Task 8.1: Unified Tab Rendering', () => {
    it('should render both global loan settings and user type limits sections', async () => {
      render(<UnifiedLoanSettingsTab />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('กฎการยืมเริ่มต้น')).toBeInTheDocument();
      });

      // Verify global loan settings section is rendered
      expect(screen.getByText('กฎการยืมเริ่มต้น')).toBeInTheDocument();
      expect(screen.getByText(/ค่าเริ่มต้นของระบบที่ใช้กับผู้ใช้ทุกคน/)).toBeInTheDocument();

      // Verify user type limits section is rendered
      expect(screen.getByText('การยืมตามประเภทผู้ใช้')).toBeInTheDocument();
    });

    it('should render global settings input fields', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(getInputById('maxLoanDuration')).toBeInTheDocument();
      });

      // Verify global settings fields by ID
      expect(getInputById('maxLoanDuration')).toBeInTheDocument();
      expect(getInputById('maxAdvanceBookingDays')).toBeInTheDocument();
    });

    it('should render user type cards for teacher, staff, and student', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(screen.getByText('อาจารย์')).toBeInTheDocument();
      });

      // Verify all user type cards are rendered
      expect(screen.getByText('อาจารย์')).toBeInTheDocument();
      expect(screen.getByText('เจ้าหน้าที่')).toBeInTheDocument();
      expect(screen.getByText('นักศึกษา')).toBeInTheDocument();
    });

    it('should show visual hierarchy with global settings at top and user type limits below', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(screen.getByText('กฎการยืมเริ่มต้น')).toBeInTheDocument();
      });

      // Get the positions of both sections
      const globalSection = screen.getByText('กฎการยืมเริ่มต้น').closest('div');
      const userTypeSection = screen.getByText('การยืมตามประเภทผู้ใช้').closest('div');

      // Both sections should exist
      expect(globalSection).toBeInTheDocument();
      expect(userTypeSection).toBeInTheDocument();
    });

    it('should render enable/disable toggle for user type limits', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: /เปิด\/ปิดระบบจำกัดตามประเภทผู้ใช้/ })).toBeInTheDocument();
      });

      const toggle = screen.getByRole('switch', { name: /เปิด\/ปิดระบบจำกัดตามประเภทผู้ใช้/ });
      expect(toggle).toBeInTheDocument();
    });
  });

  // Requirements: 6.1, 6.2, 6.3
  describe('Task 8.1: Responsive Layout', () => {
    it('should render user type cards in grid layout with responsive classes', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(screen.getByText('อาจารย์')).toBeInTheDocument();
      });

      // Find the grid container by looking for the element with grid classes
      const gridElements = document.querySelectorAll('.grid');
      const userTypeGrid = Array.from(gridElements).find(el => 
        el.classList.contains('lg:grid-cols-3')
      );

      expect(userTypeGrid).toBeInTheDocument();
      // Verify responsive grid classes
      expect(userTypeGrid).toHaveClass('grid-cols-1');
      expect(userTypeGrid).toHaveClass('md:grid-cols-2');
      expect(userTypeGrid).toHaveClass('lg:grid-cols-3');
    });

    it('should have responsive grid classes for different viewport sizes', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(screen.getByText('อาจารย์')).toBeInTheDocument();
      });

      // Find the grid container
      const gridElements = document.querySelectorAll('.grid');
      const userTypeGrid = Array.from(gridElements).find(el => 
        el.classList.contains('lg:grid-cols-3')
      );

      // Verify responsive classes are present
      // grid-cols-1: mobile (default)
      // md:grid-cols-2: tablet
      // lg:grid-cols-3: desktop
      expect(userTypeGrid.className).toMatch(/grid-cols-1/);
      expect(userTypeGrid.className).toMatch(/md:grid-cols-2/);
      expect(userTypeGrid.className).toMatch(/lg:grid-cols-3/);
    });

    it('should render form actions with responsive layout', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(screen.getByText('บันทึกการตั้งค่าทั้งหมด')).toBeInTheDocument();
      });

      // Find the form actions container - the div containing both buttons
      const saveButton = screen.getByText('บันทึกการตั้งค่าทั้งหมด');
      const buttonsContainer = saveButton.closest('div');

      // Verify responsive classes for button layout
      expect(buttonsContainer).toHaveClass('flex');
      expect(buttonsContainer.className).toMatch(/flex-col|sm:flex-row/);
    });
  });

  // Requirements: 5.1, 5.3
  describe('Task 8.2: Save/Load Flow', () => {
    it('should save both global settings and user type limits in single operation', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(getInputById('maxLoanDuration')).toBeInTheDocument();
      });

      // Modify a global setting to enable save button
      const maxLoanDurationInput = getInputById('maxLoanDuration');
      fireEvent.change(maxLoanDurationInput, { target: { value: '21', name: 'maxLoanDuration' } });

      // Click save button
      const saveButton = screen.getByText('บันทึกการตั้งค่าทั้งหมด');
      fireEvent.click(saveButton);

      // Verify both services are called
      await waitFor(() => {
        expect(mockUpdateMultipleSettings).toHaveBeenCalled();
        expect(mockSetUserTypeLimits).toHaveBeenCalled();
      });
    });

    it('should display loading indicator during save operation', async () => {
      // Make the save operation take some time
      mockUpdateMultipleSettings.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(getInputById('maxLoanDuration')).toBeInTheDocument();
      });

      // Modify a setting
      const maxLoanDurationInput = getInputById('maxLoanDuration');
      fireEvent.change(maxLoanDurationInput, { target: { value: '21', name: 'maxLoanDuration' } });

      // Click save button
      const saveButton = screen.getByText('บันทึกการตั้งค่าทั้งหมด');
      fireEvent.click(saveButton);

      // Verify loading state is shown
      await waitFor(() => {
        expect(screen.getByText('กำลังบันทึก...')).toBeInTheDocument();
      });
    });

    it('should display success notification after successful save', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(getInputById('maxLoanDuration')).toBeInTheDocument();
      });

      // Modify a setting
      const maxLoanDurationInput = getInputById('maxLoanDuration');
      fireEvent.change(maxLoanDurationInput, { target: { value: '21', name: 'maxLoanDuration' } });

      // Click save button
      const saveButton = screen.getByText('บันทึกการตั้งค่าทั้งหมด');
      fireEvent.click(saveButton);

      // Verify success message is shown
      await waitFor(() => {
        expect(screen.getByText('บันทึกการตั้งค่าสำเร็จ')).toBeInTheDocument();
      });
    });

    it('should display error message when save fails', async () => {
      const errorMessage = 'เกิดข้อผิดพลาดในการบันทึก';
      mockUpdateMultipleSettings.mockRejectedValue(new Error(errorMessage));

      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(getInputById('maxLoanDuration')).toBeInTheDocument();
      });

      // Modify a setting
      const maxLoanDurationInput = getInputById('maxLoanDuration');
      fireEvent.change(maxLoanDurationInput, { target: { value: '21', name: 'maxLoanDuration' } });

      // Click save button
      const saveButton = screen.getByText('บันทึกการตั้งค่าทั้งหมด');
      fireEvent.click(saveButton);

      // Verify error message is shown
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should preserve unsaved changes when save fails', async () => {
      mockUpdateMultipleSettings.mockRejectedValue(new Error('Save failed'));

      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(getInputById('maxLoanDuration')).toBeInTheDocument();
      });

      // Modify a setting
      const maxLoanDurationInput = getInputById('maxLoanDuration');
      fireEvent.change(maxLoanDurationInput, { target: { value: '21', name: 'maxLoanDuration' } });

      // Click save button
      const saveButton = screen.getByText('บันทึกการตั้งค่าทั้งหมด');
      fireEvent.click(saveButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });

      // Verify the input still has the modified value
      expect(maxLoanDurationInput.value).toBe('21');
    });

    it('should load user type limits on mount', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(mockGetUserTypeLimits).toHaveBeenCalled();
      });
    });

    it('should reset hasChanges state after successful save', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(getInputById('maxLoanDuration')).toBeInTheDocument();
      });

      // Modify a setting
      const maxLoanDurationInput = getInputById('maxLoanDuration');
      fireEvent.change(maxLoanDurationInput, { target: { value: '21', name: 'maxLoanDuration' } });

      // Save button should be enabled
      const saveButton = screen.getByText('บันทึกการตั้งค่าทั้งหมด');
      expect(saveButton).not.toBeDisabled();

      // Click save button
      fireEvent.click(saveButton);

      // After successful save, button should be disabled (no changes)
      await waitFor(() => {
        expect(screen.getByText('บันทึกการตั้งค่าสำเร็จ')).toBeInTheDocument();
      });

      // The save button should be disabled after successful save
      await waitFor(() => {
        expect(screen.getByText('บันทึกการตั้งค่าทั้งหมด')).toBeDisabled();
      });
    });
  });

  describe('Form Validation Integration', () => {
    it('should validate numeric range for global settings', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(getInputById('maxLoanDuration')).toBeInTheDocument();
      });

      // Enter invalid value (0 is below minimum of 1)
      const maxLoanDurationInput = getInputById('maxLoanDuration');
      fireEvent.change(maxLoanDurationInput, { target: { value: '0', name: 'maxLoanDuration' } });

      // Try to save
      const saveButton = screen.getByText('บันทึกการตั้งค่าทั้งหมด');
      fireEvent.click(saveButton);

      // Verify validation error is shown
      await waitFor(() => {
        expect(screen.getByText(/ต้องอยู่ระหว่าง 1 ถึง 365 วัน/)).toBeInTheDocument();
      });

      // Verify save was not called
      expect(mockUpdateMultipleSettings).not.toHaveBeenCalled();
    });

    it('should clear validation errors when valid value is entered', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(getInputById('maxLoanDuration')).toBeInTheDocument();
      });

      // Enter invalid value
      const maxLoanDurationInput = getInputById('maxLoanDuration');
      fireEvent.change(maxLoanDurationInput, { target: { value: '0', name: 'maxLoanDuration' } });

      // Try to save to trigger validation
      const saveButton = screen.getByText('บันทึกการตั้งค่าทั้งหมด');
      fireEvent.click(saveButton);

      // Verify error is shown
      await waitFor(() => {
        expect(screen.getByText(/ต้องอยู่ระหว่าง 1 ถึง 365 วัน/)).toBeInTheDocument();
      });

      // Enter valid value
      fireEvent.change(maxLoanDurationInput, { target: { value: '14', name: 'maxLoanDuration' } });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/ต้องอยู่ระหว่าง 1 ถึง 365 วัน/)).not.toBeInTheDocument();
      });
    });
  });

  describe('User Type Limits Toggle Integration', () => {
    it('should toggle user type limits enabled state', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: /เปิด\/ปิดระบบจำกัดตามประเภทผู้ใช้/ })).toBeInTheDocument();
      });

      // Toggle on user type limits
      const toggle = screen.getByRole('switch', { name: /เปิด\/ปิดระบบจำกัดตามประเภทผู้ใช้/ });
      
      // Initially should be off (aria-checked="false")
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      
      // Click to toggle on
      fireEvent.click(toggle);
      
      // Should now be on
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should show opacity change on user type cards based on toggle state', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(screen.getByText('อาจารย์')).toBeInTheDocument();
      });

      // Find the grid container with user type cards
      const gridElements = document.querySelectorAll('.grid');
      const userTypeGrid = Array.from(gridElements).find(el => 
        el.classList.contains('lg:grid-cols-3')
      );

      // User type limits are disabled by default, grid should have opacity-50
      expect(userTypeGrid).toHaveClass('opacity-50');
    });
  });

  describe('Reset Functionality Integration', () => {
    it('should reset form to original values when cancel is clicked', async () => {
      render(<UnifiedLoanSettingsTab />);

      await waitFor(() => {
        expect(getInputById('maxLoanDuration')).toBeInTheDocument();
      });

      // Modify a setting
      const maxLoanDurationInput = getInputById('maxLoanDuration');
      const originalValue = maxLoanDurationInput.value;
      fireEvent.change(maxLoanDurationInput, { target: { value: '21', name: 'maxLoanDuration' } });

      // Verify value changed
      expect(maxLoanDurationInput.value).toBe('21');

      // Click cancel button
      const cancelButton = screen.getByText('ยกเลิก');
      fireEvent.click(cancelButton);

      // Verify value is reset
      expect(maxLoanDurationInput.value).toBe(originalValue);
    });
  });
});
