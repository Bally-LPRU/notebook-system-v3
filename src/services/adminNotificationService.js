/**
 * Admin Notification Service
 * 
 * Manages read states and history for the unified admin notification system.
 * This service handles:
 * - Marking notifications as read
 * - Managing notification history
 * - Executing quick actions (approve/reject)
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  addDoc,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  SOURCE_TYPES,
  HISTORY_ACTION_TYPES,
  createNotificationId,
  createReadState,
  createHistoryItem
} from '../types/adminNotification';

// Collection names
const NOTIFICATION_STATE_COLLECTION = 'adminNotificationState';
const NOTIFICATION_HISTORY_COLLECTION = 'adminNotificationHistory';

// ============================================================================
// Read State Management
// ============================================================================

/**
 * Mark a single notification as read
 * @param {string} adminId - Admin user ID
 * @param {string} notificationId - Unified notification ID (sourceType_sourceId)
 * @param {string} sourceType - Source type of the notification
 * @param {string} sourceCollection - Source collection name
 * @returns {Promise<void>}
 */
export const markAsRead = async (adminId, notificationId, sourceType, sourceCollection = '') => {
  if (!adminId || !notificationId || !sourceType) {
    throw new Error('adminId, notificationId, and sourceType are required');
  }

  const stateRef = doc(collection(db, NOTIFICATION_STATE_COLLECTION));
  const readState = {
    adminId,
    notificationId,
    sourceType,
    sourceCollection: sourceCollection || getSourceCollection(sourceType),
    isRead: true,
    readAt: serverTimestamp(),
    createdAt: serverTimestamp()
  };

  await setDoc(stateRef, readState);
  return stateRef.id;
};

/**
 * Mark multiple notifications as read
 * @param {string} adminId - Admin user ID
 * @param {Array<{notificationId: string, sourceType: string}>} notifications - Array of notifications to mark
 * @returns {Promise<void>}
 */
export const markMultipleAsRead = async (adminId, notifications) => {
  if (!adminId || !notifications || notifications.length === 0) {
    return;
  }

  const batch = writeBatch(db);
  const now = serverTimestamp();

  notifications.forEach(({ notificationId, sourceType, sourceCollection }) => {
    const stateRef = doc(collection(db, NOTIFICATION_STATE_COLLECTION));
    batch.set(stateRef, {
      adminId,
      notificationId,
      sourceType,
      sourceCollection: sourceCollection || getSourceCollection(sourceType),
      isRead: true,
      readAt: now,
      createdAt: now
    });
  });

  await batch.commit();
};

/**
 * Mark all notifications of a specific type as read
 * @param {string} adminId - Admin user ID
 * @param {string} [sourceType] - Optional source type filter
 * @returns {Promise<number>} Number of notifications marked as read
 */
export const markAllAsRead = async (adminId, sourceType = null) => {
  // This function would typically be called with a list of current unread notifications
  // For now, we'll just return 0 as the actual marking happens via markMultipleAsRead
  console.log(`markAllAsRead called for admin ${adminId}, sourceType: ${sourceType}`);
  return 0;
};

/**
 * Get all read states for an admin
 * @param {string} adminId - Admin user ID
 * @returns {Promise<Map<string, Object>>} Map of notificationId to read state
 */
export const getReadStates = async (adminId) => {
  if (!adminId) {
    return new Map();
  }

  const statesQuery = query(
    collection(db, NOTIFICATION_STATE_COLLECTION),
    where('adminId', '==', adminId),
    where('isRead', '==', true)
  );

  const snapshot = await getDocs(statesQuery);
  const readStates = new Map();

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    readStates.set(data.notificationId, {
      id: doc.id,
      ...data,
      readAt: data.readAt?.toDate?.() || null,
      createdAt: data.createdAt?.toDate?.() || null
    });
  });

  return readStates;
};

/**
 * Check if a notification is read
 * @param {string} adminId - Admin user ID
 * @param {string} notificationId - Unified notification ID
 * @returns {Promise<boolean>}
 */
export const isNotificationRead = async (adminId, notificationId) => {
  const readStates = await getReadStates(adminId);
  return readStates.has(notificationId);
};

// ============================================================================
// History Management
// ============================================================================

/**
 * Add an item to notification history
 * @param {string} adminId - Admin user ID
 * @param {string} action - Action performed (approved, rejected, viewed, dismissed)
 * @param {string} sourceType - Source type
 * @param {string} sourceId - Source document ID
 * @param {Object} sourceData - Snapshot of source data
 * @param {string} [note] - Optional note/reason
 * @returns {Promise<string>} History document ID
 */
export const addToHistory = async (adminId, action, sourceType, sourceId, sourceData, note = null) => {
  if (!adminId || !action || !sourceType || !sourceId) {
    throw new Error('adminId, action, sourceType, and sourceId are required');
  }

  const historyRef = await addDoc(collection(db, NOTIFICATION_HISTORY_COLLECTION), {
    adminId,
    action,
    sourceType,
    sourceId,
    sourceData: sourceData || {},
    actionAt: serverTimestamp(),
    ...(note && { note })
  });

  return historyRef.id;
};

/**
 * Get notification history for an admin
 * @param {string} adminId - Admin user ID
 * @param {number} [limitCount=50] - Maximum number of items to return
 * @param {Object} [startAfterDoc] - Document to start after (for pagination)
 * @returns {Promise<{items: Array, lastDoc: Object|null}>}
 */
export const getHistory = async (adminId, limitCount = 50, startAfterDoc = null) => {
  if (!adminId) {
    return { items: [], lastDoc: null };
  }

  // Calculate date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let historyQuery = query(
    collection(db, NOTIFICATION_HISTORY_COLLECTION),
    where('adminId', '==', adminId),
    where('actionAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
    orderBy('actionAt', 'desc'),
    limit(limitCount)
  );

  if (startAfterDoc) {
    historyQuery = query(
      collection(db, NOTIFICATION_HISTORY_COLLECTION),
      where('adminId', '==', adminId),
      where('actionAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('actionAt', 'desc'),
      startAfter(startAfterDoc),
      limit(limitCount)
    );
  }

  const snapshot = await getDocs(historyQuery);
  const items = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    actionAt: doc.data().actionAt?.toDate?.() || null
  }));

  const lastDoc = snapshot.docs.length > 0 
    ? snapshot.docs[snapshot.docs.length - 1] 
    : null;

  return { items, lastDoc };
};

/**
 * Get history items by source type
 * @param {string} adminId - Admin user ID
 * @param {string} sourceType - Source type filter
 * @param {number} [limitCount=20] - Maximum number of items
 * @returns {Promise<Array>}
 */
export const getHistoryBySourceType = async (adminId, sourceType, limitCount = 20) => {
  if (!adminId || !sourceType) {
    return [];
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const historyQuery = query(
    collection(db, NOTIFICATION_HISTORY_COLLECTION),
    where('adminId', '==', adminId),
    where('sourceType', '==', sourceType),
    where('actionAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
    orderBy('actionAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(historyQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    actionAt: doc.data().actionAt?.toDate?.() || null
  }));
};

// ============================================================================
// Quick Actions
// ============================================================================

/**
 * Approve a user registration
 * @param {string} adminId - Admin performing the action
 * @param {string} userId - User to approve
 * @param {Object} userData - User data snapshot
 * @returns {Promise<void>}
 */
export const approveUser = async (adminId, userId, userData = {}) => {
  // Import UserService class (default export)
  const UserService = (await import('./userService')).default;
  
  await UserService.approveUser(userId, adminId);
  
  // Add to history
  await addToHistory(
    adminId,
    HISTORY_ACTION_TYPES.APPROVED,
    SOURCE_TYPES.USER_REGISTRATION,
    userId,
    userData
  );
  
  // Send Discord notification (non-blocking)
  try {
    const discordService = (await import('./discordWebhookService')).default;
    discordService.notifyUserApproved(userData, 'Admin').catch(err => {
      console.warn('Discord notification failed:', err.message);
    });
  } catch (err) {
    console.warn('Could not send Discord notification:', err.message);
  }
};

/**
 * Reject a user registration
 * @param {string} adminId - Admin performing the action
 * @param {string} userId - User to reject
 * @param {Object} userData - User data snapshot
 * @param {string} [reason] - Rejection reason
 * @returns {Promise<void>}
 */
export const rejectUser = async (adminId, userId, userData = {}, reason = null) => {
  // Import UserService class (default export)
  const UserService = (await import('./userService')).default;
  
  await UserService.rejectUser(userId, adminId, reason);
  
  await addToHistory(
    adminId,
    HISTORY_ACTION_TYPES.REJECTED,
    SOURCE_TYPES.USER_REGISTRATION,
    userId,
    userData,
    reason
  );
  
  // Send Discord notification (non-blocking)
  try {
    const discordService = (await import('./discordWebhookService')).default;
    discordService.notifyUserRejected(userData, 'Admin', reason).catch(err => {
      console.warn('Discord notification failed:', err.message);
    });
  } catch (err) {
    console.warn('Could not send Discord notification:', err.message);
  }
};

/**
 * Approve a loan request
 * @param {string} adminId - Admin performing the action
 * @param {string} loanId - Loan request to approve
 * @param {Object} loanData - Loan data snapshot
 * @returns {Promise<void>}
 */
export const approveLoan = async (adminId, loanId, loanData = {}) => {
  // Import LoanRequestService class (default export)
  const LoanRequestService = (await import('./loanRequestService')).default;
  
  await LoanRequestService.updateLoanRequestStatus(loanId, 'approved', adminId);
  
  await addToHistory(
    adminId,
    HISTORY_ACTION_TYPES.APPROVED,
    SOURCE_TYPES.LOAN_REQUEST,
    loanId,
    loanData
  );
  
  // Send Discord notification (non-blocking)
  try {
    const discordService = (await import('./discordWebhookService')).default;
    discordService.notifyLoanApproved(loanData, 'Admin').catch(err => {
      console.warn('Discord notification failed:', err.message);
    });
  } catch (err) {
    console.warn('Could not send Discord notification:', err.message);
  }
};

/**
 * Reject a loan request
 * @param {string} adminId - Admin performing the action
 * @param {string} loanId - Loan request to reject
 * @param {Object} loanData - Loan data snapshot
 * @param {string} [reason] - Rejection reason
 * @returns {Promise<void>}
 */
export const rejectLoan = async (adminId, loanId, loanData = {}, reason = null) => {
  // Import LoanRequestService class (default export)
  const LoanRequestService = (await import('./loanRequestService')).default;
  
  await LoanRequestService.updateLoanRequestStatus(loanId, 'rejected', adminId, reason);
  
  await addToHistory(
    adminId,
    HISTORY_ACTION_TYPES.REJECTED,
    SOURCE_TYPES.LOAN_REQUEST,
    loanId,
    loanData,
    reason
  );
  
  // Send Discord notification (non-blocking)
  try {
    const discordService = (await import('./discordWebhookService')).default;
    discordService.notifyLoanRejected(loanData, 'Admin', reason).catch(err => {
      console.warn('Discord notification failed:', err.message);
    });
  } catch (err) {
    console.warn('Could not send Discord notification:', err.message);
  }
};

/**
 * Approve a reservation
 * @param {string} adminId - Admin performing the action
 * @param {string} reservationId - Reservation to approve
 * @param {Object} reservationData - Reservation data snapshot
 * @returns {Promise<void>}
 */
export const approveReservation = async (adminId, reservationId, reservationData = {}) => {
  // Import ReservationService class (default export)
  const ReservationService = (await import('./reservationService')).default;
  
  await ReservationService.updateReservationStatus(reservationId, 'approved', adminId);
  
  await addToHistory(
    adminId,
    HISTORY_ACTION_TYPES.APPROVED,
    SOURCE_TYPES.RESERVATION_REQUEST,
    reservationId,
    reservationData
  );
  
  // Send Discord notification (non-blocking)
  try {
    const discordService = (await import('./discordWebhookService')).default;
    // Reuse loan approved notification format for reservations
    discordService.sendDiscordNotification('การจองอุปกรณ์ได้รับการอนุมัติ', {
      embeds: [{
        title: '✅ การจองอุปกรณ์ได้รับการอนุมัติ',
        color: 0x2ecc71,
        fields: [
          { name: 'ผู้จอง', value: reservationData.userName || 'Unknown', inline: true },
          { name: 'อุปกรณ์', value: reservationData.equipmentName || 'Unknown', inline: true },
          { name: 'อนุมัติโดย', value: 'Admin', inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'ระบบยืม-คืนอุปกรณ์' }
      }]
    }).catch(err => {
      console.warn('Discord notification failed:', err.message);
    });
  } catch (err) {
    console.warn('Could not send Discord notification:', err.message);
  }
};

/**
 * Reject a reservation
 * @param {string} adminId - Admin performing the action
 * @param {string} reservationId - Reservation to reject
 * @param {Object} reservationData - Reservation data snapshot
 * @param {string} [reason] - Rejection reason
 * @returns {Promise<void>}
 */
export const rejectReservation = async (adminId, reservationId, reservationData = {}, reason = null) => {
  // Import ReservationService class (default export)
  const ReservationService = (await import('./reservationService')).default;
  
  await ReservationService.updateReservationStatus(reservationId, 'rejected', adminId, reason);
  
  await addToHistory(
    adminId,
    HISTORY_ACTION_TYPES.REJECTED,
    SOURCE_TYPES.RESERVATION_REQUEST,
    reservationId,
    reservationData,
    reason
  );
  
  // Send Discord notification (non-blocking)
  try {
    const discordService = (await import('./discordWebhookService')).default;
    const fields = [
      { name: 'ผู้จอง', value: reservationData.userName || 'Unknown', inline: true },
      { name: 'อุปกรณ์', value: reservationData.equipmentName || 'Unknown', inline: true },
      { name: 'ปฏิเสธโดย', value: 'Admin', inline: true }
    ];
    if (reason) {
      fields.push({ name: 'เหตุผล', value: reason, inline: false });
    }
    
    discordService.sendDiscordNotification('การจองอุปกรณ์ถูกปฏิเสธ', {
      embeds: [{
        title: '❌ การจองอุปกรณ์ถูกปฏิเสธ',
        color: 0xe74c3c,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: 'ระบบยืม-คืนอุปกรณ์' }
      }]
    }).catch(err => {
      console.warn('Discord notification failed:', err.message);
    });
  } catch (err) {
    console.warn('Could not send Discord notification:', err.message);
  }
};

/**
 * Execute a quick action on a notification
 * @param {string} adminId - Admin performing the action
 * @param {Object} notification - Notification object
 * @param {string} action - Action to perform (approve, reject, view)
 * @param {string} [reason] - Optional reason for rejection
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const executeQuickAction = async (adminId, notification, action, reason = null) => {
  try {
    const { sourceType, sourceData, id } = notification;
    const sourceId = notification.sourceId || id;

    switch (action) {
      case 'approve':
        switch (sourceType) {
          case SOURCE_TYPES.USER_REGISTRATION:
            await approveUser(adminId, sourceId, sourceData);
            break;
          case SOURCE_TYPES.LOAN_REQUEST:
            await approveLoan(adminId, sourceId, sourceData);
            break;
          case SOURCE_TYPES.RESERVATION_REQUEST:
            await approveReservation(adminId, sourceId, sourceData);
            break;
          default:
            throw new Error(`Cannot approve notification of type: ${sourceType}`);
        }
        break;

      case 'reject':
        switch (sourceType) {
          case SOURCE_TYPES.USER_REGISTRATION:
            await rejectUser(adminId, sourceId, sourceData, reason);
            break;
          case SOURCE_TYPES.LOAN_REQUEST:
            await rejectLoan(adminId, sourceId, sourceData, reason);
            break;
          case SOURCE_TYPES.RESERVATION_REQUEST:
            await rejectReservation(adminId, sourceId, sourceData, reason);
            break;
          default:
            throw new Error(`Cannot reject notification of type: ${sourceType}`);
        }
        break;

      case 'view':
        // Just add to history as viewed
        await addToHistory(
          adminId,
          HISTORY_ACTION_TYPES.VIEWED,
          sourceType,
          sourceId,
          sourceData
        );
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Quick action failed:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get source collection name from source type
 * @param {string} sourceType - Source type
 * @returns {string} Collection name
 */
const getSourceCollection = (sourceType) => {
  switch (sourceType) {
    case SOURCE_TYPES.USER_REGISTRATION:
      return 'users';
    case SOURCE_TYPES.LOAN_REQUEST:
    case SOURCE_TYPES.OVERDUE_LOAN:
      return 'loanRequests';
    case SOURCE_TYPES.RESERVATION_REQUEST:
      return 'reservations';
    case SOURCE_TYPES.PERSONAL:
      return 'notifications';
    default:
      return 'unknown';
  }
};

// Export all functions
export default {
  // Read state management
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  getReadStates,
  isNotificationRead,
  
  // History management
  addToHistory,
  getHistory,
  getHistoryBySourceType,
  
  // Quick actions
  approveUser,
  rejectUser,
  approveLoan,
  rejectLoan,
  approveReservation,
  rejectReservation,
  executeQuickAction
};
