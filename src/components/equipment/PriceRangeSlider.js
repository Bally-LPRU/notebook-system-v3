import { useState, useEffect } from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

const PriceRangeSlider = ({
  min = '',
  max = '',
  onMinChange,
  onMaxChange,
  disabled = false,
  className = ""
}) => {
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max);

  // Update local state when props change
  useEffect(() => {
    setLocalMin(min);
    setLocalMax(max);
  }, [min, max]);

  // Format number with commas
  const formatNumber = (num) => {
    if (!num) return '';
    return Number(num).toLocaleString('th-TH');
  };

  // Parse number from formatted string
  const parseNumber = (str) => {
    if (!str) return '';
    return str.replace(/,/g, '');
  };

  // Handle input change with formatting
  const handleInputChange = (value, onChange, setLocal) => {
    const numericValue = parseNumber(value);
    if (numericValue === '' || /^\d+$/.test(numericValue)) {
      setLocal(numericValue);
      onChange(numericValue);
    }
  };

  // Handle input blur to format display
  const handleInputBlur = (value, setLocal) => {
    if (value) {
      setLocal(formatNumber(value));
    }
  };

  // Handle input focus to show raw number
  const handleInputFocus = (value, setLocal) => {
    setLocal(parseNumber(value));
  };

  // Quick price range presets
  const quickRanges = [
    { label: '< 10,000', min: '', max: '10000' },
    { label: '10,000 - 50,000', min: '10000', max: '50000' },
    { label: '50,000 - 100,000', min: '50000', max: '100000' },
    { label: '100,000 - 500,000', min: '100000', max: '500000' },
    { label: '> 500,000', min: '500000', max: '' }
  ];

  const applyQuickRange = (range) => {
    setLocalMin(range.min);
    setLocalMax(range.max);
    onMinChange(range.min);
    onMaxChange(range.max);
  };

  const clearRange = () => {
    setLocalMin('');
    setLocalMax('');
    onMinChange('');
    onMaxChange('');
  };

  // Validate range
  const isValidRange = () => {
    if (!localMin || !localMax) return true;
    return Number(parseNumber(localMin)) <= Number(parseNumber(localMax));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Price Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            ราคาต่ำสุด (บาท)
          </label>
          <div className="relative">
            <input
              type="text"
              value={localMin}
              onChange={(e) => handleInputChange(e.target.value, onMinChange, setLocalMin)}
              onFocus={(e) => handleInputFocus(e.target.value, setLocalMin)}
              onBlur={(e) => handleInputBlur(e.target.value, setLocalMin)}
              placeholder="0"
              disabled={disabled}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm ${
                !isValidRange() ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            ราคาสูงสุด (บาท)
          </label>
          <div className="relative">
            <input
              type="text"
              value={localMax}
              onChange={(e) => handleInputChange(e.target.value, onMaxChange, setLocalMax)}
              onFocus={(e) => handleInputFocus(e.target.value, setLocalMax)}
              onBlur={(e) => handleInputBlur(e.target.value, setLocalMax)}
              placeholder="ไม่จำกัด"
              disabled={disabled}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm ${
                !isValidRange() ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Validation Error */}
      {!isValidRange() && (
        <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">
          ราคาต่ำสุดต้องน้อยกว่าหรือเท่ากับราคาสูงสุด
        </div>
      )}

      {/* Quick Range Buttons */}
      <div>
        <div className="flex flex-wrap gap-2">
          {quickRanges.map((range, index) => (
            <button
              key={index}
              onClick={() => applyQuickRange(range)}
              disabled={disabled}
              className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {range.label}
            </button>
          ))}
          
          {/* Clear Button */}
          {(localMin || localMax) && (
            <button
              onClick={clearRange}
              disabled={disabled}
              className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ล้าง
            </button>
          )}
        </div>
      </div>

      {/* Selected Range Display */}
      {(localMin || localMax) && isValidRange() && (
        <div className="text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded">
          <span className="font-medium">ช่วงราคาที่เลือก: </span>
          {localMin && <span>{formatNumber(localMin)} บาท</span>}
          {localMin && localMax && <span> ถึง </span>}
          {localMax && <span>{formatNumber(localMax)} บาท</span>}
          {!localMin && localMax && <span>สูงสุด {formatNumber(localMax)} บาท</span>}
          {localMin && !localMax && <span>ตั้งแต่ {formatNumber(localMin)} บาท ขึ้นไป</span>}
        </div>
      )}
    </div>
  );
};

export default PriceRangeSlider;