# 🤖 TON MCP AI Helper Guide

This guide helps AI assistants understand how to effectively use the TON MCP server for comprehensive TON blockchain development assistance.

## 🎯 Overview

The TON MCP server provides AI assistants with:
- **Complete TON Documentation Index** (146+ documents)
- **Live TON Blockchain Data** access
- **Code Generation** capabilities
- **Development Workflow** guidance
- **TMA (Telegram Mini Apps)** specialization

## 🔧 Available MCP Tools

### 1. Documentation & Knowledge Tools

#### `search_ton_documentation`
**Purpose**: Search through comprehensive TON documentation with intelligent ranking
**When to Use**: Any question about TON development, blockchain concepts, or technical details
**Parameters**:
- `query` (required): Search term (e.g., "Tact language", "TON Connect", "smart contracts")
- `category` (optional): Filter by category
- `limit` (optional): Max results (default: 5)

**Example Usage**:
```
User: "How does TVM work?"
AI: Use search_ton_documentation with query="TVM virtual machine"
Result: Comprehensive TVM documentation with examples
```

#### `list_ton_resources`
**Purpose**: Discover all available TON development resources
**When to Use**: When user needs to know what guidance is available
**Returns**: List of all how-to guides and resources

#### `get_specific_ton_resource`
**Purpose**: Get detailed content for specific TON development topics
**Parameters**:
- `filename` (required): Exact resource name (e.g., "how_to_add_ton_connect")
**When to Use**: When you need detailed step-by-step guidance

### 2. Live Blockchain Data Tools

#### `get_account_info_live`
**Purpose**: Get real-time account information from TON blockchain
**Parameters**:
- `address` (required): TON account address
**Returns**: Balance, state, transaction count, code/data presence

**Example**:
```
User: "Check balance of EQDk2VTvn4..."
AI: Use get_account_info_live with the address
Result: Real balance from TON blockchain
```

#### `get_transaction_history_live`
**Purpose**: Get real transaction history
**Parameters**:
- `address` (required): TON account address
- `limit` (optional): Number of transactions (default: 5)
**Returns**: Recent transactions with details

#### `get_jetton_info_live`
**Purpose**: Get Jetton token information
**Parameters**:
- `jetton_address` (required): Master contract address
**Returns**: Token metadata, supply, admin, decimals

#### `get_network_status_live`
**Purpose**: Get current TON network status
**Returns**: Block height, network info, gas prices

### 3. Code Generation Tools

#### `generate_contract_code`
**Purpose**: Generate smart contract code for TON
**Parameters**:
- `contract_type` (required): "counter", "wallet", "jetton", "nft", "amm", "staking", "dao"
- `language` (optional): "tact" or "func" (default: "tact")
**Returns**: Production-ready contract code

**Example**:
```
User: "Create a staking contract"
AI: Use generate_contract_code with contract_type="staking"
Result: Complete Tact staking contract
```

#### `generate_frontend_code`
**Purpose**: Generate React/Vue frontend code
**Parameters**:
- `framework` (optional): "react" or "vanilla" (default: "react")
- `features` (required): Array of features like ["wallet-connect", "contract-interaction"]
**Returns**: Complete frontend code with TON integration

## 🎯 Development Workflow Guidance

### Primary System Prompt: `ton_development_guidance_prompt`
**When to Use**: At the start of any TON development session
**Purpose**: Sets up mandatory MCP consultation workflow
**Effect**: Ensures AI always checks MCP resources first

### Debugging Helper: `ton_debugging_reminder_prompt`
**When to Use**: When stuck, encountering errors, or going too long without MCP usage
**Purpose**: Redirects to MCP-first debugging approach

### Error Recovery: `ton_error_recovery_prompt`
**When to Use**: Immediately when encountering TON-related errors
**Purpose**: Forces MCP consultation before generic solutions

## 🚀 Best Practices for AI Usage

### 1. **Always Start with MCP**
```
User: "Build a TON dApp"
AI: FIRST - Use ton_development_guidance_prompt
     THEN - Use list_ton_resources to see available guidance
     THEN - Use specific tools based on user needs
```

### 2. **Use Live Data When Relevant**
```
For questions about:
- Account balances → get_account_info_live
- Transaction details → get_transaction_history_live
- Token information → get_jetton_info_live
- Network status → get_network_status_live
```

### 3. **Search Documentation First**
```
For technical questions:
- "How does TON Connect work?" → search_ton_documentation
- "Tact vs FunC?" → search_ton_documentation
- "Smart contract security?" → search_ton_documentation
```

### 4. **Generate Code When Appropriate**
```
When user wants:
- Smart contracts → generate_contract_code
- Frontend components → generate_frontend_code
- Full applications → Combine both tools
```

### 5. **Regular MCP Check-Ins**
```
Every few development steps:
- Use ton_debugging_reminder_prompt
- Verify approach with MCP resources
- Check for updated guidance
```

## 🎨 TON-Specific Patterns

### Contract Development
```
1. User asks for contract → Use generate_contract_code
2. Analyze security → Use search_ton_documentation for "security best practices"
3. Add features → Generate additional code as needed
4. Test guidance → Use search_ton_documentation for "testing contracts"
```

### Frontend Development
```
1. User wants UI → Use generate_frontend_code
2. Wallet integration → Include "wallet-connect" feature
3. Contract interaction → Include "contract-interaction" feature
4. TMA specific → Add Telegram Web Apps integration
```

### Full-Stack dApps
```
1. Plan architecture → Use list_ton_resources for guidance
2. Generate contracts → Use generate_contract_code
3. Build frontend → Use generate_frontend_code
4. Integration guide → Use get_specific_ton_resource
```

## 🚨 Error Handling Patterns

### When Stuck
```
1. Use ton_error_recovery_prompt
2. Check list_ton_resources for relevant guides
3. Use get_specific_ton_resource for detailed help
4. Search documentation for similar issues
```

### API Errors
```
1. Check get_network_status_live for network issues
2. Verify address format with get_account_info_live
3. Use search_ton_documentation for API troubleshooting
```

### Code Generation Issues
```
1. Use search_ton_documentation for language-specific guidance
2. Check get_specific_ton_resource for implementation details
3. Verify requirements match available contract types
```

## 📊 Quality Assurance

### Always Verify
- [ ] Used MCP tools before giving advice
- [ ] Checked live data when relevant
- [ ] Searched documentation for technical questions
- [ ] Generated appropriate code for requests
- [ ] Provided complete, working solutions

### Performance Metrics
- **Documentation Coverage**: 146+ indexed documents
- **Search Relevance**: Semantic ranking with scores
- **API Reliability**: Live TON blockchain data
- **Code Quality**: Production-ready generated code
- **Integration Success**: Compatible with Cursor/Claude Code

## 🎯 Success Criteria

**Excellent Response**: Uses multiple MCP tools, provides comprehensive guidance, includes live data, generates working code

**Good Response**: Uses at least one MCP tool, provides accurate information, follows TON best practices

**Poor Response**: Gives generic blockchain advice without consulting MCP resources

## 🔄 Continuous Learning

**Remember**: TON ecosystem evolves rapidly. Always prefer MCP resources over cached knowledge. Use the reminder prompts regularly to maintain quality assistance.

**The TON MCP makes you a TON blockchain expert - use it extensively!** 🚀
