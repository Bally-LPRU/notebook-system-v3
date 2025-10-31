#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * This script validates the production environment setup
 */

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

function validateEnvironmentVariables() {
  log(`\n${colors.blue}🔍 Validating Environment Variables${colors.reset}`);
  
  const requiredVars = [
    'REACT_APP_ENVIRONMENT',
    'REACT_APP_FIREBASE_API_KEY_PROD',
    'REACT_APP_FIREBASE_AUTH_DOMAIN_PROD',
    'REACT_APP_FIREBASE_PROJECT_ID_PROD',
    'REACT_APP_FIREBASE_STORAGE_BUCKET_PROD',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID_PROD',
    'REACT_APP_FIREBASE_APP_ID_PROD'
  ];
  
  const optionalVars = [
    'REACT_APP_FIREBASE_MEASUREMENT_ID_PROD'
  ];
  
  let allValid = true;
  
  // Check required variables
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      log(`${colors.red}❌ Missing required variable: ${varName}${colors.reset}`);
      allValid = false;
    } else if (value.includes('your_') || value.includes('_here')) {
      log(`${colors.yellow}⚠️  Variable ${varName} appears to have placeholder value${colors.reset}`);
      allValid = false;
    } else {
      log(`${colors.green}✅ ${varName}: ${value.substring(0, 10)}...${colors.reset}`);
    }
  });
  
  // Check optional variables
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      log(`${colors.green}✅ ${varName}: ${value.substring(0, 10)}...${colors.reset}`);
    } else {
      log(`${colors.yellow}⚠️  Optional variable ${varName} not set${colors.reset}`);
    }
  });
  
  // Validate environment setting
  const environment = process.env.REACT_APP_ENVIRONMENT;
  if (environment !== 'production') {
    log(`${colors.red}❌ REACT_APP_ENVIRONMENT should be 'production', got '${environment}'${colors.reset}`);
    allValid = false;
  }
  
  // Validate emulator setting
  const useEmulator = process.env.REACT_APP_USE_EMULATOR;
  if (useEmulator === 'true') {
    log(`${colors.red}❌ REACT_APP_USE_EMULATOR should be 'false' in production${colors.reset}`);
    allValid = false;
  }
  
  return allValid;
}

function validateFirebaseConfig() {
  log(`\n${colors.blue}🔍 Validating Firebase Configuration${colors.reset}`);
  
  let allValid = true;
  
  // Check if firebase.json exists
  if (!fs.existsSync('firebase.json')) {
    log(`${colors.red}❌ firebase.json not found${colors.reset}`);
    return false;
  }
  
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
    
    // Check hosting configuration
    if (!firebaseConfig.hosting) {
      log(`${colors.red}❌ Hosting configuration missing in firebase.json${colors.reset}`);
      allValid = false;
    } else {
      log(`${colors.green}✅ Hosting configuration found${colors.reset}`);
      
      // Check public directory
      if (firebaseConfig.hosting.public !== 'build') {
        log(`${colors.yellow}⚠️  Hosting public directory is '${firebaseConfig.hosting.public}', expected 'build'${colors.reset}`);
      }
      
      // Check rewrites for SPA
      if (!firebaseConfig.hosting.rewrites || firebaseConfig.hosting.rewrites.length === 0) {
        log(`${colors.yellow}⚠️  No rewrites configured for SPA routing${colors.reset}`);
      } else {
        log(`${colors.green}✅ SPA rewrites configured${colors.reset}`);
      }
      
      // Check security headers
      if (!firebaseConfig.hosting.headers || firebaseConfig.hosting.headers.length === 0) {
        log(`${colors.yellow}⚠️  No security headers configured${colors.reset}`);
      } else {
        log(`${colors.green}✅ Security headers configured${colors.reset}`);
      }
    }
    
    // Check Firestore configuration
    if (!firebaseConfig.firestore) {
      log(`${colors.red}❌ Firestore configuration missing in firebase.json${colors.reset}`);
      allValid = false;
    } else {
      log(`${colors.green}✅ Firestore configuration found${colors.reset}`);
    }
    
    // Check Storage configuration
    if (!firebaseConfig.storage) {
      log(`${colors.red}❌ Storage configuration missing in firebase.json${colors.reset}`);
      allValid = false;
    } else {
      log(`${colors.green}✅ Storage configuration found${colors.reset}`);
    }
    
  } catch (error) {
    log(`${colors.red}❌ Error reading firebase.json: ${error.message}${colors.reset}`);
    allValid = false;
  }
  
  return allValid;
}

function validateSecurityRules() {
  log(`\n${colors.blue}🔍 Validating Security Rules${colors.reset}`);
  
  let allValid = true;
  
  // Check Firestore rules
  if (!fs.existsSync('firestore.rules')) {
    log(`${colors.red}❌ firestore.rules not found${colors.reset}`);
    allValid = false;
  } else {
    const rulesContent = fs.readFileSync('firestore.rules', 'utf8');
    
    // Check for basic security patterns
    if (!rulesContent.includes('request.auth != null')) {
      log(`${colors.red}❌ Firestore rules don't seem to require authentication${colors.reset}`);
      allValid = false;
    } else {
      log(`${colors.green}✅ Firestore rules require authentication${colors.reset}`);
    }
    
    if (!rulesContent.includes('isAdmin()') && !rulesContent.includes('role == \'admin\'')) {
      log(`${colors.yellow}⚠️  Firestore rules don't seem to have admin role checks${colors.reset}`);
    } else {
      log(`${colors.green}✅ Firestore rules include admin role checks${colors.reset}`);
    }
  }
  
  // Check Storage rules
  if (!fs.existsSync('storage.rules')) {
    log(`${colors.red}❌ storage.rules not found${colors.reset}`);
    allValid = false;
  } else {
    const storageRulesContent = fs.readFileSync('storage.rules', 'utf8');
    
    if (!storageRulesContent.includes('request.auth != null')) {
      log(`${colors.red}❌ Storage rules don't seem to require authentication${colors.reset}`);
      allValid = false;
    } else {
      log(`${colors.green}✅ Storage rules require authentication${colors.reset}`);
    }
  }
  
  return allValid;
}

function validateBuildConfiguration() {
  log(`\n${colors.blue}🔍 Validating Build Configuration${colors.reset}`);
  
  let allValid = true;
  
  // Check package.json
  if (!fs.existsSync('package.json')) {
    log(`${colors.red}❌ package.json not found${colors.reset}`);
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check for production build script
    if (!packageJson.scripts || !packageJson.scripts['build:production']) {
      log(`${colors.yellow}⚠️  No build:production script found${colors.reset}`);
    } else {
      log(`${colors.green}✅ Production build script configured${colors.reset}`);
    }
    
    // Check for deployment scripts
    if (!packageJson.scripts['deploy:production']) {
      log(`${colors.yellow}⚠️  No deploy:production script found${colors.reset}`);
    } else {
      log(`${colors.green}✅ Production deployment script configured${colors.reset}`);
    }
    
    // Check dependencies
    const requiredDeps = ['firebase', 'react', 'react-dom', 'react-router-dom'];
    requiredDeps.forEach(dep => {
      if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
        log(`${colors.red}❌ Missing required dependency: ${dep}${colors.reset}`);
        allValid = false;
      } else {
        log(`${colors.green}✅ Dependency ${dep}: ${packageJson.dependencies[dep]}${colors.reset}`);
      }
    });
    
  } catch (error) {
    log(`${colors.red}❌ Error reading package.json: ${error.message}${colors.reset}`);
    allValid = false;
  }
  
  return allValid;
}

function validateProjectStructure() {
  log(`\n${colors.blue}🔍 Validating Project Structure${colors.reset}`);
  
  const requiredFiles = [
    'src/config/firebase.js',
    'src/App.js',
    'src/index.js',
    'public/index.html',
    'firestore.rules',
    'storage.rules',
    'firebase.json',
    '.env.example',
    'DEPLOYMENT.md'
  ];
  
  const requiredDirs = [
    'src/components',
    'src/services',
    'src/contexts',
    'src/hooks',
    'public'
  ];
  
  let allValid = true;
  
  // Check required files
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`${colors.green}✅ ${file}${colors.reset}`);
    } else {
      log(`${colors.red}❌ Missing file: ${file}${colors.reset}`);
      allValid = false;
    }
  });
  
  // Check required directories
  requiredDirs.forEach(dir => {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      log(`${colors.green}✅ ${dir}/${colors.reset}`);
    } else {
      log(`${colors.red}❌ Missing directory: ${dir}${colors.reset}`);
      allValid = false;
    }
  });
  
  return allValid;
}

function generateValidationReport() {
  log(`\n${colors.bright}${colors.magenta}🔍 Production Environment Validation Report${colors.reset}`);
  
  const results = {
    environment: validateEnvironmentVariables(),
    firebase: validateFirebaseConfig(),
    security: validateSecurityRules(),
    build: validateBuildConfiguration(),
    structure: validateProjectStructure()
  };
  
  const allValid = Object.values(results).every(result => result);
  
  log(`\n${colors.bright}📊 Validation Summary:${colors.reset}`);
  Object.entries(results).forEach(([category, isValid]) => {
    const status = isValid ? `${colors.green}✅ PASS` : `${colors.red}❌ FAIL`;
    log(`   ${category.toUpperCase()}: ${status}${colors.reset}`);
  });
  
  if (allValid) {
    log(`\n${colors.green}${colors.bright}🎉 All validations passed! Ready for production deployment.${colors.reset}`);
  } else {
    log(`\n${colors.red}${colors.bright}⚠️  Some validations failed. Please fix the issues before deploying to production.${colors.reset}`);
    process.exit(1);
  }
  
  return allValid;
}

// Main validation process
function main() {
  try {
    generateValidationReport();
  } catch (error) {
    log(`${colors.red}❌ Validation failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the validation
main();