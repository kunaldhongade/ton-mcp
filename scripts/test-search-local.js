#!/usr/bin/env node

/**
 * Quick test to verify search index loads correctly
 * Run after: npm link
 */

import { searchIndexService } from "../dist/services/search-index.js";

console.log("🧪 Testing Search Index Locally\n");

async function test() {
  try {
    // Wait for initialization
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 1: Get stats
    console.log("1️⃣  Getting index stats...");
    const stats = searchIndexService.getStats();
    console.log(`   ✅ Documents: ${stats.totalDocuments}`);
    console.log(`   ✅ Categories: ${stats.categories.length}`);
    console.log("");

    // Test 2: Search
    console.log("2️⃣  Testing search...");
    const results = await searchIndexService.search("Tact smart contract");
    console.log(`   ✅ Found ${results.length} results`);

    if (results.length > 0) {
      console.log(`   ✅ Top result: ${results[0].document.title}`);
    }
    console.log("");

    // Test 3: Search another query
    console.log("3️⃣  Testing another search...");
    const results2 = await searchIndexService.search("TON Connect");
    console.log(`   ✅ Found ${results2.length} results`);
    console.log("");

    // Summary
    console.log("📊 Test Summary");
    console.log("===============");
    if (stats.totalDocuments > 0) {
      console.log("✅ Search index loaded successfully");
      console.log("✅ __dirname fix working correctly");
      console.log("✅ Ready to publish to npm");
    } else {
      console.log("❌ Search index empty - something went wrong");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("\nThis means the fix is NOT working yet.");
    process.exit(1);
  }
}

test();
