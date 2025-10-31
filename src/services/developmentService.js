/**
 * Development Service
 * Provides mock data and services for development without Firebase
 */

import { mockEquipment, mockUsers, mockReservations } from '../utils/mockData';
import { EQUIPMENT_STATUS } from '../types/equipment';
import { RESERVATION_STATUS } from '../types/reservation';
import NotificationReservationService from './notificationReservationService';

class DevelopmentService {
  static isDevMode() {
    return process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATOR !== 'true';
  }

  // Mock Equipment Service
  static async getEquipmentList(filters = {}) {
    if (!this.isDevMode()) return null;

    await this.delay(500); // Simulate network delay

    let filteredEquipment = [...mockEquipment];

    // Apply filters
    if (filters.status) {
      filteredEquipment = filteredEquipment.filter(eq => eq.status === filters.status);
    }

    if (filters.category) {
      filteredEquipment = filteredEquipment.filter(eq => eq.category === filters.category);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredEquipment = filteredEquipment.filter(eq => 
        eq.name.toLowerCase().includes(searchLower) ||
        eq.brand.toLowerCase().includes(searchLower) ||
        eq.model.toLowerCase().includes(searchLower)
      );
    }

    return {
      equipment: filteredEquipment,
      pagination: {
        currentPage: 1,
        hasNextPage: false,
        totalItems: filteredEquipment.length,
        limit: 50
      }
    };
  }

  static async getAvailableEquipment() {
    if (!this.isDevMode()) return null;

    const result = await this.getEquipmentList({ status: EQUIPMENT_STATUS.AVAILABLE });
    return result.equipment;
  }

  // Mock Reservation Service
  static async getEquipmentReservations(equipmentId, date) {
    if (!this.isDevMode()) return null;

    await this.delay(300);

    const dateStr = date.toDateString();
    return mockReservations.filter(res => {
      const resDateStr = new Date(res.reservationDate).toDateString();
      return res.equipmentId === equipmentId && resDateStr === dateStr;
    });
  }

  static async getAvailableTimeSlots(equipmentId, date) {
    if (!this.isDevMode()) return null;

    await this.delay(300);

    const reservations = await this.getEquipmentReservations(equipmentId, date);
    const timeSlots = [];

    // Generate time slots from 8:00 to 18:00
    for (let hour = 8; hour < 18; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const slotDateTime = new Date(date);
      slotDateTime.setHours(hour, 0, 0, 0);

      // Check if this slot conflicts with any reservation
      let isAvailable = true;
      let conflictingReservation = null;

      for (const reservation of reservations) {
        const reservationStart = new Date(reservation.startTime);
        const reservationEnd = new Date(reservation.endTime);

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

    return timeSlots;
  }

  static async createReservation(reservationData, userId) {
    if (!this.isDevMode()) return null;

    await this.delay(500);

    console.log('Development Service: Creating reservation', { reservationData, userId });

    const newReservation = {
      id: `res_${Date.now()}`,
      equipmentId: reservationData.equipmentId,
      userId,
      reservationDate: reservationData.reservationDate,
      startTime: reservationData.startTime,
      endTime: reservationData.endTime,
      purpose: reservationData.purpose,
      notes: reservationData.notes || '',
      status: RESERVATION_STATUS.PENDING,
      approvedBy: null,
      approvedAt: null,
      notificationSent: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to mock data (in real app, this would persist)
    mockReservations.push(newReservation);

    console.log('Development Service: Reservation created', newReservation);

    // Send notification
    await NotificationReservationService.notifyReservationCreated(newReservation);

    return newReservation;
  }

  static async getUserReservations(userId, filters = {}) {
    if (!this.isDevMode()) return null;

    await this.delay(300);

    let userReservations = mockReservations.filter(res => res.userId === userId);

    if (filters.status) {
      userReservations = userReservations.filter(res => res.status === filters.status);
    }

    return userReservations;
  }

  static async getAllReservations(filters = {}) {
    if (!this.isDevMode()) return null;

    await this.delay(300);

    let allReservations = [...mockReservations];

    if (filters.status) {
      allReservations = allReservations.filter(res => res.status === filters.status);
    }

    if (filters.equipmentId) {
      allReservations = allReservations.filter(res => res.equipmentId === filters.equipmentId);
    }

    if (filters.startDate) {
      allReservations = allReservations.filter(res => 
        new Date(res.reservationDate) >= filters.startDate
      );
    }

    if (filters.endDate) {
      allReservations = allReservations.filter(res => 
        new Date(res.reservationDate) <= filters.endDate
      );
    }

    return allReservations;
  }

  static async updateReservationStatus(reservationId, newStatus, updatedBy) {
    if (!this.isDevMode()) return null;

    await this.delay(300);

    const reservationIndex = mockReservations.findIndex(res => res.id === reservationId);
    if (reservationIndex === -1) {
      throw new Error('ไม่พบการจองที่ต้องการอัปเดต');
    }

    const oldStatus = mockReservations[reservationIndex].status;
    mockReservations[reservationIndex] = {
      ...mockReservations[reservationIndex],
      status: newStatus,
      updatedAt: new Date(),
      updatedBy
    };

    // Add approval data if approving
    if (newStatus === RESERVATION_STATUS.APPROVED) {
      mockReservations[reservationIndex].approvedBy = updatedBy;
      mockReservations[reservationIndex].approvedAt = new Date();
    }

    const updatedReservation = mockReservations[reservationIndex];

    // Send appropriate notification
    if (oldStatus !== newStatus) {
      switch (newStatus) {
        case RESERVATION_STATUS.APPROVED:
          await NotificationReservationService.notifyReservationApproved(updatedReservation);
          break;
        case RESERVATION_STATUS.CANCELLED:
          await NotificationReservationService.notifyReservationRejected(updatedReservation);
          break;
        case RESERVATION_STATUS.READY:
          await NotificationReservationService.notifyReservationReady(updatedReservation);
          break;
        case RESERVATION_STATUS.EXPIRED:
          await NotificationReservationService.notifyReservationExpired(updatedReservation);
          break;
      }
    }

    console.log('Development Service: Reservation status updated', updatedReservation);

    return updatedReservation;
  }

  static async cancelReservation(reservationId, userId) {
    if (!this.isDevMode()) return null;

    await this.delay(300);

    const reservation = mockReservations.find(res => res.id === reservationId);
    if (!reservation) {
      throw new Error('ไม่พบการจองที่ต้องการยกเลิก');
    }

    if (reservation.userId !== userId) {
      throw new Error('คุณไม่มีสิทธิ์ยกเลิกการจองนี้');
    }

    if (![RESERVATION_STATUS.PENDING, RESERVATION_STATUS.APPROVED].includes(reservation.status)) {
      throw new Error('ไม่สามารถยกเลิกการจองนี้ได้');
    }

    return await this.updateReservationStatus(reservationId, RESERVATION_STATUS.CANCELLED, userId);
  }

  static async getReservationStats() {
    if (!this.isDevMode()) return null;

    await this.delay(200);

    const stats = {
      total: mockReservations.length,
      pending: 0,
      approved: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
      expired: 0
    };

    mockReservations.forEach(reservation => {
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
  }

  // Mock Auth Service
  static async getCurrentUser() {
    if (!this.isDevMode()) return null;

    await this.delay(200);

    return {
      uid: 'dev_user',
      email: 'dev@example.com',
      displayName: 'Development User',
      photoURL: null
    };
  }

  static async getUserProfile(uid) {
    if (!this.isDevMode()) return null;

    await this.delay(200);

    return {
      uid,
      email: 'dev@example.com',
      displayName: 'Development User',
      role: 'user',
      department: 'IT',
      position: 'Developer',
      phone: '081-234-5678',
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Utility methods
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static log(message, data = null) {
    if (this.isDevMode()) {
      console.log(`🔧 Dev Service: ${message}`, data || '');
    }
  }
}

export default DevelopmentService;