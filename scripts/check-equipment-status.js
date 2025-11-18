/**
 * Script to check equipment status in Firestore
 * This script will report any equipment with invalid status
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Valid equipment statuses
const VALID_STATUSES = ['available', 'borrowed', 'maintenance', 'retired'];

async function checkEquipmentStatus() {
  try {
    // Initialize Firebase Admin
    let app;
    try {
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
    
    const statusCounts = {};
    const invalidEquipment = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const status = data.status;
      
      // Count statuses
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      // Check if status is invalid
      if (!VALID_STATUSES.includes(status)) {
        invalidEquipment.push({
          id: doc.id,
          name: data.name,
          status: status
        });
      }
    }
    
    console.log('📊 Status Distribution:');
    console.log('='.repeat(50));
    Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      const isValid = VALID_STATUSES.includes(status);
      const icon = isValid ? '✅' : '❌';
      console.log(`${icon} ${status.padEnd(20)} : ${count}`);
    });
    console.log('='.repeat(50));
    
    if (invalidEquipment.length > 0) {
      console.log(`\n⚠️  Found ${invalidEquipment.length} equipment with invalid status:\n`);
      invalidEquipment.forEach(item => {
        console.log(`   - ${item.id} (${item.name}): "${item.status}"`);
      });
      console.log('\n💡 Run "node scripts/fix-equipment-status.js" to fix these issues');
    } else {
      console.log('\n✅ All equipment have valid status!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting equipment status check...\n');
checkEquipmentStatus();
