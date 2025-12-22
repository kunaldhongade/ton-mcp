#!/bin/bash

# Test Script for Local TON MCP Version
# Run this after npm link to verify the fix

echo "🧪 Testing Local TON MCP Version"
echo "================================"
echo ""

# 1. Check if built
echo "1️⃣  Checking build..."
if [ ! -d "dist" ]; then
    echo "❌ dist/ folder not found. Run: npm run build"
    exit 1
fi
echo "✅ Build folder exists"
echo ""

# 2. Check if linked
echo "2️⃣  Checking npm link..."
LINK_PATH=$(npm list -g ton-mcp --depth=0 2>/dev/null | grep ton-mcp)
if [ -z "$LINK_PATH" ]; then
    echo "⚠️  ton-mcp not linked globally"
    echo "   Run: npm link"
else
    echo "✅ ton-mcp is linked globally"
    echo "   $LINK_PATH"
fi
echo ""

# 3. Check if __dirname fix is in compiled file
echo "3️⃣  Checking __dirname fix in compiled code..."
if grep -q "fileURLToPath" dist/services/search-index.js; then
    echo "✅ ES module __dirname fix found"
else
    echo "❌ ES module fix NOT found in compiled code"
    echo "   Run: npm run build"
    exit 1
fi
echo ""

# 4. Check if docs-index.json exists
echo "4️⃣  Checking docs-index.json..."
if [ -f "docs-index.json" ]; then
    DOC_COUNT=$(grep -o '"id":' docs-index.json | wc -l)
    echo "✅ docs-index.json found with ~$DOC_COUNT documents"
else
    echo "⚠️  docs-index.json not found (will be created on first run)"
fi
echo ""

# 5. Test the server startup
echo "5️⃣  Testing server startup..."
echo "   Starting ton-mcp for 3 seconds..."
timeout 3 node dist/index.js 2>&1 | head -20 &
TIMEOUT_PID=$!
sleep 3
kill $TIMEOUT_PID 2>/dev/null
echo ""

# 6. Summary
echo "📊 Test Summary"
echo "==============="
echo ""
echo "✅ Build: OK"
echo "✅ ES Module Fix: Applied"
echo "✅ Ready for local testing"
echo ""
echo "🧪 Next Steps:"
echo ""
echo "1. Test in Cursor:"
echo "   cd examples/tma-contract-cursor"
echo "   # Open in Cursor and check MCP logs"
echo ""
echo "2. Test from CLI:"
echo "   ton-mcp --help"
echo "   # Should show: ✅ Search index initialized"
echo ""
echo "3. If everything works:"
echo "   npm version patch"
echo "   git push --tags"
echo "   npm publish"
echo ""
echo "🚀 To unlink later: npm unlink -g ton-mcp"

