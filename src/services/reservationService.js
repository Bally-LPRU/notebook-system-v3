import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  and,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  RESERVATION_STATUS,
  TIME_SLOTS_CONFIG,
  calculateDuration
} from '../types/reservation';
import NotificationService from './notificationService';
import EquipmentService from './equipmentService';

class ReservationService {
  static COLLECTION_NAME = 'reservations';

  /**
   * Create new reservation
   * @param {Object} reservationData - Reservation data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created reservation with ID
   */
  static async createReservation(reservationData, userId) {
    try {
      // Validate reservation time
      await this.validateReservationTime(
        reservationData.equipmentId,
        reservationData.reservationDate,
        reservationData.startTime,
        reservationData.endTime
      );

      // Create reservation date objects
      const reservationDate = new Date(reservationData.reservationDate);
      const startTime = this.createDateTime(reservationDate, reservationData.startTime);
      const endTime = this.createDateTime(reservationDate, reservationData.endTime);

      // Prepare reservation data
      const reservation = {
        equipmentId: reservationData.equipmentId,
        userId,
        reservationDate: reservationDate,
        startTime: startTime,
        endTime: endTime,
        purpose: reservationData.purpose.trim(),
        notes: reservationData.notes?.trim() || '',
        status: RESERVATION_STATUS.PENDING,
        approvedBy: null,
        approvedAt: null,
        notificationSent: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), reservation);
      
      const createdReservation = {
        id: docRef.id,
        ...reservation,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Notify admins about new reservation request
      try {
        const equipment = await EquipmentService.getEquipmentById(reservationData.equipmentId);
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const user = userDoc.exists() ? userDoc.data() : null;

        if (equipment && user) {
          await NotificationService.notifyAdminsNewReservationRequest(createdReservation, equipment, user);
        }
      } catch (notificationError) {
        console.error('Error sending reservation notification:', notificationError);
      }
      
      return createdReservation;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  /**
   * Update reservation status
   * @param {string} reservationId - Reservation ID
   * @param {string} newStatus - New status
   * @param {string} updatedBy - UID of updater
   * @returns {Promise<Object>} Updated reservation
   */
  static async updateReservationStatus(reservationId, newStatus, updatedBy) {
    try {
      const reservationRef = doc(db, this.COLLECTION_NAME, reservationId);
      
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy
      };

      // Add approval data if approving
      if (newStatus === RESERVATION_STATUS.APPROVED) {
        updateData.approvedBy = updatedBy;
        updateData.approvedAt = serverTimestamp();
      }

      await updateDoc(reservationRef, updateData);
      
      // Get updated reservation
      const updatedReservation = await this.getReservationById(reservationId);
      
      // Send notification to user about status change
      try {
        const equipment = await EquipmentService.getEquipmentById(updatedReservation.equipmentId);
        
        if (newStatus === RESERVATION_STATUS.APPROVED) {
          await NotificationService.notifyUserReservationStatus(updatedReservation, equipment, true);
        } else if (newStatus === RESERVATION_STATUS.REJECTED) {
          await NotificationService.notifyUserReservationStatus(updatedReservation, equipment, false, 'ไม่ระบุเหตุผล');
        }
      } catch (notificationError) {
        console.error('Error sending reservation status notification:', notificationError);
      }
      
      return updatedReservation;
    } catch (error) {
      console.error('Error updating reservation status:', error);
      throw error;
    }
  }

  /**
   * Cancel reservation
   * @param {string} reservationId - Reservation ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success status
   */
  static async cancelReservation(reservationId, userId) {
    try {
      const reservation = await this.getReservationById(reservationId);
      
      if (!reservation) {
        throw new Error('ไม่พบการจองที่ต้องการยกเลิก');
      }

      // Check if user can cancel this reservation
      if (reservation.userId !== userId) {
        throw new Error('คุณไม่มีสิทธิ์ยกเลิกการจองนี้');
      }

      // Check if reservation can be cancelled
      if (reservation.status === RESERVATION_STATUS.COMPLETED || 
          reservation.status === RESERVATION_STATUS.CANCELLED ||
          reservation.status === RESERVATION_STATUS.EXPIRED) {
        throw new Error('ไม่สามารถยกเลิกการจองนี้ได้');
      }

      await this.updateReservationStatus(reservationId, RESERVATION_STATUS.CANCELLED, userId);
      return true;
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  }

  /**
   * Get reservation by ID
   * @param {string} reservationId - Reservation ID
   * @returns {Promise<Object|null>} Reservation data or null
   */
  static async getReservationById(reservationId) {
    try {
      const reservationRef = doc(db, this.COLLECTION_NAME, reservationId);
      const reservationDoc = await getDoc(reservationRef);
      
      if (reservationDoc.exists()) {
        return {
          id: reservationDoc.id,
          ...reservationDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting reservation by ID:', error);
      throw error;
    }
  }

  /**
   * Get reservations for equipment on a specific date
   * @param {string} equipmentId - Equipment ID
   * @param {Date} date - Date to check
   * @returns {Promise<Array>} Array of reservations
   */
  static async getEquipmentReservations(equipmentId, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const reservationsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        reservationsRef,
        and(
          where('equipmentId', '==', equipmentId),
          where('reservationDate', '>=', startOfDay),
          where('reservationDate', '<=', endOfDay),
          where('status', 'in', [
            RESERVATION_STATUS.PENDING,
            RESERVATION_STATUS.APPROVED,
            RESERVATION_STATUS.READY
          ])
        ),
        orderBy('startTime', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const reservations = [];
      
      querySnapshot.forEach((doc) => {
        reservations.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return reservations;
    } catch (error) {
      console.error('Error getting equipment reservations:', error);
      throw error;
    }
  }

  /**
   * Get user's reservations
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of user's reservations
   */
  static async getUserReservations(userId, filters = {}) {
    try {
      const {
        status = null,
        startDate = null,
        endDate = null,
        limit = 50
      } = filters;

      const reservationsRef = collection(db, this.COLLECTION_NAME);
      const queryConstraints = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      ];

      // Add status filter
      if (status) {
        queryConstraints.splice(1, 0, where('status', '==', status));
      }

      // Add date range filter
      if (startDate) {
        queryConstraints.splice(-1, 0, where('reservationDate', '>=', startDate));
      }
      if (endDate) {
        queryConstraints.splice(-1, 0, where('reservationDate', '<=', endDate));
      }

      const q = query(reservationsRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      const reservations = [];
      
      querySnapshot.forEach((doc, index) => {
        if (index < limit) {
          reservations.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });

      return reservations;
    } catch (error) {
      console.error('Error getting user reservations:', error);
      throw error;
    }
  }

  /**
   * Get all reservations (admin)
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of all reservations
   */
  static async getAllReservations(filters = {}) {
    try {
      const {
        status = null,
        equipmentId = null,
        startDate = null,
        endDate = null,
        limit = 100
      } = filters;

      const reservationsRef = collection(db, this.COLLECTION_NAME);
      const queryConstraints = [orderBy('createdAt', 'desc')];

      // Add filters
      if (status) {
        queryConstraints.unshift(where('status', '==', status));
      }
      if (equipmentId) {
        queryConstraints.unshift(where('equipmentId', '==', equipmentId));
      }
      if (startDate) {
        queryConstraints.splice(-1, 0, where('reservationDate', '>=', startDate));
      }
      if (endDate) {
        queryConstraints.splice(-1, 0, where('reservationDate', '<=', endDate));
      }

      const q = query(reservationsRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      const reservations = [];
      
      querySnapshot.forEach((doc, index) => {
        if (index < limit) {
          reservations.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });

      return reservations;
    } catch (error) {
      console.error('Error getting all reservations:', error);
      throw error;
    }
  }

  /**
   * Get pending reservations (admin)
   * @returns {Promise<Array>} Array of pending reservations
   */
  static async getPendingReservations() {
    try {
      return await this.getAllReservations({
        status: RESERVATION_STATUS.PENDING
      });
    } catch (error) {
      console.error('Error getting pending reservations:', error);
      throw error;
    }
  }

  /**
   * Check if time slot is available for equipment
   * @param {string} equipmentId - Equipment ID
   * @param {Date} date - Reservation date
   * @param {string} startTime - Start time (HH:mm)
   * @param {string} endTime - End time (HH:mm)
   * @param {string} excludeReservationId - Reservation ID to exclude (for updates)
   * @returns {Promise<boolean>} Whether the time slot is available
   */
  static async isTimeSlotAvailable(equipmentId, date, startTime, endTime, excludeReservationId = null) {
    try {
      const existingReservations = await this.getEquipmentReservations(equipmentId, date);
      
      const newStartTime = this.createDateTime(date, startTime);
      const newEndTime = this.createDateTime(date, endTime);

      for (const reservation of existingReservations) {
        // Skip if this is the reservation being updated
        if (excludeReservationId && reservation.id === excludeReservationId) {
          continue;
        }

        const existingStart = reservation.startTime.toDate();
        const existingEnd = reservation.endTime.toDate();

        // Check for time overlap
        if (
          (newStartTime >= existingStart && newStartTime < existingEnd) ||
          (newEndTime > existingStart && newEndTime <= existingEnd) ||
          (newStartTime <= existingStart && newEndTime >= existingEnd)
        ) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      throw error;
    }
  }

  /**
   * Get available time slots for equipment on a date
   * @param {string} equipmentId - Equipment ID
   * @param {Date} date - Date to check
   * @returns {Promise<Array>} Array of available time slots
   */
  static async getAvailableTimeSlots(equipmentId, date) {
    try {
      const existingReservations = await this.getEquipmentReservations(equipmentId, date);
      const { START_HOUR, END_HOUR, SLOT_DURATION } = TIME_SLOTS_CONFIG;
      
      const timeSlots = [];
      
      for (let hour = START_HOUR; hour < END_HOUR; hour++) {
        for (let minute = 0; minute < 60; minute += SLOT_DURATION) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotDateTime = this.createDateTime(date, timeString);
          
          // Check if this slot conflicts with any existing reservation
          let isAvailable = true;
          let conflictingReservation = null;
          
          for (const reservation of existingReservations) {
            const reservationStart = reservation.startTime.toDate();
            const reservationEnd = reservation.endTime.toDate();
            
            if (slotDateTime >= reservationStart && slotDateTime < reservationEnd) {
              isAvailable = false;
              conflictingReservation = reservation;
              break;
            }
          }
          
          timeSlots.push({
            time: timeString,
            available: isAvailable,
            reservationId: conflictingReservation?.id || null,
            status: conflictingReservation?.status || null
          });
        }
      }
      
      return timeSlots;
    } catch (error) {
      console.error('Error getting available time slots:', error);
      throw error;
    }
  }

  /**
   * Validate reservation time
   * @param {string} equipmentId - Equipment ID
   * @param {string} reservationDate - Reservation date
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   * @param {string} excludeReservationId - Reservation ID to exclude
   * @returns {Promise<boolean>} Validation result
   */
  static async validateReservationTime(equipmentId, reservationDate, startTime, endTime, excludeReservationId = null) {
    const date = new Date(reservationDate);
    const now = new Date();
    
    // Check if date is in the past
    if (date < now.setHours(0, 0, 0, 0)) {
      throw new Error('ไม่สามารถจองในวันที่ผ่านมาแล้ว');
    }
    
    // Check if date is too far in the future
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + TIME_SLOTS_CONFIG.ADVANCE_BOOKING_DAYS);
    if (date > maxAdvanceDate) {
      throw new Error(`สามารถจองล่วงหน้าได้สูงสุด ${TIME_SLOTS_CONFIG.ADVANCE_BOOKING_DAYS} วัน`);
    }
    
    // Validate time format and business hours
    const duration = calculateDuration(startTime, endTime);
    
    if (duration <= 0) {
      throw new Error('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
    }
    
    if (duration < TIME_SLOTS_CONFIG.MIN_DURATION) {
      throw new Error(`ระยะเวลาการจองต้องไม่น้อยกว่า ${TIME_SLOTS_CONFIG.MIN_DURATION} นาที`);
    }
    
    if (duration > TIME_SLOTS_CONFIG.MAX_DURATION) {
      throw new Error(`ระยะเวลาการจองต้องไม่เกิน ${TIME_SLOTS_CONFIG.MAX_DURATION} นาที`);
    }
    
    // Check time slot availability
    const isAvailable = await this.isTimeSlotAvailable(
      equipmentId, 
      date, 
      startTime, 
      endTime, 
      excludeReservationId
    );
    
    if (!isAvailable) {
      throw new Error('ช่วงเวลาที่เลือกไม่ว่าง กรุณาเลือกเวลาอื่น');
    }
    
    return true;
  }

  /**
   * Create DateTime object from date and time string
   * @param {Date} date - Base date
   * @param {string} timeString - Time in HH:mm format
   * @returns {Date} Combined DateTime
   */
  static createDateTime(date, timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  }

  /**
   * Get reservation statistics
   * @returns {Promise<Object>} Reservation statistics
   */
  static async getReservationStats() {
    try {
      const reservationsRef = collection(db, this.COLLECTION_NAME);
      const querySnapshot = await getDocs(reservationsRef);
      
      const stats = {
        total: 0,
        pending: 0,
        approved: 0,
        ready: 0,
        completed: 0,
        cancelled: 0,
        expired: 0
      };
      
      querySnapshot.forEach((doc) => {
        const reservation = doc.data();
        stats.total++;
        
        switch (reservation.status) {
          case RESERVATION_STATUS.PENDING:
            stats.pending++;
            break;
          case RESERVATION_STATUS.APPROVED:
            stats.approved++;
            break;
          case RESERVATION_STATUS.READY:
            stats.ready++;
            break;
          case RESERVATION_STATUS.COMPLETED:
            stats.completed++;
            break;
          case RESERVATION_STATUS.CANCELLED:
            stats.cancelled++;
            break;
          case RESERVATION_STATUS.EXPIRED:
            stats.expired++;
            break;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting reservation stats:', error);
      throw error;
    }
  }

  /**
   * Update expired reservations
   * This should be called periodically (e.g., by a cron job)
   * @returns {Promise<number>} Number of updated reservations
   */
  static async updateExpiredReservations() {
    try {
      const now = new Date();
      const reservationsRef = collection(db, this.COLLECTION_NAME);
      
      // Get reservations that should be expired
      const q = query(
        reservationsRef,
        where('status', 'in', [RESERVATION_STATUS.APPROVED, RESERVATION_STATUS.READY]),
        where('endTime', '<', now)
      );
      
      const querySnapshot = await getDocs(q);
      let updatedCount = 0;
      
      const updatePromises = [];
      querySnapshot.forEach((doc) => {
        const reservationRef = doc.ref;
        updatePromises.push(
          updateDoc(reservationRef, {
            status: RESERVATION_STATUS.EXPIRED,
            updatedAt: serverTimestamp()
          })
        );
        updatedCount++;
      });
      
      await Promise.all(updatePromises);
      return updatedCount;
    } catch (error) {
      console.error('Error updating expired reservations:', error);
      throw error;
    }
  }
}

export default ReservationService;