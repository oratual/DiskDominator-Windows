@echo off
echo ===============================================
echo    DiskDominator - Tauri Desktop App Build
echo ===============================================
echo    Updated for 2025 - Tauri v1/v2 Support
echo ===============================================
echo.

REM Check requirements
echo Checking build requirements...
echo.

REM Check Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install from: https://nodejs.org/
    echo Recommended: LTS version
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js %%i installed

REM Check Rust
echo [2/5] Checking Rust toolchain...
rustc --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Rust is not installed!
    echo Please install from: https://rustup.rs/
    echo IMPORTANT: Select MSVC toolchain during installation
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('rustc --version') do echo [OK] %%i installed

REM Check Cargo
cargo --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Cargo is not found!
    echo Please ensure Rust is properly installed
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('cargo --version') do echo [OK] %%i installed

REM Check for MSVC toolchain
echo [3/5] Checking for MSVC toolchain...
rustup show | findstr /C:"msvc" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MSVC toolchain not detected!
    echo Run: rustup default stable-msvc
    echo.
)

REM Check Visual Studio Build Tools hint
echo [4/5] Checking for build tools...
where cl >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Visual Studio Build Tools might not be installed
    echo If build fails, install from:
    echo https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
    echo Required: C++ build tools and Windows 10 SDK
    echo.
) else (
    echo [OK] C++ compiler found
)

REM Check if we're in the right directory
echo [5/5] Checking project directory...
if not exist "package.json" (
    echo [ERROR] Not in DiskDominator directory!
    echo Please run this from the DiskDominator root folder
    pause
    exit /b 1
)
if not exist "src-tauri" (
    echo [ERROR] src-tauri directory not found!
    echo This doesn't appear to be a Tauri project
    pause
    exit /b 1
)
echo [OK] In correct directory

echo.
echo ===============================================
echo    Pre-build Setup
echo ===============================================
echo.

REM Check for WebView2
echo Checking WebView2 runtime...
reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] WebView2 runtime might not be installed
    echo Download from: https://developer.microsoft.com/microsoft-edge/webview2/
    echo.
)

REM Install dependencies
echo Installing Node.js dependencies...
if not exist node_modules (
    echo Running: npm install
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies already installed
)

echo.
echo ===============================================
echo    Building Tauri Application
echo ===============================================
echo.
echo Target: Native Windows executable
echo Mode: Release build with optimizations
echo.

REM Set environment variables for better debugging
set RUST_BACKTRACE=1

REM Build the Tauri app
echo Running: npm run tauri build
npm run tauri build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================
    echo    ✓ Build Complete!
    echo ===============================================
    echo.
    echo Outputs:
    echo.
    echo [1] Executable:
    echo     src-tauri\target\release\DiskDominator.exe
    echo.
    echo [2] Installers (if configured):
    echo     - MSI: src-tauri\target\release\bundle\msi\
    echo     - NSIS: src-tauri\target\release\bundle\nsis\
    echo.
    echo [3] Build logs:
    echo     src-tauri\target\release\build\
    echo.
    echo To run the app directly:
    echo     src-tauri\target\release\DiskDominator.exe
    echo.
) else (
    echo.
    echo ===============================================
    echo    ✗ Build Failed!
    echo ===============================================
    echo.
    echo Troubleshooting steps:
    echo.
    echo 1. Visual Studio Build Tools
    echo    - Install from: https://visualstudio.microsoft.com/downloads/
    echo    - Required: C++ build tools, Windows 10 SDK
    echo.
    echo 2. WebView2 Runtime
    echo    - Check Windows version: Run 'winver' (needs 1803+)
    echo    - Install: https://developer.microsoft.com/microsoft-edge/webview2/
    echo.
    echo 3. Rust Toolchain
    echo    - Update: rustup update
    echo    - Set MSVC: rustup default stable-msvc
    echo    - Add targets: rustup target add x86_64-pc-windows-msvc
    echo.
    echo 4. Clean Build
    echo    - Run: cargo clean
    echo    - Delete: node_modules and package-lock.json
    echo    - Retry build
    echo.
    echo 5. Check Logs
    echo    - Enable verbose: set RUST_LOG=debug
    echo    - See: src-tauri\target\debug\
    echo.
    echo For detailed instructions:
    echo docs\development\WINDOWS-BUILD-INSTRUCTIONS-2025.md
    echo.
    echo Tauri v1 docs: https://v1.tauri.app/
    echo Tauri v2 docs: https://v2.tauri.app/
)

echo.
echo Press any key to exit...
pause >nul