import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  describe('Component Rendering', () => {
    it('should render footer with proper semantic structure', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    it('should render system information section', () => {
      render(<Footer />);

      expect(screen.getByText('Equipment Lending System')).toBeInTheDocument();
      expect(screen.getByText(/ระบบจัดการการยืม-คืนอุปกรณ์/)).toBeInTheDocument();
    });

    it('should render contact information section', () => {
      render(<Footer />);

      expect(screen.getByText('ติดต่อเรา')).toBeInTheDocument();
      expect(screen.getByText(/อีเมล:/)).toBeInTheDocument();
      expect(screen.getByText(/โทรศัพท์:/)).toBeInTheDocument();
    });

    it('should render quick links section', () => {
      render(<Footer />);

      expect(screen.getByText('ลิงก์ด่วน')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /คู่มือการใช้งาน/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /นโยบายความเป็นส่วนตัว/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /เงื่อนไขการใช้งาน/i })).toBeInTheDocument();
    });

    it('should render support section', () => {
      render(<Footer />);

      expect(screen.getByText('ช่วยเหลือ')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /คำถามที่พบบ่อย/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /รายงานปัญหา/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /ขอความช่วยเหลือ/i })).toBeInTheDocument();
    });

    it('should render copyright section', () => {
      render(<Footer />);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
      expect(screen.getByText(/สงวนลิขสิทธิ์/)).toBeInTheDocument();
    });
  });

  describe('Links and Navigation', () => {
    it('should have proper href attributes for quick links', () => {
      render(<Footer />);

      const userGuideLink = screen.getByRole('link', { name: /คู่มือการใช้งาน/i });
      const privacyLink = screen.getByRole('link', { name: /นโยบายความเป็นส่วนตัว/i });
      const termsLink = screen.getByRole('link', { name: /เงื่อนไขการใช้งาน/i });

      expect(userGuideLink).toHaveAttribute('href', '#user-guide');
      expect(privacyLink).toHaveAttribute('href', '#privacy');
      expect(termsLink).toHaveAttribute('href', '#terms');
    });

    it('should have proper href attributes for support links', () => {
      render(<Footer />);

      const faqLink = screen.getByRole('link', { name: /คำถามที่พบบ่อย/i });
      const reportLink = screen.getByRole('link', { name: /รายงานปัญหา/i });
      const helpLink = screen.getByRole('link', { name: /ขอความช่วยเหลือ/i });

      expect(faqLink).toHaveAttribute('href', '#faq');
      expect(reportLink).toHaveAttribute('href', '#report');
      expect(helpLink).toHaveAttribute('href', '#help');
    });

    it('should have proper email and phone links', () => {
      render(<Footer />);

      const emailLink = screen.getByRole('link', { name: /support@equipment-system\.com/i });
      const phoneLink = screen.getByRole('link', { name: /02-123-4567/i });

      expect(emailLink).toHaveAttribute('href', 'mailto:support@equipment-system.com');
      expect(phoneLink).toHaveAttribute('href', 'tel:+6621234567');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid layout', () => {
      const { container } = render(<Footer />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });

    it('should have responsive spacing', () => {
      const { container } = render(<Footer />);

      const footer = container.firstChild;
      expect(footer).toHaveClass('py-8', 'sm:py-12', 'px-4', 'sm:px-6', 'lg:px-8');
    });

    it('should have responsive text sizes', () => {
      render(<Footer />);

      const systemTitle = screen.getByText('Equipment Lending System');
      expect(systemTitle).toHaveClass('text-lg', 'sm:text-xl');
    });
  });

  describe('Visual Styling', () => {
    it('should have proper background and border styling', () => {
      const { container } = render(<Footer />);

      const footer = container.firstChild;
      expect(footer).toHaveClass('bg-gray-900', 'text-white', 'border-t', 'border-gray-800');
    });

    it('should have proper section heading styling', () => {
      render(<Footer />);

      const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
      sectionHeadings.forEach(heading => {
        expect(heading).toHaveClass('text-white', 'font-semibold', 'mb-4');
      });
    });

    it('should have proper link styling', () => {
      render(<Footer />);

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('text-gray-300', 'hover:text-white', 'transition-colors', 'duration-200');
      });
    });

    it('should have proper copyright styling', () => {
      render(<Footer />);

      const copyrightSection = screen.getByText(/© \d{4}/).closest('div');
      expect(copyrightSection).toHaveClass('border-t', 'border-gray-800', 'pt-6', 'sm:pt-8');
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();

      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(4); // System info, Contact, Quick links, Support
    });

    it('should have proper ARIA labels', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveAttribute('aria-label', 'ข้อมูลติดต่อและลิงก์เพิ่มเติม');
    });

    it('should have proper link accessibility', () => {
      render(<Footer />);

      const emailLink = screen.getByRole('link', { name: /support@equipment-system\.com/i });
      const phoneLink = screen.getByRole('link', { name: /02-123-4567/i });

      expect(emailLink).toHaveAttribute('aria-label', 'ส่งอีเมลถึงทีมสนับสนุน');
      expect(phoneLink).toHaveAttribute('aria-label', 'โทรหาทีมสนับสนุน');
    });

    it('should have focus management for links', () => {
      render(<Footer />);

      const firstLink = screen.getAllByRole('link')[0];
      
      // Focus the link
      firstLink.focus();
      expect(firstLink).toHaveFocus();

      // Check for focus styles
      expect(firstLink).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Content Accuracy', () => {
    it('should display current year in copyright', () => {
      render(<Footer />);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
    });

    it('should have consistent system name across sections', () => {
      render(<Footer />);

      const systemNames = screen.getAllByText('Equipment Lending System');
      expect(systemNames.length).toBeGreaterThan(0);
    });

    it('should have proper contact information format', () => {
      render(<Footer />);

      expect(screen.getByText(/อีเมล: support@equipment-system\.com/)).toBeInTheDocument();
      expect(screen.getByText(/โทรศัพท์: 02-123-4567/)).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should have proper container structure', () => {
      const { container } = render(<Footer />);

      const maxWidthContainer = container.querySelector('.max-w-7xl');
      expect(maxWidthContainer).toBeInTheDocument();
      expect(maxWidthContainer).toHaveClass('mx-auto');
    });

    it('should separate main content from copyright', () => {
      const { container } = render(<Footer />);

      const copyrightSection = container.querySelector('.border-t.border-gray-800');
      expect(copyrightSection).toBeInTheDocument();
    });

    it('should have proper spacing between sections', () => {
      render(<Footer />);

      const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
      sectionHeadings.forEach(heading => {
        expect(heading).toHaveClass('mb-4');
      });
    });
  });

  describe('Interactive Elements', () => {
    it('should have hover effects on links', () => {
      render(<Footer />);

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('hover:text-white', 'transition-colors', 'duration-200');
      });
    });

    it('should have focus states for keyboard navigation', () => {
      render(<Footer />);

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('focus:outline-none', 'focus:ring-2');
      });
    });
  });
});