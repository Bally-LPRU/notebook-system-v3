/**
 * Cloud Function: Check and Update Overdue Loan Requests
 * 
 * This function runs every hour to check for loan requests that have exceeded
 * their expected return date and updates their status to 'overdue'.
 * It also sends notifications to users and admins about overdue loans.
 * 
 * Schedule: Every 1 hour
 * Trigger: Cloud Scheduler (Pub/Sub)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Check for overdue loan requests and update their status
 */
exports.checkOverdueLoans = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    try {
      console.log('Starting overdue loans check...');
      
      const now = admin.firestore.Timestamp.now();
      const batch = db.batch();
      let overdueCount = 0;
      let notificationsSent = 0;

      // Query for borrowed loans that are past their expected return date
      const overdueLoansQuery = db.collection('loanRequests')
        .where('status', '==', 'borrowed')
        .where('expectedReturnDate', '<', now);

      const overdueLoansSnapshot = await overdueLoansQuery.get();

      if (overdueLoansSnapshot.empty) {
        console.log('No overdue loans found.');
        return null;
      }

      console.log(`Found ${overdueLoansSnapshot.size} overdue loans.`);

      // Process each overdue loan
      for (const loanDoc of overdueLoansSnapshot.docs) {
        const loanData = loanDoc.data();
        const loanId = loanDoc.id;

        // Update loan status to overdue
        batch.update(loanDoc.ref, {
          status: 'overdue',
          overdueMarkedAt: now,
          updatedAt: now
        });

        overdueCount++;

        // Create notification for the borrower
        const borrowerNotificationRef = db.collection('notifications').doc();
        batch.set(borrowerNotificationRef, {
          userId: loanData.userId,
          type: 'loan_overdue',
          title: 'การยืมอุปกรณ์เกินกำหนด',
          message: `คุณยืมอุปกรณ์เกินกำหนดคืนแล้ว กรุณาคืนอุปกรณ์โดยเร็วที่สุด`,
          data: {
            loanRequestId: loanId,
            equipmentId: loanData.equipmentId,
            expectedReturnDate: loanData.expectedReturnDate,
            daysOverdue: calculateDaysOverdue(loanData.expectedReturnDate, now)
          },
          isRead: false,
          priority: 'high',
          actionUrl: `/my-loans/${loanId}`,
          actionText: 'ดูรายละเอียด',
          createdAt: now
        });

        notificationsSent++;

        // Create notification for admins
        const adminsSnapshot = await db.collection('users')
          .where('role', '==', 'admin')
          .get();

        for (const adminDoc of adminsSnapshot.docs) {
          const adminNotificationRef = db.collection('notifications').doc();
          batch.set(adminNotificationRef, {
            userId: adminDoc.id,
            type: 'loan_overdue_admin',
            title: 'มีการยืมอุปกรณ์เกินกำหนด',
            message: `มีผู้ใช้ยืมอุปกรณ์เกินกำหนดคืน`,
            data: {
              loanRequestId: loanId,
              equipmentId: loanData.equipmentId,
              borrowerId: loanData.userId,
              expectedReturnDate: loanData.expectedReturnDate,
              daysOverdue: calculateDaysOverdue(loanData.expectedReturnDate, now)
            },
            isRead: false,
            priority: 'medium',
            actionUrl: `/admin/loan-requests/${loanId}`,
            actionText: 'ดูรายละเอียด',
            createdAt: now
          });

          notificationsSent++;
        }

        // Log activity
        const activityLogRef = db.collection('activityLogs').doc();
        batch.set(activityLogRef, {
          userId: 'system',
          action: 'loan_marked_overdue',
          targetType: 'loan_request',
          targetId: loanId,
          details: {
            equipmentId: loanData.equipmentId,
            borrowerId: loanData.userId,
            expectedReturnDate: loanData.expectedReturnDate,
            daysOverdue: calculateDaysOverdue(loanData.expectedReturnDate, now)
          },
          timestamp: now
        });
      }

      // Commit all updates
      await batch.commit();

      console.log(`Successfully marked ${overdueCount} loans as overdue.`);
      console.log(`Sent ${notificationsSent} notifications.`);

      return {
        success: true,
        overdueCount,
        notificationsSent,
        timestamp: now.toDate().toISOString()
      };

    } catch (error) {
      console.error('Error checking overdue loans:', error);
      throw error;
    }
  });

/**
 * Calculate days overdue
 * @param {admin.firestore.Timestamp} expectedReturnDate - Expected return date
 * @param {admin.firestore.Timestamp} now - Current timestamp
 * @returns {number} Number of days overdue
 */
function calculateDaysOverdue(expectedReturnDate, now) {
  const expectedDate = expectedReturnDate.toDate();
  const currentDate = now.toDate();
  const diffTime = currentDate - expectedDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Send reminder notifications before loans become overdue
 * Runs daily at 9:00 AM Bangkok time
 */
exports.sendLoanReminders = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    try {
      console.log('Starting loan reminders check...');
      
      const now = admin.firestore.Timestamp.now();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      const tomorrowTimestamp = admin.firestore.Timestamp.fromDate(tomorrow);

      const batch = db.batch();
      let remindersSent = 0;

      // Query for borrowed loans due tomorrow
      const dueSoonQuery = db.collection('loanRequests')
        .where('status', '==', 'borrowed')
        .where('expectedReturnDate', '<=', tomorrowTimestamp)
        .where('expectedReturnDate', '>=', now);

      const dueSoonSnapshot = await dueSoonQuery.get();

      if (dueSoonSnapshot.empty) {
        console.log('No loans due soon.');
        return null;
      }

      console.log(`Found ${dueSoonSnapshot.size} loans due soon.`);

      // Process each loan
      for (const loanDoc of dueSoonSnapshot.docs) {
        const loanData = loanDoc.data();
        const loanId = loanDoc.id;

        // Check if reminder already sent today
        const reminderCheckQuery = await db.collection('notifications')
          .where('userId', '==', loanData.userId)
          .where('type', '==', 'loan_reminder')
          .where('data.loanRequestId', '==', loanId)
          .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date().setHours(0, 0, 0, 0)))
          .get();

        if (!reminderCheckQuery.empty) {
          console.log(`Reminder already sent for loan ${loanId}`);
          continue;
        }

        // Create reminder notification
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, {
          userId: loanData.userId,
          type: 'loan_reminder',
          title: 'แจ้งเตือนคืนอุปกรณ์',
          message: `กรุณาคืนอุปกรณ์ภายในวันพรุ่งนี้`,
          data: {
            loanRequestId: loanId,
            equipmentId: loanData.equipmentId,
            expectedReturnDate: loanData.expectedReturnDate
          },
          isRead: false,
          priority: 'high',
          actionUrl: `/my-loans/${loanId}`,
          actionText: 'ดูรายละเอียด',
          createdAt: now
        });

        remindersSent++;
      }

      // Commit all notifications
      if (remindersSent > 0) {
        await batch.commit();
        console.log(`Sent ${remindersSent} loan reminders.`);
      }

      return {
        success: true,
        remindersSent,
        timestamp: now.toDate().toISOString()
      };

    } catch (error) {
      console.error('Error sending loan reminders:', error);
      throw error;
    }
  });

/**
 * Auto-cancel expired reservation requests
 * Runs every 2 hours
 */
exports.cancelExpiredReservations = functions.pubsub
  .schedule('every 2 hours')
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    try {
      console.log('Starting expired reservations check...');
      
      const now = admin.firestore.Timestamp.now();
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      const twoHoursAgoTimestamp = admin.firestore.Timestamp.fromDate(twoHoursAgo);

      const batch = db.batch();
      let cancelledCount = 0;

      // Query for approved reservations that are past pickup time
      const expiredReservationsQuery = db.collection('reservations')
        .where('status', '==', 'ready')
        .where('startTime', '<', twoHoursAgoTimestamp);

      const expiredSnapshot = await expiredReservationsQuery.get();

      if (expiredSnapshot.empty) {
        console.log('No expired reservations found.');
        return null;
      }

      console.log(`Found ${expiredSnapshot.size} expired reservations.`);

      // Process each expired reservation
      for (const reservationDoc of expiredSnapshot.docs) {
        const reservationData = reservationDoc.data();
        const reservationId = reservationDoc.id;

        // Update reservation status to expired
        batch.update(reservationDoc.ref, {
          status: 'expired',
          expiredAt: now,
          updatedAt: now
        });

        // Update equipment status back to available
        const equipmentRef = db.collection('equipment').doc(reservationData.equipmentId);
        batch.update(equipmentRef, {
          status: 'available',
          updatedAt: now
        });

        cancelledCount++;

        // Notify user
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, {
          userId: reservationData.userId,
          type: 'reservation_expired',
          title: 'การจองหมดอายุ',
          message: `การจองอุปกรณ์ของคุณหมดอายุแล้ว เนื่องจากไม่มารับภายในเวลาที่กำหนด`,
          data: {
            reservationId,
            equipmentId: reservationData.equipmentId,
            startTime: reservationData.startTime
          },
          isRead: false,
          priority: 'medium',
          createdAt: now
        });

        // Log activity
        const activityLogRef = db.collection('activityLogs').doc();
        batch.set(activityLogRef, {
          userId: 'system',
          action: 'reservation_expired',
          targetType: 'reservation',
          targetId: reservationId,
          details: {
            equipmentId: reservationData.equipmentId,
            userId: reservationData.userId,
            startTime: reservationData.startTime
          },
          timestamp: now
        });
      }

      // Commit all updates
      await batch.commit();

      console.log(`Successfully cancelled ${cancelledCount} expired reservations.`);

      return {
        success: true,
        cancelledCount,
        timestamp: now.toDate().toISOString()
      };

    } catch (error) {
      console.error('Error cancelling expired reservations:', error);
      throw error;
    }
  });
