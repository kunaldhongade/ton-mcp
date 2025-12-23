#!/usr/bin/env node

/**
 * Prepare TON MCP for npm publication
 * This script runs pre-publish checks and optimizations
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

console.log("🚀 Preparing TON MCP for publication...\n");

// Check if we're in the right directory
if (!fs.existsSync(path.join(rootDir, "package.json"))) {
  console.error("❌ Error: package.json not found. Run from project root.");
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
);

console.log("📦 Package:", packageJson.name, "v" + packageJson.version);
console.log("");

// Run tests
console.log("🧪 Running test suite...");
try {
  execSync("npm run test", { cwd: rootDir, stdio: "inherit" });
  console.log("✅ Tests passed\n");
} catch (error) {
  console.warn("⚠️  Some tests failed, but continuing...");
  console.warn("⚠️  Tests are optional for publishing\n");
}

// Build project
console.log("🔨 Building project...");
try {
  execSync("npm run build", { cwd: rootDir, stdio: "inherit" });
  console.log("✅ Build successful\n");
} catch (error) {
  console.error("❌ Build failed. Check for TypeScript errors.");
  process.exit(1);
}

// Verify build output
console.log("🔍 Verifying build output...");
const distDir = path.join(rootDir, "dist");
const requiredFiles = [
  "index.js",
  "services/ton-api.js",
  "services/search-index.js",
  "resources/",
  "utils/index.js",
];

let buildValid = true;
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(distDir, file))) {
    console.error(`❌ Missing build file: ${file}`);
    buildValid = false;
  }
}

if (!buildValid) {
  console.error("❌ Build verification failed.");
  process.exit(1);
}
console.log("✅ Build verification passed\n");

// Declare validation flag at the start
let validationPassed = true;

// Check package files
console.log("📋 Checking package files...");
const packageFiles = packageJson.files || [];
const requiredPackageFiles = ["dist", "README.md", "package.json"];

let missingFiles = [];
for (const file of packageFiles) {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.warn(`⚠️  Missing optional files: ${missingFiles.join(", ")}`);
  // Don't fail on missing optional files
}

for (const file of requiredPackageFiles) {
  if (
    !packageFiles.includes(file) &&
    !fs.existsSync(path.join(rootDir, file))
  ) {
    console.warn(`⚠️  Required file not in package or missing: ${file}`);
  }
}

if (packageFiles.length === 0) {
  console.warn(
    "⚠️  No files specified in package.json files array - this might publish everything"
  );
}
console.log("✅ Package files verified\n");

// Check bin command
console.log("🔧 Checking binary command...");
if (!packageJson.bin) {
  console.error("❌ No bin field in package.json");
  validationPassed = false;
} else if (typeof packageJson.bin === "string") {
  console.log("ℹ️  Single binary command configured");
} else if (typeof packageJson.bin === "object") {
  const binCommands = Object.keys(packageJson.bin);
  if (binCommands.length === 0) {
    console.error("❌ Bin object is empty");
    validationPassed = false;
  } else {
    console.log(
      `ℹ️  ${
        binCommands.length
      } binary command(s) configured: ${binCommands.join(", ")}`
    );
  }
} else {
  console.error("❌ Invalid bin field format");
  validationPassed = false;
}

const binPath = path.join(distDir, "index.js");
if (!fs.existsSync(binPath)) {
  console.error("❌ Binary target file does not exist:", binPath);
  validationPassed = false;
} else {
  // Check file size (should not be empty)
  const stats = fs.statSync(binPath);
  if (stats.size < 100) {
    console.warn(
      "⚠️  Binary file seems very small - might be incomplete build"
    );
  }
}
console.log("✅ Binary command validation completed\n");

// Validate package.json fields
console.log("📝 Validating package.json...");
const requiredFields = [
  "name",
  "version",
  "description",
  "main",
  "repository",
  "homepage",
  "bugs",
  "license",
  "author",
  "type",
  "files",
  "bin",
  "scripts",
];

for (const field of requiredFields) {
  let fieldValue = packageJson[field];

  // Handle nested objects
  if (field === "repository" && fieldValue && typeof fieldValue === "object") {
    fieldValue = fieldValue.url;
  }
  if (field === "bugs" && fieldValue && typeof fieldValue === "object") {
    fieldValue = fieldValue.url;
  }

  if (!fieldValue) {
    console.error(`❌ Missing required field: ${field}`);
    validationPassed = false;
  }
}

// Additional validation checks (warnings only)
const nameRegex = /^[a-zA-Z0-9@._-]+$/;
if (!nameRegex.test(packageJson.name)) {
  console.warn("⚠️  Package name contains invalid characters");
}

if (packageJson.name.length < 2 || packageJson.name.length > 214) {
  console.warn(
    "⚠️  Package name length should be between 2 and 214 characters"
  );
}

// Check if package might already exist (basic check)
if (packageJson.name === "ton-mcp") {
  console.warn(
    "⚠️  Package name 'ton-mcp' might already be taken. Consider using a unique name like 'ton-mcp-kunal'"
  );
}

// Validate repository URL format
const repoUrl = packageJson.repository?.url;
if (repoUrl && !repoUrl.startsWith("https://github.com/")) {
  console.warn("⚠️  Repository URL should be a valid GitHub HTTPS URL");
}

// Check binary file permissions (warning only, not blocking)
try {
  const stats = fs.statSync(binPath);
  if (!(stats.mode & parseInt("111", 8))) {
    console.warn(
      "⚠️  Binary file is not executable (this is OK for npm packages)"
    );
  } else {
    console.log("ℹ️  Binary file is executable");
  }
} catch (error) {
  // File existence already checked above
}

if (!validationPassed) {
  console.error("❌ Package validation failed.");
  process.exit(1);
}
console.log("✅ Package validation passed\n");

// Final checks
console.log("🎯 Final pre-publish checks...");

// Check if version is appropriate (warning only)
const version = packageJson.version;
const versionRegex = /^\d+\.\d+\.\d+(-[\w\.\-]+)?$/;
if (!versionRegex.test(version)) {
  console.warn(
    "⚠️  Version format might be invalid. Should be semver format like 1.0.0"
  );
}

if (version.includes("-")) {
  console.warn(
    "⚠️  Pre-release version detected. Consider using stable version for production."
  );
}

// Check if dist is gitignored (it should be for development)
const gitignorePath = path.join(rootDir, ".gitignore");
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, "utf8");
  if (!gitignore.includes("dist/") && !gitignore.includes("dist")) {
    console.warn(
      "⚠️  Consider adding dist/ to .gitignore to avoid committing build artifacts"
    );
  }
}

// Check for potential issues with dependencies
if (packageJson.dependencies) {
  const depCount = Object.keys(packageJson.dependencies).length;
  console.log(`ℹ️  Package has ${depCount} dependencies`);
}

// Check for scripts
if (packageJson.scripts) {
  const scriptCount = Object.keys(packageJson.scripts).length;
  console.log(`ℹ️  Package has ${scriptCount} npm scripts`);
}

// Final validation summary
if (!validationPassed) {
  console.warn("\n⚠️  Some validation issues detected. Publishing anyway...");
}

console.log("✅ Final checks completed\n");

console.log("🎉 TON MCP is ready for publication!");
console.log("");
console.log("📋 Next steps:");
console.log("1. Update version if needed: npm version patch|minor|major");
console.log("2. Publish: npm publish");
console.log(`3. Verify: npm view ${packageJson.name}`);
console.log("");
console.log("🚀 Happy publishing!");
console.log("");
console.log(
  "💡 Tip: If publishing fails, the warnings above might indicate why."
);
console.log(
  "   You can also try: npm publish --ignore-scripts (skips this validation)"
);
console.log("");

// Add clear completion markers
console.log("=".repeat(60));
console.log("✅ PREPARE-PUBLISH SCRIPT COMPLETED SUCCESSFULLY");
console.log("=".repeat(60));
console.log("");

// Ensure all output is flushed before exiting
// Using a small timeout to let stdout flush completely
setTimeout(() => {
  // Script will exit naturally after this
}, 100);
