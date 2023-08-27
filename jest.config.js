/** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/support/jest-setup.ts"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[tj]s$": "ts-jest",
    "^.+\\.svelte$": [
      "./node_modules/svelte-jester/dist/transformer.cjs",
      {
        preprocess: true,
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!@testing-library/svelte)"],
  moduleFileExtensions: ["js", "ts", "svelte"],
  modulePathIgnorePatterns: ['parser.test.ts']
};
