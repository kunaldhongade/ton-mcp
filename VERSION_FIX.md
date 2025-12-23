# ✅ Fixed: Version Display Issue

## 🔴 Problem
`ton-mcp --help` was showing **v1.0.0** even though package was at **v2.0.5**

## 🎯 Root Cause
Version was **hardcoded** in 2 places:
1. Line 45: `version: "1.0.0"` in Server constructor
2. Line 1545: `TON MCP Server v1.0.0` in help text

## ✅ Solution
Made version **dynamic** by reading from `package.json`:

```typescript
// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8")
);
const VERSION = packageJson.version;

// Use in Server constructor
new Server({
  name: "ton-mcp",
  version: VERSION,  // ✅ Now dynamic
})

// Use in help text
console.log(`TON MCP Server v${VERSION}`);  // ✅ Now dynamic
```

## 📊 Before vs After

### Before (Hardcoded)
```
TON MCP Server v1.0.0  ❌ (wrong)
package.json: 2.0.5
```

### After (Dynamic)
```
TON MCP Server v2.0.5  ✅ (correct)
package.json: 2.0.5
```

## 🚀 Next Steps

Since we changed the source code, we need to:

1. **Build** - Compile the changes
2. **Bump Version** - Increment to 2.0.6
3. **Publish** - Release to npm

```bash
# Build
npm run build

# Test locally
node dist/index.js --help
# Should show: TON MCP Server v2.0.5

# Bump to 2.0.6 and publish
npm version patch
git push --tags
npm publish
```

## ✅ Result
Version will now **always match** package.json automatically! 🎉

No more manual updates needed!

