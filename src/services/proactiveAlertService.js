/**
 * Proactive Alert Service
 * 
 * Service for creating and managing proactive alerts for admin intelligence system.
 * Handles overdue loan detection, no-show reservation detection, and alert management.
 * 
 * Requirements: 1.1, 1.2, 2.1
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  ALERT_TYPE, 
  ALERT_PRIORITY, 
  QUICK_ACTION_TYPE,
  createQuickAction,
  getPriorityOrder
} from '../types/adminAlert';
import { LOAN_REQUEST_STATUS } from '../types/loanRequest';
import { RESERVATION_STATUS } from '../types/reservation';

class ProactiveAlertService {
  static COLLECTION_NAME = 'adminAlerts';

  /**
   * Calculate alert priority based on days overdue
   * - 0 days overdue → medium priority
   * - 1-2 days overdue → high priority
   * - 3+ days overdue → critical priority
   * 
   * @param {number} daysOverdue - Number of days overdue (can be negative if not yet due)
   * @returns {string} Alert priority from ALERT_PRIORITY
   */
  static calculateOverduePriority(daysOverdue) {
    if (daysOverdue >= 3) {
      return ALERT_PRIORITY.CRITICAL;
    }
    if (daysOverdue >= 1) {
      return ALERT_PRIORITY.HIGH;
    }
    if (daysOverdue >= 0) {
      return ALERT_PRIORITY.MEDIUM;
    }
    // Not yet overdue
    return ALERT_PRIORITY.LOW;
  }

  /**
   * Check if a reservation is a no-show
   * A reservation is considered a no-show if:
   * - Current time is more than 2 hours after the start time
   * - Reservation status is 'ready' (approved and waiting for pickup)
   * 
   * @param {Object} reservation - Reservation object with startTime and status
   * @param {Date} currentTime - Current time to check against
   * @returns {boolean} True if the reservation is a no-show
   */
  static isNoShow(reservation, currentTime) {
    if (!reservation || !reservation.startTime) {
      return false;
    }

    // Only check reservations with 'ready' status
    if (reservation.status !== 'ready') {
      return false;
    }

    // Convert startTime to Date if needed
    let startTime;
    if (reservation.startTime instanceof Date) {
      startTime = reservation.startTime;
    } else if (typeof reservation.startTime.toDate === 'function') {
      startTime = reservation.startTime.toDate();
    } else if (typeof reservation.startTime === 'string' || typeof reservation.startTime === 'number') {
      startTime = new Date(reservation.startTime);
    } else if (typeof reservation.startTime.seconds === 'number') {
      startTime = new Date(reservation.startTime.seconds * 1000);
    } else {
      return false;
    }

    // Calculate pickup deadline (2 hours after start time)
    const pickupDeadlineMs = startTime.getTime() + (2 * 60 * 60 * 1000);
    const pickupDeadline = new Date(pickupDeadlineMs);

    // Check if current time is past the pickup deadline
    return currentTime > pickupDeadline;
  }

  /**
   * Create a new alert
   * 
   * @param {Object} alertData - Alert data
   * @param {string} alertData.type - Alert type from ALERT_TYPE
   * @param {string} alertData.priority - Alert priority from ALERT_PRIORITY
   * @param {string} alertData.title - Alert title
   * @param {string} alertData.description - Alert description
   * @param {string} alertData.sourceId - ID of related entity
   * @param {string} alertData.sourceType - Type of source ('loan', 'reservation', 'equipment', 'user')
   * @param {Object} alertData.sourceData - Snapshot of related entity data
   * @param {Array} alertData.quickActions - Available quick actions
   * @returns {Promise<Object>} Created alert with ID
   */
  static async createAlert(alertData) {
    try {
      // Check if alert already exists for this source
      const existingAlert = await this.getAlertBySource(alertData.sourceId, alertData.type);
      if (existingAlert && !existingAlert.isResolved) {
        // Update existing alert instead of creating duplicate
        return await this.updateAlertPriority(existingAlert.id, alertData.priority);
      }

      const alert = {
        type: alertData.type,
        priority: alertData.priority || ALERT_PRIORITY.MEDIUM,
        title: alertData.title,
        description: alertData.description,
        sourceId: alertData.sourceId,
        sourceType: alertData.sourceType,
        sourceData: alertData.sourceData || {},
        quickActions: alertData.quickActions || [],
        isResolved: false,
        resolvedAt: null,
        resolvedBy: null,
        resolvedAction: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), alert);

      return {
        id: docRef.id,
        ...alert,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Resolve an alert
   * Requirements: 8.5, 8.6
   * 
   * @param {string} alertId - Alert ID to resolve
   * @param {string} resolvedBy - UID of admin who resolved
   * @param {string} resolvedAction - Action taken to resolve (from QUICK_ACTION_TYPE)
   * @returns {Promise<Object>} Updated alert
   */
  static async resolveAlert(alertId, resolvedBy, resolvedAction) {
    try {
      const alertRef = doc(db, this.COLLECTION_NAME, alertId);
      const alertDoc = await getDoc(alertRef);

      if (!alertDoc.exists()) {
        throw new Error('ไม่พบการแจ้งเตือนที่ต้องการ');
      }

      const alertData = alertDoc.data();
      const updateData = {
        isResolved: true,
        resolvedAt: serverTimestamp(),
        resolvedBy,
        resolvedAction,
        updatedAt: serverTimestamp()
      };

      await updateDoc(alertRef, updateData);

      // Log the resolution action to audit log (Requirement 8.5)
      await this.logAlertResolution(alertId, alertData, resolvedBy, resolvedAction);

      return {
        id: alertId,
        ...alertData,
        ...updateData,
        resolvedAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Log alert resolution to audit log
   * Requirement: 8.5
   * 
   * @param {string} alertId - Alert ID
   * @param {Object} alertData - Alert data before resolution
   * @param {string} resolvedBy - Admin ID who resolved
   * @param {string} resolvedAction - Action taken
   * @returns {Promise<void>}
   */
  static async logAlertResolution(alertId, alertData, resolvedBy, resolvedAction) {
    try {
      const auditLogRef = collection(db, 'alertAuditLog');
      await addDoc(auditLogRef, {
        alertId,
        alertType: alertData.type,
        alertPriority: alertData.priority,
        alertTitle: alertData.title,
        sourceId: alertData.sourceId,
        sourceType: alertData.sourceType,
        resolvedBy,
        resolvedAction,
        resolvedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    } catch (error) {
      // Don't throw - audit logging is secondary
      console.error('Error logging alert resolution:', error);
    }
  }

  /**
   * Get alert by source ID and type
   * 
   * @param {string} sourceId - Source entity ID
   * @param {string} alertType - Alert type
   * @returns {Promise<Object|null>} Alert or null
   */
  static async getAlertBySource(sourceId, alertType) {
    try {
      const alertsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        alertsRef,
        where('sourceId', '==', sourceId),
        where('type', '==', alertType),
        where('isResolved', '==', false),
        firestoreLimit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting alert by source:', error);
      return null;
    }
  }

  /**
   * Update alert priority (for escalation)
   * 
   * @param {string} alertId - Alert ID
   * @param {string} newPriority - New priority level
   * @returns {Promise<Object>} Updated alert
   */
  static async updateAlertPriority(alertId, newPriority) {
    try {
      const alertRef = doc(db, this.COLLECTION_NAME, alertId);
      const alertDoc = await getDoc(alertRef);

      if (!alertDoc.exists()) {
        throw new Error('ไม่พบการแจ้งเตือนที่ต้องการ');
      }

      const currentData = alertDoc.data();
      const currentPriorityOrder = getPriorityOrder(currentData.priority);
      const newPriorityOrder = getPriorityOrder(newPriority);

      // Only escalate (don't downgrade)
      if (newPriorityOrder < currentPriorityOrder) {
        await updateDoc(alertRef, {
          priority: newPriority,
          updatedAt: serverTimestamp()
        });

        return {
          id: alertId,
          ...currentData,
          priority: newPriority,
          updatedAt: new Date()
        };
      }

      return {
        id: alertId,
        ...currentData
      };
    } catch (error) {
      console.error('Error updating alert priority:', error);
      throw error;
    }
  }

  /**
   * Get all active (unresolved) alerts
   * 
   * @param {Object} filters - Filter options
   * @param {string} filters.type - Filter by alert type
   * @param {string} filters.priority - Filter by priority
   * @param {number} filters.limit - Maximum number of alerts to return
   * @returns {Promise<Array>} Array of alerts
   */
  static async getActiveAlerts(filters = {}) {
    try {
      const alertsRef = collection(db, this.COLLECTION_NAME);
      const queryConstraints = [
        where('isResolved', '==', false),
        orderBy('createdAt', 'desc')
      ];

      if (filters.type) {
        queryConstraints.unshift(where('type', '==', filters.type));
      }

      if (filters.priority) {
        queryConstraints.unshift(where('priority', '==', filters.priority));
      }

      if (filters.limit) {
        queryConstraints.push(firestoreLimit(filters.limit));
      }

      const q = query(alertsRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const alerts = [];
      querySnapshot.forEach((doc) => {
        alerts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by priority (critical first)
      alerts.sort((a, b) => getPriorityOrder(a.priority) - getPriorityOrder(b.priority));

      return alerts;
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Get alert by ID
   * 
   * @param {string} alertId - Alert ID
   * @returns {Promise<Object|null>} Alert or null
   */
  static async getAlertById(alertId) {
    try {
      const alertRef = doc(db, this.COLLECTION_NAME, alertId);
      const alertDoc = await getDoc(alertRef);

      if (alertDoc.exists()) {
        return {
          id: alertDoc.id,
          ...alertDoc.data()
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting alert by ID:', error);
      return null;
    }
  }

  /**
   * Get alert statistics
   * Requirement: 8.6
   * 
   * @returns {Promise<Object>} Alert statistics
   */
  static async getAlertStats() {
    try {
      const alertsRef = collection(db, this.COLLECTION_NAME);
      const querySnapshot = await getDocs(alertsRef);

      const stats = {
        total: 0,
        resolved: 0,
        pending: 0,
        byPriority: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        byType: {},
        resolvedToday: 0,
        resolvedThisWeek: 0
      };

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      querySnapshot.forEach((doc) => {
        const alert = doc.data();
        stats.total++;

        if (alert.isResolved) {
          stats.resolved++;
          
          // Check if resolved today or this week
          const resolvedAt = alert.resolvedAt?.toDate?.() || new Date(alert.resolvedAt);
          if (resolvedAt >= todayStart) {
            stats.resolvedToday++;
          }
          if (resolvedAt >= weekStart) {
            stats.resolvedThisWeek++;
          }
        } else {
          stats.pending++;
          
          // Count by priority (only for pending)
          if (alert.priority && stats.byPriority[alert.priority] !== undefined) {
            stats.byPriority[alert.priority]++;
          }
        }

        // Count by type
        if (alert.type) {
          stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting alert stats:', error);
      return {
        total: 0,
        resolved: 0,
        pending: 0,
        byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
        byType: {},
        resolvedToday: 0,
        resolvedThisWeek: 0
      };
    }
  }


  /**
   * Create quick actions for overdue loan alert
   * 
   * @param {Object} loan - Loan request object
   * @returns {Array} Array of quick actions
   */
  static createOverdueLoanQuickActions(loan) {
    return [
      createQuickAction(
        'send_reminder',
        'ส่งการแจ้งเตือน',
        QUICK_ACTION_TYPE.SEND_REMINDER,
        { loanId: loan.id, userId: loan.userId }
      ),
      createQuickAction(
        'mark_contacted',
        'ทำเครื่องหมายว่าติดต่อแล้ว',
        QUICK_ACTION_TYPE.MARK_CONTACTED,
        { loanId: loan.id }
      ),
      createQuickAction(
        'dismiss',
        'ปิดการแจ้งเตือน',
        QUICK_ACTION_TYPE.DISMISS,
        { loanId: loan.id }
      )
    ];
  }

  /**
   * Create quick actions for no-show reservation alert
   * 
   * @param {Object} reservation - Reservation object
   * @returns {Array} Array of quick actions
   */
  static createNoShowQuickActions(reservation) {
    return [
      createQuickAction(
        'cancel_reservation',
        'ยกเลิกการจอง',
        QUICK_ACTION_TYPE.CANCEL_RESERVATION,
        { reservationId: reservation.id }
      ),
      createQuickAction(
        'extend_pickup',
        'ขยายเวลารับ',
        QUICK_ACTION_TYPE.EXTEND_PICKUP_TIME,
        { reservationId: reservation.id }
      ),
      createQuickAction(
        'contact_user',
        'ติดต่อผู้ใช้',
        QUICK_ACTION_TYPE.CONTACT_USER,
        { reservationId: reservation.id, userId: reservation.userId }
      ),
      createQuickAction(
        'dismiss',
        'ปิดการแจ้งเตือน',
        QUICK_ACTION_TYPE.DISMISS,
        { reservationId: reservation.id }
      )
    ];
  }

  /**
   * Create an overdue loan alert
   * 
   * @param {Object} loan - Loan request object
   * @param {number} daysOverdue - Number of days overdue
   * @returns {Promise<Object>} Created alert
   */
  static async createOverdueLoanAlert(loan, daysOverdue) {
    const priority = this.calculateOverduePriority(daysOverdue);
    
    const title = daysOverdue >= 3 
      ? `การยืมเกินกำหนด ${daysOverdue} วัน (วิกฤต)`
      : `การยืมเกินกำหนด ${daysOverdue} วัน`;

    const description = `${loan.equipmentSnapshot?.name || loan.equipmentName || 'อุปกรณ์'} ` +
      `ยืมโดย ${loan.userSnapshot?.displayName || loan.userName || 'ผู้ใช้'} ` +
      `เกินกำหนดคืน ${daysOverdue} วัน`;

    return await this.createAlert({
      type: ALERT_TYPE.OVERDUE_LOAN,
      priority,
      title,
      description,
      sourceId: loan.id,
      sourceType: 'loan',
      sourceData: {
        loanId: loan.id,
        equipmentId: loan.equipmentId,
        equipmentName: loan.equipmentSnapshot?.name || loan.equipmentName,
        userId: loan.userId,
        userName: loan.userSnapshot?.displayName || loan.userName,
        userEmail: loan.userSnapshot?.email || loan.userEmail,
        expectedReturnDate: loan.expectedReturnDate,
        daysOverdue
      },
      quickActions: this.createOverdueLoanQuickActions(loan)
    });
  }

  /**
   * Create a no-show reservation alert
   * 
   * @param {Object} reservation - Reservation object
   * @returns {Promise<Object>} Created alert
   */
  static async createNoShowAlert(reservation) {
    const title = 'ไม่มารับอุปกรณ์ตามเวลาจอง';
    
    const description = `การจอง ${reservation.equipmentSnapshot?.name || 'อุปกรณ์'} ` +
      `โดย ${reservation.userSnapshot?.displayName || 'ผู้ใช้'} ` +
      `ไม่มารับภายในเวลาที่กำหนด`;

    return await this.createAlert({
      type: ALERT_TYPE.NO_SHOW_RESERVATION,
      priority: ALERT_PRIORITY.HIGH,
      title,
      description,
      sourceId: reservation.id,
      sourceType: 'reservation',
      sourceData: {
        reservationId: reservation.id,
        equipmentId: reservation.equipmentId,
        equipmentName: reservation.equipmentSnapshot?.name,
        userId: reservation.userId,
        userName: reservation.userSnapshot?.displayName,
        userEmail: reservation.userSnapshot?.email,
        startTime: reservation.startTime,
        endTime: reservation.endTime
      },
      quickActions: this.createNoShowQuickActions(reservation)
    });
  }

  /**
   * Create a repeat no-show offender alert
   * 
   * @param {Object} user - User object
   * @param {number} noShowCount - Number of no-shows in last 30 days
   * @returns {Promise<Object>} Created alert
   */
  static async createRepeatNoShowAlert(user, noShowCount) {
    const title = 'ผู้ใช้ไม่มารับอุปกรณ์ซ้ำหลายครั้ง';
    
    const description = `${user.displayName || user.email || 'ผู้ใช้'} ` +
      `ไม่มารับอุปกรณ์ ${noShowCount} ครั้งในช่วง 30 วันที่ผ่านมา`;

    return await this.createAlert({
      type: ALERT_TYPE.REPEAT_NO_SHOW_USER,
      priority: ALERT_PRIORITY.HIGH,
      title,
      description,
      sourceId: user.id || user.uid,
      sourceType: 'user',
      sourceData: {
        userId: user.id || user.uid,
        userName: user.displayName,
        userEmail: user.email,
        noShowCount,
        period: '30 days'
      },
      quickActions: [
        createQuickAction(
          'flag_user',
          'ทำเครื่องหมายผู้ใช้',
          QUICK_ACTION_TYPE.FLAG_USER,
          { userId: user.id || user.uid }
        ),
        createQuickAction(
          'contact_user',
          'ติดต่อผู้ใช้',
          QUICK_ACTION_TYPE.CONTACT_USER,
          { userId: user.id || user.uid }
        ),
        createQuickAction(
          'dismiss',
          'ปิดการแจ้งเตือน',
          QUICK_ACTION_TYPE.DISMISS,
          { userId: user.id || user.uid }
        )
      ]
    });
  }

  // ============================================
  // Overdue Loan Detection (Requirements 1.1, 1.2, 1.5)
  // ============================================

  /**
   * Helper to convert Firestore timestamp or Date to Date object
   * @param {*} value - Value to convert
   * @returns {Date|null} Date object or null
   */
  static _toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    return null;
  }

  /**
   * Calculate days overdue for a loan
   * @param {Object} loan - Loan request object
   * @param {Date} currentDate - Current date
   * @returns {number} Days overdue (negative if not yet due)
   */
  static calculateDaysOverdue(loan, currentDate = new Date()) {
    const expectedReturnDate = this._toDate(loan.expectedReturnDate);
    if (!expectedReturnDate) return 0;

    // Set both dates to start of day for accurate comparison
    const returnDateStart = new Date(expectedReturnDate);
    returnDateStart.setHours(0, 0, 0, 0);
    
    const currentDateStart = new Date(currentDate);
    currentDateStart.setHours(0, 0, 0, 0);

    const diffMs = currentDateStart.getTime() - returnDateStart.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Scan for overdue loans and create/update alerts
   * Requirements: 1.1, 1.2, 1.5
   * 
   * @returns {Promise<Object>} Scan results with created and escalated alerts
   */
  static async scanForOverdueLoans() {
    try {
      const currentDate = new Date();
      const results = {
        scanned: 0,
        newAlerts: 0,
        escalatedAlerts: 0,
        errors: []
      };

      // Query for borrowed loans (not yet returned)
      const loansRef = collection(db, 'loanRequests');
      const q = query(
        loansRef,
        where('status', 'in', [LOAN_REQUEST_STATUS.BORROWED, LOAN_REQUEST_STATUS.OVERDUE])
      );

      const querySnapshot = await getDocs(q);
      
      for (const docSnap of querySnapshot.docs) {
        results.scanned++;
        const loan = {
          id: docSnap.id,
          ...docSnap.data()
        };

        try {
          const daysOverdue = this.calculateDaysOverdue(loan, currentDate);

          // Only process if overdue (daysOverdue >= 0)
          if (daysOverdue >= 0) {
            const existingAlert = await this.getAlertBySource(loan.id, ALERT_TYPE.OVERDUE_LOAN);
            
            if (existingAlert) {
              // Check if priority needs escalation
              const newPriority = this.calculateOverduePriority(daysOverdue);
              const currentPriorityOrder = getPriorityOrder(existingAlert.priority);
              const newPriorityOrder = getPriorityOrder(newPriority);

              if (newPriorityOrder < currentPriorityOrder) {
                await this.updateAlertPriority(existingAlert.id, newPriority);
                results.escalatedAlerts++;
              }
            } else {
              // Create new alert
              await this.createOverdueLoanAlert(loan, daysOverdue);
              results.newAlerts++;
            }
          }
        } catch (loanError) {
          results.errors.push({
            loanId: loan.id,
            error: loanError.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error scanning for overdue loans:', error);
      throw error;
    }
  }

  /**
   * Get daily summary of overdue loans
   * Requirement: 1.5
   * 
   * @returns {Promise<Object>} Daily summary
   */
  static async getDailyOverdueSummary() {
    try {
      const currentDate = new Date();
      const summary = {
        date: currentDate.toISOString().split('T')[0],
        totalOverdue: 0,
        byPriority: {
          critical: [],
          high: [],
          medium: []
        },
        totalDaysOverdue: 0
      };

      // Get all active overdue alerts
      const alerts = await this.getActiveAlerts({
        type: ALERT_TYPE.OVERDUE_LOAN
      });

      for (const alert of alerts) {
        summary.totalOverdue++;
        summary.totalDaysOverdue += alert.sourceData?.daysOverdue || 0;

        const priorityList = summary.byPriority[alert.priority];
        if (priorityList) {
          priorityList.push({
            alertId: alert.id,
            loanId: alert.sourceId,
            equipmentName: alert.sourceData?.equipmentName,
            userName: alert.sourceData?.userName,
            daysOverdue: alert.sourceData?.daysOverdue
          });
        }
      }

      return summary;
    } catch (error) {
      console.error('Error getting daily overdue summary:', error);
      throw error;
    }
  }

  // ============================================
  // No-Show Reservation Detection (Requirements 2.1, 2.4, 2.5)
  // ============================================

  /**
   * Scan for no-show reservations and create alerts
   * Requirements: 2.1, 2.4
   * 
   * @returns {Promise<Object>} Scan results
   */
  static async scanForNoShowReservations() {
    try {
      const currentTime = new Date();
      const results = {
        scanned: 0,
        newAlerts: 0,
        errors: []
      };

      // Query for reservations with 'ready' status (approved and waiting for pickup)
      const reservationsRef = collection(db, 'reservations');
      const q = query(
        reservationsRef,
        where('status', '==', RESERVATION_STATUS.READY)
      );

      const querySnapshot = await getDocs(q);
      
      for (const docSnap of querySnapshot.docs) {
        results.scanned++;
        const reservation = {
          id: docSnap.id,
          ...docSnap.data()
        };

        try {
          // Check if this reservation is a no-show
          if (this.isNoShow(reservation, currentTime)) {
            // Check if alert already exists
            const existingAlert = await this.getAlertBySource(reservation.id, ALERT_TYPE.NO_SHOW_RESERVATION);
            
            if (!existingAlert) {
              // Create new no-show alert
              await this.createNoShowAlert(reservation);
              results.newAlerts++;

              // Track no-show for user pattern detection
              await this.trackUserNoShow(reservation.userId);
            }
          }
        } catch (reservationError) {
          results.errors.push({
            reservationId: reservation.id,
            error: reservationError.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error scanning for no-show reservations:', error);
      throw error;
    }
  }

  /**
   * Track user no-show for pattern detection
   * Stores no-show events in userNoShows collection
   * 
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async trackUserNoShow(userId) {
    try {
      const noShowsRef = collection(db, 'userNoShows');
      await addDoc(noShowsRef, {
        userId,
        occurredAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error tracking user no-show:', error);
      // Don't throw - this is a secondary operation
    }
  }

  /**
   * Get user's no-show count in the last N days
   * 
   * @param {string} userId - User ID
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Promise<number>} No-show count
   */
  static async getUserNoShowCount(userId, days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const noShowsRef = collection(db, 'userNoShows');
      const q = query(
        noShowsRef,
        where('userId', '==', userId),
        where('occurredAt', '>=', cutoffDate)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting user no-show count:', error);
      return 0;
    }
  }

  /**
   * Check if user is a repeat no-show offender (3+ no-shows in 30 days)
   * Requirement: 2.5
   * 
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if repeat offender
   */
  static async isRepeatNoShowOffender(userId) {
    const noShowCount = await this.getUserNoShowCount(userId, 30);
    return noShowCount >= 3;
  }

  /**
   * Scan for repeat no-show offenders and create alerts
   * Requirements: 2.4, 2.5
   * 
   * @returns {Promise<Object>} Scan results
   */
  static async scanForRepeatNoShowOffenders() {
    try {
      const results = {
        usersChecked: 0,
        newAlerts: 0,
        errors: []
      };

      // Get all unique users with recent no-shows
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const noShowsRef = collection(db, 'userNoShows');
      const q = query(
        noShowsRef,
        where('occurredAt', '>=', cutoffDate)
      );

      const querySnapshot = await getDocs(q);
      
      // Group by userId and count
      const userNoShowCounts = {};
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const userId = data.userId;
        userNoShowCounts[userId] = (userNoShowCounts[userId] || 0) + 1;
      });

      // Check each user with 3+ no-shows
      for (const [userId, count] of Object.entries(userNoShowCounts)) {
        results.usersChecked++;

        if (count >= 3) {
          try {
            // Check if alert already exists for this user
            const existingAlert = await this.getAlertBySource(userId, ALERT_TYPE.REPEAT_NO_SHOW_USER);
            
            if (!existingAlert) {
              // Get user data
              const userRef = doc(db, 'users', userId);
              const userDoc = await getDoc(userRef);
              
              if (userDoc.exists()) {
                const userData = {
                  id: userId,
                  ...userDoc.data()
                };
                
                await this.createRepeatNoShowAlert(userData, count);
                results.newAlerts++;
              }
            }
          } catch (userError) {
            results.errors.push({
              userId,
              error: userError.message
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error scanning for repeat no-show offenders:', error);
      throw error;
    }
  }

  /**
   * Get no-show patterns for a user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User no-show patterns
   */
  static async getUserNoShowPatterns(userId) {
    try {
      const noShowsRef = collection(db, 'userNoShows');
      const q = query(
        noShowsRef,
        where('userId', '==', userId),
        orderBy('occurredAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      const noShows = [];
      querySnapshot.forEach((docSnap) => {
        noShows.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      // Calculate patterns
      const last30Days = await this.getUserNoShowCount(userId, 30);
      const last60Days = await this.getUserNoShowCount(userId, 60);
      const last90Days = await this.getUserNoShowCount(userId, 90);

      return {
        userId,
        totalNoShows: noShows.length,
        last30Days,
        last60Days,
        last90Days,
        isRepeatOffender: last30Days >= 3,
        recentNoShows: noShows.slice(0, 10) // Last 10 no-shows
      };
    } catch (error) {
      console.error('Error getting user no-show patterns:', error);
      return {
        userId,
        totalNoShows: 0,
        last30Days: 0,
        last60Days: 0,
        last90Days: 0,
        isRepeatOffender: false,
        recentNoShows: []
      };
    }
  }
}

export default ProactiveAlertService;
