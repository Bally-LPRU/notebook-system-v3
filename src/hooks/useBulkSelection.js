import { useState, useCallback, useMemo } from 'react';

/**
 * Hook for managing bulk selection state
 * @param {Array} items - Array of items that can be selected
 * @param {string} keyField - Field to use as unique identifier (default: 'id')
 * @returns {Object} Selection state and methods
 */
const useBulkSelection = (items = [], keyField = 'id') => {
  const [selectedItems, setSelectedItems] = useState([]);

  // Get unique keys from items
  const itemKeys = useMemo(() => 
    items.map(item => item[keyField]).filter(Boolean),
    [items, keyField]
  );

  // Check if all items are selected
  const isAllSelected = useMemo(() => 
    itemKeys.length > 0 && selectedItems.length === itemKeys.length &&
    itemKeys.every(key => selectedItems.includes(key)),
    [selectedItems, itemKeys]
  );

  // Check if some items are selected (for indeterminate state)
  const isSomeSelected = useMemo(() => 
    selectedItems.length > 0 && selectedItems.length < itemKeys.length,
    [selectedItems, itemKeys]
  );

  // Select/deselect individual item
  const toggleItem = useCallback((itemKey, isSelected) => {
    setSelectedItems(prev => {
      if (isSelected) {
        return prev.includes(itemKey) ? prev : [...prev, itemKey];
      } else {
        return prev.filter(key => key !== itemKey);
      }
    });
  }, []);

  // Select all items
  const selectAll = useCallback(() => {
    setSelectedItems([...itemKeys]);
  }, [itemKeys]);

  // Deselect all items
  const deselectAll = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // Toggle all items (select all if none/some selected, deselect all if all selected)
  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [isAllSelected, selectAll, deselectAll]);

  // Select items based on filter function
  const selectFiltered = useCallback((filterFn) => {
    const filteredKeys = items
      .filter(filterFn)
      .map(item => item[keyField])
      .filter(Boolean);
    
    setSelectedItems(prev => {
      const newSelection = new Set([...prev, ...filteredKeys]);
      return Array.from(newSelection);
    });
  }, [items, keyField]);

  // Deselect items based on filter function
  const deselectFiltered = useCallback((filterFn) => {
    const filteredKeys = items
      .filter(filterFn)
      .map(item => item[keyField])
      .filter(Boolean);
    
    setSelectedItems(prev => 
      prev.filter(key => !filteredKeys.includes(key))
    );
  }, [items, keyField]);

  // Get selected item objects
  const getSelectedItems = useCallback(() => {
    return items.filter(item => selectedItems.includes(item[keyField]));
  }, [items, selectedItems, keyField]);

  // Check if specific item is selected
  const isItemSelected = useCallback((itemKey) => {
    return selectedItems.includes(itemKey);
  }, [selectedItems]);

  // Get selection stats
  const selectionStats = useMemo(() => ({
    selectedCount: selectedItems.length,
    totalCount: itemKeys.length,
    selectedPercentage: itemKeys.length > 0 ? (selectedItems.length / itemKeys.length) * 100 : 0
  }), [selectedItems.length, itemKeys.length]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // Set specific selection
  const setSelection = useCallback((keys) => {
    setSelectedItems(Array.isArray(keys) ? keys : []);
  }, []);

  return {
    // State
    selectedItems,
    isAllSelected,
    isSomeSelected,
    selectionStats,
    
    // Methods
    toggleItem,
    selectAll,
    deselectAll,
    toggleAll,
    selectFiltered,
    deselectFiltered,
    clearSelection,
    setSelection,
    
    // Helpers
    getSelectedItems,
    isItemSelected
  };
};

export default useBulkSelection;