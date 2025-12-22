# Complete TON Development Workflows

## Overview

This guide provides end-to-end workflows for common TON development tasks, from beginner to advanced.

---

## Workflow 1: Simple Smart Contract (Beginner)

### Goal: Create and deploy a counter contract

###Step 1: Create Project

```bash
npm create ton@latest my-counter
cd my-counter
npm install
```

Select: **Tact** language

### Step 2: Write Contract

`contracts/Counter.tact`:

```tact
import "@stdlib/deploy";

contract Counter with Deployable {
    counter: Int = 0;
    
    receive("increment") {
        self.counter += 1;
    }
    
    get fun getCounter(): Int {
        return self.counter;
    }
}
```

### Step 3: Build

```bash
npm run build
```

### Step 4: Test

`tests/Counter.spec.ts`:

```typescript
it('should increment', async () => {
    await counter.sendIncrement(deployer.getSender());
    expect(await counter.getCounter()).toBe(1);
});
```

```bash
npm test
```

### Step 5: Deploy to Testnet

```bash
# Set up .env
echo "MNEMONIC=your 24 words here" > .env

# Deploy
npm run deploy:testnet
```

### Step 6: Verify

Check on explorer: https://testnet.tonviewer.com/YOUR_ADDRESS

**Time: ~30 minutes**

---

## Workflow 2: Token (Jetton) Contract (Intermediate)

### Goal: Create and deploy a fungible token

### Step 1: Create Project

```bash
npm create ton@latest my-token
cd my-token
npm install
```

### Step 2: Use MCP for Contract

Ask AI:
```
"Generate a Jetton contract in Tact with:
- 1,000,000 total supply
- Minting capability
- Transfer function
- Following TEP-74 standard"
```

### Step 3: Implement Generated Code

Copy AI-generated code to `contracts/MyToken.tact`

### Step 4: Write Comprehensive Tests

```typescript
describe('MyToken', () => {
    it('should have correct supply', async () => {
        const supply = await token.getTotalSupply();
        expect(supply).toBe(1000000n);
    });
    
    it('should mint tokens', async () => {
        await token.sendMint(admin, toNano('0.05'), 1000n);
        const supply = await token.getTotalSupply();
        expect(supply).toBe(1001000n);
    });
    
    it('should transfer tokens', async () => {
        await token.sendTransfer(user1, user2.address, 100n);
        // Verify transfer
    });
});
```

### Step 5: Deploy & Verify

```bash
npm run build
npm test
npm run deploy:testnet
```

### Step 6: Integrate with Frontend

Ask AI:
```
"Generate React component for my Jetton contract at EQD..."
```

**Time: ~2 hours**

---

## Workflow 3: NFT Collection (Intermediate)

### Goal: Create NFT collection and mint NFTs

### Step 1: Create Project

```bash
npm create ton@latest my-nft-collection
```

### Step 2: Generate NFT Contracts

Ask AI:
```
"Generate NFT collection and NFT item contracts following TEP-62"
```

You'll need two contracts:
- Collection contract
- NFT Item contract

### Step 3: Configure Metadata

```typescript
// Collection metadata
const collectionContent = {
    name: "My NFT Collection",
    description: "Cool NFTs",
    image: "https://example.com/collection.png"
};

// Item metadata
const itemContent = (index: number) => ({
    name: `NFT #${index}`,
    description: "Unique NFT",
    image: `https://example.com/nft/${index}.png`
});
```

### Step 4: Deploy Collection

```bash
npm run build
npm run deploy:testnet
```

### Step 5: Mint NFTs

Create minting script:

```typescript
// scripts/mintNFT.ts
export async function run(provider: NetworkProvider) {
    const collection = provider.open(
        Collection.createFromAddress(Address.parse('YOUR_COLLECTION_ADDRESS'))
    );
    
    await collection.sendMintNFT(
        provider.sender(),
        {
            index: 0,
            ownerAddress: provider.sender().address!,
            content: itemContent(0)
        }
    );
    
    console.log('✅ NFT minted!');
}
```

```bash
npx blueprint run mintNFT --testnet
```

### Step 6: Verify on Explorer

Check:
- Collection address
- Minted NFT addresses
- Metadata loading

**Time: ~3 hours**

---

## Workflow 4: Telegram Mini App with TON (Intermediate)

### Goal: Build TMA that interacts with smart contract

### Step 1: Deploy Contract First

```bash
# Create and deploy contract (from previous workflows)
npm create ton@latest my-contract
cd my-contract
npm run build
npm run deploy:testnet
# Save contract address: EQD...
```

### Step 2: Create TMA

```bash
cd ..
npx @telegram-apps/create-mini-app@latest my-tma
cd my-tma
npm install
```

Select: **React + TypeScript**

### Step 3: Add TON Dependencies

```bash
npm install @tonconnect/ui-react @ton/core @ton/ton
```

### Step 4: Setup TON Connect

`src/main.tsx`:

```typescript
import { TonConnectUIProvider } from '@tonconnect/ui-react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <TonConnectUIProvider manifestUrl="https://yourdomain.com/tonconnect-manifest.json">
    <App />
  </TonConnectUIProvider>
);
```

### Step 5: Copy Contract Wrapper

```bash
cp ../my-contract/wrappers/MyContract.ts src/contracts/
```

### Step 6: Create Contract Hook

Ask AI:
```
"Create React hook to interact with my contract at EQD..."
```

`src/hooks/useMyContract.ts`:

```typescript
export function useMyContract() {
  const client = useTonClient();
  const address = useTonAddress();
  
  const contract = useMemo(() => {
    if (!client) return null;
    return client.open(
      MyContract.createFromAddress(Address.parse(CONTRACT_ADDRESS))
    );
  }, [client]);
  
  const getValue = async () => {
    if (!contract) return null;
    return await contract.getValue();
  };
  
  return { contract, getValue };
}
```

### Step 7: Build UI

```typescript
function App() {
  const { contract, getValue } = useMyContract();
  const [value, setValue] = useState(null);
  
  useEffect(() => {
    getValue().then(setValue);
  }, []);
  
  return (
    <div>
      <TonConnectButton />
      <p>Contract Value: {value}</p>
      <button onClick={async () => {
        await contract?.sendUpdate();
        setValue(await getValue());
      }}>
        Update
      </button>
    </div>
  );
}
```

### Step 8: Setup Telegram Bot

1. Talk to [@BotFather](https://t.me/BotFather)
2. Create bot: `/newbot`
3. Set Web App: `/setmenubutton`
4. Enter your URL

### Step 9: Deploy

```bash
npm run build
# Deploy to Vercel/Netlify/GitHub Pages
```

### Step 10: Test in Telegram

Open your bot and test:
- ✅ Wallet connection
- ✅ Contract interaction
- ✅ Transaction sending
- ✅ State updates

**Time: ~4 hours**

---

## Workflow 5: DeFi Staking Pool (Advanced)

### Goal: Build complete staking dApp

### Step 1: Design Architecture

```
Staking Pool Contract
├── Stake TON
├── Unstake with lock period
├── Calculate rewards
└── Claim rewards

Frontend TMA
├── Connect wallet
├── Show APY
├── Stake interface
└── Rewards dashboard
```

### Step 2: Generate Contract

Ask AI:
```
"Generate a staking pool contract in Tolk with:
- Stake/unstake functions
- 30-day lock period
- 10% APY rewards
- Admin controls"
```

### Step 3: Implement & Test

```typescript
describe('StakingPool', () => {
    it('should stake tokens', async () => {
        await pool.sendStake(user, toNano('100'));
        expect(await pool.getStaked(user.address)).toBe(toNano('100'));
    });
    
    it('should calculate rewards', async () => {
        await pool.sendStake(user, toNano('100'));
        // Fast-forward time in sandbox
        blockchain.now += 86400 * 30; // 30 days
        const rewards = await pool.getRewards(user.address);
        expect(rewards).toBeGreaterThan(0);
    });
    
    it('should enforce lock period', async () => {
        await pool.sendStake(user, toNano('100'));
        await expect(
            pool.sendUnstake(user, toNano('100'))
        ).rejects.toThrow();
    });
});
```

### Step 4: Deploy Contracts

```bash
npm run deploy:testnet
```

### Step 5: Build Frontend

Create TMA with:
- Staking interface
- Rewards calculator
- Position tracking
- Claim functionality

### Step 6: Add Analytics

```typescript
// Track staking metrics
const metrics = {
    totalStaked: await pool.getTotalStaked(),
    apy: await pool.getAPY(),
    userStaked: await pool.getStaked(userAddress),
    userRewards: await pool.getRewards(userAddress)
};
```

### Step 7: Security Audit

Before mainnet:
- [ ] Code review
- [ ] Security audit
- [ ] Penetration testing
- [ ] Economic model review

### Step 8: Deploy to Mainnet

```bash
# After thorough testing!
npm run deploy
```

### Step 9: Monitor & Maintain

- Monitor contract balance
- Track user activity
- Handle emergencies
- Update APY if needed

**Time: ~2 weeks**

---

## Workflow 6: DAO with Governance (Advanced)

### Goal: Full DAO with proposal and voting

### Step 1: Generate DAO Contracts

Ask AI:
```
"Generate a complete DAO system with:
- Proposal creation
- Voting mechanism
- Execution system
- Treasury management
- Token-based governance"
```

### Step 2: Implement Multi-Contract System

```
DAO System
├── Governance Token (Jetton)
├── DAO Core (Proposals & Voting)
├── Treasury Contract
└── Timelock Contract
```

### Step 3: Deploy in Order

```bash
# 1. Deploy governance token
npm run deploy:testnet -- --script deployToken

# 2. Deploy DAO core with token address
npm run deploy:testnet -- --script deployDAO

# 3. Deploy treasury
npm run deploy:testnet -- --script deployTreasury

# 4. Link contracts
npm run deploy:testnet -- --script linkContracts
```

### Step 4: Build Governance UI

Features:
- Proposal creation
- Voting interface
- Proposal history
- Treasury dashboard
- Token delegation

### Step 5: Create Proposal Flow

```typescript
// 1. Create proposal
await dao.sendCreateProposal({
    title: "Increase staking rewards",
    description: "...",
    actions: [/*execution calls*/],
    votingPeriod: 7 * 86400 // 7 days
});

// 2. Users vote
await dao.sendVote({
    proposalId: 1,
    support: true,
    tokens: userTokenBalance
});

// 3. Execute if passed
if (proposalPassed) {
    await dao.sendExecute({ proposalId: 1 });
}
```

### Step 6: Test Governance

- Create test proposals
- Simulate voting
- Test execution
- Verify treasury operations

**Time: ~1 month**

---

## Best Practices Across All Workflows

### 1. Always Start with Testnet

```bash
# Deploy to testnet first
npm run deploy:testnet

# Test thoroughly

# Only then deploy to mainnet
npm run deploy
```

### 2. Use Version Control

```bash
git init
git add .
git commit -m "Initial commit"

# Tag deployments
git tag v1.0.0-testnet
git tag v1.0.0-mainnet
```

### 3. Document Everything

```markdown
# DEPLOYMENTS.md
## Testnet
- Counter: EQD... (deployed 2024-01-01)
- Token: EQD... (deployed 2024-01-02)

## Mainnet
- Counter: EQD... (deployed 2024-02-01)
```

### 4. Monitor Contracts

```typescript
// Set up monitoring
setInterval(async () => {
    const balance = await contract.getBalance();
    if (balance < threshold) {
        alert('Low contract balance!');
    }
}, 60000);
```

### 5. Have Emergency Plans

```tolk
// Pause mechanism
fun recv_internal(...) impure {
    if (is_paused) {
        return ();  // Reject all operations
    }
    // Normal operations
}
```

---

## MCP Integration

**This MCP helps with every workflow:**

Ask the AI:
```
"Walk me through creating a token contract"
"Generate NFT collection code"
"Build a staking pool"
"Create a DAO system"
"Deploy my contract step by step"
```

**MCP provides:**
- ✅ Step-by-step guidance
- ✅ Code generation
- ✅ Best practices
- ✅ Troubleshooting
- ✅ Testing help
- ✅ Deployment assistance

**Master TON development with complete workflows!** 🚀

