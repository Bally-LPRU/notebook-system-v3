import { 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { EQUIPMENT_MANAGEMENT_STATUS } from '../types/equipmentManagement';
import { RESERVATION_STATUS } from '../types/reservation';

class StatisticsService {
  static CACHE_DURATION = 30 * 1000; // 30 seconds
  static OFFLINE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for offline cache
  static cache = {
    data: null,
    timestamp: null
  };
  static offlineCache = {
    data: null,
    timestamp: null
  };

  /**
   * Get public statistics for homepage
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Object>} Equipment statistics
   */
  static async getPublicStats(forceRefresh = false) {
    try {
      // Check if we're offline
      const isOffline = !navigator.onLine;
      
      // If offline, try to return cached data
      if (isOffline) {
        return this.getOfflineStats();
      }

      // Check cache first (unless force refresh)
      if (!forceRefresh && this.isCacheValid()) {
        return this.cache.data;
      }

      // Fetch fresh data
      const stats = await this.fetchStatistics();
      
      // Update both regular cache and offline cache
      const now = Date.now();
      this.cache = {
        data: stats,
        timestamp: now
      };
      this.offlineCache = {
        data: stats,
        timestamp: now
      };

      // Store in localStorage for persistence across sessions
      try {
        localStorage.setItem('equipmentStats', JSON.stringify({
          data: stats,
          timestamp: now
        }));
      } catch (e) {
        console.warn('Could not save stats to localStorage:', e);
      }

      return stats;
    } catch (error) {
      console.error('Error getting public stats:', error);
      
      // Try to return cached data or offline data
      return this.getFallbackStats(error);
    }
  }

  /**
   * Fetch statistics from Firestore
   * @returns {Promise<Object>} Fresh statistics data
   */
  static async fetchStatistics() {
    try {
      // Try to get pre-computed public statistics first
      const publicStats = await this.getPublicStatisticsFromCache();
      if (publicStats) {
        return publicStats;
      }

      // Fallback to computing statistics directly
      return await this.computeStatisticsDirectly();
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  /**
   * Get pre-computed public statistics from publicStats collection
   * @returns {Promise<Object|null>} Public statistics or null if not available
   */
  static async getPublicStatisticsFromCache() {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const publicStatsRef = doc(db, 'publicStats', 'equipment');
      const docSnap = await getDoc(publicStatsRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          totalEquipment: data.totalEquipment || 0,
          availableEquipment: data.availableEquipment || 0,
          borrowedEquipment: data.borrowedEquipment || 0,
          pendingReservations: data.pendingReservations || 0,
          lastUpdated: data.lastUpdated?.toDate() || new Date()
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Could not fetch public statistics cache:', error);
      return null;
    }
  }

  /**
   * Compute statistics directly from collections (fallback method)
   * @returns {Promise<Object>} Fresh statistics data
   */
  static async computeStatisticsDirectly() {
    try {
      // Fetch equipment statistics
      const equipmentStats = await this.getEquipmentStatistics();
      
      // Fetch reservation statistics
      const reservationStats = await this.getReservationStatistics();

      return {
        totalEquipment: equipmentStats.total,
        availableEquipment: equipmentStats.available,
        borrowedEquipment: equipmentStats.borrowed,
        pendingReservations: reservationStats.pending,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error computing statistics directly:', error);
      throw error;
    }
  }

  /**
   * Get equipment statistics from Firestore
   * @returns {Promise<Object>} Equipment statistics
   */
  static async getEquipmentStatistics() {
    try {
      const equipmentRef = collection(db, 'equipmentManagement');
      const querySnapshot = await getDocs(equipmentRef);
      
      const stats = {
        total: 0,
        available: 0,
        borrowed: 0,
        maintenance: 0,
        retired: 0
      };
      
      querySnapshot.forEach((doc) => {
        const equipment = doc.data();
        
        // Only count active equipment
        if (equipment.isActive !== false) {
          stats.total++;
          
          switch (equipment.status) {
            case EQUIPMENT_MANAGEMENT_STATUS.ACTIVE:
              stats.available++;
              break;
            case EQUIPMENT_MANAGEMENT_STATUS.MAINTENANCE:
              stats.maintenance++;
              break;
            case EQUIPMENT_MANAGEMENT_STATUS.RETIRED:
              stats.retired++;
              break;
            case EQUIPMENT_MANAGEMENT_STATUS.LOST:
              // Don't count lost equipment in any category
              break;
            default:
              // Handle any unknown status as available
              stats.available++;
          }
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting equipment statistics:', error);
      throw error;
    }
  }

  /**
   * Get reservation statistics from Firestore
   * @returns {Promise<Object>} Reservation statistics
   */
  static async getReservationStatistics() {
    try {
      const reservationRef = collection(db, 'reservations');
      
      // Get pending reservations
      const pendingQuery = query(
        reservationRef, 
        where('status', '==', RESERVATION_STATUS.PENDING)
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      
      return {
        pending: pendingSnapshot.size,
        total: pendingSnapshot.size // For now, only count pending
      };
    } catch (error) {
      console.error('Error getting reservation statistics:', error);
      throw error;
    }
  }

  /**
   * Check if cached data is still valid
   * @returns {boolean} True if cache is valid
   */
  static isCacheValid() {
    if (!this.cache.data || !this.cache.timestamp) {
      return false;
    }
    
    const now = Date.now();
    const cacheAge = now - this.cache.timestamp;
    
    return cacheAge < this.CACHE_DURATION;
  }

  /**
   * Check if offline cached data is still valid
   * @returns {boolean} True if offline cache is valid
   */
  static isOfflineCacheValid() {
    if (!this.offlineCache.data || !this.offlineCache.timestamp) {
      return false;
    }
    
    const now = Date.now();
    const cacheAge = now - this.offlineCache.timestamp;
    
    return cacheAge < this.OFFLINE_CACHE_DURATION;
  }

  /**
   * Get statistics when offline
   * @returns {Object} Cached statistics or default values
   */
  static getOfflineStats() {
    // Try offline cache first
    if (this.isOfflineCacheValid()) {
      return {
        ...this.offlineCache.data,
        isOffline: true,
        lastUpdated: new Date(this.offlineCache.timestamp)
      };
    }

    // Try regular cache
    if (this.cache.data) {
      return {
        ...this.cache.data,
        isOffline: true,
        lastUpdated: new Date(this.cache.timestamp)
      };
    }

    // Try localStorage
    try {
      const stored = localStorage.getItem('equipmentStats');
      if (stored) {
        const parsed = JSON.parse(stored);
        const cacheAge = Date.now() - parsed.timestamp;
        
        // Use stored data even if old when offline
        if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours max
          return {
            ...parsed.data,
            isOffline: true,
            lastUpdated: new Date(parsed.timestamp)
          };
        }
      }
    } catch (e) {
      console.warn('Could not read stats from localStorage:', e);
    }

    // Return default stats with offline flag
    return {
      ...this.getDefaultStats(),
      isOffline: true
    };
  }

  /**
   * Get fallback statistics when there's an error
   * @param {Error} error - The error that occurred
   * @returns {Object} Fallback statistics
   */
  static getFallbackStats(error) {
    const errorType = this.categorizeError(error);
    
    // If we have any cached data, return it with appropriate flags
    if (this.cache.data) {
      return {
        ...this.cache.data,
        hasError: true,
        errorMessage: this.getErrorMessage(error, errorType),
        errorType: errorType,
        dataSource: 'cache',
        degradedMode: true
      };
    }

    if (this.offlineCache.data) {
      return {
        ...this.offlineCache.data,
        hasError: true,
        errorMessage: this.getErrorMessage(error, errorType),
        errorType: errorType,
        dataSource: 'offline_cache',
        degradedMode: true
      };
    }

    // Try localStorage with age validation
    try {
      const stored = localStorage.getItem('equipmentStats');
      if (stored) {
        const parsed = JSON.parse(stored);
        const dataAge = Date.now() - parsed.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (dataAge < maxAge) {
          return {
            ...parsed.data,
            hasError: true,
            errorMessage: this.getErrorMessage(error, errorType),
            errorType: errorType,
            lastUpdated: new Date(parsed.timestamp),
            dataSource: 'localStorage',
            dataAge: dataAge,
            degradedMode: true
          };
        }
      }
    } catch (e) {
      console.warn('Could not read stats from localStorage:', e);
    }

    // Return default stats with comprehensive error information
    return {
      ...this.getDefaultStats(),
      hasError: true,
      errorMessage: this.getErrorMessage(error, errorType),
      errorType: errorType,
      dataSource: 'default',
      degradedMode: true,
      noDataAvailable: true
    };
  }

  /**
   * Categorize error types for better handling
   * @param {Error} error - The error that occurred
   * @returns {string} Error category
   */
  static categorizeError(error) {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || '';

    if (errorCode === 'unavailable' || errorMessage.includes('network')) {
      return 'network';
    }
    
    if (errorCode.startsWith('firestore/')) {
      return 'firestore';
    }
    
    if (errorMessage.includes('permission') || errorCode === 'permission-denied') {
      return 'permission';
    }
    
    if (errorMessage.includes('quota') || errorCode === 'resource-exhausted') {
      return 'quota';
    }
    
    return 'unknown';
  }

  /**
   * Get user-friendly error message based on error type
   * @param {Error} error - The error that occurred
   * @param {string} errorType - Categorized error type
   * @returns {string} User-friendly error message
   */
  static getErrorMessage(error, errorType) {
    const errorMessages = {
      network: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ แสดงข้อมูลล่าสุดที่มีอยู่',
      firestore: 'เกิดปัญหาในการเชื่อมต่อฐานข้อมูล แสดงข้อมูลล่าสุดที่มีอยู่',
      permission: 'ไม่มีสิทธิ์เข้าถึงข้อมูล แสดงข้อมูลล่าสุดที่มีอยู่',
      quota: 'ระบบใช้งานหนักเกินไป กรุณาลองใหม่ในภายหลัง',
      unknown: 'เกิดข้อผิดพลาดในการโหลดข้อมูล แสดงข้อมูลล่าสุดที่มีอยู่'
    };

    return errorMessages[errorType] || errorMessages.unknown;
  }

  /**
   * Get default statistics when data is unavailable
   * @returns {Object} Default statistics
   */
  static getDefaultStats() {
    return {
      totalEquipment: 0,
      availableEquipment: 0,
      borrowedEquipment: 0,
      pendingReservations: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  static clearCache() {
    this.cache = {
      data: null,
      timestamp: null
    };
    this.offlineCache = {
      data: null,
      timestamp: null
    };
    
    // Clear localStorage cache
    try {
      localStorage.removeItem('equipmentStats');
    } catch (e) {
      console.warn('Could not clear stats from localStorage:', e);
    }
  }

  /**
   * Subscribe to real-time statistics updates
   * @param {Function} callback - Callback function to receive updates
   * @returns {Function} Unsubscribe function
   */
  static subscribeToStats(callback) {
    // For now, we'll use polling instead of real-time listeners
    // to avoid overwhelming the database with listeners from public users
    
    let intervalId = null;
    let isActive = true;

    const pollStats = async () => {
      if (!isActive) return;
      
      try {
        const stats = await this.getPublicStats();
        if (isActive) {
          callback(stats);
        }
      } catch (error) {
        console.error('Error polling statistics:', error);
        if (isActive) {
          callback(this.getDefaultStats());
        }
      }
    };

    // Initial fetch
    pollStats();

    // Set up polling every 30 seconds
    intervalId = setInterval(pollStats, 30000);

    // Return unsubscribe function
    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }

  /**
   * Get detailed statistics for admin dashboard
   * @returns {Promise<Object>} Detailed statistics
   */
  static async getDetailedStats() {
    try {
      const equipmentStats = await this.getEquipmentStatistics();
      const reservationStats = await this.getReservationStatistics();

      return {
        equipment: equipmentStats,
        reservations: reservationStats,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting detailed stats:', error);
      throw error;
    }
  }
}

export default StatisticsService;