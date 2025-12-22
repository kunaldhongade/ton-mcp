# TON MCP User Guide

## Welcome to TON MCP! 🎉

This guide helps you get the most out of the TON Model Context Protocol server for building TON blockchain applications with AI assistance.

## What is TON MCP?

TON MCP is an AI-powered development assistant that provides:

- **Complete TON Documentation** - 146+ indexed documents
- **Live Blockchain Data** - Real-time TON network queries
- **Code Generation** - Production-ready smart contracts and frontends
- **TMA Support** - Telegram Mini Apps specialization
- **Development Workflows** - End-to-end dApp building guidance

## Quick Start

### 1. Installation & Setup

```bash
# Install TON MCP
npm install -g @ton-community/ton-mcp

# Get API keys
# TON Center: https://toncenter.com/api/v2/
# TON API: https://tonapi.io/

# Configure environment
echo "TON_NETWORK=testnet" >> ~/.env
echo "TON_API_KEY=your_api_key" >> ~/.env
```

### 2. Configure Your AI Tool

Follow the integration guide for your AI tool:
- [Cursor Integration](./cursor.md)
- [Claude Code Integration](./claude_code.md)

### 3. Start Building!

Ask your AI assistant: *"Help me build a TON dApp"*

## Core Features

### 🔍 Documentation Search

**What it does:** Searches through comprehensive TON documentation with intelligent ranking.

**Best for:**
- Understanding TON concepts
- Finding technical documentation
- Learning best practices

**Example queries:**
- *"How does TVM work?"*
- *"TON Connect integration guide"*
- *"Smart contract security best practices"*

### 🔗 Live Blockchain Data

**What it does:** Provides real-time data from the TON blockchain.

**Best for:**
- Checking account balances
- Viewing transaction history
- Getting network status
- Analyzing token information

**Available data:**
- Account balances and states
- Transaction histories
- Jetton token metadata
- Network statistics and gas prices

### ⚡ Code Generation

**What it does:** Generates production-ready code for TON development.

**Smart Contracts:**
- Counter contracts
- Wallet contracts
- Jetton tokens
- NFT collections
- AMM protocols
- Staking contracts
- DAO governance

**Frontend Code:**
- React components with TON Connect
- Vanilla JavaScript integrations
- Wallet connection UIs
- Contract interaction helpers

### 🎯 Telegram Mini Apps (TMA)

**What it does:** Specialized support for building Telegram Mini Apps on TON.

**Includes:**
- TMA-specific code generation
- Telegram Web App manifests
- Bot integration guides
- User authentication flows

## Development Workflows

### 🏗️ Building a dApp

**Typical workflow:**

1. **Plan your dApp**
   - Ask: *"Help me design a [type] dApp on TON"*

2. **Generate smart contracts**
   - AI will create appropriate contracts using `generate_contract_code`

3. **Build the frontend**
   - AI generates UI components with `generate_frontend_code`

4. **Add wallet integration**
   - TON Connect integration included automatically

5. **Test and deploy**
   - AI provides testing and deployment guidance

### 📝 Smart Contract Development

**Best practices:**

1. **Start with requirements**
   - *"I need a contract for [functionality]"*

2. **Generate base contract**
   - AI creates initial contract code

3. **Review and customize**
   - Modify generated code for your needs

4. **Security analysis**
   - AI checks for common vulnerabilities

5. **Testing guidance**
   - Comprehensive testing recommendations

### 🎨 Frontend Development

**Workflow:**

1. **Specify requirements**
   - *"Create a React dApp with wallet connection"*

2. **Generate components**
   - AI creates responsive, functional components

3. **Integrate contracts**
   - Automatic contract interaction setup

4. **Style and polish**
   - Production-ready styling included

### 📱 Telegram Mini Apps

**Specialized workflow:**

1. **TMA-specific planning**
   - *"Build a Telegram Mini App for token trading"*

2. **Generate TMA structure**
   - AI creates proper Web App structure

3. **Telegram integration**
   - Bot setup and user authentication

4. **TON integration**
   - Wallet connection and transactions

## Best Practices

### 🤖 Working with AI Assistants

**Always start with MCP:**
- AI assistants should use MCP tools first
- Reference the AI Helper Guide for optimal usage
- Let AI guide the development process

**Be specific:**
- *"Generate a staking contract in Tact"* (not just "contract")
- *"Create React frontend with balance display"* (be detailed)

**Iterate progressively:**
- Start simple, then add complexity
- Test each component before proceeding
- Use live data to verify functionality

### 🔧 Technical Best Practices

**Network Selection:**
- Use `testnet` for development
- Switch to `mainnet` for production
- Test thoroughly on testnet first

**API Key Management:**
- Keep keys secure (never in code)
- Monitor usage to avoid limits
- Use enhanced API for advanced features

**Code Quality:**
- Review generated code before deployment
- Test contracts thoroughly
- Follow TON security guidelines

### 🚀 Deployment Readiness

**Pre-deployment checklist:**
- [ ] Test on testnet
- [ ] Verify contract security
- [ ] Test frontend functionality
- [ ] Check wallet integrations
- [ ] Validate API key permissions
- [ ] Review gas costs
- [ ] Plan upgrade mechanisms

## Common Patterns

### Token Creation
```
1. Generate Jetton contract
2. Create minting interface
3. Add transfer functionality
4. Implement metadata
5. Deploy and verify
```

### DeFi Protocols
```
1. Design economic model
2. Generate AMM contracts
3. Create liquidity interfaces
4. Add reward mechanisms
5. Implement governance
```

### NFT Marketplaces
```
1. Generate NFT collection contract
2. Create marketplace logic
3. Build trading interfaces
4. Add royalty systems
5. Implement auctions
```

### Gaming Applications
```
1. Design game mechanics
2. Generate game contracts
3. Create game interfaces
4. Add reward systems
5. Implement leaderboards
```

## Troubleshooting

### MCP Not Working

**Check:**
- API keys are valid and configured
- Network connectivity
- AI tool properly configured
- Server logs for errors

**Solutions:**
- Restart AI tool
- Verify environment variables
- Check API key permissions
- Test with simple queries first

### Code Issues

**Generated code problems:**
- Review requirements were clear
- Check for syntax errors
- Verify contract logic
- Test on testnet

**Integration issues:**
- Check wallet connection
- Verify contract addresses
- Test API endpoints
- Review error messages

### Performance Issues

**Slow responses:**
- Check API rate limits
- Optimize queries
- Use caching where appropriate
- Consider API key upgrades

## Advanced Usage

### Custom Workflows
Create specialized development patterns for your needs.

### Batch Operations
Use multiple tools together for complex tasks.

### Integration Testing
Combine generated code with existing systems.

### Multi-Contract dApps
Build complex applications with multiple smart contracts.

## Support & Community

- **GitHub Issues:** [Report bugs and request features](https://github.com/ton-community/ton-mcp/issues)
- **TON Developer Community:** [Get help from the community](https://t.me/tondev)
- **TON Documentation:** [Official docs](https://docs.ton.org/)
- **Telegram Community:** [TON Builders chat](https://t.me/tonbuilders)

## Contributing

We welcome contributions! See our [contributing guide](../CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Happy building on TON! 🚀**
