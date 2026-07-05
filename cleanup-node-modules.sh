#!/bin/bash

# ================================================================
# Git Cleanup Script - Remove node_modules from Git Tracking
# ================================================================
# This script removes all node_modules directories from git
# while keeping them in your local filesystem for development
# ================================================================

set -e  # Exit on error

echo "=================================================="
echo "🧹 Git Cleanup: Remove node_modules from Tracking"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    echo "Please run this script from the Nano-Bond directory"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Finding tracked node_modules directories...${NC}"
echo ""

# Find all tracked node_modules
TRACKED_DIRS=$(git ls-files | grep "node_modules/" | cut -d'/' -f1-2 | sort -u | grep "node_modules" || true)

if [ -z "$TRACKED_DIRS" ]; then
    echo -e "${GREEN}✅ No node_modules directories are tracked in git!${NC}"
    echo "Your repository is already clean."
    exit 0
fi

echo "Found the following tracked node_modules directories:"
echo "$TRACKED_DIRS"
echo ""

# Count files to be removed
FILE_COUNT=$(git ls-files | grep -c "node_modules/" || echo "0")
echo -e "${YELLOW}📊 Total files in node_modules: $FILE_COUNT${NC}"
echo ""

# Confirm with user
echo -e "${YELLOW}⚠️  This will remove node_modules from git tracking${NC}"
echo -e "${GREEN}✅ Your local files will NOT be deleted${NC}"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled by user."
    exit 0
fi

echo ""
echo -e "${YELLOW}📋 Step 2: Removing node_modules from git tracking...${NC}"
echo ""

# Remove specific node_modules directories
declare -a DIRS_TO_REMOVE=(
    "Android/admin-web/node_modules"
    "Android/backend/node_modules"
    "node_modules"
)

REMOVED_COUNT=0
for DIR in "${DIRS_TO_REMOVE[@]}"; do
    if git ls-files "$DIR" > /dev/null 2>&1; then
        echo "Removing: $DIR"
        git rm -r --cached "$DIR" 2>/dev/null && {
            echo -e "${GREEN}✅ Removed: $DIR${NC}"
            ((REMOVED_COUNT++))
        } || {
            echo -e "${YELLOW}⚠️  Already removed or not found: $DIR${NC}"
        }
    else
        echo -e "${YELLOW}⚠️  Not tracked: $DIR${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ Removed $REMOVED_COUNT directories from git tracking${NC}"
echo ""

echo -e "${YELLOW}📋 Step 3: Verifying .gitignore files...${NC}"
echo ""

# Check if .gitignore files exist and contain node_modules
declare -a GITIGNORE_FILES=(
    ".gitignore"
    "Android/admin-web/.gitignore"
    "Android/backend/.gitignore"
)

for GITIGNORE in "${GITIGNORE_FILES[@]}"; do
    if [ -f "$GITIGNORE" ]; then
        if grep -q "node_modules" "$GITIGNORE"; then
            echo -e "${GREEN}✅ $GITIGNORE contains node_modules pattern${NC}"
        else
            echo -e "${YELLOW}⚠️  $GITIGNORE missing node_modules pattern${NC}"
        fi
    else
        echo -e "${RED}❌ $GITIGNORE does not exist${NC}"
    fi
done

echo ""
echo -e "${YELLOW}📋 Step 4: Staging .gitignore files...${NC}"
echo ""

# Stage all .gitignore files
git add .gitignore 2>/dev/null && echo -e "${GREEN}✅ Staged: .gitignore${NC}" || true
git add Android/admin-web/.gitignore 2>/dev/null && echo -e "${GREEN}✅ Staged: Android/admin-web/.gitignore${NC}" || true
git add Android/backend/.gitignore 2>/dev/null && echo -e "${GREEN}✅ Staged: Android/backend/.gitignore${NC}" || true

echo ""
echo -e "${YELLOW}📋 Step 5: Checking git status...${NC}"
echo ""

# Show what will be committed
git status --short

echo ""
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}✅ Cleanup Complete!${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""

echo "Next steps:"
echo ""
echo "1. Review the changes above"
echo "2. Commit the changes:"
echo -e "   ${YELLOW}git commit -m \"chore: Remove node_modules from git tracking\"${NC}"
echo ""
echo "3. Push to remote:"
echo -e "   ${YELLOW}git push origin main${NC}"
echo ""
echo "4. Verify it worked:"
echo -e "   ${YELLOW}git check-ignore Android/admin-web/node_modules${NC}"
echo -e "   ${YELLOW}git check-ignore Android/backend/node_modules${NC}"
echo ""

# Show before/after comparison
echo "=================================================="
echo "📊 Repository Impact:"
echo "=================================================="
echo ""
echo "Before cleanup:"
echo "  - Tracked files: $(git ls-files | wc -l)"
echo ""
echo "After cleanup (estimated):"
ESTIMATED=$(git ls-files | grep -v "node_modules/" | wc -l || echo "N/A")
echo "  - Tracked files: $ESTIMATED"
echo ""
echo "Reduction: ~$FILE_COUNT files removed from git"
echo ""

echo -e "${GREEN}✅ Your local node_modules folders are still intact!${NC}"
echo -e "${GREEN}✅ They just won't be tracked by git anymore.${NC}"
echo ""
echo "=================================================="
echo "🎉 Ready to commit!"
echo "=================================================="
