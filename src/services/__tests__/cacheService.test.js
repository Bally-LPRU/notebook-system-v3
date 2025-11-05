/**
 * CacheService Tests
 */

import CacheService from '../cacheService';

describe('CacheService', () => {
  beforeEach(() => {
    CacheService.clearAllCache();
  });

  describe('Equipment Caching', () => {
    test('should cache and retrieve equipment data', () => {
      const equipmentId = 'test-equipment-1';
      const equipmentData = {
        id: equipmentId,
        name: 'Test Equipment',
        brand: 'Test Brand'
      };

      // Cache equipment
      CacheService.setCachedEquipment(equipmentId, equipmentData);

      // Retrieve from cache
      const cached = CacheService.getCachedEquipment(equipmentId);
      expect(cached).toEqual(equipmentData);
    });

    test('should return null for non-existent equipment', () => {
      const cached = CacheService.getCachedEquipment('non-existent');
      expect(cached).toBeNull();
    });

    test('should invalidate equipment cache', () => {
      const equipmentId = 'test-equipment-1';
      const equipmentData = { id: equipmentId, name: 'Test Equipment' };

      CacheService.setCachedEquipment(equipmentId, equipmentData);
      expect(CacheService.getCachedEquipment(equipmentId)).toEqual(equipmentData);

      CacheService.invalidateEquipmentCache(equipmentId);
      expect(CacheService.getCachedEquipment(equipmentId)).toBeNull();
    });
  });

  describe('Search Results Caching', () => {
    test('should cache and retrieve search results', () => {
      const query = 'test query';
      const filters = { category: 'computers' };
      const results = {
        equipment: [{ id: '1', name: 'Computer 1' }],
        totalCount: 1
      };

      CacheService.setCachedSearchResults(query, filters, results);
      const cached = CacheService.getCachedSearchResults(query, filters);
      
      expect(cached).toEqual(results);
    });

    test('should clear search cache', () => {
      const query = 'test query';
      const filters = {};
      const results = { equipment: [], totalCount: 0 };

      CacheService.setCachedSearchResults(query, filters, results);
      expect(CacheService.getCachedSearchResults(query, filters)).toEqual(results);

      CacheService.invalidateSearchCache();
      expect(CacheService.getCachedSearchResults(query, filters)).toBeNull();
    });
  });

  describe('Categories Caching', () => {
    test('should cache and retrieve categories', () => {
      const categories = [
        { id: '1', name: 'Category 1' },
        { id: '2', name: 'Category 2' }
      ];

      CacheService.setCachedCategories(categories);
      const cached = CacheService.getCachedCategories();
      
      expect(cached).toEqual(categories);
    });
  });

  describe('Cache Statistics', () => {
    test('should return cache statistics', () => {
      CacheService.setCachedEquipment('eq1', { id: 'eq1' });
      CacheService.setCachedCategories([{ id: '1' }]);

      const stats = CacheService.getCacheStats();
      
      expect(stats.equipment).toBe(1);
      expect(stats.categories).toBe(1);
      expect(stats.total).toBeGreaterThan(0);
    });
  });

  describe('Cache Management', () => {
    test('should clear all caches', () => {
      CacheService.setCachedEquipment('eq1', { id: 'eq1' });
      CacheService.setCachedCategories([{ id: '1' }]);

      CacheService.clearAllCache();
      
      const stats = CacheService.getCacheStats();
      expect(stats.total).toBe(0);
    });
  });
});