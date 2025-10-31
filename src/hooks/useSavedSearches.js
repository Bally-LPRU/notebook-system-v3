import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SavedSearchService from '../services/savedSearchService';

/**
 * Custom hook for managing saved searches
 * @param {string} searchType - Type of search (equipment, loans, reservations, reports)
 * @returns {Object} Saved searches state and methods
 */
export const useSavedSearches = (searchType = null) => {
  const { user } = useAuth();
  const [savedSearches, setSavedSearches] = useState([]);
  const [publicSearches, setPublicSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  /**
   * Load saved searches
   */
  const loadSavedSearches = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      let searches;
      if (searchType) {
        searches = await SavedSearchService.getSavedSearchesByType(user.uid, searchType);
      } else {
        searches = await SavedSearchService.getSavedSearches(user.uid);
      }

      setSavedSearches(searches);
    } catch (err) {
      console.error('Error loading saved searches:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดการค้นหาที่บันทึกไว้');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, searchType]);

  /**
   * Load public saved searches
   */
  const loadPublicSearches = useCallback(async (limit = 20) => {
    try {
      setLoading(true);
      setError(null);

      const searches = await SavedSearchService.getPublicSavedSearches(searchType, limit);
      setPublicSearches(searches);
    } catch (err) {
      console.error('Error loading public searches:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดการค้นหาสาธารณะ');
    } finally {
      setLoading(false);
    }
  }, [searchType]);

  /**
   * Save a new search
   */
  const saveSearch = useCallback(async (searchData) => {
    if (!user?.uid) {
      throw new Error('กรุณาเข้าสู่ระบบก่อน');
    }

    try {
      setLoading(true);
      setError(null);

      const searchId = await SavedSearchService.saveSearch(user.uid, searchData);
      
      // Reload saved searches
      await loadSavedSearches();
      
      return searchId;
    } catch (err) {
      console.error('Error saving search:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกการค้นหา');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, loadSavedSearches]);

  /**
   * Update a saved search
   */
  const updateSavedSearch = useCallback(async (searchId, updateData) => {
    try {
      setLoading(true);
      setError(null);

      await SavedSearchService.updateSavedSearch(searchId, updateData);
      
      // Update local state
      setSavedSearches(prev => 
        prev.map(search => 
          search.id === searchId 
            ? { ...search, ...updateData, updatedAt: new Date() }
            : search
        )
      );
    } catch (err) {
      console.error('Error updating saved search:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปเดตการค้นหา');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a saved search
   */
  const deleteSavedSearch = useCallback(async (searchId) => {
    try {
      setLoading(true);
      setError(null);

      await SavedSearchService.deleteSavedSearch(searchId);
      
      // Remove from local state
      setSavedSearches(prev => prev.filter(search => search.id !== searchId));
    } catch (err) {
      console.error('Error deleting saved search:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการลบการค้นหา');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search saved searches
   */
  const searchSavedSearches = useCallback(async (searchTerm) => {
    if (!user?.uid) return [];

    try {
      setLoading(true);
      setError(null);

      const results = await SavedSearchService.searchSavedSearches(user.uid, searchTerm);
      return results;
    } catch (err) {
      console.error('Error searching saved searches:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการค้นหา');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  /**
   * Duplicate a saved search
   */
  const duplicateSavedSearch = useCallback(async (searchId, newName) => {
    if (!user?.uid) {
      throw new Error('กรุณาเข้าสู่ระบบก่อน');
    }

    try {
      setLoading(true);
      setError(null);

      const newSearchId = await SavedSearchService.duplicateSavedSearch(user.uid, searchId, newName);
      
      // Reload saved searches
      await loadSavedSearches();
      
      return newSearchId;
    } catch (err) {
      console.error('Error duplicating saved search:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการคัดลอกการค้นหา');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, loadSavedSearches]);

  /**
   * Load search statistics
   */
  const loadStats = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const searchStats = await SavedSearchService.getSearchStats(user.uid);
      setStats(searchStats);
    } catch (err) {
      console.error('Error loading search stats:', err);
    }
  }, [user?.uid]);

  /**
   * Export saved searches
   */
  const exportSavedSearches = useCallback(async () => {
    if (!user?.uid) {
      throw new Error('กรุณาเข้าสู่ระบบก่อน');
    }

    try {
      setLoading(true);
      setError(null);

      const jsonData = await SavedSearchService.exportSavedSearches(user.uid);
      
      // Download as file
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `saved-searches-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting saved searches:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งออกการค้นหา');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  /**
   * Import saved searches
   */
  const importSavedSearches = useCallback(async (file) => {
    if (!user?.uid) {
      throw new Error('กรุณาเข้าสู่ระบบก่อน');
    }

    try {
      setLoading(true);
      setError(null);

      const jsonData = await file.text();
      const importedIds = await SavedSearchService.importSavedSearches(user.uid, jsonData);
      
      // Reload saved searches
      await loadSavedSearches();
      
      return importedIds;
    } catch (err) {
      console.error('Error importing saved searches:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการนำเข้าการค้นหา');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, loadSavedSearches]);

  /**
   * Get saved search by ID
   */
  const getSavedSearchById = useCallback((searchId) => {
    return savedSearches.find(search => search.id === searchId);
  }, [savedSearches]);

  /**
   * Check if search name already exists
   */
  const isSearchNameExists = useCallback((name, excludeId = null) => {
    return savedSearches.some(search => 
      search.name.toLowerCase() === name.toLowerCase() && 
      search.id !== excludeId
    );
  }, [savedSearches]);

  // Load saved searches on mount and when dependencies change
  useEffect(() => {
    loadSavedSearches();
  }, [loadSavedSearches]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    savedSearches,
    publicSearches,
    loading,
    error,
    stats,
    loadSavedSearches,
    loadPublicSearches,
    saveSearch,
    updateSavedSearch,
    deleteSavedSearch,
    searchSavedSearches,
    duplicateSavedSearch,
    exportSavedSearches,
    importSavedSearches,
    getSavedSearchById,
    isSearchNameExists
  };
};

/**
 * Custom hook for managing search bookmarks
 * @returns {Object} Bookmarks state and methods
 */
export const useSearchBookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    // Load bookmarks from localStorage
    const savedBookmarks = localStorage.getItem('searchBookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (error) {
        console.error('Error parsing bookmarks:', error);
      }
    }
  }, []);

  const addBookmark = useCallback((bookmark) => {
    const newBookmarks = [...bookmarks, { ...bookmark, id: Date.now().toString() }];
    setBookmarks(newBookmarks);
    localStorage.setItem('searchBookmarks', JSON.stringify(newBookmarks));
  }, [bookmarks]);

  const removeBookmark = useCallback((bookmarkId) => {
    const newBookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
    setBookmarks(newBookmarks);
    localStorage.setItem('searchBookmarks', JSON.stringify(newBookmarks));
  }, [bookmarks]);

  const isBookmarked = useCallback((searchId) => {
    return bookmarks.some(bookmark => bookmark.searchId === searchId);
  }, [bookmarks]);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
    localStorage.removeItem('searchBookmarks');
  }, []);

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
    clearBookmarks
  };
};