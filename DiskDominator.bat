@echo off
setlocal enabledelayedexpansion

title DiskDominator - Intelligent Disk Management
cls

echo.
echo     ____  _     _    ____                  _             _             
echo    / __ \(_)___^| ^|__/ __ \____  ____ ___  (_)___  ____ _^| ^|_ ____  _____
echo   / / / / / ___/ //_/ / / / __ \/ __ `__ \/ / __ \/ __ `/ __/ __ \/ ___/
echo  / /_/ / (__  ) ,^< / /_/ / /_/ / / / / / / / / / / /_/ / /_/ /_/ / /    
echo /_____/_/____/_/^|_^|\____/\____/_/ /_/ /_/_/_/ /_/\__,_/\__/\____/_/     
echo.
echo                    Intelligent Disk Management Suite v0.1.0
echo ========================================================================
echo.

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0
echo Running from: %SCRIPT_DIR%
echo.

REM Check if we're in WSL path
if "%SCRIPT_DIR:~0,6%"=="\\wsl$" (
    echo Detected WSL path
) else if "%SCRIPT_DIR:~0,15%"=="\\wsl.localhost" (
    echo Detected WSL.localhost path
)

echo Checking requirements...
echo.

REM Check Node.js
echo [1/3] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo (Recommended: LTS version)
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo       [OK] Node.js %NODE_VERSION% found
echo.

REM Check npm
echo [2/3] Checking npm...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: npm is not installed!
    echo Please reinstall Node.js
    echo.
    pause
    exit /b 1
)
echo       [OK] npm found
echo.

REM Check if package.json exists
echo [3/3] Checking project files...
if not exist "%SCRIPT_DIR%package.json" (
    echo.
    echo ERROR: package.json not found!
    echo.
    echo This launcher must be in the DiskDominator directory.
    echo Looking for: %SCRIPT_DIR%package.json
    echo.
    pause
    exit /b 1
)
echo       [OK] package.json found
echo.

REM Check dependencies
if not exist "%SCRIPT_DIR%node_modules" (
    echo Installing dependencies (this may take a few minutes)...
    cd /d "%SCRIPT_DIR%"
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo       [OK] Dependencies already installed
)

echo.
echo ========================================================================
echo.

REM Check if server is already running
curl -s http://localhost:3002 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo DiskDominator is already running!
    echo Opening in browser...
    start http://localhost:3002
    timeout /t 3 /nobreak >nul
    exit /b 0
)

echo Starting DiskDominator server...
echo.
echo The application will open in your default browser in a few seconds.
echo If it doesn't open automatically, navigate to: http://localhost:3002
echo.
echo Press Ctrl+C to stop the server.
echo.
echo ========================================================================
echo.

REM Open browser after delay
start /b cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3002"

REM Change to project directory and start
cd /d "%SCRIPT_DIR%"
call npm run dev