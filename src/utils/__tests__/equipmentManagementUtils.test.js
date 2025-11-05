/**
 * Tests for Equipment Management Utilities
 */

import {
  formatEquipmentNumber,
  validateEquipmentNumber,
  calculateEquipmentAge,
  isUnderWarranty,
  formatCurrency,
  formatLocation,
  getStatusBadge,
  exportToCSV
} from '../equipmentManagementUtils';

import {
  EQUIPMENT_MANAGEMENT_STATUS,
  EQUIPMENT_MANAGEMENT_STATUS_LABELS
} from '../../types/equipmentManagement';

describe('Equipment Management Utils', () => {
  describe('formatEquipmentNumber', () => {
    test('should format equipment number to uppercase', () => {
      expect(formatEquipmentNumber('eq001')).toBe('EQ001');
      expect(formatEquipmentNumber('laptop-001')).toBe('LAPTOP-001');
    });

    test('should handle empty input', () => {
      expect(formatEquipmentNumber('')).toBe('');
      expect(formatEquipmentNumber(null)).toBe('');
      expect(formatEquipmentNumber(undefined)).toBe('');
    });

    test('should trim whitespace', () => {
      expect(formatEquipmentNumber('  eq001  ')).toBe('EQ001');
    });
  });

  describe('validateEquipmentNumber', () => {
    test('should validate correct equipment numbers', () => {
      const result = validateEquipmentNumber('EQ001');
      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe('EQ001');
    });

    test('should reject empty equipment numbers', () => {
      const result = validateEquipmentNumber('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('จำเป็น');
    });

    test('should reject invalid characters', () => {
      const result = validateEquipmentNumber('EQ001@');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('ตัวอักษรภาษาอังกฤษ');
    });

    test('should accept valid formats', () => {
      expect(validateEquipmentNumber('EQ001').isValid).toBe(true);
      expect(validateEquipmentNumber('LAPTOP-001').isValid).toBe(true);
      expect(validateEquipmentNumber('A1B2C3').isValid).toBe(true);
    });
  });

  describe('calculateEquipmentAge', () => {
    test('should calculate age correctly', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      oneYearAgo.setDate(oneYearAgo.getDate() - 1); // Make sure it's more than a year
      
      const age = calculateEquipmentAge(oneYearAgo);
      expect(age).toBeGreaterThanOrEqual(1);
    });

    test('should handle null date', () => {
      expect(calculateEquipmentAge(null)).toBe(0);
      expect(calculateEquipmentAge(undefined)).toBe(0);
    });
  });

  describe('isUnderWarranty', () => {
    test('should return true for future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      expect(isUnderWarranty(futureDate)).toBe(true);
    });

    test('should return false for past dates', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      
      expect(isUnderWarranty(pastDate)).toBe(false);
    });

    test('should handle null date', () => {
      expect(isUnderWarranty(null)).toBe(false);
      expect(isUnderWarranty(undefined)).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    test('should format currency correctly', () => {
      expect(formatCurrency(1000)).toContain('1,000');
      expect(formatCurrency(1000)).toContain('บาท');
    });

    test('should handle zero and null values', () => {
      expect(formatCurrency(0)).toBe('0 บาท');
      expect(formatCurrency(null)).toBe('0 บาท');
      expect(formatCurrency(undefined)).toBe('0 บาท');
    });
  });

  describe('formatLocation', () => {
    test('should format complete location', () => {
      const location = {
        building: 'A',
        floor: '2',
        room: '201',
        description: 'ห้องประชุม'
      };
      
      const formatted = formatLocation(location);
      expect(formatted).toContain('อาคาร A');
      expect(formatted).toContain('ชั้น 2');
      expect(formatted).toContain('ห้อง 201');
      expect(formatted).toContain('ห้องประชุม');
    });

    test('should handle partial location', () => {
      const location = {
        building: 'A',
        room: '201'
      };
      
      const formatted = formatLocation(location);
      expect(formatted).toContain('อาคาร A');
      expect(formatted).toContain('ห้อง 201');
      expect(formatted).not.toContain('ชั้น');
    });

    test('should handle empty location', () => {
      expect(formatLocation(null)).toBe('');
      expect(formatLocation({})).toBe('');
    });
  });

  describe('getStatusBadge', () => {
    test('should return correct badge for active status', () => {
      const badge = getStatusBadge(EQUIPMENT_MANAGEMENT_STATUS.ACTIVE);
      expect(badge.label).toBe(EQUIPMENT_MANAGEMENT_STATUS_LABELS.active);
      expect(badge.color).toBe('green');
      expect(badge.status).toBe('active');
    });

    test('should handle unknown status', () => {
      const badge = getStatusBadge('unknown');
      expect(badge.label).toBe('unknown');
      expect(badge.color).toBe('gray');
      expect(badge.status).toBe('unknown');
    });
  });

  describe('exportToCSV', () => {
    const mockEquipment = [
      {
        equipmentNumber: 'EQ001',
        name: 'Test Equipment',
        category: { name: 'Computer' },
        brand: 'Test Brand',
        model: 'Test Model',
        status: 'active',
        location: { building: 'A', room: '101' },
        purchasePrice: 1000,
        purchaseDate: new Date('2023-01-01')
      }
    ];

    test('should export equipment to CSV', () => {
      const csv = exportToCSV(mockEquipment);
      expect(csv).toContain('หมายเลขครุภัณฑ์');
      expect(csv).toContain('EQ001');
      expect(csv).toContain('Test Equipment');
    });

    test('should handle empty equipment list', () => {
      const csv = exportToCSV([]);
      expect(csv).toBe('');
    });

    test('should handle custom fields', () => {
      const csv = exportToCSV(mockEquipment, ['equipmentNumber', 'name']);
      expect(csv).toContain('หมายเลขครุภัณฑ์');
      expect(csv).toContain('ชื่ออุปกรณ์');
      expect(csv).not.toContain('ประเภท');
    });
  });
});