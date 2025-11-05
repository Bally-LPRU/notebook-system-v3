/**
 * Equipment Management Utilities
 * Helper functions and constants for the equipment management system
 */

import { 
  EQUIPMENT_MANAGEMENT_STATUS,
  EQUIPMENT_MANAGEMENT_STATUS_LABELS,
  EQUIPMENT_MANAGEMENT_STATUS_COLORS,
  EQUIPMENT_ACTIONS
} from '../types/equipmentManagement';

/**
 * Format equipment number with standard format
 * @param {string} equipmentNumber - Raw equipment number
 * @returns {string} Formatted equipment number
 */
export function formatEquipmentNumber(equipmentNumber) {
  if (!equipmentNumber) return '';
  return equipmentNumber.trim().toUpperCase();
}

/**
 * Generate QR code data for equipment
 * @param {Object} equipment - Equipment data
 * @returns {string} QR code data string
 */
export function generateQRCodeData(equipment) {
  return JSON.stringify({
    id: equipment.id,
    equipmentNumber: equipment.equipmentNumber,
    name: equipment.name,
    category: equipment.category?.name,
    status: equipment.status,
    url: `${window.location.origin}/equipment/${equipment.id}`
  });
}

/**
 * Get status badge configuration
 * @param {string} status - Equipment status
 * @returns {Object} Badge configuration
 */
export function getStatusBadge(status) {
  return {
    label: EQUIPMENT_MANAGEMENT_STATUS_LABELS[status] || status,
    color: EQUIPMENT_MANAGEMENT_STATUS_COLORS[status] || 'gray',
    status: status
  };
}

/**
 * Validate equipment number format
 * @param {string} equipmentNumber - Equipment number to validate
 * @returns {Object} Validation result
 */
export function validateEquipmentNumber(equipmentNumber) {
  if (!equipmentNumber || equipmentNumber.trim().length === 0) {
    return {
      isValid: false,
      error: 'หมายเลขครุภัณฑ์เป็นข้อมูลที่จำเป็น'
    };
  }

  const formatted = formatEquipmentNumber(equipmentNumber);
  
  // Check format (alphanumeric with hyphens allowed)
  const formatRegex = /^[A-Z0-9-]+$/;
  if (!formatRegex.test(formatted)) {
    return {
      isValid: false,
      error: 'หมายเลขครุภัณฑ์ต้องประกอบด้วยตัวอักษรภาษาอังกฤษ ตัวเลข และเครื่องหมายขีดกลางเท่านั้น'
    };
  }

  // Check length
  if (formatted.length < 1 || formatted.length > 50) {
    return {
      isValid: false,
      error: 'หมายเลขครุภัณฑ์ต้องมีความยาว 1-50 ตัวอักษร'
    };
  }

  return {
    isValid: true,
    formatted: formatted
  };
}

/**
 * Calculate equipment age in years
 * @param {Date} purchaseDate - Purchase date
 * @returns {number} Age in years
 */
export function calculateEquipmentAge(purchaseDate) {
  if (!purchaseDate) return 0;
  
  const now = new Date();
  const purchase = new Date(purchaseDate);
  const diffTime = now - purchase;
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  
  return Math.floor(Math.abs(diffYears));
}

/**
 * Check if equipment is under warranty
 * @param {Date} warrantyExpiry - Warranty expiry date
 * @returns {boolean} True if under warranty
 */
export function isUnderWarranty(warrantyExpiry) {
  if (!warrantyExpiry) return false;
  
  const now = new Date();
  const expiry = new Date(warrantyExpiry);
  
  return expiry > now;
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (!amount || amount === 0) return '0 บาท';
  
  const formatted = new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
  
  return `${formatted} บาท`;
}

/**
 * Format location for display
 * @param {Object} location - Location object
 * @returns {string} Formatted location string
 */
export function formatLocation(location) {
  if (!location) return '';
  
  const parts = [];
  if (location.building) parts.push(`อาคาร ${location.building}`);
  if (location.floor) parts.push(`ชั้น ${location.floor}`);
  if (location.room) parts.push(`ห้อง ${location.room}`);
  if (location.description) parts.push(location.description);
  
  return parts.join(', ');
}

/**
 * Get action label in Thai
 * @param {string} action - Action type
 * @returns {string} Thai label
 */
export function getActionLabel(action) {
  const labels = {
    [EQUIPMENT_ACTIONS.CREATED]: 'สร้างข้อมูล',
    [EQUIPMENT_ACTIONS.UPDATED]: 'แก้ไขข้อมูล',
    [EQUIPMENT_ACTIONS.DELETED]: 'ลบข้อมูล',
    [EQUIPMENT_ACTIONS.STATUS_CHANGED]: 'เปลี่ยนสถานะ',
    [EQUIPMENT_ACTIONS.IMAGE_ADDED]: 'เพิ่มรูปภาพ',
    [EQUIPMENT_ACTIONS.IMAGE_REMOVED]: 'ลบรูปภาพ',
    [EQUIPMENT_ACTIONS.LOCATION_CHANGED]: 'เปลี่ยนสถานที่',
    [EQUIPMENT_ACTIONS.RESPONSIBLE_PERSON_CHANGED]: 'เปลี่ยนผู้รับผิดชอบ'
  };
  
  return labels[action] || action;
}

/**
 * Generate search suggestions
 * @param {string} query - Search query
 * @param {Array} equipment - Equipment list
 * @returns {Array} Search suggestions
 */
export function generateSearchSuggestions(query, equipment) {
  if (!query || query.length < 2) return [];
  
  const queryLower = query.toLowerCase();
  const suggestions = new Set();
  
  equipment.forEach(item => {
    // Add equipment number suggestions
    if (item.equipmentNumber.toLowerCase().includes(queryLower)) {
      suggestions.add(item.equipmentNumber);
    }
    
    // Add name suggestions
    if (item.name.toLowerCase().includes(queryLower)) {
      suggestions.add(item.name);
    }
    
    // Add brand suggestions
    if (item.brand && item.brand.toLowerCase().includes(queryLower)) {
      suggestions.add(item.brand);
    }
    
    // Add model suggestions
    if (item.model && item.model.toLowerCase().includes(queryLower)) {
      suggestions.add(item.model);
    }
  });
  
  return Array.from(suggestions).slice(0, 10);
}

/**
 * Export equipment data to CSV format
 * @param {Array} equipment - Equipment list
 * @param {Array} fields - Fields to include
 * @returns {string} CSV data
 */
export function exportToCSV(equipment, fields = []) {
  if (!equipment || equipment.length === 0) return '';
  
  const defaultFields = [
    'equipmentNumber',
    'name',
    'category.name',
    'brand',
    'model',
    'status',
    'location',
    'purchasePrice',
    'purchaseDate'
  ];
  
  const exportFields = fields.length > 0 ? fields : defaultFields;
  
  // Create header
  const headers = exportFields.map(field => {
    const fieldLabels = {
      'equipmentNumber': 'หมายเลขครุภัณฑ์',
      'name': 'ชื่ออุปกรณ์',
      'category.name': 'ประเภท',
      'brand': 'ยี่ห้อ',
      'model': 'รุ่น',
      'status': 'สถานะ',
      'location': 'สถานที่',
      'purchasePrice': 'ราคาซื้อ',
      'purchaseDate': 'วันที่ซื้อ'
    };
    return fieldLabels[field] || field;
  });
  
  // Create rows
  const rows = equipment.map(item => {
    return exportFields.map(field => {
      let value = '';
      
      if (field.includes('.')) {
        const parts = field.split('.');
        value = parts.reduce((obj, key) => obj?.[key], item) || '';
      } else {
        value = item[field] || '';
      }
      
      // Format specific fields
      if (field === 'status') {
        value = EQUIPMENT_MANAGEMENT_STATUS_LABELS[value] || value;
      } else if (field === 'location' && typeof value === 'object') {
        value = formatLocation(value);
      } else if (field === 'purchasePrice') {
        value = formatCurrency(value);
      } else if (field === 'purchaseDate' && value) {
        value = new Date(value).toLocaleDateString('th-TH');
      }
      
      // Escape CSV special characters
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
  });
  
  // Combine header and rows
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
  
  return csvContent;
}

/**
 * Download file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}