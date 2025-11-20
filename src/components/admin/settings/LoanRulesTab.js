/**
 * Loan Rules Tab Component
 * 
 * Manages loan duration and advance booking period settings.
 * Provides input fields with validation for:
 * - Maximum loan duration (days)
 * - Maximum advance booking period (days)
 * 
 * Requirements: 3.1, 3.4, 3.5, 4.1, 4.4
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { SettingsToast, SettingsAlert } from './SettingsNotifications';
import { FieldLabel, HelpSection } from './SettingsTooltip';

/**
 * LoanRulesTab Component
 * 
 * Provides interface for managing loan rules settings including:
 * - Maximum loan duration
 * - Maximum advance booking period
 * 
 * @component
 * @returns {JSX.Element} Loan rules settings tab
 */
const LoanRulesTab = () => {
  const { userProfile } = useAuth();
  const { settings, updateMultipleSettings } = useSettings();
  
  // Form state
  const [formData, setFormData] = useState({
    maxLoanDuration: settings.maxLoanDuration || 14,
    maxAdvanceBookingDays: settings.maxAdvanceBookingDays || 30
  });
  
  // UI state
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when settings change
  useEffect(() => {
    setFormData({
      maxLoanDuration: settings.maxLoanDuration || 14,
      maxAdvanceBookingDays: settings.maxAdvanceBookingDays || 30
    });
  }, [settings]);

  // Check for changes
  useEffect(() => {
    const changed = 
      formData.maxLoanDuration !== settings.maxLoanDuration ||
      formData.maxAdvanceBookingDays !== settings.maxAdvanceBookingDays;
    setHasChanges(changed);
  }, [formData, settings]);

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(numValue) ? '' : numValue
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear success message when user makes changes
    setSaveSuccess(false);
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {};
    
    // Validate max loan duration
    if (!formData.maxLoanDuration || formData.maxLoanDuration === '') {
      newErrors.maxLoanDuration = 'กรุณาระบุจำนวนวันที่สามารถยืมได้';
    } else if (formData.maxLoanDuration < 1) {
      newErrors.maxLoanDuration = 'จำนวนวันต้องมากกว่า 0';
    } else if (formData.maxLoanDuration > 365) {
      newErrors.maxLoanDuration = 'จำนวนวันต้องไม่เกิน 365 วัน';
    }
    
    // Validate max advance booking days
    if (!formData.maxAdvanceBookingDays || formData.maxAdvanceBookingDays === '') {
      newErrors.maxAdvanceBookingDays = 'กรุณาระบุจำนวนวันที่สามารถจองล่วงหน้าได้';
    } else if (formData.maxAdvanceBookingDays < 1) {
      newErrors.maxAdvanceBookingDays = 'จำนวนวันต้องมากกว่า 0';
    } else if (formData.maxAdvanceBookingDays > 365) {
      newErrors.maxAdvanceBookingDays = 'จำนวนวันต้องไม่เกิน 365 วัน';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Update settings
      await updateMultipleSettings(
        {
          maxLoanDuration: formData.maxLoanDuration,
          maxAdvanceBookingDays: formData.maxAdvanceBookingDays
        },
        userProfile.uid,
        userProfile.displayName || userProfile.email
      );
      
      setSaveSuccess(true);
      setHasChanges(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving loan rules:', error);
      setErrors({
        submit: error.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า'
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Reset form to current settings
   */
  const handleReset = () => {
    setFormData({
      maxLoanDuration: settings.maxLoanDuration || 14,
      maxAdvanceBookingDays: settings.maxAdvanceBookingDays || 30
    });
    setErrors({});
    setSaveSuccess(false);
    setHasChanges(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">กฎการยืมและการจอง</h2>
          <p className="mt-1 text-sm text-gray-600">
            กำหนดระยะเวลาการยืมและการจองล่วงหน้าสูงสุด
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Max Loan Duration */}
          <div>
            <FieldLabel
              htmlFor="maxLoanDuration"
              label="ระยะเวลาการยืมสูงสุด"
              required
              tooltip="จำนวนวันสูงสุดที่ผู้ใช้สามารถยืมอุปกรณ์ได้ในแต่ละครั้ง ตัวอย่าง: 14 วัน = 2 สัปดาห์"
            />
            <div className="flex items-center space-x-3">
              <input
                type="number"
                id="maxLoanDuration"
                name="maxLoanDuration"
                value={formData.maxLoanDuration}
                onChange={handleInputChange}
                min="1"
                max="365"
                className={`
                  block w-32 px-3 py-2 border rounded-md shadow-sm sm:text-sm
                  focus:ring-blue-500 focus:border-blue-500
                  ${errors.maxLoanDuration ? 'border-red-300' : 'border-gray-300'}
                `}
                required
              />
              <span className="text-sm text-gray-600">วัน</span>
            </div>
            {errors.maxLoanDuration && (
              <p className="mt-1 text-sm text-red-600">{errors.maxLoanDuration}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              จำนวนวันสูงสุดที่ผู้ใช้สามารถยืมอุปกรณ์ได้ (ค่าปัจจุบัน: {settings.maxLoanDuration} วัน)
            </p>
          </div>

          {/* Max Advance Booking Days */}
          <div>
            <FieldLabel
              htmlFor="maxAdvanceBookingDays"
              label="ระยะเวลาการจองล่วงหน้าสูงสุด"
              required
              tooltip="จำนวนวันล่วงหน้าสูงสุดที่ผู้ใช้สามารถจองอุปกรณ์ได้ ตัวอย่าง: 30 วัน = 1 เดือน"
            />
            <div className="flex items-center space-x-3">
              <input
                type="number"
                id="maxAdvanceBookingDays"
                name="maxAdvanceBookingDays"
                value={formData.maxAdvanceBookingDays}
                onChange={handleInputChange}
                min="1"
                max="365"
                className={`
                  block w-32 px-3 py-2 border rounded-md shadow-sm sm:text-sm
                  focus:ring-blue-500 focus:border-blue-500
                  ${errors.maxAdvanceBookingDays ? 'border-red-300' : 'border-gray-300'}
                `}
                required
              />
              <span className="text-sm text-gray-600">วัน</span>
            </div>
            {errors.maxAdvanceBookingDays && (
              <p className="mt-1 text-sm text-red-600">{errors.maxAdvanceBookingDays}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              จำนวนวันล่วงหน้าสูงสุดที่ผู้ใช้สามารถจองอุปกรณ์ได้ (ค่าปัจจุบัน: {settings.maxAdvanceBookingDays} วัน)
            </p>
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
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving || !hasChanges}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving || !hasChanges}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
          <HelpSection title="คำแนะนำและตัวอย่าง" defaultExpanded={false}>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">ผลกระทบของการเปลี่ยนแปลง</h4>
                <ul className="space-y-1 list-disc list-inside text-gray-600">
                  <li>การเปลี่ยนแปลงจะมีผลทันทีกับคำขอยืมและการจองใหม่ทั้งหมด</li>
                  <li>คำขอที่ส่งไปแล้วจะไม่ได้รับผลกระทบจากการเปลี่ยนแปลง</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">ค่าแนะนำ</h4>
                <ul className="space-y-1 list-disc list-inside text-gray-600">
                  <li><strong>ระยะเวลาการยืม:</strong> 7-30 วัน (1-4 สัปดาห์)</li>
                  <li><strong>การจองล่วงหน้า:</strong> 30-60 วัน (1-2 เดือน)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">ตัวอย่างการใช้งาน</h4>
                <div className="bg-gray-50 rounded p-3 text-gray-600">
                  <p className="mb-2">หากตั้งค่า:</p>
                  <ul className="space-y-1 list-disc list-inside ml-4">
                    <li>ระยะเวลาการยืม = 14 วัน</li>
                    <li>การจองล่วงหน้า = 30 วัน</li>
                  </ul>
                  <p className="mt-2">ผู้ใช้สามารถ:</p>
                  <ul className="space-y-1 list-disc list-inside ml-4">
                    <li>ยืมอุปกรณ์ได้สูงสุด 14 วัน (2 สัปดาห์)</li>
                    <li>จองอุปกรณ์ล่วงหน้าได้ไม่เกิน 30 วัน (1 เดือน)</li>
                  </ul>
                </div>
              </div>
            </div>
          </HelpSection>
        </div>
      </div>
    </div>
  );
};

export default LoanRulesTab;
