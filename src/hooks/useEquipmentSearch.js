import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import EquipmentSearchService from '../services/equipmentSearchService';

export const useEquipmentSearch = (options = {}) => {
  const {
    initialQuery = '',
    autoSearch = true,
    debounceMs = 300,
    enableSuggestions = true,
    enableHistory = true
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        setSuggestions([]);
        setTotalCount(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchResults = await EquipmentSearchService.searchWithSuggestions(
          searchQuery,
          {
            includeSuggestions: enableSuggestions,
            includeCategories: true,
            includeBrands: true
          }
        );

        setResults(searchResults.equipment);
        setSuggestions(searchResults.suggestions);
        setTotalCount(searchResults.totalCount);
      } catch (err) {
        console.error('Search error:', err);
        setError('เกิดข้อผิดพลาดในการค้นหา');
        setResults([]);
        setSuggestions([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }, debounceMs),
    [debounceMs, enableSuggestions]
  );

  // Auto search when query changes
  useEffect(() => {
    if (autoSearch) {
      debouncedSearch(query);
    }
  }, [query, autoSearch, debouncedSearch]);

  // Manual search function
  const search = useCallback(async (searchQuery = query) => {
    setQuery(searchQuery);
    
    if (!autoSearch) {
      debouncedSearch(searchQuery);
    }
  }, [query, autoSearch, debouncedSearch]);

  // Advanced search function
  const advancedSearch = useCallback(async (criteria) => {
    setLoading(true);
    setError(null);

    try {
      const searchResults = await EquipmentSearchService.advancedSearch(criteria);
      setResults(searchResults.equipment);
      setTotalCount(searchResults.totalCount);
      setSuggestions([]);
      
      // Update query if there's a text query in criteria
      if (criteria.query) {
        setQuery(criteria.query);
      }
    } catch (err) {
      console.error('Advanced search error:', err);
      setError('เกิดข้อผิดพลาดในการค้นหาขั้นสูง');
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setTotalCount(0);
    setError(null);
  }, []);

  // Get autocomplete suggestions
  const getAutocompleteSuggestions = useCallback(async (partialQuery) => {
    try {
      const autocompleteSuggestions = await EquipmentSearchService.getAutocompleteSuggestions(partialQuery);
      return autocompleteSuggestions;
    } catch (err) {
      console.error('Autocomplete error:', err);
      return [];
    }
  }, []);

  return {
    // State
    query,
    results,
    suggestions,
    loading,
    error,
    totalCount,
    
    // Actions
    setQuery,
    search,
    advancedSearch,
    clearSearch,
    getAutocompleteSuggestions
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