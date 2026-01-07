import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const isActivePath = (path) => location.pathname === path;

  const adminNavigationItems = [
    { name: 'แดชบอร์ด', href: '/admin', icon: 'dashboard', description: 'ภาพรวมระบบ', color: 'blue' },
    { name: 'จัดการผู้ใช้', href: '/admin/users', icon: 'users', description: 'อนุมัติและจัดการผู้ใช้', color: 'green' },
    { name: 'จัดการอุปกรณ์', href: '/admin/equipment', icon: 'equipment', description: 'เพิ่ม แก้ไข ลบอุปกรณ์', color: 'purple' },
    { name: 'จัดการหมวดหมู่', href: '/admin/categories', icon: 'categories', description: 'จัดการหมวดหมู่อุปกรณ์', color: 'pink' },
    { name: 'คำขอยืม', href: '/admin/loan-requests', icon: 'loan-requests', description: 'อนุมัติคำขอยืมอุปกรณ์', color: 'yellow' },
    { name: 'การจอง', href: '/admin/reservations', icon: 'reservations', description: 'จัดการการจองล่วงหน้า', color: 'cyan' },
    { name: 'การแจ้งเตือน', href: '/admin/notifications', icon: 'notifications', description: 'จัดการการแจ้งเตือน', color: 'orange' },
    { name: 'ตั้งค่าระบบ', href: '/admin/settings', icon: 'settings', description: 'กำหนดค่าระบบ', color: 'gray' }
  ];

  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:bg-blue-50', active: 'bg-blue-100 text-blue-700 border-blue-400' },
    green: { bg: 'bg-emerald-100', text: 'text-emerald-600', hover: 'hover:bg-emerald-50', active: 'bg-emerald-100 text-emerald-700 border-emerald-400' },
    purple: { bg: 'bg-violet-100', text: 'text-violet-600', hover: 'hover:bg-violet-50', active: 'bg-violet-100 text-violet-700 border-violet-400' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600', hover: 'hover:bg-pink-50', active: 'bg-pink-100 text-pink-700 border-pink-400' },
    yellow: { bg: 'bg-amber-100', text: 'text-amber-600', hover: 'hover:bg-amber-50', active: 'bg-amber-100 text-amber-700 border-amber-400' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', hover: 'hover:bg-cyan-50', active: 'bg-cyan-100 text-cyan-700 border-cyan-400' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', hover: 'hover:bg-orange-50', active: 'bg-orange-100 text-orange-700 border-orange-400' },
    gray: { bg: 'bg-slate-100', text: 'text-slate-600', hover: 'hover:bg-slate-50', active: 'bg-slate-100 text-slate-700 border-slate-400' }
  };

  const getIcon = (iconName) => {
    const icons = {
      dashboard: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      equipment: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      categories: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      'loan-requests': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      reservations: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      notifications: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      settings: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    };
    return icons[iconName] || null;
  };

  if (!isAdmin) return null;

  return (
    <div className="h-full bg-white/80 backdrop-blur-xl shadow-xl border-r border-gray-100/50 flex flex-col">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
        <div className="flex items-center">
          <div className="h-9 w-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h2 className="text-sm font-bold text-white">Admin Panel</h2>
            <p className="text-xs text-white/70">ผู้ดูแลระบบ</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {adminNavigationItems.map((item, index) => {
          const colors = colorClasses[item.color];
          const active = isActivePath(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                active
                  ? `${colors.active} border-l-4 shadow-sm`
                  : `text-gray-600 ${colors.hover} hover:text-gray-900 border-l-4 border-transparent`
              }`}
              onClick={() => onClose && onClose()}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`mr-3 p-1.5 rounded-lg transition-all duration-300 ${
                active ? colors.bg : 'bg-gray-100 group-hover:' + colors.bg
              }`}>
                <span className={active ? colors.text : `text-gray-400 group-hover:${colors.text}`}>
                  {getIcon(item.icon)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.name}</div>
                <div className={`text-xs mt-0.5 truncate ${active ? colors.text : 'text-gray-400'}`}>
                  {item.description}
                </div>
              </div>
              {active && (
                <div className={`w-2 h-2 rounded-full ${colors.bg} animate-pulse`}></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100/50">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
              <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-semibold text-blue-800">ต้องการความช่วยเหลือ?</p>
              <p className="text-xs text-blue-600 mt-0.5">ดูคู่มือการใช้งาน</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
