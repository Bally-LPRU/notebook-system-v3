/**
 * Settings Type Definitions
 * Based on admin-settings-system design document specifications
 */

/**
 * System Settings Document Structure
 * @typedef {Object} SystemSettings
 * @property {number} maxLoanDuration - Maximum loan duration in days
 * @property {number} maxAdvanceBookingDays - Maximum advance booking period in days
 * @property {number} defaultCategoryLimit - Default items per category limit
 * @property {string|null} loanReturnStartTime - Allowed return start time (HH:mm, 24h) or null for no restriction
 * @property {string|null} loanReturnEndTime - Allowed return end time (HH:mm, 24h) or null for no restriction
 * @property {string|null} discordWebhookUrl - Discord webhook URL for notifications
 * @property {boolean} discordEnabled - Whether Discord notifications are enabled
 * @property {Date} lastUpdated - Last update timestamp
 * @property {string} lastUpdatedBy - Admin user ID who last updated
 * @property {number} version - Settings version number
 */

/**
 * Closed Date Document Structure
 * @typedef {Object} ClosedDate
 * @property {string} id - Auto-generated document ID
 * @property {Date} date - The closed date
 * @property {string} reason - Reason for closure (e.g., 'วันหยุดราชการ')
 * @property {Date} createdAt - Creation timestamp
 * @property {string} createdBy - Admin user ID who created
 * @property {boolean} isRecurring - Whether this is an annual recurring holiday
 * @property {string|null} recurringPattern - Recurring pattern (e.g., 'yearly')
 */

/**
 * Category Limit Document Structure
 * @typedef {Object} CategoryLimit
 * @property {string} categoryId - Category ID (document ID)
 * @property {string} categoryName - Category name for display
 * @property {number} limit - Maximum items allowed for this category
 * @property {Date} updatedAt - Last update timestamp
 * @property {string} updatedBy - Admin user ID who last updated
 */

/**
 * System Notification Document Structure
 * @typedef {Object} SystemNotification
 * @property {string} id - Auto-generated document ID
 * @property {string} title - Notification title
 * @property {string} content - Notification content/message
 * @property {string} type - Notification type: 'announcement', 'feedback_request', 'alert'
 * @property {string} priority - Priority level: 'low', 'medium', 'high'
 * @property {Date} createdAt - Creation timestamp
 * @property {string} createdBy - Admin user ID who created
 * @property {Date|null} expiresAt - Expiration timestamp (null for no expiration)
 * @property {boolean} feedbackEnabled - Whether feedback is enabled
 * @property {string|null} feedbackQuestion - Question for feedback request
 * @property {string[]} sentTo - Array of user IDs who received notification
 * @property {string[]} readBy - Array of user IDs who read notification
 * @property {NotificationResponse[]} responses - Array of user responses
 */

/**
 * Notification Response Structure
 * @typedef {Object} NotificationResponse
 * @property {string} userId - User ID who responded
 * @property {string} response - User's response text
 * @property {Date} timestamp - Response timestamp
 */

/**
 * Settings Audit Log Document Structure
 * @typedef {Object} SettingsAuditLog
 * @property {string} id - Auto-generated document ID
 * @property {Date} timestamp - Action timestamp
 * @property {string} adminId - Admin user ID who performed action
 * @property {string} adminName - Admin display name
 * @property {string} action - Action type: 'create', 'update', 'delete'
 * @property {string} settingType - Type of setting changed
 * @property {string} settingPath - Full path to setting (e.g., 'systemSettings.maxLoanDuration')
 * @property {*} oldValue - Previous value (any type)
 * @property {*} newValue - New value (any type)
 * @property {string|null} reason - Optional reason for change
 * @property {string} ipAddress - IP address of admin
 * @property {string} userAgent - Browser user agent string
 */

/**
 * Settings validation constants
 */
export const SETTINGS_VALIDATION = {
  maxLoanDuration: {
    min: 1,
    max: 365,
    default: 14
  },
  maxAdvanceBookingDays: {
    min: 1,
    max: 365,
    default: 30
  },
  defaultCategoryLimit: {
    min: 1,
    max: 100,
    default: 3
  }
};

/**
 * Notification type constants
 */
export const NOTIFICATION_TYPES = {
  ANNOUNCEMENT: 'announcement',
  FEEDBACK_REQUEST: 'feedback_request',
  ALERT: 'alert'
};

/**
 * Notification priority constants
 */
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

/**
 * Audit log action constants
 */
export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
};

/**
 * Critical settings that trigger admin notifications
 */
export const CRITICAL_SETTINGS = [
  'maxLoanDuration',
  'maxAdvanceBookingDays',
  'defaultCategoryLimit',
  'loanReturnStartTime',
  'loanReturnEndTime',
  'closedDates',
  'categoryLimits'
];

/**
 * Settings cache configuration
 */
export const SETTINGS_CACHE_CONFIG = {
  TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
  REFRESH_INTERVAL: 4 * 60 * 1000 // 4 minutes in milliseconds
};

/**
 * User Type Limit Document Structure
 * @typedef {Object} UserTypeLimit
 * @property {string} userType - User type: 'teacher', 'staff', 'student'
 * @property {string} userTypeName - Display name for user type
 * @property {number} maxItems - Maximum items allowed to borrow at once
 * @property {number} maxDays - Maximum loan duration in days
 * @property {number} maxAdvanceBookingDays - Maximum advance booking days
 * @property {boolean} isActive - Whether this limit is active
 * @property {Date} updatedAt - Last update timestamp
 * @property {string} updatedBy - Admin user ID who last updated
 */

/**
 * User type constants
 */
export const USER_TYPES = {
  TEACHER: 'teacher',
  STAFF: 'staff',
  STUDENT: 'student'
};

/**
 * User type display names (Thai)
 */
export const USER_TYPE_NAMES = {
  teacher: 'อาจารย์',
  staff: 'เจ้าหน้าที่',
  student: 'นักศึกษา'
};

/**
 * Default user type limits
 */
export const DEFAULT_USER_TYPE_LIMITS = {
  teacher: {
    userType: 'teacher',
    userTypeName: 'อาจารย์',
    maxItems: 10,
    maxDays: 30,
    maxAdvanceBookingDays: 60,
    isActive: true
  },
  staff: {
    userType: 'staff',
    userTypeName: 'เจ้าหน้าที่',
    maxItems: 5,
    maxDays: 14,
    maxAdvanceBookingDays: 30,
    isActive: true
  },
  student: {
    userType: 'student',
    userTypeName: 'นักศึกษา',
    maxItems: 3,
    maxDays: 7,
    maxAdvanceBookingDays: 14,
    isActive: true
  }
};

/**
 * User type limits validation
 */
export const USER_TYPE_LIMITS_VALIDATION = {
  maxItems: {
    min: 1,
    max: 50
  },
  maxDays: {
    min: 1,
    max: 365
  },
  maxAdvanceBookingDays: {
    min: 1,
    max: 365
  }
};

/**
 * Default system settings
 */
export const DEFAULT_SETTINGS = {
  maxLoanDuration: 14,
  maxAdvanceBookingDays: 30,
  defaultCategoryLimit: 3,
  loanReturnStartTime: null,
  loanReturnEndTime: null,
  discordWebhookUrl: null,
  discordEnabled: false,
  userTypeLimitsEnabled: false,
  version: 1
};
