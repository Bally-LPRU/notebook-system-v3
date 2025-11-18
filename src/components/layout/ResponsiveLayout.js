import { useState } from 'react';
import { useResponsive, useResponsiveNavigation } from '../../hooks/useResponsive';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const ResponsiveLayout = ({ children, showSidebar = false }) => {
  const { isMobile, isTablet, getSpacing, isClient } = useResponsive();
  const { 
    isMobileMenuOpen, 
    shouldShowMobileMenu, 
    toggleMobileMenu, 
    closeMobileMenu 
  } = useResponsiveNavigation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prevent hydration mismatch by not rendering responsive content until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar 
          onMenuToggle={() => {}}
          showMenuButton={showSidebar}
          isMobile={false}
        />
        <div className="flex flex-1">
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 relative overflow-hidden">
              <div className="h-full overflow-auto p-8">
                <div className="mx-auto max-w-7xl">
                  {children}
                </div>
              </div>
            </main>
            <Footer />
          </div>
        </div>
      </div>
    );
  }

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

  const containerPadding = getSpacing({
    xs: '1rem',
    sm: '1.5rem',
    md: '2rem',
    lg: '2rem',
    xl: '2rem'
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <Navbar 
        onMenuToggle={handleSidebarToggle}
        showMenuButton={showSidebar}
        isMobile={isMobile}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Mobile Sidebar Overlay */}
            {shouldShowMobileMenu && isMobileMenuOpen && (
              <div 
                className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 lg:hidden"
                onClick={handleSidebarClose}
              />
            )}

            {/* Sidebar */}
            <div className={`
              ${shouldShowMobileMenu 
                ? `fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                  }`
                : `hidden lg:flex lg:flex-shrink-0 ${
                    sidebarOpen ? 'lg:w-64' : 'lg:w-16'
                  } transition-all duration-300`
              }
            `}>
              <Sidebar 
                isOpen={shouldShowMobileMenu ? isMobileMenuOpen : sidebarOpen}
                onClose={handleSidebarClose}
                isMobile={shouldShowMobileMenu}
                isCollapsed={!shouldShowMobileMenu && !sidebarOpen}
              />
            </div>
          </>
        )}

        {/* Main Content */}
        <div className={`
          flex-1 flex flex-col min-w-0
          ${showSidebar && !shouldShowMobileMenu 
            ? sidebarOpen 
              ? 'lg:ml-64' 
              : 'lg:ml-16'
            : ''
          }
          transition-all duration-300
        `}>
          {/* Content Area */}
          <main className="flex-1 relative overflow-hidden">
            <div 
              className="h-full overflow-auto"
              style={{ padding: containerPadding }}
            >
              {/* Responsive Container */}
              <div className={`
                mx-auto
                ${isMobile 
                  ? 'max-w-full' 
                  : isTablet 
                    ? 'max-w-4xl' 
                    : 'max-w-7xl'
                }
              `}>
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