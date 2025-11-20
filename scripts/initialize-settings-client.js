/**
 * Initialize Settings Script (Client-side)
 * Creates the initial systemSettings document with default values
 * Run this script once to set up the settings infrastructure
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = require('firebase/firestore');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production.local') });

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

console.log('Using Firebase Project:', firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Default settings values
 */
const DEFAULT_SETTINGS = {
  maxLoanDuration: 14,              // 14 days
  maxAdvanceBookingDays: 30,        // 30 days
  defaultCategoryLimit: 3,          // 3 items per category
  discordWebhookUrl: null,          // No webhook by default
  discordEnabled: false,            // Disabled by default
  lastUpdated: serverTimestamp(),
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
    const settingsRef = doc(db, 'settings', 'systemSettings');
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      console.log('⚠️  Settings document already exists');
      console.log('Current settings:', settingsDoc.data());
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('\nDo you want to overwrite with default values? (yes/no): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Initialization cancelled');
        process.exit(0);
      }
    }
    
    // Create/update settings document
    await setDoc(settingsRef, DEFAULT_SETTINGS, { merge: true });
    console.log('✓ Settings document created/updated');
    console.log('\nDefault settings:');
    console.log('  - Max Loan Duration: 14 days');
    console.log('  - Max Advance Booking: 30 days');
    console.log('  - Default Category Limit: 3 items');
    console.log('  - Discord Webhook: Not configured');
    
    // Create sample collections info
    console.log('\n📋 Firestore Collections:');
    console.log('  ✓ settings');
    console.log('  ✓ closedDates');
    console.log('  ✓ categoryLimits');
    console.log('  ✓ settingsAuditLog');
    console.log('  ✓ systemNotifications');
    console.log('  ✓ savedSearches');
    
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
