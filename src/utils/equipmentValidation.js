import { 
  EQUIPMENT_VALIDATION, 
  EQUIPMENT_CATEGORIES, 
  EQUIPMENT_STATUS 
} from '../types/equipment';

/**
 * Validate equipment form data
 * @param {Object} formData - Equipment form data
 * @returns {Object} Validation result with errors
 */
export const validateEquipmentForm = (formData) => {
  const errors = {};

  // Validate name
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'กรุณากรอกชื่ออุปกรณ์';
  } else if (formData.name.trim().length < EQUIPMENT_VALIDATION.name.minLength) {
    errors.name = `ชื่ออุปกรณ์ต้องมีอย่างน้อย ${EQUIPMENT_VALIDATION.name.minLength} ตัวอักษร`;
  } else if (formData.name.trim().length > EQUIPMENT_VALIDATION.name.maxLength) {
    errors.name = `ชื่ออุปกรณ์ต้องไม่เกิน ${EQUIPMENT_VALIDATION.name.maxLength} ตัวอักษร`;
  }

  // Validate category
  if (!formData.category) {
    errors.category = 'กรุณาเลือกประเภทอุปกรณ์';
  } else if (!Object.values(EQUIPMENT_CATEGORIES).includes(formData.category)) {
    errors.category = 'ประเภทอุปกรณ์ไม่ถูกต้อง';
  }

  // Validate brand
  if (!formData.brand || !formData.brand.trim()) {
    errors.brand = 'กรุณากรอกยี่ห้อ';
  } else if (formData.brand.trim().length < EQUIPMENT_VALIDATION.brand.minLength) {
    errors.brand = `ยี่ห้อต้องมีอย่างน้อย ${EQUIPMENT_VALIDATION.brand.minLength} ตัวอักษร`;
  } else if (formData.brand.trim().length > EQUIPMENT_VALIDATION.brand.maxLength) {
    errors.brand = `ยี่ห้อต้องไม่เกิน ${EQUIPMENT_VALIDATION.brand.maxLength} ตัวอักษร`;
  }

  // Validate model
  if (!formData.model || !formData.model.trim()) {
    errors.model = 'กรุณากรอกรุ่น';
  } else if (formData.model.trim().length < EQUIPMENT_VALIDATION.model.minLength) {
    errors.model = `รุ่นต้องมีอย่างน้อย ${EQUIPMENT_VALIDATION.model.minLength} ตัวอักษร`;
  } else if (formData.model.trim().length > EQUIPMENT_VALIDATION.model.maxLength) {
    errors.model = `รุ่นต้องไม่เกิน ${EQUIPMENT_VALIDATION.model.maxLength} ตัวอักษร`;
  }

  // Validate serial number
  if (!formData.serialNumber || !formData.serialNumber.trim()) {
    errors.serialNumber = 'กรุณากรอกหมายเลขซีเรียล';
  } else if (formData.serialNumber.trim().length < EQUIPMENT_VALIDATION.serialNumber.minLength) {
    errors.serialNumber = `หมายเลขซีเรียลต้องมีอย่างน้อย ${EQUIPMENT_VALIDATION.serialNumber.minLength} ตัวอักษร`;
  } else if (formData.serialNumber.trim().length > EQUIPMENT_VALIDATION.serialNumber.maxLength) {
    errors.serialNumber = `หมายเลขซีเรียลต้องไม่เกิน ${EQUIPMENT_VALIDATION.serialNumber.maxLength} ตัวอักษร`;
  }

  // Validate description (optional)
  if (formData.description && formData.description.trim().length > EQUIPMENT_VALIDATION.description.maxLength) {
    errors.description = `รายละเอียดต้องไม่เกิน ${EQUIPMENT_VALIDATION.description.maxLength} ตัวอักษร`;
  }

  // Validate status
  if (!formData.status) {
    errors.status = 'กรุณาเลือกสถานะอุปกรณ์';
  } else if (!Object.values(EQUIPMENT_STATUS).includes(formData.status)) {
    errors.status = 'สถานะอุปกรณ์ไม่ถูกต้อง';
  }

  // Validate location
  if (!formData.location || !formData.location.trim()) {
    errors.location = 'กรุณากรอกสถานที่เก็บ';
  } else if (formData.location.trim().length < EQUIPMENT_VALIDATION.location.minLength) {
    errors.location = `สถานที่เก็บต้องมีอย่างน้อย ${EQUIPMENT_VALIDATION.location.minLength} ตัวอักษร`;
  } else if (formData.location.trim().length > EQUIPMENT_VALIDATION.location.maxLength) {
    errors.location = `สถานที่เก็บต้องไม่เกิน ${EQUIPMENT_VALIDATION.location.maxLength} ตัวอักษร`;
  }

  // Validate dates
  if (formData.purchaseDate) {
    const purchaseDate = new Date(formData.purchaseDate);
    const today = new Date();
    if (purchaseDate > today) {
      errors.purchaseDate = 'วันที่ซื้อไม่สามารถเป็นวันในอนาคตได้';
    }
  }

  if (formData.warrantyExpiry && formData.purchaseDate) {
    const purchaseDate = new Date(formData.purchaseDate);
    const warrantyExpiry = new Date(formData.warrantyExpiry);
    if (warrantyExpiry < purchaseDate) {
      errors.warrantyExpiry = 'วันหมดประกันต้องมาหลังวันที่ซื้อ';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate image file
 * @param {File} file - Image file to validate
 * @returns {Object} Validation result
 */
export const validateImageFile = (file) => {
  const errors = [];

  if (!file) {
    return { isValid: true, errors: [] };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP)');
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push('ขนาดไฟล์ต้องไม่เกิน 5MB');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize equipment form data
 * @param {Object} formData - Raw form data
 * @returns {Object} Sanitized form data
 */
export const sanitizeEquipmentForm = (formData) => {
  return {
    name: formData.name?.trim() || '',
    category: formData.category || '',
    brand: formData.brand?.trim() || '',
    model: formData.model?.trim() || '',
    serialNumber: formData.serialNumber?.trim() || '',
    description: formData.description?.trim() || '',
    status: formData.status || EQUIPMENT_STATUS.AVAILABLE,
    location: formData.location?.trim() || '',
    purchaseDate: formData.purchaseDate || '',
    warrantyExpiry: formData.warrantyExpiry || ''
  };
};

/**
 * Format equipment data for display
 * @param {Object} equipment - Equipment data
 * @returns {Object} Formatted equipment data
 */
export const formatEquipmentForDisplay = (equipment) => {
  return {
    ...equipment,
    purchaseDate: equipment.purchaseDate ? 
      new Date(equipment.purchaseDate.seconds * 1000).toLocaleDateString('th-TH') : 
      null,
    warrantyExpiry: equipment.warrantyExpiry ? 
      new Date(equipment.warrantyExpiry.seconds * 1000).toLocaleDateString('th-TH') : 
      null,
    createdAt: equipment.createdAt ? 
      new Date(equipment.createdAt.seconds * 1000).toLocaleDateString('th-TH') : 
      null,
    updatedAt: equipment.updatedAt ? 
      new Date(equipment.updatedAt.seconds * 1000).toLocaleDateString('th-TH') : 
      null
  };
};

/**
 * Check if equipment can be deleted
 * @param {Object} equipment - Equipment data
 * @returns {Object} Check result
 */
export const canDeleteEquipment = (equipment) => {
  if (equipment.status === EQUIPMENT_STATUS.BORROWED) {
    return {
      canDelete: false,
      reason: 'ไม่สามารถลบอุปกรณ์ที่กำลังถูกยืมได้'
    };
  }

  return {
    canDelete: true,
    reason: null
  };
};

/**
 * Check if equipment can be borrowed
 * @param {Object} equipment - Equipment data
 * @returns {Object} Check result
 */
export const canBorrowEquipment = (equipment) => {
  if (equipment.status !== EQUIPMENT_STATUS.AVAILABLE) {
    return {
      canBorrow: false,
      reason: 'อุปกรณ์ไม่พร้อมใช้งาน'
    };
  }

  return {
    canBorrow: true,
    reason: null
  };
};

/**
 * Get equipment status color class
 * @param {string} status - Equipment status
 * @returns {string} CSS color class
 */
export const getEquipmentStatusColor = (status) => {
  switch (status) {
    case EQUIPMENT_STATUS.AVAILABLE:
      return 'text-green-600 bg-green-100';
    case EQUIPMENT_STATUS.BORROWED:
      return 'text-yellow-600 bg-yellow-100';
    case EQUIPMENT_STATUS.MAINTENANCE:
      return 'text-orange-600 bg-orange-100';
    case EQUIPMENT_STATUS.RETIRED:
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Generate equipment search keywords for better search
 * @param {Object} equipment - Equipment data
 * @returns {Array} Search keywords
 */
export const generateEquipmentSearchKeywords = (equipment) => {
  const keywords = [];
  
  if (equipment.name) keywords.push(equipment.name.toLowerCase());
  if (equipment.brand) keywords.push(equipment.brand.toLowerCase());
  if (equipment.model) keywords.push(equipment.model.toLowerCase());
  if (equipment.serialNumber) keywords.push(equipment.serialNumber.toLowerCase());
  if (equipment.category) keywords.push(equipment.category.toLowerCase());
  if (equipment.location) keywords.push(equipment.location.toLowerCase());
  
  // Add partial matches
  keywords.forEach(keyword => {
    if (keyword.length > 3) {
      for (let i = 0; i < keyword.length - 2; i++) {
        keywords.push(keyword.substring(i, i + 3));
      }
    }
  });
  
  return [...new Set(keywords)]; // Remove duplicates
};