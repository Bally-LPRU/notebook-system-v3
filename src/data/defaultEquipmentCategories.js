/**
 * Default Equipment Categories for Management System
 * These categories will be used to seed the database
 */

export const DEFAULT_EQUIPMENT_CATEGORIES = [
  // Level 0 - Main Categories
  {
    name: 'คอมพิวเตอร์และอุปกรณ์',
    nameEn: 'Computers & Equipment',
    description: 'อุปกรณ์คอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
    icon: 'ComputerDesktopIcon',
    color: '#3B82F6',
    parentId: null,
    level: 0,
    path: 'คอมพิวเตอร์และอุปกรณ์',
    requiredFields: ['brand', 'model', 'specifications'],
    customFields: [
      {
        name: 'processor',
        type: 'text',
        required: false,
        label: 'หน่วยประมวลผล'
      },
      {
        name: 'memory',
        type: 'text',
        required: false,
        label: 'หน่วยความจำ'
      },
      {
        name: 'storage',
        type: 'text',
        required: false,
        label: 'หน่วยเก็บข้อมูล'
      }
    ],
    sortOrder: 1
  },
  {
    name: 'อุปกรณ์โสตทัศนูปกรณ์',
    nameEn: 'Audio Visual Equipment',
    description: 'อุปกรณ์เสียงและภาพ',
    icon: 'SpeakerWaveIcon',
    color: '#10B981',
    parentId: null,
    level: 0,
    path: 'อุปกรณ์โสตทัศนูปกรณ์',
    requiredFields: ['brand', 'model'],
    customFields: [
      {
        name: 'resolution',
        type: 'select',
        required: false,
        label: 'ความละเอียด',
        options: ['HD', 'Full HD', '4K', '8K']
      },
      {
        name: 'connectivity',
        type: 'text',
        required: false,
        label: 'การเชื่อมต่อ'
      }
    ],
    sortOrder: 2
  },
  {
    name: 'เครื่องใช้สำนักงาน',
    nameEn: 'Office Equipment',
    description: 'อุปกรณ์สำนักงานทั่วไป',
    icon: 'PrinterIcon',
    color: '#F59E0B',
    parentId: null,
    level: 0,
    path: 'เครื่องใช้สำนักงาน',
    requiredFields: ['brand', 'model'],
    customFields: [
      {
        name: 'paperSize',
        type: 'select',
        required: false,
        label: 'ขนาดกระดาษ',
        options: ['A4', 'A3', 'Letter', 'Legal']
      }
    ],
    sortOrder: 3
  },
  {
    name: 'เครื่องมือและอุปกรณ์',
    nameEn: 'Tools & Equipment',
    description: 'เครื่องมือและอุปกรณ์ทั่วไป',
    icon: 'WrenchScrewdriverIcon',
    color: '#8B5CF6',
    parentId: null,
    level: 0,
    path: 'เครื่องมือและอุปกรณ์',
    requiredFields: ['brand'],
    customFields: [],
    sortOrder: 4
  },
  {
    name: 'เฟอร์นิเจอร์',
    nameEn: 'Furniture',
    description: 'เฟอร์นิเจอร์และอุปกรณ์ตกแต่ง',
    icon: 'HomeIcon',
    color: '#EF4444',
    parentId: null,
    level: 0,
    path: 'เฟอร์นิเจอร์',
    requiredFields: ['material'],
    customFields: [
      {
        name: 'material',
        type: 'select',
        required: true,
        label: 'วัสดุ',
        options: ['ไม้', 'เหล็ก', 'พลาสติก', 'แก้ว', 'อื่นๆ']
      },
      {
        name: 'dimensions',
        type: 'text',
        required: false,
        label: 'ขนาด (กว้าง x ยาว x สูง)'
      }
    ],
    sortOrder: 5
  }
];

// Sub-categories for Computers & Equipment
export const COMPUTER_SUBCATEGORIES = [
  {
    name: 'คอมพิวเตอร์ตั้งโต๊ะ',
    nameEn: 'Desktop Computers',
    description: 'คอมพิวเตอร์ตั้งโต๊ะ',
    icon: 'ComputerDesktopIcon',
    color: '#3B82F6',
    parentCategory: 'คอมพิวเตอร์และอุปกรณ์',
    sortOrder: 1
  },
  {
    name: 'โน็ตบุ๊ค',
    nameEn: 'Laptops',
    description: 'คอมพิวเตอร์พกพา',
    icon: 'DevicePhoneMobileIcon',
    color: '#3B82F6',
    parentCategory: 'คอมพิวเตอร์และอุปกรณ์',
    sortOrder: 2
  },
  {
    name: 'จอมอนิเตอร์',
    nameEn: 'Monitors',
    description: 'จอแสดงผล',
    icon: 'TvIcon',
    color: '#3B82F6',
    parentCategory: 'คอมพิวเตอร์และอุปกรณ์',
    sortOrder: 3
  },
  {
    name: 'เครื่องพิมพ์',
    nameEn: 'Printers',
    description: 'เครื่องพิมพ์และสแกนเนอร์',
    icon: 'PrinterIcon',
    color: '#3B82F6',
    parentCategory: 'คอมพิวเตอร์และอุปกรณ์',
    sortOrder: 4
  }
];

// Sub-categories for Audio Visual Equipment
export const AV_SUBCATEGORIES = [
  {
    name: 'โปรเจคเตอร์',
    nameEn: 'Projectors',
    description: 'เครื่องฉายภาพ',
    icon: 'VideoCameraIcon',
    color: '#10B981',
    parentCategory: 'อุปกรณ์โสตทัศนูปกรณ์',
    sortOrder: 1
  },
  {
    name: 'กล้องถ่ายรูป',
    nameEn: 'Cameras',
    description: 'กล้องถ่ายรูปและวิดีโอ',
    icon: 'CameraIcon',
    color: '#10B981',
    parentCategory: 'อุปกรณ์โสตทัศนูปกรณ์',
    sortOrder: 2
  },
  {
    name: 'อุปกรณ์เสียง',
    nameEn: 'Audio Equipment',
    description: 'ลำโพง ไมโครโฟน และอุปกรณ์เสียง',
    icon: 'SpeakerWaveIcon',
    color: '#10B981',
    parentCategory: 'อุปกรณ์โสตทัศนูปกรณ์',
    sortOrder: 3
  }
];

/**
 * Get all categories with hierarchy
 * @returns {Array} Complete category list with sub-categories
 */
export function getAllCategories() {
  const categories = [...DEFAULT_EQUIPMENT_CATEGORIES];
  
  // Add computer sub-categories
  const computerParent = categories.find(cat => cat.name === 'คอมพิวเตอร์และอุปกรณ์');
  if (computerParent) {
    COMPUTER_SUBCATEGORIES.forEach(subCat => {
      categories.push({
        ...subCat,
        parentId: computerParent.id, // Will be set when parent is created
        level: 1,
        path: `${computerParent.path}/${subCat.name}`,
        requiredFields: computerParent.requiredFields,
        customFields: computerParent.customFields
      });
    });
  }
  
  // Add AV sub-categories
  const avParent = categories.find(cat => cat.name === 'อุปกรณ์โสตทัศนูปกรณ์');
  if (avParent) {
    AV_SUBCATEGORIES.forEach(subCat => {
      categories.push({
        ...subCat,
        parentId: avParent.id, // Will be set when parent is created
        level: 1,
        path: `${avParent.path}/${subCat.name}`,
        requiredFields: avParent.requiredFields,
        customFields: avParent.customFields
      });
    });
  }
  
  return categories;
}