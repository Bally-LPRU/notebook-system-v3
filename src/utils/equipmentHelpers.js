/**
 * Equipment Helper Utilities
 * 
 * A collection of pure utility functions for working with equipment data.
 * These functions handle common data transformations, formatting, and
 * extraction operations used throughout the equipment management system.
 * 
 * **Key Features:**
 * - Handles both object and string category formats
 * - Safe null/undefined handling with default values
 * - Consistent formatting for dates, prices, and locations
 * - Pure functions with no side effects
 * 
 * @module equipmentHelpers
 */

/**
 * Extract category name from category data.
 * 
 * Handles both object format (with id/name properties) and string format.
 * This utility is essential for displaying category information consistently
 * across the application, regardless of how the category data is stored.
 * 
 * **Usage:**
 * ```js
 * getCategoryName({ id: '123', name: 'Electronics' }) // 'Electronics'
 * getCategoryName('Electronics') // 'Electronics'
 * getCategoryName(null) // '-'
 * ```
 * 
 * @function
 * @param {Object|string|null|undefined} category - Category data in object or string format
 * @param {string} [category.name] - Category name (when object format)
 * @returns {string} Category name or '-' if not available
 */
export const getCategoryName = (category) => {
  if (!category) return '-';
  return typeof category === 'object' ? category?.name || '-' : category;
};

/**
 * Extract category ID from category data.
 * 
 * Handles both object format (with id property) and string format.
 * Useful for filtering, searching, and database queries where the ID is needed.
 * 
 * **Usage:**
 * ```js
 * getCategoryId({ id: '123', name: 'Electronics' }) // '123'
 * getCategoryId('electronics-id') // 'electronics-id'
 * getCategoryId(null) // null
 * ```
 * 
 * @function
 * @param {Object|string|null|undefined} category - Category data in object or string format
 * @param {string} [category.id] - Category ID (when object format)
 * @returns {string|null} Category ID or null if not available
 */
export const getCategoryId = (category) => {
  if (!category) return null;
  return typeof category === 'object' ? category?.id : category;
};

/**
 * Safely convert any value to a string for rendering in React.
 * 
 * This utility prevents "Objects are not valid as a React child" errors
 * by ensuring the value is always a primitive that can be rendered.
 * 
 * **Usage:**
 * ```js
 * safeString({ name: 'Test' }) // '[object Object]' or custom handling
 * safeString('Hello') // 'Hello'
 * safeString(123) // '123'
 * safeString(null) // '-'
 * safeString(undefined) // '-'
 * ```
 * 
 * @function
 * @param {*} value - Any value to convert to string
 * @param {string} [defaultValue='-'] - Default value if null/undefined
 * @returns {string} Safe string for rendering
 */
export const safeString = (value, defaultValue = '-') => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    // Handle common object patterns
    if (value.name) return value.name;
    if (value.label) return value.label;
    if (value.title) return value.title;
    if (value.id) return value.id;
    // Fallback - don't render objects directly
    return defaultValue;
  }
  return defaultValue;
};

/**
 * Safely convert a date value to Date object.
 * 
 * Handles various date formats including Firestore Timestamps,
 * Date objects, strings, and numbers.
 * 
 * @function
 * @param {*} value - Date value in various formats
 * @returns {Date|null} Date object or null if invalid
 */
export const safeDate = (value) => {
  if (!value) return null;
  
  try {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    if (typeof value.toDate === 'function') {
      return value.toDate();
    }
    if (typeof value === 'object' && typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000);
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * ฟอร์แมตหมายเลขอุปกรณ์
 * @param {Object} equipment - ข้อมูลอุปกรณ์
 * @returns {string} หมายเลขอุปกรณ์
 */
export const getEquipmentNumber = (equipment) => {
  return equipment?.equipmentNumber || equipment?.serialNumber || '-';
};

/**
 * ฟอร์แมตชื่อเต็มของอุปกรณ์
 * @param {Object} equipment - ข้อมูลอุปกรณ์
 * @returns {string} ชื่อเต็ม (ชื่อ ยี่ห้อ รุ่น)
 */
export const getEquipmentFullName = (equipment) => {
  const parts = [
    equipment?.name,
    equipment?.brand,
    equipment?.model
  ].filter(Boolean);
  
  return parts.join(' ') || '-';
};

/**
 * ฟอร์แมตสถานที่
 * @param {Object} location - ข้อมูลสถานที่
 * @returns {string} สถานที่แบบเต็ม
 */
export const formatLocation = (location) => {
  if (!location) return '-';
  
  if (typeof location === 'string') return location;
  
  const parts = [
    location.building,
    location.floor && `ชั้น ${location.floor}`,
    location.room && `ห้อง ${location.room}`
  ].filter(Boolean);
  
  return parts.join(' ') || '-';
};

/**
 * ตรวจสอบว่าอุปกรณ์มีรูปภาพหรือไม่
 * @param {Object} equipment - ข้อมูลอุปกรณ์
 * @returns {boolean}
 */
export const hasEquipmentImage = (equipment) => {
  return !!(
    equipment?.imageURL || 
    (equipment?.images && equipment.images.length > 0)
  );
};

/**
 * ดึง URL รูปภาพแรกของอุปกรณ์
 * @param {Object} equipment - ข้อมูลอุปกรณ์
 * @returns {string|null} URL รูปภาพ
 */
export const getEquipmentImageUrl = (equipment) => {
  if (equipment?.imageURL) return equipment.imageURL;
  if (equipment?.images && equipment.images.length > 0) {
    return equipment.images[0].url || equipment.images[0];
  }
  return null;
};

/**
 * ฟอร์แมตวันที่ - รองรับหลายรูปแบบอย่างปลอดภัย
 * @param {Date|Object|string|number} date - วันที่ (Date object, Firestore Timestamp, string, หรือ number)
 * @param {Object} options - ตัวเลือกการแสดงผล
 * @param {boolean} options.short - ใช้รูปแบบสั้น (default: false)
 * @returns {string} วันที่ในรูปแบบไทย หรือ '-' ถ้าไม่สามารถแปลงได้
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '-';
  
  try {
    let dateObj;
    
    // Handle different date formats
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date.toDate === 'function') {
      // Firestore Timestamp with toDate method
      dateObj = date.toDate();
    } else if (typeof date === 'object' && date !== null && typeof date.seconds === 'number') {
      // Firestore Timestamp object { seconds, nanoseconds }
      dateObj = new Date(date.seconds * 1000);
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      // Unknown format
      return '-';
    }
    
    // Validate the date
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    const formatOptions = options.short 
      ? { year: 'numeric', month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'long', day: 'numeric' };
    
    return dateObj.toLocaleDateString('th-TH', formatOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * ฟอร์แมตวันที่แบบสั้น
 * @param {Date|Object|string|number} date - วันที่
 * @returns {string} วันที่ในรูปแบบสั้น
 */
export const formatDateShort = (date) => formatDate(date, { short: true });

/**
 * ฟอร์แมตราคา
 * @param {number} price - ราคา
 * @returns {string} ราคาในรูปแบบไทย
 */
export const formatPrice = (price) => {
  if (!price || price === 0) return '-';
  return `${price.toLocaleString('th-TH')} บาท`;
};

/**
 * คำนวณอายุอุปกรณ์ (ปี)
 * @param {Date|Object} purchaseDate - วันที่ซื้อ
 * @returns {number} อายุเป็นปี
 */
export const calculateEquipmentAge = (purchaseDate) => {
  if (!purchaseDate) return 0;
  
  try {
    const dateObj = purchaseDate.toDate ? purchaseDate.toDate() : new Date(purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now - dateObj);
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears;
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
};

/**
 * ตรวจสอบว่าอุปกรณ์ใหม่หรือไม่ (ภายใน 7 วัน)
 * @param {Date|Object} createdAt - วันที่สร้าง
 * @returns {boolean}
 */
export const isNewEquipment = (createdAt) => {
  if (!createdAt) return false;
  
  try {
    const dateObj = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - dateObj);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  } catch (error) {
    console.error('Error checking if new:', error);
    return false;
  }
};
