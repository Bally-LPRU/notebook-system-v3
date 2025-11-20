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
  const defaultLimit = settings?.defaultCategoryLimit || 3;

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
        setCategoryLimits(fetchedCategoryLimits);
        setLoading(false);

        // Set up real-time listener
        const categoryLimitsRef = collection(db, 'categoryLimits');
        
        unsubscribe = onSnapshot(
          categoryLimitsRef,
          (snapshot) => {
            const updatedCategoryLimits = [];
            snapshot.forEach((doc) => {
              updatedCategoryLimits.push({
                id: doc.id,
                ...doc.data(),
                updatedAt: doc.data().updatedAt?.toDate()
              });
            });
            setCategoryLimits(updatedCategoryLimits);
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
  }, []);

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
    if (!categoryId || typeof categoryId !== 'string') {
      console.warn('Invalid category ID provided to getCategoryLimit');
      return defaultLimit;
    }

    // Find the specific category limit
    const categoryLimit = categoryLimits.find(cl => cl.categoryId === categoryId);
    
    // Return specific limit if found, otherwise return default
    if (categoryLimit && typeof categoryLimit.limit === 'number') {
      return categoryLimit.limit;
    }
    
    return defaultLimit;
  }, [categoryLimits, defaultLimit]);

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
      setCategoryLimits(fetchedCategoryLimits);
      
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing category limits:', err);
      setError(err);
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    categoryLimits,
    getCategoryLimit,
    loading,
    error,
    refresh,
    defaultLimit
  };
};

export default useCategoryLimits;
