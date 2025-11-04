import React from 'react';
import { render, screen } from '@testing-library/react';
import StatsCard from '../StatsCard';

// Mock icon component
const MockIcon = () => <div data-testid="mock-icon">Icon</div>;

describe('StatsCard', () => {
  const defaultProps = {
    title: 'Test Equipment',
    value: 100,
    icon: <MockIcon />,
    color: 'blue'
  };

  describe('Component Rendering', () => {
    it('should render card with title and value', () => {
      render(<StatsCard {...defaultProps} />);

      expect(screen.getByText('Test Equipment')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('should format numeric values with Thai locale', () => {
      render(<StatsCard {...defaultProps} value={1234567} />);

      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('should handle string values', () => {
      render(<StatsCard {...defaultProps} value="N/A" />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should render with different color variants', () => {
      const colors = ['blue', 'green', 'orange', 'purple'];
      
      colors.forEach(color => {
        const { container, unmount } = render(
          <StatsCard {...defaultProps} color={color} />
        );
        
        // Check that the component renders without errors
        expect(screen.getByText('Test Equipment')).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should default to blue color when invalid color is provided', () => {
      render(<StatsCard {...defaultProps} color="invalid-color" />);

      expect(screen.getByText('Test Equipment')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when loading is true', () => {
      render(<StatsCard {...defaultProps} loading={true} />);

      // Should show loading skeleton instead of content
      expect(screen.queryByText('Test Equipment')).not.toBeInTheDocument();
      expect(screen.queryByText('100')).not.toBeInTheDocument();
      
      // Check for loading animation
      const loadingElement = document.querySelector('.animate-pulse');
      expect(loadingElement).toBeInTheDocument();
    });

    it('should not show loading skeleton when loading is false', () => {
      render(<StatsCard {...defaultProps} loading={false} />);

      expect(screen.getByText('Test Equipment')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should show error indicator when error is true', () => {
      render(<StatsCard {...defaultProps} error={true} />);

      expect(screen.getByText('Test Equipment')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      
      // Check for error styling
      expect(screen.getByText('ข้อมูลเก่า')).toBeInTheDocument();
    });

    it('should show network error indicator', () => {
      render(<StatsCard {...defaultProps} error={true} errorType="network" />);

      expect(screen.getByText('ไม่มีเครือข่าย')).toBeInTheDocument();
      expect(screen.getByText('🌐')).toBeInTheDocument();
    });

    it('should show firestore error indicator', () => {
      render(<StatsCard {...defaultProps} error={true} errorType="firestore" />);

      expect(screen.getByText('ข้อมูลเก่า')).toBeInTheDocument();
      expect(screen.getByText('🔌')).toBeInTheDocument();
    });

    it('should show general error indicator', () => {
      render(<StatsCard {...defaultProps} error={true} errorType="general" />);

      expect(screen.getByText('ข้อมูลเก่า')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('Offline State', () => {
    it('should show offline indicator when offline is true', () => {
      render(<StatsCard {...defaultProps} offline={true} />);

      expect(screen.getByText('ออฟไลน์')).toBeInTheDocument();
    });

    it('should apply offline styling', () => {
      render(<StatsCard {...defaultProps} offline={true} />);

      // Check for offline status indicator
      const statusElement = screen.getByText('ออฟไลน์');
      expect(statusElement).toHaveClass('text-yellow-600');
    });
  });

  describe('Degraded Mode', () => {
    it('should show degraded mode indicator', () => {
      render(<StatsCard {...defaultProps} degradedMode={true} />);

      expect(screen.getByText('โหมดจำกัด')).toBeInTheDocument();
    });

    it('should show data age when in degraded mode', () => {
      const dataAge = 300000; // 5 minutes in milliseconds
      render(<StatsCard {...defaultProps} degradedMode={true} dataAge={dataAge} />);

      expect(screen.getByText('5 นาทีที่แล้ว')).toBeInTheDocument();
    });

    it('should not show hover effects in degraded mode', () => {
      const { container } = render(<StatsCard {...defaultProps} degradedMode={true} />);

      const cardElement = container.firstChild;
      expect(cardElement).toHaveClass('degraded-mode');
      expect(cardElement).not.toHaveClass('hover:shadow-md', 'hover:-translate-y-1');
    });
  });

  describe('Status Indicators', () => {
    it('should show default status when no special states are active', () => {
      render(<StatsCard {...defaultProps} />);

      expect(screen.getByText('อัปเดตล่าสุด')).toBeInTheDocument();
    });

    it('should prioritize error state over offline state', () => {
      render(<StatsCard {...defaultProps} error={true} offline={true} />);

      expect(screen.getByText('ข้อมูลเก่า')).toBeInTheDocument();
      expect(screen.queryByText('ออฟไลน์')).not.toBeInTheDocument();
    });

    it('should prioritize offline state over degraded mode', () => {
      render(<StatsCard {...defaultProps} offline={true} degradedMode={true} />);

      expect(screen.getByText('ออฟไลน์')).toBeInTheDocument();
      expect(screen.queryByText('โหมดจำกัด')).not.toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should apply correct color classes for blue variant', () => {
      const { container } = render(<StatsCard {...defaultProps} color="blue" />);

      // Check for blue color classes in the DOM
      expect(container.querySelector('.text-primary-600')).toBeInTheDocument();
      expect(container.querySelector('.text-primary-900')).toBeInTheDocument();
    });

    it('should apply correct color classes for green variant', () => {
      const { container } = render(<StatsCard {...defaultProps} color="green" />);

      // Check for green color classes in the DOM
      expect(container.querySelector('.text-green-600')).toBeInTheDocument();
      expect(container.querySelector('.text-green-900')).toBeInTheDocument();
    });

    it('should apply correct color classes for orange variant', () => {
      const { container } = render(<StatsCard {...defaultProps} color="orange" />);

      // Check for orange color classes in the DOM
      expect(container.querySelector('.text-orange-600')).toBeInTheDocument();
      expect(container.querySelector('.text-orange-900')).toBeInTheDocument();
    });

    it('should apply correct color classes for purple variant', () => {
      const { container } = render(<StatsCard {...defaultProps} color="purple" />);

      // Check for purple color classes in the DOM
      expect(container.querySelector('.text-purple-600')).toBeInTheDocument();
      expect(container.querySelector('.text-purple-900')).toBeInTheDocument();
    });

    it('should have proper card styling', () => {
      const { container } = render(<StatsCard {...defaultProps} />);

      const cardElement = container.firstChild;
      expect(cardElement).toHaveClass(
        'bg-white',
        'rounded-xl',
        'shadow-sm',
        'border',
        'transition-all',
        'duration-200'
      );
    });

    it('should have hover effects when not in degraded mode', () => {
      const { container } = render(<StatsCard {...defaultProps} />);

      const cardElement = container.firstChild;
      expect(cardElement).toHaveClass('hover:shadow-md', 'hover:-translate-y-1');
    });
  });

  describe('Accessibility', () => {
    it('should have proper text contrast for readability', () => {
      render(<StatsCard {...defaultProps} />);

      const titleElement = screen.getByText('Test Equipment');
      const valueElement = screen.getByText('100');

      // Check that text elements have appropriate color classes for contrast
      expect(titleElement).toHaveClass('text-primary-900');
      expect(valueElement).toHaveClass('text-gray-900');
    });

    it('should maintain readability in error states', () => {
      render(<StatsCard {...defaultProps} error={true} />);

      const titleElement = screen.getByText('Test Equipment');
      expect(titleElement).toHaveClass('text-orange-800');
    });

    it('should maintain readability in offline states', () => {
      render(<StatsCard {...defaultProps} offline={true} />);

      const titleElement = screen.getByText('Test Equipment');
      expect(titleElement).toHaveClass('text-yellow-800');
    });
  });

  describe('Animation States', () => {
    it('should have pulse animation for status indicator', () => {
      render(<StatsCard {...defaultProps} />);

      const statusIndicator = document.querySelector('.animate-pulse');
      expect(statusIndicator).toBeInTheDocument();
    });

    it('should have different pulse animation for error state', () => {
      render(<StatsCard {...defaultProps} error={true} />);

      const errorIndicator = document.querySelector('.bg-orange-400.animate-pulse');
      expect(errorIndicator).toBeInTheDocument();
    });

    it('should have different pulse animation for offline state', () => {
      render(<StatsCard {...defaultProps} offline={true} />);

      const offlineIndicator = document.querySelector('.bg-yellow-400.animate-pulse');
      expect(offlineIndicator).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      render(<StatsCard {...defaultProps} value={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle negative values', () => {
      render(<StatsCard {...defaultProps} value={-5} />);

      expect(screen.getByText('-5')).toBeInTheDocument();
    });

    it('should handle very large numbers', () => {
      render(<StatsCard {...defaultProps} value={999999999} />);

      expect(screen.getByText('999,999,999')).toBeInTheDocument();
    });

    it('should handle missing icon gracefully', () => {
      render(<StatsCard {...defaultProps} icon={null} />);

      expect(screen.getByText('Test Equipment')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should handle missing title gracefully', () => {
      render(<StatsCard {...defaultProps} title="" />);

      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });
});