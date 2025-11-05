/**
 * useCache Hook - React hook สำหรับใช้งาน CacheService
 */

import { useState, useEffect, useCallback } from 'react';
import CacheService from '../services/cacheService';

export const useCache = () => {
  const [cacheStats, setCacheStats] = useState(CacheService.getCacheStats());

  // Update cache stats
  const updateStats = useCallback(() => {
    setCacheStats(CacheService.getCacheStats());
  }, []);

  // Equipment caching
  const getCachedEquipment = useCallback((equipmentId) => {
    return CacheService.getCachedEquipment(equipmentId);
  }, []);

  const setCachedEquipment = useCallback((equipmentId, equipment) => {
    CacheService.setCachedEquipment(equipmentId, equipment);
    updateStats();
  }, [updateStats]);

  const invalidateEquipmentCache = useCallback((equipmentId) => {
    CacheService.invalidateEquipmentCache(equipmentId);
    updateStats();
  }, [updateStats]);

  // Equipment list caching
  const getCachedEquipmentList = useCallback((filters, page) => {
    return CacheService.getCachedEquipmentList(filters, page);
  }, []);

  const setCachedEquipmentList = useCallback((filters, page, equipmentList) => {
    CacheService.setCachedEquipmentList(filters, page, equipmentList);
    updateStats();
  }, [updateStats]);

  // Search results caching
  const getCachedSearchResults = useCallback((query, filters) => {
    return CacheService.getCachedSearchResults(query, filters);
  }, []);

  const setCachedSearchResults = useCallback((query, filters, results) => {
    CacheService.setCachedSearchResults(query, filters, results);
    updateStats();
  }, [updateStats]);

  const invalidateSearchCache = useCallback(() => {
    CacheService.invalidateSearchCache();
    updateStats();
  }, [updateStats]);

  // Category caching
  const getCachedCategories = useCallback(() => {
    return CacheService.getCachedCategories();
  }, []);

  const setCachedCategories = useCallback((categories) => {
    CacheService.setCachedCategories(categories);
    updateStats();
  }, [updateStats]);

  // Filter options caching
  const getCachedFilterOptions = useCallback((filterType) => {
    return CacheService.getCachedFilterOptions(filterType);
  }, []);

  const setCachedFilterOptions = useCallback((filterType, options) => {
    CacheService.setCachedFilterOptions(filterType, options);
    updateStats();
  }, [updateStats]);

  // Cache management
  const clearAllCache = useCallback(() => {
    CacheService.clearAllCache();
    updateStats();
  }, [updateStats]);

  const clearExpiredCache = useCallback(() => {
    CacheService.clearExpiredCache();
    updateStats();
  }, [updateStats]);

  const getMemoryUsage = useCallback(() => {
    return CacheService.getMemoryUsage();
  }, []);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  return {
    // Stats
    cacheStats,
    getMemoryUsage,
    
    // Equipment caching
    getCachedEquipment,
    setCachedEquipment,
    invalidateEquipmentCache,
    
    // Equipment list caching
    getCachedEquipmentList,
    setCachedEquipmentList,
    
    // Search caching
    getCachedSearchResults,
    setCachedSearchResults,
    invalidateSearchCache,
    
    // Category caching
    getCachedCategories,
    setCachedCategories,
    
    // Filter options caching
    getCachedFilterOptions,
    setCachedFilterOptions,
    
    // Cache management
    clearAllCache,
    clearExpiredCache,
    updateStats
  };
};

export default useCache;