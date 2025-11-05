import { useState, useCallback, useRef } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';

/**
 * Hook for managing profile update notifications and confirmations
 * Implements requirements 2.4, 3.5
 * 
 * Features:
 * - Track profile update results
 * - Show success/error notifications
 * - Handle status change notifications
 * - Manage notification state
 */
const useProfileUpdateNotifications = () => {
  const { showToast } = useNotificationContext();
  const [lastUpdateResult, setLastUpdateResult] = useState(null);
  const [isShowingNotification, setIsShowingNotification] = useState(false);
  const previousStatusRef = useRef(null);

  // Handle status change notifications
  const handleStatusChange = useCallback((newStatus, oldStatus) => {
    const statusNotifications = {
      pending: {
        type: 'info',
        title: 'ส่งคำขอสำเร็จ',
        message: 'คำขอสมัครสมาชิกของคุณอยู่ระหว่างการตรวจสอบ',
        icon: 'clock',
        duration: 8000
      },
      approved: {
        type: 'success',
        title: 'บัญชีได้รับการอนุมัติ',
        message: 'ยินดีต้อนรับ! คุณสามารถใช้งานระบบได้แล้ว',
        icon: 'check-circle',
        duration: 10000
      },
      rejected: {
        type: 'error',
        title: 'บัญชีไม่ได้รับการอนุมัติ',
        message: 'กรุณาติดต่อผู้ดูแลระบบเพื่อข้อมูลเพิ่มเติม',
        icon: 'x-circle',
        duration: 10000
      }
    };

    const notification = statusNotifications[newStatus];
    if (notification) {
      // Delay status notification slightly to avoid overlap with update success
      setTimeout(() => {
        showToast(notification);
      }, 1000);
    }
  }, [showToast]);

  // Handle successful profile update
  const handleUpdateSuccess = useCallback((profile, updateData = {}) => {
    const result = {
      success: true,
      timestamp: new Date(),
      profile,
      updateData,
      previousStatus: previousStatusRef.current,
      statusChanged: previousStatusRef.current && previousStatusRef.current !== profile?.status
    };

    setLastUpdateResult(result);
    setIsShowingNotification(true);

    // Show success toast
    showToast({
      type: 'success',
      title: 'บันทึกข้อมูลสำเร็จ',
      message: 'ข้อมูลโปรไฟล์ของคุณได้รับการอัปเดตแล้ว',
      icon: 'check-circle',
      duration: 5000
    });

    // Handle status change notifications
    if (result.statusChanged) {
      handleStatusChange(profile.status, previousStatusRef.current);
    }

    // Update previous status reference
    previousStatusRef.current = profile?.status;

    return result;
  }, [showToast, handleStatusChange]);

  // Handle profile update error
  const handleUpdateError = useCallback((error, profile = null) => {
    const result = {
      success: false,
      timestamp: new Date(),
      error,
      profile,
      previousStatus: previousStatusRef.current
    };

    setLastUpdateResult(result);
    setIsShowingNotification(true);

    // Show error toast
    showToast({
      type: 'error',
      title: 'เกิดข้อผิดพลาด',
      message: error.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่',
      icon: 'x-circle',
      duration: 8000
    });

    return result;
  }, [showToast]);

  // Set initial profile status for tracking changes
  const setInitialStatus = useCallback((status) => {
    previousStatusRef.current = status;
  }, []);

  // Clear notification state
  const clearNotification = useCallback(() => {
    setIsShowingNotification(false);
    setLastUpdateResult(null);
  }, []);

  // Show custom notification
  const showCustomNotification = useCallback((notification) => {
    showToast({
      type: 'info',
      duration: 5000,
      ...notification
    });
  }, [showToast]);

  // Show profile completion notification
  const showProfileCompletionNotification = useCallback(() => {
    showToast({
      type: 'success',
      title: 'โปรไฟล์ครบถ้วน',
      message: 'ข้อมูลโปรไฟล์ของคุณครบถ้วนแล้ว พร้อมส่งคำขอสมัครสมาชิก',
      icon: 'check-circle',
      duration: 6000
    });
  }, [showToast]);

  // Show validation error notification
  const showValidationErrorNotification = useCallback((errors) => {
    const errorCount = Array.isArray(errors) ? errors.length : Object.keys(errors).length;
    const message = errorCount === 1 
      ? 'กรุณาแก้ไขข้อมูลที่ไม่ถูกต้อง' 
      : `กรุณาแก้ไขข้อมูลที่ไม่ถูกต้อง (${errorCount} รายการ)`;

    showToast({
      type: 'warning',
      title: 'ข้อมูลไม่ถูกต้อง',
      message,
      icon: 'exclamation-triangle',
      duration: 6000
    });
  }, [showToast]);

  // Show network error notification
  const showNetworkErrorNotification = useCallback(() => {
    showToast({
      type: 'error',
      title: 'ปัญหาการเชื่อมต่อ',
      message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
      icon: 'wifi-off',
      duration: 8000
    });
  }, [showToast]);

  // Show retry notification
  const showRetryNotification = useCallback((retryCount, maxRetries) => {
    showToast({
      type: 'info',
      title: 'กำลังลองใหม่',
      message: `กำลังลองบันทึกข้อมูลอีกครั้ง (${retryCount}/${maxRetries})`,
      icon: 'refresh',
      duration: 3000
    });
  }, [showToast]);

  return {
    // State
    lastUpdateResult,
    isShowingNotification,
    
    // Actions
    handleUpdateSuccess,
    handleUpdateError,
    handleStatusChange,
    setInitialStatus,
    clearNotification,
    
    // Utility notifications
    showCustomNotification,
    showProfileCompletionNotification,
    showValidationErrorNotification,
    showNetworkErrorNotification,
    showRetryNotification
  };
};

export default useProfileUpdateNotifications;