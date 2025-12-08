/**
 * LoanRulesSection Component
 * 
 * Displays loan rules and regulations from admin settings.
 * Shows loanReturnStartTime, loanReturnEndTime, upcoming closedDates, and maxAdvanceBookingDays.
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
 * Format date for display
 * @param {Date|Object} date - Date object or Firestore Timestamp
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  if (!date) return '';
  
  // Handle Firestore Timestamp
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  
  return dateObj.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Get upcoming closed dates (within next 30 days)
 * @param {Array} closedDates - Array of closed date objects
 * @returns {Array} Filtered and sorted upcoming closed dates
 */
const getUpcomingClosedDates = (closedDates) => {
  if (!closedDates || !Array.isArray(closedDates)) return [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  return closedDates
    .filter(item => {
      const date = item.date?.toDate ? item.date.toDate() : new Date(item.date);
      return date >= today && date <= thirtyDaysFromNow;
    })
    .sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateA - dateB;
    })
    .slice(0, 5); // Show max 5 upcoming dates
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
  const upcomingClosedDates = useMemo(
    () => getUpcomingClosedDates(closedDates),
    [closedDates]
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const {
    maxAdvanceBookingDays,
    loanReturnStartTime,
    loanReturnEndTime
  } = settings || {};

  const hasReturnTimeRestriction = loanReturnStartTime && loanReturnEndTime;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        กฎระเบียบการยืม-คืน
      </h3>

      <div className="space-y-4">
        {/* Return Time Restriction */}
        {hasReturnTimeRestriction && (
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">เวลาคืนอุปกรณ์</p>
              <p className="text-sm text-gray-600">
                สามารถคืนอุปกรณ์ได้ในช่วงเวลา {formatTime(loanReturnStartTime)} - {formatTime(loanReturnEndTime)} น.
              </p>
            </div>
          </div>
        )}

        {/* Advance Booking Limit */}
        {maxAdvanceBookingDays && (
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">การจองล่วงหน้า</p>
              <p className="text-sm text-gray-600">
                สามารถจองอุปกรณ์ล่วงหน้าได้ไม่เกิน {maxAdvanceBookingDays} วัน
              </p>
            </div>
          </div>
        )}

        {/* General Rules */}
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">ข้อควรทราบ</p>
            <ul className="text-sm text-gray-600 list-disc list-inside mt-1 space-y-1">
              <li>กรุณาคืนอุปกรณ์ตามกำหนดเวลา</li>
              <li>หากคืนล่าช้าอาจมีผลต่อสิทธิ์การยืมครั้งต่อไป</li>
              <li>ตรวจสอบสภาพอุปกรณ์ก่อนรับและคืน</li>
            </ul>
          </div>
        </div>

        {/* Upcoming Closed Dates */}
        {upcomingClosedDates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">วันปิดทำการที่กำลังจะมาถึง</p>
                <div className="mt-2 space-y-2">
                  {upcomingClosedDates.map((item, index) => (
                    <div 
                      key={item.id || index}
                      className="flex items-center justify-between bg-red-50 rounded-md px-3 py-2"
                    >
                      <span className="text-sm text-red-800">
                        {formatDate(item.date)}
                      </span>
                      {item.reason && (
                        <span className="text-xs text-red-600 ml-2">
                          ({item.reason})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No upcoming closed dates message */}
        {upcomingClosedDates.length === 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-500">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              ไม่มีวันปิดทำการในช่วง 30 วันข้างหน้า
            </div>
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
    loanReturnEndTime: PropTypes.string
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
