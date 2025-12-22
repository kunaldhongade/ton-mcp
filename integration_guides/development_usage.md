# TON MCP Development Guide

## Local Development Setup

This guide helps developers contribute to the TON MCP server and run it locally for testing.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)
- TON API keys for testing

## Installation

### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/kunaldhongade/ton-mcp.git
cd ton-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Environment Configuration

Create a `.env` file in the project root:

```bash
# Required for development
TON_NETWORK=testnet
TON_API_KEY=your_toncenter_api_key_here

# Optional enhanced features
TON_API_KEY_ENHANCED=your_tonapi_key_here

# Development settings
DEBUG=true
```

## Development Workflow

### Running in Development Mode

```bash
# Start with hot reload
npm run dev

# Or run with file watching
npm run watch
```

### Testing

```bash
# Run the comprehensive test suite
npm run test

# Or run tests directly
node test-mcp.js
```

### Building Documentation Index

```bash
# Rebuild the documentation index
npm run index-docs
```

## Project Structure

```
ton-mcp/
├── src/
│   ├── index.ts          # Main MCP server
│   ├── config.ts         # Configuration
│   ├── services/
│   │   ├── ton-api.ts    # TON blockchain API client
│   │   └── search-index.ts # Documentation search
│   ├── resources/        # Documentation files
│   └── utils/            # Helper utilities
├── dist/                 # Built output
├── integration_guides/   # Setup guides
├── test-mcp.js          # Test suite
└── AI_HELPER_GUIDE.md   # AI usage guide
```

## Key Components

### MCP Server (`src/index.ts`)

The main server implementing the Model Context Protocol with:

- **Tools:** Blockchain queries, code generation, documentation search
- **Resources:** TON documentation and guides
- **Prompts:** Development workflow guidance

### TON API Service (`src/services/ton-api.ts`)

Handles all TON blockchain interactions:

- Account information retrieval
- Transaction history
- Jetton token data
- Network status
- Unit conversions

### Search Service (`src/services/search-index.ts`)

Manages documentation indexing and search:

- Fuse.js-powered semantic search
- Document categorization
- Relevance ranking
- Multi-term queries

### Resources (`src/resources/`)

Comprehensive TON documentation:

- Smart contract guides
- Frontend development
- Telegram Mini Apps
- API integration
- Best practices

## Adding New Features

### New MCP Tools

1. **Define the tool** in `src/index.ts`:

```typescript
{
  name: "new_tool_name",
  description: "Tool description",
  inputSchema: {
    type: "object",
    properties: {
      param: { type: "string", description: "Parameter description" }
    },
    required: ["param"]
  }
}
```

2. **Implement the handler:**

```typescript
private async handleNewTool(args: any) {
  // Implementation
  return { content: [{ type: "text", text: "Result" }] };
}
```

3. **Register the handler** in `setupHandlers()`:

```typescript
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "new_tool_name":
      return await this.handleNewTool(args);
    // ... other cases
  }
});
```

### New Documentation

1. **Add content** to appropriate directory in `src/resources/`
2. **Rebuild index:** `npm run index-docs`
3. **Test search:** Verify content appears in results

### New API Integrations

1. **Extend TON API service** in `src/services/ton-api.ts`
2. **Add methods** for new endpoints
3. **Update error handling** and validation
4. **Test integration** thoroughly

## Testing Strategy

### Unit Tests

```typescript
// Example test structure
async function testNewFeature() {
  // Setup
  const server = new TonMcpServer();

  // Execute
  const result = await server.handleNewTool({ param: "test" });

  // Assert
  if (!result.content[0].text.includes("expected")) {
    throw new Error("Test failed");
  }

  return "New feature working";
}
```

### Integration Tests

- Test with real API calls (use testnet)
- Verify error handling
- Check performance and rate limits
- Validate data formats

### Manual Testing

- Test with Cursor/Claude Code
- Verify AI tool integration
- Check error scenarios
- Validate user experience

## Code Quality

### TypeScript Standards

- Strict type checking enabled
- Interface definitions for all data structures
- Proper error types and handling
- JSDoc comments for public APIs

### Error Handling

```typescript
try {
  // Operation
  const result = await apiCall();
  return { content: [{ type: "text", text: result }] };
} catch (error) {
  return {
    content: [{
      type: "text",
      text: `❌ Operation failed: ${error.message}`
    }],
    isError: true
  };
}
```

### Logging

```typescript
if (config.debug) {
  console.error("Debug info:", data);
}
```

## Deployment

### Building for Production

```bash
# Clean build
npm run build

# Test production build
npm start

# Verify functionality
npm run test
```

### Publishing to npm

```bash
# Update version in package.json
npm version patch|minor|major

# Publish (requires npm account and access)
npm publish
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Contributing

### Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Update** documentation
6. **Submit** pull request

### Code Review Checklist

- [ ] Tests pass
- [ ] TypeScript compilation succeeds
- [ ] Documentation updated
- [ ] Error handling implemented
- [ ] Security considerations addressed
- [ ] Performance optimized

### Issue Reporting

- Use GitHub issues for bugs and features
- Include reproduction steps
- Provide environment details
- Attach relevant logs

## Security Considerations

### API Key Handling

- Never log API keys
- Use environment variables
- Validate key formats
- Implement rate limiting

### Input Validation

- Sanitize all user inputs
- Validate TON addresses
- Check parameter types
- Implement bounds checking

### Error Information

- Don't expose internal errors
- Log details internally
- Provide user-friendly messages
- Rate limit error responses

## Performance Optimization

### Caching Strategies

- Cache documentation index
- Implement API response caching
- Use connection pooling
- Optimize search algorithms

### Rate Limiting

- Implement API call limits
- Queue requests when needed
- Provide clear error messages
- Monitor usage patterns

### Memory Management

- Clean up resources properly
- Monitor memory usage
- Implement graceful shutdown
- Handle large datasets efficiently

## Monitoring & Logging

### Application Logs

```typescript
console.error("TON MCP server running on stable MCP SDK...");
console.error(`Loaded ${docs.length} documents`);
console.error(`Initialized ${tools.length} tools`);
```

### Error Tracking

- Log all errors with context
- Include stack traces in debug mode
- Monitor API failures
- Track performance metrics

### Health Checks

```typescript
// Basic health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: config.version
  });
});
```

## Support & Community

- **GitHub Issues:** Bug reports and feature requests
- **TON Developer Community:** Technical discussions
- **Discord:** Real-time help and updates

---

**Happy contributing to TON MCP! 🚀**
