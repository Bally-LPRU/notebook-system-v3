import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
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
   * Helper to safely convert to Date - handles Firestore Timestamp, Date, and string
   * @param {*} value - Value to convert
   * @returns {Date|null} Date object or null
   */
  static _toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    return null;
  }

  /**
   * Create new reservation
   * @param {Object} reservationData - Reservation data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created reservation with ID
   */
  static async createReservation(reservationData, userId) {
    try {
      // Create reservation date objects - handle both Date objects and strings
      const reservationDate = this._toDate(reservationData.reservationDate) || new Date(reservationData.reservationDate);
      
      // Handle startTime - can be Date object or string "HH:mm"
      let startTime;
      if (reservationData.startTime instanceof Date) {
        startTime = reservationData.startTime;
      } else if (typeof reservationData.startTime === 'string') {
        startTime = this.createDateTime(reservationDate, reservationData.startTime);
      } else {
        startTime = this._toDate(reservationData.startTime);
      }
      
      // Handle endTime - can be Date object or string "HH:mm"
      let endTime;
      if (reservationData.endTime instanceof Date) {
        endTime = reservationData.endTime;
      } else if (typeof reservationData.endTime === 'string') {
        endTime = this.createDateTime(reservationDate, reservationData.endTime);
      } else {
        endTime = this._toDate(reservationData.endTime);
      }
      
      // Extract time strings for validation
      const startTimeStr = startTime ? `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}` : null;
      const endTimeStr = endTime ? `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}` : null;

      // Validate reservation time
      await this.validateReservationTime(
        reservationData.equipmentId,
        reservationDate,
        startTimeStr,
        endTimeStr
      );

      // Calculate expected return date (default: same day as reservation if not provided)
      const expectedReturnDate = reservationData.expectedReturnDate 
        ? new Date(reservationData.expectedReturnDate)
        : new Date(reservationDate);

      // Prepare reservation data
      const reservation = {
        equipmentId: reservationData.equipmentId,
        userId,
        reservationDate: reservationDate,
        startTime: startTime,
        endTime: endTime,
        expectedReturnDate: expectedReturnDate,
        purpose: reservationData.purpose.trim(),
        notes: reservationData.notes?.trim() || '',
        status: RESERVATION_STATUS.PENDING,
        approvedBy: null,
        approvedAt: null,
        notificationSent: false,
        convertedToLoanId: null,
        convertedAt: null,
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
          
          // Send Discord notification for new reservation
          try {
            const discordWebhookService = (await import('./discordWebhookService.js')).default;
            await discordWebhookService.notifyNewReservation({
              ...createdReservation,
              userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.displayName || user.email || 'Unknown',
              equipmentName: equipment.name || 'Unknown'
            });
          } catch (discordError) {
            console.error('Error sending Discord notification:', discordError);
          }
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
        
        switch (newStatus) {
          case RESERVATION_STATUS.APPROVED:
            await NotificationService.notifyUserReservationStatus(updatedReservation, equipment, true);
            break;
          case RESERVATION_STATUS.REJECTED:
            await NotificationService.notifyUserReservationStatus(updatedReservation, equipment, false, 'ไม่ระบุเหตุผล');
            break;
          case RESERVATION_STATUS.READY:
            // Notification for ready status is handled by scheduled notification
            // But we can send an immediate notification too
            await NotificationService.createNotification(
              updatedReservation.userId,
              'reservation_ready',
              'อุปกรณ์พร้อมรับ',
              `${equipment.name} พร้อมให้รับแล้ว กรุณามารับภายในเวลาที่กำหนด`,
              { 
                reservationId, 
                equipmentId: equipment.id, 
                equipmentName: equipment.name 
              }
            );
            break;
          case RESERVATION_STATUS.COMPLETED:
            await NotificationService.notifyUserReservationCompleted(updatedReservation, equipment);
            break;
          case RESERVATION_STATUS.EXPIRED:
            await NotificationService.notifyUserReservationExpired(updatedReservation, equipment);
            break;
          case RESERVATION_STATUS.CANCELLED:
            await NotificationService.notifyUserReservationCancelled(
              updatedReservation, 
              equipment, 
              updatedBy,
              ''
            );
            break;
          default:
            // No notification for other statuses
            break;
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

      // Simple query - filter by equipmentId only, then filter in memory
      const reservationsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        reservationsRef,
        where('equipmentId', '==', equipmentId)
      );

      const querySnapshot = await getDocs(q);
      const reservations = [];
      
      const activeStatuses = [
        RESERVATION_STATUS.PENDING,
        RESERVATION_STATUS.APPROVED,
        RESERVATION_STATUS.READY
      ];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const reservationDate = data.reservationDate?.toDate ? data.reservationDate.toDate() : new Date(data.reservationDate);
        
        // Filter by date range and status in memory
        if (reservationDate >= startOfDay && 
            reservationDate <= endOfDay && 
            activeStatuses.includes(data.status)) {
          reservations.push({
            id: docSnap.id,
            ...data
          });
        }
      });

      // Sort by startTime
      reservations.sort((a, b) => {
        const aTime = a.startTime?.toDate ? a.startTime.toDate() : new Date(a.startTime);
        const bTime = b.startTime?.toDate ? b.startTime.toDate() : new Date(b.startTime);
        return aTime - bTime;
      });

      return reservations;
    } catch (error) {
      console.error('Error getting equipment reservations:', error);
      return []; // Return empty array on error to not block UI
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

        const existingStart = this._toDate(reservation.startTime);
        const existingEnd = this._toDate(reservation.endTime);

        // Skip if dates are invalid
        if (!existingStart || !existingEnd) continue;

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
            const reservationStart = this._toDate(reservation.startTime);
            const reservationEnd = this._toDate(reservation.endTime);
            
            // Skip if dates are invalid
            if (!reservationStart || !reservationEnd) continue;
            
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
          default:
            // Unknown status
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
      let totalUpdatedCount = 0;
      
      // Query separately for each status to avoid composite index issues
      const statusesToCheck = [RESERVATION_STATUS.APPROVED, RESERVATION_STATUS.READY];
      
      for (const status of statusesToCheck) {
        try {
          const q = query(
            reservationsRef,
            where('status', '==', status),
            orderBy('endTime', 'asc')
          );
          
          const querySnapshot = await getDocs(q);
          const updatePromises = [];
          const expiredDocs = [];
          
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const endTime = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);
            
            // Check if reservation has expired
            if (endTime < now) {
              expiredDocs.push(docSnap.ref);
            }
          });
          
          // Create update promises outside the forEach loop
          for (const docRef of expiredDocs) {
            updatePromises.push(
              updateDoc(docRef, {
                status: RESERVATION_STATUS.EXPIRED,
                updatedAt: serverTimestamp()
              })
            );
          }
          
          await Promise.all(updatePromises);
          totalUpdatedCount += expiredDocs.length;
        } catch (statusError) {
          console.warn(`Error checking ${status} reservations:`, statusError.message);
        }
      }
      
      return totalUpdatedCount;
    } catch (error) {
      console.error('Error updating expired reservations:', error);
      // Don't throw - just return 0 to not block the UI
      return 0;
    }
  }

  /**
   * Check if user has active loan for same equipment on same day
   * @param {string} userId - User ID
   * @param {string} equipmentId - Equipment ID
   * @param {Date} date - Date to check
   * @returns {Promise<boolean>} True if conflict exists
   */
  static async hasLoanConflict(userId, equipmentId, date) {
    try {
      // Import loanRequestService dynamically to avoid circular dependency
      const { default: LoanRequestService } = await import('./loanRequestService');
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Check for active loans on the same day
      const loans = await LoanRequestService.getUserLoanRequests(userId, {
        status: ['approved', 'borrowed'],
        equipmentId
      });
      
      // Check if any loan overlaps with the reservation date
      for (const loan of loans) {
        const borrowDate = loan.borrowDate?.toDate ? loan.borrowDate.toDate() : new Date(loan.borrowDate);
        const returnDate = loan.expectedReturnDate?.toDate ? loan.expectedReturnDate.toDate() : new Date(loan.expectedReturnDate);
        
        if (borrowDate <= endOfDay && returnDate >= startOfDay) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking loan conflict:', error);
      return false;
    }
  }

  /**
   * Check if user can make a reservation based on settings
   * @param {string} userId - User ID
   * @param {Object} reservationData - Reservation data
   * @param {Object} settings - System settings
   * @returns {Promise<Object>} Validation result { valid: boolean, error?: string }
   */
  static async validateReservationWithSettings(userId, reservationData, settings) {
    try {
      const { equipmentId, reservationDate } = reservationData;
      const date = new Date(reservationDate);
      
      // Check max advance booking days
      const maxAdvanceDays = settings.maxAdvanceBookingDays || 30;
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
      
      if (date > maxDate) {
        return {
          valid: false,
          error: `สามารถจองล่วงหน้าได้สูงสุด ${maxAdvanceDays} วัน`
        };
      }
      
      // Check for loan conflict on same day
      const hasConflict = await this.hasLoanConflict(userId, equipmentId, date);
      if (hasConflict) {
        return {
          valid: false,
          error: 'ไม่สามารถจองอุปกรณ์ที่คุณกำลังยืมอยู่ในวันเดียวกันได้'
        };
      }
      
      // Check closed dates
      const settingsService = (await import('./settingsService')).default;
      const isClosed = await settingsService.isDateClosed(date);
      if (isClosed) {
        return {
          valid: false,
          error: 'วันที่เลือกเป็นวันปิดทำการ'
        };
      }
      
      return { valid: true };
    } catch (error) {
      console.error('Error validating reservation with settings:', error);
      return { valid: true }; // Allow on error to not block users
    }
  }

  /**
   * Get user's active reservations count
   * @param {string} userId - User ID
   * @returns {Promise<number>} Count of active reservations
   */
  static async getUserActiveReservationsCount(userId) {
    try {
      const reservationsRef = collection(db, this.COLLECTION_NAME);
      // Simple query - filter by userId only, then filter status in memory
      const q = query(
        reservationsRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const activeStatuses = [
        RESERVATION_STATUS.PENDING,
        RESERVATION_STATUS.APPROVED,
        RESERVATION_STATUS.READY
      ];
      
      let count = 0;
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (activeStatuses.includes(data.status)) {
          count++;
        }
      });
      
      return count;
    } catch (error) {
      console.error('Error getting user active reservations count:', error);
      return 0;
    }
  }

  /**
   * Convert reservation to loan request
   * เมื่อผู้ใช้มารับอุปกรณ์ตามวันเวลาที่จองไว้ admin สามารถแปลงการจองเป็นคำขอยืมได้
   * @param {string} reservationId - Reservation ID
   * @param {string} convertedBy - UID of admin who converts
   * @returns {Promise<Object>} Created loan request
   */
  static async convertToLoanRequest(reservationId, convertedBy) {
    try {
      // Get reservation data
      const reservation = await this.getReservationById(reservationId);
      if (!reservation) {
        throw new Error('ไม่พบการจองที่ต้องการแปลง');
      }

      // Validate reservation status - only approved or ready can be converted
      if (reservation.status !== RESERVATION_STATUS.APPROVED && 
          reservation.status !== RESERVATION_STATUS.READY) {
        throw new Error('สามารถแปลงได้เฉพาะการจองที่อนุมัติแล้วหรือพร้อมรับเท่านั้น');
      }

      // Check if already converted
      if (reservation.convertedToLoanId) {
        throw new Error('การจองนี้ถูกแปลงเป็นคำขอยืมแล้ว');
      }

      // Import LoanRequestService dynamically to avoid circular dependency
      const { default: LoanRequestService } = await import('./loanRequestService');

      // Get equipment info
      const equipment = await EquipmentService.getEquipmentById(reservation.equipmentId);
      if (!equipment) {
        throw new Error('ไม่พบอุปกรณ์ในระบบ');
      }

      // Prepare borrow date from reservation
      const borrowDate = reservation.startTime?.toDate 
        ? reservation.startTime.toDate() 
        : new Date(reservation.startTime);

      // Get expected return date from reservation or default to 7 days
      let expectedReturnDate;
      if (reservation.expectedReturnDate) {
        expectedReturnDate = reservation.expectedReturnDate?.toDate 
          ? reservation.expectedReturnDate.toDate() 
          : new Date(reservation.expectedReturnDate);
      } else {
        // Default: 7 days from borrow date
        expectedReturnDate = new Date(borrowDate);
        expectedReturnDate.setDate(expectedReturnDate.getDate() + 7);
      }

      // Create loan request data
      const loanRequestData = {
        equipmentId: reservation.equipmentId,
        borrowDate: borrowDate,
        expectedReturnDate: expectedReturnDate,
        purpose: reservation.purpose || 'แปลงจากการจอง',
        notes: `แปลงจากการจอง #${reservationId.slice(-8)}${reservation.notes ? ` - ${reservation.notes}` : ''}`
      };

      // Create loan request using the service
      const loanRequest = await LoanRequestService.createLoanRequest(loanRequestData, reservation.userId);

      // Auto-approve the loan request since it came from an approved reservation
      const approvedLoanRequest = await LoanRequestService.approveLoanRequest(loanRequest.id, convertedBy);

      // Update reservation status to completed and link to loan request
      const reservationRef = doc(db, this.COLLECTION_NAME, reservationId);
      await updateDoc(reservationRef, {
        status: RESERVATION_STATUS.COMPLETED,
        convertedToLoanId: loanRequest.id,
        convertedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: convertedBy
      });

      // Send notification to user
      try {
        await NotificationService.createNotification(
          reservation.userId,
          'reservation_converted',
          'การจองถูกแปลงเป็นคำขอยืม',
          `การจอง ${equipment.name} ถูกแปลงเป็นคำขอยืมเรียบร้อยแล้ว กรุณารับอุปกรณ์`,
          { 
            reservationId, 
            loanRequestId: loanRequest.id,
            equipmentId: equipment.id, 
            equipmentName: equipment.name 
          }
        );

        // Send Discord notification
        try {
          const discordWebhookService = (await import('./discordWebhookService.js')).default;
          await discordWebhookService.sendNotification({
            title: '🔄 การจองถูกแปลงเป็นคำขอยืม',
            description: `การจอง #${reservationId.slice(-8)} ถูกแปลงเป็นคำขอยืม #${loanRequest.id.slice(-8)}`,
            color: 0x3498db,
            fields: [
              { name: 'อุปกรณ์', value: equipment.name, inline: true },
              { name: 'วันที่ยืม', value: borrowDate.toLocaleDateString('th-TH'), inline: true },
              { name: 'กำหนดคืน', value: expectedReturnDate.toLocaleDateString('th-TH'), inline: true }
            ]
          });
        } catch (discordError) {
          console.warn('Error sending Discord notification:', discordError);
        }
      } catch (notificationError) {
        console.error('Error sending conversion notification:', notificationError);
      }

      return {
        reservation: {
          ...reservation,
          status: RESERVATION_STATUS.COMPLETED,
          convertedToLoanId: loanRequest.id,
          convertedAt: new Date()
        },
        loanRequest: approvedLoanRequest
      };
    } catch (error) {
      console.error('Error converting reservation to loan request:', error);
      throw error;
    }
  }

  /**
   * Check if reservation can be converted to loan request
   * @param {Object} reservation - Reservation object
   * @returns {Object} { canConvert: boolean, reason?: string }
   */
  static canConvertToLoan(reservation) {
    if (!reservation) {
      return { canConvert: false, reason: 'ไม่พบข้อมูลการจอง' };
    }

    if (reservation.convertedToLoanId) {
      return { canConvert: false, reason: 'การจองนี้ถูกแปลงเป็นคำขอยืมแล้ว' };
    }

    if (reservation.status !== RESERVATION_STATUS.APPROVED && 
        reservation.status !== RESERVATION_STATUS.READY) {
      return { canConvert: false, reason: 'สถานะการจองไม่ถูกต้อง' };
    }

    return { canConvert: true };
  }
}

export default ReservationService;