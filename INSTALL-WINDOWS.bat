@echo off
echo ========================================
echo    DiskDominator - Windows Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed
echo.

REM Remove existing node_modules if corrupted
if exist node_modules (
    echo Removing existing node_modules...
    rmdir /s /q node_modules
)

echo Installing dependencies...
echo This may take a few minutes...
echo.

npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo    Installation Complete!
    echo ========================================
    echo.
    echo You can now run DiskDominator-Final.hta
    echo.
) else (
    echo.
    echo [ERROR] Installation failed!
    echo Please check the error messages above.
    echo.
)

pause