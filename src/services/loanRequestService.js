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
  limit as firestoreLimit, 
  startAfter,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  LOAN_REQUEST_STATUS, 
  LOAN_REQUEST_PAGINATION 
} from '../types/loanRequest';
import { EQUIPMENT_STATUS } from '../types/equipment';
import EquipmentService from './equipmentService';
import NotificationService from './notificationService';

class LoanRequestService {
  static COLLECTION_NAME = 'loanRequests';

  /**
   * Create new loan request
   * @param {Object} loanRequestData - Loan request data
   * @param {string} userId - UID of requester
   * @returns {Promise<Object>} Created loan request with ID
   */
  static async createLoanRequest(loanRequestData, userId) {
    try {
      // Validate equipment availability
      const equipment = await EquipmentService.getEquipmentById(loanRequestData.equipmentId);
      if (!equipment) {
        throw new Error('ไม่พบอุปกรณ์ที่ต้องการยืม');
      }
      
      if (equipment.status !== EQUIPMENT_STATUS.AVAILABLE) {
        throw new Error('อุปกรณ์นี้ไม่พร้อมใช้งานในขณะนี้');
      }

      // Check for existing pending requests for the same equipment
      const existingRequest = await this.getExistingPendingRequest(loanRequestData.equipmentId);
      if (existingRequest) {
        throw new Error('มีคำขอยืมอุปกรณ์นี้รอการอนุมัติอยู่แล้ว');
      }

      // Validate dates
      const borrowDate = new Date(loanRequestData.borrowDate);
      const expectedReturnDate = new Date(loanRequestData.expectedReturnDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (borrowDate < today) {
        throw new Error('วันที่ยืมต้องไม่เป็นวันที่ผ่านมาแล้ว');
      }

      if (expectedReturnDate <= borrowDate) {
        throw new Error('วันที่คืนต้องหลังจากวันที่ยืม');
      }

      // Calculate loan duration
      const loanDurationMs = expectedReturnDate.getTime() - borrowDate.getTime();
      const loanDurationDays = Math.ceil(loanDurationMs / (1000 * 60 * 60 * 24));
      
      if (loanDurationDays > 30) {
        throw new Error('ระยะเวลายืมต้องไม่เกิน 30 วัน');
      }

      // Prepare loan request data
      const loanRequest = {
        equipmentId: loanRequestData.equipmentId,
        userId,
        requestDate: serverTimestamp(),
        borrowDate: borrowDate,
        expectedReturnDate: expectedReturnDate,
        actualReturnDate: null,
        purpose: loanRequestData.purpose.trim(),
        notes: loanRequestData.notes?.trim() || '',
        status: LOAN_REQUEST_STATUS.PENDING,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), loanRequest);
      
      const createdRequest = {
        id: docRef.id,
        ...loanRequest,
        requestDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Notify admins about new loan request
      await this.notifyAdminsNewLoanRequest(createdRequest, equipment);
      
      return createdRequest;
    } catch (error) {
      console.error('Error creating loan request:', error);
      throw error;
    }
  }

  /**
   * Get loan request by ID
   * @param {string} loanRequestId - Loan request ID
   * @returns {Promise<Object|null>} Loan request data or null
   */
  static async getLoanRequestById(loanRequestId) {
    try {
      const loanRequestRef = doc(db, this.COLLECTION_NAME, loanRequestId);
      const loanRequestDoc = await getDoc(loanRequestRef);
      
      if (loanRequestDoc.exists()) {
        return {
          id: loanRequestDoc.id,
          ...loanRequestDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting loan request by ID:', error);
      throw error;
    }
  }

  /**
   * Get loan requests with filters and pagination
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Loan requests list with pagination info
   */
  static async getLoanRequests(filters = {}) {
    try {
      const {
        search = '',
        status = '',
        userId = '',
        equipmentCategory = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = LOAN_REQUEST_PAGINATION.DEFAULT_PAGE,
        limit: pageLimit = LOAN_REQUEST_PAGINATION.DEFAULT_LIMIT,
        lastDoc = null
      } = filters;

      // Ensure limit doesn't exceed maximum
      const limit = Math.min(pageLimit, LOAN_REQUEST_PAGINATION.MAX_LIMIT);

      let loanRequestQuery = collection(db, this.COLLECTION_NAME);
      const queryConstraints = [];

      // Add filters
      if (status) {
        queryConstraints.push(where('status', '==', status));
      }
      
      if (userId) {
        queryConstraints.push(where('userId', '==', userId));
      }

      // Add sorting
      queryConstraints.push(orderBy(sortBy, sortOrder));
      
      // Add pagination
      if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }
      
      queryConstraints.push(firestoreLimit(limit + 1)); // Get one extra to check if there's next page

      // Build query
      loanRequestQuery = query(loanRequestQuery, ...queryConstraints);
      
      // Execute query
      const querySnapshot = await getDocs(loanRequestQuery);
      const loanRequests = [];
      let hasNextPage = false;
      
      querySnapshot.forEach((doc, index) => {
        if (index < limit) {
          const data = doc.data();
          loanRequests.push({
            id: doc.id,
            ...data
          });
        } else {
          hasNextPage = true;
        }
      });

      // Enrich with equipment and user data
      const enrichedLoanRequests = await this.enrichLoanRequestsWithDetails(loanRequests);

      // Apply search filter (client-side for now)
      let filteredLoanRequests = enrichedLoanRequests;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredLoanRequests = enrichedLoanRequests.filter(request => 
          request.equipment?.name.toLowerCase().includes(searchLower) ||
          request.equipment?.brand.toLowerCase().includes(searchLower) ||
          request.equipment?.model.toLowerCase().includes(searchLower) ||
          request.user?.firstName.toLowerCase().includes(searchLower) ||
          request.user?.lastName.toLowerCase().includes(searchLower) ||
          request.purpose.toLowerCase().includes(searchLower)
        );
      }

      // Apply equipment category filter
      if (equipmentCategory) {
        filteredLoanRequests = filteredLoanRequests.filter(request => 
          request.equipment?.category === equipmentCategory
        );
      }

      return {
        loanRequests: filteredLoanRequests,
        pagination: {
          currentPage: page,
          hasNextPage: hasNextPage && !search && !equipmentCategory,
          totalItems: filteredLoanRequests.length,
          limit
        },
        lastDoc: loanRequests.length > 0 ? querySnapshot.docs[Math.min(loanRequests.length - 1, limit - 1)] : null
      };
    } catch (error) {
      console.error('Error getting loan requests:', error);
      throw error;
    }
  }

  /**
   * Get user's loan requests
   * @param {string} userId - User ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} User's loan requests
   */
  static async getUserLoanRequests(userId, filters = {}) {
    try {
      const userFilters = {
        ...filters,
        userId
      };
      
      const result = await this.getLoanRequests(userFilters);
      return result.loanRequests;
    } catch (error) {
      console.error('Error getting user loan requests:', error);
      throw error;
    }
  }

  /**
   * Approve loan request
   * @param {string} loanRequestId - Loan request ID
   * @param {string} approvedBy - UID of approver
   * @returns {Promise<Object>} Updated loan request
   */
  static async approveLoanRequest(loanRequestId, approvedBy) {
    try {
      const loanRequest = await this.getLoanRequestById(loanRequestId);
      if (!loanRequest) {
        throw new Error('ไม่พบคำขอยืมที่ต้องการอนุมัติ');
      }

      if (loanRequest.status !== LOAN_REQUEST_STATUS.PENDING) {
        throw new Error('คำขอยืมนี้ได้รับการดำเนินการแล้ว');
      }

      // Check equipment availability
      const equipment = await EquipmentService.getEquipmentById(loanRequest.equipmentId);
      if (!equipment || equipment.status !== EQUIPMENT_STATUS.AVAILABLE) {
        throw new Error('อุปกรณ์ไม่พร้อมใช้งานในขณะนี้');
      }

      const batch = writeBatch(db);

      // Update loan request status
      const loanRequestRef = doc(db, this.COLLECTION_NAME, loanRequestId);
      batch.update(loanRequestRef, {
        status: LOAN_REQUEST_STATUS.APPROVED,
        approvedBy,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update equipment status to borrowed
      const equipmentRef = doc(db, 'equipment', loanRequest.equipmentId);
      batch.update(equipmentRef, {
        status: EQUIPMENT_STATUS.BORROWED,
        updatedAt: serverTimestamp(),
        updatedBy: approvedBy
      });

      // Commit batch
      await batch.commit();

      const updatedRequest = {
        ...loanRequest,
        status: LOAN_REQUEST_STATUS.APPROVED,
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      };

      // Notify user about approval
      await this.notifyUserLoanRequestStatus(updatedRequest, equipment, true);

      return updatedRequest;
    } catch (error) {
      console.error('Error approving loan request:', error);
      throw error;
    }
  }

  /**
   * Reject loan request
   * @param {string} loanRequestId - Loan request ID
   * @param {string} rejectionReason - Reason for rejection
   * @param {string} rejectedBy - UID of rejector
   * @returns {Promise<Object>} Updated loan request
   */
  static async rejectLoanRequest(loanRequestId, rejectionReason, rejectedBy) {
    try {
      const loanRequest = await this.getLoanRequestById(loanRequestId);
      if (!loanRequest) {
        throw new Error('ไม่พบคำขอยืมที่ต้องการปฏิเสธ');
      }

      if (loanRequest.status !== LOAN_REQUEST_STATUS.PENDING) {
        throw new Error('คำขอยืมนี้ได้รับการดำเนินการแล้ว');
      }

      // Update loan request status
      const loanRequestRef = doc(db, this.COLLECTION_NAME, loanRequestId);
      await updateDoc(loanRequestRef, {
        status: LOAN_REQUEST_STATUS.REJECTED,
        rejectionReason: rejectionReason.trim(),
        approvedBy: rejectedBy,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const updatedRequest = {
        ...loanRequest,
        status: LOAN_REQUEST_STATUS.REJECTED,
        rejectionReason: rejectionReason.trim(),
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      };

      // Get equipment details for notification
      const equipment = await EquipmentService.getEquipmentById(loanRequest.equipmentId);

      // Notify user about rejection
      await this.notifyUserLoanRequestStatus(updatedRequest, equipment, false, rejectionReason);

      return updatedRequest;
    } catch (error) {
      console.error('Error rejecting loan request:', error);
      throw error;
    }
  }

  /**
   * Cancel loan request (by user)
   * @param {string} loanRequestId - Loan request ID
   * @param {string} userId - UID of user
   * @returns {Promise<boolean>} Success status
   */
  static async cancelLoanRequest(loanRequestId, userId) {
    try {
      const loanRequest = await this.getLoanRequestById(loanRequestId);
      if (!loanRequest) {
        throw new Error('ไม่พบคำขอยืมที่ต้องการยกเลิก');
      }

      if (loanRequest.userId !== userId) {
        throw new Error('คุณไม่มีสิทธิ์ยกเลิกคำขอนี้');
      }

      if (loanRequest.status !== LOAN_REQUEST_STATUS.PENDING) {
        throw new Error('ไม่สามารถยกเลิกคำขอที่ได้รับการดำเนินการแล้ว');
      }

      // Delete the loan request
      const loanRequestRef = doc(db, this.COLLECTION_NAME, loanRequestId);
      await deleteDoc(loanRequestRef);

      return true;
    } catch (error) {
      console.error('Error canceling loan request:', error);
      throw error;
    }
  }

  /**
   * Get loan request statistics
   * @param {string} userId - User ID (optional, for user-specific stats)
   * @returns {Promise<Object>} Loan request statistics
   */
  static async getLoanRequestStats(userId = null) {
    try {
      const loanRequestRef = collection(db, this.COLLECTION_NAME);
      let statsQuery = loanRequestRef;
      
      if (userId) {
        statsQuery = query(loanRequestRef, where('userId', '==', userId));
      }
      
      const querySnapshot = await getDocs(statsQuery);
      
      const stats = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        borrowed: 0,
        returned: 0,
        overdue: 0
      };
      
      querySnapshot.forEach((doc) => {
        const loanRequest = doc.data();
        stats.total++;
        
        switch (loanRequest.status) {
          case LOAN_REQUEST_STATUS.PENDING:
            stats.pending++;
            break;
          case LOAN_REQUEST_STATUS.APPROVED:
            stats.approved++;
            break;
          case LOAN_REQUEST_STATUS.REJECTED:
            stats.rejected++;
            break;
          case LOAN_REQUEST_STATUS.BORROWED:
            stats.borrowed++;
            break;
          case LOAN_REQUEST_STATUS.RETURNED:
            stats.returned++;
            break;
          case LOAN_REQUEST_STATUS.OVERDUE:
            stats.overdue++;
            break;
          default:
            // Handle unknown status
            break;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting loan request stats:', error);
      throw error;
    }
  }

  /**
   * Check for existing pending request for equipment
   * @param {string} equipmentId - Equipment ID
   * @returns {Promise<Object|null>} Existing pending request or null
   */
  static async getExistingPendingRequest(equipmentId) {
    try {
      const loanRequestRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        loanRequestRef,
        where('equipmentId', '==', equipmentId),
        where('status', '==', LOAN_REQUEST_STATUS.PENDING)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error checking existing pending request:', error);
      throw error;
    }
  }

  /**
   * Enrich loan requests with equipment and user details
   * @param {Array} loanRequests - Array of loan requests
   * @returns {Promise<Array>} Enriched loan requests
   */
  static async enrichLoanRequestsWithDetails(loanRequests) {
    try {
      const enrichedRequests = await Promise.all(
        loanRequests.map(async (request) => {
          try {
            // Get equipment details
            const equipment = await EquipmentService.getEquipmentById(request.equipmentId);
            
            // Get user details
            const userRef = doc(db, 'users', request.userId);
            const userDoc = await getDoc(userRef);
            const user = userDoc.exists() ? userDoc.data() : null;

            return {
              ...request,
              equipment,
              user
            };
          } catch (error) {
            console.error('Error enriching loan request:', error);
            return request;
          }
        })
      );

      return enrichedRequests;
    } catch (error) {
      console.error('Error enriching loan requests with details:', error);
      return loanRequests;
    }
  }

  /**
   * Notify admins about new loan request
   * @param {Object} loanRequest - Loan request data
   * @param {Object} equipment - Equipment data
   */
  static async notifyAdminsNewLoanRequest(loanRequest, equipment) {
    try {
      // Get user details
      const userRef = doc(db, 'users', loanRequest.userId);
      const userDoc = await getDoc(userRef);
      const user = userDoc.exists() ? userDoc.data() : null;

      if (!user) return;

      // Use the enhanced notification service
      await NotificationService.notifyAdminsNewLoanRequest(loanRequest, equipment, user);
    } catch (error) {
      console.error('Error notifying admins about new loan request:', error);
    }
  }

  /**
   * Update loan request status
   * @param {string} loanRequestId - Loan request ID
   * @param {string} newStatus - New status
   * @param {string} updatedBy - UID of updater
   * @returns {Promise<Object>} Updated loan request
   */
  static async updateLoanRequestStatus(loanRequestId, newStatus, updatedBy) {
    try {
      const loanRequestRef = doc(db, this.COLLECTION_NAME, loanRequestId);
      
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy
      };

      // If marking as returned, set actual return date
      if (newStatus === LOAN_REQUEST_STATUS.RETURNED) {
        updateData.actualReturnDate = serverTimestamp();
      }

      await updateDoc(loanRequestRef, updateData);
      
      // Get updated loan request
      const updatedRequest = await this.getLoanRequestById(loanRequestId);
      return updatedRequest;
    } catch (error) {
      console.error('Error updating loan request status:', error);
      throw error;
    }
  }

  /**
   * Notify user about loan request status
   * @param {Object} loanRequest - Loan request data
   * @param {Object} equipment - Equipment data
   * @param {boolean} approved - Whether approved or rejected
   * @param {string} rejectionReason - Reason for rejection (if applicable)
   */
  static async notifyUserLoanRequestStatus(loanRequest, equipment, approved, rejectionReason = '') {
    try {
      // Use the enhanced notification service
      await NotificationService.notifyUserLoanRequestStatus(loanRequest, equipment, approved, rejectionReason);
    } catch (error) {
      console.error('Error notifying user about loan request status:', error);
    }
  }
}

export default LoanRequestService;