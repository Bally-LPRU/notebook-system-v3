#!/usr/bin/env node

/**
 * Fix Equipment Data Script
 * แก้ไขข้อมูลอุปกรณ์ที่มีปัญหา (null arrays, missing fields, etc.)
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixEquipmentData() {
  console.log('🔧 Fixing Equipment Data\n');
  console.log('================================\n');

  try {
    const equipmentRef = db.collection('equipmentManagement');
    const snapshot = await equipmentRef.get();
    
    if (snapshot.empty) {
      console.log('⚠️ No equipment found in database');
      console.log('💡 Run: node scripts/seed-equipment-data-simple.js\n');
      return;
    }

    console.log(`📋 Found ${snapshot.size} equipment(s) to check\n`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updates = {};
      let needsUpdate = false;

      console.log(`Checking: ${data.name || doc.id}`);

      // Fix images array
      if (!Array.isArray(data.images)) {
        updates.images = [];
        needsUpdate = true;
        console.log('  ✅ Fixed images (was not an array)');
      }

      // Fix tags array
      if (!Array.isArray(data.tags)) {
        updates.tags = [];
        needsUpdate = true;
        console.log('  ✅ Fixed tags (was not an array)');
      }

      // Fix searchKeywords array
      if (!Array.isArray(data.searchKeywords)) {
        // Generate search keywords from name and equipmentNumber
        const keywords = new Set();
        
        if (data.name) {
          data.name.toLowerCase().split(/\s+/).forEach(word => {
            if (word.length >= 2) keywords.add(word);
          });
        }
        
        if (data.equipmentNumber) {
          keywords.add(data.equipmentNumber.toLowerCase());
        }
        
        updates.searchKeywords = Array.from(keywords);
        needsUpdate = true;
        console.log('  ✅ Fixed searchKeywords (generated from name)');
      }

      // Fix isActive
      if (data.isActive === undefined || data.isActive === null) {
        updates.isActive = true;
        needsUpdate = true;
        console.log('  ✅ Fixed isActive (set to true)');
      }

      // Fix version
      if (!data.version || typeof data.version !== 'number') {
        updates.version = 1;
        needsUpdate = true;
        console.log('  ✅ Fixed version (set to 1)');
      }

      // Fix viewCount
      if (!data.viewCount || typeof data.viewCount !== 'number') {
        updates.viewCount = 0;
        needsUpdate = true;
        console.log('  ✅ Fixed viewCount (set to 0)');
      }

      // Fix status
      if (!data.status) {
        updates.status = 'available';
        needsUpdate = true;
        console.log('  ✅ Fixed status (set to available)');
      }

      // Fix category
      if (!data.category || typeof data.category !== 'object') {
        updates.category = {
          id: 'general',
          name: 'ทั่วไป'
        };
        needsUpdate = true;
        console.log('  ✅ Fixed category (set to general)');
      }

      // Fix timestamps
      if (!data.createdAt) {
        updates.createdAt = admin.firestore.FieldValue.serverTimestamp();
        needsUpdate = true;
        console.log('  ✅ Fixed createdAt');
      }

      if (!data.updatedAt) {
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        needsUpdate = true;
        console.log('  ✅ Fixed updatedAt');
      }

      // Apply updates if needed
      if (needsUpdate) {
        try {
          await doc.ref.update(updates);
          fixedCount++;
          console.log(`  ✅ Updated successfully\n`);
        } catch (error) {
          errorCount++;
          console.error(`  ❌ Error updating: ${error.message}\n`);
        }
      } else {
        console.log(`  ✅ No fixes needed\n`);
      }
    }

    // Summary
    console.log('================================');
    console.log('📊 Summary:\n');
    console.log(`  Total Equipment: ${snapshot.size}`);
    console.log(`  Fixed: ${fixedCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  No Changes: ${snapshot.size - fixedCount - errorCount}`);
    console.log('');

    if (fixedCount > 0) {
      console.log('✅ Equipment data fixed successfully!\n');
      console.log('💡 Next steps:');
      console.log('   1. Test the equipment page');
      console.log('   2. Clear browser cache');
      console.log('   3. Refresh the page\n');
    } else {
      console.log('✅ All equipment data is already correct!\n');
    }

  } catch (error) {
    console.error('❌ Error fixing equipment data:', error);
    console.error('\nError details:', error.message);
  }
}

// Run fix
fixEquipmentData()
  .then(() => {
    console.log('✅ Fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });
