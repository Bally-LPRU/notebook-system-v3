/**
 * useClosedDates Hook
 * Custom hook for accessing and managing closed dates
 * Based on admin-settings-system design document
 * 
 * Requirements: 2.2, 2.3, 2.4
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import settingsService from '../services/settingsService';

/**
 * Hook to access closed dates with real-time updates
 * 
 * Provides access to closed dates data and utilities for checking if dates are closed.
 * Includes real-time Firestore listener for automatic updates.
 * 
 * **Features:**
 * - Real-time updates of closed dates
 * - Utility function to check if a date is closed
 * - Loading and error states
 * - Automatic cleanup on unmount
 * 
 * **Usage:**
 * ```jsx
 * function DateSelector() {
 *   const { closedDates, isDateClosed, loading, error } = useClosedDates();
 *   
 *   const handleDateSelect = (date) => {
 *     if (isDateClosed(date)) {
 *       alert('This date is closed!');
 *       return;
 *     }
 *     // Process date selection
 *   };
 *   
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return (
 *     <div>
 *       <h3>Closed Dates:</h3>
 *       <ul>
 *         {closedDates.map(cd => (
 *           <li key={cd.id}>{cd.date.toLocaleDateString()} - {cd.reason}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @hook
 * @returns {Object} Closed dates data and utilities
 * @returns {Array<Object>} returns.closedDates - Array of closed date objects
 * @returns {Function} returns.isDateClosed - Function to check if a date is closed
 * @returns {boolean} returns.loading - Loading state
 * @returns {Error|null} returns.error - Error object if loading failed
 * @returns {Function} returns.refresh - Manually refresh closed dates
 */
export const useClosedDates = () => {
  const [closedDates, setClosedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialize closed dates and set up real-time listener
   */
  useEffect(() => {
    let unsubscribe = null;

    const initializeClosedDates = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch initial data
        const fetchedClosedDates = await settingsService.getClosedDates();
        // Sort by date in ascending order to ensure chronological order
        fetchedClosedDates.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateA - dateB;
        });
        setClosedDates(fetchedClosedDates);
        setLoading(false);

        // Set up real-time listener
        const closedDatesRef = collection(db, 'closedDates');
        const q = query(closedDatesRef, orderBy('date', 'asc'));
        
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const updatedClosedDates = [];
            snapshot.forEach((doc) => {
              updatedClosedDates.push({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore Timestamp to Date
                date: doc.data().date?.toDate(),
                createdAt: doc.data().createdAt?.toDate()
              });
            });
            // Sort by date in ascending order to ensure chronological order
            updatedClosedDates.sort((a, b) => {
              const dateA = a.date ? new Date(a.date).getTime() : 0;
              const dateB = b.date ? new Date(b.date).getTime() : 0;
              return dateA - dateB;
            });
            setClosedDates(updatedClosedDates);
          },
          (err) => {
            console.error('Error in closed dates listener:', err);
            setError(err);
          }
        );
      } catch (err) {
        console.error('Error initializing closed dates:', err);
        setError(err);
        setLoading(false);
      }
    };

    initializeClosedDates();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  /**
   * Check if a date is closed
   * 
   * Checks if the given date matches any closed date, including:
   * - Exact date matches
   * - Recurring yearly dates (e.g., annual holidays)
   * 
   * @param {Date} date - Date to check
   * @returns {boolean} True if date is closed, false otherwise
   */
  const isDateClosed = useCallback((date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Invalid date provided to isDateClosed');
      return false;
    }

    // Normalize the date to start of day for comparison
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Check if the date matches any closed date
    return closedDates.some(closedDate => {
      if (!closedDate.date) return false;
      
      const closedDateNormalized = new Date(closedDate.date);
      closedDateNormalized.setHours(0, 0, 0, 0);
      
      // Check for exact date match
      if (closedDateNormalized.getTime() === normalizedDate.getTime()) {
        return true;
      }
      
      // Check for recurring patterns (e.g., yearly)
      if (closedDate.isRecurring && closedDate.recurringPattern === 'yearly') {
        return (
          closedDateNormalized.getMonth() === normalizedDate.getMonth() &&
          closedDateNormalized.getDate() === normalizedDate.getDate()
        );
      }
      
      return false;
    });
  }, [closedDates]);

  /**
   * Manually refresh closed dates from Firestore
   * 
   * @returns {Promise<void>}
   */
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedClosedDates = await settingsService.getClosedDates();
      // Sort by date in ascending order to ensure chronological order
      fetchedClosedDates.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
      setClosedDates(fetchedClosedDates);
      
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing closed dates:', err);
      setError(err);
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    closedDates,
    isDateClosed,
    loading,
    error,
    refresh
  };
};

export default useClosedDates;
