/**
 * Deploy Settings Security Rules
 * 
 * This script helps deploy and verify Firestore security rules
 * for the admin settings system.
 * 
 * Run with: node scripts/deploy-settings-security-rules.js
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

// Check if firestore.rules file exists
function checkRulesFile() {
  logStep(1, 'Checking firestore.rules file');
  
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  
  if (!fs.existsSync(rulesPath)) {
    logError('firestore.rules file not found');
    logInfo('Expected location: ' + rulesPath);
    return false;
  }
  
  logSuccess('firestore.rules file found');
  return true;
}

// Validate rules file contains settings-related rules
function validateRulesContent() {
  logStep(2, 'Validating rules content');
  
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  
  const requiredCollections = [
    'settings',
    'closedDates',
    'categoryLimits',
    'settingsAuditLog',
    'systemNotifications'
  ];
  
  let allFound = true;
  
  for (const collection of requiredCollections) {
    if (rulesContent.includes(`match /${collection}/`)) {
      logSuccess(`Found rules for '${collection}' collection`);
    } else {
      logError(`Missing rules for '${collection}' collection`);
      allFound = false;
    }
  }
  
  // Check for admin helper function
  if (rulesContent.includes('function isAdmin()')) {
    logSuccess('Found isAdmin() helper function');
  } else {
    logWarning('isAdmin() helper function not found');
  }
  
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

// Deploy rules
function deployRules(dryRun = false) {
  const step = dryRun ? 5 : 6;
  logStep(step, dryRun ? 'Dry run deployment' : 'Deploying rules');
  
  try {
    const command = dryRun 
      ? 'firebase deploy --only firestore:rules --dry-run'
      : 'firebase deploy --only firestore:rules';
    
    logInfo(`Running: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log(output);
    
    if (dryRun) {
      logSuccess('Dry run completed successfully');
      logInfo('Rules are valid and ready to deploy');
    } else {
      logSuccess('Rules deployed successfully');
    }
    
    return true;
  } catch (error) {
    logError(dryRun ? 'Dry run failed' : 'Deployment failed');
    console.error(error.message);
    return false;
  }
}

// Show deployment summary
function showSummary() {
  log('\n' + '='.repeat(60), 'cyan');
  log('Deployment Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  
  logInfo('The following collections now have security rules:');
  log('  • settings (admin write, authenticated read)', 'blue');
  log('  • closedDates (admin write, authenticated read)', 'blue');
  log('  • categoryLimits (admin write, authenticated read)', 'blue');
  log('  • settingsAuditLog (admin read only)', 'blue');
  log('  • systemNotifications (admin write, authenticated read/update)', 'blue');
  
  log('\n' + '='.repeat(60), 'cyan');
  logInfo('Next steps:');
  log('  1. Test the rules with: node scripts/test-settings-security-rules.js', 'blue');
  log('  2. Verify in Firebase Console: Firestore Database → Rules', 'blue');
  log('  3. Monitor for any permission errors in your application', 'blue');
}

// Show rollback instructions
function showRollbackInstructions() {
  log('\n' + '='.repeat(60), 'yellow');
  log('Rollback Instructions', 'yellow');
  log('='.repeat(60), 'yellow');
  
  logInfo('If you need to rollback the rules:');
  log('  1. Restore previous rules from git:', 'blue');
  log('     git checkout HEAD~1 firestore.rules', 'blue');
  log('  2. Deploy the previous version:', 'blue');
  log('     firebase deploy --only firestore:rules', 'blue');
  log('  3. Or use Firebase Console to restore from history', 'blue');
}

// Main deployment function
async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('Settings Security Rules Deployment', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // Pre-deployment checks
  if (!checkRulesFile()) {
    process.exit(1);
  }
  
  if (!validateRulesContent()) {
    logError('Rules validation failed');
    logInfo('Please ensure all required collections have security rules');
    process.exit(1);
  }
  
  if (!checkFirebaseCLI()) {
    process.exit(1);
  }
  
  if (!checkFirebaseProject()) {
    process.exit(1);
  }
  
  // Dry run first
  logInfo('\nPerforming dry run to validate rules...');
  if (!deployRules(true)) {
    logError('Dry run failed. Please fix the errors before deploying.');
    process.exit(1);
  }
  
  // Ask for confirmation
  logWarning('\n⚠️  You are about to deploy Firestore security rules to production.');
  logInfo('This will affect all users immediately.');
  
  // In a real scenario, you might want to add a confirmation prompt here
  // For now, we'll proceed with deployment
  
  // Deploy rules
  if (!deployRules(false)) {
    logError('Deployment failed');
    showRollbackInstructions();
    process.exit(1);
  }
  
  // Success
  showSummary();
  showRollbackInstructions();
  
  log('\n✅ Deployment completed successfully!', 'green');
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
  checkRulesFile,
  validateRulesContent,
  checkFirebaseCLI,
  checkFirebaseProject,
  deployRules
};
