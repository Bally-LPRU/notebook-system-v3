/**
 * Property-based tests for useEquipmentFilters hook
 */

import { renderHook, act } from '@testing-library/react';
import fc from 'fast-check';
import { useEquipmentFilters } from '../useEquipmentFilters';
import { EQUIPMENT_STATUS } from '../../types/equipment';

// Generator for equipment items
const equipmentGenerator = fc.record({
  id: fc.string({ minLength: 1 }),
  name: fc.string({ minLength: 1 }),
  brand: fc.string({ minLength: 1 }),
  model: fc.string({ minLength: 1 }),
  equipmentNumber: fc.string({ minLength: 1 }),
  category: fc.oneof(
    fc.string({ minLength: 1 }), // String format
    fc.record({ id: fc.string({ minLength: 1 }), name: fc.string({ minLength: 1 }) }) // Object format
  ),
  status: fc.constantFrom(
    EQUIPMENT_STATUS.AVAILABLE,
    EQUIPMENT_STATUS.BORROWED,
    EQUIPMENT_STATUS.MAINTENANCE,
    EQUIPMENT_STATUS.RETIRED
  ),
  description: fc.option(fc.string(), { nil: undefined }),
  serialNumber: fc.option(fc.string(), { nil: undefined })
});

describe('useEquipmentFilters property-based tests', () => {
  // **Feature: code-cleanup-refactoring, Property 7: Search filter matches all specified fields**
  describe('Property 7: Search filter matches all specified fields', () => {
    it('should filter equipment by search term in name, brand, model, or equipmentNumber', () => {
      fc.assert(
        fc.property(
          fc.array(equipmentGenerator, { minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (equipment, searchTerm) => {
            const { result } = renderHook(() => useEquipmentFilters(equipment));
            
            // Apply search filter
            act(() => {
              result.current.setSearchTerm(searchTerm);
            });
            
            const filtered = result.current.filteredEquipment;
            const searchLower = searchTerm.toLowerCase();
            
            // All filtered items should contain the search term in at least one field
            filtered.forEach(item => {
              const matchesName = item.name?.toLowerCase().includes(searchLower);
              const matchesBrand = item.brand?.toLowerCase().includes(searchLower);
              const matchesModel = item.model?.toLowerCase().includes(searchLower);
              const matchesEquipmentNumber = item.equipmentNumber?.toLowerCase().includes(searchLower);
              const matchesSerialNumber = item.serialNumber?.toLowerCase().includes(searchLower);
              const matchesDescription = item.description?.toLowerCase().includes(searchLower);
              
              const matchesAnyField = matchesName || matchesBrand || matchesModel || 
                                     matchesEquipmentNumber || matchesSerialNumber || 
                                     matchesDescription;
              
              expect(matchesAnyField).toBe(true);
            });
            
            // Verify that all items that should match are included
            const expectedFiltered = equipment.filter(item => {
              const matchesName = item.name?.toLowerCase().includes(searchLower);
              const matchesBrand = item.brand?.toLowerCase().includes(searchLower);
              const matchesModel = item.model?.toLowerCase().includes(searchLower);
              const matchesEquipmentNumber = item.equipmentNumber?.toLowerCase().includes(searchLower);
              const matchesSerialNumber = item.serialNumber?.toLowerCase().includes(searchLower);
              const matchesDescription = item.description?.toLowerCase().includes(searchLower);
              
              return matchesName || matchesBrand || matchesModel || 
                     matchesEquipmentNumber || matchesSerialNumber || 
                     matchesDescription;
            });
            
            expect(filtered.length).toBe(expectedFiltered.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty search term by returning all items', () => {
      fc.assert(
        fc.property(
          fc.array(equipmentGenerator, { minLength: 1, maxLength: 50 }),
          (equipment) => {
            const { result } = renderHook(() => useEquipmentFilters(equipment));
            
            // Apply empty search filter
            act(() => {
              result.current.setSearchTerm('');
            });
            
            expect(result.current.filteredEquipment.length).toBe(equipment.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle whitespace-only search term by returning all items', () => {
      fc.assert(
        fc.property(
          fc.array(equipmentGenerator, { minLength: 1, maxLength: 50 }),
          fc.constantFrom('   ', '\t\t', '\n\n', '  \t  ', ' \n '),
          (equipment, whitespace) => {
            const { result } = renderHook(() => useEquipmentFilters(equipment));
            
            act(() => {
              result.current.setSearchTerm(whitespace);
            });
            
            expect(result.current.filteredEquipment.length).toBe(equipment.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: code-cleanup-refactoring, Property 8: Category filter returns only matching items**
  describe('Property 8: Category filter returns only matching items', () => {
    it('should filter equipment by selected category', () => {
      fc.assert(
        fc.property(
          fc.array(equipmentGenerator, { minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (equipment, categoryId) => {
            const { result } = renderHook(() => useEquipmentFilters(equipment));
            
            // Apply category filter
            act(() => {
              result.current.setSelectedCategory(categoryId);
            });
            
            const filtered = result.current.filteredEquipment;
            
            // All filtered items should match the selected category
            filtered.forEach(item => {
              const itemCategoryId = typeof item.category === 'string' 
                ? item.category 
                : item.category?.id;
              
              expect(itemCategoryId).toBe(categoryId);
            });
            
            // Verify count matches expected
            const expectedCount = equipment.filter(item => {
              const itemCategoryId = typeof item.category === 'string' 
                ? item.category 
                : item.category?.id;
              return itemCategoryId === categoryId;
            }).length;
            
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle "all" category by returning all items', () => {
      fc.assert(
        fc.property(
          fc.array(equipmentGenerator, { minLength: 1, maxLength: 50 }),
          (equipment) => {
            const { result } = renderHook(() => useEquipmentFilters(equipment));
            
            // Apply "all" category filter
            act(() => {
              result.current.setSelectedCategory('all');
            });
            
            expect(result.current.filteredEquipment.length).toBe(equipment.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle both string and object category formats', () => {
      fc.assert(
        fc.property(
          fc.array(equipmentGenerator, { minLength: 1, maxLength: 50 }),
          (equipment) => {
            // Pick a category from the equipment list
            if (equipment.length === 0) return;
            
            const sampleItem = equipment[0];
            const categoryId = typeof sampleItem.category === 'string'
              ? sampleItem.category
              : sampleItem.category?.id;
            
            if (!categoryId) return;
            
            const { result } = renderHook(() => useEquipmentFilters(equipment));
            
            act(() => {
              result.current.setSelectedCategory(categoryId);
            });
            
            const filtered = result.current.filteredEquipment;
            
            // All filtered items should have matching category
            filtered.forEach(item => {
              const itemCategoryId = typeof item.category === 'string'
                ? item.category
                : item.category?.id;
              expect(itemCategoryId).toBe(categoryId);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: code-cleanup-refactoring, Property 9: Status filter returns only matching items**
  describe('Property 9: Status filter returns only matching items', () => {
    it('should filter equipment by selected status', () => {
      fc.assert(
        fc.property(
          fc.array(equipmentGenerator, { minLength: 1, maxLength: 50 }),
          fc.constantFrom(
            EQUIPMENT_STATUS.AVAILABLE,
            EQUIPMENT_STATUS.BORROWED,
            EQUIPMENT_STATUS.MAINTENANCE,
            EQUIPMENT_STATUS.RETIRED
          ),
          (equipment, selectedStatus) => {
            const { result } = renderHook(() => useEquipmentFilters(equipment));
            
            // Apply status filter
            act(() => {
              result.current.setSelectedStatus(selectedStatus);
            });
            
            const filtered = result.current.filteredEquipment;
            
            // All filtered items should match the selected status
            filtered.forEach(item => {
              expect(item.status).toBe(selectedStatus);
            });
            
            // Verify count matches expected
            const expectedCount = equipment.filter(item => item.status === selectedStatus).length;
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle "all" status by returning all items', () => {
      fc.assert(
        fc.property(
          fc.array(equipmentGenerator, { minLength: 1, maxLength: 50 }),
          (equipment) => {
            const { result } = renderHook(() => useEquipmentFilters(equipment));
            
            // Apply "all" status filter
            act(() => {
              result.current.setSelectedStatus('all');
            });
            
            expect(result.current.filteredEquipment.length).toBe(equipment.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: code-cleanup-refactoring, Property 10: Combined filters apply cumulatively**
  describe('Property 10: Combined filters apply cumulatively', () => {
    it('should apply search, category, and status filters cumulatively', () => {
      fc.assert(
        fc.property(
          fc.array(equipmentGenerator, { minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.constantFrom(
            EQUIPMENT_STATUS.AVAILABLE,
            EQUIPMENT_STATUS.BORROWED,
            EQUIPMENT_STATUS.MAINTENANCE,
            EQUIPMENT_STATUS.RETIRED
          ),
          (equipment, searchTerm, categoryId, selectedStatus) => {
            const { result } = renderHook(() => useEquipmentFilters(equipment));
            
            // Apply all filters
            act(() => {
              result.current.setSearchTerm(searchTerm);
              result.current.setSelectedCategory(categoryId);
              result.current.setSelectedStatus(selectedStatus);
            });
            
            const filtered = result.current.filteredEquipment;
            const searchLower = searchTerm.toLowerCase();
            
            // All filtered items should satisfy all filter conditions
            filtered.forEach(item => {
              // Check search filter
              const matchesSearch = 
                item.name?.toLowerCase().includes(searchLower) ||
                item.brand?.toLowerCase().includes(searchLower) ||
                item.model?.toLowerCase().includes(searchLower) ||
                item.equipmentNumber?.toLowerCase().includes(searchLower) ||
                item.serialNumber?.toLowerCase().includes(searchLower) ||
                item.description?.toLowerCase().includes(searchLower);
              
              expect(matchesSearch).toBe(true);
              
              // Check category filter
              const itemCategoryId = typeof item.category === 'string'
                ? item.category
                : item.category?.id;
              expect(itemCategoryId).toBe(categoryId);
              
              // Check status filter
              expect(item.status).toBe(selectedStatus);
            });
            
            // Verify count matches expected
            const expectedFiltered = equipment.filter(item => {
              // Search filter
              const matchesSearch = 
                item.name?.toLowerCase().includes(searchLower) ||
                item.brand?.toLowerCase().includes(searchLower) ||
                item.model?.toLowerCase().includes(searchLower) ||
                item.equipmentNumber?.toLowerCase().includes(searchLower) ||
                item.serialNumber?.toLowerCase().includes(searchLower) ||
                item.description?.toLowerCase().includes(searchLower);
              
              // Category filter
              const itemCategoryId = typeof item.category === 'string'
                ? item.category
                : item.category?.id;
              const matchesCategory = itemCategoryId === categoryId;
              
              // Status filter
              const matchesStatus = item.status === selectedStatus;
              
              return matchesSearch && matchesCategory && matchesStatus;
            });
            
            expect(filtered.length).toBe(expectedFiltered.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle clearFilters by resetting all filters', () => {
      fc.assert(
        fc.property(
          fc.array(equipmentGenerator, { minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.constantFrom(
            EQUIPMENT_STATUS.AVAILABLE,
            EQUIPMENT_STATUS.BORROWED,
            EQUIPMENT_STATUS.MAINTENANCE,
            EQUIPMENT_STATUS.RETIRED
          ),
          (equipment, searchTerm, categoryId, selectedStatus) => {
            const { result } = renderHook(() => useEquipmentFilters(equipment));
            
            // Apply all filters
            act(() => {
              result.current.setSearchTerm(searchTerm);
              result.current.setSelectedCategory(categoryId);
              result.current.setSelectedStatus(selectedStatus);
            });
            
            // Clear all filters
            act(() => {
              result.current.clearFilters();
            });
            
            // All filters should be reset
            expect(result.current.searchTerm).toBe('');
            expect(result.current.selectedCategory).toBe('all');
            expect(result.current.selectedStatus).toBe('all');
            expect(result.current.filteredEquipment.length).toBe(equipment.length);
            expect(result.current.hasActiveFilters).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly report hasActiveFilters', () => {
      fc.assert(
        fc.property(
          fc.array(equipmentGenerator, { minLength: 1, maxLength: 50 }),
          (equipment) => {
            const { result } = renderHook(() => useEquipmentFilters(equipment));
            
            // Initially no active filters
            expect(result.current.hasActiveFilters).toBe(false);
            
            // Apply search filter
            act(() => {
              result.current.setSearchTerm('test');
            });
            expect(result.current.hasActiveFilters).toBe(true);
            
            // Clear and apply category filter
            act(() => {
              result.current.clearFilters();
              result.current.setSelectedCategory('laptop');
            });
            expect(result.current.hasActiveFilters).toBe(true);
            
            // Clear and apply status filter
            act(() => {
              result.current.clearFilters();
              result.current.setSelectedStatus(EQUIPMENT_STATUS.AVAILABLE);
            });
            expect(result.current.hasActiveFilters).toBe(true);
            
            // Clear all
            act(() => {
              result.current.clearFilters();
            });
            expect(result.current.hasActiveFilters).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Additional property: Handle malformed equipment data gracefully
  describe('Additional property: Graceful handling of malformed data', () => {
    it('should handle equipment items with missing fields', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              // Some fields may be missing
              name: fc.option(fc.string(), { nil: undefined }),
              brand: fc.option(fc.string(), { nil: undefined }),
              model: fc.option(fc.string(), { nil: undefined }),
              equipmentNumber: fc.option(fc.string(), { nil: undefined }),
              category: fc.option(
                fc.oneof(
                  fc.string({ minLength: 1 }),
                  fc.record({ id: fc.string({ minLength: 1 }), name: fc.string({ minLength: 1 }) })
                ),
                { nil: undefined }
              ),
              status: fc.option(
                fc.constantFrom(
                  EQUIPMENT_STATUS.AVAILABLE,
                  EQUIPMENT_STATUS.BORROWED,
                  EQUIPMENT_STATUS.MAINTENANCE,
                  EQUIPMENT_STATUS.RETIRED
                ),
                { nil: undefined }
              )
            }),
            { minLength: 1, maxLength: 50 }
          ),
          fc.string({ minLength: 1, maxLength: 20 }),
          (equipment, searchTerm) => {
            // Should not throw error
            const { result } = renderHook(() => useEquipmentFilters(equipment));
            
            act(() => {
              result.current.setSearchTerm(searchTerm);
            });
            
            // Should return an array (possibly empty)
            expect(Array.isArray(result.current.filteredEquipment)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty equipment array', () => {
      const { result } = renderHook(() => useEquipmentFilters([]));
      
      expect(result.current.filteredEquipment).toEqual([]);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.filteredCount).toBe(0);
      
      // Applying filters should not throw
      act(() => {
        result.current.setSearchTerm('test');
        result.current.setSelectedCategory('laptop');
        result.current.setSelectedStatus(EQUIPMENT_STATUS.AVAILABLE);
      });
      
      expect(result.current.filteredEquipment).toEqual([]);
    });
  });
});
