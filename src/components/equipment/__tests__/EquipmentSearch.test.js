import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EquipmentSearch from '../EquipmentSearch';
import EquipmentSearchService from '../../../services/equipmentSearchService';

// Mock the search service
jest.mock('../../../services/equipmentSearchService');

// Mock debounce for testing
jest.mock('lodash.debounce', () => jest.fn(fn => fn));

describe('EquipmentSearch', () => {
  const mockOnSearch = jest.fn();
  const mockOnSuggestionSelect = jest.fn();

  const defaultProps = {
    onSearch: mockOnSearch,
    onSuggestionSelect: mockOnSuggestionSelect,
    placeholder: 'ค้นหาอุปกรณ์...'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock search service methods
    EquipmentSearchService.getAutocompleteSuggestions.mockResolvedValue([
      { type: 'equipment', text: 'Test Laptop', description: 'Dell Inspiron' },
      { type: 'brand', text: 'Dell', description: 'ยี่ห้อ' },
      { type: 'category', text: 'Computer', description: 'ประเภทอุปกรณ์' }
    ]);
    
    EquipmentSearchService.getPopularSearchTerms.mockReturnValue([
      'laptop', 'printer', 'computer'
    ]);
  });

  test('renders search input with placeholder', () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('ค้นหาอุปกรณ์...')).toBeInTheDocument();
  });

  test('calls onSearch when input value changes', async () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('laptop');
    });
  });

  test('shows autocomplete suggestions when typing', async () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    await waitFor(() => {
      expect(EquipmentSearchService.getAutocompleteSuggestions).toHaveBeenCalledWith('laptop');
    });
    
    await waitFor(() => {
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
      expect(screen.getByText('Dell')).toBeInTheDocument();
      expect(screen.getByText('Computer')).toBeInTheDocument();
    });
  });

  test('calls onSuggestionSelect when suggestion is clicked', async () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Laptop'));
    
    expect(mockOnSuggestionSelect).toHaveBeenCalledWith({
      type: 'equipment',
      text: 'Test Laptop',
      description: 'Dell Inspiron'
    });
  });

  test('updates input value when suggestion is selected', async () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Laptop'));
    
    expect(searchInput.value).toBe('Test Laptop');
  });

  test('shows popular search terms when input is focused and empty', async () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.focus(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('คำค้นหายอดนิยม')).toBeInTheDocument();
      expect(screen.getByText('laptop')).toBeInTheDocument();
      expect(screen.getByText('printer')).toBeInTheDocument();
      expect(screen.getByText('computer')).toBeInTheDocument();
    });
  });

  test('hides suggestions when input loses focus', async () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
    });
    
    fireEvent.blur(searchInput);
    
    await waitFor(() => {
      expect(screen.queryByText('Test Laptop')).not.toBeInTheDocument();
    });
  });

  test('handles keyboard navigation in suggestions', async () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
    });
    
    // Arrow down to select first suggestion
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    
    // Enter to select highlighted suggestion
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    expect(mockOnSuggestionSelect).toHaveBeenCalledWith({
      type: 'equipment',
      text: 'Test Laptop',
      description: 'Dell Inspiron'
    });
  });

  test('clears suggestions when Escape is pressed', async () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
    });
    
    fireEvent.keyDown(searchInput, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText('Test Laptop')).not.toBeInTheDocument();
    });
  });

  test('shows loading state while fetching suggestions', async () => {
    // Mock delayed response
    EquipmentSearchService.getAutocompleteSuggestions.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );
    
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('กำลังค้นหา...')).toBeInTheDocument();
    });
  });

  test('handles search service errors gracefully', async () => {
    EquipmentSearchService.getAutocompleteSuggestions.mockRejectedValue(
      new Error('Search service error')
    );
    
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    // Should not crash and should not show suggestions
    await waitFor(() => {
      expect(screen.queryByText('Test Laptop')).not.toBeInTheDocument();
    });
  });

  test('does not fetch suggestions for queries shorter than 2 characters', async () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.change(searchInput, { target: { value: 'a' } });
    
    await waitFor(() => {
      expect(EquipmentSearchService.getAutocompleteSuggestions).not.toHaveBeenCalled();
    });
  });

  test('shows clear button when input has value', () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  test('clears input when clear button is clicked', () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    
    expect(searchInput.value).toBe('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  test('supports controlled mode with value prop', () => {
    const { rerender } = render(
      <EquipmentSearch {...defaultProps} value="initial value" />
    );
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    expect(searchInput.value).toBe('initial value');
    
    // Update value prop
    rerender(<EquipmentSearch {...defaultProps} value="updated value" />);
    expect(searchInput.value).toBe('updated value');
  });

  test('shows search icon', () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(<EquipmentSearch {...defaultProps} className="custom-search" />);
    
    const searchContainer = screen.getByTestId('search-container');
    expect(searchContainer).toHaveClass('custom-search');
  });

  test('supports disabled state', () => {
    render(<EquipmentSearch {...defaultProps} disabled />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    expect(searchInput).toBeDisabled();
  });

  test('shows different suggestion types with appropriate icons', async () => {
    render(<EquipmentSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
      expect(screen.getByText('Dell')).toBeInTheDocument();
      expect(screen.getByText('Computer')).toBeInTheDocument();
    });
    
    // Check for suggestion type indicators
    expect(screen.getByTestId('equipment-icon')).toBeInTheDocument();
    expect(screen.getByTestId('brand-icon')).toBeInTheDocument();
    expect(screen.getByTestId('category-icon')).toBeInTheDocument();
  });
});