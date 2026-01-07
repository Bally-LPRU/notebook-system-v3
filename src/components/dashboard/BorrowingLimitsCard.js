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
    maxItems,
    maxDays,
    maxAdvanceBookingDays,
    userTypeName,
    isEnabled,
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">สิทธิ์การยืม</h3>
        {isEnabled && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
            {userTypeName}
          </span>
        )}
      </div>

      {/* Warning message */}
      {warning && (
        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          {warning}
        </div>
      )}

      {/* Quota Progress - Compact */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">โควต้า</span>
          <span className="text-xs text-gray-600">
            {currentBorrowedCount + pendingRequestsCount}/{maxItems}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${getProgressBarColor()}`}
            style={{ width: `${quotaPercentage}%` }}
          ></div>
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>ยืม: {currentBorrowedCount} | รอ: {pendingRequestsCount}</span>
          <span className={remainingQuota === 0 ? 'text-red-600' : 'text-green-600'}>
            เหลือ: {remainingQuota}
          </span>
        </div>
      </div>

      {/* Limits - Compact inline */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 bg-gray-100 rounded">สูงสุด {maxItems} ชิ้น</span>
        <span className="px-2 py-1 bg-gray-100 rounded">ยืมได้ {maxDays} วัน</span>
        <span className="px-2 py-1 bg-gray-100 rounded">จองล่วงหน้า {maxAdvanceBookingDays} วัน</span>
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
