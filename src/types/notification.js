/**
 * Notification type definitions
 */

// Notification types
export const NOTIFICATION_TYPES = {
  USER_APPROVAL: 'user_approval',
  USER_APPROVED: 'user_approved',
  USER_REJECTED: 'user_rejected',
  LOAN_REQUEST: 'loan_request',
  LOAN_APPROVED: 'loan_approved',
  LOAN_REJECTED: 'loan_rejected',
  LOAN_REMINDER: 'loan_reminder',
  LOAN_OVERDUE: 'loan_overdue',
  LOAN_RETURNED: 'loan_returned',
  RESERVATION_REQUEST: 'reservation_request',
  RESERVATION_APPROVED: 'reservation_approved',
  RESERVATION_REJECTED: 'reservation_rejected',
  RESERVATION_REMINDER: 'reservation_reminder',
  RESERVATION_READY: 'reservation_ready',
  RESERVATION_EXPIRED: 'reservation_expired',
  SYSTEM_UPDATE: 'system_update',
  EQUIPMENT_MAINTENANCE: 'equipment_maintenance'
};

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Notification status
export const NOTIFICATION_STATUS = {
  UNREAD: 'unread',
  READ: 'read',
  ARCHIVED: 'archived'
};

/**
 * Notification data structure
 * @typedef {Object} Notification
 * @property {string} id - Unique notification ID
 * @property {string} userId - ID of the user receiving the notification
 * @property {string} type - Type of notification (from NOTIFICATION_TYPES)
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {Object} data - Additional data related to the notification
 * @property {boolean} isRead - Whether the notification has been read
 * @property {string} priority - Priority level (from NOTIFICATION_PRIORITIES)
 * @property {string} actionUrl - URL for notification action (optional)
 * @property {string} actionText - Text for action button (optional)
 * @property {Date} expiresAt - Expiration date (optional)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} readAt - Read timestamp (optional)
 */

/**
 * Notification settings data structure
 * @typedef {Object} NotificationSettings
 * @property {string} userId - User ID (document ID)
 * @property {Object} emailNotifications - Email notification preferences
 * @property {boolean} emailNotifications.loanApproval - Loan approval notifications
 * @property {boolean} emailNotifications.loanReminder - Loan reminder notifications
 * @property {boolean} emailNotifications.reservationReminder - Reservation reminder notifications
 * @property {boolean} emailNotifications.systemUpdates - System update notifications
 * @property {Object} inAppNotifications - In-app notification preferences
 * @property {boolean} inAppNotifications.loanApproval - Loan approval notifications
 * @property {boolean} inAppNotifications.loanReminder - Loan reminder notifications
 * @property {boolean} inAppNotifications.reservationReminder - Reservation reminder notifications
 * @property {boolean} inAppNotifications.systemUpdates - System update notifications
 * @property {Object} reminderTiming - Reminder timing settings
 * @property {number} reminderTiming.loanReminder - Days before loan due date
 * @property {number} reminderTiming.reservationReminder - Hours before reservation time
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Scheduled notification data structure
 * @typedef {Object} ScheduledNotification
 * @property {string} id - Unique scheduled notification ID
 * @property {string} userId - Target user ID
 * @property {string} type - Notification type
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {Object} data - Additional data
 * @property {Date} scheduledTime - When to send the notification
 * @property {string} status - Status: 'scheduled', 'sent', 'cancelled'
 * @property {string} relatedId - Related entity ID (loan, reservation, etc.)
 * @property {string} relatedType - Related entity type
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} sentAt - Sent timestamp (optional)
 */

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS = {
  emailNotifications: {
    loanApproval: true,
    loanReminder: true,
    reservationReminder: true,
    systemUpdates: false
  },
  inAppNotifications: {
    loanApproval: true,
    loanReminder: true,
    reservationReminder: true,
    systemUpdates: true
  },
  reminderTiming: {
    loanReminder: 1, // 1 day before due date
    reservationReminder: 24 // 24 hours before reservation
  }
};

// Notification templates
export const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.USER_APPROVAL]: {
    title: 'ผู้ใช้ใหม่รอการอนุมัติ',
    message: '{userName} ({userEmail}) ได้สมัครสมาชิกใหม่และรอการอนุมัติ',
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    actionText: 'ดูรายละเอียด',
    actionUrl: '/admin/users'
  },
  [NOTIFICATION_TYPES.USER_APPROVED]: {
    title: 'บัญชีได้รับการอนุมัติ',
    message: 'ยินดีต้อนรับสู่ระบบยืม-คืนอุปกรณ์! คุณสามารถใช้งานระบบได้แล้ว',
    priority: NOTIFICATION_PRIORITIES.HIGH,
    actionText: 'เข้าสู่ระบบ',
    actionUrl: '/dashboard'
  },
  [NOTIFICATION_TYPES.USER_REJECTED]: {
    title: 'บัญชีถูกปฏิเสธ',
    message: 'บัญชีของคุณถูกปฏิเสธ{rejectionReason}',
    priority: NOTIFICATION_PRIORITIES.HIGH,
    actionText: 'ติดต่อผู้ดูแลระบบ',
    actionUrl: '/contact'
  },
  [NOTIFICATION_TYPES.LOAN_REQUEST]: {
    title: 'คำขอยืมอุปกรณ์ใหม่',
    message: '{userName} ขอยืม {equipmentName}',
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    actionText: 'ดูรายละเอียด',
    actionUrl: '/admin/loan-requests/{requestId}'
  },
  [NOTIFICATION_TYPES.LOAN_APPROVED]: {
    title: 'คำขอยืมได้รับการอนุมัติ',
    message: 'คำขอยืม {equipmentName} ของคุณได้รับการอนุมัติแล้ว กรุณามารับอุปกรณ์ตามวันที่กำหนด',
    priority: NOTIFICATION_PRIORITIES.HIGH,
    actionText: 'ดูรายละเอียด',
    actionUrl: '/my-requests/{requestId}'
  },
  [NOTIFICATION_TYPES.LOAN_REJECTED]: {
    title: 'คำขอยืมถูกปฏิเสธ',
    message: 'คำขอยืม {equipmentName} ถูกปฏิเสธ{rejectionReason}',
    priority: NOTIFICATION_PRIORITIES.HIGH,
    actionText: 'ดูรายละเอียด',
    actionUrl: '/my-requests/{requestId}'
  },
  [NOTIFICATION_TYPES.LOAN_REMINDER]: {
    title: 'แจ้งเตือนคืนอุปกรณ์',
    message: 'กรุณาคืน {equipmentName} ภายในวันที่ {dueDate}',
    priority: NOTIFICATION_PRIORITIES.HIGH,
    actionText: 'ดูรายละเอียด',
    actionUrl: '/my-loans/{loanId}'
  },
  [NOTIFICATION_TYPES.LOAN_OVERDUE]: {
    title: 'อุปกรณ์เกินกำหนดคืน',
    message: '{equipmentName} เกินกำหนดคืนแล้ว กรุณาคืนโดยเร็วที่สุด',
    priority: NOTIFICATION_PRIORITIES.URGENT,
    actionText: 'ดูรายละเอียด',
    actionUrl: '/my-loans/{loanId}'
  },
  [NOTIFICATION_TYPES.RESERVATION_REQUEST]: {
    title: 'คำขอจองอุปกรณ์ใหม่',
    message: '{userName} ขอจอง {equipmentName} สำหรับวันที่ {reservationDate}',
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    actionText: 'ดูรายละเอียด',
    actionUrl: '/admin/reservations/{reservationId}'
  },
  [NOTIFICATION_TYPES.RESERVATION_APPROVED]: {
    title: 'การจองได้รับการอนุมัติ',
    message: 'การจอง {equipmentName} สำหรับวันที่ {reservationDate} ได้รับการอนุมัติแล้ว',
    priority: NOTIFICATION_PRIORITIES.HIGH,
    actionText: 'ดูรายละเอียด',
    actionUrl: '/my-reservations/{reservationId}'
  },
  [NOTIFICATION_TYPES.RESERVATION_REMINDER]: {
    title: 'แจ้งเตือนการจอง',
    message: 'การจอง {equipmentName} ของคุณจะเริ่มในอีก {hours} ชั่วโมง',
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    actionText: 'ดูรายละเอียด',
    actionUrl: '/my-reservations/{reservationId}'
  },
  [NOTIFICATION_TYPES.RESERVATION_READY]: {
    title: 'อุปกรณ์พร้อมรับ',
    message: '{equipmentName} พร้อมให้รับแล้ว กรุณามารับภายใน 2 ชั่วโมง',
    priority: NOTIFICATION_PRIORITIES.HIGH,
    actionText: 'ดูรายละเอียด',
    actionUrl: '/my-reservations/{reservationId}'
  },
  [NOTIFICATION_TYPES.RESERVATION_EXPIRED]: {
    title: 'การจองหมดอายุ',
    message: 'การจอง {equipmentName} หมดอายุแล้วเนื่องจากไม่มารับตามเวลา',
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    actionText: 'จองใหม่',
    actionUrl: '/equipment/{equipmentId}'
  }
};