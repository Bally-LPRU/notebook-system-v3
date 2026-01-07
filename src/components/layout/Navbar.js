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
  
  const isReservationEnabled = settings?.reservationSystemEnabled !== false;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isActivePath = (path) => location.pathname === path;

  const navigationItems = [
    { name: 'แดชบอร์ด', href: '/dashboard', icon: 'dashboard', color: 'blue' },
    { name: 'รายการอุปกรณ์', href: '/equipment', icon: 'equipment', color: 'purple' },
    { name: 'จองอุปกรณ์', href: '/reservations', icon: 'reservations', color: 'cyan' },
    { name: 'คำขอของฉัน', href: '/my-requests', icon: 'requests', color: 'yellow' },
    { name: 'ประวัติการยืม', href: '/loan-history', icon: 'loan-history', color: 'green' },
    { name: 'การแจ้งเตือน', href: '/notification-history', icon: 'notification-history', color: 'orange' },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-violet-100 text-violet-700',
    cyan: 'bg-cyan-100 text-cyan-700',
    yellow: 'bg-amber-100 text-amber-700',
    green: 'bg-emerald-100 text-emerald-700',
    orange: 'bg-orange-100 text-orange-700',
  };

  const handleReservationClick = (e) => {
    if (!isReservationEnabled) {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      showToast({
        type: 'warning',
        title: 'ระบบจองปิดใช้งาน',
        message: 'ระบบจองอุปกรณ์ล่วงหน้าถูกปิดใช้งานชั่วคราว',
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
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
      reservations: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
    <nav className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            {showMenuButton && (
              <button
                onClick={onMenuToggle}
                className="mr-3 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden transition-all duration-200"
                aria-label="เปิด/ปิดเมนู"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            <Link to="/dashboard" className="flex-shrink-0 flex items-center group">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3 hidden sm:block">
                <h1 className={`font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${isMobile ? 'text-base' : 'text-lg'}`}>
                  ระบบยืม-คืนอุปกรณ์
                </h1>
                <p className="text-xs text-gray-400">Equipment Lending System</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {!isAdmin && (
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const active = isActivePath(item.href);
                return item.href === '/reservations' ? (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={(e) => { if (!handleReservationClick(e)) e.preventDefault(); }}
                    className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      active ? colorClasses[item.color] : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    } ${!isReservationEnabled ? 'opacity-50' : ''}`}
                  >
                    <span className="mr-1.5">{getIcon(item.icon)}</span>
                    <span>{item.name}</span>
                    {!isReservationEnabled && <span className="ml-1 text-xs">(ปิด)</span>}
                  </Link>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      active ? colorClasses[item.color] : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-1.5">{getIcon(item.icon)}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* User Profile Section */}
          <div className="flex items-center space-x-3">
            <PendingUsersBadge />
            <NotificationBell />
            
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:opacity-80"
              >
                {user?.photoURL ? (
                  <img
                    className="h-9 w-9 rounded-xl object-cover ring-2 ring-white shadow-md"
                    src={user.photoURL}
                    alt={user?.displayName || 'User'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white"
                  style={{ display: user?.photoURL ? 'none' : 'flex' }}
                >
                  {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
                </div>
                <span className="ml-2 text-gray-700 font-medium hidden sm:block">{user?.displayName}</span>
                <svg className="ml-1 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-60 rounded-2xl shadow-xl bg-white ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden animate-scale-in">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    {userProfile && (
                      <span className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        userProfile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {userProfile.role === 'admin' ? '👑 ผู้ดูแลระบบ' : '👤 ผู้ใช้งาน'}
                      </span>
                    )}
                  </div>
                  
                  <div className="p-2">
                    <Link
                      to="/profile"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      โปรไฟล์
                    </Link>
                    <button
                      onClick={() => { handleSignOut(); setIsProfileDropdownOpen(false); }}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            {!isAdmin && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
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

      {/* Mobile Navigation Menu */}
      {isMenuOpen && !isAdmin && (
        <div className="lg:hidden animate-slide-down">
          <div className="px-3 pt-2 pb-4 space-y-1 bg-white/95 backdrop-blur-xl border-t border-gray-100">
            {navigationItems.map((item) => {
              const active = isActivePath(item.href);
              return item.href === '/reservations' ? (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={(e) => {
                    if (!handleReservationClick(e)) e.preventDefault();
                    else setIsMenuOpen(false);
                  }}
                  className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                    active ? colorClasses[item.color] : 'text-gray-600 hover:bg-gray-100'
                  } ${!isReservationEnabled ? 'opacity-50' : ''}`}
                >
                  {getIcon(item.icon)}
                  <span className="ml-3">{item.name}</span>
                  {!isReservationEnabled && <span className="ml-2 text-xs">(ปิด)</span>}
                </Link>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                    active ? colorClasses[item.color] : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {getIcon(item.icon)}
                  <span className="ml-3">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
