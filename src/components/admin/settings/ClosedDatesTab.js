/**
 * Closed Dates Tab Component
 * 
 * Manages closed dates for the equipment lending system.
 * Allows administrators to add, view, and remove dates when the system is closed.
 * 
 * Features:
 * - View all closed dates in chronological order
 * - Add new closed dates with reason
 * - Delete existing closed dates
 * - Real-time updates
 * 
 * Requirements: 2.1, 2.5, 2.6
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import settingsService from '../../../services/settingsService';
import { SettingsToast, SettingsAlert, SettingsConfirmDialog } from './SettingsNotifications';
import { SettingsLoadingState } from './SettingsTabSkeleton';
import { FieldLabel, HelpSection } from './SettingsTooltip';

/**
 * ClosedDatesTab Component
 * 
 * Provides interface for managing closed dates in the system.
 * 
 * @component
 * @returns {JSX.Element} Closed dates management interface
 */
const ClosedDatesTab = () => {
  const { userProfile } = useAuth();
  const [closedDates, setClosedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    dateId: null,
    dateName: ''
  });

  /**
   * Load closed dates on component mount
   */
  useEffect(() => {
    loadClosedDates();
  }, []);

  /**
   * Load all closed dates from the service
   */
  const loadClosedDates = async () => {
    try {
      setLoading(true);
      setError(null);
      const dates = await settingsService.getClosedDates();
      setClosedDates(dates);
    } catch (err) {
      console.error('Error loading closed dates:', err);
      setError('ไม่สามารถโหลดวันปิดทำการได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle adding a new closed date
   */
  const handleAddClosedDate = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setFormError(null);
    setSuccessMessage(null);

    // Validate inputs
    if (!newDate) {
      setFormError('กรุณาเลือกวันที่');
      return;
    }

    if (!newReason.trim()) {
      setFormError('กรุณาระบุเหตุผล');
      return;
    }

    try {
      setSaving(true);
      
      // Convert string date to Date object
      const dateObj = new Date(newDate);
      
      // Add closed date
      await settingsService.addClosedDate(
        dateObj,
        newReason.trim(),
        userProfile?.uid || 'unknown',
        isRecurring,
        isRecurring ? 'yearly' : null
      );

      // Clear form
      setNewDate('');
      setNewReason('');
      setIsRecurring(false);
      
      // Show success message
      setSuccessMessage('เพิ่มวันปิดทำการสำเร็จ');
      
      // Reload closed dates
      await loadClosedDates();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error adding closed date:', err);
      setFormError(err.message || 'ไม่สามารถเพิ่มวันปิดทำการได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Open delete confirmation dialog
   */
  const openDeleteConfirmation = (dateId, dateName) => {
    setConfirmDialog({
      isOpen: true,
      dateId,
      dateName
    });
  };

  /**
   * Close delete confirmation dialog
   */
  const closeDeleteConfirmation = () => {
    setConfirmDialog({
      isOpen: false,
      dateId: null,
      dateName: ''
    });
  };

  /**
   * Handle deleting a closed date
   */
  const handleDeleteClosedDate = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await settingsService.removeClosedDate(confirmDialog.dateId);
      
      // Close dialog
      closeDeleteConfirmation();
      
      // Show success message
      setSuccessMessage('ลบวันปิดทำการสำเร็จ');
      
      // Reload closed dates
      await loadClosedDates();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting closed date:', err);
      setError('ไม่สามารถลบวันปิดทำการได้ กรุณาลองใหม่อีกครั้ง');
      closeDeleteConfirmation();
    } finally {
      setSaving(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (date) => {
    if (!date) return '-';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    return dateObj.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  /**
   * Get today's date in YYYY-MM-DD format for min date
   */
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Show loading state
  if (loading) {
    return <SettingsLoadingState message="กำลังโหลดวันปิดทำการ..." />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <SettingsToast
            type="success"
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
            duration={3000}
          />
        )}

        {/* Error Message */}
        {error && (
          <SettingsAlert
            type="error"
            message={error}
          />
        )}

      {/* Add New Closed Date Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">เพิ่มวันปิดทำการ</h3>
        
        <form onSubmit={handleAddClosedDate} className="space-y-4">
          {/* Form Error */}
          {formError && (
            <SettingsAlert type="error" message={formError} />
          )}

          {/* Date Input */}
          <div>
            <FieldLabel
              htmlFor="closed-date"
              label="วันที่"
              required
              tooltip="เลือกวันที่ต้องการปิดทำการ ผู้ใช้จะไม่สามารถเลือกวันนี้สำหรับการยืม คืน หรือจองอุปกรณ์"
            />
            <input
              type="date"
              id="closed-date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={getTodayString()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
              required
            />
          </div>

          {/* Reason Input */}
          <div>
            <FieldLabel
              htmlFor="closed-reason"
              label="เหตุผล"
              required
              tooltip="ระบุเหตุผลที่ปิดทำการ เช่น วันหยุดราชการ, ปิดปรับปรุงระบบ, วันหยุดพิเศษ"
            />
            <input
              type="text"
              id="closed-reason"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="เช่น วันหยุดราชการ, ปิดปรับปรุงระบบ"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
              required
            />
          </div>

          {/* Recurring Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is-recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={saving}
            />
            <label htmlFor="is-recurring" className="ml-2 block text-sm text-gray-700">
              ทำซ้ำทุกปี (เช่น วันหยุดประจำชาติ)
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'กำลังบันทึก...' : 'เพิ่มวันปิดทำการ'}
            </button>
          </div>
        </form>
      </div>

      {/* Closed Dates List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          วันปิดทำการทั้งหมด ({closedDates.length})
        </h3>

        {closedDates.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">ยังไม่มีวันปิดทำการ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {closedDates.map((closedDate) => (
              <div
                key={closedDate.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">
                      {formatDate(closedDate.date)}
                    </p>
                    {closedDate.isRecurring && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        ทำซ้ำทุกปี
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{closedDate.reason}</p>
                </div>
                
                <button
                  onClick={() => openDeleteConfirmation(closedDate.id, formatDate(closedDate.date))}
                  disabled={saving}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="ลบวันปิดทำการ"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <HelpSection title="คำแนะนำและตัวอย่าง" defaultExpanded={false}>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">การใช้งาน</h4>
            <p className="text-gray-600 mb-2">
              วันปิดทำการจะถูกนำไปใช้ในการป้องกันผู้ใช้เลือกวันดังกล่าวสำหรับการยืม คืน หรือจองอุปกรณ์
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">การทำซ้ำทุกปี</h4>
            <p className="text-gray-600 mb-2">
              หากเลือก "ทำซ้ำทุกปี" วันที่นี้จะถูกปิดทุกปีโดยอัตโนมัติ เหมาะสำหรับวันหยุดประจำชาติหรือวันหยุดประจำปี
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">ตัวอย่างการใช้งาน</h4>
            <div className="bg-gray-50 rounded p-3 text-gray-600">
              <p className="font-medium mb-2">วันหยุดที่ควรเพิ่ม:</p>
              <ul className="space-y-1 list-disc list-inside ml-4">
                <li>วันหยุดราชการ (เช่น วันปีใหม่, วันสงกรานต์)</li>
                <li>วันปิดปรับปรุงระบบ</li>
                <li>วันจัดกิจกรรมพิเศษ</li>
                <li>วันหยุดพิเศษของหน่วยงาน</li>
              </ul>
            </div>
          </div>
        </div>
      </HelpSection>
    </div>

    {/* Confirmation Dialog */}
    <SettingsConfirmDialog
      isOpen={confirmDialog.isOpen}
      onClose={closeDeleteConfirmation}
      onConfirm={handleDeleteClosedDate}
      title="ยืนยันการลบวันปิดทำการ"
      message={`คุณแน่ใจหรือไม่ที่จะลบวันปิดทำการ "${confirmDialog.dateName}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
      confirmText="ลบ"
      cancelText="ยกเลิก"
      type="danger"
      loading={saving}
    />
  </>
  );
};

export default ClosedDatesTab;
