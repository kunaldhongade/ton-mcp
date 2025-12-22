#!/bin/bash

# TON MCP Release Script
# Automates the release process for GitHub and npm

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 TON MCP Release Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}📦 Current version: ${CURRENT_VERSION}${NC}"
echo ""

# Ask for version bump type
echo "Select version bump type:"
echo "  1) Patch (bug fixes)     - ${CURRENT_VERSION} → x.x.X"
echo "  2) Minor (new features)  - ${CURRENT_VERSION} → x.X.0"
echo "  3) Major (breaking)      - ${CURRENT_VERSION} → X.0.0"
echo ""
read -p "Enter choice (1-3): " VERSION_CHOICE

case $VERSION_CHOICE in
    1)
        VERSION_TYPE="patch"
        ;;
    2)
        VERSION_TYPE="minor"
        ;;
    3)
        VERSION_TYPE="major"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}📝 Starting release process...${NC}"
echo ""

# Step 1: Build
echo -e "${BLUE}📦 Step 1: Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"

# Step 2: Check git status and commit
echo ""
echo -e "${BLUE}📁 Step 2: Checking git status...${NC}"
if [[ -n $(git status -s) ]]; then
    echo ""
    echo -e "${YELLOW}📝 Uncommitted changes detected:${NC}"
    git status -s
    echo ""
    
    read -p "Add and commit all changes? (y/n): " COMMIT_CHANGES
    
    if [ "$COMMIT_CHANGES" = "y" ]; then
        # Add all files
        echo ""
        echo -e "${BLUE}📁 Adding all files to git...${NC}"
        git add .
        echo -e "${GREEN}✅ Files staged${NC}"
        
        # Get commit message
        echo ""
        echo -e "${BLUE}💾 Creating commit...${NC}"
        echo ""
        echo "Suggested commit message:"
        echo -e "${YELLOW}  feat: Prepare release with major features${NC}"
        echo ""
        read -p "Enter commit message (or press Enter for default): " COMMIT_MSG
        
        if [ -z "$COMMIT_MSG" ]; then
            COMMIT_MSG="feat: Prepare release with major features

- Official tools integration (Blueprint, @telegram-apps)
- Tolk language support with 7 contract templates  
- Complete deployment system
- Project scaffolding guides
- Comprehensive testing suite
- ES module compatibility
- 360+ documentation pages indexed
- 20+ MCP tools ready"
        fi
        
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}✅ Changes committed${NC}"
    else
        echo -e "${RED}❌ Cannot proceed with uncommitted changes${NC}"
        echo "npm version requires a clean working directory"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Working directory clean${NC}"
fi

# Step 3: Push current commits to GitHub
echo ""
echo -e "${BLUE}🚀 Step 3: Pushing commits to GitHub...${NC}"
read -p "Push to GitHub now? (y/n): " PUSH_NOW

if [ "$PUSH_NOW" = "y" ]; then
    git push origin main
    echo -e "${GREEN}✅ Pushed to GitHub${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped push${NC}"
fi

# Step 4: Version bump (now with clean git)
echo ""
echo -e "${BLUE}📝 Step 4: Updating version...${NC}"
echo ""
echo -e "${YELLOW}Current version in package.json: ${CURRENT_VERSION}${NC}"
echo -e "${YELLOW}Bumping version type: ${VERSION_TYPE}${NC}"
echo ""

NEW_VERSION=$(npm version $VERSION_TYPE)

echo ""
echo -e "${GREEN}✅ Version updated in package.json!${NC}"
echo -e "${GREEN}   ${CURRENT_VERSION} → ${NEW_VERSION}${NC}"
echo ""
echo -e "${GREEN}✅ Git commit created: '${NEW_VERSION}'${NC}"
echo -e "${GREEN}✅ Git tag created: ${NEW_VERSION}${NC}"

# Step 5: Push version tag to GitHub
echo ""
echo -e "${BLUE}🏷️  Step 5: Pushing version tag to GitHub...${NC}"
read -p "Push ${NEW_VERSION} tag to GitHub? (y/n): " PUSH_TAG

if [ "$PUSH_TAG" = "y" ]; then
    git push origin main
    git push --tags
    echo -e "${GREEN}✅ Pushed ${NEW_VERSION} to GitHub with tags${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped tag push${NC}"
    echo -e "${YELLOW}⚠️  Remember to push manually: git push --tags${NC}"
    PUSH_TAG="n"
fi

# Step 6: Publish to npm
echo ""
echo -e "${BLUE}📦 Step 6: Publishing to npm...${NC}"
read -p "Publish to npm? (y/n): " PUBLISH_NPM

if [ "$PUBLISH_NPM" = "y" ]; then
    # Check if logged in
    npm whoami > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Not logged in to npm${NC}"
        npm login
    fi
    
    # Publish
    echo ""
    echo -e "${BLUE}Publishing...${NC}"
    npm publish
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Published to npm${NC}"
    else
        echo -e "${RED}❌ npm publish failed${NC}"
        echo ""
        echo "If package name is taken, try:"
        echo "  npm publish --access public"
        echo "Or update package.json name to @kunaldhongade/ton-mcp"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Skipped npm publish${NC}"
fi

# Verify version in package.json
FINAL_VERSION=$(node -p "require('./package.json').version")

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🎉 Release Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✅ Version: ${NEW_VERSION}${NC}"
echo -e "${GREEN}✅ package.json version: ${FINAL_VERSION}${NC}"
echo -e "${GREEN}✅ Built: dist/${NC}"
if [ "$PUSH_NOW" = "y" ] || [ "$PUSH_TAG" = "y" ]; then
    echo -e "${GREEN}✅ Pushed to GitHub${NC}"
fi
if [ "$PUBLISH_NPM" = "y" ]; then
    echo -e "${GREEN}✅ Published to npm${NC}"
fi
echo ""

# Next steps
echo -e "${YELLOW}📋 Next steps:${NC}"
echo ""
if [ "$PUSH_TAG" = "y" ]; then
    echo "1. Create GitHub release:"
    echo "   https://github.com/kunaldhongade/ton-mcp/releases/new"
    echo ""
fi
if [ "$PUBLISH_NPM" = "y" ]; then
    echo "2. Verify npm package:"
    echo "   npm view ton-mcp"
    echo ""
    echo "3. Test installation:"
    echo "   npm install -g ton-mcp"
    echo "   ton-mcp --help"
    echo ""
fi
echo "4. Announce release:"
echo "   - TON Dev Chat: https://t.me/tondev_eng"
echo "   - Twitter/X"
echo "   - Reddit r/toncoin"
echo ""

echo -e "${GREEN}🚀 Your TON MCP ${NEW_VERSION} is released!${NC}"
echo ""
