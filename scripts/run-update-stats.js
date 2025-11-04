/**
 * Simple script to run the public stats update immediately
 * This can be used for testing or manual updates
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc 
} from 'firebase/firestore';

// Get Firebase config from environment or use defaults for development
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updatePublicStats() {
  try {
    console.log('🚀 Starting public statistics update...');
    
    // Create sample data for testing (since we might not have real data yet)
    const sampleStats = {
      totalEquipment: 25,
      availableEquipment: 18,
      borrowedEquipment: 5,
      pendingReservations: 3,
      lastUpdated: new Date(),
      updatedBy: 'manual-script',
      note: 'Sample data for testing - replace with real data when equipment is added'
    };
    
    // Save to publicStats collection
    const publicStatsRef = doc(db, 'publicStats', 'equipment');
    await setDoc(publicStatsRef, sampleStats);
    
    console.log('✅ Public statistics updated successfully!');
    console.log('📊 Stats:', {
      totalEquipment: sampleStats.totalEquipment,
      availableEquipment: sampleStats.availableEquipment,
      borrowedEquipment: sampleStats.borrowedEquipment,
      pendingReservations: sampleStats.pendingReservations
    });
    
    return sampleStats;
  } catch (error) {
    console.error('❌ Error updating public statistics:', error);
    throw error;
  }
}

// Run the update
updatePublicStats()
  .then(() => {
    console.log('🎉 Update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error);
    process.exit(1);
  });