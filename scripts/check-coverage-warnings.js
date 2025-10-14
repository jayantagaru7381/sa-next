#!/usr/bin/env node

/**
 * Coverage Warning Checker
 * 
 * Checks Jest coverage results and displays prominent red warnings
 * when coverage is below thresholds, but doesn't fail the build.
 * This allows for non-blocking quality gates with clear visibility.
 */

const fs = require('fs');
const path = require('path');

const { colors, displayBanner, formatCoverageValue } = require('./utils/console-utils');

const COVERAGE_THRESHOLD = {
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80,
};



function convertFinalToSummary(finalData) {
  const files = {};
  let totalStats = {
    lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
    functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
    statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
    branches: { total: 0, covered: 0, skipped: 0, pct: 0 }
  };

  Object.keys(finalData).forEach(filePath => {
    const fileData = finalData[filePath];
    if (!fileData || typeof fileData !== 'object') return;

    const { s = {}, f = {}, b = {}, statementMap = {}, fnMap = {}, branchMap = {} } = fileData;

    // Calculate statements
    const statementTotal = Object.keys(statementMap).length;
    const statementCovered = Object.values(s).filter(count => count > 0).length;
    const statementPct = statementTotal > 0 ? (statementCovered / statementTotal) * 100 : 0;

    // Calculate functions
    const functionTotal = Object.keys(fnMap).length;
    const functionCovered = Object.values(f).filter(count => count > 0).length;
    const functionPct = functionTotal > 0 ? (functionCovered / functionTotal) * 100 : 0;

    // Calculate branches
    const branchTotal = Object.keys(branchMap).reduce((total, key) => 
      total + (branchMap[key].locations?.length || 0), 0);
    const branchCovered = Object.values(b).reduce((covered, branches) => 
      covered + branches.filter(count => count > 0).length, 0);
    const branchPct = branchTotal > 0 ? (branchCovered / branchTotal) * 100 : 0;

    // Lines = statements for this purpose
    const linePct = statementPct;

    files[filePath] = {
      lines: { total: statementTotal, covered: statementCovered, skipped: 0, pct: linePct },
      functions: { total: functionTotal, covered: functionCovered, skipped: 0, pct: functionPct },
      statements: { total: statementTotal, covered: statementCovered, skipped: 0, pct: statementPct },
      branches: { total: branchTotal, covered: branchCovered, skipped: 0, pct: branchPct }
    };

    // Add to totals
    totalStats.lines.total += statementTotal;
    totalStats.lines.covered += statementCovered;
    totalStats.functions.total += functionTotal;
    totalStats.functions.covered += functionCovered;
    totalStats.statements.total += statementTotal;
    totalStats.statements.covered += statementCovered;
    totalStats.branches.total += branchTotal;
    totalStats.branches.covered += branchCovered;
  });

  // Calculate total percentages
  totalStats.lines.pct = totalStats.lines.total > 0 ? (totalStats.lines.covered / totalStats.lines.total) * 100 : 0;
  totalStats.functions.pct = totalStats.functions.total > 0 ? (totalStats.functions.covered / totalStats.functions.total) * 100 : 0;
  totalStats.statements.pct = totalStats.statements.total > 0 ? (totalStats.statements.covered / totalStats.statements.total) * 100 : 0;
  totalStats.branches.pct = totalStats.branches.total > 0 ? (totalStats.branches.covered / totalStats.branches.total) * 100 : 0;

  return {
    ...files,
    total: totalStats
  };
}

function checkCoverage() {
  // Check if we should skip coverage warnings
  const skipWarnings = process.env.SKIP_COVERAGE_THRESHOLD === 'true' || 
                      process.env.NO_COVERAGE_THRESHOLD === 'true' ||
                      process.argv.includes('--no-coverage-threshold');

  if (skipWarnings) {
    console.log(`${colors.cyan}ℹ️  Coverage warnings skipped${colors.reset}`);
    return;
  }

  const coverageDir = path.join(process.cwd(), 'coverage');
  const summaryFile = path.join(coverageDir, 'coverage-summary.json');
  const finalFile = path.join(coverageDir, 'coverage-final.json');

  let coverageData;

  // Try summary file first, then final file
  if (fs.existsSync(summaryFile)) {
    try {
      coverageData = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    } catch {
      console.log(`${colors.yellow}⚠️  Error reading coverage-summary.json${colors.reset}\n`);
      return;
    }
  } else if (fs.existsSync(finalFile)) {
    try {
      const rawData = JSON.parse(fs.readFileSync(finalFile, 'utf8'));
      // Convert coverage-final.json format to summary format
      coverageData = convertFinalToSummary(rawData);
    } catch {
      console.log(`${colors.yellow}⚠️  Error reading coverage-final.json${colors.reset}\n`);
      return;
    }
  } else {
    console.log(`${colors.yellow}⚠️  No coverage data found. Run tests with --coverage to generate coverage report.${colors.reset}\n`);
    return;
  }

  try {
    const totalCoverage = coverageData.total;

    if (!totalCoverage) {
      console.log(`${colors.yellow}⚠️  Coverage data format not recognized${colors.reset}\n`);
      return;
    }

    // Extract coverage percentages
    const coverage = {
      branches: totalCoverage.branches?.pct || 0,
      functions: totalCoverage.functions?.pct || 0,
      lines: totalCoverage.lines?.pct || 0,
      statements: totalCoverage.statements?.pct || 0,
    };

    // Check which metrics are below threshold
    const failedMetrics = [];
    const passedMetrics = [];

    Object.keys(COVERAGE_THRESHOLD).forEach(metric => {
      const value = coverage[metric];
      const threshold = COVERAGE_THRESHOLD[metric];
      
      if (value < threshold) {
        failedMetrics.push({ metric, value, threshold, deficit: threshold - value });
      } else {
        passedMetrics.push({ metric, value, threshold });
      }
    });

    // Display results
    console.log(`${colors.bold}${colors.cyan}📊 COVERAGE ANALYSIS REPORT${colors.reset}`);
    console.log('═'.repeat(50));

    if (failedMetrics.length === 0) {
      displayBanner('success', 'ALL COVERAGE THRESHOLDS MET');
      
      console.log('📈 Coverage Results:');
      Object.keys(coverage).forEach(metric => {
        const value = coverage[metric];
        const threshold = COVERAGE_THRESHOLD[metric];
        console.log(`   ${metric.padEnd(12)}: ${formatCoverageValue(value, threshold)}`);
      });
    } else {
      displayBanner('warning', 'COVERAGE BELOW THRESHOLDS');
      
      console.log(`${colors.red}${colors.bold}❌ Failed Coverage Metrics:${colors.reset}`);
      failedMetrics.forEach(({ metric, value, threshold, deficit }) => {
        console.log(`   ${colors.red}• ${metric.padEnd(12)}: ${value.toFixed(1)}% ${colors.bold}(${deficit.toFixed(1)}% below threshold)${colors.reset}`);
      });

      if (passedMetrics.length > 0) {
        console.log(`\n${colors.green}${colors.bold}✅ Passed Coverage Metrics:${colors.reset}`);
        passedMetrics.forEach(({ metric, value, threshold }) => {
          console.log(`   ${colors.green}• ${metric.padEnd(12)}: ${value.toFixed(1)}% (${(value - threshold).toFixed(1)}% above threshold)${colors.reset}`);
        });
      }

      console.log(`\n${colors.yellow}${colors.bold}🎯 Coverage Improvement Suggestions:${colors.reset}`);
      failedMetrics.forEach(({ metric, deficit }) => {
        if (deficit > 10) {
          console.log(`   ${colors.red}• ${metric}: Add tests (${deficit.toFixed(1)}% gap is significant)${colors.reset}`);
        } else {
          console.log(`   ${colors.yellow}• ${metric}: Add a few test cases (${deficit.toFixed(1)}% gap)${colors.reset}`);
        }
      });

      console.log(`\n${colors.cyan}${colors.bold}📝 Next Steps:${colors.reset}`);
      console.log('   1. Review uncovered code in coverage/lcov-report/index.html');
      console.log('   2. Add tests for uncovered functions and branches');
      console.log('   3. Consider using STRICT_COVERAGE=true for blocking enforcement');
      console.log('   4. Use SKIP_COVERAGE_THRESHOLD=true to skip these warnings');

      // Show file-level coverage for files with low coverage
      console.log(`\n${colors.cyan}${colors.bold}📁 Files with Low Coverage:${colors.reset}`);
      let foundLowCoverageFiles = false;
      
      Object.keys(coverageData).forEach(filePath => {
        if (filePath === 'total') return;
        
        const fileCoverage = coverageData[filePath];
        const lowMetrics = [];
        
        Object.keys(COVERAGE_THRESHOLD).forEach(metric => {
          const value = fileCoverage[metric]?.pct || 0;
          const threshold = COVERAGE_THRESHOLD[metric];
          if (value < threshold) {
            lowMetrics.push(`${metric}: ${value.toFixed(1)}%`);
          }
        });
        
        if (lowMetrics.length > 0) {
          foundLowCoverageFiles = true;
          const displayPath = filePath.replace(process.cwd(), '').replace(/^\//, '');
          console.log(`   ${colors.red}• ${displayPath}${colors.reset}`);
          console.log(`     ${colors.red}Low: ${lowMetrics.join(', ')}${colors.reset}`);
        }
      });

      if (!foundLowCoverageFiles) {
        console.log(`   ${colors.green}All individual files meet coverage thresholds${colors.reset}`);
        console.log(`   ${colors.yellow}Overall coverage is pulled down by aggregate calculations${colors.reset}`);
      }
    }

    console.log(`\n${colors.cyan}═`.repeat(50));
    console.log(`${colors.cyan}${colors.bold}ℹ️  This is a NON-BLOCKING warning. Tests passed successfully.${colors.reset}`);
    console.log(`${colors.cyan}   Use 'npm run test:strict' for blocking coverage enforcement.${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}❌ Error reading coverage data:${colors.reset}`, error.message);
  }
}

// Only run if called directly (not when imported)
if (require.main === module) {
  checkCoverage();
}

module.exports = { checkCoverage };