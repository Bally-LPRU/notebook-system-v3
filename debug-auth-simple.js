// Simple authentication test script
// Add this to your browser console to test basic Firebase auth

console.log('🔍 Testing Firebase Auth...');
console.log('Auth object:', window.firebase?.auth || 'Not found');
console.log('Current user:', window.firebase?.auth?.currentUser || 'No user');

// Test Google provider
try {
  const provider = new firebase.auth.GoogleAuthProvider();
  console.log('✅ Google provider created:', provider);
} catch (error) {
  console.error('❌ Google provider error:', error);
}

// Test signInWithRedirect
async function testSignIn() {
  try {
    console.log('🔍 Testing signInWithRedirect...');
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithRedirect(provider);
    console.log('✅ signInWithRedirect called');
  } catch (error) {
    console.error('❌ signInWithRedirect error:', error);
  }
}

// Run test
testSignIn();