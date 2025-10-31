#!/usr/bin/env node

/**
 * Test Runner Script
 * 
 * This script provides utilities for running tests in the equipment lending system.
 * It includes options for running specific test suites, generating coverage reports,
 * and running tests in different modes.
 */

const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  // Test patterns
  patterns: {
    all: '',
    services: 'src/services/__tests__',
    components: 'src/components/__tests__',
    contexts: 'src/contexts/__tests__',
    hooks: 'src/hooks/__tests__',
    utils: 'src/utils/__tests__'
  },
  
  // Jest options
  jestOptions: {
    coverage: '--coverage --coverageDirectory=coverage',
    watch: '--watch',
    watchAll: '--watchAll',
    verbose: '--verbose',
    silent: '--silent',
    updateSnapshots: '--updateSnapshot'
  }
};

/**
 * Run tests with specified options
 * @param {string} pattern - Test pattern to run
 * @param {Array} options - Jest options
 */
function runTests(pattern = '', options = []) {
  const args = ['test'];
  
  if (pattern) {
    args.push(pattern);
  }
  
  args.push(...options);
  
  console.log(`Running tests with command: npm ${args.join(' ')}`);
  
  const testProcess = spawn('npm', args, {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });
  
  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Tests completed successfully!');
    } else {
      console.log(`\n❌ Tests failed with exit code ${code}`);
      process.exit(code);
    }
  });
  
  testProcess.on('error', (error) => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Equipment Lending System - Test Runner

Usage: node test-runner.js [command] [options]

Commands:
  all                 Run all tests
  services           Run service tests only
  components         Run component tests only
  contexts           Run context tests only
  hooks              Run hook tests only
  utils              Run utility tests only
  
Options:
  --coverage         Generate coverage report
  --watch            Run tests in watch mode
  --watch-all        Run all tests in watch mode
  --verbose          Show verbose output
  --silent           Run tests silently
  --update-snapshots Update test snapshots
  --help             Show this help message

Examples:
  node test-runner.js all --coverage
  node test-runner.js services --watch
  node test-runner.js components --verbose
  node test-runner.js --coverage --verbose
`);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  const command = args.find(arg => !arg.startsWith('--')) || 'all';
  const options = args.filter(arg => arg.startsWith('--'));
  
  return { command, options };
}

/**
 * Convert command line options to Jest options
 */
function convertOptions(options) {
  const jestOptions = [];
  
  options.forEach(option => {
    switch (option) {
      case '--coverage':
        jestOptions.push(...TEST_CONFIG.jestOptions.coverage.split(' '));
        break;
      case '--watch':
        jestOptions.push(TEST_CONFIG.jestOptions.watch);
        break;
      case '--watch-all':
        jestOptions.push(TEST_CONFIG.jestOptions.watchAll);
        break;
      case '--verbose':
        jestOptions.push(TEST_CONFIG.jestOptions.verbose);
        break;
      case '--silent':
        jestOptions.push(TEST_CONFIG.jestOptions.silent);
        break;
      case '--update-snapshots':
        jestOptions.push(TEST_CONFIG.jestOptions.updateSnapshots);
        break;
    }
  });
  
  return jestOptions;
}

/**
 * Main execution
 */
function main() {
  const { command, options } = parseArgs();
  
  console.log('🧪 Equipment Lending System Test Runner');
  console.log('========================================\n');
  
  const pattern = TEST_CONFIG.patterns[command] || '';
  const jestOptions = convertOptions(options);
  
  if (!TEST_CONFIG.patterns.hasOwnProperty(command) && command !== 'all') {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Run with --help to see available commands');
    process.exit(1);
  }
  
  console.log(`📋 Running: ${command} tests`);
  if (pattern) {
    console.log(`📁 Pattern: ${pattern}`);
  }
  if (jestOptions.length > 0) {
    console.log(`⚙️  Options: ${jestOptions.join(' ')}`);
  }
  console.log('');
  
  runTests(pattern, jestOptions);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runTests,
  TEST_CONFIG,
  parseArgs,
  convertOptions
};