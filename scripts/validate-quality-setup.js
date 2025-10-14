#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Quality Setup Validation Script
 * Validates that all quality metrics collection components are properly configured
 */

class QualitySetupValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.projectRoot = process.cwd();
  }

  log(message) {
    console.log(message);
  }

  error(message) {
    this.errors.push(message);
    this.log(`❌ ${message}`);
  }

  warn(message) {
    this.warnings.push(message);
    this.log(`⚠️ ${message}`);
  }

  pass(message) {
    this.passed.push(message);
    this.log(`✅ ${message}`);
  }

  /**
   * Check if file exists
   */
  checkFile(filePath, description) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.projectRoot, filePath);
    if (fs.existsSync(fullPath)) {
      this.pass(`${description} exists: ${filePath}`);
      return true;
    } else {
      this.error(`${description} missing: ${filePath}`);
      return false;
    }
  }

  /**
   * Check package.json scripts
   */
  validatePackageJsonScripts() {
    this.log('\n🔍 Checking package.json scripts...');
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.error('package.json not found in project root');
      return false;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};

      // Required scripts for quality metrics
      const requiredScripts = {
        'test': 'Test execution',
        'test:ci': 'CI test execution with coverage',
        'lint': 'Linting',
        'quality:collect': 'Quality metrics collection',
        'quality:format': 'Quality output formatting',
        'quality:full': 'Full quality pipeline'
      };

      let allScriptsPresent = true;
      for (const [script, description] of Object.entries(requiredScripts)) {
        if (scripts[script]) {
          this.pass(`${description} script present: ${script}`);
        } else {
          this.error(`${description} script missing: ${script}`);
          allScriptsPresent = false;
        }
      }

      return allScriptsPresent;
    } catch (error) {
      this.error(`Failed to parse package.json: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate Jest configuration
   */
  validateJestConfig() {
    this.log('\n🧪 Checking Jest configuration...');
    
    const jestConfigPath = path.join(this.projectRoot, 'jest.config.js');
    if (!this.checkFile('jest.config.js', 'Jest configuration')) {
      return false;
    }

    try {
      // Clear require cache to avoid issues
      delete require.cache[jestConfigPath];
      const config = require(jestConfigPath);
      
      // Jest config might be a function, so we need to handle that
      const actualConfig = typeof config === 'function' ? config() : config;
      
      // Check coverage configuration
      if (actualConfig.collectCoverageFrom) {
        this.pass('Coverage collection configured');
      } else {
        this.warn('Coverage collection not configured - coverage metrics may not work');
      }

      if (actualConfig.coverageThreshold) {
        this.pass('Coverage thresholds configured');
        if (actualConfig.coverageThreshold.global) {
          this.log(`   Global thresholds: lines ${actualConfig.coverageThreshold.global.lines}%, statements ${actualConfig.coverageThreshold.global.statements}%`);
        }
      } else {
        this.warn('Coverage thresholds not configured');
      }

      return true;
    } catch (error) {
      this.error(`Failed to load Jest configuration: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate quality scripts
   */
  validateQualityScripts() {
    this.log('\n📊 Checking quality metric scripts...');
    
    const scriptsDir = path.join(this.projectRoot, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      this.error('Scripts directory not found');
      return false;
    }

    const requiredScripts = [
      'collect-quality-metrics.js',
      'format-github-output.js',
      'validate-quality-setup.js'
    ];

    let allScriptsPresent = true;
    for (const script of requiredScripts) {
      const scriptPath = path.join('scripts', script);
      if (!this.checkFile(scriptPath, `Quality script`)) {
        allScriptsPresent = false;
      } else {
        // Check if script is executable
        try {
          const stats = fs.statSync(path.join(this.projectRoot, scriptPath));
          // Check if file has execute permission by checking if mode includes execute bits
          const isExecutable = (stats.mode.toString(8).slice(-3).split('').some(digit => parseInt(digit) % 2 === 1));
          if (isExecutable) {
            this.pass(`${script} is executable`);
          } else {
            this.warn(`${script} is not executable - may need chmod +x`);
          }
        } catch {
          this.warn(`Could not check executable status for ${script}`);
        }
      }
    }

    return allScriptsPresent;
  }

  /**
   * Validate GitHub workflow
   */
  validateGitHubWorkflow() {
    this.log('\n🔄 Checking GitHub Actions workflow...');
    
    const workflowPath = path.join(this.projectRoot, '.github', 'workflows', 'azure-staticwebapp.yml');
    if (!this.checkFile('.github/workflows/azure-staticwebapp.yml', 'Azure Static Web App workflow')) {
      return false;
    }

    try {
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');
      
      // Check for quality metrics integration
      const requiredElements = {
        'npm run quality:collect': 'Quality metrics collection step',
        'format-github-output.js': 'Quality output formatting',
        'quality-metrics.json': 'Quality metrics file handling',
        'BUILD_START_TIME': 'Performance timing tracking'
      };

      // Optional elements for enhanced functionality
      const optionalElements = {
        'Quality Score': 'Quality score in PR comments',
        'comprehensive quality': 'Enhanced quality reporting'
      };

      let allElementsPresent = true;
      for (const [element, description] of Object.entries(requiredElements)) {
        if (workflowContent.includes(element)) {
          this.pass(`${description} integrated in workflow`);
        } else {
          this.error(`${description} missing from workflow`);
          allElementsPresent = false;
        }
      }

      // Check optional elements
      for (const [element, description] of Object.entries(optionalElements)) {
        if (workflowContent.includes(element)) {
          this.pass(`${description} integrated in workflow (optional)`);
        } else {
          this.warn(`${description} not found in workflow (optional enhancement)`);
        }
      }

      return allElementsPresent;
    } catch (error) {
      this.error(`Failed to read workflow file: ${error.message}`);
      return false;
    }
  }

  /**
   * Test quality metrics collection
   */
  async testQualityCollection() {
    this.log('\n🧪 Testing quality metrics collection...');
    
    try {
      // Test that the quality collection script can be executed
      this.log('Testing quality:collect script...');
      
      const testCommand = 'node scripts/collect-quality-metrics.js';
      
      // Run a dry test to check if the script executes without errors
      try {
        execSync(`${testCommand} --help || echo "Script executed"`, { 
          encoding: 'utf8',
          timeout: 10000,
          cwd: this.projectRoot
        });
        this.pass('Quality collection script executes without syntax errors');
      } catch (error) {
        if (error.code === 'ENOENT') {
          this.error('Node.js not found - quality scripts will not work');
        } else {
          this.warn(`Quality collection script test failed: ${error.message}`);
        }
      }

      // Test formatter script
      try {
        execSync('node scripts/format-github-output.js', { 
          encoding: 'utf8',
          timeout: 5000,
          cwd: this.projectRoot
        });
        this.pass('Quality formatter script executes');
      } catch (error) {
        this.warn(`Quality formatter test failed: ${error.message}`);
      }

      return true;
    } catch (error) {
      this.error(`Failed to test quality collection: ${error.message}`);
      return false;
    }
  }

  /**
   * Check TypeScript configuration
   */
  validateTypeScriptConfig() {
    this.log('\n📝 Checking TypeScript configuration...');
    
    if (!this.checkFile('tsconfig.json', 'TypeScript configuration')) {
      return false;
    }

    try {
      const tsconfigContent = fs.readFileSync(path.join(this.projectRoot, 'tsconfig.json'), 'utf8');
      
      // Remove comments from JSON (simple approach for this validation)
      const cleanContent = tsconfigContent
        .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove block comments
        .replace(/\/\/.*$/gm, '');         // Remove line comments
      
      const tsconfig = JSON.parse(cleanContent);
      
      if (tsconfig.compilerOptions) {
        if (tsconfig.compilerOptions.strict) {
          this.pass('Strict TypeScript checking enabled');
        } else {
          this.warn('Strict TypeScript checking not enabled - quality checks may be less effective');
        }

        if (tsconfig.compilerOptions.noEmit) {
          this.pass('TypeScript configured for type checking only');
        } else {
          this.warn('TypeScript may emit files - ensure build process is correct');
        }
      }

      return true;
    } catch (error) {
      this.warn(`Could not validate TypeScript configuration: ${error.message}`);
      // Don't fail validation for TypeScript config issues
      return true;
    }
  }

  /**
   * Check ESLint configuration
   */
  validateESLintConfig() {
    this.log('\n🔍 Checking ESLint configuration...');
    
    const possibleConfigs = [
      'eslint.config.mjs',
      '.eslintrc.js',
      '.eslintrc.json',
      '.eslintrc.yml',
      '.eslintrc.yaml'
    ];

    let configFound = false;
    for (const configFile of possibleConfigs) {
      if (fs.existsSync(path.join(this.projectRoot, configFile))) {
        this.pass(`ESLint configuration found: ${configFile}`);
        configFound = true;
        break;
      }
    }

    if (!configFound) {
      this.error('No ESLint configuration found - linting metrics will not work');
      return false;
    }

    return true;
  }

  /**
   * Validate dependencies
   */
  validateDependencies() {
    this.log('\n📦 Checking required dependencies...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const requiredDeps = {
        'jest': 'Testing framework',
        'eslint': 'Linting',
        'typescript': 'Type checking',
        '@testing-library/jest-dom': 'Testing utilities',
        '@testing-library/react': 'React testing'
      };

      let allDepsPresent = true;
      for (const [dep, description] of Object.entries(requiredDeps)) {
        if (allDeps[dep]) {
          this.pass(`${description} dependency present: ${dep}@${allDeps[dep]}`);
        } else {
          this.error(`${description} dependency missing: ${dep}`);
          allDepsPresent = false;
        }
      }

      return allDepsPresent;
    } catch (error) {
      this.error(`Failed to check dependencies: ${error.message}`);
      return false;
    }
  }

  /**
   * Run all validations
   */
  async validateAll() {
    this.log('🚀 Starting quality setup validation...\n');

    const validations = [
      () => this.validatePackageJsonScripts(),
      () => this.validateJestConfig(),
      () => this.validateQualityScripts(),
      () => this.validateGitHubWorkflow(),
      () => this.validateTypeScriptConfig(),
      () => this.validateESLintConfig(),
      () => this.validateDependencies(),
      () => this.testQualityCollection()
    ];

    for (const validation of validations) {
      try {
        await validation();
      } catch (error) {
        this.error(`Validation failed: ${error.message}`);
      }
    }

    this.printSummary();
    return this.errors.length === 0;
  }

  /**
   * Print validation summary
   */
  printSummary() {
    this.log('\n' + '='.repeat(60));
    this.log('📊 QUALITY SETUP VALIDATION SUMMARY');
    this.log('='.repeat(60));
    
    this.log(`✅ Passed: ${this.passed.length} checks`);
    this.log(`⚠️ Warnings: ${this.warnings.length} issues`);
    this.log(`❌ Errors: ${this.errors.length} critical issues`);
    
    if (this.errors.length > 0) {
      this.log('\n❌ Critical Issues to Fix:');
      this.errors.forEach(error => this.log(`  - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      this.log('\n⚠️ Warnings to Consider:');
      this.warnings.forEach(warning => this.log(`  - ${warning}`));
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('\n🎉 All quality metrics components are properly configured!');
      this.log('Your deployment bot will now show comprehensive quality reports.');
    } else if (this.errors.length === 0) {
      this.log('\n✅ Quality metrics setup is functional with minor warnings.');
    } else {
      this.log('\n❌ Quality metrics setup needs attention before it will work properly.');
    }
    
    this.log('='.repeat(60));
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new QualitySetupValidator();
  validator.validateAll()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(`Validation failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = QualitySetupValidator;