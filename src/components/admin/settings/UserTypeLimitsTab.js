/**
 * User Type Limits Tab Component
 * 
 * Manages loan limits based on user types (teacher, staff, student).
 * Allows setting different max items, max days, and advance booking days per user type.
 * 
 * Features:
 * - Configure limits per user type
 * - Enable/disable user type limits system
 * - Conflict detection with global settings
 * - Responsive design for mobile/desktop
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { SettingsToast, SettingsAlert } from './SettingsNotifications';
import { FieldLabel, HelpSection } from './SettingsTooltip';
import { 
  USER_TYPE_NAMES, 
  DEFAULT_USER_TYPE_LIMITS,
  USER_TYPE_LIMITS_VALIDATION 
} from '../../../types/settings';
import settingsService from '../../../services/settingsService';

/**
 * UserTypeLimitsTab Component
 */
const UserTypeLimitsTab = () => {
  const { userProfile } = useAuth();
  const { settings, updateSetting } = useSettings();
  
  // Form state
  const [userTypeLimits, setUserTypeLimits] = useState(DEFAULT_USER_TYPE_LIMITS);
  const [isEnabled, setIsEnabled] = useState(settings.userTypeLimitsEnabled || false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [originalLimits, setOriginalLimits] = useState(null);

  // Load user type limits
  useEffect(() => {
    const loadLimits = async () => {
      try {
        setLoading(true);
        const limits = await settingsService.getUserTypeLimits();
        if (limits && Object.keys(limits).length > 0) {
          setUserTypeLimits(limits);
          setOriginalLimits(limits);
        } else {
          // Use defaults if no limits exist yet
          setUserTypeLimits(DEFAULT_USER_TYPE_LIMITS);
          setOriginalLimits(DEFAULT_USER_TYPE_LIMITS);
        }
        setIsEnabled(settings.userTypeLimitsEnabled || false);
      } catch (error) {
        // Handle permission errors gracefully - use defaults
        console.warn('Could not load user type limits, using defaults:', error.message);
        setUserTypeLimits(DEFAULT_USER_TYPE_LIMITS);
        setOriginalLimits(DEFAULT_USER_TYPE_LIMITS);
        setIsEnabled(settings.userTypeLimitsEnabled || false);
      } finally {
        setLoading(false);
      }
    };
    loadLimits();
  }, [settings.userTypeLimitsEnabled]);

  // Check for conflicts with global settings
  const checkConflicts = useCallback(() => {
    const newConflicts = [];
    
    Object.entries(userTypeLimits).forEach(([userType, limit]) => {
      if (!limit.isActive) return;
      
      // Check if maxDays exceeds global maxLoanDuration
      if (limit.maxDays > settings.maxLoanDuration) {
        newConflicts.push({
          type: 'warning',
          userType,
          message: `${USER_TYPE_NAMES[userType]}: จำนวนวันยืม (${limit.maxDays}) เกินกว่าค่าสูงสุดของระบบ (${settings.maxLoanDuration} วัน)`
        });
      }
      
      // Check if maxAdvanceBookingDays exceeds global setting
      if (limit.maxAdvanceBookingDays > settings.maxAdvanceBookingDays) {
        newConflicts.push({
          type: 'warning',
          userType,
          message: `${USER_TYPE_NAMES[userType]}: วันจองล่วงหน้า (${limit.maxAdvanceBookingDays}) เกินกว่าค่าสูงสุดของระบบ (${settings.maxAdvanceBookingDays} วัน)`
        });
      }
    });
    
    setConflicts(newConflicts);
  }, [userTypeLimits, settings.maxLoanDuration, settings.maxAdvanceBookingDays]);

  // Check conflicts when limits change
  useEffect(() => {
    if (isEnabled) {
      checkConflicts();
    } else {
      setConflicts([]);
    }
  }, [isEnabled, checkConflicts]);

  // Check for changes
  useEffect(() => {
    if (!originalLimits) return;
    
    const limitsChanged = JSON.stringify(userTypeLimits) !== JSON.stringify(originalLimits);
    const enabledChanged = isEnabled !== (settings.userTypeLimitsEnabled || false);
    setHasChanges(limitsChanged || enabledChanged);
  }, [userTypeLimits, isEnabled, originalLimits, settings.userTypeLimitsEnabled]);


  /**
   * Handle limit change for a user type
   */
  const handleLimitChange = (userType, field, value) => {
    const numValue = parseInt(value, 10);
    
    setUserTypeLimits(prev => ({
      ...prev,
      [userType]: {
        ...prev[userType],
        [field]: isNaN(numValue) ? '' : numValue
      }
    }));
    
    // Clear error for this field
    const errorKey = `${userType}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
    
    setSaveSuccess(false);
  };

  /**
   * Handle toggle active status
   */
  const handleToggleActive = (userType) => {
    setUserTypeLimits(prev => ({
      ...prev,
      [userType]: {
        ...prev[userType],
        isActive: !prev[userType].isActive
      }
    }));
    setSaveSuccess(false);
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {};
    const { maxItems, maxDays, maxAdvanceBookingDays } = USER_TYPE_LIMITS_VALIDATION;
    
    Object.entries(userTypeLimits).forEach(([userType, limit]) => {
      if (!limit.isActive) return;
      
      // Validate maxItems
      if (!limit.maxItems || limit.maxItems < maxItems.min) {
        newErrors[`${userType}.maxItems`] = `ต้องมากกว่า ${maxItems.min - 1}`;
      } else if (limit.maxItems > maxItems.max) {
        newErrors[`${userType}.maxItems`] = `ต้องไม่เกิน ${maxItems.max}`;
      }
      
      // Validate maxDays
      if (!limit.maxDays || limit.maxDays < maxDays.min) {
        newErrors[`${userType}.maxDays`] = `ต้องมากกว่า ${maxDays.min - 1}`;
      } else if (limit.maxDays > maxDays.max) {
        newErrors[`${userType}.maxDays`] = `ต้องไม่เกิน ${maxDays.max}`;
      }
      
      // Validate maxAdvanceBookingDays
      if (!limit.maxAdvanceBookingDays || limit.maxAdvanceBookingDays < maxAdvanceBookingDays.min) {
        newErrors[`${userType}.maxAdvanceBookingDays`] = `ต้องมากกว่า ${maxAdvanceBookingDays.min - 1}`;
      } else if (limit.maxAdvanceBookingDays > maxAdvanceBookingDays.max) {
        newErrors[`${userType}.maxAdvanceBookingDays`] = `ต้องไม่เกิน ${maxAdvanceBookingDays.max}`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Save user type limits
      await settingsService.setUserTypeLimits(
        userTypeLimits,
        userProfile.uid,
        userProfile.displayName || userProfile.email
      );
      
      // Update enabled status
      if (isEnabled !== settings.userTypeLimitsEnabled) {
        await updateSetting(
          'userTypeLimitsEnabled',
          isEnabled,
          userProfile.uid,
          userProfile.displayName || userProfile.email
        );
      }
      
      setOriginalLimits(userTypeLimits);
      setSaveSuccess(true);
      setHasChanges(false);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving user type limits:', error);
      setErrors({ submit: error.message || 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Reset form
   */
  const handleReset = () => {
    setUserTypeLimits(originalLimits || DEFAULT_USER_TYPE_LIMITS);
    setIsEnabled(settings.userTypeLimitsEnabled || false);
    setErrors({});
    setSaveSuccess(false);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">การยืมตามประเภทผู้ใช้</h2>
          <p className="mt-1 text-sm text-gray-600">
            กำหนดจำนวนอุปกรณ์และระยะเวลาการยืมที่แตกต่างกันตามประเภทผู้ใช้
          </p>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-medium text-gray-900">เปิดใช้งานระบบจำกัดตามประเภทผู้ใช้</h3>
              <p className="text-sm text-gray-600">
                เมื่อเปิดใช้งาน ระบบจะใช้ค่าที่กำหนดตามประเภทผู้ใช้แทนค่าเริ่มต้น
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEnabled(!isEnabled)}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isEnabled ? 'bg-blue-600' : 'bg-gray-200'}
              `}
              role="switch"
              aria-checked={isEnabled}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                  transition duration-200 ease-in-out
                  ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </div>

        {/* Conflicts Warning */}
        {conflicts.length > 0 && (
          <div className="mb-6">
            <SettingsAlert
              type="warning"
              message={
                <div>
                  <p className="font-medium mb-2">พบการตั้งค่าที่อาจขัดแย้งกัน:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {conflicts.map((conflict, index) => (
                      <li key={index}>{conflict.message}</li>
                    ))}
                  </ul>
                </div>
              }
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Object.entries(userTypeLimits).map(([userType, limit]) => (
              <UserTypeCard
                key={userType}
                userType={userType}
                limit={limit}
                disabled={!isEnabled}
                errors={errors}
                onLimitChange={handleLimitChange}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <SettingsAlert type="error" message={errors.submit} />
          )}

          {/* Success Message */}
          {saveSuccess && (
            <SettingsToast
              type="success"
              message="บันทึกการตั้งค่าสำเร็จ"
              onClose={() => setSaveSuccess(false)}
              duration={3000}
            />
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving || !hasChanges}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving || !hasChanges}
              className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึกการตั้งค่า'
              )}
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-6">
          <HelpSection title="คำแนะนำการใช้งาน" defaultExpanded={false}>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">ลำดับความสำคัญของการตั้งค่า</h4>
                <ul className="space-y-1 list-disc list-inside text-gray-600">
                  <li>เมื่อเปิดใช้งาน ระบบจะใช้ค่าตามประเภทผู้ใช้ก่อน</li>
                  <li>หากประเภทผู้ใช้ไม่ได้เปิดใช้งาน จะใช้ค่าเริ่มต้นของระบบ</li>
                  <li>ค่าที่กำหนดจะถูกจำกัดไม่ให้เกินค่าสูงสุดของระบบ</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">ค่าแนะนำ</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left">ประเภท</th>
                        <th className="px-3 py-2 text-center">จำนวนชิ้น</th>
                        <th className="px-3 py-2 text-center">จำนวนวัน</th>
                        <th className="px-3 py-2 text-center">จองล่วงหน้า</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2">อาจารย์</td>
                        <td className="px-3 py-2 text-center">5-10</td>
                        <td className="px-3 py-2 text-center">14-30</td>
                        <td className="px-3 py-2 text-center">30-60</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">เจ้าหน้าที่</td>
                        <td className="px-3 py-2 text-center">3-5</td>
                        <td className="px-3 py-2 text-center">7-14</td>
                        <td className="px-3 py-2 text-center">14-30</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">นักศึกษา</td>
                        <td className="px-3 py-2 text-center">1-3</td>
                        <td className="px-3 py-2 text-center">3-7</td>
                        <td className="px-3 py-2 text-center">7-14</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </HelpSection>
        </div>
      </div>
    </div>
  );
};


/**
 * User Type Card Component
 */
const UserTypeCard = ({ userType, limit, disabled, errors, onLimitChange, onToggleActive }) => {
  const userTypeName = USER_TYPE_NAMES[userType];
  const isActive = limit.isActive && !disabled;
  
  // Icon based on user type
  const getIcon = () => {
    switch (userType) {
      case 'teacher':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'staff':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'student':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 14l9-5-9-5-9 5 9 5z" />
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  // Color based on user type
  const getColor = () => {
    switch (userType) {
      case 'teacher':
        return 'blue';
      case 'staff':
        return 'green';
      case 'student':
        return 'purple';
      default:
        return 'gray';
    }
  };
  
  const color = getColor();
  
  return (
    <div className={`
      rounded-lg border-2 p-4 transition-all
      ${disabled ? 'opacity-50 bg-gray-50 border-gray-200' : 
        isActive ? `bg-${color}-50 border-${color}-200` : 'bg-gray-50 border-gray-200'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isActive ? `bg-${color}-100 text-${color}-600` : 'bg-gray-100 text-gray-400'}`}>
            {getIcon()}
          </div>
          <div>
            <h3 className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
              {userTypeName}
            </h3>
          </div>
        </div>
        
        {/* Active Toggle */}
        <button
          type="button"
          onClick={() => onToggleActive(userType)}
          disabled={disabled}
          className={`
            relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${disabled ? 'cursor-not-allowed' : ''}
            ${limit.isActive ? 'bg-blue-600' : 'bg-gray-200'}
          `}
          role="switch"
          aria-checked={limit.isActive}
          aria-label={`เปิด/ปิดการใช้งาน ${userTypeName}`}
        >
          <span
            className={`
              pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${limit.isActive ? 'translate-x-4' : 'translate-x-0'}
            `}
          />
        </button>
      </div>
      
      {/* Fields */}
      <div className="space-y-3">
        {/* Max Items */}
        <div>
          <FieldLabel
            htmlFor={`${userType}-maxItems`}
            label="จำนวนชิ้นสูงสุด"
            tooltip="จำนวนอุปกรณ์สูงสุดที่สามารถยืมได้พร้อมกัน"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              id={`${userType}-maxItems`}
              value={limit.maxItems}
              onChange={(e) => onLimitChange(userType, 'maxItems', e.target.value)}
              disabled={disabled || !limit.isActive}
              min="1"
              max="50"
              className={`
                block w-full px-3 py-1.5 text-sm border rounded-md shadow-sm
                focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${errors[`${userType}.maxItems`] ? 'border-red-300' : 'border-gray-300'}
              `}
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">ชิ้น</span>
          </div>
          {errors[`${userType}.maxItems`] && (
            <p className="mt-1 text-xs text-red-600">{errors[`${userType}.maxItems`]}</p>
          )}
        </div>
        
        {/* Max Days */}
        <div>
          <FieldLabel
            htmlFor={`${userType}-maxDays`}
            label="จำนวนวันยืมสูงสุด"
            tooltip="จำนวนวันสูงสุดที่สามารถยืมอุปกรณ์ได้ในแต่ละครั้ง"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              id={`${userType}-maxDays`}
              value={limit.maxDays}
              onChange={(e) => onLimitChange(userType, 'maxDays', e.target.value)}
              disabled={disabled || !limit.isActive}
              min="1"
              max="365"
              className={`
                block w-full px-3 py-1.5 text-sm border rounded-md shadow-sm
                focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${errors[`${userType}.maxDays`] ? 'border-red-300' : 'border-gray-300'}
              `}
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">วัน</span>
          </div>
          {errors[`${userType}.maxDays`] && (
            <p className="mt-1 text-xs text-red-600">{errors[`${userType}.maxDays`]}</p>
          )}
        </div>
        
        {/* Max Advance Booking Days */}
        <div>
          <FieldLabel
            htmlFor={`${userType}-maxAdvanceBookingDays`}
            label="จองล่วงหน้าสูงสุด"
            tooltip="จำนวนวันล่วงหน้าสูงสุดที่สามารถจองอุปกรณ์ได้"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              id={`${userType}-maxAdvanceBookingDays`}
              value={limit.maxAdvanceBookingDays}
              onChange={(e) => onLimitChange(userType, 'maxAdvanceBookingDays', e.target.value)}
              disabled={disabled || !limit.isActive}
              min="1"
              max="365"
              className={`
                block w-full px-3 py-1.5 text-sm border rounded-md shadow-sm
                focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${errors[`${userType}.maxAdvanceBookingDays`] ? 'border-red-300' : 'border-gray-300'}
              `}
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">วัน</span>
          </div>
          {errors[`${userType}.maxAdvanceBookingDays`] && (
            <p className="mt-1 text-xs text-red-600">{errors[`${userType}.maxAdvanceBookingDays`]}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserTypeLimitsTab;
