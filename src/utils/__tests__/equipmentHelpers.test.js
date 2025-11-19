/**
 * Unit tests for equipmentHelpers utility functions
 */

import {
  getCategoryName,
  getCategoryId,
  getEquipmentNumber,
  getEquipmentFullName,
  formatLocation,
  hasEquipmentImage,
  getEquipmentImageUrl,
  formatDate,
  formatPrice,
  calculateEquipmentAge,
  isNewEquipment
} from '../equipmentHelpers';

describe('equipmentHelpers', () => {
  describe('getCategoryName', () => {
    it('should return category name from object format', () => {
      const category = { id: 'cat-1', name: 'Electronics' };
      expect(getCategoryName(category)).toBe('Electronics');
    });

    it('should return category name from string format', () => {
      const category = 'Electronics';
      expect(getCategoryName(category)).toBe('Electronics');
    });

    it('should return "-" for null input', () => {
      expect(getCategoryName(null)).toBe('-');
    });

    it('should return "-" for undefined input', () => {
      expect(getCategoryName(undefined)).toBe('-');
    });

    it('should return "-" for object without name property', () => {
      const category = { id: 'cat-1' };
      expect(getCategoryName(category)).toBe('-');
    });

    it('should return "-" for empty string', () => {
      expect(getCategoryName('')).toBe('-');
    });
  });

  describe('getCategoryId', () => {
    it('should return category id from object format', () => {
      const category = { id: 'cat-1', name: 'Electronics' };
      expect(getCategoryId(category)).toBe('cat-1');
    });

    it('should return category string as id from string format', () => {
      const category = 'Electronics';
      expect(getCategoryId(category)).toBe('Electronics');
    });

    it('should return null for null input', () => {
      expect(getCategoryId(null)).toBe(null);
    });

    it('should return null for undefined input', () => {
      expect(getCategoryId(undefined)).toBe(null);
    });

    it('should return undefined for object without id property', () => {
      const category = { name: 'Electronics' };
      expect(getCategoryId(category)).toBeUndefined();
    });

    it('should return null for empty string', () => {
      expect(getCategoryId('')).toBe(null);
    });
  });
});
