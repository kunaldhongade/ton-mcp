# TON MCP Deployment Guide

This guide explains how to deploy the TON MCP server so anyone can use it with their AI tools like Cursor and Claude Code.

## 🎯 Deployment Options

### Option 1: npm Package (Recommended)

Publish to npm so anyone can install globally and use immediately.

#### Prerequisites
- npm account with publish permissions
- Repository ownership or maintainer access

#### Publishing Steps

1. **Prepare the package:**
```bash
# Ensure you're logged in to npm
npm login

# Update version (patch/minor/major)
npm version patch

# Build and test
npm run build
npm run test

# Publish to npm
npm publish
```

2. **Users can now install:**
```bash
npm install -g ton-mcp
ton-mcp --help
```

#### Integration with AI Tools

Users follow the integration guides:
- [Cursor Setup](./integration_guides/cursor.md)
- [Claude Code Setup](./integration_guides/claude_code.md)

### Option 2: GitHub Releases

Host pre-built binaries for easy installation.

#### Creating Releases

1. **Build for multiple platforms:**
```bash
# Build for current platform
npm run build

# Create release archive
tar -czf ton-mcp-v1.0.0.tar.gz dist/ package.json README.md

# Upload to GitHub releases
```

2. **Users install via:**
```bash
# Download and extract
wget https://github.com/ton-community/ton-mcp/releases/download/v1.0.0/ton-mcp-v1.0.0.tar.gz
tar -xzf ton-mcp-v1.0.0.tar.gz
cd ton-mcp-v1.0.0

# Install dependencies
npm install --production

# Configure and run
cp .env.example .env
# Edit .env with API keys
node dist/index.js
```

### Option 3: Docker Deployment

Containerized deployment for cloud hosting.

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/
COPY AI_HELPER_GUIDE.md ./
COPY integration_guides/ ./integration_guides/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S tonmcp -u 1001

USER tonmcp

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

#### Building and Running
```bash
# Build image
docker build -t ton-mcp .

# Run container
docker run -p 3000:3000 \
  -e TON_NETWORK=testnet \
  -e TON_API_KEY=your_key \
  ton-mcp
```

#### Docker Compose for Production
```yaml
version: '3.8'
services:
  ton-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - TON_NETWORK=mainnet
      - TON_API_KEY=${TON_API_KEY}
      - DEBUG=false
    restart: unless-stopped
```

## 🔧 Configuration Management

### Environment Variables

**Required:**
```bash
TON_NETWORK=testnet|mainnet
TON_API_KEY=your_toncenter_api_key
```

**Optional:**
```bash
TON_API_KEY_ENHANCED=your_tonapi_key
DEBUG=true|false
```

### API Key Management

**For npm package users:**
- Users provide their own API keys
- No server-side key management needed
- Decentralized and secure

**For hosted service:**
- Consider API key rotation
- Implement rate limiting
- Monitor usage patterns

## 📊 Scaling Considerations

### Performance Optimization

**For high usage:**
- Implement caching for documentation searches
- Use connection pooling for API calls
- Consider CDN for static resources
- Monitor memory usage

### Rate Limiting

**API Protection:**
```typescript
// Implement rate limiting
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### Monitoring

**Essential metrics:**
- API response times
- Error rates
- User adoption
- Documentation search patterns

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests pass (`npm run test`)
- [ ] Documentation is complete
- [ ] Integration guides are accurate
- [ ] API keys are configured
- [ ] Performance is optimized

### Deployment Steps
- [ ] Build production artifacts
- [ ] Configure environment
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Verify functionality
- [ ] Update documentation

### Post-Deployment
- [ ] Monitor error logs
- [ ] Track usage metrics
- [ ] Gather user feedback
- [ ] Plan feature updates

## 🔒 Security Considerations

### API Key Security
- Never log API keys
- Use environment variables
- Rotate keys regularly
- Monitor for abuse

### Input Validation
- Sanitize all user inputs
- Validate TON addresses
- Check parameter bounds
- Implement proper error handling

### Network Security
- Use HTTPS in production
- Implement CORS properly
- Rate limit all endpoints
- Monitor for suspicious activity

## 📈 Marketing & Distribution

### Making it Discoverable

**npm Package:**
- Comprehensive README
- Clear keywords
- Usage examples
- Integration guides

**GitHub Repository:**
- Professional presentation
- Clear documentation
- Issue templates
- Contributing guidelines

**Community Engagement:**
- TON developer forums
- Telegram communities
- Developer conferences
- Social media presence

### User Acquisition

**Target Audience:**
- TON developers
- AI tool users
- Blockchain enthusiasts
- dApp builders

**Distribution Channels:**
- TON official channels
- Developer communities
- AI tool marketplaces
- npm package discovery

## 🆘 Support & Maintenance

### User Support
- GitHub issues for bugs
- Discussions for questions
- Documentation updates
- Community forums

### Maintenance Tasks
- Regular dependency updates
- Security patches
- Performance monitoring
- Feature development

### Version Management
- Semantic versioning
- Changelog maintenance
- Migration guides
- Deprecation notices

## 📋 Success Metrics

### Adoption Metrics
- Download counts (npm)
- GitHub stars
- Integration rate
- User retention

### Usage Metrics
- API call volume
- Feature utilization
- Error rates
- Performance benchmarks

### Quality Metrics
- Test coverage
- Documentation completeness
- User satisfaction
- Community engagement

---

**Ready to deploy TON MCP globally! 🚀**
