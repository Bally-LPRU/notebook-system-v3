/**
 * Integration Tests for ReservationForm with Settings
 * 
 * Tests the integration of reservation form with:
 * - Max advance booking days from settings
 * - Closed dates validation
 * 
 * Requirements: 2.4, 4.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReservationForm from '../ReservationForm';
import { useSettings } from '../../../contexts/SettingsContext';
import { useClosedDates } from '../../../hooks/useClosedDates';
import { useReservations } from '../../../hooks/useReservations';
import { useUserTypeLimits } from '../../../hooks/useUserTypeLimits';

// Mock hooks
jest.mock('../../../contexts/SettingsContext');
jest.mock('../../../hooks/useClosedDates');
jest.mock('../../../hooks/useReservations');
jest.mock('../../../hooks/useUserTypeLimits');

describe('ReservationForm Integration Tests', () => {
  const mockEquipment = {
    id: 'test-equipment',
    name: 'Test Camera',
    brand: 'Canon',
    model: 'EOS R5',
    location: 'Building A'
  };

  const mockSettings = {
    maxLoanDuration: 14,
    maxAdvanceBookingDays: 21,
    defaultCategoryLimit: 3
  };

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
    }
  ];

  beforeEach(() => {
    // Mock useSettings
    useSettings.mockReturnValue({
      settings: mockSettings,
      loading: false,
      error: null
    });

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

    // Mock useReservations
    useReservations.mockReturnValue({
      createReservation: jest.fn(),
      loading: false,
      error: null
    });

    // Mock useUserTypeLimits
    useUserTypeLimits.mockReturnValue({
      limits: {
        maxAdvanceBookingDays: 21,
        maxLoanDuration: 14,
        maxItemsPerLoan: 5,
        userTypeName: 'นักศึกษา',
        isDefault: false
      },
      loading: false,
      error: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('displays max advance booking days from settings', () => {
    render(
      <ReservationForm
        equipment={mockEquipment}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Check that help text mentions the max advance booking days
    expect(screen.getByText(/สามารถจองล่วงหน้าได้สูงสุด 21 วัน/)).toBeInTheDocument();
  });

  test('mentions closed dates in help text', () => {
    render(
      <ReservationForm
        equipment={mockEquipment}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Check that help text mentions closed dates
    expect(screen.getByText(/ไม่รวมวันปิดทำการ/)).toBeInTheDocument();
  });

  test('shows closed date warning when closed date is selected', async () => {
    render(
      <ReservationForm
        equipment={mockEquipment}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Find reservation date input
    const dateInput = screen.getByLabelText(/วันที่จอง/);
    
    // Set to a closed date
    fireEvent.change(dateInput, { target: { value: '2024-12-25' } });

    await waitFor(() => {
      // Should show closed date warning
      expect(screen.getByText(/วันที่เลือกเป็นวันปิดทำการ/)).toBeInTheDocument();
    });
  });

  test('validates closed dates on form submission', async () => {
    const mockCreateReservation = jest.fn();
    useReservations.mockReturnValue({
      createReservation: mockCreateReservation,
      loading: false,
      error: null
    });

    render(
      <ReservationForm
        equipment={mockEquipment}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Fill in form with closed date
    const dateInput = screen.getByLabelText(/วันที่จอง/);
    fireEvent.change(dateInput, { target: { value: '2024-12-25' } });

    const startTimeSelect = screen.getByLabelText(/เวลาเริ่มต้น/);
    fireEvent.change(startTimeSelect, { target: { value: '09:00' } });

    const endTimeSelect = screen.getByLabelText(/เวลาสิ้นสุด/);
    fireEvent.change(endTimeSelect, { target: { value: '10:00' } });

    const purposeInput = screen.getByLabelText(/วัตถุประสงค์/);
    fireEvent.change(purposeInput, { target: { value: 'Test purpose for reservation' } });

    // Try to submit
    const submitButton = screen.getByText('ส่งคำขอจอง');
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should not call createReservation due to closed date
      expect(mockCreateReservation).not.toHaveBeenCalled();
    });
  });

  test('uses default values when settings are not loaded', () => {
    // Mock with null settings
    useSettings.mockReturnValue({
      settings: null,
      loading: false,
      error: null
    });

    // Mock useUserTypeLimits with default values
    useUserTypeLimits.mockReturnValue({
      limits: {
        maxAdvanceBookingDays: 30,
        maxLoanDuration: 14,
        maxItemsPerLoan: 5,
        userTypeName: 'ผู้ใช้ทั่วไป',
        isDefault: true
      },
      loading: false,
      error: null
    });

    render(
      <ReservationForm
        equipment={mockEquipment}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Should use default max advance booking days (30 days)
    expect(screen.getByText(/สามารถจองล่วงหน้าได้สูงสุด 30 วัน/)).toBeInTheDocument();
  });

  test('calculates max reservation date correctly', () => {
    render(
      <ReservationForm
        equipment={mockEquipment}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Get the date input
    const dateInput = screen.getByLabelText(/วันที่จอง/);
    
    // Calculate expected max date
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 21);
    const expectedMaxDate = maxDate.toISOString().split('T')[0];
    
    // Check that max attribute is set correctly
    expect(dateInput).toHaveAttribute('max', expectedMaxDate);
  });
});
