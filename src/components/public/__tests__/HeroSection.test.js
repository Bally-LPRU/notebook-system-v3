import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HeroSection from '../HeroSection';

describe('HeroSection', () => {
  const defaultProps = {
    title: 'Test System Title',
    subtitle: 'Test system description and benefits',
    onGetStarted: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render title and subtitle', () => {
      render(<HeroSection {...defaultProps} />);

      expect(screen.getByText('Test System Title')).toBeInTheDocument();
      expect(screen.getByText('Test system description and benefits')).toBeInTheDocument();
    });

    it('should render get started button', () => {
      render(<HeroSection {...defaultProps} />);

      const getStartedButton = screen.getByRole('button', { name: /เริ่มต้นใช้งาน/i });
      expect(getStartedButton).toBeInTheDocument();
    });

    it('should render decorative elements', () => {
      render(<HeroSection {...defaultProps} />);

      // Check for decorative background elements
      const decorativeElements = document.querySelectorAll('.absolute');
      expect(decorativeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Button Functionality', () => {
    it('should call onGetStarted when button is clicked', () => {
      const mockOnGetStarted = jest.fn();
      render(<HeroSection {...defaultProps} onGetStarted={mockOnGetStarted} />);

      const getStartedButton = screen.getByRole('button', { name: /เริ่มต้นใช้งาน/i });
      fireEvent.click(getStartedButton);

      expect(mockOnGetStarted).toHaveBeenCalledTimes(1);
    });

    it('should handle missing onGetStarted prop gracefully', () => {
      const { title, subtitle } = defaultProps;
      render(<HeroSection title={title} subtitle={subtitle} />);

      const getStartedButton = screen.getByRole('button', { name: /เริ่มต้นใช้งาน/i });
      
      expect(() => {
        fireEvent.click(getStartedButton);
      }).not.toThrow();
    });
  });

  describe('Typography and Styling', () => {
    it('should have proper heading hierarchy', () => {
      render(<HeroSection {...defaultProps} />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Test System Title');
    });

    it('should have proper text styling classes', () => {
      render(<HeroSection {...defaultProps} />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-4xl', 'sm:text-5xl', 'md:text-6xl', 'font-bold');
    });

    it('should have proper button styling', () => {
      render(<HeroSection {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'bg-primary-600',
        'text-white',
        'px-8',
        'py-4',
        'rounded-xl',
        'text-lg',
        'font-semibold',
        'hover:bg-primary-700',
        'focus:outline-none',
        'focus:ring-4',
        'focus:ring-primary-300'
      );
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive text sizes', () => {
      render(<HeroSection {...defaultProps} />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-4xl', 'sm:text-5xl', 'md:text-6xl');

      const subtitle = screen.getByText(defaultProps.subtitle);
      expect(subtitle).toHaveClass('text-lg', 'sm:text-xl', 'md:text-2xl');
    });

    it('should have responsive padding and margins', () => {
      const { container } = render(<HeroSection {...defaultProps} />);

      const heroSection = container.firstChild;
      expect(heroSection).toHaveClass('py-12', 'sm:py-16', 'md:py-20', 'lg:py-24');
    });

    it('should have responsive button sizing', () => {
      render(<HeroSection {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-8', 'py-4', 'text-lg');
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<HeroSection {...defaultProps} />);

      // Should have main heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();

      // Should have button with proper role
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(<HeroSection {...defaultProps} />);

      const button = screen.getByRole('button');
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();

      // Check for focus styles
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-4');
    });

    it('should have descriptive button text', () => {
      render(<HeroSection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /เริ่มต้นใช้งาน/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('should have gradient background', () => {
      const { container } = render(<HeroSection {...defaultProps} />);

      const heroSection = container.firstChild;
      expect(heroSection).toHaveClass('bg-gradient-to-br', 'from-primary-50', 'to-blue-100');
    });

    it('should have decorative background elements', () => {
      render(<HeroSection {...defaultProps} />);

      // Check for decorative circles
      const decorativeElements = document.querySelectorAll('.absolute.rounded-full');
      expect(decorativeElements.length).toBeGreaterThan(0);
    });

    it('should have proper text colors', () => {
      render(<HeroSection {...defaultProps} />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-gray-900');

      const subtitle = screen.getByText(defaultProps.subtitle);
      expect(subtitle).toHaveClass('text-gray-600');
    });

    it('should have hover effects on button', () => {
      render(<HeroSection {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-primary-700', 'hover:shadow-lg', 'hover:-translate-y-1');
    });
  });

  describe('Content Flexibility', () => {
    it('should handle long titles gracefully', () => {
      const longTitle = 'This is a very long title that should wrap properly on smaller screens and maintain readability';
      render(<HeroSection {...defaultProps} title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle long subtitles gracefully', () => {
      const longSubtitle = 'This is a very long subtitle that provides detailed information about the system and its benefits for users who want to understand what they are getting into';
      render(<HeroSection {...defaultProps} subtitle={longSubtitle} />);

      expect(screen.getByText(longSubtitle)).toBeInTheDocument();
    });

    it('should handle empty title', () => {
      render(<HeroSection {...defaultProps} title="" />);

      expect(screen.getByText(defaultProps.subtitle)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle empty subtitle', () => {
      render(<HeroSection {...defaultProps} subtitle="" />);

      expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Animation and Transitions', () => {
    it('should have transition classes on button', () => {
      render(<HeroSection {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all', 'duration-300');
    });

    it('should have transform classes for hover effects', () => {
      render(<HeroSection {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:-translate-y-1');
    });
  });

  describe('Layout Structure', () => {
    it('should have proper container structure', () => {
      const { container } = render(<HeroSection {...defaultProps} />);

      // Check for main container
      const heroSection = container.firstChild;
      expect(heroSection).toHaveClass('relative', 'overflow-hidden');

      // Check for content container
      const contentContainer = container.querySelector('.max-w-4xl');
      expect(contentContainer).toBeInTheDocument();
    });

    it('should center content properly', () => {
      const { container } = render(<HeroSection {...defaultProps} />);

      const contentContainer = container.querySelector('.max-w-4xl');
      expect(contentContainer).toHaveClass('mx-auto', 'text-center');
    });

    it('should have proper spacing between elements', () => {
      render(<HeroSection {...defaultProps} />);

      const subtitle = screen.getByText(defaultProps.subtitle);
      expect(subtitle).toHaveClass('mb-8', 'sm:mb-10');
    });
  });
});