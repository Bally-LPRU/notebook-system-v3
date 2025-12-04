import React, { useState } from 'react';
import LabelPrintingService from '../../services/labelPrintingService';

const DEFAULT_PAPER_SIZES = {
  a4: { width: 210, height: 297, name: 'A4' },
  letter: { width: 216, height: 279, name: 'Letter' },
  label: { width: 100, height: 150, name: 'Label Sheet' }
};

const LabelPrintOptions = ({ 
  options = {}, 
  onOptionsChange, 
  className = '' 
}) => {
  const [localOptions, setLocalOptions] = useState({
    paperSize: 'a4',
    labelsPerRow: 3,
    labelSpacing: 5,
    pageMargin: 10,
    autoClose: true,
    ...options
  });

  const availablePaperSizes = LabelPrintingService.PAPER_SIZES || DEFAULT_PAPER_SIZES;

  const paperSizes = Object.entries(availablePaperSizes).map(([key, value]) => ({
    id: key,
    name: value.name,
    dimensions: `${value.width} × ${value.height} mm`
  }));

  const handleOptionChange = (key, value) => {
    const newOptions = {
      ...localOptions,
      [key]: value
    };
    setLocalOptions(newOptions);
    
    if (onOptionsChange) {
      onOptionsChange(newOptions);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900">ตัวเลือกการพิมพ์</h3>

      {/* Paper Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ขนาดกระดาษ
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {paperSizes.map((paper) => (
            <label
              key={paper.id}
              className={`relative border rounded-lg p-3 cursor-pointer transition-all ${
                localOptions.paperSize === paper.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="paperSize"
                value={paper.id}
                checked={localOptions.paperSize === paper.id}
                onChange={(e) => handleOptionChange('paperSize', e.target.value)}
                className="sr-only"
              />
              <div className="text-sm font-medium text-gray-900">{paper.name}</div>
              <div className="text-xs text-gray-500">{paper.dimensions}</div>
            </label>
          ))}
        </div>
      </div>

      {/* Layout Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Labels Per Row */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            จำนวนป้ายต่อแถว
          </label>
          <select
            value={localOptions.labelsPerRow}
            onChange={(e) => handleOptionChange('labelsPerRow', parseInt(e.target.value))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>1 ป้าย</option>
            <option value={2}>2 ป้าย</option>
            <option value={3}>3 ป้าย</option>
            <option value={4}>4 ป้าย</option>
            <option value={5}>5 ป้าย</option>
          </select>
        </div>

        {/* Label Spacing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ระยะห่างระหว่างป้าย (mm)
          </label>
          <input
            type="number"
            min="0"
            max="20"
            step="1"
            value={localOptions.labelSpacing}
            onChange={(e) => handleOptionChange('labelSpacing', parseInt(e.target.value) || 0)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Page Margin */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ขอบหน้ากระดาษ (mm)
        </label>
        <input
          type="number"
          min="0"
          max="50"
          step="1"
          value={localOptions.pageMargin}
          onChange={(e) => handleOptionChange('pageMargin', parseInt(e.target.value) || 0)}
          className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Print Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          ตัวเลือกเพิ่มเติม
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localOptions.autoClose}
              onChange={(e) => handleOptionChange('autoClose', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              ปิดหน้าต่างอัตโนมัติหลังพิมพ์
            </span>
          </label>
        </div>
      </div>

      {/* Preview Layout */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">ตัวอย่างการจัดวาง</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>กระดาษ: {paperSizes.find(p => p.id === localOptions.paperSize)?.name}</div>
          <div>จำนวนป้ายต่อแถว: {localOptions.labelsPerRow}</div>
          <div>ระยะห่าง: {localOptions.labelSpacing} mm</div>
          <div>ขอบหน้า: {localOptions.pageMargin} mm</div>
        </div>
        
        {/* Visual Layout Preview */}
        <div className="mt-3 p-2 bg-white border rounded" style={{ aspectRatio: '210/297' }}>
          <div className="w-full h-full border-2 border-dashed border-gray-300 relative">
            <div 
              className="absolute bg-blue-100 border border-blue-300"
              style={{
                left: `${localOptions.pageMargin}px`,
                top: `${localOptions.pageMargin}px`,
                width: `${30 * localOptions.labelsPerRow + (localOptions.labelsPerRow - 1) * 2}px`,
                height: '20px'
              }}
            >
              <div className="flex h-full">
                {Array.from({ length: localOptions.labelsPerRow }, (_, i) => (
                  <div
                    key={i}
                    className="bg-blue-200 border border-blue-400 flex-1 mr-0.5 last:mr-0 flex items-center justify-center text-xs text-blue-700"
                  >
                    ป้าย
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelPrintOptions;