# TON MCP Integration with Cursor

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Cursor](https://cursor.sh/) IDE
- TON API keys (see setup below)

## Installation

### Option 1: Install from npm (Recommended)

```bash
# Install globally
npm install -g ton-mcp

# Verify installation
ton-mcp --help
```

### Option 2: Local Development

```bash
# Clone and build
git clone https://github.com/ton-community/ton-mcp.git
cd ton-mcp
npm install
npm run build
```

## API Key Setup

### Get TON API Keys

1. **TON Center API Key** (Required):
   - Visit [https://toncenter.com/api/v2/](https://toncenter.com/api/v2/)
   - Sign up for a free API key
   - Copy your API key

2. **TON API Enhanced Key** (Optional, for advanced features):
   - Visit [https://tonapi.io/](https://tonapi.io/)
   - Create an account and get your API key

### Configure Environment

Create a `.env` file in your home directory or project directory:

```bash
# Required
TON_NETWORK=testnet
TON_API_KEY=your_toncenter_api_key_here

# Optional but recommended
TON_API_KEY_ENHANCED=your_tonapi_key_here
DEBUG=true
```

## Cursor Configuration

### Step 1: Open Cursor Settings

1. Open Cursor IDE
2. Press `Cmd/Ctrl + ,` to open settings
3. Navigate to **Cursor Settings** → **MCP** tab

### Step 2: Add TON MCP Server

Click **"Add new MCP server"** and configure:

#### For npm Installation:
```
Name: TON MCP
Type: Command
Command: ton-mcp
Working Directory: Leave empty (uses global installation)
Environment Variables:
  TON_NETWORK=testnet
  TON_API_KEY=your_api_key_here
  DEBUG=true
```

#### For Local Installation:
```
Name: TON MCP (Local)
Type: Command
Command: node /path/to/ton-mcp/dist/index.js
Working Directory: /path/to/ton-mcp
Environment Variables:
  TON_NETWORK=testnet
  TON_API_KEY=your_api_key_here
  DEBUG=true
```

### Step 3: Restart Cursor

Restart Cursor completely for MCP changes to take effect.

## Testing Integration

### Basic Test

Open a new chat and ask:
> *"Search for information about TON smart contracts"*

**Expected Response:** AI should use `search_ton_documentation` tool and return relevant TON documentation.

### Advanced Test

Try these queries:

1. **Live Blockchain Data:**
   > *"Check the balance of this TON address: EQC8rUZqR_pWV1BylWUlPNBzyiTYVoBEmQkMIQDZXICfnuRr"*

2. **Code Generation:**
   > *"Generate a counter smart contract in Tact"*

3. **Documentation Search:**
   > *"How does TVM work in TON?"*

4. **Transaction History:**
   > *"Show recent transactions for address: EQC8rUZqR_pWV1BylWUlPNBzyiTYVoBEmQkMIQDZXICfnuRr"*

## Troubleshooting

### Common Issues

**1. "MCP server failed to start"**
- Check that your API keys are valid
- Verify Node.js version (≥18)
- Ensure the command path is correct

**2. "No tools available"**
- Restart Cursor completely
- Check MCP server logs in Cursor's output panel

**3. "API key invalid"**
- Verify your TON Center API key
- Check network settings (testnet/mainnet)

**4. "Search returns no results"**
- Wait for server initialization (shows "TON MCP server running")
- Try simpler search terms

### Debug Mode

Enable debug logging:

```bash
# In your .env file
DEBUG=true
```

Check Cursor's output panel for detailed logs.

## Usage Examples

### Building a dApp

```
User: "Help me build a TON token swap dApp"

AI will use TON MCP to:
✅ Search for AMM documentation
✅ Generate Jetton token contracts
✅ Create React frontend with wallet integration
✅ Provide deployment guidance
```

### Smart Contract Development

```
User: "Create a staking contract"

AI will use TON MCP to:
✅ Generate production-ready Tact contract
✅ Analyze security considerations
✅ Provide testing guidance
```

### Telegram Mini App

```
User: "Build a Telegram Mini App for TON"

AI will use TON MCP to:
✅ Generate TMA-specific code
✅ Configure Telegram Web App manifest
✅ Integrate TON Connect wallet
```

## Best Practices

- **Always test API keys** before production use
- **Use testnet** for development and testing
- **Keep API keys secure** - never commit to version control
- **Restart Cursor** after configuration changes
- **Check logs** if something isn't working

## Support

- [GitHub Issues](https://github.com/ton-community/ton-mcp/issues)
- [TON Community](https://t.me/tondev)
- [TON Documentation](https://docs.ton.org/)

---

**Ready to build TON applications with AI assistance! 🚀**
