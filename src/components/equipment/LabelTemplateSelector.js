import React, { useState } from 'react';
import { CheckIcon } from 'lucide-react';
import LabelPrintingService from '../../services/labelPrintingService';

const DEFAULT_TEMPLATES = [
  {
    id: 'standard',
    name: 'ป้ายมาตรฐาน',
    width: 89,
    height: 36,
    preview: '<div class="w-16 h-8 border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-500">QR + Info</div>'
  },
  {
    id: 'compact',
    name: 'ป้ายขนาดเล็ก',
    width: 50,
    height: 25,
    preview: '<div class="w-12 h-6 border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-500">Compact</div>'
  }
];

const DEFAULT_TEMPLATE_MAP = DEFAULT_TEMPLATES.reduce((acc, template) => {
  acc[template.id] = template;
  return acc;
}, {});

const LabelTemplateSelector = ({ 
  selectedTemplate = 'standard', 
  onTemplateChange, 
  showPreview = true,
  className = '' 
}) => {
  const loadTemplates = () => {
    try {
      const availableTemplates = LabelPrintingService.getAvailableTemplates();
      return Array.isArray(availableTemplates) ? availableTemplates : [];
    } catch (error) {
      console.error('ไม่สามารถโหลดเทมเพลตป้ายได้:', error);
      return [];
    }
  };

  const [templates] = useState(() => {
    const availableTemplates = loadTemplates();
    return availableTemplates.length ? availableTemplates : DEFAULT_TEMPLATES;
  });

  const handleTemplateSelect = (templateId) => {
    if (onTemplateChange) {
      onTemplateChange(templateId);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900">เลือกรูปแบบป้าย</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleTemplateSelect(template.id)}
          >
            {/* Selection Indicator */}
            {selectedTemplate === template.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <CheckIcon className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Template Preview */}
            {showPreview && (
              <div className="mb-3 flex justify-center">
                <div 
                  className="border border-gray-300 bg-white"
                  dangerouslySetInnerHTML={{ __html: template.preview }}
                />
              </div>
            )}

            {/* Template Info */}
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
              <p className="text-sm text-gray-500">
                {template.width} × {template.height} mm
              </p>
            </div>

            {/* Template Description */}
            <div className="mt-2 text-xs text-gray-600">
              {template.id === 'standard' && 'ป้ายมาตรฐานพร้อม QR Code และข้อมูลพื้นฐาน'}
              {template.id === 'compact' && 'ป้ายขนาดเล็กสำหรับพื้นที่จำกัด'}
              {template.id === 'detailed' && 'ป้ายรายละเอียดพร้อมข้อมูลครบถ้วน'}
              {template.id === 'qrOnly' && 'QR Code เท่านั้น สำหรับการติดตามอย่างง่าย'}
            </div>
          </div>
        ))}
      </div>

      {/* Template Details */}
      {selectedTemplate && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">รายละเอียดเทมเพลต</h4>
          {(() => {
            const template = LabelPrintingService.LABEL_TEMPLATES?.[selectedTemplate] ||
              templates.find(t => t.id === selectedTemplate) ||
              DEFAULT_TEMPLATE_MAP[selectedTemplate];

            if (!template) {
              return (
                <p className="text-sm text-gray-500">
                  ไม่พบรายละเอียดเทมเพลตที่เลือก กรุณาเลือกเทมเพลตอื่น
                </p>
              );
            }

            const elements = Array.isArray(template.elements) ? template.elements : [];
            const templateWidth = template.width || '-';
            const templateHeight = template.height || '-';

            return (
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>ขนาด:</span>
                  <span>{templateWidth} × {templateHeight} mm</span>
                </div>
                <div className="flex justify-between">
                  <span>องค์ประกอบ:</span>
                  <span>{elements.length} รายการ</span>
                </div>
                <div>
                  <span>ข้อมูลที่แสดง:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {elements
                      .filter(el => el.type === 'text')
                      .map((el, index) => (
                        <span
                          key={index}
                          className="inline-block bg-white px-2 py-1 rounded text-xs border"
                        >
                          {el.field === 'equipmentNumber' && 'หมายเลขครุภัณฑ์'}
                          {el.field === 'name' && 'ชื่ออุปกรณ์'}
                          {el.field === 'brand' && 'ยี่ห้อ'}
                          {el.field === 'model' && 'รุ่น'}
                          {el.field === 'location' && 'สถานที่'}
                          {el.field === 'category' && 'ประเภท'}
                        </span>
                      ))}
                    {elements.some(el => el.type === 'qr') && (
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200">
                        QR Code
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default LabelTemplateSelector;