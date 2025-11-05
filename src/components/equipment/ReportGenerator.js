import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BarChart3, 
  Settings, 
  Download, 
  Calendar,
  Filter,
  TrendingUp,
  Wrench,
  Package,
  Plus,
  Save,
  Eye,
  X
} from 'lucide-react';
import EquipmentReportService from '../../services/equipmentReportService';
import EquipmentExportService from '../../services/equipmentExportService';

const ReportGenerator = ({ isOpen, onClose, onGenerate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customTemplate, setCustomTemplate] = useState({
    name: '',
    description: '',
    type: 'custom',
    fields: [],
    groupBy: '',
    sortBy: 'name',
    sortOrder: 'asc',
    includeCharts: true,
    chartTypes: [],
    filters: {}
  });
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [userTemplates, setUserTemplates] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: null,
    categories: [],
    statuses: [],
    priceRange: null
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Available fields for custom reports
  const availableFields = [
    { key: 'equipmentNumber', label: 'หมายเลขครุภัณฑ์', type: 'text' },
    { key: 'name', label: 'ชื่ออุปกรณ์', type: 'text' },
    { key: 'category.name', label: 'ประเภท', type: 'text' },
    { key: 'brand', label: 'ยี่ห้อ', type: 'text' },
    { key: 'model', label: 'รุ่น', type: 'text' },
    { key: 'status', label: 'สถานะ', type: 'text' },
    { key: 'location.building', label: 'อาคาร', type: 'text' },
    { key: 'location.room', label: 'ห้อง', type: 'text' },
    { key: 'purchaseDate', label: 'วันที่ซื้อ', type: 'date' },
    { key: 'purchasePrice', label: 'ราคาซื้อ', type: 'number' },
    { key: 'vendor', label: 'ผู้จำหน่าย', type: 'text' },
    { key: 'warrantyExpiry', label: 'วันหมดประกัน', type: 'date' },
    { key: 'responsiblePerson.name', label: 'ผู้รับผิดชอบ', type: 'text' },
    { key: 'viewCount', label: 'จำนวนครั้งที่ดู', type: 'number' },
    { key: 'createdAt', label: 'วันที่สร้าง', type: 'date' },
    { key: 'updatedAt', label: 'วันที่แก้ไขล่าสุด', type: 'date' }
  ];

  const predefinedTemplates = EquipmentReportService.getPredefinedTemplates();

  useEffect(() => {
    if (isOpen) {
      loadUserTemplates();
    }
  }, [isOpen]);

  const loadUserTemplates = async () => {
    try {
      // In a real implementation, you would get the current user ID
      const userId = 'current-user-id'; // Replace with actual user ID
      const templates = await EquipmentReportService.getUserReportTemplates(userId);
      setUserTemplates(templates);
    } catch (error) {
      console.error('Error loading user templates:', error);
    }
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    setIsCustomMode(false);
    
    if (templateId) {
      const template = [...predefinedTemplates, ...userTemplates]
        .find(t => t.id === templateId);
      
      if (template) {
        setFilters(template.filters || {});
      }
    }
  };

  const handleCustomFieldToggle = (fieldKey) => {
    setCustomTemplate(prev => ({
      ...prev,
      fields: prev.fields.includes(fieldKey)
        ? prev.fields.filter(key => key !== fieldKey)
        : [...prev.fields, fieldKey]
    }));
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate && !isCustomMode) {
      alert('กรุณาเลือก template หรือสร้างรายงานแบบกำหนดเอง');
      return;
    }

    if (isCustomMode && customTemplate.fields.length === 0) {
      alert('กรุณาเลือกฟิลด์สำหรับรายงานอย่างน้อย 1 ฟิลด์');
      return;
    }

    setIsGenerating(true);

    try {
      let report;
      
      if (isCustomMode) {
        report = await EquipmentReportService.generateCustomReport(customTemplate, filters);
      } else {
        const template = [...predefinedTemplates, ...userTemplates]
          .find(t => t.id === selectedTemplate);
        
        switch (template.type) {
          case 'inventory':
            report = await EquipmentReportService.generateInventoryReport(filters);
            break;
          case 'utilization':
            report = await EquipmentReportService.generateUtilizationReport(filters);
            break;
          case 'maintenance':
            report = await EquipmentReportService.generateMaintenanceReport(filters);
            break;
          default:
            report = await EquipmentReportService.generateCustomReport(template, filters);
        }
      }

      setGeneratedReport(report);
      setShowPreview(true);
      
      if (onGenerate) {
        onGenerate(report);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('เกิดข้อผิดพลาดในการสร้างรายงาน');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!customTemplate.name.trim()) {
      alert('กรุณาใส่ชื่อ template');
      return;
    }

    try {
      // In a real implementation, you would get the current user ID
      const userId = 'current-user-id'; // Replace with actual user ID
      const savedTemplate = await EquipmentReportService.saveReportTemplate(customTemplate, userId);
      
      setUserTemplates(prev => [savedTemplate, ...prev]);
      alert('บันทึก template สำเร็จ');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก template');
    }
  };

  const handleExportReport = async (format) => {
    if (!generatedReport) return;

    try {
      const exportConfig = {
        format,
        equipment: generatedReport.data || generatedReport.equipment || [],
        fields: isCustomMode ? customTemplate.fields : getTemplateFields(),
        filename: `report_${generatedReport.reportType}_${Date.now()}`
      };

      await EquipmentExportService.exportEquipment(exportConfig);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('เกิดข้อผิดพลาดในการส่งออกรายงาน');
    }
  };

  const getTemplateFields = () => {
    const template = [...predefinedTemplates, ...userTemplates]
      .find(t => t.id === selectedTemplate);
    return template?.fields || [];
  };

  const renderTemplateIcon = (type) => {
    switch (type) {
      case 'inventory':
        return <Package className="h-5 w-5" />;
      case 'utilization':
        return <TrendingUp className="h-5 w-5" />;
      case 'maintenance':
        return <Wrench className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  const renderReportPreview = () => {
    if (!generatedReport) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              ตัวอย่างรายงาน: {generatedReport.template || generatedReport.reportType}
            </h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExportReport('excel')}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => handleExportReport('pdf')}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* Report Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">สรุปรายงาน</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(generatedReport.summary || {}).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {typeof value === 'number' ? value.toLocaleString('th-TH') : value}
                      </div>
                      <div className="text-sm text-gray-600">{key}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Preview */}
              {(generatedReport.data || generatedReport.equipment) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">ข้อมูลตัวอย่าง (10 รายการแรก)</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys((generatedReport.data || generatedReport.equipment)[0] || {})
                            .slice(0, 6)
                            .map(key => (
                            <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(generatedReport.data || generatedReport.equipment)
                          .slice(0, 10)
                          .map((item, index) => (
                          <tr key={index}>
                            {Object.values(item)
                              .slice(0, 6)
                              .map((value, valueIndex) => (
                              <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                สร้างรายงานอุปกรณ์
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
            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">เลือกประเภทรายงาน</h3>
                  <button
                    onClick={() => setIsCustomMode(!isCustomMode)}
                    className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                      isCustomMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>สร้างแบบกำหนดเอง</span>
                  </button>
                </div>

                {!isCustomMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Predefined Templates */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">รายงานมาตรฐาน</h4>
                      <div className="space-y-2">
                        {predefinedTemplates.map(template => (
                          <label
                            key={template.id}
                            className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedTemplate === template.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <input
                              type="radio"
                              name="template"
                              value={template.id}
                              checked={selectedTemplate === template.id}
                              onChange={(e) => handleTemplateSelect(e.target.value)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center space-x-2">
                                {renderTemplateIcon(template.type)}
                                <span className="font-medium text-gray-900">{template.name}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* User Templates */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">รายงานที่บันทึกไว้</h4>
                      {userTemplates.length > 0 ? (
                        <div className="space-y-2">
                          {userTemplates.map(template => (
                            <label
                              key={template.id}
                              className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedTemplate === template.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <input
                                type="radio"
                                name="template"
                                value={template.id}
                                checked={selectedTemplate === template.id}
                                onChange={(e) => handleTemplateSelect(e.target.value)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center space-x-2">
                                  <Settings className="h-4 w-4" />
                                  <span className="font-medium text-gray-900">{template.name}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>ยังไม่มีรายงานที่บันทึกไว้</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Custom Template Builder */}
                {isCustomMode && (
                  <div className="space-y-6 border border-gray-300 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ชื่อรายงาน
                        </label>
                        <input
                          type="text"
                          value={customTemplate.name}
                          onChange={(e) => setCustomTemplate(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="ใส่ชื่อรายงาน"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          จัดกลุ่มตาม
                        </label>
                        <select
                          value={customTemplate.groupBy}
                          onChange={(e) => setCustomTemplate(prev => ({ ...prev, groupBy: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">ไม่จัดกลุ่ม</option>
                          {availableFields.map(field => (
                            <option key={field.key} value={field.key}>{field.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        คำอธิบาย
                      </label>
                      <textarea
                        value={customTemplate.description}
                        onChange={(e) => setCustomTemplate(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="คำอธิบายรายงาน (ไม่บังคับ)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        เลือกฟิลด์ที่ต้องการ
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {availableFields.map(field => (
                          <label
                            key={field.key}
                            className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={customTemplate.fields.includes(field.key)}
                              onChange={() => handleCustomFieldToggle(field.key)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{field.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={customTemplate.includeCharts}
                          onChange={(e) => setCustomTemplate(prev => ({ ...prev, includeCharts: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">รวมกราฟและแผนภูมิ</span>
                      </label>

                      <button
                        onClick={handleSaveTemplate}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>บันทึก Template</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Filters */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">ตัวกรองข้อมูล</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ช่วงวันที่
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: new Date(e.target.value) }
                        }))}
                      />
                      <input
                        type="date"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: new Date(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ช่วงราคา
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="ราคาต่ำสุด"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, min: parseFloat(e.target.value) || 0 }
                        }))}
                      />
                      <input
                        type="number"
                        placeholder="ราคาสูงสุด"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, max: parseFloat(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                  </div>
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
              onClick={handleGenerateReport}
              disabled={isGenerating || (!selectedTemplate && !isCustomMode)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>กำลังสร้างรายงาน...</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>สร้างรายงาน</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview Modal */}
      {showPreview && renderReportPreview()}
    </>
  );
};

export default ReportGenerator;