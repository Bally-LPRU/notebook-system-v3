#!/usr/bin/env node

/**
 * Production Deployment Script
 * This script handles the complete deployment process for the Equipment Lending System
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n${colors.blue}📋 ${description}${colors.reset}`);
  log(`${colors.cyan}Running: ${command}${colors.reset}`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    log(`${colors.green}✅ ${description} completed successfully${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ ${description} failed${colors.reset}`);
    log(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

function checkEnvironmentVariables() {
  log(`\n${colors.yellow}🔍 Checking environment variables...${colors.reset}`);
  
  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID'
  ];
  
  const missing = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    log(`${colors.red}❌ Missing required environment variables:${colors.reset}`);
    missing.forEach(varName => {
      log(`${colors.red}   - ${varName}${colors.reset}`);
    });
    log(`${colors.yellow}💡 Please set these variables in your .env.production file or CI/CD environment${colors.reset}`);
    process.exit(1);
  }
  
  log(`${colors.green}✅ All required environment variables are set${colors.reset}`);
}

function checkFirebaseProject() {
  log(`\n${colors.yellow}🔍 Checking Firebase project configuration...${colors.reset}`);
  
  try {
    const result = execSync('firebase projects:list', { encoding: 'utf8' });
    const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
    
    if (!result.includes(projectId)) {
      log(`${colors.red}❌ Firebase project '${projectId}' not found or not accessible${colors.reset}`);
      log(`${colors.yellow}💡 Please ensure you're logged in and have access to the project${colors.reset}`);
      process.exit(1);
    }
    
    log(`${colors.green}✅ Firebase project '${projectId}' is accessible${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Failed to check Firebase project: ${error.message}${colors.reset}`);
    log(`${colors.yellow}💡 Please ensure Firebase CLI is installed and you're logged in${colors.reset}`);
    process.exit(1);
  }
}

function runPreDeploymentChecks() {
  log(`${colors.bright}${colors.magenta}🚀 Starting Production Deployment${colors.reset}`);
  log(`${colors.yellow}⚠️  This will deploy to PRODUCTION environment${colors.reset}`);
  
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    log(`${colors.red}❌ package.json not found. Please run this script from the project root directory${colors.reset}`);
    process.exit(1);
  }
  
  checkEnvironmentVariables();
  checkFirebaseProject();
}

function buildApplication() {
  // Set production environment
  process.env.REACT_APP_ENVIRONMENT = 'production';
  process.env.GENERATE_SOURCEMAP = 'false';
  
  execCommand('npm run build', 'Building application for production');
  
  // Verify build output
  if (!fs.existsSync('build/index.html')) {
    log(`${colors.red}❌ Build output not found. Build may have failed${colors.reset}`);
    process.exit(1);
  }
  
  log(`${colors.green}✅ Build output verified${colors.reset}`);
}

function deployToFirebase() {
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  
  execCommand(
    `firebase use ${projectId}`,
    `Switching to production project: ${projectId}`
  );
  
  execCommand(
    'firebase deploy --only firestore:rules',
    'Deploying Firestore security rules'
  );
  
  execCommand(
    'firebase deploy --only firestore:indexes',
    'Deploying Firestore indexes'
  );
  
  execCommand(
    'firebase deploy --only storage',
    'Deploying Storage security rules'
  );
  
  execCommand(
    'firebase deploy --only hosting',
    'Deploying application to Firebase Hosting'
  );
}

function runPostDeploymentChecks() {
  log(`\n${colors.yellow}🔍 Running post-deployment checks...${colors.reset}`);
  
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  const hostingUrl = `https://${projectId}.web.app`;
  
  log(`${colors.green}✅ Deployment completed successfully!${colors.reset}`);
  log(`${colors.cyan}🌐 Application URL: ${hostingUrl}${colors.reset}`);
  log(`${colors.cyan}📊 Firebase Console: https://console.firebase.google.com/project/${projectId}${colors.reset}`);
  
  log(`\n${colors.yellow}📋 Post-deployment checklist:${colors.reset}`);
  log(`${colors.yellow}   1. Test user authentication${colors.reset}`);
  log(`${colors.yellow}   2. Verify equipment management functions${colors.reset}`);
  log(`${colors.yellow}   3. Test loan request workflow${colors.reset}`);
  log(`${colors.yellow}   4. Check notification system${colors.reset}`);
  log(`${colors.yellow}   5. Verify admin functions${colors.reset}`);
  log(`${colors.yellow}   6. Test on different devices/browsers${colors.reset}`);
}

// Main deployment process
async function main() {
  try {
    runPreDeploymentChecks();
    buildApplication();
    deployToFirebase();
    runPostDeploymentChecks();
  } catch (error) {
    log(`${colors.red}❌ Deployment failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the deployment
main();