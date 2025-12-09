/**
 * Admin Unified Notification System Type Definitions
 * 
 * This module defines all types and interfaces for the unified admin notification system
 * that combines action items, personal notifications, and history into a single view.
 */

// ============================================================================
// Source Types - Types of notification sources
// ============================================================================

/**
 * Source types for notifications
 * @readonly
 * @enum {string}
 */
export const SOURCE_TYPES = {
  USER_REGISTRATION: 'user_registration',
  LOAN_REQUEST: 'loan_request',
  OVERDUE_LOAN: 'overdue_loan',
  RESERVATION_REQUEST: 'reservation_request',
  PERSONAL: 'personal'
};

/**
 * Notification categories
 * @readonly
 * @enum {string}
 */
export const NOTIFICATION_CATEGORIES = {
  USERS: 'users',
  LOANS: 'loans',
  RESERVATIONS: 'reservations',
  SYSTEM: 'system'
};

/**
 * Priority levels for notifications
 * @readonly
 * @enum {string}
 */
export const PRIORITY_LEVELS = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Priority order for sorting (lower number = higher priority)
 * @readonly
 */
export const PRIORITY_ORDER = {
  [PRIORITY_LEVELS.URGENT]: 0,
  [PRIORITY_LEVELS.HIGH]: 1,
  [PRIORITY_LEVELS.MEDIUM]: 2,
  [PRIORITY_LEVELS.LOW]: 3
};

/**
 * Quick action types
 * @readonly
 * @enum {string}
 */
export const QUICK_ACTION_TYPES = {
  APPROVE: 'approve',
  REJECT: 'reject',
  VIEW: 'view'
};

/**
 * History action types
 * @readonly
 * @enum {string}
 */
export const HISTORY_ACTION_TYPES = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  VIEWED: 'viewed',
  DISMISSED: 'dismissed'
};

// ============================================================================
// Type Guards - Functions to validate source types
// ============================================================================

/**
 * Check if a value is a valid source type
 * @param {string} value - Value to check
 * @returns {boolean} True if valid source type
 */
export const isValidSourceType = (value) => {
  return Object.values(SOURCE_TYPES).includes(value);
};

/**
 * Check if a value is a valid category
 * @param {string} value - Value to check
 * @returns {boolean} True if valid category
 */
export const isValidCategory = (value) => {
  return Object.values(NOTIFICATION_CATEGORIES).includes(value);
};

/**
 * Check if a value is a valid priority
 * @param {string} value - Value to check
 * @returns {boolean} True if valid priority
 */
export const isValidPriority = (value) => {
  return Object.values(PRIORITY_LEVELS).includes(value);
};

/**
 * Check if source type is an action item (requires admin action)
 * @param {string} sourceType - Source type to check
 * @returns {boolean} True if action item
 */
export const isActionItem = (sourceType) => {
  return [
    SOURCE_TYPES.USER_REGISTRATION,
    SOURCE_TYPES.LOAN_REQUEST,
    SOURCE_TYPES.OVERDUE_LOAN,
    SOURCE_TYPES.RESERVATION_REQUEST
  ].includes(sourceType);
};

/**
 * Check if source type is a personal notification
 * @param {string} sourceType - Source type to check
 * @returns {boolean} True if personal notification
 */
export const isPersonalNotification = (sourceType) => {
  return sourceType === SOURCE_TYPES.PERSONAL;
};

// ============================================================================
// Priority Assignment - Assign priority based on source type
// ============================================================================

/**
 * Get default priority for a source type
 * @param {string} sourceType - Source type
 * @param {string} [originalPriority] - Original priority from source document (for personal notifications)
 * @returns {string} Priority level
 */
export const getPriorityForSourceType = (sourceType, originalPriority = null) => {
  switch (sourceType) {
    case SOURCE_TYPES.OVERDUE_LOAN:
      return PRIORITY_LEVELS.URGENT;
    case SOURCE_TYPES.LOAN_REQUEST:
      return PRIORITY_LEVELS.HIGH;
    case SOURCE_TYPES.USER_REGISTRATION:
    case SOURCE_TYPES.RESERVATION_REQUEST:
      return PRIORITY_LEVELS.MEDIUM;
    case SOURCE_TYPES.PERSONAL:
      // For personal notifications, use original priority if valid, otherwise medium
      return isValidPriority(originalPriority) ? originalPriority : PRIORITY_LEVELS.MEDIUM;
    default:
      return PRIORITY_LEVELS.LOW;
  }
};

/**
 * Get category for a source type
 * @param {string} sourceType - Source type
 * @returns {string} Category
 */
export const getCategoryForSourceType = (sourceType) => {
  switch (sourceType) {
    case SOURCE_TYPES.USER_REGISTRATION:
      return NOTIFICATION_CATEGORIES.USERS;
    case SOURCE_TYPES.LOAN_REQUEST:
    case SOURCE_TYPES.OVERDUE_LOAN:
      return NOTIFICATION_CATEGORIES.LOANS;
    case SOURCE_TYPES.RESERVATION_REQUEST:
      return NOTIFICATION_CATEGORIES.RESERVATIONS;
    case SOURCE_TYPES.PERSONAL:
      return NOTIFICATION_CATEGORIES.SYSTEM;
    default:
      return NOTIFICATION_CATEGORIES.SYSTEM;
  }
};

// ============================================================================
// JSDoc Type Definitions
// ============================================================================

/**
 * Quick action button configuration
 * @typedef {Object} QuickAction
 * @property {string} label - Button label text
 * @property {'approve'|'reject'|'view'} action - Action type
 * @property {'primary'|'danger'|'secondary'} variant - Button style variant
 */

/**
 * Unified notification object combining data from multiple sources
 * @typedef {Object} UnifiedNotification
 * @property {string} id - Unique notification ID (sourceType_sourceId)
 * @property {string} sourceId - Original document ID from source collection
 * @property {'user_registration'|'loan_request'|'overdue_loan'|'reservation_request'|'personal'} sourceType - Type of notification source
 * @property {string} sourceCollection - Source Firestore collection name
 * @property {'users'|'loans'|'reservations'|'system'} category - Notification category
 * @property {'urgent'|'high'|'medium'|'low'} priority - Priority level
 * @property {string} title - Notification title
 * @property {string} description - Main description text
 * @property {string} [detail] - Additional detail text
 * @property {string} link - Navigation link for the notification
 * @property {string} icon - Icon emoji or identifier
 * @property {string} iconBg - CSS class for icon background
 * @property {boolean} isRead - Whether notification has been read
 * @property {Date} [readAt] - When notification was marked as read
 * @property {Date} createdAt - When notification was created
 * @property {Object} sourceData - Original document data from source
 * @property {QuickAction[]} [quickActions] - Available quick actions
 * @property {string} [userName] - User name (for display)
 * @property {string} [equipmentName] - Equipment name (for display)
 */

/**
 * Read state for a notification
 * @typedef {Object} ReadState
 * @property {string} id - Document ID (auto-generated)
 * @property {string} adminId - Admin user ID
 * @property {string} notificationId - Composite ID (sourceType_sourceId)
 * @property {string} sourceType - Source type of the notification
 * @property {string} sourceCollection - Source collection name
 * @property {boolean} isRead - Whether marked as read
 * @property {Date|null} readAt - When marked as read
 * @property {Date} createdAt - When state was created
 */

/**
 * History item for completed actions
 * @typedef {Object} HistoryItem
 * @property {string} id - Document ID
 * @property {string} adminId - Admin who performed the action
 * @property {'approved'|'rejected'|'viewed'|'dismissed'} action - Action performed
 * @property {string} sourceType - Source type of the notification
 * @property {string} sourceId - Original document ID
 * @property {Object} sourceData - Snapshot of original data at action time
 * @property {Date} actionAt - When action was performed
 * @property {string} [note] - Optional note/reason
 */

/**
 * Notification filter options
 * @typedef {Object} NotificationFilter
 * @property {string} [searchTerm] - Text search term
 * @property {'users'|'loans'|'reservations'|'system'|'all'} [category] - Category filter
 * @property {'urgent'|'high'|'medium'|'low'|'all'} [priority] - Priority filter
 * @property {Date} [startDate] - Date range start
 * @property {Date} [endDate] - Date range end
 * @property {'action'|'personal'|'history'|'all'} [tab] - Active tab
 */

/**
 * Notification counts by category and status
 * @typedef {Object} NotificationCounts
 * @property {number} total - Total notifications
 * @property {number} unread - Unread notifications
 * @property {number} actionItems - Action items count
 * @property {number} personal - Personal notifications count
 * @property {number} users - Pending user registrations
 * @property {number} loans - Pending loan requests
 * @property {number} overdue - Overdue loans
 * @property {number} reservations - Pending reservations
 */

// ============================================================================
// Factory Functions - Create notification objects
// ============================================================================

/**
 * Create a unified notification ID from source type and source ID
 * @param {string} sourceType - Source type
 * @param {string} sourceId - Source document ID
 * @returns {string} Unified notification ID
 */
export const createNotificationId = (sourceType, sourceId) => {
  return `${sourceType}_${sourceId}`;
};

/**
 * Parse a unified notification ID into source type and source ID
 * @param {string} notificationId - Unified notification ID
 * @returns {{sourceType: string, sourceId: string}} Parsed components
 */
export const parseNotificationId = (notificationId) => {
  // Source types can have underscores (e.g., 'user_registration', 'loan_request')
  // We need to find the correct split point by checking against known source types
  const sourceTypes = Object.values(SOURCE_TYPES);
  
  for (const sourceType of sourceTypes) {
    if (notificationId.startsWith(sourceType + '_')) {
      const sourceId = notificationId.slice(sourceType.length + 1);
      return { sourceType, sourceId };
    }
  }
  
  // Fallback: split at first underscore (for unknown source types)
  const firstUnderscoreIndex = notificationId.indexOf('_');
  if (firstUnderscoreIndex === -1) {
    return { sourceType: notificationId, sourceId: '' };
  }
  
  return {
    sourceType: notificationId.slice(0, firstUnderscoreIndex),
    sourceId: notificationId.slice(firstUnderscoreIndex + 1)
  };
};

/**
 * Create quick actions for a notification based on source type
 * @param {string} sourceType - Source type
 * @returns {QuickAction[]} Array of quick actions
 */
export const createQuickActions = (sourceType) => {
  switch (sourceType) {
    case SOURCE_TYPES.USER_REGISTRATION:
      return [
        { label: 'อนุมัติ', action: QUICK_ACTION_TYPES.APPROVE, variant: 'primary' },
        { label: 'ปฏิเสธ', action: QUICK_ACTION_TYPES.REJECT, variant: 'danger' }
      ];
    case SOURCE_TYPES.LOAN_REQUEST:
      return [
        { label: 'อนุมัติ', action: QUICK_ACTION_TYPES.APPROVE, variant: 'primary' },
        { label: 'ปฏิเสธ', action: QUICK_ACTION_TYPES.REJECT, variant: 'danger' }
      ];
    case SOURCE_TYPES.RESERVATION_REQUEST:
      return [
        { label: 'อนุมัติ', action: QUICK_ACTION_TYPES.APPROVE, variant: 'primary' },
        { label: 'ปฏิเสธ', action: QUICK_ACTION_TYPES.REJECT, variant: 'danger' }
      ];
    case SOURCE_TYPES.OVERDUE_LOAN:
      return [
        { label: 'ดูรายละเอียด', action: QUICK_ACTION_TYPES.VIEW, variant: 'secondary' }
      ];
    case SOURCE_TYPES.PERSONAL:
      return [
        { label: 'ดู', action: QUICK_ACTION_TYPES.VIEW, variant: 'secondary' }
      ];
    default:
      return [];
  }
};

/**
 * Create a read state object
 * @param {string} adminId - Admin user ID
 * @param {string} notificationId - Unified notification ID
 * @param {string} sourceType - Source type
 * @param {string} sourceCollection - Source collection name
 * @returns {ReadState} Read state object
 */
export const createReadState = (adminId, notificationId, sourceType, sourceCollection) => {
  return {
    adminId,
    notificationId,
    sourceType,
    sourceCollection,
    isRead: true,
    readAt: new Date(),
    createdAt: new Date()
  };
};

/**
 * Create a history item object
 * @param {string} adminId - Admin user ID
 * @param {string} action - Action performed
 * @param {string} sourceType - Source type
 * @param {string} sourceId - Source document ID
 * @param {Object} sourceData - Snapshot of source data
 * @param {string} [note] - Optional note
 * @returns {HistoryItem} History item object
 */
export const createHistoryItem = (adminId, action, sourceType, sourceId, sourceData, note = null) => {
  return {
    adminId,
    action,
    sourceType,
    sourceId,
    sourceData,
    actionAt: new Date(),
    ...(note && { note })
  };
};

// ============================================================================
// Sorting Functions
// ============================================================================

/**
 * Compare two notifications for sorting by priority then date
 * @param {UnifiedNotification} a - First notification
 * @param {UnifiedNotification} b - Second notification
 * @returns {number} Comparison result (-1, 0, 1)
 */
export const compareNotifications = (a, b) => {
  // First compare by priority (lower order = higher priority)
  const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (priorityDiff !== 0) return priorityDiff;
  
  // Same priority - sort by date (newest first)
  const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
  const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
  return dateB.getTime() - dateA.getTime();
};

/**
 * Sort notifications by priority then date
 * @param {UnifiedNotification[]} notifications - Array of notifications
 * @returns {UnifiedNotification[]} Sorted array (new array, does not mutate input)
 */
export const sortNotifications = (notifications) => {
  return [...notifications].sort(compareNotifications);
};

// ============================================================================
// Filter Functions
// ============================================================================

/**
 * Filter notifications by tab
 * @param {UnifiedNotification[]} notifications - Array of notifications
 * @param {'action'|'personal'|'all'} tab - Tab to filter by
 * @returns {UnifiedNotification[]} Filtered array
 */
export const filterByTab = (notifications, tab) => {
  if (tab === 'all') return notifications;
  if (tab === 'action') return notifications.filter(n => isActionItem(n.sourceType));
  if (tab === 'personal') return notifications.filter(n => isPersonalNotification(n.sourceType));
  return notifications;
};

/**
 * Filter notifications by category
 * @param {UnifiedNotification[]} notifications - Array of notifications
 * @param {string} category - Category to filter by ('all' for no filter)
 * @returns {UnifiedNotification[]} Filtered array
 */
export const filterByCategory = (notifications, category) => {
  if (category === 'all') return notifications;
  return notifications.filter(n => n.category === category);
};

/**
 * Filter notifications by priority
 * @param {UnifiedNotification[]} notifications - Array of notifications
 * @param {string} priority - Priority to filter by ('all' for no filter)
 * @returns {UnifiedNotification[]} Filtered array
 */
export const filterByPriority = (notifications, priority) => {
  if (priority === 'all') return notifications;
  return notifications.filter(n => n.priority === priority);
};

/**
 * Filter notifications by date range
 * @param {UnifiedNotification[]} notifications - Array of notifications
 * @param {Date|null} startDate - Start date (inclusive)
 * @param {Date|null} endDate - End date (inclusive)
 * @returns {UnifiedNotification[]} Filtered array
 */
export const filterByDateRange = (notifications, startDate, endDate) => {
  return notifications.filter(n => {
    const date = n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt);
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });
};

/**
 * Filter notifications by search term
 * @param {UnifiedNotification[]} notifications - Array of notifications
 * @param {string} searchTerm - Search term
 * @returns {UnifiedNotification[]} Filtered array
 */
export const filterBySearchTerm = (notifications, searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) return notifications;
  
  const term = searchTerm.toLowerCase().trim();
  return notifications.filter(n => {
    // Search in title, description, detail
    if (n.title?.toLowerCase().includes(term)) return true;
    if (n.description?.toLowerCase().includes(term)) return true;
    if (n.detail?.toLowerCase().includes(term)) return true;
    
    // Search in user name and equipment name
    if (n.userName?.toLowerCase().includes(term)) return true;
    if (n.equipmentName?.toLowerCase().includes(term)) return true;
    
    // Search in source data
    if (n.sourceData?.email?.toLowerCase().includes(term)) return true;
    if (n.sourceData?.equipmentName?.toLowerCase().includes(term)) return true;
    if (n.sourceData?._equipmentName?.toLowerCase().includes(term)) return true;
    if (n.sourceData?.userName?.toLowerCase().includes(term)) return true;
    if (n.sourceData?._userName?.toLowerCase().includes(term)) return true;
    
    return false;
  });
};

/**
 * Apply all filters to notifications
 * @param {UnifiedNotification[]} notifications - Array of notifications
 * @param {NotificationFilter} filter - Filter options
 * @returns {UnifiedNotification[]} Filtered array
 */
export const applyFilters = (notifications, filter) => {
  let result = notifications;
  
  if (filter.tab) {
    result = filterByTab(result, filter.tab);
  }
  if (filter.category && filter.category !== 'all') {
    result = filterByCategory(result, filter.category);
  }
  if (filter.priority && filter.priority !== 'all') {
    result = filterByPriority(result, filter.priority);
  }
  if (filter.startDate || filter.endDate) {
    result = filterByDateRange(result, filter.startDate, filter.endDate);
  }
  if (filter.searchTerm) {
    result = filterBySearchTerm(result, filter.searchTerm);
  }
  
  return result;
};

export default {
  // Enums
  SOURCE_TYPES,
  NOTIFICATION_CATEGORIES,
  PRIORITY_LEVELS,
  PRIORITY_ORDER,
  QUICK_ACTION_TYPES,
  HISTORY_ACTION_TYPES,
  
  // Type guards
  isValidSourceType,
  isValidCategory,
  isValidPriority,
  isActionItem,
  isPersonalNotification,
  
  // Priority/Category assignment
  getPriorityForSourceType,
  getCategoryForSourceType,
  
  // Factory functions
  createNotificationId,
  parseNotificationId,
  createQuickActions,
  createReadState,
  createHistoryItem,
  
  // Sorting
  compareNotifications,
  sortNotifications,
  
  // Filtering
  filterByTab,
  filterByCategory,
  filterByPriority,
  filterByDateRange,
  filterBySearchTerm,
  applyFilters
};
