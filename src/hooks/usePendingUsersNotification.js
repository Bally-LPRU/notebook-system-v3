import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook for real-time monitoring of pending user approvals
 * Provides notifications when new users register and need approval
 */
const usePendingUsersNotification = (isAdmin = false) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [newUserAlert, setNewUserAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only run for admin users
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    console.log('🔔 Setting up pending users listener...');

    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('🔔 Pending users snapshot received:', snapshot.size);

          const users = [];
          const changes = snapshot.docChanges();

          snapshot.forEach((doc) => {
            users.push({
              id: doc.id,
              ...doc.data()
            });
          });

          // Check for new additions
          changes.forEach((change) => {
            if (change.type === 'added') {
              const newUser = {
                id: change.doc.id,
                ...change.doc.data()
              };

              console.log('🔔 New pending user detected:', newUser);

              // Only show alert for truly new users (not initial load)
              if (!loading) {
                setNewUserAlert({
                  id: newUser.id,
                  name: `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || newUser.displayName,
                  email: newUser.email,
                  timestamp: new Date()
                });

                // Auto-clear alert after 10 seconds
                setTimeout(() => {
                  setNewUserAlert(null);
                }, 10000);
              }
            }
          });

          setPendingUsers(users);
          setPendingCount(users.length);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('❌ Error listening to pending users:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      // Cleanup listener on unmount
      return () => {
        console.log('🔔 Cleaning up pending users listener');
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ Error setting up pending users listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [isAdmin, loading]);

  /**
   * Clear the new user alert
   */
  const clearAlert = () => {
    setNewUserAlert(null);
  };

  /**
   * Mark alert as seen (for future enhancement)
   */
  const markAsSeen = (userId) => {
    console.log('✅ Marked user as seen:', userId);
    // Could store this in localStorage or Firestore
  };

  return {
    pendingUsers,
    pendingCount,
    newUserAlert,
    loading,
    error,
    clearAlert,
    markAsSeen,
    hasPendingUsers: pendingCount > 0
  };
};

export default usePendingUsersNotification;
