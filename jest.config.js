/** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/support/jest-setup.ts"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[tj]s$": "@swc/jest",
  },
  collectCoverageFrom: ["src/**/*/*.ts"],
  transformIgnorePatterns: [
    "/node_modules/(?!(svelte.*|esm-env.*|mdast.*|micromark.*|zwitch|longest-streak|unist-util.*|decode-named-character-reference))",
  ],
  moduleFileExtensions: ["js", "ts"],
};
