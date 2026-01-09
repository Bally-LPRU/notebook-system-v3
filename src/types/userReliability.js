/**
 * User Reliability Types
 * 
 * Types and enums for the User Reliability Tracker
 * Requirements: 10.1, 10.2, 10.3
 */

/**
 * User reliability classification levels
 */
export const USER_CLASSIFICATION = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor'
};

/**
 * Reliability thresholds
 */
export const RELIABILITY_THRESHOLDS = {
  EXCELLENT: 90,      // Score >= 90
  GOOD: 70,           // Score >= 70
  FAIR: 50,           // Score >= 50
  FLAG_THRESHOLD: 50, // Flag users below this score
  NO_SHOW_LIMIT: 3,   // No-shows in 30 days to be flagged
  NO_SHOW_PERIOD: 30  // Days to check for repeat no-shows
};

/**
 * Score calculation weights
 */
export const SCORE_WEIGHTS = {
  ON_TIME_RETURN: 0.6,  // 60% weight for on-time returns
  NO_SHOW: 0.4          // 40% weight for no-show rate
};

/**
 * @typedef {Object} UserReliability
 * @property {string} userId - User ID
 * @property {string} userName - User display name
 * @property {string} userEmail - User email
 * @property {number} totalLoans - Total number of loans
 * @property {number} onTimeReturns - Number of on-time returns
 * @property {number} lateReturns - Number of late returns
 * @property {number} onTimeReturnRate - On-time return rate (0-1)
 * @property {number} totalReservations - Total reservations made
 * @property {number} noShows - Total no-shows
 * @property {number} noShowRate - No-show rate (0-1)
 * @property {number} reliabilityScore - Reliability score (0-100)
 * @property {string} classification - Classification from USER_CLASSIFICATION
 * @property {number} recentNoShows - No-shows in last 30 days
 * @property {boolean} isRepeatOffender - Whether user is repeat no-show offender
 * @property {boolean} isFlagged - Whether user is flagged for review
 * @property {Date} lastCalculatedAt - Last calculation timestamp
 */

/**
 * @typedef {Object} UserBehaviorSummary
 * @property {number} totalUsers - Total users analyzed
 * @property {number} excellentCount - Users with excellent reliability
 * @property {number} goodCount - Users with good reliability
 * @property {number} fairCount - Users with fair reliability
 * @property {number} poorCount - Users with poor reliability
 * @property {number} flaggedCount - Users flagged for review
 * @property {number} repeatOffenderCount - Repeat no-show offenders
 * @property {number} averageReliabilityScore - Average reliability score
 */

/**
 * @typedef {Object} TopUser
 * @property {string} userId - User ID
 * @property {string} userName - User name
 * @property {number} value - Ranking value (loans count or reliability score)
 * @property {string} rankType - 'top_borrower' | 'most_reliable'
 */

/**
 * Create user reliability object with defaults
 * @param {Partial<UserReliability>} data - Reliability data
 * @returns {UserReliability} Complete reliability object
 */
export function createUserReliability(data) {
  return {
    userId: data.userId || '',
    userName: data.userName || '',
    userEmail: data.userEmail || '',
    totalLoans: data.totalLoans || 0,
    onTimeReturns: data.onTimeReturns || 0,
    lateReturns: data.lateReturns || 0,
    onTimeReturnRate: data.onTimeReturnRate || 0,
    totalReservations: data.totalReservations || 0,
    noShows: data.noShows || 0,
    noShowRate: data.noShowRate || 0,
    reliabilityScore: data.reliabilityScore || 0,
    classification: data.classification || USER_CLASSIFICATION.FAIR,
    recentNoShows: data.recentNoShows || 0,
    isRepeatOffender: data.isRepeatOffender || false,
    isFlagged: data.isFlagged || false,
    lastCalculatedAt: data.lastCalculatedAt || new Date()
  };
}

/**
 * Create user behavior summary object
 * @param {Partial<UserBehaviorSummary>} data - Summary data
 * @returns {UserBehaviorSummary} Complete summary object
 */
export function createUserBehaviorSummary(data) {
  return {
    totalUsers: data.totalUsers || 0,
    excellentCount: data.excellentCount || 0,
    goodCount: data.goodCount || 0,
    fairCount: data.fairCount || 0,
    poorCount: data.poorCount || 0,
    flaggedCount: data.flaggedCount || 0,
    repeatOffenderCount: data.repeatOffenderCount || 0,
    averageReliabilityScore: data.averageReliabilityScore || 0
  };
}

/**
 * Get display label for classification
 * @param {string} classification - User classification
 * @returns {string} Display label
 */
export function getClassificationLabel(classification) {
  const labels = {
    [USER_CLASSIFICATION.EXCELLENT]: 'ดีเยี่ยม',
    [USER_CLASSIFICATION.GOOD]: 'ดี',
    [USER_CLASSIFICATION.FAIR]: 'พอใช้',
    [USER_CLASSIFICATION.POOR]: 'ต้องปรับปรุง'
  };
  return labels[classification] || classification;
}

/**
 * Get CSS class for classification badge
 * @param {string} classification - User classification
 * @returns {string} CSS class name
 */
export function getClassificationBadgeClass(classification) {
  const classes = {
    [USER_CLASSIFICATION.EXCELLENT]: 'bg-green-100 text-green-800',
    [USER_CLASSIFICATION.GOOD]: 'bg-blue-100 text-blue-800',
    [USER_CLASSIFICATION.FAIR]: 'bg-yellow-100 text-yellow-800',
    [USER_CLASSIFICATION.POOR]: 'bg-red-100 text-red-800'
  };
  return classes[classification] || 'bg-gray-100 text-gray-800';
}

/**
 * Format reliability score for display
 * @param {number} score - Reliability score (0-100)
 * @returns {string} Formatted score
 */
export function formatReliabilityScore(score) {
  return `${Math.round(score)}%`;
}

/**
 * Format rate as percentage
 * @param {number} rate - Rate (0-1)
 * @returns {string} Formatted percentage
 */
export function formatRate(rate) {
  return `${Math.round(rate * 100)}%`;
}
