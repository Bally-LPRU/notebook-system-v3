import React, { useState } from 'react';
import { 
  XIcon, 
  PrinterIcon, 
  DownloadIcon, 
  EyeIcon,
  RefreshCwIcon,
  AlertCircleIcon 
} from 'lucide-react';
import LabelTemplateSelector from './LabelTemplateSelector';
import LabelPrintOptions from './LabelPrintOptions';
import LabelPrintingService from '../../services/labelPrintingService';

const LabelPrintingModal = ({ 
  isOpen, 
  onClose, 
  selectedEquipment = [], 
  title = "พิมพ์ป้ายอุปกรณ์" 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [printOptions, setPrintOptions] = useState({
    paperSize: 'a4',
    labelsPerRow: 3,
    labelSpacing: 5,
    pageMargin: 10,
    autoClose: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    setPreviewHtml(null); // Clear preview when template changes
  };

  const handleOptionsChange = (options) => {
    setPrintOptions(options);
    setPreviewHtml(null); // Clear preview when options change
  };

  const generateLabels = async () => {
    if (selectedEquipment.length === 0) {
      setError('กรุณาเลือกอุปกรณ์ที่ต้องการพิมพ์ป้าย');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const labelHtml = await LabelPrintingService.generateBulkLabels(
        selectedEquipment,
        selectedTemplate,
        {
          ...printOptions,
          title: `Equipment Labels - ${new Date().toLocaleDateString('th-TH')}`
        }
      );

      return labelHtml;
    } catch (error) {
      console.error('Error generating labels:', error);
      setError(error.message || 'เกิดข้อผิดพลาดในการสร้างป้าย');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    const labelHtml = await generateLabels();
    if (labelHtml) {
      setPreviewHtml(labelHtml);
      setShowPreview(true);
    }
  };

  const handlePrint = async () => {
    let labelHtml = previewHtml;
    
    if (!labelHtml) {
      labelHtml = await generateLabels();
    }

    if (labelHtml) {
      try {
        LabelPrintingService.printLabels(labelHtml, printOptions);
      } catch (error) {
        console.error('Error printing labels:', error);
        setError('ไม่สามารถพิมพ์ป้ายได้');
      }
    }
  };

  const handleDownload = async () => {
    let labelHtml = previewHtml;
    
    if (!labelHtml) {
      labelHtml = await generateLabels();
    }

    if (labelHtml) {
      try {
        const filename = `equipment-labels-${new Date().toISOString().split('T')[0]}.html`;
        LabelPrintingService.downloadLabels(labelHtml, filename);
      } catch (error) {
        console.error('Error downloading labels:', error);
        setError('ไม่สามารถดาวน์โหลดป้ายได้');
      }
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Equipment Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                อุปกรณ์ที่เลือก ({selectedEquipment.length} รายการ)
              </h3>
              
              {selectedEquipment.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    {selectedEquipment.map((equipment) => (
                      <div key={equipment.id} className="flex items-center bg-white rounded px-3 py-2">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mr-2">
                          {equipment.equipmentNumber}
                        </span>
                        <span className="truncate">{equipment.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  ไม่มีอุปกรณ์ที่เลือก
                </div>
              )}
            </div>

            {/* Template Selection */}
            <div className="mb-6">
              <LabelTemplateSelector
                selectedTemplate={selectedTemplate}
                onTemplateChange={handleTemplateChange}
                showPreview={true}
              />
            </div>

            {/* Print Options */}
            <div className="mb-6">
              <LabelPrintOptions
                options={printOptions}
                onOptionsChange={handleOptionsChange}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircleIcon className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              {selectedEquipment.length > 0 && (
                <>
                  จะสร้างป้าย {selectedEquipment.length} ป้าย
                  {printOptions.labelsPerRow && (
                    <> • {Math.ceil(selectedEquipment.length / (printOptions.labelsPerRow * Math.floor((297 - printOptions.pageMargin * 2) / (LabelPrintingService.LABEL_TEMPLATES[selectedTemplate]?.height + printOptions.labelSpacing))))} หน้า</>
                  )}
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePreview}
                disabled={selectedEquipment.length === 0 || isGenerating}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <EyeIcon className="w-4 h-4 mr-2" />
                )}
                ดูตัวอย่าง
              </button>
              
              <button
                onClick={handleDownload}
                disabled={selectedEquipment.length === 0 || isGenerating}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                ดาวน์โหลด
              </button>
              
              <button
                onClick={handlePrint}
                disabled={selectedEquipment.length === 0 || isGenerating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PrinterIcon className="w-4 h-4 mr-2" />
                )}
                พิมพ์
              </button>
              
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewHtml && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[95vh] overflow-hidden">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">ตัวอย่างป้าย</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PrinterIcon className="w-4 h-4 mr-2" />
                  พิมพ์
                </button>
                <button
                  onClick={handleClosePreview}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-4 overflow-auto max-h-[calc(95vh-80px)] bg-gray-100">
              <div className="bg-white shadow-lg mx-auto" style={{ width: 'fit-content' }}>
                <iframe
                  srcDoc={previewHtml}
                  className="w-full border-0"
                  style={{ 
                    width: '210mm', 
                    height: '297mm',
                    transform: 'scale(0.7)',
                    transformOrigin: 'top left'
                  }}
                  title="Label Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LabelPrintingModal;