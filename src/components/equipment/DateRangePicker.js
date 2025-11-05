import { CalendarIcon } from '@heroicons/react/24/outline';

const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled = false,
  className = ""
}) => {
  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  };

  // Handle date change
  const handleDateChange = (value, onChange) => {
    onChange(value);
  };

  // Quick date range presets
  const quickRanges = [
    {
      label: 'วันนี้',
      getValue: () => {
        const today = new Date().toISOString().split('T')[0];
        return { start: today, end: today };
      }
    },
    {
      label: '7 วันที่แล้ว',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: '30 วันที่แล้ว',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: '3 เดือนที่แล้ว',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 3);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'ปีนี้',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    }
  ];

  const applyQuickRange = (range) => {
    const { start, end } = range.getValue();
    onStartDateChange(start);
    onEndDateChange(end);
  };

  const clearDates = () => {
    onStartDateChange('');
    onEndDateChange('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Date Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            วันที่เริ่มต้น
          </label>
          <div className="relative">
            <input
              type="date"
              value={formatDateForInput(startDate)}
              onChange={(e) => handleDateChange(e.target.value, onStartDateChange)}
              max={formatDateForInput(endDate) || undefined}
              disabled={disabled}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            วันที่สิ้นสุด
          </label>
          <div className="relative">
            <input
              type="date"
              value={formatDateForInput(endDate)}
              onChange={(e) => handleDateChange(e.target.value, onEndDateChange)}
              min={formatDateForInput(startDate) || undefined}
              disabled={disabled}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

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
          {(startDate || endDate) && (
            <button
              onClick={clearDates}
              disabled={disabled}
              className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ล้าง
            </button>
          )}
        </div>
      </div>

      {/* Selected Range Display */}
      {(startDate || endDate) && (
        <div className="text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded">
          <span className="font-medium">ช่วงที่เลือก: </span>
          {startDate && (
            <span>
              {new Date(startDate).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          )}
          {startDate && endDate && <span> ถึง </span>}
          {endDate && (
            <span>
              {new Date(endDate).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;