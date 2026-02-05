module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/src/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/']
};
