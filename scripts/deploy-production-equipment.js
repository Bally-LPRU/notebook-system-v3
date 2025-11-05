#!/usr/bin/env node

/**
 * Production Deployment Script for Equipment Management System
 * This script handles the complete production deployment process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  projectId: 'equipment-lending-system-41b49',
  buildDir: 'build',
  requiredEnvVars: [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID'
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function executeCommand(command, description) {
  try {
    log(`Executing: ${command}`, 'blue');
    execSync(command, { stdio: 'inherit' });
    logSuccess(`${description} completed successfully`);
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    process.exit(1);
  }
}

function checkEnvironmentVariables() {
  logStep('1', 'Checking environment variables');
  
  const missingVars = [];
  
  CONFIG.requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    logError(`Missing required environment variables: ${missingVars.join(', ')}`);
    log('Please ensure all required environment variables are set in .env.production.local', 'yellow');
    process.exit(1);
  }
  
  logSuccess('All required environment variables are present');
}

function validateFirebaseProject() {
  logStep('2', 'Validating Firebase project configuration');
  
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
    
    if (!firebaseConfig.hosting) {
      throw new Error('Firebase hosting configuration not found');
    }
    
    if (!firebaseConfig.firestore) {
      throw new Error('Firestore configuration not found');
    }
    
    if (!firebaseConfig.storage) {
      throw new Error('Storage configuration not found');
    }
    
    logSuccess('Firebase configuration is valid');
  } catch (error) {
    logError(`Firebase configuration validation failed: ${error.message}`);
    process.exit(1);
  }
}

function runSecurityRulesValidation() {
  logStep('3', 'Validating Firebase security rules');
  
  try {
    // Validate Firestore rules
    if (fs.existsSync('firestore.rules')) {
      executeCommand(
        `firebase firestore:rules:validate --project ${CONFIG.projectId}`,
        'Firestore rules validation'
      );
    }
    
    // Validate Storage rules
    if (fs.existsSync('storage.rules')) {
      executeCommand(
        `firebase storage:rules:validate --project ${CONFIG.projectId}`,
        'Storage rules validation'
      );
    }
    
    logSuccess('Security rules validation completed');
  } catch (error) {
    logError(`Security rules validation failed: ${error.message}`);
    process.exit(1);
  }
}

function buildApplication() {
  logStep('4', 'Building application for production');
  
  // Clean previous build
  if (fs.existsSync(CONFIG.buildDir)) {
    executeCommand(`rm -rf ${CONFIG.buildDir}`, 'Cleaning previous build');
  }
  
  // Install dependencies
  executeCommand('npm ci', 'Installing dependencies');
  
  // Run build
  executeCommand('npm run build', 'Building application');
  
  // Verify build output
  if (!fs.existsSync(CONFIG.buildDir)) {
    logError('Build directory not found after build process');
    process.exit(1);
  }
  
  const buildFiles = fs.readdirSync(CONFIG.buildDir);
  if (!buildFiles.includes('index.html')) {
    logError('index.html not found in build directory');
    process.exit(1);
  }
  
  logSuccess('Application build completed successfully');
}

function runPreDeploymentTests() {
  logStep('5', 'Running pre-deployment tests');
  
  try {
    // Run unit tests
    executeCommand('npm test -- --run --coverage', 'Running unit tests');
    
    // Run integration tests
    executeCommand('npm run test:integration -- --run', 'Running integration tests');
    
    logSuccess('All pre-deployment tests passed');
  } catch (error) {
    logWarning('Some tests failed, but continuing with deployment');
    log('Please review test results and fix any critical issues', 'yellow');
  }
}

function deployToFirebase() {
  logStep('6', 'Deploying to Firebase');
  
  try {
    // Deploy Firestore rules
    executeCommand(
      `firebase deploy --only firestore:rules --project ${CONFIG.projectId}`,
      'Deploying Firestore rules'
    );
    
    // Deploy Storage rules
    executeCommand(
      `firebase deploy --only storage:rules --project ${CONFIG.projectId}`,
      'Deploying Storage rules'
    );
    
    // Deploy Firestore indexes
    executeCommand(
      `firebase deploy --only firestore:indexes --project ${CONFIG.projectId}`,
      'Deploying Firestore indexes'
    );
    
    // Deploy hosting
    executeCommand(
      `firebase deploy --only hosting --project ${CONFIG.projectId}`,
      'Deploying to Firebase Hosting'
    );
    
    logSuccess('Firebase deployment completed successfully');
  } catch (error) {
    logError(`Firebase deployment failed: ${error.message}`);
    process.exit(1);
  }
}

function runPostDeploymentValidation() {
  logStep('7', 'Running post-deployment validation');
  
  const siteUrl = `https://${CONFIG.projectId}.web.app`;
  
  try {
    // Check if site is accessible
    executeCommand(
      `curl -f -s -o /dev/null ${siteUrl}`,
      'Checking site accessibility'
    );
    
    logSuccess(`Site is accessible at ${siteUrl}`);
    
    // Additional validation can be added here
    log('Manual testing recommended:', 'yellow');
    log(`- Visit ${siteUrl}`, 'yellow');
    log('- Test equipment management features', 'yellow');
    log('- Verify image upload functionality', 'yellow');
    log('- Test search and filtering', 'yellow');
    log('- Verify mobile responsiveness', 'yellow');
    
  } catch (error) {
    logWarning(`Site accessibility check failed: ${error.message}`);
    log(`Please manually verify that ${siteUrl} is working correctly`, 'yellow');
  }
}

function generateDeploymentReport() {
  logStep('8', 'Generating deployment report');
  
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    projectId: CONFIG.projectId,
    environment: 'production',
    buildDirectory: CONFIG.buildDir,
    siteUrl: `https://${CONFIG.projectId}.web.app`,
    features: [
      'Equipment Management System',
      'Image Upload and Processing',
      'QR Code Generation',
      'Bulk Operations',
      'Export and Reporting',
      'Mobile PWA Support',
      'Audit Logging',
      'Permission Management'
    ],
    securityFeatures: [
      'Firebase Security Rules',
      'Content Security Policy',
      'HTTPS Enforcement',
      'XSS Protection',
      'Frame Options',
      'Content Type Validation'
    ]
  };
  
  const reportPath = path.join(__dirname, '..', 'deployment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(deploymentInfo, null, 2));
  
  logSuccess(`Deployment report generated: ${reportPath}`);
}

// Main deployment process
async function main() {
  log('🚀 Starting Equipment Management System Production Deployment', 'bright');
  log('================================================================', 'bright');
  
  try {
    checkEnvironmentVariables();
    validateFirebaseProject();
    runSecurityRulesValidation();
    buildApplication();
    runPreDeploymentTests();
    deployToFirebase();
    runPostDeploymentValidation();
    generateDeploymentReport();
    
    log('\n🎉 Production deployment completed successfully!', 'green');
    log(`🌐 Your application is now live at: https://${CONFIG.projectId}.web.app`, 'green');
    log('📋 Please perform manual testing to ensure everything works correctly', 'yellow');
    
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  main,
  CONFIG
};