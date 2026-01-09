/**
 * Scheduled Report Service
 * 
 * Service for generating and managing scheduled reports.
 * Handles daily summary reports, weekly utilization reports, and report storage.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { 
  collection, 
  doc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  setDoc,
  limit as firestoreLimit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import ProactiveAlertService from './proactiveAlertService';
import EquipmentUsageAnalyzerService from './equipmentUsageAnalyzerService';
import UserReliabilityService from './userReliabilityService';
import { LOAN_REQUEST_STATUS } from '../types/loanRequest';
import { RESERVATION_STATUS } from '../types/reservation';

/**
 * Report types
 */
export const REPORT_TYPE = {
  DAILY_SUMMARY: 'daily_summary',
  WEEKLY_UTILIZATION: 'weekly_utilization',
  MONTHLY_ANALYTICS: 'monthly_analytics'
};

/**
 * Report status
 */
export const REPORT_STATUS = {
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * @typedef {Object} DailySummaryReport
 * @property {string} id - Report ID
 * @property {string} reportType - REPORT_TYPE.DAILY_SUMMARY
 * @property {string} period - Date string (YYYY-MM-DD)
 * @property {Object} data - Report data
 * @property {Date} generatedAt - Generation timestamp
 * @property {string[]} viewedBy - Array of admin UIDs who viewed
 * @property {number} downloadCount - Download count
 */

/**
 * @typedef {Object} WeeklyUtilizationReport
 * @property {string} id - Report ID
 * @property {string} reportType - REPORT_TYPE.WEEKLY_UTILIZATION
 * @property {string} period - Week string (YYYY-WNN)
 * @property {Object} data - Report data
 * @property {Date} generatedAt - Generation timestamp
 * @property {string[]} viewedBy - Array of admin UIDs who viewed
 * @property {number} downloadCount - Download count
 */

class ScheduledReportService {
  static REPORTS_COLLECTION = 'scheduledReports';
  static PREFERENCES_COLLECTION = 'reportPreferences';
  static LOANS_COLLECTION = 'loanRequests';
  static RESERVATIONS_COLLECTION = 'reservations';
  static EQUIPMENT_COLLECTION = 'equipmentManagement';
  static USERS_COLLECTION = 'users';

  // ============================================
  // Helper Functions
  // ============================================

  /**
   * Helper to convert various date formats to Date object
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
   * Generate daily period string (YYYY-MM-DD)
   * @param {Date} date - Date to generate period for
   * @returns {string} Period string
   */
  static generateDailyPeriod(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Generate weekly period string (YYYY-WNN)
   * @param {Date} date - Date to generate period for
   * @returns {string} Period string
   */
  static generateWeeklyPeriod(date) {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }

  /**
   * Get start and end of day
   * @param {Date} date - Date to get bounds for
   * @returns {Object} { start, end }
   */
  static getDayBounds(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Get start and end of week (Monday to Sunday)
   * @param {Date} date - Date within the week
   * @returns {Object} { start, end }
   */
  static getWeekBounds(date) {
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Monday start
    
    const start = new Date(date);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  // ============================================
  // Daily Summary Report (Requirement 9.1)
  // ============================================

  /**
   * Generate daily summary report
   * Requirement: 9.1
   * 
   * @param {Date} reportDate - Date for the report (defaults to today)
   * @returns {Promise<Object>} Generated report
   */
  static async generateDailySummaryReport(reportDate = new Date()) {
    try {
      const period = this.generateDailyPeriod(reportDate);
      const { start, end } = this.getDayBounds(reportDate);

      // Get loan activity for the day
      const loanActivity = await this._getDailyLoanActivity(start, end);

      // Get reservation activity for the day
      const reservationActivity = await this._getDailyReservationActivity(start, end);

      // Get alert summary with fallback
      let alertSummary;
      try {
        alertSummary = await ProactiveAlertService.getAlertStats();
      } catch (alertError) {
        console.warn('Error getting alert stats, using defaults:', alertError);
        alertSummary = {
          pending: 0,
          byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
          resolvedToday: 0
        };
      }

      // Get overdue summary with fallback
      let overdueSummary;
      try {
        overdueSummary = await ProactiveAlertService.getDailyOverdueSummary();
      } catch (overdueError) {
        console.warn('Error getting overdue summary, using defaults:', overdueError);
        overdueSummary = {
          totalOverdue: 0,
          byPriority: { critical: [], high: [], medium: [] },
          totalDaysOverdue: 0
        };
      }

      // Build report data
      const reportData = {
        date: period,
        loans: loanActivity,
        reservations: reservationActivity,
        alerts: {
          total: alertSummary.pending || 0,
          critical: alertSummary.byPriority?.critical || 0,
          high: alertSummary.byPriority?.high || 0,
          medium: alertSummary.byPriority?.medium || 0,
          low: alertSummary.byPriority?.low || 0,
          resolvedToday: alertSummary.resolvedToday || 0
        },
        overdue: {
          total: overdueSummary.totalOverdue || 0,
          critical: overdueSummary.byPriority?.critical?.length || 0,
          high: overdueSummary.byPriority?.high?.length || 0,
          medium: overdueSummary.byPriority?.medium?.length || 0,
          totalDaysOverdue: overdueSummary.totalDaysOverdue || 0
        },
        generatedAt: new Date()
      };

      // Store report (Requirement 9.3)
      const report = await this._storeReport(REPORT_TYPE.DAILY_SUMMARY, period, reportData);

      return report;
    } catch (error) {
      console.error('Error generating daily summary report:', error);
      throw error;
    }
  }

  /**
   * Get daily loan activity
   * @param {Date} start - Start of day
   * @param {Date} end - End of day
   * @returns {Promise<Object>} Loan activity summary
   */
  static async _getDailyLoanActivity(start, end) {
    try {
      const loansRef = collection(db, this.LOANS_COLLECTION);
      
      // Get all loans updated today
      const q = query(
        loansRef,
        where('updatedAt', '>=', Timestamp.fromDate(start)),
        where('updatedAt', '<=', Timestamp.fromDate(end))
      );

      const querySnapshot = await getDocs(q);
      
      const activity = {
        newRequests: 0,
        approved: 0,
        rejected: 0,
        borrowed: 0,
        returned: 0,
        overdue: 0,
        total: querySnapshot.size
      };

      querySnapshot.forEach((doc) => {
        const loan = doc.data();
        const createdAt = this._toDate(loan.createdAt);
        
        // Check if created today
        if (createdAt && createdAt >= start && createdAt <= end) {
          activity.newRequests++;
        }

        // Count by status
        switch (loan.status) {
          case LOAN_REQUEST_STATUS.APPROVED:
            activity.approved++;
            break;
          case LOAN_REQUEST_STATUS.REJECTED:
            activity.rejected++;
            break;
          case LOAN_REQUEST_STATUS.BORROWED:
            activity.borrowed++;
            break;
          case LOAN_REQUEST_STATUS.RETURNED:
            activity.returned++;
            break;
          case LOAN_REQUEST_STATUS.OVERDUE:
            activity.overdue++;
            break;
          default:
            // Other statuses not tracked
            break;
        }
      });

      return activity;
    } catch (error) {
      console.error('Error getting daily loan activity:', error);
      return {
        newRequests: 0,
        approved: 0,
        rejected: 0,
        borrowed: 0,
        returned: 0,
        overdue: 0,
        total: 0
      };
    }
  }

  /**
   * Get daily reservation activity
   * @param {Date} start - Start of day
   * @param {Date} end - End of day
   * @returns {Promise<Object>} Reservation activity summary
   */
  static async _getDailyReservationActivity(start, end) {
    try {
      const reservationsRef = collection(db, this.RESERVATIONS_COLLECTION);
      
      // Get all reservations updated today
      const q = query(
        reservationsRef,
        where('updatedAt', '>=', Timestamp.fromDate(start)),
        where('updatedAt', '<=', Timestamp.fromDate(end))
      );

      const querySnapshot = await getDocs(q);
      
      const activity = {
        newReservations: 0,
        approved: 0,
        cancelled: 0,
        completed: 0,
        noShows: 0,
        total: querySnapshot.size
      };

      querySnapshot.forEach((doc) => {
        const reservation = doc.data();
        const createdAt = this._toDate(reservation.createdAt);
        
        // Check if created today
        if (createdAt && createdAt >= start && createdAt <= end) {
          activity.newReservations++;
        }

        // Count by status
        switch (reservation.status) {
          case RESERVATION_STATUS.APPROVED:
          case RESERVATION_STATUS.READY:
            activity.approved++;
            break;
          case RESERVATION_STATUS.CANCELLED:
            activity.cancelled++;
            break;
          case RESERVATION_STATUS.COMPLETED:
            activity.completed++;
            break;
          case 'no_show':
            activity.noShows++;
            break;
          default:
            // Other statuses not tracked
            break;
        }
      });

      return activity;
    } catch (error) {
      console.error('Error getting daily reservation activity:', error);
      return {
        newReservations: 0,
        approved: 0,
        cancelled: 0,
        completed: 0,
        noShows: 0,
        total: 0
      };
    }
  }


  // ============================================
  // Weekly Utilization Report (Requirement 9.2)
  // ============================================

  /**
   * Generate weekly utilization report
   * Requirement: 9.2
   * 
   * @param {Date} reportDate - Date within the week (defaults to today)
   * @returns {Promise<Object>} Generated report
   */
  static async generateWeeklyUtilizationReport(reportDate = new Date()) {
    try {
      const period = this.generateWeeklyPeriod(reportDate);
      const { start, end } = this.getWeekBounds(reportDate);

      // Get equipment utilization data with fallback
      let utilizationData;
      try {
        utilizationData = await EquipmentUsageAnalyzerService.calculateAllEquipmentUtilization(7);
      } catch (utilError) {
        console.warn('Error getting utilization data, using defaults:', utilError);
        utilizationData = {
          utilizations: [],
          summary: { averageUtilization: 0, totalEquipment: 0, highDemandCount: 0, idleCount: 0 }
        };
      }

      // Get user reliability summary with fallback
      let userBehaviorSummary;
      try {
        userBehaviorSummary = await UserReliabilityService.getUserBehaviorSummary();
      } catch (userError) {
        console.warn('Error getting user behavior summary, using defaults:', userError);
        userBehaviorSummary = { totalUsers: 0, averageScore: 0 };
      }

      // Get weekly loan statistics
      const weeklyLoanStats = await this._getWeeklyLoanStatistics(start, end);

      // Get weekly reservation statistics
      const weeklyReservationStats = await this._getWeeklyReservationStatistics(start, end);

      // Get top borrowers for the week with fallback
      let topBorrowers = [];
      try {
        topBorrowers = await UserReliabilityService.getTopBorrowers(5);
      } catch (borrowerError) {
        console.warn('Error getting top borrowers:', borrowerError);
      }

      // Get most reliable users with fallback
      let mostReliable = [];
      try {
        mostReliable = await UserReliabilityService.getMostReliableUsers(5);
      } catch (reliableError) {
        console.warn('Error getting most reliable users:', reliableError);
      }

      // Build report data with safe access
      const utilizations = utilizationData?.utilizations || [];
      const reportData = {
        weekStart: start.toISOString(),
        weekEnd: end.toISOString(),
        equipment: {
          summary: utilizationData?.summary || {},
          highDemand: utilizations
            .filter(u => u.classification === 'high_demand')
            .slice(0, 10),
          idle: utilizations
            .filter(u => u.classification === 'idle')
            .slice(0, 10),
          averageUtilization: utilizationData?.summary?.averageUtilization || 0
        },
        users: {
          summary: userBehaviorSummary || {},
          topBorrowers: topBorrowers || [],
          mostReliable: mostReliable || []
        },
        loans: weeklyLoanStats,
        reservations: weeklyReservationStats,
        generatedAt: new Date()
      };

      // Store report (Requirement 9.3)
      const report = await this._storeReport(REPORT_TYPE.WEEKLY_UTILIZATION, period, reportData);

      return report;
    } catch (error) {
      console.error('Error generating weekly utilization report:', error);
      throw error;
    }
  }

  /**
   * Get weekly loan statistics
   * @param {Date} start - Start of week
   * @param {Date} end - End of week
   * @returns {Promise<Object>} Weekly loan statistics
   */
  static async _getWeeklyLoanStatistics(start, end) {
    try {
      const loansRef = collection(db, this.LOANS_COLLECTION);
      
      // Get loans created this week
      const q = query(
        loansRef,
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end))
      );

      const querySnapshot = await getDocs(q);
      
      const stats = {
        totalRequests: querySnapshot.size,
        byStatus: {},
        byDay: {},
        averageProcessingTime: 0
      };

      let totalProcessingTime = 0;
      let processedCount = 0;

      querySnapshot.forEach((doc) => {
        const loan = doc.data();
        
        // Count by status
        const status = loan.status || 'unknown';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        // Count by day
        const createdAt = this._toDate(loan.createdAt);
        if (createdAt) {
          const dayKey = this.generateDailyPeriod(createdAt);
          stats.byDay[dayKey] = (stats.byDay[dayKey] || 0) + 1;
        }

        // Calculate processing time for approved/rejected loans
        if (loan.approvedAt || loan.rejectedAt) {
          const createdTime = this._toDate(loan.createdAt);
          const processedTime = this._toDate(loan.approvedAt || loan.rejectedAt);
          if (createdTime && processedTime) {
            const processingMs = processedTime.getTime() - createdTime.getTime();
            totalProcessingTime += processingMs;
            processedCount++;
          }
        }
      });

      // Calculate average processing time in hours
      if (processedCount > 0) {
        stats.averageProcessingTime = Math.round(totalProcessingTime / processedCount / (1000 * 60 * 60) * 10) / 10;
      }

      return stats;
    } catch (error) {
      console.error('Error getting weekly loan statistics:', error);
      return {
        totalRequests: 0,
        byStatus: {},
        byDay: {},
        averageProcessingTime: 0
      };
    }
  }

  /**
   * Get weekly reservation statistics
   * @param {Date} start - Start of week
   * @param {Date} end - End of week
   * @returns {Promise<Object>} Weekly reservation statistics
   */
  static async _getWeeklyReservationStatistics(start, end) {
    try {
      const reservationsRef = collection(db, this.RESERVATIONS_COLLECTION);
      
      // Get reservations created this week
      const q = query(
        reservationsRef,
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end))
      );

      const querySnapshot = await getDocs(q);
      
      const stats = {
        totalReservations: querySnapshot.size,
        byStatus: {},
        byDay: {},
        noShowRate: 0
      };

      let noShowCount = 0;
      let completedOrNoShow = 0;

      querySnapshot.forEach((doc) => {
        const reservation = doc.data();
        
        // Count by status
        const status = reservation.status || 'unknown';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        // Count by day
        const createdAt = this._toDate(reservation.createdAt);
        if (createdAt) {
          const dayKey = this.generateDailyPeriod(createdAt);
          stats.byDay[dayKey] = (stats.byDay[dayKey] || 0) + 1;
        }

        // Track no-shows
        if (reservation.status === 'no_show' || reservation.isNoShow) {
          noShowCount++;
          completedOrNoShow++;
        } else if (reservation.status === RESERVATION_STATUS.COMPLETED) {
          completedOrNoShow++;
        }
      });

      // Calculate no-show rate
      if (completedOrNoShow > 0) {
        stats.noShowRate = Math.round((noShowCount / completedOrNoShow) * 100) / 100;
      }

      return stats;
    } catch (error) {
      console.error('Error getting weekly reservation statistics:', error);
      return {
        totalReservations: 0,
        byStatus: {},
        byDay: {},
        noShowRate: 0
      };
    }
  }

  // ============================================
  // Report Storage and Retrieval (Requirement 9.3)
  // ============================================

  /**
   * Store a generated report
   * Requirement: 9.3
   * 
   * @param {string} reportType - Report type from REPORT_TYPE
   * @param {string} period - Period identifier
   * @param {Object} data - Report data
   * @returns {Promise<Object>} Stored report with ID
   */
  static async _storeReport(reportType, period, data) {
    try {
      // Use composite key: reportType_period
      const docId = `${reportType}_${period}`;
      const docRef = doc(db, this.REPORTS_COLLECTION, docId);

      const report = {
        reportType,
        period,
        data,
        status: REPORT_STATUS.COMPLETED,
        generatedAt: serverTimestamp(),
        viewedBy: [],
        downloadCount: 0,
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, report);

      return {
        id: docId,
        ...report,
        generatedAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error storing report:', error);
      throw error;
    }
  }

  /**
   * Get a specific report by type and period
   * 
   * @param {string} reportType - Report type from REPORT_TYPE
   * @param {string} period - Period identifier
   * @returns {Promise<Object|null>} Report or null
   */
  static async getReport(reportType, period) {
    try {
      const docId = `${reportType}_${period}`;
      const docRef = doc(db, this.REPORTS_COLLECTION, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting report:', error);
      return null;
    }
  }

  /**
   * Get report history with pagination
   * Requirement: 9.5
   * 
   * @param {Object} options - Query options
   * @param {string} options.reportType - Filter by report type
   * @param {number} options.limit - Maximum reports to return
   * @returns {Promise<Array>} Array of reports
   */
  static async getReportHistory(options = {}) {
    try {
      console.log('[ScheduledReportService] getReportHistory called with options:', options);
      const reportsRef = collection(db, this.REPORTS_COLLECTION);
      const queryConstraints = [orderBy('generatedAt', 'desc')];

      if (options.reportType) {
        queryConstraints.unshift(where('reportType', '==', options.reportType));
      }

      if (options.limit) {
        queryConstraints.push(firestoreLimit(options.limit));
      }

      console.log('[ScheduledReportService] Executing query...');
      const q = query(reportsRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      console.log('[ScheduledReportService] Query returned', querySnapshot.size, 'documents');

      const reports = [];
      querySnapshot.forEach((doc) => {
        reports.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return reports;
    } catch (error) {
      console.error('[ScheduledReportService] Error getting report history:', error);
      return [];
    }
  }

  /**
   * Mark report as viewed by admin
   * 
   * @param {string} reportId - Report ID
   * @param {string} adminId - Admin UID
   * @returns {Promise<boolean>} Success status
   */
  static async markReportViewed(reportId, adminId) {
    try {
      const docRef = doc(db, this.REPORTS_COLLECTION, reportId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return false;
      }

      const report = docSnap.data();
      const viewedBy = report.viewedBy || [];

      if (!viewedBy.includes(adminId)) {
        viewedBy.push(adminId);
        await updateDoc(docRef, {
          viewedBy,
          updatedAt: serverTimestamp()
        });
      }

      return true;
    } catch (error) {
      console.error('Error marking report as viewed:', error);
      return false;
    }
  }

  /**
   * Increment report download count
   * 
   * @param {string} reportId - Report ID
   * @returns {Promise<boolean>} Success status
   */
  static async incrementDownloadCount(reportId) {
    try {
      const docRef = doc(db, this.REPORTS_COLLECTION, reportId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return false;
      }

      const report = docSnap.data();
      await updateDoc(docRef, {
        downloadCount: (report.downloadCount || 0) + 1,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error incrementing download count:', error);
      return false;
    }
  }


  // ============================================
  // Report Preferences (Requirement 9.4)
  // ============================================

  /**
   * Get report preferences for an admin
   * Requirement: 9.4
   * 
   * @param {string} adminId - Admin UID
   * @returns {Promise<Object>} Report preferences
   */
  static async getReportPreferences(adminId) {
    try {
      const docRef = doc(db, this.PREFERENCES_COLLECTION, adminId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }

      // Return default preferences
      return this._getDefaultPreferences(adminId);
    } catch (error) {
      console.error('Error getting report preferences:', error);
      return this._getDefaultPreferences(adminId);
    }
  }

  /**
   * Get default report preferences
   * @param {string} adminId - Admin UID
   * @returns {Object} Default preferences
   */
  static _getDefaultPreferences(adminId) {
    return {
      id: adminId,
      dailySummary: {
        enabled: true,
        autoGenerate: true
      },
      weeklyUtilization: {
        enabled: true,
        autoGenerate: true,
        dayOfWeek: 0 // Sunday
      },
      notifications: {
        emailOnGeneration: false,
        showInDashboard: true
      },
      displayOptions: {
        defaultReportType: REPORT_TYPE.DAILY_SUMMARY,
        itemsPerPage: 10
      }
    };
  }

  /**
   * Save report preferences for an admin
   * Requirement: 9.4
   * 
   * @param {string} adminId - Admin UID
   * @param {Object} preferences - Preferences to save
   * @returns {Promise<boolean>} Success status
   */
  static async saveReportPreferences(adminId, preferences) {
    try {
      const docRef = doc(db, this.PREFERENCES_COLLECTION, adminId);
      
      await setDoc(docRef, {
        ...preferences,
        adminId,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error saving report preferences:', error);
      return false;
    }
  }

  // ============================================
  // Report Generation Utilities
  // ============================================

  /**
   * Get latest report of a specific type
   * 
   * @param {string} reportType - Report type from REPORT_TYPE
   * @returns {Promise<Object|null>} Latest report or null
   */
  static async getLatestReport(reportType) {
    try {
      const reportsRef = collection(db, this.REPORTS_COLLECTION);
      const q = query(
        reportsRef,
        where('reportType', '==', reportType),
        orderBy('generatedAt', 'desc'),
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
      console.error('Error getting latest report:', error);
      return null;
    }
  }

  /**
   * Check if report exists for a period
   * 
   * @param {string} reportType - Report type
   * @param {string} period - Period identifier
   * @returns {Promise<boolean>} True if exists
   */
  static async reportExists(reportType, period) {
    const report = await this.getReport(reportType, period);
    return report !== null;
  }

  /**
   * Generate report if not exists for today/this week
   * 
   * @param {string} reportType - Report type
   * @returns {Promise<Object>} Report (existing or newly generated)
   */
  static async ensureReportExists(reportType) {
    const today = new Date();
    let period;

    if (reportType === REPORT_TYPE.DAILY_SUMMARY) {
      period = this.generateDailyPeriod(today);
    } else if (reportType === REPORT_TYPE.WEEKLY_UTILIZATION) {
      period = this.generateWeeklyPeriod(today);
    } else {
      throw new Error(`Unknown report type: ${reportType}`);
    }

    // Check if report exists
    const existingReport = await this.getReport(reportType, period);
    if (existingReport) {
      return existingReport;
    }

    // Generate new report
    if (reportType === REPORT_TYPE.DAILY_SUMMARY) {
      return await this.generateDailySummaryReport(today);
    } else {
      return await this.generateWeeklyUtilizationReport(today);
    }
  }

  /**
   * Get report summary for dashboard
   * 
   * @returns {Promise<Object>} Report summary
   */
  static async getReportSummary() {
    try {
      const today = new Date();
      const dailyPeriod = this.generateDailyPeriod(today);
      const weeklyPeriod = this.generateWeeklyPeriod(today);

      // Get latest reports
      const latestDaily = await this.getReport(REPORT_TYPE.DAILY_SUMMARY, dailyPeriod);
      const latestWeekly = await this.getReport(REPORT_TYPE.WEEKLY_UTILIZATION, weeklyPeriod);

      // Get report counts
      const reportsRef = collection(db, this.REPORTS_COLLECTION);
      const querySnapshot = await getDocs(reportsRef);

      let dailyCount = 0;
      let weeklyCount = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.reportType === REPORT_TYPE.DAILY_SUMMARY) {
          dailyCount++;
        } else if (data.reportType === REPORT_TYPE.WEEKLY_UTILIZATION) {
          weeklyCount++;
        }
      });

      return {
        latestDaily,
        latestWeekly,
        hasTodayReport: latestDaily !== null,
        hasThisWeekReport: latestWeekly !== null,
        totalDailyReports: dailyCount,
        totalWeeklyReports: weeklyCount,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting report summary:', error);
      return {
        latestDaily: null,
        latestWeekly: null,
        hasTodayReport: false,
        hasThisWeekReport: false,
        totalDailyReports: 0,
        totalWeeklyReports: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Export report data to JSON
   * 
   * @param {string} reportId - Report ID
   * @returns {Promise<string|null>} JSON string or null
   */
  static async exportReportToJSON(reportId) {
    try {
      const docRef = doc(db, this.REPORTS_COLLECTION, reportId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const report = docSnap.data();
      
      // Increment download count
      await this.incrementDownloadCount(reportId);

      return JSON.stringify(report.data, null, 2);
    } catch (error) {
      console.error('Error exporting report:', error);
      return null;
    }
  }

  /**
   * Delete old reports (cleanup)
   * 
   * @param {number} daysToKeep - Number of days to keep reports
   * @returns {Promise<number>} Number of deleted reports
   */
  static async cleanupOldReports(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const reportsRef = collection(db, this.REPORTS_COLLECTION);
      const q = query(
        reportsRef,
        where('generatedAt', '<', Timestamp.fromDate(cutoffDate))
      );

      const querySnapshot = await getDocs(q);
      let deletedCount = 0;

      // Note: In production, use batched deletes
      for (const docSnap of querySnapshot.docs) {
        await docSnap.ref.delete();
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old reports:', error);
      return 0;
    }
  }
}

export default ScheduledReportService;
