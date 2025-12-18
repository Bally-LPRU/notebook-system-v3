/**
 * Admin Settings Page
 * 
 * Centralized settings management interface for system administrators.
 * Provides tab-based navigation for different setting categories.
 * 
 * Features:
 * - Admin-only access control
 * - Tab navigation for organized settings
 * - Real-time settings updates via SettingsContext
 * - Loading and error states
 * 
 * Requirements: 1.1, 1.3, 1.4
 */

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { Layout } from '../../layout';
import { Navigate } from 'react-router-dom';
import GeneralTab from './GeneralTab';
import ClosedDatesTab from './ClosedDatesTab';
import CategoryLimitsTab from './CategoryLimitsTab';
import NotificationsTab from './NotificationsTab';
import SystemNotificationsTab from './SystemNotificationsTab';
import AuditLogTab from './AuditLogTab';
import UnifiedLoanSettingsTab from './UnifiedLoanSettingsTab';
import LunchBreakTab from './LunchBreakTab';
import SettingsTabSkeleton from './SettingsTabSkeleton';

/**
 * Tab configuration for settings categories
 */
const SETTINGS_TABS = [
  {
    id: 'general',
    name: 'ทั่วไป',
    shortName: 'ทั่วไป',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    description: 'การตั้งค่าทั่วไปของระบบ'
  },
  {
    id: 'loan-settings',
    name: 'การตั้งค่าการยืม',
    shortName: 'การยืม',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857" />
      </svg>
    ),
    description: 'กฎการยืมเริ่มต้นและการยืมตามประเภทผู้ใช้'
  },
  {
    id: 'lunch-break',
    name: 'เวลาพักกลางวัน',
    shortName: 'พักกลางวัน',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'ตั้งค่าเวลาพักกลางวันของห้องให้บริการ'
  },
  {
    id: 'closed-dates',
    name: 'วันปิดทำการ',
    shortName: 'วันปิด',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    description: 'จัดการวันที่ปิดให้บริการ'
  },
  {
    id: 'category-limits',
    name: 'จำกัดตามหมวดหมู่',
    shortName: 'หมวดหมู่',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    description: 'จำนวนอุปกรณ์ที่ยืมได้ตามหมวดหมู่'
  },
  {
    id: 'notifications',
    name: 'Discord Webhook',
    shortName: 'Discord',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    description: 'ตั้งค่า Discord webhook สำหรับแจ้งเตือน'
  },
  {
    id: 'system-notifications',
    name: 'ข้อความแจ้งเตือน',
    shortName: 'ข้อความ',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    description: 'สร้างและจัดการข้อความแจ้งเตือนสำหรับผู้ใช้ทั้งหมด'
  },
  {
    id: 'audit-log',
    name: 'บันทึกการเปลี่ยนแปลง',
    shortName: 'บันทึก',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    description: 'ประวัติการแก้ไขการตั้งค่า'
  },
];

/**
 * AdminSettingsPage Component
 * 
 * Main settings page with tab navigation for different setting categories.
 * Enforces admin-only access and provides organized interface for settings management.
 * 
 * @component
 * @returns {JSX.Element} Admin settings page
 */
const AdminSettingsPage = () => {
  const { isAdmin, loading: authLoading, userProfile } = useAuth();
  const { loading: settingsLoading, error: settingsError } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Access control: Redirect non-admin users
  if (!authLoading && !isAdmin) {
    console.warn('Non-admin user attempted to access settings page');
    return <Navigate to="/dashboard" replace />;
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  /**
   * Get skeleton variant for active tab
   */
  const getSkeletonVariant = () => {
    switch (activeTab) {
      case 'closed-dates':
        return 'list';
      case 'category-limits':
      case 'audit-log':
        return 'table';
      default:
        return 'form';
    }
  };

  /**
   * Render tab content based on active tab
   */
  const renderTabContent = () => {
    // Show skeleton loader for settings
    if (settingsLoading) {
      return (
        <div>
          <div className="flex items-center text-sm text-gray-600 mb-4" role="status" aria-live="polite">
            <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
              <path className="opacity-75" d="M4 12a8 8 0 018-8" strokeWidth="4" strokeLinecap="round"></path>
            </svg>
            <span className="ml-2">กำลังโหลดการตั้งค่า...</span>
          </div>
          <SettingsTabSkeleton variant={getSkeletonVariant()} />
        </div>
      );
    }

    // Show error state
    if (settingsError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาดในการโหลดการตั้งค่า</h3>
              <p className="mt-1 text-sm text-red-700">{settingsError.message || 'กรุณาลองใหม่อีกครั้ง'}</p>
            </div>
          </div>
        </div>
      );
    }

    const activeTabInfo = SETTINGS_TABS.find(tab => tab.id === activeTab);

    const renderActiveTabSection = () => {
      switch (activeTab) {
        case 'loan-settings':
          return <UnifiedLoanSettingsTab />;
        
        case 'lunch-break':
          return <LunchBreakTab />;
        
        case 'closed-dates':
          return <ClosedDatesTab />;
        
        case 'category-limits':
          return <CategoryLimitsTab />;
        
        case 'notifications':
          return <NotificationsTab />;
        
        case 'system-notifications':
          return <SystemNotificationsTab />;
        
        case 'audit-log':
          return <AuditLogTab />;
        
        case 'general':
        default:
          return <GeneralTab />;
      }
    };

    return (
      <div className="space-y-6">
        {activeTabInfo && activeTab !== 'general' && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start">
              <div className="text-blue-600">
                {activeTabInfo.icon}
              </div>
              <div className="ml-3">
                <h2 className="text-xl font-semibold text-gray-900">{activeTabInfo.name}</h2>
                <p className="text-gray-600">{activeTabInfo.description}</p>
              </div>
            </div>
          </div>
        )}
        {renderActiveTabSection()}
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">การตั้งค่าระบบ</h1>
          <p className="mt-2 text-gray-600">
            จัดการการตั้งค่าต่างๆ ของระบบยืม-คืนอุปกรณ์
          </p>
        </div>

        {/* Admin Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="ml-3 text-sm text-blue-800">
              คุณกำลังเข้าถึงหน้าการตั้งค่าในฐานะผู้ดูแลระบบ ({userProfile?.displayName || userProfile?.email})
            </p>
          </div>
        </div>

        {/* Mobile Tab Selector */}
        <div className="mb-6 lg:hidden">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-blue-600">
                {SETTINGS_TABS.find(t => t.id === activeTab)?.icon}
              </span>
              <span className="font-medium text-gray-900">
                {SETTINGS_TABS.find(t => t.id === activeTab)?.name}
              </span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${showMobileMenu ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Mobile Dropdown Menu */}
          {showMobileMenu && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowMobileMenu(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                    ${activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                    }
                  `}
                >
                  <span className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}>
                    {tab.icon}
                  </span>
                  <div>
                    <div className="font-medium">{tab.name}</div>
                    <div className="text-xs text-gray-500">{tab.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Tab Navigation */}
        <div className="mb-6 hidden lg:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-1 overflow-x-auto scrollbar-thin" aria-label="Tabs">
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-3 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  title={tab.description}
                >
                  <span className={`
                    ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                  `}>
                    {tab.icon}
                  </span>
                  <span className="ml-2 hidden xl:inline">{tab.name}</span>
                  <span className="ml-2 xl:hidden">{tab.shortName}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {renderTabContent()}
        </div>

        {/* Help Text */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">คำแนะนำ</h3>
              <p className="mt-1 text-sm text-gray-600">
                การเปลี่ยนแปลงการตั้งค่าจะมีผลทันทีกับระบบ กรุณาตรวจสอบให้แน่ใจก่อนบันทึก
                การเปลี่ยนแปลงทั้งหมดจะถูกบันทึกในประวัติการแก้ไข
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminSettingsPage;
