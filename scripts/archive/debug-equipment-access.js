/**
 * Debug Equipment Access Issues
 * ตรวจสอบและแก้ไขปัญหาการเข้าถึงหน้าจัดการอุปกรณ์
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, collection, getDocs, query, limit } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function debugEquipmentAccess() {
  try {
    console.log('🔍 Starting equipment access debug...\n');

    // Get current user from auth
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('❌ No user is currently signed in');
      console.log('Please sign in first using the app');
      return;
    }

    console.log('✅ Current user:', {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName
    });
    console.log('');

    // Check user document in Firestore
    console.log('🔍 Checking user document in Firestore...');
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.log('❌ User document does not exist in Firestore!');
      console.log('This is the root cause of the permission issue.');
      console.log('');
      return;
    }

    const userData = userDoc.data();
    console.log('✅ User document exists:', {
      role: userData.role,
      status: userData.status,
      email: userData.email,
      displayName: userData.displayName
    });
    console.log('');

    // Check if user is admin
    if (userData.role !== 'admin') {
      console.log('❌ User is not an admin');
      console.log('Current role:', userData.role);
      console.log('');
      return;
    }

    console.log('✅ User is admin');
    console.log('');

    // Check if user is approved
    if (userData.status !== 'approved') {
      console.log('❌ User is not approved');
      console.log('Current status:', userData.status);
      console.log('');
      return;
    }

    console.log('✅ User is approved');
    console.log('');

    // Try to read equipmentManagement collection
    console.log('🔍 Attempting to read equipmentManagement collection...');
    try {
      const equipmentRef = collection(db, 'equipmentManagement');
      const equipmentQuery = query(equipmentRef, limit(1));
      const equipmentSnapshot = await getDocs(equipmentQuery);
      
      console.log('✅ Successfully read equipmentManagement collection');
      console.log('Number of documents:', equipmentSnapshot.size);
      
      if (equipmentSnapshot.size > 0) {
        const firstDoc = equipmentSnapshot.docs[0];
        console.log('First document:', {
          id: firstDoc.id,
          data: firstDoc.data()
        });
      } else {
        console.log('ℹ️  Collection is empty (no equipment added yet)');
      }
      console.log('');
    } catch (error) {
      console.log('❌ Failed to read equipmentManagement collection');
      console.log('Error:', error.message);
      console.log('Error code:', error.code);
      console.log('');
      
      if (error.code === 'permission-denied') {
        console.log('🔍 Permission denied - checking Firestore rules...');
        console.log('');
        console.log('The Firestore rules require:');
        console.log('1. User must be authenticated');
        console.log('2. User document must exist in /users/{uid}');
        console.log('3. User must have status == "approved"');
        console.log('');
        console.log('Current user status:');
        console.log('- Authenticated: ✅');
        console.log('- User document exists: ✅');
        console.log('- Status is approved: ✅');
        console.log('');
        console.log('⚠️  This suggests a Firestore rules issue or token refresh problem');
        console.log('');
        console.log('Recommended actions:');
        console.log('1. Sign out and sign in again to refresh the auth token');
        console.log('2. Check Firestore rules in Firebase Console');
        console.log('3. Verify the rules are deployed correctly');
      }
    }

    // Try to read equipmentCategories collection
    console.log('🔍 Attempting to read equipmentCategories collection...');
    try {
      const categoriesRef = collection(db, 'equipmentCategories');
      const categoriesQuery = query(categoriesRef, limit(1));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      
      console.log('✅ Successfully read equipmentCategories collection');
      console.log('Number of documents:', categoriesSnapshot.size);
      console.log('');
    } catch (error) {
      console.log('❌ Failed to read equipmentCategories collection');
      console.log('Error:', error.message);
      console.log('');
    }

    // Summary
    console.log('📋 Summary:');
    console.log('- User authentication: ✅');
    console.log('- User document exists: ✅');
    console.log('- User is admin: ✅');
    console.log('- User is approved: ✅');
    console.log('');
    console.log('If you still see permission errors, try:');
    console.log('1. Sign out and sign in again');
    console.log('2. Clear browser cache and cookies');
    console.log('3. Check browser console for detailed error messages');

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug
debugEquipmentAccess().catch(console.error);
