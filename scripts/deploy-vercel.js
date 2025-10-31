#!/usr/bin/env node

/**
 * Vercel Deployment Script
 * This script handles deployment to Vercel with Firebase integration
 */

const { execSync } = require('child_process');
const fs = require('fs');

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

function checkVercelCLI() {
  log(`\n${colors.yellow}🔍 Checking Vercel CLI...${colors.reset}`);
  
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    log(`${colors.green}✅ Vercel CLI is installed${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Vercel CLI not found${colors.reset}`);
    log(`${colors.yellow}💡 Install with: npm install -g vercel${colors.reset}`);
    process.exit(1);
  }
}

function checkEnvironmentVariables() {
  log(`\n${colors.yellow}🔍 Checking environment variables...${colors.reset}`);
  
  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY_PROD',
    'REACT_APP_FIREBASE_AUTH_DOMAIN_PROD',
    'REACT_APP_FIREBASE_PROJECT_ID_PROD',
    'REACT_APP_FIREBASE_STORAGE_BUCKET_PROD',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID_PROD',
    'REACT_APP_FIREBASE_APP_ID_PROD'
  ];
  
  const missing = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    log(`${colors.yellow}⚠️  Missing environment variables (set in Vercel Dashboard):${colors.reset}`);
    missing.forEach(varName => {
      log(`${colors.yellow}   - ${varName}${colors.reset}`);
    });
    log(`\n${colors.cyan}💡 Set these in Vercel Dashboard > Project Settings > Environment Variables${colors.reset}`);
  } else {
    log(`${colors.green}✅ All required environment variables are available${colors.reset}`);
  }
}

function runPreDeploymentChecks() {
  log(`${colors.bright}${colors.magenta}🚀 Starting Vercel Deployment${colors.reset}`);
  
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    log(`${colors.red}❌ package.json not found. Please run this script from the project root directory${colors.reset}`);
    process.exit(1);
  }
  
  checkVercelCLI();
  checkEnvironmentVariables();
}

function buildApplication() {
  // Set production environment
  process.env.REACT_APP_ENVIRONMENT = 'production';
  process.env.GENERATE_SOURCEMAP = 'false';
  
  execCommand('npm run build:production', 'Building application for production');
  
  // Verify build output
  if (!fs.existsSync('build/index.html')) {
    log(`${colors.red}❌ Build output not found. Build may have failed${colors.reset}`);
    process.exit(1);
  }
  
  log(`${colors.green}✅ Build output verified${colors.reset}`);
}

function deployToVercel() {
  const isProduction = process.argv.includes('--prod');
  
  if (isProduction) {
    log(`\n${colors.yellow}⚠️  Deploying to PRODUCTION${colors.reset}`);
    execCommand('vercel --prod', 'Deploying to Vercel Production');
  } else {
    log(`\n${colors.blue}📦 Deploying to Preview${colors.reset}`);
    execCommand('vercel', 'Deploying to Vercel Preview');
  }
}

function runPostDeploymentChecks() {
  log(`\n${colors.yellow}🔍 Running post-deployment checks...${colors.reset}`);
  
  log(`${colors.green}✅ Deployment completed successfully!${colors.reset}`);
  
  log(`\n${colors.yellow}📋 Post-deployment checklist:${colors.reset}`);
  log(`${colors.yellow}   1. Test the deployed application${colors.reset}`);
  log(`${colors.yellow}   2. Verify Firebase connection${colors.reset}`);
  log(`${colors.yellow}   3. Test authentication flow${colors.reset}`);
  log(`${colors.yellow}   4. Check all features work correctly${colors.reset}`);
  log(`${colors.yellow}   5. Monitor for any errors${colors.reset}`);
  
  log(`\n${colors.cyan}💡 Useful commands:${colors.reset}`);
  log(`${colors.cyan}   - View deployments: vercel ls${colors.reset}`);
  log(`${colors.cyan}   - View logs: vercel logs${colors.reset}`);
  log(`${colors.cyan}   - Open project: vercel open${colors.reset}`);
}

// Main deployment process
async function main() {
  try {
    runPreDeploymentChecks();
    buildApplication();
    deployToVercel();
    runPostDeploymentChecks();
  } catch (error) {
    log(`${colors.red}❌ Deployment failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the deployment
main();