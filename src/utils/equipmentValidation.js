import { 
  EQUIPMENT_VALIDATION, 
  EQUIPMENT_STATUS 
} from '../types/equipment';

/**
 * Validate equipment form data
 * @param {Object} formData - Equipment form data
 * @returns {Object} Validation result with errors
 */
export const validateEquipmentForm = (formData) => {
  const errors = {};

  // Validate equipment number
  if (!formData.equipmentNumber || !formData.equipmentNumber.trim()) {
    errors.equipmentNumber = 'กรุณากรอกหมายเลขครุภัณฑ์';
  } else if (formData.equipmentNumber.trim().length < 1) {
    errors.equipmentNumber = 'หมายเลขครุภัณฑ์ต้องมีอย่างน้อย 1 ตัวอักษร';
  } else if (formData.equipmentNumber.trim().length > 50) {
    errors.equipmentNumber = 'หมายเลขครุภัณฑ์ต้องไม่เกิน 50 ตัวอักษร';
  }

  // Validate name
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'กรุณากรอกชื่ออุปกรณ์';
  } else if (formData.name.trim().length < EQUIPMENT_VALIDATION.name.minLength) {
    errors.name = `ชื่ออุปกรณ์ต้องมีอย่างน้อย ${EQUIPMENT_VALIDATION.name.minLength} ตัวอักษร`;
  } else if (formData.name.trim().length > EQUIPMENT_VALIDATION.name.maxLength) {
    errors.name = `ชื่ออุปกรณ์ต้องไม่เกิน ${EQUIPMENT_VALIDATION.name.maxLength} ตัวอักษร`;
  }

  // Validate category (now an object)
  if (!formData.category || !formData.category.id) {
    errors.category = 'กรุณาเลือกประเภทอุปกรณ์';
  }

  // Validate brand (optional for management system)
  if (formData.brand && formData.brand.trim().length > 50) {
    errors.brand = 'ยี่ห้อต้องไม่เกิน 50 ตัวอักษร';
  }

  // Validate model (optional for management system)
  if (formData.model && formData.model.trim().length > 50) {
    errors.model = 'รุ่นต้องไม่เกิน 50 ตัวอักษร';
  }

  // Validate description (optional)
  if (formData.description && formData.description.trim().length > 1000) {
    errors.description = 'รายละเอียดต้องไม่เกิน 1000 ตัวอักษร';
  }

  // Validate status
  if (!formData.status) {
    errors.status = 'กรุณาเลือกสถานะอุปกรณ์';
  } else if (!Object.values(EQUIPMENT_STATUS).includes(formData.status)) {
    errors.status = 'สถานะอุปกรณ์ไม่ถูกต้อง';
  }

  // Validate location (now an object)
  if (!formData.location || typeof formData.location !== 'object') {
    errors.location = 'กรุณากรอกสถานที่เก็บ';
  } else if (!formData.location.building && !formData.location.floor && !formData.location.room) {
    errors.location = 'กรุณากรอกสถานที่เก็บอย่างน้อย 1 ช่อง';
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

  // Validate purchase price
  if (formData.purchasePrice && formData.purchasePrice < 0) {
    errors.purchasePrice = 'ราคาซื้อต้องไม่ติดลบ';
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
    equipmentNumber: formData.equipmentNumber?.trim().toUpperCase() || '',
    name: formData.name?.trim() || '',
    category: formData.category || null,
    brand: formData.brand?.trim() || '',
    model: formData.model?.trim() || '',
    description: formData.description?.trim() || '',
    specifications: formData.specifications || {},
    status: formData.status || EQUIPMENT_STATUS.AVAILABLE,
    location: formData.location || { building: '', floor: '', room: '', description: '' },
    purchaseDate: formData.purchaseDate || '',
    purchasePrice: formData.purchasePrice || 0,
    vendor: formData.vendor?.trim() || '',
    warrantyExpiry: formData.warrantyExpiry || '',
    responsiblePerson: formData.responsiblePerson || null,
    tags: formData.tags || [],
    notes: formData.notes?.trim() || ''
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