/**
 * BorrowingLimitsCard Component
 * 
 * Displays user's borrowing limits based on their user type.
 * Shows maxItems, maxDays, maxAdvanceBookingDays, currentBorrowedCount, and remainingQuota.
 * Supports both userTypeLimitsEnabled and disabled states.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 * 
 * @module components/dashboard/BorrowingLimitsCard
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * BorrowingLimitsCard Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.limits - User type limits object
 * @param {number} props.limits.maxItems - Maximum items allowed to borrow
 * @param {number} props.limits.maxDays - Maximum loan duration in days
 * @param {number} props.limits.maxAdvanceBookingDays - Maximum advance booking days
 * @param {string|null} props.limits.userType - User type (teacher/staff/student)
 * @param {string} props.limits.userTypeName - Thai label for user type
 * @param {boolean} props.limits.isEnabled - Whether user type limits are enabled
 * @param {boolean} props.limits.isDefault - Whether using default limits
 * @param {string|null} props.limits.warning - Warning message if any
 * @param {number} props.currentBorrowedCount - Current borrowed items count
 * @param {number} props.pendingRequestsCount - Pending requests count
 * @param {number} props.remainingQuota - Remaining quota
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} BorrowingLimitsCard component
 */
const BorrowingLimitsCard = ({
  limits,
  currentBorrowedCount,
  pendingRequestsCount,
  remainingQuota,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/3 mb-3 sm:mb-4"></div>
        <div className="space-y-2 sm:space-y-3">
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const {
    maxItems,
    maxDays,
    maxAdvanceBookingDays,
    userTypeName,
    isEnabled,
    isDefault,
    warning
  } = limits;

  // Calculate quota percentage for progress bar
  const quotaPercentage = maxItems > 0 
    ? Math.min(100, ((currentBorrowedCount + pendingRequestsCount) / maxItems) * 100)
    : 0;

  // Determine progress bar color based on remaining quota
  const getProgressBarColor = () => {
    if (remainingQuota === 0) return 'bg-red-500';
    if (remainingQuota <= Math.ceil(maxItems * 0.25)) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900">
          สิทธิ์การยืมอุปกรณ์
        </h3>
        {isEnabled && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {userTypeName}
          </span>
        )}
      </div>

      {/* Warning message if user type not set */}
      {warning && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs sm:text-sm text-yellow-800">{warning}</p>
          </div>
        </div>
      )}

      {/* Quota Progress */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs sm:text-sm font-medium text-gray-700">โควต้าการยืม</span>
          <span className="text-xs sm:text-sm text-gray-600">
            {currentBorrowedCount + pendingRequestsCount} / {maxItems} ชิ้น
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${quotaPercentage}%` }}
          ></div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1 text-xs text-gray-500">
          <span className="text-center sm:text-left">ยืม: {currentBorrowedCount}</span>
          <span className="text-center">รอ: {pendingRequestsCount}</span>
          <span className={`text-center sm:text-right ${remainingQuota === 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}`}>
            เหลือ: {remainingQuota}
          </span>
        </div>
      </div>

      {/* Limits Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-gray-50 rounded-lg p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-1 sm:mb-0">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mx-auto sm:mx-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="sm:ml-3 text-center sm:text-left">
              <p className="text-xs text-gray-500">สูงสุด</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900">{maxItems} ชิ้น</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-1 sm:mb-0">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mx-auto sm:mx-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="sm:ml-3 text-center sm:text-left">
              <p className="text-xs text-gray-500">ระยะเวลา</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900">{maxDays} วัน</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-1 sm:mb-0">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 mx-auto sm:mx-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="sm:ml-3 text-center sm:text-left">
              <p className="text-xs text-gray-500">ล่วงหน้า</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900">{maxAdvanceBookingDays} วัน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info about limits source */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          {isEnabled ? (
            isDefault ? (
              <>ค่าเริ่มต้น: {userTypeName}</>
            ) : (
              <>สิทธิ์: {userTypeName}</>
            )
          ) : (
            <>ค่าเริ่มต้นระบบ</>
          )}
        </p>
      </div>
    </div>
  );
};

BorrowingLimitsCard.propTypes = {
  limits: PropTypes.shape({
    maxItems: PropTypes.number.isRequired,
    maxDays: PropTypes.number.isRequired,
    maxAdvanceBookingDays: PropTypes.number.isRequired,
    userType: PropTypes.string,
    userTypeName: PropTypes.string.isRequired,
    isEnabled: PropTypes.bool.isRequired,
    isDefault: PropTypes.bool.isRequired,
    warning: PropTypes.string
  }).isRequired,
  currentBorrowedCount: PropTypes.number.isRequired,
  pendingRequestsCount: PropTypes.number.isRequired,
  remainingQuota: PropTypes.number.isRequired,
  loading: PropTypes.bool
};

export default BorrowingLimitsCard;
