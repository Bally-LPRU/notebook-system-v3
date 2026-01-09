/**
 * Data Management Console Component
 * 
 * Centralized console for managing data export, import, and deletion operations.
 * Provides tabs for each operation with appropriate controls and validation.
 * 
 * Requirements: 5.1, 5.5, 6.1, 6.4, 7.1, 7.2, 7.5
 * Design System: Matches AdminDashboard pastel color palette
 */

import React, { useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../layout';
import DataManagementService from '../../services/dataManagementService';
import { DATA_TYPE, EXPORT_FORMAT } from '../../types/dataManagement';
import ExportProgress from './ExportProgress';
import ImportPreview from './ImportPreview';
import DeleteConfirmation from './DeleteConfirmation';

// Pastel Color Palette (matching AdminDashboard)
const COLORS = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  red: { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
  gray: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

/**
 * Tab navigation component
 */
const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'export', label: 'ส่งออกข้อมูล', icon: ArrowDownTrayIcon, color: 'blue' },
    { id: 'import', label: 'นำเข้าข้อมูล', icon: ArrowUpTrayIcon, color: 'green' },
    { id: 'delete', label: 'ลบข้อมูล', icon: TrashIcon, color: 'red' }
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
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300
                ${isActive
                  ? `border-${tab.color === 'blue' ? 'blue' : tab.color === 'green' ? 'emerald' : 'rose'}-500 ${COLORS[tab.color].text}`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Icon className={`-ml-0.5 mr-2 h-5 w-5 transition-all duration-300
                ${isActive ? COLORS[tab.color].text : 'text-gray-400 group-hover:text-gray-500'}`} />
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
 */
const ExportTab = () => {
  const { currentUser } = useAuth();
  const [exportConfig, setExportConfig] = useState({
    dataType: DATA_TYPE.LOANS,
    format: EXPORT_FORMAT.CSV,
    dateRange: { start: '', end: '' },
    filters: { status: [], category: [] },
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
      const result = await DataManagementService.exportData(exportConfig, currentUser.uid);
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

  if (exporting) return <ExportProgress onCancel={() => setExporting(false)} />;
  if (exportResult) return <ExportProgress result={exportResult} onDownload={handleDownload} onReset={handleReset} />;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-5 animate-fade-in">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <CloudArrowDownIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900">เกี่ยวกับการส่งออกข้อมูล</h3>
            <p className="mt-1 text-sm text-blue-700">
              ส่งออกข้อมูลระบบในรูปแบบ CSV หรือ JSON เพื่อสร้างรายงานหรือสำรองข้อมูล
              คุณสามารถกรองข้อมูลตามช่วงวันที่และสถานะได้
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-rose-600" />
            <p className="text-sm text-rose-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Export Configuration */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">ตั้งค่าการส่งออก</h3>

        <div className="space-y-5">
          {/* Data Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทข้อมูล</label>
            <select
              value={exportConfig.dataType}
              onChange={(e) => setExportConfig({ ...exportConfig, dataType: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value={DATA_TYPE.LOANS}>รายการยืม-คืน</option>
              <option value={DATA_TYPE.RESERVATIONS}>รายการจอง</option>
              <option value={DATA_TYPE.EQUIPMENT}>ข้อมูลอุปกรณ์</option>
            </select>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">รูปแบบไฟล์</label>
            <div className="flex space-x-4">
              {[EXPORT_FORMAT.CSV, EXPORT_FORMAT.JSON].map((format) => (
                <label key={format} className={`flex-1 flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                  ${exportConfig.format === format ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    value={format}
                    checked={exportConfig.format === format}
                    onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
                    className="sr-only"
                  />
                  <span className={`text-sm font-medium ${exportConfig.format === format ? 'text-blue-700' : 'text-gray-700'}`}>
                    {format.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ช่วงวันที่</label>
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Include Archived */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={exportConfig.includeArchived}
                onChange={(e) => setExportConfig({ ...exportConfig, includeArchived: e.target.checked })}
                className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
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
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl 
              hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 
              disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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

      setImportConfig({ ...importConfig, file, fileContent: data });
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
      const result = await DataManagementService.importData(importConfig.fileContent, importConfig.dataType, currentUser.uid);
      setImportResult(result);
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setImportConfig({ dataType: DATA_TYPE.EQUIPMENT, file: null, fileContent: null });
    setValidationResult(null);
    setImportResult(null);
    setError(null);
  };

  if (validationResult && importConfig.fileContent) {
    return <ImportPreview data={importConfig.fileContent} validationResult={validationResult} importing={importing} importResult={importResult} onImport={handleImport} onCancel={handleReset} />;
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 animate-fade-in">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <CloudArrowUpIcon className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">เกี่ยวกับการนำเข้าข้อมูล</h3>
            <p className="mt-1 text-sm text-emerald-700">
              นำเข้าข้อมูลจากไฟล์ CSV หรือ JSON เพื่อเพิ่มข้อมูลอุปกรณ์ใหม่
              ระบบจะตรวจสอบความถูกต้องของข้อมูลก่อนนำเข้า
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-rose-600" />
            <p className="text-sm text-rose-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Import Configuration */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">เลือกไฟล์สำหรับนำเข้า</h3>

        <div className="space-y-5">
          {/* Data Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทข้อมูล</label>
            <select
              value={importConfig.dataType}
              onChange={(e) => setImportConfig({ ...importConfig, dataType: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <option value={DATA_TYPE.EQUIPMENT}>ข้อมูลอุปกรณ์</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">ปัจจุบันรองรับเฉพาะการนำเข้าข้อมูลอุปกรณ์เท่านั้น</p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ไฟล์ข้อมูล</label>
            <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-200 border-dashed rounded-2xl 
              hover:border-emerald-400 hover:bg-emerald-50/50 transition-all duration-300 cursor-pointer">
              <div className="space-y-2 text-center">
                <DocumentTextIcon className="mx-auto h-14 w-14 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                    <span>เลือกไฟล์</span>
                    <input type="file" accept=".csv,.json" onChange={handleFileSelect} className="sr-only" />
                  </label>
                  <p className="pl-1">หรือลากไฟล์มาวาง</p>
                </div>
                <p className="text-xs text-gray-500">CSV หรือ JSON ขนาดไม่เกิน 10MB</p>
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
 */
const DeleteTab = () => {
  const { currentUser } = useAuth();
  const [deleteConfig, setDeleteConfig] = useState({
    dataTypes: [],
    dateRange: { start: '', end: '' },
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
      const result = await DataManagementService.deleteData(deleteConfig, currentUser.uid);
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
    setDeleteConfig({ dataTypes: [], dateRange: { start: '', end: '' }, createBackup: true, confirmationPhrase: '' });
    setShowConfirmation(false);
    setDeleteResult(null);
    setError(null);
  };

  const canProceed = deleteConfig.dataTypes.length > 0 && deleteConfig.dateRange.start && deleteConfig.dateRange.end;

  if (showConfirmation) {
    return <DeleteConfirmation config={deleteConfig} deleting={deleting} deleteResult={deleteResult} onConfirm={handleDelete} onCancel={handleReset} />;
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-5 animate-fade-in">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-rose-100 rounded-xl">
            <ShieldExclamationIcon className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-rose-900">คำเตือน: การดำเนินการนี้ไม่สามารถย้อนกลับได้</h3>
            <p className="mt-1 text-sm text-rose-700">
              การลบข้อมูลจะลบข้อมูลออกจากระบบอย่างถาวร
              กรุณาตรวจสอบการตั้งค่าให้ถูกต้องก่อนดำเนินการ
              ระบบจะสร้างไฟล์สำรองก่อนลบข้อมูล
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-rose-600" />
            <p className="text-sm text-rose-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Delete Configuration */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">ตั้งค่าการลบข้อมูล</h3>

        <div className="space-y-5">
          {/* Data Types Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">ประเภทข้อมูลที่ต้องการลบ</label>
            <div className="space-y-3">
              {[
                { type: DATA_TYPE.LOANS, label: 'รายการยืม-คืน' },
                { type: DATA_TYPE.RESERVATIONS, label: 'รายการจอง' }
              ].map(({ type, label }) => (
                <label key={type} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                  ${deleteConfig.dataTypes.includes(type) ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="checkbox"
                    checked={deleteConfig.dataTypes.includes(type)}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...deleteConfig.dataTypes, type]
                        : deleteConfig.dataTypes.filter(t => t !== type);
                      setDeleteConfig({ ...deleteConfig, dataTypes: newTypes });
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ช่วงวันที่ที่ต้องการลบ</label>
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 transition-all"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Create Backup */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteConfig.createBackup}
                onChange={(e) => setDeleteConfig({ ...deleteConfig, createBackup: e.target.checked })}
                className="w-5 h-5 rounded-lg border-gray-300 text-emerald-600 focus:ring-emerald-500"
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
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl 
              hover:from-rose-700 hover:to-red-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 
              disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
            คอนโซลจัดการข้อมูล
          </h1>
          <p className="mt-1 text-gray-500">ส่งออก นำเข้า และจัดการข้อมูลระบบ</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
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
