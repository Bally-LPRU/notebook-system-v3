/**
 * Import/Export Tab Component
 * 
 * Provides functionality to export and import system settings.
 * Includes automatic backup creation before import and validation.
 * 
 * Features:
 * - Export settings to JSON file
 * - Import settings from JSON file with validation
 * - Preview changes before import
 * - Display import/export history
 * - Option to include/exclude sensitive data
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import settingsService from '../../../services/settingsService';

/**
 * ImportExportTab Component
 * 
 * Manages settings import and export operations with validation and preview.
 * 
 * @component
 * @returns {JSX.Element} Import/Export tab interface
 */
const ImportExportTab = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [showSensitiveConfirm, setShowSensitiveConfirm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [history, setHistory] = useState([]);

  /**
   * Load import/export history from audit log
   */
  useEffect(() => {
    loadHistory();
  }, []);

  /**
   * Load recent import/export operations from audit log
   */
  const loadHistory = async () => {
    try {
      const auditLog = await settingsService.getAuditLog({
        limit: 10
      });
      
      // Filter for import/export/backup operations
      const importExportHistory = auditLog.filter(entry => 
        ['settings_export', 'settings_import', 'settings_backup'].includes(entry.settingType)
      );
      
      setHistory(importExportHistory);
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  /**
   * Handle export settings
   */
  const handleExport = async (withSensitive = false) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const exportData = await settingsService.exportSettings(
        withSensitive,
        userProfile.uid,
        userProfile.displayName || userProfile.email
      );

      // Create JSON file and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('ส่งออกการตั้งค่าสำเร็จ');
      setShowSensitiveConfirm(false);
      
      // Reload history
      await loadHistory();
    } catch (err) {
      console.error('Error exporting settings:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งออกการตั้งค่า');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle file selection for import
   */
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      setError('กรุณาเลือกไฟล์ JSON เท่านั้น');
      return;
    }

    setImportFile(file);
    setError(null);
    setSuccess(null);
    setImportResult(null);

    // Read and parse file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setImportPreview(data);
        setShowImportConfirm(true);
      } catch (err) {
        setError('ไฟล์ JSON ไม่ถูกต้อง: ' + err.message);
        setImportFile(null);
      }
    };
    reader.readAsText(file);
  };

  /**
   * Handle import confirmation
   */
  const handleImportConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const result = await settingsService.importSettings(
        importPreview,
        userProfile.uid,
        userProfile.displayName || userProfile.email
      );

      setImportResult(result);
      setSuccess('นำเข้าการตั้งค่าสำเร็จ');
      setShowImportConfirm(false);
      setImportFile(null);
      setImportPreview(null);
      
      // Reload history
      await loadHistory();
    } catch (err) {
      console.error('Error importing settings:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการนำเข้าการตั้งค่า');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel import
   */
  const handleImportCancel = () => {
    setShowImportConfirm(false);
    setImportFile(null);
    setImportPreview(null);
    setError(null);
  };

  /**
   * Format date for display
   */
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get action label in Thai
   */
  const getActionLabel = (settingType) => {
    switch (settingType) {
      case 'settings_export':
        return 'ส่งออก';
      case 'settings_import':
        return 'นำเข้า';
      case 'settings_backup':
        return 'สำรองข้อมูล';
      default:
        return settingType;
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="ml-3 text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">ส่งออกการตั้งค่า</h3>
        <p className="text-sm text-gray-600 mb-4">
          ดาวน์โหลดการตั้งค่าปัจจุบันทั้งหมดเป็นไฟล์ JSON สำหรับการสำรองข้อมูลหรือย้ายไปยังระบบอื่น
        </p>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeSensitive"
              checked={includeSensitive}
              onChange={(e) => setIncludeSensitive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="includeSensitive" className="ml-2 text-sm text-gray-700">
              รวมข้อมูลที่ละเอียดอ่อน (Discord Webhook URL)
            </label>
          </div>

          <button
            onClick={() => {
              if (includeSensitive) {
                setShowSensitiveConfirm(true);
              } else {
                handleExport(false);
              }
            }}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {loading ? 'กำลังส่งออก...' : 'ส่งออกการตั้งค่า'}
          </button>
        </div>
      </div>

      {/* Sensitive Data Confirmation Modal */}
      {showSensitiveConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">ยืนยันการส่งออกข้อมูลที่ละเอียดอ่อน</h3>
            <p className="text-sm text-gray-600 mb-4">
              คุณกำลังจะส่งออกข้อมูลที่ละเอียดอ่อน เช่น Discord Webhook URL 
              กรุณาเก็บรักษาไฟล์นี้อย่างปลอดภัย
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSensitiveConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleExport(true)}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">นำเข้าการตั้งค่า</h3>
        <p className="text-sm text-gray-600 mb-4">
          นำเข้าการตั้งค่าจากไฟล์ JSON ระบบจะสร้างสำรองข้อมูลอัตโนมัติก่อนนำเข้า
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกไฟล์ JSON
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>

          {importFile && !showImportConfirm && (
            <div className="text-sm text-gray-600">
              ไฟล์ที่เลือก: {importFile.name}
            </div>
          )}
        </div>
      </div>

      {/* Import Preview and Confirmation Modal */}
      {showImportConfirm && importPreview && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">ตรวจสอบการนำเข้า</h3>
            
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {/* Metadata */}
              {importPreview.metadata && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">ข้อมูลไฟล์</h4>
                  <dl className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">วันที่ส่งออก:</dt>
                      <dd className="text-gray-900">{formatDate(importPreview.metadata.exportDate)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">ส่งออกโดย:</dt>
                      <dd className="text-gray-900">{importPreview.metadata.exportedBy}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">เวอร์ชัน:</dt>
                      <dd className="text-gray-900">{importPreview.metadata.version}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* Settings Preview */}
              {importPreview.settings && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">การตั้งค่าระบบ</h4>
                  <dl className="text-sm space-y-1">
                    {importPreview.settings.maxLoanDuration !== undefined && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">ระยะเวลายืมสูงสุด:</dt>
                        <dd className="text-gray-900">{importPreview.settings.maxLoanDuration} วัน</dd>
                      </div>
                    )}
                    {importPreview.settings.maxAdvanceBookingDays !== undefined && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">จองล่วงหน้าสูงสุด:</dt>
                        <dd className="text-gray-900">{importPreview.settings.maxAdvanceBookingDays} วัน</dd>
                      </div>
                    )}
                    {importPreview.settings.defaultCategoryLimit !== undefined && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">จำกัดการยืมเริ่มต้น:</dt>
                        <dd className="text-gray-900">{importPreview.settings.defaultCategoryLimit} ชิ้น</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Closed Dates Preview */}
              {importPreview.closedDates && importPreview.closedDates.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    วันปิดทำการ ({importPreview.closedDates.length} วัน)
                  </h4>
                  <div className="text-sm text-gray-600">
                    จะเพิ่มวันปิดทำการ {importPreview.closedDates.length} วัน
                  </div>
                </div>
              )}

              {/* Category Limits Preview */}
              {importPreview.categoryLimits && importPreview.categoryLimits.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    จำกัดการยืมตามประเภท ({importPreview.categoryLimits.length} ประเภท)
                  </h4>
                  <div className="text-sm text-gray-600">
                    จะอัปเดตจำนวนจำกัด {importPreview.categoryLimits.length} ประเภท
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="ml-3 text-sm text-yellow-700">
                  ระบบจะสร้างสำรองข้อมูลอัตโนมัติก่อนนำเข้า คุณสามารถกู้คืนได้หากเกิดปัญหา
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleImportCancel}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleImportConfirm}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'กำลังนำเข้า...' : 'ยืนยันการนำเข้า'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">ผลการนำเข้า</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">การตั้งค่าที่อัปเดต:</dt>
              <dd className="text-gray-900 font-medium">{importResult.stats.settingsUpdated}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">วันปิดทำการที่เพิ่ม:</dt>
              <dd className="text-gray-900 font-medium">{importResult.stats.closedDatesAdded}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">จำกัดการยืมที่อัปเดต:</dt>
              <dd className="text-gray-900 font-medium">{importResult.stats.categoryLimitsUpdated}</dd>
            </div>
            {importResult.stats.errors.length > 0 && (
              <div className="mt-4">
                <dt className="text-red-600 font-medium mb-2">ข้อผิดพลาด:</dt>
                <dd className="text-sm text-red-600 space-y-1">
                  {importResult.stats.errors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </dd>
              </div>
            )}
            {importResult.backup && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <dt className="text-gray-600 mb-1">สำรองข้อมูล:</dt>
                <dd className="text-sm text-gray-500">
                  ID: {importResult.backup.id}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* History Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">ประวัติการนำเข้า/ส่งออก</h3>
        
        {history.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">ยังไม่มีประวัติ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้ดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {getActionLabel(entry.settingType)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {entry.adminName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportExportTab;
