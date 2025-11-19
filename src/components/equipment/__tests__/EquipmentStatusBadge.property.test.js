import React from 'react';
import { render } from '@testing-library/react';
import fc from 'fast-check';
import EquipmentStatusBadge from '../EquipmentStatusBadge';
import { EQUIPMENT_STATUS, EQUIPMENT_STATUS_LABELS } from '../../../types/equipment';
import { getEquipmentStatusColor } from '../../../utils/equipmentValidation';

/**
 * Property-Based Tests for EquipmentStatusBadge
 * Using fast-check to verify properties hold across all valid inputs
 */

describe('EquipmentStatusBadge Property-Based Tests', () => {
  // **Feature: code-cleanup-refactoring, Property 1: Status badge renders correct color and label**
  describe('Property 1: Status badge renders correct color and label', () => {
    it('should render correct color class and label for any valid status', () => {
      // Generator for valid equipment statuses
      const validStatusArbitrary = fc.constantFrom(
        EQUIPMENT_STATUS.AVAILABLE,
        EQUIPMENT_STATUS.BORROWED,
        EQUIPMENT_STATUS.MAINTENANCE,
        EQUIPMENT_STATUS.RETIRED
      );

      fc.assert(
        fc.property(validStatusArbitrary, (status) => {
          // Render the component
          const { container, getByText, unmount } = render(
            <EquipmentStatusBadge status={status} />
          );

          try {
            // Get the expected label and color
            const expectedLabel = EQUIPMENT_STATUS_LABELS[status];
            const expectedColor = getEquipmentStatusColor(status);

            // Assert the label is rendered
            const labelElement = getByText(expectedLabel);
            expect(labelElement).toBeInTheDocument();

            // Assert the color classes are applied
            const badge = container.querySelector('span');
            expect(badge).toBeTruthy();
            
            // Check that the color string is included in the className
            const colorClasses = expectedColor.split(' ');
            colorClasses.forEach(colorClass => {
              expect(badge.className).toContain(colorClass);
            });

            return true;
          } finally {
            // Clean up after each render
            unmount();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should render correct label for any valid status with any size', () => {
      // Generator for valid equipment statuses
      const validStatusArbitrary = fc.constantFrom(
        EQUIPMENT_STATUS.AVAILABLE,
        EQUIPMENT_STATUS.BORROWED,
        EQUIPMENT_STATUS.MAINTENANCE,
        EQUIPMENT_STATUS.RETIRED
      );

      // Generator for valid sizes
      const validSizeArbitrary = fc.constantFrom('sm', 'md', 'lg');

      fc.assert(
        fc.property(validStatusArbitrary, validSizeArbitrary, (status, size) => {
          // Render the component
          const { getByText, unmount } = render(
            <EquipmentStatusBadge status={status} size={size} />
          );

          try {
            // Get the expected label
            const expectedLabel = EQUIPMENT_STATUS_LABELS[status];

            // Assert the label is rendered
            const labelElement = getByText(expectedLabel);
            expect(labelElement).toBeInTheDocument();

            return true;
          } finally {
            // Clean up after each render
            unmount();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should apply size-specific classes for any valid status and size combination', () => {
      // Generator for valid equipment statuses
      const validStatusArbitrary = fc.constantFrom(
        EQUIPMENT_STATUS.AVAILABLE,
        EQUIPMENT_STATUS.BORROWED,
        EQUIPMENT_STATUS.MAINTENANCE,
        EQUIPMENT_STATUS.RETIRED
      );

      // Generator for valid sizes
      const validSizeArbitrary = fc.constantFrom('sm', 'md', 'lg');

      // Expected size classes
      const sizeClasses = {
        sm: ['px-1.5', 'py-0.5', 'text-xs'],
        md: ['px-2.5', 'py-0.5', 'text-xs'],
        lg: ['px-3', 'py-1', 'text-sm']
      };

      fc.assert(
        fc.property(validStatusArbitrary, validSizeArbitrary, (status, size) => {
          // Render the component
          const { container, unmount } = render(
            <EquipmentStatusBadge status={status} size={size} />
          );

          try {
            // Get the badge element
            const badge = container.querySelector('span');
            expect(badge).toBeTruthy();

            // Assert the size classes are applied
            const expectedClasses = sizeClasses[size];
            expectedClasses.forEach(className => {
              expect(badge).toHaveClass(className);
            });

            return true;
          } finally {
            unmount();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should always render with base structural classes regardless of status', () => {
      // Generator for valid equipment statuses
      const validStatusArbitrary = fc.constantFrom(
        EQUIPMENT_STATUS.AVAILABLE,
        EQUIPMENT_STATUS.BORROWED,
        EQUIPMENT_STATUS.MAINTENANCE,
        EQUIPMENT_STATUS.RETIRED
      );

      fc.assert(
        fc.property(validStatusArbitrary, (status) => {
          // Render the component
          const { container, unmount } = render(
            <EquipmentStatusBadge status={status} />
          );

          try {
            // Get the badge element
            const badge = container.querySelector('span');
            expect(badge).toBeTruthy();

            // Assert base structural classes are always present
            expect(badge).toHaveClass('inline-flex');
            expect(badge).toHaveClass('items-center');
            expect(badge).toHaveClass('rounded-full');
            expect(badge).toHaveClass('font-medium');

            return true;
          } finally {
            unmount();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle invalid statuses gracefully by showing "Unknown"', () => {
      // Generator for random strings that are NOT valid statuses
      // Exclude object property names and other problematic strings
      const invalidStatusArbitrary = fc.string().filter(str => {
        // Exclude valid statuses
        if (Object.values(EQUIPMENT_STATUS).includes(str)) return false;
        // Exclude object property names that could cause issues
        const problematicNames = ['toString', 'valueOf', 'constructor', 'prototype', '__proto__'];
        if (problematicNames.includes(str)) return false;
        return true;
      });

      fc.assert(
        fc.property(invalidStatusArbitrary, (invalidStatus) => {
          // Render the component
          const { getByText, unmount } = render(
            <EquipmentStatusBadge status={invalidStatus} />
          );

          try {
            // Assert "Unknown" is rendered for invalid status
            const unknownElement = getByText('Unknown');
            expect(unknownElement).toBeInTheDocument();

            return true;
          } finally {
            unmount();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve custom className for any valid status', () => {
      // Generator for valid equipment statuses
      const validStatusArbitrary = fc.constantFrom(
        EQUIPMENT_STATUS.AVAILABLE,
        EQUIPMENT_STATUS.BORROWED,
        EQUIPMENT_STATUS.MAINTENANCE,
        EQUIPMENT_STATUS.RETIRED
      );

      // Generator for custom class names
      const customClassArbitrary = fc.string({ minLength: 1, maxLength: 20 }).filter(
        str => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(str)
      );

      fc.assert(
        fc.property(validStatusArbitrary, customClassArbitrary, (status, customClass) => {
          // Render the component
          const { container, unmount } = render(
            <EquipmentStatusBadge status={status} className={customClass} />
          );

          try {
            // Get the badge element
            const badge = container.querySelector('span');
            expect(badge).toBeTruthy();

            // Assert custom class is applied
            expect(badge).toHaveClass(customClass);

            // Assert base classes are still present
            expect(badge).toHaveClass('inline-flex');
            expect(badge).toHaveClass('rounded-full');

            return true;
          } finally {
            unmount();
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
