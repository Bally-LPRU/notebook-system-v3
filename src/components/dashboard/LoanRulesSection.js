/**
 * LoanRulesSection Component
 * 
 * Displays loan rules and regulations from admin settings.
 * Shows loanReturnStartTime, loanReturnEndTime, lunchBreak, and upcoming closedDates.
 * 
 * Requirements: 1.6, 1.7, 1.8, 1.9
 * 
 * @module components/dashboard/LoanRulesSection
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Format time string for display
 * @param {string|null} time - Time in HH:mm format
 * @returns {string} Formatted time string
 */
const formatTime = (time) => {
  if (!time) return null;
  return time;
};

/**
 * Format date for display (short)
 * @param {Date|Object} date - Date object or Firestore Timestamp
 * @returns {string} Formatted date string (short)
 */
const formatDateShort = (date) => {
  if (!date) return '';
  
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  
  return dateObj.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short'
  });
};

/**
 * Get next upcoming closed date (within next 30 days)
 * @param {Array} closedDates - Array of closed date objects
 * @returns {Object|null} Next closed date or null
 */
const getNextClosedDate = (closedDates) => {
  if (!closedDates || !Array.isArray(closedDates)) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const upcoming = closedDates
    .filter(item => {
      const date = item.date?.toDate ? item.date.toDate() : new Date(item.date);
      return date >= today && date <= thirtyDaysFromNow;
    })
    .sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateA - dateB;
    });
  
  return upcoming.length > 0 ? upcoming[0] : null;
};

/**
 * LoanRulesSection Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.settings - System settings object
 * @param {number} props.settings.maxAdvanceBookingDays - Maximum advance booking days
 * @param {string|null} props.settings.loanReturnStartTime - Loan return start time
 * @param {string|null} props.settings.loanReturnEndTime - Loan return end time
 * @param {Array} props.closedDates - Array of closed date objects
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} LoanRulesSection component
 */
const LoanRulesSection = ({
  settings,
  closedDates = [],
  loading = false
}) => {
  const nextClosedDate = useMemo(
    () => getNextClosedDate(closedDates),
    [closedDates]
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const {
    loanReturnStartTime,
    loanReturnEndTime,
    lunchBreak
  } = settings || {};

  const hasReturnTimeRestriction = loanReturnStartTime && loanReturnEndTime;
  const hasLunchBreak = lunchBreak?.enabled && lunchBreak?.startTime && lunchBreak?.endTime;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-2">กฎระเบียบ</h3>

      <div className="space-y-2">
        {/* Return Time & Lunch Break - Compact */}
        <div className="flex flex-wrap gap-2 text-xs">
          {hasReturnTimeRestriction && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
              คืน {formatTime(loanReturnStartTime)}-{formatTime(loanReturnEndTime)} น.
            </span>
          )}
          {hasLunchBreak && (
            <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded">
              พักเที่ยง {formatTime(lunchBreak.startTime)}-{formatTime(lunchBreak.endTime)} น.
            </span>
          )}
          <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded">คืนตามกำหนด</span>
        </div>

        {/* Next Closed Date - Compact (1 วัน) */}
        {nextClosedDate && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">วันปิดถัดไป:</span>
              <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded" title={nextClosedDate.reason || ''}>
                {formatDateShort(nextClosedDate.date)}
                {nextClosedDate.reason && ` (${nextClosedDate.reason})`}
              </span>
            </div>
          </div>
        )}

        {/* No upcoming closed dates */}
        {!nextClosedDate && (
          <div className="pt-2 border-t border-gray-200">
            <span className="text-xs text-green-600">✓ ไม่มีวันปิดทำการใน 30 วันข้างหน้า</span>
          </div>
        )}
      </div>
    </div>
  );
};

LoanRulesSection.propTypes = {
  settings: PropTypes.shape({
    maxAdvanceBookingDays: PropTypes.number,
    loanReturnStartTime: PropTypes.string,
    loanReturnEndTime: PropTypes.string,
    lunchBreak: PropTypes.shape({
      enabled: PropTypes.bool,
      startTime: PropTypes.string,
      endTime: PropTypes.string,
      message: PropTypes.string
    })
  }),
  closedDates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      date: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
      reason: PropTypes.string
    })
  ),
  loading: PropTypes.bool
};

export default LoanRulesSection;
