import React from 'react';
import { render, screen } from '@testing-library/react';
import HeroSection from '../HeroSection';

describe('HeroSection', () => {
  const defaultProps = {
    title: 'Test System Title',
    subtitle: 'Test system description and benefits'
  };

  describe('Component Rendering', () => {
    it('renders title and subtitle', () => {
      render(<HeroSection {...defaultProps} />);

      expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
      expect(screen.getByText(defaultProps.subtitle)).toBeInTheDocument();
    });

    it('renders three feature highlight cards', () => {
      render(<HeroSection {...defaultProps} />);

      expect(screen.getByText('จัดการง่าย')).toBeInTheDocument();
      expect(screen.getByText('ตรวจสอบแบบเรียลไทม์')).toBeInTheDocument();
      expect(screen.getByText('ปลอดภัย')).toBeInTheDocument();
    });

    it('does not render call-to-action buttons anymore', () => {
      render(<HeroSection {...defaultProps} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('applies gradient background and decorative elements', () => {
      const { container } = render(<HeroSection {...defaultProps} />);

      const heroSection = container.querySelector('section');
      expect(heroSection).toHaveClass('bg-gradient-to-br', 'from-primary-50', 'to-blue-100');

      const decorativeElements = container.querySelectorAll('.absolute.rounded-full');
      expect(decorativeElements.length).toBeGreaterThan(0);
    });

    it('styles titles and subtitles correctly', () => {
      render(<HeroSection {...defaultProps} />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-4xl', 'sm:text-5xl', 'md:text-6xl', 'font-bold', 'text-gray-900');

      const subtitle = screen.getByText(defaultProps.subtitle);
      expect(subtitle).toHaveClass('text-lg', 'sm:text-xl', 'md:text-2xl', 'text-gray-600');
    });
  });

  describe('Responsive Layout', () => {
    it('uses responsive spacing and container constraints', () => {
      const { container } = render(<HeroSection {...defaultProps} />);

      const heroSection = container.querySelector('section');
      expect(heroSection).toHaveClass('py-12', 'sm:py-16', 'md:py-20', 'lg:py-24');

      const contentContainer = container.querySelector('.max-w-4xl');
      expect(contentContainer).toHaveClass('mx-auto', 'text-center');
    });

    it('keeps feature grid responsive', () => {
      const { container } = render(<HeroSection {...defaultProps} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Accessibility', () => {
    it('exposes semantic section and heading structure', () => {
      const { container } = render(<HeroSection {...defaultProps} />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('keeps feature descriptions readable', () => {
      render(<HeroSection {...defaultProps} />);

      expect(screen.getByText(/ระบบจัดการที่ใช้งานง่าย/)).toBeInTheDocument();
      expect(screen.getByText(/ติดตามสถานะอุปกรณ์/)).toBeInTheDocument();
      expect(screen.getByText(/ระบบรักษาความปลอดภัยข้อมูล/)).toBeInTheDocument();
    });
  });

  describe('Content Flexibility', () => {
    it('handles long titles gracefully', () => {
      const longTitle = 'This is a very long hero title that should wrap properly on smaller screens';
      render(<HeroSection {...defaultProps} title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles long subtitles gracefully', () => {
      const longSubtitle = 'This is a very long subtitle that provides detailed information about the system benefits and still fits the layout without breaking responsiveness.';
      render(<HeroSection {...defaultProps} subtitle={longSubtitle} />);

      expect(screen.getByText(longSubtitle)).toBeInTheDocument();
    });

    it('handles empty title or subtitle without crashing', () => {
      const { rerender } = render(<HeroSection {...defaultProps} title="" />);
      expect(screen.getByText(defaultProps.subtitle)).toBeInTheDocument();

      rerender(<HeroSection {...defaultProps} subtitle="" />);
      expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    });
  });

  describe('Animation and Cards', () => {
    it('applies subtle hover transitions to cards', () => {
      const { container } = render(<HeroSection {...defaultProps} />);

      const firstCard = container.querySelector('.shadow-sm');
      expect(firstCard).toHaveClass('transition-all', 'duration-200', 'hover:shadow-md');
    });

    it('renders icon-only SVGs as decorative', () => {
      const { container } = render(<HeroSection {...defaultProps} />);

      const icons = container.querySelectorAll('svg');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});