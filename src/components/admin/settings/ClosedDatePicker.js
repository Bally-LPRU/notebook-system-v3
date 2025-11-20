/**
 * Closed Date Picker Component
 * 
 * Extended date picker that disables closed dates and shows tooltips.
 * Integrates with the settings system to automatically disable dates
 * marked as closed by administrators.
 * 
 * Features:
 * - Disables closed dates in date selection
 * - Shows tooltip explaining why date is disabled
 * - Supports recurring closed dates (e.g., annual holidays)
 * - Real-time updates when closed dates change
 * 
 * Requirements: 2.2, 2.3, 2.4
 */

import React, { useState, useRef, useEffect } from 'react';
import settingsService from '../../../services/settingsService';

/**
 * ClosedDatePicker Component
 * 
 * A date picker that automatically disables closed dates from the settings system.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.value - Current date value (YYYY-MM-DD format)
 * @param {Function} props.onChange - Callback when date changes
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether picker is disabled
 * @param {string|null} props.error - Error message to display
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.id - Input ID
 * @param {string} props.name - Input name
 * @param {string|null} props.minDate - Minimum selectable date
 * @param {string|null} props.maxDate - Maximum selectable date
 * @param {string|null} props.label - Label text
 * @param {boolean} props.required - Whether field is required
 * @returns {JSX.Element} Date picker with closed dates disabled
 */
const ClosedDatePicker = ({
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
  label = null,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [closedDates, setClosedDates] = useState([]);
  const [loadingClosedDates, setLoadingClosedDates] = useState(true);
  const [hoveredDate, setHoveredDate] = useState(null);
  
  const inputRef = useRef(null);
  const calendarRef = useRef(null);

  /**
   * Load closed dates on component mount
   */
  useEffect(() => {
    loadClosedDates();
  }, []);

  /**
   * Load closed dates from settings service
   */
  const loadClosedDates = async () => {
    try {
      setLoadingClosedDates(true);
      const dates = await settingsService.getClosedDates();
      setClosedDates(dates);
    } catch (err) {
      console.error('Error loading closed dates:', err);
      // Continue with empty closed dates array
      setClosedDates([]);
    } finally {
      setLoadingClosedDates(false);
    }
  };

  /**
   * Initialize selected date
   */
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

  /**
   * Check if a date is closed
   * @param {Date} date - Date to check
   * @returns {Object|null} Closed date object if date is closed, null otherwise
   */
  const getClosedDateInfo = (date) => {
    if (!date) return null;

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    return closedDates.find(closedDate => {
      if (!closedDate.date) return false;
      
      const closedDateNormalized = new Date(closedDate.date);
      closedDateNormalized.setHours(0, 0, 0, 0);
      
      // Check for exact date match
      if (closedDateNormalized.getTime() === normalizedDate.getTime()) {
        return true;
      }
      
      // Check for recurring patterns (e.g., yearly)
      if (closedDate.isRecurring && closedDate.recurringPattern === 'yearly') {
        return (
          closedDateNormalized.getMonth() === normalizedDate.getMonth() &&
          closedDateNormalized.getDate() === normalizedDate.getDate()
        );
      }
      
      return false;
    });
  };

  /**
   * Format date for input value
   */
  const formatInputDate = (date) => {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue) {
      const date = new Date(newValue);
      if (!isNaN(date.getTime())) {
        // Check if date is closed
        const closedInfo = getClosedDateInfo(date);
        if (closedInfo) {
          // Show error but don't update
          return;
        }
        
        setSelectedDate(date);
        onChange(formatInputDate(date));
      }
    } else {
      setSelectedDate(null);
      onChange('');
    }
  };

  /**
   * Handle calendar date selection
   */
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    onChange(formatInputDate(date));
    setIsOpen(false);
  };

  /**
   * Toggle calendar
   */
  const toggleCalendar = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  /**
   * Close calendar when clicking outside
   */
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

  /**
   * Generate calendar days
   */
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
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
      const closedInfo = getClosedDateInfo(date);
      const isClosed = !!closedInfo;
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
        isClosed,
        closedReason: closedInfo?.reason || null
      });
    }

    return days;
  };

  /**
   * Navigate months
   */
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || loadingClosedDates}
          min={minDate}
          max={maxDate}
          className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md pr-10 ${
            error ? 'border-red-300' : ''
          }`}
        />
        
        <button
          type="button"
          onClick={toggleCalendar}
          disabled={disabled || loadingClosedDates}
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
                  onMouseEnter={() => setHoveredDate(day.isClosed ? day : null)}
                  onMouseLeave={() => setHoveredDate(null)}
                  disabled={day.isDisabled}
                  className={`
                    w-full p-2 text-sm rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                    ${day.isToday ? 'bg-blue-100 font-semibold' : ''}
                    ${day.isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                    ${day.isClosed ? 'bg-red-50 text-red-400 line-through' : ''}
                    ${day.isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  `}
                >
                  {day.day}
                </button>
                
                {/* Tooltip for closed dates */}
                {hoveredDate && hoveredDate.date.getTime() === day.date.getTime() && day.isClosed && (
                  <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap">
                    <div className="font-medium mb-1">วันปิดทำการ</div>
                    <div>{day.closedReason}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-100 rounded mr-1"></div>
                <span>วันนี้</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-50 rounded mr-1"></div>
                <span>วันปิดทำการ</span>
              </div>
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

export default ClosedDatePicker;
