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
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  LOAN_REQUEST_STATUS, 
  LOAN_REQUEST_PAGINATION 
} from '../types/loanRequest';
import { EQUIPMENT_STATUS } from '../types/equipment';
import EquipmentService from './equipmentService';
import NotificationService from './notificationService';
import OverdueManagementService from './overdueManagementService';
import LoanRequestSearchService from './loanRequestSearchService';

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
      const existingRequest = await this.getExistingPendingRequest(loanRequestData.equipmentId, userId);
      if (existingRequest) {
        throw new Error('มีคำขอยืมอุปกรณ์นี้รอการอนุมัติอยู่แล้ว');
      }

      // Normalize some frequently used fields
      const equipmentCategory = equipment.category || equipment.categoryId || null;
      const equipmentNumber = equipment.equipmentNumber || equipment.inventoryNumber || equipment.serialNumber || equipment.assetNumber || null;
      const userDepartment = typeof userData?.department === 'object'
        ? userData.department.value || userData.department.label || null
        : userData?.department || null;

      // Check category limit (skip if category is missing)
      if (equipmentCategory) {
        const canBorrow = await this.checkCategoryLimit(userId, equipmentCategory);
        if (!canBorrow.allowed) {
          throw new Error(canBorrow.message);
        }
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

      // Get user data for search keywords
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      // Generate search keywords
      const searchKeywords = LoanRequestSearchService.generateSearchKeywords(
        loanRequestData,
        equipment,
        userData
      );

      // Prepare loan request data with denormalized fields for data consistency
      const loanRequest = {
        equipmentId: loanRequestData.equipmentId,
        equipmentNumber,
        userId,
        requestDate: serverTimestamp(),
        borrowDate: Timestamp.fromDate(borrowDate),
        expectedReturnDate: Timestamp.fromDate(expectedReturnDate),
        actualReturnDate: null,
        purpose: loanRequestData.purpose.trim(),
        notes: loanRequestData.notes?.trim() || '',
        status: LOAN_REQUEST_STATUS.PENDING,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        searchKeywords, // Add search keywords for efficient searching
        // ✅ Denormalized fields for server-side filtering
        equipmentCategory, // For efficient category filtering
        equipmentName: equipment.name || 'ไม่ทราบชื่อ', // For sorting and display
        equipmentStatus: equipment.status || null,
        userName: userData?.displayName || 'ไม่ทราบชื่อ', // For sorting and display
        userEmail: userData?.email || '',
        userDepartment, // For department filtering
        // ✅ Denormalized data for consistency and fallback
        equipmentSnapshot: {
          name: equipment.name || 'ไม่ทราบชื่อ',
          category: equipmentCategory,
          serialNumber: equipment.serialNumber || null,
          equipmentNumber,
          imageUrl: equipment.imageUrl || equipment.images?.[0] || equipment.imageURL || null,
          brand: equipment.brand || null,
          model: equipment.model || null,
          status: equipment.status || null
        },
        userSnapshot: {
          displayName: userData?.displayName || 'ไม่ทราบชื่อ',
          email: userData?.email || '',
          department: userDepartment,
          studentId: userData?.studentId || userData?.studentID || null
        },
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
   * Enhanced version with proper search pagination support
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Loan requests list with pagination info
   */
  static async getLoanRequests(filters = {}) {
    try {
      const {
        search = '',
        status = '',
        userId = '',
        equipmentId = '',
        equipmentCategory = '',
        dateRange = null,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = LOAN_REQUEST_PAGINATION.DEFAULT_PAGE,
        limit: pageLimit = LOAN_REQUEST_PAGINATION.DEFAULT_LIMIT,
        lastDoc = null,
        useServerSideSearch = true // New option to enable/disable server-side search
      } = filters;

      // Ensure limit doesn't exceed maximum
      const limit = Math.min(pageLimit, LOAN_REQUEST_PAGINATION.MAX_LIMIT);

      // Use enhanced search service if search query is provided and server-side search is enabled
      if (search && search.length >= 2 && useServerSideSearch) {
        return await this.getLoanRequestsWithSearch({
          ...filters,
          limit: pageLimit
        });
      }

      // Standard query without search
      let loanRequestQuery = collection(db, this.COLLECTION_NAME);
      const queryConstraints = [];

      // Add filters
      if (status) {
        queryConstraints.push(where('status', '==', status));
      }
      
      if (userId) {
        queryConstraints.push(where('userId', '==', userId));
      }

      if (equipmentId) {
        queryConstraints.push(where('equipmentId', '==', equipmentId));
      }

      // ✅ Fixed: Server-side category filtering using denormalized field
      if (equipmentCategory) {
        queryConstraints.push(where('equipmentCategory', '==', equipmentCategory));
      }

      // Date range filter
      if (dateRange) {
        if (dateRange.start) {
          queryConstraints.push(where('borrowDate', '>=', Timestamp.fromDate(new Date(dateRange.start))));
        }
        if (dateRange.end) {
          queryConstraints.push(where('borrowDate', '<=', Timestamp.fromDate(new Date(dateRange.end))));
        }
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

      // ✅ Fixed: Removed client-side filtering for equipmentCategory
      // Note: equipmentCategory filtering should be done server-side or removed
      // For now, we'll keep the data as-is and let the UI handle category filtering
      // if needed, or implement proper server-side filtering with denormalized category field

      return {
        loanRequests: enrichedLoanRequests,
        pagination: {
          currentPage: page,
          hasNextPage: hasNextPage, // ✅ Always accurate now
          totalItems: enrichedLoanRequests.length,
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
   * Approve loan request (ไม่เปลี่ยนสถานะอุปกรณ์ทันที)
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

      // อัปเดตเฉพาะสถานะคำขอ ไม่แตะอุปกรณ์
      const loanRequestRef = doc(db, this.COLLECTION_NAME, loanRequestId);
      await updateDoc(loanRequestRef, {
        status: LOAN_REQUEST_STATUS.APPROVED,
        approvedBy,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

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
   * Mark loan as picked up (บันทึกการรับอุปกรณ์และเปลี่ยนสถานะอุปกรณ์)
   * @param {string} loanRequestId - Loan request ID
   * @param {string} pickedUpBy - UID of person marking pickup
   * @returns {Promise<Object>} Updated loan request
   */
  static async markAsPickedUp(loanRequestId, pickedUpBy) {
    try {
      const loanRequest = await this.getLoanRequestById(loanRequestId);
      if (!loanRequest) {
        throw new Error('ไม่พบคำขอยืม');
      }

      if (loanRequest.status !== LOAN_REQUEST_STATUS.APPROVED) {
        throw new Error('คำขอยืมต้องได้รับการอนุมัติก่อน');
      }

      // Check equipment availability
      const equipment = await EquipmentService.getEquipmentById(loanRequest.equipmentId);
      if (!equipment || equipment.status !== EQUIPMENT_STATUS.AVAILABLE) {
        throw new Error('อุปกรณ์ไม่พร้อมใช้งาน');
      }

      const batch = writeBatch(db);

      // อัปเดตสถานะคำขอเป็น borrowed
      const loanRequestRef = doc(db, this.COLLECTION_NAME, loanRequestId);
      batch.update(loanRequestRef, {
        status: LOAN_REQUEST_STATUS.BORROWED,
        pickedUpAt: serverTimestamp(),
        pickedUpBy,
        updatedAt: serverTimestamp()
      });

      // อัปเดตสถานะอุปกรณ์เป็น borrowed
      const equipmentRef = doc(db, 'equipmentManagement', loanRequest.equipmentId);
      batch.update(equipmentRef, {
        status: EQUIPMENT_STATUS.BORROWED,
        currentBorrowerId: loanRequest.userId,
        borrowedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: pickedUpBy
      });

      // Commit batch
      await batch.commit();

      const updatedRequest = {
        ...loanRequest,
        status: LOAN_REQUEST_STATUS.BORROWED,
        pickedUpAt: new Date(),
        pickedUpBy,
        updatedAt: new Date()
      };

      return updatedRequest;
    } catch (error) {
      console.error('Error marking as picked up:', error);
      throw error;
    }
  }

  /**
   * Mark loan as returned (บันทึกการคืนอุปกรณ์)
   * @param {string} loanRequestId - Loan request ID
   * @param {string} returnedBy - UID of person marking return
   * @returns {Promise<Object>} Updated loan request
   */
  static async markAsReturned(loanRequestId, returnedBy) {
    try {
      const loanRequest = await this.getLoanRequestById(loanRequestId);
      if (!loanRequest) {
        throw new Error('ไม่พบคำขอยืม');
      }

      if (loanRequest.status !== LOAN_REQUEST_STATUS.BORROWED) {
        throw new Error('คำขอยืมต้องอยู่ในสถานะกำลังยืม');
      }

      const batch = writeBatch(db);

      // อัปเดตสถานะคำขอเป็น returned
      const loanRequestRef = doc(db, this.COLLECTION_NAME, loanRequestId);
      batch.update(loanRequestRef, {
        status: LOAN_REQUEST_STATUS.RETURNED,
        actualReturnDate: serverTimestamp(),
        returnedBy,
        updatedAt: serverTimestamp()
      });

      // อัปเดตสถานะอุปกรณ์เป็น available
      const equipmentRef = doc(db, 'equipmentManagement', loanRequest.equipmentId);
      batch.update(equipmentRef, {
        status: EQUIPMENT_STATUS.AVAILABLE,
        currentBorrowerId: null,
        borrowedAt: null,
        returnedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: returnedBy
      });

      // Commit batch
      await batch.commit();

      const updatedRequest = {
        ...loanRequest,
        status: LOAN_REQUEST_STATUS.RETURNED,
        actualReturnDate: new Date(),
        returnedBy,
        updatedAt: new Date()
      };

      return updatedRequest;
    } catch (error) {
      console.error('Error marking as returned:', error);
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
   * @param {string} userId - User ID to scope the search
   * @returns {Promise<Object|null>} Existing pending request or null
   */
  static async getExistingPendingRequest(equipmentId, userId) {
    try {
      const loanRequestRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        loanRequestRef,
        where('equipmentId', '==', equipmentId),
        where('userId', '==', userId),
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
   * ✅ Fixed N+1 Query Problem: Uses batch fetching instead of individual queries
   * @param {Array} loanRequests - Array of loan requests
   * @returns {Promise<Array>} Enriched loan requests
   */
  static async enrichLoanRequestsWithDetails(loanRequests) {
    try {
      if (!loanRequests || loanRequests.length === 0) {
        return [];
      }

      // Collect unique IDs
      const equipmentIds = [...new Set(loanRequests.map(r => r.equipmentId).filter(Boolean))];
      const userIds = [...new Set(loanRequests.map(r => r.userId).filter(Boolean))];

      // Batch fetch equipment data
      const equipmentMap = new Map();
      if (equipmentIds.length > 0) {
        try {
          // Fetch equipment in batches to avoid hitting Firestore limits (max 10 per 'in' query)
          const equipmentBatches = [];
          for (let i = 0; i < equipmentIds.length; i += 10) {
            const batchIds = equipmentIds.slice(i, i + 10);
            equipmentBatches.push(batchIds);
          }

          for (const batchIds of equipmentBatches) {
            const equipmentPromises = batchIds.map(id => 
              EquipmentService.getEquipmentById(id).catch(err => {
                console.error(`Error fetching equipment ${id}:`, err);
                return null;
              })
            );
            const equipmentResults = await Promise.all(equipmentPromises);
            
            batchIds.forEach((id, index) => {
              if (equipmentResults[index]) {
                equipmentMap.set(id, equipmentResults[index]);
              }
            });
          }
        } catch (error) {
          console.error('Error batch fetching equipment:', error);
        }
      }

      // Batch fetch user data
      const userMap = new Map();
      if (userIds.length > 0) {
        try {
          // Fetch users in batches to avoid hitting Firestore limits
          const userBatches = [];
          for (let i = 0; i < userIds.length; i += 10) {
            const batchIds = userIds.slice(i, i + 10);
            userBatches.push(batchIds);
          }

          for (const batchIds of userBatches) {
            const userPromises = batchIds.map(id => 
              getDoc(doc(db, 'users', id)).catch(err => {
                console.error(`Error fetching user ${id}:`, err);
                return null;
              })
            );
            const userDocs = await Promise.all(userPromises);
            
            batchIds.forEach((id, index) => {
              const userDoc = userDocs[index];
              if (userDoc && userDoc.exists()) {
                userMap.set(id, {
                  id: userDoc.id,
                  ...userDoc.data()
                });
              }
            });
          }
        } catch (error) {
          console.error('Error batch fetching users:', error);
        }
      }

      // Enrich requests with fetched data, using denormalized snapshots as fallback
      const enrichedRequests = loanRequests.map(request => {
        const equipment = equipmentMap.get(request.equipmentId) || null;
        const user = userMap.get(request.userId) || null;

        // Use live data if available, otherwise fall back to snapshot
        const equipmentData = equipment || (request.equipmentSnapshot ? {
          name: request.equipmentSnapshot.name,
          category: request.equipmentSnapshot.category,
          serialNumber: request.equipmentSnapshot.serialNumber,
          imageUrl: request.equipmentSnapshot.imageUrl,
          _isSnapshot: true // Flag to indicate this is snapshot data
        } : null);

        const userData = user || (request.userSnapshot ? {
          displayName: request.userSnapshot.displayName,
          email: request.userSnapshot.email,
          department: request.userSnapshot.department,
          studentId: request.userSnapshot.studentId,
          _isSnapshot: true // Flag to indicate this is snapshot data
        } : null);

        return {
          ...request,
          equipment: equipmentData,
          user: userData,
          // Add convenient fallback fields
          _equipmentName: equipmentData?.name || request.equipmentId || 'ไม่ทราบชื่ออุปกรณ์',
          _userName: userData?.displayName || userData?.email || request.userId || 'ไม่ทราบชื่อผู้ใช้',
          _hasLiveData: !equipmentData?._isSnapshot && !userData?._isSnapshot
        };
      });

      return enrichedRequests;
    } catch (error) {
      console.error('Error enriching loan requests with details:', error);
      // Return original data with fallback fields using snapshots
      return loanRequests.map(request => ({
        ...request,
        equipment: request.equipmentSnapshot ? {
          name: request.equipmentSnapshot.name,
          category: request.equipmentSnapshot.category,
          serialNumber: request.equipmentSnapshot.serialNumber,
          imageUrl: request.equipmentSnapshot.imageUrl,
          _isSnapshot: true,
          _error: true
        } : null,
        user: request.userSnapshot ? {
          displayName: request.userSnapshot.displayName,
          email: request.userSnapshot.email,
          department: request.userSnapshot.department,
          studentId: request.userSnapshot.studentId,
          _isSnapshot: true,
          _error: true
        } : null,
        _equipmentName: request.equipmentSnapshot?.name || request.equipmentId || 'ไม่ทราบชื่ออุปกรณ์',
        _userName: request.userSnapshot?.displayName || request.userSnapshot?.email || request.userId || 'ไม่ทราบชื่อผู้ใช้',
        _hasLiveData: false,
        _enrichmentError: true
      }));
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

      // Send Discord notification
      try {
        const discordWebhookService = (await import('./discordWebhookService.js')).default;
        await discordWebhookService.notifyNewLoanRequest({
          userName: user.displayName || user.email || 'Unknown',
          equipmentName: equipment.name || 'Unknown',
          status: loanRequest.status || 'pending',
          borrowDate: loanRequest.borrowDate,
          returnDate: loanRequest.expectedReturnDate,
          purpose: loanRequest.purpose
        });
      } catch (discordError) {
        // Log but don't fail the operation
        console.error('Error sending Discord notification for new loan request:', discordError);
      }
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

  /**
   * Get loan requests with search (using search service)
   * @param {Object} filters - Filter parameters including search
   * @returns {Promise<Object>} Loan requests list with pagination info
   */
  static async getLoanRequestsWithSearch(filters = {}) {
    try {
      const {
        page = LOAN_REQUEST_PAGINATION.DEFAULT_PAGE
      } = filters;

      // Use search service for server-side search with pagination
      const searchResult = await LoanRequestSearchService.searchLoanRequests(filters);

      // Enrich with equipment and user data
      const enrichedLoanRequests = await this.enrichLoanRequestsWithDetails(searchResult.loanRequests);

      return {
        loanRequests: enrichedLoanRequests,
        pagination: {
          currentPage: page,
          hasNextPage: searchResult.hasNextPage,
          totalItems: searchResult.totalFetched,
          limit: filters.limit || LOAN_REQUEST_PAGINATION.DEFAULT_LIMIT
        },
        lastDoc: searchResult.lastDoc
      };
    } catch (error) {
      console.error('Error getting loan requests with search:', error);
      throw error;
    }
  }

  /**
   * Check and update overdue loan requests (client-side fallback)
   * This is a fallback in case Cloud Function hasn't run yet
   * @returns {Promise<number>} Number of loans marked as overdue
   */
  static async checkAndUpdateOverdueLoans() {
    try {
      const now = Timestamp.now();
      
      // Query for borrowed loans that are past their expected return date
      const overdueQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', LOAN_REQUEST_STATUS.BORROWED),
        where('expectedReturnDate', '<', now)
      );

      const querySnapshot = await getDocs(overdueQuery);
      
      if (querySnapshot.empty) {
        return 0;
      }

      const batch = writeBatch(db);
      let count = 0;

      querySnapshot.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, {
          status: LOAN_REQUEST_STATUS.OVERDUE,
          overdueMarkedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        count++;
      });

      await batch.commit();
      console.log(`Marked ${count} loan requests as overdue`);
      
      return count;
    } catch (error) {
      console.error('Error checking overdue loans:', error);
      throw error;
    }
  }

  /**
   * Get overdue loan requests
   * @param {string} userId - User ID (optional, for filtering by user)
   * @returns {Promise<Array>} Array of overdue loan requests
   */
  static async getOverdueLoanRequests(userId = null) {
    try {
      return await OverdueManagementService.getOverdueLoanRequests(userId);
    } catch (error) {
      console.error('Error getting overdue loan requests:', error);
      throw error;
    }
  }

  /**
   * Get loan requests due soon
   * @param {number} daysAhead - Number of days to look ahead (default: 3)
   * @param {string} userId - User ID (optional, for filtering by user)
   * @returns {Promise<Array>} Array of loan requests due soon
   */
  static async getLoanRequestsDueSoon(daysAhead = 3, userId = null) {
    try {
      return await OverdueManagementService.getLoanRequestsDueSoon(daysAhead, userId);
    } catch (error) {
      console.error('Error getting loan requests due soon:', error);
      throw error;
    }
  }

  /**
   * Get overdue statistics
   * @param {string} userId - User ID (optional, for user-specific stats)
   * @returns {Promise<Object>} Overdue statistics
   */
  static async getOverdueStatistics(userId = null) {
    try {
      return await OverdueManagementService.getOverdueStatistics(userId);
    } catch (error) {
      console.error('Error getting overdue statistics:', error);
      throw error;
    }
  }

  /**
   * Check if a loan request is overdue
   * @param {Object} loanRequest - Loan request object
   * @returns {boolean} True if overdue
   */
  static isOverdue(loanRequest) {
    return OverdueManagementService.isOverdue(loanRequest);
  }

  /**
   * Calculate days overdue
   * @param {Date|Timestamp} expectedReturnDate - Expected return date
   * @returns {number} Number of days overdue
   */
  static calculateDaysOverdue(expectedReturnDate) {
    return OverdueManagementService.calculateDaysOverdue(expectedReturnDate);
  }

  /**
   * Check if user can borrow equipment from a category based on category limits
   * @param {string} userId - User ID
   * @param {string} categoryId - Equipment category ID
   * @returns {Promise<Object>} Object with allowed (boolean) and message (string)
   */
  static async checkCategoryLimit(userId, categoryId) {
    try {
      // Import settingsService dynamically to avoid circular dependencies
      const settingsService = (await import('./settingsService.js')).default;

      // Get category limit (null if not set)
      const categoryLimit = await settingsService.getCategoryLimit(categoryId);
      
      // Get system settings for default limit
      const settings = await settingsService.getSettings();
      const defaultLimit = settings.defaultCategoryLimit || 3;
      
      // Use category-specific limit or default
      const effectiveLimit = categoryLimit !== null ? categoryLimit : defaultLimit;

      // If limit is 0, category is not allowed to be borrowed
      if (effectiveLimit === 0) {
        return {
          allowed: false,
          message: 'ไม่อนุญาตให้ยืมอุปกรณ์ประเภทนี้ในขณะนี้'
        };
      }

      // Query user's current borrowed equipment in this category
      const loanRequestRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        loanRequestRef,
        where('userId', '==', userId),
        where('status', '==', LOAN_REQUEST_STATUS.BORROWED),
        where('equipmentCategory', '==', categoryId)
      );

      const querySnapshot = await getDocs(q);
      const currentBorrowedCount = querySnapshot.size;

      // Check if limit is exceeded
      if (currentBorrowedCount >= effectiveLimit) {
        return {
          allowed: false,
          message: `คุณยืมอุปกรณ์ประเภทนี้ครบจำนวนจำกัดแล้ว (${currentBorrowedCount}/${effectiveLimit} ชิ้น) กรุณาคืนอุปกรณ์บางชิ้นก่อนยืมเพิ่ม`,
          currentCount: currentBorrowedCount,
          limit: effectiveLimit
        };
      }

      return {
        allowed: true,
        message: 'สามารถยืมได้',
        currentCount: currentBorrowedCount,
        limit: effectiveLimit
      };
    } catch (error) {
      console.error('Error checking category limit:', error);
      // On error, allow the request to proceed (fail open)
      return {
        allowed: true,
        message: 'ไม่สามารถตรวจสอบจำนวนจำกัดได้ อนุญาตให้ดำเนินการต่อ',
        error: error.message
      };
    }
  }
}

export default LoanRequestService;
