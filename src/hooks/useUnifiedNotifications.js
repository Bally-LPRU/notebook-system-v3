import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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
      // 1. Pending user registrations - Simple query, filter in memory
      const usersQuery = query(
        collection(db, 'users'),
        where('status', '==', 'pending')
      );

      const unsubUsers = onSnapshot(
        usersQuery,
        (snapshot) => {
          const users = snapshot.docs
            .map(doc => ({
              id: doc.id,
              type: 'user_registration',
              category: 'users',
              priority: 'medium',
              ...doc.data()
            }))
            .sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0);
              const dateB = b.createdAt?.toDate?.() || new Date(0);
              return dateB - dateA;
            })
            .slice(0, 50);
          setPendingUsers(users);
          console.log('🔔 [Users] Updated:', users.length);
        },
        (err) => {
          console.error('❌ [Users] Listener error:', err);
          setPendingUsers([]);
        }
      );
      unsubscribers.push(unsubUsers);

      // 2. Pending loan requests - Simple query, filter in memory
      const loansQuery = query(
        collection(db, 'loanRequests'),
        where('status', '==', 'pending')
      );

      const unsubLoans = onSnapshot(
        loansQuery,
        (snapshot) => {
          const loans = snapshot.docs
            .map(doc => ({
              id: doc.id,
              type: 'loan_request',
              category: 'loans',
              priority: 'high',
              ...doc.data()
            }))
            .sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0);
              const dateB = b.createdAt?.toDate?.() || new Date(0);
              return dateB - dateA;
            })
            .slice(0, 50);
          setPendingLoans(loans);
          console.log('🔔 [Loans] Updated:', loans.length);
        },
        (err) => {
          console.error('❌ [Loans] Listener error:', err);
          setPendingLoans([]);
        }
      );
      unsubscribers.push(unsubLoans);

      // 3. Overdue loans - Simple query for approved, filter overdue in memory
      const approvedLoansQuery = query(
        collection(db, 'loanRequests'),
        where('status', '==', 'approved')
      );

      const unsubOverdue = onSnapshot(
        approvedLoansQuery,
        (snapshot) => {
          const now = new Date();
          const overdue = snapshot.docs
            .map(doc => ({
              id: doc.id,
              type: 'overdue_loan',
              category: 'loans',
              priority: 'urgent',
              ...doc.data()
            }))
            .filter(loan => {
              const returnDate = loan.expectedReturnDate?.toDate?.() || new Date(loan.expectedReturnDate);
              return returnDate < now;
            })
            .sort((a, b) => {
              const dateA = a.expectedReturnDate?.toDate?.() || new Date(0);
              const dateB = b.expectedReturnDate?.toDate?.() || new Date(0);
              return dateA - dateB;
            })
            .slice(0, 50);
          setOverdueLoans(overdue);
          console.log('🔔 [Overdue] Updated:', overdue.length);
        },
        (err) => {
          console.error('❌ [Overdue] Listener error:', err);
          setOverdueLoans([]);
        }
      );
      unsubscribers.push(unsubOverdue);

      // 4. Pending reservations - Simple query, filter in memory
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('status', '==', 'pending')
      );

      const unsubReservations = onSnapshot(
        reservationsQuery,
        (snapshot) => {
          const reservations = snapshot.docs
            .map(doc => ({
              id: doc.id,
              type: 'reservation_request',
              category: 'reservations',
              priority: 'medium',
              ...doc.data()
            }))
            .sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0);
              const dateB = b.createdAt?.toDate?.() || new Date(0);
              return dateB - dateA;
            })
            .slice(0, 50);
          setPendingReservations(reservations);
          console.log('🔔 [Reservations] Updated:', reservations.length);
        },
        (err) => {
          console.error('❌ [Reservations] Listener error:', err);
          setPendingReservations([]);
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

  // Combine and sort all notifications by date (newest first)
  // Priority is used for display badges only, not for sorting order
  const allNotifications = useMemo(() => {
    const combined = [
      ...pendingUsers,
      ...pendingLoans,
      ...overdueLoans,
      ...pendingReservations
    ];

    // Sort by date only (newest first)
    return combined.sort((a, b) => {
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
