/**
 * useCategoryLimits Hook
 * Custom hook for accessing and managing category limits
 * Based on admin-settings-system design document
 * 
 * Requirements: 6.2, 6.6
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import settingsService from '../services/settingsService';
import { useSettings } from './useSettings';
import { DEFAULT_SETTINGS } from '../types/settings';

const sanitizeLimitValue = (value) => {
  if (typeof value !== 'number') {
    return null;
  }
  if (!Number.isInteger(value)) {
    return null;
  }
  return value > 0 ? value : null;
};

const sanitizeCategoryLimit = (entry, fallbackLimit) => {
  if (!entry) {
    return null;
  }

  const normalizedId = typeof entry.categoryId === 'string'
    ? entry.categoryId.trim()
    : (typeof entry.id === 'string' ? entry.id.trim() : '');

  const normalizedName = typeof entry.categoryName === 'string' && entry.categoryName.trim().length > 0
    ? entry.categoryName
    : 'Unspecified category';

  const resolvedLimit = sanitizeLimitValue(entry.limit) ?? fallbackLimit;

  return {
    id: entry.id || normalizedId || `category-${Math.random().toString(36).slice(2)}`,
    categoryId: normalizedId,
    categoryName: normalizedName,
    limit: resolvedLimit,
    updatedAt: entry.updatedAt instanceof Date
      ? entry.updatedAt
      : entry.updatedAt?.toDate?.() ?? null,
    updatedBy: entry.updatedBy || 'system'
  };
};

/**
 * Hook to access category limits with real-time updates
 * 
 * Provides access to category limits data and utilities for retrieving limits.
 * Includes real-time Firestore listener for automatic updates and fallback to default limit.
 * 
 * **Features:**
 * - Real-time updates of category limits
 * - Utility function to get category limit with default fallback
 * - Loading and error states
 * - Automatic cleanup on unmount
 * 
 * **Usage:**
 * ```jsx
 * function CategoryLimitChecker() {
 *   const { categoryLimits, getCategoryLimit, loading, error } = useCategoryLimits();
 *   
 *   const checkLimit = (categoryId) => {
 *     const limit = getCategoryLimit(categoryId);
 *     console.log(`Category ${categoryId} limit: ${limit}`);
 *   };
 *   
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return (
 *     <div>
 *       <h3>Category Limits:</h3>
 *       <ul>
 *         {categoryLimits.map(cl => (
 *           <li key={cl.id}>{cl.categoryName}: {cl.limit} items</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @hook
 * @returns {Object} Category limits data and utilities
 * @returns {Array<Object>} returns.categoryLimits - Array of category limit objects
 * @returns {Function} returns.getCategoryLimit - Function to get category limit with default fallback
 * @returns {boolean} returns.loading - Loading state
 * @returns {Error|null} returns.error - Error object if loading failed
 * @returns {Function} returns.refresh - Manually refresh category limits
 */
export const useCategoryLimits = () => {
  const [categoryLimits, setCategoryLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get default category limit from settings
  const { settings } = useSettings();
  const [resolvedDefaultLimit, setResolvedDefaultLimit] = useState(() => {
    return sanitizeLimitValue(settings?.defaultCategoryLimit) ?? DEFAULT_SETTINGS.defaultCategoryLimit;
  });

  useEffect(() => {
    const contextLimit = sanitizeLimitValue(settings?.defaultCategoryLimit);
    if (contextLimit !== null) {
      setResolvedDefaultLimit(contextLimit);
      return undefined;
    }

    let cancelled = false;

    const resolveDefaultLimit = async () => {
      try {
        const latestSettings = await settingsService.getSettings();
        if (!cancelled) {
          const fallback = sanitizeLimitValue(latestSettings?.defaultCategoryLimit);
          if (fallback !== null) {
            setResolvedDefaultLimit(fallback);
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'test') {
          console.warn('useCategoryLimits: unable to resolve default limit from settingsService', err);
        }
      }
    };

    resolveDefaultLimit();

    return () => {
      cancelled = true;
    };
  }, [settings?.defaultCategoryLimit]);

  /**
   * Initialize category limits and set up real-time listener
   */
  useEffect(() => {
    let unsubscribe = null;

    const initializeCategoryLimits = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch initial data
        const fetchedCategoryLimits = await settingsService.getAllCategoryLimits();
        setCategoryLimits(
          fetchedCategoryLimits
            .map((limit) => sanitizeCategoryLimit(limit, resolvedDefaultLimit))
            .filter(Boolean)
        );
        setLoading(false);

        // Set up real-time listener
        const categoryLimitsRef = collection(db, 'categoryLimits');
        
        unsubscribe = onSnapshot(
          categoryLimitsRef,
          (snapshot) => {
            const updatedCategoryLimits = [];
            snapshot.forEach((doc) => {
              updatedCategoryLimits.push(
                sanitizeCategoryLimit(
                  {
                    id: doc.id,
                    ...doc.data(),
                    updatedAt: doc.data().updatedAt
                  },
                  resolvedDefaultLimit
                )
              );
            });
            setCategoryLimits(updatedCategoryLimits.filter(Boolean));
          },
          (err) => {
            console.error('Error in category limits listener:', err);
            setError(err);
          }
        );
      } catch (err) {
        console.error('Error initializing category limits:', err);
        setError(err);
        setLoading(false);
      }
    };

    initializeCategoryLimits();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [resolvedDefaultLimit]);

  /**
   * Get category limit with default fallback
   * 
   * Returns the specific limit for a category if set, otherwise returns the default system-wide limit.
   * This ensures that all categories have a limit even if not explicitly configured.
   * 
   * @param {string} categoryId - Category ID to get limit for
   * @returns {number} Category limit (specific or default)
   */
  const getCategoryLimit = useCallback((categoryId) => {
    const normalizedId = typeof categoryId === 'string' ? categoryId.trim() : '';
    if (!normalizedId) {
      return resolvedDefaultLimit;
    }

    const categoryLimit = categoryLimits.find(cl => cl.categoryId === normalizedId);
    if (categoryLimit && sanitizeLimitValue(categoryLimit.limit) !== null) {
      return categoryLimit.limit;
    }

    return resolvedDefaultLimit;
  }, [categoryLimits, resolvedDefaultLimit]);

  /**
   * Manually refresh category limits from Firestore
   * 
   * @returns {Promise<void>}
   */
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedCategoryLimits = await settingsService.getAllCategoryLimits();
      setCategoryLimits(
        fetchedCategoryLimits
          .map((limit) => sanitizeCategoryLimit(limit, resolvedDefaultLimit))
          .filter(Boolean)
      );
      
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing category limits:', err);
      setError(err);
      setLoading(false);
      throw err;
    }
  }, [resolvedDefaultLimit]);

  return {
    categoryLimits,
    getCategoryLimit,
    loading,
    error,
    refresh,
    defaultLimit: resolvedDefaultLimit
  };
};

export default useCategoryLimits;
