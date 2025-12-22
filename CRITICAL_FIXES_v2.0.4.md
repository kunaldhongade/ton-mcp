# 🚨 Critical Fixes for v2.0.4

## Issues Identified in Production Testing

Based on comprehensive testing documented in `TON_MCP_COMPLETE_ANALYSIS.md`, the following critical issues need immediate fixes:

---

## 🔴 Fix #1: Resource Access (CRITICAL)

### **Problem**
`get_specific_ton_resource()` only searches `how-to/` folder, ignoring:
- `smart-contracts/` (including `tolk_language_guide.md`)
- `deployment/`
- `tma/`
- `frontend/`

### **Impact**
Users cannot access 6 out of 12 available guides!

### **Root Cause**
```typescript
// src/index.ts line ~1411
private async handleGetSpecificResource(args: any) {
  const { filename } = args;
  const availableFiles = getAvailableHowToResources(); // ❌ ONLY how-to/
  // ...
}
```

### **Fix Required**
```typescript
// NEW: Search ALL resource directories
private async handleGetSpecificResource(args: any) {
  const { filename } = args;
  
  // Search in ALL directories
  const directories = ['smart-contracts', 'how-to', 'deployment', 'tma', 'frontend'];
  
  for (const dir of directories) {
    const filePath = path.join(__dirname, 'resources', dir, filename);
    if (fs.existsSync(filePath)) {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return {
        content: [{
          type: "text",
          text: content
        }]
      };
    }
  }
  
  // Not found - list all available
  const allFiles = [];
  for (const dir of directories) {
    const files = await fs.promises.readdir(path.join(__dirname, 'resources', dir));
    files.forEach(f => allFiles.push(`${dir}/${f}`));
  }
  
  return {
    content: [{
      type: "text",
      text: `Resource '${filename}' not found.\n\nAvailable resources:\n${allFiles.join('\n')}`
    }]
  };
}
```

---

## 🔴 Fix #2: Documentation Search HTML Content

### **Problem**
Search results contain HTML tags, JavaScript, and raw HTML instead of clean text.

### **Impact**
Results are hard to read and parse for AI assistants.

### **Root Cause**
`src/scripts/index-docs.ts` extracts raw HTML without cleaning it.

### **Fix Required**
```typescript
// src/scripts/index-docs.ts
import * as cheerio from "cheerio";

// When extracting content:
const $content = $("article, .content, main, .markdown-body");

// Clean HTML tags
let textContent = $content.text();

// Remove extra whitespace
textContent = textContent
  .replace(/\s+/g, ' ')
  .replace(/\n+/g, '\n')
  .trim();

// Remove JavaScript/CSS
textContent = textContent
  .replace(/<script[^>]*>.*?<\/script>/gi, '')
  .replace(/<style[^>]*>.*?<\/style>/gi, '');

// Save clean text
documents.push({
  id: urlObj.pathname,
  title: title,
  content: textContent, // ✅ Clean text
  category: category,
  tags: tags,
  url: url
});
```

---

## 🔴 Fix #3: Improve Search Relevance

### **Problem**
Search returns irrelevant results (2-24% relevance).

### **Impact**
Users get wrong documentation, waste time.

### **Root Cause**
1. HTML noise in indexed content
2. No keyword boosting
3. No minimum relevance threshold

### **Fix Required**
```typescript
// src/services/search-index.ts

// Update Fuse options
const fuseOptions: IFuseOptions<DocumentChunk> = {
  keys: [
    { name: "title", weight: 0.4 },        // Boost title
    { name: "content", weight: 0.3 },
    { name: "tags", weight: 0.2 },         // Boost tags
    { name: "category", weight: 0.1 }
  ],
  threshold: 0.4,  // Lower = more strict (was 0.6)
  minMatchCharLength: 3,
  // ...
};

// Filter low-relevance results
async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
  // ... existing code ...
  
  // Filter results
  let results = fuseResults.map(result => ({
    document: result.item,
    score: result.score || 1,
    matches: result.matches || []
  }));
  
  // ✅ FILTER: Remove results with score > 0.7 (low relevance)
  results = results.filter(r => r.score <= 0.7);
  
  // ✅ BOOST: Prefer docs.ton.org URLs
  results = results.sort((a, b) => {
    if (a.document.url?.includes('docs.ton.org') && !b.document.url?.includes('docs.ton.org')) {
      return -1;
    }
    if (!a.document.url?.includes('docs.ton.org') && b.document.url?.includes('docs.ton.org')) {
      return 1;
    }
    return a.score - b.score;
  });
  
  return results;
}
```

---

## 🟡 Fix #4: Better Error Messages

### **Problem**
Generic errors without troubleshooting hints.

### **Example**
```
"Account not found"
```

Should be:
```
"Account not found. This could mean:
- Address is invalid (check format)
- Account hasn't been initialized yet
- Wrong network (try mainnet/testnet)

Validate address first: validate_address(address)"
```

### **Fix Required**
Add error context to all tool responses:

```typescript
// src/services/ton-api.ts
async getAccountInfo(address: string, network: string) {
  // ... validation ...
  
  if (!account) {
    throw new Error(
      `Account not found: ${address}\n\n` +
      `Troubleshooting:\n` +
      `- Verify address format: ${this.validateAddress(address) ? '✅' : '❌'}\n` +
      `- Try different network (current: ${network})\n` +
      `- Check if account is initialized\n` +
      `- Use validate_address() to verify format`
    );
  }
}
```

---

## 🟡 Fix #5: Enhanced Frontend Generation

### **Problem**
Generated frontend code is too basic (skeleton only).

### **Impact**
Users need to write 80% of the code manually.

### **Fix Required**
Add complete implementations:

```typescript
// Complete TON Connect integration
const tonConnectCode = `
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

export function WalletConnect() {
  const address = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  
  const handleTransaction = async () => {
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: "${contractAddress}",
          amount: "50000000", // 0.05 TON
          payload: "${payload}"
        }
      ]
    };
    
    try {
      const result = await tonConnectUI.sendTransaction(transaction);
      console.log('Transaction sent:', result);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };
  
  return (
    <div>
      <TonConnectButton />
      {address && (
        <div>
          <p>Connected: {address}</p>
          <button onClick={handleTransaction}>Send Transaction</button>
        </div>
      )}
    </div>
  );
}
`;
```

---

## 📋 Implementation Checklist

### **Priority 1 (Critical) - v2.0.4**
- [ ] Fix resource access to search all directories
- [ ] Clean HTML from documentation index
- [ ] Improve search relevance (threshold + filtering)
- [ ] Re-run documentation indexer with clean HTML

### **Priority 2 (High) - v2.0.5**
- [ ] Add better error messages
- [ ] Enhance frontend code generation
- [ ] Add more contract templates

### **Priority 3 (Medium) - v2.1.0**
- [ ] Add test generation
- [ ] Add gas estimation
- [ ] Add contract verification
- [ ] Add monitoring tools

---

## 🧪 Testing Plan

### **Test Fix #1: Resource Access**
```bash
# Test all resource files
get_specific_ton_resource("tolk_language_guide.md")  # ✅ Should work
get_specific_ton_resource("complete_deployment_guide.md")  # ✅ Should work
get_specific_ton_resource("create_a_telegram_mini_app.md")  # ✅ Should work
```

### **Test Fix #2 & #3: Documentation Search**
```bash
# Test search quality
search_ton_documentation("Tact smart contract deployment")
# Expected: >50% relevance, clean text (no HTML)

search_ton_documentation("TON Connect integration")
# Expected: >70% relevance, relevant docs

search_ton_documentation("Jetton minting")
# Expected: >60% relevance, token docs
```

### **Test Fix #4: Error Messages**
```bash
# Test error quality
get_account_info_live("invalid_address")
# Expected: Helpful error with troubleshooting steps
```

---

## 📊 Expected Impact

| Fix | Current State | After Fix | Impact |
|-----|---------------|-----------|--------|
| Resource Access | 50% files accessible | 100% accessible | Critical |
| Search Relevance | 2-24% | 50-90% | Critical |
| HTML in Results | Yes | No | High |
| Error Messages | Generic | Helpful | Medium |
| Frontend Code | 20% complete | 80% complete | Medium |

---

## 🚀 Release Plan

### **v2.0.4 (Critical Fixes)**
1. Fix resource access
2. Clean HTML from docs
3. Improve search
4. Re-index documentation
5. Test thoroughly
6. Publish to npm

### **Timeline**
- Fixes: 2-3 hours
- Testing: 1 hour
- Release: Same day

---

## 📝 Commit Message Template

```
fix: Critical fixes for resource access and documentation search (v2.0.4)

Critical Fixes:
- Fix get_specific_ton_resource to search ALL directories
  * Was only searching how-to/
  * Now searches smart-contracts/, deployment/, tma/, frontend/
  * Fixes access to tolk_language_guide.md and 5 other guides

- Clean HTML from documentation search results
  * Remove HTML tags, JavaScript, CSS
  * Clean whitespace and formatting
  * Improve readability for AI assistants

- Improve search relevance algorithm
  * Add minimum relevance threshold (0.7)
  * Boost title and tag matches
  * Filter low-relevance results
  * Prefer docs.ton.org URLs

- Better error messages
  * Add troubleshooting context
  * Include validation hints
  * Suggest next steps

Impact:
- Resource access: 50% → 100% of guides accessible
- Search relevance: 24% → 50-90% expected
- User experience: Significantly improved

Closes: #1 (Resource access broken)
Closes: #2 (HTML in search results)
Closes: #3 (Low search relevance)
```

---

**Status:** Ready to implement  
**Priority:** CRITICAL  
**Version:** 2.0.4  
**ETA:** Same day

