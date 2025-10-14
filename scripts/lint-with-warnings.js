#!/usr/bin/env node

/**
 * Non-blocking ESLint Runner with Prominent Warnings
 * 
 * This script runs ESLint and displays prominent red warnings for any issues found,
 * but always exits with code 0 (success) to avoid blocking the build process.
 * 
 * Use STRICT_LINT=true to enable blocking behavior.
 */

const { spawn } = require('child_process');

const { colors, displayBanner } = require('./utils/console-utils');


async function runESLint() {
  // Check if we should run in strict mode (blocking)
  const strictLint = process.env.STRICT_LINT === 'true' || 
                    process.env.CI_STRICT_LINT === 'true' ||
                    process.argv.includes('--strict-lint');

  // Get ESLint arguments (everything after the script name)
  const eslintArgs = process.argv.slice(2).filter(arg => arg !== '--strict-lint');
  
  // If no arguments provided, use default pattern
  if (eslintArgs.length === 0) {
    eslintArgs.push('src/**/*.{js,jsx,ts,tsx}');
  }
  
  // Remove quotes from arguments if they exist
  const cleanedArgs = eslintArgs.map(arg => arg.replace(/^["']|["']$/g, ''));

  console.log(`${colors.cyan}${colors.bold}🔍 Running ESLint Analysis...${colors.reset}`);
  console.log(`${colors.cyan}Mode: ${strictLint ? 'Strict (Blocking)' : 'Non-blocking (Warnings Only)'}${colors.reset}`);
  console.log(`${colors.cyan}Files: ${cleanedArgs.join(' ')}${colors.reset}\n`);

  return new Promise((resolve) => {
    const eslintProcess = spawn('npx', ['eslint', '--format=stylish', '--color', ...cleanedArgs], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';

    eslintProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      
      // Display output in real-time with color formatting
      process.stdout.write(output);
    });

    eslintProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    eslintProcess.on('close', (exitCode) => {
      console.log('\n' + '═'.repeat(70));
      
      // Parse the output to get specific metrics
      const errorMatch = stdout.match(/(\d+)\s+errors?/);
      const warningMatch = stdout.match(/(\d+)\s+warnings?/);
      
      const errorCount = errorMatch ? parseInt(errorMatch[1]) : 0;
      const warningCount = warningMatch ? parseInt(warningMatch[1]) : 0;
      const totalIssues = errorCount + warningCount;

      if (exitCode === 0 && totalIssues === 0) {
        displayBanner('success', 'ESLINT: ALL CHECKS PASSED');
        console.log(`${colors.green}🎉 No linting issues found!${colors.reset}`);
        console.log(`${colors.green}Your code follows all configured style rules.${colors.reset}\n`);
        resolve(0);
      } else if (totalIssues > 0) {
        if (strictLint) {
          displayBanner('error', 'ESLINT: ISSUES FOUND - BLOCKING BUILD');
          console.log(`${colors.red}${colors.bold}❌ Build blocked due to linting issues${colors.reset}`);
          resolve(exitCode);
        } else {
          displayBanner('warning', 'ESLINT: ISSUES FOUND - NON-BLOCKING');
          
          console.log(`${colors.yellow}${colors.bold}📊 Linting Issues Summary:${colors.reset}`);
          if (errorCount > 0) {
            console.log(`   ${colors.red}• Errors: ${errorCount}${colors.reset}`);
          }
          if (warningCount > 0) {
            console.log(`   ${colors.yellow}• Warnings: ${warningCount}${colors.reset}`);
          }
          console.log(`   ${colors.cyan}• Total Issues: ${totalIssues}${colors.reset}`);

          console.log(`\n${colors.yellow}${colors.bold}🎯 Recommended Actions:${colors.reset}`);
          console.log('   1. Review the issues listed above');
          console.log('   2. Run "npm run lint:fix" to auto-fix many issues');
          console.log('   3. Manually address remaining issues');
          console.log('   4. Use STRICT_LINT=true for blocking enforcement');

          console.log(`\n${colors.cyan}${colors.bold}ℹ️  This is a NON-BLOCKING warning. Build continues.${colors.reset}`);
          console.log(`${colors.cyan}   Use 'STRICT_LINT=true npm run lint' for blocking enforcement.${colors.reset}\n`);
          
          resolve(0); // Always succeed in non-blocking mode
        }
      } else {
        // ESLint failed for other reasons (config issues, etc.)
        displayBanner('error', 'ESLINT: CONFIGURATION ERROR');
        console.log(`${colors.red}ESLint failed with exit code ${exitCode}${colors.reset}`);
        if (stderr) {
          console.log(`${colors.red}Error details:${colors.reset}`);
          console.log(stderr);
        }
        resolve(strictLint ? exitCode : 0); // Fail only in strict mode
      }
    });

    eslintProcess.on('error', (error) => {
      displayBanner('error', 'ESLINT: EXECUTION ERROR');
      console.error(`${colors.red}Failed to run ESLint:${colors.reset}`, error.message);
      resolve(strictLint ? 1 : 0);
    });
  });
}

// Only run if called directly
if (require.main === module) {
  runESLint().then((exitCode) => {
    process.exit(exitCode);
  });
}

module.exports = { runESLint };