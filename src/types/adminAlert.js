/**
 * Admin Alert Types and Constants
 * 
 * Types and enums for the Proactive Alert Engine
 * Requirements: 1.1, 1.2, 8.2, 8.3
 */

/**
 * Alert priority levels
 * Used for grouping and sorting alerts by urgency
 */
export const ALERT_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Alert types for different system events
 */
export const ALERT_TYPE = {
  OVERDUE_LOAN: 'overdue_loan',
  NO_SHOW_RESERVATION: 'no_show_reservation',
  HIGH_DEMAND_EQUIPMENT: 'high_demand_equipment',
  IDLE_EQUIPMENT: 'idle_equipment',
  LATE_RETURN_RISK: 'late_return_risk',
  DEMAND_EXCEEDS_SUPPLY: 'demand_exceeds_supply',
  LOW_RELIABILITY_USER: 'low_reliability_user',
  REPEAT_NO_SHOW_USER: 'repeat_no_show_user'
};

/**
 * Quick action types for alert resolution
 */
export const QUICK_ACTION_TYPE = {
  SEND_REMINDER: 'send_reminder',
  MARK_CONTACTED: 'mark_contacted',
  CANCEL_RESERVATION: 'cancel_reservation',
  EXTEND_PICKUP_TIME: 'extend_pickup_time',
  CONTACT_USER: 'contact_user',
  FLAG_USER: 'flag_user',
  DISMISS: 'dismiss'
};

/**
 * @typedef {Object} QuickAction
 * @property {string} id - Unique identifier for the action
 * @property {string} label - Display label for the action button
 * @property {string} action - Action type from QUICK_ACTION_TYPE
 * @property {Object} params - Additional parameters for the action
 */

/**
 * @typedef {Object} Alert
 * @property {string} id - Unique alert identifier
 * @property {string} type - Alert type from ALERT_TYPE
 * @property {string} priority - Priority level from ALERT_PRIORITY
 * @property {string} title - Alert title
 * @property {string} description - Detailed description
 * @property {string} sourceId - ID of related entity (loan, reservation, equipment, user)
 * @property {string} sourceType - Type of source: 'loan', 'reservation', 'equipment', 'user'
 * @property {Object} sourceData - Snapshot of related entity data
 * @property {QuickAction[]} quickActions - Available quick actions
 * @property {boolean} isResolved - Whether alert has been resolved
 * @property {Date|null} createdAt - Creation timestamp
 * @property {Date|null} resolvedAt - Resolution timestamp
 * @property {string|null} resolvedBy - Admin ID who resolved
 * @property {string|null} resolvedAction - Action taken to resolve
 */

/**
 * Create a new alert object with default values
 * @param {Partial<Alert>} data - Alert data
 * @returns {Alert} Complete alert object
 */
export function createAlert(data) {
  return {
    id: data.id || '',
    type: data.type || ALERT_TYPE.OVERDUE_LOAN,
    priority: data.priority || ALERT_PRIORITY.MEDIUM,
    title: data.title || '',
    description: data.description || '',
    sourceId: data.sourceId || '',
    sourceType: data.sourceType || '',
    sourceData: data.sourceData || {},
    quickActions: data.quickActions || [],
    isResolved: data.isResolved || false,
    createdAt: data.createdAt || null,
    resolvedAt: data.resolvedAt || null,
    resolvedBy: data.resolvedBy || null,
    resolvedAction: data.resolvedAction || null
  };
}

/**
 * Create a quick action object
 * @param {string} id - Action ID
 * @param {string} label - Display label
 * @param {string} action - Action type
 * @param {Object} params - Action parameters
 * @returns {QuickAction} Quick action object
 */
export function createQuickAction(id, label, action, params = {}) {
  return { id, label, action, params };
}

/**
 * Get priority order for sorting (lower = higher priority)
 * @param {string} priority - Priority level
 * @returns {number} Sort order
 */
export function getPriorityOrder(priority) {
  const order = {
    [ALERT_PRIORITY.CRITICAL]: 0,
    [ALERT_PRIORITY.HIGH]: 1,
    [ALERT_PRIORITY.MEDIUM]: 2,
    [ALERT_PRIORITY.LOW]: 3
  };
  return order[priority] ?? 4;
}

/**
 * Get display label for alert type
 * @param {string} type - Alert type
 * @returns {string} Display label
 */
export function getAlertTypeLabel(type) {
  const labels = {
    [ALERT_TYPE.OVERDUE_LOAN]: 'การยืมเกินกำหนด',
    [ALERT_TYPE.NO_SHOW_RESERVATION]: 'ไม่มารับอุปกรณ์',
    [ALERT_TYPE.HIGH_DEMAND_EQUIPMENT]: 'อุปกรณ์ความต้องการสูง',
    [ALERT_TYPE.IDLE_EQUIPMENT]: 'อุปกรณ์ไม่ถูกใช้งาน',
    [ALERT_TYPE.LATE_RETURN_RISK]: 'เสี่ยงคืนล่าช้า',
    [ALERT_TYPE.DEMAND_EXCEEDS_SUPPLY]: 'ความต้องการเกินจำนวน',
    [ALERT_TYPE.LOW_RELIABILITY_USER]: 'ผู้ใช้ความน่าเชื่อถือต่ำ',
    [ALERT_TYPE.REPEAT_NO_SHOW_USER]: 'ผู้ใช้ไม่มารับซ้ำ'
  };
  return labels[type] || type;
}

/**
 * Get display label for priority
 * @param {string} priority - Priority level
 * @returns {string} Display label
 */
export function getPriorityLabel(priority) {
  const labels = {
    [ALERT_PRIORITY.CRITICAL]: 'วิกฤต',
    [ALERT_PRIORITY.HIGH]: 'สูง',
    [ALERT_PRIORITY.MEDIUM]: 'ปานกลาง',
    [ALERT_PRIORITY.LOW]: 'ต่ำ'
  };
  return labels[priority] || priority;
}
