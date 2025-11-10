import React, { useState, useMemo } from 'react';
import { useEquipmentReservations } from '../../hooks/useReservations';
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
 */
const ReservationCalendar = ({ 
  equipmentId, 
  selectedDate, 
  onDateSelect, 
  onTimeSlotSelect,
  className = '' 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  
  const {
    reservations,
    timeSlots,
    loading,
    error,
    refresh
  } = useEquipmentReservations(equipmentId, selectedDate);

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

  // Check if date is selectable
  const isDateSelectable = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + TIME_SLOTS_CONFIG.ADVANCE_BOOKING_DAYS);
    
    return date >= today && date <= maxDate;
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
      {/* Calendar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            ปฏิทินการจอง
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="เดือนก่อนหน้า"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h4 className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
              {formatMonthYear(currentMonth)}
            </h4>
            
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="เดือนถัดไป"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>ว่าง</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span>มีการจอง</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>ไม่สามารถจองได้</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {/* Day headers */}
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
            <div key={index} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const isSelectable = isDateSelectable(date);
            const reservationCount = getDayReservationCount(date);
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={!isSelectable}
                className={`
                  p-2 text-sm rounded-lg transition-colors relative
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isToday ? 'bg-blue-100 text-blue-900 font-semibold' : ''}
                  ${isSelected ? 'bg-blue-500 text-white' : ''}
                  ${isSelectable && !isSelected ? 'hover:bg-gray-100' : ''}
                  ${!isSelectable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
              >
                {date.getDate()}
                {reservationCount > 0 && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              ช่วงเวลาที่ว่าง - {formatReservationDate(selectedDate)}
            </h4>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-red-600 mb-2">{error}</p>
                <button
                  onClick={refresh}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ลองใหม่
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleTimeSlotClick(slot)}
                    disabled={!slot.available}
                    className={`
                      p-2 text-xs rounded border transition-colors
                      ${slot.available 
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                        : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                      }
                      ${selectedTimeSlot?.time === slot.time ? 'ring-2 ring-blue-500' : ''}
                    `}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}

            {/* Current Reservations */}
            {reservations.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">การจองในวันนี้</h5>
                <div className="space-y-2">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className={`p-3 rounded-lg border text-sm ${getStatusColorClass(reservation.status)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {formatReservationTime(reservation.startTime.toDate())} - {formatReservationTime(reservation.endTime.toDate())}
                          </p>
                          <p className="text-xs opacity-75 mt-1">
                            {reservation.purpose}
                          </p>
                        </div>
                        <span className="text-xs font-medium">
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