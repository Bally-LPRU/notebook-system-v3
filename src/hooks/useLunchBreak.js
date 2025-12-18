/**
 * useLunchBreak Hook
 * 
 * Hook สำหรับจัดการเวลาพักกลางวัน
 * - ดึงการตั้งค่าเวลาพักกลางวันจาก settings
 * - ตรวจสอบว่าเวลาที่เลือกอยู่ในช่วงพักกลางวันหรือไม่
 * - สร้าง time slots ที่ไม่รวมเวลาพักกลางวัน
 */

import { useMemo, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { DEFAULT_LUNCH_BREAK } from '../types/settings';

/**
 * Parse time string to minutes from midnight
 * @param {string} timeStr - Time string in HH:mm format
 * @returns {number} Minutes from midnight
 */
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/**
 * Format minutes to time string
 * @param {number} minutes - Minutes from midnight
 * @returns {string} Time string in HH:mm format
 */
const formatMinutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * useLunchBreak Hook
 * @returns {Object} Lunch break utilities
 */
const useLunchBreak = () => {
  const { settings, loading } = useSettings();

  // Get lunch break settings with defaults
  const lunchBreak = useMemo(() => {
    const lb = settings?.lunchBreak || DEFAULT_LUNCH_BREAK;
    return {
      enabled: lb.enabled !== false,
      startTime: lb.startTime || DEFAULT_LUNCH_BREAK.startTime,
      endTime: lb.endTime || DEFAULT_LUNCH_BREAK.endTime,
      message: lb.message || DEFAULT_LUNCH_BREAK.message
    };
  }, [settings?.lunchBreak]);

  // Parse lunch break times to minutes
  const lunchBreakMinutes = useMemo(() => ({
    start: parseTimeToMinutes(lunchBreak.startTime),
    end: parseTimeToMinutes(lunchBreak.endTime)
  }), [lunchBreak.startTime, lunchBreak.endTime]);

  /**
   * Check if a time is during lunch break
   * @param {string} timeStr - Time string in HH:mm format
   * @returns {boolean} True if time is during lunch break
   */
  const isLunchBreakTime = useCallback((timeStr) => {
    if (!lunchBreak.enabled) return false;
    
    const timeMinutes = parseTimeToMinutes(timeStr);
    return timeMinutes >= lunchBreakMinutes.start && timeMinutes < lunchBreakMinutes.end;
  }, [lunchBreak.enabled, lunchBreakMinutes]);

  /**
   * Check if a time range overlaps with lunch break
   * @param {string} startTime - Start time in HH:mm format
   * @param {string} endTime - End time in HH:mm format
   * @returns {boolean} True if range overlaps with lunch break
   */
  const overlapsLunchBreak = useCallback((startTime, endTime) => {
    if (!lunchBreak.enabled) return false;
    
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    // Check if ranges overlap
    return startMinutes < lunchBreakMinutes.end && endMinutes > lunchBreakMinutes.start;
  }, [lunchBreak.enabled, lunchBreakMinutes]);

  /**
   * Generate time slots excluding lunch break
   * @param {number} startHour - Start hour (default 8)
   * @param {number} endHour - End hour (default 18)
   * @param {number} intervalMinutes - Interval in minutes (default 30)
   * @returns {Array<{time: string, disabled: boolean, isLunchBreak: boolean}>}
   */
  const generateTimeSlots = useCallback((startHour = 8, endHour = 18, intervalMinutes = 30) => {
    const slots = [];
    const startMinutes = startHour * 60;
    const endMinutes = endHour * 60;

    for (let minutes = startMinutes; minutes < endMinutes; minutes += intervalMinutes) {
      const timeStr = formatMinutesToTime(minutes);
      const isLunch = isLunchBreakTime(timeStr);
      
      slots.push({
        time: timeStr,
        disabled: isLunch,
        isLunchBreak: isLunch
      });
    }

    return slots;
  }, [isLunchBreakTime]);

  /**
   * Get available time slots (excluding lunch break)
   * @param {number} startHour - Start hour
   * @param {number} endHour - End hour
   * @param {number} intervalMinutes - Interval in minutes
   * @returns {Array<string>} Array of available time strings
   */
  const getAvailableTimeSlots = useCallback((startHour = 8, endHour = 18, intervalMinutes = 30) => {
    return generateTimeSlots(startHour, endHour, intervalMinutes)
      .filter(slot => !slot.disabled)
      .map(slot => slot.time);
  }, [generateTimeSlots]);

  /**
   * Validate expected return time against lunch break
   * @param {string} timeStr - Time string in HH:mm format
   * @returns {{valid: boolean, message: string|null}}
   */
  const validateReturnTime = useCallback((timeStr) => {
    if (!lunchBreak.enabled) {
      return { valid: true, message: null };
    }

    if (isLunchBreakTime(timeStr)) {
      return {
        valid: false,
        message: `ไม่สามารถคืนอุปกรณ์ในช่วงเวลาพักกลางวัน (${lunchBreak.startTime} - ${lunchBreak.endTime} น.)`
      };
    }

    return { valid: true, message: null };
  }, [lunchBreak, isLunchBreakTime]);

  // Compute display values with safe defaults
  const lunchBreakDisplay = lunchBreak.enabled 
    ? `${lunchBreak.startTime || '12:00'} - ${lunchBreak.endTime || '13:00'} น.`
    : null;
    
  const lunchBreakMessageValue = lunchBreak.enabled 
    ? (lunchBreak.message || `พักกลางวัน ${lunchBreakDisplay} ไม่สามารถรับ-คืนอุปกรณ์ได้`)
    : null;

  return {
    // Settings
    lunchBreak,
    loading,
    
    // Utilities
    isLunchBreakTime,
    overlapsLunchBreak,
    generateTimeSlots,
    getAvailableTimeSlots,
    validateReturnTime,
    
    // Display helpers (always return string or null, never undefined)
    lunchBreakDisplay,
    lunchBreakMessage: lunchBreakMessageValue
  };
};

export default useLunchBreak;
