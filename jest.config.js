// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  transform: {
    "^.+\\.(ts)$": "ts-jest",
  },
  coverageDirectory: "./coverage/",
  collectCoverageFrom: ["src/**/*.ts"],
  collectCoverage: true,
  testMatch: ["<rootDir>/__tests__/**/*spec.ts"],
  setupFiles: ["<rootDir>/__tests__/dotenv-config.js"],
};
