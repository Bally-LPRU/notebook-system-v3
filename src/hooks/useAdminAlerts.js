/**
 * useAdminAlerts Hook
 * 
 * Hook for managing admin intelligence alerts with real-time subscription,
 * filtering, grouping, and resolution capabilities.
 * 
 * Requirements: 8.1, 8.2, 8.4
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  ALERT_PRIORITY, 
  ALERT_TYPE,
  getPriorityOrder,
  getAlertTypeLabel,
  getPriorityLabel
} from '../types/adminAlert';
import ProactiveAlertService from '../services/proactiveAlertService';

/**
 * Default filter state
 */
const DEFAULT_FILTER = {
  type: 'all',
  priority: 'all',
  dateRange: {
    start: null,
    end: null
  },
  searchTerm: ''
};

/**
 * Group alerts by priority
 * @param {Array} alerts - Array of alerts
 * @returns {Object} Alerts grouped by priority
 */
const groupAlertsByPriority = (alerts) => {
  const groups = {
    [ALERT_PRIORITY.CRITICAL]: [],
    [ALERT_PRIORITY.HIGH]: [],
    [ALERT_PRIORITY.MEDIUM]: [],
    [ALERT_PRIORITY.LOW]: []
  };

  alerts.forEach(alert => {
    const priority = alert.priority || ALERT_PRIORITY.MEDIUM;
    if (groups[priority]) {
      groups[priority].push(alert);
    } else {
      groups[ALERT_PRIORITY.MEDIUM].push(alert);
    }
  });

  return groups;
};

/**
 * Apply filters to alerts
 * @param {Array} alerts - Array of alerts
 * @param {Object} filter - Filter criteria
 * @returns {Array} Filtered alerts
 */
const applyFilters = (alerts, filter) => {
  return alerts.filter(alert => {
    // Filter by type
    if (filter.type && filter.type !== 'all') {
      if (alert.type !== filter.type) return false;
    }

    // Filter by priority
    if (filter.priority && filter.priority !== 'all') {
      if (alert.priority !== filter.priority) return false;
    }

    // Filter by date range
    if (filter.dateRange?.start) {
      const alertDate = alert.createdAt?.toDate?.() || new Date(alert.createdAt);
      const startDate = new Date(filter.dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      if (alertDate < startDate) return false;
    }

    if (filter.dateRange?.end) {
      const alertDate = alert.createdAt?.toDate?.() || new Date(alert.createdAt);
      const endDate = new Date(filter.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      if (alertDate > endDate) return false;
    }

    // Filter by search term
    if (filter.searchTerm && filter.searchTerm.trim()) {
      const searchLower = filter.searchTerm.toLowerCase().trim();
      const titleMatch = alert.title?.toLowerCase().includes(searchLower);
      const descMatch = alert.description?.toLowerCase().includes(searchLower);
      const sourceDataMatch = JSON.stringify(alert.sourceData || {}).toLowerCase().includes(searchLower);
      if (!titleMatch && !descMatch && !sourceDataMatch) return false;
    }

    return true;
  });
};

/**
 * Sort alerts by priority and date
 * @param {Array} alerts - Array of alerts
 * @returns {Array} Sorted alerts
 */
const sortAlerts = (alerts) => {
  return [...alerts].sort((a, b) => {
    // First sort by priority (critical first)
    const priorityDiff = getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
    if (priorityDiff !== 0) return priorityDiff;

    // Then sort by date (newest first)
    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
    return dateB - dateA;
  });
};

/**
 * Main hook for admin alerts
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Object} Alert data and actions
 */
const useAdminAlerts = (isAdmin = false) => {
  // Raw alerts from Firestore
  const [alerts, setAlerts] = useState([]);
  
  // Filter state
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  
  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Action loading state
  const [actionLoading, setActionLoading] = useState(false);

  // Set up real-time subscription to alerts
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    console.log('🔔 [useAdminAlerts] Setting up real-time subscription...');

    try {
      const alertsRef = collection(db, 'adminAlerts');
      const q = query(
        alertsRef,
        where('isResolved', '==', false),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const alertsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setAlerts(alertsData);
          setLoading(false);
          setError(null);
          console.log('🔔 [useAdminAlerts] Alerts updated:', alertsData.length);
        },
        (err) => {
          console.error('❌ [useAdminAlerts] Subscription error:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => {
        console.log('🔔 [useAdminAlerts] Cleaning up subscription');
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ [useAdminAlerts] Setup error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [isAdmin]);

  // Apply filters and sort
  const filteredAlerts = useMemo(() => {
    const filtered = applyFilters(alerts, filter);
    return sortAlerts(filtered);
  }, [alerts, filter]);

  // Group alerts by priority
  const groupedAlerts = useMemo(() => {
    return groupAlertsByPriority(filteredAlerts);
  }, [filteredAlerts]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = alerts.length;
    const byPriority = {
      critical: alerts.filter(a => a.priority === ALERT_PRIORITY.CRITICAL).length,
      high: alerts.filter(a => a.priority === ALERT_PRIORITY.HIGH).length,
      medium: alerts.filter(a => a.priority === ALERT_PRIORITY.MEDIUM).length,
      low: alerts.filter(a => a.priority === ALERT_PRIORITY.LOW).length
    };
    const byType = {};
    alerts.forEach(alert => {
      const type = alert.type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      total,
      pending: total, // All alerts in this query are unresolved
      resolved: 0,    // We only query unresolved alerts
      byPriority,
      byType
    };
  }, [alerts]);

  // Update filter
  const updateFilter = useCallback((newFilter) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  // Reset filter
  const resetFilter = useCallback(() => {
    setFilter(DEFAULT_FILTER);
  }, []);

  // Resolve an alert
  const resolveAlert = useCallback(async (alertId, adminId, action) => {
    setActionLoading(true);
    try {
      await ProactiveAlertService.resolveAlert(alertId, adminId, action);
      // The real-time subscription will automatically update the alerts
      return { success: true };
    } catch (err) {
      console.error('Error resolving alert:', err);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Execute quick action
  const executeQuickAction = useCallback(async (alert, action, adminId) => {
    setActionLoading(true);
    try {
      // Handle different action types
      switch (action.action) {
        case 'send_reminder':
          // TODO: Implement send reminder functionality
          console.log('Sending reminder for:', action.params);
          break;
        case 'mark_contacted':
          // Mark as contacted and resolve
          await resolveAlert(alert.id, adminId, 'mark_contacted');
          break;
        case 'cancel_reservation':
          // TODO: Implement cancel reservation
          console.log('Canceling reservation:', action.params);
          break;
        case 'extend_pickup':
          // TODO: Implement extend pickup time
          console.log('Extending pickup time:', action.params);
          break;
        case 'contact_user':
          // TODO: Implement contact user
          console.log('Contacting user:', action.params);
          break;
        case 'flag_user':
          // TODO: Implement flag user
          console.log('Flagging user:', action.params);
          break;
        case 'dismiss':
          // Dismiss the alert
          await resolveAlert(alert.id, adminId, 'dismissed');
          break;
        default:
          console.warn('Unknown action:', action.action);
      }
      return { success: true };
    } catch (err) {
      console.error('Error executing quick action:', err);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [resolveAlert]);

  // Refresh alerts (force re-fetch)
  const refreshAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const activeAlerts = await ProactiveAlertService.getActiveAlerts();
      setAlerts(activeAlerts);
      setError(null);
    } catch (err) {
      console.error('Error refreshing alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get alert statistics from service
  const getAlertStats = useCallback(async () => {
    try {
      return await ProactiveAlertService.getAlertStats();
    } catch (err) {
      console.error('Error getting alert stats:', err);
      return null;
    }
  }, []);

  return {
    // Data
    alerts: filteredAlerts,
    groupedAlerts,
    stats,
    
    // Filter
    filter,
    updateFilter,
    resetFilter,
    
    // Actions
    resolveAlert,
    executeQuickAction,
    refreshAlerts,
    getAlertStats,
    
    // State
    loading,
    error,
    actionLoading,
    
    // Helpers
    hasAlerts: alerts.length > 0,
    hasCriticalAlerts: stats.byPriority.critical > 0,
    
    // Constants for UI
    ALERT_PRIORITY,
    ALERT_TYPE,
    getAlertTypeLabel,
    getPriorityLabel
  };
};

export default useAdminAlerts;
export { groupAlertsByPriority, applyFilters, sortAlerts };
