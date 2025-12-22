# Complete Deployment Guide for TON Smart Contracts

## Overview

This guide covers everything you need to deploy smart contracts to TON blockchain, from preparation to monitoring.

---

## Prerequisites

### 1. TON Wallet

You need a wallet with TON tokens.

**For Testnet:**
- Use testnet faucet: https://testnet.tonscan.org/faucet
- Get free testnet TON

**For Mainnet:**
- Buy TON from exchange
- Need minimum 0.1 TON for deployment

### 2. Wallet Mnemonic

Your 24-word recovery phrase.

**⚠️ Security Warning:**
- Never share your mnemonic
- Store it securely
- Use testnet for practice

### 3. Development Environment

```bash
# Node.js installed
node --version  # Should be 18+

# Project with Blueprint
npm create ton@latest my-project
cd my-project
npm install
```

---

## Deployment Methods

### Method 1: Blueprint (Recommended)

#### Step 1: Build Contract

```bash
npm run build
```

This compiles your contract and generates:
- Compiled BOC in `build/`
- TypeScript wrapper in `wrappers/`

#### Step 2: Configure Environment

Create `.env` file:

```bash
# Your wallet mnemonic (24 words)
MNEMONIC="word1 word2 word3 ... word24"

# Optional: TonCenter API key
TONCENTER_API_KEY="your_api_key"

# Network (testnet or mainnet)
NETWORK="testnet"
```

**Get API Key:**
1. Message [@tonapibot](https://t.me/tonapibot) on Telegram
2. Request API key
3. Add to `.env`

#### Step 3: Deploy to Testnet

```bash
npm run deploy:testnet
```

**What happens:**
1. Connects to your wallet using mnemonic
2. Uploads contract code
3. Initializes contract state
4. Sends deployment transaction
5. Returns contract address

**Output Example:**
```
✅ Contract deployed successfully!
📍 Address: EQD2...abc (testnet)
🔗 Explorer: https://testnet.tonviewer.com/EQD2...abc
💰 Used: ~0.05 TON
```

#### Step 4: Verify Deployment

```bash
# Check contract on explorer
open https://testnet.tonviewer.com/YOUR_CONTRACT_ADDRESS

# Or use MCP tool
"Check deployment status of EQD2...abc on testnet"
```

#### Step 5: Deploy to Mainnet

```bash
# After testing on testnet!
npm run deploy

# Confirm deployment
# This uses real TON!
```

---

### Method 2: MCP-Assisted Deployment

#### Using MCP Tools

Ask the AI:

```
"Deploy my contract to testnet"
"Get deployment guide for MyContract"
"Check if my contract is deployed"
"Estimate deployment cost"
```

**MCP Will:**
1. Guide you through process
2. Check prerequisites
3. Generate deployment scripts
4. Monitor deployment
5. Verify on blockchain

---

### Method 3: Manual Deployment Script

#### Create Deployment Script

`scripts/deploy.ts`:

```typescript
import { toNano, Address } from '@ton/core';
import { MyContract } from '../wrappers/MyContract';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    // Compile contract
    const contractCode = await compile('MyContract');
    
    // Create contract instance
    const contract = provider.open(
        MyContract.createFromConfig(
            {
                owner: provider.sender().address!,
                // other init params
            },
            contractCode
        )
    );

    // Deploy
    await contract.sendDeploy(
        provider.sender(),
        toNano('0.05')  // Deployment fee
    );

    // Wait for deployment
    await provider.waitForDeploy(contract.address);

    // Log result
    console.log('✅ Deployed at:', contract.address);
    
    // Call getter to verify
    const data = await contract.getSomeData();
    console.log('📊 Initial data:', data);
}
```

#### Run Script

```bash
npx blueprint run deploy --testnet
```

---

## Deployment Costs

### Testnet (Free!)

All costs are in testnet TON (get from faucet):

```
Storage: ~0.01 TON
Deployment: ~0.02 TON
Initial balance: ~0.02 TON
Total: ~0.05 TON
```

### Mainnet (Real TON)

Actual costs vary by contract size:

| Contract Type | Estimated Cost |
|--------------|----------------|
| **Simple** (Counter, Wallet) | 0.05-0.1 TON |
| **Medium** (Token, NFT) | 0.1-0.2 TON |
| **Complex** (DEX, DAO) | 0.2-0.5 TON |

**Recommended:**
- Have 0.2 TON minimum
- Adds safety buffer
- Covers gas fees

---

## Post-Deployment

### 1. Save Contract Address

```bash
# Save to config file
echo "CONTRACT_ADDRESS=EQD..." >> .env

# Or in code
export const CONTRACT_ADDRESS = 'EQD...';
```

### 2. Verify on Explorer

**Testnet:**
```
https://testnet.tonviewer.com/YOUR_ADDRESS
https://testnet.tonscan.org/address/YOUR_ADDRESS
```

**Mainnet:**
```
https://tonviewer.com/YOUR_ADDRESS
https://tonscan.org/address/YOUR_ADDRESS
```

**Check:**
- ✅ Contract is active
- ✅ Balance > 0
- ✅ Code hash matches
- ✅ Getters work

### 3. Test Contract Functions

```typescript
// Test getters
const value = await contract.getValue();
console.log('Value:', value);

// Test state changes
await contract.sendUpdate(sender, toNano('0.01'));

// Verify change
const newValue = await contract.getValue();
console.log('New value:', newValue);
```

### 4. Update Frontend

```typescript
// Update contract address in frontend
const CONTRACT_ADDRESS = 'EQD...'; // Your deployed address

// Initialize contract
const contract = client.open(
    MyContract.createFromAddress(Address.parse(CONTRACT_ADDRESS))
);
```

---

## Common Issues & Solutions

### Issue 1: Insufficient Funds

**Error:**
```
Error: Insufficient funds for deployment
```

**Solution:**
```bash
# Check wallet balance
npm run check-balance

# Add more TON to wallet
# Testnet: Use faucet
# Mainnet: Transfer from exchange
```

### Issue 2: Contract Already Deployed

**Error:**
```
Error: Contract already deployed at this address
```

**Solution:**
```bash
# Change init parameters
# Or use different wallet
# Or deploy new version with changes
```

### Issue 3: Deployment Timeout

**Error:**
```
Error: Deployment timeout after 60s
```

**Solution:**
```bash
# Network might be congested
# Wait a few minutes and try again

# Check transaction on explorer
# It might have succeeded
```

### Issue 4: Wrong Network

**Error:**
```
Error: Contract not found on mainnet
```

**Solution:**
```bash
# Check you're on correct network
echo $NETWORK

# Switch network in .env
NETWORK=testnet  # or mainnet
```

---

## Advanced Deployment

### Multi-Contract Deployment

```typescript
// Deploy multiple contracts
export async function run(provider: NetworkProvider) {
    // Deploy main contract
    const main = await deployMain(provider);
    console.log('Main deployed:', main.address);
    
    // Deploy dependencies
    const dep1 = await deployDependency1(provider, main.address);
    const dep2 = await deployDependency2(provider, main.address);
    
    console.log('All contracts deployed!');
}
```

### Upgradeable Contracts

```tolk
// Store admin and allow code updates
global slice admin;
global cell contract_code;

fun recv_internal(...) impure {
    int op = in_msg_body~load_uint(32);
    
    if (op == 999) {  // Upgrade
        require_admin(sender);
        cell new_code = in_msg_body~load_ref();
        set_code(new_code);
        commit();  // Apply new code
    }
}
```

### Proxy Pattern

```tolk
// Proxy contract forwards calls to implementation
fun recv_internal(...) impure {
    cell impl_addr = get_implementation_address();
    
    // Forward message to implementation
    send_raw_message(
        begin_cell()
            .store_slice(impl_addr)
            .store_slice(in_msg_body)
            .end_cell(),
        64  // Forward all remaining balance
    );
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Contract compiled successfully
- [ ] Tests passing (`npm test`)
- [ ] Security audit (for mainnet)
- [ ] Wallet has enough TON
- [ ] Environment variables set
- [ ] Network selected (testnet/mainnet)

### During Deployment

- [ ] Deployment command executed
- [ ] Transaction confirmed
- [ ] Contract address received
- [ ] Explorer shows contract

### Post-Deployment

- [ ] Contract address saved
- [ ] Getters tested
- [ ] State changes tested
- [ ] Frontend updated
- [ ] Documentation updated
- [ ] Team notified

---

## Monitoring Deployed Contract

### Using MCP

```
"Check deployment status of EQD..."
"Get contract balance EQD..."
"Show recent transactions for EQD..."
```

### Using Explorer

**Testnet:**
- https://testnet.tonviewer.com
- https://testnet.tonscan.org

**Mainnet:**
- https://tonviewer.com
- https://tonscan.org

### Using Code

```typescript
// Get contract state
const state = await client.getContractState(address);
console.log('State:', state.state);  // active/frozen/uninitialized

// Get balance
console.log('Balance:', state.balance);

// Get last transaction
const txs = await client.getTransactions(address, { limit: 1 });
console.log('Last tx:', txs[0]);
```

---

## Best Practices

### 1. Always Test First

```bash
# Deploy to testnet
npm run deploy:testnet

# Test thoroughly
# Only then deploy to mainnet
npm run deploy
```

### 2. Version Control

```bash
# Tag releases
git tag -a v1.0.0 -m "Initial mainnet deployment"
git push --tags

# Document deployment
echo "v1.0.0: EQD... deployed on 2024-01-01" >> DEPLOYMENTS.md
```

### 3. Keep Records

```typescript
// deployments.json
{
  "testnet": {
    "MyContract": {
      "address": "EQD...",
      "deployedAt": "2024-01-01T00:00:00Z",
      "version": "1.0.0",
      "txHash": "abc..."
    }
  },
  "mainnet": {
    "MyContract": {
      "address": "EQD...",
      "deployedAt": "2024-01-02T00:00:00Z",
      "version": "1.0.0",
      "txHash": "xyz..."
    }
  }
}
```

### 4. Security

- ✅ Use hardware wallet for mainnet
- ✅ Verify contract code on explorer
- ✅ Test all functions after deployment
- ✅ Monitor contract activity
- ✅ Have emergency pause mechanism

---

## Resources

### Tools

- Blueprint: https://github.com/ton-org/blueprint
- TON Center: https://toncenter.com
- Testnet Faucet: https://testnet.tonscan.org/faucet

### Explorers

- TON Viewer: https://tonviewer.com
- TON Scan: https://tonscan.org

### Documentation

- Deployment Guide: https://docs.ton.org/develop/smart-contracts/deployment
- Best Practices: https://docs.ton.org/develop/smart-contracts/best-practices

### Support

- TON Dev Chat: https://t.me/tondev_eng
- Stack Overflow: https://stackoverflow.com/questions/tagged/ton
- GitHub Discussions: https://github.com/ton-blockchain/ton/discussions

---

## MCP Integration

This MCP helps with every step:

**Ask the AI:**
```
"How do I deploy my contract?"
"Estimate deployment cost"
"Generate deployment script"
"Deploy to testnet"
"Check if my contract is deployed"
"Monitor my contract"
```

**MCP Provides:**
- ✅ Step-by-step guidance
- ✅ Automated deployment
- ✅ Status monitoring
- ✅ Troubleshooting help
- ✅ Best practices

**Your smart contract deployment made easy!** 🚀

