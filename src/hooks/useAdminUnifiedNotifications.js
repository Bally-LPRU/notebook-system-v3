/**
 * useAdminUnifiedNotifications Hook
 * 
 * Single source of truth for all admin notifications.
 * Combines data from multiple sources:
 * - Pending user registrations
 * - Pending loan requests
 * - Overdue loans
 * - Pending reservations
 * - Personal notifications
 * 
 * Features:
 * - Real-time updates via Firestore listeners
 * - Read state management
 * - Priority-based sorting
 * - Filtering by tab, category, priority, date range, search
 * - Pagination support
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  SOURCE_TYPES,
  getPriorityForSourceType,
  getCategoryForSourceType,
  createNotificationId,
  createQuickActions,
  sortNotifications,
  applyFilters,
  isActionItem,
  isPersonalNotification
} from '../types/adminNotification';
import {
  getReadStates,
  markAsRead as markAsReadService,
  markMultipleAsRead,
  executeQuickAction as executeQuickActionService
} from '../services/adminNotificationService';

// Default page size for pagination
const DEFAULT_PAGE_SIZE = 50;

/**
 * Transform a source document to UnifiedNotification format
 */
const transformToUnifiedNotification = (doc, sourceType, readStates) => {
  const data = doc;
  const sourceId = doc.id;
  const notificationId = createNotificationId(sourceType, sourceId);
  const isRead = readStates.has(notificationId);
  const readState = readStates.get(notificationId);
  
  // Get priority and category
  const priority = getPriorityForSourceType(sourceType, data.priority);
  const category = getCategoryForSourceType(sourceType);
  
  // Build notification content based on source type
  let title, description, detail, link, icon, iconBg, userName, equipmentName;
  
  switch (sourceType) {
    case SOURCE_TYPES.USER_REGISTRATION:
      title = 'ผู้ใช้ใหม่สมัครสมาชิก';
      userName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.displayName || data.email;
      description = userName;
      detail = data.email;
      link = '/admin/users?tab=pending';
      icon = '👤';
      iconBg = 'bg-green-100 text-green-600';
      break;
      
    case SOURCE_TYPES.LOAN_REQUEST:
      title = 'คำขอยืมอุปกรณ์ใหม่';
      userName = data.userName || data._userName || 'ผู้ใช้';
      equipmentName = data.equipmentName || data._equipmentName || 'อุปกรณ์';
      description = `${userName} ขอยืม ${equipmentName}`;
      detail = data.purpose ? `วัตถุประสงค์: ${data.purpose}` : '';
      link = '/admin/loan-requests';
      icon = '📋';
      iconBg = 'bg-blue-100 text-blue-600';
      break;
      
    case SOURCE_TYPES.OVERDUE_LOAN:
      title = 'อุปกรณ์เกินกำหนดคืน';
      userName = data.userName || data._userName || 'ผู้ใช้';
      equipmentName = data.equipmentName || data._equipmentName || 'อุปกรณ์';
      description = `${userName} ยืม ${equipmentName} เกินกำหนด`;
      const returnDate = data.expectedReturnDate?.toDate?.() || new Date(data.expectedReturnDate);
      detail = `ครบกำหนด: ${returnDate.toLocaleDateString('th-TH')}`;
      link = '/admin/overdue';
      icon = '⚠️';
      iconBg = 'bg-red-100 text-red-600';
      break;
      
    case SOURCE_TYPES.RESERVATION_REQUEST:
      title = 'คำขอจองอุปกรณ์ใหม่';
      userName = data.userName || 'ผู้ใช้';
      equipmentName = data.equipmentName || 'อุปกรณ์';
      description = `${userName} ขอจอง ${equipmentName}`;
      const startTime = data.startTime?.toDate?.() || new Date(data.startTime);
      detail = `วันที่จอง: ${startTime.toLocaleDateString('th-TH')}`;
      link = '/admin/reservations';
      icon = '📅';
      iconBg = 'bg-purple-100 text-purple-600';
      break;
      
    case SOURCE_TYPES.PERSONAL:
      title = data.title || 'การแจ้งเตือน';
      description = data.message || data.description || '';
      detail = '';
      link = data.actionUrl || '#';
      icon = '🔔';
      iconBg = 'bg-gray-100 text-gray-600';
      break;
      
    default:
      title = 'การแจ้งเตือน';
      description = data.message || 'รายละเอียด';
      detail = '';
      link = '#';
      icon = '🔔';
      iconBg = 'bg-gray-100 text-gray-600';
  }
  
  // Get createdAt date
  let createdAt;
  if (data.createdAt?.toDate) {
    createdAt = data.createdAt.toDate();
  } else if (data.createdAt) {
    createdAt = new Date(data.createdAt);
  } else {
    createdAt = new Date();
  }
  
  return {
    id: notificationId,
    sourceId,
    sourceType,
    sourceCollection: getSourceCollection(sourceType),
    category,
    priority,
    title,
    description,
    detail,
    link,
    icon,
    iconBg,
    isRead,
    readAt: readState?.readAt || null,
    createdAt,
    sourceData: data,
    quickActions: createQuickActions(sourceType),
    userName,
    equipmentName
  };
};

/**
 * Get source collection name from source type
 */
const getSourceCollection = (sourceType) => {
  switch (sourceType) {
    case SOURCE_TYPES.USER_REGISTRATION:
      return 'users';
    case SOURCE_TYPES.LOAN_REQUEST:
    case SOURCE_TYPES.OVERDUE_LOAN:
      return 'loanRequests';
    case SOURCE_TYPES.RESERVATION_REQUEST:
      return 'reservations';
    case SOURCE_TYPES.PERSONAL:
      return 'notifications';
    default:
      return 'unknown';
  }
};

/**
 * Main hook for unified admin notifications
 * @param {string} adminId - Admin user ID
 * @param {boolean} isAdmin - Whether user is admin
 * @param {function} onNewNotification - Optional callback when new notification arrives
 */
const useAdminUnifiedNotifications = (adminId, isAdmin = false, onNewNotification = null) => {
  // Raw data from each source
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [pendingReservations, setPendingReservations] = useState([]);
  const [personalNotifications, setPersonalNotifications] = useState([]);
  
  // Track previous counts for detecting new items
  const [prevCounts, setPrevCounts] = useState({
    users: 0,
    loans: 0,
    overdue: 0,
    reservations: 0
  });
  
  // Read states
  const [readStates, setReadStates] = useState(new Map());
  
  // Filter state
  const [filter, setFilter] = useState({
    tab: 'all',
    category: 'all',
    priority: 'all',
    searchTerm: '',
    startDate: null,
    endDate: null
  });
  
  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [displayCount, setDisplayCount] = useState(DEFAULT_PAGE_SIZE);

  // Load read states on mount
  useEffect(() => {
    if (!adminId || !isAdmin) return;
    
    const loadReadStates = async () => {
      try {
        const states = await getReadStates(adminId);
        setReadStates(states);
      } catch (err) {
        // Handle permission errors gracefully - just use empty read states
        console.warn('Could not load read states (may be first time or permission issue):', err.message);
        setReadStates(new Map());
      }
    };
    
    loadReadStates();
  }, [adminId, isAdmin]);

  // Set up Firestore listeners
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    console.log('🔔 [Unified Admin Notifications] Setting up listeners...');
    const unsubscribers = [];

    try {
      // 1. Pending user registrations
      const usersQuery = query(
        collection(db, 'users'),
        where('status', '==', 'pending')
      );

      // Track if this is initial load
      let isInitialUsersLoad = true;
      let isInitialLoansLoad = true;

      const unsubUsers = onSnapshot(
        usersQuery,
        (snapshot) => {
          const users = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0);
              const dateB = b.createdAt?.toDate?.() || new Date(0);
              return dateB - dateA;
            })
            .slice(0, pageSize);
          
          // Notify about new users (not on initial load)
          if (!isInitialUsersLoad && onNewNotification && users.length > 0) {
            setPrevCounts(prev => {
              if (users.length > prev.users) {
                const newUser = users[0];
                const userName = `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || newUser.email;
                onNewNotification({
                  title: 'ผู้ใช้ใหม่รอการอนุมัติ',
                  message: `${userName} สมัครสมาชิกใหม่`,
                  type: 'user_registration',
                  priority: 'medium',
                  actionUrl: '/admin/users?tab=pending'
                });
              }
              return { ...prev, users: users.length };
            });
          } else {
            setPrevCounts(prev => ({ ...prev, users: users.length }));
          }
          isInitialUsersLoad = false;
          
          setPendingUsers(users);
          console.log('🔔 [Users] Updated:', users.length);
        },
        (err) => {
          console.error('❌ [Users] Listener error:', err);
          setPendingUsers([]);
        }
      );
      unsubscribers.push(unsubUsers);

      // 2. Pending loan requests
      const loansQuery = query(
        collection(db, 'loanRequests'),
        where('status', '==', 'pending')
      );

      const unsubLoans = onSnapshot(
        loansQuery,
        (snapshot) => {
          const loans = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0);
              const dateB = b.createdAt?.toDate?.() || new Date(0);
              return dateB - dateA;
            })
            .slice(0, pageSize);
          
          // Notify about new loan requests (not on initial load)
          if (!isInitialLoansLoad && onNewNotification && loans.length > 0) {
            setPrevCounts(prev => {
              if (loans.length > prev.loans) {
                const newLoan = loans[0];
                const userName = newLoan.userName || newLoan._userName || 'ผู้ใช้';
                const equipmentName = newLoan.equipmentName || newLoan._equipmentName || 'อุปกรณ์';
                onNewNotification({
                  title: 'คำขอยืมอุปกรณ์ใหม่',
                  message: `${userName} ขอยืม ${equipmentName}`,
                  type: 'loan_request',
                  priority: 'high',
                  actionUrl: '/admin/loan-requests'
                });
              }
              return { ...prev, loans: loans.length };
            });
          } else {
            setPrevCounts(prev => ({ ...prev, loans: loans.length }));
          }
          isInitialLoansLoad = false;
          
          setPendingLoans(loans);
          console.log('🔔 [Loans] Updated:', loans.length);
        },
        (err) => {
          console.error('❌ [Loans] Listener error:', err);
          setPendingLoans([]);
        }
      );
      unsubscribers.push(unsubLoans);

      // 3. Overdue loans
      const approvedLoansQuery = query(
        collection(db, 'loanRequests'),
        where('status', '==', 'approved')
      );

      const unsubOverdue = onSnapshot(
        approvedLoansQuery,
        (snapshot) => {
          const now = new Date();
          const overdue = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(loan => {
              const returnDate = loan.expectedReturnDate?.toDate?.() || new Date(loan.expectedReturnDate);
              return returnDate < now;
            })
            .sort((a, b) => {
              const dateA = a.expectedReturnDate?.toDate?.() || new Date(0);
              const dateB = b.expectedReturnDate?.toDate?.() || new Date(0);
              return dateA - dateB;
            })
            .slice(0, pageSize);
          setOverdueLoans(overdue);
          console.log('🔔 [Overdue] Updated:', overdue.length);
        },
        (err) => {
          console.error('❌ [Overdue] Listener error:', err);
          setOverdueLoans([]);
        }
      );
      unsubscribers.push(unsubOverdue);

      // 4. Pending reservations
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('status', '==', 'pending')
      );

      let isInitialReservationsLoad = true;

      const unsubReservations = onSnapshot(
        reservationsQuery,
        (snapshot) => {
          const reservations = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0);
              const dateB = b.createdAt?.toDate?.() || new Date(0);
              return dateB - dateA;
            })
            .slice(0, pageSize);
          
          // Notify about new reservations (not on initial load)
          if (!isInitialReservationsLoad && onNewNotification && reservations.length > 0) {
            setPrevCounts(prev => {
              if (reservations.length > prev.reservations) {
                const newReservation = reservations[0];
                const userName = newReservation.userName || 'ผู้ใช้';
                const equipmentName = newReservation.equipmentName || 'อุปกรณ์';
                onNewNotification({
                  title: 'คำขอจองอุปกรณ์ใหม่',
                  message: `${userName} ขอจอง ${equipmentName}`,
                  type: 'reservation_request',
                  priority: 'medium',
                  actionUrl: '/admin/reservations'
                });
              }
              return { ...prev, reservations: reservations.length };
            });
          } else {
            setPrevCounts(prev => ({ ...prev, reservations: reservations.length }));
          }
          isInitialReservationsLoad = false;
          
          setPendingReservations(reservations);
          console.log('🔔 [Reservations] Updated:', reservations.length);
        },
        (err) => {
          console.error('❌ [Reservations] Listener error:', err);
          setPendingReservations([]);
        }
      );
      unsubscribers.push(unsubReservations);

      // 5. Personal notifications (for admin)
      // Filter out notifications that are already shown as action items
      // (loan_request, user_approval, reservation_request types)
      if (adminId) {
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', adminId),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );

        const unsubNotifications = onSnapshot(
          notificationsQuery,
          (snapshot) => {
            // Filter out notification types that are already shown as action items
            // to prevent duplicate notifications
            const actionItemTypes = [
              'loan_request',
              'user_approval', 
              'reservation_request',
              'new_loan_request',
              'new_user_registration',
              'new_reservation_request'
            ];
            
            const notifications = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(notification => !actionItemTypes.includes(notification.type));
            
            setPersonalNotifications(notifications);
            console.log('🔔 [Personal] Updated:', notifications.length, '(filtered action item types)');
          },
          (err) => {
            console.error('❌ [Personal] Listener error:', err);
            setPersonalNotifications([]);
          }
        );
        unsubscribers.push(unsubNotifications);
      }

      setLoading(false);
      setError(null);

    } catch (err) {
      console.error('❌ [Unified Admin Notifications] Setup error:', err);
      setError(err.message);
      setLoading(false);
    }

    return () => {
      console.log('🔔 [Unified Admin Notifications] Cleaning up listeners');
      unsubscribers.forEach(unsub => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, adminId, pageSize, onNewNotification]);

  // Transform and combine all notifications
  const allNotifications = useMemo(() => {
    const transformed = [
      ...pendingUsers.map(doc => transformToUnifiedNotification(doc, SOURCE_TYPES.USER_REGISTRATION, readStates)),
      ...pendingLoans.map(doc => transformToUnifiedNotification(doc, SOURCE_TYPES.LOAN_REQUEST, readStates)),
      ...overdueLoans.map(doc => transformToUnifiedNotification(doc, SOURCE_TYPES.OVERDUE_LOAN, readStates)),
      ...pendingReservations.map(doc => transformToUnifiedNotification(doc, SOURCE_TYPES.RESERVATION_REQUEST, readStates)),
      ...personalNotifications.map(doc => transformToUnifiedNotification(doc, SOURCE_TYPES.PERSONAL, readStates))
    ];
    
    return sortNotifications(transformed);
  }, [pendingUsers, pendingLoans, overdueLoans, pendingReservations, personalNotifications, readStates]);

  // Filter notifications by tab
  const actionItems = useMemo(() => {
    return allNotifications.filter(n => isActionItem(n.sourceType));
  }, [allNotifications]);

  const personalItems = useMemo(() => {
    return allNotifications.filter(n => isPersonalNotification(n.sourceType));
  }, [allNotifications]);

  // Apply filters
  const filteredNotifications = useMemo(() => {
    return applyFilters(allNotifications, filter);
  }, [allNotifications, filter]);

  // Paginated notifications
  const paginatedNotifications = useMemo(() => {
    return filteredNotifications.slice(0, displayCount);
  }, [filteredNotifications, displayCount]);

  // Calculate counts
  const counts = useMemo(() => ({
    total: allNotifications.length,
    unread: allNotifications.filter(n => !n.isRead).length,
    actionItems: actionItems.length,
    personal: personalItems.length,
    users: pendingUsers.length,
    loans: pendingLoans.length,
    overdue: overdueLoans.length,
    reservations: pendingReservations.length
  }), [allNotifications, actionItems, personalItems, pendingUsers, pendingLoans, overdueLoans, pendingReservations]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId, sourceType) => {
    if (!adminId) return;
    
    try {
      await markAsReadService(adminId, notificationId, sourceType);
      
      // Update local state
      setReadStates(prev => {
        const newStates = new Map(prev);
        newStates.set(notificationId, {
          notificationId,
          sourceType,
          isRead: true,
          readAt: new Date()
        });
        return newStates;
      });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [adminId]);

  // Mark all as read
  const markAllAsRead = useCallback(async (tab = 'all') => {
    if (!adminId) return;
    
    let notificationsToMark;
    if (tab === 'action') {
      notificationsToMark = actionItems.filter(n => !n.isRead);
    } else if (tab === 'personal') {
      notificationsToMark = personalItems.filter(n => !n.isRead);
    } else {
      notificationsToMark = allNotifications.filter(n => !n.isRead);
    }
    
    if (notificationsToMark.length === 0) return;
    
    try {
      await markMultipleAsRead(
        adminId,
        notificationsToMark.map(n => ({
          notificationId: n.id,
          sourceType: n.sourceType,
          sourceCollection: n.sourceCollection
        }))
      );
      
      // Update local state
      setReadStates(prev => {
        const newStates = new Map(prev);
        notificationsToMark.forEach(n => {
          newStates.set(n.id, {
            notificationId: n.id,
            sourceType: n.sourceType,
            isRead: true,
            readAt: new Date()
          });
        });
        return newStates;
      });
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [adminId, actionItems, personalItems, allNotifications]);

  // Execute quick action
  const executeQuickAction = useCallback(async (notification, action, reason = null) => {
    if (!adminId) return { success: false, error: 'Not authenticated' };
    
    return await executeQuickActionService(adminId, notification, action, reason);
  }, [adminId]);

  // Update filter
  const updateFilter = useCallback((newFilter) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
    setDisplayCount(DEFAULT_PAGE_SIZE); // Reset pagination when filter changes
  }, []);

  // Set search term
  const setSearchTerm = useCallback((term) => {
    updateFilter({ searchTerm: term });
  }, [updateFilter]);

  // Load more (pagination)
  const loadMore = useCallback(() => {
    setDisplayCount(prev => prev + pageSize);
  }, [pageSize]);

  // Has more items to load
  const hasMore = displayCount < filteredNotifications.length;

  return {
    // Data
    allNotifications: paginatedNotifications,
    actionItems,
    personalNotifications: personalItems,
    
    // Counts
    counts,
    
    // Actions
    markAsRead,
    markAllAsRead,
    executeQuickAction,
    
    // Filtering
    filter,
    setFilter: updateFilter,
    setSearchTerm,
    
    // State
    loading,
    error,
    
    // Pagination
    loadMore,
    hasMore,
    
    // Helpers
    hasNotifications: allNotifications.length > 0,
    hasUnread: counts.unread > 0
  };
};

export default useAdminUnifiedNotifications;
