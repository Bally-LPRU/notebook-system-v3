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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <Navbar 
          onMenuToggle={handleSidebarToggle}
          showMenuButton={showSidebar}
          isMobile={mounted ? isMobile : false}
        />
      </div>

      {/* Main Layout Container - with top padding for fixed navbar */}
      <div className="flex pt-16 min-h-screen">
        {/* Fixed Sidebar */}
        {showSidebar && (
          <div className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 z-30">
            <Sidebar 
              isOpen={true}
              onClose={handleSidebarClose}
            />
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {showSidebar && shouldShowMobileMenu && isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div 
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={handleSidebarClose}
            />
            <div className="absolute left-0 top-0 bottom-0 w-64 animate-slide-in-left">
              <Sidebar 
                isOpen={true}
                onClose={handleSidebarClose}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-w-0 ${showSidebar ? 'lg:ml-64' : ''}`}>
          <main className="flex-1 relative">
            <div 
              className="min-h-full"
              style={{ padding: containerPadding }}
            >
              <div className={`mx-auto ${maxWidth} animate-fade-in`}>
                {children}
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ResponsiveLayout;
