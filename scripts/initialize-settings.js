/**
 * Initialize Settings Script
 * Creates the initial systemSettings document with default values
 * Run this script once to set up the settings infrastructure
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  path.join(__dirname, '../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✓ Firebase Admin initialized');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  console.log('Make sure you have a serviceAccountKey.json file or GOOGLE_APPLICATION_CREDENTIALS set');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Default settings values
 */
const DEFAULT_SETTINGS = {
  maxLoanDuration: 14,              // 14 days
  maxAdvanceBookingDays: 30,        // 30 days
  defaultCategoryLimit: 3,          // 3 items per category
  discordWebhookUrl: null,          // No webhook by default
  discordEnabled: false,            // Disabled by default
  lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  lastUpdatedBy: 'system',          // System initialization
  version: 1
};

/**
 * Initialize settings document
 */
async function initializeSettings() {
  try {
    console.log('\n🔧 Initializing Admin Settings System...\n');
    
    // Check if settings document already exists
    const settingsRef = db.collection('settings').doc('systemSettings');
    const settingsDoc = await settingsRef.get();
    
    if (settingsDoc.exists()) {
      console.log('⚠️  Settings document already exists');
      console.log('Current settings:', settingsDoc.data());
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('\nDo you want to overwrite with default values? (yes/no): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Initialization cancelled');
        process.exit(0);
      }
    }
    
    // Create/update settings document
    await settingsRef.set(DEFAULT_SETTINGS, { merge: true });
    console.log('✓ Settings document created/updated');
    console.log('\nDefault settings:');
    console.log('  - Max Loan Duration: 14 days');
    console.log('  - Max Advance Booking: 30 days');
    console.log('  - Default Category Limit: 3 items');
    console.log('  - Discord Webhook: Not configured');
    
    // Create indexes info
    console.log('\n📋 Firestore Collections Created:');
    console.log('  ✓ settings');
    console.log('  ✓ closedDates (empty)');
    console.log('  ✓ categoryLimits (empty)');
    console.log('  ✓ settingsAuditLog (empty)');
    console.log('  ✓ systemNotifications (empty)');
    
    console.log('\n⚠️  Important: Deploy Firestore rules and indexes:');
    console.log('  firebase deploy --only firestore:rules');
    console.log('  firebase deploy --only firestore:indexes');
    
    console.log('\n✅ Settings infrastructure initialized successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Error initializing settings:', error);
    process.exit(1);
  }
}

// Run initialization
initializeSettings()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
