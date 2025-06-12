# DiskDominator Build Instructions

## Prerequisites
- Node.js 20+
- Rust 1.70+
- Windows Build Tools (for Windows target)

## Quick Build

### Development
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# For Tauri development
cd src-tauri
cargo tauri dev
```

### Production Build
```bash
# Build for Windows (from WSL/Linux)
cd src-tauri
cargo build --release --target x86_64-pc-windows-gnu

# The executable will be at:
# src-tauri/target/x86_64-pc-windows-gnu/release/disk-dominator.exe
```

## Clean Build
```bash
# Remove all build artifacts
rm -rf target src-tauri/target .next out node_modules

# Fresh install and build
npm install
cd src-tauri
cargo build --release --target x86_64-pc-windows-gnu
```

## Notes
- The project uses a monorepo structure with shared packages in `suite-core/`
- Windows is the primary target platform
- All archived build scripts are in `.archive/build-scripts/`