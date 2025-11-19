import { useState, useMemo, useCallback } from 'react';
import { getCategoryId } from '../utils/equipmentHelpers';

/**
 * Custom hook for managing equipment filtering logic.
 * 
 * Provides a complete filtering solution with search, category, and status filters.
 * All filters are applied cumulatively, and the hook handles both object and string
 * category formats gracefully.
 * 
 * **Features:**
 * - Multi-field search (name, brand, model, equipment number, serial number, description)
 * - Category filtering with support for both object and string formats
 * - Status filtering
 * - Cumulative filter application
 * - Active filter tracking
 * - Memoized filtering for performance
 * 
 * **Usage:**
 * ```jsx
 * function EquipmentList({ equipment }) {
 *   const {
 *     filteredEquipment,
 *     searchTerm,
 *     setSearchTerm,
 *     selectedCategory,
 *     setSelectedCategory,
 *     selectedStatus,
 *     setSelectedStatus,
 *     clearFilters,
 *     hasActiveFilters
 *   } = useEquipmentFilters(equipment);
 *   
 *   return (
 *     <>
 *       <SearchBar value={searchTerm} onChange={setSearchTerm} />
 *       <CategoryFilter value={selectedCategory} onChange={setSelectedCategory} />
 *       <StatusFilter value={selectedStatus} onChange={setSelectedStatus} />
 *       {hasActiveFilters && <button onClick={clearFilters}>Clear Filters</button>}
 *       <EquipmentGrid items={filteredEquipment} />
 *     </>
 *   );
 * }
 * ```
 * 
 * @hook
 * @param {Array<Object>} equipment - Complete array of equipment items to filter
 * @returns {Object} Filter state, setters, and filtered results
 * @returns {string} returns.searchTerm - Current search term
 * @returns {string} returns.selectedCategory - Selected category ID or 'all'
 * @returns {string} returns.selectedStatus - Selected status or 'all'
 * @returns {Function} returns.setSearchTerm - Update search term
 * @returns {Function} returns.setSelectedCategory - Update category filter
 * @returns {Function} returns.setSelectedStatus - Update status filter
 * @returns {Array<Object>} returns.filteredEquipment - Filtered equipment array
 * @returns {Function} returns.clearFilters - Reset all filters to defaults
 * @returns {boolean} returns.hasActiveFilters - Whether any filters are active
 * @returns {number} returns.activeFilterCount - Number of active filters
 * @returns {number} returns.totalItems - Total number of items before filtering
 * @returns {number} returns.filteredCount - Number of items after filtering
 * @returns {boolean} returns.isFiltered - Alias for hasActiveFilters
 */
export const useEquipmentFilters = (equipment) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // กรองข้อมูลอุปกรณ์
  const filteredEquipment = useMemo(() => {
    let filtered = [...equipment];

    // กรองตามคำค้นหา
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(search) ||
        item.brand?.toLowerCase().includes(search) ||
        item.model?.toLowerCase().includes(search) ||
        item.equipmentNumber?.toLowerCase().includes(search) ||
        item.serialNumber?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search)
      );
    }

    // กรองตามประเภท
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        const itemCategory = getCategoryId(item.category);
        return itemCategory === selectedCategory;
      });
    }

    // กรองตามสถานะ
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    return filtered;
  }, [equipment, searchTerm, selectedCategory, selectedStatus]);

  // ล้างตัวกรองทั้งหมด
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
  }, []);

  // ตรวจสอบว่ามีตัวกรองที่ใช้งานอยู่หรือไม่
  const hasActiveFilters = useMemo(() => {
    return !!(
      searchTerm.trim() ||
      selectedCategory !== 'all' ||
      selectedStatus !== 'all'
    );
  }, [searchTerm, selectedCategory, selectedStatus]);

  // นับจำนวนตัวกรองที่ใช้งาน
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (selectedCategory !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    return count;
  }, [searchTerm, selectedCategory, selectedStatus]);

  return {
    // Filter states
    searchTerm,
    selectedCategory,
    selectedStatus,
    
    // Filter setters
    setSearchTerm,
    setSelectedCategory,
    setSelectedStatus,
    
    // Filtered data
    filteredEquipment,
    
    // Helper functions
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    
    // Statistics
    totalItems: equipment.length,
    filteredCount: filteredEquipment.length,
    isFiltered: hasActiveFilters
  };
};

export default useEquipmentFilters;
