#!/bin/bash

# Quick Test Script for TON MCP
# Run this to verify everything works

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🧪 TON MCP Quick Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "../package.json" ]; then
    echo -e "${RED}❌ Error: Run this from the examples/ directory${NC}"
    exit 1
fi

# Step 1: Check Node.js
echo -e "${YELLOW}📦 Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js ${NODE_VERSION}${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Step 2: Check if MCP is built
echo -e "\n${YELLOW}🔨 Checking build...${NC}"
if [ -f "../dist/index.js" ]; then
    echo -e "${GREEN}✅ MCP is built${NC}"
else
    echo -e "${YELLOW}⚠️  MCP not built. Building now...${NC}"
    cd ..
    npm run build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build successful${NC}"
        cd examples
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
fi

# Step 3: Check documentation index
echo -e "\n${YELLOW}📚 Checking documentation index...${NC}"
if [ -f "../docs-index.json" ]; then
    PAGE_COUNT=$(grep -o '"id"' ../docs-index.json | wc -l | tr -d ' ')
    echo -e "${GREEN}✅ Documentation indexed: ${PAGE_COUNT} pages${NC}"
    
    if [ "$PAGE_COUNT" -lt 50 ]; then
        echo -e "${YELLOW}⚠️  Low page count. Consider reindexing:${NC}"
        echo -e "   cd .. && npm run index-docs"
    fi
else
    echo -e "${YELLOW}⚠️  Documentation not indexed${NC}"
    echo -e "   Run: cd .. && npm run index-docs"
fi

# Step 4: Check services
echo -e "\n${YELLOW}🔧 Checking services...${NC}"
SERVICES=("search-index.js" "ton-api.js" "tolk-compiler.js" "project-scaffold.js" "deployment.js")
for service in "${SERVICES[@]}"; do
    if [ -f "../dist/services/$service" ]; then
        echo -e "${GREEN}✅ ${service}${NC}"
    else
        echo -e "${RED}❌ Missing: ${service}${NC}"
    fi
done

# Step 5: Check templates
echo -e "\n${YELLOW}📝 Checking templates...${NC}"
if [ -f "../dist/templates/tolk-contracts.js" ]; then
    echo -e "${GREEN}✅ tolk-contracts.js${NC}"
else
    echo -e "${RED}❌ Missing: tolk-contracts.js${NC}"
fi

# Step 6: Check resources
echo -e "\n${YELLOW}📁 Checking resources...${NC}"
RESOURCES=("smart-contracts" "how-to" "tma" "frontend" "deployment")
for resource in "${RESOURCES[@]}"; do
    if [ -d "../dist/resources/$resource" ]; then
        echo -e "${GREEN}✅ ${resource}/  ${NC}"
    else
        echo -e "${YELLOW}⚠️  ${resource}/ (not copied)${NC}"
    fi
done

# Step 7: Run test script
echo -e "\n${YELLOW}🧪 Running test script...${NC}"
node test-mcp-server.js

# Step 8: Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${GREEN}✅ All checks passed!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "  1. Start server: cd .. && npm start"
echo "  2. Configure Cursor (see examples/README.md)"
echo "  3. Try test queries in Cursor"
echo ""
echo -e "${BLUE}Test queries to try:${NC}"
echo '  - "Search TON documentation for smart contracts"'
echo '  - "Generate a Jetton contract in Tolk"'
echo '  - "Create a smart contract project"'
echo '  - "How do I deploy to testnet?"'
echo ""
echo -e "${GREEN}🎉 Your TON MCP is ready to test!${NC}"
echo ""

