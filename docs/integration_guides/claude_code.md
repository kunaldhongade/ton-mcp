# TON MCP Integration with Claude Code

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Claude Code](https://docs.anthropic.com/claude/docs/desktop-mcp) CLI tool
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

Create a `.env` file:

```bash
# Required
TON_NETWORK=testnet
TON_API_KEY=your_toncenter_api_key_here

# Optional but recommended
TON_API_KEY_ENHANCED=your_tonapi_key_here
DEBUG=true
```

## Claude Code Configuration

### Step 1: Configure MCP Server

Edit your Claude Code configuration file (`~/.claude/config.json`):

```json
{
  "mcpServers": {
    "ton-mcp": {
      "command": "ton-mcp",
      "env": {
        "TON_NETWORK": "testnet",
        "TON_API_KEY": "your_toncenter_api_key_here",
        "TON_API_KEY_ENHANCED": "your_tonapi_key_here",
        "DEBUG": "true"
      }
    }
  }
}
```

### Step 2: Alternative - Local Path Configuration

For local development:

```json
{
  "mcpServers": {
    "ton-mcp": {
      "command": "node",
      "args": ["/path/to/ton-mcp/dist/index.js"],
      "cwd": "/path/to/ton-mcp",
      "env": {
        "TON_NETWORK": "testnet",
        "TON_API_KEY": "your_toncenter_api_key_here",
        "DEBUG": "true"
      }
    }
  }
}
```

### Step 3: Restart Claude Code

Restart Claude Code for configuration changes to take effect.

## Testing Integration

### Basic Test

Start Claude Code and ask:
> *"Search for information about TON smart contracts"*

**Expected Response:** Claude should use the TON MCP `search_ton_documentation` tool.

### Advanced Test Commands

Try these in Claude Code:

1. **Live Blockchain Data:**
   ```
   Check the balance of TON address: EQC8rUZqR_pWV1BylWUlPNBzyiTYVoBEmQkMIQDZXICfnuRr
   ```

2. **Code Generation:**
   ```
   Generate a counter smart contract in Tact
   ```

3. **Documentation Search:**
   ```
   How does TVM work in TON?
   ```

4. **Transaction History:**
   ```
   Show recent transactions for address: EQC8rUZqR_pWV1BylWUlPNBzyiTYVoBEmQkMIQDZXICfnuRr
   ```

## Troubleshooting

### Common Issues

**1. "MCP server not found"**
- Verify `ton-mcp` command is in your PATH
- Check Node.js installation
- Try using full path to executable

**2. "API key invalid"**
- Verify TON Center API key format
- Check network settings
- Test API key directly with TON Center

**3. "No MCP tools available"**
- Check Claude Code logs: `claude --debug`
- Verify server starts without errors
- Ensure proper JSON configuration

**4. "Connection failed"**
- Check internet connectivity
- Verify API endpoints are accessible
- Test with minimal configuration

### Debug Mode

Enable detailed logging:

```json
{
  "mcpServers": {
    "ton-mcp": {
      "command": "ton-mcp",
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

Run Claude Code with debug: `claude --debug`

## Usage Examples

### Building a dApp

```
You: "Help me build a TON token swap dApp"

Claude will use TON MCP to:
✅ Search TON documentation for AMM patterns
✅ Generate Jetton token contracts
✅ Create frontend with wallet integration
✅ Provide deployment guidance
```

### Smart Contract Development

```
You: "Create a staking contract in Tact"

Claude will use TON MCP to:
✅ Generate production-ready contract
✅ Analyze security considerations
✅ Provide testing guidance
```

### Telegram Mini App Development

```
You: "Build a Telegram Mini App for TON"

Claude will use TON MCP to:
✅ Generate TMA-specific code
✅ Configure Web App manifest
✅ Integrate TON Connect
```

## Configuration Options

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `TON_NETWORK` | Yes | `testnet` or `mainnet` | - |
| `TON_API_KEY` | Yes | TON Center API key | - |
| `TON_API_KEY_ENHANCED` | No | TON API enhanced key | - |
| `DEBUG` | No | Enable debug logging | `false` |

### Advanced Configuration

For production deployments:

```json
{
  "mcpServers": {
    "ton-mcp": {
      "command": "ton-mcp",
      "env": {
        "TON_NETWORK": "mainnet",
        "TON_API_KEY": "your_production_key",
        "DEBUG": "false"
      },
      "timeout": 30000
    }
  }
}
```

## Best Practices

- **Use testnet** for development and testing
- **Monitor API usage** to avoid rate limits
- **Keep API keys secure** - use environment variables
- **Test locally** before deploying to production
- **Use debug mode** during development

## Support

- [GitHub Issues](https://github.com/ton-community/ton-mcp/issues)
- [Claude Code Documentation](https://docs.anthropic.com/claude/docs/desktop-mcp)
- [TON Developer Community](https://t.me/tondev)

---

**Ready to build TON applications with Claude Code! 🚀**
