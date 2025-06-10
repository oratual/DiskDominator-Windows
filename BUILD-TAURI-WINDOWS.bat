@echo off
echo ===============================================
echo    DiskDominator - Tauri Desktop App Build
echo ===============================================
echo.

REM Check requirements
echo Checking requirements...

REM Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js installed

REM Check Rust
rustc --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Rust is not installed!
    echo Please install from: https://rustup.rs/
    pause
    exit /b 1
)
echo [OK] Rust installed

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Not in DiskDominator directory!
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
if not exist node_modules (
    npm install
)

echo.
echo Building Tauri desktop application...
echo This will create a native Windows executable...
echo.

REM Build the Tauri app
npm run tauri build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================
    echo    Build Complete!
    echo ===============================================
    echo.
    echo Your executable is at:
    echo src-tauri\target\release\DiskDominator.exe
    echo.
    echo Installer (if created) is at:
    echo src-tauri\target\release\bundle\msi\
    echo.
) else (
    echo.
    echo [ERROR] Build failed!
    echo.
    echo Common issues:
    echo - Missing Visual Studio Build Tools
    echo - Missing WebView2 runtime
    echo - Missing Rust targets
    echo.
    echo See: https://tauri.app/v1/guides/getting-started/prerequisites#windows
)

pause