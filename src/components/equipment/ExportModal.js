import React, { useState, useEffect } from 'react';
import { X, Download, FileText, FileSpreadsheet, Image, Settings } from 'lucide-react';

const ExportModal = ({ 
  isOpen, 
  onClose, 
  equipment = [], 
  onExport,
  availableFields = [],
  exportTemplates = []
}) => {
  const [exportFormat, setExportFormat] = useState('excel');
  const [selectedFields, setSelectedFields] = useState([]);
  const [includeImages, setIncludeImages] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customTemplate, setCustomTemplate] = useState({
    name: '',
    description: '',
    fields: []
  });
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Default fields for equipment export
  const defaultFields = [
    { key: 'equipmentNumber', label: 'หมายเลขครุภัณฑ์', required: true },
    { key: 'name', label: 'ชื่ออุปกรณ์', required: true },
    { key: 'category.name', label: 'ประเภท', required: false },
    { key: 'brand', label: 'ยี่ห้อ', required: false },
    { key: 'model', label: 'รุ่น', required: false },
    { key: 'status', label: 'สถานะ', required: false },
    { key: 'location.building', label: 'อาคาร', required: false },
    { key: 'location.room', label: 'ห้อง', required: false },
    { key: 'purchaseDate', label: 'วันที่ซื้อ', required: false },
    { key: 'purchasePrice', label: 'ราคาซื้อ', required: false },
    { key: 'vendor', label: 'ผู้จำหน่าย', required: false },
    { key: 'responsiblePerson.name', label: 'ผู้รับผิดชอบ', required: false },
    { key: 'description', label: 'รายละเอียด', required: false },
    { key: 'notes', label: 'หมายเหตุ', required: false },
    { key: 'createdAt', label: 'วันที่สร้าง', required: false },
    { key: 'updatedAt', label: 'วันที่แก้ไขล่าสุด', required: false }
  ];

  const fields = availableFields.length > 0 ? availableFields : defaultFields;

  useEffect(() => {
    if (isOpen) {
      // Initialize with required fields
      const requiredFields = fields.filter(field => field.required).map(field => field.key);
      setSelectedFields(requiredFields);
      setExportFormat('excel');
      setIncludeImages(false);
      setSelectedTemplate('');
      setIsCreatingTemplate(false);
    }
  }, [isOpen, fields]);

  const handleFieldToggle = (fieldKey) => {
    const field = fields.find(f => f.key === fieldKey);
    if (field?.required) return; // Can't unselect required fields

    setSelectedFields(prev => 
      prev.includes(fieldKey) 
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleSelectAll = () => {
    setSelectedFields(fields.map(field => field.key));
  };

  const handleSelectNone = () => {
    const requiredFields = fields.filter(field => field.required).map(field => field.key);
    setSelectedFields(requiredFields);
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = exportTemplates.find(t => t.id === templateId);
      if (template) {
        setSelectedFields(template.fields);
        setIncludeImages(template.includeImages || false);
      }
    }
  };

  const handleSaveTemplate = () => {
    if (!customTemplate.name.trim()) {
      alert('กรุณาใส่ชื่อ template');
      return;
    }

    const newTemplate = {
      ...customTemplate,
      fields: selectedFields,
      includeImages,
      createdAt: new Date()
    };

    // Call parent function to save template
    if (onExport) {
      onExport({
        action: 'saveTemplate',
        template: newTemplate
      });
    }

    setIsCreatingTemplate(false);
    setCustomTemplate({ name: '', description: '', fields: [] });
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      alert('กรุณาเลือกฟิลด์ที่ต้องการส่งออกอย่างน้อย 1 ฟิลด์');
      return;
    }

    setIsExporting(true);

    try {
      await onExport({
        action: 'export',
        format: exportFormat,
        fields: selectedFields,
        includeImages,
        equipment,
        template: selectedTemplate
      });
      
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Download className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              ส่งออกข้อมูลอุปกรณ์
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Export Settings */}
            <div className="space-y-6">
              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  รูปแบบการส่งออก
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setExportFormat('excel')}
                    className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                      exportFormat === 'excel'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <FileSpreadsheet className="h-6 w-6" />
                    <span className="text-sm font-medium">Excel</span>
                  </button>
                  
                  <button
                    onClick={() => setExportFormat('pdf')}
                    className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                      exportFormat === 'pdf'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm font-medium">PDF</span>
                  </button>
                  
                  <button
                    onClick={() => setExportFormat('csv')}
                    className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                      exportFormat === 'csv'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm font-medium">CSV</span>
                  </button>
                </div>
              </div>

              {/* Export Templates */}
              {exportTemplates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Template ที่บันทึกไว้
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">เลือก template...</option>
                    {exportTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Additional Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ตัวเลือกเพิ่มเติม
                </label>
                <div className="space-y-3">
                  {exportFormat === 'pdf' && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includeImages}
                        onChange={(e) => setIncludeImages(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <Image className="h-4 w-4 mr-1" />
                        รวมรูปภาพในรายงาน
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">สรุปการส่งออก</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>จำนวนอุปกรณ์: {equipment.length.toLocaleString()} รายการ</p>
                  <p>จำนวนฟิลด์: {selectedFields.length} ฟิลด์</p>
                  <p>รูปแบบ: {exportFormat.toUpperCase()}</p>
                  {includeImages && <p>รวมรูปภาพ: ใช่</p>}
                </div>
              </div>
            </div>

            {/* Right Column - Field Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  เลือกฟิลด์ที่ต้องการส่งออก
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    เลือกทั้งหมด
                  </button>
                  <span className="text-xs text-gray-400">|</span>
                  <button
                    onClick={handleSelectNone}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    ยกเลิกทั้งหมด
                  </button>
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg max-h-80 overflow-y-auto">
                <div className="p-3 space-y-2">
                  {fields.map(field => (
                    <label
                      key={field.key}
                      className={`flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer ${
                        field.required ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.key)}
                        onChange={() => handleFieldToggle(field.key)}
                        disabled={field.required}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className={`ml-2 text-sm ${
                        field.required 
                          ? 'text-blue-700 font-medium' 
                          : 'text-gray-700'
                      }`}>
                        {field.label}
                        {field.required && (
                          <span className="text-xs text-blue-500 ml-1">(จำเป็น)</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save as Template */}
              <div className="mt-4">
                {!isCreatingTemplate ? (
                  <button
                    onClick={() => setIsCreatingTemplate(true)}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    บันทึกเป็น Template
                  </button>
                ) : (
                  <div className="space-y-3 p-3 border border-gray-300 rounded-lg bg-gray-50">
                    <input
                      type="text"
                      placeholder="ชื่อ Template"
                      value={customTemplate.name}
                      onChange={(e) => setCustomTemplate(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      placeholder="คำอธิบาย (ไม่บังคับ)"
                      value={customTemplate.description}
                      onChange={(e) => setCustomTemplate(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveTemplate}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        บันทึก
                      </button>
                      <button
                        onClick={() => setIsCreatingTemplate(false)}
                        className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedFields.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>กำลังส่งออก...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>ส่งออกข้อมูล</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;