import { useState, useEffect, useCallback } from 'react';
import LoanRequestService from '../services/loanRequestService';
import { LOAN_REQUEST_PAGINATION } from '../types/loanRequest';

/**
 * Custom hook for managing loan requests
 * @param {Object} initialFilters - Initial filter parameters
 * @returns {Object} Loan requests data and methods
 */
export const useLoanRequests = (initialFilters = {}) => {
  const [loanRequests, setLoanRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: LOAN_REQUEST_PAGINATION.DEFAULT_PAGE,
    hasNextPage: false,
    totalItems: 0,
    limit: LOAN_REQUEST_PAGINATION.DEFAULT_LIMIT
  });
  const [filters, setFilters] = useState(initialFilters);
  const [lastDoc, setLastDoc] = useState(null);

  /**
   * Load loan requests with current filters
   */
  const loadLoanRequests = useCallback(async (resetPagination = false) => {
    setLoading(true);
    setError(null);

    try {
      const queryFilters = {
        ...filters,
        page: resetPagination ? 1 : pagination.currentPage,
        lastDoc: resetPagination ? null : lastDoc
      };

      const result = await LoanRequestService.getLoanRequests(queryFilters);
      
      if (resetPagination) {
        setLoanRequests(result.loanRequests);
        setLastDoc(result.lastDoc);
      } else {
        setLoanRequests(prev => [...prev, ...result.loanRequests]);
        setLastDoc(result.lastDoc);
      }
      
      setPagination(result.pagination);
    } catch (err) {
      console.error('Error loading loan requests:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลคำขอยืม');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, lastDoc]);

  /**
   * Load more loan requests (pagination)
   */
  const loadMore = useCallback(() => {
    if (pagination.hasNextPage && !loading) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  }, [pagination.hasNextPage, loading]);

  /**
   * Update filters and reload data
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setLastDoc(null);
  }, []);

  /**
   * Reset filters to initial state
   */
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setLastDoc(null);
  }, [initialFilters]);

  /**
   * Refresh loan requests data
   */
  const refresh = useCallback(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setLastDoc(null);
  }, []);

  /**
   * Create new loan request
   */
  const createLoanRequest = useCallback(async (loanRequestData, userId) => {
    try {
      const newLoanRequest = await LoanRequestService.createLoanRequest(loanRequestData, userId);
      
      // Add to the beginning of the list if it matches current filters
      if (!filters.status || filters.status === newLoanRequest.status) {
        setLoanRequests(prev => [newLoanRequest, ...prev]);
      }
      
      return newLoanRequest;
    } catch (error) {
      console.error('Error creating loan request:', error);
      throw error;
    }
  }, [filters.status]);

  /**
   * Approve loan request
   */
  const approveLoanRequest = useCallback(async (loanRequestId, approvedBy) => {
    try {
      const updatedRequest = await LoanRequestService.approveLoanRequest(loanRequestId, approvedBy);
      
      // Update the request in the list
      setLoanRequests(prev => 
        prev.map(request => 
          request.id === loanRequestId ? { ...request, ...updatedRequest } : request
        )
      );
      
      return updatedRequest;
    } catch (error) {
      console.error('Error approving loan request:', error);
      throw error;
    }
  }, []);

  /**
   * Reject loan request
   */
  const rejectLoanRequest = useCallback(async (loanRequestId, rejectionReason, rejectedBy) => {
    try {
      const updatedRequest = await LoanRequestService.rejectLoanRequest(loanRequestId, rejectionReason, rejectedBy);
      
      // Update the request in the list
      setLoanRequests(prev => 
        prev.map(request => 
          request.id === loanRequestId ? { ...request, ...updatedRequest } : request
        )
      );
      
      return updatedRequest;
    } catch (error) {
      console.error('Error rejecting loan request:', error);
      throw error;
    }
  }, []);

  /**
   * Cancel loan request
   */
  const cancelLoanRequest = useCallback(async (loanRequestId, userId) => {
    try {
      await LoanRequestService.cancelLoanRequest(loanRequestId, userId);
      
      // Remove the request from the list
      setLoanRequests(prev => prev.filter(request => request.id !== loanRequestId));
      
      return true;
    } catch (error) {
      console.error('Error canceling loan request:', error);
      throw error;
    }
  }, []);

  // Load data when filters change
  useEffect(() => {
    loadLoanRequests(true);
  }, [filters, loadLoanRequests]);

  // Load more data when page changes
  useEffect(() => {
    if (pagination.currentPage > 1) {
      loadLoanRequests(false);
    }
  }, [pagination.currentPage, loadLoanRequests]);

  return {
    // Data
    loanRequests,
    loading,
    error,
    pagination,
    filters,
    
    // Methods
    loadLoanRequests,
    loadMore,
    updateFilters,
    resetFilters,
    refresh,
    createLoanRequest,
    approveLoanRequest,
    rejectLoanRequest,
    cancelLoanRequest
  };
};

/**
 * Custom hook for managing user's loan requests
 * @param {string} userId - User ID
 * @param {Object} initialFilters - Initial filter parameters
 * @returns {Object} User loan requests data and methods
 */
export const useUserLoanRequests = (userId, initialFilters = {}) => {
  const userFilters = { ...initialFilters, userId };
  return useLoanRequests(userFilters);
};

/**
 * Custom hook for loan request statistics
 * @param {string} userId - User ID (optional, for user-specific stats)
 * @returns {Object} Statistics data and methods
 */
export const useLoanRequestStats = (userId = null) => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    borrowed: 0,
    returned: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const statsData = await LoanRequestService.getLoanRequestStats(userId);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading loan request stats:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดสถิติ');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
};