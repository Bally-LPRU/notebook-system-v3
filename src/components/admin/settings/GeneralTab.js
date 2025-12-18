/**
 * General Tab Component
 * 
 * Overview of all settings with conflict detection and quick links.
 * Provides a dashboard view of the current system configuration.
 */

import { useState, useEffect } from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import settingsService from '../../../services/settingsService';
import { USER_TYPE_NAMES } from '../../../types/settings';

/**
 * GeneralTab Component
 */
const GeneralTab = () => {
  const { settings, updateSetting } = useSettings();
  const { userProfile } = useAuth();
  const [userTypeLimits, setUserTypeLimits] = useState({});
  const [closedDatesCount, setClosedDatesCount] = useState(0);
  const [categoryLimitsCount, setCategoryLimitsCount] = useState(0);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(null);

  // Load additional data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load user type limits (handle if collection doesn't exist)
        try {
          const limits = await settingsService.getUserTypeLimits();
          setUserTypeLimits(limits || {});
        } catch (err) {
          console.warn('User type limits not available:', err.message);
          setUserTypeLimits({});
        }
        
        // Load closed dates count
        try {
          const closedDates = await settingsService.getClosedDates();
          setClosedDatesCount(closedDates?.length || 0);
        } catch (err) {
          console.warn('Closed dates not available:', err.message);
          setClosedDatesCount(0);
        }
        
        // Load category limits count
        try {
          const categoryLimits = await settingsService.getAllCategoryLimits();
          setCategoryLimitsCount(categoryLimits?.length || 0);
        } catch (err) {
          console.warn('Category limits not available:', err.message);
          setCategoryLimitsCount(0);
        }
        
      } catch (error) {
        console.error('Error loading settings data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Analyze conflicts
  useEffect(() => {
    const analyzeConflicts = () => {
      const newConflicts = [];
      
      // Check user type limits conflicts
      if (settings.userTypeLimitsEnabled && Object.keys(userTypeLimits).length > 0) {
        Object.entries(userTypeLimits).forEach(([userType, limit]) => {
          if (!limit.isActive) return;
          
          // Check if maxDays exceeds global maxLoanDuration
          if (limit.maxDays > settings.maxLoanDuration) {
            newConflicts.push({
              type: 'warning',
              category: 'user-type-limits',
              title: `${USER_TYPE_NAMES[userType]}: วันยืมเกินค่าสูงสุด`,
              message: `กำหนดไว้ ${limit.maxDays} วัน แต่ค่าสูงสุดของระบบคือ ${settings.maxLoanDuration} วัน`,
              suggestion: 'ระบบจะใช้ค่าที่น้อยกว่าโดยอัตโนมัติ'
            });
          }
          
          // Check if maxAdvanceBookingDays exceeds global setting
          if (limit.maxAdvanceBookingDays > settings.maxAdvanceBookingDays) {
            newConflicts.push({
              type: 'warning',
              category: 'user-type-limits',
              title: `${USER_TYPE_NAMES[userType]}: วันจองล่วงหน้าเกินค่าสูงสุด`,
              message: `กำหนดไว้ ${limit.maxAdvanceBookingDays} วัน แต่ค่าสูงสุดของระบบคือ ${settings.maxAdvanceBookingDays} วัน`,
              suggestion: 'ระบบจะใช้ค่าที่น้อยกว่าโดยอัตโนมัติ'
            });
          }
        });
      }
      
      // Check Discord webhook
      if (settings.discordEnabled && !settings.discordWebhookUrl) {
        newConflicts.push({
          type: 'error',
          category: 'notifications',
          title: 'Discord เปิดใช้งานแต่ไม่มี Webhook URL',
          message: 'เปิดใช้งานการแจ้งเตือน Discord แต่ยังไม่ได้ตั้งค่า Webhook URL',
          suggestion: 'กรุณาตั้งค่า Discord Webhook URL หรือปิดการแจ้งเตือน Discord'
        });
      }
      
      // Check return time window
      if (settings.loanReturnStartTime && settings.loanReturnEndTime) {
        if (settings.loanReturnStartTime >= settings.loanReturnEndTime) {
          newConflicts.push({
            type: 'error',
            category: 'loan-rules',
            title: 'ช่วงเวลาคืนไม่ถูกต้อง',
            message: 'เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด',
            suggestion: 'กรุณาแก้ไขช่วงเวลาคืนอุปกรณ์'
          });
        }
      }
      
      setConflicts(newConflicts);
    };
    
    if (!loading) {
      analyzeConflicts();
    }
  }, [settings, userTypeLimits, loading]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Toggle Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          ควบคุมระบบ
        </h3>
        <div className="space-y-4">
          {/* Reservation System Toggle */}
          <SystemToggle
            label="ระบบจองอุปกรณ์ล่วงหน้า"
            description="เปิด/ปิดระบบจองอุปกรณ์ล่วงหน้าสำหรับผู้ใช้ทั่วไป"
            enabled={settings.reservationSystemEnabled !== false}
            loading={toggleLoading === 'reservationSystemEnabled'}
            onToggle={async () => {
              setToggleLoading('reservationSystemEnabled');
              try {
                const newValue = settings.reservationSystemEnabled === false ? true : false;
                await updateSetting('reservationSystemEnabled', newValue, userProfile?.uid, userProfile?.displayName);
              } catch (error) {
                console.error('Error toggling reservation system:', error);
                alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
              } finally {
                setToggleLoading(null);
              }
            }}
          />
          
          {/* User Type Limits Toggle */}
          <SystemToggle
            label="ยืมตามประเภทผู้ใช้"
            description="เปิด/ปิดการจำกัดการยืมตามประเภทผู้ใช้ (อาจารย์, เจ้าหน้าที่, นักศึกษา)"
            enabled={settings.userTypeLimitsEnabled === true}
            loading={toggleLoading === 'userTypeLimitsEnabled'}
            onToggle={async () => {
              setToggleLoading('userTypeLimitsEnabled');
              try {
                const newValue = !settings.userTypeLimitsEnabled;
                await updateSetting('userTypeLimitsEnabled', newValue, userProfile?.uid, userProfile?.displayName);
              } catch (error) {
                console.error('Error toggling user type limits:', error);
                alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
              } finally {
                setToggleLoading(null);
              }
            }}
          />
          
          {/* Discord Notifications Toggle */}
          <SystemToggle
            label="การแจ้งเตือน Discord"
            description="เปิด/ปิดการส่งการแจ้งเตือนไปยัง Discord Webhook"
            enabled={settings.discordEnabled === true}
            loading={toggleLoading === 'discordEnabled'}
            onToggle={async () => {
              setToggleLoading('discordEnabled');
              try {
                const newValue = !settings.discordEnabled;
                await updateSetting('discordEnabled', newValue, userProfile?.uid, userProfile?.displayName);
              } catch (error) {
                console.error('Error toggling Discord:', error);
                alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
              } finally {
                setToggleLoading(null);
              }
            }}
            warning={settings.discordEnabled && !settings.discordWebhookUrl ? 'ยังไม่ได้ตั้งค่า Webhook URL' : null}
          />
        </div>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-2">
                พบการตั้งค่าที่อาจขัดแย้งกัน ({conflicts.length} รายการ)
              </h3>
              <div className="space-y-2">
                {conflicts.map((conflict, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg ${
                      conflict.type === 'error' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{conflict.title}</div>
                    <div className="text-sm text-gray-700">{conflict.message}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      💡 {conflict.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Loan Rules Card */}
        <SettingsCard
          title="กฎการยืม"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          color="blue"
          items={[
            { label: 'ระยะเวลายืมสูงสุด', value: `${settings.maxLoanDuration} วัน` },
            { label: 'จองล่วงหน้าสูงสุด', value: `${settings.maxAdvanceBookingDays} วัน` },
            { label: 'เวลาคืน', value: settings.loanReturnStartTime && settings.loanReturnEndTime 
              ? `${settings.loanReturnStartTime} - ${settings.loanReturnEndTime}` 
              : 'ไม่จำกัด' 
            }
          ]}
          tabId="loan-rules"
        />

        {/* User Type Limits Card */}
        <SettingsCard
          title="ยืมตามประเภทผู้ใช้"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color="purple"
          items={[
            { 
              label: 'สถานะ', 
              value: settings.userTypeLimitsEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน',
              status: settings.userTypeLimitsEnabled ? 'success' : 'neutral'
            },
            { 
              label: 'ประเภทที่ตั้งค่า', 
              value: `${Object.values(userTypeLimits).filter(l => l.isActive).length} / 3 ประเภท` 
            }
          ]}
          tabId="user-type-limits"
        />

        {/* Reservation System Card */}
        <SettingsCard
          title="ระบบจองอุปกรณ์"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          color="purple"
          items={[
            { 
              label: 'สถานะ', 
              value: settings.reservationSystemEnabled !== false ? 'เปิดใช้งาน' : 'ปิดใช้งาน',
              status: settings.reservationSystemEnabled !== false ? 'success' : 'neutral'
            },
            { label: 'จองล่วงหน้าสูงสุด', value: `${settings.maxAdvanceBookingDays} วัน` }
          ]}
          tabId="general"
        />

        {/* Lunch Break Card */}
        <SettingsCard
          title="เวลาพักกลางวัน"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="orange"
          items={[
            { 
              label: 'สถานะ', 
              value: settings.lunchBreak?.enabled !== false ? 'เปิดใช้งาน' : 'ปิดใช้งาน',
              status: settings.lunchBreak?.enabled !== false ? 'success' : 'neutral'
            },
            { 
              label: 'ช่วงเวลา', 
              value: settings.lunchBreak?.enabled !== false 
                ? `${settings.lunchBreak?.startTime || '12:00'} - ${settings.lunchBreak?.endTime || '13:00'} น.`
                : 'ไม่มี'
            }
          ]}
          tabId="lunch-break"
        />

        {/* Closed Dates Card */}
        <SettingsCard
          title="วันปิดทำการ"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          color="red"
          items={[
            { label: 'จำนวนวันที่กำหนด', value: `${closedDatesCount} วัน` }
          ]}
          tabId="closed-dates"
        />

        {/* Category Limits Card */}
        <SettingsCard
          title="จำกัดตามหมวดหมู่"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          color="green"
          items={[
            { label: 'ค่าเริ่มต้น', value: `${settings.defaultCategoryLimit} ชิ้น/หมวดหมู่` },
            { label: 'หมวดหมู่ที่กำหนดเอง', value: `${categoryLimitsCount} หมวดหมู่` }
          ]}
          tabId="category-limits"
        />

        {/* Discord Card */}
        <SettingsCard
          title="Discord Webhook"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          color="indigo"
          items={[
            { 
              label: 'สถานะ', 
              value: settings.discordEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน',
              status: settings.discordEnabled ? 'success' : 'neutral'
            },
            { 
              label: 'Webhook URL', 
              value: settings.discordWebhookUrl ? 'ตั้งค่าแล้ว' : 'ยังไม่ได้ตั้งค่า',
              status: settings.discordWebhookUrl ? 'success' : 'warning'
            }
          ]}
          tabId="notifications"
        />

        {/* System Info Card */}
        <SettingsCard
          title="ข้อมูลระบบ"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="gray"
          items={[
            { label: 'เวอร์ชัน', value: `v${settings.version || 1}` },
            { 
              label: 'อัปเดตล่าสุด', 
              value: settings.lastUpdated?.toDate?.() 
                ? new Date(settings.lastUpdated.toDate()).toLocaleDateString('th-TH')
                : 'ไม่ทราบ'
            }
          ]}
          tabId="audit-log"
        />
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">ลิงก์ด่วน</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickLink
            to="/admin/users"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            label="จัดการผู้ใช้"
          />
          <QuickLink
            to="/admin/equipment"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            }
            label="จัดการอุปกรณ์"
          />
          <QuickLink
            to="/admin/categories"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
            label="หมวดหมู่"
          />
          <QuickLink
            to="/admin/notifications"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
            label="การแจ้งเตือน"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Settings Card Component
 */
const SettingsCard = ({ title, icon, color, items, tabId }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  const statusClasses = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className={`font-medium ${item.status ? statusClasses[item.status] : 'text-gray-900'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Quick Link Component
 */
const QuickLink = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
  >
    <span className="text-gray-500">{icon}</span>
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </Link>
);

/**
 * System Toggle Component
 */
const SystemToggle = ({ label, description, enabled, loading, onToggle, warning }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900">{label}</span>
        {enabled ? (
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            เปิดใช้งาน
          </span>
        ) : (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            ปิดใช้งาน
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      {warning && (
        <p className="text-sm text-yellow-600 mt-1 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {warning}
        </p>
      )}
    </div>
    <button
      onClick={onToggle}
      disabled={loading}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${enabled ? 'bg-blue-600' : 'bg-gray-200'}
      `}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
          transition duration-200 ease-in-out
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      >
        {loading && (
          <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </span>
    </button>
  </div>
);

export default GeneralTab;
