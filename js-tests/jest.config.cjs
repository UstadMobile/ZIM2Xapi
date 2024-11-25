const path = require('path');

module.exports = {
  rootDir: '.',  // Jest should start looking from the current directory
  testMatch: ['**/*.test.js'],  // Match all files ending in .test.js in the current directory
  transform: {
    '^.+\\.js$': 'babel-jest'  // Transform all JS files using Babel
  },
  moduleFileExtensions: ['js', 'json'],
  transformIgnorePatterns: ["/node_modules/"],
  testEnvironment: 'jest-environment-jsdom'
};