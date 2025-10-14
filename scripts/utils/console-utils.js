#!/usr/bin/env node

/**
 * Shared Console Utilities
 * Common functions for colored output and banners across all scripts
 */

// ANSI color codes for terminal output
const colors = {
  red: '\x1b[91m',
  yellow: '\x1b[93m',
  green: '\x1b[92m',
  cyan: '\x1b[96m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
};

/**
 * Display prominent banners for different message types
 */
function displayBanner(type, message) {
  const width = 70;
  const line = '═'.repeat(width);
  const padding = ' '.repeat(Math.max(0, (width - message.length - 4) / 2));
  
  if (type === 'error') {
    console.log(`\n${colors.bgRed}${colors.bold}${line}${colors.reset}`);
    console.log(`${colors.bgRed}${colors.bold}${padding}🚨 ${message} 🚨${padding}${colors.reset}`);
    console.log(`${colors.bgRed}${colors.bold}${line}${colors.reset}\n`);
  } else if (type === 'warning') {
    console.log(`\n${colors.bgYellow}${colors.bold}${line}${colors.reset}`);
    console.log(`${colors.bgYellow}${colors.bold}${padding}⚠️  ${message} ⚠️${padding}${colors.reset}`);
    console.log(`${colors.bgYellow}${colors.bold}${line}${colors.reset}\n`);
  } else if (type === 'success') {
    console.log(`\n${colors.green}${colors.bold}✅ ${message}${colors.reset}\n`);
  }
}

/**
 * Format coverage value with color and status
 */
function formatCoverageValue(value, threshold) {
  const color = value >= threshold ? colors.green : colors.red;
  const status = value >= threshold ? '✅' : '❌';
  return `${color}${status} ${value.toFixed(1)}%${colors.reset} (threshold: ${threshold}%)`;
}

/**
 * Log a colored message
 */
function logColored(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Log an error message
 */
function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

/**
 * Log a warning message
 */
function logWarning(message) {
  console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`);
}

/**
 * Log a success message
 */
function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

/**
 * Log an info message
 */
function logInfo(message) {
  console.log(`${colors.cyan}ℹ️ ${message}${colors.reset}`);
}

module.exports = {
  colors,
  displayBanner,
  formatCoverageValue,
  logColored,
  logError,
  logWarning,
  logSuccess,
  logInfo,
};