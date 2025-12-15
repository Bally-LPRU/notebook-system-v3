/**
 * Unified Loan Settings Tab Component
 * 
 * Combines loan rules and user type limits into a single unified view.
 * Provides clear visual relationship between global settings and user-specific settings.
 * 
 * Features:
 * - Global loan rules configuration (max duration, advance booking)
 * - User type limits configuration (teacher, staff, student)
 * - Conflict detection and warnings
 * - Effective limit calculation
 * - Single save operation for all settings
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.3, 5.1, 7.1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { SettingsToast, SettingsAlert } from './SettingsNotifications';
import { FieldLabel, HelpSection } from './SettingsTooltip';
import { 
  USER_TYPE_NAMES, 
  DEFAULT_USER_TYPE_LIMITS,
  USER_TYPE_LIMITS_VALIDATION,
  SETTINGS_VALIDATION
} from '../../../types/settings';
import settingsService from '../../../services/settingsService';

/**
 * Validation functions for loan settings
 * Exported for property-based testing
 */
export const validateNumericRange = (value, min, max) => {
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(numValue)) return false;
  return numValue >= min && numValue <= max;
};

/**
 * Calculate effective limit (minimum of global and user type limit)
 * Exported for property-based testing
 */
export const calculateEffectiveLimit = (globalLimit, userTypeLimit, userTypeLimitsEnabled) => {
  if (!userTypeLimitsEnabled) {
    return globalLimit;
  }
  return Math.min(globalLimit, userTypeLimit);
};

/**
 * Detect conflicts between user type limits and global limits
 * Exported for property-based testing
 */
export const detectConflicts = (userTypeLimits, globalSettings, userTypeLimitsEnabled) => {
  const conflicts = [];
  
  if (!userTypeLimitsEnabled) return conflicts;
  
  Object.entries(userTypeLimits).forEach(([userType, limit]) => {
    if (!limit.isActive) return;
    
    // Check if maxDays exceeds global maxLoanDuration
    if (limit.maxDays > globalSettings.maxLoanDuration) {
      conflicts.push({
        type: 'warning',
        userType,
        field: 'maxDays',
        message: `${USER_TYPE_NAMES[userType]}: จำนวนวันยืม (${limit.maxDays}) เกินกว่าค่าสูงสุดของระบบ (${globalSettings.maxLoanDuration} วัน)`,
        globalValue: globalSettings.maxLoanDuration,
        userTypeValue: limit.maxDays
      });
    }
    
    // Check if maxAdvanceBookingDays exceeds global setting
    if (limit.maxAdvanceBookingDays > globalSettings.maxAdvanceBookingDays) {
      conflicts.push({
        type: 'warning',
        userType,
        field: 'maxAdvanceBookingDays',
        message: `${USER_TYPE_NAMES[userType]}: วันจองล่วงหน้า (${limit.maxAdvanceBookingDays}) เกินกว่าค่าสูงสุดของระบบ (${globalSettings.maxAdvanceBookingDays} วัน)`,
        globalValue: globalSettings.maxAdvanceBookingDays,
        userTypeValue: limit.maxAdvanceBookingDays
      });
    }
  });
  
  return conflicts;
};

/**
 * UnifiedLoanSettingsTab Component
 */
const UnifiedLoanSettingsTab = () => {
  const { userProfile } = useAuth();
  const { settings, updateMultipleSettings } = useSettings();
  
  // Global settings state
  const [globalSettings, setGlobalSettings] = useState({
    maxLoanDuration: settings.maxLoanDuration || 14,
    maxAdvanceBookingDays: settings.maxAdvanceBookingDays || 30,
    loanReturnStartTime: settings.loanReturnStartTime || '',
    loanReturnEndTime: settings.loanReturnEndTime || ''
  });
  
  // User type limits state
  const [userTypeLimits, setUserTypeLimits] = useState(DEFAULT_USER_TYPE_LIMITS);
  const [userTypeLimitsEnabled, setUserTypeLimitsEnabled] = useState(settings.userTypeLimitsEnabled || false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  
  // Original values for change detection
  const [originalGlobalSettings, setOriginalGlobalSettings] = useState(null);
  const [originalUserTypeLimits, setOriginalUserTypeLimits] = useState(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        
        // Load global settings from context
        setGlobalSettings({
          maxLoanDuration: settings.maxLoanDuration || 14,
          maxAdvanceBookingDays: settings.maxAdvanceBookingDays || 30,
          loanReturnStartTime: settings.loanReturnStartTime || '',
          loanReturnEndTime: settings.loanReturnEndTime || ''
        });
        setOriginalGlobalSettings({
          maxLoanDuration: settings.maxLoanDuration || 14,
          maxAdvanceBookingDays: settings.maxAdvanceBookingDays || 30,
          loanReturnStartTime: settings.loanReturnStartTime || '',
          loanReturnEndTime: settings.loanReturnEndTime || ''
        });
        
        // Load user type limits
        const limits = await settingsService.getUserTypeLimits();
        if (limits && Object.keys(limits).length > 0) {
          setUserTypeLimits(limits);
          setOriginalUserTypeLimits(limits);
        } else {
          setUserTypeLimits(DEFAULT_USER_TYPE_LIMITS);
          setOriginalUserTypeLimits(DEFAULT_USER_TYPE_LIMITS);
        }
        
        setUserTypeLimitsEnabled(settings.userTypeLimitsEnabled || false);
      } catch (error) {
        console.warn('Could not load settings, using defaults:', error.message);
        setUserTypeLimits(DEFAULT_USER_TYPE_LIMITS);
        setOriginalUserTypeLimits(DEFAULT_USER_TYPE_LIMITS);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [settings]);

  // Check for conflicts when settings change
  const checkConflicts = useCallback(() => {
    const newConflicts = detectConflicts(userTypeLimits, globalSettings, userTypeLimitsEnabled);
    setConflicts(newConflicts);
  }, [userTypeLimits, globalSettings, userTypeLimitsEnabled]);

  useEffect(() => {
    checkConflicts();
  }, [checkConflicts]);

  // Check for changes
  useEffect(() => {
    if (!originalGlobalSettings || !originalUserTypeLimits) return;
    
    const globalChanged = JSON.stringify(globalSettings) !== JSON.stringify(originalGlobalSettings);
    const limitsChanged = JSON.stringify(userTypeLimits) !== JSON.stringify(originalUserTypeLimits);
    const enabledChanged = userTypeLimitsEnabled !== (settings.userTypeLimitsEnabled || false);
    
    setHasChanges(globalChanged || limitsChanged || enabledChanged);
  }, [globalSettings, userTypeLimits, userTypeLimitsEnabled, originalGlobalSettings, originalUserTypeLimits, settings.userTypeLimitsEnabled]);

  /**
   * Handle global settings change
   */
  const handleGlobalSettingChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    
    setGlobalSettings(prev => ({
      ...prev,
      [name]: name === 'loanReturnStartTime' || name === 'loanReturnEndTime'
        ? value
        : (isNaN(numValue) ? '' : numValue)
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setSaveSuccess(false);
  };

  /**
   * Handle user type limit change
   */
  const handleUserTypeLimitChange = (userType, field, value) => {
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
   * Handle toggle user type active status
   */
  const handleToggleUserTypeActive = (userType) => {
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
   * Validate all form data
   */
  const validateForm = () => {
    const newErrors = {};
    
    // Validate global settings
    if (!validateNumericRange(globalSettings.maxLoanDuration, SETTINGS_VALIDATION.maxLoanDuration.min, SETTINGS_VALIDATION.maxLoanDuration.max)) {
      newErrors.maxLoanDuration = `ต้องอยู่ระหว่าง ${SETTINGS_VALIDATION.maxLoanDuration.min} ถึง ${SETTINGS_VALIDATION.maxLoanDuration.max} วัน`;
    }
    
    if (!validateNumericRange(globalSettings.maxAdvanceBookingDays, SETTINGS_VALIDATION.maxAdvanceBookingDays.min, SETTINGS_VALIDATION.maxAdvanceBookingDays.max)) {
      newErrors.maxAdvanceBookingDays = `ต้องอยู่ระหว่าง ${SETTINGS_VALIDATION.maxAdvanceBookingDays.min} ถึง ${SETTINGS_VALIDATION.maxAdvanceBookingDays.max} วัน`;
    }

    // Validate return time window
    const timeRegex = /^\d{2}:\d{2}$/;
    if (globalSettings.loanReturnStartTime && !timeRegex.test(globalSettings.loanReturnStartTime)) {
      newErrors.loanReturnStartTime = 'รูปแบบเวลาไม่ถูกต้อง (HH:MM)';
    }
    if (globalSettings.loanReturnEndTime && !timeRegex.test(globalSettings.loanReturnEndTime)) {
      newErrors.loanReturnEndTime = 'รูปแบบเวลาไม่ถูกต้อง (HH:MM)';
    }
    if (
      globalSettings.loanReturnStartTime &&
      globalSettings.loanReturnEndTime &&
      timeRegex.test(globalSettings.loanReturnStartTime) &&
      timeRegex.test(globalSettings.loanReturnEndTime) &&
      globalSettings.loanReturnStartTime >= globalSettings.loanReturnEndTime
    ) {
      newErrors.loanReturnEndTime = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม';
    }
    
    // Validate user type limits if enabled
    if (userTypeLimitsEnabled) {
      const { maxItems, maxDays, maxAdvanceBookingDays } = USER_TYPE_LIMITS_VALIDATION;
      
      Object.entries(userTypeLimits).forEach(([userType, limit]) => {
        if (!limit.isActive) return;
        
        if (!validateNumericRange(limit.maxItems, maxItems.min, maxItems.max)) {
          newErrors[`${userType}.maxItems`] = `ต้องอยู่ระหว่าง ${maxItems.min} ถึง ${maxItems.max}`;
        }
        
        if (!validateNumericRange(limit.maxDays, maxDays.min, maxDays.max)) {
          newErrors[`${userType}.maxDays`] = `ต้องอยู่ระหว่าง ${maxDays.min} ถึง ${maxDays.max}`;
        }
        
        if (!validateNumericRange(limit.maxAdvanceBookingDays, maxAdvanceBookingDays.min, maxAdvanceBookingDays.max)) {
          newErrors[`${userType}.maxAdvanceBookingDays`] = `ต้องอยู่ระหว่าง ${maxAdvanceBookingDays.min} ถึง ${maxAdvanceBookingDays.max}`;
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle unified save
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Save global settings
      await updateMultipleSettings(
        {
          maxLoanDuration: globalSettings.maxLoanDuration,
          maxAdvanceBookingDays: globalSettings.maxAdvanceBookingDays,
          loanReturnStartTime: globalSettings.loanReturnStartTime || null,
          loanReturnEndTime: globalSettings.loanReturnEndTime || null,
          userTypeLimitsEnabled
        },
        userProfile.uid,
        userProfile.displayName || userProfile.email
      );
      
      // Save user type limits
      await settingsService.setUserTypeLimits(
        userTypeLimits,
        userProfile.uid,
        userProfile.displayName || userProfile.email
      );
      
      // Update original values
      setOriginalGlobalSettings({ ...globalSettings });
      setOriginalUserTypeLimits({ ...userTypeLimits });
      
      setSaveSuccess(true);
      setHasChanges(false);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrors({ submit: error.message || 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Reset form to original values
   */
  const handleReset = () => {
    setGlobalSettings(originalGlobalSettings || {
      maxLoanDuration: settings.maxLoanDuration || 14,
      maxAdvanceBookingDays: settings.maxAdvanceBookingDays || 30,
      loanReturnStartTime: settings.loanReturnStartTime || '',
      loanReturnEndTime: settings.loanReturnEndTime || ''
    });
    setUserTypeLimits(originalUserTypeLimits || DEFAULT_USER_TYPE_LIMITS);
    setUserTypeLimitsEnabled(settings.userTypeLimitsEnabled || false);
    setErrors({});
    setSaveSuccess(false);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Global Loan Settings Section */}
      <GlobalLoanSettingsSection
        settings={globalSettings}
        onChange={handleGlobalSettingChange}
        errors={errors}
        disabled={isSaving}
      />
      
      {/* User Type Limits Section */}
      <UserTypeLimitsSection
        limits={userTypeLimits}
        globalSettings={globalSettings}
        enabled={userTypeLimitsEnabled}
        onToggleEnabled={() => setUserTypeLimitsEnabled(!userTypeLimitsEnabled)}
        onChange={handleUserTypeLimitChange}
        onToggleActive={handleToggleUserTypeActive}
        errors={errors}
        conflicts={conflicts}
        disabled={isSaving}
      />
      
      {/* Conflict Warnings */}
      {conflicts.length > 0 && (
        <ConflictWarning conflicts={conflicts} />
      )}
      
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row justify-end gap-3">
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
              'บันทึกการตั้งค่าทั้งหมด'
            )}
          </button>
        </div>
      </div>
      
      {/* Help Section */}
      <UnifiedHelpSection />
    </form>
  );
};


/**
 * Global Loan Settings Section Component
 */
const GlobalLoanSettingsSection = ({ settings, onChange, errors, disabled }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">กฎการยืมเริ่มต้น</h2>
          </div>
          <p className="text-sm text-gray-600">
            ค่าเริ่มต้นของระบบที่ใช้กับผู้ใช้ทุกคน (หากไม่ได้กำหนดค่าตามประเภทผู้ใช้)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Max Loan Duration */}
          <div>
            <FieldLabel
              htmlFor="maxLoanDuration"
              label="ระยะเวลาการยืมสูงสุด"
              required
              tooltip="จำนวนวันสูงสุดที่ผู้ใช้สามารถยืมอุปกรณ์ได้ในแต่ละครั้ง (1-365 วัน)"
            />
            <div className="flex items-center space-x-3">
              <input
                type="number"
                id="maxLoanDuration"
                name="maxLoanDuration"
                value={settings.maxLoanDuration}
                onChange={onChange}
                min="1"
                max="365"
                disabled={disabled}
                className={`
                  block w-32 px-3 py-2 border rounded-md shadow-sm sm:text-sm
                  focus:ring-blue-500 focus:border-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${errors.maxLoanDuration ? 'border-red-300' : 'border-gray-300'}
                `}
                required
              />
              <span className="text-sm text-gray-600">วัน</span>
            </div>
            {errors.maxLoanDuration && (
              <p className="mt-1 text-sm text-red-600">{errors.maxLoanDuration}</p>
            )}
          </div>

          {/* Max Advance Booking Days */}
          <div>
            <FieldLabel
              htmlFor="maxAdvanceBookingDays"
              label="ระยะเวลาการจองล่วงหน้าสูงสุด"
              required
              tooltip="จำนวนวันล่วงหน้าสูงสุดที่ผู้ใช้สามารถจองอุปกรณ์ได้ (1-365 วัน)"
            />
            <div className="flex items-center space-x-3">
              <input
                type="number"
                id="maxAdvanceBookingDays"
                name="maxAdvanceBookingDays"
                value={settings.maxAdvanceBookingDays}
                onChange={onChange}
                min="1"
                max="365"
                disabled={disabled}
                className={`
                  block w-32 px-3 py-2 border rounded-md shadow-sm sm:text-sm
                  focus:ring-blue-500 focus:border-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${errors.maxAdvanceBookingDays ? 'border-red-300' : 'border-gray-300'}
                `}
                required
              />
              <span className="text-sm text-gray-600">วัน</span>
            </div>
            {errors.maxAdvanceBookingDays && (
              <p className="mt-1 text-sm text-red-600">{errors.maxAdvanceBookingDays}</p>
            )}
          </div>
        </div>

        {/* Return time window (optional) */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">ช่วงเวลาคืนอุปกรณ์ (ไม่บังคับ)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel
                htmlFor="loanReturnStartTime"
                label="เวลาคืนเริ่มต้น"
                tooltip="หากกำหนด ระบบจะตรวจสอบว่าเวลาคืนต้องไม่ก่อนเวลานี้"
              />
              <input
                type="time"
                id="loanReturnStartTime"
                name="loanReturnStartTime"
                value={settings.loanReturnStartTime}
                onChange={onChange}
                disabled={disabled}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.loanReturnStartTime ? 'border-red-300' : 'border-gray-300'}`}
              />
              {errors.loanReturnStartTime && (
                <p className="mt-1 text-sm text-red-600">{errors.loanReturnStartTime}</p>
              )}
            </div>
            <div>
              <FieldLabel
                htmlFor="loanReturnEndTime"
                label="เวลาคืนสิ้นสุด"
                tooltip="หากกำหนด เวลาคืนต้องไม่เกินเวลานี้"
              />
              <input
                type="time"
                id="loanReturnEndTime"
                name="loanReturnEndTime"
                value={settings.loanReturnEndTime}
                onChange={onChange}
                disabled={disabled}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.loanReturnEndTime ? 'border-red-300' : 'border-gray-300'}`}
              />
              {errors.loanReturnEndTime && (
                <p className="mt-1 text-sm text-red-600">{errors.loanReturnEndTime}</p>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">ปล่อยว่างหากไม่ต้องการจำกัดช่วงเวลาคืนอุปกรณ์</p>
        </div>
      </div>
    </div>
  );
};


/**
 * User Type Limits Section Component
 */
const UserTypeLimitsSection = ({ 
  limits, 
  globalSettings, 
  enabled, 
  onToggleEnabled, 
  onChange, 
  onToggleActive, 
  errors, 
  conflicts,
  disabled 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900">การยืมตามประเภทผู้ใช้</h2>
            </div>
            
            {/* Enable/Disable Toggle */}
            <button
              type="button"
              onClick={onToggleEnabled}
              disabled={disabled}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                ${enabled ? 'bg-blue-600' : 'bg-gray-200'}
              `}
              role="switch"
              aria-checked={enabled}
              aria-label="เปิด/ปิดระบบจำกัดตามประเภทผู้ใช้"
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                  transition duration-200 ease-in-out
                  ${enabled ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {enabled 
              ? 'ระบบจะใช้ค่าที่กำหนดตามประเภทผู้ใช้ (ค่าที่มีผลจริงจะเป็นค่าที่น้อยกว่าระหว่างค่าเริ่มต้นและค่าตามประเภทผู้ใช้)'
              : 'เมื่อเปิดใช้งาน ระบบจะใช้ค่าที่กำหนดตามประเภทผู้ใช้แทนค่าเริ่มต้น'
            }
          </p>
        </div>

        {/* User Type Cards - Responsive Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${!enabled ? 'opacity-50' : ''}`}>
          {Object.entries(limits).map(([userType, limit]) => (
            <UserTypeCard
              key={userType}
              userType={userType}
              limit={limit}
              globalSettings={globalSettings}
              disabled={disabled || !enabled}
              errors={errors}
              conflicts={conflicts}
              onLimitChange={onChange}
              onToggleActive={onToggleActive}
              showEffectiveLimit={enabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
};


/**
 * User Type Card Component
 */
const UserTypeCard = ({ 
  userType, 
  limit, 
  globalSettings,
  disabled, 
  errors, 
  conflicts,
  onLimitChange, 
  onToggleActive,
  showEffectiveLimit 
}) => {
  const userTypeName = USER_TYPE_NAMES[userType];
  const isActive = limit.isActive && !disabled;
  
  // Check if this user type has conflicts
  const hasConflict = (field) => {
    return conflicts.some(c => c.userType === userType && c.field === field);
  };
  
  // Get icon based on user type
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
  
  // Get color based on user type
  const getColorClasses = () => {
    switch (userType) {
      case 'teacher':
        return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600' };
      case 'staff':
        return { bg: 'bg-green-50', border: 'border-green-200', icon: 'bg-green-100 text-green-600' };
      case 'student':
        return { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-100 text-purple-600' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'bg-gray-100 text-gray-600' };
    }
  };
  
  const colors = getColorClasses();
  
  return (
    <div className={`
      rounded-lg border-2 p-4 transition-all
      ${disabled ? 'opacity-50 bg-gray-50 border-gray-200' : 
        isActive ? `${colors.bg} ${colors.border}` : 'bg-gray-50 border-gray-200'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isActive ? colors.icon : 'bg-gray-100 text-gray-400'}`}>
            {getIcon()}
          </div>
          <h3 className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
            {userTypeName}
          </h3>
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
                ${errors[`${userType}.maxDays`] || hasConflict('maxDays') ? 'border-yellow-400' : 'border-gray-300'}
              `}
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">วัน</span>
          </div>
          {errors[`${userType}.maxDays`] && (
            <p className="mt-1 text-xs text-red-600">{errors[`${userType}.maxDays`]}</p>
          )}
          {showEffectiveLimit && limit.isActive && (
            <p className="mt-1 text-xs text-gray-500">
              ค่าที่มีผล: {calculateEffectiveLimit(globalSettings.maxLoanDuration, limit.maxDays, true)} วัน
              {hasConflict('maxDays') && <span className="text-yellow-600 ml-1">(จำกัดโดยค่าเริ่มต้น)</span>}
            </p>
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
                ${errors[`${userType}.maxAdvanceBookingDays`] || hasConflict('maxAdvanceBookingDays') ? 'border-yellow-400' : 'border-gray-300'}
              `}
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">วัน</span>
          </div>
          {errors[`${userType}.maxAdvanceBookingDays`] && (
            <p className="mt-1 text-xs text-red-600">{errors[`${userType}.maxAdvanceBookingDays`]}</p>
          )}
          {showEffectiveLimit && limit.isActive && (
            <p className="mt-1 text-xs text-gray-500">
              ค่าที่มีผล: {calculateEffectiveLimit(globalSettings.maxAdvanceBookingDays, limit.maxAdvanceBookingDays, true)} วัน
              {hasConflict('maxAdvanceBookingDays') && <span className="text-yellow-600 ml-1">(จำกัดโดยค่าเริ่มต้น)</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};


/**
 * Conflict Warning Component
 * Displays list of conflicts with explanations and impact
 * Requirements: 7.3
 */
const ConflictWarning = ({ conflicts }) => {
  if (!conflicts || conflicts.length === 0) return null;
  
  // Get field display name in Thai
  const getFieldDisplayName = (field) => {
    switch (field) {
      case 'maxDays':
        return 'จำนวนวันยืม';
      case 'maxAdvanceBookingDays':
        return 'วันจองล่วงหน้า';
      default:
        return field;
    }
  };
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800 mb-2">
            พบการตั้งค่าที่อาจขัดแย้งกัน ({conflicts.length} รายการ)
          </h4>
          
          <div className="space-y-3">
            {conflicts.map((conflict, index) => {
              const effectiveValue = Math.min(conflict.globalValue, conflict.userTypeValue);
              const fieldName = getFieldDisplayName(conflict.field);
              
              return (
                <div key={index} className="bg-white rounded border border-yellow-100 p-3">
                  <p className="text-sm text-yellow-800 font-medium mb-1">
                    {conflict.message}
                  </p>
                  <div className="text-xs text-yellow-700 space-y-1">
                    <p>
                      <span className="font-medium">ผลกระทบ:</span> ผู้ใช้ประเภท {USER_TYPE_NAMES[conflict.userType]} จะถูกจำกัด{fieldName}ที่ {effectiveValue} วัน 
                      (แทนที่จะเป็น {conflict.userTypeValue} วัน ตามที่ตั้งค่าไว้)
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                        ค่าเริ่มต้น: {conflict.globalValue} วัน
                      </span>
                      <span className="text-yellow-500">→</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                        ค่าที่ตั้ง: {conflict.userTypeValue} วัน
                      </span>
                      <span className="text-yellow-500">→</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                        ค่าที่มีผล: {effectiveValue} วัน
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <p className="mt-3 text-xs text-yellow-600 bg-yellow-100 rounded px-2 py-1">
            💡 หมายเหตุ: ระบบจะใช้ค่าที่น้อยกว่าระหว่างค่าเริ่มต้นและค่าตามประเภทผู้ใช้เสมอ 
            เพื่อให้แน่ใจว่าไม่มีผู้ใช้ได้รับสิทธิ์เกินกว่าที่ระบบกำหนด
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Unified Help Section Component
 * 
 * Provides comprehensive guidance for loan settings configuration.
 * Includes recommended values, configuration examples, and priority explanation.
 * 
 * Requirements: 7.1, 7.2
 */
const UnifiedHelpSection = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 sm:p-6">
        <HelpSection title="คำแนะนำการใช้งาน" defaultExpanded={false}>
          <div className="space-y-6">
            {/* Priority Explanation Section */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                ลำดับความสำคัญของการตั้งค่า
              </h4>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-2 flex-shrink-0">1</span>
                    <span><strong>ค่าเริ่มต้นของระบบ</strong> - ใช้กับผู้ใช้ทุกคนเป็นค่าพื้นฐาน</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-2 flex-shrink-0">2</span>
                    <span><strong>ค่าตามประเภทผู้ใช้</strong> - ใช้เมื่อเปิดระบบและประเภทผู้ใช้นั้นเปิดใช้งาน</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold mr-2 flex-shrink-0">✓</span>
                    <span><strong>ค่าที่มีผลจริง</strong> = ค่าที่น้อยกว่าระหว่างค่าเริ่มต้นและค่าตามประเภทผู้ใช้</span>
                  </li>
                </ul>
                <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                  <p className="text-sm text-gray-600">
                    <strong>ตัวอย่าง:</strong> ถ้าค่าเริ่มต้น = 14 วัน และอาจารย์ตั้งไว้ = 30 วัน → ค่าที่มีผลจริง = <span className="text-green-600 font-semibold">14 วัน</span> (ใช้ค่าที่น้อยกว่า)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Recommended Values Section */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ค่าแนะนำสำหรับแต่ละประเภทผู้ใช้
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">ประเภทผู้ใช้</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">จำนวนชิ้นสูงสุด</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">จำนวนวันยืม</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">จองล่วงหน้า</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">เหตุผล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-blue-50">
                      <td className="px-4 py-3 font-medium text-blue-800">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          ค่าเริ่มต้น
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-blue-700">-</td>
                      <td className="px-4 py-3 text-center text-blue-700 font-semibold">14 วัน</td>
                      <td className="px-4 py-3 text-center text-blue-700 font-semibold">30 วัน</td>
                      <td className="px-4 py-3 text-sm text-blue-600">ค่ากลางที่เหมาะสมสำหรับทุกคน</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        <span className="flex items-center text-blue-700">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          อาจารย์
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">5-10 ชิ้น</td>
                      <td className="px-4 py-3 text-center">14-30 วัน</td>
                      <td className="px-4 py-3 text-center">30-60 วัน</td>
                      <td className="px-4 py-3 text-sm text-gray-600">ต้องการอุปกรณ์สำหรับการสอนและวิจัย</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        <span className="flex items-center text-green-700">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          เจ้าหน้าที่
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">3-5 ชิ้น</td>
                      <td className="px-4 py-3 text-center">7-14 วัน</td>
                      <td className="px-4 py-3 text-center">14-30 วัน</td>
                      <td className="px-4 py-3 text-sm text-gray-600">ใช้งานประจำในหน่วยงาน</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        <span className="flex items-center text-purple-700">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                          </svg>
                          นักศึกษา
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">1-3 ชิ้น</td>
                      <td className="px-4 py-3 text-center">3-7 วัน</td>
                      <td className="px-4 py-3 text-center">7-14 วัน</td>
                      <td className="px-4 py-3 text-sm text-gray-600">ใช้งานระยะสั้นสำหรับการเรียน</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Configuration Examples Section */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                ตัวอย่างการตั้งค่า
              </h4>
              <div className="space-y-4">
                {/* Example 1 */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h5 className="font-medium text-green-800 mb-2">
                    ✅ ตัวอย่างที่ 1: ให้อาจารย์ยืมได้นานกว่านักศึกษา
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-white rounded p-3 border border-green-100">
                      <p className="font-medium text-gray-700 mb-1">ค่าเริ่มต้น</p>
                      <p className="text-gray-600">ระยะเวลายืม = <span className="font-semibold">30 วัน</span></p>
                    </div>
                    <div className="bg-white rounded p-3 border border-green-100">
                      <p className="font-medium text-blue-700 mb-1">อาจารย์</p>
                      <p className="text-gray-600">ระยะเวลายืม = <span className="font-semibold">30 วัน</span></p>
                      <p className="text-xs text-green-600 mt-1">→ ได้เต็มที่ตามค่าเริ่มต้น</p>
                    </div>
                    <div className="bg-white rounded p-3 border border-green-100">
                      <p className="font-medium text-purple-700 mb-1">นักศึกษา</p>
                      <p className="text-gray-600">ระยะเวลายืม = <span className="font-semibold">7 วัน</span></p>
                      <p className="text-xs text-orange-600 mt-1">→ ถูกจำกัดที่ 7 วัน</p>
                    </div>
                  </div>
                </div>
                
                {/* Example 2 */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h5 className="font-medium text-yellow-800 mb-2">
                    ⚠️ ตัวอย่างที่ 2: กรณีที่ค่าตามประเภทผู้ใช้เกินค่าเริ่มต้น
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded p-3 border border-yellow-100">
                      <p className="font-medium text-gray-700 mb-1">การตั้งค่า</p>
                      <ul className="text-gray-600 space-y-1">
                        <li>• ค่าเริ่มต้น: ระยะเวลายืม = <span className="font-semibold">14 วัน</span></li>
                        <li>• อาจารย์: ระยะเวลายืม = <span className="font-semibold text-red-600">30 วัน</span></li>
                      </ul>
                    </div>
                    <div className="bg-white rounded p-3 border border-yellow-100">
                      <p className="font-medium text-gray-700 mb-1">ผลลัพธ์</p>
                      <p className="text-gray-600">
                        อาจารย์จะยืมได้สูงสุด <span className="font-semibold text-green-600">14 วัน</span> เท่านั้น
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        (ระบบใช้ค่าที่น้อยกว่าเสมอเพื่อความปลอดภัย)
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Example 3 */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h5 className="font-medium text-blue-800 mb-2">
                    💡 ตัวอย่างที่ 3: การตั้งค่าที่แนะนำสำหรับห้องปฏิบัติการ
                  </h5>
                  <div className="text-sm text-gray-700">
                    <p className="mb-2">สำหรับห้องปฏิบัติการที่มีอุปกรณ์จำกัดและต้องการหมุนเวียนบ่อย:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white rounded p-3 border border-blue-100">
                        <p className="font-medium mb-2">ค่าเริ่มต้น</p>
                        <ul className="space-y-1 text-gray-600">
                          <li>• ระยะเวลายืม: <span className="font-semibold">7 วัน</span></li>
                          <li>• จองล่วงหน้า: <span className="font-semibold">14 วัน</span></li>
                        </ul>
                      </div>
                      <div className="bg-white rounded p-3 border border-blue-100">
                        <p className="font-medium mb-2">ตามประเภทผู้ใช้</p>
                        <ul className="space-y-1 text-gray-600">
                          <li>• อาจารย์: 5 ชิ้น, 7 วัน, 14 วัน</li>
                          <li>• เจ้าหน้าที่: 3 ชิ้น, 5 วัน, 7 วัน</li>
                          <li>• นักศึกษา: 2 ชิ้น, 3 วัน, 7 วัน</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tips Section */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                เคล็ดลับการตั้งค่า
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>ตั้งค่าเริ่มต้นให้เป็นค่าสูงสุดที่ต้องการ แล้วจำกัดตามประเภทผู้ใช้</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>หากไม่ต้องการแยกตามประเภทผู้ใช้ ให้ปิดระบบและใช้ค่าเริ่มต้นเพียงอย่างเดียว</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>ตรวจสอบคำเตือนสีเหลืองเมื่อค่าตามประเภทผู้ใช้เกินค่าเริ่มต้น</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>ช่วงเวลาคืนอุปกรณ์เป็นตัวเลือกเสริม ใช้เมื่อต้องการจำกัดเวลาคืนในแต่ละวัน</span>
                </li>
              </ul>
            </div>
          </div>
        </HelpSection>
      </div>
    </div>
  );
};

export default UnifiedLoanSettingsTab;
