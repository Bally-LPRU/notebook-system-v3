import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DepartmentSelector from '../DepartmentSelector';

describe('DepartmentSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test('renders with placeholder text', () => {
    render(
      <DepartmentSelector
        value=""
        onChange={mockOnChange}
        placeholder="เลือกสังกัด/แผนก"
      />
    );

    expect(screen.getByPlaceholderText('เลือกสังกัด/แผนก')).toBeInTheDocument();
  });

  test('opens dropdown when clicked', async () => {
    render(
      <DepartmentSelector
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.click(input);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    expect(screen.getByText('สาขาวิชาการบัญชี')).toBeInTheDocument();
    expect(screen.getByText('สาขาวิชาคอมพิวเตอร์ธุรกิจ')).toBeInTheDocument();
  });

  test('filters departments based on search input', async () => {
    render(
      <DepartmentSelector
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'คอมพิวเตอร์' } });

    await waitFor(() => {
      expect(screen.getByText('สาขาวิชาคอมพิวเตอร์ธุรกิจ')).toBeInTheDocument();
    });
    expect(screen.queryByText('สาขาวิชาการบัญชี')).not.toBeInTheDocument();
  });

  test('selects department when clicked', async () => {
    render(
      <DepartmentSelector
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.click(input);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const accountingOption = screen.getByText('สาขาวิชาการบัญชี');
    fireEvent.click(accountingOption);

    expect(mockOnChange).toHaveBeenCalledWith({
      target: {
        name: 'department',
        value: 'accounting'
      }
    });
  });

  test('handles keyboard navigation', async () => {
    render(
      <DepartmentSelector
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.click(input);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Press arrow down to focus first item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    // Press enter to select
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith({
      target: {
        name: 'department',
        value: 'accounting'
      }
    });
  });

  test('displays selected department value', () => {
    render(
      <DepartmentSelector
        value="computer-business"
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('combobox');
    expect(input.value).toBe('สาขาวิชาคอมพิวเตอร์ธุรกิจ');
  });

  test('shows error message when provided', () => {
    render(
      <DepartmentSelector
        value=""
        onChange={mockOnChange}
        error="กรุณาเลือกสังกัด/แผนก"
      />
    );

    expect(screen.getByText('กรุณาเลือกสังกัด/แผนก')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <DepartmentSelector
          value=""
          onChange={mockOnChange}
        />
        <button>Outside button</button>
      </div>
    );

    const input = screen.getByRole('combobox');
    fireEvent.click(input);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const outsideButton = screen.getByText('Outside button');
    fireEvent.mouseDown(outsideButton);

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  test('handles disabled state', () => {
    render(
      <DepartmentSelector
        value=""
        onChange={mockOnChange}
        disabled
      />
    );

    const input = screen.getByRole('combobox');
    expect(input).toBeDisabled();
  });
});