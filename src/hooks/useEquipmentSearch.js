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
    searchResults,
    isSearching,
    searchError,
    handleSearch,
    clearSearch
  };
};

export const useSearchHistory = () => {
  const [history, setHistory] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);

  // Load history and saved searches
  useEffect(() => {
    const loadedHistory = JSON.parse(localStorage.getItem('equipment-search-history') || '[]');
    const loadedSaved = JSON.parse(localStorage.getItem('equipment-saved-searches') || '[]');
    
    setHistory(loadedHistory);
    setSavedSearches(loadedSaved);
  }, []);

  // Add to history
  const addToHistory = useCallback((searchQuery) => {
    if (!searchQuery.trim()) return;

    const newHistory = [
      searchQuery,
      ...history.filter(item => item !== searchQuery)
    ].slice(0, 10);

    setHistory(newHistory);
    localStorage.setItem('equipment-search-history', JSON.stringify(newHistory));
  }, [history]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('equipment-search-history');
  }, []);

  // Save search
  const saveSearch = useCallback((name, query, criteria = null) => {
    const newSavedSearch = {
      id: Date.now().toString(),
      name: name.trim(),
      query: query.trim(),
      criteria,
      createdAt: new Date().toISOString()
    };

    const newSavedSearches = [...savedSearches, newSavedSearch];
    setSavedSearches(newSavedSearches);
    localStorage.setItem('equipment-saved-searches', JSON.stringify(newSavedSearches));
  }, [savedSearches]);

  // Delete saved search
  const deleteSavedSearch = useCallback((searchId) => {
    const newSavedSearches = savedSearches.filter(search => search.id !== searchId);
    setSavedSearches(newSavedSearches);
    localStorage.setItem('equipment-saved-searches', JSON.stringify(newSavedSearches));
  }, [savedSearches]);

  // Get popular terms
  const getPopularTerms = useCallback(() => {
    return EquipmentSearchService.getPopularSearchTerms();
  }, []);

  return {
    history,
    savedSearches,
    addToHistory,
    clearHistory,
    saveSearch,
    deleteSavedSearch,
    getPopularTerms
  };
};