import { useState, useCallback } from 'react';
import EquipmentService from '../services/equipmentService';

export const useEquipmentSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Simple search function
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await EquipmentService.searchEquipment(query.trim(), 50);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('เกิดข้อผิดพลาดในการค้นหา');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading: isSearching,
    error: searchError,
    searchEquipment: handleSearch,
    clearSearch
  };
};