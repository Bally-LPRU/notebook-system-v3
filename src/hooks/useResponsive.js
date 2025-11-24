import { useState, useEffect } from 'react';

// Breakpoint definitions (matching Tailwind CSS)
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

/**
 * Hook for responsive design utilities
 * @returns {Object} Responsive utilities and current screen info
 */
export const useResponsive = () => {
  const [mounted, setMounted] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: 1024, // Default to desktop size to prevent hydration mismatch
    height: 768
  });

  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

  useEffect(() => {
    // Mark that we're mounted on the client
    setMounted(true);

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      
      // Determine current breakpoint
      if (width >= breakpoints['2xl']) {
        setCurrentBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint('sm');
      } else {
        setCurrentBreakpoint('xs');
      }
    };

    // Set initial values
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Utility functions - use default desktop values until mounted
  const isMobile = mounted ? screenSize.width < breakpoints.md : false;
  const isTablet = mounted ? (screenSize.width >= breakpoints.md && screenSize.width < breakpoints.lg) : false;
  const isDesktop = mounted ? screenSize.width >= breakpoints.lg : true;
  const isSmallScreen = mounted ? screenSize.width < breakpoints.sm : false;
  const isLargeScreen = mounted ? screenSize.width >= breakpoints.xl : false;

  // Breakpoint checkers
  const isBreakpoint = (bp) => {
    if (bp === 'xs') return screenSize.width < breakpoints.sm;
    return screenSize.width >= breakpoints[bp];
  };

  const isBreakpointUp = (bp) => {
    if (bp === 'xs') return true;
    return screenSize.width >= breakpoints[bp];
  };

  const isBreakpointDown = (bp) => {
    if (bp === 'xs') return screenSize.width < breakpoints.sm;
    return screenSize.width < breakpoints[bp];
  };

  const isBreakpointBetween = (minBp, maxBp) => {
    const minWidth = minBp === 'xs' ? 0 : breakpoints[minBp];
    const maxWidth = maxBp === 'xs' ? breakpoints.sm : breakpoints[maxBp];
    return screenSize.width >= minWidth && screenSize.width < maxWidth;
  };

  // Get responsive value based on current breakpoint
  const getResponsiveValue = (values) => {
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
    
    // Find the appropriate value for current breakpoint or closest smaller one
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i];
      if (values[bp] !== undefined) {
        return values[bp];
      }
    }
    
    // Fallback to the first available value
    return Object.values(values)[0];
  };

  // Get grid columns based on screen size
  const getGridColumns = (config = {}) => {
    const defaultConfig = {
      xs: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 4,
      '2xl': 5
    };
    
    const mergedConfig = { ...defaultConfig, ...config };
    return getResponsiveValue(mergedConfig);
  };

  // Get container max width
  const getContainerMaxWidth = () => {
    return getResponsiveValue({
      xs: '100%',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    });
  };

  // Get padding/margin values
  const getSpacing = (config = {}) => {
    const defaultConfig = {
      xs: '1rem',
      sm: '1.5rem',
      md: '2rem',
      lg: '2.5rem',
      xl: '3rem',
      '2xl': '3.5rem'
    };
    
    const mergedConfig = { ...defaultConfig, ...config };
    return getResponsiveValue(mergedConfig);
  };

  return {
    // Screen info
    screenSize,
    currentBreakpoint,
    mounted,
    
    // Device type checks
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    isLargeScreen,
    
    // Breakpoint utilities
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isBreakpointBetween,
    
    // Responsive utilities
    getResponsiveValue,
    getGridColumns,
    getContainerMaxWidth,
    getSpacing,
    
    // Breakpoint constants
    breakpoints
  };
};

/**
 * Hook for responsive component visibility
 * @param {string} showOn - Breakpoint to show component on ('mobile', 'tablet', 'desktop', or specific breakpoint)
 * @returns {boolean} Whether component should be visible
 */
export const useResponsiveVisibility = (showOn) => {
  const { isMobile, isTablet, isDesktop, isBreakpointUp, isBreakpointDown } = useResponsive();
  
  switch (showOn) {
    case 'mobile':
      return isMobile;
    case 'tablet':
      return isTablet;
    case 'desktop':
      return isDesktop;
    case 'mobile-tablet':
      return isMobile || isTablet;
    case 'tablet-desktop':
      return isTablet || isDesktop;
    default:
      // Assume it's a breakpoint name
      if (showOn.startsWith('up-')) {
        return isBreakpointUp(showOn.replace('up-', ''));
      } else if (showOn.startsWith('down-')) {
        return isBreakpointDown(showOn.replace('down-', ''));
      }
      return true;
  }
};

/**
 * Hook for responsive navigation
 * @returns {Object} Navigation utilities
 */
export const useResponsiveNavigation = () => {
  const { isMobile, isTablet } = useResponsive();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const shouldShowMobileMenu = isMobile || isTablet;
  const shouldShowDesktopMenu = !shouldShowMobileMenu;
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    if (!shouldShowMobileMenu) {
      setIsMobileMenuOpen(false);
    }
  }, [shouldShowMobileMenu]);
  
  return {
    isMobileMenuOpen,
    shouldShowMobileMenu,
    shouldShowDesktopMenu,
    toggleMobileMenu,
    closeMobileMenu
  };
};

/**
 * Hook for responsive table/list view
 * @param {string} breakpoint - Breakpoint to switch from table to list view
 * @returns {Object} View utilities
 */
export const useResponsiveView = (breakpoint = 'md') => {
  const { isBreakpointDown } = useResponsive();
  
  const shouldShowListView = isBreakpointDown(breakpoint);
  const shouldShowTableView = !shouldShowListView;
  
  return {
    shouldShowListView,
    shouldShowTableView,
    viewType: shouldShowListView ? 'list' : 'table'
  };
};

export default useResponsive;