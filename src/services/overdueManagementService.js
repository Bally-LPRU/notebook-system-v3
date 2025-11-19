/**
 * Overdue Management Service
 * 
 * Service for managing overdue loan requests and expired reservations.
 * Provides client-side utilities for checking and displaying overdue status.
 */

import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { LOAN_REQUEST_STATUS } from '../types/loanRequest';

class OverdueManagementService {
  static LOAN_REQUESTS_COLLECTION = 'loanRequests';
  static RESERVATIONS_COLLECTION = 'reservations';

  /**
   * Check if a loan request is overdue
   * @param {Object} loanRequest - Loan request object
   * @returns {boolean} True if overdue
   */
  static isOverdue(loanRequest) {
    if (!loanRequest || !loanRequest.expectedReturnDate) {
      return false;
    }

    if (loanRequest.status !== LOAN_REQUEST_STATUS.BORROWED) {
      return false;
    }

    const expectedDate = loanRequest.expectedReturnDate.toDate 
      ? loanRequest.expectedReturnDate.toDate() 
      : new Date(loanRequest.expectedReturnDate);
    
    const now = new Date();
    return now > expectedDate;
  }

  /**
   * Calculate days overdue
   * @param {Date|Timestamp} expectedReturnDate - Expected return date
   * @returns {number} Number of days overdue (0 if not overdue)
   */
  static calculateDaysOverdue(expectedReturnDate) {
    if (!expectedReturnDate) {
      return 0;
    }

    const expectedDate = expectedReturnDate.toDate 
      ? expectedReturnDate.toDate() 
      : new Date(expectedReturnDate);
    
    const now = new Date();
    
    if (now <= expectedDate) {
      return 0;
    }

    const diffTime = now - expectedDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Calculate days until due
   * @param {Date|Timestamp} expectedReturnDate - Expected return date
   * @returns {number} Number of days until due (negative if overdue)
   */
  static calculateDaysUntilDue(expectedReturnDate) {
    if (!expectedReturnDate) {
      return 0;
    }

    const expectedDate = expectedReturnDate.toDate 
      ? expectedReturnDate.toDate() 
      : new Date(expectedReturnDate);
    
    const now = new Date();
    const diffTime = expectedDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get overdue status label
   * @param {Object} loanRequest - Loan request object
   * @returns {string} Status label
   */
  static getOverdueStatusLabel(loanRequest) {
    if (!this.isOverdue(loanRequest)) {
      return '';
    }

    const daysOverdue = this.calculateDaysOverdue(loanRequest.expectedReturnDate);
    
    if (daysOverdue === 1) {
      return 'เกินกำหนด 1 วัน';
    }
    
    return `เกินกำหนด ${daysOverdue} วัน`;
  }

  /**
   * Get due soon status label
   * @param {Object} loanRequest - Loan request object
   * @returns {string} Status label
   */
  static getDueSoonLabel(loanRequest) {
    if (!loanRequest || !loanRequest.expectedReturnDate) {
      return '';
    }

    if (loanRequest.status !== LOAN_REQUEST_STATUS.BORROWED) {
      return '';
    }

    const daysUntilDue = this.calculateDaysUntilDue(loanRequest.expectedReturnDate);
    
    if (daysUntilDue < 0) {
      return ''; // Already overdue
    }
    
    if (daysUntilDue === 0) {
      return 'ครบกำหนดวันนี้';
    }
    
    if (daysUntilDue === 1) {
      return 'ครบกำหนดพรุ่งนี้';
    }
    
    if (daysUntilDue <= 3) {
      return `เหลืออีก ${daysUntilDue} วัน`;
    }
    
    return '';
  }

  /**
   * Get all overdue loan requests
   * @param {string} userId - User ID (optional, for filtering by user)
   * @returns {Promise<Array>} Array of overdue loan requests
   */
  static async getOverdueLoanRequests(userId = null) {
    try {
      const now = Timestamp.now();
      let q = query(
        collection(db, this.LOAN_REQUESTS_COLLECTION),
        where('status', '==', LOAN_REQUEST_STATUS.BORROWED),
        where('expectedReturnDate', '<', now)
      );

      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      const querySnapshot = await getDocs(q);
      const overdueLoanRequests = [];

      querySnapshot.forEach((doc) => {
        overdueLoanRequests.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return overdueLoanRequests;
    } catch (error) {
      console.error('Error getting overdue loan requests:', error);
      throw error;
    }
  }

  /**
   * Get loan requests due soon (within specified days)
   * @param {number} daysAhead - Number of days to look ahead (default: 3)
   * @param {string} userId - User ID (optional, for filtering by user)
   * @returns {Promise<Array>} Array of loan requests due soon
   */
  static async getLoanRequestsDueSoon(daysAhead = 3, userId = null) {
    try {
      const now = Timestamp.now();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      futureDate.setHours(23, 59, 59, 999);
      const futureTimestamp = Timestamp.fromDate(futureDate);

      let q = query(
        collection(db, this.LOAN_REQUESTS_COLLECTION),
        where('status', '==', LOAN_REQUEST_STATUS.BORROWED),
        where('expectedReturnDate', '>=', now),
        where('expectedReturnDate', '<=', futureTimestamp)
      );

      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      const querySnapshot = await getDocs(q);
      const dueSoonLoanRequests = [];

      querySnapshot.forEach((doc) => {
        dueSoonLoanRequests.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return dueSoonLoanRequests;
    } catch (error) {
      console.error('Error getting loan requests due soon:', error);
      throw error;
    }
  }

  /**
   * Manually mark a loan request as overdue (client-side check)
   * This is a fallback in case the Cloud Function hasn't run yet
   * @param {string} loanRequestId - Loan request ID
   * @returns {Promise<boolean>} Success status
   */
  static async markAsOverdue(loanRequestId) {
    try {
      const loanRequestRef = doc(db, this.LOAN_REQUESTS_COLLECTION, loanRequestId);
      
      await updateDoc(loanRequestRef, {
        status: LOAN_REQUEST_STATUS.OVERDUE,
        overdueMarkedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error marking loan request as overdue:', error);
      throw error;
    }
  }

  /**
   * Get overdue statistics
   * @param {string} userId - User ID (optional, for user-specific stats)
   * @returns {Promise<Object>} Overdue statistics
   */
  static async getOverdueStatistics(userId = null) {
    try {
      const overdueLoanRequests = await this.getOverdueLoanRequests(userId);
      const dueSoonLoanRequests = await this.getLoanRequestsDueSoon(3, userId);

      const totalOverdue = overdueLoanRequests.length;
      const totalDueSoon = dueSoonLoanRequests.length;

      // Calculate average days overdue
      let totalDaysOverdue = 0;
      let maxDaysOverdue = 0;

      overdueLoanRequests.forEach(request => {
        const days = this.calculateDaysOverdue(request.expectedReturnDate);
        totalDaysOverdue += days;
        maxDaysOverdue = Math.max(maxDaysOverdue, days);
      });

      const averageDaysOverdue = totalOverdue > 0 
        ? Math.round(totalDaysOverdue / totalOverdue) 
        : 0;

      return {
        totalOverdue,
        totalDueSoon,
        averageDaysOverdue,
        maxDaysOverdue,
        overdueLoanRequests: overdueLoanRequests.slice(0, 5), // Top 5 most overdue
        dueSoonLoanRequests: dueSoonLoanRequests.slice(0, 5) // Top 5 due soon
      };
    } catch (error) {
      console.error('Error getting overdue statistics:', error);
      throw error;
    }
  }

  /**
   * Check if reservation is expired
   * @param {Object} reservation - Reservation object
   * @returns {boolean} True if expired
   */
  static isReservationExpired(reservation) {
    if (!reservation || !reservation.startTime) {
      return false;
    }

    if (reservation.status !== 'ready') {
      return false;
    }

    const startTime = reservation.startTime.toDate 
      ? reservation.startTime.toDate() 
      : new Date(reservation.startTime);
    
    const now = new Date();
    const twoHoursAfterStart = new Date(startTime);
    twoHoursAfterStart.setHours(twoHoursAfterStart.getHours() + 2);

    return now > twoHoursAfterStart;
  }

  /**
   * Get color class for overdue status
   * @param {number} daysOverdue - Number of days overdue
   * @returns {string} Tailwind color class
   */
  static getOverdueColorClass(daysOverdue) {
    if (daysOverdue === 0) {
      return 'text-gray-600';
    } else if (daysOverdue <= 3) {
      return 'text-orange-600';
    } else if (daysOverdue <= 7) {
      return 'text-red-600';
    } else {
      return 'text-red-800 font-bold';
    }
  }

  /**
   * Get badge color class for overdue status
   * @param {number} daysOverdue - Number of days overdue
   * @returns {string} Tailwind badge color class
   */
  static getOverdueBadgeClass(daysOverdue) {
    if (daysOverdue === 0) {
      return 'bg-gray-100 text-gray-800';
    } else if (daysOverdue <= 3) {
      return 'bg-orange-100 text-orange-800';
    } else if (daysOverdue <= 7) {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-red-200 text-red-900 font-bold';
    }
  }

  /**
   * Format overdue date for display
   * @param {Date|Timestamp} expectedReturnDate - Expected return date
   * @returns {string} Formatted date string
   */
  static formatOverdueDate(expectedReturnDate) {
    if (!expectedReturnDate) {
      return '-';
    }

    const date = expectedReturnDate.toDate 
      ? expectedReturnDate.toDate() 
      : new Date(expectedReturnDate);

    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

export default OverdueManagementService;
