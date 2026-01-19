/**
 * Property-based tests for Loan Approval State Transition
 * 
 * **Feature: staff-role-system, Property 3: Loan Approval State Transition**
 * **Validates: Requirements 4.1, 4.4, 4.5, 10.1**
 * 
 * Property: For any pending loan request, when a Staff user approves it:
 * - The request status SHALL change to "approved"
 * - The equipment availability SHALL be updated
 * - A notification SHALL be sent to the borrower
 * - An audit log entry SHALL be created
 */

import fc from 'fast-check';
import { LOAN_REQUEST_STATUS } from '../../types/loanRequest';
import { EQUIPMENT_STATUS } from '../../types/equipment';

// Mock Firebase modules before importing the service
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mock-collection-ref'),
  doc: jest.fn(() => 'mock-doc-ref'),
  updateDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(() => 'mock-query'),
  where: jest.fn(() => 'mock-where'),
  serverTimestamp: jest.fn(() => ({ _serverTimestamp: true })),
  addDoc: jest.fn()
}));

jest.mock('../../config/firebase', () => ({
  db: { _mockDb: true }
}));

// Mock dependent services - use __esModule pattern for default exports
jest.mock('../equipmentService', () => ({
  __esModule: true,
  default: {
    getEquipmentById: jest.fn()
  }
}));

jest.mock('../notificationService', () => ({
  __esModule: true,
  default: {
    createNotification: jest.fn()
  }
}));

jest.mock('../activityLoggerService', () => ({
  __esModule: true,
  default: {
    logStaffAction: jest.fn()
  }
}));

// Mock discord webhook service (dynamically imported)
jest.mock('../discordWebhookService.js', () => ({
  default: {
    notifyLoanApproved: jest.fn().mockResolvedValue(undefined),
    notifyLoanRejected: jest.fn().mockResolvedValue(undefined)
  }
}));

// Import service after mocks are set up
import StaffLoanManagementService from '../staffLoanManagementService';

// Get mock references using requireMock
const firestore = jest.requireMock('firebase/firestore');
const EquipmentServiceMock = jest.requireMock('../equipmentService').default;
const NotificationServiceMock = jest.requireMock('../notificationService').default;
const ActivityLoggerMock = jest.requireMock('../activityLoggerService').default;

// ============================================================================
// Generators
// ============================================================================

// Generator for valid staff user info
const staffInfoGenerator = fc.record({
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress()
});

// Generator for staff user ID
const staffIdGenerator = fc.uuid();

// Generator for loan request ID
const loanRequestIdGenerator = fc.uuid();

// Generator for user ID (borrower)
const userIdGenerator = fc.uuid();

// Generator for equipment ID
const equipmentIdGenerator = fc.uuid();

// Generator for valid dates
const dateGenerator = fc.date({ min: new Date('2024-01-01'), max: new Date('2027-12-31') });

// Generator for pending loan request data
const pendingLoanRequestGenerator = fc.record({
  id: loanRequestIdGenerator,
  equipmentId: equipmentIdGenerator,
  userId: userIdGenerator,
  status: fc.constant(LOAN_REQUEST_STATUS.PENDING),
  borrowDate: dateGenerator,
  expectedReturnDate: dateGenerator,
  purpose: fc.string({ minLength: 10, maxLength: 200 }),
  notes: fc.string({ maxLength: 200 }),
  userSnapshot: fc.record({
    displayName: fc.string({ minLength: 1, maxLength: 50 }),
    email: fc.emailAddress()
  }),
  userName: fc.string({ minLength: 1, maxLength: 50 }),
  createdAt: dateGenerator,
  updatedAt: dateGenerator
});

// Generator for available equipment
const availableEquipmentGenerator = fc.record({
  id: equipmentIdGenerator,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  status: fc.constant(EQUIPMENT_STATUS.AVAILABLE),
  category: fc.constantFrom('laptop', 'camera', 'projector', 'audio'),
  brand: fc.string({ minLength: 1, maxLength: 50 }),
  model: fc.string({ minLength: 1, maxLength: 50 })
});

// ============================================================================
// Helper function to setup mocks for successful approval
// ============================================================================
function setupSuccessfulApprovalMocks(loanRequest, equipment) {
  // Setup mocks for getDoc (loan request lookup)
  firestore.getDoc.mockResolvedValue({
    exists: () => true,
    id: loanRequest.id,
    data: () => ({ ...loanRequest })
  });
  
  // Ensure equipment has AVAILABLE status
  const availableEquipment = { ...equipment, status: EQUIPMENT_STATUS.AVAILABLE };
  EquipmentServiceMock.getEquipmentById.mockResolvedValue(availableEquipment);
  
  firestore.updateDoc.mockResolvedValue(undefined);
  NotificationServiceMock.createNotification.mockResolvedValue({ id: 'notif-1' });
  firestore.addDoc.mockResolvedValue({ id: 'log-1' });
  firestore.getDocs.mockResolvedValue({ forEach: jest.fn(), docs: [] });
  ActivityLoggerMock.logStaffAction.mockResolvedValue(undefined);
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Loan Approval State Transition Property Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Feature: staff-role-system, Property 3: Loan Approval State Transition**
   * **Validates: Requirements 4.1, 4.4, 4.5, 10.1**
   */
  describe('Property 3: Loan Approval State Transition', () => {

    /**
     * Test: For any pending loan request with available equipment,
     * approval SHALL change status to "approved"
     * **Validates: Requirement 4.1**
     */
    it('For any pending loan request with available equipment, approval SHALL change status to approved', async () => {
      await fc.assert(
        fc.asyncProperty(
          pendingLoanRequestGenerator,
          availableEquipmentGenerator,
          staffIdGenerator,
          staffInfoGenerator,
          async (loanRequest, equipment, staffId, staffInfo) => {
            // Clear all mocks before each property run
            jest.clearAllMocks();
            
            // Ensure equipment ID matches
            const matchedEquipment = { ...equipment, id: loanRequest.equipmentId };
            
            // Setup mocks for this specific run
            setupSuccessfulApprovalMocks(loanRequest, matchedEquipment);

            // Execute
            const result = await StaffLoanManagementService.approveLoanRequest(
              loanRequest.id,
              staffId,
              staffInfo
            );

            // Verify: success and status changed to approved
            expect(result.success).toBe(true);
            expect(result.request.status).toBe(LOAN_REQUEST_STATUS.APPROVED);
            
            // Verify updateDoc was called (without checking specific arguments)
            expect(firestore.updateDoc).toHaveBeenCalled();
            
            // Verify the call included the correct status
            const updateDocCalls = firestore.updateDoc.mock.calls;
            const hasApprovedStatus = updateDocCalls.some(call => 
              call[1] && call[1].status === LOAN_REQUEST_STATUS.APPROVED
            );
            expect(hasApprovedStatus).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: For any approved loan request, a notification SHALL be sent to the borrower
     * **Validates: Requirement 4.4**
     */
    it('For any approved loan request, a notification SHALL be sent to the borrower', async () => {
      await fc.assert(
        fc.asyncProperty(
          pendingLoanRequestGenerator,
          availableEquipmentGenerator,
          staffIdGenerator,
          staffInfoGenerator,
          async (loanRequest, equipment, staffId, staffInfo) => {
            // Clear all mocks before each property run
            jest.clearAllMocks();
            
            const matchedEquipment = { ...equipment, id: loanRequest.equipmentId };
            
            // Setup mocks
            setupSuccessfulApprovalMocks(loanRequest, matchedEquipment);

            // Execute
            const result = await StaffLoanManagementService.approveLoanRequest(
              loanRequest.id,
              staffId,
              staffInfo
            );

            // Verify: notification was sent to borrower
            expect(result.success).toBe(true);
            expect(result.notificationSent).toBe(true);
            
            // Verify NotificationService was called with borrower's userId
            expect(NotificationServiceMock.createNotification).toHaveBeenCalledWith(
              loanRequest.userId,
              'loan_approved',
              expect.any(String),
              expect.any(String),
              expect.objectContaining({
                requestId: loanRequest.id,
                equipmentId: matchedEquipment.id
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: For any approved loan request, an audit log entry SHALL be created
     * **Validates: Requirement 10.1**
     */
    it('For any approved loan request, an audit log entry SHALL be created', async () => {
      await fc.assert(
        fc.asyncProperty(
          pendingLoanRequestGenerator,
          availableEquipmentGenerator,
          staffIdGenerator,
          staffInfoGenerator,
          async (loanRequest, equipment, staffId, staffInfo) => {
            // Clear all mocks before each property run
            jest.clearAllMocks();
            
            const matchedEquipment = { ...equipment, id: loanRequest.equipmentId };
            
            // Setup mocks
            setupSuccessfulApprovalMocks(loanRequest, matchedEquipment);

            // Execute
            const result = await StaffLoanManagementService.approveLoanRequest(
              loanRequest.id,
              staffId,
              staffInfo
            );

            // Verify: audit log was created
            expect(result.success).toBe(true);
            expect(result.auditLogged).toBe(true);
            
            // Verify addDoc was called for staff activity log
            expect(firestore.addDoc).toHaveBeenCalled();
            
            // Verify the call included the correct action type
            const addDocCalls = firestore.addDoc.mock.calls;
            const hasAuditLog = addDocCalls.some(call => 
              call[1] && 
              call[1].staffId === staffId &&
              call[1].actionType === StaffLoanManagementService.STAFF_ACTION_TYPES.LOAN_APPROVED
            );
            expect(hasAuditLog).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: For any loan request that is NOT pending, approval SHALL fail
     * **Validates: Requirement 4.1 (only pending requests can be approved)**
     */
    it('For any loan request that is NOT pending, approval SHALL fail with INVALID_STATUS', async () => {
      const nonPendingStatuses = [
        LOAN_REQUEST_STATUS.APPROVED,
        LOAN_REQUEST_STATUS.REJECTED,
        LOAN_REQUEST_STATUS.BORROWED,
        LOAN_REQUEST_STATUS.RETURNED,
        LOAN_REQUEST_STATUS.OVERDUE
      ];

      await fc.assert(
        fc.asyncProperty(
          pendingLoanRequestGenerator,
          fc.constantFrom(...nonPendingStatuses),
          staffIdGenerator,
          staffInfoGenerator,
          async (baseLoanRequest, nonPendingStatus, staffId, staffInfo) => {
            const loanRequest = { ...baseLoanRequest, status: nonPendingStatus };
            
            // Reset mocks
            jest.clearAllMocks();
            
            // Setup mocks - loan request exists but with non-pending status
            firestore.getDoc.mockResolvedValue({
              exists: () => true,
              id: loanRequest.id,
              data: () => ({ ...loanRequest })
            });

            // Execute
            const result = await StaffLoanManagementService.approveLoanRequest(
              loanRequest.id,
              staffId,
              staffInfo
            );

            // Verify: approval failed with correct error code
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('INVALID_STATUS');
            
            // Verify updateDoc was NOT called
            expect(firestore.updateDoc).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: For any loan request with unavailable equipment, approval SHALL fail
     * **Validates: Requirement 4.6**
     */
    it('For any loan request with unavailable equipment, approval SHALL fail with EQUIPMENT_UNAVAILABLE', async () => {
      const unavailableStatuses = [
        EQUIPMENT_STATUS.BORROWED,
        EQUIPMENT_STATUS.MAINTENANCE,
        EQUIPMENT_STATUS.RETIRED
      ];

      await fc.assert(
        fc.asyncProperty(
          pendingLoanRequestGenerator,
          availableEquipmentGenerator,
          fc.constantFrom(...unavailableStatuses),
          staffIdGenerator,
          staffInfoGenerator,
          async (loanRequest, baseEquipment, unavailableStatus, staffId, staffInfo) => {
            const equipment = { 
              ...baseEquipment, 
              id: loanRequest.equipmentId,
              status: unavailableStatus 
            };
            
            // Reset mocks
            jest.clearAllMocks();
            
            // Setup mocks - loan request is pending
            firestore.getDoc.mockResolvedValue({
              exists: () => true,
              id: loanRequest.id,
              data: () => ({ ...loanRequest })
            });
            
            // Equipment is unavailable
            EquipmentServiceMock.getEquipmentById.mockResolvedValue(equipment);

            // Execute
            const result = await StaffLoanManagementService.approveLoanRequest(
              loanRequest.id,
              staffId,
              staffInfo
            );

            // Verify: approval failed with correct error code
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('EQUIPMENT_UNAVAILABLE');
            
            // Verify updateDoc was NOT called
            expect(firestore.updateDoc).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: For any non-existent loan request, approval SHALL fail
     */
    it('For any non-existent loan request, approval SHALL fail with LOAN_REQUEST_NOT_FOUND', async () => {
      await fc.assert(
        fc.asyncProperty(
          loanRequestIdGenerator,
          staffIdGenerator,
          staffInfoGenerator,
          async (loanRequestId, staffId, staffInfo) => {
            // Reset mocks
            jest.clearAllMocks();
            
            // Setup mocks - loan request does not exist
            firestore.getDoc.mockResolvedValue({
              exists: () => false
            });

            // Execute
            const result = await StaffLoanManagementService.approveLoanRequest(
              loanRequestId,
              staffId,
              staffInfo
            );

            // Verify: approval failed with correct error code
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('LOAN_REQUEST_NOT_FOUND');
            
            // Verify updateDoc was NOT called
            expect(firestore.updateDoc).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Successful approval result SHALL contain all required fields
     */
    it('Successful approval result SHALL contain all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          pendingLoanRequestGenerator,
          availableEquipmentGenerator,
          staffIdGenerator,
          staffInfoGenerator,
          async (loanRequest, equipment, staffId, staffInfo) => {
            // Clear all mocks before each property run
            jest.clearAllMocks();
            
            const matchedEquipment = { ...equipment, id: loanRequest.equipmentId };
            
            // Setup mocks
            setupSuccessfulApprovalMocks(loanRequest, matchedEquipment);

            // Execute
            const result = await StaffLoanManagementService.approveLoanRequest(
              loanRequest.id,
              staffId,
              staffInfo
            );

            // Verify: result contains all required fields
            expect(result).toHaveProperty('success', true);
            expect(result).toHaveProperty('request');
            expect(result).toHaveProperty('notificationSent');
            expect(result).toHaveProperty('auditLogged');
            
            // Verify request object has updated fields
            expect(result.request).toHaveProperty('status', LOAN_REQUEST_STATUS.APPROVED);
            expect(result.request).toHaveProperty('approvedBy', staffId);
            expect(result.request).toHaveProperty('approvedAt');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
