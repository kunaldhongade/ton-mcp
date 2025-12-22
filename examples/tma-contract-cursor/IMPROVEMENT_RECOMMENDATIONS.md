# TON MCP Improvement Recommendations

## Priority-Based Improvement Plan

This document outlines specific, actionable improvements for the TON MCP server, prioritized by impact and effort.

---

## 🔴 High Priority (Critical Issues)

### 1. Fix Documentation Search Algorithm

**Current Problem:**
- Low relevance scores (2-24% for many queries)
- Returns irrelevant results (e.g., IDE docs for deployment queries)
- HTML content instead of clean markdown/text
- Poor user experience

**Recommended Solution:**

```typescript
// File: src/services/search-index.ts

// 1. Improve search ranking algorithm
function calculateRelevance(query: string, doc: Document): number {
  let score = 0;
  
  // Exact keyword matches (high weight)
  const keywords = query.toLowerCase().split(' ');
  keywords.forEach(keyword => {
    if (doc.title.toLowerCase().includes(keyword)) score += 50;
    if (doc.content.toLowerCase().includes(keyword)) score += 20;
    if (doc.tags.includes(keyword)) score += 30;
  });
  
  // Semantic similarity (medium weight)
  const semanticScore = calculateSemanticSimilarity(query, doc.content);
  score += semanticScore * 0.3;
  
  // Category matching (low weight)
  if (doc.category === getCategoryFromQuery(query)) score += 10;
  
  return Math.min(score, 100); // Cap at 100%
}

// 2. Clean HTML before indexing
function cleanContent(html: string): string {
  // Remove script tags
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Remove style tags
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Convert HTML to text
  const text = html
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return text;
}

// 3. Filter low-relevance results
function filterResults(results: SearchResult[], minRelevance = 30): SearchResult[] {
  return results
    .filter(r => r.relevance >= minRelevance)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 10); // Top 10 results
}

// 4. Add query normalization
function normalizeQuery(query: string): string {
  // Expand abbreviations
  const expansions = {
    'tma': 'telegram mini app',
    'tvm': 'ton virtual machine',
    'jetton': 'token',
    'nft': 'non-fungible token',
  };
  
  let normalized = query.toLowerCase();
  Object.entries(expansions).forEach(([abbr, full]) => {
    normalized = normalized.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
  });
  
  return normalized;
}
```

**Implementation Steps:**
1. Update `search-index.ts` with improved algorithm
2. Add HTML cleaning to indexing process
3. Implement semantic similarity (use simple TF-IDF or integrate ML)
4. Add query normalization
5. Test with various queries
6. Monitor relevance scores

**Expected Impact:**
- 80%+ relevance for most queries
- Cleaner, more readable results
- Better user satisfaction

**Effort:** Medium (2-3 days)

---

### 2. Fix Resource Path Resolution

**Current Problem:**
- `get_specific_ton_resource()` cannot find resources
- Returns "Resource not found" error
- Users cannot access specific guides

**Recommended Solution:**

```typescript
// File: src/resources/index.ts

// 1. Create resource mapping
const RESOURCE_MAP: Record<string, string> = {
  'tolk_language_guide.md': 'smart-contracts/tolk_language_guide.md',
  'write_a_smart_contract.md': 'smart-contracts/write_a_smart_contract.md',
  'understanding_tvm.md': 'smart-contracts/understanding_tvm.md',
  'how_to_add_ton_connect.md': 'how-to/how_to_add_ton_connect.md',
  'how_to_create_telegram_mini_app.md': 'how-to/how_to_create_telegram_mini_app.md',
  'how_to_work_with_ton_api.md': 'how-to/how_to_work_with_ton_api.md',
  'how_to_use_official_tools.md': 'how-to/how_to_use_official_tools.md',
  'complete_workflows.md': 'how-to/complete_workflows.md',
  'create_a_telegram_mini_app.md': 'tma/create_a_telegram_mini_app.md',
  'write_a_frontend.md': 'frontend/write_a_frontend.md',
  'complete_deployment_guide.md': 'deployment/complete_deployment_guide.md',
};

// 2. Update get_specific_ton_resource handler
async function getSpecificTonResource(filename: string): Promise<string> {
  // Try direct filename match
  let resourcePath = RESOURCE_MAP[filename];
  
  // Try without extension
  if (!resourcePath && filename.endsWith('.md')) {
    const nameWithoutExt = filename.replace('.md', '');
    resourcePath = RESOURCE_MAP[nameWithoutExt + '.md'];
  }
  
  // Try case-insensitive match
  if (!resourcePath) {
    const lowerFilename = filename.toLowerCase();
    const entry = Object.entries(RESOURCE_MAP).find(
      ([key]) => key.toLowerCase() === lowerFilename
    );
    if (entry) resourcePath = entry[1];
  }
  
  // Try partial match
  if (!resourcePath) {
    const entry = Object.entries(RESOURCE_MAP).find(
      ([key]) => key.toLowerCase().includes(filename.toLowerCase())
    );
    if (entry) resourcePath = entry[1];
  }
  
  if (!resourcePath) {
    // List available resources
    const available = Object.keys(RESOURCE_MAP).join(', ');
    throw new Error(
      `Resource '${filename}' not found. Available resources: ${available}`
    );
  }
  
  // Load and return resource
  const fullPath = path.join(__dirname, '..', 'resources', resourcePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

// 3. Add resource discovery
async function listAvailableResources(): Promise<string[]> {
  return Object.keys(RESOURCE_MAP).sort();
}
```

**Implementation Steps:**
1. Create resource mapping object
2. Update `get_specific_ton_resource` handler
3. Add case-insensitive and partial matching
4. Improve error messages with available resources
5. Test with various resource names
6. Update documentation

**Expected Impact:**
- Users can access all guides
- Better resource discovery
- Improved documentation access

**Effort:** Low (1 day)

---

### 3. Enhance Frontend Generation

**Current Problem:**
- Generates basic skeleton only
- Missing: Complete implementations, styling, error handling
- Users need to add significant code manually

**Recommended Solution:**

```typescript
// File: src/templates/frontend.ts

// 1. Generate complete React component with TON Connect
function generateReactComponent(features: string[]): string {
  const hasWalletConnect = features.includes('wallet-connect');
  const hasContractInteraction = features.includes('contract-interaction');
  const hasBalanceDisplay = features.includes('balance-display');
  
  return `
import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { Address, fromNano } from '@ton/core';
import { useTonClient } from './hooks/useTonClient';

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const { client } = useTonClient();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch balance
  useEffect(() => {
    if (!address || !client) return;
    
    const fetchBalance = async () => {
      try {
        setLoading(true);
        const balance = await client.getBalance(Address.parse(address));
        setBalance(fromNano(balance));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, [address, client]);

  // Contract interaction handler
  const handleContractCall = async () => {
    if (!address || !tonConnectUI) {
      setError('Please connect your wallet first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Example: Send transaction
      await tonConnectUI.sendTransaction({
        messages: [{
          address: 'YOUR_CONTRACT_ADDRESS',
          amount: '1000000000', // 1 TON in nanotons
          payload: 'YOUR_PAYLOAD'
        }],
        validUntil: Date.now() + 5 * 60 * 1000, // 5 minutes
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            My TON dApp
          </h1>
          <p className="text-gray-600">Built with TON Connect</p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Wallet</h2>
            <TonConnectButton />
          </div>

          {address && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-mono text-sm break-all">{address}</p>
              </div>
              
              ${hasBalanceDisplay ? `
              <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : \`\${balance} TON\`}
                </p>
              </div>
              ` : ''}
            </div>
          )}

          {!address && (
            <p className="text-gray-500 text-center py-8">
              Connect your wallet to get started
            </p>
          )}
        </div>

        ${hasContractInteraction ? `
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Contract Interaction</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <button
            onClick={handleContractCall}
            disabled={!address || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Call Contract'}
          </button>
        </div>
        ` : ''}
      </div>
    </div>
  );
}

export default App;
  `.trim();
}

// 2. Generate hooks
function generateHooks(): string {
  return `
// hooks/useTonClient.ts
import { useState, useEffect } from 'react';
import { TonClient } from '@ton/ton';

export function useTonClient() {
  const [client, setClient] = useState<TonClient | null>(null);

  useEffect(() => {
    const endpoint = process.env.REACT_APP_TON_NETWORK === 'mainnet'
      ? 'https://toncenter.com/api/v2/jsonRPC'
      : 'https://testnet.toncenter.com/api/v2/jsonRPC';

    const apiKey = process.env.REACT_APP_TON_API_KEY || '';
    
    setClient(new TonClient({
      endpoint,
      apiKey,
    }));
  }, []);

  return { client };
}
  `.trim();
}

// 3. Generate package.json with dependencies
function generatePackageJson(): string {
  return JSON.stringify({
    name: 'ton-dapp-frontend',
    version: '1.0.0',
    dependencies: {
      '@tonconnect/ui-react': '^2.0.0',
      '@ton/core': '^0.57.0',
      '@ton/ton': '^13.0.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      'typescript': '^5.0.0',
      'vite': '^4.0.0',
      'tailwindcss': '^3.0.0',
    },
  }, null, 2);
}
```

**Implementation Steps:**
1. Create comprehensive React component template
2. Add TON Connect integration
3. Include error handling and loading states
4. Add styling (Tailwind CSS)
5. Generate supporting files (hooks, config)
6. Test generated code
7. Update documentation

**Expected Impact:**
- Production-ready frontend code
- Less manual work required
- Better developer experience

**Effort:** Medium (3-4 days)

---

## 🟡 Medium Priority (Enhancements)

### 4. Improve Error Messages

**Current Problem:**
- Generic error messages
- No troubleshooting hints
- Users struggle to resolve issues

**Recommended Solution:**

```typescript
// File: src/utils/errors.ts

interface ErrorContext {
  tool: string;
  input?: any;
  network?: string;
  address?: string;
}

class TonMcpError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: ErrorContext,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'TonMcpError';
  }

  toUserFriendly(): string {
    let msg = this.message;
    
    if (this.suggestions && this.suggestions.length > 0) {
      msg += '\n\nSuggestions:';
      this.suggestions.forEach((suggestion, i) => {
        msg += `\n${i + 1}. ${suggestion}`;
      });
    }
    
    if (this.context) {
      msg += '\n\nContext:';
      if (this.context.address) {
        msg += `\n- Address: ${this.context.address}`;
        msg += '\n- Check: Address format (should start with EQ)';
        msg += '\n- Check: Network (testnet vs mainnet)';
      }
      if (this.context.network) {
        msg += `\n- Network: ${this.context.network}`;
      }
    }
    
    return msg;
  }
}

// Specific error types
export const Errors = {
  AccountNotFound: (address: string, network: string) => new TonMcpError(
    `Account not found: ${address}`,
    'ACCOUNT_NOT_FOUND',
    { address, network },
    [
      'Verify the address is correct (should start with EQ)',
      `Check if you're using the correct network (${network})`,
      'The account might not exist yet (check if deployment completed)',
      'Try checking on TON explorer: https://tonviewer.com'
    ]
  ),
  
  InvalidAddress: (address: string) => new TonMcpError(
    `Invalid address format: ${address}`,
    'INVALID_ADDRESS',
    { address },
    [
      'TON addresses should start with EQ (mainnet) or kQ (testnet)',
      'Check address length (should be 48 characters)',
      'Verify no typos in the address',
      'Use Address.parse() to validate before querying'
    ]
  ),
  
  CompilerNotFound: () => new TonMcpError(
    'Tolk compiler not found',
    'COMPILER_NOT_FOUND',
    {},
    [
      'Install Tolk compiler: npm install -g tolk',
      'Or use Tact/FunC instead (no compiler required)',
      'Check PATH environment variable includes Tolk',
      'See: https://docs.ton.org/develop/smart-contracts/tolk'
    ]
  ),
};
```

**Implementation Steps:**
1. Create error utility class
2. Define specific error types
3. Add context and suggestions
4. Update all error handlers
5. Test error messages
6. Update documentation

**Expected Impact:**
- Faster issue resolution
- Better user experience
- Reduced support burden

**Effort:** Low (1-2 days)

---

### 5. Add More Contract Types

**Current State:**
- 7 contract types available
- Missing common patterns

**Recommended Additions:**

```typescript
// New contract types to add:

1. AMM (Automated Market Maker)
   - Liquidity pools
   - Token swaps
   - LP token management
   - Fee collection

2. Lending Protocol
   - Collateral management
   - Interest calculation
   - Liquidation logic
   - Borrow/repay functions

3. Bridge Contract
   - Cross-chain transfers
   - Lock/unlock mechanisms
   - Validator signatures
   - Event emission

4. Oracle Contract
   - Price feeds
   - Data aggregation
   - Update mechanisms
   - Access control

5. Lottery/Random Number Generator
   - Random number generation
   - Ticket management
   - Prize distribution
   - Fairness verification
```

**Implementation Steps:**
1. Research each contract type
2. Create templates following TON standards
3. Add to contract generation tool
4. Test each template
5. Update documentation

**Expected Impact:**
- More use cases covered
- Faster development for common patterns
- Better ecosystem support

**Effort:** High (1-2 weeks)

---

### 6. Add Testing Support

**Current State:**
- No test generation
- Users write tests manually

**Recommended Solution:**

```typescript
// Generate test suite for contracts
function generateContractTests(contractType: string, language: string): string {
  return `
import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { ${contractType}Contract } from '../wrappers/${contractType}Contract';

describe('${contractType}Contract', () => {
  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let contract: SandboxContract<${contractType}Contract>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    deployer = await blockchain.treasury('deployer');
    
    contract = blockchain.openContract(
      await ${contractType}Contract.fromInit(deployer.address)
    );
  });

  it('should deploy', async () => {
    const deployResult = await contract.send(
      deployer.getSender(),
      { value: toNano('0.1') },
      { $$type: 'Deploy', queryId: 0n }
    );
    
    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: contract.address,
      success: true,
    });
  });

  // Add more tests based on contract type
});
  `.trim();
}
```

**Implementation Steps:**
1. Create test template generator
2. Support multiple test frameworks
3. Generate tests based on contract type
4. Include common test patterns
5. Update documentation

**Expected Impact:**
- Better code quality
- Faster development
- More reliable contracts

**Effort:** Medium (2-3 days)

---

## 🟢 Low Priority (Nice to Have)

### 7. Add Gas Estimation

**Implementation:**
- Estimate transaction costs before execution
- Compare different approaches
- Optimize for gas efficiency

**Effort:** Medium (2-3 days)

### 8. Add Contract Verification

**Implementation:**
- Verify contract source code
- Submit to TON explorers
- Check verification status

**Effort:** Medium (2-3 days)

### 9. Add Monitoring Tools

**Implementation:**
- Contract activity monitoring
- Error tracking
- Performance metrics
- Usage analytics

**Effort:** High (1 week)

---

## 📊 Implementation Priority Matrix

| Improvement | Priority | Impact | Effort | ROI |
|------------|----------|--------|--------|-----|
| Fix Search Algorithm | 🔴 High | High | Medium | ⭐⭐⭐⭐⭐ |
| Fix Resource Access | 🔴 High | High | Low | ⭐⭐⭐⭐⭐ |
| Enhance Frontend Gen | 🔴 High | High | Medium | ⭐⭐⭐⭐ |
| Improve Error Messages | 🟡 Medium | Medium | Low | ⭐⭐⭐⭐ |
| Add More Contract Types | 🟡 Medium | Medium | High | ⭐⭐⭐ |
| Add Testing Support | 🟡 Medium | Medium | Medium | ⭐⭐⭐ |
| Gas Estimation | 🟢 Low | Low | Medium | ⭐⭐ |
| Contract Verification | 🟢 Low | Low | Medium | ⭐⭐ |
| Monitoring Tools | 🟢 Low | Low | High | ⭐ |

---

## 🎯 Recommended Implementation Order

1. **Week 1:** Fix Resource Access (Low effort, high impact)
2. **Week 2-3:** Fix Search Algorithm (Medium effort, high impact)
3. **Week 4-5:** Enhance Frontend Generation (Medium effort, high impact)
4. **Week 6:** Improve Error Messages (Low effort, medium impact)
5. **Week 7-8:** Add Testing Support (Medium effort, medium impact)
6. **Future:** Add More Contract Types (High effort, medium impact)

---

## 📝 Notes

- All improvements should maintain backward compatibility
- Test thoroughly before releasing
- Update documentation with each improvement
- Gather user feedback to prioritize further improvements

---

**Last Updated:** 2024-12-19

