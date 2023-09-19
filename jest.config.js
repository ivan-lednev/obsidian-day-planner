/** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/support/jest-setup.ts"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[tj]s$": "@swc/jest",
    "^.+\\.svelte$": [
      "./node_modules/svelte-jester/dist/transformer.cjs",
      {
        preprocess: true,
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@testing-library/svelte|mdast.*|micromark.*|zwitch|longest-streak|unist-util.*|decode-named-character-reference))",
  ],
  moduleFileExtensions: ["js", "ts", "svelte"],
};
