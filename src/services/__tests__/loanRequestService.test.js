import { jest } from '@jest/globals';
import LoanRequestService from '../loanRequestService';
import { LOAN_REQUEST_STATUS } from '../../types/loanRequest';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 }))
}));

describe('LoanRequestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLoanRequest', () => {
    it('should create loan request successfully', async () => {
      const requestData = {
        equipmentId: 'eq1',
        userId: 'user1',
        borrowDate: new Date('2024-01-15'),
        expectedReturnDate: new Date('2024-01-20'),
        purpose: 'For presentation',
        notes: 'Handle with care'
      };

      const mockDocRef = { id: 'loan-req-1' };

      const { collection, addDoc, serverTimestamp } = require('firebase/firestore');
      collection.mockReturnValue('loanRequests');
      addDoc.mockResolvedValue(mockDocRef);
      serverTimestamp.mockReturnValue({ seconds: Date.now() / 1000 });

      const result = await LoanRequestService.createLoanRequest(requestData);

      expect(addDoc).toHaveBeenCalledWith('loanRequests', {
        ...requestData,
        status: LOAN_REQUEST_STATUS.PENDING,
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object)
      });
      expect(result).toBe('loan-req-1');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        equipmentId: 'eq1'
        // Missing required fields
      };

      await expect(LoanRequestService.createLoanRequest(incompleteData))
        .rejects.toThrow();
    });

    it('should validate date ranges', async () => {
      const invalidData = {
        equipmentId: 'eq1',
        userId: 'user1',
        borrowDate: new Date('2024-01-20'),
        expectedReturnDate: new Date('2024-01-15'), // Return date before borrow date
        purpose: 'Test'
      };

      await expect(LoanRequestService.createLoanRequest(invalidData))
        .rejects.toThrow('วันที่คืนต้องมาหลังวันที่ยืม');
    });

    it('should handle creation errors', async () => {
      const requestData = {
        equipmentId: 'eq1',
        userId: 'user1',
        borrowDate: new Date(),
        expectedReturnDate: new Date(Date.now() + 86400000),
        purpose: 'Test'
      };

      const { addDoc } = require('firebase/firestore');
      addDoc.mockRejectedValue(new Error('Creation failed'));

      await expect(LoanRequestService.createLoanRequest(requestData))
        .rejects.toThrow('Creation failed');
    });
  });

  describe('getLoanRequestById', () => {
    it('should get loan request by ID successfully', async () => {
      const mockRequest = {
        id: 'loan-req-1',
        equipmentId: 'eq1',
        userId: 'user1',
        status: LOAN_REQUEST_STATUS.PENDING,
        purpose: 'For presentation'
      };

      const mockDoc = {
        exists: () => true,
        data: () => ({ ...mockRequest, id: undefined }),
        id: 'loan-req-1'
      };

      const { doc, getDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'loan-req-1' });
      getDoc.mockResolvedValue(mockDoc);

      const result = await LoanRequestService.getLoanRequestById('loan-req-1');

      expect(result).toEqual(mockRequest);
    });

    it('should return null for non-existent request', async () => {
      const mockDoc = {
        exists: () => false
      };

      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue(mockDoc);

      const result = await LoanRequestService.getLoanRequestById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getLoanRequestsByUser', () => {
    it('should get user loan requests successfully', async () => {
      const mockRequests = [
        {
          id: 'req1',
          equipmentId: 'eq1',
          userId: 'user1',
          status: LOAN_REQUEST_STATUS.PENDING
        },
        {
          id: 'req2',
          equipmentId: 'eq2',
          userId: 'user1',
          status: LOAN_REQUEST_STATUS.APPROVED
        }
      ];

      const mockSnapshot = {
        docs: mockRequests.map(req => ({
          id: req.id,
          data: () => ({ ...req, id: undefined })
        })),
        empty: false
      };

      const { collection, query, where, orderBy, getDocs } = require('firebase/firestore');
      collection.mockReturnValue('loanRequests');
      query.mockReturnValue('query');
      where.mockReturnValue('where');
      orderBy.mockReturnValue('orderBy');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await LoanRequestService.getLoanRequestsByUser('user1');

      expect(where).toHaveBeenCalledWith('userId', '==', 'user1');
      expect(result.requests).toHaveLength(2);
    });

    it('should handle empty results', async () => {
      const mockSnapshot = {
        docs: [],
        empty: true
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await LoanRequestService.getLoanRequestsByUser('user1');

      expect(result.requests).toHaveLength(0);
    });
  });

  describe('approveLoanRequest', () => {
    it('should approve loan request successfully', async () => {
      const { doc, updateDoc, serverTimestamp } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'loan-req-1' });
      updateDoc.mockResolvedValue();
      serverTimestamp.mockReturnValue({ seconds: Date.now() / 1000 });

      await LoanRequestService.approveLoanRequest('loan-req-1', 'admin-id');

      expect(updateDoc).toHaveBeenCalledWith(
        { id: 'loan-req-1' },
        {
          status: LOAN_REQUEST_STATUS.APPROVED,
          approvedBy: 'admin-id',
          approvedAt: expect.any(Object),
          updatedAt: expect.any(Object)
        }
      );
    });

    it('should handle approval errors', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockRejectedValue(new Error('Approval failed'));

      await expect(LoanRequestService.approveLoanRequest('loan-req-1', 'admin-id'))
        .rejects.toThrow('Approval failed');
    });
  });

  describe('rejectLoanRequest', () => {
    it('should reject loan request successfully', async () => {
      const rejectionReason = 'Equipment not available';

      const { doc, updateDoc, serverTimestamp } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'loan-req-1' });
      updateDoc.mockResolvedValue();
      serverTimestamp.mockReturnValue({ seconds: Date.now() / 1000 });

      await LoanRequestService.rejectLoanRequest('loan-req-1', rejectionReason, 'admin-id');

      expect(updateDoc).toHaveBeenCalledWith(
        { id: 'loan-req-1' },
        {
          status: LOAN_REQUEST_STATUS.REJECTED,
          rejectionReason,
          rejectedBy: 'admin-id',
          rejectedAt: expect.any(Object),
          updatedAt: expect.any(Object)
        }
      );
    });

    it('should require rejection reason', async () => {
      await expect(LoanRequestService.rejectLoanRequest('loan-req-1', '', 'admin-id'))
        .rejects.toThrow('กรุณาระบุเหตุผลในการปฏิเสธ');
    });

    it('should handle rejection errors', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockRejectedValue(new Error('Rejection failed'));

      await expect(LoanRequestService.rejectLoanRequest('loan-req-1', 'Reason', 'admin-id'))
        .rejects.toThrow('Rejection failed');
    });
  });

  describe('markAsReturned', () => {
    it('should mark loan as returned successfully', async () => {
      const { doc, updateDoc, serverTimestamp } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'loan-req-1' });
      updateDoc.mockResolvedValue();
      serverTimestamp.mockReturnValue({ seconds: Date.now() / 1000 });

      await LoanRequestService.markAsReturned('loan-req-1');

      expect(updateDoc).toHaveBeenCalledWith(
        { id: 'loan-req-1' },
        {
          status: LOAN_REQUEST_STATUS.RETURNED,
          actualReturnDate: expect.any(Object),
          updatedAt: expect.any(Object)
        }
      );
    });

    it('should handle return marking errors', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockRejectedValue(new Error('Return marking failed'));

      await expect(LoanRequestService.markAsReturned('loan-req-1'))
        .rejects.toThrow('Return marking failed');
    });
  });

  describe('getLoanRequestStats', () => {
    it('should get loan request statistics successfully', async () => {
      const mockRequests = [
        { status: LOAN_REQUEST_STATUS.PENDING },
        { status: LOAN_REQUEST_STATUS.APPROVED },
        { status: LOAN_REQUEST_STATUS.APPROVED },
        { status: LOAN_REQUEST_STATUS.REJECTED },
        { status: LOAN_REQUEST_STATUS.RETURNED },
        { status: LOAN_REQUEST_STATUS.OVERDUE }
      ];

      const mockSnapshot = {
        docs: mockRequests.map((req, index) => ({
          id: `req${index}`,
          data: () => req
        }))
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const stats = await LoanRequestService.getLoanRequestStats();

      expect(stats.total).toBe(6);
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(2);
      expect(stats.rejected).toBe(1);
      expect(stats.returned).toBe(1);
      expect(stats.overdue).toBe(1);
    });

    it('should handle empty loan requests collection', async () => {
      const mockSnapshot = {
        docs: []
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const stats = await LoanRequestService.getLoanRequestStats();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.approved).toBe(0);
    });
  });

  describe('getOverdueLoanRequests', () => {
    it('should get overdue loan requests successfully', async () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      const mockOverdueRequests = [
        {
          id: 'overdue1',
          status: LOAN_REQUEST_STATUS.BORROWED,
          expectedReturnDate: { toDate: () => pastDate }
        }
      ];

      const mockSnapshot = {
        docs: mockOverdueRequests.map(req => ({
          id: req.id,
          data: () => ({ ...req, id: undefined })
        }))
      };

      const { collection, query, where, getDocs } = require('firebase/firestore');
      collection.mockReturnValue('loanRequests');
      query.mockReturnValue('query');
      where.mockReturnValue('where');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await LoanRequestService.getOverdueLoanRequests();

      expect(where).toHaveBeenCalledWith('status', '==', LOAN_REQUEST_STATUS.BORROWED);
      expect(result).toHaveLength(1);
    });

    it('should handle no overdue requests', async () => {
      const mockSnapshot = {
        docs: []
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await LoanRequestService.getOverdueLoanRequests();

      expect(result).toHaveLength(0);
    });
  });

  describe('updateOverdueStatus', () => {
    it('should update overdue status successfully', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      const mockOverdueRequests = [
        {
          id: 'overdue1',
          status: LOAN_REQUEST_STATUS.BORROWED,
          expectedReturnDate: { toDate: () => pastDate }
        }
      ];

      const mockSnapshot = {
        docs: mockOverdueRequests.map(req => ({
          id: req.id,
          data: () => ({ ...req, id: undefined })
        }))
      };

      const { getDocs, doc, updateDoc } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);
      doc.mockReturnValue({ id: 'overdue1' });
      updateDoc.mockResolvedValue();

      const result = await LoanRequestService.updateOverdueStatus();

      expect(updateDoc).toHaveBeenCalledWith(
        { id: 'overdue1' },
        {
          status: LOAN_REQUEST_STATUS.OVERDUE,
          updatedAt: expect.any(Object)
        }
      );
      expect(result).toBe(1); // Number of updated requests
    });

    it('should handle no overdue requests to update', async () => {
      const mockSnapshot = {
        docs: []
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await LoanRequestService.updateOverdueStatus();

      expect(result).toBe(0);
    });
  });
});