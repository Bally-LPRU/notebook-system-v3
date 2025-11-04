import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';

describe('Header', () => {
  const defaultProps = {
    onLoginClick: jest.fn(),
    isLoading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render header with logo and system name', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('Equipment Lending System')).toBeInTheDocument();
      expect(screen.getByText('ELS')).toBeInTheDocument();
    });

    it('should render navigation links on desktop', () => {
      render(<Header {...defaultProps} />);

      // Desktop navigation (hidden on mobile)
      const desktopNav = screen.getAllByRole('navigation')[0];
      expect(desktopNav).toBeInTheDocument();
      
      // Check for navigation links
      expect(screen.getAllByText('สถิติ')).toHaveLength(2); // Desktop and mobile
      expect(screen.getAllByText('เกี่ยวกับ')).toHaveLength(2);
      expect(screen.getAllByText('ติดต่อ')).toHaveLength(2);
    });

    it('should render mobile navigation menu', () => {
      render(<Header {...defaultProps} />);

      // Mobile navigation should be present
      const mobileNav = screen.getAllByRole('navigation')[1];
      expect(mobileNav).toBeInTheDocument();
    });

    it('should render login button', () => {
      render(<Header {...defaultProps} />);

      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).not.toBeDisabled();
    });
  });

  describe('Login Button Functionality', () => {
    it('should call onLoginClick when login button is clicked', () => {
      const mockOnLoginClick = jest.fn();
      render(<Header {...defaultProps} onLoginClick={mockOnLoginClick} />);

      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      fireEvent.click(loginButton);

      expect(mockOnLoginClick).toHaveBeenCalledTimes(1);
    });

    it('should show loading state when isLoading is true', () => {
      render(<Header {...defaultProps} isLoading={true} />);

      const loginButton = screen.getByRole('button');
      expect(loginButton).toBeDisabled();
      expect(screen.getByText(/กำลังเข้าสู่ระบบ/)).toBeInTheDocument();
      expect(screen.getByText(/กำลังโหลด/)).toBeInTheDocument();
    });

    it('should show loading spinner when isLoading is true', () => {
      render(<Header {...defaultProps} isLoading={true} />);

      // Check for loading spinner (div with animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not call onLoginClick when button is disabled', () => {
      const mockOnLoginClick = jest.fn();
      render(<Header {...defaultProps} onLoginClick={mockOnLoginClick} isLoading={true} />);

      const loginButton = screen.getByRole('button');
      fireEvent.click(loginButton);

      expect(mockOnLoginClick).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href attributes for navigation links', () => {
      render(<Header {...defaultProps} />);

      const statsLinks = screen.getAllByRole('link', { name: /สถิติ/i });
      const aboutLinks = screen.getAllByRole('link', { name: /เกี่ยวกับ/i });
      const contactLinks = screen.getAllByRole('link', { name: /ติดต่อ/i });

      statsLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '#stats');
      });

      aboutLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '#about');
      });

      contactLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '#contact');
      });
    });

    it('should have proper focus management for navigation links', () => {
      render(<Header {...defaultProps} />);

      const firstStatsLink = screen.getAllByRole('link', { name: /สถิติ/i })[0];
      
      // Focus the link
      firstStatsLink.focus();
      expect(firstStatsLink).toHaveFocus();

      // Check for focus styles (focus:ring classes should be present)
      expect(firstStatsLink).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Responsive Design', () => {
    it('should show full system name on larger screens', () => {
      render(<Header {...defaultProps} />);

      const fullName = screen.getByText('Equipment Lending System');
      expect(fullName).toHaveClass('hidden', 'sm:inline');
    });

    it('should show abbreviated name on mobile', () => {
      render(<Header {...defaultProps} />);

      const abbreviatedName = screen.getByText('ELS');
      expect(abbreviatedName).toHaveClass('sm:hidden');
    });

    it('should show different login button text on different screen sizes', () => {
      render(<Header {...defaultProps} />);

      // Both full and abbreviated text should be present with responsive classes
      expect(screen.getAllByText('เข้าสู่ระบบ')).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Header {...defaultProps} />);

      const banner = screen.getByRole('banner');
      expect(banner).toHaveAttribute('aria-label', 'หัวเรื่องหลักและการนำทาง');

      const desktopNav = screen.getAllByRole('navigation')[0];
      expect(desktopNav).toHaveAttribute('aria-label', 'การนำทางหลัก');

      const mobileNav = screen.getAllByRole('navigation')[1];
      expect(mobileNav).toHaveAttribute('aria-label', 'การนำทางสำหรับมือถือ');
    });

    it('should have screen reader descriptions for navigation links', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByText('ดูสถิติการใช้งานอุปกรณ์')).toHaveClass('sr-only');
      expect(screen.getByText('เรียนรู้เกี่ยวกับระบบ')).toHaveClass('sr-only');
      expect(screen.getByText('ข้อมูลการติดต่อ')).toHaveClass('sr-only');
    });

    it('should have proper button descriptions', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByText('คลิกเพื่อเข้าสู่ระบบด้วย Google')).toHaveClass('sr-only');
    });

    it('should update button description when loading', () => {
      render(<Header {...defaultProps} isLoading={true} />);

      expect(screen.getByText('กำลังดำเนินการเข้าสู่ระบบ')).toHaveClass('sr-only');
    });

    it('should have proper logo accessibility', () => {
      render(<Header {...defaultProps} />);

      const logoIcon = document.querySelector('svg');
      expect(logoIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Visual Design', () => {
    it('should have proper styling classes', () => {
      render(<Header {...defaultProps} />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('bg-white', 'shadow-sm', 'border-b', 'sticky', 'top-0', 'z-50');
    });

    it('should have proper logo styling', () => {
      render(<Header {...defaultProps} />);

      const logoContainer = document.querySelector('.bg-primary-600');
      expect(logoContainer).toBeInTheDocument();
      expect(logoContainer).toHaveClass('rounded-lg', 'flex', 'items-center', 'justify-center');
    });

    it('should have proper button styling', () => {
      render(<Header {...defaultProps} />);

      const loginButton = screen.getByRole('button');
      expect(loginButton).toHaveClass(
        'bg-primary-600',
        'text-white',
        'rounded-lg',
        'font-medium',
        'hover:bg-primary-700',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-primary-500'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onLoginClick prop gracefully', () => {
      const { container } = render(<Header isLoading={false} />);
      
      const loginButton = screen.getByRole('button');
      
      // Should not throw error when clicked
      expect(() => {
        fireEvent.click(loginButton);
      }).not.toThrow();
    });

    it('should handle undefined isLoading prop', () => {
      render(<Header onLoginClick={jest.fn()} />);

      const loginButton = screen.getByRole('button');
      expect(loginButton).not.toBeDisabled();
      expect(screen.getAllByText('เข้าสู่ระบบ')).toHaveLength(2); // Desktop and mobile versions
    });
  });
});