#!/usr/bin/env node

import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

interface DocPage {
  id: string;
  title: string;
  url: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: string;
}

// Comprehensive script to index ALL TON documentation from docs.ton.org
async function indexTonDocumentation() {
  const baseUrl = "https://docs.ton.org";
  const docs: DocPage[] = [];
  const visited = new Set<string>();
  const toVisit: string[] = ["/"];
  let processedCount = 0;
  const maxPages = 500; // Safety limit - increase if docs.ton.org grows

  try {
    console.log("🚀 Starting comprehensive TON documentation indexing...");
    console.log("📍 Base URL:", baseUrl);

    while (toVisit.length > 0 && processedCount < maxPages) {
      const path = toVisit.shift()!;
      if (visited.has(path)) continue;

      visited.add(path);
      processedCount++;

      try {
        const pageUrl = `${baseUrl}${path}`;
        console.log(`[${processedCount}/${maxPages}] 📄 Indexing: ${pageUrl}`);

        const pageResponse = await axios.get(pageUrl, {
          timeout: 10000,
          headers: {
            "User-Agent": "TON-MCP-Indexer/1.0 (Educational Purpose)",
          },
        });

        const $ = cheerio.load(pageResponse.data);

        // Extract title
        const title =
          $("h1").first().text().trim() ||
          $("title").text().trim().replace(" | The Open Network", "") ||
          path.split("/").filter(Boolean).pop() ||
          "TON Documentation";

        // Extract main content (try multiple selectors with priority)
        let content = "";
        const contentSelectors = [
          "article", // Most specific
          "main article",
          ".markdown-body",
          "main .markdown",
          "[role='main']",
          ".docMainContainer", // Docusaurus
          ".theme-doc-markdown", // Docusaurus v2/v3
          "main", // Fallback
          "body", // Last resort
        ];

        for (const selector of contentSelectors) {
          // Remove script, style, and navigation elements before extracting text
          const $clone = $(selector).clone();
          $clone
            .find(
              "script, style, nav, .nav, .navbar, .sidebar, .menu, .footer, .header, .breadcrumb, noscript"
            )
            .remove();

          const text = $clone.text().trim();
          if (text.length > content.length) {
            content = text;
          }
        }

        // CRITICAL: Clean up HTML artifacts and excessive whitespace
        content = content
          .replace(/\s+/g, " ") // Multiple spaces → single space
          .replace(/\n+/g, "\n") // Multiple newlines → single newline
          .replace(/\t+/g, " ") // Tabs → spaces
          .replace(/&nbsp;/g, " ") // HTML entities
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();

        // Log extraction for debugging
        if (content.length === 0) {
          console.log(`  ⚠️  No content found for: ${title}`);
        } else if (content.length < 200) {
          console.log(`  ⚠️  Low content (${content.length} chars): ${title}`);
        }

        // Only save pages with meaningful content (lowered threshold)
        if (content.length > 100) {
          // Extract metadata
          const category = categorizeContent(path, title, content);
          const tags = extractTags(path, title, content);

          docs.push({
            id: `docs-ton-org-${path.replace(/[^a-z0-9]/gi, "-")}`,
            title,
            url: pageUrl,
            content: content.substring(0, 10000), // Keep more content
            category,
            tags,
            lastUpdated: new Date().toISOString(),
          });

          console.log(
            `  ✅ Indexed: ${title} (${content.length} chars, ${tags.length} tags)`
          );
        }

        // Find all internal links to crawl
        $("a[href]").each((_, element) => {
          const href = $(element).attr("href");
          if (!href) return;

          // Only follow internal documentation links
          if (href.startsWith("/") && !href.startsWith("//")) {
            // Clean up the path
            const cleanPath = href.split("#")[0].split("?")[0];

            // Skip non-documentation paths and translations
            if (
              !cleanPath.includes("/api/") &&
              !cleanPath.includes("/blog/") &&
              !cleanPath.includes("/mandarin/") && // Skip Chinese translations
              !cleanPath.includes("/ru/") && // Skip Russian translations
              !cleanPath.includes("/ko/") && // Skip Korean translations
              !cleanPath.startsWith("/mtproto") && // Skip MTProto docs (Telegram protocol, not TON)
              !cleanPath.endsWith(".pdf") &&
              !cleanPath.endsWith(".zip") &&
              cleanPath !== "/" &&
              !visited.has(cleanPath) &&
              !toVisit.includes(cleanPath)
            ) {
              toVisit.push(cleanPath);
            }
          }
        });

        // Be respectful to the server
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log(`  ⚠️  Page not found: ${path}`);
        } else {
          console.error(`  ❌ Failed to index ${path}:`, error.message);
        }
      }
    }

    // Save indexed documentation
    const outputPath = path.join(process.cwd(), "docs-index.json");
    fs.writeFileSync(outputPath, JSON.stringify(docs, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("✨ Indexing Complete!");
    console.log("=".repeat(60));
    console.log(`📊 Total pages indexed: ${docs.length}`);
    console.log(`📍 Pages visited: ${visited.size}`);
    console.log(`💾 Saved to: ${outputPath}`);
    console.log(
      `📦 File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(
        2
      )} MB`
    );

    // Show category breakdown
    const categoryCount: Record<string, number> = {};
    docs.forEach((doc) => {
      categoryCount[doc.category] = (categoryCount[doc.category] || 0) + 1;
    });

    console.log("\n📚 Documentation by category:");
    Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} pages`);
      });
  } catch (error) {
    console.error("❌ Failed to index documentation:", error);
    process.exit(1);
  }
}

function categorizeContent(
  urlPath: string,
  title: string,
  content: string
): string {
  const lowerPath = urlPath.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase().substring(0, 1000); // Check first 1000 chars

  // Check URL path first (most reliable)
  if (lowerPath.includes("/smart-contract")) return "smart-contracts";
  if (lowerPath.includes("/tact")) return "languages";
  if (lowerPath.includes("/func")) return "languages";
  if (lowerPath.includes("/telegram-app") || lowerPath.includes("/tma"))
    return "tma";
  if (lowerPath.includes("/jetton") || lowerPath.includes("/token"))
    return "tokens";
  if (lowerPath.includes("/nft")) return "nft";
  if (lowerPath.includes("/ton-connect")) return "integration";
  if (lowerPath.includes("/wallet")) return "wallets";
  if (lowerPath.includes("/tvm")) return "infrastructure";
  if (lowerPath.includes("/dapp")) return "dapps";
  if (lowerPath.includes("/tutorial")) return "tutorials";
  if (lowerPath.includes("/how-to") || lowerPath.includes("/guide"))
    return "how-to";
  if (lowerPath.includes("/learn")) return "documentation";
  if (lowerPath.includes("/develop")) return "development";
  if (lowerPath.includes("/api")) return "api";
  if (lowerPath.includes("/sdk")) return "sdk";

  // Then check title and content
  if (lowerTitle.includes("tact") || lowerContent.includes("tact language"))
    return "languages";
  if (lowerTitle.includes("func") || lowerContent.includes("func language"))
    return "languages";
  if (lowerTitle.includes("smart contract")) return "smart-contracts";
  if (lowerTitle.includes("telegram mini app") || lowerTitle.includes("tma"))
    return "tma";
  if (lowerTitle.includes("jetton") || lowerTitle.includes("token"))
    return "tokens";
  if (lowerTitle.includes("nft")) return "nft";
  if (lowerTitle.includes("ton connect")) return "integration";
  if (lowerTitle.includes("wallet")) return "wallets";
  if (lowerTitle.includes("tvm") || lowerTitle.includes("virtual machine"))
    return "infrastructure";

  return "general";
}

function extractTags(
  urlPath: string,
  title: string,
  content: string
): string[] {
  const tags = new Set<string>();
  const lowerPath = urlPath.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Common TON keywords
  const keywords = [
    "ton",
    "blockchain",
    "tact",
    "func",
    "tvm",
    "smart contract",
    "wallet",
    "jetton",
    "nft",
    "telegram",
    "mini app",
    "tma",
    "ton connect",
    "dapp",
    "frontend",
    "backend",
    "api",
    "sdk",
    "testnet",
    "mainnet",
    "transaction",
    "deployment",
    "testing",
    "tutorial",
    "guide",
    "cell",
    "slice",
    "builder",
    "address",
    "message",
    "gas",
    "fees",
  ];

  for (const keyword of keywords) {
    if (
      lowerPath.includes(keyword) ||
      lowerTitle.includes(keyword) ||
      lowerContent.includes(keyword)
    ) {
      tags.add(keyword);
    }
  }

  // Add programming languages
  if (
    lowerContent.includes("typescript") ||
    lowerContent.includes("javascript")
  )
    tags.add("typescript");
  if (lowerContent.includes("python")) tags.add("python");
  if (lowerContent.includes("react")) tags.add("react");
  if (lowerContent.includes("vue")) tags.add("vue");
  if (lowerContent.includes("next.js")) tags.add("nextjs");

  // Add doc type tags
  if (lowerPath.includes("/tutorial") || lowerTitle.includes("tutorial"))
    tags.add("tutorial");
  if (lowerPath.includes("/guide") || lowerTitle.includes("guide"))
    tags.add("guide");
  if (lowerPath.includes("/reference") || lowerTitle.includes("reference"))
    tags.add("reference");
  if (lowerPath.includes("/example") || lowerTitle.includes("example"))
    tags.add("example");

  // Always include official tag
  tags.add("official");
  tags.add("docs.ton.org");

  return Array.from(tags);
}

// Run the indexer
indexTonDocumentation().catch(console.error);
