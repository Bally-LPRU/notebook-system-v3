import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import EquipmentCard from '../equipment/EquipmentCard';
import { AuthContext } from '../../contexts/AuthContext';
import { EQUIPMENT_STATUS } from '../../types/equipment';

// Mock the validation utilities
jest.mock('../../utils/equipmentValidation', () => ({
  canBorrowEquipment: jest.fn(() => ({ canBorrow: true, reason: '' })),
  getEquipmentStatusColor: jest.fn(() => 'bg-green-100 text-green-800')
}));

const mockEquipment = {
  id: 'eq1',
  name: 'Dell Laptop',
  category: 'laptop',
  brand: 'Dell',
  model: 'Inspiron 15',
  serialNumber: 'DL001',
  location: 'IT Room',
  status: EQUIPMENT_STATUS.AVAILABLE,
  description: 'High-performance laptop for development work',
  imageURL: 'https://example.com/laptop.jpg'
};

const mockAuthContextValue = {
  user: { uid: 'user1', displayName: 'Test User' },
  isAdmin: false
};

const mockAdminAuthContextValue = {
  user: { uid: 'admin1', displayName: 'Admin User' },
  isAdmin: true
};

const renderWithAuth = (component, authValue = mockAuthContextValue) => {
  return render(
    <AuthContext.Provider value={authValue}>
      {component}
    </AuthContext.Provider>
  );
};

describe('EquipmentCard', () => {
  const mockOnBorrow = jest.fn();
  const mockOnReserve = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnViewDetail = jest.fn();
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render equipment information correctly', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onBorrow={mockOnBorrow}
          onReserve={mockOnReserve}
          onViewDetail={mockOnViewDetail}
        />
      );

      expect(screen.getByText('Dell Laptop')).toBeInTheDocument();
      expect(screen.getByText('Dell')).toBeInTheDocument();
      expect(screen.getByText('Inspiron 15')).toBeInTheDocument();
      expect(screen.getByText('DL001')).toBeInTheDocument();
      expect(screen.getByText('IT Room')).toBeInTheDocument();
      expect(screen.getByText('High-performance laptop for development work')).toBeInTheDocument();
    });

    it('should render equipment image when provided', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onViewDetail={mockOnViewDetail}
        />
      );

      const image = screen.getByAltText('Dell Laptop');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/laptop.jpg');
    });

    it('should render placeholder when no image provided', () => {
      const equipmentWithoutImage = { ...mockEquipment, imageURL: null };
      
      renderWithAuth(
        <EquipmentCard
          equipment={equipmentWithoutImage}
          onViewDetail={mockOnViewDetail}
        />
      );

      // Should render SVG placeholder
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should render status badge', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onViewDetail={mockOnViewDetail}
        />
      );

      // Status badge should be rendered (mocked to return green styling)
      const statusElements = screen.getAllByText(/available|ว่าง/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  describe('User Actions', () => {
    it('should render borrow and reserve buttons for regular users', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onBorrow={mockOnBorrow}
          onReserve={mockOnReserve}
          onViewDetail={mockOnViewDetail}
        />
      );

      expect(screen.getByText('ขอยืม')).toBeInTheDocument();
      expect(screen.getByText('จอง')).toBeInTheDocument();
      expect(screen.getByText('ดูรายละเอียด')).toBeInTheDocument();
    });

    it('should call onBorrow when borrow button is clicked', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onBorrow={mockOnBorrow}
          onReserve={mockOnReserve}
          onViewDetail={mockOnViewDetail}
        />
      );

      fireEvent.click(screen.getByText('ขอยืม'));
      expect(mockOnBorrow).toHaveBeenCalledWith(mockEquipment);
    });

    it('should call onReserve when reserve button is clicked', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onBorrow={mockOnBorrow}
          onReserve={mockOnReserve}
          onViewDetail={mockOnViewDetail}
        />
      );

      fireEvent.click(screen.getByText('จอง'));
      expect(mockOnReserve).toHaveBeenCalledWith(mockEquipment);
    });

    it('should call onViewDetail when view detail button is clicked', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onBorrow={mockOnBorrow}
          onReserve={mockOnReserve}
          onViewDetail={mockOnViewDetail}
        />
      );

      fireEvent.click(screen.getByText('ดูรายละเอียด'));
      expect(mockOnViewDetail).toHaveBeenCalledWith(mockEquipment);
    });
  });

  describe('Admin Actions', () => {
    it('should render edit and delete buttons for admin users', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetail={mockOnViewDetail}
        />,
        mockAdminAuthContextValue
      );

      expect(screen.getByText('แก้ไข')).toBeInTheDocument();
      expect(screen.getByText('ลบ')).toBeInTheDocument();
      expect(screen.getByText('ดูรายละเอียด')).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetail={mockOnViewDetail}
        />,
        mockAdminAuthContextValue
      );

      fireEvent.click(screen.getByText('แก้ไข'));
      expect(mockOnEdit).toHaveBeenCalledWith(mockEquipment);
    });

    it('should call onDelete when delete button is clicked', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetail={mockOnViewDetail}
        />,
        mockAdminAuthContextValue
      );

      fireEvent.click(screen.getByText('ลบ'));
      expect(mockOnDelete).toHaveBeenCalledWith(mockEquipment);
    });

    it('should disable delete button for borrowed equipment', () => {
      const borrowedEquipment = {
        ...mockEquipment,
        status: EQUIPMENT_STATUS.BORROWED
      };

      renderWithAuth(
        <EquipmentCard
          equipment={borrowedEquipment}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetail={mockOnViewDetail}
        />,
        mockAdminAuthContextValue
      );

      const deleteButton = screen.getByText('ลบ');
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Selection Functionality', () => {
    it('should render selection checkbox when selectable', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onViewDetail={mockOnViewDetail}
          isSelectable={true}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should render checked checkbox when selected', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onViewDetail={mockOnViewDetail}
          isSelectable={true}
          isSelected={true}
          onSelect={mockOnSelect}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should call onSelect when checkbox is clicked', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onViewDetail={mockOnViewDetail}
          isSelectable={true}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(mockOnSelect).toHaveBeenCalledWith(true);
    });

    it('should not render checkbox when not selectable', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onViewDetail={mockOnViewDetail}
          isSelectable={false}
        />
      );

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should apply selected styling when selected', () => {
      const { container } = renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onViewDetail={mockOnViewDetail}
          isSelectable={true}
          isSelected={true}
          onSelect={mockOnSelect}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('border-blue-500', 'ring-2', 'ring-blue-200');
    });
  });

  describe('Equipment Availability', () => {
    it('should disable borrow/reserve buttons when equipment cannot be borrowed', () => {
      const { canBorrowEquipment } = require('../../utils/equipmentValidation');
      canBorrowEquipment.mockReturnValue({
        canBorrow: false,
        reason: 'Equipment is under maintenance'
      });

      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onBorrow={mockOnBorrow}
          onReserve={mockOnReserve}
          onViewDetail={mockOnViewDetail}
        />
      );

      expect(screen.getByText('ขอยืม')).toBeDisabled();
      expect(screen.getByText('จอง')).toBeDisabled();
    });

    it('should enable borrow/reserve buttons when equipment can be borrowed', () => {
      const { canBorrowEquipment } = require('../../utils/equipmentValidation');
      canBorrowEquipment.mockReturnValue({
        canBorrow: true,
        reason: ''
      });

      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onBorrow={mockOnBorrow}
          onReserve={mockOnReserve}
          onViewDetail={mockOnViewDetail}
        />
      );

      expect(screen.getByText('ขอยืม')).not.toBeDisabled();
      expect(screen.getByText('จอง')).not.toBeDisabled();
    });
  });

  describe('Image Loading', () => {
    it('should show loading spinner while image is loading', async () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onViewDetail={mockOnViewDetail}
        />
      );

      // Initially should show loading spinner
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });

    it('should handle image load error gracefully', async () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onViewDetail={mockOnViewDetail}
        />
      );

      const image = screen.getByAltText('Dell Laptop');
      
      // Simulate image load error
      fireEvent.error(image);

      await waitFor(() => {
        // Should show placeholder instead of broken image
        expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onBorrow={mockOnBorrow}
          onReserve={mockOnReserve}
          onViewDetail={mockOnViewDetail}
        />
      );

      const borrowButton = screen.getByText('ขอยืม');
      const reserveButton = screen.getByText('จอง');
      const detailButton = screen.getByText('ดูรายละเอียด');

      expect(borrowButton).toHaveAttribute('title');
      expect(reserveButton).toHaveAttribute('title');
      expect(detailButton).toBeInTheDocument();
    });

    it('should have proper alt text for images', () => {
      renderWithAuth(
        <EquipmentCard
          equipment={mockEquipment}
          onViewDetail={mockOnViewDetail}
        />
      );

      const image = screen.getByAltText('Dell Laptop');
      expect(image).toBeInTheDocument();
    });
  });
});