import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for detecting online/offline status and handling offline scenarios
 * @returns {Object} Online status and offline handling utilities
 */
const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineStartTime, setOfflineStartTime] = useState(null);

  // Handle online status changes
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOffline) {
      setWasOffline(false);
      setOfflineStartTime(null);
      
      // Log reconnection event
      console.log('Network connection restored');
      
      // Dispatch custom event for components to react to reconnection
      window.dispatchEvent(new CustomEvent('network-reconnected', {
        detail: { wasOffline: true }
      }));
    }
  }, [wasOffline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    setOfflineStartTime(Date.now());
    
    // Log offline event
    console.log('Network connection lost');
    
    // Dispatch custom event for components to react to offline status
    window.dispatchEvent(new CustomEvent('network-disconnected', {
      detail: { timestamp: Date.now() }
    }));
  }, []);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Calculate offline duration
  const getOfflineDuration = useCallback(() => {
    if (!offlineStartTime) return 0;
    return Date.now() - offlineStartTime;
  }, [offlineStartTime]);

  // Check if we should use cached data
  const shouldUseCachedData = useCallback(() => {
    return !isOnline || wasOffline;
  }, [isOnline, wasOffline]);

  // Get offline status message
  const getOfflineMessage = useCallback(() => {
    if (!isOnline) {
      const duration = getOfflineDuration();
      const minutes = Math.floor(duration / 60000);
      
      if (minutes > 0) {
        return `ไม่มีการเชื่อมต่ออินเทอร์เน็ต (${minutes} นาที) - แสดงข้อมูลล่าสุดที่มีอยู่`;
      } else {
        return 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต - แสดงข้อมูลล่าสุดที่มีอยู่';
      }
    }
    
    if (wasOffline) {
      return 'เชื่อมต่ออินเทอร์เน็ตแล้ว - กำลังอัปเดตข้อมูล';
    }
    
    return null;
  }, [isOnline, wasOffline, getOfflineDuration]);

  // Retry function for when connection is restored
  const retryWhenOnline = useCallback((callback) => {
    if (isOnline) {
      callback();
    } else {
      const handleReconnect = () => {
        callback();
        window.removeEventListener('network-reconnected', handleReconnect);
      };
      window.addEventListener('network-reconnected', handleReconnect);
    }
  }, [isOnline]);

  return {
    isOnline,
    wasOffline,
    offlineStartTime,
    getOfflineDuration,
    shouldUseCachedData,
    getOfflineMessage,
    retryWhenOnline
  };
};

export default useOfflineDetection;