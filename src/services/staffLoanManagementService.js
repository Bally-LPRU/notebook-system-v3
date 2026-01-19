/**
 * Staff Loan Management Service
 * 
 * Extended loan management functions for Staff role with:
 * - Audit logging for all actions
 * - Admin notifications for staff actions
 * - Equipment availability checks
 * 
 * Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 10.1, 10.2, 12.1-12.5
 */

import { 
  collection, 
  doc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { LOAN_REQUEST_STATUS } from '../types/loanRequest';
import { EQUIPMENT_STATUS } from '../types/equipment';
import EquipmentService from './equipmentService';
import NotificationService from './notificationService';
import ActivityLoggerService from './activityLoggerService';

// Collection names
const LOAN_REQUESTS_COLLECTION = 'loanRequests';
const STAFF_ACTIVITY_LOGS_COLLECTION = 'staffActivityLogs';

/**
 * Staff Loan Management Service
 * Provides loan management functions with audit logging and admin notifications
 */
class StaffLoanManagementService {
  
  // ============================================================================
  // Staff Activity Types
  // ============================================================================
  
  static STAFF_ACTION_TYPES = {
    LOAN_APPROVED: 'loan_approved',
    LOAN_REJECTED: 'loan_rejected',
    RETURN_PROCESSED: 'return_processed',
    OVERDUE_NOTIFIED: 'overdue_notified'
  };

  // ============================================================================
  // Loan Approval Functions
  // ============================================================================

  /**
   * Approve a loan request (Staff action)
   * - Changes status to approved
   * - Updates equipment availability
   * - Sends notification to borrower
   * - Logs audit trail
   * - Notifies admins
   * 
   * Requirements: 4.1, 4.4, 4.5, 10.1
   * 
   * @param {string} loanRequestId - Loan request ID
   * @param {string} staffId - Staff user ID performing the action
   * @param {Object} staffInfo - Staff user information (displayName, email)
   * @returns {Promise<Object>} Result with success status and updated request
   */
  static async approveLoanRequest(loanRequestId, staffId, staffInfo = {}) {
    try {
      // 1. Get the loan request
      const loanRequest = await this.getLoanRequestById(loanRequestId);
      if (!loanRequest) {
        return {
          success: false,
          error: 'ไม่พบคำขอยืมที่ต้องการอนุมัติ',
          errorCode: 'LOAN_REQUEST_NOT_FOUND'
        };
      }

      // 2. Validate status
      if (loanRequest.status !== LOAN_REQUEST_STATUS.PENDING) {
        return {
          success: false,
          error: 'คำขอยืมนี้ได้รับการดำเนินการแล้ว',
          errorCode: 'INVALID_STATUS'
        };
      }

      // 3. Check equipment availability (Requirement 4.6)
      const availabilityCheck = await this.checkEquipmentAvailability(loanRequest.equipmentId);
      if (!availabilityCheck.available) {
        return {
          success: false,
          error: availabilityCheck.message,
          errorCode: 'EQUIPMENT_UNAVAILABLE'
        };
      }

      const equipment = availabilityCheck.equipment;

      // 4. Update loan request status
      const loanRequestRef = doc(db, LOAN_REQUESTS_COLLECTION, loanRequestId);
      await updateDoc(loanRequestRef, {
        status: LOAN_REQUEST_STATUS.APPROVED,
        approvedBy: staffId,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const updatedRequest = {
        ...loanRequest,
        status: LOAN_REQUEST_STATUS.APPROVED,
        approvedBy: staffId,
        approvedAt: new Date(),
        updatedAt: new Date()
      };

      // 5. Send notification to borrower (Requirement 4.4)
      try {
        await NotificationService.createNotification(
          loanRequest.userId,
          'loan_approved',
          'คำขอยืมได้รับการอนุมัติ',
          `คำขอยืม ${equipment.name} ได้รับการอนุมัติแล้ว กรุณามารับอุปกรณ์ตามวันที่กำหนด`,
          {
            requestId: loanRequestId,
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            borrowDate: loanRequest.borrowDate,
            expectedReturnDate: loanRequest.expectedReturnDate,
            actionUrl: '/my-requests'
          }
        );
      } catch (notifyError) {
        console.warn('Failed to send borrower notification:', notifyError);
      }

      // 6. Log audit trail (Requirement 10.1)
      await this.logStaffAction(
        staffId,
        staffInfo,
        this.STAFF_ACTION_TYPES.LOAN_APPROVED,
        {
          requestId: loanRequestId,
          borrowerName: loanRequest.userSnapshot?.displayName || loanRequest.userName || 'Unknown',
          borrowerId: loanRequest.userId,
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          borrowDate: loanRequest.borrowDate,
          expectedReturnDate: loanRequest.expectedReturnDate
        }
      );

      // 7. Notify admins (Requirement 12.1)
      await this.notifyAdminsStaffAction(
        staffId,
        staffInfo,
        this.STAFF_ACTION_TYPES.LOAN_APPROVED,
        {
          requestId: loanRequestId,
          borrowerName: loanRequest.userSnapshot?.displayName || loanRequest.userName || 'Unknown',
          equipmentName: equipment.name
        }
      );

      // 8. Send Discord notification (optional)
      try {
        const discordWebhookService = (await import('./discordWebhookService.js')).default;
        await discordWebhookService.notifyLoanApproved({
          userName: loanRequest.userSnapshot?.displayName || loanRequest.userName || 'Unknown',
          equipmentName: equipment.name,
          borrowDate: loanRequest.borrowDate,
          returnDate: loanRequest.expectedReturnDate
        }, staffInfo.displayName || 'Staff');
      } catch (discordError) {
        console.warn('Discord notification failed (ignored):', discordError);
      }

      return {
        success: true,
        request: updatedRequest,
        notificationSent: true,
        equipmentUpdated: false, // Equipment status is updated when picked up
        auditLogged: true
      };

    } catch (error) {
      console.error('Error in staff approveLoanRequest:', error);
      return {
        success: false,
        error: error.message || 'เกิดข้อผิดพลาดในการอนุมัติคำขอยืม',
        errorCode: 'INTERNAL_ERROR'
      };
    }
  }

  // ============================================================================
  // Loan Rejection Functions
  // ============================================================================

  /**
   * Reject a loan request (Staff action)
   * - Changes status to rejected
   * - Stores rejection reason
   * - Sends notification to borrower
   * - Logs audit trail
   * - Notifies admins
   * 
   * Requirements: 4.3, 4.4, 10.2
   * 
   * @param {string} loanRequestId - Loan request ID
   * @param {string} rejectionReason - Reason for rejection
   * @param {string} staffId - Staff user ID performing the action
   * @param {Object} staffInfo - Staff user information (displayName, email)
   * @returns {Promise<Object>} Result with success status and updated request
   */
  static async rejectLoanRequest(loanRequestId, rejectionReason, staffId, staffInfo = {}) {
    try {
      // 1. Validate rejection reason
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        return {
          success: false,
          error: 'กรุณาระบุเหตุผลในการปฏิเสธ (อย่างน้อย 10 ตัวอักษร)',
          errorCode: 'INVALID_REASON'
        };
      }

      // 2. Get the loan request
      const loanRequest = await this.getLoanRequestById(loanRequestId);
      if (!loanRequest) {
        return {
          success: false,
          error: 'ไม่พบคำขอยืมที่ต้องการปฏิเสธ',
          errorCode: 'LOAN_REQUEST_NOT_FOUND'
        };
      }

      // 3. Validate status
      if (loanRequest.status !== LOAN_REQUEST_STATUS.PENDING) {
        return {
          success: false,
          error: 'คำขอยืมนี้ได้รับการดำเนินการแล้ว',
          errorCode: 'INVALID_STATUS'
        };
      }

      // 4. Get equipment info for notification
      const equipment = await EquipmentService.getEquipmentById(loanRequest.equipmentId);
      const equipmentName = equipment?.name || loanRequest.equipmentSnapshot?.name || 'อุปกรณ์';

      // 5. Update loan request status
      const loanRequestRef = doc(db, LOAN_REQUESTS_COLLECTION, loanRequestId);
      await updateDoc(loanRequestRef, {
        status: LOAN_REQUEST_STATUS.REJECTED,
        rejectionReason: rejectionReason.trim(),
        approvedBy: staffId, // Using approvedBy field for consistency
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const updatedRequest = {
        ...loanRequest,
        status: LOAN_REQUEST_STATUS.REJECTED,
        rejectionReason: rejectionReason.trim(),
        approvedBy: staffId,
        approvedAt: new Date(),
        updatedAt: new Date()
      };

      // 6. Send notification to borrower (Requirement 4.4)
      try {
        await NotificationService.createNotification(
          loanRequest.userId,
          'loan_rejected',
          'คำขอยืมถูกปฏิเสธ',
          `คำขอยืม ${equipmentName} ถูกปฏิเสธ เหตุผล: ${rejectionReason.trim()}`,
          {
            requestId: loanRequestId,
            equipmentId: loanRequest.equipmentId,
            equipmentName: equipmentName,
            rejectionReason: rejectionReason.trim(),
            actionUrl: '/my-requests'
          }
        );
      } catch (notifyError) {
        console.warn('Failed to send borrower notification:', notifyError);
      }

      // 7. Log audit trail (Requirement 10.2)
      await this.logStaffAction(
        staffId,
        staffInfo,
        this.STAFF_ACTION_TYPES.LOAN_REJECTED,
        {
          requestId: loanRequestId,
          borrowerName: loanRequest.userSnapshot?.displayName || loanRequest.userName || 'Unknown',
          borrowerId: loanRequest.userId,
          equipmentId: loanRequest.equipmentId,
          equipmentName: equipmentName,
          rejectionReason: rejectionReason.trim()
        }
      );

      // 8. Notify admins (Requirement 12.2)
      await this.notifyAdminsStaffAction(
        staffId,
        staffInfo,
        this.STAFF_ACTION_TYPES.LOAN_REJECTED,
        {
          requestId: loanRequestId,
          borrowerName: loanRequest.userSnapshot?.displayName || loanRequest.userName || 'Unknown',
          equipmentName: equipmentName,
          rejectionReason: rejectionReason.trim()
        },
        'normal'
      );

      // 9. Send Discord notification (optional)
      try {
        const discordWebhookService = (await import('./discordWebhookService.js')).default;
        await discordWebhookService.notifyLoanRejected({
          userName: loanRequest.userSnapshot?.displayName || loanRequest.userName || 'Unknown',
          equipmentName: equipmentName
        }, staffInfo.displayName || 'Staff', rejectionReason.trim());
      } catch (discordError) {
        console.warn('Discord notification failed (ignored):', discordError);
      }

      return {
        success: true,
        request: updatedRequest,
        notificationSent: true,
        auditLogged: true
      };

    } catch (error) {
      console.error('Error in staff rejectLoanRequest:', error);
      return {
        success: false,
        error: error.message || 'เกิดข้อผิดพลาดในการปฏิเสธคำขอยืม',
        errorCode: 'INTERNAL_ERROR'
      };
    }
  }

  // ============================================================================
  // Return Processing Functions
  // ============================================================================

  /**
   * Process equipment return (Staff action)
   * - Changes loan status to returned
   * - Updates equipment availability
   * - Records condition assessment
   * - Logs audit trail
   * - Notifies admins
   * - Creates damage report if equipment is damaged
   * 
   * Requirements: 5.4, 5.5, 5.6, 10.3
   * 
   * @param {string} loanRequestId - Loan request ID
   * @param {Object} returnData - Return data (condition, notes)
   * @param {string} staffId - Staff user ID performing the action
   * @param {Object} staffInfo - Staff user information (displayName, email)
   * @returns {Promise<Object>} Result with success status and updated request
   */
  static async processReturn(loanRequestId, returnData, staffId, staffInfo = {}) {
    try {
      const { condition = 'good', notes = '' } = returnData;

      // 1. Validate condition for damaged/missing_parts
      if ((condition === 'damaged' || condition === 'missing_parts') && (!notes || notes.trim().length < 10)) {
        return {
          success: false,
          error: 'กรุณาระบุรายละเอียดความเสียหายหรือชิ้นส่วนที่หายไป (อย่างน้อย 10 ตัวอักษร)',
          errorCode: 'INVALID_NOTES'
        };
      }

      // 2. Get the loan request
      const loanRequest = await this.getLoanRequestById(loanRequestId);
      if (!loanRequest) {
        return {
          success: false,
          error: 'ไม่พบรายการยืมที่ต้องการรับคืน',
          errorCode: 'LOAN_REQUEST_NOT_FOUND'
        };
      }

      // 3. Validate status - must be borrowed or overdue
      if (loanRequest.status !== LOAN_REQUEST_STATUS.BORROWED && 
          loanRequest.status !== LOAN_REQUEST_STATUS.OVERDUE) {
        return {
          success: false,
          error: 'รายการยืมนี้ไม่อยู่ในสถานะที่สามารถรับคืนได้',
          errorCode: 'INVALID_STATUS'
        };
      }

      // 4. Get equipment info
      const equipment = await EquipmentService.getEquipmentById(loanRequest.equipmentId);
      const equipmentName = equipment?.name || loanRequest.equipmentSnapshot?.name || 'อุปกรณ์';

      // 5. Determine new equipment status based on condition
      let newEquipmentStatus = EQUIPMENT_STATUS.AVAILABLE;
      if (condition === 'damaged' || condition === 'missing_parts') {
        newEquipmentStatus = EQUIPMENT_STATUS.MAINTENANCE;
      }

      // 6. Update loan request status
      const loanRequestRef = doc(db, LOAN_REQUESTS_COLLECTION, loanRequestId);
      await updateDoc(loanRequestRef, {
        status: LOAN_REQUEST_STATUS.RETURNED,
        actualReturnDate: serverTimestamp(),
        returnedBy: staffId,
        returnCondition: condition,
        returnNotes: notes.trim(),
        updatedAt: serverTimestamp()
      });

      // 7. Update equipment status
      if (equipment) {
        const equipmentRef = doc(db, 'equipmentManagement', loanRequest.equipmentId);
        await updateDoc(equipmentRef, {
          status: newEquipmentStatus,
          currentBorrowerId: null,
          borrowedAt: null,
          returnedAt: serverTimestamp(),
          lastReturnCondition: condition,
          lastReturnNotes: notes.trim(),
          updatedAt: serverTimestamp(),
          updatedBy: staffId
        });
      }

      const updatedRequest = {
        ...loanRequest,
        status: LOAN_REQUEST_STATUS.RETURNED,
        actualReturnDate: new Date(),
        returnedBy: staffId,
        returnCondition: condition,
        returnNotes: notes.trim(),
        updatedAt: new Date()
      };

      // 8. Get condition label for notifications
      const conditionLabels = {
        good: 'สมบูรณ์ดี',
        damaged: 'มีความเสียหาย',
        missing_parts: 'ขาดอุปกรณ์เสริม'
      };
      const conditionLabel = conditionLabels[condition] || condition;

      // 9. Send notification to borrower
      try {
        await NotificationService.createNotification(
          loanRequest.userId,
          'loan_returned',
          'บันทึกการคืนอุปกรณ์แล้ว',
          `${equipmentName} ได้รับการบันทึกการคืนเรียบร้อยแล้ว สภาพ: ${conditionLabel}`,
          {
            loanId: loanRequestId,
            equipmentId: loanRequest.equipmentId,
            equipmentName: equipmentName,
            condition: condition,
            conditionLabel: conditionLabel,
            actionUrl: '/my-requests'
          }
        );
      } catch (notifyError) {
        console.warn('Failed to send borrower notification:', notifyError);
      }

      // 10. Log audit trail (Requirement 10.3)
      await this.logStaffAction(
        staffId,
        staffInfo,
        this.STAFF_ACTION_TYPES.RETURN_PROCESSED,
        {
          loanId: loanRequestId,
          borrowerName: loanRequest.userSnapshot?.displayName || loanRequest.userName || 'Unknown',
          borrowerId: loanRequest.userId,
          equipmentId: loanRequest.equipmentId,
          equipmentName: equipmentName,
          condition: condition,
          conditionLabel: conditionLabel,
          notes: notes.trim()
        }
      );

      // 11. Notify admins (Requirement 12.3)
      const notificationPriority = (condition === 'damaged' || condition === 'missing_parts') ? 'high' : 'normal';
      await this.notifyAdminsStaffAction(
        staffId,
        staffInfo,
        this.STAFF_ACTION_TYPES.RETURN_PROCESSED,
        {
          loanId: loanRequestId,
          borrowerName: loanRequest.userSnapshot?.displayName || loanRequest.userName || 'Unknown',
          equipmentName: equipmentName,
          condition: conditionLabel
        },
        notificationPriority
      );

      // 12. Create damage report if equipment is damaged (Requirement 5.6)
      let damageReportId = null;
      if (condition === 'damaged' || condition === 'missing_parts') {
        damageReportId = await this.createDamageReport(
          loanRequest,
          equipment,
          condition,
          notes.trim(),
          staffId,
          staffInfo
        );
      }

      // 13. Send Discord notification (optional)
      try {
        const discordWebhookService = (await import('./discordWebhookService.js')).default;
        await discordWebhookService.notifyEquipmentReturned({
          userName: loanRequest.userSnapshot?.displayName || loanRequest.userName || 'Unknown',
          equipmentName: equipmentName,
          condition: conditionLabel
        }, staffInfo.displayName || 'Staff');
      } catch (discordError) {
        console.warn('Discord notification failed (ignored):', discordError);
      }

      return {
        success: true,
        loan: updatedRequest,
        condition: condition,
        equipmentAvailable: newEquipmentStatus === EQUIPMENT_STATUS.AVAILABLE,
        damageReportId: damageReportId,
        auditLogged: true
      };

    } catch (error) {
      console.error('Error in staff processReturn:', error);
      return {
        success: false,
        error: error.message || 'เกิดข้อผิดพลาดในการรับคืนอุปกรณ์',
        errorCode: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Create damage report for damaged equipment
   * Requirement: 5.6
   * 
   * @param {Object} loanRequest - Loan request data
   * @param {Object} equipment - Equipment data
   * @param {string} condition - Condition (damaged or missing_parts)
   * @param {string} notes - Damage notes
   * @param {string} staffId - Staff user ID
   * @param {Object} staffInfo - Staff user information
   * @returns {Promise<string|null>} Damage report ID or null
   */
  static async createDamageReport(loanRequest, equipment, condition, notes, staffId, staffInfo) {
    try {
      const conditionLabels = {
        damaged: 'มีความเสียหาย',
        missing_parts: 'ขาดอุปกรณ์เสริม'
      };

      const damageReport = {
        loanRequestId: loanRequest.id,
        equipmentId: loanRequest.equipmentId,
        equipmentName: equipment?.name || loanRequest.equipmentSnapshot?.name || 'อุปกรณ์',
        borrowerId: loanRequest.userId,
        borrowerName: loanRequest.userSnapshot?.displayName || loanRequest.userName || 'Unknown',
        condition: condition,
        conditionLabel: conditionLabels[condition] || condition,
        description: notes,
        reportedBy: staffId,
        reportedByName: staffInfo.displayName || 'Staff',
        status: 'pending', // pending, in_progress, resolved
        priority: condition === 'damaged' ? 'high' : 'medium',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'damageReports'), damageReport);

      // Send priority notification to all admins (Requirement 12.8)
      try {
        const usersRef = collection(db, 'users');
        const adminQuery = query(
          usersRef,
          where('role', '==', 'admin'),
          where('status', '==', 'approved')
        );
        
        const adminSnapshot = await getDocs(adminQuery);
        const notificationPromises = [];
        const notifiedAdminIds = new Set();

        adminSnapshot.forEach((adminDoc) => {
          const adminId = adminDoc.id;
          
          if (notifiedAdminIds.has(adminId)) {
            return;
          }
          notifiedAdminIds.add(adminId);

          notificationPromises.push(
            NotificationService.createNotification(
              adminId,
              'damage_report',
              '⚠️ รายงานความเสียหายอุปกรณ์',
              `${damageReport.equipmentName} ${conditionLabels[condition]} - ${notes.substring(0, 100)}${notes.length > 100 ? '...' : ''}`,
              {
                damageReportId: docRef.id,
                equipmentId: loanRequest.equipmentId,
                equipmentName: damageReport.equipmentName,
                borrowerName: damageReport.borrowerName,
                condition: condition,
                priority: 'high',
                actionUrl: '/admin/damage-reports'
              }
            )
          );
        });

        await Promise.all(notificationPromises);
      } catch (notifyError) {
        console.warn('Failed to send damage report notification to admins:', notifyError);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating damage report:', error);
      return null;
    }
  }

  // ============================================================================
  // Equipment Availability Check
  // ============================================================================

  /**
   * Check if equipment is available for approval
   * Requirement: 4.6
   * 
   * @param {string} equipmentId - Equipment ID
   * @returns {Promise<Object>} Availability check result
   */
  static async checkEquipmentAvailability(equipmentId) {
    try {
      const equipment = await EquipmentService.getEquipmentById(equipmentId);
      
      if (!equipment) {
        return {
          available: false,
          message: 'ไม่พบอุปกรณ์ในระบบ',
          equipment: null
        };
      }

      if (equipment.status === EQUIPMENT_STATUS.BORROWED) {
        return {
          available: false,
          message: 'อุปกรณ์นี้กำลังถูกยืมอยู่',
          equipment
        };
      }

      if (equipment.status === EQUIPMENT_STATUS.MAINTENANCE) {
        return {
          available: false,
          message: 'อุปกรณ์นี้อยู่ระหว่างการซ่อมบำรุง',
          equipment
        };
      }

      if (equipment.status === EQUIPMENT_STATUS.RETIRED) {
        return {
          available: false,
          message: 'อุปกรณ์นี้ถูกปลดระวางแล้ว',
          equipment
        };
      }

      if (equipment.status !== EQUIPMENT_STATUS.AVAILABLE) {
        return {
          available: false,
          message: 'อุปกรณ์ไม่พร้อมใช้งานในขณะนี้',
          equipment
        };
      }

      return {
        available: true,
        message: 'อุปกรณ์พร้อมใช้งาน',
        equipment
      };

    } catch (error) {
      console.error('Error checking equipment availability:', error);
      return {
        available: false,
        message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะอุปกรณ์',
        equipment: null
      };
    }
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Get loan request by ID
   * @param {string} loanRequestId - Loan request ID
   * @returns {Promise<Object|null>} Loan request data or null
   */
  static async getLoanRequestById(loanRequestId) {
    try {
      const loanRequestRef = doc(db, LOAN_REQUESTS_COLLECTION, loanRequestId);
      const loanRequestDoc = await getDoc(loanRequestRef);
      
      if (loanRequestDoc.exists()) {
        return {
          id: loanRequestDoc.id,
          ...loanRequestDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting loan request by ID:', error);
      throw error;
    }
  }

  // ============================================================================
  // Audit Logging Functions
  // ============================================================================

  /**
   * Log staff action to audit trail
   * Requirements: 10.1, 10.2, 10.3, 10.4
   * 
   * @param {string} staffId - Staff user ID
   * @param {Object} staffInfo - Staff user information
   * @param {string} actionType - Type of action performed
   * @param {Object} details - Action details
   * @returns {Promise<string|null>} Log ID or null
   */
  static async logStaffAction(staffId, staffInfo, actionType, details) {
    try {
      const logEntry = {
        staffId,
        staffName: staffInfo.displayName || 'Unknown Staff',
        staffEmail: staffInfo.email || '',
        actionType,
        timestamp: serverTimestamp(),
        details: {
          ...details,
          timestamp: new Date().toISOString()
        },
        adminNotified: false,
        adminNotificationId: null
      };

      // Log to staffActivityLogs collection
      const docRef = await addDoc(collection(db, STAFF_ACTIVITY_LOGS_COLLECTION), logEntry);
      
      // Also log to general activity logger with comprehensive audit trail
      // This ensures Staff actions are captured in the main audit log system
      // Requirements: 10.1, 10.2, 10.3, 10.4
      try {
        await ActivityLoggerService.logStaffAction(actionType, {
          staffId,
          staffName: staffInfo.displayName || 'Unknown Staff',
          staffEmail: staffInfo.email || '',
          requestId: details.requestId,
          loanId: details.loanId,
          borrowerId: details.borrowerId,
          borrowerName: details.borrowerName,
          equipmentId: details.equipmentId,
          equipmentName: details.equipmentName,
          rejectionReason: details.rejectionReason,
          condition: details.condition,
          conditionLabel: details.conditionLabel,
          notes: details.notes,
          daysOverdue: details.daysOverdue,
          notificationCount: details.notificationCount
        }, {
          staffActivityLogId: docRef.id
        });
      } catch (activityLogError) {
        console.warn('Failed to log to general activity logger:', activityLogError);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error logging staff action:', error);
      return null;
    }
  }

  // ============================================================================
  // Admin Notification Functions
  // ============================================================================

  /**
   * Notify all admins about staff action
   * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
   * 
   * @param {string} staffId - Staff user ID
   * @param {Object} staffInfo - Staff user information
   * @param {string} actionType - Type of action performed
   * @param {Object} details - Action details
   * @param {string} priority - Notification priority ('normal' or 'high')
   * @returns {Promise<void>}
   */
  static async notifyAdminsStaffAction(staffId, staffInfo, actionType, details, priority = 'normal') {
    try {
      // Get all admin users
      const usersRef = collection(db, 'users');
      const adminQuery = query(
        usersRef,
        where('role', '==', 'admin'),
        where('status', '==', 'approved')
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      const notificationPromises = [];
      const notifiedAdminIds = new Set();

      // Build notification message based on action type
      const { title, message } = this.buildAdminNotificationMessage(actionType, staffInfo, details);

      adminSnapshot.forEach((adminDoc) => {
        const adminId = adminDoc.id;
        
        // Skip if already notified (prevent duplicates)
        if (notifiedAdminIds.has(adminId)) {
          return;
        }
        notifiedAdminIds.add(adminId);

        notificationPromises.push(
          NotificationService.createNotification(
            adminId,
            'staff_action',
            title,
            message,
            {
              staffId,
              staffName: staffInfo.displayName || 'Unknown Staff',
              actionType,
              priority,
              ...details,
              actionUrl: '/admin/staff-activity'
            }
          )
        );
      });

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error notifying admins about staff action:', error);
      // Don't throw - admin notification failure shouldn't block the main action
    }
  }

  /**
   * Build notification message for admin based on action type
   * @param {string} actionType - Type of action
   * @param {Object} staffInfo - Staff information
   * @param {Object} details - Action details
   * @returns {Object} Title and message
   */
  static buildAdminNotificationMessage(actionType, staffInfo, details) {
    const staffName = staffInfo.displayName || 'เจ้าหน้าที่';
    
    switch (actionType) {
      case this.STAFF_ACTION_TYPES.LOAN_APPROVED:
        return {
          title: 'Staff อนุมัติคำขอยืม',
          message: `${staffName} อนุมัติคำขอยืม ${details.equipmentName} ของ ${details.borrowerName}`
        };
      
      case this.STAFF_ACTION_TYPES.LOAN_REJECTED:
        return {
          title: 'Staff ปฏิเสธคำขอยืม',
          message: `${staffName} ปฏิเสธคำขอยืม ${details.equipmentName} ของ ${details.borrowerName} เหตุผล: ${details.rejectionReason}`
        };
      
      case this.STAFF_ACTION_TYPES.RETURN_PROCESSED:
        return {
          title: 'Staff รับคืนอุปกรณ์',
          message: `${staffName} รับคืน ${details.equipmentName} จาก ${details.borrowerName} สภาพ: ${details.condition}`
        };
      
      case this.STAFF_ACTION_TYPES.OVERDUE_NOTIFIED:
        return {
          title: 'Staff ส่งการแจ้งเตือนค้างคืน',
          message: `${staffName} ส่งการแจ้งเตือนค้างคืนให้ ${details.borrowerName} (${details.equipmentName})`
        };
      
      default:
        return {
          title: 'Staff ดำเนินการ',
          message: `${staffName} ดำเนินการ ${actionType}`
        };
    }
  }

  // ============================================================================
  // Overdue Notification Functions
  // ============================================================================

  /**
   * Send overdue notification to borrower (Staff action)
   * - Sends reminder notification to borrower
   * - Logs audit trail
   * - Notifies admins
   * 
   * Requirements: 6.3, 6.4, 10.4
   * 
   * @param {string} loanRequestId - Loan request ID
   * @param {string} staffId - Staff user ID performing the action
   * @param {Object} staffInfo - Staff user information (displayName, email)
   * @returns {Promise<Object>} Result with success status
   */
  static async sendOverdueNotification(loanRequestId, staffId, staffInfo = {}) {
    try {
      // 1. Get the loan request
      const loanRequest = await this.getLoanRequestById(loanRequestId);
      if (!loanRequest) {
        return {
          success: false,
          error: 'ไม่พบรายการยืมที่ต้องการส่งการแจ้งเตือน',
          errorCode: 'LOAN_REQUEST_NOT_FOUND'
        };
      }

      // 2. Validate status - must be borrowed or overdue
      if (loanRequest.status !== LOAN_REQUEST_STATUS.BORROWED && 
          loanRequest.status !== LOAN_REQUEST_STATUS.OVERDUE) {
        return {
          success: false,
          error: 'รายการยืมนี้ไม่อยู่ในสถานะที่สามารถส่งการแจ้งเตือนได้',
          errorCode: 'INVALID_STATUS'
        };
      }

      // 3. Get equipment info
      const equipment = await EquipmentService.getEquipmentById(loanRequest.equipmentId);
      const equipmentName = equipment?.name || loanRequest.equipmentSnapshot?.name || 'อุปกรณ์';

      // 4. Calculate days overdue
      const expectedDate = loanRequest.expectedReturnDate?.toDate 
        ? loanRequest.expectedReturnDate.toDate() 
        : new Date(loanRequest.expectedReturnDate);
      const now = new Date();
      const diffTime = now - expectedDate;
      const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 5. Send notification to borrower (Requirement 6.3)
      try {
        await NotificationService.createNotification(
          loanRequest.userId,
          'overdue_reminder',
          '⚠️ แจ้งเตือนการคืนอุปกรณ์ล่าช้า',
          `${equipmentName} เกินกำหนดคืนแล้ว ${daysOverdue} วัน กรุณานำมาคืนโดยเร็วที่สุด`,
          {
            loanId: loanRequestId,
            equipmentId: loanRequest.equipmentId,
            equipmentName: equipmentName,
            daysOverdue: daysOverdue,
            expectedReturnDate: loanRequest.expectedReturnDate,
            priority: 'high',
            actionUrl: '/my-requests'
          }
        );
      } catch (notifyError) {
        console.warn('Failed to send borrower notification:', notifyError);
        return {
          success: false,
          error: 'ไม่สามารถส่งการแจ้งเตือนให้ผู้ยืมได้',
          errorCode: 'NOTIFICATION_FAILED'
        };
      }

      // 6. Update loan request with last notification timestamp
      const loanRequestRef = doc(db, LOAN_REQUESTS_COLLECTION, loanRequestId);
      await updateDoc(loanRequestRef, {
        lastOverdueNotificationAt: serverTimestamp(),
        overdueNotificationCount: (loanRequest.overdueNotificationCount || 0) + 1,
        updatedAt: serverTimestamp()
      });

      // 7. Log audit trail (Requirement 6.4, 10.4)
      await this.logStaffAction(
        staffId,
        staffInfo,
        this.STAFF_ACTION_TYPES.OVERDUE_NOTIFIED,
        {
          loanId: loanRequestId,
          borrowerName: loanRequest.userSnapshot?.displayName || loanRequest.userName || 'Unknown',
          borrowerId: loanRequest.userId,
          equipmentId: loanRequest.equipmentId,
          equipmentName: equipmentName,
          daysOverdue: daysOverdue,
          notificationCount: (loanRequest.overdueNotificationCount || 0) + 1
        }
      );

      // 8. Notify admins (Requirement 12.4)
      await this.notifyAdminsStaffAction(
        staffId,
        staffInfo,
        this.STAFF_ACTION_TYPES.OVERDUE_NOTIFIED,
        {
          loanId: loanRequestId,
          borrowerName: loanRequest.userSnapshot?.displayName || loanRequest.userName || 'Unknown',
          equipmentName: equipmentName,
          daysOverdue: daysOverdue
        },
        'normal'
      );

      return {
        success: true,
        loanId: loanRequestId,
        notificationSent: true,
        daysOverdue: daysOverdue,
        auditLogged: true
      };

    } catch (error) {
      console.error('Error in staff sendOverdueNotification:', error);
      return {
        success: false,
        error: error.message || 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน',
        errorCode: 'INTERNAL_ERROR'
      };
    }
  }
}

export default StaffLoanManagementService;
