# TON MCP Integration with Cursor

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Cursor](https://cursor.sh/) IDE
- TON API keys (see setup below)

## Installation

### Option 1: Install from npm (Recommended)

```bash
# Install globally from npm
npm install -g ton-mcp

# Or install from GitHub
git clone https://github.com/kunaldhongade/ton-mcp.git
cd ton-mcp
npm install
npm run build
npm link  # Creates global link

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

### Method 1: MCP Settings UI (Recommended)

1. **Open Cursor Settings** (Cmd/Ctrl + ,)
2. **Navigate to** Cursor Settings → **MCP** tab
3. **Click "Add new MCP server"**
4. **Configure as STDIO transport:**

#### For Global npm Installation:

```
Name: TON MCP
Type: Command (stdio transport)
Command: ton-mcp
Working Directory: Leave empty
Environment Variables:
  TON_NETWORK=testnet
  TON_API_KEY=your_toncenter_api_key_here
  TON_API_KEY_ENHANCED=your_tonapi_key_here (optional)
  DEBUG=true
```

#### For Local Installation:

```
Name: TON MCP (Local)
Type: Command (stdio transport)
Command: node
Args: /path/to/ton-mcp/dist/index.js
Working Directory: /path/to/ton-mcp
Environment Variables:
  TON_NETWORK=testnet
  TON_API_KEY=your_toncenter_api_key_here
  DEBUG=true
```

### Method 2: mcp.json Configuration

#### Project Configuration

Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "ton-mcp": {
      "command": "ton-mcp",
      "env": {
        "TON_NETWORK": "testnet",
        "TON_API_KEY": "your_toncenter_api_key_here",
        "DEBUG": "true"
      }
    }
  }
}
```

#### Global Configuration

Create `~/.cursor/mcp.json` for system-wide access:

```json
{
  "mcpServers": {
    "ton-mcp": {
      "command": "ton-mcp",
      "env": {
        "TON_NETWORK": "testnet",
        "TON_API_KEY": "your_toncenter_api_key_here"
      }
    }
  }
}
```

### Method 3: MCP Browser (Future)

Our TON MCP may appear in Cursor's built-in MCP server browser. Look for "TON MCP" in the **Browse MCP Tools** section.

### Step 2: Restart Cursor

**Completely restart Cursor** for MCP changes to take effect.

## 🧪 Testing TON MCP in Cursor

### Verify Integration

After restarting Cursor:

1. **Open a new chat**
2. **Check "Available Tools"** - look for "TON MCP" in the tools list
3. **Monitor output panel** for any connection errors

### Test Commands

Try these queries to verify functionality:

#### Documentation Search

> _"Search for information about TON smart contracts"_

**Expected:** AI uses `search_ton_documentation` tool and returns relevant TON docs.

#### Live Blockchain Data

> _"Check balance of address: EQC8rUZqR_pWV1BylWUlPNBzyiTYVoBEmQkMIQDZXICfnuRr"_

**Expected:** AI uses `get_account_info_live` tool and returns real balance data.

#### Code Generation

> _"Generate a counter contract in Tact"_

**Expected:** AI uses `generate_contract_code` tool and returns production-ready code.

### Tool Response Format

Cursor displays MCP responses with:

- **Expandable arguments** passed to the tool
- **Response data** from TON MCP
- **Success/failure indicators**

### Auto-Run Configuration

For automatic tool usage:

1. Go to **Cursor Settings** → **Agent** → **Auto-run**
2. Enable auto-run for TON MCP tools
3. AI uses TON tools automatically when relevant

## Testing Integration

### Advanced Tests

1. **Live Blockchain Data:**

   > _"Check the balance of this TON address: EQC8rUZqR_pWV1BylWUlPNBzyiTYVoBEmQkMIQDZXICfnuRr"_

2. **Code Generation:**

   > _"Generate a counter smart contract in Tact"_

3. **Documentation Search:**

   > _"How does TVM work in TON?"_

4. **Transaction History:**
   > _"Show recent transactions for address: EQC8rUZqR_pWV1BylWUlPNBzyiTYVoBEmQkMIQDZXICfnuRr"_

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
