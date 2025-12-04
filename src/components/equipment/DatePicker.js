import React, { useState, useRef, useEffect, useId } from 'react';
import { useClosedDates } from '../../hooks/useClosedDates';

const DatePicker = ({
  value,
  onChange,
  placeholder = 'เลือกวันที่',
  disabled = false,
  error = null,
  className = '',
  id,
  name,
  minDate = null,
  maxDate = null,
  showTime = false,
  format = 'YYYY-MM-DD',
  label = null,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // Remove unused displayValue state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const generatedId = useId();
  const inputId = id || name || `date-picker-${generatedId}`;
  
  const inputRef = useRef(null);
  const calendarRef = useRef(null);
  
  // Get closed dates functionality
  const { isDateClosed, closedDates } = useClosedDates();

  // Initialize selected date
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    if (showTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('th-TH', options);
  };

  // Format date for input value
  const formatInputDate = (date) => {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (showTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    return `${year}-${month}-${day}`;
  };

  // Get closed date reason
  const getClosedDateReason = (date) => {
    if (!date) return null;
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    
    const closedDate = closedDates.find(cd => {
      if (!cd.date) return false;
      const cdDate = new Date(cd.date);
      cdDate.setHours(0, 0, 0, 0);
      return cdDate.getTime() === normalizedDate.getTime();
    });
    
    return closedDate ? closedDate.reason : null;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue) {
      const date = new Date(newValue);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        onChange(formatInputDate(date));
      }
    } else {
      setSelectedDate(null);
      onChange('');
    }
  };

  // Handle calendar date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    onChange(formatInputDate(date));
    setIsOpen(false);
  };

  // Toggle calendar
  const toggleCalendar = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    // Remove unused lastDay variable
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isClosed = isDateClosed(date);
      const isDisabled = 
        (minDate && date < new Date(minDate)) ||
        (maxDate && date > new Date(maxDate)) ||
        isClosed;

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled,
        isClosed
      });
    }

    return days;
  };

  // Navigate months
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Quick date selections
  const quickSelections = [
    { label: 'วันนี้', getValue: () => new Date() },
    { label: 'เมื่อวาน', getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d; } },
    { label: 'สัปดาห์ที่แล้ว', getValue: () => { const d = new Date(); d.setDate(d.getDate() - 7); return d; } },
    { label: 'เดือนที่แล้ว', getValue: () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; } }
  ];

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type={showTime ? 'datetime-local' : 'date'}
          id={inputId}
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          min={minDate}
          max={maxDate}
          className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md pr-10 ${
            error ? 'border-red-300' : ''
          }`}
        />
        
        <button
          type="button"
          onClick={toggleCalendar}
          disabled={disabled}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Custom Calendar Popup */}
      {isOpen && (
        <div
          ref={calendarRef}
          className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-lg font-medium">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
            </h3>
            
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div key={index} className="relative">
                <button
                  type="button"
                  onClick={() => !day.isDisabled && handleDateSelect(day.date)}
                  onMouseEnter={() => setHoveredDate(day.date)}
                  onMouseLeave={() => setHoveredDate(null)}
                  disabled={day.isDisabled}
                  className={`
                    w-full p-2 text-sm rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                    ${day.isToday ? 'bg-blue-100 font-semibold' : ''}
                    ${day.isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                    ${day.isClosed ? 'bg-red-100 text-red-600 line-through' : ''}
                    ${day.isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  `}
                >
                  {day.day}
                </button>
                
                {/* Tooltip for closed dates */}
                {day.isClosed && hoveredDate && hoveredDate.getTime() === day.date.getTime() && (
                  <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap">
                    {getClosedDateReason(day.date) || 'วันปิดทำการ'}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Selections */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {quickSelections.map(selection => (
                <button
                  key={selection.label}
                  type="button"
                  onClick={() => handleDateSelect(selection.getValue())}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                >
                  {selection.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default DatePicker;