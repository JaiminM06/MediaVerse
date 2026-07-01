export default {
  testEnvironment:    'node',
  transform:          {},
  extensionsToTreatAsEsm: [],
  testMatch:          ['**/src/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    'src/services/**/*.js',
    'src/middlewares/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: { lines: 60 }
  },
  testTimeout: 10000
};
