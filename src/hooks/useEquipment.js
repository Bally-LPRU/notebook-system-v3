import { useState, useEffect, useCallback } from 'react';
import EquipmentService from '../services/equipmentService';
import DevelopmentService from '../services/developmentService';
import { EQUIPMENT_PAGINATION } from '../types/equipment';

/**
 * Custom hook for equipment management
 * @param {Object} options - Hook options
 * @param {Object} options.filters - Initial filter parameters
 * @param {boolean} options.skipInitialLoad - Skip initial data load (for lazy loading)
 * @param {number} options.limit - Items per page
 * @returns {Object} Equipment state and methods
 */
export const useEquipment = (options = {}) => {
  // Support both old format (initialFilters) and new format (options object)
  const initialFilters = options.filters || options;
  const skipInitialLoad = options.skipInitialLoad || false;
  const limit = options.limit || EQUIPMENT_PAGINATION.DEFAULT_LIMIT;

  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: EQUIPMENT_PAGINATION.DEFAULT_PAGE,
    hasNextPage: false,
    totalItems: 0,
    limit: limit
  });
  const [filters, setFilters] = useState(initialFilters);
  const [lastDoc, setLastDoc] = useState(null);
  const [initialized, setInitialized] = useState(false);

  /**
   * Load equipment list
   */
  const loadEquipment = useCallback(async (resetPagination = false) => {
    try {
      setLoading(true);
      setError(null);

      const queryFilters = {
        ...filters,
        lastDoc: resetPagination ? null : lastDoc
      };

      console.log('Loading equipment with filters:', queryFilters);

      // Try development service first
      let result = await DevelopmentService.getEquipmentList(queryFilters);
      
      // Fallback to Firebase service
      if (!result) {
        console.log('Using Firebase service...');
        result = await EquipmentService.getEquipmentList(queryFilters);
      }
      
      console.log('Equipment loaded:', result);
      
      if (resetPagination) {
        setEquipment(result.equipment);
        setLastDoc(result.lastDoc);
      } else {
        setEquipment(prev => [...prev, ...result.equipment]);
        setLastDoc(result.lastDoc);
      }
      
      setPagination(result.pagination);
    } catch (err) {
      console.error('Error loading equipment:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลอุปกรณ์');
    } finally {
      setLoading(false);
    }
  }, [filters, lastDoc]);

  /**
   * Refresh equipment list
   */
  const refreshEquipment = useCallback(() => {
    setLastDoc(null);
    loadEquipment(true);
  }, [loadEquipment]);

  /**
   * Load more equipment (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loading && pagination.hasNextPage) {
      loadEquipment(false);
    }
  }, [loading, pagination.hasNextPage, loadEquipment]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setLastDoc(null);
  }, []);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setLastDoc(null);
  }, [initialFilters]);

  /**
   * Add new equipment to list
   */
  const addEquipment = useCallback((newEquipment) => {
    setEquipment(prev => [newEquipment, ...prev]);
  }, []);

  /**
   * Update equipment in list
   */
  const updateEquipment = useCallback((equipmentId, updatedData) => {
    setEquipment(prev => 
      prev.map(item => 
        item.id === equipmentId 
          ? { ...item, ...updatedData }
          : item
      )
    );
  }, []);

  /**
   * Remove equipment from list
   */
  const removeEquipment = useCallback((equipmentId) => {
    setEquipment(prev => prev.filter(item => item.id !== equipmentId));
  }, []);

  // Load equipment on mount and when filters change
  useEffect(() => {
    // Skip initial load if skipInitialLoad is true and not yet initialized
    if (skipInitialLoad && !initialized) {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const queryFilters = {
          ...filters,
          lastDoc: null
        };

        console.log('Loading equipment with filters:', queryFilters);

        // Try development service first
        let result = await DevelopmentService.getEquipmentList(queryFilters);
        
        // Fallback to Firebase service
        if (!result) {
          console.log('Using Firebase service...');
          result = await EquipmentService.getEquipmentList(queryFilters);
        }
        
        console.log('Equipment loaded:', result);
        
        setEquipment(result.equipment);
        setLastDoc(result.lastDoc);
        setPagination(result.pagination);
      } catch (err) {
        console.error('Error loading equipment:', err);
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลอุปกรณ์');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters, skipInitialLoad, initialized]);

  /**
   * Trigger initial load (for lazy loading mode)
   */
  const triggerLoad = useCallback(() => {
    setInitialized(true);
  }, []);

  return {
    equipment,
    loading,
    error,
    pagination,
    filters,
    initialized,
    loadEquipment,
    refreshEquipment,
    loadMore,
    updateFilters,
    resetFilters,
    addEquipment,
    updateEquipment,
    removeEquipment,
    triggerLoad
  };
};

/**
 * Custom hook for single equipment management
 * @param {string} equipmentId - Equipment ID
 * @returns {Object} Equipment state and methods
 */
export const useEquipmentDetail = (equipmentId) => {
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load equipment details
   */
  const loadEquipmentDetail = useCallback(async () => {
    if (!equipmentId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await EquipmentService.getEquipmentById(equipmentId);
      setEquipment(result);
    } catch (err) {
      console.error('Error loading equipment detail:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลอุปกรณ์');
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  /**
   * Update equipment data
   */
  const updateEquipmentDetail = useCallback((updatedData) => {
    setEquipment(prev => prev ? { ...prev, ...updatedData } : null);
  }, []);

  // Load equipment detail when ID changes
  useEffect(() => {
    loadEquipmentDetail();
  }, [loadEquipmentDetail]);

  return {
    equipment,
    loading,
    error,
    loadEquipmentDetail,
    updateEquipmentDetail
  };
};

/**
 * Custom hook for equipment statistics
 * @returns {Object} Statistics state and methods
 */
export const useEquipmentStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    borrowed: 0,
    maintenance: 0,
    retired: 0,
    byCategory: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load equipment statistics
   */
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await EquipmentService.getEquipmentStats();
      setStats(result);
    } catch (err) {
      console.error('Error loading equipment stats:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดสถิติอุปกรณ์');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats
  };
};

/**
 * Custom hook for equipment search
 * @returns {Object} Search state and methods
 */
export const useEquipmentSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Search equipment
   */
  const searchEquipment = useCallback(async (term, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      setSearchTerm(term);

      if (!term || term.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      const results = await EquipmentService.searchEquipment(term, limit);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching equipment:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการค้นหาอุปกรณ์');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchTerm('');
    setError(null);
  }, []);

  return {
    searchResults,
    loading,
    error,
    searchTerm,
    searchEquipment,
    clearSearch
  };
};