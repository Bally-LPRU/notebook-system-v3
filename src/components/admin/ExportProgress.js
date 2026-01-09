/**
 * Export Progress Component
 * 
 * Shows export progress with cancel option and displays summary after completion.
 * 
 * Requirements: 5.5, 5.6
 */

import React from 'react';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Format file size for display
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format date for display
 */
const formatDate = (date) => {
  if (!date) return '-';
  const d = date?.toDate?.() || new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Export Progress Component
 * Requirement: 5.5
 */
const ExportProgress = ({ result, onDownload, onCancel, onReset }) => {
  // Show loading state
  if (!result) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="large" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            กำลังส่งออกข้อมูล...
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            กรุณารอสักครู่ ระบบกำลังประมวลผลข้อมูล
          </p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show completion state with summary
  // Requirement: 5.6
  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              ส่งออกข้อมูลสำเร็จ
            </h3>
            <p className="mt-1 text-sm text-green-700">
              ข้อมูลถูกส่งออกเรียบร้อยแล้ว คุณสามารถดาวน์โหลดไฟล์ได้ด้านล่าง
            </p>
          </div>
        </div>
      </div>

      {/* Export Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          สรุปการส่งออก
        </h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">จำนวนรายการ</p>
              <p className="text-2xl font-bold text-gray-900">{result.recordCount || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">รูปแบบไฟล์</p>
              <p className="text-lg font-medium text-gray-900">{result.format?.toUpperCase() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ขนาดไฟล์</p>
              <p className="text-lg font-medium text-gray-900">
                {result.fileSize ? formatFileSize(result.fileSize) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">ประเภทข้อมูล</p>
              <p className="text-lg font-medium text-gray-900">
                {result.dataType === 'loans' && 'รายการยืม-คืน'}
                {result.dataType === 'reservations' && 'รายการจอง'}
                {result.dataType === 'equipment' && 'ข้อมูลอุปกรณ์'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">วันที่ส่งออก</p>
              <p className="text-lg font-medium text-gray-900">
                {formatDate(result.exportedAt || new Date())}
              </p>
            </div>
            {result.dateRange && (result.dateRange.start || result.dateRange.end) && (
              <div>
                <p className="text-sm text-gray-500">ช่วงวันที่</p>
                <p className="text-sm font-medium text-gray-900">
                  {result.dateRange.start || 'ไม่ระบุ'} - {result.dateRange.end || 'ไม่ระบุ'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Filters Applied */}
        {result.filters && Object.keys(result.filters).length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">ตัวกรองที่ใช้</h4>
            <div className="flex flex-wrap gap-2">
              {result.filters.status && result.filters.status.length > 0 && (
                <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  สถานะ: {result.filters.status.join(', ')}
                </div>
              )}
              {result.filters.category && result.filters.category.length > 0 && (
                <div className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                  หมวดหมู่: {result.filters.category.join(', ')}
                </div>
              )}
              {result.includeArchived && (
                <div className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                  รวมข้อมูลที่เก็บถาวร
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Info */}
        {result.summary && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">ข้อมูลเพิ่มเติม</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(result.summary, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Download Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          ดาวน์โหลดไฟล์
        </h3>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {result.filename || `export_${result.dataType}_${Date.now()}.${result.format}`}
              </p>
              <p className="text-xs text-gray-500">
                {result.fileSize ? formatFileSize(result.fileSize) : 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onDownload(result.data, result.filename)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>ดาวน์โหลด</span>
          </button>
        </div>

        {/* Export Again Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ส่งออกใหม่อีกครั้ง
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <ClockIcon className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">เคล็ดลับ</h4>
            <ul className="mt-1 text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>ไฟล์ CSV สามารถเปิดด้วย Microsoft Excel หรือ Google Sheets</li>
              <li>ไฟล์ JSON เหมาะสำหรับการนำเข้าข้อมูลกลับเข้าระบบ</li>
              <li>ควรเก็บไฟล์สำรองไว้ในที่ปลอดภัย</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportProgress;
