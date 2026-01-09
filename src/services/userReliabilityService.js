/**
 * User Reliability Service
 * 
 * Service for tracking and calculating user reliability scores.
 * Analyzes user behavior including on-time returns and no-show rates.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.5
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  USER_CLASSIFICATION, 
  RELIABILITY_THRESHOLDS,
  SCORE_WEIGHTS,
  createUserReliability,
  createUserBehaviorSummary
} from '../types/userReliability';
import { LOAN_REQUEST_STATUS } from '../types/loanRequest';

class UserReliabilityService {
  static RELIABILITY_COLLECTION = 'userReliability';
  static USERS_COLLECTION = 'users';
  static LOANS_COLLECTION = 'loanRequests';
  static RESERVATIONS_COLLECTION = 'reservations';
  static NO_SHOWS_COLLECTION = 'userNoShows';

  // ============================================
  // Core Calculation Functions (Requirements 10.1, 10.2)
  // ============================================

  /**
   * Calculate reliability score for a user
   * Score = (onTimeReturnRate * 0.6) + ((1 - noShowRate) * 0.4) * 100
   * Result is bounded between 0 and 100
   * 
   * Requirement: 10.1
   * 
   * @param {number} onTimeReturnRate - On-time return rate (0-1)
   * @param {number} noShowRate - No-show rate (0-1)
   * @returns {number} Reliability score (0-100)
   */
  static calculateReliabilityScore(onTimeReturnRate, noShowRate) {
    // Validate inputs - treat invalid values as 0
    const validOnTimeRate = (typeof onTimeReturnRate === 'number' && !isNaN(onTimeReturnRate))
      ? Math.max(0, Math.min(1, onTimeReturnRate))
      : 0;
    
    const validNoShowRate = (typeof noShowRate === 'number' && !isNaN(noShowRate))
      ? Math.max(0, Math.min(1, noShowRate))
      : 0;

    // Calculate score using weights
    const returnComponent = validOnTimeRate * SCORE_WEIGHTS.ON_TIME_RETURN;
    const noShowComponent = (1 - validNoShowRate) * SCORE_WEIGHTS.NO_SHOW;
    
    const score = (returnComponent + noShowComponent) * 100;
    
    // Bound between 0 and 100 and round
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Check if user is a repeat no-show offender
   * A user is a repeat offender if they have 3+ no-shows in the last 30 days
   * 
   * Requirement: 10.2 (related to 2.5)
   * 
   * @param {number} recentNoShows - Number of no-shows in last 30 days
   * @returns {boolean} True if repeat offender
   */
  static isRepeatNoShowOffender(recentNoShows) {
    if (typeof recentNoShows !== 'number' || isNaN(recentNoShows)) {
      return false;
    }
    return recentNoShows >= RELIABILITY_THRESHOLDS.NO_SHOW_LIMIT;
  }

  /**
   * Classify user based on reliability score
   * - Excellent: score >= 90
   * - Good: score >= 70
   * - Fair: score >= 50
   * - Poor: score < 50
   * 
   * Requirement: 10.1
   * 
   * @param {number} reliabilityScore - Reliability score (0-100)
   * @returns {string} User classification from USER_CLASSIFICATION
   */
  static classifyUser(reliabilityScore) {
    if (typeof reliabilityScore !== 'number' || isNaN(reliabilityScore)) {
      return USER_CLASSIFICATION.FAIR;
    }

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
   * Check if user should be flagged for review
   * Users with reliability score below 50% should be flagged
   * 
   * Requirement: 10.2
   * 
   * @param {number} reliabilityScore - Reliability score (0-100)
   * @returns {boolean} True if user should be flagged
   */
  static shouldFlagUser(reliabilityScore) {
    if (typeof reliabilityScore !== 'number' || isNaN(reliabilityScore)) {
      return false;
    }
    return reliabilityScore < RELIABILITY_THRESHOLDS.FLAG_THRESHOLD;
  }


  // ============================================
  // User Statistics Calculation (Requirement 10.3)
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
   * Get loan history for a user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of loan records
   */
  static async getUserLoanHistory(userId) {
    try {
      const loansRef = collection(db, this.LOANS_COLLECTION);
      const q = query(
        loansRef,
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const loans = [];

      querySnapshot.forEach((docSnap) => {
        loans.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      return loans;
    } catch (error) {
      console.error('Error getting user loan history:', error);
      return [];
    }
  }

  /**
   * Get reservation history for a user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of reservation records
   */
  static async getUserReservationHistory(userId) {
    try {
      const reservationsRef = collection(db, this.RESERVATIONS_COLLECTION);
      const q = query(
        reservationsRef,
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const reservations = [];

      querySnapshot.forEach((docSnap) => {
        reservations.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      return reservations;
    } catch (error) {
      console.error('Error getting user reservation history:', error);
      return [];
    }
  }

  /**
   * Get no-show count for a user in the last N days
   * 
   * @param {string} userId - User ID
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Promise<number>} No-show count
   */
  static async getUserNoShowCount(userId, days = RELIABILITY_THRESHOLDS.NO_SHOW_PERIOD) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const noShowsRef = collection(db, this.NO_SHOWS_COLLECTION);
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
   * Calculate loan statistics from loan history
   * 
   * @param {Array} loans - Array of loan records
   * @returns {Object} { totalLoans, onTimeReturns, lateReturns, onTimeReturnRate }
   */
  static calculateLoanStatistics(loans) {
    let totalLoans = 0;
    let onTimeReturns = 0;
    let lateReturns = 0;

    for (const loan of loans) {
      // Only count completed loans (returned)
      if (loan.status === LOAN_REQUEST_STATUS.RETURNED) {
        totalLoans++;

        const expectedReturnDate = this._toDate(loan.expectedReturnDate);
        const actualReturnDate = this._toDate(loan.actualReturnDate);

        if (expectedReturnDate && actualReturnDate) {
          // Compare dates (set to start of day for fair comparison)
          const expectedStart = new Date(expectedReturnDate);
          expectedStart.setHours(23, 59, 59, 999); // End of expected day
          
          if (actualReturnDate <= expectedStart) {
            onTimeReturns++;
          } else {
            lateReturns++;
          }
        } else {
          // If we can't determine, assume on-time
          onTimeReturns++;
        }
      }
      // Also count overdue loans as late
      else if (loan.status === LOAN_REQUEST_STATUS.OVERDUE) {
        totalLoans++;
        lateReturns++;
      }
    }

    const onTimeReturnRate = totalLoans > 0 ? onTimeReturns / totalLoans : 1;

    return {
      totalLoans,
      onTimeReturns,
      lateReturns,
      onTimeReturnRate
    };
  }

  /**
   * Calculate reservation statistics from reservation history
   * 
   * @param {Array} reservations - Array of reservation records
   * @returns {Object} { totalReservations, noShows, noShowRate }
   */
  static calculateReservationStatistics(reservations) {
    let totalReservations = 0;
    let noShows = 0;

    for (const reservation of reservations) {
      // Count all reservations that were approved/ready
      if (['approved', 'ready', 'completed', 'cancelled', 'no_show'].includes(reservation.status)) {
        totalReservations++;

        // Count no-shows
        if (reservation.status === 'no_show' || reservation.isNoShow === true) {
          noShows++;
        }
      }
    }

    const noShowRate = totalReservations > 0 ? noShows / totalReservations : 0;

    return {
      totalReservations,
      noShows,
      noShowRate
    };
  }

  /**
   * Calculate complete user statistics
   * Requirement: 10.3
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User reliability data
   */
  static async calculateUserStatistics(userId) {
    try {
      // Get user data
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      const userDoc = await getDoc(userRef);

      let userName = '';
      let userEmail = '';

      if (userDoc.exists()) {
        const userData = userDoc.data();
        userName = userData.displayName || userData.name || '';
        userEmail = userData.email || '';
      }

      // Get loan history and calculate statistics
      const loans = await this.getUserLoanHistory(userId);
      const loanStats = this.calculateLoanStatistics(loans);

      // Get reservation history and calculate statistics
      const reservations = await this.getUserReservationHistory(userId);
      const reservationStats = this.calculateReservationStatistics(reservations);

      // Get recent no-shows
      const recentNoShows = await this.getUserNoShowCount(userId);

      // Calculate reliability score
      const reliabilityScore = this.calculateReliabilityScore(
        loanStats.onTimeReturnRate,
        reservationStats.noShowRate
      );

      // Classify user
      const classification = this.classifyUser(reliabilityScore);

      // Check if repeat offender
      const isRepeatOffender = this.isRepeatNoShowOffender(recentNoShows);

      // Check if should be flagged
      const isFlagged = this.shouldFlagUser(reliabilityScore) || isRepeatOffender;

      // Create reliability object
      const reliability = createUserReliability({
        userId,
        userName,
        userEmail,
        totalLoans: loanStats.totalLoans,
        onTimeReturns: loanStats.onTimeReturns,
        lateReturns: loanStats.lateReturns,
        onTimeReturnRate: loanStats.onTimeReturnRate,
        totalReservations: reservationStats.totalReservations,
        noShows: reservationStats.noShows,
        noShowRate: reservationStats.noShowRate,
        reliabilityScore,
        classification,
        recentNoShows,
        isRepeatOffender,
        isFlagged,
        lastCalculatedAt: new Date()
      });

      return reliability;
    } catch (error) {
      console.error('Error calculating user statistics:', error);
      throw error;
    }
  }


  // ============================================
  // Store and Retrieve Reliability Data
  // ============================================

  /**
   * Store user reliability data in Firestore
   * 
   * @param {Object} reliability - User reliability data
   * @returns {Promise<string>} Document ID
   */
  static async storeUserReliability(reliability) {
    try {
      const docRef = doc(db, this.RELIABILITY_COLLECTION, reliability.userId);

      await setDoc(docRef, {
        ...reliability,
        lastCalculatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return reliability.userId;
    } catch (error) {
      console.error('Error storing user reliability:', error);
      throw error;
    }
  }

  /**
   * Get stored reliability data for a user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Reliability data or null
   */
  static async getStoredUserReliability(userId) {
    try {
      const docRef = doc(db, this.RELIABILITY_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting stored user reliability:', error);
      return null;
    }
  }

  /**
   * Calculate and store reliability for all users
   * 
   * @returns {Promise<Object>} { calculated, stored, errors }
   */
  static async calculateAllUserReliability() {
    try {
      const results = {
        calculated: 0,
        stored: 0,
        errors: [],
        reliabilities: []
      };

      // Get all users
      const usersRef = collection(db, this.USERS_COLLECTION);
      const querySnapshot = await getDocs(usersRef);

      for (const docSnap of querySnapshot.docs) {
        try {
          const reliability = await this.calculateUserStatistics(docSnap.id);
          results.reliabilities.push(reliability);
          results.calculated++;

          // Store the reliability data
          await this.storeUserReliability(reliability);
          results.stored++;
        } catch (userError) {
          results.errors.push({
            userId: docSnap.id,
            error: userError.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error calculating all user reliability:', error);
      throw error;
    }
  }

  // ============================================
  // Top User Identification (Requirement 10.5)
  // ============================================

  /**
   * Get top borrowers by loan count
   * Requirement: 10.5
   * 
   * @param {number} limit - Maximum number of users to return
   * @returns {Promise<Array>} Array of top borrowers
   */
  static async getTopBorrowers(limit = 10) {
    try {
      // First, calculate all user reliability if not already done
      const reliabilityRef = collection(db, this.RELIABILITY_COLLECTION);
      const querySnapshot = await getDocs(reliabilityRef);

      const users = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.totalLoans > 0) {
          users.push({
            userId: docSnap.id,
            userName: data.userName || '',
            userEmail: data.userEmail || '',
            value: data.totalLoans,
            totalLoans: data.totalLoans,
            reliabilityScore: data.reliabilityScore,
            classification: data.classification,
            rankType: 'top_borrower'
          });
        }
      });

      // Sort by total loans (descending)
      users.sort((a, b) => b.value - a.value);

      return users.slice(0, limit);
    } catch (error) {
      console.error('Error getting top borrowers:', error);
      return [];
    }
  }

  /**
   * Get most reliable users by reliability score
   * Requirement: 10.5
   * 
   * @param {number} limit - Maximum number of users to return
   * @param {number} minLoans - Minimum loans required to be considered
   * @returns {Promise<Array>} Array of most reliable users
   */
  static async getMostReliableUsers(limit = 10, minLoans = 3) {
    try {
      const reliabilityRef = collection(db, this.RELIABILITY_COLLECTION);
      const querySnapshot = await getDocs(reliabilityRef);

      const users = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Only include users with minimum loan count
        if (data.totalLoans >= minLoans) {
          users.push({
            userId: docSnap.id,
            userName: data.userName || '',
            userEmail: data.userEmail || '',
            value: data.reliabilityScore,
            reliabilityScore: data.reliabilityScore,
            totalLoans: data.totalLoans,
            onTimeReturnRate: data.onTimeReturnRate,
            classification: data.classification,
            rankType: 'most_reliable'
          });
        }
      });

      // Sort by reliability score (descending)
      users.sort((a, b) => b.value - a.value);

      return users.slice(0, limit);
    } catch (error) {
      console.error('Error getting most reliable users:', error);
      return [];
    }
  }

  /**
   * Get flagged users for review
   * Requirement: 10.2
   * 
   * @param {number} limit - Maximum number of users to return
   * @returns {Promise<Array>} Array of flagged users
   */
  static async getFlaggedUsers(limit = 50) {
    try {
      const reliabilityRef = collection(db, this.RELIABILITY_COLLECTION);
      const q = query(
        reliabilityRef,
        where('isFlagged', '==', true)
      );

      const querySnapshot = await getDocs(q);

      const users = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        users.push({
          userId: docSnap.id,
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          reliabilityScore: data.reliabilityScore,
          classification: data.classification,
          isRepeatOffender: data.isRepeatOffender,
          recentNoShows: data.recentNoShows,
          totalLoans: data.totalLoans,
          lateReturns: data.lateReturns
        });
      });

      // Sort by reliability score (ascending - worst first)
      users.sort((a, b) => a.reliabilityScore - b.reliabilityScore);

      return users.slice(0, limit);
    } catch (error) {
      console.error('Error getting flagged users:', error);
      return [];
    }
  }

  /**
   * Get repeat no-show offenders
   * 
   * @param {number} limit - Maximum number of users to return
   * @returns {Promise<Array>} Array of repeat offenders
   */
  static async getRepeatNoShowOffenders(limit = 50) {
    try {
      const reliabilityRef = collection(db, this.RELIABILITY_COLLECTION);
      const q = query(
        reliabilityRef,
        where('isRepeatOffender', '==', true)
      );

      const querySnapshot = await getDocs(q);

      const users = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        users.push({
          userId: docSnap.id,
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          recentNoShows: data.recentNoShows,
          totalNoShows: data.noShows,
          noShowRate: data.noShowRate,
          reliabilityScore: data.reliabilityScore
        });
      });

      // Sort by recent no-shows (descending)
      users.sort((a, b) => b.recentNoShows - a.recentNoShows);

      return users.slice(0, limit);
    } catch (error) {
      console.error('Error getting repeat no-show offenders:', error);
      return [];
    }
  }


  // ============================================
  // User Behavior Summary
  // ============================================

  /**
   * Calculate user behavior summary from reliability data
   * 
   * @param {Array} reliabilities - Array of user reliability objects
   * @returns {Object} User behavior summary
   */
  static calculateBehaviorSummary(reliabilities) {
    const summary = {
      totalUsers: reliabilities.length,
      excellentCount: 0,
      goodCount: 0,
      fairCount: 0,
      poorCount: 0,
      flaggedCount: 0,
      repeatOffenderCount: 0,
      averageReliabilityScore: 0
    };

    if (reliabilities.length === 0) {
      return createUserBehaviorSummary(summary);
    }

    let totalScore = 0;

    for (const reliability of reliabilities) {
      totalScore += reliability.reliabilityScore;

      // Count by classification
      switch (reliability.classification) {
        case USER_CLASSIFICATION.EXCELLENT:
          summary.excellentCount++;
          break;
        case USER_CLASSIFICATION.GOOD:
          summary.goodCount++;
          break;
        case USER_CLASSIFICATION.FAIR:
          summary.fairCount++;
          break;
        case USER_CLASSIFICATION.POOR:
          summary.poorCount++;
          break;
        default:
          summary.fairCount++;
      }

      // Count flagged users
      if (reliability.isFlagged) {
        summary.flaggedCount++;
      }

      // Count repeat offenders
      if (reliability.isRepeatOffender) {
        summary.repeatOffenderCount++;
      }
    }

    summary.averageReliabilityScore = Math.round(totalScore / reliabilities.length);

    return createUserBehaviorSummary(summary);
  }

  /**
   * Get user behavior summary
   * 
   * @returns {Promise<Object>} User behavior summary
   */
  static async getUserBehaviorSummary() {
    try {
      const reliabilityRef = collection(db, this.RELIABILITY_COLLECTION);
      const querySnapshot = await getDocs(reliabilityRef);

      const reliabilities = [];
      querySnapshot.forEach((docSnap) => {
        reliabilities.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      return this.calculateBehaviorSummary(reliabilities);
    } catch (error) {
      console.error('Error getting user behavior summary:', error);
      return createUserBehaviorSummary({});
    }
  }

  // ============================================
  // Dashboard Data
  // ============================================

  /**
   * Get user reliability dashboard data
   * Requirements: 10.3, 10.4, 10.5
   * 
   * @returns {Promise<Object>} Dashboard data
   */
  static async getReliabilityDashboard() {
    try {
      const summary = await this.getUserBehaviorSummary();
      const topBorrowers = await this.getTopBorrowers(5);
      const mostReliable = await this.getMostReliableUsers(5);
      const flaggedUsers = await this.getFlaggedUsers(5);
      const repeatOffenders = await this.getRepeatNoShowOffenders(5);

      return {
        summary,
        topBorrowers,
        mostReliable,
        flaggedUsers,
        repeatOffenders,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting reliability dashboard:', error);
      throw error;
    }
  }

  /**
   * Get user profile with reliability data
   * Requirement: 10.4
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile with reliability
   */
  static async getUserProfileWithReliability(userId) {
    try {
      // Get or calculate reliability
      let reliability = await this.getStoredUserReliability(userId);

      if (!reliability) {
        // Calculate fresh if not stored
        reliability = await this.calculateUserStatistics(userId);
        await this.storeUserReliability(reliability);
      }

      // Get user data
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      const userDoc = await getDoc(userRef);

      let userData = {};
      if (userDoc.exists()) {
        userData = userDoc.data();
      }

      return {
        user: {
          id: userId,
          ...userData
        },
        reliability,
        behaviorHistory: {
          totalLoans: reliability.totalLoans,
          onTimeReturns: reliability.onTimeReturns,
          lateReturns: reliability.lateReturns,
          totalReservations: reliability.totalReservations,
          noShows: reliability.noShows,
          recentNoShows: reliability.recentNoShows
        }
      };
    } catch (error) {
      console.error('Error getting user profile with reliability:', error);
      throw error;
    }
  }
}

export default UserReliabilityService;
