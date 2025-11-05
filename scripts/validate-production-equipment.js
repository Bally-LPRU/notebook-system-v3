#!/usr/bin/env node

/**
 * Production Validation Script for Equipment Management System
 * This script validates the production deployment and performs health checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  projectId: 'equipment-lending-system-41b49',
  siteUrl: 'https://equipment-lending-system-41b49.web.app',
  apiEndpoints: [
    '/',
    '/equipment',
    '/manifest.json'
  ],
  requiredHeaders: [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Referrer-Policy'
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

async function checkSiteAccessibility() {
  logStep('1', 'Checking site accessibility');
  
  for (const endpoint of CONFIG.apiEndpoints) {
    const url = `${CONFIG.siteUrl}${endpoint}`;
    
    try {
      const response = await fetch(url);
      
      if (response.ok) {
        logSuccess(`${endpoint} is accessible (${response.status})`);
      } else {
        logError(`${endpoint} returned ${response.status}`);
      }
    } catch (error) {
      logError(`Failed to access ${endpoint}: ${error.message}`);
    }
  }
}

async function validateSecurityHeaders() {
  logStep('2', 'Validating security headers');
  
  try {
    const response = await fetch(CONFIG.siteUrl);
    const headers = response.headers;
    
    for (const requiredHeader of CONFIG.requiredHeaders) {
      if (headers.has(requiredHeader)) {
        logSuccess(`${requiredHeader}: ${headers.get(requiredHeader)}`);
      } else {
        logWarning(`Missing security header: ${requiredHeader}`);
      }
    }
    
    // Check specific security headers
    const csp = headers.get('Content-Security-Policy');
    if (csp) {
      logSuccess(`Content-Security-Policy is configured`);
    } else {
      logWarning('Content-Security-Policy header is missing');
    }
    
    const hsts = headers.get('Strict-Transport-Security');
    if (hsts) {
      logSuccess(`Strict-Transport-Security: ${hsts}`);
    } else {
      logWarning('Strict-Transport-Security header is missing');
    }
    
  } catch (error) {
    logError(`Failed to validate security headers: ${error.message}`);
  }
}

async function validatePWAFeatures() {
  logStep('3', 'Validating PWA features');
  
  try {
    // Check manifest.json
    const manifestResponse = await fetch(`${CONFIG.siteUrl}/manifest.json`);
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      
      if (manifest.name && manifest.short_name && manifest.icons) {
        logSuccess('PWA manifest is valid');
      } else {
        logWarning('PWA manifest is incomplete');
      }
    } else {
      logError('PWA manifest not found');
    }
    
    // Check service worker
    const swResponse = await fetch(`${CONFIG.siteUrl}/sw.js`);
    if (swResponse.ok) {
      logSuccess('Service worker is available');
    } else {
      logWarning('Service worker not found');
    }
    
  } catch (error) {
    logError(`Failed to validate PWA features: ${error.message}`);
  }
}

function validateFirebaseConfiguration() {
  logStep('4', 'Validating Firebase configuration');
  
  try {
    // Check Firebase project configuration
    const result = execSync(`firebase projects:list --json`, { encoding: 'utf8' });
    const projects = JSON.parse(result);
    
    const currentProject = projects.find(p => p.projectId === CONFIG.projectId);
    if (currentProject) {
      logSuccess(`Firebase project ${CONFIG.projectId} is configured`);
    } else {
      logError(`Firebase project ${CONFIG.projectId} not found`);
    }
    
    // Check Firestore rules deployment
    try {
      execSync(`firebase firestore:rules:get --project ${CONFIG.projectId}`, { stdio: 'pipe' });
      logSuccess('Firestore rules are deployed');
    } catch (error) {
      logWarning('Could not verify Firestore rules deployment');
    }
    
    // Check Storage rules deployment
    try {
      execSync(`firebase storage:rules:get --project ${CONFIG.projectId}`, { stdio: 'pipe' });
      logSuccess('Storage rules are deployed');
    } catch (error) {
      logWarning('Could not verify Storage rules deployment');
    }
    
  } catch (error) {
    logError(`Firebase configuration validation failed: ${error.message}`);
  }
}

function validateEnvironmentConfiguration() {
  logStep('5', 'Validating environment configuration');
  
  const requiredFiles = [
    '.env.production',
    '.env.production.local',
    'firebase.json',
    'firestore.rules',
    'storage.rules',
    'firestore.indexes.json'
  ];
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      logSuccess(`${file} exists`);
    } else {
      logWarning(`${file} not found`);
    }
  }
  
  // Validate package.json scripts
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['build', 'test', 'deploy'];
  
  for (const script of requiredScripts) {
    if (packageJson.scripts && packageJson.scripts[script]) {
      logSuccess(`npm script '${script}' is configured`);
    } else {
      logWarning(`npm script '${script}' is missing`);
    }
  }
}

async function performPerformanceCheck() {
  logStep('6', 'Performing basic performance check');
  
  try {
    const startTime = Date.now();
    const response = await fetch(CONFIG.siteUrl);
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    
    if (loadTime < 2000) {
      logSuccess(`Site loads in ${loadTime}ms (Good)`);
    } else if (loadTime < 5000) {
      logWarning(`Site loads in ${loadTime}ms (Acceptable)`);
    } else {
      logError(`Site loads in ${loadTime}ms (Slow)`);
    }
    
    // Check content size
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const sizeKB = Math.round(parseInt(contentLength) / 1024);
      if (sizeKB < 500) {
        logSuccess(`Initial page size: ${sizeKB}KB (Good)`);
      } else {
        logWarning(`Initial page size: ${sizeKB}KB (Consider optimization)`);
      }
    }
    
  } catch (error) {
    logError(`Performance check failed: ${error.message}`);
  }
}

function generateValidationReport() {
  logStep('7', 'Generating validation report');
  
  const validationReport = {
    timestamp: new Date().toISOString(),
    projectId: CONFIG.projectId,
    siteUrl: CONFIG.siteUrl,
    environment: 'production',
    validationResults: {
      siteAccessibility: 'checked',
      securityHeaders: 'checked',
      pwaFeatures: 'checked',
      firebaseConfiguration: 'checked',
      environmentConfiguration: 'checked',
      performanceCheck: 'checked'
    },
    recommendations: [
      'Perform manual testing of all equipment management features',
      'Test image upload functionality with various file types',
      'Verify search and filtering performance with large datasets',
      'Test mobile responsiveness on different devices',
      'Validate QR code generation and scanning',
      'Test bulk operations with multiple items',
      'Verify export functionality for different formats',
      'Check audit logging and permission controls'
    ],
    nextSteps: [
      'Monitor application performance and error rates',
      'Set up automated monitoring and alerting',
      'Schedule regular security audits',
      'Plan for database backup and disaster recovery',
      'Document operational procedures'
    ]
  };
  
  const reportPath = path.join(__dirname, '..', 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(validationReport, null, 2));
  
  logSuccess(`Validation report generated: ${reportPath}`);
}

// Main validation process
async function main() {
  log('🔍 Starting Equipment Management System Production Validation', 'bright');
  log('==============================================================', 'bright');
  
  try {
    await checkSiteAccessibility();
    await validateSecurityHeaders();
    await validatePWAFeatures();
    validateFirebaseConfiguration();
    validateEnvironmentConfiguration();
    await performPerformanceCheck();
    generateValidationReport();
    
    log('\n✅ Production validation completed!', 'green');
    log('📋 Please review the validation report and perform manual testing', 'yellow');
    log('🔗 Site URL: ' + CONFIG.siteUrl, 'blue');
    
  } catch (error) {
    logError(`Validation failed: ${error.message}`);
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