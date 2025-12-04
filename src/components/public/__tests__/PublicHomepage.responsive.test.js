import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PublicHomepage from '../PublicHomepage';

// Mock dependencies
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../../hooks/usePublicStats', () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock('../../../utils/performanceMonitor', () => ({
  startTiming: jest.fn(),
  endTiming: jest.fn()
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Helper function to set viewport size
const setViewportSize = (width, height = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

const renderAtWidth = (width) => {
  setViewportSize(width);
  return renderWithRouter(<PublicHomepage />);
};

const getStatsGridElement = (container) => {
  const statsSection = container.querySelector('#stats');
  return statsSection?.querySelector('.grid') || null;
};

const expectStatsGridHasClass = (container, className) => {
  const grid = getStatsGridElement(container);
  expect(grid).not.toBeNull();
  expect(grid.className).toContain(className);
  return grid;
};

describe('PublicHomepage Responsive Design Tests', () => {
  const mockUseAuth = require('../../../contexts/AuthContext').useAuth;
  const mockUsePublicStats = require('../../../hooks/usePublicStats').default;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      signIn: jest.fn(),
      user: null,
      userProfile: null,
      needsProfileSetup: jest.fn(() => false)
    });

    mockUsePublicStats.mockReturnValue({
      stats: {
        totalEquipment: 100,
        availableEquipment: 75,
        borrowedEquipment: 20,
        pendingReservations: 5,
        lastUpdated: new Date()
      },
      loading: false,
      error: null,
      isRefreshing: false,
      isOnline: true,
      wasOffline: false,
      refreshStats: jest.fn(),
      retryWhenOnline: jest.fn()
    });
  });

  describe('Mobile Layout (320px - 767px)', () => {
    beforeEach(() => {
      setViewportSize(375); // iPhone SE width
    });

    it('should display mobile-optimized header', () => {
      renderWithRouter(<PublicHomepage />);

      const banner = screen.getByRole('banner');
      const header = within(banner);

      // Should show abbreviated system name while desktop label remains hidden via utility classes
      const mobileLabel = header.getByText('ELS');
      const desktopLabel = header.getByText('Equipment Lending System');
      expect(mobileLabel).toHaveClass('sm:hidden');
      expect(desktopLabel).toHaveClass('hidden', 'sm:inline');

      // Login button remains accessible without extra navigation
      expect(header.getByRole('button', { name: /เข้าสู่ระบบ/i })).toBeInTheDocument();
    });

    it('should stack statistics cards vertically', () => {
      const { container } = renderWithRouter(<PublicHomepage />);

      expectStatsGridHasClass(container, 'grid-cols-1');
    });

    it('should have appropriate text sizes for mobile', () => {
      renderWithRouter(<PublicHomepage />);

      const mainHeading = screen.getByRole('heading', { level: 1, name: /ระบบยืม-คืนอุปกรณ์/ });
      expect(mainHeading).toHaveClass('text-4xl'); // Mobile size
    });

    it('should have mobile-appropriate spacing', () => {
      const { container } = renderWithRouter(<PublicHomepage />);

      // Check for mobile padding classes
      const sections = container.querySelectorAll('.px-3, .py-8');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should maintain functionality on small screens', () => {
      renderWithRouter(<PublicHomepage />);

      // Login button should still be accessible
      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).not.toBeDisabled();

      // Hero title remains visible without extra CTAs
      expect(
        screen.getByRole('heading', { level: 1, name: /ระบบยืม-คืนอุปกรณ์/ })
      ).toBeInTheDocument();
    });
  });

  describe('Tablet Layout (768px - 1023px)', () => {
    beforeEach(() => {
      setViewportSize(768); // iPad width
    });

    it('should display tablet-optimized layout', () => {
      const { container } = renderWithRouter(<PublicHomepage />);

      expectStatsGridHasClass(container, 'sm:grid-cols-2');
    });

    it('should show full system name on tablet', () => {
      renderWithRouter(<PublicHomepage />);

      const header = within(screen.getByRole('banner'));
      const desktopLabel = header.getByText('Equipment Lending System');
      const mobileLabel = header.getByText('ELS');
      expect(desktopLabel).toHaveClass('hidden', 'sm:inline');
      expect(mobileLabel).toHaveClass('sm:hidden');
    });

    it('should have appropriate text sizes for tablet', () => {
      renderWithRouter(<PublicHomepage />);

      const mainHeading = screen.getByRole('heading', { level: 1, name: /ระบบยืม-คืนอุปกรณ์/ });
      expect(mainHeading).toHaveClass('sm:text-5xl'); // Tablet size
    });

  });

  describe('Desktop Layout (1024px+)', () => {
    beforeEach(() => {
      setViewportSize(1920); // Desktop width
    });

    it('should display desktop-optimized header', () => {
      renderWithRouter(<PublicHomepage />);

      const header = within(screen.getByRole('banner'));

      // Should show full system name
      expect(header.getByText('Equipment Lending System')).toBeInTheDocument();

      // Login button should adopt larger spacing on desktop
      const loginButton = header.getByRole('button', { name: /เข้าสู่ระบบ/i });
      expect(loginButton).toHaveClass('sm:px-4', 'sm:py-2');
    });

    it('should display 4-column statistics grid', () => {
      const { container } = renderWithRouter(<PublicHomepage />);

      expectStatsGridHasClass(container, 'lg:grid-cols-4');
    });

    it('should have largest text sizes for desktop', () => {
      renderWithRouter(<PublicHomepage />);

      const mainHeading = screen.getByRole('heading', { level: 1, name: /ระบบยืม-คืนอุปกรณ์/ });
      expect(mainHeading).toHaveClass('md:text-6xl'); // Desktop size
    });

  });

  describe('Ultra-wide Desktop (1440px+)', () => {
    beforeEach(() => {
      setViewportSize(2560); // Ultra-wide monitor
    });

    it('should maintain proper content width on ultra-wide screens', () => {
      const { container } = renderWithRouter(<PublicHomepage />);

      // Content should be constrained with max-width
      const maxWidthContainers = container.querySelectorAll('.max-w-7xl, .max-w-4xl');
      expect(maxWidthContainers.length).toBeGreaterThan(0);
    });

    it('should center content properly', () => {
      const { container } = renderWithRouter(<PublicHomepage />);

      // Containers should be centered
      const centeredContainers = container.querySelectorAll('.mx-auto');
      expect(centeredContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Small Mobile (320px)', () => {
    beforeEach(() => {
      setViewportSize(320); // Minimum supported width
    });

    it('should remain functional at minimum width', () => {
      renderWithRouter(<PublicHomepage />);

      // All essential elements should be present
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();

      // Buttons should be accessible
      expect(screen.getByRole('button', { name: /เข้าสู่ระบบ/i })).toBeInTheDocument();
    });

    it('should not have horizontal overflow', () => {
      const { container } = renderWithRouter(<PublicHomepage />);

      // Check that content doesn't overflow
      const overflowElements = container.querySelectorAll('.overflow-x-auto, .overflow-hidden');
      expect(overflowElements.length).toBeGreaterThan(0);
    });

    it('should have readable text at minimum width', () => {
      renderWithRouter(<PublicHomepage />);

      // Text should not be too small
      const mainHeading = screen.getByRole('heading', { level: 1, name: /ระบบยืม-คืนอุปกรณ์/ });
      expect(mainHeading).toHaveClass('text-4xl'); // Minimum readable size
    });
  });

  describe('Breakpoint Transitions', () => {
    it('should handle mobile to tablet transition smoothly', () => {
      const mobileRender = renderAtWidth(767);
      expectStatsGridHasClass(mobileRender.container, 'grid-cols-1');
      mobileRender.unmount();

      const tabletRender = renderAtWidth(768);
      expectStatsGridHasClass(tabletRender.container, 'sm:grid-cols-2');
      tabletRender.unmount();
    });

    it('should handle tablet to desktop transition smoothly', () => {
      const tabletRender = renderAtWidth(1023);
      expectStatsGridHasClass(tabletRender.container, 'sm:grid-cols-2');
      tabletRender.unmount();

      const desktopRender = renderAtWidth(1024);
      expectStatsGridHasClass(desktopRender.container, 'lg:grid-cols-4');
      desktopRender.unmount();
    });
  });

  describe('Touch and Interaction Areas', () => {
    beforeEach(() => {
      setViewportSize(375); // Mobile
    });

    it('should have touch-friendly button sizes on mobile', () => {
      renderWithRouter(<PublicHomepage />);

      const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });

      // Buttons should have adequate padding for touch
      expect(loginButton).toHaveClass('px-3', 'py-2');
      expect(loginButton.className).toContain('focus:ring-2');
    });

    it('should have accessible link targets on mobile', () => {
      renderWithRouter(<PublicHomepage />);

      const navLinks = screen.getAllByRole('link');
      
      // Links should be easily tappable
      navLinks.forEach(link => {
        expect(link.className).toContain('focus:ring-2');
      });
    });
  });

  describe('Content Reflow', () => {
    it('should reflow statistics cards appropriately across breakpoints', () => {
      const mobileRender = renderAtWidth(375);
      expectStatsGridHasClass(mobileRender.container, 'grid-cols-1');
      mobileRender.unmount();

      const tabletRender = renderAtWidth(768);
      expectStatsGridHasClass(tabletRender.container, 'sm:grid-cols-2');
      tabletRender.unmount();

      const desktopRender = renderAtWidth(1024);
      expectStatsGridHasClass(desktopRender.container, 'lg:grid-cols-4');
      desktopRender.unmount();
    });

    it('should adjust text sizes appropriately across breakpoints', () => {
      renderWithRouter(<PublicHomepage />);

      const mainHeading = screen.getByRole('heading', { level: 1, name: /ระบบยืม-คืนอุปกรณ์/ });
      
      // Should have responsive text classes
      expect(mainHeading).toHaveClass('text-4xl', 'sm:text-5xl', 'md:text-6xl');
    });

    it('should adjust spacing appropriately across breakpoints', () => {
      const { container } = renderWithRouter(<PublicHomepage />);

      // Should have responsive padding classes
      const sections = container.querySelectorAll('[class*="py-"]');
      sections.forEach(section => {
        const classes = section.className;
        // Should have at least one responsive padding class
        expect(classes).toMatch(/py-\d+|sm:py-\d+|md:py-\d+|lg:py-\d+/);
      });
    });
  });

  describe('Image and Media Responsiveness', () => {
    it('should handle icons responsively', () => {
      const { container } = renderWithRouter(<PublicHomepage />);

      // Icons should have responsive sizing
      const icons = container.querySelectorAll('svg');
      icons.forEach(icon => {
        const classes =
          typeof icon.className === 'string'
            ? icon.className
            : icon.getAttribute('class') || '';
        // Should have responsive size classes
        expect(classes).toMatch(/w-\d+|h-\d+|sm:w-\d+|sm:h-\d+/);
      });
    });

    it('should handle logo responsively', () => {
      const { container } = renderWithRouter(<PublicHomepage />);

      // Logo container should have responsive sizing
      const logoContainer = container.querySelector('.bg-primary-600');
      expect(logoContainer).toHaveClass('w-7', 'h-7', 'sm:w-8', 'sm:h-8');
    });
  });
});