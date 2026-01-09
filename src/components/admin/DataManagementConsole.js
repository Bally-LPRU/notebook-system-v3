/**
 * Data Management Console Component
 * 
 * Centralized console for managing data export, import, and deletion operations.
 * Provides tabs for each operation with appropriate controls and validation.
 * 
 * Requirements: 5.1, 5.5, 6.1, 6.4, 7.1, 7.2, 7.5
 */

import React, { useState, useCallback } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../layout';
import DataManagementService from '../../services/dataManagementService';
import { DATA_TYPE, EXPORT_FORMAT } from '../../types/dataManagement';
import ExportProgress from './ExportProgress';
import ImportPreview from './ImportPreview';
import DeleteConfirmation from './DeleteConfirmation';

/**
 * Tab navigation component
 */
const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'export', label: 'ส่งออกข้อมูล', icon: ArrowDownTrayIcon },
    { id: 'import', label: 'นำเข้าข้อมูล', icon: ArrowUpTrayIcon },
    { id: 'delete', label: 'ลบข้อมูล', icon: TrashIcon }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon
                className={`
                  -ml-0.5 mr-2 h-5 w-5
                  ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                `}
              />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

/**
 * Export Tab Component
 * Requirements: 5.1, 5.5
 */
const ExportTab = () => {
  const { currentUser } = useAuth();
  const [exportConfig, setExportConfig] = useState({
    dataType: DATA_TYPE.LOANS,
    format: EXPORT_FORMAT.CSV,
    dateRange: {
      start: '',
      end: ''
    },
    filters: {
      status: [],
      category: []
    },
    includeArchived: false
  });
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    if (!currentUser) return;

    setExporting(true);
    setError(null);
    setExportResult(null);

    try {
      const result = await DataManagementService.exportData(
        exportConfig,
        currentUser.uid
      );
      setExportResult(result);
    } catch (err) {
      console.error('Export error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = (data, filename) => {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setExportResult(null);
    setError(null);
  };

  if (exporting) {
    return <ExportProgress onCancel={() => setExporting(false)} />;
  }

  if (exportResult) {
    return (
      <ExportProgress
        result={exportResult}
        onDownload={handleDownload}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              เกี่ยวกับการส่งออกข้อมูล
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              ส่งออกข้อมูลระบบในรูปแบบ CSV หรือ JSON เพื่อสร้างรายงานหรือสำรองข้อมูล
              คุณสามารถกรองข้อมูลตามช่วงวันที่และสถานะได้
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Export Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          ตั้งค่าการส่งออก
        </h3>

        <div className="space-y-4">
          {/* Data Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประเภทข้อมูล
            </label>
            <select
              value={exportConfig.dataType}
              onChange={(e) => setExportConfig({ ...exportConfig, dataType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={DATA_TYPE.LOANS}>รายการยืม-คืน</option>
              <option value={DATA_TYPE.RESERVATIONS}>รายการจอง</option>
              <option value={DATA_TYPE.EQUIPMENT}>ข้อมูลอุปกรณ์</option>
            </select>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รูปแบบไฟล์
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value={EXPORT_FORMAT.CSV}
                  checked={exportConfig.format === EXPORT_FORMAT.CSV}
                  onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">CSV</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value={EXPORT_FORMAT.JSON}
                  checked={exportConfig.format === EXPORT_FORMAT.JSON}
                  onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">JSON</span>
              </label>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ช่วงวันที่
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">วันที่เริ่มต้น</label>
                <input
                  type="date"
                  value={exportConfig.dateRange.start}
                  onChange={(e) => setExportConfig({
                    ...exportConfig,
                    dateRange: { ...exportConfig.dateRange, start: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">วันที่สิ้นสุด</label>
                <input
                  type="date"
                  value={exportConfig.dateRange.end}
                  onChange={(e) => setExportConfig({
                    ...exportConfig,
                    dateRange: { ...exportConfig.dateRange, end: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Status Filter (for loans/reservations) */}
          {(exportConfig.dataType === DATA_TYPE.LOANS || exportConfig.dataType === DATA_TYPE.RESERVATIONS) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                กรองตามสถานะ
              </label>
              <div className="flex flex-wrap gap-2">
                {['pending', 'approved', 'rejected', 'active', 'returned', 'overdue'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportConfig.filters.status.includes(status)}
                      onChange={(e) => {
                        const newStatus = e.target.checked
                          ? [...exportConfig.filters.status, status]
                          : exportConfig.filters.status.filter(s => s !== status);
                        setExportConfig({
                          ...exportConfig,
                          filters: { ...exportConfig.filters, status: newStatus }
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Include Archived */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportConfig.includeArchived}
                onChange={(e) => setExportConfig({ ...exportConfig, includeArchived: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">รวมข้อมูลที่เก็บถาวร</span>
            </label>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>ส่งออกข้อมูล</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Import Tab Component
 * Requirements: 6.1, 6.4
 */
const ImportTab = () => {
  const { currentUser } = useAuth();
  const [importConfig, setImportConfig] = useState({
    dataType: DATA_TYPE.EQUIPMENT,
    file: null,
    fileContent: null
  });
  const [validationResult, setValidationResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setValidationResult(null);
    setImportResult(null);

    try {
      const content = await file.text();
      let data;

      if (file.name.endsWith('.json')) {
        data = DataManagementService.parseJSON(content);
      } else if (file.name.endsWith('.csv')) {
        data = DataManagementService.parseCSV(content);
      } else {
        throw new Error('รองรับเฉพาะไฟล์ .csv และ .json เท่านั้น');
      }

      setImportConfig({
        ...importConfig,
        file,
        fileContent: data
      });

      // Validate data
      const validation = DataManagementService.validateImportData(data, importConfig.dataType);
      setValidationResult(validation);
    } catch (err) {
      console.error('File read error:', err);
      setError(err.message || 'ไม่สามารถอ่านไฟล์ได้');
    }
  };

  const handleImport = async () => {
    if (!currentUser || !validationResult || !validationResult.isValid) return;

    setImporting(true);
    setError(null);

    try {
      const result = await DataManagementService.importData(
        importConfig.fileContent,
        importConfig.dataType,
        currentUser.uid
      );
      setImportResult(result);
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setImportConfig({
      dataType: DATA_TYPE.EQUIPMENT,
      file: null,
      fileContent: null
    });
    setValidationResult(null);
    setImportResult(null);
    setError(null);
  };

  if (validationResult && importConfig.fileContent) {
    return (
      <ImportPreview
        data={importConfig.fileContent}
        validationResult={validationResult}
        importing={importing}
        importResult={importResult}
        onImport={handleImport}
        onCancel={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              เกี่ยวกับการนำเข้าข้อมูล
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              นำเข้าข้อมูลจากไฟล์ CSV หรือ JSON เพื่อเพิ่มข้อมูลอุปกรณ์ใหม่
              ระบบจะตรวจสอบความถูกต้องของข้อมูลก่อนนำเข้า
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Import Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          เลือกไฟล์สำหรับนำเข้า
        </h3>

        <div className="space-y-4">
          {/* Data Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประเภทข้อมูล
            </label>
            <select
              value={importConfig.dataType}
              onChange={(e) => setImportConfig({ ...importConfig, dataType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={DATA_TYPE.EQUIPMENT}>ข้อมูลอุปกรณ์</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              ปัจจุบันรองรับเฉพาะการนำเข้าข้อมูลอุปกรณ์เท่านั้น
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ไฟล์ข้อมูล
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400">
              <div className="space-y-1 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>เลือกไฟล์</span>
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileSelect}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">หรือลากไฟล์มาวาง</p>
                </div>
                <p className="text-xs text-gray-500">
                  CSV หรือ JSON ขนาดไม่เกิน 10MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Delete Tab Component
 * Requirements: 7.1, 7.2, 7.5
 */
const DeleteTab = () => {
  const { currentUser } = useAuth();
  const [deleteConfig, setDeleteConfig] = useState({
    dataTypes: [],
    dateRange: {
      start: '',
      end: ''
    },
    createBackup: true,
    confirmationPhrase: ''
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (!currentUser) return;

    setDeleting(true);
    setError(null);

    try {
      const result = await DataManagementService.deleteData(
        deleteConfig,
        currentUser.uid
      );
      setDeleteResult(result);
      setShowConfirmation(false);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setDeleting(false);
    }
  };

  const handleReset = () => {
    setDeleteConfig({
      dataTypes: [],
      dateRange: { start: '', end: '' },
      createBackup: true,
      confirmationPhrase: ''
    });
    setShowConfirmation(false);
    setDeleteResult(null);
    setError(null);
  };

  const canProceed = deleteConfig.dataTypes.length > 0 &&
                     deleteConfig.dateRange.start &&
                     deleteConfig.dateRange.end;

  if (showConfirmation) {
    return (
      <DeleteConfirmation
        config={deleteConfig}
        deleting={deleting}
        deleteResult={deleteResult}
        onConfirm={handleDelete}
        onCancel={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              คำเตือน: การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </h3>
            <p className="mt-1 text-sm text-red-700">
              การลบข้อมูลจะลบข้อมูลออกจากระบบอย่างถาวร
              กรุณาตรวจสอบการตั้งค่าให้ถูกต้องก่อนดำเนินการ
              ระบบจะสร้างไฟล์สำรองก่อนลบข้อมูล
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          ตั้งค่าการลบข้อมูล
        </h3>

        <div className="space-y-4">
          {/* Data Types Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประเภทข้อมูลที่ต้องการลบ
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={deleteConfig.dataTypes.includes(DATA_TYPE.LOANS)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...deleteConfig.dataTypes, DATA_TYPE.LOANS]
                      : deleteConfig.dataTypes.filter(t => t !== DATA_TYPE.LOANS);
                    setDeleteConfig({ ...deleteConfig, dataTypes: newTypes });
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">รายการยืม-คืน</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={deleteConfig.dataTypes.includes(DATA_TYPE.RESERVATIONS)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...deleteConfig.dataTypes, DATA_TYPE.RESERVATIONS]
                      : deleteConfig.dataTypes.filter(t => t !== DATA_TYPE.RESERVATIONS);
                    setDeleteConfig({ ...deleteConfig, dataTypes: newTypes });
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">รายการจอง</span>
              </label>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ช่วงวันที่ที่ต้องการลบ
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">วันที่เริ่มต้น</label>
                <input
                  type="date"
                  value={deleteConfig.dateRange.start}
                  onChange={(e) => setDeleteConfig({
                    ...deleteConfig,
                    dateRange: { ...deleteConfig.dateRange, start: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">วันที่สิ้นสุด</label>
                <input
                  type="date"
                  value={deleteConfig.dateRange.end}
                  onChange={(e) => setDeleteConfig({
                    ...deleteConfig,
                    dateRange: { ...deleteConfig.dateRange, end: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Create Backup */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={deleteConfig.createBackup}
                onChange={(e) => setDeleteConfig({ ...deleteConfig, createBackup: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">สร้างไฟล์สำรองก่อนลบ (แนะนำ)</span>
            </label>
          </div>
        </div>

        {/* Proceed Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowConfirmation(true)}
            disabled={!canProceed}
            className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrashIcon className="w-5 h-5" />
            <span>ดำเนินการลบข้อมูล</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Data Management Console Component
 */
const DataManagementConsole = () => {
  const [activeTab, setActiveTab] = useState('export');

  return (
    <Layout>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          คอนโซลจัดการข้อมูล
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          ส่งออก นำเข้า และจัดการข้อมูลระบบ
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 pt-6">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'export' && <ExportTab />}
          {activeTab === 'import' && <ImportTab />}
          {activeTab === 'delete' && <DeleteTab />}
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default DataManagementConsole;
