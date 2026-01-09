/**
 * Equipment Usage Analyzer Service
 * 
 * Service for analyzing equipment utilization and generating recommendations.
 * Calculates utilization rates, classifies equipment, and provides inventory insights.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  EQUIPMENT_CLASSIFICATION, 
  UTILIZATION_THRESHOLDS,
  DEFAULT_ANALYSIS_PERIOD,
  createEquipmentUtilization,
  createUtilizationSummary,
  generateMonthlyPeriod
} from '../types/equipmentUtilization';
import { LOAN_REQUEST_STATUS } from '../types/loanRequest';

class EquipmentUsageAnalyzerService {
  static UTILIZATION_COLLECTION = 'equipmentUtilization';
  static EQUIPMENT_COLLECTION = 'equipmentManagement';
  static LOAN_COLLECTION = 'loanRequests';

  // ============================================
  // Core Calculation Functions (Requirements 3.1, 3.2, 3.3)
  // ============================================

  /**
   * Calculate utilization rate for equipment
   * Utilization rate = borrowed days / total days
   * Result is bounded between 0 and 1
   * 
   * Requirement: 3.1
   * 
   * @param {number} borrowedDays - Number of days equipment was borrowed
   * @param {number} totalDays - Total days in analysis period
   * @returns {number} Utilization rate (0-1)
   */
  static calculateUtilizationRate(borrowedDays, totalDays) {
    // Handle edge cases
    if (totalDays <= 0) {
      return 0;
    }
    
    if (borrowedDays < 0) {
      return 0;
    }

    // Calculate rate and bound between 0 and 1
    const rate = borrowedDays / totalDays;
    return Math.min(Math.max(rate, 0), 1);
  }

  /**
   * Classify equipment based on utilization data
   * - High demand: utilization rate >= 80% in analysis period
   * - Idle: not borrowed in past 60 days
   * - Normal: everything else
   * 
   * Requirements: 3.2, 3.3
   * 
   * @param {number} utilizationRate - Utilization rate (0-1)
   * @param {Date|null} lastBorrowedDate - Last date equipment was borrowed
   * @param {Date} currentDate - Current date for comparison
   * @returns {string} Equipment classification from EQUIPMENT_CLASSIFICATION
   */
  static classifyEquipment(utilizationRate, lastBorrowedDate, currentDate = new Date()) {
    // Check for high demand first (>= 80% utilization)
    if (utilizationRate >= UTILIZATION_THRESHOLDS.HIGH_DEMAND) {
      return EQUIPMENT_CLASSIFICATION.HIGH_DEMAND;
    }

    // Check for idle equipment (not borrowed in 60+ days)
    if (lastBorrowedDate === null) {
      // Never borrowed = idle
      return EQUIPMENT_CLASSIFICATION.IDLE;
    }

    // Convert lastBorrowedDate to Date if needed
    let lastBorrowed;
    if (lastBorrowedDate instanceof Date) {
      lastBorrowed = lastBorrowedDate;
    } else if (typeof lastBorrowedDate.toDate === 'function') {
      lastBorrowed = lastBorrowedDate.toDate();
    } else if (typeof lastBorrowedDate === 'string' || typeof lastBorrowedDate === 'number') {
      lastBorrowed = new Date(lastBorrowedDate);
    } else if (typeof lastBorrowedDate.seconds === 'number') {
      lastBorrowed = new Date(lastBorrowedDate.seconds * 1000);
    } else {
      // Invalid date format, treat as never borrowed
      return EQUIPMENT_CLASSIFICATION.IDLE;
    }

    // Calculate days since last borrow
    const currentDateStart = new Date(currentDate);
    currentDateStart.setHours(0, 0, 0, 0);
    
    const lastBorrowedStart = new Date(lastBorrowed);
    lastBorrowedStart.setHours(0, 0, 0, 0);

    const diffMs = currentDateStart.getTime() - lastBorrowedStart.getTime();
    const daysSinceLastBorrow = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysSinceLastBorrow >= UTILIZATION_THRESHOLDS.IDLE_DAYS) {
      return EQUIPMENT_CLASSIFICATION.IDLE;
    }

    // Default to normal
    return EQUIPMENT_CLASSIFICATION.NORMAL;
  }

  // ============================================
  // Loan History Analysis
  // ============================================

  /**
   * Get loan history for equipment within a date range
   * 
   * @param {string} equipmentId - Equipment ID
   * @param {Date} startDate - Start of analysis period
   * @param {Date} endDate - End of analysis period
   * @returns {Promise<Array>} Array of loan records
   */
  static async getEquipmentLoanHistory(equipmentId, startDate, endDate) {
    try {
      const loansRef = collection(db, this.LOAN_COLLECTION);
      
      // Query for loans that overlap with the analysis period
      // Include borrowed, returned, and overdue statuses
      const relevantStatuses = [
        LOAN_REQUEST_STATUS.BORROWED,
        LOAN_REQUEST_STATUS.RETURNED,
        LOAN_REQUEST_STATUS.OVERDUE
      ];

      const q = query(
        loansRef,
        where('equipmentId', '==', equipmentId),
        where('status', 'in', relevantStatuses)
      );

      const querySnapshot = await getDocs(q);
      const loans = [];

      querySnapshot.forEach((docSnap) => {
        const loan = {
          id: docSnap.id,
          ...docSnap.data()
        };
        loans.push(loan);
      });

      return loans;
    } catch (error) {
      console.error('Error getting equipment loan history:', error);
      return [];
    }
  }

  /**
   * Calculate borrowed days from loan history
   * 
   * @param {Array} loans - Array of loan records
   * @param {Date} periodStart - Start of analysis period
   * @param {Date} periodEnd - End of analysis period
   * @returns {Object} { borrowedDays, totalLoans, lastBorrowedDate, averageDuration }
   */
  static calculateBorrowedDaysFromLoans(loans, periodStart, periodEnd) {
    let borrowedDays = 0;
    let totalLoans = 0;
    let lastBorrowedDate = null;
    let totalDuration = 0;

    for (const loan of loans) {
      // Get loan dates
      const borrowDate = this._toDate(loan.borrowDate) || this._toDate(loan.pickedUpAt);
      const returnDate = this._toDate(loan.actualReturnDate) || 
                         this._toDate(loan.expectedReturnDate) ||
                         (loan.status === LOAN_REQUEST_STATUS.BORROWED ? new Date() : null);

      if (!borrowDate) continue;

      // Calculate overlap with analysis period
      const effectiveStart = new Date(Math.max(borrowDate.getTime(), periodStart.getTime()));
      const effectiveEnd = returnDate 
        ? new Date(Math.min(returnDate.getTime(), periodEnd.getTime()))
        : new Date(Math.min(new Date().getTime(), periodEnd.getTime()));

      if (effectiveStart < effectiveEnd) {
        const daysInPeriod = Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24));
        borrowedDays += daysInPeriod;
        totalLoans++;

        // Track loan duration
        if (returnDate) {
          const loanDuration = Math.ceil((returnDate - borrowDate) / (1000 * 60 * 60 * 24));
          totalDuration += loanDuration;
        }

        // Track last borrowed date
        if (!lastBorrowedDate || borrowDate > lastBorrowedDate) {
          lastBorrowedDate = borrowDate;
        }
      }
    }

    return {
      borrowedDays,
      totalLoans,
      lastBorrowedDate,
      averageDuration: totalLoans > 0 ? Math.round(totalDuration / totalLoans) : 0
    };
  }

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

  // ============================================
  // Equipment Utilization Calculation (Requirements 3.1, 3.4, 3.6)
  // ============================================

  /**
   * Calculate utilization for a single equipment item
   * 
   * @param {string} equipmentId - Equipment ID
   * @param {number} analysisDays - Number of days to analyze (default: 30)
   * @returns {Promise<Object>} Equipment utilization data
   */
  static async calculateEquipmentUtilization(equipmentId, analysisDays = DEFAULT_ANALYSIS_PERIOD) {
    try {
      // Get equipment details
      const equipmentRef = doc(db, this.EQUIPMENT_COLLECTION, equipmentId);
      const equipmentDoc = await getDoc(equipmentRef);

      if (!equipmentDoc.exists()) {
        throw new Error('Equipment not found');
      }

      const equipment = {
        id: equipmentDoc.id,
        ...equipmentDoc.data()
      };

      // Calculate analysis period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - analysisDays);

      // Get loan history
      const loans = await this.getEquipmentLoanHistory(equipmentId, startDate, endDate);

      // Calculate borrowed days
      const loanStats = this.calculateBorrowedDaysFromLoans(loans, startDate, endDate);

      // Calculate utilization rate
      const utilizationRate = this.calculateUtilizationRate(loanStats.borrowedDays, analysisDays);

      // Classify equipment
      const classification = this.classifyEquipment(
        utilizationRate, 
        loanStats.lastBorrowedDate, 
        endDate
      );

      // Create utilization object
      const utilization = createEquipmentUtilization({
        equipmentId,
        equipmentName: equipment.name || 'Unknown',
        category: equipment.category || equipment.categoryId || '',
        totalDays: analysisDays,
        borrowedDays: loanStats.borrowedDays,
        utilizationRate,
        classification,
        lastBorrowedDate: loanStats.lastBorrowedDate,
        totalLoans: loanStats.totalLoans,
        averageLoanDuration: loanStats.averageDuration,
        period: generateMonthlyPeriod(endDate),
        calculatedAt: new Date()
      });

      return utilization;
    } catch (error) {
      console.error('Error calculating equipment utilization:', error);
      throw error;
    }
  }

  /**
   * Calculate utilization for all equipment
   * Requirement: 3.4
   * 
   * @param {number} analysisDays - Number of days to analyze
   * @returns {Promise<Object>} { utilizations, summary }
   */
  static async calculateAllEquipmentUtilization(analysisDays = DEFAULT_ANALYSIS_PERIOD) {
    try {
      const results = {
        utilizations: [],
        summary: null,
        errors: []
      };

      // Get all active equipment
      const equipmentRef = collection(db, this.EQUIPMENT_COLLECTION);
      const q = query(
        equipmentRef,
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);

      // Calculate utilization for each equipment
      for (const docSnap of querySnapshot.docs) {
        try {
          const utilization = await this.calculateEquipmentUtilization(docSnap.id, analysisDays);
          results.utilizations.push(utilization);
        } catch (equipmentError) {
          results.errors.push({
            equipmentId: docSnap.id,
            error: equipmentError.message
          });
        }
      }

      // Calculate summary
      results.summary = this.calculateUtilizationSummary(results.utilizations);

      return results;
    } catch (error) {
      console.error('Error calculating all equipment utilization:', error);
      throw error;
    }
  }

  /**
   * Calculate utilization summary from array of utilizations
   * 
   * @param {Array} utilizations - Array of equipment utilization objects
   * @returns {Object} Utilization summary
   */
  static calculateUtilizationSummary(utilizations) {
    const summary = {
      totalEquipment: utilizations.length,
      highDemandCount: 0,
      normalCount: 0,
      idleCount: 0,
      averageUtilization: 0,
      period: utilizations.length > 0 ? utilizations[0].period : generateMonthlyPeriod(new Date())
    };

    if (utilizations.length === 0) {
      return createUtilizationSummary(summary);
    }

    let totalUtilization = 0;

    for (const util of utilizations) {
      totalUtilization += util.utilizationRate;

      switch (util.classification) {
        case EQUIPMENT_CLASSIFICATION.HIGH_DEMAND:
          summary.highDemandCount++;
          break;
        case EQUIPMENT_CLASSIFICATION.IDLE:
          summary.idleCount++;
          break;
        default:
          summary.normalCount++;
      }
    }

    summary.averageUtilization = totalUtilization / utilizations.length;

    return createUtilizationSummary(summary);
  }

  // ============================================
  // Store and Retrieve Utilization Data
  // ============================================

  /**
   * Store utilization data in Firestore
   * 
   * @param {Object} utilization - Equipment utilization data
   * @returns {Promise<string>} Document ID
   */
  static async storeUtilization(utilization) {
    try {
      // Use composite key: equipmentId_period
      const docId = `${utilization.equipmentId}_${utilization.period}`;
      const docRef = doc(db, this.UTILIZATION_COLLECTION, docId);

      await setDoc(docRef, {
        ...utilization,
        lastBorrowedDate: utilization.lastBorrowedDate 
          ? Timestamp.fromDate(utilization.lastBorrowedDate)
          : null,
        calculatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docId;
    } catch (error) {
      console.error('Error storing utilization:', error);
      throw error;
    }
  }

  /**
   * Store all utilization data and summary
   * Requirement: 3.4
   * 
   * @param {Array} utilizations - Array of utilization objects
   * @param {Object} summary - Utilization summary
   * @returns {Promise<Object>} { stored, errors }
   */
  static async storeAllUtilizations(utilizations, summary) {
    const results = {
      stored: 0,
      errors: []
    };

    // Store individual utilizations
    for (const util of utilizations) {
      try {
        await this.storeUtilization(util);
        results.stored++;
      } catch (error) {
        results.errors.push({
          equipmentId: util.equipmentId,
          error: error.message
        });
      }
    }

    // Store summary
    try {
      const summaryDocId = `summary_${summary.period}`;
      const summaryRef = doc(db, this.UTILIZATION_COLLECTION, summaryDocId);
      await setDoc(summaryRef, {
        ...summary,
        type: 'summary',
        calculatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      results.errors.push({
        type: 'summary',
        error: error.message
      });
    }

    return results;
  }

  /**
   * Get stored utilization for equipment
   * 
   * @param {string} equipmentId - Equipment ID
   * @param {string} period - Period identifier (optional, defaults to current month)
   * @returns {Promise<Object|null>} Utilization data or null
   */
  static async getStoredUtilization(equipmentId, period = null) {
    try {
      const targetPeriod = period || generateMonthlyPeriod(new Date());
      const docId = `${equipmentId}_${targetPeriod}`;
      const docRef = doc(db, this.UTILIZATION_COLLECTION, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting stored utilization:', error);
      return null;
    }
  }

  /**
   * Get utilization summary for a period
   * 
   * @param {string} period - Period identifier (optional)
   * @returns {Promise<Object|null>} Summary or null
   */
  static async getUtilizationSummary(period = null) {
    try {
      const targetPeriod = period || generateMonthlyPeriod(new Date());
      const summaryDocId = `summary_${targetPeriod}`;
      const docRef = doc(db, this.UTILIZATION_COLLECTION, summaryDocId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting utilization summary:', error);
      return null;
    }
  }

  /**
   * Get all utilizations for a period
   * 
   * @param {string} period - Period identifier (optional)
   * @returns {Promise<Array>} Array of utilization objects
   */
  static async getAllUtilizationsForPeriod(period = null) {
    try {
      const targetPeriod = period || generateMonthlyPeriod(new Date());
      const utilizationRef = collection(db, this.UTILIZATION_COLLECTION);
      
      const q = query(
        utilizationRef,
        where('period', '==', targetPeriod),
        where('type', '==', null) // Exclude summary documents
      );

      const querySnapshot = await getDocs(q);
      const utilizations = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.type !== 'summary') {
          utilizations.push({
            id: docSnap.id,
            ...data
          });
        }
      });

      return utilizations;
    } catch (error) {
      console.error('Error getting all utilizations:', error);
      return [];
    }
  }

  // ============================================
  // Monthly Report Generation (Requirement 3.6)
  // ============================================

  /**
   * Generate monthly utilization report
   * Requirement: 3.6
   * 
   * @param {Date} reportDate - Date for the report (uses month of this date)
   * @returns {Promise<Object>} Monthly report
   */
  static async generateMonthlyReport(reportDate = new Date()) {
    try {
      const period = generateMonthlyPeriod(reportDate);
      
      // Calculate fresh utilization data
      const { utilizations, summary } = await this.calculateAllEquipmentUtilization(DEFAULT_ANALYSIS_PERIOD);

      // Store the data
      await this.storeAllUtilizations(utilizations, summary);

      // Generate report
      const report = {
        period,
        generatedAt: new Date(),
        summary,
        highDemandEquipment: utilizations
          .filter(u => u.classification === EQUIPMENT_CLASSIFICATION.HIGH_DEMAND)
          .sort((a, b) => b.utilizationRate - a.utilizationRate),
        idleEquipment: utilizations
          .filter(u => u.classification === EQUIPMENT_CLASSIFICATION.IDLE)
          .sort((a, b) => {
            // Sort by days since last borrowed (most idle first)
            const aDays = a.lastBorrowedDate ? 
              Math.floor((new Date() - new Date(a.lastBorrowedDate)) / (1000 * 60 * 60 * 24)) : 
              Infinity;
            const bDays = b.lastBorrowedDate ? 
              Math.floor((new Date() - new Date(b.lastBorrowedDate)) / (1000 * 60 * 60 * 24)) : 
              Infinity;
            return bDays - aDays;
          }),
        normalEquipment: utilizations
          .filter(u => u.classification === EQUIPMENT_CLASSIFICATION.NORMAL)
          .sort((a, b) => b.utilizationRate - a.utilizationRate),
        recommendations: await this.generateRecommendations(utilizations)
      };

      // Store report
      const reportDocId = `report_${period}`;
      const reportRef = doc(db, this.UTILIZATION_COLLECTION, reportDocId);
      await setDoc(reportRef, {
        ...report,
        type: 'monthly_report',
        generatedAt: serverTimestamp()
      });

      return report;
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  }

  // ============================================
  // Equipment Recommendations (Requirement 3.5)
  // ============================================

  /**
   * Generate inventory recommendations based on utilization data
   * Requirement: 3.5
   * 
   * @param {Array} utilizations - Array of equipment utilization objects
   * @returns {Promise<Array>} Array of recommendations
   */
  static async generateRecommendations(utilizations) {
    const recommendations = [];

    for (const util of utilizations) {
      const recommendation = this.generateEquipmentRecommendation(util);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Sort by priority (increase_stock first, then consider_removal)
    recommendations.sort((a, b) => {
      const priorityOrder = { 'increase_stock': 0, 'consider_removal': 1, 'maintain': 2 };
      return priorityOrder[a.recommendationType] - priorityOrder[b.recommendationType];
    });

    return recommendations;
  }

  /**
   * Generate recommendation for a single equipment item
   * 
   * @param {Object} utilization - Equipment utilization data
   * @returns {Object|null} Recommendation or null
   */
  static generateEquipmentRecommendation(utilization) {
    const { 
      equipmentId, 
      equipmentName, 
      utilizationRate, 
      classification,
      totalLoans,
      lastBorrowedDate
    } = utilization;

    // High demand equipment - recommend increasing stock
    if (classification === EQUIPMENT_CLASSIFICATION.HIGH_DEMAND) {
      return {
        equipmentId,
        equipmentName,
        recommendationType: 'increase_stock',
        reason: `อุปกรณ์นี้มีอัตราการใช้งาน ${Math.round(utilizationRate * 100)}% ` +
                `และถูกยืม ${totalLoans} ครั้งในช่วง 30 วันที่ผ่านมา ` +
                `ควรพิจารณาเพิ่มจำนวนอุปกรณ์`,
        utilizationRate,
        demandScore: Math.round(utilizationRate * 100)
      };
    }

    // Idle equipment - recommend considering removal
    if (classification === EQUIPMENT_CLASSIFICATION.IDLE) {
      const daysSinceLastBorrow = lastBorrowedDate 
        ? Math.floor((new Date() - new Date(lastBorrowedDate)) / (1000 * 60 * 60 * 24))
        : null;

      const reason = daysSinceLastBorrow !== null
        ? `อุปกรณ์นี้ไม่ถูกยืมมา ${daysSinceLastBorrow} วันแล้ว ควรพิจารณาปลดระวางหรือโอนย้าย`
        : `อุปกรณ์นี้ไม่เคยถูกยืมเลย ควรพิจารณาปลดระวางหรือโอนย้าย`;

      return {
        equipmentId,
        equipmentName,
        recommendationType: 'consider_removal',
        reason,
        utilizationRate,
        demandScore: Math.round(utilizationRate * 100)
      };
    }

    // Normal equipment - no specific recommendation needed
    return null;
  }

  /**
   * Get high-demand equipment list
   * Requirement: 3.5
   * 
   * @param {number} limit - Maximum number of items to return
   * @returns {Promise<Array>} High-demand equipment list
   */
  static async getHighDemandEquipment(limit = 10) {
    try {
      const { utilizations } = await this.calculateAllEquipmentUtilization();
      
      return utilizations
        .filter(u => u.classification === EQUIPMENT_CLASSIFICATION.HIGH_DEMAND)
        .sort((a, b) => b.utilizationRate - a.utilizationRate)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting high-demand equipment:', error);
      return [];
    }
  }

  /**
   * Get idle equipment list
   * Requirement: 3.5
   * 
   * @param {number} limit - Maximum number of items to return
   * @returns {Promise<Array>} Idle equipment list
   */
  static async getIdleEquipment(limit = 10) {
    try {
      const { utilizations } = await this.calculateAllEquipmentUtilization();
      
      return utilizations
        .filter(u => u.classification === EQUIPMENT_CLASSIFICATION.IDLE)
        .sort((a, b) => {
          // Sort by days since last borrowed (most idle first)
          const aDays = a.lastBorrowedDate ? 
            Math.floor((new Date() - new Date(a.lastBorrowedDate)) / (1000 * 60 * 60 * 24)) : 
            Infinity;
          const bDays = b.lastBorrowedDate ? 
            Math.floor((new Date() - new Date(b.lastBorrowedDate)) / (1000 * 60 * 60 * 24)) : 
            Infinity;
          return bDays - aDays;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting idle equipment:', error);
      return [];
    }
  }

  /**
   * Get equipment needing more units (high demand)
   * Requirement: 3.5
   * 
   * @returns {Promise<Array>} Equipment recommendations for increasing stock
   */
  static async getEquipmentNeedingMoreUnits() {
    try {
      const { utilizations } = await this.calculateAllEquipmentUtilization();
      const recommendations = await this.generateRecommendations(utilizations);
      
      return recommendations.filter(r => r.recommendationType === 'increase_stock');
    } catch (error) {
      console.error('Error getting equipment needing more units:', error);
      return [];
    }
  }

  /**
   * Get equipment for potential removal (idle)
   * Requirement: 3.5
   * 
   * @returns {Promise<Array>} Equipment recommendations for removal
   */
  static async getEquipmentForPotentialRemoval() {
    try {
      const { utilizations } = await this.calculateAllEquipmentUtilization();
      const recommendations = await this.generateRecommendations(utilizations);
      
      return recommendations.filter(r => r.recommendationType === 'consider_removal');
    } catch (error) {
      console.error('Error getting equipment for potential removal:', error);
      return [];
    }
  }

  // ============================================
  // Dashboard Data
  // ============================================

  /**
   * Get utilization dashboard data
   * Requirement: 3.4
   * 
   * @returns {Promise<Object>} Dashboard data
   */
  static async getUtilizationDashboard() {
    try {
      const { utilizations, summary } = await this.calculateAllEquipmentUtilization();
      const recommendations = await this.generateRecommendations(utilizations);

      return {
        summary,
        highDemandEquipment: utilizations
          .filter(u => u.classification === EQUIPMENT_CLASSIFICATION.HIGH_DEMAND)
          .slice(0, 5),
        idleEquipment: utilizations
          .filter(u => u.classification === EQUIPMENT_CLASSIFICATION.IDLE)
          .slice(0, 5),
        topRecommendations: recommendations.slice(0, 5),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting utilization dashboard:', error);
      throw error;
    }
  }
}

export default EquipmentUsageAnalyzerService;
