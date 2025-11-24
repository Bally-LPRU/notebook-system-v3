import { useState, useEffect } from 'react';
import { useResponsive, useResponsiveNavigation } from '../../hooks/useResponsive';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const ResponsiveLayout = ({ children, showSidebar = false }) => {
  const { isMobile, isTablet, getSpacing } = useResponsive();
  const { 
    isMobileMenuOpen, 
    shouldShowMobileMenu, 
    toggleMobileMenu, 
    closeMobileMenu 
  } = useResponsiveNavigation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted state after first render to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSidebarToggle = () => {
    if (shouldShowMobileMenu) {
      toggleMobileMenu();
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleSidebarClose = () => {
    if (shouldShowMobileMenu) {
      closeMobileMenu();
    } else {
      setSidebarOpen(false);
    }
  };

  // Use default values during SSR/initial render to prevent hydration mismatch
  const containerPadding = mounted ? getSpacing({
    xs: '1rem',
    sm: '1.5rem',
    md: '2rem',
    lg: '2rem',
    xl: '2rem'
  }) : '2rem';

  const maxWidth = mounted 
    ? (isMobile ? 'max-w-full' : isTablet ? 'max-w-4xl' : 'max-w-7xl')
    : 'max-w-7xl';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <Navbar 
        onMenuToggle={handleSidebarToggle}
        showMenuButton={showSidebar}
        isMobile={mounted ? isMobile : false}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar 
            isOpen={shouldShowMobileMenu ? isMobileMenuOpen : true}
            onClose={handleSidebarClose}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Content Area */}
          <main className="flex-1 relative overflow-hidden">
            <div 
              className="h-full overflow-auto"
              style={{ padding: containerPadding }}
            >
              {/* Responsive Container */}
              <div className={`mx-auto ${maxWidth}`}>
                {children}
              </div>
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ResponsiveLayout;