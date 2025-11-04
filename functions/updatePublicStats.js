/**
 * Cloud Function to update public statistics
 * This function can be triggered by HTTP request or scheduled
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Equipment status constants
const EQUIPMENT_STATUS = {
  AVAILABLE: 'available',
  BORROWED: 'borrowed',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired'
};

// Reservation status constants
const RESERVATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Get equipment statistics
 */
async function getEquipmentStatistics() {
  try {
    const equipmentRef = db.collection('equipment');
    const querySnapshot = await equipmentRef.get();
    
    const stats = {
      total: 0,
      available: 0,
      borrowed: 0,
      maintenance: 0,
      retired: 0
    };
    
    querySnapshot.forEach((doc) => {
      const equipment = doc.data();
      stats.total++;
      
      switch (equipment.status) {
        case EQUIPMENT_STATUS.AVAILABLE:
          stats.available++;
          break;
        case EQUIPMENT_STATUS.BORROWED:
          stats.borrowed++;
          break;
        case EQUIPMENT_STATUS.MAINTENANCE:
          stats.maintenance++;
          break;
        case EQUIPMENT_STATUS.RETIRED:
          stats.retired++;
          break;
        default:
          // Handle any unknown status as available
          stats.available++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting equipment statistics:', error);
    throw error;
  }
}

/**
 * Get reservation statistics
 */
async function getReservationStatistics() {
  try {
    const reservationRef = db.collection('reservations');
    
    // Get pending reservations
    const pendingQuery = reservationRef.where('status', '==', RESERVATION_STATUS.PENDING);
    const pendingSnapshot = await pendingQuery.get();
    
    return {
      pending: pendingSnapshot.size,
      total: pendingSnapshot.size // For now, only count pending
    };
  } catch (error) {
    console.error('Error getting reservation statistics:', error);
    throw error;
  }
}

/**
 * Update public statistics
 */
async function updatePublicStats() {
  try {
    console.log('Starting public statistics update...');
    
    // Get equipment statistics
    const equipmentStats = await getEquipmentStatistics();
    console.log('Equipment stats:', equipmentStats);
    
    // Get reservation statistics
    const reservationStats = await getReservationStatistics();
    console.log('Reservation stats:', reservationStats);
    
    // Prepare public stats data
    const publicStatsData = {
      totalEquipment: equipmentStats.total,
      availableEquipment: equipmentStats.available,
      borrowedEquipment: equipmentStats.borrowed,
      pendingReservations: reservationStats.pending,
      lastUpdated: new Date(),
      updatedBy: 'cloud-function'
    };
    
    // Save to publicStats collection
    const publicStatsRef = db.collection('publicStats').doc('equipment');
    await publicStatsRef.set(publicStatsData);
    
    console.log('Public statistics updated successfully:', publicStatsData);
    return publicStatsData;
  } catch (error) {
    console.error('Error updating public statistics:', error);
    throw error;
  }
}

// Scheduled function - runs every 5 minutes
exports.scheduledUpdatePublicStats = onSchedule('every 5 minutes', async (event) => {
  try {
    await updatePublicStats();
    console.log('Scheduled public statistics update completed');
  } catch (error) {
    console.error('Scheduled public statistics update failed:', error);
    throw error;
  }
});

// HTTP function - can be triggered manually
exports.updatePublicStatsHttp = onRequest(async (req, res) => {
  try {
    // Check for authorization (optional)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For now, allow without auth for testing
      // In production, you might want to add proper authentication
      console.warn('No authorization header provided');
    }

    const result = await updatePublicStats();
    
    res.status(200).json({
      success: true,
      message: 'Public statistics updated successfully',
      data: result
    });
  } catch (error) {
    console.error('HTTP public statistics update failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update public statistics',
      error: error.message
    });
  }
});

// Export the update function for use in other functions
exports.updatePublicStats = updatePublicStats;