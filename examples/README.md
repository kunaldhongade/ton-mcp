# 🧪 TON MCP Testing Examples

This folder contains examples and tests for the TON MCP server.

---

## 📁 Contents

```
examples/
├── README.md                   ← You are here
├── test-mcp-server.js          ← Automated test script
├── workflow-demo.md            ← Example development workflow
└── tma-contract-cursor/        ← Sample TMA project
```

---

## 🚀 Quick Start Testing

### 1. Build the MCP (First Time)

```bash
cd /Users/kunal/ton-mcp
npm install
npm run build
```

### 2. Run Test Script

```bash
cd /Users/kunal/ton-mcp/examples
node test-mcp-server.js
```

This will:
- ✅ Verify MCP is built correctly
- ✅ Check all services are present
- ✅ Verify documentation index
- ✅ Show test queries
- ✅ Provide integration instructions

---

## 🧪 Testing Methods

### Method 1: Automated Test Script

```bash
# Run the test script
node test-mcp-server.js
```

**What it tests:**
- MCP server build status
- All services compiled
- Documentation index loaded
- Resources available
- Component verification

### Method 2: Manual Testing with Cursor

**Step 1: Configure Cursor**

Add to Cursor MCP settings (`Cmd/Ctrl + ,` → MCP tab):

```json
{
  "mcpServers": {
    "ton-mcp": {
      "command": "node",
      "args": ["/Users/kunal/ton-mcp/dist/index.js"]
    }
  }
}
```

**Step 2: Restart Cursor**

**Step 3: Try Test Queries**

In Cursor, try these:
```
1. "Search TON documentation for smart contracts"
2. "Generate a Jetton token contract in Tolk"
3. "Create a smart contract project called MyToken"
4. "Show me how to deploy a contract to testnet"
5. "Generate React component for wallet connection"
6. "List all available TON resources"
7. "Validate this Tolk code: contract Counter { }"
8. "What is the TON Virtual Machine?"
```

### Method 3: Direct Server Test

```bash
# Start the MCP server
cd /Users/kunal/ton-mcp
npm start
```

Server will start and wait for MCP protocol messages via stdio.

**Expected output:**
```
✅ Search index initialized with XXX documents
TON MCP server running on stable MCP SDK...
```

---

## 📊 Test Coverage

### Tools to Test

| Tool | Description | Test Query |
|------|-------------|------------|
| `search_ton_documentation` | Search docs | "Search for smart contracts" |
| `generate_contract_code` | Generate contracts | "Generate Jetton in Tolk" |
| `compile_tolk_contract` | Compile Tolk | "Compile this Tolk code: ..." |
| `validate_tolk_syntax` | Validate syntax | "Validate Tolk syntax: ..." |
| `create_ton_project` | Project scaffold | "Create smart contract project" |
| `deploy_contract` | Deploy guide | "Deploy to testnet" |
| `check_deployment_status` | Check contract | "Check deployment status" |
| `get_deployment_guide` | Deployment help | "How to deploy contracts" |
| `generate_frontend_code` | Generate UI | "Generate React wallet connect" |
| `list_ton_resources` | List resources | "List TON resources" |
| `get_specific_ton_resource` | Get resource | "Get official tools guide" |
| `get_account_info_live` | Live data | "Get account info for EQD..." |
| `get_transaction_history_live` | Transactions | "Get transactions for EQD..." |
| `get_jetton_info_live` | Token info | "Get Jetton info for EQD..." |
| `get_network_status_live` | Network status | "Get TON network status" |

### Services to Verify

```bash
✅ search-index.js      - Documentation search
✅ ton-api.js           - Live blockchain data
✅ tolk-compiler.js     - Tolk compilation
✅ project-scaffold.js  - Project creation
✅ deployment.js        - Contract deployment
```

### Resources to Check

```bash
✅ smart-contracts/     - Contract guides
✅ how-to/              - How-to guides  
✅ tma/                 - TMA guides
✅ frontend/            - Frontend guides
✅ deployment/          - Deployment guides
```

---

## 🎯 Expected Responses

### Documentation Search
**Query:** "Search for smart contracts"

**Expected:**
- Returns relevant documentation
- Includes links to docs.ton.org
- Shows categories (development, smart-contracts, etc.)
- Provides context and examples

### Contract Generation
**Query:** "Generate Jetton in Tolk"

**Expected:**
- Returns complete Tolk contract code
- Follows TEP-74 standard
- Includes comments
- Has init, receive, and getter functions

### Project Creation
**Query:** "Create smart contract project"

**Expected:**
- Recommends Blueprint (`npm create ton@latest`)
- Provides step-by-step guide
- Shows project structure
- Lists next steps

### Deployment Guide
**Query:** "How to deploy to testnet"

**Expected:**
- Complete deployment steps
- Prerequisites listed
- Cost estimates
- Troubleshooting tips

---

## 🔍 Debugging

### Server Won't Start

**Problem:** `npm start` fails

**Solutions:**
```bash
# Rebuild
npm run build

# Check for errors
npm run build --verbose

# Verify Node version
node --version  # Should be 18+
```

### No Documentation Results

**Problem:** Search returns no results

**Solutions:**
```bash
# Reindex documentation
npm run index-docs

# Check index file
ls -lh docs-index.json

# Verify page count
cat docs-index.json | grep -o '"id"' | wc -l
```

### Tools Not Working

**Problem:** MCP tools not available in Cursor

**Solutions:**
```bash
# 1. Restart Cursor completely
# 2. Check MCP settings are correct
# 3. Verify server path is absolute
# 4. Check Cursor logs (Help → Toggle Developer Tools → Console)
```

### Services Missing

**Problem:** Test script shows missing services

**Solutions:**
```bash
# Full rebuild
rm -rf dist/
npm run build

# Verify build
ls -la dist/services/
```

---

## 📚 Example Project: tma-contract-cursor

This is a complete Telegram Mini App with smart contracts.

### Test with MCP

```bash
cd tma-contract-cursor
```

**Try asking Cursor:**
```
"Help me understand this TMA project structure"
"Generate tests for the Counter contract"
"Add a new feature to increment by custom amount"
"Create deployment script for testnet"
"Generate React component to display counter"
```

### Expected MCP Assistance

The MCP should help with:
- ✅ Contract analysis
- ✅ Code generation
- ✅ Testing suggestions
- ✅ Deployment guidance
- ✅ Frontend integration
- ✅ Best practices

---

## 🎯 Success Criteria

### ✅ Build Success
```bash
npm run build
# Should complete without errors
# dist/ folder should be populated
```

### ✅ Server Starts
```bash
npm start
# Should show:
# ✅ Search index initialized with XXX documents
# TON MCP server running...
```

### ✅ Tools Available
```
In Cursor, all 15+ tools should be accessible
Search should return results
Code generation should work
```

### ✅ Documentation Works
```
Search queries return relevant docs
Categories are correct
Links work
Content is comprehensive
```

### ✅ Code Generation Works
```
Contracts follow TON standards
Code compiles (Tolk/Tact)
Includes proper comments
Has complete functionality
```

---

## 📊 Test Report

After testing, you should see:

```
✅ Build: Success
✅ Server: Running
✅ Services: 5/5 loaded
✅ Resources: All present
✅ Documentation: XXX pages indexed
✅ Tools: 15+ available
✅ Responses: Accurate
✅ Code Quality: High
```

---

## 🚀 Next Steps

### After Successful Testing

1. **Publish Updates**
   ```bash
   npm version patch
   npm publish
   ```

2. **Share Results**
   - Post to TON Dev community
   - Share test results
   - Get feedback

3. **Continuous Testing**
   - Test with new TON features
   - Update documentation index
   - Add more examples

---

## 💡 Tips for Effective Testing

### 1. Test Progressively

Start simple → advance to complex:
```
1. Documentation search
2. Simple contract generation  
3. Project creation
4. Deployment
5. Complex workflows
```

### 2. Test Real Scenarios

Use actual development tasks:
```
- Build a real token
- Deploy to testnet
- Create actual TMA
- Integrate with frontend
```

### 3. Verify Accuracy

Check that:
```
✅ Code compiles
✅ Links work
✅ Standards followed
✅ Best practices included
```

### 4. Document Issues

If something doesn't work:
```
1. Note the exact query
2. Copy the response
3. Identify the problem
4. File an issue
```

---

## 📝 Test Checklist

### Pre-Testing

- [ ] MCP built successfully (`npm run build`)
- [ ] Documentation indexed (`npm run index-docs`)
- [ ] Server starts without errors
- [ ] Cursor configured correctly

### During Testing

- [ ] All tools accessible
- [ ] Documentation search works
- [ ] Contract generation accurate
- [ ] Project creation helpful
- [ ] Deployment guides complete
- [ ] Live data accessible (if API key set)

### Post-Testing

- [ ] Test report generated
- [ ] Issues documented
- [ ] Feedback collected
- [ ] Improvements identified

---

## 🆘 Getting Help

### Issues Found?

1. **Check logs:**
   ```bash
   npm start
   # Watch for error messages
   ```

2. **Verify build:**
   ```bash
   npm run build --verbose
   ```

3. **Test components:**
   ```bash
   node test-mcp-server.js
   ```

4. **Ask community:**
   - TON Dev Chat: https://t.me/tondev_eng
   - GitHub Issues: https://github.com/kunaldhongade/ton-mcp/issues

---

## 🎉 Success!

When everything works:

```
✅ MCP server running
✅ All tools functional
✅ Documentation accurate
✅ Code generation working
✅ Deployment guides helpful
✅ Ready for production use!
```

**Your TON MCP is ready to revolutionize TON development!** 🚀

---

## 📖 Additional Resources

- **Main README:** `/README.md`
- **Documentation:** `/docs/README.md`
- **Resources:** `/src/resources/README.md`
- **Integration:** `/docs/integration_guides/cursor.md`

**Happy Testing!** 🧪✨

