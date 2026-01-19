/**
 * useStaffLoanManagement Hook
 * 
 * Custom hook for Staff loan management operations with:
 * - Audit logging
 * - Admin notifications
 * - Equipment availability checks
 * 
 * Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 10.1, 10.2, 12.1-12.5
 */

import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import StaffLoanManagementService from '../services/staffLoanManagementService';

/**
 * Custom hook for Staff loan management operations
 * @returns {Object} Staff loan management methods and state
 */
export const useStaffLoanManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  /**
   * Get staff info from current user
   */
  const getStaffInfo = useCallback(() => {
    return {
      displayName: user?.displayName || user?.email || 'Staff',
      email: user?.email || ''
    };
  }, [user]);

  /**
   * Approve a loan request with audit logging and admin notification
   * Requirements: 4.1, 4.4, 4.5, 10.1, 12.1
   * 
   * @param {string} loanRequestId - Loan request ID to approve
   * @returns {Promise<Object>} Result with success status and updated request
   */
  const approveLoanRequest = useCallback(async (loanRequestId) => {
    if (!user?.uid) {
      const result = {
        success: false,
        error: 'ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่',
        errorCode: 'USER_NOT_FOUND'
      };
      setError(result.error);
      setLastResult(result);
      return result;
    }

    setLoading(true);
    setError(null);

    try {
      const staffInfo = getStaffInfo();
      const result = await StaffLoanManagementService.approveLoanRequest(
        loanRequestId,
        user.uid,
        staffInfo
      );

      setLastResult(result);

      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'เกิดข้อผิดพลาดในการอนุมัติคำขอยืม';
      setError(errorMessage);
      const result = {
        success: false,
        error: errorMessage,
        errorCode: 'INTERNAL_ERROR'
      };
      setLastResult(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, [user, getStaffInfo]);

  /**
   * Reject a loan request with audit logging and admin notification
   * Requirements: 4.3, 4.4, 10.2, 12.2
   * 
   * @param {string} loanRequestId - Loan request ID to reject
   * @param {string} rejectionReason - Reason for rejection
   * @returns {Promise<Object>} Result with success status and updated request
   */
  const rejectLoanRequest = useCallback(async (loanRequestId, rejectionReason) => {
    if (!user?.uid) {
      const result = {
        success: false,
        error: 'ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่',
        errorCode: 'USER_NOT_FOUND'
      };
      setError(result.error);
      setLastResult(result);
      return result;
    }

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      const result = {
        success: false,
        error: 'กรุณาระบุเหตุผลในการปฏิเสธ (อย่างน้อย 10 ตัวอักษร)',
        errorCode: 'INVALID_REASON'
      };
      setError(result.error);
      setLastResult(result);
      return result;
    }

    setLoading(true);
    setError(null);

    try {
      const staffInfo = getStaffInfo();
      const result = await StaffLoanManagementService.rejectLoanRequest(
        loanRequestId,
        rejectionReason,
        user.uid,
        staffInfo
      );

      setLastResult(result);

      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'เกิดข้อผิดพลาดในการปฏิเสธคำขอยืม';
      setError(errorMessage);
      const result = {
        success: false,
        error: errorMessage,
        errorCode: 'INTERNAL_ERROR'
      };
      setLastResult(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, [user, getStaffInfo]);

  /**
   * Check equipment availability before approval
   * Requirement: 4.6
   * 
   * @param {string} equipmentId - Equipment ID to check
   * @returns {Promise<Object>} Availability check result
   */
  const checkEquipmentAvailability = useCallback(async (equipmentId) => {
    try {
      return await StaffLoanManagementService.checkEquipmentAvailability(equipmentId);
    } catch (err) {
      return {
        available: false,
        message: err.message || 'เกิดข้อผิดพลาดในการตรวจสอบสถานะอุปกรณ์',
        equipment: null
      };
    }
  }, []);

  /**
   * Process equipment return with audit logging and admin notification
   * Requirements: 5.4, 5.5, 5.6, 10.3, 12.3
   * 
   * @param {string} loanRequestId - Loan request ID to process return
   * @param {Object} returnData - Return data (condition, notes)
   * @returns {Promise<Object>} Result with success status and updated loan
   */
  const processReturn = useCallback(async (loanRequestId, returnData) => {
    if (!user?.uid) {
      const result = {
        success: false,
        error: 'ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่',
        errorCode: 'USER_NOT_FOUND'
      };
      setError(result.error);
      setLastResult(result);
      return result;
    }

    setLoading(true);
    setError(null);

    try {
      const staffInfo = getStaffInfo();
      const result = await StaffLoanManagementService.processReturn(
        loanRequestId,
        returnData,
        user.uid,
        staffInfo
      );

      setLastResult(result);

      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'เกิดข้อผิดพลาดในการรับคืนอุปกรณ์';
      setError(errorMessage);
      const result = {
        success: false,
        error: errorMessage,
        errorCode: 'INTERNAL_ERROR'
      };
      setLastResult(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, [user, getStaffInfo]);

  /**
   * Send overdue notification to borrower
   * Requirements: 6.3, 6.4, 10.4, 12.4
   * 
   * @param {string} loanRequestId - Loan request ID to send notification for
   * @returns {Promise<Object>} Result with success status
   */
  const sendOverdueNotification = useCallback(async (loanRequestId) => {
    if (!user?.uid) {
      const result = {
        success: false,
        error: 'ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่',
        errorCode: 'USER_NOT_FOUND'
      };
      setError(result.error);
      setLastResult(result);
      return result;
    }

    setLoading(true);
    setError(null);

    try {
      const staffInfo = getStaffInfo();
      const result = await StaffLoanManagementService.sendOverdueNotification(
        loanRequestId,
        user.uid,
        staffInfo
      );

      setLastResult(result);

      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน';
      setError(errorMessage);
      const result = {
        success: false,
        error: errorMessage,
        errorCode: 'INTERNAL_ERROR'
      };
      setLastResult(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, [user, getStaffInfo]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear last result
   */
  const clearLastResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    // State
    loading,
    error,
    lastResult,
    
    // Methods
    approveLoanRequest,
    rejectLoanRequest,
    processReturn,
    sendOverdueNotification,
    checkEquipmentAvailability,
    clearError,
    clearLastResult
  };
};

export default useStaffLoanManagement;
