import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EquipmentFilters from '../EquipmentFilters';
import EquipmentFilterService from '../../../services/equipmentFilterService';
import { EquipmentCategoriesProvider } from '../../../contexts/EquipmentCategoriesContext';

// Mock the filter service
jest.mock('../../../services/equipmentFilterService');

// Mock the useEquipmentCategories hook
jest.mock('../../../hooks/useEquipmentCategories', () => ({
  useEquipmentCategories: () => ({
    categories: [
      { id: 'cat1', name: 'Computer' },
      { id: 'cat2', name: 'Printer' }
    ],
    loading: false,
    error: null,
    getCategoryById: jest.fn(),
    getCategoriesByParent: jest.fn(),
    getRootCategories: jest.fn(),
    getCategoryHierarchy: jest.fn(),
    getCategoryPath: jest.fn(),
    searchCategories: jest.fn()
  })
}));

describe('EquipmentFilters', () => {
  const mockOnFiltersChange = jest.fn();
  const mockOnClearFilters = jest.fn();

  const mockFilterOptions = {
    categories: [
      { id: 'cat1', name: 'Computer', equipmentCount: 10 },
      { id: 'cat2', name: 'Printer', equipmentCount: 5 }
    ],
    brands: ['Dell', 'HP', 'Canon'],
    locations: ['Building A', 'Building B'],
    responsiblePersons: ['John Doe', 'Jane Smith'],
    tags: ['laptop', 'desktop', 'printer'],
    priceRange: { min: 1000, max: 100000 },
    dateRange: { 
      min: new Date('2020-01-01'), 
      max: new Date('2023-12-31') 
    }
  };

  const defaultProps = {
    filters: {},
    onFiltersChange: mockOnFiltersChange,
    onClearFilters: mockOnClearFilters,
    isLoading: false
  };

  // Helper function to render with provider
  const renderWithProvider = (component) => {
    return render(
      <EquipmentCategoriesProvider>
        {component}
      </EquipmentCategoriesProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    EquipmentFilterService.getFilterOptions.mockResolvedValue(mockFilterOptions);
    EquipmentFilterService.getFilterStatistics.mockResolvedValue({
      total: 15,
      categories: { Computer: 10, Printer: 5 },
      statuses: { active: 12, maintenance: 3 }
    });
  });

  test('renders filter sections', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('ประเภทอุปกรณ์')).toBeInTheDocument();
      expect(screen.getByText('สถานะ')).toBeInTheDocument();
      expect(screen.getByText('ช่วงราคา')).toBeInTheDocument();
      expect(screen.getByText('วันที่ซื้อ')).toBeInTheDocument();
      expect(screen.getByText('สถานที่')).toBeInTheDocument();
    });
  });

  test('shows category options with counts', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Computer (10)')).toBeInTheDocument();
      expect(screen.getByText('Printer (5)')).toBeInTheDocument();
    });
  });

  test('calls onFiltersChange when category is selected', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Computer (10)')).toBeInTheDocument();
    });
    
    const computerCheckbox = screen.getByLabelText('Computer (10)');
    fireEvent.click(computerCheckbox);
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      categories: ['cat1']
    });
  });

  test('shows selected categories as checked', async () => {
    const filtersWithCategory = {
      categories: ['cat1']
    };
    
    renderWithProvider(<EquipmentFilters {...defaultProps} filters={filtersWithCategory} />);
    
    await waitFor(() => {
      const computerCheckbox = screen.getByLabelText('Computer (10)');
      expect(computerCheckbox).toBeChecked();
    });
  });

  test('shows status filter options', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('ใช้งานได้')).toBeInTheDocument();
      expect(screen.getByText('ซ่อมบำรุง')).toBeInTheDocument();
      expect(screen.getByText('เสื่อมสภาพ')).toBeInTheDocument();
      expect(screen.getByText('สูญหาย')).toBeInTheDocument();
    });
  });

  test('calls onFiltersChange when status is selected', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('ใช้งานได้')).toBeInTheDocument();
    });
    
    const activeCheckbox = screen.getByLabelText('ใช้งานได้');
    fireEvent.click(activeCheckbox);
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      statuses: ['active']
    });
  });

  test('shows price range slider', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('price-range-slider')).toBeInTheDocument();
    });
  });

  test('calls onFiltersChange when price range changes', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('price-range-slider')).toBeInTheDocument();
    });
    
    const minPriceInput = screen.getByLabelText('ราคาต่ำสุด');
    fireEvent.change(minPriceInput, { target: { value: '5000' } });
    fireEvent.blur(minPriceInput);
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      priceRange: { min: 5000, max: 100000 }
    });
  });

  test('shows date range picker', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
    });
  });

  test('calls onFiltersChange when date range changes', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
    });
    
    const startDateInput = screen.getByLabelText('วันที่เริ่มต้น');
    fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      dateRange: { start: '2023-01-01', end: '' }
    });
  });

  test('shows location filter', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('อาคาร')).toBeInTheDocument();
    });
  });

  test('calls onFiltersChange when location is selected', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
    
    const buildingSelect = screen.getByLabelText('อาคาร');
    fireEvent.change(buildingSelect, { target: { value: 'Building A' } });
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      location: { building: 'Building A', floor: '', room: '' }
    });
  });

  test('shows clear filters button when filters are applied', () => {
    const filtersWithValues = {
      categories: ['cat1'],
      statuses: ['active']
    };
    
    renderWithProvider(<EquipmentFilters {...defaultProps} filters={filtersWithValues} />);
    
    expect(screen.getByText('ล้างตัวกรอง')).toBeInTheDocument();
  });

  test('calls onClearFilters when clear button is clicked', () => {
    const filtersWithValues = {
      categories: ['cat1'],
      statuses: ['active']
    };
    
    renderWithProvider(<EquipmentFilters {...defaultProps} filters={filtersWithValues} />);
    
    const clearButton = screen.getByText('ล้างตัวกรอง');
    fireEvent.click(clearButton);
    
    expect(mockOnClearFilters).toHaveBeenCalled();
  });

  test('shows filter count badge', () => {
    const filtersWithValues = {
      categories: ['cat1', 'cat2'],
      statuses: ['active']
    };
    
    renderWithProvider(<EquipmentFilters {...defaultProps} filters={filtersWithValues} />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // 2 categories + 1 status
  });

  test('shows loading state', () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('กำลังโหลดตัวกรอง...')).toBeInTheDocument();
  });

  test('can be collapsed and expanded', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('ประเภทอุปกรณ์')).toBeInTheDocument();
    });
    
    // Find and click collapse button
    const collapseButton = screen.getByRole('button', { name: /ซ่อน.*ตัวกรอง/i });
    fireEvent.click(collapseButton);
    
    // Filter content should be hidden
    expect(screen.queryByText('Computer (10)')).not.toBeInTheDocument();
    
    // Click expand button
    const expandButton = screen.getByRole('button', { name: /แสดง.*ตัวกรอง/i });
    fireEvent.click(expandButton);
    
    // Filter content should be visible again
    await waitFor(() => {
      expect(screen.getByText('Computer (10)')).toBeInTheDocument();
    });
  });

  test('supports mobile responsive layout', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('mobile-filters')).toBeInTheDocument();
    });
  });

  test('shows filter presets section', async () => {
    const mockPresets = [
      { id: '1', name: 'My Computers', filters: { categories: ['cat1'] } },
      { id: '2', name: 'Active Equipment', filters: { statuses: ['active'] } }
    ];
    
    EquipmentFilterService.getFilterPresets.mockResolvedValue(mockPresets);
    
    renderWithProvider(<EquipmentFilters {...defaultProps} showPresets={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('ตัวกรองที่บันทึกไว้')).toBeInTheDocument();
      expect(screen.getByText('My Computers')).toBeInTheDocument();
      expect(screen.getByText('Active Equipment')).toBeInTheDocument();
    });
  });

  test('applies preset when selected', async () => {
    const mockPresets = [
      { id: '1', name: 'My Computers', filters: { categories: ['cat1'] } }
    ];
    
    EquipmentFilterService.getFilterPresets.mockResolvedValue(mockPresets);
    
    renderWithProvider(<EquipmentFilters {...defaultProps} showPresets={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('My Computers')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('My Computers'));
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ categories: ['cat1'] });
  });

  test('handles filter service errors gracefully', async () => {
    EquipmentFilterService.getFilterOptions.mockRejectedValue(new Error('Service error'));
    
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('ไม่สามารถโหลดตัวกรองได้')).toBeInTheDocument();
    });
  });

  test('shows advanced filters when toggled', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('ตัวกรองขั้นสูง')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('ตัวกรองขั้นสูง'));
    
    await waitFor(() => {
      expect(screen.getByText('ผู้รับผิดชอบ')).toBeInTheDocument();
      expect(screen.getByText('แท็ก')).toBeInTheDocument();
    });
  });

  test('supports keyboard navigation', async () => {
    renderWithProvider(<EquipmentFilters {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Computer (10)')).toBeInTheDocument();
    });
    
    const computerCheckbox = screen.getByLabelText('Computer (10)');
    
    // Focus and press space to toggle
    computerCheckbox.focus();
    fireEvent.keyDown(computerCheckbox, { key: ' ' });
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      categories: ['cat1']
    });
  });
});