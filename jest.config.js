module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/suite-core/apps/disk-dominator/$1',
    '^@suite/(.*)$': '<rootDir>/suite-core/packages/@suite/$1/src',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        module: 'commonjs',
        esModuleInterop: true,
        allowJs: true,
      },
    }],
  },
  
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  
  // Coverage
  collectCoverageFrom: [
    'suite-core/**/*.{ts,tsx}',
    'src-tauri/src/**/*.rs',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/__tests__/**',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/**/*.test.(ts|tsx)'],
      testPathIgnorePatterns: ['/e2e/', '/integration/', '/performance/'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/**/integration/**/*.test.(ts|tsx)'],
      testEnvironment: 'node',
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/**/e2e/**/*.test.(ts|tsx)'],
      preset: 'jest-playwright-preset',
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/**/performance/**/*.test.(ts|tsx)'],
      testEnvironment: 'node',
    },
  ],
  
  // Globals
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: {
        jsx: 'react',
        module: 'commonjs',
        esModuleInterop: true,
        allowJs: true,
      },
    },
  },
};