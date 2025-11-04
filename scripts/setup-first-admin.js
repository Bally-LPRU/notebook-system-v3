/**
 * Script to set up the first user as admin
 * Run this script after the first user has logged in
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-admin-key.json'); // You'll need to download this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://equipment-lending-system-41b49-default-rtdb.firebaseio.com/`
});

const db = admin.firestore();

async function setupFirstAdmin() {
  try {
    console.log('🔍 Looking for users in Firestore...');
    
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in Firestore');
      return;
    }

    console.log(`📊 Found ${usersSnapshot.size} user(s)`);
    
    // Get the first user (by creation time)
    let firstUser = null;
    let earliestTime = null;
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const createdAt = userData.createdAt;
      
      console.log(`👤 User: ${userData.email} (${userData.displayName})`);
      console.log(`   Created: ${createdAt?.toDate?.() || createdAt}`);
      console.log(`   Current role: ${userData.role || 'none'}`);
      
      if (!earliestTime || (createdAt && createdAt.toDate() < earliestTime)) {
        earliestTime = createdAt?.toDate?.() || new Date(createdAt);
        firstUser = { id: doc.id, ...userData };
      }
    });

    if (!firstUser) {
      console.log('❌ Could not determine first user');
      return;
    }

    console.log(`\n🎯 First user identified: ${firstUser.email}`);
    
    // Check if already admin
    if (firstUser.role === 'admin') {
      console.log('✅ User is already an admin');
      return;
    }

    // Update user to admin
    console.log('🔧 Setting user as admin...');
    
    await db.collection('users').doc(firstUser.id).update({
      role: 'admin',
      status: 'approved',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      adminSetupDate: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Successfully set first user as admin!');
    console.log(`👑 ${firstUser.email} is now an administrator`);
    
  } catch (error) {
    console.error('❌ Error setting up first admin:', error);
  } finally {
    // Close the connection
    admin.app().delete();
  }
}

// Run the script
setupFirstAdmin();