/** @type {import('jest').Config} */
export default {
  // Use the experimental ESM runner built into Jest
  transform: {},
  testMatch: ["**/tests/**/*.test.js"],
  // Give mongodb-memory-server time to download / spin up
  testTimeout: 30_000,
  // Run test files serially so they don't fight over the in-memory DB
  maxWorkers: 1,
};
