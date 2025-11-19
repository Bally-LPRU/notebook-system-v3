/**
 * Equipment Type Definitions
 * Based on design document specifications
 */

// Equipment status constants
export const EQUIPMENT_STATUS = {
  AVAILABLE: 'available',
  BORROWED: 'borrowed',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired'
};

// Equipment category constants
export const EQUIPMENT_CATEGORIES = {
  LAPTOP: 'laptop',
  DESKTOP: 'desktop',
  TABLET: 'tablet',
  MONITOR: 'monitor',
  PROJECTOR: 'projector',
  CAMERA: 'camera',
  AUDIO: 'audio',
  NETWORK: 'network',
  ACCESSORIES: 'accessories',
  OTHER: 'other'
};

// Equipment status labels in Thai
export const EQUIPMENT_STATUS_LABELS = {
  [EQUIPMENT_STATUS.AVAILABLE]: 'พร้อมใช้งาน',
  [EQUIPMENT_STATUS.BORROWED]: 'ถูกยืม',
  [EQUIPMENT_STATUS.MAINTENANCE]: 'ซ่อมบำรุง',
  [EQUIPMENT_STATUS.RETIRED]: 'เลิกใช้งาน'
};

/**
 * Equipment interface/type definition
 * @typedef {Object} Equipment
 * @property {string} id - Auto-generated ID
 * @property {string} name - ชื่ออุปกรณ์
 * @property {string} category - ประเภท (from EQUIPMENT_CATEGORIES)
 * @property {string} brand - ยี่ห้อ
 * @property {string} model - รุ่น
 * @property {string} serialNumber - หมายเลขซีเรียล (unique)
 * @property {string} description - รายละเอียด
 * @property {string|null} imageURL - URL รูปภาพ
 * @property {string} status - สถานะ (from EQUIPMENT_STATUS)
 * @property {string} location - สถานที่เก็บ
 * @property {Date|null} purchaseDate - วันที่ซื้อ
 * @property {Date|null} warrantyExpiry - วันหมดประกัน
 * @property {Date} createdAt - วันที่สร้าง
 * @property {Date} updatedAt - วันที่อัปเดต
 * @property {string} createdBy - UID ของผู้สร้าง
 */

/**
 * Equipment form data interface
 * @typedef {Object} EquipmentFormData
 * @property {string} name
 * @property {string} category
 * @property {string} brand
 * @property {string} model
 * @property {string} serialNumber
 * @property {string} description
 * @property {File|null} imageFile
 * @property {string} status
 * @property {string} location
 * @property {string} purchaseDate
 * @property {string} warrantyExpiry
 */

/**
 * Equipment search/filter parameters
 * @typedef {Object} EquipmentFilters
 * @property {string} search - Search term
 * @property {string} category - Category filter
 * @property {string} status - Status filter
 * @property {string} location - Location filter
 * @property {string} sortBy - Sort field
 * @property {string} sortOrder - Sort order (asc/desc)
 * @property {number} page - Page number for pagination
 * @property {number} limit - Items per page
 */

/**
 * Equipment validation rules
 */
export const EQUIPMENT_VALIDATION = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  category: {
    required: true,
    enum: Object.values(EQUIPMENT_CATEGORIES)
  },
  brand: {
    required: true,
    minLength: 1,
    maxLength: 50
  },
  model: {
    required: true,
    minLength: 1,
    maxLength: 50
  },
  serialNumber: {
    required: true,
    minLength: 1,
    maxLength: 50,
    unique: true
  },
  description: {
    required: false,
    maxLength: 500
  },
  status: {
    required: true,
    enum: Object.values(EQUIPMENT_STATUS)
  },
  location: {
    required: true,
    minLength: 1,
    maxLength: 100
  }
};

/**
 * Equipment pagination defaults
 */
export const EQUIPMENT_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 50
};