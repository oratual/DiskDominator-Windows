#!/bin/bash

echo "🧹 Cleaning up DiskDominator project"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Clean Rust build artifacts
if [ -d "target" ]; then
    print_status "Cleaning Rust build artifacts..."
    rm -rf target
fi

# Clean node_modules if requested
read -p "Remove node_modules? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Removing node_modules..."
    rm -rf node_modules
fi

# Clean Next.js build artifacts
if [ -d ".next" ]; then
    print_status "Cleaning Next.js build..."
    rm -rf .next
fi

# Clean temporary files
print_status "Removing temporary files..."
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete
rm -f npm-debug.log*
rm -f yarn-debug.log*
rm -f yarn-error.log*

# Clean test artifacts
if [ -d "coverage" ]; then
    print_status "Removing test coverage..."
    rm -rf coverage
fi

# Clean cache directories
if [ -d ".cache" ]; then
    print_status "Removing cache..."
    rm -rf .cache
fi

# Remove the example dev.log if it exists
if [ -f "dev.log" ]; then
    rm -f dev.log
fi

# Summary
echo ""
print_status "Cleanup complete!"
echo ""
echo "Project size before cleanup: $(du -sh . 2>/dev/null | cut -f1)"
echo ""
echo "To reinstall dependencies, run:"
echo "  npm install"
echo "  cargo build"