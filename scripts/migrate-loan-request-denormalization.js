/**
 * Migration Script: Add Denormalized Data to Existing Loan Requests
 * 
 * This script adds equipmentSnapshot and userSnapshot fields to existing loan requests
 * to improve data consistency and reduce N+1 query problems.
 * 
 * Usage:
 *   node scripts/migrate-loan-request-denormalization.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.log('\n📝 Make sure serviceAccountKey.json exists in the project root');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Migrate loan requests to add denormalized data
 */
async function migrateLoanRequests() {
  console.log('\n🔄 Starting loan request denormalization migration...\n');

  try {
    // Get all loan requests
    const loanRequestsSnapshot = await db.collection('loanRequests').get();
    
    if (loanRequestsSnapshot.empty) {
      console.log('ℹ️  No loan requests found to migrate');
      return;
    }

    console.log(`📊 Found ${loanRequestsSnapshot.size} loan requests to process\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    let batch = db.batch();
    let operationCount = 0;

    for (const doc of loanRequestsSnapshot.docs) {
      const loanRequest = doc.data();
      const loanRequestId = doc.id;

      try {
        // Skip if already has snapshots
        if (loanRequest.equipmentSnapshot && loanRequest.userSnapshot) {
          skipCount++;
          console.log(`⏭️  Skipping ${loanRequestId} - already has snapshots`);
          continue;
        }

        // Fetch equipment data
        let equipmentSnapshot = null;
        if (loanRequest.equipmentId) {
          try {
            const equipmentDoc = await db.collection('equipmentManagement').doc(loanRequest.equipmentId).get();
            if (equipmentDoc.exists) {
              const equipment = equipmentDoc.data();
              equipmentSnapshot = {
                name: equipment.name || 'ไม่ทราบชื่อ',
                category: equipment.category || null,
                serialNumber: equipment.serialNumber || null,
                imageUrl: equipment.imageUrl || equipment.images?.[0] || null
              };
            } else {
              console.log(`⚠️  Equipment ${loanRequest.equipmentId} not found for loan request ${loanRequestId}`);
              equipmentSnapshot = {
                name: 'อุปกรณ์ถูกลบแล้ว',
                category: null,
                serialNumber: null,
                imageUrl: null
              };
            }
          } catch (error) {
            console.error(`❌ Error fetching equipment for ${loanRequestId}:`, error.message);
            equipmentSnapshot = {
              name: 'เกิดข้อผิดพลาด',
              category: null,
              serialNumber: null,
              imageUrl: null
            };
          }
        }

        // Fetch user data
        let userSnapshot = null;
        if (loanRequest.userId) {
          try {
            const userDoc = await db.collection('users').doc(loanRequest.userId).get();
            if (userDoc.exists) {
              const user = userDoc.data();
              userSnapshot = {
                displayName: user.displayName || 'ไม่ทราบชื่อ',
                email: user.email || '',
                department: user.department || null,
                studentId: user.studentId || null
              };
            } else {
              console.log(`⚠️  User ${loanRequest.userId} not found for loan request ${loanRequestId}`);
              userSnapshot = {
                displayName: 'ผู้ใช้ถูกลบแล้ว',
                email: '',
                department: null,
                studentId: null
              };
            }
          } catch (error) {
            console.error(`❌ Error fetching user for ${loanRequestId}:`, error.message);
            userSnapshot = {
              displayName: 'เกิดข้อผิดพลาด',
              email: '',
              department: null,
              studentId: null
            };
          }
        }

        // Add to batch
        const updateData = {};
        if (equipmentSnapshot && !loanRequest.equipmentSnapshot) {
          updateData.equipmentSnapshot = equipmentSnapshot;
        }
        if (userSnapshot && !loanRequest.userSnapshot) {
          updateData.userSnapshot = userSnapshot;
        }

        if (Object.keys(updateData).length > 0) {
          batch.update(doc.ref, {
            ...updateData,
            migratedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          operationCount++;
          successCount++;
          console.log(`✅ Queued ${loanRequestId} for update`);
        }

        // Commit batch if it reaches the limit
        if (operationCount >= batchSize) {
          await batch.commit();
          console.log(`\n💾 Committed batch of ${operationCount} operations\n`);
          batch = db.batch();
          operationCount = 0;
        }

      } catch (error) {
        errorCount++;
        const errorMsg = `Error processing loan request ${loanRequestId}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Commit remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`\n💾 Committed final batch of ${operationCount} operations\n`);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⏭️  Skipped (already migrated): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total processed: ${loanRequestsSnapshot.size}`);
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log('\n✅ Migration completed!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await migrateLoanRequests();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
