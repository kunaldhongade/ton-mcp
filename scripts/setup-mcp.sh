#!/bin/bash

# TON MCP Setup Script
# This script helps users quickly set up and test the TON MCP server

echo "🚀 TON MCP Setup - AI-Powered TON Development Assistant"
echo "========================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. You have $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Build the project
echo ""
echo "🔨 Building TON MCP server..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Test server startup
echo ""
echo "🧪 Testing server startup..."
timeout 5s npm start > /dev/null 2>&1

if [ $? -eq 124 ]; then
    echo "✅ Server starts successfully"
else
    echo "❌ Server failed to start"
    exit 1
fi

echo ""
echo "🎉 TON MCP Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Integrate with your AI tool:"
echo ""
echo "   For Cursor:"
echo "   - Open Cursor Settings → MCP tab"
echo "   - Add server: node $(pwd)/dist/index.js"
echo ""
echo "   For Claude Code:"
echo "   - Add to ~/.claude/config.json:"
echo '   {'
echo '     "mcpServers": {'
echo '       "ton-mcp": {'
echo '         "command": "node",'
echo '         "args": ["'$(pwd)'/dist/index.js"]'
echo '       }'
echo '     }'
echo '   }'
echo ""
echo "2. Test with: 'Create a TON wallet contract'"
echo ""
echo "3. Start building amazing TON applications! 🚀"
echo ""
echo "📖 Documentation: https://github.com/your-repo/ton-mcp/blob/main/README.md"
echo "💬 Support: Join TON Dev Chat on Telegram"
