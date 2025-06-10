#!/bin/bash

echo "🏗️ Building DiskDominator for Windows (Simplified)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Load Rust environment
source "$HOME/.cargo/env"

cd /home/lauta/glados/DiskDominator

echo -e "${BLUE}[SETUP]${NC} Creating temporary build configuration..."

# Create a simplified Cargo.toml for Windows build
cat > Cargo-windows.toml << 'EOF'
[package]
name = "disk-dominator"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "DiskDominator"
path = "src-windows/main.rs"

[dependencies]
# Core modules
logger_module = { path = "core-modules/logger-module" }
auth_module = { path = "core-modules/auth-module" }
i18n_module = { path = "core-modules/i18n-module" }
ai_module = { path = "core-modules/ai-module" }
update_module = { path = "core-modules/update-module" }

# Windows-specific
windows = { version = "0.48", features = ["Win32_Foundation", "Win32_UI_WindowsAndMessaging"] }
tokio = { version = "1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[profile.release]
opt-level = 3
lto = true
strip = true
EOF

echo -e "${BLUE}[CREATE]${NC} Creating Windows-specific main entry point..."

mkdir -p src-windows

cat > src-windows/main.rs << 'EOF'
use logger_module::LoggerModule;
use auth_module::{AuthModule, AuthConfig};
use i18n_module::I18nModule;
use ai_module::{AIModule, AIConfig};
use update_module::UpdateModule;

use std::process::Command;

fn main() {
    // Initialize logging
    LoggerModule::init("DiskDominator").expect("Failed to initialize logger");
    
    println!("🚀 DiskDominator v0.1.0");
    println!("================================");
    
    // Check if we should open the web UI
    let args: Vec<String> = std::env::args().collect();
    
    if args.len() > 1 && args[1] == "--version" {
        println!("DiskDominator 0.1.0");
        println!("Part of the DiskDominator Suite");
        return;
    }
    
    // Open the web UI in default browser
    println!("📋 Opening DiskDominator in your browser...");
    
    let url = "http://localhost:3002";
    
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(&["/C", "start", url])
            .spawn()
            .expect("Failed to open browser");
    }
    
    println!("✨ DiskDominator is running at {}", url);
    println!("   Press Ctrl+C to stop");
    
    // Keep the process running
    loop {
        std::thread::sleep(std::time::Duration::from_secs(60));
    }
}
EOF

echo -e "${BLUE}[BUILD]${NC} Building Windows executable..."

# Build for Windows
export DATABASE_URL="sqlite:./cache.db"

if cargo build --manifest-path Cargo-windows.toml --target x86_64-pc-windows-gnu --release; then
    echo -e "${GREEN}[SUCCESS]${NC} Build successful!"
    
    # Create output directory
    mkdir -p build/windows
    
    # Copy executable
    cp target/x86_64-pc-windows-gnu/release/DiskDominator.exe build/windows/
    
    echo -e "${GREEN}[OUTPUT]${NC} Executable created:"
    echo "  └─ build/windows/DiskDominator.exe"
    
    # Create a simple batch file to run the app
    cat > build/windows/DiskDominator.bat << 'EOF'
@echo off
echo Starting DiskDominator...
start /B DiskDominator.exe
start http://localhost:3002
EOF
    
    echo -e "${GREEN}[OUTPUT]${NC} Batch launcher created:"
    echo "  └─ build/windows/DiskDominator.bat"
    
else
    echo -e "${RED}[ERROR]${NC} Build failed!"
    exit 1
fi

# Clean up
rm -f Cargo-windows.toml

echo -e "${BLUE}[DONE]${NC} Windows build complete!"
echo ""
echo "To create an installer, use a tool like NSIS or Inno Setup with the exe in build/windows/"