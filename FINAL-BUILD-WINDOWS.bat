@echo off
echo ===============================================
echo    DiskDominator - Final Build Process
echo ===============================================
echo.
echo This will attempt to build DiskDominator with all fixes applied.
echo.
echo Step 1: Testing Next.js build...
echo --------------------------------

call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Next.js build failed. Checking common issues...
    echo.
    echo Common fixes:
    echo 1. Make sure all dependencies are installed: npm install
    echo 2. Clear cache: npm cache clean --force
    echo 3. Delete node_modules and reinstall: rm -rf node_modules && npm install
    echo.
    pause
    exit /b 1
)

echo.
echo [✓] Next.js build successful!
echo.
echo Step 2: Building Tauri application...
echo -------------------------------------

call npx tauri build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================
    echo    ✅ BUILD COMPLETE!
    echo ===============================================
    echo.
    echo Your application is ready at:
    echo.
    echo 📁 Executable: src-tauri\target\release\DiskDominator.exe
    echo 📦 Installer: src-tauri\target\release\bundle\msi\
    echo.
    echo You can now run DiskDominator.exe directly!
    echo.
) else (
    echo.
    echo [!] Tauri build failed.
    echo.
    echo Possible issues:
    echo - Missing Rust toolchain (install from rustup.rs)
    echo - Missing Visual Studio Build Tools
    echo - WebView2 not installed
    echo.
    echo Run with verbose output:
    echo npx tauri build --verbose
)

pause