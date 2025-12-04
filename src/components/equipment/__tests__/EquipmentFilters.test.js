import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EquipmentFilters from '../EquipmentFilters';

// Mock hooks/components that EquipmentFilters relies on so tests focus on behaviour
const mockCategoriesContext = {
  categories: [
    { id: 'cat1', name: 'Computer' },
    { id: 'cat2', name: 'Printer' }
  ],
  loading: false,
  error: null
};

jest.mock('../../../contexts/EquipmentCategoriesContext', () => ({
  useCategories: () => mockCategoriesContext
}));

jest.mock('../DateRangePicker', () => ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}) => (
  <div data-testid="date-range-picker">
    <input
      aria-label="วันที่เริ่มต้น"
      value={startDate}
      onChange={(e) => onStartDateChange(e.target.value)}
    />
    <input
      aria-label="วันที่สิ้นสุด"
      value={endDate}
      onChange={(e) => onEndDateChange(e.target.value)}
    />
  </div>
));

jest.mock('../PriceRangeSlider', () => ({
  min,
  max,
  onMinChange,
  onMaxChange
}) => (
  <div data-testid="price-range-slider">
    <input
      aria-label="ราคาต่ำสุด"
      value={min}
      onChange={(e) => onMinChange(e.target.value)}
    />
    <input
      aria-label="ราคาสูงสุด"
      value={max}
      onChange={(e) => onMaxChange(e.target.value)}
    />
  </div>
));

jest.mock('./FilterPresets', () => () => <div data-testid="filter-presets" />);

describe('EquipmentFilters', () => {
  const mockOnFiltersChange = jest.fn();
  const mockOnReset = jest.fn();

  const defaultProps = {
    filters: {},
    onFiltersChange: mockOnFiltersChange,
    onReset: mockOnReset,
    loading: false
  };

  const renderComponent = (overrideProps = {}) =>
    render(<EquipmentFilters {...defaultProps} {...overrideProps} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders base controls', () => {
    renderComponent();

    expect(
      screen.getByPlaceholderText(
        'ค้นหาอุปกรณ์ (ชื่อ, ยี่ห้อ, รุ่น, หมายเลขครุภัณฑ์)...'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('ตัวกรองขั้นสูง')).toBeInTheDocument();
  });

  test('applies category filter only after clicking apply', () => {
    renderComponent();

    fireEvent.click(screen.getByText('ตัวกรองขั้นสูง'));
    const categoryCheckbox = screen.getByLabelText('Computer');
    fireEvent.click(categoryCheckbox);

    expect(mockOnFiltersChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('ใช้ตัวกรอง'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ categories: ['cat1'] })
    );
  });

  test('search input triggers onFiltersChange immediately', () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(
      'ค้นหาอุปกรณ์ (ชื่อ, ยี่ห้อ, รุ่น, หมายเลขครุภัณฑ์)...'
    );
    fireEvent.change(searchInput, { target: { value: 'laptop' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'laptop' })
    );
  });

  test('date range and price sliders update once applied', () => {
    renderComponent();

    fireEvent.click(screen.getByText('ตัวกรองขั้นสูง'));

    fireEvent.change(screen.getByLabelText('วันที่เริ่มต้น'), {
      target: { value: '2023-01-01' }
    });
    fireEvent.change(screen.getByLabelText('ราคาต่ำสุด'), {
      target: { value: '5000' }
    });

    fireEvent.click(screen.getByText('ใช้ตัวกรอง'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        dateRange: expect.objectContaining({ start: '2023-01-01' }),
        priceRange: expect.objectContaining({ min: '5000' })
      })
    );
  });

  test('reset clears filters and calls onReset', () => {
    renderComponent({ filters: { categories: ['cat1'], statuses: ['active'] } });

    fireEvent.click(screen.getByText('ตัวกรองขั้นสูง'));
    fireEvent.click(screen.getByText('รีเซ็ต'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ categories: [], statuses: [] })
    );
    expect(mockOnReset).toHaveBeenCalled();
  });

  test('shows advanced controls when expanded', () => {
    renderComponent();

    fireEvent.click(screen.getByText('ตัวกรองขั้นสูง'));

    expect(screen.getByLabelText('Computer')).toBeInTheDocument();
    expect(screen.getByLabelText('Printer')).toBeInTheDocument();
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
    expect(screen.getByTestId('price-range-slider')).toBeInTheDocument();
  });
});