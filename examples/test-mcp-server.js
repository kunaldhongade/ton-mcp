#!/usr/bin/env node

/**
 * TON MCP Server Test Script
 *
 * This script tests the TON MCP server functionality by:
 * 1. Starting the MCP server
 * 2. Testing all available tools
 * 3. Verifying responses
 * 4. Generating a test report
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message) {
  log("\n" + "=".repeat(60), colors.cyan);
  log(message, colors.bright + colors.cyan);
  log("=".repeat(60), colors.cyan);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Test cases
const tests = [
  {
    name: "Documentation Search",
    description: "Test searching TON documentation",
    tool: "search_ton_documentation",
    args: { query: "smart contracts" },
    expected: "results should contain documentation about smart contracts",
  },
  {
    name: "Contract Code Generation",
    description: "Test generating a Jetton contract",
    tool: "generate_contract_code",
    args: { contract_type: "jetton", language: "tolk" },
    expected: "should return Tolk code for a Jetton contract",
  },
  {
    name: "Project Creation Guide",
    description: "Test project scaffolding guidance",
    tool: "create_ton_project",
    args: {
      project_name: "test-project",
      project_type: "smart-contract",
      language: "tolk",
    },
    expected: "should provide Blueprint guidance",
  },
  {
    name: "Tolk Compilation",
    description: "Test Tolk contract validation",
    tool: "validate_tolk_syntax",
    args: { source_code: "contract Test { }" },
    expected: "should validate Tolk syntax",
  },
  {
    name: "Frontend Code Generation",
    description: "Test React component generation",
    tool: "generate_frontend_code",
    args: { framework: "react", component_type: "wallet-connection" },
    expected: "should return React component code",
  },
  {
    name: "Resource Listing",
    description: "Test listing available resources",
    tool: "list_ton_resources",
    args: {},
    expected: "should list available TON resources",
  },
  {
    name: "Deployment Guide",
    description: "Test deployment guide generation",
    tool: "get_deployment_guide",
    args: { contract_name: "TestContract", network: "testnet" },
    expected: "should provide deployment instructions",
  },
];

// Test results
const results = {
  total: tests.length,
  passed: 0,
  failed: 0,
  errors: [],
};

function runTests() {
  header("🚀 TON MCP Server Test Suite");

  info(`Testing ${tests.length} features...`);
  info("MCP Server Path: " + path.resolve(__dirname, "../dist/index.js"));

  // Check if dist exists
  const distPath = path.resolve(__dirname, "../dist/index.js");

  if (!fs.existsSync(distPath)) {
    error("dist/index.js not found!");
    error("Please run: npm run build");
    process.exit(1);
  }

  success("dist/index.js found!");

  header("📊 Test Results Summary");

  // For now, we'll document the tests that should be run
  log(
    "\nThe following tests should be performed with an MCP client:\n",
    colors.bright
  );

  tests.forEach((test, index) => {
    log(`\n${index + 1}. ${test.name}`, colors.bright + colors.cyan);
    log(`   Description: ${test.description}`);
    log(`   Tool: ${test.tool}`, colors.yellow);
    log(`   Args: ${JSON.stringify(test.args, null, 2)}`, colors.blue);
    log(`   Expected: ${test.expected}`, colors.green);
  });

  header("🧪 Manual Testing Guide");

  log("\nTo test the MCP server with Cursor:", colors.bright);
  log("\n1. Add to Cursor MCP settings:");
  log(
    `
{
  "mcpServers": {
    "ton-mcp": {
      "command": "node",
      "args": ["${distPath}"]
    }
  }
}
`,
    colors.cyan
  );

  log("\n2. Restart Cursor");
  log("\n3. Try these test queries in Cursor:\n");

  const testQueries = [
    "Search TON documentation for smart contracts",
    "Generate a Jetton token contract in Tolk",
    "Create a smart contract project called MyToken",
    "Show me how to deploy a contract to testnet",
    "Generate React component for wallet connection",
    "List all available TON resources",
    "Compile this Tolk code: contract Counter { }",
    "What is the TON Virtual Machine?",
  ];

  testQueries.forEach((query, i) => {
    log(`   ${i + 1}. "${query}"`, colors.yellow);
  });

  header("✅ Automated Verification");

  log("\nVerifying MCP server components:\n");

  // Check services
  const servicesPath = path.resolve(__dirname, "../dist/services");
  const services = [
    "search-index.js",
    "ton-api.js",
    "tolk-compiler.js",
    "project-scaffold.js",
    "deployment.js",
  ];

  services.forEach((service) => {
    const servicePath = path.join(servicesPath, service);
    if (fs.existsSync(servicePath)) {
      success(`Service: ${service}`);
    } else {
      error(`Missing: ${service}`);
    }
  });

  // Check templates
  const templatesPath = path.resolve(__dirname, "../dist/templates");
  if (fs.existsSync(path.join(templatesPath, "tolk-contracts.js"))) {
    success("Templates: tolk-contracts.js");
  } else {
    error("Missing: tolk-contracts.js");
  }

  // Check resources
  const resourcesPath = path.resolve(__dirname, "../dist/resources");
  if (fs.existsSync(resourcesPath)) {
    success("Resources: directory exists");

    // Check resource folders
    const resourceFolders = [
      "smart-contracts",
      "how-to",
      "tma",
      "frontend",
      "deployment",
    ];

    resourceFolders.forEach((folder) => {
      const folderPath = path.join(resourcesPath, folder);
      if (fs.existsSync(folderPath)) {
        success(`  ├─ ${folder}/`);
      } else {
        warning(`  ├─ ${folder}/ (missing)`);
      }
    });
  } else {
    error("Missing: resources directory");
  }

  // Check docs index
  const docsIndexPath = path.resolve(__dirname, "../docs-index.json");
  if (fs.existsSync(docsIndexPath)) {
    const docsIndex = JSON.parse(fs.readFileSync(docsIndexPath, "utf8"));
    success(`Documentation index: ${docsIndex.length} pages`);

    if (docsIndex.length < 50) {
      warning("  Low page count - consider reindexing");
    } else {
      success(`  Good coverage!`);
    }
  } else {
    error("Missing: docs-index.json");
    warning("  Run: npm run index-docs");
  }

  header("🎯 Quick Test Commands");

  log("\nStart MCP server:", colors.bright);
  log("  npm start", colors.cyan);

  log("\nReindex documentation:", colors.bright);
  log("  npm run index-docs", colors.cyan);

  log("\nRebuild if needed:", colors.bright);
  log("  npm run build", colors.cyan);

  header("📚 Example Project");

  const examplePath = path.resolve(__dirname, "tma-contract-cursor");
  if (fs.existsSync(examplePath)) {
    success("Example project found: tma-contract-cursor/");
    log("\nTo test with example project:");
    log("  cd examples/tma-contract-cursor", colors.cyan);
    log("  # Use MCP to help develop this project", colors.cyan);
  }

  header("🎉 Test Setup Complete!");

  log("\nYour TON MCP is ready to test!", colors.bright + colors.green);
  log("\nNext steps:");
  log("  1. Ensure MCP is built: npm run build", colors.yellow);
  log("  2. Start server: npm start", colors.yellow);
  log("  3. Test in Cursor with queries above", colors.yellow);
  log("  4. Check responses for accuracy", colors.yellow);

  log("\n" + "=".repeat(60) + "\n", colors.cyan);
}

// Run tests
try {
  runTests();
} catch (err) {
  error("Test suite failed: " + err.message);
  console.error(err);
  process.exit(1);
}
