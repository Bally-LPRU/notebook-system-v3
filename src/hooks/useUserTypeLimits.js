/**
 * useUserTypeLimits Hook
 * 
 * Custom hook for accessing user type-specific borrowing limits.
 * Integrates with SettingsContext and AuthContext to provide:
 * - User type limits (maxItems, maxDays, maxAdvanceBookingDays)
 * - Current borrowed count and pending requests count
 * - Remaining quota calculation
 * - Loading and error states
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 * 
 * @module hooks/useUserTypeLimits
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import LoanRequestService from '../services/loanRequestService';
import { 
  USER_TYPE_NAMES, 
  DEFAULT_USER_TYPE_LIMITS,
  DEFAULT_SETTINGS 
} from '../types/settings';
import { LOAN_REQUEST_STATUS } from '../types/loanRequest';

/**
 * Calculate remaining quota based on maxItems, borrowed count, and pending count
 * @param {number} maxItems - Maximum items allowed
 * @param {number} borrowedCount - Current borrowed count
 * @param {number} pendingCount - Pending requests count
 * @returns {number} Remaining quota (minimum 0)
 */
export const calculateRemainingQuota = (maxItems, borrowedCount, pendingCount) => {
  return Math.max(0, maxItems - borrowedCount - pendingCount);
};

/**
 * Get Thai label for user type
 * @param {string} userType - User type (teacher/staff/student)
 * @returns {string} Thai label for user type
 */
export const getUserTypeLabel = (userType) => {
  return USER_TYPE_NAMES[userType] || 'ไม่ระบุ';
};

/**
 * Get user type limits from settings or defaults
 * @param {Object} settings - System settings
 * @param {string} userType - User type
 * @returns {Object} User type limits
 */
export const getUserTypeLimitsFromSettings = (settings, userType) => {
  // Helper function to get system default limits
  const getSystemDefaults = () => ({
    maxItems: settings?.defaultCategoryLimit || DEFAULT_SETTINGS.defaultCategoryLimit,
    maxDays: settings?.maxLoanDuration || DEFAULT_SETTINGS.maxLoanDuration,
    maxAdvanceBookingDays: settings?.maxAdvanceBookingDays || DEFAULT_SETTINGS.maxAdvanceBookingDays,
    userType: userType || null,
    userTypeName: getUserTypeLabel(userType),
    isEnabled: false,
    isDefault: true
  });

  // Check if userTypeLimitsEnabled is true
  if (!settings?.userTypeLimitsEnabled) {
    // Return default system-wide limits
    return getSystemDefaults();
  }

  // Get user type specific limits from settings
  const userTypeLimits = settings?.userTypeLimits?.[userType];
  
  // Check if this user type has active limits configured
  if (userTypeLimits && userTypeLimits.isActive === true) {
    return {
      maxItems: userTypeLimits.maxItems ?? DEFAULT_USER_TYPE_LIMITS[userType]?.maxItems ?? 5,
      maxDays: userTypeLimits.maxDays ?? DEFAULT_USER_TYPE_LIMITS[userType]?.maxDays ?? 14,
      maxAdvanceBookingDays: userTypeLimits.maxAdvanceBookingDays ?? DEFAULT_USER_TYPE_LIMITS[userType]?.maxAdvanceBookingDays ?? 30,
      userType: userType,
      userTypeName: userTypeLimits.userTypeName || getUserTypeLabel(userType),
      isEnabled: true,
      isDefault: false
    };
  }

  // If userTypeLimitsEnabled is true but this specific user type is not active,
  // or user type is not set, use system defaults
  return getSystemDefaults();
};

/**
 * Custom hook for accessing user type-specific borrowing limits
 * 
 * @hook
 * @returns {Object} User type limits data and methods
 * @returns {Object} returns.limits - User type limits object
 * @returns {number} returns.limits.maxItems - Maximum items allowed to borrow
 * @returns {number} returns.limits.maxDays - Maximum loan duration in days
 * @returns {number} returns.limits.maxAdvanceBookingDays - Maximum advance booking days
 * @returns {string|null} returns.limits.userType - User type (teacher/staff/student)
 * @returns {string} returns.limits.userTypeName - Thai label for user type
 * @returns {boolean} returns.limits.isEnabled - Whether user type limits are enabled
 * @returns {boolean} returns.limits.isDefault - Whether using default limits
 * @returns {string|null} returns.limits.warning - Warning message if any
 * @returns {boolean} returns.loading - Loading state
 * @returns {Error|null} returns.error - Error object if any
 * @returns {number} returns.currentBorrowedCount - Current borrowed items count
 * @returns {number} returns.pendingRequestsCount - Pending requests count
 * @returns {number} returns.remainingQuota - Remaining quota
 * @returns {boolean} returns.canBorrow - Whether user can borrow more items
 * @returns {Function} returns.refresh - Function to refresh data
 */
export const useUserTypeLimits = () => {
  const { user, userProfile } = useAuth();
  const { settings, loading: settingsLoading, error: settingsError } = useSettings();
  
  const [currentBorrowedCount, setCurrentBorrowedCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch user's active loan requests to calculate counts
   */
  const fetchUserLoanCounts = useCallback(async () => {
    if (!user?.uid) {
      setCurrentBorrowedCount(0);
      setPendingRequestsCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get active requests for user
      const activeRequests = await LoanRequestService.getActiveRequestsForUser(user.uid);
      
      // Count borrowed items (status = borrowed)
      const borrowed = activeRequests.filter(
        req => req.status === LOAN_REQUEST_STATUS.BORROWED
      ).length;
      
      // Count pending requests (status = pending or approved but not picked up)
      const pending = activeRequests.filter(
        req => req.status === LOAN_REQUEST_STATUS.PENDING || 
               req.status === LOAN_REQUEST_STATUS.APPROVED
      ).length;

      setCurrentBorrowedCount(borrowed);
      setPendingRequestsCount(pending);
    } catch (err) {
      console.error('Error fetching user loan counts:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Fetch loan counts when user changes
  useEffect(() => {
    fetchUserLoanCounts();
  }, [fetchUserLoanCounts]);

  // Get user type from profile
  const userType = userProfile?.userType || null;

  // Get limits based on settings and user type
  const baseLimits = getUserTypeLimitsFromSettings(settings, userType);

  // Add warning if user type is not set
  const warning = !userType && settings?.userTypeLimitsEnabled
    ? 'กรุณาอัปเดตประเภทผู้ใช้ในโปรไฟล์เพื่อรับสิทธิ์การยืมที่เหมาะสม'
    : null;

  // Calculate remaining quota
  const remainingQuota = calculateRemainingQuota(
    baseLimits.maxItems,
    currentBorrowedCount,
    pendingRequestsCount
  );

  // Determine if user can borrow
  const canBorrow = remainingQuota > 0;

  // Combine limits with warning
  const limits = {
    ...baseLimits,
    warning
  };

  return {
    limits,
    loading: loading || settingsLoading,
    error: error || settingsError,
    currentBorrowedCount,
    pendingRequestsCount,
    remainingQuota,
    canBorrow,
    refresh: fetchUserLoanCounts
  };
};

export default useUserTypeLimits;
