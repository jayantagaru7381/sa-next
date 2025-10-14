#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * GitHub Actions Output Formatter
 * Formats quality metrics for GitHub Actions outputs and PR comments
 */

class GitHubOutputFormatter {
  constructor(metricsPath = 'quality-metrics.json') {
    this.metricsPath = metricsPath;
    this.metrics = this.loadMetrics();
  }

  loadMetrics() {
    try {
      const fullPath = path.isAbsolute(this.metricsPath) 
        ? this.metricsPath 
        : path.join(process.cwd(), this.metricsPath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Metrics file not found: ${fullPath}`);
      }
      
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (error) {
      console.error(`Error loading metrics: ${error.message}`);
      return this.getEmptyMetrics();
    }
  }

  getEmptyMetrics() {
    return {
      coverage: { status: 'error', message: 'No data available' },
      linting: { status: 'error', message: 'No data available' },
      typescript: { status: 'error', message: 'No data available' },
      bundle: { status: 'error', message: 'No data available' },
      security: { status: 'error', message: 'No data available' },
      performance: { status: 'error', message: 'No data available' },
      summary: { overall: 'failed', score: 0, passed: [], failed: [], warnings: [] }
    };
  }

  /**
   * Generate status emoji based on status
   */
  getStatusEmoji(status, passed = null) {
    switch (status) {
      case 'success':
        return passed === false ? '⚠️' : '✅';
      case 'failed':
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'missing':
        return '❓';
      case 'pending':
        return '⏳';
      default:
        return '⚪';
    }
  }

  /**
   * Generate progress bar
   */
  generateProgressBar(percentage, width = 20) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    let color = '';
    if (percentage >= 80) color = '🟢';
    else if (percentage >= 60) color = '🟡';
    else color = '🔴';
    
    return `${color} ${bar} ${percentage}%`;
  }

  /**
   * Format coverage metrics
   */
  formatCoverage() {
    const coverage = this.metrics.coverage;
    
    if (coverage.status === 'error' || coverage.status === 'missing') {
      return {
        emoji: this.getStatusEmoji(coverage.status),
        title: 'Test Coverage',
        status: coverage.status,
        details: coverage.message || 'Coverage data unavailable'
      };
    }

    if (coverage.status === 'failed') {
      return {
        emoji: this.getStatusEmoji(coverage.status),
        title: 'Test Coverage',
        status: coverage.status,
        details: `Tests failed (Exit code: ${coverage.exitCode || 'unknown'})`
      };
    }

    const lines = coverage.lines || 0;
    const statements = coverage.statements || 0;
    const functions = coverage.functions || 0;
    const branches = coverage.branches || 0;
    const passed = coverage.passed || false;

    return {
      emoji: this.getStatusEmoji('success', passed),
      title: 'Test Coverage',
      status: passed ? 'passed' : 'below-threshold',
      summary: `${lines}% lines, ${statements}% statements, ${functions}% functions, ${branches}% branches`,
      details: [
        `Lines: ${this.generateProgressBar(lines)}`,
        `Statements: ${this.generateProgressBar(statements)}`,
        `Functions: ${this.generateProgressBar(functions)}`,
        `Branches: ${this.generateProgressBar(branches)}`
      ].join('\n'),
      threshold: coverage.threshold ? 
        `Threshold: ${coverage.threshold.lines}% (${passed ? 'PASSED' : 'FAILED'})` : null
    };
  }

  /**
   * Format linting metrics
   */
  formatLinting() {
    const linting = this.metrics.linting;
    
    if (linting.status === 'error') {
      return {
        emoji: this.getStatusEmoji(linting.status),
        title: 'ESLint',
        status: linting.status,
        details: linting.message || 'Linting failed'
      };
    }

    const errors = linting.errors || 0;
    const warnings = linting.warnings || 0;
    const files = linting.files || 0;

    let summary;
    if (errors === 0 && warnings === 0) {
      summary = 'No issues found';
    } else {
      summary = `${errors} errors, ${warnings} warnings`;
    }

    return {
      emoji: this.getStatusEmoji(linting.status),
      title: 'ESLint',
      status: linting.status,
      summary,
      details: files > 0 ? `Checked ${files} files` : undefined
    };
  }

  /**
   * Format TypeScript metrics
   */
  formatTypeScript() {
    const typescript = this.metrics.typescript;
    
    if (typescript.status === 'error') {
      return {
        emoji: this.getStatusEmoji(typescript.status),
        title: 'TypeScript',
        status: typescript.status,
        details: typescript.message || 'Type checking failed'
      };
    }

    const errors = typescript.errors || 0;
    
    return {
      emoji: this.getStatusEmoji(typescript.status),
      title: 'TypeScript',
      status: typescript.status,
      summary: typescript.status === 'success' ? 'Type checking passed' : `${errors} type errors`,
      details: typescript.details ? typescript.details.slice(0, 3).join('\n') : undefined
    };
  }

  /**
   * Format bundle metrics
   */
  formatBundle() {
    const bundle = this.metrics.bundle;
    
    if (bundle.status === 'error' || bundle.status === 'missing') {
      return {
        emoji: this.getStatusEmoji(bundle.status),
        title: 'Bundle Analysis',
        status: bundle.status,
        details: bundle.message || 'Bundle data unavailable'
      };
    }

    if (bundle.status === 'pending') {
      return {
        emoji: this.getStatusEmoji(bundle.status),
        title: 'Bundle Analysis',
        status: bundle.status,
        summary: 'Analysis pending',
        details: bundle.message || 'Will be analyzed post-build'
      };
    }

    const sizeMB = parseFloat(bundle.totalSizeMB || '0');
    const isLarge = bundle.warning || sizeMB > 50;
    
    return {
      emoji: isLarge ? '⚠️' : '✅',
      title: 'Bundle Analysis',
      status: isLarge ? 'warning' : 'success',
      summary: `${bundle.totalSizeMB}MB total`,
      details: [
        `📄 HTML: ${bundle.htmlFiles || 0} files`,
        `🟨 JavaScript: ${bundle.jsFiles || 0} files`,
        `🎨 CSS: ${bundle.cssFiles || 0} files`,
        sizeMB > 100 ? '⚠️ Large bundle size detected' : '',
        bundle.analyzedAt ? `📅 Analyzed: ${new Date(bundle.analyzedAt).toLocaleString()}` : ''
      ].filter(Boolean).join('\n')
    };
  }

  /**
   * Format security metrics
   */
  formatSecurity() {
    const security = this.metrics.security;
    
    if (security.status === 'error') {
      return {
        emoji: this.getStatusEmoji(security.status),
        title: 'Security Audit',
        status: security.status,
        details: security.message || 'Security audit failed'
      };
    }

    const vulns = security.vulnerabilities || {};
    const total = security.total || 0;
    
    if (total === 0) {
      return {
        emoji: '🔒',
        title: 'Security Audit',
        status: 'success',
        summary: 'No vulnerabilities found'
      };
    }

    const criticalHigh = (vulns.critical || 0) + (vulns.high || 0);
    const status = criticalHigh > 0 ? 'failed' : 'warning';
    
    return {
      emoji: this.getStatusEmoji(status),
      title: 'Security Audit',
      status,
      summary: `${total} vulnerabilities found`,
      details: [
        vulns.critical > 0 ? `🔴 Critical: ${vulns.critical}` : '',
        vulns.high > 0 ? `🟠 High: ${vulns.high}` : '',
        vulns.moderate > 0 ? `🟡 Moderate: ${vulns.moderate}` : '',
        vulns.low > 0 ? `⚪ Low: ${vulns.low}` : ''
      ].filter(Boolean).join('\n')
    };
  }

  /**
   * Format performance metrics
   */
  formatPerformance() {
    const performance = this.metrics.performance;
    
    if (!performance || performance.status === 'error') {
      return {
        emoji: '❓',
        title: 'Performance',
        status: 'error',
        details: 'Performance data unavailable'
      };
    }

    const buildDuration = performance.buildDurationFormatted || 'Unknown';
    const isSlow = performance.buildDuration > 300000; // 5 minutes
    
    return {
      emoji: isSlow ? '⚠️' : '⚡',
      title: 'Performance',
      status: isSlow ? 'warning' : 'success',
      summary: `Build completed in ${buildDuration}`,
      details: [
        `Node: ${performance.nodeVersion}`,
        `Platform: ${performance.platform}`,
        `CPUs: ${performance.cpuCount}`,
        `Memory: ${performance.totalMemory}`
      ].join('\n')
    };
  }

  /**
   * Generate GitHub Actions outputs
   */
  generateGitHubOutputs() {
    const summary = this.metrics.summary || {};
    const outputs = {
      // Overall status
      quality_status: summary.overall || 'failed',
      quality_score: (summary.score || 0).toString(),
      
      // Individual metrics
      coverage_status: this.metrics.coverage?.status || 'error',
      coverage_percentage: (this.metrics.coverage?.lines || 0).toString(),
      
      linting_status: this.metrics.linting?.status || 'error',
      linting_errors: (this.metrics.linting?.errors || 0).toString(),
      
      typescript_status: this.metrics.typescript?.status || 'error',
      typescript_errors: (this.metrics.typescript?.errors || 0).toString(),
      
      bundle_size_mb: (this.metrics.bundle?.totalSizeMB || '0'),
      bundle_status: this.metrics.bundle?.status || 'error',
      
      security_status: this.metrics.security?.status || 'error',
      security_vulnerabilities: (this.metrics.security?.total || 0).toString(),
      
      performance_duration: this.metrics.performance?.buildDurationFormatted || 'Unknown'
    };

    // Output in GitHub Actions format
    Object.entries(outputs).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });

    return outputs;
  }

  /**
   * Generate error comment when deployment fails
   */
  generateErrorComment(branch, commit, runId, runNumber) {
    return `### ❌ Preview Environment Deployment Failed

🔀 **Branch**: \`${branch}\`
📦 **Commit**: \`${commit}\`
⏰ **Attempted**: ${new Date().toUTCString()}
🏃 **Build**: [#${runNumber}](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${runId})

---

⚠️ **Issue**: Preview environment URL was not created. Common causes: build failure, deployment timeout, or configuration issues.

💡 **Next Steps**: Check [build logs](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${runId}) and re-run if needed.`;
  }

  /**
   * Generate PR comment markdown
   */
  generatePRComment(deploymentUrl, branch, commit, runId, runNumber) {
    const summary = this.metrics.summary || {};
    const overallEmoji = summary.overall === 'success' ? '✅' : 
                        summary.overall === 'partial' ? '⏳' : '❌';
    const scoreEmoji = summary.score >= 80 ? '🏆' : summary.score >= 60 ? '🥉' : '📈';
    
    const coverage = this.formatCoverage();
    const linting = this.formatLinting();
    const typescript = this.formatTypeScript();
    const bundle = this.formatBundle();
    const security = this.formatSecurity();
    const performance = this.formatPerformance();

    return `### ${overallEmoji} Your Preview Environment is Ready!

🌐 **Preview your changes**: ${deploymentUrl}
🔀 **Branch**: \`${branch}\`
📦 **Commit**: \`${commit}\`
⏰ **Deployed**: ${new Date().toUTCString()}
🏃 **Build**: [#${runNumber}](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${runId})

#### ${scoreEmoji} Quality Score: ${summary.score || 0}%

| Check | Status | Details |
|-------|--------|---------|
| ${coverage.emoji} ${coverage.title} | ${coverage.status} | ${coverage.summary || coverage.details} |
| ${linting.emoji} ${linting.title} | ${linting.status} | ${linting.summary || linting.details} |
| ${typescript.emoji} ${typescript.title} | ${typescript.status} | ${typescript.summary || typescript.details} |
| ${bundle.emoji} ${bundle.title} | ${bundle.status} | ${bundle.summary || bundle.details} |
| ${security.emoji} ${security.title} | ${security.status} | ${security.summary || security.details} |
| ${performance.emoji} ${performance.title} | ${performance.status} | ${performance.summary || performance.details} |

---

<details>
<summary>📊 Detailed Quality Metrics</summary>

${coverage.details ? `**Test Coverage**\n\`\`\`\n${coverage.details}\n\`\`\`` : ''}
${coverage.threshold ? `${coverage.threshold}` : ''}

${linting.details ? `**Linting Details**\n${linting.details}` : ''}

${typescript.details ? `**TypeScript Issues**\n\`\`\`\n${typescript.details}\n\`\`\`` : ''}

${bundle.details ? `**Bundle Details**\n${bundle.details}` : ''}

${security.details ? `**Security Details**\n${security.details}` : ''}

${performance.details ? `**Performance Details**\n${performance.details}` : ''}

</details>

${summary.pending && summary.pending.length > 0 ? 
  `\n⏳ **In Progress**: ${summary.pending.join(', ')} analysis will complete after build step.` : ''}

${summary.failed && summary.failed.length > 0 ? 
  `\n⚠️ **Action Required**: ${summary.failed.join(', ')} checks failed. Please review the issues above.` : 
  summary.overall === 'success' ? '✨ **Great job!** All quality checks passed.' :
  summary.overall === 'partial' ? '🔄 **Almost there!** Some analyses are still in progress.' : ''}

${this.metrics.errors && this.metrics.errors.length > 0 ? 
  `\n<details>\n<summary>❌ Collection Errors (${this.metrics.errors.length})</summary>\n\n${this.metrics.errors.map(e => `- ${e}`).join('\n')}\n\n</details>` : ''}`;
  }

  /**
   * Generate compact summary for workflow logs
   */
  generateSummary() {
    const summary = this.metrics.summary || {};
    const coverage = this.formatCoverage();
    const linting = this.formatLinting();
    const typescript = this.formatTypeScript();
    const bundle = this.formatBundle();
    const security = this.formatSecurity();
    
    console.log('\n📊 QUALITY METRICS SUMMARY');
    console.log('='.repeat(50));
    console.log(`Overall Score: ${summary.score || 0}% ${summary.overall === 'success' ? '✅' : '❌'}`);
    console.log(`${coverage.emoji} Coverage: ${coverage.summary || coverage.details}`);
    console.log(`${linting.emoji} Linting: ${linting.summary || linting.details}`);
    console.log(`${typescript.emoji} TypeScript: ${typescript.summary || typescript.details}`);
    console.log(`${bundle.emoji} Bundle: ${bundle.summary || bundle.details}`);
    console.log(`${security.emoji} Security: ${security.summary || security.details}`);
    console.log('='.repeat(50));
    
    if (summary.failed && summary.failed.length > 0) {
      console.log(`❌ Failed: ${summary.failed.join(', ')}`);
    }
    if (summary.warnings && summary.warnings.length > 0) {
      console.log(`⚠️ Warnings: ${summary.warnings.join(', ')}`);
    }
    if (summary.passed && summary.passed.length > 0) {
      console.log(`✅ Passed: ${summary.passed.join(', ')}`);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const metricsFile = args[1] || 'quality-metrics.json';

  const formatter = new GitHubOutputFormatter(metricsFile);

  switch (command) {
    case 'outputs':
      formatter.generateGitHubOutputs();
      break;
    
    case 'comment': {
      const deploymentUrl = args[2];
      const branch = args[3] || 'main';
      const commit = args[4] || 'abc123';
      const runId = args[5] || '123';
      const runNumber = args[6] || '1';

      if (!deploymentUrl) {
        console.log(formatter.generateErrorComment(branch, commit, runId, runNumber));
      } else {
        console.log(formatter.generatePRComment(deploymentUrl, branch, commit, runId, runNumber));
      }
      break;
    }
    
    case 'summary':
      formatter.generateSummary();
      break;
    
    default:
      console.log('Usage: format-github-output.js <outputs|comment|summary> [metrics-file] [args...]');
      console.log('  outputs: Generate GitHub Actions outputs');
      console.log('  comment: Generate PR comment markdown');
      console.log('  summary: Generate console summary');
      process.exit(1);
  }
}

module.exports = GitHubOutputFormatter;