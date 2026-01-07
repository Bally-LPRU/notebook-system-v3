/**
 * BorrowingLimitsCard Component
 * Updated with pastel colors and animations
 */

import React from 'react';
import PropTypes from 'prop-types';

const BorrowingLimitsCard = ({
  limits,
  currentBorrowedCount,
  pendingRequestsCount,
  remainingQuota,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded-full w-1/3 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded-full w-full mb-3"></div>
          <div className="h-8 bg-gray-200 rounded-xl w-full mb-4"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded-xl flex-1"></div>
            <div className="h-8 bg-gray-200 rounded-xl flex-1"></div>
            <div className="h-8 bg-gray-200 rounded-xl flex-1"></div>
          </div>
        </div>
      </div>
    );
  }

  const { maxItems, maxDays, maxAdvanceBookingDays, userTypeName, isEnabled, warning } = limits;

  const quotaPercentage = maxItems > 0 
    ? Math.min(100, ((currentBorrowedCount + pendingRequestsCount) / maxItems) * 100)
    : 0;

  const getProgressConfig = () => {
    if (remainingQuota === 0) return { bar: 'bg-rose-400', text: 'text-rose-600', bg: 'bg-rose-100' };
    if (remainingQuota <= Math.ceil(maxItems * 0.25)) return { bar: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-100' };
    return { bar: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-100' };
  };

  const progressConfig = getProgressConfig();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-violet-400 rounded-full"></span>
          สิทธิ์การยืม
        </h3>
        {isEnabled && (
          <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
            {userTypeName}
          </span>
        )}
      </div>

      {/* Warning message */}
      {warning && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-amber-800 flex items-center gap-2">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {warning}
        </div>
      )}

      {/* Quota Progress - Compact on mobile */}
      <div className="mb-4 sm:mb-5">
        <div className="flex justify-between items-center mb-1.5 sm:mb-2">
          <span className="text-xs sm:text-sm font-medium text-gray-600">โควต้าการยืม</span>
          <span className="text-xs sm:text-sm font-semibold text-gray-900">
            {currentBorrowedCount + pendingRequestsCount} / {maxItems}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 sm:h-3 overflow-hidden">
          <div
            className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${progressConfig.bar}`}
            style={{ width: `${quotaPercentage}%` }}
          ></div>
        </div>
        <div className="mt-1.5 sm:mt-2 flex flex-wrap justify-between text-xs sm:text-sm gap-1">
          <div className="flex gap-2 sm:gap-3">
            <span className="text-gray-500">
              <span className="font-medium text-blue-600">{currentBorrowedCount}</span> ยืม
            </span>
            <span className="text-gray-500">
              <span className="font-medium text-amber-600">{pendingRequestsCount}</span> รอ
            </span>
          </div>
          <span className={`font-semibold ${progressConfig.text}`}>
            เหลือ {remainingQuota}
          </span>
        </div>
      </div>

      {/* Limits Tags - Compact on mobile */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-100">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="text-xs sm:text-sm font-medium text-blue-700">{maxItems} ชิ้น</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-emerald-50 rounded-lg sm:rounded-xl border border-emerald-100">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs sm:text-sm font-medium text-emerald-700">{maxDays} วัน</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-orange-50 rounded-lg sm:rounded-xl border border-orange-100">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs sm:text-sm font-medium text-orange-700">ล่วงหน้า {maxAdvanceBookingDays} วัน</span>
        </div>
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
