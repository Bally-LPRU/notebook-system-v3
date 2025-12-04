import LoanRequestService from '../loanRequestService';
import { LOAN_REQUEST_STATUS } from '../../types/loanRequest';
import { EQUIPMENT_STATUS } from '../../types/equipment';

jest.mock('../../config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => {
  const mockTimestamp = {
    fromDate: jest.fn((date) => ({ toDate: () => date }))
  };
  const mockWriteBatch = jest.fn(() => ({
    delete: jest.fn(),
    update: jest.fn(),
    commit: jest.fn()
  }));
  return {
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
    serverTimestamp: jest.fn(() => 'timestamp'),
    Timestamp: mockTimestamp,
    writeBatch: mockWriteBatch
  };
});

jest.mock('../equipmentService', () => ({
  getEquipmentById: jest.fn()
}));

jest.mock('../notificationService', () => ({
  notifyAdminsNewLoanRequest: jest.fn(),
  notifyUserLoanRequestStatus: jest.fn()
}));

jest.mock('../overdueManagementService', () => ({
  getOverdueLoanRequests: jest.fn()
}));

jest.mock('../loanRequestSearchService', () => ({
  generateSearchKeywords: jest.fn(() => []),
  searchLoanRequests: jest.fn()
}));

const firestore = jest.requireMock('firebase/firestore');
const EquipmentServiceMock = jest.requireMock('../equipmentService');
const NotificationServiceMock = jest.requireMock('../notificationService');
const OverdueManagementServiceMock = jest.requireMock('../overdueManagementService');
const LoanRequestSearchServiceMock = jest.requireMock('../loanRequestSearchService');

const createDocumentSnapshot = (data = {}, overrides = {}) => {
  const id = overrides.id || data.id || 'doc-id';
  return {
    id,
    data: () => ({ ...data }),
    exists: () => overrides.exists ?? true,
    ref: overrides.ref || { id }
  };
};

const createQuerySnapshot = (docs = []) => ({
  docs,
  forEach: (callback) => docs.forEach(callback),
  size: docs.length,
  empty: docs.length === 0
});

const daysFromNow = (days) => {
  const date = new Date();
  date.setHours(10, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return new Date(date);
};

describe('LoanRequestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setupUserDoc = () => {
    firestore.doc.mockReturnValueOnce({ path: 'users/user1' });
    firestore.getDoc.mockResolvedValueOnce(
      createDocumentSnapshot({
        displayName: 'User One',
        email: 'user@example.com',
        department: 'IT'
      }, { id: 'user1' })
    );
  };

  describe('createLoanRequest', () => {
    const createBaseRequest = () => ({
      equipmentId: 'eq1',
      userId: 'user1',
      borrowDate: daysFromNow(2),
      expectedReturnDate: daysFromNow(5),
      purpose: 'For presentation',
      notes: 'Handle with care'
    });

    const prepareSuccessMocks = () => {
      EquipmentServiceMock.getEquipmentById.mockResolvedValue({
        id: 'eq1',
        status: EQUIPMENT_STATUS.AVAILABLE,
        category: 'laptop',
        name: 'Laptop Dell'
      });
      jest.spyOn(LoanRequestService, 'getExistingPendingRequest').mockResolvedValue(null);
      jest.spyOn(LoanRequestService, 'checkCategoryLimit').mockResolvedValue({ allowed: true });
      jest.spyOn(LoanRequestService, 'notifyAdminsNewLoanRequest').mockResolvedValue();
      firestore.collection.mockReturnValue('loanRequests');
      firestore.addDoc.mockResolvedValue({ id: 'loan-req-1' });
      setupUserDoc();
    };

    it('creates loan request with normalized payload', async () => {
      const baseRequest = createBaseRequest();
      prepareSuccessMocks();

      const result = await LoanRequestService.createLoanRequest(baseRequest, 'user1');

      expect(firestore.addDoc).toHaveBeenCalledWith('loanRequests', expect.objectContaining({
        equipmentId: 'eq1',
        userId: 'user1',
        status: LOAN_REQUEST_STATUS.PENDING,
        equipmentCategory: 'laptop'
      }));
      expect(result.id).toBe('loan-req-1');
      expect(result.status).toBe(LOAN_REQUEST_STATUS.PENDING);
    });

    it('rejects when return date is before borrow date', async () => {
      const invalid = createBaseRequest();
      invalid.borrowDate = daysFromNow(5);
      invalid.expectedReturnDate = daysFromNow(4);
      prepareSuccessMocks();

      await expect(LoanRequestService.createLoanRequest(invalid, 'user1'))
        .rejects.toThrow('วันที่คืนต้องหลังจากวันที่ยืม');
    });

    it('propagates creation errors from Firestore', async () => {
      const baseRequest = createBaseRequest();
      prepareSuccessMocks();
      firestore.addDoc.mockRejectedValue(new Error('Creation failed'));

      await expect(LoanRequestService.createLoanRequest(baseRequest, 'user1'))
        .rejects.toThrow('Creation failed');
    });
  });

  describe('getLoanRequestById', () => {
    it('returns loan request data when document exists', async () => {
      firestore.doc.mockReturnValue({ path: 'loanRequests/loan-req-1' });
      firestore.getDoc.mockResolvedValue(
        createDocumentSnapshot({ equipmentId: 'eq1', status: LOAN_REQUEST_STATUS.PENDING }, { id: 'loan-req-1' })
      );

      const result = await LoanRequestService.getLoanRequestById('loan-req-1');

      expect(result).toEqual({ id: 'loan-req-1', equipmentId: 'eq1', status: LOAN_REQUEST_STATUS.PENDING });
    });

    it('returns null when document missing', async () => {
      firestore.getDoc.mockResolvedValue(createDocumentSnapshot({}, { exists: false }));

      const result = await LoanRequestService.getLoanRequestById('missing');

      expect(result).toBeNull();
    });
  });

  describe('getUserLoanRequests', () => {
    it('delegates to getLoanRequests with user filter', async () => {
      const mockList = [{ id: 'req1' }, { id: 'req2' }];
      const spy = jest.spyOn(LoanRequestService, 'getLoanRequests').mockResolvedValue({
        loanRequests: mockList,
        pagination: {},
        lastDoc: null
      });

      const result = await LoanRequestService.getUserLoanRequests('user123', { status: LOAN_REQUEST_STATUS.PENDING });

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user123', status: LOAN_REQUEST_STATUS.PENDING }));
      expect(result).toEqual(mockList);
    });
  });

  describe('approveLoanRequest', () => {
    it('updates status and notifies user', async () => {
      jest.spyOn(LoanRequestService, 'getLoanRequestById').mockResolvedValue({
        id: 'loan-req-1',
        equipmentId: 'eq1',
        status: LOAN_REQUEST_STATUS.PENDING,
        userId: 'user1'
      });
      EquipmentServiceMock.getEquipmentById.mockResolvedValue({
        id: 'eq1',
        status: EQUIPMENT_STATUS.AVAILABLE,
        name: 'Laptop'
      });
      jest.spyOn(LoanRequestService, 'notifyUserLoanRequestStatus').mockResolvedValue();
      firestore.doc.mockReturnValue({ id: 'loan-req-1' });
      firestore.updateDoc.mockResolvedValue();

      const result = await LoanRequestService.approveLoanRequest('loan-req-1', 'admin-id');

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        { id: 'loan-req-1' },
        expect.objectContaining({ status: LOAN_REQUEST_STATUS.APPROVED, approvedBy: 'admin-id' })
      );
      expect(result.status).toBe(LOAN_REQUEST_STATUS.APPROVED);
    });
  });

  describe('rejectLoanRequest', () => {
    const setupRejectMocks = () => {
      jest.spyOn(LoanRequestService, 'getLoanRequestById').mockResolvedValue({
        id: 'loan-req-1',
        equipmentId: 'eq1',
        status: LOAN_REQUEST_STATUS.PENDING,
        userId: 'user1'
      });
      EquipmentServiceMock.getEquipmentById.mockResolvedValue({ id: 'eq1', status: EQUIPMENT_STATUS.AVAILABLE });
      jest.spyOn(LoanRequestService, 'notifyUserLoanRequestStatus').mockResolvedValue();
      firestore.doc.mockReturnValue({ id: 'loan-req-1' });
      firestore.updateDoc.mockResolvedValue();
    };

    it('persists rejection metadata and notifies user', async () => {
      setupRejectMocks();

      const result = await LoanRequestService.rejectLoanRequest('loan-req-1', 'Not available', 'admin-id');

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        { id: 'loan-req-1' },
        expect.objectContaining({
          status: LOAN_REQUEST_STATUS.REJECTED,
          rejectionReason: 'Not available',
          approvedBy: 'admin-id'
        })
      );
      expect(result.status).toBe(LOAN_REQUEST_STATUS.REJECTED);
      expect(LoanRequestService.notifyUserLoanRequestStatus).toHaveBeenCalled();
    });

    it('trims rejection reason before persisting', async () => {
      setupRejectMocks();

      const result = await LoanRequestService.rejectLoanRequest('loan-req-1', '  Not available  ', 'admin-id');

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ rejectionReason: 'Not available' })
      );
      expect(result.rejectionReason).toBe('Not available');
    });
  });

  describe('markAsReturned', () => {
    it('sets status to returned with timestamps', async () => {
      jest.spyOn(LoanRequestService, 'getLoanRequestById').mockResolvedValue({
        id: 'loan-req-1',
        equipmentId: 'eq1',
        status: LOAN_REQUEST_STATUS.BORROWED,
        userId: 'user1'
      });
      const batchUpdate = jest.fn();
      const batchCommit = jest.fn().mockResolvedValue();
      firestore.writeBatch.mockReturnValue({ update: batchUpdate, delete: jest.fn(), commit: batchCommit });
      firestore.doc
        .mockReturnValueOnce({ ref: 'loanRequests/loan-req-1' })
        .mockReturnValueOnce({ ref: 'equipmentManagement/eq1' });

      const result = await LoanRequestService.markAsReturned('loan-req-1', 'admin-id');

      expect(batchUpdate).toHaveBeenCalledTimes(2);
      expect(batchCommit).toHaveBeenCalled();
      expect(result.status).toBe(LOAN_REQUEST_STATUS.RETURNED);
    });
  });

  describe('getLoanRequestStats', () => {
    it('aggregates counts for each status', async () => {
      const docs = [
        createDocumentSnapshot({ status: LOAN_REQUEST_STATUS.PENDING }, { id: 'req1' }),
        createDocumentSnapshot({ status: LOAN_REQUEST_STATUS.APPROVED }, { id: 'req2' }),
        createDocumentSnapshot({ status: LOAN_REQUEST_STATUS.APPROVED }, { id: 'req3' }),
        createDocumentSnapshot({ status: LOAN_REQUEST_STATUS.REJECTED }, { id: 'req4' }),
        createDocumentSnapshot({ status: LOAN_REQUEST_STATUS.RETURNED }, { id: 'req5' }),
        createDocumentSnapshot({ status: LOAN_REQUEST_STATUS.OVERDUE }, { id: 'req6' })
      ];

      firestore.collection.mockReturnValue('loanRequests');
      firestore.getDocs.mockResolvedValue(createQuerySnapshot(docs));

      const stats = await LoanRequestService.getLoanRequestStats();

      expect(stats).toMatchObject({
        total: 6,
        pending: 1,
        approved: 2,
        rejected: 1,
        returned: 1,
        overdue: 1
      });
    });

    it('returns zeros when no documents', async () => {
      firestore.collection.mockReturnValue('loanRequests');
      firestore.getDocs.mockResolvedValue(createQuerySnapshot());

      const stats = await LoanRequestService.getLoanRequestStats();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
    });
  });

  describe('getOverdueLoanRequests', () => {
    it('delegates to OverdueManagementService', async () => {
      OverdueManagementServiceMock.getOverdueLoanRequests.mockResolvedValue(['req1']);

      const result = await LoanRequestService.getOverdueLoanRequests('user1');

      expect(OverdueManagementServiceMock.getOverdueLoanRequests).toHaveBeenCalledWith('user1');
      expect(result).toEqual(['req1']);
    });
  });
});
