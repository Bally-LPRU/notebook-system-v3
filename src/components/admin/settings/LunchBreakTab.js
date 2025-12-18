/**
 * LunchBreakTab Component
 * 
 * Tab สำหรับตั้งค่าเวลาพักกลางวันของห้องให้บริการยืม-คืนอุปกรณ์
 * - เปิด/ปิดการใช้งานเวลาพักกลางวัน
 * - ตั้งค่าเวลาเริ่มต้นและสิ้นสุด
 * - ตั้งค่าข้อความแจ้งเตือนผู้ใช้
 */

import { useState, useEffect } from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { DEFAULT_LUNCH_BREAK, LUNCH_BREAK_VALIDATION } from '../../../types/settings';

/**
 * LunchBreakTab Component
 */
const LunchBreakTab = () => {
  const { settings, updateSetting, loading: settingsLoading } = useSettings();
  const { userProfile } = useAuth();
  
  // Local state for form
  const [formData, setFormData] = useState({
    enabled: true,
    startTime: '12:00',
    endTime: '13:00',
    message: DEFAULT_LUNCH_BREAK.message
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Load settings into form
  useEffect(() => {
    if (settings?.lunchBreak) {
      setFormData({
        enabled: settings.lunchBreak.enabled !== false,
        startTime: settings.lunchBreak.startTime || DEFAULT_LUNCH_BREAK.startTime,
        endTime: settings.lunchBreak.endTime || DEFAULT_LUNCH_BREAK.endTime,
        message: settings.lunchBreak.message || DEFAULT_LUNCH_BREAK.message
      });
    }
  }, [settings?.lunchBreak]);

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
    
    // Clear success message
    setSaveSuccess(false);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (formData.enabled) {
      // Validate start time
      if (!formData.startTime) {
        newErrors.startTime = 'กรุณาระบุเวลาเริ่มต้น';
      }
      
      // Validate end time
      if (!formData.endTime) {
        newErrors.endTime = 'กรุณาระบุเวลาสิ้นสุด';
      }
      
      // Validate time range
      if (formData.startTime && formData.endTime) {
        const [startHour, startMin] = formData.startTime.split(':').map(Number);
        const [endHour, endMin] = formData.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        if (startMinutes >= endMinutes) {
          newErrors.endTime = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น';
        }
        
        // Check reasonable lunch break duration (max 3 hours)
        if (endMinutes - startMinutes > 180) {
          newErrors.endTime = 'ช่วงเวลาพักกลางวันไม่ควรเกิน 3 ชั่วโมง';
        }
      }
      
      // Validate message length
      if (formData.message && formData.message.length > LUNCH_BREAK_VALIDATION.message.maxLength) {
        newErrors.message = `ข้อความต้องไม่เกิน ${LUNCH_BREAK_VALIDATION.message.maxLength} ตัวอักษร`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      await updateSetting(
        'lunchBreak',
        formData,
        userProfile?.uid,
        userProfile?.displayName
      );
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving lunch break settings:', error);
      setErrors({ submit: 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่' });
    } finally {
      setSaving(false);
    }
  };

  // Handle reset to defaults
  const handleReset = () => {
    setFormData({
      enabled: DEFAULT_LUNCH_BREAK.enabled,
      startTime: DEFAULT_LUNCH_BREAK.startTime,
      endTime: DEFAULT_LUNCH_BREAK.endTime,
      message: DEFAULT_LUNCH_BREAK.message
    });
    setErrors({});
    setSaveSuccess(false);
  };

  if (settingsLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">ตั้งค่าเวลาพักกลางวัน</h2>
            <p className="text-gray-600 mt-1">
              กำหนดช่วงเวลาพักกลางวันที่ห้องให้บริการยืม-คืนอุปกรณ์ปิดให้บริการ
              ผู้ใช้จะไม่สามารถเลือกเวลารับ-คืนอุปกรณ์ในช่วงเวลานี้ได้
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">เปิดใช้งานเวลาพักกลางวัน</span>
                {formData.enabled ? (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    เปิดใช้งาน
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    ปิดใช้งาน
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                เมื่อเปิดใช้งาน ผู้ใช้จะไม่สามารถเลือกเวลารับ-คืนอุปกรณ์ในช่วงพักกลางวันได้
              </p>
            </div>
            <button
              onClick={() => handleChange('enabled', !formData.enabled)}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                ${formData.enabled ? 'bg-orange-600' : 'bg-gray-200'}
              `}
              role="switch"
              aria-checked={formData.enabled}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                  transition duration-200 ease-in-out
                  ${formData.enabled ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* Time Settings (only show when enabled) */}
          {formData.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Time */}
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                    เวลาเริ่มพักกลางวัน *
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    value={formData.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    className={`
                      w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                      ${errors.startTime ? 'border-red-500' : 'border-gray-300'}
                    `}
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                  )}
                </div>

                {/* End Time */}
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                    เวลาสิ้นสุดพักกลางวัน *
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    value={formData.endTime}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                    className={`
                      w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                      ${errors.endTime ? 'border-red-500' : 'border-gray-300'}
                    `}
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                  )}
                </div>
              </div>

              {/* Duration Display */}
              {formData.startTime && formData.endTime && !errors.startTime && !errors.endTime && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-orange-800 font-medium">
                      ช่วงเวลาพักกลางวัน: {formData.startTime} - {formData.endTime} น.
                    </span>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    {(() => {
                      const [startH, startM] = formData.startTime.split(':').map(Number);
                      const [endH, endM] = formData.endTime.split(':').map(Number);
                      const duration = (endH * 60 + endM) - (startH * 60 + startM);
                      if (duration > 0) {
                        const hours = Math.floor(duration / 60);
                        const mins = duration % 60;
                        return `ระยะเวลา: ${hours > 0 ? `${hours} ชั่วโมง ` : ''}${mins > 0 ? `${mins} นาที` : ''}`;
                      }
                      return '';
                    })()}
                  </p>
                </div>
              )}

              {/* Custom Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  ข้อความแจ้งเตือนผู้ใช้
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  rows={3}
                  placeholder="ข้อความที่จะแสดงให้ผู้ใช้ทราบเกี่ยวกับเวลาพักกลางวัน"
                  className={`
                    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                    ${errors.message ? 'border-red-500' : 'border-gray-300'}
                  `}
                />
                <div className="flex justify-between mt-1">
                  {errors.message ? (
                    <p className="text-sm text-red-600">{errors.message}</p>
                  ) : (
                    <p className="text-sm text-gray-500">ข้อความนี้จะแสดงที่หน้าแรกและหน้าจองอุปกรณ์</p>
                  )}
                  <span className="text-sm text-gray-500">
                    {formData.message.length}/{LUNCH_BREAK_VALIDATION.message.maxLength}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800">{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {saveSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800">บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              รีเซ็ตเป็นค่าเริ่มต้น
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          ตัวอย่างการแสดงผล
        </h3>
        
        {formData.enabled ? (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-orange-800">เวลาพักกลางวัน</h4>
                <p className="text-orange-700 mt-1">
                  {formData.message || `พักกลางวัน ${formData.startTime} - ${formData.endTime} น.`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p>ปิดใช้งานเวลาพักกลางวัน - ไม่มีการแสดงผลให้ผู้ใช้</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LunchBreakTab;
