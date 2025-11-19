/**
 * Migration Script: Add Denormalized Fields to Loan Requests
 * 
 * This script adds denormalized fields (equipmentCategory, equipmentName, userName, userDepartment)
 * to existing loan requests for efficient server-side filtering and sorting.
 * 
 * Run: node scripts/migrate-loan-denormalized-fields.js
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
 * Migrate loan requests to add denormalized fields
 */
async function migrateLoanRequests() {
  console.log('\n🔄 Starting migration: Add denormalized fields to loan requests...\n');

  try {
    // Get all loan requests
    const loanRequestsSnapshot = await db.collection('loanRequests').get();
    
    if (loanRequestsSnapshot.empty) {
      console.log('ℹ️  No loan requests found. Nothing to migrate.');
      return;
    }

    console.log(`📊 Found ${loanRequestsSnapshot.size} loan requests to process\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each loan request
    for (const doc of loanRequestsSnapshot.docs) {
      const loanRequest = doc.data();
      const loanRequestId = doc.id;

      try {
        // Check if already has denormalized fields
        if (loanRequest.equipmentCategory !== undefined && 
            loanRequest.equipmentName !== undefined &&
            loanRequest.userName !== undefined) {
          console.log(`⏭️  Skipping ${loanRequestId} - already has denormalized fields`);
          skipCount++;
          continue;
        }

        // Prepare update data
        const updateData = {};

        // Get equipment data
        if (loanRequest.equipmentId) {
          try {
            const equipmentDoc = await db.collection('equipmentManagement').doc(loanRequest.equipmentId).get();
            
            if (equipmentDoc.exists) {
              const equipment = equipmentDoc.data();
              updateData.equipmentCategory = equipment.category || null;
              updateData.equipmentName = equipment.name || 'ไม่ทราบชื่อ';
              
              // Update equipmentSnapshot if needed
              if (!loanRequest.equipmentSnapshot) {
                updateData.equipmentSnapshot = {
                  name: equipment.name || 'ไม่ทราบชื่อ',
                  category: equipment.category || null,
                  serialNumber: equipment.serialNumber || null,
                  imageUrl: equipment.imageUrl || equipment.images?.[0] || null
                };
              }
            } else {
              // Use snapshot data if available
              updateData.equipmentCategory = loanRequest.equipmentSnapshot?.category || null;
              updateData.equipmentName = loanRequest.equipmentSnapshot?.name || 'ไม่ทราบชื่อ';
            }
          } catch (equipError) {
            console.warn(`⚠️  Could not fetch equipment ${loanRequest.equipmentId}:`, equipError.message);
            updateData.equipmentCategory = loanRequest.equipmentSnapshot?.category || null;
            updateData.equipmentName = loanRequest.equipmentSnapshot?.name || 'ไม่ทราบชื่อ';
          }
        }

        // Get user data
        if (loanRequest.userId) {
          try {
            const userDoc = await db.collection('users').doc(loanRequest.userId).get();
            
            if (userDoc.exists) {
              const user = userDoc.data();
              updateData.userName = user.displayName || 'ไม่ทราบชื่อ';
              updateData.userDepartment = user.department || null;
              
              // Update userSnapshot if needed
              if (!loanRequest.userSnapshot) {
                updateData.userSnapshot = {
                  displayName: user.displayName || 'ไม่ทราบชื่อ',
                  email: user.email || '',
                  department: user.department || null,
                  studentId: user.studentId || null
                };
              }
            } else {
              // Use snapshot data if available
              updateData.userName = loanRequest.userSnapshot?.displayName || 'ไม่ทราบชื่อ';
              updateData.userDepartment = loanRequest.userSnapshot?.department || null;
            }
          } catch (userError) {
            console.warn(`⚠️  Could not fetch user ${loanRequest.userId}:`, userError.message);
            updateData.userName = loanRequest.userSnapshot?.displayName || 'ไม่ทราบชื่อ';
            updateData.userDepartment = loanRequest.userSnapshot?.department || null;
          }
        }

        // Update the loan request
        if (Object.keys(updateData).length > 0) {
          await db.collection('loanRequests').doc(loanRequestId).update({
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`✅ Updated ${loanRequestId}`);
          console.log(`   - equipmentCategory: ${updateData.equipmentCategory || 'null'}`);
          console.log(`   - equipmentName: ${updateData.equipmentName || 'null'}`);
          console.log(`   - userName: ${updateData.userName || 'null'}`);
          console.log(`   - userDepartment: ${updateData.userDepartment || 'null'}\n`);
          
          successCount++;
        } else {
          console.log(`⏭️  Skipping ${loanRequestId} - no updates needed`);
          skipCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing ${loanRequestId}:`, error.message);
        errors.push({ id: loanRequestId, error: error.message });
        errorCount++;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`⏭️  Skipped (already migrated): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total processed: ${loanRequestsSnapshot.size}`);
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(({ id, error }) => {
        console.log(`   - ${id}: ${error}`);
      });
    }

    console.log('\n✅ Migration completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify the migrated data in Firestore console');
    console.log('   2. Update Firestore indexes if needed (firestore.indexes.json)');
    console.log('   3. Deploy indexes: firebase deploy --only firestore:indexes');
    console.log('   4. Test filtering by category in the application\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateLoanRequests()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
