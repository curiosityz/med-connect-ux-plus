module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  testMatch: ['**/*.tests.js'],
  verbose: true,
  testTimeout: 10000, // 10 second timeout
  clearMocks: true,
};