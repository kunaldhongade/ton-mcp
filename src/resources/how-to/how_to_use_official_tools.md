# How to Use Official TON Tools

## Overview

TON provides official tools for development. This MCP guides you to use them effectively.

---

## Blueprint - Smart Contract Development

### What is Blueprint?

Blueprint is the official tool for TON smart contract development, maintained by the TON Foundation.

**Repository:** https://github.com/ton-org/blueprint

### Features

- ✅ Project scaffolding with best practices
- ✅ Tact and FunC compilation
- ✅ Sandbox testing environment
- ✅ Deployment scripts
- ✅ TypeScript wrappers

### Quick Start

```bash
# Create new project
npm create ton@latest my-contract

# Follow the prompts:
# - Enter project name
# - Select language (Tact or FunC)
# - Choose contract type

cd my-contract
npm install
```

### Project Structure

```
my-contract/
├── contracts/          # Smart contract source code
│   └── MyContract.tact
├── wrappers/          # TypeScript wrappers
│   └── MyContract.ts
├── tests/             # Test files
│   └── MyContract.spec.ts
├── scripts/           # Deployment scripts
│   └── deployMyContract.ts
├── build/             # Compiled contracts
└── package.json
```

### Development Workflow

#### 1. Write Contract

Edit `contracts/YourContract.tact`:

```tact
import "@stdlib/deploy";

contract MyToken with Deployable {
    totalSupply: Int = 1000000;
    owner: Address;
    
    init(owner: Address) {
        self.owner = owner;
    }
    
    receive("mint") {
        self.totalSupply += 100;
    }
    
    get fun getTotalSupply(): Int {
        return self.totalSupply;
    }
}
```

#### 2. Build Contract

```bash
npm run build
```

This compiles your contract and generates:
- BOC file in `build/`
- TypeScript wrapper in `wrappers/`

#### 3. Write Tests

Edit `tests/YourContract.spec.ts`:

```typescript
import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { MyToken } from '../wrappers/MyToken';
import '@ton-community/test-utils';

describe('MyToken', () => {
    it('should deploy', async () => {
        const blockchain = await Blockchain.create();
        const contract = blockchain.openContract(
            await MyToken.fromInit(owner.address)
        );
        
        await contract.send(/*...*/);
        expect(await contract.getTotalSupply()).toEqual(1000000);
    });
});
```

#### 4. Run Tests

```bash
npm test
```

#### 5. Deploy

```bash
# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy
```

### Configuration

#### Set Environment Variables

Create `.env` file:

```bash
MNEMONIC="your 24 word mnemonic here"
TONCENTER_API_KEY="your api key from @tonapibot"
```

#### Blueprint Config

`blueprint.config.ts`:

```typescript
import { Config } from '@ton-community/blueprint';

export const config: Config = {
    contractsDir: './contracts',
    wrappersDir: './wrappers',
};
```

---

## @telegram-apps/create-mini-app - TMA Development

### What is it?

Official tool for creating Telegram Mini Apps with TON integration.

**Repository:** https://github.com/telegram-apps/create-mini-app

### Features

- ✅ Modern templates (React, Vue, Vanilla)
- ✅ TON Connect integration
- ✅ Telegram WebApp SDK
- ✅ Vite build system
- ✅ TypeScript support

### Quick Start

```bash
# Create new TMA
npx @telegram-apps/create-mini-app@latest

# Follow the prompts:
# - Enter project name
# - Select template (React recommended)
# - Choose package manager (npm)

cd my-tma
npm install
npm run dev
```

### Available Templates

1. **React** - Full-featured React app
2. **React + TypeScript** - Type-safe React
3. **Next.js** - Server-side rendering
4. **Vue** - Vue 3 composition API
5. **Vanilla** - Plain JavaScript

### Project Structure

```
my-tma/
├── src/
│   ├── App.tsx              # Main component
│   ├── components/          # UI components
│   ├── hooks/               # React hooks
│   └── index.tsx            # Entry point
├── public/
│   └── tonconnect-manifest.json
├── package.json
├── vite.config.ts
└── index.html
```

### TON Connect Setup

#### 1. Create Manifest

`public/tonconnect-manifest.json`:

```json
{
  "url": "https://yourdomain.com",
  "name": "My Awesome TMA",
  "iconUrl": "https://yourdomain.com/icon.png",
  "termsOfUseUrl": "https://yourdomain.com/terms",
  "privacyPolicyUrl": "https://yourdomain.com/privacy"
}
```

#### 2. Setup Provider

`src/main.tsx`:

```typescript
import { TonConnectUIProvider } from '@tonconnect/ui-react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <TonConnectUIProvider 
    manifestUrl="https://yourdomain.com/tonconnect-manifest.json"
  >
    <App />
  </TonConnectUIProvider>
);
```

#### 3. Use in Components

```typescript
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

function App() {
  const address = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  return (
    <div>
      {address ? (
        <button onClick={() => tonConnectUI.disconnect()}>
          Disconnect {address}
        </button>
      ) : (
        <button onClick={() => tonConnectUI.openModal()}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}
```

### Telegram Bot Setup

#### 1. Create Bot

Talk to [@BotFather](https://t.me/BotFather):

```
/newbot
# Follow prompts to create bot
```

#### 2. Set Web App

```
/setmenubutton
# Select your bot
# Send your deployed URL
```

#### 3. Configure

```
/setdescription
/setabouttext
/setuserpic
```

### Development Workflow

1. **Develop locally:** `npm run dev`
2. **Test features:** Use browser dev tools
3. **Build:** `npm run build`
4. **Deploy:** Push to hosting (Vercel/Netlify/GitHub Pages)
5. **Test in Telegram:** Open your bot

---

## Full-Stack dApp Development

### Setup Both Projects

```bash
# Create project folder
mkdir my-dapp
cd my-dapp

# 1. Create contracts
npm create ton@latest contracts
cd contracts && npm install && cd ..

# 2. Create frontend
npx @telegram-apps/create-mini-app@latest frontend
cd frontend && npm install && cd ..
```

### Integration Steps

#### 1. Deploy Contract

```bash
cd contracts
npm run build
npm run deploy:testnet
# Save the contract address!
```

#### 2. Copy Wrapper

```bash
# Copy contract wrapper to frontend
cp contracts/wrappers/MyContract.ts frontend/src/contracts/
```

#### 3. Configure Frontend

`frontend/src/config.ts`:

```typescript
export const CONTRACT_ADDRESS = 'EQD...'; // Your contract address
export const NETWORK = 'testnet';
```

#### 4. Interact with Contract

`frontend/src/hooks/useMyContract.ts`:

```typescript
import { useTonClient, useTonAddress } from '@tonconnect/ui-react';
import { MyContract } from '../contracts/MyContract';
import { Address } from '@ton/core';

export function useMyContract() {
  const client = useTonClient();
  const address = useTonAddress();

  const contract = useMemo(() => {
    if (!client) return null;
    const addr = Address.parse(CONTRACT_ADDRESS);
    return client.open(MyContract.createFromAddress(addr));
  }, [client]);

  const sendMessage = async () => {
    if (!contract) return;
    await contract.sendMessage({/*...*/});
  };

  return { contract, sendMessage };
}
```

---

## Best Practices

### Smart Contracts

1. **Always test thoroughly**
   ```bash
   npm test
   ```

2. **Deploy to testnet first**
   ```bash
   npm run deploy:testnet
   ```

3. **Verify on explorer**
   - Testnet: https://testnet.tonviewer.com
   - Mainnet: https://tonviewer.com

4. **Use TypeScript wrappers**
   - Type-safe interactions
   - Better IDE support
   - Fewer errors

### Telegram Mini Apps

1. **Test locally first**
   ```bash
   npm run dev
   ```

2. **Use TON Connect**
   - Don't reinvent wallet connection
   - Standard user experience
   - Better security

3. **Responsive design**
   - Mobile-first approach
   - Test on different screens
   - Use Telegram themes

4. **Error handling**
   - Handle wallet disconnection
   - Network errors
   - Transaction failures

---

## Common Commands Reference

### Blueprint

```bash
# Create project
npm create ton@latest my-contract

# Development
npm run build          # Compile contracts
npm test               # Run tests
npm run deploy:testnet # Deploy to testnet
npm run deploy         # Deploy to mainnet

# Interaction
npx blueprint run scriptName
```

### Telegram Mini Apps

```bash
# Create project
npx @telegram-apps/create-mini-app@latest

# Development
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview build

# Deployment
npm run deploy    # Deploy (if configured)
```

---

## Troubleshooting

### Blueprint Issues

**Problem:** Compilation fails
```bash
# Solution: Check contract syntax
npm run build
# Read error messages carefully
```

**Problem:** Tests fail
```bash
# Solution: Check test logic
npm test -- --verbose
```

**Problem:** Deployment fails
```bash
# Solution: Check wallet balance and network
# Ensure MNEMONIC is set
# Verify you have TON in wallet
```

### TMA Issues

**Problem:** TON Connect not working
```bash
# Solution: Check manifest URL
# Ensure manifest is publicly accessible
# Verify CORS headers
```

**Problem:** App not loading in Telegram
```bash
# Solution: 
# - Check HTTPS (required for TMAs)
# - Verify bot configuration
# - Check browser console
```

---

## Resources

### Official Documentation

- Blueprint: https://github.com/ton-org/blueprint
- TON Docs: https://docs.ton.org
- TMA Guide: https://docs.ton.org/develop/dapps/telegram-apps/
- TON Connect: https://docs.ton.org/develop/dapps/ton-connect/

### Community

- TON Dev Chat: https://t.me/tondev_eng
- TON Overflow: https://answers.ton.org
- GitHub Discussions: https://github.com/ton-blockchain/ton/discussions

### Tools

- TON Center: https://toncenter.com
- Testnet Faucet: https://testnet.tonscan.org/faucet
- TON Viewer: https://tonviewer.com
- TON API Bot: https://t.me/tonapibot

---

## MCP Integration

This MCP provides intelligent guidance for using these official tools:

1. **Project Creation**: Guides you to use Blueprint or @telegram-apps/create
2. **Code Generation**: Provides contract templates and examples
3. **Testing**: Helps write comprehensive tests
4. **Deployment**: Assists with deployment process
5. **Monitoring**: Checks contract status

**Ask the AI:**
- "Create a smart contract project"
- "How do I use Blueprint?"
- "Set up a Telegram Mini App"
- "Deploy my contract to testnet"
- "Integrate TON Connect"

The MCP will guide you through using these official tools effectively!

