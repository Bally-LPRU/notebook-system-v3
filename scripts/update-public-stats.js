/**
 * Script to update public statistics in Firestore
 * This can be run as a Cloud Function or scheduled task
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Firebase configuration (use environment variables in production)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

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

class PublicStatsUpdater {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
  }

  /**
   * Update public statistics
   */
  async updatePublicStats() {
    try {
      console.log('Starting public statistics update...');
      
      // Get equipment statistics
      const equipmentStats = await this.getEquipmentStatistics();
      console.log('Equipment stats:', equipmentStats);
      
      // Get reservation statistics
      const reservationStats = await this.getReservationStatistics();
      console.log('Reservation stats:', reservationStats);
      
      // Prepare public stats data
      const publicStatsData = {
        totalEquipment: equipmentStats.total,
        availableEquipment: equipmentStats.available,
        borrowedEquipment: equipmentStats.borrowed,
        pendingReservations: reservationStats.pending,
        lastUpdated: serverTimestamp(),
        updatedBy: 'system'
      };
      
      // Save to publicStats collection
      const publicStatsRef = doc(this.db, 'publicStats', 'equipment');
      await setDoc(publicStatsRef, publicStatsData);
      
      console.log('Public statistics updated successfully:', publicStatsData);
      return publicStatsData;
    } catch (error) {
      console.error('Error updating public statistics:', error);
      throw error;
    }
  }

  /**
   * Get equipment statistics
   */
  async getEquipmentStatistics() {
    try {
      const equipmentRef = collection(this.db, 'equipment');
      const querySnapshot = await getDocs(equipmentRef);
      
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
  async getReservationStatistics() {
    try {
      const reservationRef = collection(this.db, 'reservations');
      
      // Get pending reservations
      const pendingQuery = query(
        reservationRef, 
        where('status', '==', RESERVATION_STATUS.PENDING)
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      
      return {
        pending: pendingSnapshot.size,
        total: pendingSnapshot.size // For now, only count pending
      };
    } catch (error) {
      console.error('Error getting reservation statistics:', error);
      throw error;
    }
  }
}

// Main execution function
async function main() {
  try {
    const updater = new PublicStatsUpdater();
    await updater.updatePublicStats();
    console.log('Public statistics update completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to update public statistics:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default PublicStatsUpdater;