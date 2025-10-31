/**
 * Loan Request Type Definitions
 * Based on design document specifications
 */

// Loan request status constants
export const LOAN_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  BORROWED: 'borrowed',
  RETURNED: 'returned',
  OVERDUE: 'overdue'
};

// Loan request status labels in Thai
export const LOAN_REQUEST_STATUS_LABELS = {
  [LOAN_REQUEST_STATUS.PENDING]: 'รอการอนุมัติ',
  [LOAN_REQUEST_STATUS.APPROVED]: 'อนุมัติแล้ว',
  [LOAN_REQUEST_STATUS.REJECTED]: 'ปฏิเสธ',
  [LOAN_REQUEST_STATUS.BORROWED]: 'กำลังยืม',
  [LOAN_REQUEST_STATUS.RETURNED]: 'คืนแล้ว',
  [LOAN_REQUEST_STATUS.OVERDUE]: 'เกินกำหนด'
};

// Loan request status colors for UI
export const LOAN_REQUEST_STATUS_COLORS = {
  [LOAN_REQUEST_STATUS.PENDING]: 'yellow',
  [LOAN_REQUEST_STATUS.APPROVED]: 'green',
  [LOAN_REQUEST_STATUS.REJECTED]: 'red',
  [LOAN_REQUEST_STATUS.BORROWED]: 'blue',
  [LOAN_REQUEST_STATUS.RETURNED]: 'gray',
  [LOAN_REQUEST_STATUS.OVERDUE]: 'red'
};

/**
 * Loan Request interface/type definition
 * @typedef {Object} LoanRequest
 * @property {string} id - Auto-generated ID
 * @property {string} equipmentId - Reference to Equipment
 * @property {string} userId - Reference to User
 * @property {Date} requestDate - วันที่ขอยืม
 * @property {Date} borrowDate - วันที่ต้องการยืม
 * @property {Date} expectedReturnDate - วันที่คาดว่าจะคืน
 * @property {Date|null} actualReturnDate - วันที่คืนจริง
 * @property {string} purpose - วัตถุประสงค์
 * @property {string} notes - หมายเหตุ
 * @property {string} status - สถานะ (from LOAN_REQUEST_STATUS)
 * @property {string|null} approvedBy - UID ของผู้อนุมัติ
 * @property {Date|null} approvedAt - วันที่อนุมัติ
 * @property {string|null} rejectionReason - เหตุผลปฏิเสธ
 * @property {Date} createdAt - วันที่สร้าง
 * @property {Date} updatedAt - วันที่อัปเดต
 */

/**
 * Loan Request form data interface
 * @typedef {Object} LoanRequestFormData
 * @property {string} equipmentId
 * @property {string} borrowDate
 * @property {string} expectedReturnDate
 * @property {string} purpose
 * @property {string} notes
 */

/**
 * Loan Request search/filter parameters
 * @typedef {Object} LoanRequestFilters
 * @property {string} search - Search term
 * @property {string} status - Status filter
 * @property {string} equipmentCategory - Equipment category filter
 * @property {string} userId - User filter (for admin)
 * @property {string} sortBy - Sort field
 * @property {string} sortOrder - Sort order (asc/desc)
 * @property {number} page - Page number for pagination
 * @property {number} limit - Items per page
 */

/**
 * Loan Request validation rules
 */
export const LOAN_REQUEST_VALIDATION = {
  equipmentId: {
    required: true
  },
  borrowDate: {
    required: true,
    minDate: 'today'
  },
  expectedReturnDate: {
    required: true,
    minDate: 'borrowDate'
  },
  purpose: {
    required: true,
    minLength: 10,
    maxLength: 500
  },
  notes: {
    required: false,
    maxLength: 500
  }
};

/**
 * Default loan request form values
 */
export const DEFAULT_LOAN_REQUEST_FORM = {
  equipmentId: '',
  borrowDate: '',
  expectedReturnDate: '',
  purpose: '',
  notes: ''
};

/**
 * Loan Request pagination defaults
 */
export const LOAN_REQUEST_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50
};

/**
 * Maximum loan duration in days
 */
export const MAX_LOAN_DURATION_DAYS = 30;

/**
 * Default loan duration in days
 */
export const DEFAULT_LOAN_DURATION_DAYS = 7;