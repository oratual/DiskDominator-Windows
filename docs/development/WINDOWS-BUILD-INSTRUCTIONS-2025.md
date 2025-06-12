# Windows Build Instructions for DiskDominator (2025)

## Current Status
DiskDominator currently uses **Tauri v1**. This guide provides instructions for both v1 (current) and v2 (upgrade path).

## Prerequisites for Windows Development

### Core Requirements (Both v1 and v2)

1. **Rust Toolchain**
   ```powershell
   # Install from https://rustup.rs/
   # During installation, select MSVC toolchain:
   # - x86_64-pc-windows-msvc (64-bit)
   # - i686-pc-windows-msvc (32-bit)
   # - aarch64-pc-windows-msvc (ARM64)
   
   # Verify installation
   rustc --version
   cargo --version
   ```

2. **Visual Studio Build Tools**
   - Download: [Build Tools for Visual Studio 2022](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
   - Required workloads:
     - ✅ C++ build tools
     - ✅ Windows 10/11 SDK
     - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
     - ✅ (Optional) MSVC v143 - VS 2022 C++ ARM64 build tools

3. **Microsoft Edge WebView2**
   - Windows 10 (1803+) and Windows 11: Pre-installed
   - Otherwise: Download [Evergreen Bootstrapper](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
   
4. **Node.js**
   - Download: [Node.js LTS](https://nodejs.org/)
   - Verify: `node --version` and `npm --version`

### Additional Targets (Cross-compilation)

```powershell
# 32-bit Windows
rustup target add i686-pc-windows-msvc

# ARM64 Windows
rustup target add aarch64-pc-windows-msvc
```

## Building DiskDominator (Tauri v1)

### Quick Build
```powershell
# From DiskDominator directory
.\BUILD-TAURI-WINDOWS.bat
```

### Manual Build Steps
```powershell
# 1. Install dependencies
npm install

# 2. Build the application
npm run tauri build

# Output locations:
# - Executable: src-tauri\target\release\DiskDominator.exe
# - Installer: src-tauri\target\release\bundle\msi\
```

## Common Build Issues and Solutions

### Issue 1: Missing Visual Studio Components
**Error**: `error: Microsoft Visual C++ 14.0 or greater is required`

**Solution**:
```powershell
# Install Visual Studio Build Tools with required components
# Or use Visual Studio Installer to modify existing installation
```

### Issue 2: WebView2 Not Found
**Error**: `WebView2 runtime not found`

**Solution**:
1. Check Windows version: `winver` (must be 1803+)
2. Install WebView2 manually from Microsoft

### Issue 3: Cargo Build Fails on Consecutive Builds
**Error**: `assertion failed: mtimes.insert(output.clone(), mtime).is_none()`

**Solution**:
```powershell
cargo clean
npm run tauri build
```

### Issue 4: Permission Errors
**Error**: `failed to read plugin permissions`

**Solution**:
- Ensure all plugin permission files exist
- Check `src-tauri/capabilities/` directory

### Issue 5: Feature Flag Errors (v1 specific)
**Note**: The `custom-protocol` feature in Cargo.toml is deprecated in v2

**Current v1 usage**:
```toml
[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

## Upgrading to Tauri v2

### Key Changes
1. **Permission System**: New capability-based permissions
2. **Plugin System**: Many APIs moved to plugins
3. **Mobile Support**: iOS and Android targets
4. **Swift/Kotlin**: Native plugin development

### Migration Steps
```powershell
# 1. Update Cargo.toml
# Change: tauri = { version = "1", ... }
# To: tauri = { version = "2", ... }

# 2. Update tauri.conf.json
# - Remove deprecated allowlist
# - Add new permission configuration

# 3. Install Tauri CLI v2
npm install --save-dev @tauri-apps/cli@next

# 4. Run migration
npx @tauri-apps/cli migrate
```

### Tauri v2 Build Process
```powershell
# Same as v1, but with updated dependencies
npm run tauri build

# New v2 features:
# - Better error messages
# - Faster builds
# - Smaller bundle sizes
```

## Development Tips

### Environment Variables
```powershell
# Enable detailed logging
$env:RUST_BACKTRACE = "1"
$env:TAURI_LOG = "debug"
```

### Build Optimization
```powershell
# Release build with optimizations
cargo build --release

# Strip debug symbols (smaller exe)
cargo build --release --features strip
```

### Debugging Build Issues
1. **Check all prerequisites**: `npm run tauri info`
2. **Clean build**: `cargo clean && npm run build`
3. **Update dependencies**: `cargo update && npm update`
4. **Check Rust toolchain**: `rustup update && rustup default stable-msvc`

## Alternative Build Methods

### Using WSL2 (Cross-compilation)
```bash
# Not recommended due to compatibility issues
# Use native Windows build instead
```

### Using GitHub Actions
```yaml
# .github/workflows/build.yml
- uses: tauri-apps/tauri-action@v0
  with:
    tagName: v__VERSION__
    releaseName: 'DiskDominator v__VERSION__'
```

## Resources

- **Tauri v1 Docs**: https://v1.tauri.app/
- **Tauri v2 Docs**: https://v2.tauri.app/
- **Rust Windows**: https://rust-lang.github.io/rustup/installation/windows.html
- **WebView2**: https://developer.microsoft.com/microsoft-edge/webview2/

## Support

For build issues:
1. Check Tauri Discord: https://discord.com/invite/tauri
2. GitHub Issues: https://github.com/tauri-apps/tauri/issues
3. Stack Overflow: Tag with `tauri`

---

Last updated: January 2025