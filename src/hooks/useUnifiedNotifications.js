import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Unified notification system - Single source of truth for all admin notifications
 * Replaces multiple notification hooks to reduce redundancy and improve performance
 * 
 * Features:
 * - Real-time updates via Firestore listeners
 * - Automatic priority sorting
 * - Category-based filtering
 * - Performance optimized with single listener per collection
 */
const useUnifiedNotifications = (isAdmin = false) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [pendingReservations, setPendingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    console.log('🔔 [Unified Notifications] Setting up listeners...');

    const unsubscribers = [];

    try {
      // 1. Pending user registrations - Single listener
      const usersQuery = query(
        collection(db, 'users'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubUsers = onSnapshot(
        usersQuery,
        (snapshot) => {
          const users = snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'user_registration',
            category: 'users',
            priority: 'medium',
            ...doc.data()
          }));
          setPendingUsers(users);
          console.log('🔔 [Users] Updated:', users.length);
        },
        (err) => {
          console.error('❌ [Users] Listener error:', err);
        }
      );
      unsubscribers.push(unsubUsers);

      // 2. Pending loan requests - Single listener
      const loansQuery = query(
        collection(db, 'loanRequests'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubLoans = onSnapshot(
        loansQuery,
        (snapshot) => {
          const loans = snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'loan_request',
            category: 'loans',
            priority: 'high',
            ...doc.data()
          }));
          setPendingLoans(loans);
          console.log('🔔 [Loans] Updated:', loans.length);
        },
        (err) => {
          console.error('❌ [Loans] Listener error:', err);
        }
      );
      unsubscribers.push(unsubLoans);

      // 3. Overdue loans - Single listener
      const now = new Date();
      const overdueQuery = query(
        collection(db, 'loanRequests'),
        where('status', '==', 'approved'),
        where('expectedReturnDate', '<', now),
        orderBy('expectedReturnDate', 'asc'),
        limit(50)
      );

      const unsubOverdue = onSnapshot(
        overdueQuery,
        (snapshot) => {
          const overdue = snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'overdue_loan',
            category: 'loans',
            priority: 'urgent',
            ...doc.data()
          }));
          setOverdueLoans(overdue);
          console.log('🔔 [Overdue] Updated:', overdue.length);
        },
        (err) => {
          console.error('❌ [Overdue] Listener error:', err);
        }
      );
      unsubscribers.push(unsubOverdue);

      // 4. Pending reservations - Single listener
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubReservations = onSnapshot(
        reservationsQuery,
        (snapshot) => {
          const reservations = snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'reservation_request',
            category: 'reservations',
            priority: 'medium',
            ...doc.data()
          }));
          setPendingReservations(reservations);
          console.log('🔔 [Reservations] Updated:', reservations.length);
        },
        (err) => {
          console.error('❌ [Reservations] Listener error:', err);
        }
      );
      unsubscribers.push(unsubReservations);

      setLoading(false);
      setError(null);

    } catch (err) {
      console.error('❌ [Unified Notifications] Setup error:', err);
      setError(err.message);
      setLoading(false);
    }

    // Cleanup all listeners
    return () => {
      console.log('🔔 [Unified Notifications] Cleaning up listeners');
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isAdmin]);

  // Combine and sort all notifications by priority and date
  const allNotifications = useMemo(() => {
    const combined = [
      ...pendingUsers,
      ...pendingLoans,
      ...overdueLoans,
      ...pendingReservations
    ];

    // Sort by priority first, then by date
    return combined.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Same priority - sort by date (newest first)
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  }, [pendingUsers, pendingLoans, overdueLoans, pendingReservations]);

  // Count by category
  const counts = useMemo(() => ({
    users: pendingUsers.length,
    loans: pendingLoans.length,
    overdue: overdueLoans.length,
    reservations: pendingReservations.length,
    total: allNotifications.length
  }), [pendingUsers, pendingLoans, overdueLoans, pendingReservations, allNotifications]);

  // Count by priority
  const priorityCounts = useMemo(() => ({
    urgent: allNotifications.filter(n => n.priority === 'urgent').length,
    high: allNotifications.filter(n => n.priority === 'high').length,
    medium: allNotifications.filter(n => n.priority === 'medium').length,
    low: allNotifications.filter(n => n.priority === 'low').length
  }), [allNotifications]);

  // Filter by category
  const getByCategory = (category) => {
    return allNotifications.filter(n => n.category === category);
  };

  // Filter by priority
  const getByPriority = (priority) => {
    return allNotifications.filter(n => n.priority === priority);
  };

  return {
    // Raw data by category
    pendingUsers,
    pendingLoans,
    overdueLoans,
    pendingReservations,
    
    // Combined and sorted data
    allNotifications,
    
    // Counts
    counts,
    priorityCounts,
    
    // State
    loading,
    error,
    
    // Helpers
    hasNotifications: allNotifications.length > 0,
    hasUrgent: priorityCounts.urgent > 0,
    getByCategory,
    getByPriority
  };
};

export default useUnifiedNotifications;
