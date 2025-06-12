# Tauri Build Quick Reference (Windows)

## 🚀 Quick Start
```powershell
# One command to build
.\BUILD-TAURI-WINDOWS.bat
```

## ✅ Prerequisites Checklist

### Required Software
- [ ] **Node.js LTS** - https://nodejs.org/
- [ ] **Rust + Cargo** - https://rustup.rs/ (choose MSVC toolchain)
- [ ] **VS Build Tools 2022** - https://visualstudio.microsoft.com/downloads/
  - C++ build tools
  - Windows 10 SDK
- [ ] **WebView2** - Usually pre-installed on Windows 10/11

### Quick Verification
```powershell
node --version      # Should show v18+ or v20+
rustc --version     # Should show 1.70+
cargo --version     # Should be installed with Rust
rustup show         # Should show -msvc toolchain
```

## 🔧 Common Fixes

### "Build failed" → Missing Visual Studio
```powershell
# Download and install Build Tools, then:
rustup default stable-msvc
```

### "Consecutive build fails" → Clean build
```powershell
cargo clean
npm run tauri build
```

### "WebView2 not found" → Install manually
Download from: https://developer.microsoft.com/microsoft-edge/webview2/

### "Wrong toolchain" → Switch to MSVC
```powershell
rustup default stable-x86_64-pc-windows-msvc
```

## 📁 Output Locations
- **Executable**: `src-tauri\target\release\DiskDominator.exe`
- **MSI Installer**: `src-tauri\target\release\bundle\msi\`
- **Logs**: `src-tauri\target\release\build\`

## 🆘 Still Having Issues?
1. Read full guide: `docs\development\WINDOWS-BUILD-INSTRUCTIONS-2025.md`
2. Enable debug: `set RUST_BACKTRACE=1`
3. Check Tauri Discord: https://discord.com/invite/tauri

## 📊 Current Version
- **DiskDominator uses**: Tauri v1
- **Latest available**: Tauri v2 (see upgrade guide in docs)