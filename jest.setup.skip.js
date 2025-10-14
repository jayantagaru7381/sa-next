/**
 * Jest Test Skipping Configuration
 * 
 * This module provides flexible test skipping capabilities based on:
 * - Environment variables (SKIP_TESTS, SKIP_FAILING_TESTS)
 * - Test patterns (SKIP_TEST_PATTERN)
 * - Test file paths (SKIP_TEST_FILES)
 * - Specific test suites (SKIP_TEST_SUITES)
 */

// Check for skip configurations
const skipAllTests = process.env.SKIP_TESTS === 'true';
const skipFailingTests = process.env.SKIP_FAILING_TESTS === 'true';
const skipPattern = process.env.SKIP_TEST_PATTERN;
const skipFiles = process.env.SKIP_TEST_FILES?.split(',').map(f => f.trim());
const skipSuites = process.env.SKIP_TEST_SUITES?.split(',').map(s => s.trim());
const runOnlyPattern = process.env.RUN_ONLY_PATTERN;
const runOnlyFiles = process.env.RUN_ONLY_FILES?.split(',').map(f => f.trim());

// Track skipped tests for reporting
let skippedTests = [];
let skippedSuites = [];

// Store original test functions
const originalDescribe = global.describe;
const originalTest = global.test;
const originalIt = global.it;

// Helper to check if current file should be skipped
const shouldSkipFile = (testPath) => {
  if (!testPath) return false;
  
  // If RUN_ONLY is set, skip everything except specified
  if (runOnlyFiles && runOnlyFiles.length > 0) {
    return !runOnlyFiles.some(file => testPath.includes(file));
  }
  
  // Check if file is in skip list
  if (skipFiles && skipFiles.length > 0) {
    return skipFiles.some(file => testPath.includes(file));
  }
  
  return false;
};

// Helper to check if test should be skipped
const shouldSkipTest = (testName) => {
  // If RUN_ONLY is set, skip everything except matching pattern
  if (runOnlyPattern) {
    const regex = new RegExp(runOnlyPattern, 'i');
    return !regex.test(testName);
  }
  
  // Skip all tests if flag is set
  if (skipAllTests) return true;
  
  // Skip tests matching pattern
  if (skipPattern) {
    const regex = new RegExp(skipPattern, 'i');
    return regex.test(testName);
  }
  
  return false;
};

// Helper to check if suite should be skipped
const shouldSkipSuite = (suiteName) => {
  // Skip suites in the skip list
  if (skipSuites && skipSuites.length > 0) {
    return skipSuites.some(suite => suiteName.includes(suite));
  }
  
  return false;
};

// Override describe function
global.describe = function(suiteName, fn) {
  const currentFile = expect.getState()?.testPath;
  
  // Check if entire file should be skipped
  if (shouldSkipFile(currentFile)) {
    skippedSuites.push(`${suiteName} (file: ${currentFile})`);
    return originalDescribe.skip(suiteName, fn);
  }
  
  // Check if specific suite should be skipped
  if (shouldSkipSuite(suiteName)) {
    skippedSuites.push(suiteName);
    return originalDescribe.skip(suiteName, fn);
  }
  
  // Check for failing test marker in suite name
  if (skipFailingTests && (suiteName.includes('[FAILING]') || suiteName.includes('[FLAKY]'))) {
    skippedSuites.push(`${suiteName} (marked as failing/flaky)`);
    return originalDescribe.skip(suiteName, fn);
  }
  
  return originalDescribe(suiteName, fn);
};

// Override test/it functions
const createTestWrapper = (originalFn) => {
  return function(testName, fn, timeout) {
    const currentFile = expect.getState()?.testPath;
    
    // Check if file should be skipped
    if (shouldSkipFile(currentFile)) {
      skippedTests.push(`${testName} (file skipped)`);
      return originalFn.skip(testName, fn, timeout);
    }
    
    // Check if test should be skipped
    if (shouldSkipTest(testName)) {
      skippedTests.push(testName);
      return originalFn.skip(testName, fn, timeout);
    }
    
    // Check for failing test marker
    if (skipFailingTests && (testName.includes('[FAILING]') || testName.includes('[FLAKY]'))) {
      skippedTests.push(`${testName} (marked as failing/flaky)`);
      return originalFn.skip(testName, fn, timeout);
    }
    
    return originalFn(testName, fn, timeout);
  };
};

global.test = createTestWrapper(originalTest);
global.it = createTestWrapper(originalIt);

// Preserve skip and only methods
global.describe.skip = originalDescribe.skip;
global.describe.only = originalDescribe.only;
global.test.skip = originalTest.skip;
global.test.only = originalTest.only;
global.it.skip = originalIt.skip;
global.it.only = originalIt.only;

// Log skip configuration at startup
const logSkipConfiguration = () => {
  const configs = [];
  
  if (skipAllTests) configs.push('SKIP ALL TESTS');
  if (skipFailingTests) configs.push('SKIP FAILING/FLAKY TESTS');
  if (skipPattern) configs.push(`SKIP PATTERN: "${skipPattern}"`);
  if (skipFiles?.length) configs.push(`SKIP FILES: ${skipFiles.join(', ')}`);
  if (skipSuites?.length) configs.push(`SKIP SUITES: ${skipSuites.join(', ')}`);
  if (runOnlyPattern) configs.push(`RUN ONLY PATTERN: "${runOnlyPattern}"`);
  if (runOnlyFiles?.length) configs.push(`RUN ONLY FILES: ${runOnlyFiles.join(', ')}`);
  
  if (configs.length > 0) {
    console.log('\n🔄 Test Skip Configuration Active:');
    configs.forEach(config => console.log(`   - ${config}`));
    console.log('');
  } else {
    console.log('✅ All tests will run (no skip configuration detected)\n');
  }
};

// Log configuration once
if (typeof global.testSkipConfigLogged === 'undefined') {
  global.testSkipConfigLogged = true;
  logSkipConfiguration();
}

// Report skipped tests at the end
if (typeof afterAll !== 'undefined') {
  afterAll(() => {
    if (skippedTests.length > 0 || skippedSuites.length > 0) {
      console.log('\n📊 Test Skip Summary:');
      if (skippedSuites.length > 0) {
        console.log(`   Skipped ${skippedSuites.length} test suites`);
      }
      if (skippedTests.length > 0) {
        console.log(`   Skipped ${skippedTests.length} individual tests`);
      }
    }
  });
}

module.exports = {
  shouldSkipFile,
  shouldSkipTest,
  shouldSkipSuite,
  getSkippedTests: () => skippedTests,
  getSkippedSuites: () => skippedSuites,
};