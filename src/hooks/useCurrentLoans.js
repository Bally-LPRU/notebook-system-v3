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
      
      // Query for user's loan requests (simpler query without compound index)
      const userLoansQuery = query(
        loanRequestsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(userLoansQuery);
      const allLoans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter for currently borrowed items
      const borrowedItems = allLoans.filter(loan => 
        loan.status === LOAN_REQUEST_STATUS.BORROWED || 
        loan.status === LOAN_REQUEST_STATUS.OVERDUE
      );
      setCurrentLoans(borrowedItems);

      // If no current loans, get most recent returned loan
      if (borrowedItems.length === 0) {
        const returnedLoans = allLoans.filter(loan => 
          loan.status === LOAN_REQUEST_STATUS.RETURNED
        );
        if (returnedLoans.length > 0) {
          // Sort by actualReturnDate if available
          returnedLoans.sort((a, b) => {
            const dateA = a.actualReturnDate?.toDate?.() || a.actualReturnDate || 0;
            const dateB = b.actualReturnDate?.toDate?.() || b.actualReturnDate || 0;
            return dateB - dateA;
          });
          setRecentLoan(returnedLoans[0]);
        } else {
          setRecentLoan(null);
        }
      } else {
        setRecentLoan(null);
      }
    } catch (err) {
      console.error('Error loading current loans:', err);
      // Don't show error to user, just log it
      setError(null);
      setCurrentLoans([]);
      setRecentLoan(null);
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
