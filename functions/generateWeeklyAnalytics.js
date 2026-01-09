/**
 * Cloud Function: Weekly Analytics Generator
 * 
 * This function runs weekly on Sunday to calculate equipment utilization
 * and user reliability scores, then generates a weekly report.
 * 
 * Schedule: Weekly on Sunday at 00:00
 * Trigger: Cloud Scheduler (Pub/Sub)
 * 
 * Requirements: 3.6, 9.2
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
  WEEKLY_UTILIZATION: 'weekly_utilization'
};

// Equipment classification
const EQUIPMENT_CLASSIFICATION = {
  HIGH_DEMAND: 'high_demand',
  NORMAL: 'normal',
  IDLE: 'idle'
};

// User classification
const USER_CLASSIFICATION = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor'
};

// Thresholds
const UTILIZATION_THRESHOLDS = {
  HIGH_DEMAND: 0.8,
  IDLE_DAYS: 60
};

const RELIABILITY_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 70,
  FAIR: 50
};

const SCORE_WEIGHTS = {
  ON_TIME_RETURN: 0.6,
  NO_SHOW: 0.4
};

/**
 * Generate weekly period string (YYYY-WNN)
 * @param {Date} date - Date to generate period for
 * @returns {string} Period string
 */
function generateWeeklyPeriod(date) {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Get start and end of week (Monday to Sunday)
 * @param {Date} date - Date within the week
 * @returns {Object} { start, end }
 */
function getWeekBounds(date) {
  const dayOfWeek = date.getDay();
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  
  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
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
 * Calculate utilization rate
 * @param {number} borrowedDays - Days borrowed
 * @param {number} totalDays - Total days
 * @returns {number} Utilization rate (0-1)
 */
function calculateUtilizationRate(borrowedDays, totalDays) {
  if (totalDays <= 0) return 0;
  if (borrowedDays < 0) return 0;
  const rate = borrowedDays / totalDays;
  return Math.min(Math.max(rate, 0), 1);
}

/**
 * Classify equipment based on utilization
 * @param {number} utilizationRate - Utilization rate
 * @param {Date|null} lastBorrowedDate - Last borrowed date
 * @param {Date} currentDate - Current date
 * @returns {string} Classification
 */
function classifyEquipment(utilizationRate, lastBorrowedDate, currentDate) {
  if (utilizationRate >= UTILIZATION_THRESHOLDS.HIGH_DEMAND) {
    return EQUIPMENT_CLASSIFICATION.HIGH_DEMAND;
  }
  
  if (lastBorrowedDate === null) {
    return EQUIPMENT_CLASSIFICATION.IDLE;
  }

  const daysSinceLastBorrow = Math.floor(
    (currentDate - lastBorrowedDate) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceLastBorrow >= UTILIZATION_THRESHOLDS.IDLE_DAYS) {
    return EQUIPMENT_CLASSIFICATION.IDLE;
  }
  
  return EQUIPMENT_CLASSIFICATION.NORMAL;
}

/**
 * Calculate equipment utilization for all equipment
 * @param {number} analysisDays - Number of days to analyze
 * @returns {Promise<Object>} Utilization data
 */
async function calculateEquipmentUtilization(analysisDays = 7) {
  try {
    console.log(`Calculating equipment utilization for ${analysisDays} days...`);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - analysisDays);

    // Get all active equipment
    const equipmentRef = db.collection('equipmentManagement');
    const equipmentQuery = equipmentRef.where('isActive', '==', true);
    const equipmentSnapshot = await equipmentQuery.get();

    const utilizations = [];
    let totalUtilization = 0;
    let highDemandCount = 0;
    let idleCount = 0;
    let normalCount = 0;

    for (const equipmentDoc of equipmentSnapshot.docs) {
      const equipment = {
        id: equipmentDoc.id,
        ...equipmentDoc.data()
      };

      // Get loan history for this equipment
      const loansRef = db.collection('loanRequests');
      const loansQuery = loansRef
        .where('equipmentId', '==', equipment.id)
        .where('status', 'in', ['borrowed', 'returned', 'overdue']);

      const loansSnapshot = await loansQuery.get();

      let borrowedDays = 0;
      let totalLoans = 0;
      let lastBorrowedDate = null;

      loansSnapshot.forEach((loanDoc) => {
        const loan = loanDoc.data();
        const borrowDate = toDate(loan.borrowDate) || toDate(loan.pickedUpAt);
        const returnDate = toDate(loan.actualReturnDate) || 
                          toDate(loan.expectedReturnDate) ||
                          (loan.status === 'borrowed' ? new Date() : null);

        if (!borrowDate) return;

        const effectiveStart = new Date(Math.max(borrowDate.getTime(), startDate.getTime()));
        const effectiveEnd = returnDate 
          ? new Date(Math.min(returnDate.getTime(), endDate.getTime()))
          : new Date(Math.min(new Date().getTime(), endDate.getTime()));

        if (effectiveStart < effectiveEnd) {
          const daysInPeriod = Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24));
          borrowedDays += daysInPeriod;
          totalLoans++;

          if (!lastBorrowedDate || borrowDate > lastBorrowedDate) {
            lastBorrowedDate = borrowDate;
          }
        }
      });

      const utilizationRate = calculateUtilizationRate(borrowedDays, analysisDays);
      const classification = classifyEquipment(utilizationRate, lastBorrowedDate, endDate);

      utilizations.push({
        equipmentId: equipment.id,
        equipmentName: equipment.name || 'Unknown',
        category: equipment.category || equipment.categoryId || '',
        totalDays: analysisDays,
        borrowedDays,
        utilizationRate,
        classification,
        lastBorrowedDate: lastBorrowedDate ? lastBorrowedDate.toISOString() : null,
        totalLoans
      });

      totalUtilization += utilizationRate;

      switch (classification) {
        case EQUIPMENT_CLASSIFICATION.HIGH_DEMAND:
          highDemandCount++;
          break;
        case EQUIPMENT_CLASSIFICATION.IDLE:
          idleCount++;
          break;
        default:
          normalCount++;
      }
    }

    const summary = {
      totalEquipment: utilizations.length,
      highDemandCount,
      normalCount,
      idleCount,
      averageUtilization: utilizations.length > 0 ? totalUtilization / utilizations.length : 0
    };

    console.log('Equipment utilization calculated:', summary);

    return { utilizations, summary };
  } catch (error) {
    console.error('Error calculating equipment utilization:', error);
    return {
      utilizations: [],
      summary: {
        totalEquipment: 0,
        highDemandCount: 0,
        normalCount: 0,
        idleCount: 0,
        averageUtilization: 0
      }
    };
  }
}

/**
 * Calculate reliability score
 * @param {number} onTimeReturnRate - On-time return rate (0-1)
 * @param {number} noShowRate - No-show rate (0-1)
 * @returns {number} Reliability score (0-100)
 */
function calculateReliabilityScore(onTimeReturnRate, noShowRate) {
  const validOnTimeRate = Math.max(0, Math.min(1, onTimeReturnRate || 0));
  const validNoShowRate = Math.max(0, Math.min(1, noShowRate || 0));

  const returnComponent = validOnTimeRate * SCORE_WEIGHTS.ON_TIME_RETURN;
  const noShowComponent = (1 - validNoShowRate) * SCORE_WEIGHTS.NO_SHOW;
  
  const score = (returnComponent + noShowComponent) * 100;
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Classify user based on reliability score
 * @param {number} reliabilityScore - Reliability score (0-100)
 * @returns {string} Classification
 */
function classifyUser(reliabilityScore) {
  if (reliabilityScore >= RELIABILITY_THRESHOLDS.EXCELLENT) {
    return USER_CLASSIFICATION.EXCELLENT;
  }
  if (reliabilityScore >= RELIABILITY_THRESHOLDS.GOOD) {
    return USER_CLASSIFICATION.GOOD;
  }
  if (reliabilityScore >= RELIABILITY_THRESHOLDS.FAIR) {
    return USER_CLASSIFICATION.FAIR;
  }
  return USER_CLASSIFICATION.POOR;
}

/**
 * Calculate user reliability scores for all users
 * @returns {Promise<Object>} User reliability data
 */
async function calculateUserReliability() {
  try {
    console.log('Calculating user reliability scores...');
    
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    const reliabilities = [];
    let totalScore = 0;
    let excellentCount = 0;
    let goodCount = 0;
    let fairCount = 0;
    let poorCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const user = {
        id: userDoc.id,
        ...userDoc.data()
      };

      // Get loan history
      const loansRef = db.collection('loanRequests');
      const loansQuery = loansRef.where('userId', '==', user.id);
      const loansSnapshot = await loansQuery.get();

      let totalLoans = 0;
      let onTimeReturns = 0;
      let lateReturns = 0;

      loansSnapshot.forEach((loanDoc) => {
        const loan = loanDoc.data();
        
        if (loan.status === 'returned') {
          totalLoans++;
          const expectedReturnDate = toDate(loan.expectedReturnDate);
          const actualReturnDate = toDate(loan.actualReturnDate);

          if (expectedReturnDate && actualReturnDate) {
            const expectedEnd = new Date(expectedReturnDate);
            expectedEnd.setHours(23, 59, 59, 999);
            
            if (actualReturnDate <= expectedEnd) {
              onTimeReturns++;
            } else {
              lateReturns++;
            }
          } else {
            onTimeReturns++;
          }
        } else if (loan.status === 'overdue') {
          totalLoans++;
          lateReturns++;
        }
      });

      // Get reservation history
      const reservationsRef = db.collection('reservations');
      const reservationsQuery = reservationsRef.where('userId', '==', user.id);
      const reservationsSnapshot = await reservationsQuery.get();

      let totalReservations = 0;
      let noShows = 0;

      reservationsSnapshot.forEach((reservationDoc) => {
        const reservation = reservationDoc.data();
        
        if (['approved', 'ready', 'completed', 'cancelled', 'no_show'].includes(reservation.status)) {
          totalReservations++;
          
          if (reservation.status === 'no_show' || reservation.isNoShow === true) {
            noShows++;
          }
        }
      });

      const onTimeReturnRate = totalLoans > 0 ? onTimeReturns / totalLoans : 1;
      const noShowRate = totalReservations > 0 ? noShows / totalReservations : 0;
      const reliabilityScore = calculateReliabilityScore(onTimeReturnRate, noShowRate);
      const classification = classifyUser(reliabilityScore);

      reliabilities.push({
        userId: user.id,
        userName: user.displayName || user.name || '',
        userEmail: user.email || '',
        totalLoans,
        onTimeReturns,
        lateReturns,
        onTimeReturnRate,
        totalReservations,
        noShows,
        noShowRate,
        reliabilityScore,
        classification
      });

      // Store in userReliability collection
      await db.collection('userReliability').doc(user.id).set({
        userId: user.id,
        userName: user.displayName || user.name || '',
        userEmail: user.email || '',
        totalLoans,
        onTimeReturns,
        lateReturns,
        onTimeReturnRate,
        totalReservations,
        noShows,
        noShowRate,
        reliabilityScore,
        classification,
        recentNoShows: 0, // Would need to calculate from userNoShows collection
        isRepeatOffender: false,
        isFlagged: reliabilityScore < RELIABILITY_THRESHOLDS.FAIR,
        lastCalculatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      totalScore += reliabilityScore;

      switch (classification) {
        case USER_CLASSIFICATION.EXCELLENT:
          excellentCount++;
          break;
        case USER_CLASSIFICATION.GOOD:
          goodCount++;
          break;
        case USER_CLASSIFICATION.FAIR:
          fairCount++;
          break;
        case USER_CLASSIFICATION.POOR:
          poorCount++;
          break;
      }
    }

    const summary = {
      totalUsers: reliabilities.length,
      excellentCount,
      goodCount,
      fairCount,
      poorCount,
      averageReliabilityScore: reliabilities.length > 0 ? Math.round(totalScore / reliabilities.length) : 0
    };

    console.log('User reliability calculated:', summary);

    // Get top borrowers and most reliable
    const topBorrowers = reliabilities
      .filter(r => r.totalLoans > 0)
      .sort((a, b) => b.totalLoans - a.totalLoans)
      .slice(0, 5);

    const mostReliable = reliabilities
      .filter(r => r.totalLoans >= 3)
      .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
      .slice(0, 5);

    return { reliabilities, summary, topBorrowers, mostReliable };
  } catch (error) {
    console.error('Error calculating user reliability:', error);
    return {
      reliabilities: [],
      summary: {
        totalUsers: 0,
        excellentCount: 0,
        goodCount: 0,
        fairCount: 0,
        poorCount: 0,
        averageReliabilityScore: 0
      },
      topBorrowers: [],
      mostReliable: []
    };
  }
}

/**
 * Get weekly loan statistics
 * @param {Date} start - Start of week
 * @param {Date} end - End of week
 * @returns {Promise<Object>} Weekly loan statistics
 */
async function getWeeklyLoanStatistics(start, end) {
  try {
    const loansRef = db.collection('loanRequests');
    const q = loansRef
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(end));

    const querySnapshot = await q.get();
    
    const stats = {
      totalRequests: querySnapshot.size,
      byStatus: {},
      byDay: {}
    };

    querySnapshot.forEach((doc) => {
      const loan = doc.data();
      
      const status = loan.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      const createdAt = toDate(loan.createdAt);
      if (createdAt) {
        const dayKey = createdAt.toISOString().split('T')[0];
        stats.byDay[dayKey] = (stats.byDay[dayKey] || 0) + 1;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting weekly loan statistics:', error);
    return { totalRequests: 0, byStatus: {}, byDay: {} };
  }
}

/**
 * Get weekly reservation statistics
 * @param {Date} start - Start of week
 * @param {Date} end - End of week
 * @returns {Promise<Object>} Weekly reservation statistics
 */
async function getWeeklyReservationStatistics(start, end) {
  try {
    const reservationsRef = db.collection('reservations');
    const q = reservationsRef
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(end));

    const querySnapshot = await q.get();
    
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
      
      const status = reservation.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      const createdAt = toDate(reservation.createdAt);
      if (createdAt) {
        const dayKey = createdAt.toISOString().split('T')[0];
        stats.byDay[dayKey] = (stats.byDay[dayKey] || 0) + 1;
      }

      if (reservation.status === 'no_show' || reservation.isNoShow) {
        noShowCount++;
        completedOrNoShow++;
      } else if (reservation.status === 'completed') {
        completedOrNoShow++;
      }
    });

    if (completedOrNoShow > 0) {
      stats.noShowRate = Math.round((noShowCount / completedOrNoShow) * 100) / 100;
    }

    return stats;
  } catch (error) {
    console.error('Error getting weekly reservation statistics:', error);
    return { totalReservations: 0, byStatus: {}, byDay: {}, noShowRate: 0 };
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
 * Main function: Generate weekly analytics report
 * Requirements: 3.6, 9.2
 */
exports.generateWeeklyAnalytics = functions.pubsub
  .schedule('0 0 * * 0') // Weekly on Sunday at midnight
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    try {
      console.log('Starting weekly analytics generation...');
      
      // Generate report for the week that just ended
      const reportDate = new Date();
      reportDate.setDate(reportDate.getDate() - 1); // Yesterday (Saturday)
      
      const period = generateWeeklyPeriod(reportDate);
      const { start, end } = getWeekBounds(reportDate);

      console.log(`Generating weekly analytics for ${period}`);
      console.log(`Week: ${start.toISOString()} to ${end.toISOString()}`);

      // Calculate equipment utilization (Requirement 3.6)
      const utilizationData = await calculateEquipmentUtilization(7);

      // Calculate user reliability scores
      const userReliabilityData = await calculateUserReliability();

      // Get weekly loan statistics
      const weeklyLoanStats = await getWeeklyLoanStatistics(start, end);

      // Get weekly reservation statistics
      const weeklyReservationStats = await getWeeklyReservationStatistics(start, end);

      // Build report data
      const reportData = {
        weekStart: start.toISOString(),
        weekEnd: end.toISOString(),
        equipment: {
          summary: utilizationData.summary,
          highDemand: utilizationData.utilizations
            .filter(u => u.classification === EQUIPMENT_CLASSIFICATION.HIGH_DEMAND)
            .slice(0, 10),
          idle: utilizationData.utilizations
            .filter(u => u.classification === EQUIPMENT_CLASSIFICATION.IDLE)
            .slice(0, 10),
          averageUtilization: utilizationData.summary.averageUtilization
        },
        users: {
          summary: userReliabilityData.summary,
          topBorrowers: userReliabilityData.topBorrowers,
          mostReliable: userReliabilityData.mostReliable
        },
        loans: weeklyLoanStats,
        reservations: weeklyReservationStats,
        generatedAt: new Date().toISOString()
      };

      // Store report (Requirement 9.2)
      const report = await storeReport(REPORT_TYPE.WEEKLY_UTILIZATION, period, reportData);

      console.log('Weekly analytics generation completed successfully');
      console.log(`Report ID: ${report.id}`);

      return {
        success: true,
        reportId: report.id,
        period,
        summary: {
          totalEquipment: utilizationData.summary.totalEquipment,
          highDemandEquipment: utilizationData.summary.highDemandCount,
          idleEquipment: utilizationData.summary.idleCount,
          totalUsers: userReliabilityData.summary.totalUsers,
          averageReliabilityScore: userReliabilityData.summary.averageReliabilityScore,
          totalLoans: weeklyLoanStats.totalRequests,
          totalReservations: weeklyReservationStats.totalReservations
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating weekly analytics:', error);
      throw error;
    }
  });
