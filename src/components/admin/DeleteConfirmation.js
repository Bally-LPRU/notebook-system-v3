/**
 * Delete Confirmation Component
 * 
 * Requires typed confirmation phrase and shows progress during deletion.
 * 
 * Requirements: 7.2, 7.5
 */

import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import { DATA_TYPE } from '../../types/dataManagement';

/**
 * Confirmation phrase that user must type
 */
const CONFIRMATION_PHRASE = 'DELETE DATA';

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Delete Progress Component
 * Requirement: 7.5
 */
const DeleteProgress = ({ progress }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="large" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          กำลังลบข้อมูล...
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          กรุณารอสักครู่ ระบบกำลังดำเนินการ
        </p>

        {/* Progress Details */}
        {progress && (
          <div className="mt-6 w-full max-w-md">
            <div className="space-y-2">
              {progress.creatingBackup && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">กำลังสร้างไฟล์สำรอง...</span>
                  <LoadingSpinner size="small" />
                </div>
              )}
              {progress.deletingData && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">กำลังลบข้อมูล...</span>
                  <LoadingSpinner size="small" />
                </div>
              )}
              {progress.loggingAudit && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">กำลังบันทึก audit log...</span>
                  <LoadingSpinner size="small" />
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {progress.percentage !== undefined && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center mt-1">
                  {progress.percentage}%
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Delete Result Component
 */
const DeleteResult = ({ result, onClose }) => {
  if (!result) return null;

  const isSuccess = result.success;

  return (
    <div className="space-y-6">
      {/* Result Banner */}
      <div className={`border rounded-lg p-4 ${
        isSuccess
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex">
          {isSuccess ? (
            <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-400 mt-0.5" />
          )}
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${
              isSuccess ? 'text-green-800' : 'text-red-800'
            }`}>
              {isSuccess ? 'ลบข้อมูลสำเร็จ' : 'ลบข้อมูลล้มเหลว'}
            </h3>
            <p className={`mt-1 text-sm ${
              isSuccess ? 'text-green-700' : 'text-red-700'
            }`}>
              {isSuccess
                ? `ลบข้อมูลเรียบร้อยแล้ว ${result.deletedCount || 0} รายการ`
                : result.error || 'เกิดข้อผิดพลาดในการลบข้อมูล'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Delete Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          สรุปการลบข้อมูล
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">จำนวนที่ลบ</p>
              <p className="text-2xl font-bold text-gray-900">{result.deletedCount || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ประเภทข้อมูล</p>
              <p className="text-lg font-medium text-gray-900">
                {result.dataTypes?.length || 0} ประเภท
              </p>
            </div>
          </div>

          {/* Backup Info */}
          {result.backupId && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-start space-x-2">
                <ShieldCheckIcon className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    สร้างไฟล์สำรองแล้ว
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Backup ID: {result.backupId}
                  </p>
                  <p className="text-xs text-gray-500">
                    ไฟล์สำรองจะถูกเก็บไว้เป็นเวลา 30 วัน
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Audit Log Info */}
          {result.auditLogId && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                บันทึกการดำเนินการใน Audit Log แล้ว
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Log ID: {result.auditLogId}
              </p>
            </div>
          )}

          {/* Data Types Deleted */}
          {result.dataTypes && result.dataTypes.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">
                ประเภทข้อมูลที่ลบ:
              </p>
              <div className="flex flex-wrap gap-2">
                {result.dataTypes.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                  >
                    {type === DATA_TYPE.LOANS && 'รายการยืม-คืน'}
                    {type === DATA_TYPE.RESERVATIONS && 'รายการจอง'}
                    {type === DATA_TYPE.EQUIPMENT && 'ข้อมูลอุปกรณ์'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close Button */}
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          ปิด
        </button>
      </div>
    </div>
  );
};

/**
 * Main Delete Confirmation Component
 * Requirements: 7.2, 7.5
 */
const DeleteConfirmation = ({
  config,
  deleting,
  deleteResult,
  onConfirm,
  onCancel
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');

  // Show delete result if available
  if (deleteResult) {
    return <DeleteResult result={deleteResult} onClose={onCancel} />;
  }

  // Show progress during deletion
  // Requirement: 7.5
  if (deleting) {
    return <DeleteProgress />;
  }

  const isConfirmationValid = confirmationInput === CONFIRMATION_PHRASE;
  const canDelete = isConfirmationValid && config.dataTypes.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            ยืนยันการลบข้อมูล
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            กรุณาตรวจสอบข้อมูลและยืนยันการลบ
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Critical Warning */}
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-base font-bold text-red-900">
              คำเตือนสำคัญ
            </h4>
            <p className="mt-2 text-sm text-red-800">
              การดำเนินการนี้จะลบข้อมูลออกจากระบบอย่างถาวร
              และไม่สามารถกู้คืนได้ง่าย กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
            </p>
          </div>
        </div>
      </div>

      {/* Delete Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-base font-medium text-gray-900 mb-4">
          สรุปการลบข้อมูล
        </h4>

        <div className="space-y-3">
          {/* Data Types */}
          <div>
            <p className="text-sm font-medium text-gray-700">ประเภทข้อมูล:</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {config.dataTypes.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                >
                  {type === DATA_TYPE.LOANS && 'รายการยืม-คืน'}
                  {type === DATA_TYPE.RESERVATIONS && 'รายการจอง'}
                  {type === DATA_TYPE.EQUIPMENT && 'ข้อมูลอุปกรณ์'}
                </span>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <p className="text-sm font-medium text-gray-700">ช่วงวันที่:</p>
            <p className="text-sm text-gray-900 mt-1">
              {formatDate(config.dateRange.start)} ถึง {formatDate(config.dateRange.end)}
            </p>
          </div>

          {/* Backup Option */}
          <div>
            <p className="text-sm font-medium text-gray-700">สร้างไฟล์สำรอง:</p>
            <p className="text-sm text-gray-900 mt-1">
              {config.createBackup ? (
                <span className="flex items-center text-green-600">
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  ใช่ (แนะนำ)
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <XCircleIcon className="w-4 h-4 mr-1" />
                  ไม่
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Typed Confirmation */}
      {/* Requirement: 7.2 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-base font-medium text-gray-900 mb-4">
          ยืนยันการดำเนินการ
        </h4>

        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            เพื่อยืนยันการลบข้อมูล กรุณาพิมพ์คำว่า{' '}
            <span className="font-mono font-bold text-red-600">
              {CONFIRMATION_PHRASE}
            </span>{' '}
            ในช่องด้านล่าง
          </p>

          <div>
            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={CONFIRMATION_PHRASE}
              className={`w-full px-4 py-3 border-2 rounded-lg font-mono text-center text-lg focus:ring-2 focus:ring-red-500 ${
                confirmationInput && !isConfirmationValid
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
            {confirmationInput && !isConfirmationValid && (
              <p className="mt-2 text-sm text-red-600">
                คำที่พิมพ์ไม่ตรงกับคำยืนยัน กรุณาลองใหม่อีกครั้ง
              </p>
            )}
            {isConfirmationValid && (
              <p className="mt-2 text-sm text-green-600 flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                ยืนยันถูกต้อง
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Backup Reminder */}
      {config.createBackup && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <ShieldCheckIcon className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                ไฟล์สำรองจะถูกสร้างอัตโนมัติ
              </h4>
              <p className="mt-1 text-sm text-blue-700">
                ระบบจะสร้างไฟล์สำรองก่อนลบข้อมูล
                ไฟล์สำรองจะถูกเก็บไว้เป็นเวลา 30 วัน
                และสามารถใช้กู้คืนข้อมูลได้หากจำเป็น
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ยกเลิก
        </button>
        <button
          onClick={onConfirm}
          disabled={!canDelete || deleting}
          className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TrashIcon className="w-5 h-5" />
          <span>ยืนยันการลบข้อมูล</span>
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
