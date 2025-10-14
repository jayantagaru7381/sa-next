#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Quality Metrics Collection Script
 * Collects comprehensive quality metrics for CI/CD pipeline
 */

class QualityMetricsCollector {
  constructor() {
    // Try to load existing metrics to avoid duplication
    this.existingMetrics = this.loadExistingMetrics();
    
    this.metrics = {
      timestamp: new Date().toISOString(),
      buildStartTime: Date.now(),
      coverage: this.existingMetrics?.coverage || {},
      linting: this.existingMetrics?.linting || {},
      typescript: this.existingMetrics?.typescript || {},
      bundle: this.existingMetrics?.bundle || {},
      security: this.existingMetrics?.security || {},
      performance: this.existingMetrics?.performance || {},
      errors: this.existingMetrics?.errors || []
    };
    
    // Track what metrics have been freshly collected vs reused
    this.reuseLog = [];
  }

  /**
   * Load existing metrics to avoid redundant collection
   */
  loadExistingMetrics() {
    try {
      const metricsPath = 'quality-metrics.json';
      if (fs.existsSync(metricsPath)) {
        const existing = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
        const metricsAge = Date.now() - new Date(existing.timestamp).getTime();
        
        // Reuse metrics if less than 5 minutes old (typical CI job duration)
        if (metricsAge < 5 * 60 * 1000) {
          console.log(`♻️  Reusing existing quality metrics (${Math.round(metricsAge / 1000)}s old)`);
          return existing;
        } else {
          console.log(`🔄 Existing metrics are stale (${Math.round(metricsAge / 60000)}min old), collecting fresh`);
        }
      }
      return null;
    } catch (error) {
      console.log(`📊 No valid existing metrics found, starting fresh collection`);
      return null;
    }
  }

  /**
   * Strip ANSI color codes and clean up error messages for GitHub display
   */
  cleanErrorMessage(message) {
    return message
      // Remove ANSI escape codes
      .replace(/\x1b\[[0-9;]*m/g, '')
      // Remove terminal control characters  
      .replace(/\x1b\[[\d;]*[a-zA-Z]/g, '')
      // Clean up excessive whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Limit message length for GitHub comments
      .substring(0, 1000);
  }

  /**
   * Execute command safely and capture output
   */
  safeExec(command, options = {}) {
    try {
      const result = execSync(command, { 
        encoding: 'utf8', 
        timeout: 30000,
        ...options 
      });
      return { success: true, output: result.trim() };
    } catch (error) {
      return { 
        success: false, 
        output: error.message,
        exitCode: error.status || 1
      };
    }
  }

  /**
   * Collect test coverage metrics
   */
  async collectCoverageMetrics() {
    // Skip if we already have fresh coverage data
    if (this.existingMetrics && this.existingMetrics.coverage?.status === 'success') {
      console.log('♻️  Reusing existing coverage metrics (saves ~30-60s)');
      this.reuseLog.push('coverage');
      return;
    }
    
    console.log('📊 Collecting test coverage metrics...');
    
    const coverageResult = this.safeExec('npm run test:ci', { 
      stdio: 'pipe',
      env: { ...process.env, CI: 'true' }
    });

    if (coverageResult.success) {
      // Parse Jest coverage summary
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      
      if (fs.existsSync(coveragePath)) {
        try {
          const coverageSummary = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          const total = coverageSummary.total;
          
          this.metrics.coverage = {
            status: 'success',
            lines: total.lines.pct,
            statements: total.statements.pct,
            functions: total.functions.pct,
            branches: total.branches.pct,
            threshold: {
              lines: 70,
              statements: 70,
              functions: 70,
              branches: 70
            },
            passed: total.lines.pct >= 70 && total.statements.pct >= 70 && 
                   total.functions.pct >= 70 && total.branches.pct >= 70
          };
        } catch (error) {
          this.metrics.coverage = { status: 'error', message: 'Failed to parse coverage data' };
          this.metrics.errors.push(`Coverage parsing: ${error.message}`);
        }
      } else {
        this.metrics.coverage = { status: 'warning', message: 'No coverage data generated' };
      }
    } else {
      this.metrics.coverage = { 
        status: 'failed', 
        message: 'Tests failed',
        exitCode: coverageResult.exitCode
      };
      this.metrics.errors.push(`Test execution: ${this.cleanErrorMessage(coverageResult.output)}`);
    }
  }

  /**
   * Collect linting metrics
   */
  async collectLintingMetrics() {
    // Skip if we already have fresh linting data
    if (this.existingMetrics && this.existingMetrics.linting?.status) {
      console.log('♻️  Reusing existing linting metrics (saves ~15-30s)');
      this.reuseLog.push('linting');
      return;
    }
    
    console.log('🔍 Collecting linting metrics...');
    
    const lintResult = this.safeExec('npm run lint -- --format json', { stdio: 'pipe' });
    
    if (lintResult.success) {
      try {
        const lintData = JSON.parse(lintResult.output);
        const errorCount = lintData.reduce((sum, file) => sum + file.errorCount, 0);
        const warningCount = lintData.reduce((sum, file) => sum + file.warningCount, 0);
        const fileCount = lintData.length;
        
        this.metrics.linting = {
          status: errorCount > 0 ? 'failed' : warningCount > 0 ? 'warning' : 'success',
          errors: errorCount,
          warnings: warningCount,
          files: fileCount,
          passed: errorCount === 0
        };
      } catch {
        // Try non-JSON format as fallback
        const fallbackResult = this.safeExec('npm run lint');
        this.metrics.linting = {
          status: fallbackResult.success ? 'success' : 'failed',
          errors: fallbackResult.success ? 0 : 1,
          warnings: 0,
          files: 0,
          message: fallbackResult.success ? 'No issues found' : 'Linting failed'
        };
      }
    } else {
      this.metrics.linting = {
        status: 'failed',
        errors: 1,
        warnings: 0,
        files: 0,
        message: 'Linter execution failed'
      };
      this.metrics.errors.push(`Linting: ${this.cleanErrorMessage(lintResult.output)}`);
    }
  }

  /**
   * Collect TypeScript compilation metrics
   */
  async collectTypeScriptMetrics() {
    // Skip if we already have fresh TypeScript data
    if (this.existingMetrics && this.existingMetrics.typescript?.status) {
      console.log('♻️  Reusing existing TypeScript metrics (saves ~10-20s)');
      this.reuseLog.push('typescript');
      return;
    }
    
    console.log('📝 Collecting TypeScript metrics...');
    
    const tscResult = this.safeExec('npx tsc --noEmit --pretty false', { stdio: 'pipe' });
    
    if (tscResult.success) {
      this.metrics.typescript = {
        status: 'success',
        errors: 0,
        message: 'Type checking passed'
      };
    } else {
      // Parse TypeScript errors
      const errorLines = tscResult.output.split('\n').filter(line => line.includes('error TS'));
      
      this.metrics.typescript = {
        status: 'failed',
        errors: errorLines.length,
        message: `${errorLines.length} type error(s) found`,
        details: errorLines.slice(0, 5) // First 5 errors
      };
      this.metrics.errors.push(`TypeScript: ${errorLines.length} errors`);
    }
  }

  /**
   * Collect bundle analysis metrics with two-phase support
   * Phase 1 (pre-build): Skip bundle analysis gracefully
   * Phase 2 (post-build): Perform full bundle analysis
   */
  async collectBundleMetrics(force = false) {
    console.log('📦 Collecting bundle metrics...');
    
    const buildDir = path.join(process.cwd(), 'out');
    const nextDir = path.join(process.cwd(), '.next');
    
    // Skip if we already have fresh bundle data and not forcing re-collection
    if (!force && this.existingMetrics && this.existingMetrics.bundle?.status === 'success') {
      console.log('♻️  Reusing existing bundle metrics (saves ~10-15s)');
      this.reuseLog.push('bundle');
      return;
    }
    
    if (fs.existsSync(buildDir)) {
      try {
        // Analyze build output size (using -sk for cross-platform compatibility)
        const buildSizeResult = this.safeExec(`du -sk ${buildDir}`);
        const buildSize = buildSizeResult.success ? 
          parseInt(buildSizeResult.output.split('\t')[0]) * 1024 : 0; // Convert KB to bytes

        // Count different file types
        const htmlFiles = this.safeExec(`find ${buildDir} -name "*.html" | wc -l`);
        const jsFiles = this.safeExec(`find ${buildDir} -name "*.js" | wc -l`);
        const cssFiles = this.safeExec(`find ${buildDir} -name "*.css" | wc -l`);

        // Try to analyze .next directory for additional metrics
        let chunks = [];
        const staticDir = path.join(nextDir, 'static');
        if (fs.existsSync(staticDir)) {
          const chunksResult = this.safeExec(`find ${staticDir} -name "*.js" -exec ls -la {} \\; | head -10`);
          if (chunksResult.success) {
            chunks = chunksResult.output.split('\n').slice(0, 5);
          }
        }

        this.metrics.bundle = {
          status: 'success',
          totalSize: buildSize,
          totalSizeMB: (buildSize / 1024 / 1024).toFixed(2),
          htmlFiles: htmlFiles.success ? parseInt(htmlFiles.output) : 0,
          jsFiles: jsFiles.success ? parseInt(jsFiles.output) : 0,
          cssFiles: cssFiles.success ? parseInt(cssFiles.output) : 0,
          chunks: chunks.length,
          warning: buildSize > 100 * 1024 * 1024, // Warn if over 100MB
          analyzedAt: new Date().toISOString()
        };
        console.log(`✅ Bundle analysis completed: ${this.metrics.bundle.totalSizeMB}MB total`);
      } catch (error) {
        this.metrics.bundle = {
          status: 'error',
          message: 'Failed to analyze bundle',
          error: error.message
        };
        this.metrics.errors.push(`Bundle analysis: ${error.message}`);
      }
    } else {
      // Gracefully handle missing build directory
      console.log('ℹ️  Build output directory not found - will be analyzed after build step');
      this.metrics.bundle = {
        status: 'pending',
        message: 'Build output not yet available - will be analyzed post-build',
        skipReason: 'pre-build-phase'
      };
    }
  }

  /**
   * Collect security audit metrics
   */
  async collectSecurityMetrics() {
    // Skip if we already have fresh security data (security scans are expensive)
    if (this.existingMetrics && this.existingMetrics.security?.status) {
      console.log('♻️  Reusing existing security audit metrics (saves ~20-40s)');
      this.reuseLog.push('security');
      return;
    }
    
    console.log('🔒 Collecting security audit metrics...');
    
    const auditResult = this.safeExec('npm audit --audit-level=moderate --json', { stdio: 'pipe' });
    
    if (auditResult.success) {
      try {
        const auditData = JSON.parse(auditResult.output);
        const vulnerabilities = auditData.vulnerabilities || {};
        
        const severityCounts = {
          critical: 0,
          high: 0,
          moderate: 0,
          low: 0
        };

        Object.values(vulnerabilities).forEach(vuln => {
          if (vuln.severity && Object.prototype.hasOwnProperty.call(severityCounts, vuln.severity)) {
            severityCounts[vuln.severity]++;
          }
        });

        const totalVulns = Object.values(severityCounts).reduce((sum, count) => sum + count, 0);

        this.metrics.security = {
          status: severityCounts.critical > 0 || severityCounts.high > 0 ? 'failed' : 
                  severityCounts.moderate > 0 ? 'warning' : 'success',
          vulnerabilities: severityCounts,
          total: totalVulns,
          passed: severityCounts.critical === 0 && severityCounts.high === 0
        };
      } catch (error) {
        this.metrics.security = {
          status: 'error',
          message: 'Failed to parse audit results',
          error: error.message
        };
      }
    } else {
      this.metrics.security = {
        status: 'error',
        message: 'Security audit failed to run'
      };
      this.metrics.errors.push(`Security audit: ${this.cleanErrorMessage(auditResult.output)}`);
    }
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics() {
    console.log('⚡ Collecting performance metrics...');
    
    const buildEndTime = Date.now();
    const buildDuration = buildEndTime - this.metrics.buildStartTime;

    this.metrics.performance = {
      status: 'success',
      buildDuration,
      buildDurationFormatted: this.formatDuration(buildDuration),
      nodeVersion: process.version,
      platform: process.platform,
      cpuCount: require('os').cpus().length,
      totalMemory: (require('os').totalmem() / 1024 / 1024 / 1024).toFixed(2) + 'GB'
    };
  }

  /**
   * Format duration in human readable format
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Update bundle metrics post-build (Phase 2 of two-phase approach)
   */
  async updateBundleMetricsPostBuild() {
    console.log('🔄 Running post-build bundle analysis...');
    
    // Force fresh collection of bundle metrics now that build is complete
    await this.collectBundleMetrics(true);
    
    // Save updated metrics
    this.saveMetrics();
    
    return this.metrics.bundle;
  }

  /**
   * Generate quality metrics summary
   */
  generateSummary() {
    const passedChecks = [];
    const failedChecks = [];
    const warnings = [];
    const pending = [];

    // Coverage
    if (this.metrics.coverage.status === 'success' && this.metrics.coverage.passed) {
      passedChecks.push('Coverage');
    } else if (this.metrics.coverage.status === 'failed') {
      failedChecks.push('Coverage');
    } else {
      warnings.push('Coverage');
    }

    // Linting
    if (this.metrics.linting.status === 'success') {
      passedChecks.push('Linting');
    } else if (this.metrics.linting.status === 'failed') {
      failedChecks.push('Linting');
    } else {
      warnings.push('Linting');
    }

    // TypeScript
    if (this.metrics.typescript.status === 'success') {
      passedChecks.push('TypeScript');
    } else {
      failedChecks.push('TypeScript');
    }

    // Security
    if (this.metrics.security.status === 'success') {
      passedChecks.push('Security');
    } else if (this.metrics.security.status === 'failed') {
      failedChecks.push('Security');
    } else {
      warnings.push('Security');
    }

    // Bundle Analysis - handle pending status
    if (this.metrics.bundle.status === 'success') {
      passedChecks.push('Bundle Analysis');
    } else if (this.metrics.bundle.status === 'failed' || this.metrics.bundle.status === 'error') {
      failedChecks.push('Bundle Analysis');
    } else if (this.metrics.bundle.status === 'pending') {
      pending.push('Bundle Analysis');
    } else {
      warnings.push('Bundle Analysis');
    }

    // Calculate score excluding pending items
    const totalChecks = passedChecks.length + failedChecks.length + warnings.length;
    const score = totalChecks > 0 ? Math.round((passedChecks.length / totalChecks) * 100) : 0;

    return {
      overall: failedChecks.length === 0 ? (pending.length === 0 ? 'success' : 'partial') : 'failed',
      passed: passedChecks,
      failed: failedChecks,
      warnings,
      pending,
      score,
      hasPendingAnalysis: pending.length > 0
    };
  }

  /**
   * Save metrics to file
   */
  saveMetrics() {
    const summary = this.generateSummary();
    const output = {
      ...this.metrics,
      summary
    };

    const outputPath = path.join(process.cwd(), 'quality-metrics.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`📊 Quality metrics saved to: ${outputPath}`);
    return outputPath;
  }

  /**
   * Run all metric collections
   */
  async collectAll() {
    console.log('🚀 Starting quality metrics collection...\n');
    
    await this.collectCoverageMetrics();
    await this.collectLintingMetrics();
    await this.collectTypeScriptMetrics();
    await this.collectBundleMetrics();
    await this.collectSecurityMetrics();
    await this.collectPerformanceMetrics();
    
    const summary = this.generateSummary();
    
    console.log('\n📊 Quality Metrics Summary:');
    console.log(`Overall Status: ${summary.overall.toUpperCase()}`);
    console.log(`Quality Score: ${summary.score}%`);
    console.log(`Passed: ${summary.passed.join(', ') || 'None'}`);
    console.log(`Failed: ${summary.failed.join(', ') || 'None'}`);
    console.log(`Warnings: ${summary.warnings.join(', ') || 'None'}`);
    if (summary.pending.length > 0) {
      console.log(`Pending: ${summary.pending.join(', ')} (will be analyzed post-build)`);
    }
    
    if (this.metrics.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.metrics.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Log resource optimization summary
    if (this.reuseLog.length > 0) {
      console.log(`\n♻️  Resource Optimization: Reused ${this.reuseLog.length} metric types (${this.reuseLog.join(', ')})`);
      const estimatedTimeSaved = this.reuseLog.length * 25; // Rough estimate: 25s average per metric type
      console.log(`⚡ Estimated time saved: ~${estimatedTimeSaved}s by avoiding redundant collection`);
    } else if (this.existingMetrics) {
      console.log('\n🔄 All metrics collected fresh (existing data was stale)');
    } else {
      console.log('\n📊 First-time metrics collection (no existing data found)');
    }
    
    return this.saveMetrics();
  }
}

// Run if called directly
if (require.main === module) {
  const collector = new QualityMetricsCollector();
  collector.collectAll()
    .then(outputPath => {
      console.log(`\n✅ Quality metrics collection completed: ${outputPath}`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ Quality metrics collection failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = QualityMetricsCollector;