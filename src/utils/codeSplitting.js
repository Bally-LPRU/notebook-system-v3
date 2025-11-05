/**
 * Code Splitting Utilities - ยูทิลิตี้สำหรับ code splitting และ lazy loading
 */

import React, { Suspense, lazy } from 'react';
import { SkeletonCard } from '../components/common/SkeletonLoader';

/**
 * Create lazy component with error boundary
 * @param {Function} importFunc - Dynamic import function
 * @param {Object} options - Options for lazy loading
 * @returns {React.Component} Lazy component with error boundary
 */
export const createLazyComponent = (importFunc, options = {}) => {
  const {
    fallback = <SkeletonCard />,
    errorFallback = <div className="p-4 text-red-500">เกิดข้อผิดพลาดในการโหลดคอมโพเนนต์</div>,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  const LazyComponent = lazy(() => {
    return retryImport(importFunc, retryCount, retryDelay);
  });

  return React.forwardRef((props, ref) => (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  ));
};

/**
 * Retry import with exponential backoff
 * @param {Function} importFunc - Import function
 * @param {number} retryCount - Number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Import promise
 */
const retryImport = async (importFunc, retryCount, baseDelay) => {
  for (let i = 0; i <= retryCount; i++) {
    try {
      return await importFunc();
    } catch (error) {
      if (i === retryCount) {
        throw error;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Error Boundary for lazy components
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

/**
 * Preload component for better UX
 * @param {Function} importFunc - Import function
 * @returns {Promise} Preload promise
 */
export const preloadComponent = (importFunc) => {
  return importFunc();
};

/**
 * Route-based code splitting helper
 * @param {Array} routes - Routes configuration
 * @returns {Array} Routes with lazy components
 */
export const createLazyRoutes = (routes) => {
  return routes.map(route => ({
    ...route,
    component: route.component ? createLazyComponent(route.component) : undefined
  }));
};

/**
 * Bundle analyzer helper
 */
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    const chunks = [];
    
    // Get all loaded chunks
    if (window.__webpack_require__ && window.__webpack_require__.cache) {
      Object.keys(window.__webpack_require__.cache).forEach(moduleId => {
        const module = window.__webpack_require__.cache[moduleId];
        if (module && module.exports) {
          chunks.push({
            id: moduleId,
            size: JSON.stringify(module.exports).length
          });
        }
      });
    }
    
    console.table(chunks.sort((a, b) => b.size - a.size).slice(0, 20));
  }
};

/**
 * Lazy load equipment components
 */
export const LazyEquipmentComponents = {
  // Main containers
  EquipmentManagementContainer: createLazyComponent(
    () => import('../components/equipment/EquipmentManagementContainer'),
    { fallback: <div className="p-4">กำลังโหลดระบบจัดการอุปกรณ์...</div> }
  ),
  
  // Forms
  EquipmentManagementForm: createLazyComponent(
    () => import('../components/equipment/EquipmentManagementForm'),
    { fallback: <div className="p-4">กำลังโหลดฟอร์มอุปกรณ์...</div> }
  ),
  
  // Detail views
  EquipmentDetailView: createLazyComponent(
    () => import('../components/equipment/EquipmentDetailView'),
    { fallback: <div className="p-4">กำลังโหลดรายละเอียดอุปกรณ์...</div> }
  ),
  
  // Search and filters
  AdvancedSearchModal: createLazyComponent(
    () => import('../components/equipment/AdvancedSearchModal'),
    { fallback: <div className="p-4">กำลังโหลดการค้นหาขั้นสูง...</div> }
  ),
  
  // Bulk operations
  BulkOperationsContainer: createLazyComponent(
    () => import('../components/equipment/BulkOperationsContainer'),
    { fallback: <div className="p-4">กำลังโหลดการจัดการแบบกลุ่ม...</div> }
  ),
  
  // Export and reports
  ExportReportContainer: createLazyComponent(
    () => import('../components/equipment/ExportReportContainer'),
    { fallback: <div className="p-4">กำลังโหลดระบบรายงาน...</div> }
  ),
  
  // QR Code system
  QRCodeGenerator: createLazyComponent(
    () => import('../components/equipment/QRCodeGenerator'),
    { fallback: <div className="p-4">กำลังโหลดระบบ QR Code...</div> }
  ),
  
  // Audit system
  AuditDashboard: createLazyComponent(
    () => import('../components/audit/AuditDashboard'),
    { fallback: <div className="p-4">กำลังโหลดระบบตรวจสอบ...</div> }
  )
};

/**
 * Preload critical components
 */
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  const criticalComponents = [
    () => import('../components/equipment/EquipmentGrid'),
    () => import('../components/equipment/EquipmentCard'),
    () => import('../components/equipment/EquipmentSearch'),
    () => import('../components/equipment/EquipmentFilters')
  ];

  return Promise.all(criticalComponents.map(preloadComponent));
};

/**
 * Intersection Observer for lazy loading components
 */
export const useLazyComponentLoading = (ref, importFunc, options = {}) => {
  const [Component, setComponent] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !Component && !isLoading) {
            setIsLoading(true);
            importFunc()
              .then((module) => {
                setComponent(() => module.default || module);
                setIsLoading(false);
              })
              .catch((err) => {
                setError(err);
                setIsLoading(false);
              });
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: options.rootMargin || '100px',
        threshold: options.threshold || 0.1
      }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, importFunc, Component, isLoading, options.rootMargin, options.threshold]);

  return { Component, isLoading, error };
};

export default {
  createLazyComponent,
  preloadComponent,
  createLazyRoutes,
  analyzeBundleSize,
  LazyEquipmentComponents,
  preloadCriticalComponents,
  useLazyComponentLoading
};