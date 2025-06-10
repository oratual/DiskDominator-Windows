#!/bin/bash

echo "🚀 Building DiskDominator for Windows..."
echo "========================================"

# Ensure we're using Rust
source "$HOME/.cargo/env"

# Build the frontend
echo "📦 Building frontend..."
npm run build

# Try to build with Tauri for Windows
echo "🔨 Attempting Tauri build for Windows..."

# Set the linker for Windows cross-compilation
export CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER=x86_64-w64-mingw32-gcc
export CC_x86_64_pc_windows_gnu=x86_64-w64-mingw32-gcc
export CXX_x86_64_pc_windows_gnu=x86_64-w64-mingw32-g++

# Try to build
npm run tauri build -- --target x86_64-pc-windows-gnu 2>&1 | tee build-log.txt

# Check if build succeeded
if [ -f "src-tauri/target/x86_64-pc-windows-gnu/release/DiskDominator.exe" ]; then
    echo "✅ Build successful!"
    echo "📁 Executable: src-tauri/target/x86_64-pc-windows-gnu/release/DiskDominator.exe"
    
    # Copy to build directory
    mkdir -p build
    cp src-tauri/target/x86_64-pc-windows-gnu/release/DiskDominator.exe build/
    echo "📁 Copied to: build/DiskDominator.exe"
else
    echo "⚠️ Tauri build failed. Creating alternative solution..."
    
    # Alternative: Create HTA application
    cat > build/DiskDominator.hta << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>DiskDominator</title>
    <HTA:APPLICATION
        ID="DiskDominator"
        APPLICATIONNAME="DiskDominator"
        BORDER="dialog"
        BORDERSTYLE="normal"
        CAPTION="yes"
        MAXIMIZEBUTTON="yes"
        MINIMIZEBUTTON="yes"
        SHOWINTASKBAR="yes"
        SINGLEINSTANCE="yes"
        SYSMENU="yes"
        VERSION="1.0"
        WINDOWSTATE="normal">
    
    <style>
        body { margin: 0; padding: 0; overflow: hidden; }
        iframe { width: 100%; height: 100vh; border: none; }
    </style>
</head>
<body>
    <iframe src="http://localhost:3002"></iframe>
    <script>
        window.resizeTo(1200, 800);
        window.moveTo((screen.width - 1200) / 2, (screen.height - 800) / 2);
        
        // Start the server
        var shell = new ActiveXObject("WScript.Shell");
        shell.Run("cmd /c npm run dev", 0, false);
    </script>
</body>
</html>
EOF

    echo "✅ Created HTA launcher: build/DiskDominator.hta"
fi

echo ""
echo "📋 Next steps:"
echo "1. Copy the build directory to Windows"
echo "2. Run DiskDominator.exe or DiskDominator.hta"
echo ""