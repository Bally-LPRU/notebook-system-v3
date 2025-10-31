import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReservationService from '../services/reservationService';
import DevelopmentService from '../services/developmentService';
import { RESERVATION_STATUS } from '../types/reservation';

/**
 * Custom hook for managing reservations
 * @param {Object} options - Hook options
 * @returns {Object} Reservation state and methods
 */
export const useReservations = (options = {}) => {
  const { user } = useAuth();
  const {
    autoFetch = true,
    filters = {},
    isAdmin = false
  } = options;

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch reservations based on user role
   */
  const fetchReservations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let data;
      if (isAdmin) {
        // Try development service first
        data = await DevelopmentService.getAllReservations(filters);
        
        // Fallback to Firebase service
        if (!data) {
          data = await ReservationService.getAllReservations(filters);
        }
      } else {
        // Try development service first
        data = await DevelopmentService.getUserReservations(user.uid, filters);
        
        // Fallback to Firebase service
        if (!data) {
          data = await ReservationService.getUserReservations(user.uid, filters);
        }
      }
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, filters, isAdmin]);

  /**
   * Create new reservation
   */
  const createReservation = useCallback(async (reservationData) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      console.log('useReservations: Creating reservation', { reservationData, userId: user.uid });

      // Try development service first
      let newReservation = await DevelopmentService.createReservation(reservationData, user.uid);
      
      // Fallback to Firebase service
      if (!newReservation) {
        newReservation = await ReservationService.createReservation(reservationData, user.uid);
      }

      console.log('useReservations: Reservation created', newReservation);

      setReservations(prev => [newReservation, ...prev]);
      return newReservation;
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Update reservation status
   */
  const updateReservationStatus = useCallback(async (reservationId, newStatus) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      // Try development service first
      let updatedReservation = await DevelopmentService.updateReservationStatus(
        reservationId, 
        newStatus, 
        user.uid
      );
      
      // Fallback to Firebase service
      if (!updatedReservation) {
        updatedReservation = await ReservationService.updateReservationStatus(
          reservationId, 
          newStatus, 
          user.uid
        );
      }
      
      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === reservationId ? updatedReservation : reservation
        )
      );
      
      return updatedReservation;
    } catch (err) {
      console.error('Error updating reservation status:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Cancel reservation
   */
  const cancelReservation = useCallback(async (reservationId) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      // Try development service first
      let result = await DevelopmentService.cancelReservation(reservationId, user.uid);
      
      // Fallback to Firebase service
      if (!result) {
        await ReservationService.cancelReservation(reservationId, user.uid);
        result = { status: RESERVATION_STATUS.CANCELLED };
      }
      
      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === reservationId 
            ? { ...reservation, status: RESERVATION_STATUS.CANCELLED }
            : reservation
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Refresh reservations
   */
  const refresh = useCallback(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchReservations();
    }
  }, [autoFetch, fetchReservations]);

  return {
    reservations,
    loading,
    error,
    createReservation,
    updateReservationStatus,
    cancelReservation,
    refresh,
    fetchReservations
  };
};

/**
 * Custom hook for managing equipment reservations on a specific date
 * @param {string} equipmentId - Equipment ID
 * @param {Date} date - Date to check
 * @returns {Object} Equipment reservation state and methods
 */
export const useEquipmentReservations = (equipmentId, date) => {
  const [reservations, setReservations] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch equipment reservations for the date
   */
  const fetchEquipmentReservations = useCallback(async () => {
    if (!equipmentId || !date) return;

    setLoading(true);
    setError(null);

    try {
      // Try development service first
      let reservationsData = await DevelopmentService.getEquipmentReservations(equipmentId, date);
      let timeSlotsData = await DevelopmentService.getAvailableTimeSlots(equipmentId, date);
      
      // Fallback to Firebase service
      if (!reservationsData || !timeSlotsData) {
        [reservationsData, timeSlotsData] = await Promise.all([
          ReservationService.getEquipmentReservations(equipmentId, date),
          ReservationService.getAvailableTimeSlots(equipmentId, date)
        ]);
      }

      setReservations(reservationsData);
      setTimeSlots(timeSlotsData);
    } catch (err) {
      console.error('Error fetching equipment reservations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [equipmentId, date]);

  /**
   * Check if time slot is available
   */
  const isTimeSlotAvailable = useCallback(async (startTime, endTime) => {
    if (!equipmentId || !date) return false;

    try {
      return await ReservationService.isTimeSlotAvailable(equipmentId, date, startTime, endTime);
    } catch (err) {
      console.error('Error checking time slot availability:', err);
      return false;
    }
  }, [equipmentId, date]);

  /**
   * Refresh equipment reservations
   */
  const refresh = useCallback(() => {
    fetchEquipmentReservations();
  }, [fetchEquipmentReservations]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    fetchEquipmentReservations();
  }, [fetchEquipmentReservations]);

  return {
    reservations,
    timeSlots,
    loading,
    error,
    isTimeSlotAvailable,
    refresh,
    fetchEquipmentReservations
  };
};

/**
 * Custom hook for reservation statistics (admin)
 * @returns {Object} Reservation statistics state
 */
export const useReservationStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
    expired: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch reservation statistics
   */
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try development service first
      let statsData = await DevelopmentService.getReservationStats();
      
      // Fallback to Firebase service
      if (!statsData) {
        statsData = await ReservationService.getReservationStats();
      }
      
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching reservation stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh statistics
   */
  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh,
    fetchStats
  };
};

export default useReservations;