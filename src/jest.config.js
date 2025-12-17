module.exports = {
  testEnvironment: 'node',
  rootDir: '..',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/reset-db.js',
    '!src/test-db.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: [
    '**/tests/**/__tests__/**/*.js',
    '**/tests/**/?(*.)+(spec|test).js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
  ],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  testTimeout: 10000
};

