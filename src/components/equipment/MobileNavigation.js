import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const MobileNavigation = ({
  activeSection = 'equipment',
  onSectionChange,
  equipmentCount = 0,
  pendingCount = 0,
  className = ''
}) => {
  const { isAdmin } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide navigation on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navigationItems = [
    {
      id: 'equipment',
      label: 'อุปกรณ์',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      badge: equipmentCount > 0 ? equipmentCount : null,
      adminOnly: false
    },
    {
      id: 'categories',
      label: 'หมวดหมู่',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
        </svg>
      ),
      adminOnly: false
    },
    {
      id: 'search',
      label: 'ค้นหา',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      adminOnly: false
    },
    {
      id: 'pending',
      label: 'รออนุมัติ',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: pendingCount > 0 ? pendingCount : null,
      adminOnly: true
    },
    {
      id: 'reports',
      label: 'รายงาน',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      adminOnly: true
    }
  ];

  // Filter items based on user role
  const visibleItems = navigationItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  const handleItemClick = (itemId) => {
    if (onSectionChange) {
      onSectionChange(itemId);
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        } ${className}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`relative flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 touch-manipulation ${
                activeSection === item.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <div className="relative">
                {item.icon}
                {/* Badge */}
                {item.badge && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px]">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium mt-1 leading-none">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Action Button (for admin) */}
      {isAdmin && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={() => onSectionChange?.('add-equipment')}
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 flex items-center justify-center touch-manipulation"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      {/* Quick Actions Drawer Toggle */}
      <div className="fixed bottom-20 left-4 z-40">
        <button
          onClick={() => onSectionChange?.('quick-actions')}
          className="w-12 h-12 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 active:bg-gray-800 transition-all duration-200 flex items-center justify-center touch-manipulation"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Spacer to prevent content from being hidden behind navigation */}
      <div className="h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}></div>
    </>
  );
};

export default MobileNavigation;