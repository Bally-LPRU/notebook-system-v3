/**
 * Equipment Management System Type Definitions
 * Based on design document specifications for the equipment management system
 */

// Equipment status constants for management system
export const EQUIPMENT_MANAGEMENT_STATUS = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired',
  LOST: 'lost'
};

// Equipment status labels in Thai
export const EQUIPMENT_MANAGEMENT_STATUS_LABELS = {
  [EQUIPMENT_MANAGEMENT_STATUS.ACTIVE]: 'ใช้งานได้',
  [EQUIPMENT_MANAGEMENT_STATUS.MAINTENANCE]: 'ซ่อมบำรุง',
  [EQUIPMENT_MANAGEMENT_STATUS.RETIRED]: 'เสื่อมสภาพ',
  [EQUIPMENT_MANAGEMENT_STATUS.LOST]: 'สูญหาย'
};

// Equipment status colors for UI
export const EQUIPMENT_MANAGEMENT_STATUS_COLORS = {
  [EQUIPMENT_MANAGEMENT_STATUS.ACTIVE]: 'green',
  [EQUIPMENT_MANAGEMENT_STATUS.MAINTENANCE]: 'orange',
  [EQUIPMENT_MANAGEMENT_STATUS.RETIRED]: 'red',
  [EQUIPMENT_MANAGEMENT_STATUS.LOST]: 'gray'
};

/**
 * Equipment Management interface/type definition
 * @typedef {Object} EquipmentManagement
 * @property {string} id - Auto-generated ID
 * @property {string} equipmentNumber - หมายเลขครุภัณฑ์ (unique, required)
 * @property {string} name - ชื่ออุปกรณ์ (required)
 * @property {Object} category - ประเภทอุปกรณ์
 * @property {string} category.id - Category ID
 * @property {string} category.name - Category name
 * @property {string} category.icon - Category icon
 * @property {string} brand - ยี่ห้อ
 * @property {string} model - รุ่น
 * @property {string} description - รายละเอียด
 * @property {Object} specifications - ข้อมูลจำเพาะทางเทคนิค
 * @property {string} status - สถานะ (from EQUIPMENT_MANAGEMENT_STATUS)
 * @property {Object} location - สถานที่ตั้ง
 * @property {string} location.building - อาคาร
 * @property {string} location.floor - ชั้น
 * @property {string} location.room - ห้อง
 * @property {string} location.description - รายละเอียดสถานที่
 * @property {Date} purchaseDate - วันที่ซื้อ
 * @property {number} purchasePrice - ราคาซื้อ
 * @property {string} vendor - ผู้จำหน่าย
 * @property {Date} warrantyExpiry - วันหมดประกัน
 * @property {Object} responsiblePerson - ผู้รับผิดชอบ
 * @property {string} responsiblePerson.uid - User ID
 * @property {string} responsiblePerson.name - ชื่อ
 * @property {string} responsiblePerson.email - อีเมล
 * @property {string} responsiblePerson.department - แผนก
 * @property {Array<Object>} images - รูปภาพ
 * @property {Object} qrCode - QR Code
 * @property {string} qrCode.url - QR Code URL
 * @property {Date} qrCode.generatedAt - วันที่สร้าง QR Code
 * @property {Array<string>} tags - แท็กสำหรับการค้นหา
 * @property {string} notes - หมายเหตุเพิ่มเติม
 * @property {Date} createdAt - วันที่สร้าง
 * @property {string} createdBy - UID ของผู้สร้าง
 * @property {Date} updatedAt - วันที่อัปเดต
 * @property {string} updatedBy - UID ของผู้แก้ไขล่าสุด
 * @property {number} version - เวอร์ชันของข้อมูล
 * @property {Array<string>} searchKeywords - คำสำหรับการค้นหา
 * @property {boolean} isActive - สำหรับ soft delete
 * @property {number} viewCount - จำนวนครั้งที่ดู
 * @property {Date} lastViewed - ครั้งล่าสุดที่ดู
 */

/**
 * Equipment Image interface
 * @typedef {Object} EquipmentImage
 * @property {string} id - Image ID
 * @property {string} url - Original image URL
 * @property {string} thumbnailUrl - Thumbnail URL
 * @property {string} mediumUrl - Medium size URL
 * @property {string} filename - Original filename
 * @property {number} size - File size in bytes
 * @property {Date} uploadedAt - Upload timestamp
 * @property {string} uploadedBy - Uploader UID
 */

/**
 * Equipment Category interface
 * @typedef {Object} EquipmentCategory
 * @property {string} id - Auto-generated ID
 * @property {string} name - ชื่อหมวดหมู่
 * @property {string} nameEn - ชื่อภาษาอังกฤษ
 * @property {string} description - คำอธิบาย
 * @property {string} icon - ไอคอน (icon name หรือ URL)
 * @property {string} color - สีประจำหมวดหมู่
 * @property {string} parentId - หมวดหมู่แม่ (nullable)
 * @property {number} level - ระดับในลำดับชั้น
 * @property {string} path - เส้นทางแบบ "parent/child/grandchild"
 * @property {Array<string>} requiredFields - ฟิลด์ที่จำเป็นสำหรับหมวดหมู่นี้
 * @property {Array<Object>} customFields - ฟิลด์เพิ่มเติมสำหรับหมวดหมู่
 * @property {number} equipmentCount - จำนวนอุปกรณ์ในหมวดหมู่
 * @property {boolean} isActive - สถานะการใช้งาน
 * @property {number} sortOrder - ลำดับการแสดง
 * @property {Date} createdAt - วันที่สร้าง
 * @property {string} createdBy - ผู้สร้าง
 * @property {Date} updatedAt - วันที่อัปเดต
 * @property {string} updatedBy - ผู้แก้ไข
 */

/**
 * Equipment History interface
 * @typedef {Object} EquipmentHistory
 * @property {string} id - Auto-generated ID
 * @property {string} equipmentId - Reference to Equipment
 * @property {string} action - ประเภทการเปลี่ยนแปลง
 * @property {Array<Object>} changes - รายการการเปลี่ยนแปลง
 * @property {string} reason - เหตุผลการเปลี่ยนแปลง
 * @property {string} notes - หมายเหตุเพิ่มเติม
 * @property {string} userId - ผู้ทำการเปลี่ยนแปลง
 * @property {string} userName - ชื่อผู้ใช้
 * @property {string} userEmail - อีเมลผู้ใช้
 * @property {Date} timestamp - เวลาที่เปลี่ยนแปลง
 * @property {string} ipAddress - IP Address
 * @property {string} userAgent - Browser/Device info
 * @property {string} sessionId - Session ID
 */

/**
 * Equipment Template interface
 * @typedef {Object} EquipmentTemplate
 * @property {string} id - Auto-generated ID
 * @property {string} name - ชื่อ template
 * @property {string} description - คำอธิบาย
 * @property {string} categoryId - หมวดหมู่ที่เกี่ยวข้อง
 * @property {Object} defaultValues - ค่าเริ่มต้นสำหรับฟิลด์ต่างๆ
 * @property {Array<string>} requiredFields - ฟิลด์ที่จำเป็น
 * @property {Array<string>} fieldOrder - ลำดับการแสดงฟิลด์
 * @property {number} usageCount - จำนวนครั้งที่ใช้
 * @property {boolean} isPublic - ใช้ได้กับทุกคนหรือไม่
 * @property {Date} createdAt - วันที่สร้าง
 * @property {string} createdBy - ผู้สร้าง
 * @property {Date} updatedAt - วันที่อัปเดต
 * @property {string} updatedBy - ผู้แก้ไข
 */

/**
 * Equipment Form Data interface
 * @typedef {Object} EquipmentManagementFormData
 * @property {string} equipmentNumber
 * @property {string} name
 * @property {Object} category
 * @property {string} brand
 * @property {string} model
 * @property {string} description
 * @property {Object} specifications
 * @property {string} status
 * @property {Object} location
 * @property {string} purchaseDate
 * @property {number} purchasePrice
 * @property {string} vendor
 * @property {string} warrantyExpiry
 * @property {Object} responsiblePerson
 * @property {Array<File>} imageFiles
 * @property {Array<string>} tags
 * @property {string} notes
 */

/**
 * Equipment Search/Filter parameters
 * @typedef {Object} EquipmentManagementFilters
 * @property {string} search - Search term
 * @property {Array<string>} categories - Category filters
 * @property {Array<string>} statuses - Status filters
 * @property {Object} dateRange - Date range filter
 * @property {Date} dateRange.start - Start date
 * @property {Date} dateRange.end - End date
 * @property {Object} priceRange - Price range filter
 * @property {number} priceRange.min - Minimum price
 * @property {number} priceRange.max - Maximum price
 * @property {string} location - Location filter
 * @property {string} responsiblePerson - Responsible person filter
 * @property {string} sortBy - Sort field
 * @property {string} sortOrder - Sort order (asc/desc)
 * @property {number} page - Page number
 * @property {number} limit - Items per page
 */

// Equipment action types for history
export const EQUIPMENT_ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  STATUS_CHANGED: 'status_changed',
  IMAGE_ADDED: 'image_added',
  IMAGE_REMOVED: 'image_removed',
  LOCATION_CHANGED: 'location_changed',
  RESPONSIBLE_PERSON_CHANGED: 'responsible_person_changed'
};

// Equipment validation rules
export const EQUIPMENT_MANAGEMENT_VALIDATION = {
  equipmentNumber: {
    required: true,
    minLength: 1,
    maxLength: 50,
    unique: true,
    pattern: /^[A-Z0-9-]+$/
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  category: {
    required: true
  },
  brand: {
    required: false,
    maxLength: 50
  },
  model: {
    required: false,
    maxLength: 50
  },
  description: {
    required: false,
    maxLength: 1000
  },
  status: {
    required: true,
    enum: Object.values(EQUIPMENT_MANAGEMENT_STATUS)
  },
  location: {
    required: true
  },
  purchasePrice: {
    required: false,
    min: 0,
    type: 'number'
  },
  images: {
    maxCount: 10,
    maxSize: 5 * 1024 * 1024, // 5MB per image
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
};

// Default form values
export const DEFAULT_EQUIPMENT_MANAGEMENT_FORM = {
  equipmentNumber: '',
  name: '',
  category: null,
  brand: '',
  model: '',
  description: '',
  specifications: {},
  status: EQUIPMENT_MANAGEMENT_STATUS.ACTIVE,
  location: {
    building: '',
    floor: '',
    room: '',
    description: ''
  },
  purchaseDate: '',
  purchasePrice: 0,
  vendor: '',
  warrantyExpiry: '',
  responsiblePerson: null,
  imageFiles: [],
  tags: [],
  notes: ''
};

// Pagination defaults
export const EQUIPMENT_MANAGEMENT_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// Image processing configuration
export const IMAGE_CONFIG = {
  THUMBNAIL_SIZE: { width: 150, height: 150 },
  MEDIUM_SIZE: { width: 400, height: 400 },
  COMPRESSION_QUALITY: 0.8,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp']
};

// Search configuration
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SUGGESTIONS: 10,
  DEBOUNCE_DELAY: 300
};

// Export configuration
export const EXPORT_CONFIG = {
  FORMATS: {
    EXCEL: 'excel',
    PDF: 'pdf',
    CSV: 'csv'
  },
  MAX_EXPORT_ITEMS: 1000,
  INCLUDE_IMAGES: true
};