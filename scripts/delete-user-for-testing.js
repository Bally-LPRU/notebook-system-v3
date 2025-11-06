#!/usr/bin/env node

/**
 * Script to delete user data for testing purposes
 * This script deletes both Firebase Auth user and Firestore user document
 * 
 * Usage: node scripts/delete-user-for-testing.js <email>
 * Example: node scripts/delete-user-for-testing.js test@gmail.com
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../firebase-admin-key.json');

// Check if service account file exists
const fs = require('fs');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase service account key not found!');
  console.log('📝 To use this script, you need to:');
  console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save the file as "firebase-admin-key.json" in the project root');
  console.log('4. Run this script again');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: 'equipment-lending-system-41b49'
  });
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

async function deleteUserByEmail(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Get user by email from Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`✅ Found user in Firebase Auth: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('⚠️ User not found in Firebase Auth');
      } else {
        throw error;
      }
    }
    
    // Delete from Firestore first
    if (userRecord) {
      try {
        await db.collection('users').doc(userRecord.uid).delete();
        console.log('✅ Deleted user document from Firestore');
      } catch (error) {
        console.log('⚠️ User document not found in Firestore or already deleted');
      }
      
      // Delete from Firebase Auth
      await auth.deleteUser(userRecord.uid);
      console.log('✅ Deleted user from Firebase Auth');
      
      console.log('🎉 User successfully deleted!');
      console.log('📝 The user can now register again as a new user');
    } else {
      console.log('❌ No user found to delete');
    }
    
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
    process.exit(1);
  }
}

async function listAllUsers() {
  try {
    console.log('📋 Listing all users in the system:');
    console.log('=====================================');
    
    const listUsersResult = await auth.listUsers();
    
    if (listUsersResult.users.length === 0) {
      console.log('No users found in Firebase Auth');
      return;
    }
    
    for (const userRecord of listUsersResult.users) {
      console.log(`Email: ${userRecord.email || 'No email'}`);
      console.log(`UID: ${userRecord.uid}`);
      console.log(`Created: ${userRecord.metadata.creationTime}`);
      console.log('---');
    }
    
    console.log(`Total users: ${listUsersResult.users.length}`);
    
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔧 User Management Script');
    console.log('========================');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/delete-user-for-testing.js <email>  - Delete specific user');
    console.log('  node scripts/delete-user-for-testing.js --list   - List all users');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/delete-user-for-testing.js test@gmail.com');
    console.log('  node scripts/delete-user-for-testing.js admin@g.lpru.ac.th');
    console.log('  node scripts/delete-user-for-testing.js --list');
    process.exit(0);
  }
  
  if (args[0] === '--list') {
    await listAllUsers();
  } else {
    const email = args[0];
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }
    
    // Confirm deletion
    console.log(`⚠️ WARNING: This will permanently delete the user: ${email}`);
    console.log('This action cannot be undone!');
    console.log('');
    console.log('Press Ctrl+C to cancel, or press Enter to continue...');
    
    // Wait for user confirmation
    await new Promise((resolve) => {
      process.stdin.once('data', resolve);
    });
    
    await deleteUserByEmail(email);
  }
  
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

main();