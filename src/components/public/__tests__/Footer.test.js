import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  describe('Component Rendering', () => {
    it('renders semantic footer with company summary and contact info', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      expect(screen.getByText('Equipment Lending System')).toBeInTheDocument();
      expect(screen.getByText(/ระบบจัดการการยืม-คืนอุปกรณ์/)).toBeInTheDocument();
      expect(screen.getByText('ติดต่อเรา')).toBeInTheDocument();
      expect(screen.getByText(/มหาวิทยาลัยราชภัฏลำปาง/)).toBeInTheDocument();
      expect(screen.getByText(/เวลาทำการ/)).toBeInTheDocument();
    });

    it('shows legal bar with current year and attribution', () => {
      render(<Footer />);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
      expect(screen.getByText(/ให้บริการโดยทีม Equipment Lending System/)).toBeInTheDocument();
    });
  });

  describe('Contact Links', () => {
    it('provides accessible email and phone links', () => {
      render(<Footer />);

      const emailLink = screen.getByRole('link', { name: /อีเมล: support@equipment-system\.com/i });
      const phoneLink = screen.getByRole('link', { name: /โทรศัพท์: 02-123-4567/i });

      expect(emailLink).toHaveAttribute('href', 'mailto:support@equipment-system.com');
      expect(phoneLink).toHaveAttribute('href', 'tel:+6621234567');

      expect(emailLink).toHaveClass('focus:ring-2', 'focus:ring-primary-500');
      expect(phoneLink).toHaveClass('focus:ring-2', 'focus:ring-primary-500');
    });
  });

  describe('Responsive Design', () => {
    it('uses two-column layout on medium screens', () => {
      const { container } = render(<Footer />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    it('applies responsive spacing', () => {
      const { container } = render(<Footer />);

      const footer = container.firstChild;
      expect(footer).toHaveClass('py-8', 'sm:py-12', 'px-4', 'sm:px-6', 'lg:px-8');
    });
  });

  describe('Visual Styling', () => {
    it('uses dark background and bordered sections', () => {
      const { container } = render(<Footer />);

      const footer = container.firstChild;
      expect(footer).toHaveClass('bg-gray-900', 'text-white', 'border-t', 'border-gray-800');

      const headings = screen.getAllByRole('heading', { level: 3 });
      headings.forEach(heading => {
        expect(heading).toHaveClass('text-white', 'font-semibold', 'mb-4');
      });
    });

    it('keeps contact links styled for readability', () => {
      render(<Footer />);

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('text-gray-300', 'hover:text-white', 'transition-colors', 'duration-200');
      });
    });
  });

  describe('Accessibility', () => {
    it('exposes aria-label and heading structure', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveAttribute('aria-label', 'ข้อมูลติดต่อและลิงก์เพิ่มเติม');

      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(2); // Company info + contact info
    });

    it('keeps address content readable without links', () => {
      render(<Footer />);

      expect(screen.getByText(/119 หมู่ 9 ตำบลชมพู/)).toBeInTheDocument();
      expect(screen.getByText(/08:30 - 16:30/)).toBeInTheDocument();
    });
  });

  describe('Content Accuracy', () => {
    it('shows consistent contact information', () => {
      render(<Footer />);

      expect(screen.getByText(/อีเมล: support@equipment-system\.com/)).toBeInTheDocument();
      expect(screen.getByText(/โทรศัพท์: 02-123-4567/)).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('maintains keyboard focus states on actionable links', () => {
      render(<Footer />);

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        link.focus();
        expect(link).toHaveFocus();
        expect(link).toHaveClass('focus:outline-none', 'focus:ring-2');
      });
    });
  });
});