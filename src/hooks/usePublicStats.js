import { useState, useEffect, useCallback } from 'react';
import StatisticsService from '../services/statisticsService';
import useOfflineDetection from './useOfflineDetection';

/**
 * Custom hook for managing public statistics data
 * @returns {Object} Statistics data and loading state
 */
const usePublicStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isOnline, wasOffline, getOfflineMessage, retryWhenOnline } = useOfflineDetection();

  /**
   * Load statistics data
   */
  const loadStats = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await StatisticsService.getPublicStats(forceRefresh);
      setStats(data);
      
      // Clear error if data loaded successfully
      if (data && !data.hasError) {
        setError(null);
      } else if (data?.hasError) {
        setError(data.errorMessage || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
      
      // Get enhanced fallback stats with error information
      const fallbackStats = StatisticsService.getFallbackStats(err);
      setStats(fallbackStats);
      
      // Set appropriate error message
      const errorMessage = fallbackStats.errorMessage || err.message || 'ไม่สามารถโหลดข้อมูลสถิติได้';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh statistics data
   */
  const refreshStats = useCallback(async () => {
    if (!isOnline) {
      // If offline, just reload from cache
      await loadStats();
      return;
    }
    
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Clear cache to force fresh data
      StatisticsService.clearCache();
      await loadStats(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadStats, isOnline]);

  // Load initial data
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Handle network reconnection
  useEffect(() => {
    const handleReconnect = () => {
      if (wasOffline) {
        // Refresh data when coming back online
        refreshStats();
      }
    };

    window.addEventListener('network-reconnected', handleReconnect);
    return () => {
      window.removeEventListener('network-reconnected', handleReconnect);
    };
  }, [wasOffline, refreshStats]);

  // Set up real-time updates (optional, only when online)
  useEffect(() => {
    let unsubscribe = null;

    // Only set up real-time updates if online and initial load was successful
    if (isOnline && stats && !error && !stats.hasError) {
      unsubscribe = StatisticsService.subscribeToStats((updatedStats) => {
        setStats(updatedStats);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [stats, error, isOnline]);

  // Get enhanced error message that includes offline status
  const getEnhancedError = useCallback(() => {
    const offlineMessage = getOfflineMessage();
    
    if (offlineMessage && !error) {
      return offlineMessage;
    }
    
    if (offlineMessage && error) {
      return `${error} (${offlineMessage})`;
    }
    
    return error;
  }, [error, getOfflineMessage]);

  return {
    stats,
    loading,
    error: getEnhancedError(),
    isRefreshing,
    isOnline,
    wasOffline,
    refreshStats,
    retryWhenOnline
  };
};

export default usePublicStats;