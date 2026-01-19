/**
 * Staff Activity Notification Service
 * 
 * Manages notifications to Admin users when Staff performs actions.
 * Supports priority notifications for critical events.
 * 
 * Requirements: 12.1-12.5
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import NotificationService from './notificationService';

// Collection names
const STAFF_ACTIVITY_LOGS_COLLECTION = 'staffActivityLogs';
const STAFF_DAILY_SUMMARIES_COLLECTION = 'staffDailySummaries';
const USERS_COLLECTION = 'users';

/**
 * Staff Activity Notification Service
 * Provides functions to notify admins about staff actions
 */
class StaffActivityNotificationService {
  
  // ============================================================================
  // Action Types
  // ============================================================================
  
  static ACTION_TYPES = {
    LOAN_APPROVED: 'loan_approved',
    LOAN_REJECTED: 'loan_rejected',
    RETURN_PROCESSED: 'return_processed',
    OVERDUE_NOTIFIED: 'overdue_notified'
  };

  static PRIORITY_LEVELS = {
    NORMAL: 'normal',
    HIGH: 'high'
  };


  // ============================================================================
  // Admin Notification Functions (Requirements: 12.1-12.5)
  // ============================================================================

  /**
   * Send notification to all Admin users about a Staff action
   * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
   * 
   * @param {Object} params - Notification parameters
   * @param {string} params.staffId - Staff user ID
   * @param {string} params.staffName - Staff display name
   * @param {string} params.actionType - Type of action performed
   * @param {Date|Timestamp} params.timestamp - When the action occurred
   * @param {Object} params.details - Action-specific details
   * @param {string} [params.priority='normal'] - Notification priority ('normal' or 'high')
   * @returns {Promise<{success: boolean, notifiedCount: number, error?: string}>}
   */
  static async notifyAdminsOfStaffAction({
    staffId,
    staffName,
    actionType,
    timestamp,
    details,
    priority = 'normal'
  }) {
    try {
      // 1. Get all admin users
      const admins = await this.getAdminUsers();
      
      if (admins.length === 0) {
        console.warn('No admin users found to notify');
        return { success: true, notifiedCount: 0 };
      }

      // 2. Build notification content
      const { title, message } = this.buildNotificationContent(actionType, staffName, details);

      // 3. Send notifications to all admins
      const notificationPromises = admins.map(admin => 
        this.sendAdminNotification(admin.id, {
          staffId,
          staffName,
          actionType,
          timestamp,
          details,
          priority,
          title,
          message
        })
      );

      const results = await Promise.allSettled(notificationPromises);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

      return {
        success: true,
        notifiedCount: successCount
      };

    } catch (error) {
      console.error('Error notifying admins of staff action:', error);
      return {
        success: false,
        notifiedCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Send a single notification to an admin user
   * @param {string} adminId - Admin user ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<boolean>}
   */
  static async sendAdminNotification(adminId, notificationData) {
    try {
      const {
        staffId,
        staffName,
        actionType,
        timestamp,
        details,
        priority,
        title,
        message
      } = notificationData;

      await NotificationService.createNotification(
        adminId,
        'staff_action',
        title,
        message,
        {
          staffId,
          staffName,
          actionType,
          priority,
          timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
          ...details,
          actionUrl: '/admin/staff-activity'
        }
      );

      return true;
    } catch (error) {
      console.error(`Failed to send notification to admin ${adminId}:`, error);
      return false;
    }
  }

  /**
   * Send priority notification to admins (for critical events like damage reports)
   * Requirement: 12.8
   * 
   * @param {Object} params - Notification parameters
   * @returns {Promise<{success: boolean, notifiedCount: number}>}
   */
  static async sendPriorityNotification(params) {
    return this.notifyAdminsOfStaffAction({
      ...params,
      priority: this.PRIORITY_LEVELS.HIGH
    });
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Get all approved admin users
   * @returns {Promise<Array<{id: string, displayName: string, email: string}>>}
   */
  static async getAdminUsers() {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const adminQuery = query(
        usersRef,
        where('role', '==', 'admin'),
        where('status', '==', 'approved')
      );
      
      const snapshot = await getDocs(adminQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        displayName: doc.data().displayName || 'Admin',
        email: doc.data().email || ''
      }));
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }

  /**
   * Build notification title and message based on action type
   * Requirement: 12.5
   * 
   * @param {string} actionType - Type of action
   * @param {string} staffName - Staff display name
   * @param {Object} details - Action details
   * @returns {{title: string, message: string}}
   */
  static buildNotificationContent(actionType, staffName, details) {
    const staff = staffName || 'เจ้าหน้าที่';
    
    switch (actionType) {
      case this.ACTION_TYPES.LOAN_APPROVED:
        return {
          title: '✅ Staff อนุมัติคำขอยืม',
          message: `${staff} อนุมัติคำขอยืม ${details.equipmentName || 'อุปกรณ์'} ของ ${details.borrowerName || 'ผู้ยืม'}`
        };
      
      case this.ACTION_TYPES.LOAN_REJECTED:
        return {
          title: '❌ Staff ปฏิเสธคำขอยืม',
          message: `${staff} ปฏิเสธคำขอยืม ${details.equipmentName || 'อุปกรณ์'} ของ ${details.borrowerName || 'ผู้ยืม'}${details.rejectionReason ? ` เหตุผล: ${details.rejectionReason}` : ''}`
        };
      
      case this.ACTION_TYPES.RETURN_PROCESSED:
        const conditionText = details.conditionLabel || details.condition || 'ไม่ระบุ';
        const isDamaged = details.condition === 'damaged' || details.condition === 'missing_parts';
        return {
          title: isDamaged ? '⚠️ Staff รับคืนอุปกรณ์ (มีปัญหา)' : '📦 Staff รับคืนอุปกรณ์',
          message: `${staff} รับคืน ${details.equipmentName || 'อุปกรณ์'} จาก ${details.borrowerName || 'ผู้ยืม'} สภาพ: ${conditionText}`
        };
      
      case this.ACTION_TYPES.OVERDUE_NOTIFIED:
        return {
          title: '📢 Staff ส่งการแจ้งเตือนค้างคืน',
          message: `${staff} ส่งการแจ้งเตือนค้างคืนให้ ${details.borrowerName || 'ผู้ยืม'} (${details.equipmentName || 'อุปกรณ์'}) ค้าง ${details.daysOverdue || 0} วัน`
        };
      
      default:
        return {
          title: '📋 Staff ดำเนินการ',
          message: `${staff} ดำเนินการ: ${actionType}`
        };
    }
  }


  // ============================================================================
  // Staff Activity Log Functions (Requirements: 12.6, 12.7)
  // ============================================================================

  /**
   * Get staff activity logs with filtering
   * Requirements: 12.6, 12.7
   * 
   * @param {Object} options - Query options
   * @param {string} [options.staffId] - Filter by specific staff
   * @param {string} [options.actionType] - Filter by action type
   * @param {Date} [options.startDate] - Filter by start date
   * @param {Date} [options.endDate] - Filter by end date
   * @param {number} [options.limitCount=50] - Maximum results
   * @param {Object} [options.startAfterDoc] - Pagination cursor
   * @returns {Promise<{activities: Array, lastDoc: Object|null, total: number}>}
   */
  static async getStaffActivityLogs({
    staffId = null,
    actionType = null,
    startDate = null,
    endDate = null,
    limitCount = 50,
    startAfterDoc = null
  } = {}) {
    try {
      let constraints = [orderBy('timestamp', 'desc')];

      // Apply filters
      if (staffId) {
        constraints.unshift(where('staffId', '==', staffId));
      }

      if (actionType) {
        constraints.unshift(where('actionType', '==', actionType));
      }

      if (startDate) {
        const startTimestamp = Timestamp.fromDate(startDate);
        constraints.push(where('timestamp', '>=', startTimestamp));
      }

      if (endDate) {
        const endTimestamp = Timestamp.fromDate(endDate);
        constraints.push(where('timestamp', '<=', endTimestamp));
      }

      constraints.push(limit(limitCount));

      if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
      }

      const logsQuery = query(
        collection(db, STAFF_ACTIVITY_LOGS_COLLECTION),
        ...constraints
      );

      const snapshot = await getDocs(logsQuery);
      
      const activities = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || null
        };
      });

      const lastDoc = snapshot.docs.length > 0 
        ? snapshot.docs[snapshot.docs.length - 1] 
        : null;

      return {
        activities,
        lastDoc,
        total: activities.length
      };

    } catch (error) {
      console.error('Error getting staff activity logs:', error);
      return {
        activities: [],
        lastDoc: null,
        total: 0
      };
    }
  }

  /**
   * Get recent staff activities for Admin Dashboard
   * Requirement: 12.6
   * 
   * @param {number} [limitCount=10] - Number of recent activities
   * @returns {Promise<Array>}
   */
  static async getRecentStaffActivities(limitCount = 10) {
    const result = await this.getStaffActivityLogs({ limitCount });
    return result.activities;
  }

  /**
   * Get staff activity statistics
   * @param {string} [staffId] - Optional staff ID filter
   * @param {Date} [startDate] - Start date for statistics
   * @param {Date} [endDate] - End date for statistics
   * @returns {Promise<Object>}
   */
  static async getStaffActivityStats(staffId = null, startDate = null, endDate = null) {
    try {
      const { activities } = await this.getStaffActivityLogs({
        staffId,
        startDate,
        endDate,
        limitCount: 1000 // Get more for statistics
      });

      const stats = {
        total: activities.length,
        byActionType: {},
        byStaff: {},
        byDate: {}
      };

      activities.forEach(activity => {
        // Count by action type
        const actionType = activity.actionType || 'unknown';
        stats.byActionType[actionType] = (stats.byActionType[actionType] || 0) + 1;

        // Count by staff
        const staffKey = activity.staffId || 'unknown';
        if (!stats.byStaff[staffKey]) {
          stats.byStaff[staffKey] = {
            staffId: activity.staffId,
            staffName: activity.staffName || 'Unknown',
            count: 0
          };
        }
        stats.byStaff[staffKey].count++;

        // Count by date
        if (activity.timestamp) {
          const dateKey = activity.timestamp.toISOString().split('T')[0];
          stats.byDate[dateKey] = (stats.byDate[dateKey] || 0) + 1;
        }
      });

      return stats;

    } catch (error) {
      console.error('Error getting staff activity stats:', error);
      return {
        total: 0,
        byActionType: {},
        byStaff: {},
        byDate: {}
      };
    }
  }


  // ============================================================================
  // Daily Summary Functions (Requirement: 12.9)
  // ============================================================================

  /**
   * Generate or update daily summary for a staff member
   * Requirement: 12.9
   * 
   * @param {string} staffId - Staff user ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>}
   */
  static async updateDailySummary(staffId, date) {
    try {
      const summaryId = `${date}_${staffId}`;
      const summaryRef = doc(db, STAFF_DAILY_SUMMARIES_COLLECTION, summaryId);
      
      // Get existing summary or create new
      const existingDoc = await getDoc(summaryRef);
      const existingData = existingDoc.exists() ? existingDoc.data() : null;

      // Get today's activities for this staff
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { activities } = await this.getStaffActivityLogs({
        staffId,
        startDate: startOfDay,
        endDate: endOfDay,
        limitCount: 500
      });

      // Calculate summary
      const summary = {
        staffId,
        date,
        approvedCount: activities.filter(a => a.actionType === this.ACTION_TYPES.LOAN_APPROVED).length,
        rejectedCount: activities.filter(a => a.actionType === this.ACTION_TYPES.LOAN_REJECTED).length,
        returnsProcessed: activities.filter(a => a.actionType === this.ACTION_TYPES.RETURN_PROCESSED).length,
        overdueNotificationsSent: activities.filter(a => a.actionType === this.ACTION_TYPES.OVERDUE_NOTIFIED).length,
        damageReportsCreated: activities.filter(a => 
          a.actionType === this.ACTION_TYPES.RETURN_PROCESSED && 
          (a.details?.condition === 'damaged' || a.details?.condition === 'missing_parts')
        ).length,
        totalActions: activities.length,
        updatedAt: serverTimestamp()
      };

      // Get staff name if not in existing data
      if (!existingData?.staffName) {
        try {
          const staffDoc = await getDoc(doc(db, USERS_COLLECTION, staffId));
          if (staffDoc.exists()) {
            summary.staffName = staffDoc.data().displayName || 'Unknown Staff';
          }
        } catch (e) {
          console.warn('Could not get staff name:', e);
        }
      } else {
        summary.staffName = existingData.staffName;
      }

      // Save summary
      if (existingDoc.exists()) {
        await updateDoc(summaryRef, summary);
      } else {
        await addDoc(collection(db, STAFF_DAILY_SUMMARIES_COLLECTION), {
          ...summary,
          createdAt: serverTimestamp()
        });
      }

      return summary;

    } catch (error) {
      console.error('Error updating daily summary:', error);
      return null;
    }
  }

  /**
   * Get daily summaries for a date range
   * Requirement: 12.9
   * 
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} [staffId] - Optional staff ID filter
   * @returns {Promise<Array>}
   */
  static async getDailySummaries(startDate, endDate, staffId = null) {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      let constraints = [
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr),
        orderBy('date', 'desc')
      ];

      if (staffId) {
        constraints.unshift(where('staffId', '==', staffId));
      }

      const summariesQuery = query(
        collection(db, STAFF_DAILY_SUMMARIES_COLLECTION),
        ...constraints
      );

      const snapshot = await getDocs(summariesQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || null,
        updatedAt: doc.data().updatedAt?.toDate?.() || null
      }));

    } catch (error) {
      console.error('Error getting daily summaries:', error);
      return [];
    }
  }

  /**
   * Generate daily summary report for all staff
   * Requirement: 12.9
   * 
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>}
   */
  static async generateDailySummaryReport(date) {
    try {
      // Get all staff users
      const usersRef = collection(db, USERS_COLLECTION);
      const staffQuery = query(
        usersRef,
        where('role', '==', 'staff'),
        where('status', '==', 'approved')
      );
      
      const staffSnapshot = await getDocs(staffQuery);
      const staffUsers = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        displayName: doc.data().displayName || 'Unknown'
      }));

      // Generate summary for each staff
      const summaries = [];
      for (const staff of staffUsers) {
        const summary = await this.updateDailySummary(staff.id, date);
        if (summary) {
          summaries.push(summary);
        }
      }

      // Calculate totals
      const totals = {
        date,
        totalStaff: summaries.length,
        totalApproved: summaries.reduce((sum, s) => sum + s.approvedCount, 0),
        totalRejected: summaries.reduce((sum, s) => sum + s.rejectedCount, 0),
        totalReturns: summaries.reduce((sum, s) => sum + s.returnsProcessed, 0),
        totalOverdueNotifications: summaries.reduce((sum, s) => sum + s.overdueNotificationsSent, 0),
        totalDamageReports: summaries.reduce((sum, s) => sum + s.damageReportsCreated, 0),
        totalActions: summaries.reduce((sum, s) => sum + s.totalActions, 0),
        staffSummaries: summaries
      };

      return totals;

    } catch (error) {
      console.error('Error generating daily summary report:', error);
      return null;
    }
  }

  /**
   * Get today's summary for display
   * @returns {Promise<Object>}
   */
  static async getTodaySummary() {
    const today = new Date().toISOString().split('T')[0];
    return this.generateDailySummaryReport(today);
  }
}

export default StaffActivityNotificationService;
