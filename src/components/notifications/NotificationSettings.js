import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  EnvelopeIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { useNotificationSettings } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';

const NotificationSettings = () => {
  const { user } = useAuth();
  const { settings, loading, error, updateSettings } = useNotificationSettings();
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleToggle = (category, key) => {
    if (!formData) return;
    
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  };

  const handleTimingChange = (key, value) => {
    if (!formData) return;
    
    setFormData(prev => ({
      ...prev,
      reminderTiming: {
        ...prev.reminderTiming,
        [key]: parseInt(value) || 0
      }
    }));
  };

  const handleSave = async () => {
    if (!formData) return;
    
    try {
      setSaving(true);
      setSaveMessage('');
      
      await updateSettings(formData);
      setSaveMessage('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('เกิดข้อผิดพลาดในการบันทึก');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData(settings);
      setSaveMessage('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">เกิดข้อผิดพลาด: {error}</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">ไม่สามารถโหลดการตั้งค่าได้</p>
      </div>
    );
  }

  const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <span
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">การตั้งค่าการแจ้งเตือน</h1>
        <p className="text-gray-600 mt-2">
          จัดการการแจ้งเตือนและความถี่ที่คุณต้องการรับ
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">ประเภทการแจ้งเตือน</h2>
          <p className="text-sm text-gray-500 mt-1">
            เลือกประเภทการแจ้งเตือนที่คุณต้องการรับ
          </p>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* In-App Notifications */}
          <div>
            <div className="flex items-center mb-4">
              <BellIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-base font-medium text-gray-900">การแจ้งเตือนในแอป</h3>
            </div>
            
            <div className="space-y-4 ml-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">การอนุมัติคำขอยืม</p>
                  <p className="text-sm text-gray-500">แจ้งเตือนเมื่อคำขอยืมได้รับการอนุมัติหรือปฏิเสธ</p>
                </div>
                <ToggleSwitch
                  enabled={formData.inAppNotifications?.loanApproval}
                  onChange={() => handleToggle('inAppNotifications', 'loanApproval')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">การแจ้งเตือนคืนอุปกรณ์</p>
                  <p className="text-sm text-gray-500">แจ้งเตือนก่อนถึงกำหนดคืนอุปกรณ์</p>
                </div>
                <ToggleSwitch
                  enabled={formData.inAppNotifications?.loanReminder}
                  onChange={() => handleToggle('inAppNotifications', 'loanReminder')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">การแจ้งเตือนการจอง</p>
                  <p className="text-sm text-gray-500">แจ้งเตือนเกี่ยวกับการจองอุปกรณ์</p>
                </div>
                <ToggleSwitch
                  enabled={formData.inAppNotifications?.reservationReminder}
                  onChange={() => handleToggle('inAppNotifications', 'reservationReminder')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">การอัปเดตระบบ</p>
                  <p className="text-sm text-gray-500">แจ้งเตือนเกี่ยวกับการอัปเดตและประกาศระบบ</p>
                </div>
                <ToggleSwitch
                  enabled={formData.inAppNotifications?.systemUpdates}
                  onChange={() => handleToggle('inAppNotifications', 'systemUpdates')}
                />
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-base font-medium text-gray-900">การแจ้งเตือนทางอีเมล</h3>
            </div>
            
            <div className="space-y-4 ml-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">การอนุมัติคำขอยืม</p>
                  <p className="text-sm text-gray-500">ส่งอีเมลเมื่อคำขอยืมได้รับการอนุมัติหรือปฏิเสธ</p>
                </div>
                <ToggleSwitch
                  enabled={formData.emailNotifications?.loanApproval}
                  onChange={() => handleToggle('emailNotifications', 'loanApproval')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">การแจ้งเตือนคืนอุปกรณ์</p>
                  <p className="text-sm text-gray-500">ส่งอีเมลแจ้งเตือนก่อนถึงกำหนดคืน</p>
                </div>
                <ToggleSwitch
                  enabled={formData.emailNotifications?.loanReminder}
                  onChange={() => handleToggle('emailNotifications', 'loanReminder')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">การแจ้งเตือนการจอง</p>
                  <p className="text-sm text-gray-500">ส่งอีเมลเกี่ยวกับการจองอุปกรณ์</p>
                </div>
                <ToggleSwitch
                  enabled={formData.emailNotifications?.reservationReminder}
                  onChange={() => handleToggle('emailNotifications', 'reservationReminder')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">การอัปเดตระบบ</p>
                  <p className="text-sm text-gray-500">ส่งอีเมลเกี่ยวกับการอัปเดตและประกาศระบบ</p>
                </div>
                <ToggleSwitch
                  enabled={formData.emailNotifications?.systemUpdates}
                  onChange={() => handleToggle('emailNotifications', 'systemUpdates')}
                />
              </div>
            </div>
          </div>

          {/* Timing Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">การตั้งเวลาการแจ้งเตือน</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">แจ้งเตือนคืนอุปกรณ์</p>
                  <p className="text-sm text-gray-500">แจ้งเตือนก่อนถึงกำหนดคืนกี่วัน</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={formData.reminderTiming?.loanReminder || 1}
                    onChange={(e) => handleTimingChange('loanReminder', e.target.value)}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-500">วัน</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">แจ้งเตือนการจอง</p>
                  <p className="text-sm text-gray-500">แจ้งเตือนก่อนถึงเวลานัดหมายกี่ชั่วโมง</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={formData.reminderTiming?.reservationReminder || 24}
                    onChange={(e) => handleTimingChange('reservationReminder', e.target.value)}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-500">ชั่วโมง</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div>
            {saveMessage && (
              <div className={`flex items-center text-sm ${
                saveMessage.includes('เรียบร้อย') ? 'text-green-600' : 'text-red-600'
              }`}>
                {saveMessage.includes('เรียบร้อย') ? (
                  <CheckIcon className="h-4 w-4 mr-1" />
                ) : (
                  <XMarkIcon className="h-4 w-4 mr-1" />
                )}
                {saveMessage}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              รีเซ็ต
            </button>
            
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึกการตั้งค่า'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-blue-800">ข้อมูลการแจ้งเตือน</p>
            <p className="text-sm text-blue-700 mt-1">
              การแจ้งเตือนทางอีเมลจะส่งไปที่: <strong>{user?.email}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;