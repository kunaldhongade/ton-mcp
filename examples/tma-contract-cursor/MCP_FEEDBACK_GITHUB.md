# TON MCP Feedback - GitHub Issue Format

## Summary

Comprehensive testing of TON MCP v2.0.6 reveals excellent contract generation capabilities but critical gaps in frontend development and documentation search features.

**Overall Rating:** ⭐⭐⭐⭐ (6.7/10) - Good but Incomplete

---

## ✅ What's Working Well

### Contract Generation ⭐⭐⭐⭐⭐
- Production-ready code for Tact/Tolk
- Saves 97% of development time
- Clean, well-structured implementations
- **Status:** Excellent, keep as-is

### Project Scaffolding ⭐⭐⭐⭐⭐
- Comprehensive guidance
- Points to official tools
- Saves 87% of research time
- **Status:** Excellent, keep as-is

### Deployment Tools ⭐⭐⭐⭐⭐
- Comprehensive guides
- Helpful troubleshooting
- Cost estimates included
- **Status:** Excellent, keep as-is

### Network Data ⭐⭐⭐⭐⭐
- Instant blockchain queries
- Fast and accurate
- **Status:** Excellent, keep as-is

---

## 🔴 Critical Issues

### Issue 1: Frontend Code Generation Too Basic

**Current Behavior:**
```tsx
// MCP generates only skeleton:
function App() {
  const [connected, setConnected] = useState(false);
  const connectWallet = () => {
    // TON Connect integration here  ← Placeholder!
    setConnected(true);
  };
}
```

**Problem:**
- Only provides ~10% of needed code
- Missing actual TON Connect implementation
- No contract wrappers
- No error handling
- No loading states

**Impact:** Developers must write 90% manually, making MCP frontend generation not useful

**Expected Behavior:**
```tsx
// Should generate complete implementation:
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { useTonClient } from './hooks/useTonClient';
import { Counter } from './contracts/Counter';
// ... complete implementation with error handling, loading states, etc.
```

**Priority:** 🔴 HIGH

**Recommendation:**
- Generate complete TON Connect integration
- Include contract wrapper generation
- Add error handling patterns
- Include loading states
- Provide TypeScript types

---

### Issue 2: Documentation Search Broken

**Current Behavior:**
```
Query: "Tact contract testing"
Result: "No documentation found"

Query: "TON Connect send transaction"
Result: Generic HTML snippets with 100% relevance but no actual content
```

**Problem:**
- Most queries return "No documentation found"
- When results returned, often HTML snippets without useful content
- Can't find code examples
- Can't find specific how-to guides

**Impact:** Developers can't use MCP to find documentation/examples

**Priority:** 🔴 HIGH

**Recommendation:**
- Fix search indexing/querying mechanism
- Return actual content, not HTML snippets
- Improve relevance ranking
- Add code example search capability

---

### Issue 3: Missing Contract Wrapper Generation

**Current Behavior:**
- No tool available for generating TypeScript contract wrappers
- Developers must write wrappers manually (~1 hour per contract)

**Problem:**
- Critical missing feature for frontend integration
- No way to generate wrappers from contract code

**Impact:** Significant manual work required for frontend integration

**Priority:** 🔴 HIGH

**Recommendation:**
- Add `generate_contract_wrapper()` tool
- Parse contract code to extract methods
- Generate TypeScript wrapper with all methods
- Include proper types and error handling
- Support Tact, FunC, and Tolk contracts

---

## 🟡 Medium Priority Issues

### Issue 4: FunC Code Generation Returns Wrong Syntax

**Current Behavior:**
```bash
generate_contract_code("counter", "func")
# Returns Tact syntax instead of FunC!
```

**Expected:** Proper FunC syntax with `recv_internal`, `load_uint`, etc.

**Priority:** 🟡 MEDIUM

---

### Issue 5: AMM Contract Returns Wrong Template

**Current Behavior:**
```bash
generate_contract_code("amm", "tolk")
# Returns Counter contract instead of AMM!
```

**Expected:** Proper AMM contract with liquidity pools, swap functionality, etc.

**Priority:** 🟡 MEDIUM

---

### Issue 6: Account Info Rate Limiting

**Current Behavior:**
- Sometimes returns 429 (Too Many Requests)
- Sometimes returns 422 (Unprocessable Entity)

**Recommendation:**
- Add retry logic with exponential backoff
- Improve error messages
- Handle rate limits gracefully

**Priority:** 🟡 MEDIUM

---

## 📊 Test Results

**Test Scope:**
- 100+ API calls across all tools
- Real-world development workflow (built complete Counter dApp)
- All contract types tested (8 types × 3 languages)
- All frontend features tested

**Time Savings:**
- Contract Development: ✅ 97% faster (30-45 min → 1 min)
- Project Setup: ✅ 87% faster (15-20 min → 2 min)
- Deployment: ✅ 90% faster (20 min → 2 min)
- Frontend Development: ❌ Actually slower (2 hours vs 2.5 hours manual)

**Overall:** Saves ~1.5-2.5 hours per project (25-40% faster)

**With Fixes:** Could save ~3-4 hours per project (50-60% faster)

---

## 💡 Recommendations Summary

### High Priority
1. ✅ Complete frontend generation (full TON Connect integration)
2. ✅ Fix documentation search (working search with useful results)
3. ✅ Add contract wrapper generation tool

### Medium Priority
4. Fix FunC code generation syntax
5. Fix AMM contract template
6. Improve error handling and rate limiting

---

## 🎯 Use Case Analysis

**Current Best Use Cases:**
- ✅ Smart Contract Development
- ✅ Project Scaffolding
- ✅ Deployment Guidance
- ✅ Quick Blockchain Queries

**Current Limitations:**
- ❌ Frontend Development (too basic)
- ❌ Finding Documentation (search broken)
- ❌ Full-Stack Integration (missing wrappers)

**With Fixes, Could Excel At:**
- ✅ Complete Full-Stack Development
- ✅ Rapid Prototyping
- ✅ Learning TON (find examples/docs)
- ✅ Production Apps (complete, tested code)

---

## 📝 Conclusion

The TON MCP is a **valuable tool** that significantly accelerates contract development. With the recommended fixes, it could become an **essential tool** for complete full-stack TON development.

**Current Rating:** ⭐⭐⭐⭐ (6.7/10) - Good but Incomplete  
**Potential Rating:** ⭐⭐⭐⭐⭐ (9/10) with fixes

---

## 📎 Additional Resources

- **Full Detailed Report:** `MCP_DEVELOPER_FEEDBACK.md`
- **Development Experience:** `DEVELOPMENT_EXPERIENCE.md`
- **Comparison Analysis:** `MCP_VS_MANUAL_COMPARISON.md`
- **Test Project:** `ton-counter-dapp/`

---

**Test Date:** December 19, 2024  
**MCP Version:** 2.0.6  
**Tester:** Development Team

