/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Encontra testes em: src/test/**/*.spec.ts, src/test/unit/**/*.spec.ts, src/test/http/**/*.spec.ts
  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/src/test/**/*.spec.ts'],
  setupFiles: ['<rootDir>/src/test/setupEnv.ts'],
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/config/**',
    '!src/database/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
  clearMocks: true,
  passWithNoTests: true,
};

// testMatch: ['**/src/**/*.service.test.ts']
