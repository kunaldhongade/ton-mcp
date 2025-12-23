import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import type { FuseResultMatch, IFuseOptions } from "fuse.js";
import Fuse from "fuse.js";
import * as path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DocumentChunk {
  id: string;
  title: string;
  content: string;
  category: string;
  url?: string;
  tags: string[];
  lastUpdated?: string;
  relevanceScore?: number;
}

export interface SearchResult {
  document: DocumentChunk;
  score: number;
  matches: readonly FuseResultMatch[];
}

export class SearchIndexService {
  private documents: DocumentChunk[] = [];
  private fuseIndex: Fuse<DocumentChunk> | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeIndex();
  }

  private async initializeIndex() {
    try {
      await this.loadDocuments();
      // Index is built in loadDocuments after fetching all docs
      this.isInitialized = true;
      console.log(
        `✅ Search index initialized with ${this.documents.length} documents`
      );
    } catch (error) {
      console.error("❌ Failed to initialize search index:", error);
      // Still build index with what we have
      if (this.documents.length > 0) {
        this.buildFuseIndex();
        this.isInitialized = true;
        console.log(
          `✅ Search index initialized with ${this.documents.length} documents (partial)`
        );
      }
    }
  }

  private async loadDocuments() {
    // First, try to load from pre-indexed docs-index.json
    // Try multiple paths to find the index file
    const possiblePaths = [
      // 1. In the package root (when installed via npm)
      path.join(__dirname, "..", "..", "docs-index.json"), // from dist/services/
      path.join(__dirname, "..", "docs-index.json"), // from dist/
      // 2. In the current working directory (when running locally)
      path.join(process.cwd(), "docs-index.json"),
      // 3. In the source directory (development)
      path.join(__dirname, "..", "..", "..", "docs-index.json"),
    ];

    let indexPath: string | null = null;
    for (const tryPath of possiblePaths) {
      if (fs.existsSync(tryPath)) {
        indexPath = tryPath;
        break;
      }
    }

    if (indexPath) {
      try {
        console.log(`📚 Loading pre-indexed documentation from: ${indexPath}`);
        const indexData = fs.readFileSync(indexPath, "utf-8");
        const indexedDocs = JSON.parse(indexData);

        // Chunk the indexed documents for better search
        indexedDocs.forEach((doc: any) => {
          const chunks = this.chunkDocument(doc.content, 2000);
          chunks.forEach((chunk, index) => {
            this.documents.push({
              id: `${doc.id}-chunk-${index}`,
              title:
                index === 0 ? doc.title : `${doc.title} (part ${index + 1})`,
              content: chunk,
              category: doc.category,
              tags: doc.tags || [],
              url: doc.url,
              lastUpdated: doc.lastUpdated,
            });
          });
        });

        console.log(
          `✅ Loaded ${indexedDocs.length} pages (${this.documents.length} chunks) from index`
        );
      } catch (error) {
        console.error(
          "⚠️  Failed to load docs-index.json, falling back to default behavior"
        );
      }
    }

    // If no indexed docs or loading failed, fall back to local resources
    if (this.documents.length === 0) {
      console.log("📁 Loading local documentation resources...");
      await this.loadLocalResources();

      // Add core TON documentation references
      this.addCoreTonDocs();

      // Fetch additional docs from docs.ton.org (limited set)
      await this.fetchDocsFromTonOrg();
    }

    // Rebuild index after loading all docs
    this.buildFuseIndex();
  }

  private async loadLocalResources() {
    const resourcesDir = path.join(process.cwd(), "src", "resources");

    const categories = [
      "frontend",
      "tma",
      "smart-contracts",
      "how-to",
      "management",
      "deployment",
    ];

    for (const category of categories) {
      const categoryPath = path.join(resourcesDir, category);

      try {
        const files = fs.readdirSync(categoryPath);
        const mdFiles = files.filter((file) => file.endsWith(".md"));

        for (const file of mdFiles) {
          const filePath = path.join(categoryPath, file);
          const content = fs.readFileSync(filePath, "utf-8");

          // Split content into chunks for better search
          const chunks = this.chunkDocument(content, 1000);

          chunks.forEach((chunk, index) => {
            const docId = `${category}-${file.replace(
              ".md",
              ""
            )}-chunk-${index}`;
            const title = this.extractTitle(content, file);

            this.documents.push({
              id: docId,
              title,
              content: chunk,
              category,
              tags: this.extractTags(content, category),
              url: `https://docs.ton.org/${category}/${file.replace(
                ".md",
                ""
              )}`,
              lastUpdated: new Date().toISOString(),
            });
          });
        }
      } catch (error) {
        // Category directory doesn't exist or can't be read
        continue;
      }
    }
  }

  private async fetchDocsFromTonOrg() {
    try {
      console.log("📚 Fetching documentation from docs.ton.org...");

      // Key documentation pages to fetch
      const docPages = [
        {
          url: "https://docs.ton.org/develop/smart-contracts/tact/",
          category: "languages",
          tags: ["tact", "language", "programming"],
        },
        {
          url: "https://docs.ton.org/develop/smart-contracts/func/",
          category: "languages",
          tags: ["func", "language", "programming"],
        },
        {
          url: "https://docs.ton.org/learn/tvm-instructions/tvm-overview",
          category: "infrastructure",
          tags: ["tvm", "virtual machine"],
        },
        {
          url: "https://docs.ton.org/develop/dapps/asset-processing/jettons",
          category: "tokens",
          tags: ["jettons", "tokens"],
        },
        {
          url: "https://docs.ton.org/develop/dapps/ton-connect",
          category: "integration",
          tags: ["ton connect", "wallets"],
        },
        {
          url: "https://docs.ton.org/develop/dapps/telegram-apps/",
          category: "tma",
          tags: ["telegram", "mini apps"],
        },
        {
          url: "https://docs.ton.org/develop/smart-contracts/",
          category: "smart-contracts",
          tags: ["smart contracts", "development"],
        },
        {
          url: "https://docs.ton.org/develop/",
          category: "documentation",
          tags: ["development", "guides"],
        },
      ];

      for (const page of docPages) {
        try {
          const response = await axios.get(page.url, { timeout: 5000 });
          const $ = cheerio.load(response.data);

          // Extract title
          const title =
            $("h1").first().text().trim() ||
            $("title").text().trim() ||
            page.url.split("/").pop() ||
            "Documentation";

          // Extract main content
          const content =
            $("main article, main .content, article, .markdown-body")
              .text()
              .trim() ||
            $("main").text().trim() ||
            $("body").text().trim();

          if (content.length > 200) {
            const chunks = this.chunkDocument(content, 2000);
            chunks.forEach((chunk, index) => {
              this.documents.push({
                id: `docs-ton-org-${page.url.replace(
                  /[^a-z0-9]/gi,
                  "-"
                )}-chunk-${index}`,
                title: index === 0 ? title : `${title} (continued)`,
                content: chunk,
                category: page.category,
                tags: [...page.tags, "docs.ton.org", "official"],
                url: page.url,
                lastUpdated: new Date().toISOString(),
              });
            });
          }

          // Small delay to be respectful
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          // Continue if one page fails
          console.log(`⚠️  Could not fetch ${page.url}, continuing...`);
        }
      }

      console.log(`✅ Fetched ${docPages.length} pages from docs.ton.org`);
    } catch (error) {
      console.log(
        "⚠️  Could not fetch docs from docs.ton.org, using local docs only"
      );
    }
  }

  private chunkDocument(content: string, chunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);

    let currentChunk = "";

    for (const sentence of sentences) {
      if (
        (currentChunk + sentence).length > chunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? " " : "") + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [content];
  }

  private extractTitle(content: string, filename: string): string {
    // Try to extract title from markdown headers
    const headerMatch = content.match(/^#\s+(.+)$/m);
    if (headerMatch) {
      return headerMatch[1].trim();
    }

    // Fallback to filename
    return filename
      .replace(".md", "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private extractTags(content: string, category: string): string[] {
    const tags = [category];

    // Extract keywords from content
    const keywords = [
      "ton",
      "blockchain",
      "smart contract",
      "wallet",
      "transaction",
      "tact",
      "func",
      "tvm",
      "jetton",
      "nft",
      "telegram",
      "mini app",
      "frontend",
      "react",
      "typescript",
      "deployment",
      "testing",
    ];

    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        tags.push(keyword);
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  private addCoreTonDocs() {
    // Add references to official TON documentation with more content
    const coreDocs = [
      {
        id: "ton-docs-overview",
        title: "TON Blockchain Overview",
        content:
          "Official TON blockchain documentation covering architecture, consensus, and core concepts. TON (The Open Network) is a decentralized blockchain platform designed for fast and secure transactions.",
        category: "documentation",
        tags: [
          "ton",
          "blockchain",
          "overview",
          "documentation",
          "architecture",
        ],
        url: "https://docs.ton.org/",
      },
      {
        id: "ton-docs-smart-contracts",
        title: "Smart Contract Development",
        content:
          "Complete guide to developing smart contracts on TON using Tact and FunC languages. Learn how to write, test, and deploy smart contracts on the TON blockchain.",
        category: "smart-contracts",
        tags: ["smart contracts", "tact", "func", "development", "programming"],
        url: "https://docs.ton.org/develop/smart-contracts/",
      },
      {
        id: "ton-docs-tact",
        title: "Tact Programming Language",
        content:
          "Tact is the recommended programming language for TON smart contracts. It is a high-level language that compiles to FunC and provides modern features like type safety, built-in testing, and better developer experience. Tact makes it easier to write secure and efficient smart contracts for the TON blockchain.",
        category: "languages",
        tags: [
          "tact",
          "language",
          "programming",
          "smart contracts",
          "development",
          "tolk",
          "ton language",
        ],
        url: "https://docs.ton.org/develop/smart-contracts/tact/",
      },
      {
        id: "ton-docs-tvm",
        title: "TON Virtual Machine (TVM)",
        content:
          "Technical documentation for TVM - TON's custom virtual machine for executing smart contracts.",
        category: "infrastructure",
        tags: ["tvm", "virtual machine", "execution", "technical"],
        url: "https://docs.ton.org/learn/tvm-instructions/tvm-overview",
      },
      {
        id: "ton-docs-jettons",
        title: "Jettons (TON Tokens)",
        content:
          "Official standard and implementation guide for fungible tokens on TON blockchain.",
        category: "tokens",
        tags: ["jettons", "tokens", "standards", "fungible"],
        url: "https://docs.ton.org/develop/dapps/asset-processing/jettons",
      },
      {
        id: "ton-connect-docs",
        title: "TON Connect Protocol",
        content:
          "Official documentation for TON Connect - the standard protocol for TON wallet connections.",
        category: "integration",
        tags: ["ton connect", "wallets", "integration", "protocol"],
        url: "https://docs.ton.org/develop/dapps/ton-connect",
      },
      {
        id: "telegram-mini-apps",
        title: "Telegram Mini Apps",
        content:
          "Official guide for developing Telegram Mini Apps that integrate with TON blockchain.",
        category: "tma",
        tags: ["telegram", "mini apps", "tma", "web apps"],
        url: "https://docs.ton.org/develop/dapps/telegram-apps/",
      },
    ];

    this.documents.push(...coreDocs);
  }

  private buildFuseIndex() {
    const options: IFuseOptions<DocumentChunk> = {
      keys: [
        { name: "title", weight: 0.5 }, // Increased title importance
        { name: "tags", weight: 0.25 }, // Increased tag importance
        { name: "content", weight: 0.2 },
        { name: "category", weight: 0.05 },
      ],
      threshold: 0.5, // More lenient threshold (v2.0.9: increased from 0.35 to fix search)
      includeMatches: true,
      includeScore: true,
      useExtendedSearch: true,
      ignoreLocation: true, // Don't penalize matches based on position
      minMatchCharLength: 2, // Reduced from 3 to allow shorter terms (e.g., "DAO", "NFT")
    };

    this.fuseIndex = new Fuse(this.documents, options);
  }

  /**
   * Normalize query and handle common typos/related terms
   */
  private normalizeQuery(query: string): string {
    let normalized = query.toLowerCase().trim();

    // Handle common typos and related terms
    const replacements: Record<string, string> = {
      tolk: "tact",
      talk: "tact",
      "tact language": "tact",
      "tact programming": "tact",
      "ton language": "tact",
      "ton programming": "tact",
      "ton smart contract language": "tact",
    };

    for (const [typo, correct] of Object.entries(replacements)) {
      if (normalized.includes(typo)) {
        normalized = normalized.replace(typo, correct);
      }
    }

    return normalized;
  }

  /**
   * Search documents with advanced ranking
   */
  async search(
    query: string,
    options: {
      category?: string;
      tags?: string[];
      limit?: number;
      minScore?: number;
    } = {}
  ): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      await this.initializeIndex();
    }

    if (!this.fuseIndex) {
      return [];
    }

    // Normalize query to handle typos
    const normalizedQuery = this.normalizeQuery(query);
    let searchQuery = normalizedQuery;

    // Add category filter if specified
    if (options.category) {
      searchQuery += ` category:${options.category}`;
    }

    // Add tag filters if specified
    if (options.tags && options.tags.length > 0) {
      searchQuery += ` ${options.tags.map((tag) => `tags:${tag}`).join(" ")}`;
    }

    // Try search with normalized query
    let results = this.fuseIndex.search(searchQuery, {
      limit: options.limit || 20,
    });

    // If no results, try with original query
    if (results.length === 0 && normalizedQuery !== query.toLowerCase()) {
      results = this.fuseIndex.search(query, {
        limit: options.limit || 20,
      });
    }

    // If still no results, try broader search
    if (results.length === 0) {
      // Extract key terms
      const terms = query
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 2);
      for (const term of terms) {
        const termResults = this.fuseIndex.search(term, {
          limit: 5,
        });
        results.push(...termResults);
      }
    }

    // Filter and process results
    const processedResults = results
      .filter((result) => {
        // Filter by minimum score if specified
        if (
          options.minScore &&
          result.score &&
          result.score > options.minScore
        ) {
          return false;
        }
        // CRITICAL: Filter out very low-relevance results (v2.0.9: increased from 0.7 to 0.75)
        if (result.score && result.score > 0.75) {
          return false;
        }
        return true;
      })
      .map((result) => ({
        document: result.item,
        score: result.score || 0,
        matches: result.matches || [],
      }));

    // Sort results with smart boosting
    const finalResults = processedResults
      .sort((a, b) => {
        // 1. Boost results from official docs.ton.org
        const aIsOfficial = a.document.url?.includes("docs.ton.org") ? 0.15 : 0;
        const bIsOfficial = b.document.url?.includes("docs.ton.org") ? 0.15 : 0;

        // 2. Boost results with exact tag matches
        const queryLower = query.toLowerCase();
        const aHasExactTag = a.document.tags.some((tag) =>
          queryLower.includes(tag.toLowerCase())
        )
          ? 0.1
          : 0;
        const bHasExactTag = b.document.tags.some((tag) =>
          queryLower.includes(tag.toLowerCase())
        )
          ? 0.1
          : 0;

        // 3. Calculate final score with boosts
        const aFinalScore = a.score - aIsOfficial - aHasExactTag;
        const bFinalScore = b.score - bIsOfficial - bHasExactTag;

        return aFinalScore - bFinalScore;
      })
      .slice(0, options.limit || 20);

    return finalResults;
  }

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(
    category: string,
    limit: number = 10
  ): Promise<DocumentChunk[]> {
    if (!this.isInitialized) {
      await this.initializeIndex();
    }

    return this.documents
      .filter((doc) => doc.category === category)
      .slice(0, limit);
  }

  /**
   * Get related documents based on tags
   */
  async getRelatedDocuments(
    documentId: string,
    limit: number = 5
  ): Promise<DocumentChunk[]> {
    if (!this.isInitialized) {
      await this.initializeIndex();
    }

    const sourceDoc = this.documents.find((doc) => doc.id === documentId);
    if (!sourceDoc) return [];

    const related = this.documents
      .filter(
        (doc) =>
          doc.id !== documentId &&
          doc.tags.some((tag) => sourceDoc.tags.includes(tag))
      )
      .slice(0, limit);

    return related;
  }

  /**
   * Get document statistics
   */
  getStats(): {
    totalDocuments: number;
    categories: Record<string, number>;
    totalTags: number;
  } {
    const categories: Record<string, number> = {};
    const allTags = new Set<string>();

    for (const doc of this.documents) {
      categories[doc.category] = (categories[doc.category] || 0) + 1;
      doc.tags.forEach((tag) => allTags.add(tag));
    }

    return {
      totalDocuments: this.documents.length,
      categories,
      totalTags: allTags.size,
    };
  }

  /**
   * Add new document to index
   */
  addDocument(document: Omit<DocumentChunk, "id">): string {
    const id = `custom-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const docWithId: DocumentChunk = { ...document, id };

    this.documents.push(docWithId);

    // Rebuild index
    this.buildFuseIndex();

    return id;
  }

  /**
   * Remove document from index
   */
  removeDocument(documentId: string): boolean {
    const index = this.documents.findIndex((doc) => doc.id === documentId);
    if (index === -1) return false;

    this.documents.splice(index, 1);
    this.buildFuseIndex();
    return true;
  }
}

// Singleton instance
export const searchIndexService = new SearchIndexService();
