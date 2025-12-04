/**
 * Integration Tests for EnhancedLoanRequestForm with Settings
 * 
 * Tests the integration of loan request form with:
 * - Max loan duration from settings
 * - Closed dates validation
 * - Category limits display
 * 
 * Requirements: 2.2, 3.2, 6.2
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedLoanRequestForm from '../EnhancedLoanRequestForm';
import { useSettings } from '../../../contexts/SettingsContext';
import { useClosedDates } from '../../../hooks/useClosedDates';
import { useCategoryLimits } from '../../../hooks/useCategoryLimits';
import useLoanRequestValidation from '../../../hooks/useLoanRequestValidation';

// Mock hooks
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: jest.fn()
}));
jest.mock('../../../hooks/useClosedDates');
jest.mock('../../../hooks/useCategoryLimits');
jest.mock('../../../hooks/useLoanRequestValidation');

const createValidationMock = (overrides = {}) => {
  const defaultReturn = {
    formData: {
      equipmentId: 'test-equipment',
      borrowDate: '',
      expectedReturnDate: '',
      purpose: '',
      notes: ''
    },
    handleFieldChange: jest.fn(),
    handleFieldBlur: jest.fn(),
    validateAllFields: jest.fn(() => true),
    getFieldError: jest.fn(() => null),
    getFieldStatus: jest.fn(() => 'default'),
    isValid: true,
    isValidating: false
  };

  return {
    ...defaultReturn,
    ...overrides,
    formData: {
      ...defaultReturn.formData,
      ...(overrides.formData || {})
    }
  };
};

describe('EnhancedLoanRequestForm Integration Tests', () => {
  const mockEquipment = {
    id: 'test-equipment',
    name: 'Test Camera',
    category: 'cameras',
    brand: 'Canon',
    model: 'EOS R5'
  };

  const mockSettings = {
    maxLoanDuration: 14,
    maxAdvanceBookingDays: 30,
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
    useLoanRequestValidation.mockReturnValue(createValidationMock());

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

    // Mock useCategoryLimits
    useCategoryLimits.mockReturnValue({
      getCategoryLimit: jest.fn(() => 2),
      categoryLimits: [],
      loading: false,
      error: null,
      defaultLimit: 3
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('displays max loan duration from settings', () => {
    render(
      <EnhancedLoanRequestForm
        equipment={mockEquipment}
        equipmentId={mockEquipment.id}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Check that help text mentions the max duration
    expect(screen.getByText(/สูงสุด 14 วัน/)).toBeInTheDocument();
  });

  test('displays category limit information', () => {
    render(
      <EnhancedLoanRequestForm
        equipment={mockEquipment}
        equipmentId={mockEquipment.id}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Check that category limit is displayed
    expect(screen.getByText(/สามารถยืมอุปกรณ์ในหมวดหมู่นี้ได้สูงสุด 2 ชิ้นพร้อมกัน/)).toBeInTheDocument();
  });

  test('shows closed date warning when closed date is selected', () => {
    useLoanRequestValidation.mockReturnValue(
      createValidationMock({
        formData: {
          borrowDate: '2024-12-25'
        }
      })
    );

    render(
      <EnhancedLoanRequestForm
        equipment={mockEquipment}
        equipmentId={mockEquipment.id}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText(/วันที่เลือกเป็นวันปิดทำการ/)).toBeInTheDocument();
  });

  test('mentions closed dates in help text', () => {
    render(
      <EnhancedLoanRequestForm
        equipment={mockEquipment}
        equipmentId={mockEquipment.id}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Check that help text mentions closed dates at least once
    expect(screen.getAllByText(/ไม่รวมวันปิดทำการ/).length).toBeGreaterThan(0);
  });

  test('uses default values when settings are not loaded', () => {
    // Mock with null settings
    useSettings.mockReturnValue({
      settings: null,
      loading: false,
      error: null
    });

    render(
      <EnhancedLoanRequestForm
        equipment={mockEquipment}
        equipmentId={mockEquipment.id}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Should use default max duration (30 days)
    expect(screen.getByText(/สูงสุด 30 วัน/)).toBeInTheDocument();
  });
});
