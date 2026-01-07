/**
 * useCurrentLoans Hook
 * Hook for fetching user's current borrowed equipment and recent loan history
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { LOAN_REQUEST_STATUS } from '../types/loanRequest';

/**
 * Custom hook for fetching current loans and recent history
 * @returns {Object} Current loans data and methods
 */
export const useCurrentLoans = () => {
  const { user } = useAuth();
  const [currentLoans, setCurrentLoans] = useState([]);
  const [recentLoan, setRecentLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!user?.uid) {
      setCurrentLoans([]);
      setRecentLoan(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loanRequestsRef = collection(db, 'loanRequests');
      
      // Query for currently borrowed items
      const borrowedQuery = query(
        loanRequestsRef,
        where('userId', '==', user.uid),
        where('status', 'in', [LOAN_REQUEST_STATUS.BORROWED, LOAN_REQUEST_STATUS.OVERDUE]),
        orderBy('borrowDate', 'desc')
      );

      const borrowedSnapshot = await getDocs(borrowedQuery);
      const borrowedItems = borrowedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCurrentLoans(borrowedItems);

      // If no current loans, get most recent returned loan
      if (borrowedItems.length === 0) {
        const recentQuery = query(
          loanRequestsRef,
          where('userId', '==', user.uid),
          where('status', '==', LOAN_REQUEST_STATUS.RETURNED),
          orderBy('actualReturnDate', 'desc'),
          limit(1)
        );

        const recentSnapshot = await getDocs(recentQuery);
        if (!recentSnapshot.empty) {
          const doc = recentSnapshot.docs[0];
          setRecentLoan({
            id: doc.id,
            ...doc.data()
          });
        } else {
          setRecentLoan(null);
        }
      } else {
        setRecentLoan(null);
      }
    } catch (err) {
      console.error('Error loading current loans:', err);
      setError(err?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    currentLoans,
    recentLoan,
    loading,
    error,
    refresh: loadData
  };
};

export default useCurrentLoans;
