@echo off
echo ===============================================
echo     DiskDominator - Desktop Application
echo ===============================================
echo.

REM Check if in correct directory
if not exist "package.json" (
    echo [ERROR] Not in DiskDominator directory!
    pause
    exit /b 1
)

echo Starting DiskDominator in Tauri mode...
echo.

REM Run Tauri development mode
npm run tauri:dev

pause