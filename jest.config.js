/** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/support/jest-setup.ts"],
  testEnvironment: "jsdom",
};
