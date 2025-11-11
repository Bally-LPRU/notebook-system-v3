/**
 * Test Script for Incognito Mode Issues
 * 
 * This script helps test and debug issues in incognito mode:
 * 1. Token refresh loops
 * 2. Duplicate menu rendering
 * 3. Equipment page not loading
 */

console.log('🧪 Incognito Mode Test Script');
console.log('================================\n');

// Test 1: Check for duplicate elements
console.log('📋 Test 1: Checking for duplicate elements...');
const checkDuplicates = () => {
  const navbars = document.querySelectorAll('nav');
  const sidebars = document.querySelectorAll('[role="navigation"]');
  
  console.log(`  - Found ${navbars.length} navbar(s)`);
  console.log(`  - Found ${sidebars.length} sidebar(s)`);
  
  if (navbars.length > 1) {
    console.warn('  ⚠️ Multiple navbars detected!');
  }
  
  if (sidebars.length > 1) {
    console.warn('  ⚠️ Multiple sidebars detected!');
  }
  
  return navbars.length === 1 && sidebars.length <= 1;
};

// Test 2: Monitor token refresh
console.log('\n📋 Test 2: Monitoring token refresh...');
let tokenRefreshCount = 0;
let lastRefreshTime = Date.now();

const monitorTokenRefresh = () => {
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('Token changed') || message.includes('Token refresh')) {
      tokenRefreshCount++;
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime;
      
      console.warn(`  🔄 Token refresh #${tokenRefreshCount} (${timeSinceLastRefresh}ms since last)`);
      
      if (timeSinceLastRefresh < 1000) {
        console.error('  ❌ Token refresh too frequent! Possible loop detected.');
      }
      
      lastRefreshTime = now;
    }
    
    originalConsoleLog.apply(console, args);
  };
};

// Test 3: Check Firebase connection
console.log('\n📋 Test 3: Checking Firebase connection...');
const checkFirebaseConnection = async () => {
  try {
    const { auth } = await import('../src/config/firebase.js');
    console.log('  ✅ Firebase auth initialized');
    console.log(`  - Current user: ${auth.currentUser ? auth.currentUser.email : 'None'}`);
    return true;
  } catch (error) {
    console.error('  ❌ Firebase connection error:', error.message);
    return false;
  }
};

// Test 4: Check equipment service
console.log('\n📋 Test 4: Checking equipment service...');
const checkEquipmentService = async () => {
  try {
    const EquipmentService = await import('../src/services/equipmentManagementService.js');
    console.log('  ✅ Equipment service loaded');
    
    // Check if required methods exist
    const requiredMethods = [
      'getEquipmentList',
      'getEquipmentById',
      'createEquipment',
      'updateEquipment',
      'deleteEquipment'
    ];
    
    const missingMethods = requiredMethods.filter(
      method => typeof EquipmentService.default[method] !== 'function'
    );
    
    if (missingMethods.length > 0) {
      console.error('  ❌ Missing methods:', missingMethods.join(', '));
      return false;
    }
    
    console.log('  ✅ All required methods present');
    return true;
  } catch (error) {
    console.error('  ❌ Equipment service error:', error.message);
    return false;
  }
};

// Run tests
const runTests = async () => {
  console.log('\n🚀 Running tests...\n');
  
  const results = {
    duplicates: checkDuplicates(),
    firebase: await checkFirebaseConnection(),
    equipment: await checkEquipmentService()
  };
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`  Duplicate Check: ${results.duplicates ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Firebase Check: ${results.firebase ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Equipment Check: ${results.equipment ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r === true);
  console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}`);
  
  // Start monitoring
  monitorTokenRefresh();
  console.log('\n👀 Now monitoring token refresh... (check console for warnings)');
};

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(runTests, 2000); // Wait for app to initialize
  });
}

export { runTests, checkDuplicates, monitorTokenRefresh };
