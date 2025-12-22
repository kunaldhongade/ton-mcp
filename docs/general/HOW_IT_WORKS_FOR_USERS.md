# How TON MCP Documentation Works for End Users

## TL;DR

✅ **Users DON'T need to run the indexer**  
✅ **Pre-indexed docs are included in the npm package**  
✅ **Works immediately after installation**  
✅ **Loads in <1 second**  

## Flow Diagram

```
┌─────────────────────────────────────────────┐
│  YOU (Maintainer)                           │
│                                             │
│  1. Run: npm run index-docs                 │
│     → Creates docs-index.json (2-5 MB)      │
│                                             │
│  2. Run: npm publish                        │
│     → Publishes package with index file     │
└──────────────────┬──────────────────────────┘
                   │
                   │ npm registry
                   │
                   v
┌─────────────────────────────────────────────┐
│  END USER                                   │
│                                             │
│  1. Run: npm install -g ton-mcp             │
│     → Downloads package with docs-index.json│
│                                             │
│  2. Run: ton-mcp                            │
│     → Loads pre-indexed docs (<1 sec)       │
│     → Ready to search!                      │
└─────────────────────────────────────────────┘
```

## What Happens When Users Install

### 1. **User Runs: `npm install -g ton-mcp`**

npm downloads the package which includes:
- `dist/` - Compiled code
- `docs-index.json` - Pre-indexed documentation ✅
- `README.md` - Documentation
- `AI_HELPER_GUIDE.md` - AI helper guide
- `package.json` - Package metadata

### 2. **User Runs: `ton-mcp`**

The MCP server starts and:

1. **Looks for `docs-index.json` in multiple locations:**
   ```typescript
   const possiblePaths = [
     "/usr/local/lib/node_modules/ton-mcp/docs-index.json", // Global install
     "./docs-index.json", // Local directory
     "../docs-index.json", // Parent directory
   ];
   ```

2. **Finds and loads the pre-indexed docs:**
   ```
   📚 Loading pre-indexed documentation from: /usr/local/lib/node_modules/ton-mcp/docs-index.json
   ✅ Loaded 347 pages (1247 chunks) from index
   ✅ Search index initialized with 1247 documents
   ```

3. **Server is ready!** Users can immediately search:
   - "tolk programming language" ✅
   - "smart contracts" ✅
   - "jettons" ✅

## File Locations

### Global Install (`npm install -g`)
```
/usr/local/lib/node_modules/ton-mcp/
├── dist/
│   ├── index.js (main entry point)
│   └── services/
│       └── search-index.js
├── docs-index.json ← Pre-indexed docs ✅
├── README.md
├── AI_HELPER_GUIDE.md
└── package.json
```

### Local Install (`npm install`)
```
./node_modules/ton-mcp/
├── dist/
├── docs-index.json ← Pre-indexed docs ✅
├── README.md
└── package.json
```

### Development (cloned repo)
```
./ton-mcp/
├── src/
├── dist/
├── docs-index.json ← Created by `npm run index-docs`
├── README.md
└── package.json
```

## How Path Resolution Works

The code tries multiple paths in order:

```typescript
// 1. From dist/services/ (compiled, npm install)
path.join(__dirname, "..", "..", "docs-index.json")
// → /usr/local/lib/node_modules/ton-mcp/docs-index.json ✅

// 2. From dist/ (if running from dist root)
path.join(__dirname, "..", "docs-index.json")

// 3. From current working directory (user's folder)
path.join(process.cwd(), "docs-index.json")

// 4. From source directory (development)
path.join(__dirname, "..", "..", "..", "docs-index.json")
```

**Result:** It finds the pre-indexed docs no matter where it's installed! ✅

## User Experience

### Scenario 1: Global Install (Recommended)

```bash
# User installs globally
npm install -g ton-mcp

# User runs the server
ton-mcp

# Output:
# 📚 Loading pre-indexed documentation from: /usr/local/lib/node_modules/ton-mcp/docs-index.json
# ✅ Loaded 347 pages (1247 chunks) from index
# ✅ Search index initialized with 1247 documents
# TON MCP server running on stable MCP SDK...
```

**Time to ready:** <1 second ✅

### Scenario 2: Local Install

```bash
# User installs locally
npm install ton-mcp

# User configures Cursor with path
{
  "mcpServers": {
    "ton-mcp": {
      "command": "node",
      "args": ["./node_modules/ton-mcp/dist/index.js"]
    }
  }
}
```

**Time to ready:** <1 second ✅

### Scenario 3: No Pre-indexed Docs (Fallback)

If `docs-index.json` is missing (shouldn't happen in npm package):

```bash
ton-mcp

# Output:
# ⚠️  Failed to load docs-index.json, falling back to default behavior
# 📁 Loading local documentation resources...
# 📚 Fetching documentation from docs.ton.org...
# ✅ Fetched 8 pages from docs.ton.org
# ✅ Search index initialized with 67 documents
```

**Time to ready:** 10-20 seconds (slower, but still works)

## Verification Steps for You

Before publishing, verify the index will be included:

### 1. Check `package.json` files array

```bash
cat package.json | grep -A 5 '"files"'
```

Should show:
```json
"files": [
  "dist",
  "README.md",
  "AI_HELPER_GUIDE.md",
  "package.json",
  "docs-index.json"  ← This! ✅
]
```

### 2. Create the index

```bash
npm run index-docs
ls -lh docs-index.json
# Should show: 2-5 MB file
```

### 3. Build the package

```bash
npm run build
ls -lh dist/
# Should show compiled files
```

### 4. Test locally (simulate npm install)

```bash
# Create a test directory
mkdir /tmp/test-ton-mcp
cd /tmp/test-ton-mcp

# Install your local package
npm install /Users/kunal/ton-mcp

# Check if docs-index.json is there
ls -lh node_modules/ton-mcp/docs-index.json
# Should exist! ✅

# Test running it
node node_modules/ton-mcp/dist/index.js --help
# Should show help and find the index
```

### 5. Publish

```bash
npm publish
```

## What Users Get

When users install `ton-mcp`, they get:

✅ **Pre-indexed documentation** (300-500 pages from docs.ton.org)  
✅ **Fast startup** (<1 second)  
✅ **Comprehensive search** (not just 8 pages)  
✅ **Works offline** (no need to crawl docs.ton.org)  
✅ **No setup required** (just install and use)  

## Maintenance Schedule

### For You (Maintainer)

Re-index documentation periodically:

```bash
# Weekly or monthly
npm run index-docs  # Updates docs-index.json
npm publish         # Publishes updated index
```

Users get the updated index when they:
- Install fresh: `npm install -g ton-mcp@latest`
- Update: `npm update -g ton-mcp`

### For Users

Users DON'T need to do anything! They automatically get:
- Latest index when they install
- Updated index when they update the package

## Summary

**Yes, it works for end users automatically!** ✅

1. **You run:** `npm run index-docs` → Creates `docs-index.json`
2. **You publish:** `npm publish` → Includes `docs-index.json` in package
3. **Users install:** `npm install -g ton-mcp` → Gets `docs-index.json`
4. **Users run:** `ton-mcp` → Loads pre-indexed docs instantly

**No manual indexing required for users!** 🎉

---

## Troubleshooting

**If users report "no documentation found":**

1. **Check if index is in package:**
   ```bash
   npm view ton-mcp files
   # Should list docs-index.json
   ```

2. **Check package contents:**
   ```bash
   npm pack
   tar -tzf ton-mcp-1.0.0.tgz | grep docs-index.json
   # Should show: package/docs-index.json
   ```

3. **Verify path resolution:**
   - Check server logs for "Loading pre-indexed documentation from: ..."
   - Should show the path where it found the index

**If something's wrong:**
- Re-run: `npm run index-docs`
- Verify: `ls -lh docs-index.json`
- Re-publish: `npm publish`

