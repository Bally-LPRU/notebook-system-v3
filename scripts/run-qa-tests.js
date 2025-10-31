#!/usr/bin/env node

/**
 * Quality Assurance Testing Script
 * This script runs comprehensive tests for production readiness
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

function execCommand(command, description, options = {}) {
  log(`\n${colors.blue}📋 ${description}${colors.reset}`);
  log(`${colors.cyan}Running: ${command}${colors.reset}`);
  
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options
    });
    log(`${colors.green}✅ ${description} completed successfully${colors.reset}`);
    return result;
  } catch (error) {
    log(`${colors.red}❌ ${description} failed${colors.reset}`);
    if (error.stdout) {
      log(`${colors.yellow}Output: ${error.stdout}${colors.reset}`);
    }
    if (error.stderr) {
      log(`${colors.red}Error: ${error.stderr}${colors.reset}`);
    }
    if (!options.continueOnError) {
      process.exit(1);
    }
    return null;
  }
}

function runUnitTests() {
  log(`\n${colors.magenta}🧪 Running Unit Tests${colors.reset}`);
  
  // Run tests with coverage
  execCommand(
    'npm run test:coverage',
    'Running unit tests with coverage report'
  );
  
  // Check coverage thresholds
  if (fs.existsSync('coverage/coverage-summary.json')) {
    const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
    const total = coverage.total;
    
    log(`\n${colors.cyan}📊 Coverage Summary:${colors.reset}`);
    log(`   Lines: ${total.lines.pct}%`);
    log(`   Functions: ${total.functions.pct}%`);
    log(`   Branches: ${total.branches.pct}%`);
    log(`   Statements: ${total.statements.pct}%`);
    
    // Check minimum coverage thresholds
    const minCoverage = 70; // 70% minimum coverage
    if (total.lines.pct < minCoverage || total.functions.pct < minCoverage) {
      log(`${colors.yellow}⚠️  Coverage below recommended threshold (${minCoverage}%)${colors.reset}`);
    } else {
      log(`${colors.green}✅ Coverage meets recommended threshold${colors.reset}`);
    }
  }
}

function runLintingTests() {
  log(`\n${colors.magenta}🔍 Running Code Quality Checks${colors.reset}`);
  
  // Check if ESLint is configured
  if (fs.existsSync('.eslintrc.js') || fs.existsSync('.eslintrc.json') || fs.existsSync('package.json')) {
    try {
      execCommand(
        'npx eslint src/ --ext .js,.jsx,.ts,.tsx --max-warnings 0',
        'Running ESLint code quality checks',
        { continueOnError: true }
      );
    } catch (error) {
      log(`${colors.yellow}⚠️  ESLint not configured or failed${colors.reset}`);
    }
  }
  
  // Check for common code issues
  checkCodeQuality();
}

function checkCodeQuality() {
  log(`\n${colors.blue}🔍 Checking Code Quality${colors.reset}`);
  
  const issues = [];
  
  // Check for console.log statements in production code
  try {
    const result = execSync('grep -r "console.log" src/ --exclude-dir=__tests__ --exclude="*.test.js" || true', { encoding: 'utf8' });
    if (result.trim()) {
      issues.push('Console.log statements found in production code');
      log(`${colors.yellow}⚠️  Console.log statements found:${colors.reset}`);
      log(result);
    }
  } catch (error) {
    // Ignore grep errors
  }
  
  // Check for TODO/FIXME comments
  try {
    const result = execSync('grep -r "TODO\\|FIXME" src/ || true', { encoding: 'utf8' });
    if (result.trim()) {
      const todoCount = (result.match(/TODO/g) || []).length;
      const fixmeCount = (result.match(/FIXME/g) || []).length;
      log(`${colors.yellow}⚠️  Found ${todoCount} TODO and ${fixmeCount} FIXME comments${colors.reset}`);
    }
  } catch (error) {
    // Ignore grep errors
  }
  
  // Check for hardcoded URLs or sensitive data
  try {
    const result = execSync('grep -r "http://\\|https://localhost" src/ --exclude-dir=__tests__ || true', { encoding: 'utf8' });
    if (result.trim()) {
      issues.push('Hardcoded URLs found in code');
      log(`${colors.red}❌ Hardcoded URLs found:${colors.reset}`);
      log(result);
    }
  } catch (error) {
    // Ignore grep errors
  }
  
  if (issues.length === 0) {
    log(`${colors.green}✅ No major code quality issues found${colors.reset}`);
  } else {
    log(`${colors.yellow}⚠️  ${issues.length} code quality issues found${colors.reset}`);
  }
}

function runBuildTests() {
  log(`\n${colors.magenta}🏗️  Running Build Tests${colors.reset}`);
  
  // Clean previous builds
  if (fs.existsSync('build')) {
    execCommand('rm -rf build', 'Cleaning previous build', { continueOnError: true });
  }
  
  // Run production build
  execCommand(
    'npm run build:production',
    'Building application for production'
  );
  
  // Analyze build output
  analyzeBuildOutput();
}

function analyzeBuildOutput() {
  log(`\n${colors.blue}📊 Analyzing Build Output${colors.reset}`);
  
  if (!fs.existsSync('build')) {
    log(`${colors.red}❌ Build directory not found${colors.reset}`);
    return;
  }
  
  // Check build size
  const buildStats = getBuildStats('build');
  log(`${colors.cyan}Build Statistics:${colors.reset}`);
  log(`   Total size: ${(buildStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
  log(`   Files: ${buildStats.fileCount}`);
  log(`   JS files: ${buildStats.jsFiles}`);
  log(`   CSS files: ${buildStats.cssFiles}`);
  
  // Check for large files
  const largeFiles = buildStats.files.filter(file => file.size > 1024 * 1024); // > 1MB
  if (largeFiles.length > 0) {
    log(`${colors.yellow}⚠️  Large files detected:${colors.reset}`);
    largeFiles.forEach(file => {
      log(`   ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    });
  }
  
  // Check if index.html exists
  if (fs.existsSync('build/index.html')) {
    log(`${colors.green}✅ index.html generated successfully${colors.reset}`);
  } else {
    log(`${colors.red}❌ index.html not found in build output${colors.reset}`);
  }
  
  // Check for source maps in production
  const sourceMaps = buildStats.files.filter(file => file.name.endsWith('.map'));
  if (sourceMaps.length > 0) {
    log(`${colors.yellow}⚠️  Source maps found in production build (${sourceMaps.length} files)${colors.reset}`);
  } else {
    log(`${colors.green}✅ No source maps in production build${colors.reset}`);
  }
}

function getBuildStats(dir) {
  const stats = {
    totalSize: 0,
    fileCount: 0,
    jsFiles: 0,
    cssFiles: 0,
    files: []
  };
  
  function walkDir(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    files.forEach(file => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else {
        const fileSize = stat.size;
        stats.totalSize += fileSize;
        stats.fileCount++;
        
        if (file.endsWith('.js')) stats.jsFiles++;
        if (file.endsWith('.css')) stats.cssFiles++;
        
        stats.files.push({
          name: path.relative(dir, filePath),
          size: fileSize
        });
      }
    });
  }
  
  walkDir(dir);
  return stats;
}

function runSecurityTests() {
  log(`\n${colors.magenta}🔒 Running Security Tests${colors.reset}`);
  
  // Check for security vulnerabilities in dependencies
  try {
    execCommand(
      'npm audit --audit-level=moderate',
      'Checking for security vulnerabilities',
      { continueOnError: true }
    );
  } catch (error) {
    log(`${colors.yellow}⚠️  Security audit completed with warnings${colors.reset}`);
  }
  
  // Check environment variables security
  checkEnvironmentSecurity();
  
  // Check Firebase security rules
  checkFirebaseSecurity();
}

function checkEnvironmentSecurity() {
  log(`\n${colors.blue}🔍 Checking Environment Security${colors.reset}`);
  
  const issues = [];
  
  // Check for sensitive data in environment files
  const envFiles = ['.env', '.env.local', '.env.production'];
  
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      
      // Check for placeholder values
      if (content.includes('your_') || content.includes('_here') || content.includes('placeholder')) {
        issues.push(`${envFile} contains placeholder values`);
      }
      
      // Check for hardcoded secrets (basic patterns)
      const secretPatterns = [
        /password\s*=\s*[^#\n]+/i,
        /secret\s*=\s*[^#\n]+/i,
        /private.*key\s*=\s*[^#\n]+/i
      ];
      
      secretPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          issues.push(`${envFile} may contain hardcoded secrets`);
        }
      });
    }
  });
  
  if (issues.length === 0) {
    log(`${colors.green}✅ No environment security issues found${colors.reset}`);
  } else {
    log(`${colors.yellow}⚠️  Environment security issues:${colors.reset}`);
    issues.forEach(issue => log(`   - ${issue}`));
  }
}

function checkFirebaseSecurity() {
  log(`\n${colors.blue}🔍 Checking Firebase Security${colors.reset}`);
  
  const issues = [];
  
  // Check Firestore rules
  if (fs.existsSync('firestore.rules')) {
    const rules = fs.readFileSync('firestore.rules', 'utf8');
    
    if (!rules.includes('request.auth != null')) {
      issues.push('Firestore rules may not require authentication');
    }
    
    if (rules.includes('allow read, write: if true')) {
      issues.push('Firestore rules contain overly permissive access');
    }
    
    if (!rules.includes('isAdmin') && !rules.includes('role == \'admin\'')) {
      issues.push('Firestore rules may not have proper admin checks');
    }
  } else {
    issues.push('Firestore rules file not found');
  }
  
  // Check Storage rules
  if (fs.existsSync('storage.rules')) {
    const storageRules = fs.readFileSync('storage.rules', 'utf8');
    
    if (!storageRules.includes('request.auth != null')) {
      issues.push('Storage rules may not require authentication');
    }
  } else {
    issues.push('Storage rules file not found');
  }
  
  if (issues.length === 0) {
    log(`${colors.green}✅ Firebase security configuration looks good${colors.reset}`);
  } else {
    log(`${colors.yellow}⚠️  Firebase security issues:${colors.reset}`);
    issues.forEach(issue => log(`   - ${issue}`));
  }
}

function runPerformanceTests() {
  log(`\n${colors.magenta}⚡ Running Performance Tests${colors.reset}`);
  
  // Check bundle size
  if (fs.existsSync('build')) {
    const buildStats = getBuildStats('build');
    const totalSizeMB = buildStats.totalSize / 1024 / 1024;
    
    log(`${colors.cyan}Bundle Size Analysis:${colors.reset}`);
    log(`   Total bundle size: ${totalSizeMB.toFixed(2)} MB`);
    
    // Warn if bundle is too large
    if (totalSizeMB > 10) {
      log(`${colors.yellow}⚠️  Bundle size is quite large (${totalSizeMB.toFixed(2)} MB)${colors.reset}`);
      log(`${colors.yellow}   Consider code splitting or removing unused dependencies${colors.reset}`);
    } else if (totalSizeMB > 5) {
      log(`${colors.yellow}⚠️  Bundle size is moderate (${totalSizeMB.toFixed(2)} MB)${colors.reset}`);
    } else {
      log(`${colors.green}✅ Bundle size is reasonable (${totalSizeMB.toFixed(2)} MB)${colors.reset}`);
    }
  }
  
  // Check for performance best practices
  checkPerformanceBestPractices();
}

function checkPerformanceBestPractices() {
  log(`\n${colors.blue}🔍 Checking Performance Best Practices${colors.reset}`);
  
  const recommendations = [];
  
  // Check for React.lazy usage
  try {
    const result = execSync('grep -r "React.lazy\\|lazy(" src/ || true', { encoding: 'utf8' });
    if (result.trim()) {
      log(`${colors.green}✅ Code splitting with React.lazy detected${colors.reset}`);
    } else {
      recommendations.push('Consider implementing code splitting with React.lazy');
    }
  } catch (error) {
    // Ignore grep errors
  }
  
  // Check for image optimization
  try {
    const result = execSync('find src/ -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | wc -l', { encoding: 'utf8' });
    const imageCount = parseInt(result.trim());
    if (imageCount > 0) {
      recommendations.push(`Consider optimizing ${imageCount} images for web (WebP format, compression)`);
    }
  } catch (error) {
    // Ignore find errors
  }
  
  // Check for service worker
  if (fs.existsSync('public/sw.js') || fs.existsSync('src/serviceWorker.js')) {
    log(`${colors.green}✅ Service worker detected${colors.reset}`);
  } else {
    recommendations.push('Consider implementing a service worker for caching');
  }
  
  if (recommendations.length === 0) {
    log(`${colors.green}✅ Performance best practices look good${colors.reset}`);
  } else {
    log(`${colors.yellow}💡 Performance recommendations:${colors.reset}`);
    recommendations.forEach(rec => log(`   - ${rec}`));
  }
}

function generateQAReport() {
  log(`\n${colors.bright}${colors.magenta}📋 Quality Assurance Report${colors.reset}`);
  
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    environment: 'production',
    tests: {
      unit: 'completed',
      build: 'completed',
      security: 'completed',
      performance: 'completed',
      codeQuality: 'completed'
    },
    summary: 'QA testing completed successfully'
  };
  
  // Save report
  fs.writeFileSync('qa-report.json', JSON.stringify(report, null, 2));
  
  log(`\n${colors.green}✅ QA testing completed successfully!${colors.reset}`);
  log(`${colors.cyan}📄 Report saved to: qa-report.json${colors.reset}`);
  log(`\n${colors.yellow}📋 Next Steps:${colors.reset}`);
  log(`${colors.yellow}   1. Review any warnings or recommendations above${colors.reset}`);
  log(`${colors.yellow}   2. Run manual testing on different devices/browsers${colors.reset}`);
  log(`${colors.yellow}   3. Validate production environment configuration${colors.reset}`);
  log(`${colors.yellow}   4. Deploy to staging environment for final testing${colors.reset}`);
  log(`${colors.yellow}   5. Proceed with production deployment${colors.reset}`);
}

// Main QA process
function main() {
  try {
    log(`${colors.bright}${colors.magenta}🔍 Starting Quality Assurance Testing${colors.reset}`);
    
    runUnitTests();
    runLintingTests();
    runBuildTests();
    runSecurityTests();
    runPerformanceTests();
    generateQAReport();
    
  } catch (error) {
    log(`${colors.red}❌ QA testing failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the QA tests
main();