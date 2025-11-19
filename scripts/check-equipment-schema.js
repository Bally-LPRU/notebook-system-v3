/**
 * Script to check equipment schema in Firestore
 * This will show the actual fields used in the equipment collection
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function checkEquipmentSchema() {
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
    
    console.log('🔍 Fetching equipment documents...\n');
    const snapshot = await equipmentRef.limit(5).get();
    
    if (snapshot.empty) {
      console.log('❌ No equipment found in collection');
      process.exit(0);
    }

    console.log(`📊 Found ${snapshot.size} equipment items (showing first 5)\n`);
    console.log('='.repeat(80));
    
    // Collect all unique fields
    const allFields = new Set();
    const fieldExamples = {};
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n📦 Equipment ${index + 1}: ${doc.id}`);
      console.log('-'.repeat(80));
      
      Object.keys(data).forEach(key => {
        allFields.add(key);
        if (!fieldExamples[key]) {
          fieldExamples[key] = {
            type: typeof data[key],
            example: data[key],
            docId: doc.id
          };
        }
      });
      
      // Show key fields
      console.log(`Name: ${data.name || 'N/A'}`);
      console.log(`Equipment Number: ${data.equipmentNumber || 'N/A'}`);
      console.log(`Serial Number: ${data.serialNumber || 'N/A'}`);
      console.log(`Brand: ${data.brand || 'N/A'}`);
      console.log(`Model: ${data.model || 'N/A'}`);
      console.log(`Category: ${JSON.stringify(data.category) || 'N/A'}`);
      console.log(`Status: ${data.status || 'N/A'}`);
      console.log(`Location: ${JSON.stringify(data.location) || 'N/A'}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 All Fields Found:');
    console.log('='.repeat(80));
    
    const sortedFields = Array.from(allFields).sort();
    sortedFields.forEach(field => {
      const info = fieldExamples[field];
      let exampleStr = '';
      
      if (info.type === 'object') {
        if (info.example && info.example.toDate) {
          exampleStr = `Timestamp (${info.example.toDate().toISOString()})`;
        } else {
          exampleStr = JSON.stringify(info.example);
        }
      } else {
        exampleStr = String(info.example);
      }
      
      // Truncate long examples
      if (exampleStr.length > 50) {
        exampleStr = exampleStr.substring(0, 47) + '...';
      }
      
      console.log(`  ${field.padEnd(25)} : ${info.type.padEnd(10)} | ${exampleStr}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 Field Analysis:');
    console.log('='.repeat(80));
    
    // Check for common field patterns
    const hasEquipmentNumber = allFields.has('equipmentNumber');
    const hasSerialNumber = allFields.has('serialNumber');
    const hasImageURL = allFields.has('imageURL');
    const hasImages = allFields.has('images');
    
    console.log(`\n📌 Key Fields:`);
    console.log(`  equipmentNumber: ${hasEquipmentNumber ? '✅ Found' : '❌ Not found'}`);
    console.log(`  serialNumber: ${hasSerialNumber ? '✅ Found' : '❌ Not found'}`);
    console.log(`  imageURL: ${hasImageURL ? '✅ Found (single)' : '❌ Not found'}`);
    console.log(`  images: ${hasImages ? '✅ Found (array)' : '❌ Not found'}`);
    
    console.log(`\n💡 Recommendations:`);
    if (hasSerialNumber && !hasEquipmentNumber) {
      console.log(`  ⚠️  Data uses 'serialNumber' but form uses 'equipmentNumber'`);
      console.log(`  → Consider mapping serialNumber to equipmentNumber in the form`);
    }
    if (hasEquipmentNumber && hasSerialNumber) {
      console.log(`  ⚠️  Data has both 'equipmentNumber' and 'serialNumber'`);
      console.log(`  → Clarify which field should be used`);
    }
    if (hasImageURL && !hasImages) {
      console.log(`  ℹ️  Data uses 'imageURL' (single) not 'images' (array)`);
    }
    
    console.log('\n' + '='.repeat(80));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting equipment schema check...\n');
checkEquipmentSchema();
