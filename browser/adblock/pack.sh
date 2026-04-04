#!/bin/bash

# AdBlock Packer
# Automatically creates a zip package ready for Firefox installation

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛡️  DIY AdBlock Packer${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if rules exist
if [ ! -f "rules/blocklist.json" ]; then
    echo -e "${YELLOW}⚠️  Blocklist not found! Running converter...${NC}"
    python3 convert-blocklist.py
    echo ""
fi

# Read version from manifest.json
VERSION=$(grep -oP '"version":\s*"\K[^"]+' manifest.json)

# Output filename
OUTPUT_ZIP="adblock-v${VERSION}.zip"

echo -e "${YELLOW}Version:${NC} $VERSION"
echo -e "${YELLOW}Output:${NC} $OUTPUT_ZIP"
echo ""

# Remove old zip if exists
if [ -f "$OUTPUT_ZIP" ]; then
    echo "🗑️  Removing old zip..."
    rm "$OUTPUT_ZIP"
fi

# Create new zip
echo "📦 Creating zip package..."

zip -r -9 "$OUTPUT_ZIP" \
    manifest.json \
    rules/ \
    popup/ \
    icons/ \
    README.md \
    -x "*.pyc" \
    -x "*__pycache__*" \
    -x "*.swp" \
    -x "*~" \
    > /dev/null

# Verify the zip
echo "✅ Verifying zip integrity..."
if unzip -t "$OUTPUT_ZIP" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Zip created successfully!${NC}"
else
    echo -e "${RED}✗ Zip verification failed!${NC}"
    exit 1
fi

# Show file size and contents
FILE_SIZE=$(du -h "$OUTPUT_ZIP" | cut -f1)
FILE_COUNT=$(unzip -l "$OUTPUT_ZIP" | tail -1 | awk '{print $2}')

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Package Ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📄 File: ${BLUE}$OUTPUT_ZIP${NC}"
echo -e "📊 Size: ${BLUE}$FILE_SIZE${NC}"
echo -e "📁 Files: ${BLUE}$FILE_COUNT${NC}"
echo ""
echo -e "${YELLOW}To install in Firefox:${NC}"
echo "  1. Press Ctrl+Shift+A"
echo "  2. Click gear icon (⚙️)"
echo "  3. Select 'Install Add-on From File...'"
echo "  4. Choose $OUTPUT_ZIP"
echo ""
echo -e "${GREEN}🛡️  Blocking 30,000 domains!${NC}"
echo ""
