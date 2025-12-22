#!/usr/bin/env node

/**
 * Prepare TON MCP for npm publication
 * This script runs pre-publish checks and optimizations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🚀 Preparing TON MCP for publication...\n');

// Check if we're in the right directory
if (!fs.existsSync(path.join(rootDir, 'package.json'))) {
  console.error('❌ Error: package.json not found. Run from project root.');
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

console.log('📦 Package:', packageJson.name, 'v' + packageJson.version);
console.log('');

// Run tests
console.log('🧪 Running test suite...');
try {
  execSync('npm run test', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Tests passed\n');
} catch (error) {
  console.error('❌ Tests failed. Fix issues before publishing.');
  process.exit(1);
}

// Build project
console.log('🔨 Building project...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Build successful\n');
} catch (error) {
  console.error('❌ Build failed. Check for TypeScript errors.');
  process.exit(1);
}

// Verify build output
console.log('🔍 Verifying build output...');
const distDir = path.join(rootDir, 'dist');
const requiredFiles = [
  'index.js',
  'services/ton-api.js',
  'services/search-index.js',
  'resources/',
  'utils/index.js'
];

let buildValid = true;
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(distDir, file))) {
    console.error(`❌ Missing build file: ${file}`);
    buildValid = false;
  }
}

if (!buildValid) {
  console.error('❌ Build verification failed.');
  process.exit(1);
}
console.log('✅ Build verification passed\n');

// Check package files
console.log('📋 Checking package files...');
const packageFiles = packageJson.files || [];
const requiredPackageFiles = [
  'dist',
  'README.md',
  'AI_HELPER_GUIDE.md',
  'package.json'
];

for (const file of requiredPackageFiles) {
  if (!packageFiles.includes(file) && !fs.existsSync(path.join(rootDir, file))) {
    console.warn(`⚠️  File not in package or missing: ${file}`);
  }
}
console.log('✅ Package files verified\n');

// Check bin command
console.log('🔧 Checking binary command...');
if (!packageJson.bin || !packageJson.bin['ton-mcp']) {
  console.error('❌ Binary command "ton-mcp" not configured in package.json');
  process.exit(1);
}

const binPath = path.join(distDir, 'index.js');
if (!fs.existsSync(binPath)) {
  console.error('❌ Binary target file does not exist:', binPath);
  process.exit(1);
}
console.log('✅ Binary command configured\n');

// Validate package.json fields
console.log('📝 Validating package.json...');
const requiredFields = [
  'name', 'version', 'description', 'main', 'module',
  'repository', 'homepage', 'bugs', 'license', 'author',
  'type', 'files', 'bin', 'scripts'
];

let validationPassed = true;
for (const field of requiredFields) {
  if (!packageJson[field]) {
    console.error(`❌ Missing required field: ${field}`);
    validationPassed = false;
  }
}

if (!packageJson.name.includes('ton-mcp')) {
  console.warn('⚠️  Package name should include "ton-mcp"');
}

if (!packageJson.repository.url.includes('github.com/kunaldhongade/ton-mcp')) {
  console.warn('⚠️  Repository URL should point to kunaldhongade/ton-mcp');
}

if (!validationPassed) {
  console.error('❌ Package validation failed.');
  process.exit(1);
}
console.log('✅ Package validation passed\n');

// Final checks
console.log('🎯 Final pre-publish checks...');

// Check if version is appropriate
const version = packageJson.version;
if (version.includes('-')) {
  console.warn('⚠️  Pre-release version detected. Consider using stable version for production.');
}

// Check if dist is gitignored (it should be)
const gitignore = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
if (!gitignore.includes('dist/')) {
  console.warn('⚠️  Consider adding dist/ to .gitignore');
}

console.log('✅ Final checks completed\n');

console.log('🎉 TON MCP is ready for publication!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Update version if needed: npm version patch|minor|major');
console.log('2. Publish: npm publish');
console.log('3. Verify: npm view ton-mcp');
console.log('');
console.log('🚀 Happy publishing!');

process.exit(0);
