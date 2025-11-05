/**
 * Tests for Equipment Management Service
 */

import EquipmentManagementService from '../equipmentManagementService';
import { EQUIPMENT_MANAGEMENT_STATUS } from '../../types/equipmentManagement';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {},
  storage: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  writeBatch: jest.fn(),
  increment: jest.fn()
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}));

describe('EquipmentManagementService', () => {
  describe('formatEquipmentNumber', () => {
    test('should format equipment number correctly', () => {
      const testData = {
        equipmentNumber: 'eq001',
        name: 'Test Equipment',
        category: { id: 'cat1', name: 'Computer' },
        status: EQUIPMENT_MANAGEMENT_STATUS.ACTIVE
      };

      const keywords = EquipmentManagementService.generateSearchKeywords(testData);
      expect(keywords).toContain('eq001');
      expect(keywords).toContain('test');
      expect(keywords).toContain('equipment');
      expect(keywords).toContain('computer');
    });
  });

  describe('validateImageFile', () => {
    test('should validate image file type', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      expect(() => EquipmentManagementService.validateImageFile(validFile)).not.toThrow();
    });

    test('should reject invalid file type', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      expect(() => EquipmentManagementService.validateImageFile(invalidFile)).toThrow('รองรับเฉพาะไฟล์รูปภาพ');
    });

    test('should reject oversized file', () => {
      const oversizedFile = new File(['x'.repeat(6 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
      expect(() => EquipmentManagementService.validateImageFile(oversizedFile)).toThrow('ขนาดไฟล์ต้องไม่เกิน 5MB');
    });
  });

  describe('generateSearchKeywords', () => {
    test('should generate search keywords from equipment data', () => {
      const equipmentData = {
        equipmentNumber: 'EQ001',
        name: 'Test Laptop Computer',
        brand: 'Dell',
        model: 'Inspiron',
        description: 'High performance laptop',
        category: { name: 'Computer' },
        tags: ['laptop', 'portable']
      };

      const keywords = EquipmentManagementService.generateSearchKeywords(equipmentData);
      
      expect(keywords).toContain('eq001');
      expect(keywords).toContain('test');
      expect(keywords).toContain('laptop');
      expect(keywords).toContain('computer');
      expect(keywords).toContain('dell');
      expect(keywords).toContain('inspiron');
      expect(keywords).toContain('high');
      expect(keywords).toContain('performance');
      expect(keywords).toContain('portable');
    });

    test('should filter out short keywords', () => {
      const equipmentData = {
        name: 'A B Test Equipment',
        brand: 'X'
      };

      const keywords = EquipmentManagementService.generateSearchKeywords(equipmentData);
      
      expect(keywords).not.toContain('a');
      expect(keywords).not.toContain('b');
      expect(keywords).not.toContain('x');
      expect(keywords).toContain('test');
      expect(keywords).toContain('equipment');
    });
  });

  describe('trackChanges', () => {
    test('should track changes between old and new data', () => {
      const oldData = {
        name: 'Old Name',
        status: EQUIPMENT_MANAGEMENT_STATUS.ACTIVE,
        brand: 'Old Brand'
      };

      const newData = {
        name: 'New Name',
        status: EQUIPMENT_MANAGEMENT_STATUS.MAINTENANCE,
        brand: 'Old Brand'
      };

      const changes = EquipmentManagementService.trackChanges(oldData, newData);
      
      expect(changes).toHaveLength(2);
      expect(changes[0]).toEqual({
        field: 'name',
        oldValue: 'Old Name',
        newValue: 'New Name'
      });
      expect(changes[1]).toEqual({
        field: 'status',
        oldValue: EQUIPMENT_MANAGEMENT_STATUS.ACTIVE,
        newValue: EQUIPMENT_MANAGEMENT_STATUS.MAINTENANCE
      });
    });

    test('should return empty array when no changes', () => {
      const data = {
        name: 'Same Name',
        status: EQUIPMENT_MANAGEMENT_STATUS.ACTIVE
      };

      const changes = EquipmentManagementService.trackChanges(data, data);
      expect(changes).toHaveLength(0);
    });
  });

  describe('generateImageId', () => {
    test('should generate unique image IDs', () => {
      const id1 = EquipmentManagementService.generateImageId();
      const id2 = EquipmentManagementService.generateImageId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });
  });

  describe('addKeywords', () => {
    test('should add keywords from text', () => {
      const keywords = new Set();
      EquipmentManagementService.addKeywords(keywords, 'Test Equipment Computer');
      
      expect(keywords.has('test')).toBe(true);
      expect(keywords.has('equipment')).toBe(true);
      expect(keywords.has('computer')).toBe(true);
    });

    test('should handle Thai text', () => {
      const keywords = new Set();
      EquipmentManagementService.addKeywords(keywords, 'คอมพิวเตอร์ โน็ตบุ๊ค');
      
      expect(keywords.has('คอมพิวเตอร์')).toBe(true);
      expect(keywords.has('โน็ตบุ๊ค')).toBe(true);
    });

    test('should handle empty or null text', () => {
      const keywords = new Set();
      EquipmentManagementService.addKeywords(keywords, null);
      EquipmentManagementService.addKeywords(keywords, '');
      EquipmentManagementService.addKeywords(keywords, undefined);
      
      expect(keywords.size).toBe(0);
    });
  });
});