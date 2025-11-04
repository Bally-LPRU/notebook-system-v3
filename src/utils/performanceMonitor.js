/**
 * Performance monitoring utilities for the Equipment Lending System
 * Provides lightweight performance tracking and optimization helpers
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  /**
   * Start timing a performance metric
   * @param {string} name - Metric name
   */
  startTiming(name) {
    if (!this.isEnabled) return;
    
    this.metrics.set(name, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    });
  }

  /**
   * End timing a performance metric
   * @param {string} name - Metric name
   * @returns {number} Duration in milliseconds
   */
  endTiming(name) {
    if (!this.isEnabled) return 0;
    
    const metric = this.metrics.get(name);
    if (!metric) return 0;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    this.metrics.set(name, {
      ...metric,
      endTime,
      duration
    });

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Measure component render time
   * @param {string} componentName - Component name
   * @param {Function} renderFunction - Function to measure
   */
  measureRender(componentName, renderFunction) {
    if (!this.isEnabled) return renderFunction();
    
    this.startTiming(`render_${componentName}`);
    const result = renderFunction();
    this.endTiming(`render_${componentName}`);
    
    return result;
  }

  /**
   * Monitor Core Web Vitals
   */
  monitorWebVitals() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Monitor Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          if (lastEntry.startTime > 2500) {
            console.warn(`Poor LCP: ${lastEntry.startTime.toFixed(2)}ms`);
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('LCP monitoring not supported:', error);
      }

      // Monitor First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.processingStart - entry.startTime > 100) {
              console.warn(`Poor FID: ${(entry.processingStart - entry.startTime).toFixed(2)}ms`);
            }
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (error) {
        console.warn('FID monitoring not supported:', error);
      }

      // Monitor Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          if (clsValue > 0.1) {
            console.warn(`Poor CLS: ${clsValue.toFixed(4)}`);
          }
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (error) {
        console.warn('CLS monitoring not supported:', error);
      }
    }
  }

  /**
   * Monitor memory usage
   */
  monitorMemory() {
    if (!this.isEnabled || !performance.memory) return;

    const memoryInfo = performance.memory;
    const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1048576);
    const totalMB = Math.round(memoryInfo.totalJSHeapSize / 1048576);
    const limitMB = Math.round(memoryInfo.jsHeapSizeLimit / 1048576);

    // Warn if memory usage is high
    if (usedMB > limitMB * 0.8) {
      console.warn(`High memory usage: ${usedMB}MB / ${limitMB}MB`);
    }

    return {
      used: usedMB,
      total: totalMB,
      limit: limitMB,
      percentage: Math.round((usedMB / limitMB) * 100)
    };
  }

  /**
   * Get performance metrics summary
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    const summary = {};
    
    this.metrics.forEach((metric, name) => {
      if (metric.duration !== null) {
        summary[name] = {
          duration: Math.round(metric.duration * 100) / 100,
          status: metric.duration > 1000 ? 'slow' : metric.duration > 500 ? 'moderate' : 'fast'
        };
      }
    });

    return summary;
  }

  /**
   * Clean up observers
   */
  cleanup() {
    this.observers.forEach((observer) => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting observer:', error);
      }
    });
    this.observers.clear();
    this.metrics.clear();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in production
if (typeof window !== 'undefined') {
  performanceMonitor.monitorWebVitals();
  
  // Monitor memory every 30 seconds in production
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      performanceMonitor.monitorMemory();
    }, 30000);
  }
}

export default performanceMonitor;

/**
 * React hook for performance monitoring
 */
export const usePerformanceMonitor = () => {
  const startTiming = (name) => performanceMonitor.startTiming(name);
  const endTiming = (name) => performanceMonitor.endTiming(name);
  const getMetrics = () => performanceMonitor.getMetrics();
  const monitorMemory = () => performanceMonitor.monitorMemory();

  return {
    startTiming,
    endTiming,
    getMetrics,
    monitorMemory
  };
};

/**
 * Higher-order component for performance monitoring
 */
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return function PerformanceMonitoredComponent(props) {
    return performanceMonitor.measureRender(
      componentName || WrappedComponent.name,
      () => <WrappedComponent {...props} />
    );
  };
};