/**
 * Fix Equipment Access Issues
 * แก้ไขปัญหาการเข้าถึงหน้าจัดการอุปกรณ์โดยการ refresh auth token
 */

import { auth, db } from '../src/config/firebase.js';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

async function fixEquipmentAccess() {
  try {
    console.log('🔧 Starting equipment access fix...\n');

    // Get current user
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('❌ No user is currently signed in');
      console.log('Please sign in first using the app');
      return;
    }

    console.log('✅ Current user:', currentUser.email);
    console.log('');

    // Force refresh the ID token
    console.log('🔄 Refreshing auth token...');
    try {
      await currentUser.getIdToken(true); // Force refresh
      console.log('✅ Auth token refreshed successfully');
      console.log('');
    } catch (error) {
      console.log('❌ Failed to refresh auth token:', error.message);
      console.log('');
    }

    // Check and update user document
    console.log('🔍 Checking user document...');
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.log('❌ User document does not exist');
      console.log('Creating user document...');
      
      const userData = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        role: 'admin',
        status: 'approved',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userDocRef, userData);
      console.log('✅ User document created');
      console.log('');
    } else {
      const userData = userDoc.data();
      console.log('✅ User document exists');
      console.log('Current data:', {
        role: userData.role,
        status: userData.status
      });
      console.log('');

      // Update timestamp to trigger any listeners
      console.log('🔄 Updating user document timestamp...');
      await updateDoc(userDocRef, {
        updatedAt: serverTimestamp()
      });
      console.log('✅ User document updated');
      console.log('');
    }

    console.log('✅ Fix completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Refresh the page (F5)');
    console.log('2. Try accessing the equipment management page again');
    console.log('3. If the issue persists, sign out and sign in again');

  } catch (error) {
    console.error('❌ Fix script error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

// Run the fix
fixEquipmentAccess().catch(console.error);
