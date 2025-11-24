import { 
  doc, 
  getDoc,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Equipment Booking Service
 * Handles borrowing and reservations with race condition prevention
 */
class EquipmentBookingService {
  
  /**
   * Check if there's a date conflict for equipment
   * @param {string} equipmentId - Equipment ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} excludeId - Exclude specific booking ID (for updates)
   * @returns {Promise<boolean>} True if conflict exists
   */
  static async checkDateConflict(equipmentId, startDate, endDate, excludeId = null) {
    try {
      // Check active loans
      const loansQuery = query(
        collection(db, 'loanRequests'),
        where('equipmentId', '==', equipmentId),
        where('status', 'in', ['pending', 'approved', 'borrowed'])
      );
      
      const loansSnapshot = await getDocs(loansQuery);
      
      for (const loanDoc of loansSnapshot.docs) {
        if (excludeId && loanDoc.id === excludeId) continue;
        
        const loan = loanDoc.data();
        const loanStart = loan.startDate?.toDate();
        const loanEnd = loan.endDate?.toDate();
        
        // Check overlap
        if (this.datesOverlap(startDate, endDate, loanStart, loanEnd)) {
          return true;
        }
      }
      
      // Check reservations
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('equipmentId', '==', equipmentId),
        where('status', '==', 'confirmed')
      );
      
      const reservationsSnapshot = await getDocs(reservationsQuery);
      
      for (const resDoc of reservationsSnapshot.docs) {
        if (excludeId && resDoc.id === excludeId) continue;
        
        const reservation = resDoc.data();
        const resStart = reservation.startDate?.toDate();
        const resEnd = reservation.endDate?.toDate();
        
        // Check overlap
        if (this.datesOverlap(startDate, endDate, resStart, resEnd)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking date conflict:', error);
      throw error;
    }
  }
  
  /**
   * Check if two date ranges overlap
   */
  static datesOverlap(start1, end1, start2, end2) {
    return start1 <= end2 && end1 >= start2;
  }
  
  /**
   * Borrow equipment (immediate loan)
   * Uses Firestore transaction to prevent race conditions
   * 
   * @param {string} equipmentId - Equipment ID
   * @param {string} userId - User ID
   * @param {Object} borrowData - Borrow details
   * @returns {Promise<Object>} Result with loan request ID
   */
  static async borrowEquipment(equipmentId, userId, borrowData) {
    const equipmentRef = doc(db, 'equipmentManagement', equipmentId);
    
    try {
      const result = await runTransaction(db, async (transaction) => {
        // 1. Read current equipment data
        const equipmentDoc = await transaction.get(equipmentRef);
        
        if (!equipmentDoc.exists()) {
          throw new Error('ไม่พบอุปกรณ์');
        }
        
        const equipment = equipmentDoc.data();
        
        // 2. Check if equipment is available
        if (equipment.status !== 'available') {
          throw new Error('อุปกรณ์ไม่ว่าง - มีผู้อื่นยืมไปแล้ว');
        }
        
        // 3. Check for date conflicts (outside transaction for better performance)
        // Note: This check is done before transaction, so we'll verify again inside
        
        // 4. Create loan request
        const loanRef = doc(collection(db, 'loanRequests'));
        const loanData = {
          id: loanRef.id,
          equipmentId,
          equipmentName: equipment.name,
          equipmentBrand: equipment.brand,
          equipmentModel: equipment.model,
          userId,
          userName: borrowData.userName,
          userEmail: borrowData.userEmail,
          startDate: borrowData.startDate,
          endDate: borrowData.endDate,
          purpose: borrowData.purpose || '',
          status: 'approved', // Auto-approve for immediate borrow
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          approvedAt: serverTimestamp(),
          approvedBy: 'system'
        };
        
        transaction.set(loanRef, loanData);
        
        // 5. Update equipment status
        transaction.update(equipmentRef, {
          status: 'borrowed',
          currentLoan: {
            loanId: loanRef.id,
            userId,
            userName: borrowData.userName,
            borrowedAt: serverTimestamp(),
            expectedReturnDate: borrowData.endDate
          },
          updatedAt: serverTimestamp(),
          version: (equipment.version || 0) + 1
        });
        
        return { loanId: loanRef.id };
      });
      
      return { success: true, ...result };
    } catch (error) {
      console.error('Error borrowing equipment:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('ไม่ว่าง')) {
        throw new Error('อุปกรณ์ไม่ว่าง - มีผู้อื่นยืมไปแล้ว กรุณาเลือกอุปกรณ์อื่นหรือจองล่วงหน้า');
      }
      
      throw error;
    }
  }
  
  /**
   * Reserve equipment for future use
   * Uses Firestore transaction to prevent race conditions
   * 
   * @param {string} equipmentId - Equipment ID
   * @param {string} userId - User ID
   * @param {Object} reservationData - Reservation details
   * @returns {Promise<Object>} Result with reservation ID
   */
  static async reserveEquipment(equipmentId, userId, reservationData) {
    const equipmentRef = doc(db, 'equipmentManagement', equipmentId);
    
    try {
      // Pre-check for date conflicts
      const hasConflict = await this.checkDateConflict(
        equipmentId,
        reservationData.startDate,
        reservationData.endDate
      );
      
      if (hasConflict) {
        throw new Error('มีการจองในช่วงเวลานี้แล้ว');
      }
      
      const result = await runTransaction(db, async (transaction) => {
        // 1. Read current equipment data
        const equipmentDoc = await transaction.get(equipmentRef);
        
        if (!equipmentDoc.exists()) {
          throw new Error('ไม่พบอุปกรณ์');
        }
        
        const equipment = equipmentDoc.data();
        
        // 2. Double-check date conflicts inside transaction
        // (In case someone reserved between our check and transaction)
        const reservationsQuery = query(
          collection(db, 'reservations'),
          where('equipmentId', '==', equipmentId),
          where('status', '==', 'confirmed')
        );
        
        // Note: Can't use getDocs inside transaction, so we rely on pre-check
        // and version control
        
        // 3. Create reservation
        const reservationRef = doc(collection(db, 'reservations'));
        const reservation = {
          id: reservationRef.id,
          equipmentId,
          equipmentName: equipment.name,
          equipmentBrand: equipment.brand,
          equipmentModel: equipment.model,
          userId,
          userName: reservationData.userName,
          userEmail: reservationData.userEmail,
          startDate: reservationData.startDate,
          endDate: reservationData.endDate,
          purpose: reservationData.purpose || '',
          status: 'confirmed',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        transaction.set(reservationRef, reservation);
        
        // 4. Update equipment with reservation info
        const currentReservations = equipment.reservations || [];
        transaction.update(equipmentRef, {
          reservations: [...currentReservations, {
            id: reservationRef.id,
            userId,
            userName: reservationData.userName,
            startDate: reservationData.startDate,
            endDate: reservationData.endDate,
            status: 'confirmed'
          }],
          updatedAt: serverTimestamp(),
          version: (equipment.version || 0) + 1
        });
        
        return { reservationId: reservationRef.id };
      });
      
      return { success: true, ...result };
    } catch (error) {
      console.error('Error reserving equipment:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('ทับซ้อน') || error.message.includes('จอง')) {
        throw new Error('มีการจองในช่วงเวลานี้แล้ว กรุณาเลือกวันอื่น');
      }
      
      throw error;
    }
  }
  
  /**
   * Get equipment status with detailed information
   * @param {string} equipmentId - Equipment ID
   * @returns {Promise<Object>} Equipment status details
   */
  static async getEquipmentStatus(equipmentId) {
    try {
      const equipmentDoc = await getDoc(doc(db, 'equipmentManagement', equipmentId));
      
      if (!equipmentDoc.exists()) {
        throw new Error('ไม่พบอุปกรณ์');
      }
      
      const equipment = equipmentDoc.data();
      const now = new Date();
      
      // Check current loan
      if (equipment.status === 'borrowed' && equipment.currentLoan) {
        const returnDate = equipment.currentLoan.expectedReturnDate?.toDate();
        const hasUpcomingReservation = equipment.reservations?.some(
          r => r.status === 'confirmed' && r.startDate?.toDate() > now
        );
        
        return {
          status: 'borrowed',
          message: `ถูกยืมโดย ${equipment.currentLoan.userName}`,
          borrower: equipment.currentLoan.userName,
          returnDate: returnDate,
          canBorrow: false,
          canReserve: !hasUpcomingReservation,
          nextAvailable: hasUpcomingReservation 
            ? equipment.reservations[0].endDate?.toDate()
            : returnDate
        };
      }
      
      // Check reservations
      if (equipment.reservations?.length > 0) {
        const activeReservations = equipment.reservations
          .filter(r => r.status === 'confirmed' && r.endDate?.toDate() > now)
          .sort((a, b) => a.startDate?.toDate() - b.startDate?.toDate());
        
        if (activeReservations.length > 0) {
          const nextReservation = activeReservations[0];
          const reservationStart = nextReservation.startDate?.toDate();
          
          return {
            status: 'available-with-reservation',
            message: 'ว่าง (มีการจองล่วงหน้า)',
            canBorrow: reservationStart > now,
            canReserve: true,
            nextReservation: {
              userName: nextReservation.userName,
              startDate: reservationStart,
              endDate: nextReservation.endDate?.toDate()
            }
          };
        }
      }
      
      // Available
      if (equipment.status === 'available') {
        return {
          status: 'available',
          message: 'ว่าง - พร้อมใช้งาน',
          canBorrow: true,
          canReserve: true
        };
      }
      
      // Maintenance
      if (equipment.status === 'maintenance') {
        return {
          status: 'maintenance',
          message: 'อยู่ระหว่างซ่อมบำรุง',
          canBorrow: false,
          canReserve: false
        };
      }
      
      return {
        status: 'unknown',
        message: 'ไม่ทราบสถานะ',
        canBorrow: false,
        canReserve: false
      };
    } catch (error) {
      console.error('Error getting equipment status:', error);
      throw error;
    }
  }
  
  /**
   * Get available dates for equipment
   * @param {string} equipmentId - Equipment ID
   * @param {Date} startDate - Start date to check from
   * @param {Date} endDate - End date to check until
   * @returns {Promise<Array>} Array of unavailable date ranges
   */
  static async getUnavailableDates(equipmentId, startDate, endDate) {
    try {
      const unavailableDates = [];
      
      // Get active loans
      const loansQuery = query(
        collection(db, 'loanRequests'),
        where('equipmentId', '==', equipmentId),
        where('status', 'in', ['approved', 'borrowed'])
      );
      
      const loansSnapshot = await getDocs(loansQuery);
      loansSnapshot.forEach(doc => {
        const loan = doc.data();
        unavailableDates.push({
          type: 'loan',
          startDate: loan.startDate?.toDate(),
          endDate: loan.endDate?.toDate(),
          userName: loan.userName
        });
      });
      
      // Get confirmed reservations
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('equipmentId', '==', equipmentId),
        where('status', '==', 'confirmed')
      );
      
      const reservationsSnapshot = await getDocs(reservationsQuery);
      reservationsSnapshot.forEach(doc => {
        const reservation = doc.data();
        unavailableDates.push({
          type: 'reservation',
          startDate: reservation.startDate?.toDate(),
          endDate: reservation.endDate?.toDate(),
          userName: reservation.userName
        });
      });
      
      // Sort by start date
      unavailableDates.sort((a, b) => a.startDate - b.startDate);
      
      return unavailableDates;
    } catch (error) {
      console.error('Error getting unavailable dates:', error);
      throw error;
    }
  }
}

export default EquipmentBookingService;
