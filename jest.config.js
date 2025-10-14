const nextJest = require('next/jest.js')

const createJestConfig = nextJest({
  dir: './',
})

// Check for coverage threshold bypass flags
const skipCoverageThreshold = process.env.SKIP_COVERAGE_THRESHOLD === 'true' || 
                             process.env.NO_COVERAGE_THRESHOLD === 'true' ||
                             process.argv.includes('--no-coverage-threshold');

// Check if we should enforce strict coverage (fail on low coverage)
const strictCoverage = process.env.STRICT_COVERAGE === 'true' || 
                      process.env.CI_STRICT_COVERAGE === 'true' ||
                      process.argv.includes('--strict-coverage');

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@/theme/(.*)$': '<rootDir>/src/theme/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.config.{js,ts}',
    '!src/**/index.ts',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(minimal-shared|es-toolkit)/)',
  ],
  // Only set coverage thresholds if strict coverage is enabled
  // By default, coverage is collected but not enforced (non-blocking)
  ...(strictCoverage && !skipCoverageThreshold ? {
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  } : {}),
}

// Log coverage threshold status for transparency
if (skipCoverageThreshold) {
  console.log('🔄 Coverage thresholds disabled - tests will run without coverage enforcement');
} else if (strictCoverage) {
  console.log('🛡️  Strict coverage mode active - enforcing 80% coverage on all metrics (BLOCKING)');
} else {
  console.log('⚠️  Non-blocking mode active - coverage will be collected but won\'t block on low coverage');
  console.log('   Use STRICT_COVERAGE=true to enable blocking coverage enforcement');
}

module.exports = createJestConfig(config)