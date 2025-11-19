/**
 * Script to fix equipment status in Firestore
 * This script will update any equipment with invalid status to valid ones
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Valid equipment statuses
const VALID_STATUSES = ['available', 'borrowed', 'maintenance', 'retired'];

// Status mapping for old/invalid values
const STATUS_MAPPING = {
  // Old values
  'active': 'available',
  'ready': 'available',
  'free': 'available',
  'in-use': 'borrowed',
  'loaned': 'borrowed',
  'checked-out': 'borrowed',
  'repair': 'maintenance',
  'broken': 'maintenance',
  'fixing': 'maintenance',
  'disposed': 'retired',
  'inactive': 'retired',
  'removed': 'retired',
  // Uppercase versions
  'AVAILABLE': 'available',
  'BORROWED': 'borrowed',
  'MAINTENANCE': 'maintenance',
  'RETIRED': 'retired'
};

async function fixEquipmentStatus() {
  try {
    // Initialize Firebase Admin
    let app;
    try {
      // Try to use service account key
      const serviceAccount = require('../serviceAccountKey.json');
      app = initializeApp({
        credential: cert(serviceAccount)
      });
    } catch (error) {
      console.log('Service account key not found, using default credentials');
      app = initializeApp();
    }

    const db = getFirestore(app);
    const equipmentRef = db.collection('equipment');
    
    console.log('🔍 Fetching all equipment...');
    const snapshot = await equipmentRef.get();
    console.log(`📊 Found ${snapshot.size} equipment items\n`);
    
    let fixed = 0;
    let alreadyValid = 0;
    let errors = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const currentStatus = data.status;
      
      // Check if status is valid
      if (VALID_STATUSES.includes(currentStatus)) {
        alreadyValid++;
        continue;
      }
      
      console.log(`⚠️  Invalid status for ${doc.id} (${data.name}):`, currentStatus);
      
      // Try to map to valid status
      let newStatus = STATUS_MAPPING[currentStatus];
      
      if (!newStatus) {
        // If no mapping found, default to available
        console.log(`   No mapping found, defaulting to 'available'`);
        newStatus = 'available';
      } else {
        console.log(`   Mapping to: ${newStatus}`);
      }
      
      try {
        await equipmentRef.doc(doc.id).update({
          status: newStatus,
          updatedAt: FieldValue.serverTimestamp()
        });
        console.log(`   ✅ Fixed: ${currentStatus} → ${newStatus}\n`);
        fixed++;
      } catch (error) {
        console.error(`   ❌ Error fixing ${doc.id}:`, error.message, '\n');
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ✓  Already valid: ${alreadyValid}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total: ${snapshot.size}`);
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting equipment status fix...\n');
fixEquipmentStatus();
