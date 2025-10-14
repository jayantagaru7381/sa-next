#!/usr/bin/env node

/**
 * Post-Build Bundle Metrics Update Script
 * Updates quality metrics with bundle analysis after the build step
 * This script is designed to work with the two-phase quality metrics approach
 */

const QualityMetricsCollector = require('./collect-quality-metrics.js');

async function updateBundleMetrics() {
  console.log('🔄 Starting post-build bundle metrics update...\n');

  try {
    const collector = new QualityMetricsCollector();
    
    // Update bundle metrics after build
    const bundleResult = await collector.updateBundleMetricsPostBuild();
    
    if (bundleResult.status === 'success') {
      console.log('\n✅ Bundle metrics updated successfully:');
      console.log(`  📦 Total Size: ${bundleResult.totalSizeMB}MB`);
      console.log(`  📄 HTML Files: ${bundleResult.htmlFiles}`);
      console.log(`  📜 JS Files: ${bundleResult.jsFiles}`);
      console.log(`  🎨 CSS Files: ${bundleResult.cssFiles}`);
      
      if (bundleResult.warning) {
        console.log('  ⚠️  Warning: Large bundle size detected');
      }
    } else {
      console.log(`\n❌ Bundle metrics update failed: ${bundleResult.message || bundleResult.status}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Bundle metrics update failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateBundleMetrics()
    .then(() => {
      console.log('\n🎉 Post-build bundle analysis completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error(`💥 Post-build bundle analysis failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = updateBundleMetrics;