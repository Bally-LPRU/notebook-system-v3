import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BulkActionBar from '../BulkActionBar';
import BulkEditModal from '../BulkEditModal';
import BulkDeleteModal from '../BulkDeleteModal';
import useBulkSelection from '../../../hooks/useBulkSelection';
import AuthContext from '../../../contexts/AuthContext';

// Mock the hooks and services
jest.mock('../../../hooks/useBulkSelection');
jest.mock('../../../services/bulkOperationsService');

const mockAuthContext = {
  isAdmin: true,
  user: { uid: 'test-user', email: 'test@example.com' }
};

const mockEquipment = [
  {
    id: '1',
    name: 'Test Equipment 1',
    status: 'available',
    location: 'Room A',
    equipmentNumber: 'EQ001'
  },
  {
    id: '2',
    name: 'Test Equipment 2',
    status: 'maintenance',
    location: 'Room B',
    equipmentNumber: 'EQ002'
  }
];

describe('Bulk Operations', () => {
  beforeEach(() => {
    useBulkSelection.mockReturnValue({
      selectedItems: ['1', '2'],
      isAllSelected: false,
      isSomeSelected: true,
      selectionStats: { selectedCount: 2, totalCount: 2 },
      toggleItem: jest.fn(),
      selectAll: jest.fn(),
      deselectAll: jest.fn(),
      clearSelection: jest.fn(),
      getSelectedItems: jest.fn(() => mockEquipment),
      isItemSelected: jest.fn((id) => ['1', '2'].includes(id))
    });
  });

  describe('BulkActionBar', () => {
    it('renders with selected items count', () => {
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <BulkActionBar
            selectedItems={['1', '2']}
            totalItems={10}
            onClearSelection={jest.fn()}
          />
        </AuthContext.Provider>
      );

      expect(screen.getByText('เลือกแล้ว 2 จาก 10 รายการ')).toBeInTheDocument();
    });

    it('shows admin actions for admin users', () => {
      const mockHandlers = {
        onBulkEdit: jest.fn(),
        onBulkDelete: jest.fn(),
        onBulkStatusUpdate: jest.fn()
      };

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <BulkActionBar
            selectedItems={['1', '2']}
            totalItems={10}
            onClearSelection={jest.fn()}
            {...mockHandlers}
          />
        </AuthContext.Provider>
      );

      expect(screen.getByText('แก้ไขหลายรายการ')).toBeInTheDocument();
      expect(screen.getByText('อัปเดตสถานะ')).toBeInTheDocument();
    });

    it('hides admin actions for non-admin users', () => {
      const nonAdminContext = { ...mockAuthContext, isAdmin: false };

      render(
        <AuthContext.Provider value={nonAdminContext}>
          <BulkActionBar
            selectedItems={['1', '2']}
            totalItems={10}
            onClearSelection={jest.fn()}
            onBulkEdit={jest.fn()}
            onBulkDelete={jest.fn()}
          />
        </AuthContext.Provider>
      );

      expect(screen.queryByText('แก้ไขหลายรายการ')).not.toBeInTheDocument();
      expect(screen.queryByText('ลบหลายรายการ')).not.toBeInTheDocument();
    });

    it('calls clear selection when clear button is clicked', () => {
      const mockClearSelection = jest.fn();

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <BulkActionBar
            selectedItems={['1', '2']}
            totalItems={10}
            onClearSelection={mockClearSelection}
          />
        </AuthContext.Provider>
      );

      fireEvent.click(screen.getByText('ยกเลิกการเลือก'));
      expect(mockClearSelection).toHaveBeenCalled();
    });
  });

  describe('BulkEditModal', () => {
    it('renders when open', () => {
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <BulkEditModal
            isOpen={true}
            onClose={jest.fn()}
            selectedEquipment={mockEquipment}
            onSave={jest.fn()}
          />
        </AuthContext.Provider>
      );

      expect(screen.getByText('แก้ไขอุปกรณ์หลายรายการ')).toBeInTheDocument();
      expect(screen.getByText('จะทำการอัปเดต 2 รายการ')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <BulkEditModal
            isOpen={false}
            onClose={jest.fn()}
            selectedEquipment={mockEquipment}
            onSave={jest.fn()}
          />
        </AuthContext.Provider>
      );

      expect(screen.queryByText('แก้ไขอุปกรณ์หลายรายการ')).not.toBeInTheDocument();
    });

    it('enables form fields when checkboxes are checked', () => {
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <BulkEditModal
            isOpen={true}
            onClose={jest.fn()}
            selectedEquipment={mockEquipment}
            onSave={jest.fn()}
          />
        </AuthContext.Provider>
      );

      const statusCheckbox = screen.getByLabelText('อัปเดตสถานะ');
      fireEvent.click(statusCheckbox);

      const statusSelect = screen.getByRole('combobox');
      expect(statusSelect).toBeInTheDocument();
    });

    it('validates form before submission', async () => {
      const mockOnSave = jest.fn();

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <BulkEditModal
            isOpen={true}
            onClose={jest.fn()}
            selectedEquipment={mockEquipment}
            onSave={mockOnSave}
          />
        </AuthContext.Provider>
      );

      const submitButton = screen.getByRole('button', { name: /อัปเดต[\s\d]+รายการ/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('กรุณาเลือกฟิลด์อย่างน้อยหนึ่งฟิลด์เพื่อทำการอัปเดต')).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('BulkDeleteModal', () => {
    it('renders with warning message', () => {
      render(
        <BulkDeleteModal
          isOpen={true}
          onClose={jest.fn()}
          selectedEquipment={mockEquipment}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('ลบอุปกรณ์หลายรายการ')).toBeInTheDocument();
      expect(screen.getByText('คำเตือน: การดำเนินการนี้ไม่สามารถย้อนกลับได้')).toBeInTheDocument();
    });

    it('shows deletable and non-deletable items separately', () => {
      const mixedEquipment = [
        ...mockEquipment,
        {
          id: '3',
          name: 'Borrowed Equipment',
          status: 'borrowed',
          location: 'Room C',
          equipmentNumber: 'EQ003'
        }
      ];

      render(
        <BulkDeleteModal
          isOpen={true}
          onClose={jest.fn()}
          selectedEquipment={mixedEquipment}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('รายการที่จะถูกลบ (2 รายการ)')).toBeInTheDocument();
      expect(screen.getByText('รายการที่ไม่สามารถลบได้ (1 รายการ)')).toBeInTheDocument();
    });

    it('requires confirmation text to enable delete button', () => {
      render(
        <BulkDeleteModal
          isOpen={true}
          onClose={jest.fn()}
          selectedEquipment={mockEquipment}
          onConfirm={jest.fn()}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /ลบ[\s\d]+รายการ/ });
      expect(deleteButton).toBeDisabled();

      const confirmInput = screen.getByPlaceholderText("พิมพ์ 'ลบ' เพื่อยืนยัน");
      fireEvent.change(confirmInput, { target: { value: 'ลบ' } });

      expect(deleteButton).toBeEnabled();
    });

    it('calls onConfirm when delete is confirmed', async () => {
      const mockOnConfirm = jest.fn();

      render(
        <BulkDeleteModal
          isOpen={true}
          onClose={jest.fn()}
          selectedEquipment={mockEquipment}
          onConfirm={mockOnConfirm}
        />
      );

      const confirmInput = screen.getByPlaceholderText("พิมพ์ 'ลบ' เพื่อยืนยัน");
      fireEvent.change(confirmInput, { target: { value: 'ลบ' } });

      const deleteButton = screen.getByRole('button', { name: /ลบ[\s\d]+รายการ/ });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith(mockEquipment, expect.any(Function));
      });
    });
  });
});