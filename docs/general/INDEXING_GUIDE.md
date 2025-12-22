# TON Documentation Indexing Guide

## Overview

The TON MCP server uses a comprehensive documentation index to provide AI assistants with complete context about TON blockchain development. This guide explains how the indexing system works and how to refresh the documentation index.

## How It Works

### 1. **Comprehensive Web Crawler**
The indexer (`src/scripts/index-docs.ts`) crawls the entire docs.ton.org website:
- Starts at the homepage
- Follows all internal documentation links
- Extracts title, content, and metadata from each page
- Categorizes content automatically
- Extracts relevant tags

### 2. **Smart Categorization**
Pages are automatically categorized based on:
- URL path (most reliable)
- Page title
- Content analysis

Categories include:
- `smart-contracts` - Smart contract development
- `languages` - Tact and FunC programming languages
- `tma` - Telegram Mini Apps
- `tokens` - Jettons and token standards
- `nft` - NFT documentation
- `integration` - TON Connect and wallet integration
- `wallets` - Wallet documentation
- `infrastructure` - TVM and core infrastructure
- `dapps` - dApp development
- `tutorials` - Step-by-step guides
- `how-to` - How-to guides
- `development` - General development docs
- `api` - API documentation
- `sdk` - SDK documentation
- `general` - Other documentation

### 3. **Tag Extraction**
Each page is tagged with relevant keywords:
- Technical terms (tact, func, tvm, jetton, nft, etc.)
- Programming languages (typescript, python, react, etc.)
- Doc types (tutorial, guide, reference, example)
- Always includes: `official`, `docs.ton.org`

### 4. **Persistent Storage**
All indexed documentation is saved to `docs-index.json`:
- ~500 pages (configurable)
- 2-5 MB file size
- Pre-chunked for optimal search
- Includes full metadata

### 5. **Fast Startup**
When the MCP server starts:
1. Checks if `docs-index.json` exists
2. If yes: Loads pre-indexed docs (fast)
3. If no: Falls back to local resources + limited web fetching

## Running the Indexer

### Full Documentation Index

To create a comprehensive index of ALL docs.ton.org documentation:

```bash
# Run the indexer
npm run index-docs
```

This will:
- Crawl docs.ton.org
- Index up to 500 pages
- Save to `docs-index.json`
- Take ~5-10 minutes (respects rate limits)

### Output Example

```
🚀 Starting comprehensive TON documentation indexing...
📍 Base URL: https://docs.ton.org
[1/500] 📄 Indexing: https://docs.ton.org/
  ✅ Indexed: TON Documentation (15234 chars, 8 tags)
[2/500] 📄 Indexing: https://docs.ton.org/develop/
  ✅ Indexed: Getting Started (12456 chars, 6 tags)
...
============================================================
✨ Indexing Complete!
============================================================
📊 Total pages indexed: 347
📍 Pages visited: 347
💾 Saved to: /path/to/docs-index.json
📦 File size: 3.45 MB

📚 Documentation by category:
  smart-contracts: 87 pages
  languages: 45 pages
  tma: 32 pages
  development: 28 pages
  ...
```

## When to Re-index

Re-run the indexer when:
- TON documentation is updated
- New features are added to docs.ton.org
- You want the latest documentation
- The index file is missing or corrupted

**Recommended:** Re-index weekly or monthly to keep documentation current.

## Publishing with Index

When publishing to npm:

```bash
# 1. Run the indexer
npm run index-docs

# 2. Build the package
npm run build

# 3. Publish (includes docs-index.json)
npm publish
```

The `docs-index.json` file is automatically included in the published package, so users get the pre-indexed documentation without having to crawl the website themselves.

## Configuration

### Adjust Indexing Limits

Edit `src/scripts/index-docs.ts`:

```typescript
const maxPages = 500; // Increase to index more pages
```

### Adjust Chunk Size

Edit `src/services/search-index.ts`:

```typescript
const chunks = this.chunkDocument(doc.content, 2000); // Adjust chunk size
```

### Exclude Paths

Edit `src/scripts/index-docs.ts`:

```typescript
// Skip non-documentation paths
if (!cleanPath.includes('/api/') && 
    !cleanPath.includes('/blog/') &&
    !cleanPath.endsWith('.pdf') &&
    // Add more exclusions here
    ...
```

## Performance

### Indexing Performance
- **Speed:** ~0.5 seconds per page (respects rate limits)
- **Total time:** 5-10 minutes for ~500 pages
- **Memory:** ~100 MB during indexing
- **Output size:** 2-5 MB JSON file

### Search Performance
- **Startup with index:** <1 second
- **Startup without index:** 10-20 seconds
- **Search speed:** <100ms per query
- **Memory:** ~50 MB loaded in RAM

## Troubleshooting

### Indexer Hangs or Times Out

```bash
# Check network connectivity
curl -I https://docs.ton.org/

# Run with lower concurrency
# (Edit script to add delays between requests)
```

### Out of Memory

Reduce `maxPages` or chunk size:
```typescript
const maxPages = 250; // Reduce from 500
```

### Invalid JSON in docs-index.json

Delete and re-run:
```bash
rm docs-index.json
npm run index-docs
```

### Search Not Finding Results

1. Check if index is loaded:
   - Look for "Loading pre-indexed documentation" in logs
2. Re-run indexer:
   ```bash
   npm run index-docs
   ```
3. Check search query normalization in `search-index.ts`

## Architecture

```
┌─────────────────────────────────────────┐
│  src/scripts/index-docs.ts              │
│  (Run manually or during setup)         │
│                                          │
│  1. Crawls docs.ton.org                 │
│  2. Extracts content + metadata         │
│  3. Categorizes & tags                  │
│  4. Saves to docs-index.json            │
└────────────────┬────────────────────────┘
                 │
                 v
         docs-index.json
         (2-5 MB JSON file)
                 │
                 v
┌────────────────┴────────────────────────┐
│  src/services/search-index.ts           │
│  (Runs on MCP server startup)           │
│                                          │
│  1. Loads docs-index.json               │
│  2. Chunks documents                    │
│  3. Builds Fuse.js search index         │
│  4. Provides search API                 │
└────────────────┬────────────────────────┘
                 │
                 v
┌────────────────┴────────────────────────┐
│  src/index.ts                           │
│  (MCP Server Tools)                     │
│                                          │
│  - search_ton_documentation             │
│  - list_ton_resources                   │
│  - get_specific_ton_resource            │
└─────────────────────────────────────────┘
```

## Next Steps

1. **Run the indexer:**
   ```bash
   npm run index-docs
   ```

2. **Verify the index:**
   ```bash
   ls -lh docs-index.json
   ```

3. **Test the search:**
   ```bash
   npm run build
   npm start
   # Try searching for "tolk programming language" or "smart contracts"
   ```

4. **Publish with index:**
   ```bash
   npm publish
   ```

## Contributing

To improve the indexer:

1. **Add better categorization:** Edit `categorizeContent()` in `index-docs.ts`
2. **Improve tag extraction:** Edit `extractTags()` in `index-docs.ts`
3. **Add more selectors:** Edit `contentSelectors` array for better content extraction
4. **Exclude unwanted pages:** Add to exclusion logic

---

**Questions or Issues?** Open an issue at https://github.com/kunaldhongade/ton-mcp/issues

