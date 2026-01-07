/**
 * useCurrentLoans Hook
 * Hook for fetching user's current borrowed equipment and recent loan history
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
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
      
      // Query 1: Get currently borrowed items (status = borrowed or overdue)
      // Using simple query without orderBy to avoid index requirement
      const borrowedQuery = query(
        loanRequestsRef,
        where('userId', '==', user.uid),
        limit(50)
      );

      console.log('🔍 useCurrentLoans: Fetching loans for user:', user.uid);
      
      const snapshot = await getDocs(borrowedQuery);
      const allLoans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('📦 useCurrentLoans: Found', allLoans.length, 'total loans');
      console.log('📦 useCurrentLoans: Loan statuses:', allLoans.map(l => l.status));

      // Filter for currently borrowed items using string comparison
      const borrowedItems = allLoans.filter(loan => 
        loan.status === LOAN_REQUEST_STATUS.BORROWED || 
        loan.status === LOAN_REQUEST_STATUS.OVERDUE ||
        loan.status === 'borrowed' ||  // Fallback string comparison
        loan.status === 'overdue'      // Fallback string comparison
      );
      
      console.log('✅ useCurrentLoans: Found', borrowedItems.length, 'borrowed items');
      
      // Sort by createdAt client-side
      borrowedItems.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || a.createdAt || 0;
        const dateB = b.createdAt?.toDate?.() || b.createdAt || 0;
        return dateB - dateA;
      });
      
      setCurrentLoans(borrowedItems);

      // If no current loans, get most recent returned loan
      if (borrowedItems.length === 0) {
        const returnedLoans = allLoans.filter(loan => 
          loan.status === LOAN_REQUEST_STATUS.RETURNED ||
          loan.status === 'returned'  // Fallback string comparison
        );
        
        console.log('📋 useCurrentLoans: Found', returnedLoans.length, 'returned loans');
        
        if (returnedLoans.length > 0) {
          // Sort by actualReturnDate or createdAt
          returnedLoans.sort((a, b) => {
            const dateA = a.actualReturnDate?.toDate?.() || a.createdAt?.toDate?.() || 0;
            const dateB = b.actualReturnDate?.toDate?.() || b.createdAt?.toDate?.() || 0;
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
      console.error('❌ useCurrentLoans: Error loading loans:', err);
      console.error('❌ useCurrentLoans: Error details:', err.code, err.message);
      setError(err.message);
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
