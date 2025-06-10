@echo off
setlocal EnableDelayedExpansion

echo.
echo ===============================================
echo            DiskDominator v1.0
echo          Disk Space Management Suite
echo ===============================================
echo.

:: Check if running from WSL path
set "CURRENT_DIR=%~dp0"
if "!CURRENT_DIR:~0,2!"=="\\" (
    echo [ERROR] Running from WSL network path: !CURRENT_DIR!
    echo.
    echo Please copy DiskDominator to a local Windows directory.
    echo For example: C:\Programs\DiskDominator\
    echo.
    pause
    exit /b 1
)

:: Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Starting DiskDominator...
echo.

:: Navigate to the application directory
cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: Check if we have a built version
if exist "dist\index.html" (
    echo [INFO] Starting production build...
    :: Start a simple HTTP server for the built version
    npx http-server dist -p 3002 -o
) else (
    :: Start development server
    echo [INFO] Starting development server...
    echo [INFO] The application will open in your default browser.
    echo.
    echo Press Ctrl+C to stop the server.
    echo.
    
    :: Start the dev server
    call npm run dev
)

pause