#!/bin/bash

echo "🚀 Starting DiskDominator Development Environment"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}[CHECK]${NC} Verifying prerequisites..."

if ! command_exists node; then
    echo -e "${RED}[ERROR]${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command_exists cargo; then
    echo -e "${YELLOW}[WARNING]${NC} Rust not installed. Installing..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Check for system dependencies
if command_exists apt-get; then
    echo -e "${YELLOW}[INFO]${NC} For full Tauri support, you may need to install:"
    echo "  sudo apt-get install libwebkit2gtk-4.0-dev libgtk-3-dev libayatana-appindicator3-dev"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}[INSTALL]${NC} Installing Node.js dependencies..."
    npm install
fi

# Development mode selection
echo ""
echo "Select development mode:"
echo "1) Frontend only (Next.js)"
echo "2) Backend only (Rust/Cargo watch)"
echo "3) Full application (Tauri)"
echo "4) Run tests"
echo "5) Build production"
read -p "Choice (1-5): " choice

case $choice in
    1)
        echo -e "${GREEN}[START]${NC} Starting Next.js development server..."
        npm run dev
        ;;
    2)
        echo -e "${GREEN}[START]${NC} Starting Rust development (cargo watch)..."
        if ! command_exists cargo-watch; then
            echo -e "${BLUE}[INSTALL]${NC} Installing cargo-watch..."
            cargo install cargo-watch
        fi
        cargo watch -x check -x test
        ;;
    3)
        echo -e "${GREEN}[START]${NC} Starting Tauri development..."
        npm run tauri:dev
        ;;
    4)
        echo -e "${GREEN}[TEST]${NC} Running tests..."
        echo "Running Rust tests..."
        cargo test --workspace
        echo "Running frontend tests..."
        npm test
        ;;
    5)
        echo -e "${GREEN}[BUILD]${NC} Building for production..."
        npm run tauri:build
        ;;
    *)
        echo -e "${RED}[ERROR]${NC} Invalid choice"
        exit 1
        ;;
esac