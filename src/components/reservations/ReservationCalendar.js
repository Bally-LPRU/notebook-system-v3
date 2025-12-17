import React, { useState, useMemo } from 'react';
import { useEquipmentReservations } from '../../hooks/useReservations';
import { useClosedDates } from '../../hooks/useClosedDates';
import { useSettings } from '../../contexts/SettingsContext';
import { 
  RESERVATION_STATUS_COLORS,
  RESERVATION_STATUS_LABELS,
  formatReservationDate,
  formatReservationTime,
  TIME_SLOTS_CONFIG
} from '../../types/reservation';

/**
 * ReservationCalendar Component
 * แสดงปฏิทินความพร้อมใช้งานของอุปกรณ์
 * 
 * Features:
 * - เชื่อมโยงกับวันปิดทำการที่ admin กำหนด
 * - ใช้เวลาคืนอุปกรณ์จากการตั้งค่าระบบ (ลบ 1 ชั่วโมงจากเวลาสิ้นสุด)
 */
const ReservationCalendar = ({ 
  equipmentId, 
  selectedDate, 
  onDateSelect, 
  onTimeSlotSelect,
  maxAdvanceBookingDays,
  className = '' 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  
  const {
    reservations,
    timeSlots: rawTimeSlots,
    loading,
    error,
    refresh
  } = useEquipmentReservations(equipmentId, selectedDate);

  // Get closed dates from admin settings
  const { closedDates, isDateClosed, loading: closedDatesLoading } = useClosedDates();
  
  // Get system settings for return time window
  const { settings, loading: settingsLoading } = useSettings();

  /**
   * Parse time string to hours and minutes
   * @param {string} timeStr - Time in HH:mm format
   * @returns {{ hours: number, minutes: number }}
   */
  const parseTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return { hours, minutes };
  };

  /**
   * Get effective time range from admin settings
   * - Start time: loanReturnStartTime or default 8:00
   * - End time: loanReturnEndTime - 1 hour (to allow time for return process)
   */
  const effectiveTimeRange = useMemo(() => {
    const defaultStart = TIME_SLOTS_CONFIG.START_HOUR; // 8
    const defaultEnd = TIME_SLOTS_CONFIG.END_HOUR; // 18

    // Parse admin settings
    const startTimeParsed = parseTime(settings?.loanReturnStartTime);
    const endTimeParsed = parseTime(settings?.loanReturnEndTime);

    // Use admin settings if available, otherwise use defaults
    const startHour = startTimeParsed ? startTimeParsed.hours : defaultStart;
    
    // End time: subtract 1 hour from admin setting to allow return process time
    // e.g., if admin sets 17:00 (5 PM), last booking slot is 16:00 (4 PM)
    let endHour = endTimeParsed ? endTimeParsed.hours - 1 : defaultEnd;
    
    // Ensure end hour is at least 1 hour after start hour
    if (endHour <= startHour) {
      endHour = startHour + 1;
    }

    return { startHour, endHour };
  }, [settings?.loanReturnStartTime, settings?.loanReturnEndTime]);

  /**
   * Filter time slots based on admin settings
   * - Remove slots outside the effective time range
   */
  const timeSlots = useMemo(() => {
    if (!rawTimeSlots || rawTimeSlots.length === 0) return [];

    const { startHour, endHour } = effectiveTimeRange;

    return rawTimeSlots.filter(slot => {
      const parsed = parseTime(slot.time);
      if (!parsed) return false;
      
      // Only include slots within the effective time range
      return parsed.hours >= startHour && parsed.hours < endHour;
    });
  }, [rawTimeSlots, effectiveTimeRange]);

  /**
   * Get reason for closed date
   * @param {Date} date - Date to check
   * @returns {string|null} Reason or null if not closed
   */
  const getClosedDateReason = (date) => {
    if (!date || !closedDates || closedDates.length === 0) return null;
    
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const closedDate = closedDates.find(cd => {
      if (!cd.date) return false;
      const cdNormalized = new Date(cd.date);
      cdNormalized.setHours(0, 0, 0, 0);
      
      // Check exact match
      if (cdNormalized.getTime() === normalizedDate.getTime()) {
        return true;
      }
      
      // Check recurring yearly
      if (cd.isRecurring && cd.recurringPattern === 'yearly') {
        return (
          cdNormalized.getMonth() === normalizedDate.getMonth() &&
          cdNormalized.getDate() === normalizedDate.getDate()
        );
      }
      
      return false;
    });

    return closedDate?.reason || null;
  };

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [currentMonth]);

  // Get reservation count for each day
  const getDayReservationCount = (date) => {
    // This would require fetching reservations for each day
    // For now, return 0 as placeholder
    return 0;
  };

  // Check if date is selectable based on user's maxAdvanceBookingDays and closed dates
  // Requirements: 5.2 - limit date picker to maximum advance booking days for user's type
  const isDateSelectable = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Use user-specific maxAdvanceBookingDays if provided, otherwise use default from config
    const advanceBookingLimit = maxAdvanceBookingDays || TIME_SLOTS_CONFIG.ADVANCE_BOOKING_DAYS;
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceBookingLimit);
    maxDate.setHours(23, 59, 59, 999);
    
    // Check basic date range
    if (date < today || date > maxDate) {
      return false;
    }
    
    // Check if date is a closed date (admin setting)
    if (isDateClosed(date)) {
      return false;
    }
    
    return true;
  };

  /**
   * Check if date is closed (for styling purposes)
   * @param {Date} date - Date to check
   * @returns {boolean} True if date is closed
   */
  const isClosedDate = (date) => {
    return isDateClosed(date);
  };

  // Handle date selection
  const handleDateClick = (date) => {
    if (!isDateSelectable(date)) return;
    
    onDateSelect(date);
    setSelectedTimeSlot(null);
  };

  // Handle time slot selection
  const handleTimeSlotClick = (timeSlot) => {
    if (!timeSlot.available) return;
    
    setSelectedTimeSlot(timeSlot);
    if (onTimeSlotSelect) {
      onTimeSlotSelect(timeSlot);
    }
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Format month/year for display
  const formatMonthYear = (date) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  // Get status color class
  const getStatusColorClass = (status) => {
    const colorMap = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return colorMap[RESERVATION_STATUS_COLORS[status]] || colorMap.gray;
  };

  if (!equipmentId) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>กรุณาเลือกอุปกรณ์เพื่อดูปฏิทินการจอง</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Calendar Header - Mobile Optimized */}
      <div className="p-3 sm:p-4 border-b">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
            ปฏิทินการจอง
          </h3>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="เดือนก่อนหน้า"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h4 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 min-w-[120px] sm:min-w-[160px] lg:min-w-[200px] text-center">
              {formatMonthYear(currentMonth)}
            </h4>
            
            <button
              onClick={goToNextMonth}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="เดือนถัดไป"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Legend - Mobile: Compact 2x2 grid */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-200 rounded"></div>
            <span>ว่าง</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-200 rounded"></div>
            <span>มีการจอง</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-200 rounded"></div>
            <span>ปิดทำการ</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-200 rounded"></div>
            <span>จองไม่ได้</span>
          </div>
        </div>

        {/* Return Time Info - Hidden on mobile, shown on larger screens */}
        {settings?.loanReturnEndTime && (
          <div className="hidden sm:block mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <span className="font-medium">หมายเหตุ:</span> ช่วงเวลาจองสิ้นสุดก่อนเวลาคืนอุปกรณ์ 1 ชั่วโมง 
            (เวลาคืน: {settings.loanReturnStartTime || '08:00'} - {settings.loanReturnEndTime})
          </div>
        )}
      </div>

      <div className="p-2 sm:p-4">
        {/* Calendar Grid - Mobile Optimized */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-3 sm:mb-4">
          {/* Day headers */}
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
            <div key={index} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const isSelectable = isDateSelectable(date);
            const isClosed = isClosedDate(date);
            const closedReason = isClosed ? getClosedDateReason(date) : null;
            const reservationCount = getDayReservationCount(date);
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={!isSelectable}
                title={closedReason ? `วันปิดทำการ: ${closedReason}` : undefined}
                className={`
                  p-1 sm:p-2 text-xs sm:text-sm rounded sm:rounded-lg transition-colors relative aspect-square flex items-center justify-center
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isToday && !isClosed ? 'bg-blue-100 text-blue-900 font-semibold' : ''}
                  ${isSelected ? 'bg-blue-500 text-white' : ''}
                  ${isClosed && isCurrentMonth ? 'bg-red-100 text-red-600' : ''}
                  ${isSelectable && !isSelected ? 'hover:bg-gray-100 active:bg-gray-200' : ''}
                  ${!isSelectable && !isClosed ? 'cursor-not-allowed opacity-50' : ''}
                  ${isClosed ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {date.getDate()}
                {reservationCount > 0 && !isClosed && (
                  <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></div>
                )}
                {isClosed && isCurrentMonth && (
                  <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Time Slots - Mobile Optimized */}
        {selectedDate && (
          <div className="border-t pt-3 sm:pt-4">
            <h4 className="text-xs sm:text-sm lg:text-md font-medium text-gray-900 mb-2 sm:mb-3">
              ช่วงเวลาที่ว่าง - {formatReservationDate(selectedDate)}
            </h4>

            {/* Show closed date message */}
            {isClosedDate(selectedDate) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 text-red-700">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm sm:text-base font-medium">วันปิดทำการ</span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-red-600">
                  {getClosedDateReason(selectedDate) || 'ไม่สามารถจองได้ในวันนี้'}
                </p>
              </div>
            )}
            
            {loading || closedDatesLoading || settingsLoading ? (
              <div className="flex justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-3 sm:py-4">
                <p className="text-red-600 mb-2 text-sm">{error}</p>
                <button
                  onClick={refresh}
                  className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                >
                  ลองใหม่
                </button>
              </div>
            ) : isClosedDate(selectedDate) ? (
              // Don't show time slots for closed dates
              null
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-3 sm:py-4 text-gray-500 text-sm">
                <p>ไม่มีช่วงเวลาที่ว่างในวันนี้</p>
                {settings?.loanReturnEndTime && (
                  <p className="text-xs mt-1">
                    (ช่วงเวลาจอง: {effectiveTimeRange.startHour}:00 - {effectiveTimeRange.endHour}:00)
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5 sm:gap-2">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleTimeSlotClick(slot)}
                    disabled={!slot.available}
                    className={`
                      py-2 px-1 sm:p-2 text-xs rounded border transition-colors
                      ${slot.available 
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 active:bg-green-200' 
                        : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                      }
                      ${selectedTimeSlot?.time === slot.time ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                    `}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}

            {/* Current Reservations - Mobile Optimized */}
            {reservations.length > 0 && !isClosedDate(selectedDate) && (
              <div className="mt-3 sm:mt-4">
                <h5 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">การจองในวันนี้</h5>
                <div className="space-y-2">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className={`p-2 sm:p-3 rounded-lg border text-xs sm:text-sm ${getStatusColorClass(reservation.status)}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            {formatReservationTime(reservation.startTime)} - {formatReservationTime(reservation.endTime)}
                          </p>
                          <p className="text-xs opacity-75 mt-0.5 sm:mt-1 truncate">
                            {reservation.purpose}
                          </p>
                        </div>
                        <span className="text-xs font-medium flex-shrink-0">
                          {RESERVATION_STATUS_LABELS[reservation.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationCalendar;