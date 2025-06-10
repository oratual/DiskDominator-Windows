#!/bin/bash

echo "🧪 Testing DiskDominator Core Modules"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load Rust environment
source "$HOME/.cargo/env"

echo -e "${BLUE}[TEST]${NC} Compiling core modules..."

# Test each module individually
modules=("logger_module" "auth_module" "i18n_module" "ai_module" "update_module")

for module in "${modules[@]}"; do
    echo -e "${YELLOW}[BUILD]${NC} Building $module..."
    if cargo build -p $module 2>/dev/null; then
        echo -e "${GREEN}[✓]${NC} $module compiled successfully"
    else
        echo -e "${RED}[✗]${NC} $module failed to compile"
    fi
done

# Run tests
echo -e "${BLUE}[TEST]${NC} Running module tests..."
cargo test -p logger_module -p auth_module -p i18n_module -p ai_module -p update_module

echo -e "${GREEN}[DONE]${NC} Module testing complete!"