// Source: https://github.com/vslinko/obsidian-outliner/blob/main/release.mjs
import cp from "node:child_process";
import fs from "node:fs";
import simpleGit from "simple-git";

const manifestFile = JSON.parse(fs.readFileSync("manifest.json"));
const version = manifestFile.version.split(".").map((p) => Number(p));

function stringify(obj) {
  return JSON.stringify(obj, null, 2) + "\n";
}

if (process.argv[2] === "major") {
  version[0]++;
  version[1] = 0;
  version[2] = 0;
} else if (process.argv[2] === "minor") {
  version[1]++;
  version[2] = 0;
} else if (process.argv[2] === "patch") {
  version[2]++;
} else {
  console.log("Usage: node release.js (major|minor|patch)");
  process.exit(1);
}

const versionString = version.join(".");

manifestFile.version = versionString;
fs.writeFileSync("manifest.json", stringify(manifestFile));

const packageLockFile = JSON.parse(fs.readFileSync("package-lock.json"));
packageLockFile.version = versionString;
packageLockFile.packages[""].version = versionString;
fs.writeFileSync("package-lock.json", stringify(packageLockFile));

const packageFile = JSON.parse(fs.readFileSync("package.json"));
packageFile.version = versionString;
fs.writeFileSync("package.json", stringify(packageFile));

const versionsFile = JSON.parse(fs.readFileSync("versions.json"));
const newVersionsFile = {
  [versionString]: manifestFile.minAppVersion,
  ...versionsFile
};
fs.writeFileSync("versions.json", stringify(newVersionsFile));

const supportBanner = fs.readFileSync("./support-banner.md", "utf-8");
const readmeBase = fs.readFileSync("./readme-base.md", "utf-8");
const readmeOutput = `${supportBanner}

${readmeBase}`;

fs.writeFileSync("README.md", readmeOutput, "utf-8");

const git = simpleGit();

git
  .add(["manifest.json", "package-lock.json", "package.json", "versions.json", "README.md", "CHANGELOG.md"])
  .commit(versionString, { "--no-verify": null })
  .tag([versionString])
  .push()
  .pushTags();
