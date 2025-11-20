/**
 * Deploy Settings Firestore Indexes
 * 
 * This script helps deploy and verify Firestore indexes
 * for the admin settings system.
 * 
 * Run with: node scripts/deploy-settings-indexes.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Check if firestore.indexes.json file exists
function checkIndexesFile() {
  logStep(1, 'Checking firestore.indexes.json file');
  
  const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
  
  if (!fs.existsSync(indexesPath)) {
    logError('firestore.indexes.json file not found');
    logInfo('Expected location: ' + indexesPath);
    return false;
  }
  
  logSuccess('firestore.indexes.json file found');
  return true;
}

// Validate indexes file contains settings-related indexes
function validateIndexesContent() {
  logStep(2, 'Validating indexes content');
  
  const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
  const indexesContent = fs.readFileSync(indexesPath, 'utf8');
  
  let indexesConfig;
  try {
    indexesConfig = JSON.parse(indexesContent);
  } catch (error) {
    logError('Invalid JSON in firestore.indexes.json');
    return false;
  }
  
  if (!indexesConfig.indexes || !Array.isArray(indexesConfig.indexes)) {
    logError('Invalid indexes structure');
    return false;
  }
  
  // Check for settings-related indexes
  const requiredIndexes = [
    { collection: 'settingsAuditLog', fields: ['timestamp'] },
    { collection: 'settingsAuditLog', fields: ['adminId', 'timestamp'] },
    { collection: 'settingsAuditLog', fields: ['settingType', 'timestamp'] },
    { collection: 'closedDates', fields: ['date'] },
    { collection: 'systemNotifications', fields: ['createdAt'] },
    { collection: 'systemNotifications', fields: ['type', 'createdAt'] },
    { collection: 'systemNotifications', fields: ['priority', 'createdAt'] }
  ];
  
  let allFound = true;
  
  for (const required of requiredIndexes) {
    const found = indexesConfig.indexes.some(index => {
      if (index.collectionGroup !== required.collection) {
        return false;
      }
      
      // Check if all required fields are present
      return required.fields.every(fieldName => {
        return index.fields.some(field => 
          field.fieldPath === fieldName || 
          field.fieldPath.includes(fieldName)
        );
      });
    });
    
    if (found) {
      logSuccess(`Found index for '${required.collection}' with fields: ${required.fields.join(', ')}`);
    } else {
      logWarning(`Missing index for '${required.collection}' with fields: ${required.fields.join(', ')}`);
      allFound = false;
    }
  }
  
  // Show total count
  const settingsIndexes = indexesConfig.indexes.filter(index => 
    index.collectionGroup === 'settingsAuditLog' ||
    index.collectionGroup === 'closedDates' ||
    index.collectionGroup === 'systemNotifications'
  );
  
  logInfo(`Total settings-related indexes: ${settingsIndexes.length}`);
  
  return allFound;
}

// Check Firebase CLI is installed
function checkFirebaseCLI() {
  logStep(3, 'Checking Firebase CLI');
  
  try {
    const version = execSync('firebase --version', { encoding: 'utf8' }).trim();
    logSuccess(`Firebase CLI installed: ${version}`);
    return true;
  } catch (error) {
    logError('Firebase CLI not installed');
    logInfo('Install with: npm install -g firebase-tools');
    return false;
  }
}

// Check Firebase project is configured
function checkFirebaseProject() {
  logStep(4, 'Checking Firebase project configuration');
  
  try {
    const project = execSync('firebase use', { encoding: 'utf8' }).trim();
    logSuccess('Firebase project configured');
    logInfo(project);
    return true;
  } catch (error) {
    logError('Firebase project not configured');
    logInfo('Run: firebase use <project-id>');
    return false;
  }
}

// Deploy indexes
function deployIndexes() {
  logStep(5, 'Deploying indexes');
  
  try {
    const command = 'firebase deploy --only firestore:indexes';
    
    logInfo(`Running: ${command}`);
    logWarning('This may take several minutes...');
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log(output);
    
    logSuccess('Indexes deployed successfully');
    logInfo('Note: Index building may continue in the background');
    
    return true;
  } catch (error) {
    logError('Deployment failed');
    console.error(error.message);
    return false;
  }
}

// Show index building status
function showIndexStatus() {
  logStep(6, 'Checking index building status');
  
  try {
    logInfo('Fetching index status from Firebase...');
    
    // This command shows the status of indexes
    const output = execSync('firebase firestore:indexes', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log(output);
    
    logInfo('Check Firebase Console for detailed status:');
    log('  https://console.firebase.google.com/project/_/firestore/indexes', 'blue');
    
  } catch (error) {
    logWarning('Could not fetch index status');
    logInfo('Check Firebase Console manually');
  }
}

// Show deployment summary
function showSummary() {
  log('\n' + '='.repeat(60), 'cyan');
  log('Deployment Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  
  logInfo('The following indexes have been deployed:');
  
  log('\nSettings Audit Log Indexes:', 'blue');
  log('  • timestamp (DESC) - for chronological queries', 'blue');
  log('  • adminId + timestamp (DESC) - for filtering by admin', 'blue');
  log('  • settingType + timestamp (DESC) - for filtering by setting', 'blue');
  log('  • adminId + settingType + timestamp (DESC) - for combined filters', 'blue');
  
  log('\nClosed Dates Indexes:', 'blue');
  log('  • date (ASC) - for chronological ordering', 'blue');
  
  log('\nSystem Notifications Indexes:', 'blue');
  log('  • createdAt (DESC) - for chronological queries', 'blue');
  log('  • type + createdAt (DESC) - for filtering by type', 'blue');
  log('  • priority + createdAt (DESC) - for filtering by priority', 'blue');
  
  log('\n' + '='.repeat(60), 'cyan');
  logInfo('Index Building:');
  log('  • Indexes may take several minutes to build', 'blue');
  log('  • Queries will work but may be slower until building completes', 'blue');
  log('  • Monitor progress in Firebase Console', 'blue');
  
  log('\n' + '='.repeat(60), 'cyan');
  logInfo('Next steps:');
  log('  1. Monitor index building in Firebase Console', 'blue');
  log('  2. Test queries with: node scripts/test-settings-indexes.js', 'blue');
  log('  3. Verify query performance in your application', 'blue');
}

// Show performance tips
function showPerformanceTips() {
  log('\n' + '='.repeat(60), 'yellow');
  log('Performance Tips', 'yellow');
  log('='.repeat(60), 'yellow');
  
  logInfo('Optimize your queries:');
  log('  • Use indexes for all compound queries', 'blue');
  log('  • Limit result sets with .limit()', 'blue');
  log('  • Use pagination for large datasets', 'blue');
  log('  • Cache frequently accessed data', 'blue');
  log('  • Monitor query performance in Firebase Console', 'blue');
  
  logInfo('\nAudit Log Best Practices:');
  log('  • Archive old logs periodically (> 2 years)', 'blue');
  log('  • Use date range filters to limit query scope', 'blue');
  log('  • Consider pagination for large result sets', 'blue');
}

// Main deployment function
async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('Settings Firestore Indexes Deployment', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // Pre-deployment checks
  if (!checkIndexesFile()) {
    process.exit(1);
  }
  
  if (!validateIndexesContent()) {
    logWarning('Some indexes may be missing, but continuing with deployment...');
  }
  
  if (!checkFirebaseCLI()) {
    process.exit(1);
  }
  
  if (!checkFirebaseProject()) {
    process.exit(1);
  }
  
  // Deploy indexes
  logWarning('\n⚠️  You are about to deploy Firestore indexes.');
  logInfo('This will create/update indexes for settings-related collections.');
  logInfo('Index building may take several minutes to complete.');
  
  if (!deployIndexes()) {
    logError('Deployment failed');
    process.exit(1);
  }
  
  // Show status
  showIndexStatus();
  
  // Success
  showSummary();
  showPerformanceTips();
  
  log('\n✅ Deployment completed successfully!', 'green');
  logInfo('Indexes are now building in the background.');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    logError('Deployment script failed');
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  checkIndexesFile,
  validateIndexesContent,
  checkFirebaseCLI,
  checkFirebaseProject,
  deployIndexes
};
