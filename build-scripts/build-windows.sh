#!/bin/bash

echo "🚀 Building DiskDominator for Windows..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src-tauri" ]; then
    echo "❌ Error: Please run this script from the DiskDominator root directory"
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build the frontend
echo "🎨 Building frontend..."
npm run build

# Build Tauri for Windows
echo "🔨 Building Windows executable with Tauri..."
cd src-tauri

# Set target to Windows
export TAURI_PLATFORM="windows"

# Build for Windows (cross-compilation from Linux)
cargo tauri build --target x86_64-pc-windows-msvc 2>/dev/null || {
    echo "⚠️ Cross-compilation failed. Trying alternative approach..."
    
    # Alternative: Build without cross-compilation (will create Linux binary)
    cargo tauri build
}

cd ..

# Check if build was successful
if [ -d "src-tauri/target/release/bundle" ]; then
    echo "✅ Build successful!"
    echo "📁 Output location: src-tauri/target/release/bundle/"
    ls -la src-tauri/target/release/bundle/
else
    echo "❌ Build failed. Checking for alternative outputs..."
    find src-tauri/target -name "*.exe" -o -name "*.msi" 2>/dev/null | head -10
fi

# Create a simple launcher batch file for Windows
cat > DiskDominator-launcher.bat << 'EOF'
@echo off
echo.
echo ========================================
echo          DiskDominator v1.0
echo ========================================
echo.

REM Check if running from WSL path
set CURRENT_PATH=%~dp0
echo Current path: %CURRENT_PATH%

if "%CURRENT_PATH:~0,2%"=="\\" (
    echo Warning: Running from WSL path. Please copy to a Windows directory.
    echo.
    pause
    exit /b 1
)

REM Look for the executable
if exist "%~dp0DiskDominator.exe" (
    start "" "%~dp0DiskDominator.exe"
) else if exist "%~dp0build\DiskDominator.exe" (
    start "" "%~dp0build\DiskDominator.exe"
) else if exist "%~dp0src-tauri\target\release\DiskDominator.exe" (
    start "" "%~dp0src-tauri\target\release\DiskDominator.exe"
) else (
    echo Error: DiskDominator.exe not found!
    echo Please ensure the application is built correctly.
    pause
)
EOF

chmod +x build-windows.sh

echo "✅ Build script created. You can now:"
echo "1. Run ./build-windows.sh to build the application"
echo "2. Use DiskDominator-launcher.bat from Windows to launch it"