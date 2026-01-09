/**
 * Cloud Function: No-Show Reservation Checker
 * 
 * This function runs every 30 minutes to detect no-show reservations and create alerts.
 * Also tracks no-show patterns per user.
 * 
 * Schedule: Every 30 minutes
 * Trigger: Cloud Scheduler (Pub/Sub)
 * 
 * Requirements: 2.1, 2.4
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Alert types and priorities
const ALERT_TYPE = {
  NO_SHOW_RESERVATION: 'no_show_reservation',
  REPEAT_NO_SHOW_USER: 'repeat_no_show_user'
};

const ALERT_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const RESERVATION_STATUS = {
  READY: 'ready',
  NO_SHOW: 'no_show',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Check if a reservation is a no-show
 * A reservation is considered a no-show if:
 * - Current time is more than 2 hours after the start time
 * - Reservation status is 'ready' (approved and waiting for pickup)
 * 
 * @param {Object} reservation - Reservation object
 * @param {Date} currentTime - Current time
 * @returns {boolean} True if no-show
 */
function isNoShow(reservation, currentTime) {
  if (!reservation || !reservation.startTime) {
    return false;
  }

  // Only check reservations with 'ready' status
  if (reservation.status !== RESERVATION_STATUS.READY) {
    return false;
  }

  // Convert startTime to Date
  const startTime = reservation.startTime.toDate();

  // Calculate pickup deadline (2 hours after start time)
  const pickupDeadlineMs = startTime.getTime() + (2 * 60 * 60 * 1000);
  const pickupDeadline = new Date(pickupDeadlineMs);

  // Check if current time is past the pickup deadline
  return currentTime > pickupDeadline;
}

/**
 * Check if alert already exists for a reservation
 * @param {string} reservationId - Reservation ID
 * @returns {Promise<Object|null>} Existing alert or null
 */
async function getExistingAlert(reservationId) {
  try {
    const alertsRef = db.collection('adminAlerts');
    const q = alertsRef
      .where('sourceId', '==', reservationId)
      .where('type', '==', ALERT_TYPE.NO_SHOW_RESERVATION)
      .where('isResolved', '==', false)
      .limit(1);

    const querySnapshot = await q.get();
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting existing alert:', error);
    return null;
  }
}

/**
 * Create a no-show reservation alert
 * @param {Object} reservation - Reservation object
 * @returns {Promise<Object>} Created alert
 */
async function createNoShowAlert(reservation) {
  try {
    const title = 'ไม่มารับอุปกรณ์ตามเวลาจอง';
    
    const description = `การจอง ${reservation.equipmentSnapshot?.name || 'อุปกรณ์'} ` +
      `โดย ${reservation.userSnapshot?.displayName || 'ผู้ใช้'} ` +
      `ไม่มารับภายในเวลาที่กำหนด`;

    const quickActions = [
      {
        id: 'cancel_reservation',
        label: 'ยกเลิกการจอง',
        action: 'cancel_reservation',
        params: { reservationId: reservation.id }
      },
      {
        id: 'extend_pickup',
        label: 'ขยายเวลารับ',
        action: 'extend_pickup_time',
        params: { reservationId: reservation.id }
      },
      {
        id: 'contact_user',
        label: 'ติดต่อผู้ใช้',
        action: 'contact_user',
        params: { reservationId: reservation.id, userId: reservation.userId }
      },
      {
        id: 'dismiss',
        label: 'ปิดการแจ้งเตือน',
        action: 'dismiss',
        params: { reservationId: reservation.id }
      }
    ];

    const alert = {
      type: ALERT_TYPE.NO_SHOW_RESERVATION,
      priority: ALERT_PRIORITY.HIGH,
      title,
      description,
      sourceId: reservation.id,
      sourceType: 'reservation',
      sourceData: {
        reservationId: reservation.id,
        equipmentId: reservation.equipmentId,
        equipmentName: reservation.equipmentSnapshot?.name,
        userId: reservation.userId,
        userName: reservation.userSnapshot?.displayName,
        userEmail: reservation.userSnapshot?.email,
        startTime: reservation.startTime,
        endTime: reservation.endTime
      },
      quickActions,
      isResolved: false,
      resolvedAt: null,
      resolvedBy: null,
      resolvedAction: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('adminAlerts').add(alert);

    console.log(`Created no-show alert for reservation ${reservation.id}`);

    return {
      id: docRef.id,
      ...alert
    };
  } catch (error) {
    console.error('Error creating no-show alert:', error);
    throw error;
  }
}

/**
 * Track user no-show for pattern detection
 * Stores no-show events in userNoShows collection
 * 
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function trackUserNoShow(userId) {
  try {
    await db.collection('userNoShows').add({
      userId,
      occurredAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Tracked no-show for user ${userId}`);
  } catch (error) {
    console.error('Error tracking user no-show:', error);
    // Don't throw - this is a secondary operation
  }
}

/**
 * Get user's no-show count in the last N days
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<number>} No-show count
 */
async function getUserNoShowCount(userId, days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const noShowsRef = db.collection('userNoShows');
    const q = noShowsRef
      .where('userId', '==', userId)
      .where('occurredAt', '>=', admin.firestore.Timestamp.fromDate(cutoffDate));

    const querySnapshot = await q.get();
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting user no-show count:', error);
    return 0;
  }
}

/**
 * Check if user is a repeat no-show offender (3+ no-shows in 30 days)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if repeat offender
 */
async function isRepeatNoShowOffender(userId) {
  const noShowCount = await getUserNoShowCount(userId, 30);
  return noShowCount >= 3;
}

/**
 * Create a repeat no-show offender alert
 * @param {Object} user - User object
 * @param {number} noShowCount - Number of no-shows in last 30 days
 * @returns {Promise<Object>} Created alert
 */
async function createRepeatNoShowAlert(user, noShowCount) {
  try {
    // Check if alert already exists for this user
    const alertsRef = db.collection('adminAlerts');
    const existingQuery = alertsRef
      .where('sourceId', '==', user.id)
      .where('type', '==', ALERT_TYPE.REPEAT_NO_SHOW_USER)
      .where('isResolved', '==', false)
      .limit(1);

    const existingSnapshot = await existingQuery.get();
    
    if (!existingSnapshot.empty) {
      // Alert already exists, just update the count
      const alertDoc = existingSnapshot.docs[0];
      await alertDoc.ref.update({
        'sourceData.noShowCount': noShowCount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Updated repeat no-show alert for user ${user.id}`);
      return { id: alertDoc.id, ...alertDoc.data() };
    }

    const title = 'ผู้ใช้ไม่มารับอุปกรณ์ซ้ำหลายครั้ง';
    
    const description = `${user.displayName || user.email || 'ผู้ใช้'} ` +
      `ไม่มารับอุปกรณ์ ${noShowCount} ครั้งในช่วง 30 วันที่ผ่านมา`;

    const quickActions = [
      {
        id: 'flag_user',
        label: 'ทำเครื่องหมายผู้ใช้',
        action: 'flag_user',
        params: { userId: user.id }
      },
      {
        id: 'contact_user',
        label: 'ติดต่อผู้ใช้',
        action: 'contact_user',
        params: { userId: user.id }
      },
      {
        id: 'dismiss',
        label: 'ปิดการแจ้งเตือน',
        action: 'dismiss',
        params: { userId: user.id }
      }
    ];

    const alert = {
      type: ALERT_TYPE.REPEAT_NO_SHOW_USER,
      priority: ALERT_PRIORITY.HIGH,
      title,
      description,
      sourceId: user.id,
      sourceType: 'user',
      sourceData: {
        userId: user.id,
        userName: user.displayName,
        userEmail: user.email,
        noShowCount,
        period: '30 days'
      },
      quickActions,
      isResolved: false,
      resolvedAt: null,
      resolvedBy: null,
      resolvedAction: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('adminAlerts').add(alert);

    console.log(`Created repeat no-show offender alert for user ${user.id} (${noShowCount} no-shows)`);

    return {
      id: docRef.id,
      ...alert
    };
  } catch (error) {
    console.error('Error creating repeat no-show alert:', error);
    throw error;
  }
}

/**
 * Main function: Check for no-show reservations and create alerts
 * Requirements: 2.1, 2.4
 */
exports.checkNoShowReservations = functions.pubsub
  .schedule('every 30 minutes')
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    try {
      console.log('Starting no-show reservations check...');
      
      const currentTime = new Date();
      const results = {
        scanned: 0,
        newAlerts: 0,
        repeatOffenderAlerts: 0,
        errors: []
      };

      // Query for reservations with 'ready' status (approved and waiting for pickup)
      const reservationsRef = db.collection('reservations');
      const q = reservationsRef.where('status', '==', RESERVATION_STATUS.READY);

      const querySnapshot = await q.get();
      
      console.log(`Found ${querySnapshot.size} ready reservations to check`);

      // Track users who had no-shows in this run
      const usersWithNoShows = new Set();

      for (const docSnap of querySnapshot.docs) {
        results.scanned++;
        const reservation = {
          id: docSnap.id,
          ...docSnap.data()
        };

        try {
          // Check if this reservation is a no-show
          if (isNoShow(reservation, currentTime)) {
            // Check if alert already exists
            const existingAlert = await getExistingAlert(reservation.id);
            
            if (!existingAlert) {
              // Create new no-show alert
              await createNoShowAlert(reservation);
              results.newAlerts++;

              // Track no-show for user pattern detection
              await trackUserNoShow(reservation.userId);
              usersWithNoShows.add(reservation.userId);

              // Update reservation status to no_show
              await db.collection('reservations').doc(reservation.id).update({
                status: RESERVATION_STATUS.NO_SHOW,
                isNoShow: true,
                noShowMarkedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
        } catch (reservationError) {
          console.error(`Error processing reservation ${reservation.id}:`, reservationError);
          results.errors.push({
            reservationId: reservation.id,
            error: reservationError.message
          });
        }
      }

      // Check for repeat no-show offenders among users who had no-shows
      for (const userId of usersWithNoShows) {
        try {
          const isRepeatOffender = await isRepeatNoShowOffender(userId);
          
          if (isRepeatOffender) {
            // Get user data
            const userDoc = await db.collection('users').doc(userId).get();
            
            if (userDoc.exists()) {
              const userData = {
                id: userId,
                ...userDoc.data()
              };
              
              const noShowCount = await getUserNoShowCount(userId, 30);
              await createRepeatNoShowAlert(userData, noShowCount);
              results.repeatOffenderAlerts++;
            }
          }
        } catch (userError) {
          console.error(`Error checking repeat offender for user ${userId}:`, userError);
          results.errors.push({
            userId,
            error: userError.message
          });
        }
      }

      console.log('No-show reservations check completed:');
      console.log(`- Scanned: ${results.scanned} reservations`);
      console.log(`- New no-show alerts: ${results.newAlerts}`);
      console.log(`- Repeat offender alerts: ${results.repeatOffenderAlerts}`);
      console.log(`- Errors: ${results.errors.length}`);

      return {
        success: true,
        ...results,
        timestamp: currentTime.toISOString()
      };

    } catch (error) {
      console.error('Error in no-show reservations check:', error);
      throw error;
    }
  });
