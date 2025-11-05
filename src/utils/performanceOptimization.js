/**
 * Performance Optimization Utilities
 * ยูทิลิตี้สำหรับปรับปรุงประสิทธิภาพ
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Debounce hook for performance optimization
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} Debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttle hook for performance optimization
 * @param {Function} callback - Callback function
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

/**
 * Virtual scrolling hook for large lists
 * @param {Array} items - Items array
 * @param {number} itemHeight - Height of each item
 * @param {number} containerHeight - Height of container
 * @returns {Object} Virtual scrolling data
 */
export const useVirtualScrolling = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);
  
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index
    }));
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

/**
 * Intersection Observer hook for lazy loading
 * @param {Object} options - Intersection Observer options
 * @returns {Array} [ref, isIntersecting]
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        rootMargin: '0px',
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(ref);

    return () => {
      if (ref) {
        observer.unobserve(ref);
      }
    };
  }, [ref, options]);

  return [setRef, isIntersecting];
};

/**
 * Memory usage monitoring
 */
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo({
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          usedPercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

/**
 * Performance metrics collector
 */
export class PerformanceMetrics {
  static metrics = new Map();
  static observers = [];

  static startMeasure(name) {
    performance.mark(`${name}-start`);
  }

  static endMeasure(name) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    this.metrics.set(name, {
      duration: measure.duration,
      timestamp: Date.now()
    });

    // Clean up marks
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);

    return measure.duration;
  }

  static getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  static clearMetrics() {
    this.metrics.clear();
  }

  static observePerformance() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            console.log('Navigation timing:', {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              totalTime: entry.loadEventEnd - entry.fetchStart
            });
          }
          
          if (entry.entryType === 'paint') {
            console.log(`${entry.name}:`, entry.startTime);
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
      this.observers.push(observer);
    }
  }

  static disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Bundle size analyzer
 */
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    const getResourceSizes = () => {
      const resources = performance.getEntriesByType('resource');
      const sizes = resources.map(resource => ({
        name: resource.name.split('/').pop(),
        size: resource.transferSize || resource.encodedBodySize || 0,
        type: resource.initiatorType
      }));

      return sizes.sort((a, b) => b.size - a.size);
    };

    console.table(getResourceSizes().slice(0, 20));
  }
};

/**
 * Image optimization utilities
 */
export const ImageOptimization = {
  // Generate responsive image sizes
  generateSrcSet: (baseUrl, sizes = [320, 640, 960, 1280, 1920]) => {
    return sizes.map(size => `${baseUrl}?w=${size} ${size}w`).join(', ');
  },

  // Generate sizes attribute
  generateSizes: (breakpoints = [
    { minWidth: '1280px', size: '1280px' },
    { minWidth: '960px', size: '960px' },
    { minWidth: '640px', size: '640px' },
    { minWidth: '320px', size: '320px' }
  ]) => {
    return breakpoints
      .map(bp => `(min-width: ${bp.minWidth}) ${bp.size}`)
      .join(', ') + ', 100vw';
  },

  // Preload critical images
  preloadImage: (src, as = 'image') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.href = src;
    document.head.appendChild(link);
  },

  // Lazy load images with Intersection Observer
  lazyLoadImages: (selector = 'img[data-src]') => {
    const images = document.querySelectorAll(selector);
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers without Intersection Observer
      images.forEach(img => {
        img.src = img.dataset.src;
        img.classList.remove('lazy');
      });
    }
  }
};

/**
 * Component performance wrapper
 */
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return React.forwardRef((props, ref) => {
    useEffect(() => {
      PerformanceMetrics.startMeasure(`${componentName}-render`);
      
      return () => {
        PerformanceMetrics.endMeasure(`${componentName}-render`);
      };
    });

    return <WrappedComponent {...props} ref={ref} />;
  });
};

/**
 * Memoization utilities
 */
export const memoizeWithExpiry = (fn, ttl = 300000) => { // 5 minutes default
  const cache = new Map();
  
  return (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }
    
    const result = fn(...args);
    cache.set(key, {
      value: result,
      timestamp: Date.now()
    });
    
    return result;
  };
};

/**
 * Tree shaking helper
 */
export const optimizeImports = {
  // Import only what you need from lodash
  debounce: () => import('lodash/debounce'),
  throttle: () => import('lodash/throttle'),
  
  // Import specific date-fns functions
  formatDate: () => import('date-fns/format'),
  parseDate: () => import('date-fns/parse'),
  
  // Import specific chart components
  LineChart: () => import('recharts').then(module => ({ LineChart: module.LineChart })),
  BarChart: () => import('recharts').then(module => ({ BarChart: module.BarChart }))
};

export default {
  useDebounce,
  useThrottle,
  useVirtualScrolling,
  useIntersectionObserver,
  useMemoryMonitor,
  PerformanceMetrics,
  analyzeBundleSize,
  ImageOptimization,
  withPerformanceMonitoring,
  memoizeWithExpiry,
  optimizeImports
};