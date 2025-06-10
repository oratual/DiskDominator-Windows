#!/bin/bash

echo "🚀 Building DiskDominator for Windows"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Load Rust environment
source "$HOME/.cargo/env"

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ]; then
    echo -e "${RED}[ERROR]${NC} Not in DiskDominator directory!"
    exit 1
fi

echo -e "${BLUE}[BUILD]${NC} Preparing Windows build..."

# Install Windows target if not already installed
echo -e "${YELLOW}[SETUP]${NC} Ensuring Windows target is installed..."
rustup target add x86_64-pc-windows-gnu 2>/dev/null || true

# Build frontend first
echo -e "${BLUE}[BUILD]${NC} Building frontend..."
npm run build

# Try to build with Tauri
echo -e "${BLUE}[BUILD]${NC} Building Tauri application for Windows..."

# Set DATABASE_URL for storage module
export DATABASE_URL="sqlite:./cache.db"

# Build for Windows
if cargo tauri build --target x86_64-pc-windows-gnu; then
    echo -e "${GREEN}[SUCCESS]${NC} Windows build complete!"
    echo -e "${GREEN}[OUTPUT]${NC} Executable location:"
    echo "  └─ src-tauri/target/x86_64-pc-windows-gnu/release/DiskDominator.exe"
    echo -e "${GREEN}[OUTPUT]${NC} Installer location:"
    echo "  └─ src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/DiskDominator_0.1.0_x64-setup.exe"
else
    echo -e "${YELLOW}[WARNING]${NC} Tauri build failed, trying alternative approach..."
    
    # Alternative: Build core modules separately
    echo -e "${BLUE}[BUILD]${NC} Building core modules..."
    
    modules=("logger_module" "auth_module" "i18n_module" "ai_module" "update_module")
    
    for module in "${modules[@]}"; do
        echo -e "${YELLOW}[BUILD]${NC} Building $module for Windows..."
        if cargo build -p $module --target x86_64-pc-windows-gnu --release; then
            echo -e "${GREEN}[✓]${NC} $module built successfully"
        else
            echo -e "${RED}[✗]${NC} $module failed to build"
        fi
    done
    
    echo -e "${YELLOW}[INFO]${NC} Core modules built. Full Tauri build requires resolving system dependencies."
fi

echo -e "${BLUE}[DONE]${NC} Build process complete!"