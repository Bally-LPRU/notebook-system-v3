import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook for measuring component render performance
 * @param {string} componentName - Name of the component for logging
 * @returns {Object} Performance utilities
 */
export const useRenderPerformance = (componentName) => {
  const renderStartTime = useRef(null);
  const renderCount = useRef(0);
  const [performanceData, setPerformanceData] = useState({
    renderTime: 0,
    renderCount: 0,
    averageRenderTime: 0
  });

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      const newRenderCount = renderCount.current;
      const averageRenderTime = (performanceData.averageRenderTime * (newRenderCount - 1) + renderTime) / newRenderCount;

      setPerformanceData({
        renderTime,
        renderCount: newRenderCount,
        averageRenderTime
      });

      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    }
  });

  return performanceData;
};

/**
 * Hook for measuring API call performance
 * @returns {Object} API performance utilities
 */
export const useApiPerformance = () => {
  const [apiCalls, setApiCalls] = useState([]);

  const measureApiCall = useCallback(async (apiCall, metadata = {}) => {
    const startTime = performance.now();
    const callId = Date.now().toString();

    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;

      const callData = {
        id: callId,
        duration,
        success: true,
        timestamp: new Date(),
        metadata
      };

      setApiCalls(prev => [...prev.slice(-9), callData]); // Keep last 10 calls

      // Log slow API calls
      if (duration > 1000) {
        console.warn(`Slow API call detected: ${duration.toFixed(2)}ms`, metadata);
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const callData = {
        id: callId,
        duration,
        success: false,
        error: error.message,
        timestamp: new Date(),
        metadata
      };

      setApiCalls(prev => [...prev.slice(-9), callData]);
      throw error;
    }
  }, []);

  const getAverageApiTime = useCallback(() => {
    if (apiCalls.length === 0) return 0;
    const totalTime = apiCalls.reduce((sum, call) => sum + call.duration, 0);
    return totalTime / apiCalls.length;
  }, [apiCalls]);

  const getSuccessRate = useCallback(() => {
    if (apiCalls.length === 0) return 100;
    const successfulCalls = apiCalls.filter(call => call.success).length;
    return (successfulCalls / apiCalls.length) * 100;
  }, [apiCalls]);

  return {
    measureApiCall,
    apiCalls,
    averageApiTime: getAverageApiTime(),
    successRate: getSuccessRate()
  };
};

/**
 * Hook for measuring page load performance
 * @returns {Object} Page load performance data
 */
export const usePagePerformance = () => {
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    const measurePerformance = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');

        const data = {
          // Navigation timing
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart,
          
          // Paint timing
          firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
          
          // Resource timing
          totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
          
          // Connection info
          connectionType: navigator.connection?.effectiveType || 'unknown',
          downlink: navigator.connection?.downlink || 0
        };

        setPerformanceData(data);

        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.group('Page Performance Metrics');
          console.log('DOM Content Loaded:', `${data.domContentLoaded.toFixed(2)}ms`);
          console.log('Load Complete:', `${data.loadComplete.toFixed(2)}ms`);
          console.log('First Paint:', `${data.firstPaint.toFixed(2)}ms`);
          console.log('First Contentful Paint:', `${data.firstContentfulPaint.toFixed(2)}ms`);
          console.log('Total Load Time:', `${data.totalLoadTime.toFixed(2)}ms`);
          console.log('Connection Type:', data.connectionType);
          console.groupEnd();
        }
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  return performanceData;
};

/**
 * Hook for monitoring memory usage
 * @returns {Object} Memory usage data
 */
export const useMemoryMonitor = () => {
  const [memoryData, setMemoryData] = useState(null);

  useEffect(() => {
    const updateMemoryData = () => {
      if ('memory' in performance) {
        const memory = performance.memory;
        setMemoryData({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        });
      }
    };

    updateMemoryData();
    const interval = setInterval(updateMemoryData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryData;
};

/**
 * Hook for measuring component mount/unmount performance
 * @param {string} componentName - Name of the component
 * @returns {Object} Mount performance data
 */
export const useMountPerformance = (componentName) => {
  const mountStartTime = useRef(null);
  const [mountTime, setMountTime] = useState(0);

  useEffect(() => {
    mountStartTime.current = performance.now();

    return () => {
      if (mountStartTime.current) {
        const unmountTime = performance.now() - mountStartTime.current;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`${componentName} was mounted for ${unmountTime.toFixed(2)}ms`);
        }
      }
    };
  }, [componentName]);

  useEffect(() => {
    if (mountStartTime.current) {
      const currentMountTime = performance.now() - mountStartTime.current;
      setMountTime(currentMountTime);
    }
  });

  return { mountTime };
};

/**
 * Hook for debouncing expensive operations
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} deps - Dependencies array
 * @returns {Function} Debounced function
 */
export const useDebounce = (callback, delay, deps = []) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay, ...deps]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Hook for throttling expensive operations
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @param {Array} deps - Dependencies array
 * @returns {Function} Throttled function
 */
export const useThrottle = (callback, delay, deps = []) => {
  const lastRun = useRef(Date.now());

  const throttledCallback = useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay, ...deps]);

  return throttledCallback;
};

/**
 * Hook for measuring intersection observer performance
 * @param {Object} options - Intersection observer options
 * @returns {Object} Intersection utilities
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setIntersectionRatio(entry.intersectionRatio);
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
        ...options
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [options]);

  return {
    targetRef,
    isIntersecting,
    intersectionRatio
  };
};

export default {
  useRenderPerformance,
  useApiPerformance,
  usePagePerformance,
  useMemoryMonitor,
  useMountPerformance,
  useDebounce,
  useThrottle,
  useIntersectionObserver
};