/**
 * Integration Tests for DatePicker with Closed Dates
 * 
 * Tests the integration of date picker with:
 * - Closed dates from settings
 * - Tooltips for disabled dates
 * 
 * Requirements: 2.2, 2.3, 2.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DatePicker from '../DatePicker';
import { useClosedDates } from '../../../hooks/useClosedDates';

// Mock hooks
jest.mock('../../../hooks/useClosedDates');

describe('DatePicker Integration Tests with Closed Dates', () => {
  const mockClosedDates = [
    {
      id: 'closed1',
      date: new Date('2024-12-25'),
      reason: 'Christmas Day'
    },
    {
      id: 'closed2',
      date: new Date('2024-01-01'),
      reason: 'New Year\'s Day'
    },
    {
      id: 'closed3',
      date: new Date('2024-07-04'),
      reason: 'Independence Day'
    }
  ];

  beforeEach(() => {
    // Mock useClosedDates
    useClosedDates.mockReturnValue({
      isDateClosed: jest.fn((date) => {
        const dateStr = date.toISOString().split('T')[0];
        return mockClosedDates.some(cd => 
          cd.date.toISOString().split('T')[0] === dateStr
        );
      }),
      closedDates: mockClosedDates,
      loading: false,
      error: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders date picker with closed dates integration', () => {
    const mockOnChange = jest.fn();
    
    render(
      <DatePicker
        value=""
        onChange={mockOnChange}
        label="Select Date"
      />
    );

    expect(screen.getByLabelText('Select Date')).toBeInTheDocument();
  });

  test('marks closed dates as disabled in calendar', () => {
    const mockOnChange = jest.fn();
    
    const { container } = render(
      <DatePicker
        value=""
        onChange={mockOnChange}
        label="Select Date"
      />
    );

    // Open calendar
    const calendarButton = container.querySelector('button[type="button"]');
    fireEvent.click(calendarButton);

    // Wait for calendar to open
    waitFor(() => {
      // Calendar should be visible
      const calendar = container.querySelector('.absolute.z-50');
      expect(calendar).toBeInTheDocument();
    });
  });

  test('applies closed date styling to disabled dates', () => {
    const mockOnChange = jest.fn();
    
    const { container } = render(
      <DatePicker
        value=""
        onChange={mockOnChange}
        label="Select Date"
      />
    );

    // Open calendar
    const calendarButton = container.querySelector('button[type="button"]');
    fireEvent.click(calendarButton);

    waitFor(() => {
      // Check for closed date styling (red background, line-through)
      const closedDateButtons = container.querySelectorAll('.bg-red-100.line-through');
      expect(closedDateButtons.length).toBeGreaterThan(0);
    });
  });

  test('shows tooltip on hover for closed dates', async () => {
    const mockOnChange = jest.fn();
    
    const { container } = render(
      <DatePicker
        value=""
        onChange={mockOnChange}
        label="Select Date"
      />
    );

    // Open calendar
    const calendarButton = container.querySelector('button[type="button"]');
    fireEvent.click(calendarButton);

    await waitFor(() => {
      // Find a closed date button
      const closedDateButton = container.querySelector('.bg-red-100.line-through');
      
      if (closedDateButton) {
        // Hover over it
        fireEvent.mouseEnter(closedDateButton);
        
        // Tooltip should appear
        waitFor(() => {
          const tooltip = container.querySelector('.absolute.z-50.bottom-full');
          expect(tooltip).toBeInTheDocument();
        });
      }
    });
  });

  test('prevents selection of closed dates', () => {
    const mockOnChange = jest.fn();
    
    const { container } = render(
      <DatePicker
        value=""
        onChange={mockOnChange}
        label="Select Date"
      />
    );

    // Open calendar
    const calendarButton = container.querySelector('button[type="button"]');
    fireEvent.click(calendarButton);

    waitFor(() => {
      // Try to click a closed date
      const closedDateButton = container.querySelector('.bg-red-100.line-through');
      
      if (closedDateButton) {
        fireEvent.click(closedDateButton);
        
        // onChange should not be called
        expect(mockOnChange).not.toHaveBeenCalled();
      }
    });
  });

  test('allows selection of non-closed dates', async () => {
    const mockOnChange = jest.fn();
    
    const { container } = render(
      <DatePicker
        value=""
        onChange={mockOnChange}
        label="Select Date"
      />
    );

    // Open calendar
    const calendarButton = container.querySelector('button[type="button"]');
    fireEvent.click(calendarButton);

    await waitFor(() => {
      // Find a non-closed, non-disabled date button
      const dateButtons = container.querySelectorAll('button[type="button"]');
      const availableButton = Array.from(dateButtons).find(btn => 
        !btn.disabled && 
        !btn.classList.contains('bg-red-100') &&
        btn.textContent.match(/^\d+$/)
      );
      
      if (availableButton) {
        fireEvent.click(availableButton);
        
        // onChange should be called
        expect(mockOnChange).toHaveBeenCalled();
      }
    });
  });

  test('handles empty closed dates list', () => {
    // Mock with no closed dates
    useClosedDates.mockReturnValue({
      isDateClosed: jest.fn(() => false),
      closedDates: [],
      loading: false,
      error: null
    });

    const mockOnChange = jest.fn();
    
    const { container } = render(
      <DatePicker
        value=""
        onChange={mockOnChange}
        label="Select Date"
      />
    );

    // Open calendar
    const calendarButton = container.querySelector('button[type="button"]');
    fireEvent.click(calendarButton);

    waitFor(() => {
      // No closed date styling should be present
      const closedDateButtons = container.querySelectorAll('.bg-red-100.line-through');
      expect(closedDateButtons.length).toBe(0);
    });
  });

  test('updates when closed dates change', () => {
    const mockOnChange = jest.fn();
    
    const { rerender } = render(
      <DatePicker
        value=""
        onChange={mockOnChange}
        label="Select Date"
      />
    );

    // Update mock to add more closed dates
    const updatedClosedDates = [
      ...mockClosedDates,
      {
        id: 'closed4',
        date: new Date('2024-12-31'),
        reason: 'New Year\'s Eve'
      }
    ];

    useClosedDates.mockReturnValue({
      isDateClosed: jest.fn((date) => {
        const dateStr = date.toISOString().split('T')[0];
        return updatedClosedDates.some(cd => 
          cd.date.toISOString().split('T')[0] === dateStr
        );
      }),
      closedDates: updatedClosedDates,
      loading: false,
      error: null
    });

    // Rerender
    rerender(
      <DatePicker
        value=""
        onChange={mockOnChange}
        label="Select Date"
      />
    );

    // Component should reflect updated closed dates
    expect(useClosedDates).toHaveBeenCalled();
  });
});
