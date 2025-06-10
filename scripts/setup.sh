#!/bin/bash

echo "🚀 Setting up DiskDominator Suite Development Environment"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running in correct directory
if [ ! -f "package.json" ] || [ ! -f "Cargo.toml" ]; then
    print_error "Please run this script from the DiskDominator root directory"
    exit 1
fi

# Install system dependencies
print_status "Installing system dependencies..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y \
        libwebkit2gtk-4.0-dev \
        build-essential \
        curl \
        wget \
        file \
        libssl-dev \
        libgtk-3-dev \
        libayatana-appindicator3-dev \
        librsvg2-dev
else
    print_warning "Not on Ubuntu/Debian. Please install WebKit2GTK and GTK3 manually."
fi

# Install Rust if not already installed
if ! command -v cargo &> /dev/null; then
    print_status "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
else
    print_status "Rust already installed"
fi

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

# Install Tauri CLI
print_status "Installing Tauri CLI..."
npm install -D @tauri-apps/cli

# Build Rust modules
print_status "Building Rust modules..."
cargo build --release

# Create necessary directories
print_status "Creating directories..."
mkdir -p src-tauri/icons
mkdir -p core-modules

# Generate icons (placeholder for now)
print_status "Creating placeholder icons..."
for size in 32 128; do
    convert -size ${size}x${size} xc:blue -fill white -gravity center \
        -pointsize $((size/4)) -annotate +0+0 'DD' \
        src-tauri/icons/${size}x${size}.png 2>/dev/null || \
    echo "DD" > src-tauri/icons/${size}x${size}.png
done

# Create icon files for different platforms
cp src-tauri/icons/128x128.png src-tauri/icons/128x128@2x.png 2>/dev/null || true
cp src-tauri/icons/128x128.png src-tauri/icons/icon.png 2>/dev/null || true

# Windows icon (would need proper conversion tool)
touch src-tauri/icons/icon.ico

# macOS icon (would need proper conversion tool)
touch src-tauri/icons/icon.icns

print_status "Setup complete!"
echo ""
echo "You can now run:"
echo "  npm run tauri:dev    - Start development server"
echo "  npm run tauri:build  - Build production app"
echo ""
print_warning "Note: Icons are placeholders. Replace them with proper icons before release."