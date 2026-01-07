import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import NotificationBell from '../notifications/NotificationBell';
import PendingUsersBadge from '../admin/PendingUsersBadge';
import { useNotificationContext } from '../../contexts/NotificationContext';

const Navbar = ({ onMenuToggle, showMenuButton = false, isMobile = false }) => {
  const { user, userProfile, signOut, isAdmin } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useNotificationContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const location = useLocation();
  
  // Check if reservation system is enabled
  const isReservationEnabled = settings?.reservationSystemEnabled !== false;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { name: 'แดชบอร์ด', href: '/dashboard', icon: 'dashboard' },
    { name: 'รายการอุปกรณ์', href: '/equipment', icon: 'equipment' },
    { name: 'จองอุปกรณ์', href: '/reservations', icon: 'reservations' },
    { name: 'คำขอของฉัน', href: '/my-requests', icon: 'requests' },
    { name: 'ประวัติการยืม-คืน', href: '/loan-history', icon: 'loan-history' },
    { name: 'ประวัติการแจ้งเตือน', href: '/notification-history', icon: 'notification-history' },
  ];

  const handleReservationClick = (e) => {
    // If reservation system is disabled, show toast message
    if (!isReservationEnabled) {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      showToast({
        type: 'warning',
        title: 'ระบบจองปิดใช้งาน',
        message: 'ระบบจองอุปกรณ์ล่วงหน้าถูกปิดใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ',
        icon: 'warning',
        duration: 5000
      });
      return false;
    }
    return true;
  };

  const getIcon = (iconName) => {
    const icons = {
      dashboard: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      ),
      equipment: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      requests: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      'equipment-admin': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      'loan-requests': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      reservations: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      reports: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      'loan-history': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'notification-history': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    };
    return icons[iconName] || null;
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            {/* Menu Toggle Button */}
            {showMenuButton && (
              <button
                onClick={onMenuToggle}
                className="mr-3 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
                aria-label="เปิด/ปิดเมนู"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            <Link to="/dashboard" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3 hidden sm:block">
                <h1 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
                  ระบบยืม-คืนอุปกรณ์
                </h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Show for non-admin users */}
          {!isAdmin && (
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => (
                item.href === '/reservations' ? (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={(e) => {
                      if (!handleReservationClick(e)) {
                        e.preventDefault();
                      }
                    }}
                    className={`flex items-center px-2 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                      isActivePath(item.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    } ${!isReservationEnabled ? 'opacity-60' : ''}`}
                    aria-label={item.name}
                  >
                    <span className="hidden xl:inline">{getIcon(item.icon)}</span>
                    <span className="xl:ml-1">{item.name}</span>
                    {!isReservationEnabled && (
                      <span className="ml-1 text-xs text-gray-400">(ปิด)</span>
                    )}
                  </Link>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-2 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                      isActivePath(item.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span className="hidden xl:inline">{getIcon(item.icon)}</span>
                    <span className="xl:ml-1">{item.name}</span>
                  </Link>
                )
              ))}
            </div>
          )}

          {/* User Profile Dropdown */}
          <div className="flex items-center space-x-4">
            {/* Pending Users Badge (Admin only) */}
            <PendingUsersBadge />
            
            {/* Notification Bell */}
            <NotificationBell />
            
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {user?.photoURL ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={user.photoURL}
                    alt={user?.displayName || 'User avatar'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold"
                  style={{ display: user?.photoURL ? 'none' : 'flex' }}
                >
                  {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
                </div>
                <span className="ml-2 text-gray-700 font-medium hidden sm:block">
                  {user?.displayName}
                </span>
                <svg className="ml-1 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.displayName}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      {userProfile && (
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            userProfile.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {userProfile.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      โปรไฟล์
                    </Link>

                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button - Only show for non-admin users */}
            {!isAdmin && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden ml-2 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu - Only show for non-admin users */}
      {/* Admin users use the Sidebar instead */}
      {isMenuOpen && !isAdmin && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
            {navigationItems.map((item) => (
              item.href === '/reservations' ? (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={(e) => {
                    if (!handleReservationClick(e)) {
                      e.preventDefault();
                    } else {
                      setIsMenuOpen(false);
                    }
                  }}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActivePath(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  } ${!isReservationEnabled ? 'opacity-60' : ''}`}
                >
                  {getIcon(item.icon)}
                  <span className="ml-3">{item.name}</span>
                  {!isReservationEnabled && (
                    <span className="ml-1 text-xs text-gray-400">(ปิด)</span>
                  )}
                </Link>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActivePath(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {getIcon(item.icon)}
                  <span className="ml-3">{item.name}</span>
                </Link>
              )
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;