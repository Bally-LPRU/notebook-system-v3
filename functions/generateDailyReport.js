/**
 * Cloud Function: Daily Report Generator
 * 
 * This function runs daily at midnight to generate and store a daily summary report.
 * 
 * Schedule: Daily at midnight (00:00)
 * Trigger: Cloud Scheduler (Pub/Sub)
 * 
 * Requirement: 9.1
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Report types
const REPORT_TYPE = {
  DAILY_SUMMARY: 'daily_summary'
};

// Loan request statuses
const LOAN_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  BORROWED: 'borrowed',
  RETURNED: 'returned',
  OVERDUE: 'overdue'
};

// Reservation statuses
const RESERVATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  READY: 'ready',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

/**
 * Generate daily period string (YYYY-MM-DD)
 * @param {Date} date - Date to generate period for
 * @returns {string} Period string
 */
function generateDailyPeriod(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get start and end of day
 * @param {Date} date - Date to get bounds for
 * @returns {Object} { start, end }
 */
function getDayBounds(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Convert Firestore timestamp to Date
 * @param {*} value - Value to convert
 * @returns {Date|null} Date object or null
 */
function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
}

/**
 * Get daily loan activity
 * @param {Date} start - Start of day
 * @param {Date} end - End of day
 * @returns {Promise<Object>} Loan activity summary
 */
async function getDailyLoanActivity(start, end) {
  try {
    const loansRef = db.collection('loanRequests');
    
    // Get all loans updated today
    const q = loansRef
      .where('updatedAt', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('updatedAt', '<=', admin.firestore.Timestamp.fromDate(end));

    const querySnapshot = await q.get();
    
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
      const createdAt = toDate(loan.createdAt);
      
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
async function getDailyReservationActivity(start, end) {
  try {
    const reservationsRef = db.collection('reservations');
    
    // Get all reservations updated today
    const q = reservationsRef
      .where('updatedAt', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('updatedAt', '<=', admin.firestore.Timestamp.fromDate(end));

    const querySnapshot = await q.get();
    
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
      const createdAt = toDate(reservation.createdAt);
      
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
        case RESERVATION_STATUS.NO_SHOW:
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

/**
 * Get alert statistics
 * @returns {Promise<Object>} Alert statistics
 */
async function getAlertStats() {
  try {
    const alertsRef = db.collection('adminAlerts');
    const querySnapshot = await alertsRef.get();

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
      resolvedToday: 0
    };

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    querySnapshot.forEach((doc) => {
      const alert = doc.data();
      stats.total++;

      if (alert.isResolved) {
        stats.resolved++;
        
        // Check if resolved today
        const resolvedAt = toDate(alert.resolvedAt);
        if (resolvedAt && resolvedAt >= todayStart) {
          stats.resolvedToday++;
        }
      } else {
        stats.pending++;
        
        // Count by priority (only for pending)
        if (alert.priority && stats.byPriority[alert.priority] !== undefined) {
          stats.byPriority[alert.priority]++;
        }
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
      resolvedToday: 0
    };
  }
}

/**
 * Get overdue summary
 * @returns {Promise<Object>} Overdue summary
 */
async function getOverdueSummary() {
  try {
    const alertsRef = db.collection('adminAlerts');
    const q = alertsRef
      .where('type', '==', 'overdue_loan')
      .where('isResolved', '==', false);

    const querySnapshot = await q.get();

    const summary = {
      totalOverdue: 0,
      byPriority: {
        critical: [],
        high: [],
        medium: []
      },
      totalDaysOverdue: 0
    };

    querySnapshot.forEach((doc) => {
      const alert = doc.data();
      summary.totalOverdue++;
      summary.totalDaysOverdue += alert.sourceData?.daysOverdue || 0;

      const priorityList = summary.byPriority[alert.priority];
      if (priorityList) {
        priorityList.push({
          alertId: doc.id,
          loanId: alert.sourceId,
          equipmentName: alert.sourceData?.equipmentName,
          userName: alert.sourceData?.userName,
          daysOverdue: alert.sourceData?.daysOverdue
        });
      }
    });

    return summary;
  } catch (error) {
    console.error('Error getting overdue summary:', error);
    return {
      totalOverdue: 0,
      byPriority: { critical: [], high: [], medium: [] },
      totalDaysOverdue: 0
    };
  }
}

/**
 * Store report in Firestore
 * @param {string} reportType - Report type
 * @param {string} period - Period identifier
 * @param {Object} data - Report data
 * @returns {Promise<Object>} Stored report
 */
async function storeReport(reportType, period, data) {
  try {
    // Use composite key: reportType_period
    const docId = `${reportType}_${period}`;
    const docRef = db.collection('scheduledReports').doc(docId);

    const report = {
      reportType,
      period,
      data,
      status: 'completed',
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      viewedBy: [],
      downloadCount: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(report);

    console.log(`Stored report: ${docId}`);

    return {
      id: docId,
      ...report
    };
  } catch (error) {
    console.error('Error storing report:', error);
    throw error;
  }
}

/**
 * Main function: Generate daily summary report
 * Requirement: 9.1
 */
exports.generateDailyReport = functions.pubsub
  .schedule('0 0 * * *') // Daily at midnight
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    try {
      console.log('Starting daily report generation...');
      
      // Generate report for yesterday (since this runs at midnight)
      const reportDate = new Date();
      reportDate.setDate(reportDate.getDate() - 1);
      
      const period = generateDailyPeriod(reportDate);
      const { start, end } = getDayBounds(reportDate);

      console.log(`Generating daily report for ${period}`);

      // Get loan activity for the day
      const loanActivity = await getDailyLoanActivity(start, end);
      console.log('Loan activity:', loanActivity);

      // Get reservation activity for the day
      const reservationActivity = await getDailyReservationActivity(start, end);
      console.log('Reservation activity:', reservationActivity);

      // Get alert summary
      const alertSummary = await getAlertStats();
      console.log('Alert summary:', alertSummary);

      // Get overdue summary
      const overdueSummary = await getOverdueSummary();
      console.log('Overdue summary:', overdueSummary);

      // Build report data
      const reportData = {
        date: period,
        loans: loanActivity,
        reservations: reservationActivity,
        alerts: {
          total: alertSummary.pending,
          critical: alertSummary.byPriority.critical,
          high: alertSummary.byPriority.high,
          medium: alertSummary.byPriority.medium,
          low: alertSummary.byPriority.low,
          resolvedToday: alertSummary.resolvedToday
        },
        overdue: {
          total: overdueSummary.totalOverdue,
          critical: overdueSummary.byPriority.critical.length,
          high: overdueSummary.byPriority.high.length,
          medium: overdueSummary.byPriority.medium.length,
          totalDaysOverdue: overdueSummary.totalDaysOverdue
        },
        generatedAt: new Date().toISOString()
      };

      // Store report
      const report = await storeReport(REPORT_TYPE.DAILY_SUMMARY, period, reportData);

      console.log('Daily report generation completed successfully');
      console.log(`Report ID: ${report.id}`);

      return {
        success: true,
        reportId: report.id,
        period,
        summary: {
          totalLoans: loanActivity.total,
          totalReservations: reservationActivity.total,
          totalAlerts: alertSummary.pending,
          totalOverdue: overdueSummary.totalOverdue
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating daily report:', error);
      throw error;
    }
  });
