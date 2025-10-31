/**
 * Reservation Type Definitions
 * Based on design document specifications
 */

// Reservation status constants
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

// Reservation status labels in Thai
export const RESERVATION_STATUS_LABELS = {
  [RESERVATION_STATUS.PENDING]: 'รอการอนุมัติ',
  [RESERVATION_STATUS.APPROVED]: 'อนุมัติแล้ว',
  [RESERVATION_STATUS.READY]: 'พร้อมรับอุปกรณ์',
  [RESERVATION_STATUS.COMPLETED]: 'เสร็จสิ้น',
  [RESERVATION_STATUS.CANCELLED]: 'ยกเลิก',
  [RESERVATION_STATUS.EXPIRED]: 'หมดอายุ'
};

// Reservation status colors for UI
export const RESERVATION_STATUS_COLORS = {
  [RESERVATION_STATUS.PENDING]: 'yellow',
  [RESERVATION_STATUS.APPROVED]: 'blue',
  [RESERVATION_STATUS.READY]: 'green',
  [RESERVATION_STATUS.COMPLETED]: 'gray',
  [RESERVATION_STATUS.CANCELLED]: 'red',
  [RESERVATION_STATUS.EXPIRED]: 'red'
};

/**
 * Reservation interface/type definition
 * @typedef {Object} Reservation
 * @property {string} id - Auto-generated ID
 * @property {string} equipmentId - Reference to Equipment
 * @property {string} userId - Reference to User
 * @property {Date} reservationDate - วันที่จอง
 * @property {Date} startTime - เวลาเริ่มต้น
 * @property {Date} endTime - เวลาสิ้นสุด
 * @property {string} purpose - วัตถุประสงค์
 * @property {string} notes - หมายเหตุ
 * @property {string} status - สถานะ (from RESERVATION_STATUS)
 * @property {string|null} approvedBy - UID ของผู้อนุมัติ
 * @property {Date|null} approvedAt - วันที่อนุมัติ
 * @property {boolean} notificationSent - ส่งการแจ้งเตือนแล้วหรือไม่
 * @property {Date} createdAt - วันที่สร้าง
 * @property {Date} updatedAt - วันที่อัปเดต
 */

/**
 * Reservation form data interface
 * @typedef {Object} ReservationFormData
 * @property {string} equipmentId
 * @property {string} reservationDate
 * @property {string} startTime
 * @property {string} endTime
 * @property {string} purpose
 * @property {string} notes
 */

/**
 * Calendar event interface for displaying reservations
 * @typedef {Object} CalendarEvent
 * @property {string} id - Reservation ID
 * @property {string} title - Event title
 * @property {Date} start - Start date/time
 * @property {Date} end - End date/time
 * @property {string} status - Reservation status
 * @property {string} color - Event color based on status
 * @property {Object} data - Additional reservation data
 */

/**
 * Time slot interface for calendar
 * @typedef {Object} TimeSlot
 * @property {string} time - Time string (HH:mm)
 * @property {boolean} available - Whether slot is available
 * @property {string|null} reservationId - ID of reservation if occupied
 * @property {string|null} status - Status of reservation if occupied
 */

/**
 * Reservation validation rules
 */
export const RESERVATION_VALIDATION = {
  equipmentId: {
    required: true
  },
  reservationDate: {
    required: true,
    minDate: new Date() // Cannot reserve in the past
  },
  startTime: {
    required: true
  },
  endTime: {
    required: true
  },
  purpose: {
    required: true,
    minLength: 5,
    maxLength: 200
  },
  notes: {
    required: false,
    maxLength: 500
  }
};

/**
 * Default reservation form values
 */
export const DEFAULT_RESERVATION_FORM = {
  equipmentId: '',
  reservationDate: '',
  startTime: '',
  endTime: '',
  purpose: '',
  notes: ''
};

/**
 * Time slots configuration
 */
export const TIME_SLOTS_CONFIG = {
  START_HOUR: 8, // 8:00 AM
  END_HOUR: 18, // 6:00 PM
  SLOT_DURATION: 60, // 60 minutes
  MIN_DURATION: 60, // Minimum reservation duration in minutes
  MAX_DURATION: 480, // Maximum reservation duration in minutes (8 hours)
  ADVANCE_BOOKING_DAYS: 30 // Maximum days in advance for booking
};

/**
 * Calendar view types
 */
export const CALENDAR_VIEWS = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day'
};

/**
 * Generate time slots for a day
 * @returns {Array<string>} Array of time strings
 */
export const generateTimeSlots = () => {
  const slots = [];
  const { START_HOUR, END_HOUR, SLOT_DURATION } = TIME_SLOTS_CONFIG;
  
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_DURATION) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  
  return slots;
};

/**
 * Check if a time slot is within business hours
 * @param {string} timeString - Time in HH:mm format
 * @returns {boolean} Whether the time is within business hours
 */
export const isWithinBusinessHours = (timeString) => {
  const [hour] = timeString.split(':').map(Number);
  const { START_HOUR, END_HOUR } = TIME_SLOTS_CONFIG;
  return hour >= START_HOUR && hour < END_HOUR;
};

/**
 * Calculate duration between two times in minutes
 * @param {string} startTime - Start time in HH:mm format
 * @param {string} endTime - End time in HH:mm format
 * @returns {number} Duration in minutes
 */
export const calculateDuration = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  return endMinutes - startMinutes;
};

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatReservationDate = (date) => {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(date);
};

/**
 * Format time for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted time string
 */
export const formatReservationTime = (date) => {
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};