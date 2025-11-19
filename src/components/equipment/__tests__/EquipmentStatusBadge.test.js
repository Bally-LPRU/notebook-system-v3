import React from 'react';
import { render, screen } from '@testing-library/react';
import EquipmentStatusBadge from '../EquipmentStatusBadge';
import { EQUIPMENT_STATUS, EQUIPMENT_STATUS_LABELS } from '../../../types/equipment';

// Mock the validation utilities
jest.mock('../../../utils/equipmentValidation', () => ({
  getEquipmentStatusColor: jest.fn((status) => {
    const colors = {
      available: 'text-green-600 bg-green-100',
      borrowed: 'text-yellow-600 bg-yellow-100',
      maintenance: 'text-orange-600 bg-orange-100',
      retired: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  })
}));

describe('EquipmentStatusBadge', () => {
  describe('Status Rendering', () => {
    it('should render available status correctly', () => {
      render(<EquipmentStatusBadge status={EQUIPMENT_STATUS.AVAILABLE} />);
      
      expect(screen.getByText(EQUIPMENT_STATUS_LABELS[EQUIPMENT_STATUS.AVAILABLE])).toBeInTheDocument();
    });

    it('should render borrowed status correctly', () => {
      render(<EquipmentStatusBadge status={EQUIPMENT_STATUS.BORROWED} />);
      
      expect(screen.getByText(EQUIPMENT_STATUS_LABELS[EQUIPMENT_STATUS.BORROWED])).toBeInTheDocument();
    });

    it('should render maintenance status correctly', () => {
      render(<EquipmentStatusBadge status={EQUIPMENT_STATUS.MAINTENANCE} />);
      
      expect(screen.getByText(EQUIPMENT_STATUS_LABELS[EQUIPMENT_STATUS.MAINTENANCE])).toBeInTheDocument();
    });

    it('should render retired status correctly', () => {
      render(<EquipmentStatusBadge status={EQUIPMENT_STATUS.RETIRED} />);
      
      expect(screen.getByText(EQUIPMENT_STATUS_LABELS[EQUIPMENT_STATUS.RETIRED])).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small size variant correctly', () => {
      const { container } = render(
        <EquipmentStatusBadge status={EQUIPMENT_STATUS.AVAILABLE} size="sm" />
      );
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('px-1.5', 'py-0.5', 'text-xs');
    });

    it('should render medium size variant correctly (default)', () => {
      const { container } = render(
        <EquipmentStatusBadge status={EQUIPMENT_STATUS.AVAILABLE} />
      );
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs');
    });

    it('should render large size variant correctly', () => {
      const { container } = render(
        <EquipmentStatusBadge status={EQUIPMENT_STATUS.AVAILABLE} size="lg" />
      );
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
    });

    it('should default to medium size when invalid size is provided', () => {
      const { container } = render(
        <EquipmentStatusBadge status={EQUIPMENT_STATUS.AVAILABLE} size="invalid" />
      );
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs');
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <EquipmentStatusBadge 
          status={EQUIPMENT_STATUS.AVAILABLE} 
          className="custom-class another-class" 
        />
      );
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('custom-class', 'another-class');
    });

    it('should preserve base classes when custom className is applied', () => {
      const { container } = render(
        <EquipmentStatusBadge 
          status={EQUIPMENT_STATUS.AVAILABLE} 
          className="custom-class" 
        />
      );
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'font-medium');
    });
  });

  describe('Invalid Status Handling', () => {
    it('should display "Unknown" for invalid status', () => {
      render(<EquipmentStatusBadge status="invalid-status" />);
      
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should display "Unknown" for null status', () => {
      render(<EquipmentStatusBadge status={null} />);
      
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should display "Unknown" for undefined status', () => {
      render(<EquipmentStatusBadge status={undefined} />);
      
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should apply default gray color for invalid status', () => {
      const { getEquipmentStatusColor } = require('../../../utils/equipmentValidation');
      
      render(<EquipmentStatusBadge status="invalid-status" />);
      
      expect(getEquipmentStatusColor).toHaveBeenCalledWith('invalid-status');
    });
  });

  describe('Color Application', () => {
    it('should call getEquipmentStatusColor with correct status', () => {
      const { getEquipmentStatusColor } = require('../../../utils/equipmentValidation');
      
      render(<EquipmentStatusBadge status={EQUIPMENT_STATUS.AVAILABLE} />);
      
      expect(getEquipmentStatusColor).toHaveBeenCalledWith(EQUIPMENT_STATUS.AVAILABLE);
    });

    it('should apply color classes returned by getEquipmentStatusColor', () => {
      const { getEquipmentStatusColor } = require('../../../utils/equipmentValidation');
      getEquipmentStatusColor.mockReturnValue('text-green-600 bg-green-100');
      
      const { container } = render(
        <EquipmentStatusBadge status={EQUIPMENT_STATUS.AVAILABLE} />
      );
      
      const badge = container.querySelector('span');
      expect(badge.className).toContain('text-green-600');
      expect(badge.className).toContain('bg-green-100');
    });

    it('should apply different colors for different statuses', () => {
      const { getEquipmentStatusColor } = require('../../../utils/equipmentValidation');
      
      // Test borrowed status
      getEquipmentStatusColor.mockReturnValue('text-yellow-600 bg-yellow-100');
      const { container: container1 } = render(
        <EquipmentStatusBadge status={EQUIPMENT_STATUS.BORROWED} />
      );
      expect(container1.querySelector('span').className).toContain('text-yellow-600');
      
      // Test maintenance status
      getEquipmentStatusColor.mockReturnValue('text-orange-600 bg-orange-100');
      const { container: container2 } = render(
        <EquipmentStatusBadge status={EQUIPMENT_STATUS.MAINTENANCE} />
      );
      expect(container2.querySelector('span').className).toContain('text-orange-600');
      
      // Test retired status
      getEquipmentStatusColor.mockReturnValue('text-red-600 bg-red-100');
      const { container: container3 } = render(
        <EquipmentStatusBadge status={EQUIPMENT_STATUS.RETIRED} />
      );
      expect(container3.querySelector('span').className).toContain('text-red-600');
    });
  });

  describe('Component Structure', () => {
    it('should render as a span element', () => {
      const { container } = render(
        <EquipmentStatusBadge status={EQUIPMENT_STATUS.AVAILABLE} />
      );
      
      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('should have inline-flex display', () => {
      const { container } = render(
        <EquipmentStatusBadge status={EQUIPMENT_STATUS.AVAILABLE} />
      );
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('inline-flex');
    });

    it('should have rounded-full class for pill shape', () => {
      const { container } = render(
        <EquipmentStatusBadge status={EQUIPMENT_STATUS.AVAILABLE} />
      );
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('rounded-full');
    });
  });
});
