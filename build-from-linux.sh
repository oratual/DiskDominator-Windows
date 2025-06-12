#!/bin/bash
echo "========================================="
echo "   Building DiskDominator for Windows"
echo "   from Linux (Cross-compilation)"
echo "========================================="
echo

# Ensure we're in the right directory
cd /home/lauta/glados/DiskDominator

# Install Windows target if not already installed
echo "Checking Windows target..."
if ! rustup target list --installed | grep -q "x86_64-pc-windows-gnu"; then
    echo "Installing Windows GNU target..."
    rustup target add x86_64-pc-windows-gnu
fi

# Create simple Cargo.toml without workspace dependencies
echo "Creating simplified Cargo.toml..."
cat > src-tauri/Cargo.toml << 'EOF'
[package]
name = "disk-dominator"
version = "0.1.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "1", features = [] }

[dependencies]
tauri = { version = "1", features = ["fs-all", "path-all", "os-all", "shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
EOF

# Remove workspace Cargo.toml temporarily
if [ -f "Cargo.toml" ]; then
    mv Cargo.toml Cargo.toml.workspace-backup
fi

# Build for Windows
echo
echo "Building for Windows..."
npm run tauri build -- --target x86_64-pc-windows-gnu

# Restore original files
if [ -f "Cargo.toml.workspace-backup" ]; then
    mv Cargo.toml.workspace-backup Cargo.toml
fi

echo
echo "========================================="
echo "Build complete! Check src-tauri/target/"
echo "========================================="