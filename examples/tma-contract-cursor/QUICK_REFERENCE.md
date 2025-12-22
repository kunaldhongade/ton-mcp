# TON MCP Quick Reference Guide

## 🚀 Quick Start

```bash
# Install
npm install -g ton-mcp

# Configure
export TON_NETWORK=testnet
export TON_API_KEY=your_api_key

# Use in Cursor/Claude Code
# MCP tools automatically available!
```

---

## 📋 All Available Tools

### Blockchain Data (4 tools)

| Tool | Purpose | Example |
|------|---------|---------|
| `get_network_status_live()` | Network status & gas prices | Get current gas prices |
| `get_account_info_live(address)` | Account balance & state | Check wallet balance |
| `get_transaction_history_live(address, limit)` | Transaction history | View recent transactions |
| `get_jetton_info_live(jetton_address)` | Jetton token info | Get token supply & metadata |

### Contract Generation (1 tool)

| Tool | Purpose | Contract Types | Languages |
|------|---------|---------------|-----------|
| `generate_contract_code(type, language)` | Generate contracts | counter, wallet, jetton, nft, dao, staking, multisig | tolk, tact, func |

### Project & Deployment (4 tools)

| Tool | Purpose | Example |
|------|---------|---------|
| `create_ton_project(name, type, language, framework)` | Create project structure | Full-stack dApp setup |
| `generate_deployment_script(code, network, value)` | Generate deploy script | TypeScript deployment |
| `get_deployment_guide(name, network)` | Get deployment guide | Step-by-step instructions |
| `check_deployment_status(address, network)` | Verify deployment | Check if deployed |

### Frontend (1 tool)

| Tool | Purpose | Features |
|------|---------|----------|
| `generate_frontend_code(features, framework)` | Generate frontend | wallet-connect, contract-interaction, balance-display |

### Documentation (3 tools)

| Tool | Purpose | Example |
|------|---------|---------|
| `search_ton_documentation(query, category, limit)` | Search docs | Find TON guides |
| `list_ton_resources()` | List resources | See all guides |
| `get_specific_ton_resource(filename)` | Get specific guide | Read specific doc |

### Validation (2 tools)

| Tool | Purpose | Note |
|------|---------|------|
| `validate_tolk_syntax(code)` | Validate Tolk syntax | Requires Tolk compiler |
| `compile_tolk_contract(code, name)` | Compile Tolk | Requires Tolk compiler |

---

## 🎯 Common Workflows

### Workflow 1: Create Counter Contract

```typescript
// 1. Generate
const code = generate_contract_code("counter", "tolk");

// 2. Deploy
const script = generate_deployment_script(code, "testnet", "0.05");

// 3. Verify
check_deployment_status(address, "testnet");
```

### Workflow 2: Build Token (Jetton)

```typescript
// 1. Create project
create_ton_project("my-token", "smart-contract", "tolk");

// 2. Generate contract
generate_contract_code("jetton", "tolk");

// 3. Deploy
generate_deployment_script(code, "testnet", "0.1");

// 4. Get info
get_jetton_info_live(jettonAddress);
```

### Workflow 3: Full-Stack dApp

```typescript
// 1. Create project
create_ton_project("my-dapp", "dapp-fullstack", "tolk", "react");

// 2. Generate contract
generate_contract_code("nft", "tolk");

// 3. Generate frontend
generate_frontend_code(["wallet-connect", "contract-interaction"], "react");

// 4. Deploy
get_deployment_guide("nft", "testnet");
```

---

## 📚 Contract Types Reference

| Type | Description | Use Case |
|------|-------------|----------|
| `counter` | Simple counter | Learning, testing |
| `wallet` | Wallet V5 | Wallet applications |
| `jetton` | Token (TEP-74) | Token creation |
| `nft` | NFT (TEP-62) | NFT collections |
| `dao` | Governance | DAO creation |
| `staking` | Staking pool | DeFi staking |
| `multisig` | Multi-signature | Secure wallets |

---

## 🌐 Networks

| Network | Endpoint | Use Case |
|---------|----------|----------|
| `testnet` | testnet.toncenter.com | Development, testing |
| `mainnet` | toncenter.com | Production |

---

## 🔧 Language Comparison

| Language | Level | Best For | Compiler Required |
|----------|-------|----------|-------------------|
| **Tolk** | High | New projects | ✅ Yes |
| **Tact** | High | Most projects | ❌ No |
| **FunC** | Low | Advanced users | ❌ No |

**Recommendation:** Use **Tact** for most projects (no compiler needed)

---

## ⚡ Quick Commands

### Check Network
```typescript
get_network_status_live()
```

### Generate Contract
```typescript
generate_contract_code("jetton", "tact")
```

### Create Project
```typescript
create_ton_project("my-app", "dapp-fullstack", "tact", "react")
```

### Deploy
```typescript
generate_deployment_script(code, "testnet", "0.05")
```

### Search Docs
```typescript
search_ton_documentation("TON Connect", "frontend", 5)
```

---

## 🐛 Common Issues & Fixes

### Issue: "Tolk compiler not found"
**Fix:** Install Tolk compiler or use Tact/FunC instead

### Issue: "Account not found"
**Fix:** Check address format (should start with EQ), verify network

### Issue: "Low search relevance"
**Fix:** Use more specific keywords, try different categories

### Issue: "Resource not found"
**Fix:** Use `list_ton_resources()` to see available resources

---

## 📖 Resources

- **Main Docs:** [README.md](../README.md)
- **AI Guide:** [AI_USAGE_GUIDE.md](../AI_USAGE_GUIDE.md)
- **Analysis:** [TON_MCP_COMPLETE_ANALYSIS.md](./TON_MCP_COMPLETE_ANALYSIS.md)
- **Improvements:** [IMPROVEMENT_RECOMMENDATIONS.md](./IMPROVEMENT_RECOMMENDATIONS.md)

---

## 🎓 Learning Path

1. **Start:** `create_ton_project("my-first", "smart-contract", "tact")`
2. **Generate:** `generate_contract_code("counter", "tact")`
3. **Deploy:** Follow `get_deployment_guide("counter", "testnet")`
4. **Verify:** `check_deployment_status(address, "testnet")`
5. **Build:** `create_ton_project("my-dapp", "dapp-fullstack", "tact", "react")`

---

**Last Updated:** 2024-12-19

