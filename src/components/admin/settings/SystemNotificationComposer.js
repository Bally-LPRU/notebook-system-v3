import React, { useState } from 'react';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../../types/settings';

/**
 * SystemNotificationComposer Component
 * 
 * Allows administrators to compose and send system-wide notifications to all users.
 * Supports feedback requests, priority levels, and expiration dates.
 * 
 * Requirements: 7.1, 7.2
 */
const SystemNotificationComposer = ({ onSend, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: NOTIFICATION_TYPES.ANNOUNCEMENT,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    feedbackEnabled: false,
    feedbackQuestion: '',
    expiresAt: null
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleDateChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      expiresAt: value ? new Date(value) : null
    }));

    if (errors.expiresAt) {
      setErrors(prev => ({ ...prev, expiresAt: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'กรุณาระบุหัวข้อการแจ้งเตือน';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'กรุณาระบุเนื้อหาการแจ้งเตือน';
    }

    if (formData.feedbackEnabled && !formData.feedbackQuestion.trim()) {
      newErrors.feedbackQuestion = 'กรุณาระบุคำถามสำหรับขอความคิดเห็น';
    }

    if (formData.expiresAt && formData.expiresAt <= new Date()) {
      newErrors.expiresAt = 'วันหมดอายุต้องเป็นวันในอนาคต';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSend(formData);
      // Reset form on success
      setFormData({
        title: '',
        content: '',
        type: NOTIFICATION_TYPES.ANNOUNCEMENT,
        priority: NOTIFICATION_PRIORITIES.MEDIUM,
        feedbackEnabled: false,
        feedbackQuestion: '',
        expiresAt: null
      });
      setErrors({});
    } catch (error) {
      console.error('Error sending notification:', error);
      setErrors({ submit: error.message || 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน' });
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      content: '',
      type: NOTIFICATION_TYPES.ANNOUNCEMENT,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      feedbackEnabled: false,
      feedbackQuestion: '',
      expiresAt: null
    });
    setErrors({});
  };

  // Get minimum date for expiration (tomorrow)
  const getMinExpirationDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">สร้างการแจ้งเตือนระบบ</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            หัวข้อ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="ระบุหัวข้อการแจ้งเตือน"
            disabled={loading}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            เนื้อหา <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="ระบุเนื้อหาการแจ้งเตือน"
            disabled={loading}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-500">{errors.content}</p>
          )}
        </div>

        {/* Type and Priority Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              ประเภท
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value={NOTIFICATION_TYPES.ANNOUNCEMENT}>ประกาศ</option>
              <option value={NOTIFICATION_TYPES.FEEDBACK_REQUEST}>ขอความคิดเห็น</option>
              <option value={NOTIFICATION_TYPES.ALERT}>แจ้งเตือนสำคัญ</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              ระดับความสำคัญ
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value={NOTIFICATION_PRIORITIES.LOW}>ต่ำ</option>
              <option value={NOTIFICATION_PRIORITIES.MEDIUM}>ปานกลาง</option>
              <option value={NOTIFICATION_PRIORITIES.HIGH}>สูง</option>
            </select>
          </div>
        </div>

        {/* Expiration Date */}
        <div>
          <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-1">
            วันหมดอายุ (ไม่บังคับ)
          </label>
          <input
            type="date"
            id="expiresAt"
            name="expiresAt"
            value={formData.expiresAt ? formData.expiresAt.toISOString().split('T')[0] : ''}
            onChange={handleDateChange}
            min={getMinExpirationDate()}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.expiresAt ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.expiresAt && (
            <p className="mt-1 text-sm text-red-500">{errors.expiresAt}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            หากไม่ระบุ การแจ้งเตือนจะไม่หมดอายุ
          </p>
        </div>

        {/* Feedback Request */}
        <div className="border-t pt-4">
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="feedbackEnabled"
              name="feedbackEnabled"
              checked={formData.feedbackEnabled}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="feedbackEnabled" className="ml-2 block text-sm font-medium text-gray-700">
              ขอความคิดเห็นจากผู้ใช้
            </label>
          </div>

          {formData.feedbackEnabled && (
            <div>
              <label htmlFor="feedbackQuestion" className="block text-sm font-medium text-gray-700 mb-1">
                คำถาม <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="feedbackQuestion"
                name="feedbackQuestion"
                value={formData.feedbackQuestion}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.feedbackQuestion ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ระบุคำถามที่ต้องการถามผู้ใช้"
                disabled={loading}
              />
              {errors.feedbackQuestion && (
                <p className="mt-1 text-sm text-red-500">{errors.feedbackQuestion}</p>
              )}
            </div>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            ล้างข้อมูล
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              ยกเลิก
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'กำลังส่ง...' : 'ส่งการแจ้งเตือน'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemNotificationComposer;
