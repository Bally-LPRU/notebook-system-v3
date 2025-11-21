import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Unified hook for all admin notifications from different systems
 * - User registrations (pending approvals)
 * - Loan requests (pending, overdue)
 * - Reservations (pending, upcoming)
 * - Equipment issues
 */
const useAdminNotifications = (isAdmin = false) => {
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

    console.log('🔔 Setting up admin notifications listeners...');

    const unsubscribers = [];

    try {
      // 1. Listen to pending user registrations
      const usersQuery = query(
        collection(db, 'users'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'user_registration',
          ...doc.data()
        }));
        setPendingUsers(users);
        console.log('🔔 Pending users updated:', users.length);
      });
      unsubscribers.push(unsubUsers);

      // 2. Listen to pending loan requests
      const loansQuery = query(
        collection(db, 'loanRequests'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubLoans = onSnapshot(loansQuery, (snapshot) => {
        const loans = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'loan_request',
          ...doc.data()
        }));
        setPendingLoans(loans);
        console.log('🔔 Pending loans updated:', loans.length);
      });
      unsubscribers.push(unsubLoans);

      // 3. Listen to overdue loans
      const now = new Date();
      const overdueQuery = query(
        collection(db, 'loanRequests'),
        where('status', '==', 'approved'),
        where('expectedReturnDate', '<', now),
        orderBy('expectedReturnDate', 'asc'),
        limit(50)
      );

      const unsubOverdue = onSnapshot(overdueQuery, (snapshot) => {
        const overdue = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'overdue_loan',
          ...doc.data()
        }));
        setOverdueLoans(overdue);
        console.log('🔔 Overdue loans updated:', overdue.length);
      });
      unsubscribers.push(unsubOverdue);

      // 4. Listen to pending reservations
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubReservations = onSnapshot(reservationsQuery, (snapshot) => {
        const reservations = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'reservation_request',
          ...doc.data()
        }));
        setPendingReservations(reservations);
        console.log('🔔 Pending reservations updated:', reservations.length);
      });
      unsubscribers.push(unsubReservations);

      setLoading(false);
      setError(null);

    } catch (err) {
      console.error('❌ Error setting up notifications:', err);
      setError(err.message);
      setLoading(false);
    }

    // Cleanup all listeners
    return () => {
      console.log('🔔 Cleaning up admin notifications listeners');
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isAdmin]);

  // Combine and sort all notifications
  const allNotifications = useMemo(() => {
    const combined = [
      ...pendingUsers.map(item => ({
        ...item,
        priority: 'medium',
        category: 'users'
      })),
      ...pendingLoans.map(item => ({
        ...item,
        priority: 'high',
        category: 'loans'
      })),
      ...overdueLoans.map(item => ({
        ...item,
        priority: 'urgent',
        category: 'loans'
      })),
      ...pendingReservations.map(item => ({
        ...item,
        priority: 'medium',
        category: 'reservations'
      }))
    ];

    // Sort by priority and date
    return combined.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by date (newest first)
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

  return {
    // Raw data
    pendingUsers,
    pendingLoans,
    overdueLoans,
    pendingReservations,
    
    // Combined data
    allNotifications,
    
    // Counts
    counts,
    priorityCounts,
    
    // State
    loading,
    error,
    
    // Helpers
    hasNotifications: allNotifications.length > 0,
    hasUrgent: priorityCounts.urgent > 0
  };
};

export default useAdminNotifications;
