/**
 * Simple Migration Script: Add Denormalized Data to Existing Loan Requests
 * 
 * This is a simplified version that can be run directly without service account
 * 
 * Instructions:
 * 1. Open Firebase Console: https://console.firebase.google.com
 * 2. Go to Firestore Database
 * 3. Run this script in the browser console or use Firebase CLI
 * 
 * Or copy the migration logic to your React app and run it from there
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   Loan Request Denormalization Migration                      ║
║                                                                ║
║   This script needs to be run with proper Firebase access     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

📝 OPTION 1: Run from Firebase Console
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to: https://console.firebase.google.com
2. Select your project
3. Go to Firestore Database
4. Open browser console (F12)
5. Copy and paste the migration code below

📝 OPTION 2: Run from React App (Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a temporary admin page in your React app:

// src/components/admin/MigrationPage.js
import React, { useState } from 'react';
import { collection, getDocs, doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function MigrationPage() {
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const runMigration = async () => {
    setStatus('Starting migration...');
    
    try {
      const loanRequestsSnapshot = await getDocs(collection(db, 'loanRequests'));
      const total = loanRequestsSnapshot.size;
      
      if (total === 0) {
        setStatus('No loan requests found');
        return;
      }

      setProgress({ current: 0, total });
      let successCount = 0;
      let skipCount = 0;
      
      const batchSize = 500;
      let batch = writeBatch(db);
      let operationCount = 0;
      let current = 0;

      for (const docSnapshot of loanRequestsSnapshot.docs) {
        current++;
        setProgress({ current, total });
        
        const loanRequest = docSnapshot.data();
        
        // Skip if already has snapshots
        if (loanRequest.equipmentSnapshot && loanRequest.userSnapshot) {
          skipCount++;
          continue;
        }

        // Fetch equipment
        let equipmentSnapshot = null;
        if (loanRequest.equipmentId) {
          const equipmentDoc = await getDoc(doc(db, 'equipmentManagement', loanRequest.equipmentId));
          if (equipmentDoc.exists()) {
            const equipment = equipmentDoc.data();
            equipmentSnapshot = {
              name: equipment.name || 'ไม่ทราบชื่อ',
              category: equipment.category || null,
              serialNumber: equipment.serialNumber || null,
              imageUrl: equipment.imageUrl || equipment.images?.[0] || null
            };
          } else {
            equipmentSnapshot = {
              name: 'อุปกรณ์ถูกลบแล้ว',
              category: null,
              serialNumber: null,
              imageUrl: null
            };
          }
        }

        // Fetch user
        let userSnapshot = null;
        if (loanRequest.userId) {
          const userDoc = await getDoc(doc(db, 'users', loanRequest.userId));
          if (userDoc.exists()) {
            const user = userDoc.data();
            userSnapshot = {
              displayName: user.displayName || 'ไม่ทราบชื่อ',
              email: user.email || '',
              department: user.department || null,
              studentId: user.studentId || null
            };
          } else {
            userSnapshot = {
              displayName: 'ผู้ใช้ถูกลบแล้ว',
              email: '',
              department: null,
              studentId: null
            };
          }
        }

        // Update
        const updateData = {};
        if (equipmentSnapshot && !loanRequest.equipmentSnapshot) {
          updateData.equipmentSnapshot = equipmentSnapshot;
        }
        if (userSnapshot && !loanRequest.userSnapshot) {
          updateData.userSnapshot = userSnapshot;
        }

        if (Object.keys(updateData).length > 0) {
          batch.update(docSnapshot.ref, {
            ...updateData,
            migratedAt: serverTimestamp()
          });
          operationCount++;
          successCount++;
        }

        // Commit batch
        if (operationCount >= batchSize) {
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
        }
      }

      // Commit remaining
      if (operationCount > 0) {
        await batch.commit();
      }

      setStatus(\`✅ Migration completed! Success: \${successCount}, Skipped: \${skipCount}\`);
    } catch (error) {
      setStatus(\`❌ Error: \${error.message}\`);
      console.error(error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Loan Request Migration</h1>
      <button
        onClick={runMigration}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Run Migration
      </button>
      {progress.total > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-600">
            Progress: {progress.current} / {progress.total}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: \`\${(progress.current / progress.total) * 100}%\` }}
            />
          </div>
        </div>
      )}
      {status && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre>{status}</pre>
        </div>
      )}
    </div>
  );
}

// Add route in App.js (admin only):
// <Route path="/admin/migration" element={<MigrationPage />} />

📝 OPTION 3: Manual Firestore Update
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you have very few loan requests, you can update them manually:

1. Go to Firestore Console
2. Open each loan request document
3. Add these fields:
   - equipmentSnapshot: { name, category, serialNumber, imageUrl }
   - userSnapshot: { displayName, email, department, studentId }

📝 OPTION 4: Use Firebase Admin SDK (Requires Service Account)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Download service account key from Firebase Console
2. Save as serviceAccountKey.json in project root
3. Run: node scripts/migrate-loan-request-denormalization.js

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 RECOMMENDATION: Use Option 2 (React App)
   - Easiest to implement
   - Uses existing Firebase connection
   - Can monitor progress in real-time
   - Admin-only access control

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Note: This script just prints instructions
// The actual migration should be run from one of the options above
