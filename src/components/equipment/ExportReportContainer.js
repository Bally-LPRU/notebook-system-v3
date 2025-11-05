import React, { useState, useEffect } from 'react';
import { Download, BarChart3, FileText, Settings } from 'lucide-react';
import ExportModal from './ExportModal';
import ReportGenerator from './ReportGenerator';
import EquipmentExportService from '../../services/equipmentExportService';
import EquipmentReportService from '../../services/equipmentReportService';

const ExportReportContainer = ({ 
  equipment = [], 
  selectedEquipment = [], 
  filters = {},
  onExportComplete,
  onReportGenerated 
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [exportTemplates, setExportTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadExportTemplates();
  }, []);

  const loadExportTemplates = async () => {
    try {
      // In a real implementation, you would get the current user ID
      const userId = 'current-user-id'; // Replace with actual user ID
      const templates = await EquipmentExportService.getExportTemplates(userId);
      const publicTemplates = await EquipmentExportService.getPublicExportTemplates();
      
      setExportTemplates([...templates, ...publicTemplates]);
    } catch (error) {
      console.error('Error loading export templates:', error);
    }
  };

  const handleExport = async (exportConfig) => {
    setIsLoading(true);
    
    try {
      const { action, ...config } = exportConfig;
      
      if (action === 'saveTemplate') {
        // Save export template
        const userId = 'current-user-id'; // Replace with actual user ID
        const savedTemplate = await EquipmentExportService.saveExportTemplate(config.template, userId);
        setExportTemplates(prev => [savedTemplate, ...prev]);
        return;
      }
      
      if (action === 'export') {
        // Determine which equipment to export
        const equipmentToExport = selectedEquipment.length > 0 ? selectedEquipment : equipment;
        
        if (equipmentToExport.length === 0) {
          throw new Error('ไม่มีข้อมูลอุปกรณ์ที่จะส่งออก');
        }

        // Perform export
        const result = await EquipmentExportService.exportEquipment({
          ...config,
          equipment: equipmentToExport
        });

        if (onExportComplete) {
          onExportComplete(result);
        }

        // Show success message
        const message = `ส่งออกข้อมูลสำเร็จ: ${result.filename}`;
        if (window.showNotification) {
          window.showNotification(message, 'success');
        } else {
          alert(message);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error.message || 'เกิดข้อผิดพลาดในการส่งออกข้อมูล';
      
      if (window.showNotification) {
        window.showNotification(errorMessage, 'error');
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportGenerate = async (report) => {
    try {
      if (onReportGenerated) {
        onReportGenerated(report);
      }

      // Show success message
      const message = `สร้างรายงานสำเร็จ: ${report.reportType}`;
      if (window.showNotification) {
        window.showNotification(message, 'success');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      const errorMessage = 'เกิดข้อผิดพลาดในการสร้างรายงาน';
      
      if (window.showNotification) {
        window.showNotification(errorMessage, 'error');
      } else {
        alert(errorMessage);
      }
    }
  };

  const getExportButtonText = () => {
    if (selectedEquipment.length > 0) {
      return `ส่งออกรายการที่เลือก (${selectedEquipment.length})`;
    }
    return `ส่งออกทั้งหมด (${equipment.length})`;
  };

  const getExportButtonDisabled = () => {
    return equipment.length === 0 || isLoading;
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Export Button */}
      <button
        onClick={() => setShowExportModal(true)}
        disabled={getExportButtonDisabled()}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        title={getExportButtonText()}
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">ส่งออกข้อมูล</span>
      </button>

      {/* Report Generator Button */}
      <button
        onClick={() => setShowReportGenerator(true)}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
      >
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">สร้างรายงาน</span>
      </button>

      {/* Quick Export Buttons (for common formats) */}
      <div className="hidden lg:flex items-center space-x-2 border-l pl-3">
        <button
          onClick={() => handleExport({
            action: 'export',
            format: 'excel',
            fields: ['equipmentNumber', 'name', 'category.name', 'brand', 'model', 'status'],
            equipment: selectedEquipment.length > 0 ? selectedEquipment : equipment
          })}
          disabled={getExportButtonDisabled()}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
          title="ส่งออก Excel แบบด่วน"
        >
          <FileText className="h-4 w-4" />
          <span>Excel</span>
        </button>

        <button
          onClick={() => handleExport({
            action: 'export',
            format: 'csv',
            fields: ['equipmentNumber', 'name', 'category.name', 'brand', 'model', 'status'],
            equipment: selectedEquipment.length > 0 ? selectedEquipment : equipment
          })}
          disabled={getExportButtonDisabled()}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
          title="ส่งออก CSV แบบด่วน"
        >
          <FileText className="h-4 w-4" />
          <span>CSV</span>
        </button>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        equipment={selectedEquipment.length > 0 ? selectedEquipment : equipment}
        onExport={handleExport}
        exportTemplates={exportTemplates}
      />

      {/* Report Generator Modal */}
      <ReportGenerator
        isOpen={showReportGenerator}
        onClose={() => setShowReportGenerator(false)}
        onGenerate={handleReportGenerate}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">กำลังประมวลผล...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportReportContainer;