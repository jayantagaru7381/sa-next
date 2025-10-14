#!/usr/bin/env node

/**
 * Non-blocking Pre-commit Hook Runner
 * 
 * This script runs pre-commit checks (lint-staged) in a non-blocking manner,
 * showing red warnings for issues but not preventing the commit.
 * 
 * Use STRICT_PRECOMMIT=true to enable blocking behavior.
 */

const { spawn } = require('child_process');

const { colors, displayBanner } = require('./utils/console-utils');


async function runPreCommitChecks() {
  // Check if we should run in strict mode (blocking)
  const strictMode = process.env.STRICT_PRECOMMIT === 'true' || 
                    process.env.CI_STRICT_PRECOMMIT === 'true' ||
                    process.argv.includes('--strict-precommit');

  console.log(`${colors.cyan}${colors.bold}🔍 Running Pre-commit Checks...${colors.reset}`);
  console.log(`${colors.cyan}Mode: ${strictMode ? 'Strict (Blocking)' : 'Non-blocking (Warnings Only)'}${colors.reset}\n`);

  return new Promise((resolve) => {
    const lintStagedProcess = spawn('npx', ['lint-staged'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';

    lintStagedProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });

    lintStagedProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });

    lintStagedProcess.on('close', (exitCode) => {
      console.log('\n' + '═'.repeat(70));
      
      if (exitCode === 0) {
        displayBanner('success', 'PRE-COMMIT: ALL CHECKS PASSED');
        console.log(`${colors.green}🎉 All pre-commit checks completed successfully!${colors.reset}`);
        console.log(`${colors.green}Your staged changes are ready to commit.${colors.reset}\n`);
        resolve(0);
      } else {
        if (strictMode) {
          displayBanner('error', 'PRE-COMMIT: CHECKS FAILED - COMMIT BLOCKED');
          console.log(`${colors.red}${colors.bold}❌ Commit blocked due to pre-commit check failures${colors.reset}`);
          console.log(`${colors.red}Please fix the issues above and try committing again.${colors.reset}\n`);
          resolve(exitCode);
        } else {
          displayBanner('warning', 'PRE-COMMIT: ISSUES FOUND - NON-BLOCKING');
          
          console.log(`${colors.yellow}${colors.bold}⚠️  Pre-commit checks found issues but commit will proceed${colors.reset}`);
          console.log(`${colors.yellow}Issues detected in staged files (see output above)${colors.reset}`);

          console.log(`\n${colors.yellow}${colors.bold}📝 Recommended Actions:${colors.reset}`);
          console.log('   1. Review the issues shown in the output above');
          console.log('   2. Fix the formatting and linting issues');
          console.log('   3. Consider running "npm run fix:all" to auto-fix many issues');
          console.log('   4. Use STRICT_PRECOMMIT=true to block commits with issues');

          console.log(`\n${colors.cyan}${colors.bold}ℹ️  This is a NON-BLOCKING warning. Commit will proceed.${colors.reset}`);
          console.log(`${colors.cyan}   Set STRICT_PRECOMMIT=true to enable blocking behavior.${colors.reset}\n`);
          
          resolve(0); // Always succeed in non-blocking mode
        }
      }
    });

    lintStagedProcess.on('error', (error) => {
      displayBanner('error', 'PRE-COMMIT: EXECUTION ERROR');
      console.error(`${colors.red}Failed to run pre-commit checks:${colors.reset}`, error.message);
      resolve(strictMode ? 1 : 0);
    });
  });
}

// Only run if called directly
if (require.main === module) {
  runPreCommitChecks().then((exitCode) => {
    process.exit(exitCode);
  });
}

module.exports = { runPreCommitChecks };