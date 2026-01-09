/**
 * Import Preview Component
 * 
 * Shows preview of changes before applying and displays validation errors
 * with correction options.
 * 
 * Requirements: 6.3, 6.4
 */

import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowUpTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Validation Summary Component
 * Requirement: 6.3
 */
const ValidationSummary = ({ validationResult }) => {
  const { totalRecords, validCount, errorCount } = validationResult;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
        <p className="text-sm text-gray-600">รายการทั้งหมด</p>
        <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
        <p className="text-sm text-gray-600">ถูกต้อง</p>
        <p className="text-2xl font-bold text-green-600">{validCount}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
        <p className="text-sm text-gray-600">มีข้อผิดพลาด</p>
        <p className="text-2xl font-bold text-red-600">{errorCount}</p>
      </div>
    </div>
  );
};

/**
 * Error Details Component
 * Requirement: 6.3
 */
const ErrorDetails = ({ errors }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedError, setSelectedError] = useState(null);

  if (errors.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900">
            รายการที่มีข้อผิดพลาด ({errors.length})
          </h3>
        </div>
        {expanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {errors.map((error, idx) => (
            <div
              key={idx}
              className="border border-red-200 rounded-lg p-4 bg-red-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">
                    แถวที่ {error.index + 1}
                  </p>
                  <div className="mt-2 space-y-1">
                    {error.errors.map((err, errIdx) => (
                      <p key={errIdx} className="text-sm text-red-700">
                        • {err}
                      </p>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedError(selectedError === idx ? null : idx)}
                  className="ml-4 text-sm text-red-600 hover:text-red-800"
                >
                  {selectedError === idx ? 'ซ่อน' : 'ดูข้อมูล'}
                </button>
              </div>

              {selectedError === idx && (
                <div className="mt-4 pt-4 border-t border-red-200">
                  <p className="text-xs font-medium text-red-900 mb-2">ข้อมูลที่มีปัญหา:</p>
                  <pre className="text-xs text-red-800 bg-red-100 p-3 rounded overflow-x-auto">
                    {JSON.stringify(error.record, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}

          {/* Correction Guidance */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              วิธีแก้ไข
            </h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>ตรวจสอบว่าฟิลด์ที่จำเป็นครบถ้วน</li>
              <li>ตรวจสอบรูปแบบวันที่ให้ถูกต้อง (YYYY-MM-DD)</li>
              <li>ตรวจสอบประเภทข้อมูลของแต่ละฟิลด์</li>
              <li>แก้ไขไฟล์และอัปโหลดใหม่อีกครั้ง</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Data Preview Component
 * Requirement: 6.4
 */
const DataPreview = ({ data, validationResult }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewCount, setPreviewCount] = useState(10);

  const validRecords = validationResult.validRecords || [];
  const previewData = validRecords.slice(0, previewCount);

  if (validRecords.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center space-x-2">
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-medium text-gray-900">
            ตัวอย่างข้อมูลที่จะนำเข้า ({validRecords.length} รายการ)
          </h3>
        </div>
        {showPreview ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {showPreview && (
        <div className="mt-4">
          {/* Preview Controls */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              แสดง {Math.min(previewCount, validRecords.length)} จาก {validRecords.length} รายการ
            </p>
            <select
              value={previewCount}
              onChange={(e) => setPreviewCount(Number(e.target.value))}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10 รายการ</option>
              <option value={25}>25 รายการ</option>
              <option value={50}>50 รายการ</option>
              <option value={100}>100 รายการ</option>
            </select>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {previewData.length > 0 && Object.keys(previewData[0]).map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {Object.values(record).map((value, valueIdx) => (
                      <td
                        key={valueIdx}
                        className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                      >
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {validRecords.length > previewCount && (
            <p className="mt-2 text-sm text-gray-500 text-center">
              และอีก {validRecords.length - previewCount} รายการ...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Import Result Component
 */
const ImportResult = ({ result, onReset }) => {
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
              {isSuccess ? 'นำเข้าข้อมูลสำเร็จ' : 'นำเข้าข้อมูลล้มเหลว'}
            </h3>
            <p className={`mt-1 text-sm ${
              isSuccess ? 'text-green-700' : 'text-red-700'
            }`}>
              {isSuccess
                ? `นำเข้าข้อมูลเรียบร้อยแล้ว ${result.importedRecords} รายการ`
                : 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล กรุณาลองใหม่อีกครั้ง'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Import Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          สรุปการนำเข้า
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">รายการทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-900">{result.totalRecords || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">นำเข้าสำเร็จ</p>
            <p className="text-2xl font-bold text-green-600">{result.importedRecords || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ล้มเหลว</p>
            <p className="text-2xl font-bold text-red-600">{result.failedRecords || 0}</p>
          </div>
        </div>

        {/* Error Details */}
        {result.errors && result.errors.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">ข้อผิดพลาด</h4>
            <div className="space-y-2">
              {result.errors.slice(0, 5).map((error, idx) => (
                <p key={idx} className="text-sm text-red-600">
                  • {error}
                </p>
              ))}
              {result.errors.length > 5 && (
                <p className="text-sm text-gray-500">
                  และอีก {result.errors.length - 5} ข้อผิดพลาด...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={onReset}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          นำเข้าใหม่อีกครั้ง
        </button>
      </div>
    </div>
  );
};

/**
 * Main Import Preview Component
 * Requirements: 6.3, 6.4
 */
const ImportPreview = ({
  data,
  validationResult,
  importing,
  importResult,
  onImport,
  onCancel
}) => {
  // Show import result if available
  if (importResult) {
    return <ImportResult result={importResult} onReset={onCancel} />;
  }

  // Show loading state
  if (importing) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="large" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            กำลังนำเข้าข้อมูล...
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            กรุณารอสักครู่ ระบบกำลังประมวลผลข้อมูล
          </p>
        </div>
      </div>
    );
  }

  const hasErrors = validationResult.errorCount > 0;
  const canImport = validationResult.isValid && validationResult.validCount > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            ตรวจสอบข้อมูลก่อนนำเข้า
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนดำเนินการนำเข้า
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Validation Summary */}
      <ValidationSummary validationResult={validationResult} />

      {/* Error Details */}
      {hasErrors && <ErrorDetails errors={validationResult.errors} />}

      {/* Data Preview */}
      <DataPreview data={data} validationResult={validationResult} />

      {/* Warning if has errors */}
      {hasErrors && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">
                พบข้อผิดพลาดในข้อมูล
              </h4>
              <p className="mt-1 text-sm text-yellow-700">
                ระบบจะนำเข้าเฉพาะรายการที่ถูกต้องเท่านั้น ({validationResult.validCount} รายการ)
                รายการที่มีข้อผิดพลาดจะถูกข้าม ({validationResult.errorCount} รายการ)
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
          onClick={onImport}
          disabled={!canImport || importing}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowUpTrayIcon className="w-5 h-5" />
          <span>
            {canImport
              ? `นำเข้า ${validationResult.validCount} รายการ`
              : 'ไม่สามารถนำเข้าได้'
            }
          </span>
        </button>
      </div>
    </div>
  );
};

export default ImportPreview;
