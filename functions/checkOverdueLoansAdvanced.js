/**
 * Cloud Function: Advanced Overdue Loan Checker
 * 
 * This function runs hourly to detect new overdue loans and create/escalate alerts
 * using the Proactive Alert Engine.
 * 
 * Schedule: Every 1 hour
 * Trigger: Cloud Scheduler (Pub/Sub)
 * 
 * Requirements: 1.1, 1.2
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Alert types and priorities (matching frontend types)
const ALERT_TYPE = {
  OVERDUE_LOAN: 'overdue_loan'
};

const ALERT_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const LOAN_REQUEST_STATUS = {
  BORROWED: 'borrowed',
  OVERDUE: 'overdue',
  RETURNED: 'returned'
};

/**
 * Calculate alert priority based on days overdue
 * - 0 days overdue → medium priority
 * - 1-2 days overdue → high priority
 * - 3+ days overdue → critical priority
 * 
 * @param {number} daysOverdue - Number of days overdue
 * @returns {string} Alert priority
 */
function calculateOverduePriority(daysOverdue) {
  if (daysOverdue >= 3) {
    return ALERT_PRIORITY.CRITICAL;
  }
  if (daysOverdue >= 1) {
    return ALERT_PRIORITY.HIGH;
  }
  if (daysOverdue >= 0) {
    return ALERT_PRIORITY.MEDIUM;
  }
  return ALERT_PRIORITY.LOW;
}

/**
 * Calculate days overdue for a loan
 * @param {admin.firestore.Timestamp} expectedReturnDate - Expected return date
 * @param {Date} currentDate - Current date
 * @returns {number} Days overdue (negative if not yet due)
 */
function calculateDaysOverdue(expectedReturnDate, currentDate) {
  if (!expectedReturnDate) return 0;

  const returnDate = expectedReturnDate.toDate();
  returnDate.setHours(0, 0, 0, 0);
  
  const current = new Date(currentDate);
  current.setHours(0, 0, 0, 0);

  const diffMs = current.getTime() - returnDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get priority order for comparison (lower number = higher priority)
 * @param {string} priority - Priority level
 * @returns {number} Priority order
 */
function getPriorityOrder(priority) {
  const order = {
    [ALERT_PRIORITY.CRITICAL]: 0,
    [ALERT_PRIORITY.HIGH]: 1,
    [ALERT_PRIORITY.MEDIUM]: 2,
    [ALERT_PRIORITY.LOW]: 3
  };
  return order[priority] !== undefined ? order[priority] : 4;
}

/**
 * Check if alert already exists for a loan
 * @param {string} loanId - Loan request ID
 * @returns {Promise<Object|null>} Existing alert or null
 */
async function getExistingAlert(loanId) {
  try {
    const alertsRef = db.collection('adminAlerts');
    const q = alertsRef
      .where('sourceId', '==', loanId)
      .where('type', '==', ALERT_TYPE.OVERDUE_LOAN)
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
 * Create a new overdue loan alert
 * @param {Object} loan - Loan request object
 * @param {number} daysOverdue - Number of days overdue
 * @returns {Promise<Object>} Created alert
 */
async function createOverdueLoanAlert(loan, daysOverdue) {
  try {
    const priority = calculateOverduePriority(daysOverdue);
    
    const title = daysOverdue >= 3 
      ? `การยืมเกินกำหนด ${daysOverdue} วัน (วิกฤต)`
      : `การยืมเกินกำหนด ${daysOverdue} วัน`;

    const description = `${loan.equipmentSnapshot?.name || loan.equipmentName || 'อุปกรณ์'} ` +
      `ยืมโดย ${loan.userSnapshot?.displayName || loan.userName || 'ผู้ใช้'} ` +
      `เกินกำหนดคืน ${daysOverdue} วัน`;

    const quickActions = [
      {
        id: 'send_reminder',
        label: 'ส่งการแจ้งเตือน',
        action: 'send_reminder',
        params: { loanId: loan.id, userId: loan.userId }
      },
      {
        id: 'mark_contacted',
        label: 'ทำเครื่องหมายว่าติดต่อแล้ว',
        action: 'mark_contacted',
        params: { loanId: loan.id }
      },
      {
        id: 'dismiss',
        label: 'ปิดการแจ้งเตือน',
        action: 'dismiss',
        params: { loanId: loan.id }
      }
    ];

    const alert = {
      type: ALERT_TYPE.OVERDUE_LOAN,
      priority,
      title,
      description,
      sourceId: loan.id,
      sourceType: 'loan',
      sourceData: {
        loanId: loan.id,
        equipmentId: loan.equipmentId,
        equipmentName: loan.equipmentSnapshot?.name || loan.equipmentName,
        userId: loan.userId,
        userName: loan.userSnapshot?.displayName || loan.userName,
        userEmail: loan.userSnapshot?.email || loan.userEmail,
        expectedReturnDate: loan.expectedReturnDate,
        daysOverdue
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

    console.log(`Created new overdue alert for loan ${loan.id} (${daysOverdue} days overdue)`);

    return {
      id: docRef.id,
      ...alert
    };
  } catch (error) {
    console.error('Error creating overdue loan alert:', error);
    throw error;
  }
}

/**
 * Escalate existing alert priority
 * @param {string} alertId - Alert ID
 * @param {string} newPriority - New priority level
 * @param {string} currentPriority - Current priority level
 * @returns {Promise<boolean>} True if escalated
 */
async function escalateAlertPriority(alertId, newPriority, currentPriority) {
  try {
    const currentPriorityOrder = getPriorityOrder(currentPriority);
    const newPriorityOrder = getPriorityOrder(newPriority);

    // Only escalate (don't downgrade)
    if (newPriorityOrder < currentPriorityOrder) {
      await db.collection('adminAlerts').doc(alertId).update({
        priority: newPriority,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Escalated alert ${alertId} from ${currentPriority} to ${newPriority}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error escalating alert priority:', error);
    return false;
  }
}

/**
 * Main function: Check for overdue loans and create/escalate alerts
 * Requirements: 1.1, 1.2
 */
exports.checkOverdueLoansAdvanced = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    try {
      console.log('Starting advanced overdue loans check...');
      
      const currentDate = new Date();
      const results = {
        scanned: 0,
        newAlerts: 0,
        escalatedAlerts: 0,
        errors: []
      };

      // Query for borrowed and overdue loans
      const loansRef = db.collection('loanRequests');
      const q = loansRef.where('status', 'in', [
        LOAN_REQUEST_STATUS.BORROWED,
        LOAN_REQUEST_STATUS.OVERDUE
      ]);

      const querySnapshot = await q.get();
      
      console.log(`Found ${querySnapshot.size} borrowed/overdue loans to check`);

      for (const docSnap of querySnapshot.docs) {
        results.scanned++;
        const loan = {
          id: docSnap.id,
          ...docSnap.data()
        };

        try {
          const daysOverdue = calculateDaysOverdue(loan.expectedReturnDate, currentDate);

          // Only process if overdue (daysOverdue >= 0)
          if (daysOverdue >= 0) {
            // Check if alert already exists
            const existingAlert = await getExistingAlert(loan.id);
            
            if (existingAlert) {
              // Check if priority needs escalation
              const newPriority = calculateOverduePriority(daysOverdue);
              const escalated = await escalateAlertPriority(
                existingAlert.id,
                newPriority,
                existingAlert.priority
              );

              if (escalated) {
                results.escalatedAlerts++;
              }
            } else {
              // Create new alert
              await createOverdueLoanAlert(loan, daysOverdue);
              results.newAlerts++;
            }

            // Update loan status to overdue if not already
            if (loan.status !== LOAN_REQUEST_STATUS.OVERDUE) {
              await db.collection('loanRequests').doc(loan.id).update({
                status: LOAN_REQUEST_STATUS.OVERDUE,
                overdueMarkedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
        } catch (loanError) {
          console.error(`Error processing loan ${loan.id}:`, loanError);
          results.errors.push({
            loanId: loan.id,
            error: loanError.message
          });
        }
      }

      console.log('Advanced overdue loans check completed:');
      console.log(`- Scanned: ${results.scanned} loans`);
      console.log(`- New alerts: ${results.newAlerts}`);
      console.log(`- Escalated alerts: ${results.escalatedAlerts}`);
      console.log(`- Errors: ${results.errors.length}`);

      return {
        success: true,
        ...results,
        timestamp: currentDate.toISOString()
      };

    } catch (error) {
      console.error('Error in advanced overdue loans check:', error);
      throw error;
    }
  });
