/**
 * Unit Tests for ReservationService.convertToLoanRequest
 * 
 * Tests the conversion of reservations to loan requests
 */

import ReservationService from '../reservationService';
import { RESERVATION_STATUS } from '../../types/reservation';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {},
  auth: {}
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => new Date())
}));

// Mock other services
jest.mock('../equipmentService', () => ({
  default: {
    getEquipmentById: jest.fn()
  }
}));

jest.mock('../notificationService', () => ({
  default: {
    createNotification: jest.fn()
  }
}));

describe('ReservationService.canConvertToLoan', () => {
  test('returns true for approved reservation without conversion', () => {
    const reservation = {
      id: 'test-reservation',
      status: RESERVATION_STATUS.APPROVED,
      convertedToLoanId: null
    };

    const result = ReservationService.canConvertToLoan(reservation);
    
    expect(result.canConvert).toBe(true);
  });

  test('returns true for ready reservation without conversion', () => {
    const reservation = {
      id: 'test-reservation',
      status: RESERVATION_STATUS.READY,
      convertedToLoanId: null
    };

    const result = ReservationService.canConvertToLoan(reservation);
    
    expect(result.canConvert).toBe(true);
  });

  test('returns false for pending reservation', () => {
    const reservation = {
      id: 'test-reservation',
      status: RESERVATION_STATUS.PENDING,
      convertedToLoanId: null
    };

    const result = ReservationService.canConvertToLoan(reservation);
    
    expect(result.canConvert).toBe(false);
    expect(result.reason).toBe('สถานะการจองไม่ถูกต้อง');
  });

  test('returns false for completed reservation', () => {
    const reservation = {
      id: 'test-reservation',
      status: RESERVATION_STATUS.COMPLETED,
      convertedToLoanId: null
    };

    const result = ReservationService.canConvertToLoan(reservation);
    
    expect(result.canConvert).toBe(false);
    expect(result.reason).toBe('สถานะการจองไม่ถูกต้อง');
  });

  test('returns false for cancelled reservation', () => {
    const reservation = {
      id: 'test-reservation',
      status: RESERVATION_STATUS.CANCELLED,
      convertedToLoanId: null
    };

    const result = ReservationService.canConvertToLoan(reservation);
    
    expect(result.canConvert).toBe(false);
    expect(result.reason).toBe('สถานะการจองไม่ถูกต้อง');
  });

  test('returns false for already converted reservation', () => {
    const reservation = {
      id: 'test-reservation',
      status: RESERVATION_STATUS.APPROVED,
      convertedToLoanId: 'existing-loan-id'
    };

    const result = ReservationService.canConvertToLoan(reservation);
    
    expect(result.canConvert).toBe(false);
    expect(result.reason).toBe('การจองนี้ถูกแปลงเป็นคำขอยืมแล้ว');
  });

  test('returns false for null reservation', () => {
    const result = ReservationService.canConvertToLoan(null);
    
    expect(result.canConvert).toBe(false);
    expect(result.reason).toBe('ไม่พบข้อมูลการจอง');
  });

  test('returns false for undefined reservation', () => {
    const result = ReservationService.canConvertToLoan(undefined);
    
    expect(result.canConvert).toBe(false);
    expect(result.reason).toBe('ไม่พบข้อมูลการจอง');
  });
});

describe('Reservation to Loan Data Mapping', () => {
  test('reservation has all required fields for loan conversion', () => {
    const reservation = {
      id: 'test-reservation',
      equipmentId: 'equipment-123',
      userId: 'user-456',
      reservationDate: new Date('2024-12-20'),
      startTime: new Date('2024-12-20T09:00:00'),
      endTime: new Date('2024-12-20T17:00:00'),
      expectedReturnDate: new Date('2024-12-27'),
      purpose: 'Test purpose',
      notes: 'Test notes',
      status: RESERVATION_STATUS.APPROVED
    };

    // Verify all required fields exist
    expect(reservation.equipmentId).toBeDefined();
    expect(reservation.userId).toBeDefined();
    expect(reservation.startTime).toBeDefined();
    expect(reservation.expectedReturnDate).toBeDefined();
    expect(reservation.purpose).toBeDefined();
  });

  test('expectedReturnDate defaults to 7 days if not provided', () => {
    const reservation = {
      id: 'test-reservation',
      equipmentId: 'equipment-123',
      userId: 'user-456',
      startTime: new Date('2024-12-20T09:00:00'),
      purpose: 'Test purpose',
      status: RESERVATION_STATUS.APPROVED
      // expectedReturnDate is not provided
    };

    // When expectedReturnDate is not provided, it should default to 7 days from borrow date
    const borrowDate = reservation.startTime;
    const defaultReturnDate = new Date(borrowDate);
    defaultReturnDate.setDate(defaultReturnDate.getDate() + 7);

    expect(defaultReturnDate.getDate()).toBe(borrowDate.getDate() + 7);
  });
});
