import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ActivityLoggerService from '../services/activityLoggerService';

/**
 * Custom hook for audit logging
 * Provides convenient methods for logging user activities
 */
export const useAuditLogger = () => {
  const { userProfile } = useAuth();

  // Log equipment activity
  const logEquipmentActivity = useCallback(async (activityType, data, metadata = {}) => {
    if (!userProfile?.uid) return null;

    try {
      return await ActivityLoggerService.logEquipmentActivity(
        activityType,
        data,
        userProfile.uid,
        metadata
      );
    } catch (error) {
      console.error('Error logging equipment activity:', error);
      return null;
    }
  }, [userProfile]);

  // Log user activity
  const logUserActivity = useCallback(async (activityType, data = {}) => {
    if (!userProfile?.uid) return null;

    try {
      return await ActivityLoggerService.logUserActivity(
        userProfile.uid,
        activityType,
        data
      );
    } catch (error) {
      console.error('Error logging user activity:', error);
      return null;
    }
  }, [userProfile]);

  // Log permission denied
  const logPermissionDenied = useCallback(async (attemptedAction, resource, reason) => {
    if (!userProfile?.uid) return;

    try {
      await ActivityLoggerService.logPermissionDenied(
        userProfile.uid,
        attemptedAction,
        resource,
        reason
      );
    } catch (error) {
      console.error('Error logging permission denied:', error);
    }
  }, [userProfile]);

  // Log system error
  const logSystemError = useCallback(async (error, context) => {
    try {
      await ActivityLoggerService.logSystemError(
        error,
        context,
        userProfile?.uid
      );
    } catch (logError) {
      console.error('Error logging system error:', logError);
    }
  }, [userProfile]);

  // Convenience methods for common equipment activities
  const logEquipmentCreated = useCallback(async (equipmentData) => {
    return await logEquipmentActivity(
      ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_CREATED,
      {
        equipmentId: equipmentData.id,
        equipmentNumber: equipmentData.equipmentNumber,
        equipmentName: equipmentData.name,
        reason: 'สร้างอุปกรณ์ใหม่'
      }
    );
  }, [logEquipmentActivity]);

  const logEquipmentUpdated = useCallback(async (equipmentId, equipmentData, changes) => {
    return await logEquipmentActivity(
      ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_UPDATED,
      {
        equipmentId,
        equipmentNumber: equipmentData.equipmentNumber,
        equipmentName: equipmentData.name,
        changes,
        affectedFields: changes.map(change => change.field),
        reason: 'แก้ไขข้อมูลอุปกรณ์'
      }
    );
  }, [logEquipmentActivity]);

  const logEquipmentDeleted = useCallback(async (equipmentData) => {
    return await logEquipmentActivity(
      ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_DELETED,
      {
        equipmentId: equipmentData.id,
        equipmentNumber: equipmentData.equipmentNumber,
        equipmentName: equipmentData.name,
        reason: 'ลบอุปกรณ์ออกจากระบบ'
      }
    );
  }, [logEquipmentActivity]);

  const logEquipmentViewed = useCallback(async (equipmentData) => {
    return await logEquipmentActivity(
      ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_VIEWED,
      {
        equipmentId: equipmentData.id,
        equipmentNumber: equipmentData.equipmentNumber,
        equipmentName: equipmentData.name
      }
    );
  }, [logEquipmentActivity]);

  const logBulkUpdate = useCallback(async (equipmentIds, changes) => {
    return await logEquipmentActivity(
      ActivityLoggerService.ACTIVITY_TYPES.BULK_UPDATE,
      {
        equipmentIds,
        changes,
        itemCount: equipmentIds.length,
        affectedFields: Object.keys(changes),
        reason: `แก้ไขข้อมูลอุปกรณ์หลายรายการ ${equipmentIds.length} รายการ`
      }
    );
  }, [logEquipmentActivity]);

  const logBulkDelete = useCallback(async (equipmentIds) => {
    return await logEquipmentActivity(
      ActivityLoggerService.ACTIVITY_TYPES.BULK_DELETE,
      {
        equipmentIds,
        itemCount: equipmentIds.length,
        reason: `ลบอุปกรณ์หลายรายการ ${equipmentIds.length} รายการ`
      }
    );
  }, [logEquipmentActivity]);

  const logImageUploaded = useCallback(async (equipmentId, equipmentData, imageData) => {
    return await logEquipmentActivity(
      ActivityLoggerService.ACTIVITY_TYPES.IMAGE_UPLOADED,
      {
        equipmentId,
        equipmentNumber: equipmentData.equipmentNumber,
        equipmentName: equipmentData.name,
        imageId: imageData.id,
        imageSize: imageData.size,
        imageFilename: imageData.filename,
        reason: 'อัปโหลดรูปภาพอุปกรณ์'
      }
    );
  }, [logEquipmentActivity]);

  const logImageDeleted = useCallback(async (equipmentId, equipmentData, imageData) => {
    return await logEquipmentActivity(
      ActivityLoggerService.ACTIVITY_TYPES.IMAGE_DELETED,
      {
        equipmentId,
        equipmentNumber: equipmentData.equipmentNumber,
        equipmentName: equipmentData.name,
        imageId: imageData.id,
        imageFilename: imageData.filename,
        reason: 'ลบรูปภาพอุปกรณ์'
      }
    );
  }, [logEquipmentActivity]);

  const logReportGenerated = useCallback(async (reportType, filters, resultCount) => {
    return await logEquipmentActivity(
      ActivityLoggerService.ACTIVITY_TYPES.REPORT_GENERATED,
      {
        reportType,
        filters,
        resultCount,
        reason: `สร้างรายงาน ${reportType} พบข้อมูล ${resultCount} รายการ`
      }
    );
  }, [logEquipmentActivity]);

  return {
    // Core logging methods
    logEquipmentActivity,
    logUserActivity,
    logPermissionDenied,
    logSystemError,

    // Convenience methods
    logEquipmentCreated,
    logEquipmentUpdated,
    logEquipmentDeleted,
    logEquipmentViewed,
    logBulkUpdate,
    logBulkDelete,
    logImageUploaded,
    logImageDeleted,
    logReportGenerated,

    // Activity types for reference
    ACTIVITY_TYPES: ActivityLoggerService.ACTIVITY_TYPES,
    SEVERITY_LEVELS: ActivityLoggerService.SEVERITY_LEVELS
  };
};

export default useAuditLogger;