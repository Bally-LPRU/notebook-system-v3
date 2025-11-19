/**
 * Migration Script: Add searchKeywords to Existing Loan Requests
 * 
 * This script adds searchKeywords field to all existing loan requests
 * to enable server-side search with pagination.
 * 
 * Usage:
 *   node scripts/migrate-loan-request-search-keywords.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  path.join(__dirname, '../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.log('Please set FIREBASE_SERVICE_ACCOUNT_PATH environment variable');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Generate search keywords from text
 */
function generateKeywordsFromText(text) {
  if (!text) return [];
  
  const keywords = new Set();
  const words = text.toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2);
  
  words.forEach(word => keywords.add(word));
  return Array.from(keywords);
}

/**
 * Generate search keywords for a loan request
 */
function generateSearchKeywords(loanRequest, equipment, user) {
  const keywords = new Set();

  // Add keywords from purpose
  if (loanRequest.purpose) {
    generateKeywordsFromText(loanRequest.purpose).forEach(k => keywords.add(k));
  }

  // Add keywords from notes
  if (loanRequest.notes) {
    generateKeywordsFromText(loanRequest.notes).forEach(k => keywords.add(k));
  }

  // Add keywords from equipment
  if (equipment) {
    if (equipment.name) {
      generateKeywordsFromText(equipment.name).forEach(k => keywords.add(k));
    }
    if (equipment.brand) {
      generateKeywordsFromText(equipment.brand).forEach(k => keywords.add(k));
    }
    if (equipment.model) {
      generateKeywordsFromText(equipment.model).forEach(k => keywords.add(k));
    }
    if (equipment.category) {
      generateKeywordsFromText(equipment.category).forEach(k => keywords.add(k));
    }
  }

  // Add keywords from user
  if (user) {
    if (user.firstName) {
      generateKeywordsFromText(user.firstName).forEach(k => keywords.add(k));
    }
    if (user.lastName) {
      generateKeywordsFromText(user.lastName).forEach(k => keywords.add(k));
    }
    if (user.displayName) {
      generateKeywordsFromText(user.displayName).forEach(k => keywords.add(k));
    }
    if (user.email) {
      generateKeywordsFromText(user.email).forEach(k => keywords.add(k));
    }
  }

  return Array.from(keywords);
}

/**
 * Get equipment data
 */
async function getEquipment(equipmentId) {
  try {
    // Try equipmentManagement collection first
    let equipmentDoc = await db.collection('equipmentManagement').doc(equipmentId).get();
    
    if (!equipmentDoc.exists) {
      // Try equipment collection
      equipmentDoc = await db.collection('equipment').doc(equipmentId).get();
    }

    if (equipmentDoc.exists) {
      return equipmentDoc.data();
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting equipment ${equipmentId}:`, error.message);
    return null;
  }
}

/**
 * Get user data
 */
async function getUser(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error(`Error getting user ${userId}:`, error.message);
    return null;
  }
}

/**
 * Migrate loan requests
 */
async function migrateLoanRequests() {
  console.log('🚀 Starting migration...\n');

  try {
    // Get all loan requests
    const loanRequestsRef = db.collection('loanRequests');
    const snapshot = await loanRequestsRef.get();

    console.log(`📊 Found ${snapshot.size} loan requests to migrate\n`);

    if (snapshot.empty) {
      console.log('✅ No loan requests to migrate');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Process in batches of 500
    const batchSize = 500;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      try {
        const loanRequest = doc.data();

        // Skip if already has searchKeywords
        if (loanRequest.searchKeywords && Array.isArray(loanRequest.searchKeywords)) {
          skippedCount++;
          continue;
        }

        // Fetch equipment and user data
        const equipment = await getEquipment(loanRequest.equipmentId);
        const user = await getUser(loanRequest.userId);

        // Generate keywords
        const searchKeywords = generateSearchKeywords(loanRequest, equipment, user);

        // Update document
        batch.update(doc.ref, { 
          searchKeywords,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        batchCount++;
        successCount++;

        // Commit batch every 500 documents
        if (batchCount >= batchSize) {
          await batch.commit();
          console.log(`✅ Migrated ${successCount} documents (batch committed)`);
          batch = db.batch();
          batchCount = 0;
        }

      } catch (error) {
        errorCount++;
        errors.push({
          docId: doc.id,
          error: error.message
        });
        console.error(`❌ Error migrating ${doc.id}:`, error.message);
      }
    }

    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Migrated remaining ${batchCount} documents (final batch)`);
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary');
    console.log('='.repeat(50));
    console.log(`Total documents: ${snapshot.size}`);
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⏭️  Skipped (already migrated): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(({ docId, error }) => {
        console.log(`  - ${docId}: ${error}`);
      });
    }

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Verify migration
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n');

  try {
    const loanRequestsRef = db.collection('loanRequests');
    const snapshot = await loanRequestsRef.get();

    let withKeywords = 0;
    let withoutKeywords = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.searchKeywords && Array.isArray(data.searchKeywords)) {
        withKeywords++;
      } else {
        withoutKeywords++;
      }
    });

    console.log('📊 Verification Results:');
    console.log(`  ✅ With searchKeywords: ${withKeywords}`);
    console.log(`  ❌ Without searchKeywords: ${withoutKeywords}`);
    console.log(`  📈 Coverage: ${((withKeywords / snapshot.size) * 100).toFixed(2)}%`);

    if (withoutKeywords === 0) {
      console.log('\n✅ All loan requests have searchKeywords!');
    } else {
      console.log(`\n⚠️  ${withoutKeywords} loan requests still need migration`);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Run migration
    await migrateLoanRequests();

    // Verify migration
    await verifyMigration();

    console.log('\n✅ All done!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Run main function
main();
