/**
 * Equipment Utilization Types
 * 
 * Types and enums for the Equipment Usage Analyzer
 * Requirements: 3.1, 3.2, 3.3
 */

/**
 * Equipment classification based on utilization
 */
export const EQUIPMENT_CLASSIFICATION = {
  HIGH_DEMAND: 'high_demand',
  NORMAL: 'normal',
  IDLE: 'idle'
};

/**
 * Utilization thresholds for classification
 */
export const UTILIZATION_THRESHOLDS = {
  HIGH_DEMAND: 0.8,    // 80% utilization = high demand
  IDLE_DAYS: 60        // 60 days without loan = idle
};

/**
 * Default analysis period in days
 */
export const DEFAULT_ANALYSIS_PERIOD = 30;

/**
 * @typedef {Object} EquipmentUtilization
 * @property {string} equipmentId - Equipment ID
 * @property {string} equipmentName - Equipment name
 * @property {string} category - Equipment category
 * @property {number} totalDays - Total days in analysis period
 * @property {number} borrowedDays - Days equipment was borrowed
 * @property {number} utilizationRate - Utilization rate (0-1)
 * @property {string} classification - Classification from EQUIPMENT_CLASSIFICATION
 * @property {Date|null} lastBorrowedDate - Last borrowed date
 * @property {number} totalLoans - Total number of loans
 * @property {number} averageLoanDuration - Average loan duration in days
 * @property {string} period - Analysis period identifier (e.g., 'monthly_2026_01')
 * @property {Date} calculatedAt - Calculation timestamp
 */

/**
 * @typedef {Object} UtilizationSummary
 * @property {number} totalEquipment - Total equipment count
 * @property {number} highDemandCount - High demand equipment count
 * @property {number} normalCount - Normal utilization count
 * @property {number} idleCount - Idle equipment count
 * @property {number} averageUtilization - Average utilization rate
 * @property {string} period - Analysis period
 */

/**
 * @typedef {Object} InventoryRecommendation
 * @property {string} equipmentId - Equipment ID
 * @property {string} equipmentName - Equipment name
 * @property {string} recommendationType - 'increase_stock' | 'consider_removal' | 'maintain'
 * @property {string} reason - Recommendation reason
 * @property {number} utilizationRate - Current utilization rate
 * @property {number} demandScore - Demand score (0-100)
 */

/**
 * Create equipment utilization object with defaults
 * @param {Partial<EquipmentUtilization>} data - Utilization data
 * @returns {EquipmentUtilization} Complete utilization object
 */
export function createEquipmentUtilization(data) {
  return {
    equipmentId: data.equipmentId || '',
    equipmentName: data.equipmentName || '',
    category: data.category || '',
    totalDays: data.totalDays || 0,
    borrowedDays: data.borrowedDays || 0,
    utilizationRate: data.utilizationRate || 0,
    classification: data.classification || EQUIPMENT_CLASSIFICATION.NORMAL,
    lastBorrowedDate: data.lastBorrowedDate || null,
    totalLoans: data.totalLoans || 0,
    averageLoanDuration: data.averageLoanDuration || 0,
    period: data.period || '',
    calculatedAt: data.calculatedAt || new Date()
  };
}

/**
 * Create utilization summary object
 * @param {Partial<UtilizationSummary>} data - Summary data
 * @returns {UtilizationSummary} Complete summary object
 */
export function createUtilizationSummary(data) {
  return {
    totalEquipment: data.totalEquipment || 0,
    highDemandCount: data.highDemandCount || 0,
    normalCount: data.normalCount || 0,
    idleCount: data.idleCount || 0,
    averageUtilization: data.averageUtilization || 0,
    period: data.period || ''
  };
}

/**
 * Get display label for classification
 * @param {string} classification - Equipment classification
 * @returns {string} Display label
 */
export function getClassificationLabel(classification) {
  const labels = {
    [EQUIPMENT_CLASSIFICATION.HIGH_DEMAND]: 'ความต้องการสูง',
    [EQUIPMENT_CLASSIFICATION.NORMAL]: 'ปกติ',
    [EQUIPMENT_CLASSIFICATION.IDLE]: 'ไม่ถูกใช้งาน'
  };
  return labels[classification] || classification;
}

/**
 * Get CSS class for classification badge
 * @param {string} classification - Equipment classification
 * @returns {string} CSS class name
 */
export function getClassificationBadgeClass(classification) {
  const classes = {
    [EQUIPMENT_CLASSIFICATION.HIGH_DEMAND]: 'bg-red-100 text-red-800',
    [EQUIPMENT_CLASSIFICATION.NORMAL]: 'bg-green-100 text-green-800',
    [EQUIPMENT_CLASSIFICATION.IDLE]: 'bg-gray-100 text-gray-800'
  };
  return classes[classification] || 'bg-gray-100 text-gray-800';
}

/**
 * Format utilization rate as percentage
 * @param {number} rate - Utilization rate (0-1)
 * @returns {string} Formatted percentage
 */
export function formatUtilizationRate(rate) {
  return `${Math.round(rate * 100)}%`;
}

/**
 * Generate period identifier for monthly reports
 * @param {Date} date - Date to generate period for
 * @returns {string} Period identifier (e.g., 'monthly_2026_01')
 */
export function generateMonthlyPeriod(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `monthly_${year}_${month}`;
}
