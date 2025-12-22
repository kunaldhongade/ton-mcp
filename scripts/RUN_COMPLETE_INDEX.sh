#!/bin/bash

# Complete TON Documentation Indexing Script
# This will index ALL of docs.ton.org (300-500 pages)

set -e

echo "=========================================="
echo "TON MCP Complete Documentation Indexing"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the ton-mcp directory"
    exit 1
fi

# Backup old index if it exists
if [ -f "docs-index.json" ]; then
    echo "📦 Backing up old index to docs-index.json.backup"
    cp docs-index.json docs-index.json.backup
fi

# Run the indexer
echo "🚀 Starting comprehensive documentation indexing..."
echo "⏱️  This will take 5-10 minutes..."
echo ""

npm run index-docs

# Check if indexing was successful
if [ ! -f "docs-index.json" ]; then
    echo "❌ Error: docs-index.json was not created"
    exit 1
fi

# Count pages
PAGE_COUNT=$(grep -c '"id":' docs-index.json || echo "0")
FILE_SIZE=$(ls -lh docs-index.json | awk '{print $5}')

echo ""
echo "=========================================="
echo "✨ Indexing Complete!"
echo "=========================================="
echo "📊 Pages indexed: $PAGE_COUNT"
echo "📦 File size: $FILE_SIZE"
echo ""

# Verify page count
if [ "$PAGE_COUNT" -lt 50 ]; then
    echo "⚠️  WARNING: Only $PAGE_COUNT pages indexed!"
    echo "Expected: 300-500 pages"
    echo ""
    echo "This might indicate:"
    echo "  - Network issues"
    echo "  - docs.ton.org is down"
    echo "  - The indexer stopped early"
    echo ""
    echo "Try running again: npm run index-docs"
    exit 1
elif [ "$PAGE_COUNT" -lt 200 ]; then
    echo "⚠️  Only $PAGE_COUNT pages indexed (expected 300-500)"
    echo "Consider running again for more complete coverage"
else
    echo "✅ SUCCESS! Comprehensive index created"
    echo ""
    echo "Next steps:"
    echo "  1. Build: npm run build"
    echo "  2. Test: npm start"
    echo "  3. Verify logs show: 'Loaded $PAGE_COUNT pages'"
fi

echo ""
echo "=========================================="

