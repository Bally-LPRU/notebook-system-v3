/**
 * useLoanHistory Hook
 * Hook for managing loan history data with filtering, search, and statistics
 * 
 * Feature: user-status-system-improvement
 * Requirements: 9.1, 9.3, 9.4, 9.5
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { LOAN_REQUEST_STATUS } from '../types/loanRequest';

/**
 * Statuses that represent completed loan history
 */
export const HISTORY_STATUSES = [
  LOAN_REQUEST_STATUS.RETURNED,
  LOAN_REQUEST_STATUS.BORROWED,
  LOAN_REQUEST_STATUS.OVERDUE
];

/**
 * Default filters for loan history
 */
export const DEFAULT_LOAN_HISTORY_FILTERS = {
  dateRange: null,
  category: '',
  status: '',
  search: ''
};

/**
 * Filter loan history items based on filter criteria
 * @param {Array} items - Loan history items
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered items
 */
export const filterLoanHistory = (items, filters) => {
  if (!items || !Array.isArray(items)) return [];
  
  return items.filter(item => {
    // Date range filter
    if (filters.dateRange) {
      const borrowDate = item.borrowDate?.toDate?.() || new Date(item.borrowDate);
      
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        if (borrowDate < startDate) return false;
      }
      
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (borrowDate > endDate) return false;
      }
    }
    
    // Category filter
    if (filters.category) {
      const itemCategory = item.equipmentCategory || item.equipmentSnapshot?.category || '';
      if (itemCategory !== filters.category) return false;
    }
    
    // Status filter
    if (filters.status) {
      if (item.status !== filters.status) return false;
    }
    
    // Search filter (equipment name or serial number)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const equipmentName = (item.equipmentName || item.equipmentSnapshot?.name || '').toLowerCase();
      const serialNumber = (item.equipmentSnapshot?.serialNumber || item.equipmentSnapshot?.equipmentNumber || '').toLowerCase();
      
      if (!equipmentName.includes(searchLower) && !serialNumber.includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Calculate loan history statistics
 * @param {Array} items - Loan history items (should be completed loans)
 * @returns {Object} Statistics object
 */
export const calculateLoanHistoryStats = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      totalLoans: 0,
      averageDuration: 0,
      onTimeReturnRate: 0
    };
  }
  
  const totalLoans = items.length;
  
  // Calculate durations for items that have both borrow and return dates
  const completedLoans = items.filter(item => {
    const hasReturnDate = item.actualReturnDate || item.status === LOAN_REQUEST_STATUS.RETURNED;
    return hasReturnDate;
  });
  
  let totalDuration = 0;
  let onTimeReturns = 0;
  let totalReturns = 0;
  
  completedLoans.forEach(item => {
    // Calculate duration
    const borrowDate = item.borrowDate?.toDate?.() || new Date(item.borrowDate);
    const returnDate = item.actualReturnDate?.toDate?.() 
      || (item.actualReturnDate ? new Date(item.actualReturnDate) : null);
    
    if (returnDate && borrowDate) {
      const durationMs = returnDate.getTime() - borrowDate.getTime();
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
      totalDuration += Math.max(1, durationDays); // At least 1 day
      totalReturns++;
      
      // Check if returned on time
      const expectedReturnDate = item.expectedReturnDate?.toDate?.() 
        || (item.expectedReturnDate ? new Date(item.expectedReturnDate) : null);
      
      if (expectedReturnDate && returnDate <= expectedReturnDate) {
        onTimeReturns++;
      }
    }
  });
  
  const averageDuration = totalReturns > 0 ? Math.round(totalDuration / totalReturns) : 0;
  const onTimeReturnRate = totalReturns > 0 ? Math.round((onTimeReturns / totalReturns) * 100) : 0;
  
  return {
    totalLoans,
    averageDuration,
    onTimeReturnRate
  };
};

/**
 * Custom hook for managing loan history
 * @returns {Object} Loan history data and methods
 */
export const useLoanHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_LOAN_HISTORY_FILTERS);

  /**
   * Load loan history from Firestore
   */
  const loadHistory = useCallback(async () => {
    if (!user?.uid) {
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loanRequestsRef = collection(db, 'loanRequests');
      
      // Query for user's loan requests with history statuses
      const q = query(
        loanRequestsRef,
        where('userId', '==', user.uid),
        where('status', 'in', HISTORY_STATUSES),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      const historyItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setHistory(historyItems);
    } catch (err) {
      console.error('Error loading loan history:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดประวัติการยืม');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Reset filters to default
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_LOAN_HISTORY_FILTERS);
  }, []);

  /**
   * Search loan history
   */
  const search = useCallback((query) => {
    setFilters(prev => ({ ...prev, search: query }));
  }, []);

  /**
   * Refresh loan history
   */
  const refresh = useCallback(() => {
    loadHistory();
  }, [loadHistory]);

  // Load history on mount and when user changes
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Apply filters to history
  const filteredHistory = useMemo(() => {
    return filterLoanHistory(history, filters);
  }, [history, filters]);

  // Calculate statistics from filtered history
  const stats = useMemo(() => {
    return calculateLoanHistoryStats(filteredHistory);
  }, [filteredHistory]);

  return {
    history: filteredHistory,
    allHistory: history,
    stats,
    loading,
    error,
    filters,
    setFilters: updateFilters,
    resetFilters,
    search,
    refresh
  };
};

export default useLoanHistory;
